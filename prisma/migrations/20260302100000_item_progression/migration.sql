-- Item progression (level brackets + drop filtering)
-- Add requiredLevel and powerScore to ItemCatalog

ALTER TABLE "ItemCatalog" ADD COLUMN "requiredLevel" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "ItemCatalog" ADD COLUMN "powerScore" INTEGER NOT NULL DEFAULT 1;
