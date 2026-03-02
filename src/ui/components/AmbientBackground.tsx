"use client";

import React, { useEffect, useRef } from "react";

/**
 * Full-screen fixed background: shrine image or gradient fallback,
 * plus fog drift and rune glow pulse. pointer-events: none so clicks pass through.
 */
export function AmbientBackground() {
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const node = el;

    const reducedMotion =
      typeof window !== "undefined" &&
      typeof window.matchMedia !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) return;

    const desktopPointer =
      typeof window !== "undefined" &&
      typeof window.matchMedia !== "undefined" &&
      window.matchMedia("(hover: hover) and (pointer: fine) and (min-width: 768px)").matches;
    if (!desktopPointer) return;

    let raf = 0;
    let lastX = 0;
    let lastY = 0;

    function apply() {
      raf = 0;
      const rect = node.getBoundingClientRect();
      const x = rect.width > 0 ? lastX / rect.width - 0.5 : 0;
      const y = rect.height > 0 ? lastY / rect.height - 0.5 : 0;
      const max = 8; // px
      const px = Math.max(-max, Math.min(max, x * 2 * max));
      const py = Math.max(-max, Math.min(max, y * 2 * max));
      node.style.setProperty("--px", `${px.toFixed(2)}px`);
      node.style.setProperty("--py", `${py.toFixed(2)}px`);
    }

    function onMove(e: MouseEvent) {
      lastX = e.clientX;
      lastY = e.clientY;
      if (raf) return;
      raf = window.requestAnimationFrame(apply);
    }

    window.addEventListener("mousemove", onMove, { passive: true });
    return () => {
      window.removeEventListener("mousemove", onMove);
      if (raf) window.cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      ref={rootRef}
      className="fixed inset-0 z-0 overflow-hidden pointer-events-none"
      aria-hidden
      data-testid="ambient-bg"
    >
      {/* Base: image or gradient */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat will-change-transform"
        style={{
          backgroundImage: "url(/ui/shrine-bg.jpg)",
          backgroundColor: "#0c0a0b",
          transform: "translate3d(var(--px, 0px), var(--py, 0px), 0)",
        }}
      />
      {/* Gradient fallback when image fails or missing */}
      <div
        className="absolute inset-0 bg-gradient-to-b from-[#0c0a0b] via-[#1a1518] to-[#0c0a0b]"
        aria-hidden
      />

      {/* Fog layer - drift animation */}
      <div
        className="absolute inset-0 opacity-[0.12] fe-fog-drift"
        style={{
          background:
            "linear-gradient(105deg, transparent 0%, rgba(120,113,108,0.4) 40%, transparent 70%)",
        }}
        aria-hidden
      />

      {/* Rune glow pulse */}
      <div
        className="absolute inset-0 opacity-30 fe-rune-pulse"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 30%, rgba(245,158,11,0.15) 0%, transparent 60%)",
        }}
        aria-hidden
      />

      {/* Vignette overlay */}
      <div
        className="absolute inset-0 opacity-70"
        style={{
          background:
            "radial-gradient(circle at 50% 40%, rgba(0,0,0,0) 0%, rgba(0,0,0,0.35) 55%, rgba(0,0,0,0.9) 100%)",
        }}
        aria-hidden
      />

      {/* Grain overlay (subtle, no image) */}
      <div
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, rgba(255,255,255,0.06) 0, rgba(255,255,255,0.06) 1px, transparent 1px, transparent 3px), repeating-linear-gradient(90deg, rgba(0,0,0,0.12) 0, rgba(0,0,0,0.12) 1px, transparent 1px, transparent 4px)",
          mixBlendMode: "overlay",
        }}
        aria-hidden
      />
    </div>
  );
}
