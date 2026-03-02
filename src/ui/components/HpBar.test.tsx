/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { createRoot } from "react-dom/client";
import React, { act } from "react";
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

  it("renders a progressbar with correct testid for player", () => {
    const html = renderToStaticMarkup(
      React.createElement(HpBar, { current: 5, max: 10, variant: "player" })
    );
    expect(html).toContain('role="progressbar"');
    expect(html).toContain('data-testid="hp-player"');
    expect(html).toContain("bg-emerald-500");
  });

  it("renders enemy variant with correct testid and fill color", () => {
    const html = renderToStaticMarkup(
      React.createElement(HpBar, { current: 3, max: 10, variant: "enemy" })
    );
    expect(html).toContain('data-testid="hp-enemy"');
    expect(html).toContain("bg-red-500");
  });

  it("sets aria-valuemin, aria-valuemax, aria-valuenow and fill width", () => {
    const html = renderToStaticMarkup(
      React.createElement(HpBar, { current: 5, max: 10, variant: "player" })
    );
    expect(html).toContain('aria-valuemin="0"');
    expect(html).toContain('aria-valuemax="10"');
    expect(html).toContain('aria-valuenow="5"');
    expect(html).toMatch(/width:\s*50\.00%/);
  });

  it("clamps percentage when max is 0", () => {
    const html = renderToStaticMarkup(
      React.createElement(HpBar, { current: 5, max: 0, variant: "player" })
    );
    expect(html).toMatch(/width:\s*0\.00%/);
  });

  it("applies flash class when current decreases and clears after timeout", async () => {
    vi.useFakeTimers();
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(
        React.createElement(HpBar, { current: 10, max: 10, variant: "player" })
      );
    });

    let bar = document.querySelector('[data-testid="hp-player"]');
    expect(bar?.className).not.toContain("fe-flash-damage");

    await act(async () => {
      root.render(
        React.createElement(HpBar, { current: 7, max: 10, variant: "player" })
      );
    });

    bar = document.querySelector('[data-testid="hp-player"]');
    expect(bar?.className).toContain("fe-flash-damage");

    await act(async () => {
      vi.advanceTimersByTime(460);
    });

    bar = document.querySelector('[data-testid="hp-player"]');
    expect(bar?.className).not.toContain("fe-flash-damage");

    root.unmount();
    document.body.removeChild(container);
    vi.useRealTimers();
  });

  it("applies heal flash when current increases", async () => {
    vi.useFakeTimers();
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(
        React.createElement(HpBar, { current: 5, max: 10, variant: "player" })
      );
    });

    await act(async () => {
      root.render(
        React.createElement(HpBar, { current: 8, max: 10, variant: "player" })
      );
    });

    const bar = document.querySelector('[data-testid="hp-player"]');
    expect(bar?.className).toContain("fe-flash-heal");

    root.unmount();
    document.body.removeChild(container);
    vi.useRealTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });
});

