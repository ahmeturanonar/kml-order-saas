import fs from "node:fs/promises";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { assertDesktopAgentRequest } from "@/lib/desktop-agent";
import { logger } from "@/lib/logger";
import { buildDownloadHeaders, findExistingStoredFile } from "@/lib/order-files";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const authError = assertDesktopAgentRequest(request);
  if (authError) {
    return authError;
  }

  try {
    const { id } = await params;
    const order = await prisma.order.findUnique({
      where: { id },
      select: {
        id: true,
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
      return NextResponse.json({ message: "Order file not found." }, { status: 404 });
    }

    const fileLookup = await findExistingStoredFile(order.uploadedFile);
    if (!fileLookup.resolvedPath) {
      logger.warn(
        {
          orderId: order.id,
          uploadDir: fileLookup.uploadDir,
          storedFilePath: order.uploadedFile.filePath,
          candidatePaths: fileLookup.candidates,
        },
        "Desktop agent requested an order file that does not exist on disk",
      );

      return NextResponse.json(
        {
          message: "Order file does not exist on disk.",
          ...(process.env.NODE_ENV === "development"
            ? {
                details: {
                  uploadDir: fileLookup.uploadDir,
                  storedFilePath: order.uploadedFile.filePath,
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
      order.uploadedFile.originalFileName || order.uploadedFile.fileName || `${order.id}.kml`;

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: buildDownloadHeaders({
        downloadName,
        mimeType: order.uploadedFile.mimeType,
        size: fileLookup.size,
      }),
    });
  } catch (error) {
    logger.error(
      {
        error,
        requestUrl: request.url,
      },
      "Desktop agent file download failed",
    );

    return NextResponse.json(
      {
        message:
          process.env.NODE_ENV === "development" && error instanceof Error
            ? error.message
            : "Failed to download order file.",
      },
      { status: 500 },
    );
  }
}
