import { mulberry32 } from "./mulberry32";

export interface Rng {
  /** Float in [0, 1) */
  next(): number;
  /** Integer in [min, max] inclusive */
  int(min: number, max: number): number;
  /** Pick one element from array (deterministic) */
  pick<T>(array: readonly T[]): T;
}

export function createRng(seed: number): Rng {
  const next = mulberry32(seed);
  return {
    next,
    int(min: number, max: number): number {
      const n = next();
      return Math.floor(n * (max - min + 1)) + min;
    },
    pick<T>(array: readonly T[]): T {
      if (array.length === 0) throw new Error("Cannot pick from empty array");
      return array[next() * array.length | 0]!;
    },
  };
}
