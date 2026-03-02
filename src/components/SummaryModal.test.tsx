/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { createRoot } from "react-dom/client";
import React, { act } from "react";
import { screenCopy } from "@/src/ui/theme/copy";
import { SummaryModal } from "./SummaryModal";

const baseSummary = {
  slotIndex: 1 as const,
  outcome: "WIN" as const,
  enemy: { name: "Wretch", species: "Ash", level: 1 },
  delta: { xpGained: 1, coinsGained: 2, hpChange: -1 },
  loot: [] as Array<{
    name: string;
    itemType: "WEAPON" | "ARMOR" | "POTION";
    quantity: number;
    attackBonus?: number;
    defenseBonus?: number;
    healPercent?: number;
    requiredLevel?: number;
  }>,
  leveledUp: false,
};

describe("SummaryModal", () => {
  it("renders required testids", () => {
    const html = renderToStaticMarkup(
      React.createElement(SummaryModal, {
        summary: baseSummary,
        onContinue: vi.fn(),
      })
    );
    expect(html).toContain('data-testid="aftermath-modal"');
    expect(html).toContain('data-testid="aftermath-outcome"');
    expect(html).toContain('data-testid="aftermath-continue"');
  });

  it("shows WIN outcome label and emerald styling", () => {
    const html = renderToStaticMarkup(
      React.createElement(SummaryModal, {
        summary: { ...baseSummary, outcome: "WIN" },
        onContinue: vi.fn(),
      })
    );
    expect(html).toContain(screenCopy.aftermathWin);
    expect(html).toContain("text-emerald-400");
    expect(html).toContain("bg-emerald-500/40");
  });

  it("shows RETREAT outcome label and amber styling", () => {
    const html = renderToStaticMarkup(
      React.createElement(SummaryModal, {
        summary: { ...baseSummary, outcome: "RETREAT" },
        onContinue: vi.fn(),
      })
    );
    expect(html).toContain(screenCopy.aftermathRetreat);
    expect(html).toContain("text-amber-400");
    expect(html).toContain("bg-zinc-500/30");
  });

  it("shows DEFEAT outcome label and red styling", () => {
    const html = renderToStaticMarkup(
      React.createElement(SummaryModal, {
        summary: { ...baseSummary, outcome: "DEFEAT" },
        onContinue: vi.fn(),
      })
    );
    expect(html).toContain(screenCopy.aftermathDefeat);
    expect(html).toContain("text-red-400");
    expect(html).toContain("bg-red-500/40");
  });

  it("renders enemy name, species and level", () => {
    const html = renderToStaticMarkup(
      React.createElement(SummaryModal, {
        summary: {
          ...baseSummary,
          enemy: { name: "Omen Knight", species: "Skeleton", level: 3 },
        },
        onContinue: vi.fn(),
      })
    );
    expect(html).toContain("Omen Knight");
    expect(html).toContain("Skeleton");
    expect(html).toContain("Lv.3");
  });

  it("renders delta HP, XP and coins with correct signs", () => {
    const html = renderToStaticMarkup(
      React.createElement(SummaryModal, {
        summary: {
          ...baseSummary,
          delta: { xpGained: 10, coinsGained: -2, hpChange: 5 },
        },
        onContinue: vi.fn(),
      })
    );
    expect(html).toContain("+5"); // hp
    expect(html).toContain("+10"); // xp
    expect(html).toContain("-2"); // coins (no plus)
  });

  it("shows No items found when loot is empty", () => {
    const html = renderToStaticMarkup(
      React.createElement(SummaryModal, {
        summary: baseSummary,
        onContinue: vi.fn(),
      })
    );
    expect(html).toContain("No items found");
  });

  it("renders loot list with item name, type, quantity and bonuses", () => {
    const html = renderToStaticMarkup(
      React.createElement(SummaryModal, {
        summary: {
          ...baseSummary,
          loot: [
            {
              name: "Iron Blade",
              itemType: "WEAPON",
              quantity: 1,
              attackBonus: 3,
              requiredLevel: 2,
            },
            {
              name: "Healing Brew",
              itemType: "POTION",
              quantity: 2,
              healPercent: 25,
            },
          ],
        },
        onContinue: vi.fn(),
      })
    );
    expect(html).toContain("Iron Blade");
    expect(html).toContain("WEAPON");
    expect(html).toContain("+3 ATK");
    expect(html).toContain("Requires Level 2");
    expect(html).toContain("Healing Brew");
    expect(html).toContain("POTION");
    expect(html).toContain("×2");
    expect(html).toContain("Heal 25%");
  });

  it("renders leveled-up message when leveledUp and newLevel are set", () => {
    const html = renderToStaticMarkup(
      React.createElement(SummaryModal, {
        summary: {
          ...baseSummary,
          leveledUp: true,
          newLevel: 3,
        },
        onContinue: vi.fn(),
      })
    );
    expect(html).toContain("Rank up!");
    expect(html).toContain("rank 3");
  });

  it("shows ackError when provided", () => {
    const html = renderToStaticMarkup(
      React.createElement(SummaryModal, {
        summary: baseSummary,
        onContinue: vi.fn(),
        ackError: "Network error",
      })
    );
    expect(html).toContain("Network error");
    expect(html).toContain("text-red-400");
  });

  it("disables continue button and shows ellipsis when ackPending", () => {
    const html = renderToStaticMarkup(
      React.createElement(SummaryModal, {
        summary: baseSummary,
        onContinue: vi.fn(),
        ackPending: true,
      })
    );
    expect(html).toContain('data-testid="aftermath-continue"');
    expect(html).toContain("disabled");
    expect(html).toContain("…");
  });

  it("calls onContinue when continue button is clicked", async () => {
    const onContinue = vi.fn();
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(
        React.createElement(SummaryModal, {
          summary: baseSummary,
          onContinue,
        })
      );
    });

    const button = document.querySelector('[data-testid="aftermath-continue"]');
    expect(button).toBeTruthy();
    await act(async () => {
      (button as HTMLButtonElement).click();
    });

    expect(onContinue).toHaveBeenCalledTimes(1);
    root.unmount();
    document.body.removeChild(container);
  });
});

