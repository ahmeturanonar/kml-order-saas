import fs from "node:fs/promises";
import path from "node:path";
import { getAbsoluteUploadDir } from "@/lib/storage";

type StoredFileReference = {
  filePath: string;
  fileName: string;
  userId: string;
};

function encodeContentDispositionFilename(value: string) {
  return encodeURIComponent(value).replace(/['()*]/g, (char) =>
    `%${char.charCodeAt(0).toString(16).toUpperCase()}`,
  );
}

function toAsciiDownloadFilename(fileName: string) {
  const fallbackExtension = path.extname(fileName) || ".bin";
  const sanitized = path
    .basename(fileName)
    .normalize("NFKD")
    .replace(/[^\x20-\x7E]+/g, "")
    .replace(/["\\]/g, "_")
    .trim();

  return sanitized || `download${fallbackExtension}`;
}

export function buildDownloadHeaders(params: {
  downloadName: string;
  mimeType: string;
  size?: number;
}) {
  const asciiFileName = toAsciiDownloadFilename(params.downloadName);
  const encodedFileName = encodeContentDispositionFilename(path.basename(params.downloadName));

  return {
    "Content-Type": params.mimeType || "application/octet-stream",
    "Content-Disposition": `attachment; filename="${asciiFileName}"; filename*=UTF-8''${encodedFileName}`,
    "Cache-Control": "no-store",
    ...(params.size !== undefined ? { "Content-Length": params.size.toString() } : {}),
  };
}

export function resolveStoredFileCandidates(storedFile: StoredFileReference) {
  const storedPath = path.normalize(storedFile.filePath);
  const uploadDir = getAbsoluteUploadDir();
  const fallbackPath = path.join(uploadDir, storedFile.userId, storedFile.fileName);
  const resolvedStoredPath = path.isAbsolute(storedPath)
    ? storedPath
    : path.join(uploadDir, storedPath);

  return {
    uploadDir,
    storedPath,
    candidates: Array.from(new Set([resolvedStoredPath, fallbackPath])),
  };
}

export async function findExistingStoredFile(storedFile: StoredFileReference) {
  const { uploadDir, storedPath, candidates } = resolveStoredFileCandidates(storedFile);

  for (const candidate of candidates) {
    try {
      const stat = await fs.stat(candidate);
      if (stat.isFile()) {
        return {
          uploadDir,
          storedPath,
          resolvedPath: candidate,
          size: stat.size,
          candidates,
        };
      }
    } catch {
      continue;
    }
  }

  return {
    uploadDir,
    storedPath,
    resolvedPath: null,
    size: undefined,
    candidates,
  };
}
