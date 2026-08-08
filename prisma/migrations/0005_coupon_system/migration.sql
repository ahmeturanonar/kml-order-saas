CREATE TABLE "Coupon" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "normalizedCode" TEXT NOT NULL,
  "creditAmount" INTEGER NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "Coupon_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CouponRedemption" (
  "id" TEXT NOT NULL,
  "couponId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "creditAmount" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "CouponRedemption_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Coupon_normalizedCode_key" ON "Coupon"("normalizedCode");
CREATE INDEX "Coupon_isActive_createdAt_idx" ON "Coupon"("isActive", "createdAt");
CREATE UNIQUE INDEX "CouponRedemption_couponId_userId_key" ON "CouponRedemption"("couponId", "userId");
CREATE INDEX "CouponRedemption_couponId_createdAt_idx" ON "CouponRedemption"("couponId", "createdAt");
CREATE INDEX "CouponRedemption_userId_createdAt_idx" ON "CouponRedemption"("userId", "createdAt");

ALTER TABLE "CouponRedemption"
ADD CONSTRAINT "CouponRedemption_couponId_fkey"
FOREIGN KEY ("couponId") REFERENCES "Coupon"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "CouponRedemption"
ADD CONSTRAINT "CouponRedemption_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
