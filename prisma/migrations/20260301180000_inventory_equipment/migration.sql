-- CreateEnum
CREATE TYPE "ItemType" AS ENUM ('WEAPON', 'ARMOR', 'POTION');

-- AlterTable ItemCatalog: add new columns, migrate kind -> itemType, drop slug and kind
ALTER TABLE "ItemCatalog" ADD COLUMN "itemType" "ItemType";
UPDATE "ItemCatalog" SET "itemType" = CASE
  WHEN "kind" = 'WEAPON' THEN 'WEAPON'::"ItemType"
  WHEN "kind" = 'ARMOR' THEN 'ARMOR'::"ItemType"
  WHEN "kind" = 'POTION' OR "kind" = 'CONSUMABLE' THEN 'POTION'::"ItemType"
  ELSE 'POTION'::"ItemType"
END;
ALTER TABLE "ItemCatalog" ALTER COLUMN "itemType" SET NOT NULL;

ALTER TABLE "ItemCatalog" ADD COLUMN "attackBonus" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "ItemCatalog" ADD COLUMN "defenseBonus" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "ItemCatalog" ADD COLUMN "healPercent" INTEGER NOT NULL DEFAULT 25;
ALTER TABLE "ItemCatalog" ADD COLUMN "sellValueCoins" INTEGER NOT NULL DEFAULT 0;

DROP INDEX IF EXISTS "ItemCatalog_slug_key";
ALTER TABLE "ItemCatalog" DROP CONSTRAINT IF EXISTS "ItemCatalog_slug_key";
ALTER TABLE "ItemCatalog" DROP COLUMN IF EXISTS "slug";
ALTER TABLE "ItemCatalog" DROP COLUMN IF EXISTS "kind";

CREATE UNIQUE INDEX "ItemCatalog_name_key" ON "ItemCatalog"("name");

-- AlterTable RunInventoryItem: drop updatedAt
ALTER TABLE "RunInventoryItem" DROP COLUMN IF EXISTS "updatedAt";

-- AlterTable RunEquipment: runId as primary key (drop id)
ALTER TABLE "RunEquipment" DROP CONSTRAINT "RunEquipment_pkey";
DROP INDEX IF EXISTS "RunEquipment_runId_key";
ALTER TABLE "RunEquipment" DROP COLUMN "id";
ALTER TABLE "RunEquipment" ADD CONSTRAINT "RunEquipment_pkey" PRIMARY KEY ("runId");
