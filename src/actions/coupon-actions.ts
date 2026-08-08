"use server";

import { CreditSource, CreditTransactionType, NotificationType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { createCreditTransaction } from "@/lib/credits";
import { prisma } from "@/lib/prisma";
import { assertRateLimit } from "@/lib/rate-limit";
import { assertSameOriginRequest } from "@/lib/request";
import { requireAdmin, requireUser } from "@/lib/session";
import { recordAuditLog } from "@/lib/audit";
import { normalizeCouponCode } from "@/lib/coupons";
import { couponStatusSchema, createCouponSchema, redeemCouponSchema } from "@/lib/validations/coupon";

function isUniqueConstraintError(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && (error as { code?: string }).code === "P2002";
}

function revalidateAdminCouponPages() {
  revalidatePath("/admin");
  revalidatePath("/admin/coupons");
  revalidatePath("/admin/credits");
  revalidatePath("/admin/users");
  revalidatePath("/admin/payments");
  revalidatePath("/admin/orders");
  revalidatePath("/admin/settings");
  revalidatePath("/admin/audit");
}

function revalidateCustomerCouponPages() {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/credits");
  revalidatePath("/dashboard/notifications");
  revalidatePath("/dashboard/orders");
  revalidatePath("/dashboard/payments");
}

export async function createCouponAction(formData: FormData) {
  await assertSameOriginRequest();
  const session = await requireAdmin();

  const parsed = createCouponSchema.safeParse({
    code: formData.get("code"),
    creditAmount: formData.get("creditAmount"),
    isActive: formData.get("isActive"),
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Kupon oluşturulamadı.");
  }

  const normalizedCode = normalizeCouponCode(parsed.data.code);

  try {
    await prisma.$transaction(async (tx) => {
      const existing = await tx.coupon.findUnique({
        where: { normalizedCode },
        select: { id: true },
      });

      if (existing) {
        throw new Error("Bu kupon kodu zaten mevcut.");
      }

      const coupon = await tx.coupon.create({
        data: {
          code: normalizedCode,
          normalizedCode,
          creditAmount: parsed.data.creditAmount,
          isActive: parsed.data.isActive,
        },
      });

      await recordAuditLog(tx, {
        actorUserId: session.user.id,
        action: "COUPON_CREATED",
        targetType: "COUPON",
        targetId: coupon.id,
        targetLabel: coupon.code,
        metadata: {
          creditAmount: coupon.creditAmount,
          isActive: coupon.isActive,
        },
      });
    });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      throw new Error("Bu kupon kodu zaten mevcut.");
    }

    if (error instanceof Error) {
      throw error;
    }

    throw new Error("Kupon oluşturulamadı.");
  }

  revalidateAdminCouponPages();

  return {
    ok: true,
    message: `${normalizedCode} kuponu oluşturuldu.`,
  };
}

export async function setCouponStatusAction(formData: FormData) {
  await assertSameOriginRequest();
  const session = await requireAdmin();

  const parsed = couponStatusSchema.safeParse({
    couponId: formData.get("couponId"),
    isActive: formData.get("isActive"),
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Kupon durumu güncellenemedi.");
  }

  const coupon = await prisma.coupon.findUnique({
    where: { id: parsed.data.couponId },
    select: { id: true, code: true, isActive: true },
  });

  if (!coupon) {
    throw new Error("Kupon bulunamadı.");
  }

  await prisma.$transaction(async (tx) => {
    await tx.coupon.update({
      where: { id: coupon.id },
      data: {
        isActive: parsed.data.isActive,
      },
    });

    await recordAuditLog(tx, {
      actorUserId: session.user.id,
      action: parsed.data.isActive ? "COUPON_ACTIVATED" : "COUPON_DEACTIVATED",
      targetType: "COUPON",
      targetId: coupon.id,
      targetLabel: coupon.code,
      metadata: {
        fromStatus: coupon.isActive,
        toStatus: parsed.data.isActive,
      },
    });
  });

  revalidateAdminCouponPages();

  return {
    ok: true,
    message: parsed.data.isActive ? "Kupon aktif hale getirildi." : "Kupon pasife alındı.",
  };
}

export async function redeemCouponAction(formData: FormData) {
  await assertSameOriginRequest();
  const session = await requireUser();
  assertRateLimit(`coupon-redeem:${session.user.id}`, 20, 60 * 1000);

  const parsed = redeemCouponSchema.safeParse({
    code: formData.get("code"),
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Kupon kullanılamadı.");
  }

  try {
    const redemption = await prisma.$transaction(async (tx) => {
      const coupon = await tx.coupon.findUnique({
        where: { normalizedCode: parsed.data.code },
        select: {
          id: true,
          code: true,
          creditAmount: true,
          isActive: true,
        },
      });

      if (!coupon) {
        throw new Error("Kupon bulunamadı.");
      }

      if (!coupon.isActive) {
        throw new Error("Kupon aktif değil.");
      }

      if (coupon.creditAmount <= 0) {
        throw new Error("Kupon kredisi geçersiz.");
      }

      await tx.couponRedemption.create({
        data: {
          couponId: coupon.id,
          userId: session.user.id,
          creditAmount: coupon.creditAmount,
        },
      });

      const user = await tx.user.update({
        where: { id: session.user.id },
        data: {
          creditBalance: {
            increment: coupon.creditAmount,
          },
        },
        select: {
          creditBalance: true,
        },
      });

      await createCreditTransaction(tx, {
        userId: session.user.id,
        amount: coupon.creditAmount,
        type: CreditTransactionType.ADJUSTMENT,
        description: `Kupon kullanımı: ${coupon.code}`,
        balanceAfter: user.creditBalance,
        sourceType: CreditSource.SYSTEM,
      });

      await tx.notification.create({
        data: {
          userId: session.user.id,
          type: NotificationType.CREDIT,
          title: "Kupon kullanıldı",
          message: `${coupon.code} kuponu kullanıldı ve hesabınıza ${coupon.creditAmount} kredi eklendi.`,
          linkPath: "/dashboard/credits",
        },
      });

      await recordAuditLog(tx, {
        actorUserId: session.user.id,
        action: "COUPON_REDEEMED",
        targetType: "COUPON",
        targetId: coupon.id,
        targetLabel: coupon.code,
        metadata: {
          creditAmount: coupon.creditAmount,
        },
      });

      return {
        creditAmount: coupon.creditAmount,
        balanceAfter: user.creditBalance,
      };
    });

    revalidateCustomerCouponPages();

    return {
      ok: true,
      message: `Kupon başarıyla kullanıldı. Hesabınıza ${redemption.creditAmount} kredi eklendi.`,
    };
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      throw new Error("Bu kuponu daha önce kullandınız.");
    }

    if (error instanceof Error) {
      throw error;
    }

    throw new Error("Beklenmeyen bir hata oluştu.");
  }
}
