// Measuring part of a system: the pure math behind the PartialMeasure tool. No DOM.
// Three qubits q0 q1 q2, written left to right (quantum.ts: qubit 0 is the leftmost bit).
// Measure one qubit k in the standard basis (Watrous, Multiple systems, Partial measurements; Aaronson 5.3):
// - result r has chance P(r) = the sum of |amplitude|^2 over the strings whose bit k is r;
// - the state left behind is those terms only, all divided by sqrt(P(r)). The other terms are dropped.
import { c, abs2, abs, scale, inner, tensor, probs, plus, type State } from '../quantum.ts';

export type Bit = 0 | 1;

/** Qubits in the tool. */
export const QUBITS = 3;
/** Most copies one plot holds. */
export const MAX_COPIES = 200;

// Float dust: (1/sqrt2)^2 is 0.5000000000000001. Below this we call a number 0.
const DUST = 1e-12;
const S2 = Math.SQRT1_2;

// ---- Bits and strings

const size = (s: State) => Math.log2(s.length);

/** Qubit k's bit in string i of n qubits. Qubit 0 is the leftmost bit, as in quantum.ts. */
export const bitAt = (i: number, k: number, n: number): Bit => ((i >> (n - 1 - k)) & 1) as Bit;

/** String i written out, e.g. 5 on 3 qubits is "101". */
export const bits = (i: number, n: number): string => i.toString(2).padStart(n, '0');

/** String i with qubit k's bit taken out: the index of what the other n - 1 qubits read. */
export function dropBit(i: number, k: number, n: number): number {
  const low = n - 1 - k;
  return ((i >> (low + 1)) << low) | (i & ((1 << low) - 1));
}

/** The inverse of dropBit: put bit r back in at qubit k's place in rest string j. */
export function insertBit(j: number, k: number, r: Bit, n: number): number {
  const low = n - 1 - k;
  return ((j >> low) << (low + 1)) | (r << low) | (j & ((1 << low) - 1));
}

/** Names of the qubits not measured, in order: "q0 q2" when q1 is measured. */
export const restNames = (k: number, n: number): string =>
  Array.from({ length: n }, (_, q) => q).filter((q) => q !== k).map((q) => `q${q}`).join(' ');

// ---- The start states (all real amplitudes; the rules are the same for complex ones)

export type PresetId = 'separate' | 'agree' | 'signed';
/** name: the radio label. about: one line under the state. start: how readouts name the start state. */
export type Preset = { id: PresetId; name: string; about: string; start: string; state: State };

/** 0.6|0> + 0.8|1>: one qubit with chance 64% of giving 1. */
const tilted = (): State => [c(0.6), c(0.8)];

/** A state from its eight real amplitudes, listed |000> to |111>. */
const real = (a: number[]): State => a.map((x) => c(x));

export const PRESETS: readonly Preset[] = [
  {
    // q0 = |+>, q1 = 0.6|0> + 0.8|1>, q2 = |+>, each set on its own: a product state. Amplitudes 0.3 and 0.4.
    id: 'separate', name: 'Three separate qubits',
    about: 'Each qubit is set on its own. q0 and q2 are |+⟩ (started as 0, then a Hadamard gate); q1 is 0.6|0⟩ + 0.8|1⟩.',
    start: 'q0 = |+⟩, q1 = 0.6|0⟩ + 0.8|1⟩, q2 = |+⟩, each set on its own',
    state: tensor(tensor(plus(), tilted()), plus()),
  },
  {
    id: 'agree', name: 'All three agree',
    about: 'Equal amplitudes, 1/√2 ≈ 0.71, for 000 and 111, and none for the other six strings.',
    start: '(|000⟩ + |111⟩)/√2',
    state: real([S2, 0, 0, 0, 0, 0, 0, S2]),
  },
  {
    // 0.36|000> + 0.48|011> + 0.48|101> - 0.64|110>. Chances 0.1296 + 0.2304 + 0.2304 + 0.4096 = 1.
    id: 'signed', name: 'Uneven, with a minus sign',
    about: 'Four strings with uneven amplitudes, one of them negative.',
    start: '0.36|000⟩ + 0.48|011⟩ + 0.48|101⟩ − 0.64|110⟩',
    state: real([0.36, 0, 0, 0.48, 0, 0.48, -0.64, 0]),
  },
];

export const preset = (id: PresetId): Preset => PRESETS.find((p) => p.id === id) ?? PRESETS[0];

// ---- The partial measurement

/** Chance that measuring qubit k gives r: the sum of |amplitude|^2 over the strings whose bit k is r. */
export const branchChance = (s: State, k: number, r: Bit, n = size(s)): number =>
  s.reduce((t, a, i) => t + (bitAt(i, k, n) === r ? abs2(a) : 0), 0);

/** [P(0), P(1)] for measuring qubit k. They add up to 1. */
export const odds = (s: State, k: number, n = size(s)): [number, number] => [branchChance(s, k, 0, n), branchChance(s, k, 1, n)];

/**
 * The whole state after qubit k gave r: keep the strings whose bit k is r, drop the rest,
 * and divide what is kept by sqrt(P(r)) so the chances add up to 1 again.
 */
export function collapse(s: State, k: number, r: Bit, n = size(s)): State {
  const p = branchChance(s, k, r, n);
  if (!(p > 0)) throw new Error(`qubit ${k} cannot give ${r}: its chance is 0`);
  const f = 1 / Math.sqrt(p);
  return s.map((a, i) => (bitAt(i, k, n) === r ? scale(a, f) : c(0)));
}

/** The other n - 1 qubits after qubit k gave r: entry j is the amplitude of rest string j. Qubit k is now just |r>. */
export function leftover(s: State, k: number, r: Bit, n = size(s)): State {
  const after = collapse(s, k, r, n);
  return Array.from({ length: 2 ** (n - 1) }, (_, j) => after[insertBit(j, k, r, n)]);
}

/**
 * True when the rest is left in the same state whatever qubit k gives (up to a global phase).
 * That happens exactly when the state is (a state of qubit k) times (a state of the rest), a product across the cut.
 * If one result is impossible, only one leftover exists, so this is true too.
 */
export function sameLeftover(s: State, k: number, n = size(s)): boolean {
  const [p0, p1] = odds(s, k, n);
  if (p0 < DUST || p1 < DUST) return true;
  return abs(inner(leftover(s, k, 0, n), leftover(s, k, 1, n))) > 1 - 1e-9;
}

// ---- Shots: one copy, measured qubit k first, then the rest

/** Result of qubit k from one uniform draw u in [0, 1): 1 when u < P(1), as in quantum.ts. A result with chance 0 never comes up. */
export function firstResult(p0: number, p1: number, u: number): Bit {
  if (p1 <= 0) return 0;
  if (p0 <= 0) return 1;
  return u < p1 / (p0 + p1) ? 1 : 0;
}

/** Pick index i with chance p[i] / sum(p), from one uniform draw u in [0, 1). Never picks an index with chance 0. */
export function drawIndex(p: readonly number[], u: number): number {
  const total = p.reduce((t, x) => t + x, 0);
  let t = u * total, last = -1;
  for (let i = 0; i < p.length; i++) {
    if (!(p[i] > 0)) continue;
    last = i;
    t -= p[i];
    if (t < 0) return i;
  }
  if (last < 0) throw new Error('no outcome has a chance above 0');
  return last;
}

export type Copy = { first: Bit; string: number };

/**
 * Measure one fresh copy: qubit k first (draw u1), then the other qubits of the state it left (draw u2).
 * Returns the first result and the full string all three qubits gave.
 */
export function measureCopy(s: State, k: number, u1: number, u2: number, n = size(s)): Copy {
  const [p0, p1] = odds(s, k, n);
  const first = firstResult(p0, p1, u1);
  const j = drawIndex(probs(leftover(s, k, first, n)), u2);
  return { first, string: insertBit(j, k, first, n) };
}

/** Exact chance that a copy measured this way ends on string x: P(qubit k gives x's bit) times the leftover's |amplitude|^2. */
export function chainChance(s: State, k: number, x: number, n = size(s)): number {
  const r = bitAt(x, k, n), p = branchChance(s, k, r, n);
  return p > 0 ? p * abs2(leftover(s, k, r, n)[dropBit(x, k, n)]) : 0;
}

/** The strings a copy can end on after qubit k gave r: bit k is r and the amplitude is not 0. Counting order. */
export const columns = (s: State, k: number, r: Bit, n = size(s)): number[] =>
  s.map((_, i) => i).filter((i) => bitAt(i, k, n) === r && abs2(s[i]) > DUST);

export type Tally = { copies: number; firsts: [number, number]; strings: number[] };

/** Count the first results and the full strings. */
export function tally(copies: readonly Copy[], n = QUBITS): Tally {
  const t: Tally = { copies: copies.length, firsts: [0, 0], strings: new Array<number>(2 ** n).fill(0) };
  for (const x of copies) { t.firsts[x.first]++; t.strings[x.string]++; }
  return t;
}

/**
 * Dots one plot column should have room for: the mean count plus 5 standard deviations (binomial), plus 2.
 * A column goes past this with a chance far below one in a million; the tool makes room if it ever does.
 */
export const roomFor = (p: number, copies = MAX_COPIES): number =>
  Math.min(copies, Math.ceil(copies * p + 5 * Math.sqrt(copies * p * (1 - p))) + 2);

// ---- Words and numbers the tool shows

/** A real amplitude to two decimals with a true minus sign; 0 shows as "0". */
export function amp(x: number): string {
  if (Math.abs(x) < DUST) return '0';
  const t = Math.abs(x).toFixed(2);
  return x < 0 && t !== '0.00' ? `−${t}` : t;
}

/** A real state as a ket, zero terms left out: "0.60|00⟩ − 0.80|11⟩". An amplitude of 1 is not written. Real amplitudes only. */
export function ketText(s: State): string {
  const n = size(s);
  let out = '';
  s.forEach((a, i) => {
    if (Math.abs(a.im) > DUST) throw new Error('ketText writes real amplitudes only');
    if (Math.abs(a.re) < DUST) return;
    const neg = a.re < 0, m = Math.abs(a.re), head = Math.abs(m - 1) < DUST ? '' : amp(m);
    out += out ? ` ${neg ? '−' : '+'} ${head}|${bits(i, n)}⟩` : `${neg ? '−' : ''}${head}|${bits(i, n)}⟩`;
  });
  return out;
}

/** Whole percent. A real chance never shows as 0% or 100%: "under 1%", "over 99%". */
export function percent(p: number): string {
  if (p <= DUST) return '0%';
  if (p >= 1 - DUST) return '100%';
  if (p < 0.01) return 'under 1%';
  if (p > 0.99) return 'over 99%';
  // The tiny nudge undoes float error, so 0.125 computed as 0.12499999... still shows 13%.
  return `${Math.round(p * 100 + 1e-9)}%`;
}

/** A chance as a short decimal, at most 4 places: 0.36, 0.5, 0.5392. */
export const dec = (p: number): string => String(Number(p.toFixed(4)));

/** "√0.36 = 0.60" or "√0.5 ≈ 0.71": "=" only when both shown numbers are exact. */
export function rootText(p: number): string {
  const r = Math.sqrt(p), shown = Number(r.toFixed(2));
  const exact = Math.abs(p - Number(dec(p))) < 1e-12 && Math.abs(r - shown) < 1e-9;
  return `√${dec(p)} ${exact ? '=' : '≈'} ${r.toFixed(2)}`;
}

/** An expected count: whole numbers as they are, else one decimal ("4.3"). */
export const about = (x: number): string => String(Math.round(x * 10) / 10);

export type Row = { index: number; string: string; amp: string; chance: string; after: string };
export type Branch = {
  r: Bit; p: number; possible: boolean;
  /** "13% + 23% = 36%", or "50%" for one row. */
  sum: string;
  /** "√0.36 = 0.60" */
  root: string;
  rows: Row[];
  /** The rest's state as a ket, "0.60|00⟩ + 0.80|11⟩". */
  left: string;
};

/** Everything one branch card shows: the strings that agree with result r, their chances, and what is left. */
export function branch(s: State, k: number, r: Bit, n = size(s)): Branch {
  const p = branchChance(s, k, r, n), keep = columns(s, k, r, n);
  if (!keep.length) return { r, p: 0, possible: false, sum: '0%', root: '', rows: [], left: '' };
  const f = 1 / Math.sqrt(p);
  const rows = keep.map((i) => ({ index: i, string: bits(i, n), amp: amp(s[i].re), chance: percent(abs2(s[i])), after: amp(s[i].re * f) }));
  const sum = rows.length > 1 ? `${rows.map((x) => x.chance).join(' + ')} = ${percent(p)}` : percent(p);
  return { r, p, possible: true, sum, root: rootText(p), rows, left: ketText(leftover(s, k, r, n)) };
}

/**
 * What the readout says before any copy is measured: the start state, the odds and both possible leftovers.
 * `start` names the start state; by default it is the state written out.
 */
export function intro(s: State, k: number, start = ketText(s)): string {
  const n = size(s), [b0, b1] = [branch(s, k, 0, n), branch(s, k, 1, n)], rest = restNames(k, n), q = `q${k}`;
  if (!b0.possible || !b1.possible) {
    const b = b0.possible ? b0 : b1;
    return `Start state: ${start}. Measuring ${q} gives ${b.r} every time. It leaves ${rest} in ${b.left}.`;
  }
  let t = `Start state: ${start}. Measuring ${q} gives 0 with chance ${percent(b0.p)} and 1 with chance ${percent(b1.p)}. `;
  t += `If it gives 0, ${rest} are left in ${b0.left}. `;
  if (!sameLeftover(s, k, n)) return t + `If it gives 1, they are left in ${b1.left}.`;
  const g = inner(leftover(s, k, 0, n), leftover(s, k, 1, n));
  const how = Math.abs(g.re - 1) < 1e-9 ? 'that same state'
    : `that same state times ${Math.abs(g.re + 1) < 1e-9 ? '−1' : 'a phase'}, a global phase no measurement can see`;
  return t + `If it gives 1, they are left in ${how}, so ${q}'s result changes nothing for ${rest}.`;
}

/** What the readout says after copies were measured: the start state, counts against the Born rule, then the last copy step by step. */
export function report(s: State, k: number, copies: readonly Copy[], start = ketText(s)): string {
  if (!copies.length) return intro(s, k, start);
  const n = size(s), t = tally(copies, n), [p0, p1] = odds(s, k, n), q = `q${k}`, rest = restNames(k, n);
  const last = copies[copies.length - 1], j = dropBit(last.string, k, n), left = leftover(s, k, last.first, n);
  const step = `${q} gave ${last.first} (chance ${percent(last.first ? p1 : p0)}), which left ${rest} in ${ketText(left)}; `
    + `then ${rest} gave ${bits(j, n - 1)} (chance ${percent(abs2(left[j]))}).`;
  if (t.copies === 1) return `Start state: ${start}. 1 copy: ${step}`;
  const cols = [...columns(s, k, 0, n), ...columns(s, k, 1, n)];
  return `Start state: ${start}. ${t.copies} copies. ${q} gave 0 in ${t.firsts[0]} and 1 in ${t.firsts[1]}; the Born rule predicts about ${about(t.copies * p0)} and ${about(t.copies * p1)}. `
    + `Full strings: ${cols.map((x) => `${bits(x, n)} in ${t.strings[x]}`).join(', ')}; predicted about ${cols.map((x) => about(t.copies * abs2(s[x]))).join(', ')}. `
    + `Last copy: ${step}`;
}
