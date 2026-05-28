-- CreateTable
CREATE TABLE "ReservationPeriod" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "opensAt" TIMESTAMP(3) NOT NULL,
    "closesAt" TIMESTAMP(3) NOT NULL,
    "deliveryDate" TIMESTAMP(3),
    "couponId" TEXT,
    "productIds" TEXT[],
    "badgeText" TEXT NOT NULL DEFAULT 'RESERVA',
    "popupEnabled" BOOLEAN NOT NULL DEFAULT true,
    "maxUnits" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReservationPeriod_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ReservationPeriod_isActive_closesAt_idx" ON "ReservationPeriod"("isActive", "closesAt");

-- CreateIndex
CREATE INDEX "ReservationPeriod_opensAt_idx" ON "ReservationPeriod"("opensAt");

-- AddForeignKey
ALTER TABLE "ReservationPeriod" ADD CONSTRAINT "ReservationPeriod_couponId_fkey" FOREIGN KEY ("couponId") REFERENCES "Coupon"("id") ON DELETE SET NULL ON UPDATE CASCADE;
