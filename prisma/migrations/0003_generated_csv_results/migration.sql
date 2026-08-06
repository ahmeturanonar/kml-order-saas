CREATE TABLE IF NOT EXISTS "GeneratedFile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "originalFileName" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GeneratedFile_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "GeneratedFile_orderId_key" ON "GeneratedFile"("orderId");
CREATE INDEX IF NOT EXISTS "GeneratedFile_userId_createdAt_idx" ON "GeneratedFile"("userId", "createdAt");

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'GeneratedFile_userId_fkey'
    ) THEN
        ALTER TABLE "GeneratedFile"
        ADD CONSTRAINT "GeneratedFile_userId_fkey"
        FOREIGN KEY ("userId") REFERENCES "User"("id")
        ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'GeneratedFile_orderId_fkey'
    ) THEN
        ALTER TABLE "GeneratedFile"
        ADD CONSTRAINT "GeneratedFile_orderId_fkey"
        FOREIGN KEY ("orderId") REFERENCES "Order"("id")
        ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
