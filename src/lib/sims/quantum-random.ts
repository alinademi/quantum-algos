// Quantum coin flips: a simulated qubit (start as |0>, Hadamard, measure) next to a seeded pseudo-random program.
// Pure math only. The tool passes in `rand`, so tests can replay shots with a seed.
import { H, ket0, matVec, measureQubit, probOne, type State } from '../quantum.ts';

export type Bit = 0 | 1;

/** Bits added per press, and the most a row holds. */
export const BATCH = 32;
export const MAX_BITS = 128;

// ---- The quantum coin

/** Start as |0>, then a Hadamard gate: |+> = (|0> + |1>)/sqrt(2). */
export const coinState = (): State => matVec(H, ket0());

/** Born rule: the chance a measurement of the coin state gives 1, |1/sqrt(2)|^2 = 1/2. */
export const pOne = (): number => probOne(coinState(), 0);

/** One coin flip: a fresh qubit in |+>, measured in the 0/1 basis. On this page `rand` is a computer's generator, not a qubit. */
export const flip = (rand: () => number): Bit => measureQubit(coinState(), 0, rand).result;

/** n flips, each on a fresh qubit. */
export const flips = (n: number, rand: () => number): Bit[] => Array.from({ length: n }, () => flip(rand));

// ---- The pseudo-random program: a linear congruential generator, X_{k+1} = (a X_k + c) mod m

export const LCG = { a: 1103515245, c: 12345, m: 2 ** 31 } as const;

/** One step of the rule. Math.imul keeps the product exact: only its low 31 bits matter mod 2^31. */
export const lcgNext = (x: number): number => (Math.imul(LCG.a, x) + LCG.c) & 0x7fffffff;

/** The output bit is the top bit of the 31-bit state. (The bottom bit just alternates 0, 1, 0, 1, so it is never used.) */
export const lcgBit = (x: number): Bit => (x >>> 30) as Bit;

/** The first n bits from a seed. Same seed, same bits, every time. */
export function lcgBits(seed: number, n: number): Bit[] {
  let x = seed & 0x7fffffff;
  const out: Bit[] = [];
  for (let k = 0; k < n; k++) { x = lcgNext(x); out.push(lcgBit(x)); }
  return out;
}

// ---- Counting

export const ones = (bits: Bit[]): number => bits.reduce<number>((t, b) => t + b, 0);

/** How many places two runs agree, over the shorter length. */
export function matches(a: Bit[], b: Bit[]): number {
  let m = 0;
  for (let i = 0; i < Math.min(a.length, b.length); i++) if (a[i] === b[i]) m++;
  return m;
}

/**
 * The usual range for a count of fair 50/50 events out of n (ones in n flips, or matches between two fresh runs):
 * mean n/2 plus or minus two standard deviations, 2 * sqrt(n)/2 = sqrt(n). Holds about 95% of the time (see tests).
 */
export function usualRange(n: number): { lo: number; hi: number } {
  const half = n / 2, spread = Math.sqrt(n);
  return { lo: Math.max(0, Math.ceil(half - spread)), hi: Math.min(n, Math.floor(half + spread)) };
}
