// Photon polarization as a qubit, and ideal polarizing filters as measurements in a basis.
// Conventions:
// - |H> (horizontal) = |0>, |V> (vertical) = |1>.
// - Angles are in degrees from horizontal, counterclockwise, as the tool shows them.
// - An ideal filter with axis a measures in the basis {|a>, |a + 90>}: it passes |a> and absorbs |a + 90>.
// - A lamp photon is unpolarized (density matrix I/2). It is passed as null.
import { c, abs2, inner, type State } from '../quantum.ts';

const RAD = Math.PI / 180;

/** Linear polarization at angle a: cos(a)|H> + sin(a)|V>. */
export const linear = (a: number): State => [c(Math.cos(a * RAD)), c(Math.sin(a * RAD))];

/** Chance that a photon in state s passes an ideal filter with axis a: |<a|s>|^2, the Born rule. */
export const passChance = (s: State, a: number): number => abs2(inner(linear(a), s));

/** Malus's law for one photon: polarized at angle d to the axis, it passes with chance cos^2(d). */
export const malus = (d: number): number => Math.cos(d * RAD) ** 2;

/** Unpolarized light (density matrix I/2) passes an ideal filter at any angle with chance tr(P I/2) = 1/2. */
export const UNPOLARIZED = 0.5;

/** The angle between two filter axes, folded into 0 to 90 degrees (axes repeat every 180). */
export function between(a: number, b: number): number {
  const x = (((b - a) % 180) + 180) % 180;
  return Math.min(x, 180 - x);
}

/** One photon meets one ideal filter with axis a. Born rule draw: true means it passes and is now linear(a);
 *  false means the filter absorbed it. s = null is an unpolarized lamp photon. */
export const passes = (s: State | null, a: number, rand: () => number): boolean =>
  rand() < (s ? passChance(s, a) : UNPOLARIZED);

/** Send one lamp photon through filters with axes fs, in order.
 *  Returns the index of the filter that absorbed it, or fs.length if it reached the screen. */
export function shoot(fs: number[], rand: () => number): number {
  let s: State | null = null;
  for (let k = 0; k < fs.length; k++) {
    if (!passes(s, fs[k], rand)) return k;
    s = linear(fs[k]);
  }
  return fs.length;
}

/** Exact chances for one lamp photon: entry k is the chance that filter k absorbs it,
 *  the last entry the chance that it reaches the screen. They sum to 1. */
export function fates(fs: number[]): number[] {
  const out: number[] = [];
  let alive = 1, s: State | null = null;
  for (const a of fs) {
    const p = s ? passChance(s, a) : UNPOLARIZED;
    out.push(alive * (1 - p));
    alive *= p;
    s = linear(a);
  }
  out.push(alive);
  return out;
}

/** Counts of each fate over many lamp photons, drawn one photon at a time. */
export function run(fs: number[], shots: number, rand: () => number): number[] {
  const n = Array.from({ length: fs.length + 1 }, () => 0);
  for (let k = 0; k < shots; k++) n[shoot(fs, rand)]++;
  return n;
}

/** Chance that a photon past the first filter gets through n more, stepped evenly from 0 to 90 degrees:
 *  cos^(2n)(90/n). It is 0 for n = 1, 1/4 for n = 2, and goes to 1 as n grows. */
export const stepped = (n: number): number => malus(90 / n) ** n;

/** Dot grid for a pile of n dots in a w by h box: the largest pitch (up to max) that fits them all. */
export function pileGrid(w: number, h: number, n: number, max = 6): { pitch: number; cols: number; rows: number } {
  let p = Math.min(max, w, h);
  for (; p > 0.5; p -= 0.05) {
    const cols = Math.floor(w / p);
    if (cols >= 1 && Math.ceil(n / cols) * p <= h) break;
  }
  return { pitch: p, cols: Math.max(1, Math.floor(w / p)), rows: Math.floor(h / p) };
}
