-- Add combat outcome counters to CharacterStats
ALTER TABLE "CharacterStats" ADD COLUMN "totalFights" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "CharacterStats" ADD COLUMN "wins" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "CharacterStats" ADD COLUMN "losses" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "CharacterStats" ADD COLUMN "retreats" INTEGER NOT NULL DEFAULT 0;
