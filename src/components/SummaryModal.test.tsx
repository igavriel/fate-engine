import { describe, it, expect, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import React from "react";
import { SummaryModal } from "./SummaryModal";

describe("SummaryModal", () => {
  it("renders required testids", () => {
    const html = renderToStaticMarkup(
      React.createElement(SummaryModal, {
        summary: {
          slotIndex: 1,
          outcome: "WIN",
          enemy: { name: "Wretch", species: "Ash", level: 1 },
          delta: { xpGained: 1, coinsGained: 2, hpChange: -1 },
          loot: [],
          leveledUp: false,
        },
        onContinue: vi.fn(),
      })
    );
    expect(html).toContain('data-testid="aftermath-modal"');
    expect(html).toContain('data-testid="aftermath-outcome"');
    expect(html).toContain('data-testid="aftermath-continue"');
  });
});

