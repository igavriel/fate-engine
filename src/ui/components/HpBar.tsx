"use client";

import React, { useEffect, useRef, useState } from "react";
import { hpFlashDamage, hpFlashHeal } from "@/src/ui/motion/motion";

export type HpBarVariant = "player" | "enemy";

export function getHpFlashClass(prev: number, next: number): string {
  if (next < prev) return hpFlashDamage();
  if (next > prev) return hpFlashHeal();
  return "";
}

type HpBarProps = {
  current: number;
  max: number;
  variant: HpBarVariant;
};

function clamp01(n: number): number {
  if (Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

export function HpBar({ current, max, variant }: HpBarProps) {
  const prevRef = useRef<number>(current);
  const timeoutRef = useRef<number | null>(null);
  const [flashClass, setFlashClass] = useState<string>("");

  useEffect(() => {
    const prev = prevRef.current;
    const next = current;
    prevRef.current = next;

    const cls = getHpFlashClass(prev, next);
    if (!cls) return;

    setFlashClass(cls);
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    timeoutRef.current = window.setTimeout(() => setFlashClass(""), 460);
    return () => {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    };
  }, [current]);

  const pct = clamp01(max > 0 ? current / max : 0) * 100;
  const fillColor =
    variant === "player" ? "bg-emerald-500/80" : "bg-red-500/70";
  const testId = variant === "player" ? "hp-player" : "hp-enemy";

  return (
    <div
      className={[
        "mt-2 h-2 w-full overflow-hidden rounded border border-zinc-700 bg-zinc-900/60",
        flashClass,
      ]
        .filter(Boolean)
        .join(" ")}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={current}
      data-testid={testId}
    >
      <div
        className={[
          "h-full rounded",
          fillColor,
          "transition-[width] duration-500 ease-out motion-reduce:transition-none",
        ].join(" ")}
        style={{ width: `${pct.toFixed(2)}%` }}
      />
    </div>
  );
}

