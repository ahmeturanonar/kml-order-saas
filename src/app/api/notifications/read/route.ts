import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { assertRequestOrigin } from "@/lib/request";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ message: "Yetkisiz erişim." }, { status: 401 });
  }

  assertRequestOrigin(request);

  const { notificationId } = (await request.json()) as { notificationId?: string };
  if (!notificationId) {
    return NextResponse.json({ message: "Bildirim kimliği gereklidir." }, { status: 400 });
  }

  await prisma.notification.updateMany({
    where: {
      id: notificationId,
      userId: session.user.id,
    },
    data: {
      readAt: new Date(),
    },
  });

  return NextResponse.json({ message: "Bildirim okundu olarak işaretlendi." });
}
