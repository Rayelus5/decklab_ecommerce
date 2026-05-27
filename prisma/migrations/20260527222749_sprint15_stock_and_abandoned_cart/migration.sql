-- AlterTable
ALTER TABLE "ProductVariant" ADD COLUMN     "reservedStock" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "AbandonedCart" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "stripeSessionId" TEXT NOT NULL,
    "cartItems" JSONB NOT NULL,
    "subtotal" DECIMAL(10,2) NOT NULL,
    "recoveryEmailSentAt" TIMESTAMP(3),
    "convertedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AbandonedCart_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AbandonedCart_stripeSessionId_key" ON "AbandonedCart"("stripeSessionId");

-- CreateIndex
CREATE INDEX "AbandonedCart_userId_idx" ON "AbandonedCart"("userId");

-- CreateIndex
CREATE INDEX "AbandonedCart_convertedAt_idx" ON "AbandonedCart"("convertedAt");

-- CreateIndex
CREATE INDEX "AbandonedCart_recoveryEmailSentAt_idx" ON "AbandonedCart"("recoveryEmailSentAt");

-- AddForeignKey
ALTER TABLE "AbandonedCart" ADD CONSTRAINT "AbandonedCart_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
