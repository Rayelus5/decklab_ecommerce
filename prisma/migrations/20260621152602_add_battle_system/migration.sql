-- CreateEnum
CREATE TYPE "BattleStatus" AS ENUM ('ACTIVE', 'PLAYER_WON', 'ENEMY_WON', 'ABANDONED');

-- CreateTable
CREATE TABLE "BattleSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "BattleStatus" NOT NULL DEFAULT 'ACTIVE',
    "playerPokemonId" TEXT NOT NULL,
    "playerCurrentHp" INTEGER NOT NULL,
    "enemyData" JSONB NOT NULL,
    "enemyCurrentHp" INTEGER NOT NULL,
    "turnLog" JSONB NOT NULL DEFAULT '[]',
    "rewardClaimed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BattleSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BattleSession_userId_status_idx" ON "BattleSession"("userId", "status");

-- CreateIndex
CREATE INDEX "BattleSession_userId_createdAt_idx" ON "BattleSession"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "BattleSession" ADD CONSTRAINT "BattleSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BattleSession" ADD CONSTRAINT "BattleSession_playerPokemonId_fkey" FOREIGN KEY ("playerPokemonId") REFERENCES "PokemonInstance"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
