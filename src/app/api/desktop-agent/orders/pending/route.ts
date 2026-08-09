import { NextResponse } from "next/server";
import { normalizeElevationResolution } from "@/lib/elevation-resolution";
import { prisma } from "@/lib/prisma";
import { assertDesktopAgentRequest } from "@/lib/desktop-agent";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const authError = assertDesktopAgentRequest(request);
  if (authError) {
    return authError;
  }

  const baseUrl = new URL(request.url).origin;
  const orders = await prisma.order.findMany({
    where: {
      status: "PENDING",
      uploadedFile: {
        isNot: null,
      },
    },
    include: {
      uploadedFile: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  return NextResponse.json(
    orders.map((order) => ({
      orderId: order.id,
      filename: order.uploadedFile?.originalFileName ?? order.uploadedFile?.fileName ?? "",
      downloadUrl: `${baseUrl}/api/desktop-agent/orders/${order.id}/file`,
      uploadedAt: order.createdAt.toISOString(),
      resolution: normalizeElevationResolution(order.resolution),
    })),
  );
}
