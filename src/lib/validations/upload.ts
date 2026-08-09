import path from "node:path";
import { z } from "zod";
import {
  DEFAULT_ELEVATION_RESOLUTION,
  elevationResolutionSchema,
} from "@/lib/elevation-resolution";
import {
  ALLOWED_KML_EXTENSIONS,
  ALLOWED_KML_MIME_TYPES,
  MAX_KML_FILE_SIZE_BYTES,
} from "@/lib/constants";

export class UploadValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UploadValidationError";
  }
}

export const uploadSchema = z.object({
  fileName: z.string().min(1),
  mimeType: z.string().min(1),
  fileSize: z.number().int().positive().max(MAX_KML_FILE_SIZE_BYTES),
});

export const uploadResolutionSchema = z.object({
  resolution: elevationResolutionSchema.default(DEFAULT_ELEVATION_RESOLUTION),
});

export function validateKmlFile(file: File) {
  const parsed = uploadSchema.safeParse({
    fileName: file.name,
    mimeType: file.type || "application/octet-stream",
    fileSize: file.size,
  });

  if (!parsed.success) {
    throw new UploadValidationError(
      parsed.error.issues[0]?.message ?? "Gecersiz dosya.",
    );
  }

  const extension = path.extname(file.name).toLowerCase();
  if (!ALLOWED_KML_EXTENSIONS.includes(extension)) {
    throw new UploadValidationError("Yalnizca .kml dosyalarina izin verilir.");
  }

  if (
    file.type &&
    !ALLOWED_KML_MIME_TYPES.includes(file.type.toLowerCase())
  ) {
    throw new UploadValidationError("Desteklenmeyen dosya turu.");
  }
}

export function validateUploadResolution(value: FormDataEntryValue | null) {
  const parsed = uploadResolutionSchema.safeParse({
    resolution: typeof value === "string" ? value : undefined,
  });

  if (!parsed.success) {
    throw new UploadValidationError(
      parsed.error.issues[0]?.message ?? "Gecersiz elevation cozunurlugu.",
    );
  }

  return parsed.data.resolution;
}
