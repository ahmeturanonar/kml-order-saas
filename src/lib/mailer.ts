import nodemailer from "nodemailer";
import { logger } from "@/lib/logger";

function createTransporter() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT ?? "587");
  const user = process.env.SMTP_USER;
  const password = process.env.SMTP_PASSWORD;

  if (!host || !user || !password) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass: password,
    },
  });
}

export async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
}) {
  const transporter = createTransporter();

  if (!transporter) {
    logger.info(
      {
        to: params.to,
        subject: params.subject,
      },
      "SMTP is not configured. Email content was not sent.",
    );
    return;
  }

  await transporter.sendMail({
    from: process.env.SMTP_FROM ?? "noreply@example.com",
    to: params.to,
    subject: params.subject,
    html: params.html,
  });
}
