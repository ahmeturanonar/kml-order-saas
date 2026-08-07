import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { NotificationType, OrderStatus } from "@prisma/client";
import { recordAuditLog } from "@/lib/audit";
import { lookupBatch } from "@/lib/elevation";
import { orderEmailTemplate } from "@/lib/email-templates";
import { parseCoordinates } from "@/lib/kml-parser";
import { logger } from "@/lib/logger";
import { createNotification } from "@/lib/notifications";
import { findExistingStoredFile } from "@/lib/order-files";
import { prisma } from "@/lib/prisma";
import { buildGeneratedCsvBuffer, CSV_MIME_TYPE } from "@/lib/generated-csv";
import { deleteStoredFile, saveGeneratedCsv } from "@/lib/storage";

type ProcessingOrder = {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  userId: string;
  user: {
    id: string;
    email: string | null;
  };
  uploadedFile: {
    userId: string;
    fileName: string;
    originalFileName: string;
    filePath: string;
    mimeType: string;
  };
};

function sanitizeBaseName(value: string) {
  return value.replace(/[^a-zA-Z0-9-_]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
}

function normalizeErrorMessage(error: unknown) {
  if (!(error instanceof Error)) {
    return "Unknown processing error.";
  }

  return error.message.length > 500 ? `${error.message.slice(0, 497)}...` : error.message;
}

function buildCsvBuffer(results: Awaited<ReturnType<typeof lookupBatch>>) {
  return buildGeneratedCsvBuffer(
    results.map((result) => ({
      lat: result.lat,
      lon: result.lon,
      elevation: result.elevation,
    })),
  );
}

async function beginOrderProcessing(orderId: string): Promise<ProcessingOrder | null> {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        userId: true,
        user: {
          select: {
            id: true,
            email: true,
          },
        },
        uploadedFile: {
          select: {
            userId: true,
            fileName: true,
            originalFileName: true,
            filePath: true,
            mimeType: true,
          },
        },
      },
    });

    if (!order?.uploadedFile) {
      throw new Error("Order or uploaded KML file was not found.");
    }

    const uploadedFile = order.uploadedFile;

    if (order.status === OrderStatus.CANCELLED) {
      return null;
    }

    if (order.status === OrderStatus.PROCESSING || order.status === OrderStatus.COMPLETED) {
      return null;
    }

    await tx.order.update({
      where: { id: order.id },
      data: {
        status: OrderStatus.PROCESSING,
        completedAt: null,
        cancelledAt: null,
      },
    });

    await tx.orderStatusHistory.create({
      data: {
        orderId: order.id,
        fromStatus: order.status,
        toStatus: OrderStatus.PROCESSING,
        note: "Server-side processing started automatically.",
      },
    });

    await recordAuditLog(tx, {
      action: "ORDER_PROCESSING_STARTED",
      targetType: "ORDER",
      targetId: order.id,
      targetLabel: order.orderNumber,
      metadata: {
        fromStatus: order.status,
        processor: "SERVER_SIDE",
      },
    });

    return {
      ...order,
      uploadedFile,
      status: OrderStatus.PROCESSING,
    };
  });
}

async function completeOrderProcessing(params: {
  orderId: string;
  orderNumber: string;
  userId: string;
  userEmail: string | null;
  uploadedOriginalFileName: string;
  savedFilePath: string;
  fileName: string;
  fileSize: number;
}) {
  const completedAt = new Date();

  const result = await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: params.orderId },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        generatedFile: {
          select: {
            filePath: true,
          },
        },
      },
    });

    if (!order) {
      throw new Error("Order not found during completion.");
    }

    if (order.status === OrderStatus.CANCELLED) {
      throw new Error("Order was cancelled during processing.");
    }

    const originalBaseName = sanitizeBaseName(
      path.basename(params.uploadedOriginalFileName, path.extname(params.uploadedOriginalFileName)),
    );
    const originalFileName = `${originalBaseName || params.orderNumber.replace(/[^a-zA-Z0-9-_]+/g, "-") || "order-result"}.csv`;
    const transitionedToCompleted = order.status !== OrderStatus.COMPLETED;

    await tx.generatedFile.upsert({
      where: { orderId: params.orderId },
      update: {
        fileName: params.fileName,
        originalFileName,
        filePath: params.savedFilePath,
        mimeType: CSV_MIME_TYPE,
        fileSize: params.fileSize,
      },
      create: {
        userId: params.userId,
        orderId: params.orderId,
        fileName: params.fileName,
        originalFileName,
        filePath: params.savedFilePath,
        mimeType: CSV_MIME_TYPE,
        fileSize: params.fileSize,
      },
    });

    await tx.order.update({
      where: { id: params.orderId },
      data: {
        status: OrderStatus.COMPLETED,
        completedAt,
        cancelledAt: null,
      },
    });

    if (transitionedToCompleted) {
      await tx.orderStatusHistory.create({
        data: {
          orderId: params.orderId,
          fromStatus: order.status,
          toStatus: OrderStatus.COMPLETED,
          note: "Order was processed automatically on the server and the CSV result was generated.",
        },
      });
    }

    await recordAuditLog(tx, {
      action: transitionedToCompleted
        ? "ORDER_COMPLETED_SERVER_SIDE"
        : "ORDER_RESULT_REGENERATED_SERVER_SIDE",
      targetType: "ORDER",
      targetId: params.orderId,
      targetLabel: params.orderNumber,
      metadata: {
        previousStatus: order.status,
        fileName: params.fileName,
        fileSize: params.fileSize,
        processor: "SERVER_SIDE",
      },
    });

    return {
      previousGeneratedFilePath: order.generatedFile?.filePath ?? null,
      transitionedToCompleted,
    };
  });

  if (
    result.previousGeneratedFilePath &&
    result.previousGeneratedFilePath !== params.savedFilePath
  ) {
    await deleteStoredFile(result.previousGeneratedFilePath).catch((error) => {
      logger.warn(
        {
          error,
          orderId: params.orderId,
          previousGeneratedFilePath: result.previousGeneratedFilePath,
        },
        "Failed to remove previous generated CSV after server-side replacement",
      );
    });
  }

  if (result.transitionedToCompleted) {
    const emailTemplate = orderEmailTemplate({
      title: `${params.orderNumber} numarali siparis tamamlandi`,
      message: `${params.orderNumber} numarali siparisiniz tamamlandi. CSV sonuc dosyaniz indirilmeye hazir.`,
      orderNumber: params.orderNumber,
    });

    await createNotification({
      userId: params.userId,
      email: params.userEmail ?? undefined,
      type: NotificationType.ORDER_STATUS,
      title: `${params.orderNumber} numarali siparis tamamlandi`,
      message: `${params.orderNumber} numarali siparisiniz tamamlandi. CSV sonuc dosyaniz indirilmeye hazir.`,
      emailSubject: emailTemplate.subject,
      emailHtml: emailTemplate.html,
      linkPath: "/dashboard/orders",
    }).catch((error) => {
      logger.warn(
        {
          error,
          orderId: params.orderId,
        },
        "Order completion notification could not be delivered",
      );
    });
  }
}

async function recordOrderProcessingFailure(orderId: string, error: unknown) {
  const errorMessage = normalizeErrorMessage(error);

  await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        orderNumber: true,
        status: true,
      },
    });

    if (!order) {
      return;
    }

    if (order.status === OrderStatus.PROCESSING) {
      await tx.order.update({
        where: { id: order.id },
        data: {
          status: OrderStatus.PENDING,
          completedAt: null,
        },
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId: order.id,
          fromStatus: OrderStatus.PROCESSING,
          toStatus: OrderStatus.PENDING,
          note: "Server-side processing failed. The order was returned to pending for safe retry.",
        },
      });
    }

    await recordAuditLog(tx, {
      action: "ORDER_PROCESSING_FAILED",
      targetType: "ORDER",
      targetId: order.id,
      targetLabel: order.orderNumber,
      metadata: {
        statusAtFailure: order.status,
        errorMessage,
        processor: "SERVER_SIDE",
      },
    });
  });
}

export async function processOrder(orderId: string) {
  let savedFilePath: string | null = null;
  let statusWasTransitioned = false;

  try {
    const order = await beginOrderProcessing(orderId);
    if (!order) {
      return {
        orderId,
        status: "skipped" as const,
      };
    }

    statusWasTransitioned = true;

    const fileLookup = await findExistingStoredFile(order.uploadedFile);
    if (!fileLookup.resolvedPath) {
      throw new Error("Uploaded KML file does not exist on disk.");
    }

    const xml = await fs.readFile(fileLookup.resolvedPath, "utf8");
    const coordinates = parseCoordinates(xml);
    const elevations = await lookupBatch(coordinates);

    if (elevations.length !== coordinates.length) {
      throw new Error(
        `Elevation API returned ${elevations.length} rows for ${coordinates.length} coordinates.`,
      );
    }

    const csvBuffer = buildCsvBuffer(elevations);
    const originalBaseName = sanitizeBaseName(
      path.basename(order.uploadedFile.originalFileName, path.extname(order.uploadedFile.originalFileName)),
    );
    const fileName = `${Date.now()}-${originalBaseName || "order-result"}-${crypto.randomUUID()}.csv`;

    savedFilePath = await saveGeneratedCsv({
      userId: order.userId,
      fileName,
      buffer: csvBuffer,
    });

    await completeOrderProcessing({
      orderId: order.id,
      orderNumber: order.orderNumber,
      userId: order.userId,
      userEmail: order.user.email,
      uploadedOriginalFileName: order.uploadedFile.originalFileName,
      savedFilePath,
      fileName,
      fileSize: csvBuffer.byteLength,
    });

    logger.info(
      {
        orderId: order.id,
        coordinateCount: coordinates.length,
        resultCount: elevations.length,
      },
      "Order processed fully on the server",
    );

    return {
      orderId,
      status: "completed" as const,
    };
  } catch (error) {
    if (savedFilePath) {
      await deleteStoredFile(savedFilePath).catch(() => undefined);
    }

    if (statusWasTransitioned) {
      await recordOrderProcessingFailure(orderId, error).catch((transactionError) => {
        logger.error(
          {
            error: transactionError,
            originalError: error,
            orderId,
          },
          "Failed to record order processing failure",
        );
      });
    }

    logger.error({ error, orderId }, "Server-side order processing failed");

    return {
      orderId,
      status: "failed" as const,
      errorMessage: normalizeErrorMessage(error),
    };
  }
}
