import path from "node:path";
import { z } from "zod";
import {
  ALLOWED_KML_EXTENSIONS,
  ALLOWED_KML_MIME_TYPES,
  MAX_KML_FILE_SIZE_BYTES,
} from "@/lib/constants";

export const uploadSchema = z.object({
  fileName: z.string().min(1),
  mimeType: z.string().min(1),
  fileSize: z.number().int().positive().max(MAX_KML_FILE_SIZE_BYTES),
});

export function validateKmlFile(file: File) {
  const parsed = uploadSchema.safeParse({
    fileName: file.name,
    mimeType: file.type || "application/octet-stream",
    fileSize: file.size,
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Geçersiz dosya.");
  }

  const extension = path.extname(file.name).toLowerCase();
  if (!ALLOWED_KML_EXTENSIONS.includes(extension)) {
    throw new Error("Yalnızca .kml dosyalarına izin verilir.");
  }

  if (
    file.type &&
    !ALLOWED_KML_MIME_TYPES.includes(file.type.toLowerCase())
  ) {
    throw new Error("Desteklenmeyen dosya türü.");
  }
}
