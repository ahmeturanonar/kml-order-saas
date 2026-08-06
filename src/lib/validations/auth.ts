import { z } from "zod";

export const registerSchema = z
  .object({
    name: z.string().min(2).max(100),
    email: z.string().email(),
    password: z
      .string()
      .min(8)
      .max(100)
      .regex(/[A-Z]/, "Şifre en az bir büyük harf içermelidir.")
      .regex(/[a-z]/, "Şifre en az bir küçük harf içermelidir.")
      .regex(/[0-9]/, "Şifre en az bir rakam içermelidir."),
    confirmPassword: z.string().min(8),
  })
  .refine((value) => value.password === value.confirmPassword, {
    path: ["confirmPassword"],
    message: "Şifreler eşleşmiyor.",
  });

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export const resetPasswordSchema = z
  .object({
    token: z.string().min(10),
    password: z.string().min(8).max(100),
    confirmPassword: z.string().min(8),
  })
  .refine((value) => value.password === value.confirmPassword, {
    path: ["confirmPassword"],
    message: "Şifreler eşleşmiyor.",
  });
