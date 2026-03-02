"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import type { InventoryItem, RunStatus } from "@/shared/zod/game";
import type { SummaryResponse } from "@/shared/zod/game";
import { SummaryModal } from "@/components/SummaryModal";
import { gameErrorMessage } from "@/src/ui/errors/gameErrors";
import { labels, screenCopy, actionLabels } from "@/src/ui/theme/copy";
import { panel, card, buttonPrimary, buttonGhost, badgeTier } from "@/src/ui/theme/classnames";
import type { BadgeTier } from "@/src/ui/theme/classnames";

type GameStatus = { slotIndex: number; run: RunStatus };

type Enemy = {
  choiceId: string;
  tier: string;
  name: string;
  species: string;
  level: number;
  preview: { estimatedLootCoinsMin: number; estimatedLootCoinsMax: number };
};

type InventoryWithStatus = { status: GameStatus; inventory: InventoryItem[] };

type ApiError = { error: { code: string; message: string } };

function GamePageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const slotIndex = searchParams.get("slotIndex");
  const messageParam = searchParams.get("message");
  const [status, setStatus] = useState<GameStatus | null>(null);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [enemies, setEnemies] = useState<Enemy[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionPending, setActionPending] = useState<string | null>(null);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [summary, setSummary] = useState<SummaryResponse | null>(null);
  const [summaryAckPending, setSummaryAckPending] = useState(false);
  const [summaryAckError, setSummaryAckError] = useState<string | null>(null);
  const [lastSummaryOutcome, setLastSummaryOutcome] = useState<"WIN" | "RETREAT" | "DEFEAT" | null>(
    null
  );
  const [encounterStartError, setEncounterStartError] = useState<string | null>(null);
  const [encounterActive, setEncounterActive] = useState(false);
  const [fightPending, setFightPending] = useState<string | null>(null);

  const validSlot = slotIndex && ["1", "2", "3"].includes(slotIndex);
  const slotNum = validSlot ? slotIndex : "1";

  useEffect(() => {
    if (!validSlot) {
      setLoading(false);
      setError("Invalid slot");
      return;
    }
    let cancelled = false;
    async function load() {
      try {
        const [inventoryRes, enemiesRes, summaryRes] = await Promise.all([
          fetch(`/api/game/inventory?slotIndex=${slotNum}`, { credentials: "include" }),
          fetch(`/api/game/enemies?slotIndex=${slotNum}`, { credentials: "include" }),
          fetch(`/api/game/summary?slotIndex=${slotNum}`, { credentials: "include" }),
        ]);
        if (inventoryRes.status === 401 || enemiesRes.status === 401) {
          window.location.href = "/login";
          return;
        }
        if (!inventoryRes.ok) {
          const d = (await inventoryRes.json()) as ApiError;
          if (!cancelled) setError(gameErrorMessage(d.error?.code, "Failed to load game"));
          return;
        }
        if (!enemiesRes.ok) {
          const d = (await enemiesRes.json()) as ApiError;
          if (!cancelled) setError(gameErrorMessage(d.error?.code, "Failed to load enemies"));
          return;
        }
        const invData = (await inventoryRes.json()) as InventoryWithStatus;
        const enemiesData = (await enemiesRes.json()) as { enemies: Enemy[] };
        if (!cancelled) {
          setStatus(invData.status);
          setInventory(invData.inventory);
          setEnemies(enemiesData.enemies);
        }
        if (summaryRes.ok) {
          const summaryData = (await summaryRes.json()) as SummaryResponse;
          if (!cancelled) setSummary(summaryData);
        }
      } catch {
        if (!cancelled) setError("Network error");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [slotNum, validSlot]);

  async function handleEquip(itemId: string, equipmentSlot: "weapon" | "armor") {
    const key = `equip-${itemId}`;
    setActionPending(key);
    try {
      const res = await fetch("/api/game/equip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          slotIndex: Number(slotNum),
          equipmentSlot,
          inventoryItemId: itemId,
        }),
      });
      const data = (await res.json()) as InventoryWithStatus | ApiError;
      if (res.ok && "status" in data) {
        setStatus(data.status);
        setInventory(data.inventory);
      } else if (!res.ok && "error" in data) {
        setError(gameErrorMessage((data as ApiError).error?.code, "Equip failed"));
      }
    } finally {
      setActionPending(null);
    }
  }

  async function handleUnequip(equipmentSlot: "weapon" | "armor") {
    const key = `unequip-${equipmentSlot}`;
    setActionPending(key);
    try {
      const res = await fetch("/api/game/unequip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ slotIndex: Number(slotNum), equipmentSlot }),
      });
      const data = (await res.json()) as InventoryWithStatus | ApiError;
      if (res.ok && "status" in data) {
        setStatus(data.status);
        setInventory(data.inventory);
      } else if (!res.ok && "error" in data) {
        setError(gameErrorMessage((data as ApiError).error?.code, "Unequip failed"));
      }
    } finally {
      setActionPending(null);
    }
  }

  async function handleUse(itemId: string) {
    const key = `use-${itemId}`;
    setActionPending(key);
    try {
      const res = await fetch("/api/game/use", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ slotIndex: Number(slotNum), inventoryItemId: itemId }),
      });
      const data = (await res.json()) as InventoryWithStatus | ApiError;
      if (res.ok && "status" in data) {
        setStatus(data.status);
        setInventory(data.inventory);
      } else if (!res.ok && "error" in data) {
        setError(gameErrorMessage((data as ApiError).error?.code, "Use failed"));
      }
    } finally {
      setActionPending(null);
    }
  }

  async function handleSell(itemId: string) {
    const key = `sell-${itemId}`;
    setActionPending(key);
    try {
      const res = await fetch("/api/game/sell", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ slotIndex: Number(slotNum), inventoryItemId: itemId }),
      });
      const data = (await res.json()) as InventoryWithStatus | ApiError;
      if (res.ok && "status" in data) {
        setStatus(data.status);
        setInventory(data.inventory);
      } else if (!res.ok && "error" in data) {
        setError(gameErrorMessage((data as ApiError).error?.code, "Sell failed"));
      }
    } finally {
      setActionPending(null);
    }
  }

  async function handleStartEncounter(choiceId: string) {
    if (summary) return;
    setEncounterStartError(null);
    setEncounterActive(false);
    setFightPending(choiceId);
    try {
      const res = await fetch("/api/game/encounter/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ slotIndex: Number(slotNum), choiceId }),
      });
      const data = (await res.json()) as { encounterId?: string } | ApiError;
      if (res.ok) {
        router.push(`/combat?slotIndex=${slotNum}`);
        return;
      }
      const err = data as ApiError;
      setEncounterActive(err.error?.code === "ENCOUNTER_ACTIVE");
      setEncounterStartError(gameErrorMessage(err.error?.code, "Failed to start encounter"));
    } catch {
      setEncounterStartError("Network error");
    } finally {
      setFightPending(null);
    }
  }

  async function handleSummaryContinue() {
    if (!summary) return;
    setSummaryAckError(null);
    setSummaryAckPending(true);
    try {
      const res = await fetch("/api/game/summary/ack", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ slotIndex: Number(slotNum) }),
      });
      const data = (await res.json()) as InventoryWithStatus | ApiError;
      if (res.ok && "status" in data) {
        setStatus(data.status);
        setInventory(data.inventory);
        setLastSummaryOutcome(summary.outcome);
        setSummary(null);
        setSummaryAckError(null);
      } else {
        setSummaryAckError(gameErrorMessage((data as ApiError).error?.code, "Failed to continue"));
      }
    } catch {
      setSummaryAckError("Network error");
    } finally {
      setSummaryAckPending(false);
    }
  }

  if (!validSlot) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12">
        <p className="text-red-400">Invalid slot.</p>
        <Link href="/slots" className="mt-4 inline-block text-sm text-zinc-400 hover:text-zinc-200 min-h-[44px] flex items-center">
          {actionLabels.backToSlots}
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-48 rounded bg-zinc-700" />
          <div className="h-32 rounded-lg bg-zinc-800" />
          <div className="h-40 rounded-lg bg-zinc-800" />
          <div className="h-48 rounded-lg bg-zinc-800" />
        </div>
      </div>
    );
  }

  if (error || !status) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12">
        <p className="text-red-400">{error ?? "Failed to load game"}</p>
        <Link href="/slots" className="mt-4 inline-block text-sm text-zinc-400 hover:text-zinc-200 min-h-[44px] flex items-center">
          {actionLabels.backToSlots}
        </Link>
      </div>
    );
  }

  const { run } = status;
  const showRecoveryBanner = lastSummaryOutcome === "DEFEAT" && run.hp <= 0;
  const hasPotion = inventory.some((i) => i.catalog.itemType === "POTION");
  const showRunOverPanel = showRecoveryBanner && !hasPotion;
  const debugOn =
    typeof process.env.NEXT_PUBLIC_DEBUG !== "undefined" &&
    process.env.NEXT_PUBLIC_DEBUG === "true";

  return (
    <div className="mx-auto max-w-4xl px-4 py-8" data-testid="page-game">
      {debugOn && status && (
        <div className="mb-4 rounded border border-zinc-600 bg-zinc-900 px-3 py-2 font-mono text-xs text-zinc-500">
          Debug: slotIndex={status.slotIndex} runSeed={status.run.seed}
        </div>
      )}
      {messageParam === "no_encounter" && (
        <p className="mb-4 rounded border border-amber-800 bg-amber-900/30 px-3 py-2 text-sm text-amber-200">
          No active encounter.
        </p>
      )}
      {encounterStartError && <p className="mb-4 text-sm text-amber-400">{encounterStartError}</p>}
      {encounterActive && (
        <div className="mb-4 flex items-center gap-3">
          <span className="text-sm text-amber-400">An encounter is in progress.</span>
          <Link
            href={`/combat?slotIndex=${slotNum}`}
            className="rounded bg-amber-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-amber-600"
          >
            {actionLabels.goToCombat}
          </Link>
        </div>
      )}
      {showRecoveryBanner && hasPotion && (
        <div className="mb-4 rounded border border-amber-700 bg-amber-900/40 px-4 py-3 text-amber-100">
          You&apos;re down! Use a potion to recover.
        </div>
      )}
      {showRunOverPanel && (
        <div className="mb-4 rounded-lg border border-red-800 bg-red-900/30 p-4">
          <h3 className="font-medium text-red-200">Run Over</h3>
          <p className="mt-1 text-sm text-red-300">You have no potions. Your run has ended.</p>
          <Link
            href="/slots"
            className="mt-3 inline-block rounded bg-zinc-600 px-4 py-2 text-sm font-medium text-zinc-100 hover:bg-zinc-500"
          >
            {actionLabels.backToSlots}
          </Link>
        </div>
      )}

      <h1 className="text-2xl font-bold text-zinc-100">{screenCopy.hub}</h1>
      <p className="text-zinc-400">{labels.Slot} {status.slotIndex}</p>

      {/* Status bar: Vitality / Rank / Ash */}
      <div className={`mt-6 ${panel()}`}>
        <h2 className="text-sm font-medium text-zinc-400">{labels.Slot}</h2>
        <div className="mt-2 flex flex-wrap gap-6">
          <span className="text-zinc-200">
            {labels.HP}: {run.hp} / {run.hpMax}
          </span>
          <span className="text-zinc-200">{labels.Coins}: {run.coins}</span>
          <span className="text-zinc-200">
            {labels.Level} {run.level} (XP: {run.xp})
          </span>
        </div>
        <div className="mt-3 flex flex-wrap gap-4 text-sm text-zinc-500">
          <span>Attack: {run.effectiveStats.attack}</span>
          <span>Defense: {run.effectiveStats.defense}</span>
          <span>Luck: {run.effectiveStats.luck}</span>
          <span>HP Max: {run.effectiveStats.hpMax}</span>
        </div>
      </div>

      {/* Omen cards */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-zinc-200">{labels.Enemy}s</h2>
        <div className="mt-4 grid gap-4 grid-cols-1 sm:grid-cols-3">
          {enemies?.map((e, index) => (
            <div
              key={e.choiceId}
              data-testid={`omen-card-${index}`}
              className={card()}
            >
              <div className="flex items-center justify-between">
                <span className={badgeTier((e.tier as BadgeTier) ?? "NORMAL")} data-testid="enemy-tier">
                  {e.tier}
                </span>
                <span className="text-xs text-zinc-500">Lv.{e.level}</span>
              </div>
              <p className="mt-2 text-xs font-medium text-amber-500/90 uppercase">{labels.Enemy}</p>
              <p className="mt-1 font-medium text-zinc-100" data-testid="enemy-name">
                {e.name}
              </p>
              <p className="text-sm text-zinc-500" data-testid="enemy-species">
                {e.species}
              </p>
              <p className="mt-2 text-xs text-zinc-500">
                Loot: {e.preview.estimatedLootCoinsMin}–{e.preview.estimatedLootCoinsMax} {labels.Coins.toLowerCase()}
              </p>
              <div className="mt-3">
                <button
                  type="button"
                  disabled={!!summary || fightPending !== null}
                  onClick={() => handleStartEncounter(e.choiceId)}
                  className={`w-full min-h-[44px] ${buttonPrimary()} bg-red-700 hover:bg-red-600`}
                  data-testid="btn-confront"
                >
                  {fightPending === e.choiceId ? "…" : actionLabels.confront}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Relics panel */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-zinc-200">{labels.Inventory}</h2>
        {inventory.length === 0 ? (
          <p className="mt-2 text-sm text-zinc-500">No items.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {inventory.map((item) => {
              const isEquippedWeapon = run.equipped.weapon === item.id;
              const isEquippedArmor = run.equipped.armor === item.id;
              const isEquipped = isEquippedWeapon || isEquippedArmor;
              const isWeaponOrArmor =
                item.catalog.itemType === "WEAPON" || item.catalog.itemType === "ARMOR";
              const isPotion = item.catalog.itemType === "POTION";
              const pending = actionPending !== null;
              const selected = selectedItemId === item.id;

              return (
                <li
                  key={item.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedItemId(selectedItemId === item.id ? null : item.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setSelectedItemId(selectedItemId === item.id ? null : item.id);
                    }
                  }}
                  className={`cursor-pointer rounded-lg border p-4 ${
                    selected ? "border-amber-500 bg-zinc-800" : "border-zinc-700 bg-zinc-900"
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-zinc-100">{item.catalog.name}</p>
                      <p className="text-xs text-zinc-500 uppercase">{item.catalog.itemType}</p>
                      <div className="mt-1 flex flex-wrap gap-3 text-sm text-zinc-400">
                        {item.catalog.attackBonus > 0 && (
                          <span>+{item.catalog.attackBonus} Attack</span>
                        )}
                        {item.catalog.defenseBonus > 0 && (
                          <span>+{item.catalog.defenseBonus} Defense</span>
                        )}
                        {isPotion && <span>Heal {item.catalog.healPercent}%</span>}
                        {isWeaponOrArmor && item.catalog.requiredLevel != null && (
                          <span data-testid="item-required-level">
                            Requires Level {item.catalog.requiredLevel}
                          </span>
                        )}
                        <span>×{item.quantity}</span>
                        <span>Sell: {item.catalog.sellValueCoins * item.quantity} {labels.Coins.toLowerCase()}</span>
                      </div>
                      {isEquipped && (
                        <p className="mt-1 text-xs text-amber-400">
                          Equipped {isEquippedWeapon ? "as weapon" : "as armor"}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2" onClick={(e) => e.stopPropagation()}>
                      {isWeaponOrArmor && (
                        <>
                          {!isEquipped ? (
                            (() => {
                              const reqLevel = item.catalog.requiredLevel ?? 1;
                              const belowLevel =
                                reqLevel > 1 && run.level < reqLevel;
                              return (
                                <button
                                  type="button"
                                  disabled={pending || belowLevel}
                                  title={
                                    belowLevel
                                      ? `Requires level ${reqLevel} (you are level ${run.level})`
                                      : undefined
                                  }
                                  onClick={() =>
                                    handleEquip(
                                      item.id,
                                      item.catalog.itemType === "WEAPON" ? "weapon" : "armor"
                                    )
                                  }
                                  className={`min-h-[44px] min-w-[44px] ${buttonGhost()} text-sm`}
                                >
                                  {belowLevel ? `Equip (Lv.${reqLevel})` : actionLabels.equip}
                                </button>
                              );
                            })()
                          ) : (
                            <button
                              type="button"
                              disabled={pending}
                              onClick={() => handleUnequip(isEquippedWeapon ? "weapon" : "armor")}
                              className={`min-h-[44px] min-w-[44px] ${buttonGhost()} text-sm`}
                            >
                              {actionLabels.unequip}
                            </button>
                          )}
                        </>
                      )}
                      {isPotion && (
                        <button
                          type="button"
                          disabled={pending}
                          onClick={() => handleUse(item.id)}
                          className={`min-h-[44px] min-w-[44px] rounded-lg bg-emerald-700 px-3 py-1.5 text-sm text-white hover:bg-emerald-600 disabled:opacity-50`}
                        >
                          {actionLabels.use}
                        </button>
                      )}
                      {!isEquipped && (
                        <button
                          type="button"
                          disabled={pending}
                          onClick={() => handleSell(item.id)}
                          className={`min-h-[44px] min-w-[44px] ${buttonGhost()} text-sm`}
                        >
                          {actionLabels.sell}
                        </button>
                      )}
                    </div>
                  </div>
                  {selected && isWeaponOrArmor && (
                    <div
                      className="mt-3 border-t border-zinc-700 pt-3 text-sm text-zinc-400"
                      role="presentation"
                    >
                      {item.catalog.itemType === "WEAPON" && (
                        <p>
                          Attack: {run.effectiveStats.attack} →{" "}
                          {run.baseStats.attack + item.catalog.attackBonus}
                        </p>
                      )}
                      {item.catalog.itemType === "ARMOR" && (
                        <p>
                          Defense: {run.effectiveStats.defense} →{" "}
                          {run.baseStats.defense + item.catalog.defenseBonus}
                        </p>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <Link href="/slots" className="mt-8 inline-block text-sm text-zinc-500 hover:text-zinc-300 min-h-[44px] flex items-center">
        {actionLabels.backToSlots}
      </Link>

      {summary && (
        <SummaryModal
          summary={summary}
          onContinue={handleSummaryContinue}
          ackPending={summaryAckPending}
          ackError={summaryAckError}
        />
      )}
    </div>
  );
}

export default function GamePage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-4xl px-4 py-12 text-center text-zinc-400">Loading...</div>
      }
    >
      <GamePageInner />
    </Suspense>
  );
}
