import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { getUploadDir } from "@/lib/env";

export function getAbsoluteUploadDir() {
  const configuredDir = getUploadDir();
  return path.isAbsolute(configuredDir)
    ? configuredDir
    : path.join(/* turbopackIgnore: true */ process.cwd(), configuredDir);
}

export async function ensureUploadDirectory(userId: string) {
  const directory = path.join(getAbsoluteUploadDir(), userId);
  await fs.mkdir(directory, { recursive: true });
  return directory;
}

export async function saveUploadedKml(params: {
  userId: string;
  fileName: string;
  arrayBuffer: ArrayBuffer;
}) {
  const directory = await ensureUploadDirectory(params.userId);
  const filePath = path.join(directory, params.fileName);
  await fs.writeFile(filePath, Buffer.from(params.arrayBuffer));
  return filePath;
}

export async function saveGeneratedCsv(params: {
  userId: string;
  fileName: string;
  buffer: Buffer;
}) {
  const directory = await ensureUploadDirectory(params.userId);
  const filePath = path.join(directory, params.fileName);
  await fs.writeFile(filePath, params.buffer);
  return filePath;
}

export async function deleteStoredFile(filePath: string) {
  await fs.rm(filePath, { force: true });
}

export async function computeFileHash(arrayBuffer: ArrayBuffer) {
  return crypto.createHash("sha256").update(Buffer.from(arrayBuffer)).digest("hex");
}
