/**
 * Minimal motion helpers: return class strings only.
 * Keep these CSS-first to avoid runtime overhead.
 */
export function hoverLift(): string {
  return [
    "transition-transform duration-150 ease-out",
    "hover:-translate-y-1 hover:shadow-[0_14px_34px_rgba(0,0,0,0.35)]",
    "motion-reduce:transition-none motion-reduce:hover:translate-y-0",
  ].join(" ");
}

export function pressDown(): string {
  return [
    "transition-transform duration-75 ease-out",
    "active:translate-y-[1px] active:scale-[0.99]",
    "motion-reduce:transition-none motion-reduce:active:translate-y-0 motion-reduce:active:scale-100",
  ].join(" ");
}

export function glowElite(): string {
  return ["fe-elite", "fe-glow-elite", "fe-shimmer"].join(" ");
}

export function fadeIn(): string {
  return "fe-log-in";
}

export function pulseRune(): string {
  return "fe-rune-pulse";
}

export function hpFlashDamage(): string {
  return "fe-flash-damage";
}

export function hpFlashHeal(): string {
  return "fe-flash-heal";
}

