"use client";

/**
 * Full-screen fixed background: shrine image or gradient fallback,
 * plus fog drift and rune glow pulse. pointer-events: none so clicks pass through.
 */
export function AmbientBackground() {
  return (
    <div
      className="fixed inset-0 z-0 overflow-hidden pointer-events-none"
      aria-hidden
      data-testid="ambient-background"
    >
      {/* Base: image or gradient */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url(/ui/shrine-bg.jpg)",
          backgroundColor: "#0c0a0b",
        }}
      />
      {/* Gradient fallback when image fails or missing */}
      <div
        className="absolute inset-0 bg-gradient-to-b from-[#0c0a0b] via-[#1a1518] to-[#0c0a0b]"
        aria-hidden
      />

      {/* Fog layer - drift animation */}
      <div
        className="absolute inset-0 opacity-[0.12] animate-fog-drift"
        style={{
          background:
            "linear-gradient(105deg, transparent 0%, rgba(120,113,108,0.4) 40%, transparent 70%)",
        }}
        aria-hidden
      />

      {/* Rune glow pulse */}
      <div
        className="absolute inset-0 opacity-30 animate-rune-pulse"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 30%, rgba(245,158,11,0.15) 0%, transparent 60%)",
        }}
        aria-hidden
      />
    </div>
  );
}
