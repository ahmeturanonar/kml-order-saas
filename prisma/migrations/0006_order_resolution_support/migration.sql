ALTER TABLE "Order"
ADD COLUMN "resolution" TEXT NOT NULL DEFAULT '250m';

ALTER TABLE "Order"
ADD CONSTRAINT "Order_resolution_check"
CHECK ("resolution" IN ('250m', '30m'));
