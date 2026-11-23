// Pure math for the Bits and coins stop: a random bit as a probability vector,
// flips drawn from it, what you know after a look, and what many flips should give.
// No DOM. Core sampling comes from ../quantum.ts.
import { draw } from '../quantum.ts';

/** A probability vector for one bit: [chance of 0, chance of 1]. */
export type PVec = [number, number];
export type Bit = 0 | 1;

/** Most flips the tool keeps on screen. Each pile has room for all of them. */
export const CAP = 1000;

/** The vector of a bit that gives 1 with chance k percent (k = 0..100). */
export function fromPercent(k: number): PVec {
  if (!Number.isInteger(k) || k < 0 || k > 100) throw new RangeError('percent must be a whole number from 0 to 100');
  return [(100 - k) / 100, k / 100];
}

/** True when v is a probability vector: no entry is negative and the entries add up to 1. */
export const isProbVec = (v: number[], eps = 1e-12): boolean =>
  v.length > 0 && v.every((x) => Number.isFinite(x) && x >= 0) && Math.abs(v.reduce((t, x) => t + x, 0) - 1) <= eps;

/** One flip: 0 with chance v[0], 1 with chance v[1]. rand gives a uniform number in [0, 1). */
export const flip = (v: PVec, rand: () => number): Bit => draw(v, rand) as Bit;

/** What you know right after a look that showed a: the sure vector |a>. */
export const seen = (a: Bit): PVec => (a === 0 ? [1, 0] : [0, 1]);

/** Average counts of 0 and 1 over n independent flips: n times each chance. */
export const expected = (v: PVec, n: number): PVec => [n * v[0], n * v[1]];

/** Standard deviation of the count of 1s (and of 0s) over n flips: the binomial sqrt(n p0 p1). */
export const spread = (v: PVec, n: number): number => Math.sqrt(n * v[0] * v[1]);

/** A vector entry for display: "0" and "1" for sure values, else two decimals ("0.30"). */
export const fmt = (x: number): string => (x === 0 || x === 1 ? String(x) : x.toFixed(2));

/** The vector as a sum of the sure vectors: "0.75|0⟩ + 0.25|1⟩", or just "|0⟩" / "|1⟩". */
export function ket(v: PVec): string {
  if (v[1] === 0) return '|0⟩';
  if (v[0] === 0) return '|1⟩';
  return `${fmt(v[0])}|0⟩ + ${fmt(v[1])}|1⟩`;
}

/** The vector as "(0.75, 0.25)" for running text. */
export const pair = (v: PVec): string => `(${fmt(v[0])}, ${fmt(v[1])})`;

/** A rough number for readouts: whole above 10, one decimal below ("4.3", "0.1", "250"). */
export const approx = (x: number): string => (x >= 10 ? Math.round(x).toLocaleString('en') : String(Math.round(x * 10) / 10));

/** Full rectangle of exactly cap dots for one pile in a w by h box, with dots as big as possible. */
export function pileGrid(w: number, h: number, cap = CAP): { cols: number; rows: number; pitch: number } {
  let best = { cols: 1, rows: cap, pitch: 0 };
  for (let cols = 1; cols <= cap; cols++) {
    if (cap % cols) continue;
    const rows = cap / cols, pitch = Math.min(w / cols, h / rows);
    if (pitch > best.pitch) best = { cols, rows, pitch };
  }
  return best;
}

/** Centre of the k-th dot (k = 0, 1, ...) in a pile that fills rows left to right, from the bottom up. */
export const slot = (k: number, cols: number, pitch: number): [number, number] => [(k % cols + 0.5) * pitch, (Math.floor(k / cols) + 0.5) * pitch];

/** Height that count dots fill in a pile with this grid, so a line there marks the expected count. */
export const fillHeight = (count: number, cols: number, pitch: number): number => (count / cols) * pitch;
