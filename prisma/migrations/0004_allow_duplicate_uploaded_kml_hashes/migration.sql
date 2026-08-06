DROP INDEX IF EXISTS "UploadedFile_userId_fileHash_key";

CREATE INDEX IF NOT EXISTS "UploadedFile_userId_fileHash_idx"
ON "UploadedFile"("userId", "fileHash");
