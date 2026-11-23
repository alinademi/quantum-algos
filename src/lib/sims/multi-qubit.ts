// Many qubits: the pure math behind the Register tool. No DOM.
// A register of n qubits (1 to 4). Each qubit is set on its own to |0>, |1> or |+> (started as 0, then a Hadamard
// gate), so the register is in a product state. Its state is a list of 2^n amplitudes, one per bit string.
// Rule 1: the strings are listed in counting order, so a string read as a binary number is its entry number.
// Rule 2: which qubit is which character is a choice (Watrous, Multiple systems, Classical information):
// - 'left': qubit 0 is the leftmost character (this site's quantum.ts, like Nielsen and Chuang; big-endian).
// - 'right': qubit 0 is the rightmost character (Qiskit; little-endian).
import { H, X, ket0, matVec, tensor, probs, type State } from '../quantum.ts';

/** Most qubits the tool offers: 4 qubits, 16 amplitudes. */
export const MAX_QUBITS = 4;
/** Fresh copies of the register measured in one batch. */
export const SHOTS = 100;
/** How one qubit can be set: 0, 1, or + (started as 0, then a Hadamard gate). */
export const SETTINGS = ['0', '1', '+'] as const;
export type Setting = (typeof SETTINGS)[number];
/** Where qubit 0 is written. */
export type Order = 'left' | 'right';

// Float dust: (1/sqrt2)^2 is 0.5000000000000001. Below this we call a number 0.
const DUST = 1e-12;

// ---- Counting

/** n qubits need 2^n amplitudes: one per string of n bits. */
export const amplitudeCount = (n: number): number => 2 ** n;

/** Every string of n bits in counting order: entry i is i written in binary with n digits. */
export const bitString = (i: number, n: number): string => i.toString(2).padStart(n, '0');

// ---- Bit order

/** The character position (0 = leftmost) that holds qubit k. */
export const position = (k: number, n: number, order: Order): number => (order === 'left' ? k : n - 1 - k);

/** The qubit written at each character position, left to right: [0, 1, 2] or [2, 1, 0]. */
export const writtenOrder = (n: number, order: Order): number[] =>
  Array.from({ length: n }, (_, p) => (order === 'left' ? p : n - 1 - p));

/** What qubit k is worth in the entry number: 2^(n-1-k) with qubit 0 on the left, 2^k with qubit 0 on the right. */
export const weight = (k: number, n: number, order: Order): number => 2 ** (n - 1 - position(k, n, order));

/** Entry number of the string where qubit k reads bits[k]. */
export const indexOf = (bits: readonly number[], order: Order): number =>
  bits.reduce((t, b, k) => t + b * weight(k, bits.length, order), 0);

/** Each qubit's bit (bits[k] = qubit k) in entry i. The inverse of indexOf. */
export const bitsOf = (i: number, n: number, order: Order): number[] =>
  Array.from({ length: n }, (_, k) => Math.floor(i / weight(k, n, order)) % 2);

/** Entry i with its n bits read backwards: where the same string lands when the order flips. */
export const bitReverse = (i: number, n: number): number => parseInt(bitString(i, n).split('').reverse().join(''), 2);

// ---- The state

/** One qubit: |0>, |1> = X|0>, or |+> = H|0> (started as 0, then a Hadamard gate). */
export const qubitState = (s: Setting): State => (s === '0' ? ket0() : matVec(s === '1' ? X : H, ket0()));

/** Born rule for one qubit: the chance it reads 1 is |amplitude of 1|^2. */
export const probOne = (s: Setting): number => probs(qubitState(s))[1];

/**
 * The register's 2^n amplitudes: the tensor product of each qubit's state, taken in the written order
 * (leftmost factor first). Amplitudes multiply: entry x gets the product of each qubit's amplitude for its bit.
 */
export const registerState = (settings: readonly Setting[], order: Order): State =>
  writtenOrder(settings.length, order).map((k) => qubitState(settings[k])).reduce((s, q) => tensor(s, q));

/** True when an amplitude is 0 (up to float dust). */
export const isZero = (a: { re: number; im: number }): boolean => Math.abs(a.re) < DUST && Math.abs(a.im) < DUST;

// ---- Shots

/** One fixed uniform draw in [0, 1) per copy j and qubit k, made once per batch so a batch stays the same batch. */
export const newDraws = (rand: () => number, shots = SHOTS, n = MAX_QUBITS): number[][] =>
  Array.from({ length: shots }, () => Array.from({ length: n }, () => rand()));

/**
 * Measure every qubit of every copy. Copy j's qubit k reads 1 when its draw us[j][k] is below P(1) = |amplitude of 1|^2.
 * Each qubit is set on its own (a product state), so the qubits' results are independent and copy j lands on string x
 * with chance |alpha_x|^2: the Born rule for the whole register (see landingChance and its tests).
 * Results are kept per qubit, not per string, so flipping the bit order relabels the same shots.
 */
export const measureAll = (us: readonly (readonly number[])[], settings: readonly Setting[]): number[][] => {
  const p = settings.map(probOne);
  return us.map((u) => p.map((pk, k) => (u[k] < pk ? 1 : 0)));
};

/** The entry each copy lands on, in the chosen order. */
export const landing = (results: readonly (readonly number[])[], order: Order): number[] => results.map((b) => indexOf(b, order));

/** Shots per entry of the vector. */
export const counts = (entries: readonly number[], n: number): number[] => {
  const k = new Array<number>(amplitudeCount(n)).fill(0);
  for (const i of entries) k[i]++;
  return k;
};

/** The exact chance that one copy lands on entry i under measureAll: the product of each qubit's odds for its bit. */
export const landingChance = (i: number, settings: readonly Setting[], order: Order): number =>
  bitsOf(i, settings.length, order).reduce((t, b, k) => t * (b ? probOne(settings[k]) : 1 - probOne(settings[k])), 1);

/** Expected shots on each entry: SHOTS * |amplitude|^2. */
export const expected = (s: State, shots = SHOTS): number[] => probs(s).map((p) => shots * p);

// ---- Words and numbers the tool shows

/** One real amplitude to two decimals, with a true minus sign; exactly 0 shows as "0". */
export function amp(x: number): string {
  if (Math.abs(x) < DUST) return '0';
  const s = Math.abs(x).toFixed(2);
  return x < 0 ? `−${s}` : s;
}

/** A chance as "1 in N" when it is exactly 1/N (every chance in this tool is), else a whole percent. */
export function chance(p: number): string {
  const n = 1 / p;
  return Math.abs(n - Math.round(n)) < 1e-9 ? `1 in ${Math.round(n)}` : `${Math.round(p * 100)}%`;
}

/** The order line, e.g. "|q0 q1 q2⟩" or "|q2 q1 q0⟩". */
export const orderText = (n: number, order: Order): string => `|${writtenOrder(n, order).map((k) => `q${k}`).join(' ')}⟩`;

/** The register as one ket per qubit in the written order, e.g. "|1⟩|0⟩|+⟩". */
export const factorText = (settings: readonly Setting[], order: Order): string =>
  writtenOrder(settings.length, order).map((k) => `|${settings[k]}⟩`).join('');

/** The state written out, zero terms left out, e.g. "0.71|100⟩ + 0.71|101⟩". An amplitude of exactly 1 is not written. */
export const ketText = (s: State): string => {
  const n = Math.log2(s.length);
  return s
    .map((a, i) => (isZero(a) ? '' : `${Math.abs(a.re - 1) < DUST ? '' : amp(a.re)}|${bitString(i, n)}⟩`))
    .filter(Boolean)
    .join(' + ');
};

/** The State line: the product form, then the same state written out. */
export const stateText = (settings: readonly Setting[], order: Order): string => {
  const f = factorText(settings, order), k = ketText(registerState(settings, order));
  return f === k ? f : `${f} = ${k}`;
};

const list = (xs: string[]): string => (xs.length < 2 ? xs.join('') : `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`);

/** What the readout says: the size of the vector, the entries that are not zero, where qubit 0 sits, and the shots. */
export function readout(settings: readonly Setting[], order: Order, shotCounts: readonly number[]): string {
  const n = settings.length, N = amplitudeCount(n), s = registerState(settings, order), p = probs(s);
  const on = s.map((_, i) => i).filter((i) => !isZero(s[i]));
  const shots = shotCounts.reduce((t, x) => t + x, 0);
  const ket = (i: number) => `|${bitString(i, n)}⟩ (entry ${i})`;
  const out = [`${n} ${n === 1 ? 'qubit' : 'qubits'}, so ${N} amplitudes.`];

  if (on.length === 1) out.push(`Only the amplitude on ${ket(on[0])} is not zero: it is 1.`);
  else if (on.length === N) out.push(`${N === 2 ? 'Both are' : `All ${N} are`} ${amp(s[0].re)}, so each string has a ${chance(p[0])} chance.`);
  else if (on.length <= 4) out.push(`Not zero: ${list(on.map((i) => `${amp(s[i].re)} on ${ket(i)}`))}, a ${chance(p[on[0]])} chance each.`);
  else out.push(`${on.length} are ${amp(s[on[0]].re)}, so each of those strings has a ${chance(p[on[0]])} chance. The other ${N - on.length} are 0.`);

  out.push(n === 1 ? 'With one qubit, both orders are the same.' : `Qubit 0 is the ${order === 'left' ? 'leftmost' : 'rightmost'} bit, worth ${weight(0, n, order)} in the entry number.`);

  if (on.length === 1) out.push(`All ${shots} shots gave the string ${bitString(on[0], n)}.`);
  else if (on.length <= 4) out.push(`Of ${shots} shots, ${list(on.map((i) => `${shotCounts[i]} gave ${bitString(i, n)}`))}.`);
  else {
    const c = on.map((i) => shotCounts[i]);
    out.push(`Of ${shots} shots, each of these ${on.length} strings got between ${Math.min(...c)} and ${Math.max(...c)}.`);
  }
  if (on.length < N) out.push('None gave a string with amplitude 0.');
  return out.join(' ');
}
