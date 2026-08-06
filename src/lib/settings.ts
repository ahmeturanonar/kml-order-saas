import { prisma } from "@/lib/prisma";
import { DEFAULT_KML_PRICE } from "@/lib/constants";

export const APP_SETTING_KEYS = {
  kmlPrice: "pricing.kmlPrice",
} as const;

export async function getSettingValue(key: string) {
  const setting = await prisma.appSetting.findUnique({
    where: { key },
    select: { value: true },
  });

  return setting?.value ?? null;
}

export async function getKmlPrice() {
  const value = await getSettingValue(APP_SETTING_KEYS.kmlPrice);
  const parsed = value ? Number(value) : Number.NaN;

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return DEFAULT_KML_PRICE;
  }

  return parsed;
}
