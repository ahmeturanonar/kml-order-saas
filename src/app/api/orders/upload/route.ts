import crypto from "node:crypto";
import path from "node:path";
import { CreditSource, CreditTransactionType, NotificationType } from "@prisma/client";
import { getServerSession } from "next-auth";
import { after, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { recordAuditLog } from "@/lib/audit";
import { createCreditTransaction } from "@/lib/credits";
import { orderEmailTemplate } from "@/lib/email-templates";
import { logger } from "@/lib/logger";
import { createNotification } from "@/lib/notifications";
import { toOrderNumber } from "@/lib/orders";
import { processOrder } from "@/lib/order-processor";
import { prisma } from "@/lib/prisma";
import { assertRateLimit } from "@/lib/rate-limit";
import { assertRequestOrigin } from "@/lib/request";
import { getKmlPrice } from "@/lib/settings";
import { computeFileHash, deleteStoredFile, saveUploadedKml } from "@/lib/storage";
import {
  UploadValidationError,
  validateKmlFile,
  validateUploadResolution,
} from "@/lib/validations/upload";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "CUSTOMER") {
    return NextResponse.json({ message: "Yetkisiz erisim." }, { status: 401 });
  }

  try {
    assertRequestOrigin(request);
    assertRateLimit(`upload:${session.user.id}`, 25, 15 * 60 * 1000);

    const formData = await request.formData();
    const file = formData.get("file");
    const resolution = validateUploadResolution(formData.get("resolution"));

    if (!(file instanceof File)) {
      return NextResponse.json({ message: "Lutfen bir KML dosyasi secin." }, { status: 400 });
    }

    validateKmlFile(file);

    const arrayBuffer = await file.arrayBuffer();
    const fileHash = await computeFileHash(arrayBuffer);
    const kmlPrice = await getKmlPrice();

    const duplicate = await prisma.uploadedFile.findFirst({
      where: {
        userId: session.user.id,
        fileHash,
      },
      select: {
        id: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    const duplicateMessage = duplicate
      ? "Bu dosya daha once yuklenmisti. Uyari gosterildi ve yeni siparis olusturulmaya devam edildi."
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

    let createdOrderId = "";
    let createdOrderNumber = "";

    try {
      const createdOrder = await prisma.$transaction(async (tx) => {
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
            resolution,
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
            resolution,
            duplicateOfUploadId: duplicate?.id ?? null,
          },
        });

        return {
          id: order.id,
          orderNumber: finalOrderNumber,
        };
      });

      createdOrderId = createdOrder.id;
      createdOrderNumber = createdOrder.orderNumber;
    } catch (error) {
      await deleteStoredFile(filePath);
      throw error;
    }

    const notificationMessage = duplicateMessage
      ? `${file.name} adli KML dosyaniz daha once de yuklenmisti. ${createdOrderNumber} numarali yeni siparis basariyla olusturuldu ve sunucu tarafinda isleme alindi.`
      : `${file.name} adli KML dosyaniz ${createdOrderNumber} numarali siparis olarak basariyla yuklendi ve sunucu tarafinda isleme alindi.`;
    const emailTemplate = orderEmailTemplate({
      title: "Siparis alindi",
      message: notificationMessage,
      orderNumber: createdOrderNumber,
    });

    await createNotification({
      userId: session.user.id,
      title: "Siparis alindi",
      message: notificationMessage,
      type: NotificationType.ORDER_STATUS,
      email: session.user.email ?? undefined,
      emailSubject: emailTemplate.subject,
      emailHtml: emailTemplate.html,
      linkPath: "/dashboard/orders",
    }).catch((error) => {
      logger.warn(
        {
          error,
          orderId: createdOrderId,
        },
        "Order created notification could not be delivered",
      );
    });

    after(async () => {
      const result = await processOrder(createdOrderId);

      if (result.status === "failed") {
        logger.error(
          {
            orderId: createdOrderId,
            errorMessage: result.errorMessage,
          },
          "Background server-side order processing failed",
        );
      }
    });

    return NextResponse.json({
      message: "KML basariyla yuklendi. Siparis olusturuldu ve otomatik isleme alindi.",
      duplicateMessage,
      resolution,
    });
  } catch (error) {
    logger.error({ error }, "Upload failed");
    if (error instanceof UploadValidationError) {
      return NextResponse.json(
        {
          message: error.message,
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : "Yukleme basarisiz oldu.",
      },
      { status: 500 },
    );
  }
}
