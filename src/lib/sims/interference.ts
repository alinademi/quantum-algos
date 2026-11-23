// Interference: the pure math behind the Two ways tool. No DOM.
// Circuit: started as |0>, then H, then the phase gate P(phi) = diag(1, e^{i phi}), then H, then measure.
// Each result x has two ways in: through the middle value m = 0, or through m = 1.
// The amplitude of a way is the product of the amplitudes along it (a path sum, as in Aaronson's notes, 3.3):
//   way(x, m) = <x|H|m> <m|P(phi)|m> <m|H|0>.
// The amplitude of result x is way(x, 0) + way(x, 1). Its chance is |sum|^2 (Born rule).
// Angles are in degrees, as the tool shows them.
import { c, add, abs, abs2, conj, mul, H, P, ket0, matVec, type C, type State } from '../quantum.ts';

const RAD = Math.PI / 180;

/** Shots in one batch: fresh qubits, each measured once. */
export const SHOTS = 200;
/** The phase slider, in degrees. */
export const PHASE = { min: 0, max: 360, step: 1, start: 0 } as const;
/** Preset phases: the ways add fully, sit at right angles, or cancel. */
export const PRESETS: readonly number[] = [0, 90, 180];

export type Result = 0 | 1;

// Float dust: sin(pi) is 1.2e-16, not 0. Below this we call it exactly 0.
const DUST = 1e-12;
const clean = (z: C): C => c(Math.abs(z.re) < DUST ? 0 : z.re, Math.abs(z.im) < DUST ? 0 : z.im);

/** The amplitude of one way: to result x through middle value m, the product along the path. */
export const way = (phi: number, x: Result, m: Result): C =>
  clean(mul(mul(H[x][m], P(phi * RAD)[m][m]), H[m][0]));

/** Both ways into result x: [through 0, through 1]. They are 1/2 and (-1)^x e^{i phi} / 2. */
export const ways = (phi: number, x: Result): [C, C] => [way(phi, x, 0), way(phi, x, 1)];

/** The amplitude of result x: the two ways added, (1 + (-1)^x e^{i phi}) / 2. */
export const amplitude = (phi: number, x: Result): C => clean(add(...ways(phi, x)));

/** Born rule: the chance of result x is |amplitude|^2. P(0) = cos^2(phi/2), P(1) = sin^2(phi/2).
 *  Capped at 1: float dust in (1/sqrt2)^2 can give 1.0000000000000004. */
export const chance = (phi: number, x: Result): number => Math.min(1, abs2(amplitude(phi, x)));

/** Chances of 0 and of 1. They add to 1. */
export const chances = (phi: number): [number, number] => [chance(phi, 0), chance(phi, 1)];

/** The same circuit run as matrices on the state, H P(phi) H |0>, to check the path sum against. */
export const finalState = (phi: number): State => matVec(H, matVec(P(phi * RAD), matVec(H, ket0())));

/** The chance one way would give on its own: |way|^2 = 1/4 for every way and every phase. */
export const alone = (phi: number, x: Result, m: Result): number => abs2(way(phi, x, m));

/** What result x would get if the chances of its two ways just added, as for coins: |a|^2 + |b|^2 = 1/2. */
export const oddsAdded = (phi: number, x: Result): number => alone(phi, x, 0) + alone(phi, x, 1);

/** The interference term 2 Re(conj(a) b): chance(x) = oddsAdded(x) + cross(x). It is (-1)^x cos(phi) / 2. */
export function cross(phi: number, x: Result): number {
  const [a, b] = ways(phi, x);
  return 2 * mul(conj(a), b).re;
}

// ---- Arrows: each amplitude drawn as an arrow with a length and a heading

/** Heading of an arrow in whole degrees, 0 to 359, counterclockwise from the right. Null for a zero arrow. */
export function heading(z: C): number | null {
  if (abs(z) < DUST) return null;
  const d = Math.round(Math.atan2(z.im, z.re) / RAD);
  return ((d % 360) + 360) % 360;
}

/** Fold any angle in degrees into 0 to 359. */
export const fold = (d: number): number => ((Math.round(d) % 360) + 360) % 360;

/** The angle between the two ways into result x, 0 to 359: phi for result 0, phi + 180 for result 1. */
export const gap = (phi: number, x: Result): number => fold(phi + 180 * x);

/** How the two arrows into result x combine, in words. Right angles: the chances simply add. */
export function combine(phi: number, x: Result): 'add' | 'cancel' | 'right angle' | 'partly add' | 'partly cancel' {
  const g = gap(phi, x);
  if (g === 0) return 'add';
  if (g === 180) return 'cancel';
  if (g === 90 || g === 270) return 'right angle';
  return g < 90 || g > 270 ? 'partly add' : 'partly cancel';
}

// ---- Words and numbers the tool shows

/** An arrow length to two decimals, e.g. 0.5 -> "0.50". Never "-0.00". */
export const len = (x: number): string => Math.abs(x).toFixed(2);

/** A chance as a whole percent. Never shows a false 0% or 100%. */
export function percent(p: number): string {
  if (p <= 0) return '0%';
  if (p >= 1) return '100%';
  if (p < 0.005) return 'under 1%';
  if (p >= 0.995) return 'over 99%';
  return `${Math.round(p * 100)}%`;
}

/** Whole-percent chances of 0 and of 1. When both are whole numbers they add to 100. */
export function percents(phi: number): [string, string] {
  const p0 = chance(phi, 0);
  if (p0 <= 0) return ['0%', '100%'];
  if (p0 >= 1) return ['100%', '0%'];
  if (p0 < 0.005) return ['under 1%', 'over 99%'];
  if (p0 >= 0.995) return ['over 99%', 'under 1%'];
  const a = Math.round(p0 * 100);
  return [`${a}%`, `${100 - a}%`];
}

/** One sentence on result x: the headings of its two arrows, how they combine, the length of the sum and its chance. */
export function sayResult(phi: number, x: Result): string {
  const [a, b] = ways(phi, x), how = combine(phi, x), p = percents(phi)[x], L = len(abs(amplitude(phi, x)));
  if (how === 'add') return `Result ${x}: both arrows point the same way, at ${heading(a)}°, and add, to length ${L}, chance ${p}.`;
  const arrows = `the arrows at ${heading(a)}° and ${heading(b)}°`;
  if (how === 'cancel') return `Result ${x}: ${arrows} point opposite ways and cancel, to length ${L}, chance ${p}.`;
  if (how === 'right angle') return `Result ${x}: ${arrows} are at right angles, to length ${L}, chance ${p}, the same as if chances added.`;
  return `Result ${x}: ${arrows} ${how}, to length ${L}, chance ${p}.`;
}

/** The full readout: the phase, both results, and the shots so far. */
export function describe(phi: number, zeros: number, shots: number): string {
  const run = shots ? ` Shots: ${zeros} of ${shots} gave 0, ${shots - zeros} gave 1.` : '';
  return `Phase ${phi}°. ${sayResult(phi, 0)} ${sayResult(phi, 1)}${run}`;
}

/** The slider's spoken value. */
export function valueText(phi: number): string {
  const [a, b] = percents(phi);
  return `${phi} degrees. Chance of 0: ${a}. Chance of 1: ${b}.`;
}

// ---- Shots

/** Fresh random draws in [0, 1), one per shot. */
export const draws = (n: number, rand: () => number): number[] => Array.from({ length: n }, () => rand());

/**
 * Shot i gives 0 when its own uniform draw us[i] is below P(0), so it gives 0 with chance P(0) (Born rule).
 * The draws stay fixed while the phase moves, so a shot changes pile only as P(0) passes its draw.
 */
export const gaveZero = (us: readonly number[], p0: number): boolean[] => us.map((u) => u < p0);

/** How many of the shots gave 0. */
export const countZeros = (us: readonly number[], p0: number): number => us.reduce((t, u) => t + (u < p0 ? 1 : 0), 0);

// ---- Picture layout (no physics)

/** Columns a pile may use. Each divides SHOTS, so a full pile is a full rectangle. */
export const PILE_COLS: readonly number[] = [10, 20, 25];
/** Largest dot pitch in a pile, in CSS pixels. */
export const PILE_MAX = 10;

/** Dot grid for a pile of n shots in a w by h box: the column count from PILE_COLS that gives the biggest dots. */
export function pileGrid(w: number, h: number, n: number): { cols: number; rows: number; pitch: number } {
  let best = { cols: PILE_COLS[0], rows: n / PILE_COLS[0], pitch: 0 };
  for (const cols of PILE_COLS) {
    const rows = n / cols, pitch = Math.min(w / cols, h / rows, PILE_MAX);
    if (pitch > best.pitch) best = { cols, rows, pitch };
  }
  return best;
}
