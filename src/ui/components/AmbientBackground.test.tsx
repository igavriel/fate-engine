import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import React from "react";
import { AmbientBackground } from "./AmbientBackground";

describe("AmbientBackground", () => {
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
});
