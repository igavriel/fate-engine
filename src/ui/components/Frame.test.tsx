import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import React from "react";
import { Frame } from "./Frame";

describe("Frame", () => {
  it("renders children inside a frame with data-testid", () => {
    const html = renderToStaticMarkup(
      React.createElement(Frame, { children: "Hello" })
    );
    expect(html).toContain('data-testid="frame"');
    expect(html).toContain("Hello");
  });

  it("applies padding class for default md", () => {
    const html = renderToStaticMarkup(
      React.createElement(Frame, { children: "x" })
    );
    expect(html).toMatch(/p-6|rounded/);
  });
});
