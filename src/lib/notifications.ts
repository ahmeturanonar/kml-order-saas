import { NotificationType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/mailer";

export async function createNotification(params: {
  userId: string;
  title: string;
  message: string;
  type?: NotificationType;
  email?: string;
  linkPath?: string;
  emailSubject?: string;
  emailHtml?: string;
}) {
  await prisma.notification.create({
    data: {
      userId: params.userId,
      title: params.title,
      message: params.message,
      type: params.type ?? NotificationType.SYSTEM,
      linkPath: params.linkPath,
    },
  });

  if (params.email) {
    await sendEmail({
      to: params.email,
      subject: params.emailSubject ?? params.title,
      html: params.emailHtml ?? `<p>${params.message}</p>`,
    });
  }
}
