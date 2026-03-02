import { radii, shadows } from "./tokens";

/**
 * Compose common class strings for panels, cards, buttons, badges.
 */

export function panel(extra = ""): string {
  return [
    "rounded-lg border border-zinc-700/80 bg-zinc-900/95 p-4",
    shadows.panel,
    extra,
  ]
    .filter(Boolean)
    .join(" ");
}

export function card(extra = ""): string {
  return [
    "rounded-lg border border-zinc-700/80 bg-zinc-900/95 p-4",
    "transition-shadow duration-200 hover:shadow-[0_0_20px_rgba(245,158,11,0.12)]",
    extra,
  ]
    .filter(Boolean)
    .join(" ");
}

export function buttonPrimary(extra = ""): string {
  return [
    "min-h-[44px] min-w-[44px] rounded-lg bg-amber-600 px-4 py-2.5 font-medium text-zinc-100",
    "hover:bg-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 disabled:opacity-50",
    extra,
  ]
    .filter(Boolean)
    .join(" ");
}

export function buttonGhost(extra = ""): string {
  return [
    "min-h-[44px] min-w-[44px] rounded-lg border border-zinc-600 bg-transparent px-4 py-2.5 font-medium text-zinc-300",
    "hover:bg-zinc-800 hover:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-500/50 disabled:opacity-50",
    extra,
  ]
    .filter(Boolean)
    .join(" ");
}

export type BadgeTier = "WEAK" | "NORMAL" | "ELITE";

export function badgeTier(tier: BadgeTier, extra = ""): string {
  const base = "rounded px-2 py-0.5 text-xs font-medium uppercase";
  const tierClasses: Record<BadgeTier, string> = {
    WEAK: "bg-zinc-800/70 text-zinc-300 border border-zinc-700/70",
    NORMAL: "bg-amber-900/50 text-amber-200 border border-amber-700/50",
    ELITE:
      "bg-amber-950/55 text-amber-200 border border-amber-500/60 shadow-[0_0_18px_rgba(245,158,11,0.14)]",
  };
  return [base, tierClasses[tier] ?? tierClasses.NORMAL, extra]
    .filter(Boolean)
    .join(" ");
}

export function frame(extra = ""): string {
  return [
    radii.lg,
    "border border-zinc-700/80 bg-zinc-900/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]",
    shadows.panel,
    extra,
  ]
    .filter(Boolean)
    .join(" ");
}
