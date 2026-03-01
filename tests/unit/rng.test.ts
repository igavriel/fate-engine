import { describe, it, expect } from "vitest";
import { createRng } from "@/domain/rng/createRng";

describe("createRng (Mulberry32)", () => {
  it("same seed produces same sequence", () => {
    const rng1 = createRng(12345);
    const rng2 = createRng(12345);
    const seq1 = [rng1.next(), rng1.next(), rng1.int(1, 10), rng1.int(0, 100)];
    const seq2 = [rng2.next(), rng2.next(), rng2.int(1, 10), rng2.int(0, 100)];
    expect(seq1).toEqual(seq2);
  });

  it("different seeds produce different sequences", () => {
    const rng1 = createRng(1);
    const rng2 = createRng(2);
    expect(rng1.next()).not.toBe(rng2.next());
  });

  it("int(min, max) returns integer in range inclusive", () => {
    const rng = createRng(999);
    for (let i = 0; i < 50; i++) {
      const n = rng.int(5, 10);
      expect(Number.isInteger(n)).toBe(true);
      expect(n).toBeGreaterThanOrEqual(5);
      expect(n).toBeLessThanOrEqual(10);
    }
  });

  it("pick returns element from array", () => {
    const rng = createRng(42);
    const arr = ["a", "b", "c"];
    const results = new Set<string>();
    for (let i = 0; i < 30; i++) {
      results.add(rng.pick(arr));
    }
    expect(results.size).toBeGreaterThanOrEqual(1);
    results.forEach((v) => expect(arr).toContain(v));
  });
});
