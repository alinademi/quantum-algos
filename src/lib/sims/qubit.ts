// Qubit stop: give a bit and a qubit the same steps, both started as 0, then read many fresh copies.
// "Flip" is NOT on both. "Half flip" on the qubit is a square root of NOT, R = HSH, so R² = X exactly
// (Watrous, Understanding Quantum Information and Computation, Single systems). On the bit, the only step
// that gives 50/50 odds from both 0 and 1 is a fair coin toss; it squares to itself, never to NOT.
import { H, S, X, matMul, matVec, ket0, probs, draw, type C, type Matrix, type State } from '../quantum.ts';

export type Step = 'flip' | 'half';
export type Odds = [number, number];

/** Square root of NOT: R = HSH = ½ [[1+i, 1−i], [1−i, 1+i]]. Two of them make X. */
export const HALF: Matrix = matMul(H, matMul(S, H));

/** A stochastic matrix acts on a bit's odds. Column j holds the odds of 0 and 1 for a bit that was j. */
export type Stochastic = number[][];
export const FLIP_BIT: Stochastic = [[0, 1], [1, 0]];
/** A fair coin toss: flip with chance ½. Sends 0 and 1 alike to (½, ½). */
export const COIN_BIT: Stochastic = [[0.5, 0.5], [0.5, 0.5]];

export const stochApply = (m: Stochastic, v: number[]): number[] => m.map((row) => row.reduce((t, x, j) => t + x * v[j], 0));
export const stochMul = (a: Stochastic, b: Stochastic): Stochastic => a.map((row) => b[0].map((_, j) => row.reduce((t, x, k) => t + x * b[k][j], 0)));

/** The qubit state after the steps, started as |0⟩. */
export const qubitState = (steps: Step[]): State => steps.reduce((s, k) => matVec(k === 'flip' ? X : HALF, s), ket0());

/** Exact odds [P(0), P(1)] for the qubit, by the Born rule. */
export const qubitOdds = (steps: Step[]): Odds => { const [p0, p1] = probs(qubitState(steps)); return [p0, p1]; };

/** Exact odds [P(0), P(1)] for the bit, started as 0. */
export const bitOdds = (steps: Step[]): Odds => {
  const [p0, p1] = steps.reduce<number[]>((v, k) => stochApply(k === 'flip' ? FLIP_BIT : COIN_BIT, v), [1, 0]);
  return [p0, p1];
};

/** Read fresh bits: each copy starts at 0 and really runs every step (a flip, or a coin toss), then is read. */
export function readBits(steps: Step[], shots: number, rand: () => number): (0 | 1)[] {
  return Array.from({ length: shots }, () => {
    let b = 0;
    for (const k of steps) if (k === 'flip' || rand() < 0.5) b ^= 1;
    return b as 0 | 1;
  });
}

/** Read fresh qubits: each result is one Born-rule draw from the final state. */
export function readQubits(steps: Step[], shots: number, rand: () => number): (0 | 1)[] {
  const p = probs(qubitState(steps));
  return Array.from({ length: shots }, () => draw(p, rand) as 0 | 1);
}

export const ones = (reads: number[]): number => reads.reduce((t, x) => t + x, 0);

const EPS = 1e-9;
/** True when the result is certain: odds of 0% or 100%. */
export const sure = (p: number): boolean => p < EPS || p > 1 - EPS;

const MINUS = '−';
const num = (x: number): string => {
  const r = Math.round(x * 100) / 100;
  const s = String(Math.abs(r) < 0.005 ? 0 : Math.abs(r));
  return r < 0 && s !== '0' ? MINUS + s : s;
};

/** A complex amplitude to 2 decimals: "1", "0.5+0.5i", "−i", "0". */
export function fmtC(z: C): string {
  const re = num(z.re), im = num(z.im);
  if (im === '0') return re;
  const imag = (im === '1' ? '' : im === MINUS + '1' ? MINUS : im) + 'i';
  if (re === '0') return imag;
  return re + (imag.startsWith(MINUS) ? imag : '+' + imag);
}

const STEP_NAME: Record<Step, string> = { flip: 'flip', half: 'half flip' };
export const stepsText = (steps: Step[]): string => (steps.length ? steps.map((k) => STEP_NAME[k]).join(', ') : 'none yet');

const reads = (n1: number, n: number): string =>
  n1 === n ? `all ${n} read 1` : n1 === 0 ? `all ${n} read 0` : `${n1} of ${n} read 1`;

/** The readout in words. Counts come from the shots; odds and the closing note come from the exact math. */
export function describe(steps: Step[], bit1: number, qubit1: number, shots: number): string {
  const [, pb] = bitOdds(steps), [, pq] = qubitOdds(steps);
  const head = steps.length ? `Steps: ${stepsText(steps)}.` : 'Both start at 0.';
  const counts = `Bit: ${reads(bit1, shots)}, odds of 1 are ${Math.round(pb * 100)}%. Qubit: ${reads(qubit1, shots)}, odds of 1 are ${Math.round(pq * 100)}%.`;
  // A sure bit means no coin tosses, so the qubit is sure too (tested).
  const note = !steps.length ? 'Nothing has happened yet, so every copy reads 0. Try a half flip.'
    : sure(pb) ? 'With full flips only, the qubit acts just like the bit.'
    : sure(pq) ? `Every two half flips make a full flip, so the qubit reads ${Math.round(pq)} every time. The bit's coin tosses stay random.`
    : 'Same odds, so they look the same. Try one more half flip.';
  return `${head} ${counts} ${note}`;
}
