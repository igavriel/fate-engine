import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import React from "react";
import { OmenCard } from "@/src/ui/components/OmenCard";
import { HpBar } from "@/src/ui/components/HpBar";

describe("UI integration (server render)", () => {
  it("hub omen cards include testids and ELITE has elite class", () => {
    const enemies = [
      {
        choiceId: "c1",
        tier: "WEAK",
        name: "Wretch",
        species: "GOBLIN",
        level: 1,
        preview: { estimatedLootCoinsMin: 1, estimatedLootCoinsMax: 2 },
      },
      {
        choiceId: "c2",
        tier: "NORMAL",
        name: "Reaver",
        species: "BANDIT",
        level: 2,
        preview: { estimatedLootCoinsMin: 2, estimatedLootCoinsMax: 4 },
      },
      {
        choiceId: "c3",
        tier: "ELITE",
        name: "Omen Knight",
        species: "SKELETON",
        level: 3,
        preview: { estimatedLootCoinsMin: 4, estimatedLootCoinsMax: 8 },
      },
    ] as const;

    const html = renderToStaticMarkup(
      React.createElement(
        "div",
        null,
        enemies.map((enemy, index) =>
          React.createElement(OmenCard, {
            key: enemy.choiceId,
            enemy: enemy as any,
            index,
            disabled: false,
            fightPendingChoiceId: null,
            onConfront: () => {},
          })
        )
      )
    );

    expect(html).toContain('data-testid="omen-card-0"');
    expect(html).toContain('data-testid="omen-card-1"');
    expect(html).toContain('data-testid="omen-card-2"');
    expect(html).toContain('data-testid="omen-tier"');
    expect(html).toContain("fe-elite");
  });

  it("combat UI renders hp bars with testids", () => {
    const html = renderToStaticMarkup(
      React.createElement("div", null, [
        React.createElement(HpBar, { key: "p", current: 5, max: 10, variant: "player" }),
        React.createElement(HpBar, { key: "e", current: 7, max: 10, variant: "enemy" }),
      ])
    );
    expect(html).toContain('data-testid="hp-player"');
    expect(html).toContain('data-testid="hp-enemy"');
  });
});

