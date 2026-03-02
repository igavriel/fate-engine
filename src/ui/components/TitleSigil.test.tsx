import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import React from "react";
import { TitleSigil } from "./TitleSigil";

describe("TitleSigil", () => {
  it("renders title and data-testid", () => {
    const html = renderToStaticMarkup(
      React.createElement(TitleSigil, { title: "ENTER THE SEAL" })
    );
    expect(html).toContain('data-testid="title-sigil"');
    expect(html).toContain("ENTER THE SEAL");
  });

  it("includes an svg circle (rune)", () => {
    const html = renderToStaticMarkup(
      React.createElement(TitleSigil, { title: "X" })
    );
    expect(html).toContain("<svg");
    expect(html).toContain("circle");
  });
});
