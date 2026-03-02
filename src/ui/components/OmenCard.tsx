"use client";

import React from "react";
import type { BadgeTier } from "@/src/ui/theme/classnames";
import { badgeTier, buttonPrimary, card } from "@/src/ui/theme/classnames";
import { labels, actionLabels } from "@/src/ui/theme/copy";
import { glowElite, hoverLift, pressDown } from "@/src/ui/motion/motion";

export type OmenEnemyCard = {
  choiceId: string;
  tier: string;
  name: string;
  species: string;
  level: number;
  preview: { estimatedLootCoinsMin: number; estimatedLootCoinsMax: number };
};

type OmenCardProps = {
  enemy: OmenEnemyCard;
  index: number;
  disabled: boolean;
  fightPendingChoiceId: string | null;
  onConfront: (choiceId: string) => void;
};

export function OmenCard({ enemy, index, disabled, fightPendingChoiceId, onConfront }: OmenCardProps) {
  const isElite = enemy.tier === "ELITE";
  return (
    <div
      key={enemy.choiceId}
      data-testid={`omen-card-${index}`}
      className={card(
        [
          "group will-change-transform transform-gpu",
          hoverLift(),
          pressDown(),
          isElite ? glowElite() : "",
        ]
          .filter(Boolean)
          .join(" ")
      )}
    >
      <div className="flex items-center justify-between">
        <span
          className={badgeTier((enemy.tier as BadgeTier) ?? "NORMAL", isElite ? glowElite() : "")}
          data-testid="omen-tier"
        >
          {enemy.tier}
        </span>
        <span className="text-xs text-zinc-500">Lv.{enemy.level}</span>
      </div>
      <p className="mt-2 text-xs font-medium text-amber-500/90 uppercase">{labels.Enemy}</p>
      <p className="mt-1 font-medium text-zinc-100" data-testid="enemy-name">
        {enemy.name}
      </p>
      <p className="text-sm text-zinc-500" data-testid="enemy-species">
        {enemy.species}
      </p>
      <p className="mt-2 text-xs text-zinc-500">
        Loot: {enemy.preview.estimatedLootCoinsMin}–{enemy.preview.estimatedLootCoinsMax}{" "}
        {labels.Coins.toLowerCase()}
      </p>
      <div className="mt-3">
        <button
          type="button"
          disabled={disabled}
          onClick={() => onConfront(enemy.choiceId)}
          className={`w-full min-h-[44px] ${buttonPrimary()} bg-red-700 hover:bg-red-600 ${pressDown()}`}
          data-testid={`btn-confront-${index}`}
        >
          {fightPendingChoiceId === enemy.choiceId ? "…" : actionLabels.confront}
        </button>
      </div>
    </div>
  );
}

