-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "consolidatedWithOrderId" TEXT;

-- CreateIndex
CREATE INDEX "Order_consolidatedWithOrderId_idx" ON "Order"("consolidatedWithOrderId");

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_consolidatedWithOrderId_fkey" FOREIGN KEY ("consolidatedWithOrderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;
