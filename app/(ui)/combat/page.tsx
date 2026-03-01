"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState, useCallback, Suspense } from "react";
import Link from "next/link";
import type { CombatStateResponse } from "@/shared/zod/game";

type ApiError = { error: { code: string; message: string } };

function CombatPageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const slotIndexParam = searchParams.get("slotIndex");
  const [combat, setCombat] = useState<CombatStateResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionPending, setActionPending] = useState(false);

  const validSlot = slotIndexParam && ["1", "2", "3"].includes(slotIndexParam);
  const slotNum = validSlot ? slotIndexParam : "1";

  const fetchCombat = useCallback(async () => {
    const res = await fetch(`/api/game/combat?slotIndex=${slotNum}`, {
      credentials: "include",
    });
    if (res.status === 401) {
      window.location.href = "/login";
      return null;
    }
    const data = (await res.json()) as CombatStateResponse | ApiError;
    if (!res.ok) {
      const err = data as ApiError;
      if (err.error?.code === "NO_ACTIVE_ENCOUNTER") {
        router.replace(`/game?slotIndex=${slotNum}&message=no_encounter`);
        return null;
      }
      setError(err.error?.message ?? "Failed to load combat");
      return null;
    }
    setCombat(data as CombatStateResponse);
    setError(null);
    return data as CombatStateResponse;
  }, [slotNum, router]);

  useEffect(() => {
    if (!validSlot) {
      setLoading(false);
      setError("Invalid slot");
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        await fetchCombat();
      } catch {
        if (!cancelled) setError("Network error");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [validSlot, fetchCombat]);

  async function handleAction(type: "ATTACK" | "HEAL" | "RETREAT") {
    setActionPending(true);
    setError(null);
    try {
      const res = await fetch("/api/game/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ slotIndex: Number(slotNum), type }),
      });
      const data = (await res.json()) as { outcome?: string } | ApiError;
      if (!res.ok) {
        const err = data as ApiError;
        setError(err.error?.message ?? "Action failed");
        return;
      }
      const outcome = (data as { outcome: string }).outcome;
      if (outcome === "CONTINUE") {
        await fetchCombat();
      } else {
        router.push(`/game?slotIndex=${slotNum}`);
      }
    } catch {
      setError("Network error");
    } finally {
      setActionPending(false);
    }
  }

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
      <div className="mx-auto max-w-2xl px-4 py-12">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 rounded bg-zinc-700" />
          <div className="h-24 rounded-lg bg-zinc-800" />
          <div className="h-24 rounded-lg bg-zinc-800" />
          <div className="h-32 rounded-lg bg-zinc-800" />
        </div>
      </div>
    );
  }

  if (error && !combat) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12">
        <p className="text-red-400">{error}</p>
        <Link
          href={`/game?slotIndex=${slotNum}`}
          className="mt-4 inline-block text-sm text-zinc-400 hover:text-zinc-200"
        >
          ← Back to Hub
        </Link>
      </div>
    );
  }

  if (!combat) {
    return null;
  }

  const LOG_MAX = 50;
  const logEntries = combat.log.slice(-LOG_MAX);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-bold text-zinc-100">Combat</h1>
      <p className="text-zinc-400">Slot {combat.slotIndex}</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-zinc-700 bg-zinc-900 p-4">
          <h2 className="text-sm font-medium text-zinc-400">You</h2>
          <p className="mt-2 text-zinc-200">
            HP: {combat.player.hp} / {combat.player.hpMax}
          </p>
          <p className="mt-1 text-sm text-zinc-500">
            ATK {combat.player.effectiveAttack} · DEF {combat.player.effectiveDefense} · Luck{" "}
            {combat.player.luck}
          </p>
        </div>
        <div className="rounded-lg border border-zinc-700 bg-zinc-900 p-4">
          <h2 className="text-sm font-medium text-zinc-400">Enemy</h2>
          <p className="mt-2 font-medium text-zinc-200">
            {combat.enemy.name} ({combat.enemy.species})
          </p>
          <p className="text-sm text-zinc-500">
            Lv.{combat.enemy.level} · HP: {combat.enemy.hp} / {combat.enemy.hpMax}
          </p>
        </div>
      </div>

      <div className="mt-6">
        <h2 className="text-sm font-medium text-zinc-400">Combat log</h2>
        <div className="mt-2 max-h-48 overflow-y-auto rounded-lg border border-zinc-700 bg-zinc-900 p-3 font-mono text-sm text-zinc-300">
          {logEntries.length === 0 ? (
            <p className="text-zinc-500">—</p>
          ) : (
            logEntries.map((entry, i) => (
              <p key={i} className="whitespace-pre-wrap">
                {entry.text}
              </p>
            ))
          )}
        </div>
      </div>

      {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          disabled={actionPending}
          onClick={() => handleAction("ATTACK")}
          className="rounded bg-red-700 px-4 py-2 font-medium text-white hover:bg-red-600 disabled:opacity-50"
        >
          Attack
        </button>
        <button
          type="button"
          disabled={actionPending || !combat.canHeal}
          onClick={() => handleAction("HEAL")}
          className="rounded bg-emerald-700 px-4 py-2 font-medium text-white hover:bg-emerald-600 disabled:opacity-50"
        >
          Heal
        </button>
        <button
          type="button"
          disabled={actionPending}
          onClick={() => handleAction("RETREAT")}
          className="rounded border border-zinc-500 bg-zinc-700 px-4 py-2 font-medium text-zinc-200 hover:bg-zinc-600 disabled:opacity-50"
        >
          Retreat
        </button>
      </div>

      <Link
        href={`/game?slotIndex=${slotNum}`}
        className="mt-8 inline-block text-sm text-zinc-500 hover:text-zinc-300"
      >
        ← Back to Hub
      </Link>
    </div>
  );
}

export default function CombatPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-2xl px-4 py-12 text-center text-zinc-400">Loading...</div>
      }
    >
      <CombatPageInner />
    </Suspense>
  );
}
