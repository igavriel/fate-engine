import { describe, it, expect, vi, beforeEach } from "vitest";
import { getEnemies } from "@/server/game/enemies";

const mockRequireRunForSlot = vi.fn();

vi.mock("@/server/game/requireRunForSlot", () => ({
  requireRunForSlot: (...args: unknown[]) => mockRequireRunForSlot(...args),
}));

describe("getEnemies", () => {
  beforeEach(() => {
    mockRequireRunForSlot.mockReset();
  });

  it("returns enemies from generateEnemyChoices for run", async () => {
    mockRequireRunForSlot.mockResolvedValue({
      run: {
        seed: 42,
        fightCounter: 0,
        character: { level: 2 },
      },
    });

    const result = await getEnemies("user-1", 1);

    expect(result.enemies).toHaveLength(3);
    expect(result.enemies.map((e) => e.tier)).toEqual(["WEAK", "NORMAL", "TOUGH"]);
    expect(mockRequireRunForSlot).toHaveBeenCalledWith("user-1", 1);
  });
});
