/**
 * Dark fantasy ruined shrine theme tokens.
 * Typography: --font-title (Uncial Antiqua), --font-ui (IBM Plex Sans) set in root layout.
 */

export const typography = {
  /** Title/display font (Uncial Antiqua). Use for headings and sigils. */
  fontTitle: "font-title",
  /** UI/body font (IBM Plex Sans). Applied to body in root layout. */
  fontUi: "font-ui",
} as const;

export const colors = {
  bg: "bg-[#0c0a0b]",
  surface: "bg-zinc-900/95",
  border: "border-zinc-700/80",
  accent: "text-amber-500",
  accentMuted: "text-amber-600/80",
  textPrimary: "text-zinc-100",
  textMuted: "text-zinc-400",
  danger: "text-red-400",
  success: "text-emerald-400",
} as const;

export const radii = {
  sm: "rounded",
  md: "rounded-lg",
  lg: "rounded-xl",
} as const;

export const shadows = {
  panel: "shadow-[0_2px_12px_rgba(0,0,0,0.4)]",
  glow: "shadow-[0_0_20px_rgba(245,158,11,0.15)]",
} as const;

export const spacing = {
  xs: "p-1",
  sm: "p-2",
  md: "p-4",
  lg: "p-6",
} as const;
