import { describe, it, expect } from "vitest";
import { gameErrorMessage } from "@/src/ui/errors/gameErrors";

describe("gameErrorMessage", () => {
  it("returns mapped message for SUMMARY_PENDING", () => {
    expect(gameErrorMessage("SUMMARY_PENDING")).toBe("Please review the summary first.");
  });

  it("returns mapped message for ENCOUNTER_ACTIVE", () => {
    expect(gameErrorMessage("ENCOUNTER_ACTIVE")).toBe(
      "You already have an active fight. Returning to combat."
    );
  });

  it("returns mapped message for NO_ACTIVE_ENCOUNTER", () => {
    expect(gameErrorMessage("NO_ACTIVE_ENCOUNTER")).toBe(
      "No active fight. Returning to hub."
    );
  });

  it("returns mapped message for RUN_OVER", () => {
    expect(gameErrorMessage("RUN_OVER")).toBe("This run is over. Return to slots.");
  });

  it("returns mapped message for INVALID_CHOICE", () => {
    expect(gameErrorMessage("INVALID_CHOICE")).toBe(
      "That enemy is no longer available. Refreshing enemies."
    );
  });

  it("returns mapped message for NO_POTION", () => {
    expect(gameErrorMessage("NO_POTION")).toBe("No potion available.");
  });

  it("returns mapped message for INSUFFICIENT_QUANTITY", () => {
    expect(gameErrorMessage("INSUFFICIENT_QUANTITY")).toBe("No potion available.");
  });

  it("returns mapped message for ITEM_EQUIPPED", () => {
    expect(gameErrorMessage("ITEM_EQUIPPED")).toBe(
      "Unequip the item before selling."
    );
  });

  it("returns fallback for unknown code when fallback provided", () => {
    expect(gameErrorMessage("UNKNOWN_CODE", "Custom fallback")).toBe(
      "Custom fallback"
    );
  });

  it('returns "Something went wrong" for unknown code when no fallback', () => {
    expect(gameErrorMessage("UNKNOWN_CODE")).toBe("Something went wrong");
  });

  it('returns "Something went wrong" for undefined code when no fallback', () => {
    expect(gameErrorMessage(undefined)).toBe("Something went wrong");
  });

  it("returns fallback for undefined code when fallback provided", () => {
    expect(gameErrorMessage(undefined, "Failed to load")).toBe("Failed to load");
  });

  it("returns fallback for empty string code when fallback provided", () => {
    expect(gameErrorMessage("", "Action failed")).toBe("Action failed");
  });
});
