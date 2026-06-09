-- CreateEnum
CREATE TYPE "PromoRewardType" AS ENUM ('EGG');

-- CreateEnum
CREATE TYPE "EggRarity" AS ENUM ('COMMON', 'UNCOMMON', 'RARE', 'EPIC', 'LEGENDARY', 'MYTHIC');

-- CreateEnum
CREATE TYPE "IncubatorType" AS ENUM ('INFINITE');

-- CreateEnum
CREATE TYPE "EggStatus" AS ENUM ('INVENTORY', 'INCUBATING', 'HATCHED');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "boxesUnlocked" INTEGER NOT NULL DEFAULT 8,
ADD COLUMN     "pokemonedas" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "totalOrdersCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "totalSpent" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "vipTierId" TEXT;

-- CreateTable
CREATE TABLE "VipTier" (
    "id" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "minSpent" DECIMAL(10,2) NOT NULL,
    "minOrders" INTEGER NOT NULL,
    "cashbackPercent" DECIMAL(5,2) NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#000000',
    "iconImage" TEXT NOT NULL DEFAULT 'https://placeholder.co/100',
    "perks" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VipTier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PromoCode" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "isUsed" BOOLEAN NOT NULL DEFAULT false,
    "usedById" TEXT,
    "usedAt" TIMESTAMP(3),
    "rewardType" "PromoRewardType" NOT NULL DEFAULT 'EGG',
    "rarity" "EggRarity" NOT NULL DEFAULT 'COMMON',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PromoCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserIncubator" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "IncubatorType" NOT NULL DEFAULT 'INFINITE',
    "usesLeft" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserIncubator_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PokemonEgg" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "rarity" "EggRarity" NOT NULL,
    "status" "EggStatus" NOT NULL DEFAULT 'INVENTORY',
    "incubatorId" TEXT,
    "incubatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PokemonEgg_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PokemonInstance" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "pokedexNumber" INTEGER NOT NULL,
    "boxNumber" INTEGER NOT NULL,
    "slotNumber" INTEGER NOT NULL,
    "stats" JSONB,
    "eggId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PokemonInstance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "VipTier_level_key" ON "VipTier"("level");

-- CreateIndex
CREATE UNIQUE INDEX "PromoCode_code_key" ON "PromoCode"("code");

-- CreateIndex
CREATE UNIQUE INDEX "PokemonInstance_eggId_key" ON "PokemonInstance"("eggId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_vipTierId_fkey" FOREIGN KEY ("vipTierId") REFERENCES "VipTier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromoCode" ADD CONSTRAINT "PromoCode_usedById_fkey" FOREIGN KEY ("usedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserIncubator" ADD CONSTRAINT "UserIncubator_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PokemonEgg" ADD CONSTRAINT "PokemonEgg_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PokemonEgg" ADD CONSTRAINT "PokemonEgg_incubatorId_fkey" FOREIGN KEY ("incubatorId") REFERENCES "UserIncubator"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PokemonInstance" ADD CONSTRAINT "PokemonInstance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PokemonInstance" ADD CONSTRAINT "PokemonInstance_eggId_fkey" FOREIGN KEY ("eggId") REFERENCES "PokemonEgg"("id") ON DELETE SET NULL ON UPDATE CASCADE;
