import { z } from "zod";
import { CREDIT_PACKAGES } from "@/lib/constants";

export const createCheckoutSchema = z.object({
  amount: z
    .number()
    .int()
    .refine((value) => CREDIT_PACKAGES.includes(value as (typeof CREDIT_PACKAGES)[number]), {
      message: "Geçersiz kredi paketi seçildi.",
    }),
});
