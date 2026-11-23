// Pure math for the Quantum Zeno stop. No DOM. Core math comes from ../quantum.ts.
// A qubit starts as 0. A steady drive turns it about the Y axis of the Bloch sphere and, left alone,
// takes it to 1 by the end of the run: a half turn (pi), like the rf pi pulse in Itano et al. 1990.
// n ideal checks (instant measurements in the 0/1 basis) split the run into n equal steps; the last check is at the end.
import { RY, matVec, measureQubit, ket0, type Matrix, type State } from '../quantum.ts';

export type Bit = 0 | 1;

/** Qubits in one batch of the tool. */
export const QUBITS = 50;
/** Fewest and most checks the tool allows. */
export const MIN_CHECKS = 1;
export const MAX_CHECKS = 100;
/** The drive's whole turn on the Bloch sphere: pi radians (180°), which takes |0> to |1>. */
export const HALF_TURN = Math.PI;

// Float dust: cos(pi/2) is 6e-17, not 0. A chance this close to 0 or 1 is exactly that.
const DUST = 1e-15;
const clean = (p: number): number => (p < DUST ? 0 : p > 1 - DUST ? 1 : p);

/** Bloch sphere angle the drive turns a qubit between two checks: total / n. */
export const stepAngle = (n: number, total = HALF_TURN): number => total / n;

/** The drive between two checks: RY(total / n). */
export const stepGate = (n: number, total = HALF_TURN): Matrix => RY(stepAngle(n, total));

/**
 * Chance a check reads the other result from the last one (or from the start, 0): sin^2(step / 2).
 * After a check the qubit is |0> or |1>, and one step turns either one away by the same angle, so the chance is the same.
 */
export const flipChance = (n: number, total = HALF_TURN): number => clean(Math.sin(stepAngle(n, total) / 2) ** 2);

/** Chance that all n checks read 0: (cos^2(total / 2n))^n. It goes to 1 as n grows. */
export const allZeroChance = (n: number, total = HALF_TURN): number => clean(Math.cos(stepAngle(n, total) / 2) ** (2 * n));

/**
 * Chance that check k (k = 1..n) reads 1: (1 - cos^k(step)) / 2.
 * Averaged over results, a check wipes the x and y parts of the Bloch vector, so each step multiplies its z part by cos(step).
 */
export const oneChanceAt = (k: number, n: number, total = HALF_TURN): number => clean((1 - Math.cos(stepAngle(n, total)) ** k) / 2);

/**
 * Chance the last check reads 1: (1 - cos^n(total / n)) / 2, Eq. (6) in Itano 2006 for total = pi.
 * n = 1 is the drive alone: sin^2(total / 2), so 1 for a half turn.
 */
export const endOneChance = (n: number, total = HALF_TURN): number => oneChanceAt(n, n, total);

/** Many checks: endOneChance and 1 - allZeroChance both approach total^2 / (4n). */
export const largeN = (n: number, total = HALF_TURN): number => total ** 2 / (4 * n);

/** One run: a fresh qubit started as |0>. n times: the drive turns it by RY(total / n), then a check measures it. */
export function run(n: number, rand: () => number, total = HALF_TURN): Bit[] {
  const u = stepGate(n, total), out: Bit[] = [];
  let s: State = ket0();
  for (let k = 0; k < n; k++) {
    const m = measureQubit(matVec(u, s), 0, rand, 1);
    out.push(m.result);
    s = m.state;
  }
  return out;
}

/** A batch of fresh qubits, each run with n checks. */
export const batch = (n: number, rand: () => number, qubits = QUBITS, total = HALF_TURN): Bit[][] =>
  Array.from({ length: qubits }, () => run(n, rand, total));

export type Tally = { qubits: number; endZero: number; endOne: number; allZero: number; flips: number };

/** What a batch shows: how many end at 0 and at 1, how many read 0 at every check, and how many results flipped (from the start, 0). */
export function tally(rows: Bit[][]): Tally {
  const t: Tally = { qubits: rows.length, endZero: 0, endOne: 0, allZero: 0, flips: 0 };
  for (const r of rows) {
    if (r[r.length - 1] === 1) t.endOne++; else t.endZero++;
    if (r.every((b) => b === 0)) t.allZero++;
    let last: Bit = 0;
    for (const b of r) { if (b !== last) t.flips++; last = b; }
  }
  return t;
}

// ---- Text for the tool. Every number the tool shows comes from here.

const trim = (s: string) => (s.includes('.') ? s.replace(/0+$/, '').replace(/\.$/, '') : s);

/** A chance as a percent. Whole from 10% to 99%, one decimal from 1% to 10%, two digits below 1%. Never a false 0% or 100%. */
export function percent(p: number): string {
  if (p <= 0) return '0%';
  if (p >= 1) return '100%';
  const x = p * 100;
  if (x > 99) return 'over 99%';
  if (x >= 10) return `${Math.round(x)}%`;
  return `${trim(x.toFixed(x >= 1 ? 1 : Math.min(20, 1 - Math.floor(Math.log10(x)))))}%`;
}

/** An angle in radians as degrees with at most 2 decimals, "about" when rounded: "11.25°", "about 2.81°". */
export function degrees(rad: number): string {
  const d = (rad * 180) / Math.PI, r = Math.round(d * 100) / 100;
  return `${Math.abs(d - r) < 1e-9 ? '' : 'about '}${trim(r.toFixed(2))}°`;
}

/** "1 check", "16 checks". */
export const checks = (n: number): string => `${n} ${n === 1 ? 'check' : 'checks'}`;

/** Slider value text. */
export const valueText = (n: number): string => `${checks(n)}. Theory: ${percent(endOneChance(n))} of qubits end at 1.`;

/** What theory says for n checks on a half turn. Does not depend on the random draws. */
export function theory(n: number, qubits = QUBITS): string {
  if (n === 1) return 'With 1 check, at the end, nothing interrupts the drive: it turns each qubit 180° on the Bloch sphere, from 0 to 1. Theory: every qubit reads 1.';
  const p1 = endOneChance(n);
  return `Between checks, each qubit turns ${degrees(stepAngle(n))} on the Bloch sphere. So at each check the result flips (0 to 1, or 1 to 0) with chance ${percent(flipChance(n))}. `
    + `Theory: ${percent(p1)} of qubits end at 1 (about ${Math.round(p1 * qubits)} of ${qubits}), and ${percent(allZeroChance(n))} read 0 at every check. `
    + 'With no checks before the end, all would end at 1.';
}

/** What one batch did, for the live readout. */
export function summary(n: number, t: Tally): string {
  if (n === 1) return `1 check, at the end: ${t.endOne === t.qubits ? `all ${t.qubits}` : `${t.endOne} of ${t.qubits}`} qubits read 1. Theory: all read 1.`;
  return `${checks(n)}: ${t.allZero} of ${t.qubits} qubits read 0 at every check. At the end, ${t.endOne} read 1 (${percent(t.endOne / t.qubits)}) and ${t.endZero} read 0. Theory: ${percent(endOneChance(n))} end at 1.`;
}
