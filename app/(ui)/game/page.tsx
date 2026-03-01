"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import Link from "next/link";

type RunStatus = {
  id: string;
  seed: number;
  level: number;
  xp: number;
  hp: number;
  hpMax: number;
  coins: number;
  baseStats: { attack: number; defense: number; luck: number; hpMax: number };
  effectiveStats: { attack: number; defense: number; luck: number; hpMax: number };
  equipped: { weapon: string | null; armor: string | null };
  lastOutcome: string;
};

type Enemy = {
  choiceId: string;
  tier: string;
  name: string;
  species: string;
  level: number;
  preview: { estimatedLootCoinsMin: number; estimatedLootCoinsMax: number };
};

function GamePageInner() {
  const searchParams = useSearchParams();
  const slotIndex = searchParams.get("slotIndex");
  const [status, setStatus] = useState<{ slotIndex: number; run: RunStatus } | null>(null);
  const [enemies, setEnemies] = useState<Enemy[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        const [statusRes, enemiesRes] = await Promise.all([
          fetch(`/api/game/status?slotIndex=${slotNum}`, { credentials: "include" }),
          fetch(`/api/game/enemies?slotIndex=${slotNum}`, { credentials: "include" }),
        ]);
        if (statusRes.status === 401 || enemiesRes.status === 401) {
          window.location.href = "/login";
          return;
        }
        if (!statusRes.ok) {
          const d = (await statusRes.json()) as { error?: { message?: string } };
          setError(d.error?.message ?? "Failed to load status");
          return;
        }
        if (!enemiesRes.ok) {
          const d = (await enemiesRes.json()) as { error?: { message?: string } };
          setError(d.error?.message ?? "Failed to load enemies");
          return;
        }
        const statusData = (await statusRes.json()) as { slotIndex: number; run: RunStatus };
        const enemiesData = (await enemiesRes.json()) as { enemies: Enemy[] };
        if (!cancelled) {
          setStatus(statusData);
          setEnemies(enemiesData.enemies);
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

  if (!validSlot) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12">
        <p className="text-red-400">Invalid slot.</p>
        <Link href="/slots" className="mt-4 inline-block text-sm text-zinc-400 hover:text-zinc-200">
          ← Back to slots
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 text-center text-zinc-400">
        Loading game...
      </div>
    );
  }

  if (error || !status) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12">
        <p className="text-red-400">{error ?? "Failed to load game"}</p>
        <Link href="/slots" className="mt-4 inline-block text-sm text-zinc-400 hover:text-zinc-200">
          ← Back to slots
        </Link>
      </div>
    );
  }

  const { run } = status;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-2xl font-bold text-zinc-100">Game Hub</h1>
      <p className="text-zinc-400">Slot {status.slotIndex}</p>

      {/* Status bar */}
      <div className="mt-6 rounded-lg border border-zinc-700 bg-zinc-900 p-4">
        <h2 className="text-sm font-medium text-zinc-400">Status</h2>
        <div className="mt-2 flex flex-wrap gap-6">
          <span className="text-zinc-200">
            HP: {run.hp} / {run.hpMax}
          </span>
          <span className="text-zinc-200">Coins: {run.coins}</span>
          <span className="text-zinc-200">
            Level {run.level} (XP: {run.xp})
          </span>
        </div>
        <div className="mt-3 flex flex-wrap gap-4 text-sm text-zinc-500">
          <span>Attack: {run.effectiveStats.attack}</span>
          <span>Defense: {run.effectiveStats.defense}</span>
          <span>Luck: {run.effectiveStats.luck}</span>
          <span>HP Max: {run.effectiveStats.hpMax}</span>
        </div>
      </div>

      {/* Enemy cards */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-zinc-200">Enemies</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {enemies?.map((e) => (
            <div
              key={e.choiceId}
              className="rounded-lg border border-zinc-700 bg-zinc-900 p-4"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-zinc-400">{e.tier}</span>
                <span className="text-xs text-zinc-500">Lv.{e.level}</span>
              </div>
              <p className="mt-2 font-medium text-zinc-100">{e.name}</p>
              <p className="text-sm text-zinc-500">{e.species}</p>
              <p className="mt-2 text-xs text-zinc-500">
                Loot: {e.preview.estimatedLootCoinsMin}–{e.preview.estimatedLootCoinsMax} coins
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Placeholders */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-dashed border-zinc-700 bg-zinc-900/50 p-4">
          <h2 className="text-sm font-medium text-zinc-500">Inventory</h2>
          <p className="mt-2 text-sm text-zinc-600">No actions yet (Phase 1B).</p>
        </div>
        <div className="rounded-lg border border-dashed border-zinc-700 bg-zinc-900/50 p-4">
          <h2 className="text-sm font-medium text-zinc-500">Stats</h2>
          <p className="mt-2 text-sm text-zinc-600">Base stats shown above.</p>
        </div>
      </div>

      <Link href="/slots" className="mt-8 inline-block text-sm text-zinc-500 hover:text-zinc-300">
        ← Back to slots
      </Link>
    </div>
  );
}

export default function GamePage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-4xl px-4 py-12 text-center text-zinc-400">Loading...</div>}>
      <GamePageInner />
    </Suspense>
  );
}
