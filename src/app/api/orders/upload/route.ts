import { parseCoordinates } from "@/lib/kml-parser";
import { lookupBatch } from "@/lib/elevation";
import crypto from "node:crypto";
import path from "node:path";
import { CreditSource, CreditTransactionType, NotificationType } from "@prisma/client";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { recordAuditLog } from "@/lib/audit";
import { createCreditTransaction } from "@/lib/credits";
import { orderEmailTemplate } from "@/lib/email-templates";
import { logger } from "@/lib/logger";
import { createNotification } from "@/lib/notifications";
import { toOrderNumber } from "@/lib/orders";
import { prisma } from "@/lib/prisma";
import { assertRateLimit } from "@/lib/rate-limit";
import { assertRequestOrigin } from "@/lib/request";
import { getKmlPrice } from "@/lib/settings";
import { computeFileHash, deleteStoredFile, saveUploadedKml } from "@/lib/storage";
import { validateKmlFile } from "@/lib/validations/upload";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "CUSTOMER") {
    return NextResponse.json({ message: "Yetkisiz erişim." }, { status: 401 });
  }

  try {
    assertRequestOrigin(request);
    assertRateLimit(`upload:${session.user.id}`, 25, 15 * 60 * 1000);

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ message: "Lütfen bir KML dosyası seçin." }, { status: 400 });
    }

    validateKmlFile(file);

    const arrayBuffer = await file.arrayBuffer();
const xml = Buffer.from(arrayBuffer).toString("utf8");

const coordinates = parseCoordinates(xml);

const elevations = await lookupBatch(coordinates);

console.log(
  `Elevation API: ${coordinates.length} koordinat gönderildi, ${elevations.length} sonuç alındı.`,
);
    const fileHash = await computeFileHash(arrayBuffer);
    const kmlPrice = await getKmlPrice();

    const duplicate = await prisma.uploadedFile.findFirst({
      where: {
        userId: session.user.id,
        fileHash,
      },
      select: {
        id: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    const duplicateMessage = duplicate
      ? "Bu dosya daha önce yüklenmişti. Uyarı gösterildi ve yeni sipariş oluşturmaya devam edildi."
      : undefined;

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { creditBalance: true },
    });

    if (!user || user.creditBalance < kmlPrice) {
      return NextResponse.json({ message: "Yetersiz kredi." }, { status: 400 });
    }

    const sanitizedBaseName = path
      .basename(file.name, path.extname(file.name))
      .replace(/[^a-zA-Z0-9-_]+/g, "-")
      .slice(0, 70);
    const storedFileName = `${Date.now()}-${sanitizedBaseName || "kml-file"}-${crypto.randomUUID()}.kml`;

    const filePath = await saveUploadedKml({
      userId: session.user.id,
      fileName: storedFileName,
      arrayBuffer,
    });
    let createdOrderNumber = "";

    try {
      createdOrderNumber = await prisma.$transaction(async (tx) => {
        const updatedUser = await tx.user.update({
          where: { id: session.user.id },
          data: {
            creditBalance: {
              decrement: kmlPrice,
            },
          },
          select: {
            creditBalance: true,
          },
        });

        const order = await tx.order.create({
          data: {
            orderNumber: `TEMP-${crypto.randomUUID()}`,
            userId: session.user.id,
            creditCharged: kmlPrice,
            remainingBalanceAfter: updatedUser.creditBalance,
          },
        });

        const finalOrderNumber = toOrderNumber(order.sequenceNumber);

        await tx.order.update({
          where: { id: order.id },
          data: {
            orderNumber: finalOrderNumber,
            uploadedFile: {
              create: {
                userId: session.user.id,
                fileName: storedFileName,
                originalFileName: file.name,
                filePath,
                mimeType: file.type || "application/octet-stream",
                fileSize: file.size,
                fileHash,
              },
            },
          },
        });

        await createCreditTransaction(tx, {
          userId: session.user.id,
          amount: -kmlPrice,
          type: CreditTransactionType.ORDER_CHARGE,
          description: `Charge for KML upload ${file.name}`,
          balanceAfter: updatedUser.creditBalance,
          orderId: order.id,
          sourceType: CreditSource.USER,
          sourceUserId: session.user.id,
        });

        await tx.orderStatusHistory.create({
          data: {
            orderId: order.id,
            toStatus: order.status,
          },
        });

        await recordAuditLog(tx, {
          actorUserId: session.user.id,
          action: "ORDER_CREATED",
          targetType: "ORDER",
          targetId: order.id,
          targetLabel: finalOrderNumber,
          metadata: {
            fileName: file.name,
            charged: kmlPrice,
            duplicateOfUploadId: duplicate?.id ?? null,
          },
        });

        return finalOrderNumber;
      });
    } catch (error) {
      await deleteStoredFile(filePath);
      throw error;
    }

    const notificationMessage = duplicateMessage
      ? `${file.name} adlı KML dosyanız daha önce de yüklenmişti. ${createdOrderNumber} numaralı yeni sipariş başarıyla oluşturuldu ve manuel işleme bekliyor.`
      : `${file.name} adlı KML dosyanız ${createdOrderNumber} numaralı sipariş olarak başarıyla yüklendi ve manuel işleme bekliyor.`;
    const emailTemplate = orderEmailTemplate({
      title: "Sipariş alındı",
      message: notificationMessage,
      orderNumber: createdOrderNumber,
    });

    await createNotification({
      userId: session.user.id,
      title: "Sipariş alındı",
      message: notificationMessage,
      type: NotificationType.ORDER_STATUS,
      email: session.user.email ?? undefined,
      emailSubject: emailTemplate.subject,
      emailHtml: emailTemplate.html,
      linkPath: "/dashboard/orders",
    });

    return NextResponse.json({
      message: "KML başarıyla yüklendi. Sipariş bekliyor durumunda oluşturuldu.",
      duplicateMessage,
    });
  } catch (error) {
    logger.error({ error }, "Upload failed");
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : "Yükleme başarısız oldu.",
      },
      { status: 500 },
    );
  }
}
