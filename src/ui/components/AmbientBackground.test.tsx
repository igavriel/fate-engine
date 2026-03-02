/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { createRoot } from "react-dom/client";
import React, { act } from "react";
import { AmbientBackground } from "./AmbientBackground";

const noop = vi.fn();
function makeMatchMedia(matchesReduce: boolean, matchesDesktop: boolean) {
  return (query: string) => ({
    get matches() {
      if (query === "(prefers-reduced-motion: reduce)") return matchesReduce;
      return matchesDesktop;
    },
    addListener: noop,
    removeListener: noop,
    addEventListener: noop,
    removeEventListener: noop,
    dispatchEvent: noop,
  });
}

describe("AmbientBackground", () => {
  const originalMatchMedia = globalThis.matchMedia;

  afterEach(() => {
    Object.defineProperty(globalThis, "matchMedia", {
      value: originalMatchMedia,
      configurable: true,
      writable: true,
    });
  });

  it("renders a fixed full-screen container with data-testid", () => {
    const html = renderToStaticMarkup(React.createElement(AmbientBackground));
    expect(html).toContain('data-testid="ambient-bg"');
    expect(html).toContain("fixed");
    expect(html).toContain("inset-0");
  });

  it("includes pointer-events-none so clicks pass through", () => {
    const html = renderToStaticMarkup(React.createElement(AmbientBackground));
    expect(html).toContain("pointer-events-none");
  });

  it("renders base layer with shrine background image and gradient fallback", () => {
    const html = renderToStaticMarkup(React.createElement(AmbientBackground));
    expect(html).toContain("/ui/shrine-bg.jpg");
    expect(html).toContain("#0c0a0b");
    expect(html).toContain("fe-fog-drift");
    expect(html).toContain("fe-rune-pulse");
  });

  it("sets --px/--py on mousemove when desktop pointer and no reduced motion", async () => {
    Object.defineProperty(globalThis, "matchMedia", {
      value: makeMatchMedia(false, true),
      configurable: true,
      writable: true,
    });

    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(React.createElement(AmbientBackground));
    });

    const el = document.querySelector('[data-testid="ambient-bg"]') as HTMLDivElement;
    expect(el).toBeTruthy();
    el.getBoundingClientRect = vi.fn(() => ({
      width: 800,
      height: 600,
      x: 0,
      y: 0,
      top: 0,
      left: 0,
      right: 800,
      bottom: 600,
      toJSON: noop,
    }));

    await act(async () => {
      window.dispatchEvent(new MouseEvent("mousemove", { clientX: 400, clientY: 300 }));
    });
    await new Promise<void>((r) => requestAnimationFrame(r));

    const px = el.style.getPropertyValue("--px");
    const py = el.style.getPropertyValue("--py");
    expect(px).not.toBe("");
    expect(py).not.toBe("");

    root.unmount();
    document.body.removeChild(container);
  });

  it("skips parallax when prefers-reduced-motion", async () => {
    Object.defineProperty(globalThis, "matchMedia", {
      value: makeMatchMedia(true, true),
      configurable: true,
      writable: true,
    });

    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(React.createElement(AmbientBackground));
    });

    const el = document.querySelector('[data-testid="ambient-bg"]') as HTMLDivElement;
    expect(el).toBeTruthy();
    await act(async () => {
      window.dispatchEvent(new MouseEvent("mousemove", { clientX: 100, clientY: 100 }));
    });
    await new Promise<void>((r) => requestAnimationFrame(r));

    expect(el.style.getPropertyValue("--px")).toBe("");
    expect(el.style.getPropertyValue("--py")).toBe("");

    root.unmount();
    document.body.removeChild(container);
  });

  it("skips parallax when not desktop pointer", async () => {
    Object.defineProperty(globalThis, "matchMedia", {
      value: makeMatchMedia(false, false),
      configurable: true,
      writable: true,
    });

    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(React.createElement(AmbientBackground));
    });

    const el = document.querySelector('[data-testid="ambient-bg"]') as HTMLDivElement;
    expect(el).toBeTruthy();
    await act(async () => {
      window.dispatchEvent(new MouseEvent("mousemove", { clientX: 100, clientY: 100 }));
    });
    await new Promise<void>((r) => requestAnimationFrame(r));

    expect(el.style.getPropertyValue("--px")).toBe("");
    expect(el.style.getPropertyValue("--py")).toBe("");

    root.unmount();
    document.body.removeChild(container);
  });
});
