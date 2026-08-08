import { z } from "zod";
import { normalizeCouponCode } from "@/lib/coupons";

const couponCodePattern = /^[A-Za-z0-9_-]+$/;

export const createCouponSchema = z.object({
  code: z
    .string()
    .trim()
    .min(1, "Kupon kodu boÅŸ bÄ±rakÄ±lamaz.")
    .max(32, "Kupon kodu Ã§ok uzun.")
    .regex(couponCodePattern, "Kupon kodu yalnÄ±zca A-Z, 0-9, - ve _ iÃ§erebilir.")
    .transform(normalizeCouponCode),
  creditAmount: z.coerce.number().int("Kredi miktarÄ± tam sayÄ± olmalÄ±dÄ±r.").positive("Kredi miktarÄ± pozitif olmalÄ±dÄ±r.").max(100000, "Kredi miktarÄ± Ã§ok yÃ¼ksek."),
  isActive: z.coerce.boolean().default(true),
});

export const redeemCouponSchema = z.object({
  code: z
    .string()
    .trim()
    .min(1, "Kupon kodu boÅŸ bÄ±rakÄ±lamaz.")
    .max(32, "Kupon kodu Ã§ok uzun.")
    .regex(couponCodePattern, "Kupon kodu yalnÄ±zca A-Z, 0-9, - ve _ iÃ§erebilir.")
    .transform(normalizeCouponCode),
});

export const couponStatusSchema = z.object({
  couponId: z.string().min(1, "Kupon kimliÄŸi gerekli."),
  isActive: z.coerce.boolean(),
});
