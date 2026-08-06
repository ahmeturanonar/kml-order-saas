"use server";

import crypto from "node:crypto";
import { addMinutes } from "date-fns";
import { prisma } from "@/lib/prisma";
import { assertRateLimit } from "@/lib/rate-limit";
import { assertSameOriginRequest } from "@/lib/request";
import { getAppUrl } from "@/lib/env";
import { passwordResetEmailTemplate, welcomeEmailTemplate } from "@/lib/email-templates";
import { hashPassword } from "@/lib/password";
import { sendEmail } from "@/lib/mailer";
import {
  forgotPasswordSchema,
  registerSchema,
  resetPasswordSchema,
} from "@/lib/validations/auth";
import { PASSWORD_RESET_TTL_MINUTES } from "@/lib/constants";

export type ActionResult = {
  ok: boolean;
  message: string;
};

export async function registerUserAction(
  _previousState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  await assertSameOriginRequest();
  assertRateLimit(`register:${formData.get("email")}`, 10, 15 * 60 * 1000);

  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Form değerleri geçersiz.",
    };
  }

  const existingUser = await prisma.user.findUnique({
    where: {
      email: parsed.data.email.toLowerCase(),
    },
  });

  if (existingUser) {
    return {
      ok: false,
      message: "Bu e-posta adresiyle kayıtlı bir hesap zaten var.",
    };
  }

  const passwordHash = await hashPassword(parsed.data.password);

  const user = await prisma.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email.toLowerCase(),
      passwordHash,
    },
  });

  const welcomeEmail = welcomeEmailTemplate(user.name);
  await sendEmail({
    to: user.email,
    subject: welcomeEmail.subject,
    html: welcomeEmail.html,
  });

  return {
    ok: true,
    message: "Hesap başarıyla oluşturuldu. Artık giriş yapabilirsiniz.",
  };
}

export async function forgotPasswordAction(
  _previousState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  await assertSameOriginRequest();

  const parsed = forgotPasswordSchema.safeParse({
    email: formData.get("email"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Geçersiz e-posta adresi.",
    };
  }

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email.toLowerCase() },
  });

  if (!user) {
    return {
      ok: true,
      message: "Bu e-posta kayıtlıysa şifre sıfırlama bağlantısı gönderildi.",
    };
  }

  await prisma.passwordResetToken.deleteMany({
    where: { userId: user.id },
  });

  const token = crypto.randomBytes(32).toString("hex");
  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      token,
      expiresAt: addMinutes(new Date(), PASSWORD_RESET_TTL_MINUTES),
    },
  });

  const resetUrl = `${getAppUrl()}/reset-password?token=${token}`;
  const resetEmail = passwordResetEmailTemplate(resetUrl);

  await sendEmail({
    to: user.email,
    subject: resetEmail.subject,
    html: resetEmail.html,
  });

  return {
    ok: true,
    message: "Bu e-posta kayıtlıysa şifre sıfırlama bağlantısı gönderildi.",
  };
}

export async function resetPasswordAction(
  _previousState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  await assertSameOriginRequest();

  const parsed = resetPasswordSchema.safeParse({
    token: formData.get("token"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Geçersiz istek.",
    };
  }

  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { token: parsed.data.token },
    include: {
      user: true,
    },
  });

  if (!resetToken || resetToken.expiresAt < new Date()) {
    return {
      ok: false,
      message: "Bu sıfırlama bağlantısı geçersiz veya süresi dolmuş.",
    };
  }

  const passwordHash = await hashPassword(parsed.data.password);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: resetToken.userId },
      data: { passwordHash },
    }),
    prisma.passwordResetToken.delete({
      where: { id: resetToken.id },
    }),
  ]);

  return {
    ok: true,
    message: "Şifreniz başarıyla sıfırlandı.",
  };
}
