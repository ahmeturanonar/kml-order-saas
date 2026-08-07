"use server";

import {
  CreditSource,
  CreditTransactionType,
  NotificationType,
  OrderStatus,
  Role,
  UserStatus,
} from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { recordAuditLog } from "@/lib/audit";
import { applyCreditTransaction } from "@/lib/credits";
import { adminCreditEmailTemplate, orderEmailTemplate } from "@/lib/email-templates";
import { logger } from "@/lib/logger";
import { createNotification } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
import { assertSameOriginRequest } from "@/lib/request";
import { requireAdmin } from "@/lib/session";
import { APP_SETTING_KEYS } from "@/lib/settings";
import { deleteStoredFile } from "@/lib/storage";

const creditAdjustmentSchema = z.object({
  userId: z.string().min(1),
  amount: z.coerce.number().int().refine((value) => value !== 0, "Tutar sıfır olamaz."),
  reason: z.string().trim().min(3).max(200),
});

const updateUserSchema = z.object({
  userId: z.string().min(1),
  name: z.string().trim().min(2).max(120),
  email: z.string().email(),
});

const userStatusSchema = z.object({
  userId: z.string().min(1),
  status: z.nativeEnum(UserStatus),
});

const orderNoteSchema = z.object({
  orderId: z.string().min(1),
  body: z.string().trim().min(2).max(2000),
});

const settingSchema = z.object({
  price: z.coerce.number().int().positive().max(100000),
});

function revalidateAdminPages() {
  revalidatePath("/admin");
  revalidatePath("/admin/orders");
  revalidatePath("/admin/users");
  revalidatePath("/admin/payments");
  revalidatePath("/admin/credits");
  revalidatePath("/admin/settings");
  revalidatePath("/admin/audit");
}

function revalidateCustomerPages() {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/orders");
  revalidatePath("/dashboard/payments");
  revalidatePath("/dashboard/notifications");
  revalidatePath("/dashboard/credits");
}

async function getAdminSession() {
  const session = await requireAdmin();
  if (session.user.role !== Role.ADMIN) {
    throw new Error("Yönetici erişimi gerekli.");
  }

  return session;
}

function getOrderStatusMessage(status: OrderStatus, orderNumber: string) {
  switch (status) {
    case OrderStatus.DOWNLOADED:
      return {
        title: `${orderNumber} numaralı sipariş indirildi`,
        message: `${orderNumber} numaralı siparişiniz masaüstü aracısı tarafından indirildi ve manuel işleme sırasına alındı.`,
      };
    case OrderStatus.PROCESSING:
      return {
        title: `${orderNumber} numaralı sipariş işleniyor`,
        message: `${orderNumber} numaralı siparişiniz için manuel işlem başladı.`,
      };
    case OrderStatus.COMPLETED:
      return {
        title: `${orderNumber} numaralı sipariş tamamlandı`,
        message: `${orderNumber} numaralı siparişiniz tamamlandı.`,
      };
    case OrderStatus.CANCELLED:
      return {
        title: `${orderNumber} numaralı sipariş iptal edildi`,
        message: `${orderNumber} numaralı siparişiniz iptal edildi.`,
      };
    default:
      return {
        title: `${orderNumber} numaralı sipariş güncellendi`,
        message: `${orderNumber} numaralı siparişinizin durumu ${status} olarak güncellendi.`,
      };
  }
}

export async function updateOrderStatusAction(formData: FormData) {
  await assertSameOriginRequest();
  const session = await getAdminSession();

  const orderId = String(formData.get("orderId") ?? "");
  const status = String(formData.get("status") ?? "") as OrderStatus;
  const note = String(formData.get("note") ?? "").trim();

  if (!orderId || !Object.values(OrderStatus).includes(status)) {
    throw new Error("Invalid order status request.");
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { user: true },
  });

  if (!order) {
    throw new Error("Sipariş bulunamadı.");
  }

  const updated = await prisma.$transaction(async (tx) => {
    const updatedOrder = await tx.order.update({
      where: { id: orderId },
      data: {
        status,
        downloadedAt:
          status === OrderStatus.DOWNLOADED ? order.downloadedAt ?? new Date() : order.downloadedAt,
        completedAt: status === OrderStatus.COMPLETED ? new Date() : null,
        cancelledAt: status === OrderStatus.CANCELLED ? new Date() : null,
      },
    });

    await tx.orderStatusHistory.create({
      data: {
        orderId,
        fromStatus: order.status,
        toStatus: status,
        note: note || null,
        changedByUserId: session.user.id,
      },
    });

    if (note) {
      await tx.orderNote.create({
        data: {
          orderId,
          body: note,
          authorUserId: session.user.id,
        },
      });
    }

    await recordAuditLog(tx, {
      actorUserId: session.user.id,
      action: "ORDER_STATUS_CHANGED",
      targetType: "ORDER",
      targetId: order.id,
      targetLabel: order.orderNumber,
      metadata: {
        fromStatus: order.status,
        toStatus: status,
        note,
      },
    });

    return updatedOrder;
  });

  const copy = getOrderStatusMessage(status, updated.orderNumber);
  const emailTemplate = orderEmailTemplate({
    title: copy.title,
    message: copy.message,
    orderNumber: updated.orderNumber,
  });

  await createNotification({
    userId: order.userId,
    email: order.user.email,
    type: NotificationType.ORDER_STATUS,
    title: copy.title,
    message: copy.message,
    emailSubject: emailTemplate.subject,
    emailHtml: emailTemplate.html,
    linkPath: "/dashboard/orders",
  });

  revalidateAdminPages();
  revalidateCustomerPages();
}

export async function deleteInvalidUploadAction(formData: FormData) {
  await assertSameOriginRequest();
  const session = await getAdminSession();

  const orderId = String(formData.get("orderId") ?? "");
  if (!orderId) {
    throw new Error("Sipariş kimliği gereklidir.");
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      uploadedFile: true,
      user: true,
    },
  });

  if (!order || !order.uploadedFile) {
    throw new Error("Yüklenen sipariş bulunamadı.");
  }

  await prisma.$transaction(async (tx) => {
    const adjusted = await applyCreditTransaction(tx, {
      userId: order.userId,
      amount: order.creditCharged,
      type: CreditTransactionType.REFUND,
        description: `Silinen ${order.orderNumber} numaralı sipariş için iade`,
      orderId: order.id,
      sourceType: CreditSource.ADMIN,
      sourceUserId: session.user.id,
    });

    await tx.orderStatusHistory.create({
      data: {
        orderId: order.id,
        fromStatus: order.status,
        toStatus: OrderStatus.CANCELLED,
        note: "Sipariş yönetici tarafından silindi ve krediler iade edildi.",
        changedByUserId: session.user.id,
      },
    });

    await tx.uploadedFile.delete({
      where: { orderId: order.id },
    });

    await tx.order.delete({
      where: { id: order.id },
    });

    await recordAuditLog(tx, {
      actorUserId: session.user.id,
      action: "ORDER_DELETED",
      targetType: "ORDER",
      targetId: order.id,
      targetLabel: order.orderNumber,
      metadata: {
        refunded: order.creditCharged,
        balanceAfter: adjusted.user.creditBalance,
      },
    });
  });

  try {
    await deleteStoredFile(order.uploadedFile.filePath);
  } catch (error) {
    logger.warn({ error, orderId }, "Failed to delete stored file after invalid upload removal.");
  }

  const emailTemplate = orderEmailTemplate({
      title: `Sipariş kaldırıldı: ${order.orderNumber}`,
      message: `${order.orderNumber} numaralı yüklemeniz yönetici tarafından kaldırıldı ve ${order.creditCharged} kredi iade edildi.`,
    orderNumber: order.orderNumber,
  });

  await createNotification({
    userId: order.userId,
    email: order.user.email,
    type: NotificationType.CREDIT,
    title: `Yükleme kaldırıldı: ${order.orderNumber}`,
    message: `${order.orderNumber} numaralı geçersiz yüklemeniz yönetici tarafından kaldırıldı ve ${order.creditCharged} kredi iade edildi.`,
    emailSubject: emailTemplate.subject,
    emailHtml: emailTemplate.html,
    linkPath: "/dashboard/orders",
  });

  revalidateAdminPages();
  revalidateCustomerPages();
}

export async function adjustUserCreditAction(formData: FormData) {
  await assertSameOriginRequest();
  const session = await getAdminSession();

  const parsed = creditAdjustmentSchema.safeParse({
    userId: formData.get("userId"),
    amount: formData.get("amount"),
    reason: formData.get("reason"),
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid credit change request.");
  }

  const targetUser = await prisma.user.findUnique({
    where: { id: parsed.data.userId },
    select: {
      id: true,
      name: true,
      email: true,
      creditBalance: true,
    },
  });

  if (!targetUser) {
    throw new Error("Kullanıcı bulunamadı.");
  }

  if (parsed.data.amount < 0 && targetUser.creditBalance + parsed.data.amount < 0) {
    throw new Error("Kredi bakiyesi sıfırın altına düşemez.");
  }

  const adminUser = await prisma.user.findUniqueOrThrow({
    where: { id: session.user.id },
    select: {
      name: true,
    },
  });

  const result = await prisma.$transaction(async (tx) => {
    const adjusted = await applyCreditTransaction(tx, {
      userId: parsed.data.userId,
      amount: parsed.data.amount,
      type: CreditTransactionType.ADJUSTMENT,
      description: parsed.data.reason,
      sourceType: CreditSource.ADMIN,
      sourceUserId: session.user.id,
    });

    await recordAuditLog(tx, {
      actorUserId: session.user.id,
      action: parsed.data.amount > 0 ? "CREDIT_ADDED" : "CREDIT_REMOVED",
      targetType: "USER",
      targetId: targetUser.id,
      targetLabel: targetUser.email,
      metadata: {
        amount: parsed.data.amount,
        reason: parsed.data.reason,
        balanceAfter: adjusted.user.creditBalance,
      },
    });

    return adjusted.user.creditBalance;
  });

  const emailTemplate = adminCreditEmailTemplate({
    amount: parsed.data.amount,
    balanceAfter: result,
    adminName: adminUser.name,
    reason: parsed.data.reason,
  });

  await createNotification({
    userId: targetUser.id,
    email: targetUser.email,
    type: NotificationType.CREDIT,
    title: parsed.data.amount > 0 ? "Credits added" : "Credits removed",
    message: `${parsed.data.amount > 0 ? "Added" : "Removed"} ${Math.abs(parsed.data.amount)} TL. Reason: ${parsed.data.reason}`,
    emailSubject: emailTemplate.subject,
    emailHtml: emailTemplate.html,
    linkPath: "/dashboard/credits",
  });

  revalidateAdminPages();
  revalidateCustomerPages();
}

export async function updateUserProfileAction(formData: FormData) {
  await assertSameOriginRequest();
  const session = await getAdminSession();

  const parsed = updateUserSchema.safeParse({
    userId: formData.get("userId"),
    name: formData.get("name"),
    email: formData.get("email"),
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid user update request.");
  }

  const existing = await prisma.user.findUnique({
    where: { id: parsed.data.userId },
    select: { id: true, email: true, name: true },
  });

  if (!existing) {
    throw new Error("Kullanıcı bulunamadı.");
  }

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: parsed.data.userId },
      data: {
        name: parsed.data.name,
        email: parsed.data.email.toLowerCase(),
      },
    });

    await recordAuditLog(tx, {
      actorUserId: session.user.id,
      action: "USER_UPDATED",
      targetType: "USER",
      targetId: existing.id,
      targetLabel: parsed.data.email.toLowerCase(),
      metadata: {
        previousName: existing.name,
        previousEmail: existing.email,
        nextName: parsed.data.name,
        nextEmail: parsed.data.email.toLowerCase(),
      },
    });
  });

  revalidateAdminPages();
}

export async function setUserStatusAction(formData: FormData) {
  await assertSameOriginRequest();
  const session = await getAdminSession();

  const parsed = userStatusSchema.safeParse({
    userId: formData.get("userId"),
    status: formData.get("status"),
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid user status request.");
  }

  const targetUser = await prisma.user.findUnique({
    where: { id: parsed.data.userId },
    select: {
      id: true,
      email: true,
      status: true,
    },
  });

  if (!targetUser) {
    throw new Error("Kullanıcı bulunamadı.");
  }

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: targetUser.id },
      data: {
        status: parsed.data.status,
        disabledAt: parsed.data.status === UserStatus.DISABLED ? new Date() : null,
      },
    });

    await recordAuditLog(tx, {
      actorUserId: session.user.id,
      action: parsed.data.status === UserStatus.DISABLED ? "USER_DISABLED" : "USER_ENABLED",
      targetType: "USER",
      targetId: targetUser.id,
      targetLabel: targetUser.email,
      metadata: {
        fromStatus: targetUser.status,
        toStatus: parsed.data.status,
      },
    });
  });

  revalidateAdminPages();
}

export async function saveOrderNoteAction(formData: FormData) {
  await assertSameOriginRequest();
  const session = await getAdminSession();

  const parsed = orderNoteSchema.safeParse({
    orderId: formData.get("orderId"),
    body: formData.get("body"),
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid order note.");
  }

  const order = await prisma.order.findUnique({
    where: { id: parsed.data.orderId },
    select: {
      id: true,
      orderNumber: true,
    },
  });

  if (!order) {
    throw new Error("Sipariş bulunamadı.");
  }

  await prisma.$transaction(async (tx) => {
    await tx.orderNote.create({
      data: {
        orderId: order.id,
        body: parsed.data.body,
        authorUserId: session.user.id,
      },
    });

    await recordAuditLog(tx, {
      actorUserId: session.user.id,
      action: "ORDER_NOTE_ADDED",
      targetType: "ORDER",
      targetId: order.id,
      targetLabel: order.orderNumber,
    });
  });

  revalidateAdminPages();
}

export async function updateKmlPriceAction(formData: FormData) {
  await assertSameOriginRequest();
  const session = await getAdminSession();

  const parsed = settingSchema.safeParse({
    price: formData.get("price"),
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid price setting.");
  }

  await prisma.$transaction(async (tx) => {
    const previous = await tx.appSetting.findUnique({
      where: { key: APP_SETTING_KEYS.kmlPrice },
      select: { value: true },
    });

    await tx.appSetting.upsert({
      where: { key: APP_SETTING_KEYS.kmlPrice },
      update: {
        value: String(parsed.data.price),
        updatedByUserId: session.user.id,
      },
      create: {
        key: APP_SETTING_KEYS.kmlPrice,
        value: String(parsed.data.price),
        updatedByUserId: session.user.id,
      },
    });

    await recordAuditLog(tx, {
      actorUserId: session.user.id,
      action: "SETTING_UPDATED",
      targetType: "APP_SETTING",
      targetId: APP_SETTING_KEYS.kmlPrice,
      targetLabel: APP_SETTING_KEYS.kmlPrice,
      metadata: {
        previousValue: previous?.value ?? null,
        nextValue: String(parsed.data.price),
      },
    });
  });

  revalidateAdminPages();
  revalidateCustomerPages();
}

export async function ensureAdminAction() {
  const session = await getAdminSession();
  if (session.user.role !== Role.ADMIN) {
    throw new Error("Yönetici erişimi gerekli.");
  }
}
