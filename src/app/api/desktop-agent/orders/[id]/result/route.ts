import crypto from "node:crypto";
import path from "node:path";
import { NotificationType, OrderStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { recordAuditLog } from "@/lib/audit";
import { assertDesktopAgentRequest } from "@/lib/desktop-agent";
import { orderEmailTemplate } from "@/lib/email-templates";
import {
  GENERATED_FILE_EXTENSION,
  GENERATED_FILE_MIME_TYPE,
  normalizeGeneratedCsvBuffer,
} from "@/lib/generated-csv";
import { logger } from "@/lib/logger";
import { createNotification } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
import { deleteStoredFile, saveGeneratedCsv } from "@/lib/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function sanitizeBaseName(value: string) {
  return value.replace(/[^a-zA-Z0-9-_]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const authError = assertDesktopAgentRequest(request);
  if (authError) {
    return authError;
  }

  let savedFilePath: string | null = null;

  try {
    const { id } = await params;
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ message: "CSV file is required." }, { status: 400 });
    }

    if (path.extname(file.name).toLowerCase() !== ".csv") {
      return NextResponse.json({ message: "Only CSV files are supported." }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
          },
        },
        uploadedFile: true,
        generatedFile: true,
      },
    });

    if (!order?.uploadedFile) {
      return NextResponse.json({ message: "Order not found." }, { status: 404 });
    }

    if (order.status === OrderStatus.CANCELLED) {
      return NextResponse.json({ message: "Cancelled orders cannot accept generated CSV files." }, { status: 409 });
    }

    if (order.status === OrderStatus.PENDING) {
      return NextResponse.json(
        { message: "Order must be downloaded before a generated CSV can be uploaded." },
        { status: 409 },
      );
    }

    const uploadedFileBuffer = Buffer.from(await file.arrayBuffer());
    if (uploadedFileBuffer.byteLength === 0) {
      return NextResponse.json({ message: "CSV file is empty." }, { status: 400 });
    }
    const fileBuffer = normalizeGeneratedCsvBuffer(uploadedFileBuffer);

    const originalBaseName = sanitizeBaseName(
      path.basename(order.uploadedFile.originalFileName, path.extname(order.uploadedFile.originalFileName)),
    );
    const storedFileName = `${Date.now()}-${originalBaseName || "order-result"}-${crypto.randomUUID()}${GENERATED_FILE_EXTENSION}`;
    const originalFileName = `${originalBaseName || order.orderNumber.replace(/[^a-zA-Z0-9-_]+/g, "-") || "order-result"}${GENERATED_FILE_EXTENSION}`;

    savedFilePath = await saveGeneratedCsv({
      userId: order.userId,
      fileName: storedFileName,
      buffer: fileBuffer,
    });

    const previousGeneratedFilePath = order.generatedFile?.filePath ?? null;
    const transitionedToCompleted = order.status !== OrderStatus.COMPLETED;
    const completedAt = new Date();

    const updatedOrder = await prisma.$transaction(async (tx) => {
      await tx.generatedFile.upsert({
        where: { orderId: order.id },
        update: {
          fileName: storedFileName,
          originalFileName,
          filePath: savedFilePath!,
          mimeType: GENERATED_FILE_MIME_TYPE,
          fileSize: fileBuffer.byteLength,
        },
        create: {
          userId: order.userId,
          orderId: order.id,
          fileName: storedFileName,
          originalFileName,
          filePath: savedFilePath!,
          mimeType: GENERATED_FILE_MIME_TYPE,
          fileSize: fileBuffer.byteLength,
        },
      });

      const nextOrder = await tx.order.update({
        where: { id: order.id },
        data: {
          status: OrderStatus.COMPLETED,
          downloadedAt: order.downloadedAt ?? completedAt,
          completedAt,
        },
        select: {
          id: true,
          orderNumber: true,
          status: true,
          completedAt: true,
        },
      });

      if (transitionedToCompleted) {
        await tx.orderStatusHistory.create({
          data: {
            orderId: order.id,
            fromStatus: order.status,
            toStatus: OrderStatus.COMPLETED,
            note: "Excel result generated from desktop agent CSV and uploaded to the server.",
          },
        });
      }

      await recordAuditLog(tx, {
        action: transitionedToCompleted ? "ORDER_COMPLETED_BY_AGENT" : "ORDER_RESULT_REUPLOADED",
        targetType: "ORDER",
        targetId: nextOrder.id,
        targetLabel: nextOrder.orderNumber,
        metadata: {
          previousStatus: order.status,
          fileName: storedFileName,
          originalFileName,
          fileSize: fileBuffer.byteLength,
        },
      });

      return nextOrder;
    });

    if (
      previousGeneratedFilePath &&
      previousGeneratedFilePath !== savedFilePath
    ) {
      await deleteStoredFile(previousGeneratedFilePath).catch((error) => {
        logger.warn(
          { error, orderId: order.id, previousGeneratedFilePath },
          "Failed to remove previous generated Excel file after replacement",
        );
      });
    }

    if (transitionedToCompleted) {
      const emailTemplate = orderEmailTemplate({
        title: `Order ${updatedOrder.orderNumber} completed`,
        message: `Your order ${updatedOrder.orderNumber} has been completed. Your Excel result file is now ready to download from your dashboard.`,
        orderNumber: updatedOrder.orderNumber,
      });

      await createNotification({
        userId: order.user.id,
        email: order.user.email,
        type: NotificationType.ORDER_STATUS,
        title: `Order ${updatedOrder.orderNumber} completed`,
        message: `Your order ${updatedOrder.orderNumber} has been completed. Your Excel result file is ready to download.`,
        emailSubject: emailTemplate.subject,
        emailHtml: emailTemplate.html,
        linkPath: "/dashboard/orders",
      });
    }

    return NextResponse.json({
      orderId: updatedOrder.id,
      status: updatedOrder.status,
      completedAt: updatedOrder.completedAt?.toISOString() ?? completedAt.toISOString(),
    });
  } catch (error) {
    if (savedFilePath) {
      await deleteStoredFile(savedFilePath).catch(() => undefined);
    }

    logger.error({ error, requestUrl: request.url }, "Desktop agent CSV upload failed");

    return NextResponse.json(
      {
        message:
          process.env.NODE_ENV === "development" && error instanceof Error
            ? error.message
            : "Failed to upload generated CSV.",
      },
      { status: 500 },
    );
  }
}
