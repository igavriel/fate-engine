import { describe, it, expect } from "vitest";
import {
  hoverLift,
  pressDown,
  glowElite,
  fadeIn,
  pulseRune,
  hpFlashDamage,
  hpFlashHeal,
} from "./motion";

describe("ui/motion helpers", () => {
  it("hoverLift returns stable hover classes", () => {
    expect(hoverLift()).toContain("hover:-translate-y-1");
    expect(hoverLift()).toContain("motion-reduce");
  });

  it("pressDown returns stable active classes", () => {
    expect(pressDown()).toContain("active:translate-y");
    expect(pressDown()).toContain("active:scale");
  });

  it("glowElite includes elite marker classes", () => {
    const cls = glowElite();
    expect(cls).toContain("fe-elite");
    expect(cls).toContain("fe-glow-elite");
    expect(cls).toContain("fe-shimmer");
  });

  it("fadeIn/pulse/flash helpers return expected css utility classes", () => {
    expect(fadeIn()).toBe("fe-log-in");
    expect(pulseRune()).toBe("fe-rune-pulse");
    expect(hpFlashDamage()).toBe("fe-flash-damage");
    expect(hpFlashHeal()).toBe("fe-flash-heal");
  });
});

