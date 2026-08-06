import { NextResponse } from "next/server";
import { NotificationType, OrderStatus } from "@prisma/client";
import { recordAuditLog } from "@/lib/audit";
import { orderEmailTemplate } from "@/lib/email-templates";
import { createNotification } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
import { assertDesktopAgentRequest } from "@/lib/desktop-agent";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const authError = assertDesktopAgentRequest(request);
  if (authError) {
    return authError;
  }

  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    select: {
      id: true,
      orderNumber: true,
      status: true,
      downloadedAt: true,
      userId: true,
      user: {
        select: {
          email: true,
        },
      },
    },
  });

  if (!order) {
    return NextResponse.json({ message: "Order not found." }, { status: 404 });
  }

  if (order.status !== OrderStatus.PENDING && order.status !== OrderStatus.DOWNLOADED) {
    return NextResponse.json(
      { message: `Order cannot be marked as downloaded from status ${order.status}.` },
      { status: 409 },
    );
  }

  const downloadedAt = new Date();
  const updatedOrder = await prisma.$transaction(async (tx) => {
    const nextOrder = await tx.order.update({
      where: { id },
      data: {
        status: OrderStatus.DOWNLOADED,
        downloadedAt,
      },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        downloadedAt: true,
      },
    });

    await tx.orderStatusHistory.create({
      data: {
        orderId: id,
        fromStatus: order.status,
        toStatus: OrderStatus.DOWNLOADED,
        note: "Downloaded by desktop agent.",
      },
    });

    await recordAuditLog(tx, {
      action: "ORDER_DOWNLOADED",
      targetType: "ORDER",
      targetId: nextOrder.id,
      targetLabel: nextOrder.orderNumber,
    });

    return nextOrder;
  });

  const emailTemplate = orderEmailTemplate({
    title: `Order ${updatedOrder.orderNumber} downloaded`,
    message: `Your order ${updatedOrder.orderNumber} has been downloaded by the desktop agent and queued for manual processing.`,
    orderNumber: updatedOrder.orderNumber,
  });

  await createNotification({
    userId: order.userId,
    email: order.user.email,
    type: NotificationType.ORDER_STATUS,
    title: `Order ${updatedOrder.orderNumber} downloaded`,
    message: `Your order ${updatedOrder.orderNumber} has been downloaded by the desktop agent and queued for manual processing.`,
    emailSubject: emailTemplate.subject,
    emailHtml: emailTemplate.html,
    linkPath: "/dashboard/orders",
  });

  return NextResponse.json({
    orderId: updatedOrder.id,
    status: updatedOrder.status,
    downloadedAt: updatedOrder.downloadedAt?.toISOString() ?? downloadedAt.toISOString(),
  });
}
