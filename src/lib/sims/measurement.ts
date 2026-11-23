// Pure math for the Measurement stop: Born rule odds, the jump to the result, and the tallies the tool shows.
// No DOM here. Core math comes from ../quantum.ts.
import { c, probs, measureQubit, type State } from '../quantum.ts';

export type Bit = 0 | 1;
/** 'same': measure one qubit, then the same qubit twice more. 'fresh': the repeats use new copies. */
export type Mode = 'same' | 'fresh';

const clamp1 = (x: number) => Math.max(-1, Math.min(1, x));

/**
 * The tool's state a|0> + b|1>. The reader sets b, the amplitude of 1, from -1 to 1.
 * a = sqrt(1 - b^2) >= 0, so |a|^2 + |b|^2 = 1. This is RY(2 asin b)|0>: a qubit started as 0, then turned.
 * It covers every real qubit state up to a global phase, |+> and |-> included.
 */
export function prepare(b: number): State {
  const y = clamp1(b);
  return [c(Math.sqrt(Math.max(0, 1 - y * y))), c(y)];
}

/** Rotation angle (radians) that turns |0> into prepare(b) with an RY gate. */
export const turn = (b: number): number => 2 * Math.asin(clamp1(b));

/** Born rule for a standard basis measurement: [P(0), P(1)] = [|a|^2, |b|^2]. */
export function born(s: State): [number, number] {
  const [p0, p1] = probs(s);
  return [p0, p1];
}

/**
 * One run: measure a fresh copy of s, then measure `times - 1` more times.
 * 'same' measures the same qubit again, so each repeat sees the state left by the last measurement.
 * 'fresh' measures a new copy of s each time, so each result is a new Born rule draw.
 */
export function run(s: State, mode: Mode, rand: () => number, times = 3): Bit[] {
  const out: Bit[] = [];
  let q = s;
  for (let k = 0; k < times; k++) {
    const m = measureQubit(mode === 'same' ? q : s, 0, rand, 1);
    out.push(m.result);
    q = m.state;
  }
  return out;
}

/** Chance a repeat gives the same result as the first: 1 on the same qubit, p0^2 + p1^2 on a fresh copy. */
export function matchChance(s: State, mode: Mode): number {
  const [p0, p1] = born(s);
  return mode === 'same' ? 1 : p0 * p0 + p1 * p1;
}

export type Tally = { runs: number; zeros: number; ones: number; repeats: number; matches: number };

/** Count first results, and how many repeats matched the first result of their run. */
export function tally(runs: Bit[][]): Tally {
  const t: Tally = { runs: runs.length, zeros: 0, ones: 0, repeats: 0, matches: 0 };
  for (const r of runs) {
    if (r[0] === 0) t.zeros++; else t.ones++;
    for (let k = 1; k < r.length; k++) { t.repeats++; if (r[k] === r[0]) t.matches++; }
  }
  return t;
}

/** Count of a result with chance p over n independent tries (binomial): mean n p, spread sqrt(n p (1 - p)). */
export const binomial = (n: number, p: number) => ({ mean: n * p, sd: Math.sqrt(n * p * (1 - p)) });

// ---- Text for the readout. Real amplitudes only.

/** Amplitude with 3 decimals and a true minus sign; never "-0.000". */
export function amp(x: number): string {
  const s = Math.abs(x).toFixed(3);
  return x < 0 && s !== '0.000' ? `−${s}` : s;
}

/** Ket text like "0.866|0⟩ + 0.500|1⟩" or "0.707|0⟩ − 0.707|1⟩". */
export function ket(s: State): string {
  const b = s[1].re, bs = amp(Math.abs(b));
  return `${amp(s[0].re)}|0⟩ ${b < 0 && bs !== '0.000' ? '−' : '+'} ${bs}|1⟩`;
}

/** An expected count for the readout: whole numbers as they are, else one decimal ("7.5"). */
export const about = (x: number): string => String(Math.round(x * 10) / 10);

/** Whole percent for the readout. Tiny but possible odds say "under 1%", never "0%". (draw.ts pct rounds 0.3% to "0%".) */
export function percent(p: number): string {
  if (p <= 0) return '0%';
  if (p >= 1) return '100%';
  if (p < 0.01) return 'under 1%';
  if (p > 0.99) return 'over 99%';
  // The tiny nudge undoes float error, so 0.625 computed as 0.62499999... still shows 63%.
  return `${Math.round(p * 100 + 1e-9)}%`;
}

/**
 * The Born rule worked out for one amplitude x with chance p = |x|^2.
 * "=" only when both shown numbers are exact ("|0.500|² = 25%"), else "≈" ("|0.866|² ≈ 75%").
 */
export function chance(x: number, p: number): string {
  const head = `|${amp(x)}|²`, txt = percent(p);
  if (txt.startsWith('under') || txt.startsWith('over')) return `${head} is ${txt}`;
  const exact = Math.abs(Math.abs(x) - Number(Math.abs(x).toFixed(3))) < 1e-9 && Math.abs(p * 100 - Math.round(p * 100)) < 1e-6;
  return `${head} ${exact ? '=' : '≈'} ${txt}`;
}
