// Superposition: the pure math behind the Four ways and Guess, then run tools. No DOM.
// Four ways: one qubit, started as |0>, turned by RY. Real amplitudes only (phase comes in a later stop).
// Guess, then run: a qubit started as |0>, then a Hadamard gate, measured 1,000 times.
import { c, RY, H, ket0, matVec, probs, draw, type State } from '../quantum.ts';

/** Measured copies in the Four ways batch. */
export const DOTS = 100;
/** Shots in Guess, then run. */
export const SHOTS = 1000;
/** The answer choices in Guess, then run. */
export const GUESSES: readonly number[] = [0, 250, 500, 1000];

// Float dust: cos(pi/2) is 6e-17, not 0. Below this we call it exactly 0.
const DUST = 1e-12;
const clean = (x: number) => (Math.abs(x) < DUST ? 0 : x);

// ---- Four ways

/** The qubit after RY(deg) on |0>: cos(deg/2)|0> + sin(deg/2)|1>, with float dust set to 0. */
export const rotated = (deg: number): State =>
  matVec(RY((deg * Math.PI) / 180), ket0()).map((a) => c(clean(a.re), clean(a.im)));

/** Born rule: the chance of reading 0 is |amplitude of 0|^2. */
export const probZero = (s: State): number => probs(s)[0];

/** Whole-percent odds of 0 and of 1. They always add to 100, and never show a false 0% or 100%. */
export function odds(p0: number): [string, string] {
  if (p0 > 0.99 && p0 < 1) return ['over 99%', 'under 1%'];
  if (p0 > 0 && p0 < 0.01) return ['under 1%', 'over 99%'];
  const a = Math.round(p0 * 100);
  return [`${a}%`, `${100 - a}%`];
}

/** The Words view: the odds of each result in plain words. */
export function words(p0: number): string {
  if (p0 >= 1 - DUST) return 'Always 0.';
  if (p0 <= DUST) return 'Always 1.';
  const [a, b] = odds(p0);
  return `${a} chance of 0, ${b} chance of 1.`;
}

/** One real amplitude to two decimals, with a true minus sign and never "-0.00". */
export function amp(x: number): string {
  const s = Math.abs(x).toFixed(2);
  return x < 0 && s !== '0.00' ? `−${s}` : s;
}

/** The Ket view, e.g. "|ψ⟩ = 0.71|0⟩ + 0.71|1⟩". Real amplitudes only. */
export function ket(s: State): string {
  const [a, b] = s.map((x) => x.re), bs = amp(b);
  return `|ψ⟩ = ${amp(a)}|0⟩ ${bs.startsWith('−') ? '−' : '+'} ${bs.replace('−', '')}|1⟩`;
}

/**
 * One batch of measurements, each on a fresh copy. Copy i gives 0 when its own uniform draw us[i]
 * (in [0, 1)) is below p0, so each copy gives 0 with chance p0 (Born rule). The draws stay fixed,
 * so when p0 changes a copy flips only as p0 passes its draw: nothing is re-rolled.
 */
export const gaveZero = (us: readonly number[], p0: number): boolean[] => us.map((u) => u < p0);

// ---- Guess, then run

/** Started as 0, then a Hadamard gate: (|0> + |1>)/sqrt2. */
export const hadamardState = (): State => matVec(H, ket0());

/** Born-rule odds of 0 and 1 for the Hadamard qubit. */
export const hadamardOdds = (): number[] => probs(hadamardState());

/** n shots, each a fresh copy measured once: a list of results, 0 or 1. */
export const runShots = (p: number[], n: number, rand: () => number): number[] =>
  Array.from({ length: n }, () => draw(p, rand));

/** The answer choice nearest the expected count of zeros, shots * p0. */
export const bestGuess = (p0: number, shots = SHOTS, options = GUESSES): number =>
  options.reduce((best, g) => (Math.abs(g - shots * p0) < Math.abs(best - shots * p0) ? g : best));

/** What the tool says after a run. The guess is judged against the expected count, not against one random run. */
export function verdict(guess: number, zeros: number): string {
  const p0 = hadamardOdds()[0], half = Math.round(SHOTS * p0), ones = SHOTS - zeros;
  const why = 'Started as 0, a Hadamard gate gives a 50/50 split';
  if (guess !== bestGuess(p0)) return `Not quite. You got ${zeros} zeros and ${ones} ones. ${why}, so about ${half} of each.`;
  if (zeros === half) return `Right. You got exactly ${half} zeros and ${ones} ones this time. Each shot is random, so most runs land a little off. ${why}.`;
  return `Right. You got ${zeros} zeros and ${ones} ones, not exactly ${half} each, because each shot is random. ${why}.`;
}
