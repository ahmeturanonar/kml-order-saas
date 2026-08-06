import fs from "node:fs/promises";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { buildDownloadHeaders, findExistingStoredFile } from "@/lib/order-files";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: { uploadedFile: true },
  });

  if (!order?.uploadedFile) {
    return NextResponse.json({ message: "File not found." }, { status: 404 });
  }

  const fileLookup = await findExistingStoredFile(order.uploadedFile);
  if (!fileLookup.resolvedPath) {
    return NextResponse.json({ message: "File not found on disk." }, { status: 404 });
  }

  const fileBuffer = await fs.readFile(fileLookup.resolvedPath);

  return new NextResponse(fileBuffer, {
    status: 200,
    headers: buildDownloadHeaders({
      downloadName: order.uploadedFile.originalFileName || order.uploadedFile.fileName,
      mimeType: order.uploadedFile.mimeType,
      size: fileLookup.size,
    }),
  });
}
