import { z } from "zod";

export const ELEVATION_RESOLUTIONS = ["250m", "30m"] as const;
export type ElevationResolution = (typeof ELEVATION_RESOLUTIONS)[number];

export const DEFAULT_ELEVATION_RESOLUTION: ElevationResolution = "250m";

export const elevationResolutionSchema = z.enum(ELEVATION_RESOLUTIONS, {
  error: "Gecersiz elevation cozunurlugu.",
});

export const ELEVATION_RESOLUTION_OPTIONS: Array<{
  value: ElevationResolution;
  title: string;
  description: string;
  detail?: string;
}> = [
  {
    value: "250m",
    title: "Standart",
    description: "Genel kullanim icin uygun.",
  },
  {
    value: "30m",
    title: "Yuksek Cozunurluk",
    description: "Daha detayli arazi verisi.",
    detail: "Profesyonel kullanim icin onerilir.",
  },
];

export function normalizeElevationResolution(
  value: string | null | undefined,
): ElevationResolution {
  const parsed = elevationResolutionSchema.safeParse(value);
  return parsed.success ? parsed.data : DEFAULT_ELEVATION_RESOLUTION;
}

export function getElevationResolutionLabel(value: string | null | undefined) {
  const normalized = normalizeElevationResolution(value);

  return normalized === "30m"
    ? "Yuksek Cozunurluk (30m)"
    : "Standart (250m)";
}
