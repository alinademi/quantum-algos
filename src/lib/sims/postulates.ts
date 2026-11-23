// Pure math for the Postulates stop: the four rules on two qubits, A and B. No DOM.
// State: each qubit is a unit vector. Joining: the pair is A ⊗ B (A is qubit 0, written on the left, as in quantum.ts).
// Change: a 4x4 matrix acts on the pair; the rules allow only unitary ones in a closed system.
// Measurement: each string 00, 01, 10, 11 comes up with chance |amplitude|^2 (the Born rule), and the state becomes that string.
// Amplitudes here are real. The rules allow complex ones too; the tool says so.
import { c, abs, sub, mul, tensor, norm2, probs, matVec, matMul, dagger, kron, inner, I, H, type C, type State, type Matrix } from '../quantum.ts';
import { pct } from '../draw.ts';

/** The changes the tool offers. 'merge' sends A's 0 and 1 both to 0: linear, but not unitary, so the rules forbid it. */
export type Change = 'none' | 'h' | 'cnot' | 'merge';
export const CHANGES: readonly Change[] = ['none', 'h', 'cnot', 'merge'];

/** Strings of the pair in counting order, A's bit first: entry i is i in binary. */
export const STRINGS = ['00', '01', '10', '11'] as const;

/** Most copies the tool measures before it is full, and copies per press. */
export const CAP = 400;
export const BATCH = 100;

// Float dust: sqrt(1 - 0.5) is not exactly 1/sqrt(2). Below this a number is 0; this close to 1 it is 1.
const DUST = 1e-12;
const snap = (x: number): number => (Math.abs(x) < DUST ? 0 : Math.abs(Math.abs(x) - 1) < DUST ? Math.sign(x) : x);
/** Clear float dust from a state, so an amplitude that cancels shows as 0 and its chance as 0%. */
export const clean = (s: State): State => s.map((a) => c(snap(a.re), snap(a.im)));

const clamp1 = (x: number) => Math.max(-1, Math.min(1, x));

// ---- Rule: State

/**
 * One qubit with real amplitudes, sqrt(1 - b^2)|0> + b|1>. The reader sets b, the amplitude of 1, from -1 to 1;
 * the amplitude of 0 is set so that |a|^2 + |b|^2 = 1. Up to a global phase this covers every real qubit state.
 */
export function qubit(b: number): State {
  const y = clamp1(b);
  return clean([c(Math.sqrt(Math.max(0, 1 - y * y))), c(y)]);
}

/** Sum of |amplitude|^2. The State rule needs it to be 1. */
export const total = (s: State): number => norm2(s);

/** True when the |amplitude|^2 values add up to 1 (up to float error): a list of amplitudes that is a state. */
export const isState = (s: State): boolean => Math.abs(total(s) - 1) < 1e-9;

// ---- Rule: Joining

/** The pair: A ⊗ B, A on the left. Entry 2 (string 10) is "A is 1, B is 0". Amplitudes multiply: alpha_xy = a_x b_y. */
export const join = (a: State, b: State): State => clean(tensor(a, b));

// ---- Rule: Change

/** The one-qubit map |0> -> |0>, |1> -> |0>. It is linear but not unitary: it sends two different states to one. */
export const MERGE: Matrix = [[c(1), c(1)], [c(0), c(0)]];

/** CNOT with A (qubit 0) as control and B (qubit 1) as target: swaps the amplitudes of 10 and 11. */
export const CNOT: Matrix = [
  [c(1), c(0), c(0), c(0)],
  [c(0), c(1), c(0), c(0)],
  [c(0), c(0), c(0), c(1)],
  [c(0), c(0), c(1), c(0)],
];

/** The 4x4 matrix of each change on the pair. A one-qubit map u on A is u ⊗ I. */
export function matrix(k: Change): Matrix {
  if (k === 'none') return kron(I, I);
  if (k === 'h') return kron(H, I);
  if (k === 'cnot') return CNOT;
  return kron(MERGE, I);
}

/** Apply a change to the pair. */
export const change = (k: Change, s: State): State => clean(matVec(matrix(k), s));

/** U†U = I, entry by entry, within eps. */
export function isUnitary(m: Matrix, eps = 1e-12): boolean {
  const p = matMul(dagger(m), m);
  return p.every((row, i) => row.every((x, j) => abs(sub(x, c(i === j ? 1 : 0))) < eps));
}

/** True for the changes the rules allow in a closed system. */
export const allowed = (k: Change): boolean => isUnitary(matrix(k));

// ---- Product or entangled

/** alpha00 alpha11 - alpha01 alpha10. A two-qubit state splits into A ⊗ B exactly when this is 0. */
export const splitTest = (s: State): C => sub(mul(s[0], s[3]), mul(s[1], s[2]));

/** Concurrence of a two-qubit pure state, 2|alpha00 alpha11 - alpha01 alpha10|: 0 for a product, 1 for a Bell state. */
export const concurrence = (s: State): number => 2 * abs(splitTest(s));

/** True when the state splits into one state for A and one for B (up to float dust). */
export const isProduct = (s: State): boolean => abs(splitTest(s)) < 1e-9;

// ---- Rule: Measurement

/** Born rule: the chance of each string is |amplitude|^2. Only meaningful when isState(s). */
export const born = (s: State): number[] => probs(clean(s));

/** One shot: draw a string with the Born odds. Never returns a string whose chance is 0, even with float error. */
export function shot(p: readonly number[], rand: () => number): number {
  let r = rand(), last = 0;
  for (let i = 0; i < p.length; i++) {
    if (p[i] <= 0) continue;
    last = i;
    r -= p[i];
    if (r < 0) return i;
  }
  return last;
}

/** Shots per string. */
export const counts = (shots: readonly number[]): number[] => {
  const k = [0, 0, 0, 0];
  for (const i of shots) k[i]++;
  return k;
};

/** Expected count of each string over n copies: n |amplitude|^2. */
export const expected = (s: State, n: number): number[] => born(s).map((p) => n * p);

/**
 * A projective measurement outcome with projector P (P = P² = P†): chance p = <psi|P|psi> and state P|psi> / sqrt(p).
 * P can have any rank: |j><j| reads the whole string, |0><0| ⊗ I reads only A.
 */
export function project(s: State, P: Matrix): { p: number; state: State } {
  const kept = matVec(P, s), p = inner(s, kept).re;
  if (p <= 0) throw new Error('outcome has chance 0');
  return { p, state: kept.map((a) => c(a.re / Math.sqrt(p), a.im / Math.sqrt(p))) };
}

/** The projector |j><j| onto string j of the pair. */
export const stringProjector = (j: number): Matrix => [0, 1, 2, 3].map((r) => [0, 1, 2, 3].map((k) => c(r === j && k === j ? 1 : 0)));

/** The state after outcome j of measuring both qubits: P_j|psi> / ||P_j|psi>||, with P_j = |j><j|. It is |j> up to a global phase. */
export const after = (s: State, j: number): State => project(s, stringProjector(j)).state;

// ---- Words and numbers the tool shows. Real amplitudes only.

/** One real amplitude to 3 decimals with a true minus sign. A tiny but real amplitude keeps one digit (0.0001), never 0.000. */
export function amp(x: number): string {
  const v = Math.abs(x);
  const s = v === 0 ? '0.000' : v < 0.0005 ? v.toPrecision(1) : v.toFixed(3);
  return x < 0 && v !== 0 ? `−${s}` : s;
}

/** A ket like "0.707|00⟩ + 0.707|11⟩", strings with amplitude 0 left out; the zero vector is "0". */
export function ket(s: State): string {
  const n = Math.log2(s.length);
  const terms = s.map((a, i) => [a.re, i] as const).filter(([x]) => x !== 0);
  if (!terms.length) return '0';
  return terms
    .map(([x, i], k) => {
      const lab = `${amp(Math.abs(x))}|${i.toString(2).padStart(n, '0')}⟩`;
      return k === 0 ? (x < 0 ? `−${lab}` : lab) : `${x < 0 ? '−' : '+'} ${lab}`;
    })
    .join(' ');
}

/** A sum of |amplitude|^2 as a percent. It can be over 100% when the change is not unitary. Exactly 1 shows as "100%". */
export function totalText(t: number): string {
  if (Math.abs(t - 1) < 1e-9) return '100%';
  if (t < 1e-15) return '0%';
  const v = t * 100;
  if (v < 0.05) return '<0.1%';
  const s = v.toFixed(1);
  // Never round a total that is not 100% to "100%".
  if (s === '100.0') return v < 100 ? '99.9%' : '100.1%';
  return `${s.endsWith('.0') ? s.slice(0, -2) : s}%`;
}

/** An expected count: whole numbers as they are, else one decimal ("37.5"). */
export const about = (x: number): string => String(Math.round(x * 10) / 10);

/** Name of a one-qubit state set by b: |0⟩, |1⟩, |+⟩, |−⟩, or its ket. */
export function name(b: number): string {
  if (Math.abs(b) < 1e-9) return '|0⟩';
  if (Math.abs(b - 1) < 1e-9) return '|1⟩';
  if (Math.abs(b - Math.SQRT1_2) < 1e-9) return '|+⟩';
  if (Math.abs(b + Math.SQRT1_2) < 1e-9) return '|−⟩';
  return ket(qubit(b));
}

/** Short name of a change, for the readout. */
export const changeName: Record<Change, string> = {
  none: 'no change',
  h: 'a Hadamard gate on A',
  cnot: 'a CNOT with A as control',
  merge: "sending A's 0 and 1 both to 0",
};

/** "Started as A = |+⟩ and B = |0⟩" */
export const startText = (bA: number, bB: number): string => `Started as A = ${name(bA)} and B = ${name(bB)}`;

/** The Born rule odds of every string with a nonzero chance, like "00 with chance 50%, 11 with chance 50%". */
export function oddsText(p: readonly number[]): string {
  const on = p.map((x, i) => [x, i] as const).filter(([x]) => x > 0);
  const list = on.map(([x, i]) => `${STRINGS[i]} with chance ${pct(x)}`).join(', ');
  return on.length < 4 ? `${list}; the other ${4 - on.length === 1 ? 'string never comes up' : 'strings never come up'}` : list;
}

/** Everything the tool knows about the pair before any shot, in words. Names the start state. */
export function describe(bA: number, bB: number, k: Change): string {
  const joined = join(qubit(bA), qubit(bB)), out = change(k, joined), t = total(out);
  let txt = `${startText(bA, bB)}. Joined, the pair is ${ket(joined)}. `;
  txt += k === 'none' ? 'With no change it stays that way. ' : `Then ${changeName[k]} gives ${ket(out)}. `;
  if (!allowed(k)) {
    if (isState(out)) {
      txt += `The |amplitude|² values still add up to 100%, but only because A started as 0 or 1. Start A as |+⟩ and they add up to 200%. `;
    } else {
      txt += `The |amplitude|² values now add up to ${totalText(t)}, not 100%, so they cannot be odds. `;
    }
    return txt + 'This change is not unitary, so the rules forbid it in a closed system. Measuring is off for it.';
  }
  txt += 'The |amplitude|² values still add up to 100%. ';
  txt += isProduct(out) ? 'The pair splits into one state for A and one for B. ' : 'The pair no longer splits into one state for A and one for B: it is entangled. ';
  return txt + `Born rule: ${oddsText(born(out))}.`;
}

/** The readout after shots: counts against the Born rule prediction. Names the start state and the change. */
export function shotsText(bA: number, bB: number, k: Change, shots: readonly number[]): string {
  const out = change(k, join(qubit(bA), qubit(bB))), n = shots.length, got = counts(shots), e = expected(out, n);
  const how = k === 'none' ? 'with no change' : `then ${changeName[k]}`;
  const head = `${startText(bA, bB)}, ${how}: ${n} ${n === 1 ? 'copy' : 'copies'} measured. `;
  const seen = STRINGS.map((x, i) => `${x} gave ${got[i]}`).join(', ');
  const pred = e.map(about).join(', ');
  const full = n >= CAP ? ' The plot is full. Press Clear to start again.' : '';
  return `${head}${seen}. The Born rule predicts about ${pred}.${full}`;
}
