import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import React from "react";
import { HpBar, getHpFlashClass } from "./HpBar";

describe("HpBar", () => {
  describe("getHpFlashClass", () => {
    it("returns damage flash when hp decreases", () => {
      expect(getHpFlashClass(10, 7)).toContain("fe-flash-damage");
    });

    it("returns heal flash when hp increases", () => {
      expect(getHpFlashClass(7, 10)).toContain("fe-flash-heal");
    });

    it("returns empty string when hp is unchanged", () => {
      expect(getHpFlashClass(10, 10)).toBe("");
    });
  });

  it("renders a progressbar with correct testid", () => {
    const html = renderToStaticMarkup(React.createElement(HpBar, { current: 5, max: 10, variant: "player" }));
    expect(html).toContain('role="progressbar"');
    expect(html).toContain('data-testid="hp-player"');
  });
});

