"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState, useCallback, Suspense } from "react";
import Link from "next/link";
import type { CombatStateResponse } from "@/shared/zod/game";
import { gameErrorMessage } from "@/src/ui/errors/gameErrors";
import { labels, screenCopy, actionLabels } from "@/src/ui/theme/copy";
import { panel, buttonPrimary, buttonGhost } from "@/src/ui/theme/classnames";
import { fadeIn } from "@/src/ui/motion/motion";
import { HpBar } from "@/src/ui/components/HpBar";

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
      setError(gameErrorMessage(err.error?.code, "Failed to load combat"));
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
        setError(gameErrorMessage(err.error?.code, "Action failed"));
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
    <div className="mx-auto max-w-2xl px-4 py-8" data-testid="page-combat">
      <h1 className="text-2xl font-bold text-zinc-100">{screenCopy.combat}</h1>
      <p className="text-zinc-400">{labels.Slot} {combat.slotIndex}</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className={panel()}>
          <h2 className="text-sm font-medium text-zinc-400">{labels.Slot}</h2>
          <p className="mt-2 text-zinc-200">
            {labels.HP}: {combat.player.hp} / {combat.player.hpMax}
          </p>
          <HpBar current={combat.player.hp} max={combat.player.hpMax} variant="player" />
          <p className="mt-1 text-sm text-zinc-500">
            ATK {combat.player.effectiveAttack} · DEF {combat.player.effectiveDefense} · Luck{" "}
            {combat.player.luck}
          </p>
        </div>
        <div className={panel()}>
          <h2 className="text-sm font-medium text-amber-500/90 uppercase">THE {labels.Enemy.toUpperCase()}</h2>
          <p className="mt-2 font-medium text-zinc-200">
            {combat.enemy.name} ({combat.enemy.species})
          </p>
          <p className="text-sm text-zinc-500">
            Lv.{combat.enemy.level} · {labels.HP}: {combat.enemy.hp} / {combat.enemy.hpMax}
          </p>
          <HpBar current={combat.enemy.hp} max={combat.enemy.hpMax} variant="enemy" />
        </div>
      </div>

      <div className="mt-6">
        <h2 className="text-sm font-medium text-zinc-400">{labels.Log}</h2>
        <div
          className="mt-2 max-h-48 overflow-y-auto rounded-lg border border-zinc-700 bg-zinc-900 p-3 font-mono text-sm text-zinc-300"
          data-testid="chronicle"
        >
          {logEntries.length === 0 ? (
            <p className="text-zinc-500">—</p>
          ) : (
            logEntries.map((entry, i) => (
              <p
                key={entry.t}
                className={`whitespace-pre-wrap ${i === logEntries.length - 1 ? fadeIn() : ""}`}
              >
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
          className={`min-h-[44px] min-w-[44px] ${buttonPrimary()} bg-red-700 hover:bg-red-600`}
          data-testid="btn-strike"
        >
          {actionLabels.strike}
        </button>
        <button
          type="button"
          disabled={actionPending || !combat.canHeal}
          onClick={() => handleAction("HEAL")}
          className={`min-h-[44px] min-w-[44px] ${buttonPrimary()} bg-emerald-700 hover:bg-emerald-600`}
          data-testid="btn-mend"
        >
          {actionLabels.mend}
        </button>
        <button
          type="button"
          disabled={actionPending}
          onClick={() => handleAction("RETREAT")}
          className={`min-h-[44px] min-w-[44px] ${buttonGhost()}`}
          data-testid="btn-flee"
        >
          {actionLabels.flee}
        </button>
      </div>

      <Link
        href={`/game?slotIndex=${slotNum}`}
        className="mt-8 inline-block text-sm text-zinc-500 hover:text-zinc-300 min-h-[44px] flex items-center"
      >
        {actionLabels.backToHub}
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
