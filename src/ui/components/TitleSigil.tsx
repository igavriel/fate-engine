"use client";

import { typography } from "@/src/ui/theme/tokens";

/**
 * Game title with a subtle rune circle (CSS/SVG). Reused on login and slots.
 * Uses title font (Uncial Antiqua) for themed headings.
 */
export function TitleSigil({ title }: { title: string }) {
  return (
    <div className="flex flex-col items-center gap-3" data-testid="title-sigil">
      {/* Simple rune circle - decorative ring */}
      <div className="relative flex h-12 w-12 items-center justify-center">
        <svg
          className="h-full w-full text-amber-600/60"
          viewBox="0 0 48 48"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          aria-hidden
        >
          <circle cx="24" cy="24" r="20" strokeOpacity="0.6" />
          <circle cx="24" cy="24" r="12" strokeOpacity="0.3" />
        </svg>
      </div>
      <h1
        className={`${typography.fontTitle} text-center text-xl font-semibold tracking-widest text-zinc-100 uppercase`}
      >
        {title}
      </h1>
    </div>
  );
}
