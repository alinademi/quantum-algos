// EPR in Bohm's spin version: a source sends out pairs of spin one-half particles (qubits) in the singlet state, one to
// Alice and one to Bob, far apart. Each measures the spin of her or his particle along Z or along X.
// The 1935 EPR paper used position and momentum; Bohm (1951) put the same argument in terms of spin. Z and X play the
// roles of position and momentum: two quantities that no quantum state makes sure at once.
// Conventions:
// - Qubit 0 is Alice's particle, qubit 1 is Bob's (quantum.ts bit order: in |ab>, a is Alice's bit).
// - Spin up along Z is |0>, spin down along Z is |1>.
// - A detector's axis lies in the x-z plane at angle t from Z. Up along it is RY(t)|0> = cos(t/2)|0> + sin(t/2)|1>,
//   down is RY(t)|1>. Z is t = 0 and X is t = pi/2, so up along X is |+> and down along X is -|-> (a global phase).
// - A result is 0 for up (eigenvalue +1) and 1 for down (eigenvalue -1).
// - Joint odds are listed by index 2a + b for Alice's result a and Bob's result b: [up up, up down, down up, down down].
// - 'hidden' is a local hidden-variable model built for comparison: each pair leaves the source carrying set answers.
//   It is not quantum theory, and the EPR paper proposed no such model.
import { H, RY, abs2, add, apply1, basis, cnot, conj, inner, ket0, ket1, matVec, mul, norm2, normalize, tensor, type State } from '../quantum.ts';

export type Setting = 'Z' | 'X';
export type Result = 0 | 1;
export type Source = 'quantum' | 'hidden';
export type Pair = { a: Result; b: Result };

export const SETTINGS: readonly Setting[] = ['Z', 'X'];
export const RESULTS: readonly Result[] = [0, 1];

/** Clean float dust, so a sure or impossible result reads as exactly 1 or 0, never as 0.9999999999999998 or 1e-33. */
export const snap = (p: number): number => (Math.abs(p) < 1e-12 ? 0 : Math.abs(p - 1) < 1e-12 ? 1 : p);

/** The detector's axis as an angle from Z in the x-z plane: Z is 0, X is pi/2. */
export const angle = (s: Setting): number => (s === 'Z' ? 0 : Math.PI / 2);

/** Spin along the axis at angle t: result 0 (up) is RY(t)|0>, result 1 (down) is RY(t)|1>. */
export const along = (t: number, r: Result): State => matVec(RY(t), r === 0 ? ket0() : ket1());

/** The singlet (|01> - |10>)/sqrt2, made from |11> by a Hadamard gate on qubit 0, then a CNOT from qubit 0 to qubit 1. */
export const singlet = (): State => cnot(apply1(basis(2, 3), H, 0), 0, 1);

/** Born rule: chance of each pair of results when Alice measures along angle ta and Bob along tb.
 *  The amplitude for results (a, b) is <a along ta| <b along tb| psi>, and its chance is |amplitude|^2. */
export const jointAt = (psi: State, ta: number, tb: number): number[] =>
  RESULTS.flatMap((a) => RESULTS.map((b) => snap(abs2(inner(tensor(along(ta, a), along(tb, b)), psi)))));

/** Closed form for the singlet, with axes theta = ta - tb apart: both up or both down with chance sin^2(theta/2) / 2 each,
 *  opposite results with chance cos^2(theta/2) / 2 each. */
export function jointClosed(ta: number, tb: number): number[] {
  const s = Math.sin((ta - tb) / 2) ** 2 / 2, o = Math.cos((ta - tb) / 2) ** 2 / 2;
  return [s, o, o, s];
}

/** Chance that the two results are opposite (up down or down up). */
export const opposite = (p: number[]): number => snap(p[1] + p[2]);

/** Quantum theory's odds for the singlet, for two detector settings. */
export const quantumJoint = (a: Setting, b: Setting): number[] => jointAt(singlet(), angle(a), angle(b));

// ---- One side at a time: Alice measures first, and her result fixes Bob's state (standard quantum mechanics).

/** Bob's amplitudes once Alice's qubit is projected onto result a along ta: sum over i of conj(e_i) psi[2i + j].
 *  Not normalized: its squared length is the chance of Alice's result. */
const bobPart = (psi: State, ta: number, a: Result): State => {
  const e = along(ta, a);
  return [0, 1].map((j) => add(mul(conj(e[0]), psi[j]), mul(conj(e[1]), psi[2 + j])));
};

/** Born rule for Alice alone: chance of her result a along ta, whatever Bob does. */
export const aliceChance = (psi: State, ta: number, a: Result): number => snap(norm2(bobPart(psi, ta, a)));

/** Bob's qubit just after Alice gets result a along ta. */
export const bobAfter = (psi: State, ta: number, a: Result): State => normalize(bobPart(psi, ta, a));

/** Born rule for one qubit: chance of result r along the axis at angle t. */
export const chance = (s: State, t: number, r: Result): number => snap(abs2(inner(along(t, r), s)));

/** Mean of the spin along the axis at angle t, from -1 to 1: chance of up minus chance of down. */
export const spinMean = (s: State, t: number): number => chance(s, t, 0) - chance(s, t, 1);

/** One quantum pair. Alice's result is a Born rule draw. Her measurement leaves Bob's qubit in bobAfter, and his result
 *  is a Born rule draw from that state. This gives the same odds as jointAt. */
export function quantumPair(a: Setting, b: Setting, rand: () => number): Pair {
  const psi = singlet(), ta = angle(a);
  const ra: Result = rand() < aliceChance(psi, ta, 0) ? 0 : 1;
  const rb: Result = rand() < chance(bobAfter(psi, ta, ra), angle(b), 0) ? 0 : 1;
  return { a: ra, b: rb };
}

// ---- Hidden answers: a local hidden-variable model, for comparison.

/** A card of set answers that Alice's particle carries: its result for Z and for X. Bob's particle carries the opposite
 *  answers. Nothing at one detector can change the other particle's card. */
export type Card = Record<Setting, Result>;

/** All four cards. The source picks one at random for each pair, each with chance 1/4. */
export const CARDS: readonly Card[] = [{ Z: 0, X: 0 }, { Z: 0, X: 1 }, { Z: 1, X: 0 }, { Z: 1, X: 1 }];

export const flip = (r: Result): Result => (r === 0 ? 1 : 0);

/** Each detector reads its particle's card for its own setting. */
export const read = (card: Card, a: Setting, b: Setting): Pair => ({ a: card[a], b: flip(card[b]) });

export const hiddenPair = (a: Setting, b: Setting, rand: () => number): Pair => read(CARDS[Math.min(3, Math.floor(rand() * 4))], a, b);

/** Exact odds of the hidden-answer model: average over the four cards. */
export function hiddenJoint(a: Setting, b: Setting): number[] {
  const p = [0, 0, 0, 0];
  for (const card of CARDS) { const r = read(card, a, b); p[2 * r.a + r.b] += 1 / CARDS.length; }
  return p;
}

/** The odds each source predicts, and one pair from it. */
export const theory = (src: Source, a: Setting, b: Setting): number[] => (src === 'quantum' ? quantumJoint(a, b) : hiddenJoint(a, b));
export const pair = (src: Source, a: Setting, b: Setting, rand: () => number): Pair =>
  src === 'quantum' ? quantumPair(a, b, rand) : hiddenPair(a, b, rand);

// ---- Words for labels and the readout.

export const resultName = (r: Result): string => (r === 0 ? 'up' : 'down');
export const settingWords = (s: Setting): string => (s === 'Z' ? 'Z (upright)' : 'X (on its side)');
