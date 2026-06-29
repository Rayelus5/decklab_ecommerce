-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "marketplaceListingStatus" TEXT,
ADD COLUMN     "marketplaceListingUrl" TEXT,
ADD COLUMN     "marketplacePayOption" TEXT,
ADD COLUMN     "marketplacePlatform" TEXT,
ADD COLUMN     "marketplaceShipping" BOOLEAN NOT NULL DEFAULT false;
