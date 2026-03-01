-- CreateTable
CREATE TABLE "SaveSlot" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "slotIndex" INTEGER NOT NULL,
    "characterId" TEXT,
    "runId" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SaveSlot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Character" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "species" TEXT NOT NULL,
    "level" INTEGER NOT NULL DEFAULT 1,
    "xp" INTEGER NOT NULL DEFAULT 0,
    "baseAttack" INTEGER NOT NULL DEFAULT 0,
    "baseDefense" INTEGER NOT NULL DEFAULT 0,
    "baseLuck" INTEGER NOT NULL DEFAULT 0,
    "baseHpMax" INTEGER NOT NULL DEFAULT 10,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Character_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Run" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "characterId" TEXT NOT NULL,
    "seed" INTEGER NOT NULL,
    "fightCounter" INTEGER NOT NULL DEFAULT 0,
    "turnCounter" INTEGER NOT NULL DEFAULT 0,
    "hp" INTEGER NOT NULL,
    "coins" INTEGER NOT NULL DEFAULT 0,
    "lastOutcome" TEXT NOT NULL DEFAULT 'NONE',
    "stateJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Run_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CharacterStats" (
    "id" TEXT NOT NULL,
    "characterId" TEXT NOT NULL,
    "totalKills" INTEGER NOT NULL DEFAULT 0,
    "totalCoinsEarned" INTEGER NOT NULL DEFAULT 0,
    "enemiesBySpecies" JSONB NOT NULL DEFAULT '{}',
    "lastFightSummary" JSONB,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CharacterStats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItemCatalog" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ItemCatalog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RunInventoryItem" (
    "id" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "itemCatalogId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RunInventoryItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RunEquipment" (
    "id" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "weaponInventoryItemId" TEXT,
    "armorInventoryItemId" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RunEquipment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SaveSlot_userId_slotIndex_key" ON "SaveSlot"("userId", "slotIndex");

-- CreateIndex
CREATE UNIQUE INDEX "CharacterStats_characterId_key" ON "CharacterStats"("characterId");

-- CreateIndex
CREATE UNIQUE INDEX "ItemCatalog_slug_key" ON "ItemCatalog"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "RunEquipment_runId_key" ON "RunEquipment"("runId");

-- AddForeignKey
ALTER TABLE "SaveSlot" ADD CONSTRAINT "SaveSlot_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaveSlot" ADD CONSTRAINT "SaveSlot_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaveSlot" ADD CONSTRAINT "SaveSlot_runId_fkey" FOREIGN KEY ("runId") REFERENCES "Run"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Character" ADD CONSTRAINT "Character_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Run" ADD CONSTRAINT "Run_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Run" ADD CONSTRAINT "Run_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CharacterStats" ADD CONSTRAINT "CharacterStats_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RunInventoryItem" ADD CONSTRAINT "RunInventoryItem_runId_fkey" FOREIGN KEY ("runId") REFERENCES "Run"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RunInventoryItem" ADD CONSTRAINT "RunInventoryItem_itemCatalogId_fkey" FOREIGN KEY ("itemCatalogId") REFERENCES "ItemCatalog"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RunEquipment" ADD CONSTRAINT "RunEquipment_runId_fkey" FOREIGN KEY ("runId") REFERENCES "Run"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RunEquipment" ADD CONSTRAINT "RunEquipment_weaponInventoryItemId_fkey" FOREIGN KEY ("weaponInventoryItemId") REFERENCES "RunInventoryItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RunEquipment" ADD CONSTRAINT "RunEquipment_armorInventoryItemId_fkey" FOREIGN KEY ("armorInventoryItemId") REFERENCES "RunInventoryItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;
