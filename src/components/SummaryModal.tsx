"use client";

import type { SummaryResponse } from "@/shared/zod/game";

type SummaryModalProps = {
  summary: SummaryResponse;
  onContinue: () => void;
  ackPending?: boolean;
  ackError?: string | null;
};

export function SummaryModal({
  summary,
  onContinue,
  ackPending = false,
  ackError = null,
}: SummaryModalProps) {
  const outcomeLabel =
    summary.outcome === "WIN"
      ? "Victory!"
      : summary.outcome === "RETREAT"
        ? "Retreat"
        : "Defeat";

  const outcomeColor =
    summary.outcome === "WIN"
      ? "text-emerald-400"
      : summary.outcome === "RETREAT"
        ? "text-amber-400"
        : "text-red-400";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="summary-title"
    >
      <div className="w-full max-w-md rounded-lg border border-zinc-600 bg-zinc-900 p-6 shadow-xl">
        <h2 id="summary-title" className={`text-xl font-bold ${outcomeColor}`}>
          {outcomeLabel}
        </h2>
        <p className="mt-1 text-sm text-zinc-400">
          vs {summary.enemy.name} ({summary.enemy.species}) · Lv.{summary.enemy.level}
        </p>

        <div className="mt-4 space-y-2 rounded border border-zinc-700 bg-zinc-800/50 p-3 text-sm">
          <p className="text-zinc-300">
            HP: {summary.delta.hpChange >= 0 ? "+" : ""}
            {summary.delta.hpChange}
          </p>
          <p className="text-zinc-300">XP: +{summary.delta.xpGained}</p>
          <p className="text-zinc-300">Coins: +{summary.delta.coinsGained}</p>
        </div>

        {summary.loot.length > 0 && (
          <div className="mt-4">
            <h3 className="text-sm font-medium text-zinc-400">Loot</h3>
            <ul className="mt-2 space-y-1 text-sm text-zinc-300">
              {summary.loot.map((item, i) => (
                <li key={i}>
                  {item.name} ×{item.quantity}
                  {(item.attackBonus ?? 0) > 0 && ` (+${item.attackBonus} ATK)`}
                  {(item.defenseBonus ?? 0) > 0 && ` (+${item.defenseBonus} DEF)`}
                  {(item.healPercent ?? 0) > 0 && ` (Heal ${item.healPercent}%)`}
                </li>
              ))}
            </ul>
          </div>
        )}

        {summary.leveledUp && summary.newLevel != null && (
          <p className="mt-4 text-amber-400">Level up! You are now level {summary.newLevel}.</p>
        )}

        {ackError && <p className="mt-4 text-sm text-red-400">{ackError}</p>}

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onContinue}
            disabled={ackPending}
            className="rounded bg-zinc-600 px-4 py-2 font-medium text-zinc-100 hover:bg-zinc-500 disabled:opacity-50"
          >
            {ackPending ? "..." : "Continue"}
          </button>
        </div>
      </div>
    </div>
  );
}
