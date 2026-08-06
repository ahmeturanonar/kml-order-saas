import fs from "node:fs/promises";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { buildDownloadHeaders, findExistingStoredFile } from "@/lib/order-files";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  try {
    const { id } = await params;
    const order = await prisma.order.findUnique({
      where: { id },
      select: {
        id: true,
        orderNumber: true,
        userId: true,
        generatedFile: {
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

    if (!order?.generatedFile) {
      return NextResponse.json({ message: "CSV file not found." }, { status: 404 });
    }

    if (session.user.role !== "ADMIN" && order.userId !== session.user.id) {
      return NextResponse.json({ message: "Forbidden." }, { status: 403 });
    }

    const fileLookup = await findExistingStoredFile(order.generatedFile);
    if (!fileLookup.resolvedPath) {
      logger.warn(
        {
          orderId: order.id,
          uploadDir: fileLookup.uploadDir,
          storedFilePath: order.generatedFile.filePath,
          candidatePaths: fileLookup.candidates,
        },
        "CSV download requested for a generated file that does not exist on disk",
      );

      return NextResponse.json(
        {
          message: "CSV file does not exist on disk.",
          ...(process.env.NODE_ENV === "development"
            ? {
                details: {
                  uploadDir: fileLookup.uploadDir,
                  storedFilePath: order.generatedFile.filePath,
                  candidatePaths: fileLookup.candidates,
                },
              }
            : {}),
        },
        { status: 404 },
      );
    }

    const fileBuffer = await fs.readFile(fileLookup.resolvedPath);
    const downloadName =
      order.generatedFile.originalFileName ||
      order.generatedFile.fileName ||
      `${order.orderNumber}.csv`;

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: buildDownloadHeaders({
        downloadName,
        mimeType: order.generatedFile.mimeType,
        size: fileLookup.size,
      }),
    });
  } catch (error) {
    logger.error(
      {
        error,
        requestUrl: request.url,
      },
      "CSV download failed",
    );

    return NextResponse.json(
      {
        message:
          process.env.NODE_ENV === "development" && error instanceof Error
            ? error.message
            : "Failed to download CSV file.",
      },
      { status: 500 },
    );
  }
}
