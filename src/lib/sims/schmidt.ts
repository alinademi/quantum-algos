// Schmidt decomposition stop: the pure math behind the SchmidtBases tool. No DOM.
// A pure state of qubits A and B has an amplitude matrix M, with M[j][k] the amplitude of |j>_A |k>_B. Its Schmidt
// decomposition is |psi> = sum_i lambda_i |a_i>|b_i>: lambda_i > 0, {a_i} orthonormal for A, {b_i} orthonormal for B
// (N&C 2.5; Aaronson, Lecture notes 11.1; de Wolf, Lecture notes 18.3; Watrous, Understanding Quantum Information and
// Computation, Purifications: Schmidt decompositions). It comes from the singular value decomposition M = sum_i lambda_i u_i v_i^dagger,
// with |a_i> = u_i and |b_i> = the complex conjugate of v_i. Also: rho_A = M M^dagger = sum_i lambda_i^2 |a_i><a_i|, and rho_B has
// the same nonzero eigenvalues. A's measurement in {a_i} and B's in {b_i} give the pair (i, j) with chance |lambda_i|^2 if i = j
// and 0 otherwise (Aaronson 11.1). The tool reaches real states and real bases only: its bases are turned in the 0/1 plane.
// Joint results are listed as [00, 01, 10, 11]: A's result first, like the state's own amplitudes.
import {
  c, add, sub, mul, scale, conj, abs2, norm2, normalize, inner, tensor, apply1, cnot, draw,
  basis, RY, H, ket0, plus, type C, type Matrix, type State,
} from '../quantum.ts';

const RAD = Math.PI / 180;
/** Float dust: cos(90°) is 6e-17, not 0. Below this an amplitude counts as exactly 0. */
const DUST = 1e-12;
/** A Schmidt coefficient below this counts as 0 (the state is a product). */
const RANK_TOL = 1e-9;
const cleanAmp = (x: number) => (Math.abs(x) < DUST ? 0 : x);
/** A chance this small is float dust from an amplitude of 0. */
const cleanChance = (p: number) => (p < 1e-24 ? 0 : p);

export type Chances = [number, number, number, number];
export type Tally = [number, number, number, number];
export type Basis = [State, State];

// ---- Amplitude matrix and reduced states

/** M[j][k] = amplitude of |j>_A |k>_B for a two-qubit state [00, 01, 10, 11]. */
export const amplitudeMatrix = (s: State): Matrix => [[s[0], s[1]], [s[2], s[3]]];

/** The complex determinant of M: for a two-qubit state, psi_00 psi_11 - psi_01 psi_10. */
export const determinant = (s: State): C => sub(mul(s[0], s[3]), mul(s[1], s[2]));

/** Alice's reduced state: rho_A[j][j'] = sum_k psi_jk conj(psi_j'k), which is M M^dagger. */
export const reducedA = (s: State): Matrix =>
  [0, 1].map((j) => [0, 1].map((j2) => [0, 1].reduce((t, k) => add(t, mul(s[2 * j + k], conj(s[2 * j2 + k]))), c(0))));

/** Bob's reduced state: rho_B[k][k'] = sum_j psi_jk conj(psi_jk'). */
export const reducedB = (s: State): Matrix =>
  [0, 1].map((k) => [0, 1].map((k2) => [0, 1].reduce((t, j) => add(t, mul(s[2 * j + k], conj(s[2 * j + k2]))), c(0))));

// ---- The decomposition

export type Schmidt = {
  /** Schmidt coefficients, largest first. A coefficient that is 0 means the term is not there. */
  lambda: [number, number];
  /** A's basis states and B's. Where lambda[i] is 0, a[i] and b[i] are just a completing orthonormal vector. */
  a: Basis;
  b: Basis;
  /** Number of nonzero coefficients: 1 for a product state, 2 for an entangled pair of qubits. */
  rank: 1 | 2;
};

/** The unit vector orthogonal to a one-qubit state v. */
const complement = (v: State): State => [scale(conj(v[1]), -1), conj(v[0])];

/** Top eigenvector of the Hermitian matrix [[p, z], [conj z, t]] with top eigenvalue mu. */
function topEigenvector(p: number, t: number, z: C, mu: number): State {
  const v: State = [z, c(mu - p)], w: State = [c(mu - t), conj(z)];
  const best = norm2(v) >= norm2(w) ? v : w;
  // Both zero: the matrix is a multiple of the identity, so any basis works. Use 0 and 1.
  return norm2(best) < 1e-24 ? ket0() : normalize(best);
}

/** Schmidt decomposition of a two-qubit pure state (any complex amplitudes; the state is normalized first). */
export function schmidt(state: State): Schmidt {
  const s = normalize(state);
  const rho = reducedA(s);
  const p = rho[0][0].re, t = rho[1][1].re, z = rho[0][1];
  const half = (p - t) / 2, mu1 = (p + t) / 2 + Math.sqrt(half * half + abs2(z));
  // det(rho_A) = |det M|^2 = mu1 mu2. This form does not lose digits when mu2 is near 0.
  // Rounding can push a coefficient a hair past its limits: keep 0 <= lambda2 <= lambda1 <= 1.
  const lambda1 = Math.min(1, Math.sqrt(mu1)), lambda2 = Math.min(lambda1, Math.sqrt(abs2(determinant(s))) / lambda1);
  const a1 = topEigenvector(p, t, z, mu1), a2 = complement(a1);
  // b_i = M^T conj(a_i) / lambda_i, the complex conjugate of M^dagger a_i / lambda_i.
  const partner = (a: State, lam: number): State => [0, 1].map((k) => scale([0, 1].reduce((tt, j) => add(tt, mul(s[2 * j + k], conj(a[j]))), c(0)), 1 / lam));
  const b1 = partner(a1, lambda1);
  if (lambda2 < RANK_TOL) return { lambda: [lambda1, 0], a: [a1, a2], b: [b1, complement(b1)], rank: 1 };
  return { lambda: [lambda1, lambda2], a: [a1, a2], b: [b1, partner(a2, lambda2)], rank: 2 };
}

/** The sum lambda_1 |a_1>|b_1> + lambda_2 |a_2>|b_2> as a state. It gives back the state the decomposition came from. */
export const rebuild = (sd: Schmidt): State =>
  [0, 1].reduce<State>((t, i) => t.map((x, k) => add(x, scale(tensor(sd.a[i], sd.b[i])[k], sd.lambda[i]))), [c(0), c(0), c(0), c(0)]);

/** Entanglement entropy in bits: the Shannon entropy of the chances lambda_i^2 (Aaronson 11.2.1). 0 for a product, 1 for a Bell pair. */
export function entropy(lambda: number[]): number {
  return Math.max(0, lambda.reduce((t, l) => (l > 0 ? t - l * l * Math.log2(l * l) : t), 0));
}

// ---- Measuring both qubits, each in its own basis

/** The basis turned by deg degrees in the 0/1 plane: result 0 is cos|0> + sin|1>, result 1 is -sin|0> + cos|1>. */
export function turnedBasis(deg: number): Basis {
  const co = cleanAmp(Math.cos(deg * RAD)), si = cleanAmp(Math.sin(deg * RAD));
  return [[c(co), c(si)], [c(-si), c(co)]];
}

/** Amplitude for each pair of results: [i][j] = <a_i|<b_j|psi>. */
export const amplitudesIn = (s: State, a: Basis, b: Basis): Matrix =>
  [0, 1].map((i) => [0, 1].map((j) => inner(tensor(a[i], b[j]), s)));

/** Born rule chances of the pairs of results [00, 01, 10, 11] when A measures in basis a and B in basis b. */
export function jointChances(s: State, a: Basis, b: Basis): Chances {
  const m = amplitudesIn(s, a, b);
  return [cleanChance(abs2(m[0][0])), cleanChance(abs2(m[0][1])), cleanChance(abs2(m[1][0])), cleanChance(abs2(m[1][1]))];
}
/** Chance that the two results differ (01 or 10). */
export const differ = (ch: Chances): number => ch[1] + ch[2];
/** Chance that the two results agree (00 or 11). */
export const agree = (ch: Chances): number => ch[0] + ch[3];

/** One shot: the pair of results, as an index into [00, 01, 10, 11], drawn with the Born rule. */
export const shoot = (ch: Chances, rand: () => number): 0 | 1 | 2 | 3 => draw(ch, rand) as 0 | 1 | 2 | 3;

/** Count shots per pair of results. */
export function tally(shots: number[]): Tally {
  const t: Tally = [0, 0, 0, 0];
  for (const x of shots) t[x]++;
  return t;
}

// ---- Real states and turned bases (what the tool reaches)

export const isReal = (s: State): boolean => s.every((x) => x.im === 0);

/** Angle of a real one-qubit vector in the 0/1 plane, in degrees from 0 up to 180 (the sign of a basis vector does not matter). */
export const angleOf = (v: State): number => ((((Math.atan2(v[1].re, v[0].re) / RAD) % 180) + 180) % 180);

/** The turns, in whole degrees from 0 to 179, that put a real state into Schmidt form: A's first basis state and B's first. */
export function schmidtTurns(s: State): { a: number; b: number } {
  const sd = schmidt(s);
  return { a: Math.round(angleOf(sd.a[0])) % 180, b: Math.round(angleOf(sd.b[0])) % 180 };
}

// ---- States the tool offers

export type Kind = 'lopsided' | 'bell' | 'product' | 'random';
export const KINDS: Kind[] = ['lopsided', 'bell', 'product', 'random'];
/** The hidden settings of a random state: its Schmidt angle phi and the turns of the two bases, in degrees. */
export type Hidden = { phi: number; ta: number; tb: number };

/** Started as 00, then a Hadamard gate on A and a CNOT from A to B: (|00> + |11>)/sqrt 2. */
export const bellState = (): State => cnot(apply1(basis(2, 0), H, 0, 2), 0, 1, 2);
/** Started as 00, then RY on A to 0.8|0> + 0.6|1>, a CNOT from A to B, a Hadamard gate on B: 0.8|0>|+> + 0.6|1>|->.
 *  Aaronson's example (11.2.1) is 3/5|0>|+> + 4/5|1>|->: the same two coefficients with the weights swapped, so the same entropy. */
export const lopsidedState = (): State => apply1(cnot(apply1(basis(2, 0), RY(2 * Math.acos(0.8)), 0, 2), 0, 1, 2), H, 1, 2);
/** Started as 00, then a Hadamard gate on B: |0>|+>. */
export const productState = (): State => tensor(ket0(), plus());

/** cos(phi) e0(ta) e0(tb) + sin(phi) e1(ta) e1(tb): started as 00, RY on A, a CNOT, then RY on each qubit. All angles in degrees.
 *  Its Schmidt coefficients are cos(phi) and sin(phi), and its Schmidt bases are the ones turned by ta and tb. */
export function randomState(h: Hidden): State {
  const pair = cnot(apply1(basis(2, 0), RY(2 * h.phi * RAD), 0, 2), 0, 1, 2);
  return apply1(apply1(pair, RY(2 * h.ta * RAD), 0, 2), RY(2 * h.tb * RAD), 1, 2);
}
/** Hidden settings for a new random state: phi in 10 to 40 whole degrees (below 45 and not near it, so the two coefficients clearly differ), turns in 0 to 179. */
export const randomHidden = (rand: () => number): Hidden => ({ phi: 10 + Math.floor(rand() * 31), ta: Math.floor(rand() * 180), tb: Math.floor(rand() * 180) });

export function makeState(kind: Kind, hidden?: Hidden): State {
  if (kind === 'bell') return bellState();
  if (kind === 'lopsided') return lopsidedState();
  if (kind === 'product') return productState();
  return randomState(hidden ?? { phi: 30, ta: 0, tb: 0 });
}

// ---- Words. Every string that names a state names how it started.

/** How the state is made, starting from 00. */
export function startText(kind: Kind): string {
  if (kind === 'bell') return 'Started as 00, then a Hadamard gate on A and a CNOT from A to B';
  if (kind === 'lopsided') return 'Started as 00, then an RY gate on A (to 0.8 for 0 and 0.6 for 1), a CNOT from A to B, and a Hadamard gate on B';
  if (kind === 'product') return 'Started as 00, then a Hadamard gate on B';
  return 'Started as 00, then an RY gate on A, a CNOT from A to B, and an RY gate on each qubit, all with random settings';
}
/** The state as a ket. */
export function ketOf(kind: Kind): string {
  if (kind === 'bell') return '(|00⟩ + |11⟩)/√2';
  if (kind === 'lopsided') return '0.8|0⟩|+⟩ + 0.6|1⟩|−⟩';
  if (kind === 'product') return '|0⟩|+⟩';
  return 'a random real state';
}

/** An amplitude for display: 2 decimals, a real minus sign, and no "-0.00". */
export function amp(x: number): string {
  if (Math.abs(x) < DUST) return '0';
  if (Math.abs(1 - Math.abs(x)) < DUST) return x < 0 ? '−1' : '1';
  const t = Math.abs(x).toFixed(2);
  return (x < 0 && t !== '0.00' ? '−' : '') + t;
}

/** Percent for readouts. Never shows a real chance as 0% or 100%. */
export function percent(p: number): string {
  if (p < DUST) return '0%';
  if (p > 1 - DUST) return '100%';
  const v = p * 100;
  if (v < 0.1) return 'under 0.1%';
  if (v > 99.9) return 'over 99.9%';
  return `${v < 1 || v > 99 ? v.toFixed(1) : Math.round(v + 1e-9)}%`;
}

/** A real one-qubit vector as a ket: "0.87|0⟩ + 0.50|1⟩", "|1⟩", "−0.50|0⟩ + 0.87|1⟩". */
export function ketText(v: State): string {
  const terms = v.map((x, k) => ({ x: x.re, k })).filter(({ x }) => Math.abs(x) >= DUST);
  return terms.map(({ x, k }, n) => {
    const mag = Math.abs(1 - Math.abs(x)) < DUST ? '' : Math.abs(x).toFixed(2);
    const sign = x < 0 ? (n ? ' − ' : '−') : n ? ' + ' : '';
    return `${sign}${mag}|${k}⟩`;
  }).join('');
}
/** What the two results mean in the basis turned by deg degrees. */
export const basisText = (deg: number): string => {
  const b = turnedBasis(deg);
  return `Result 0 is ${ketText(b[0])}. Result 1 is ${ketText(b[1])}.`;
};

/** The Schmidt coefficients as shown: "0.80, 0.60", or just "1" for a product state (no second term). */
export const lambdaText = (sd: Schmidt): string => (sd.rank === 1 ? amp(sd.lambda[0]) : `${amp(sd.lambda[0])}, ${amp(sd.lambda[1])}`);

/** The state's Schmidt coefficients, rank and entropy in words. */
export function coefficientText(sd: Schmidt): string {
  const e = entropy(sd.lambda).toFixed(2);
  if (sd.rank === 1) return 'Schmidt coefficient: 1. Schmidt rank 1: a product state, with no entanglement (entropy 0 bits).';
  return `Schmidt coefficients: ${amp(sd.lambda[0])} and ${amp(sd.lambda[1])}. Schmidt rank 2: entangled (entropy ${e} bits).`;
}

/** The verdict for one pair of settings, from the Born rule chances. */
export function verdict(ch: Chances, sd: Schmidt): string {
  const off = differ(ch), same = agree(ch);
  if (off === 0) {
    if (sd.rank === 1) return 'A and B agree on every pair, and every pair is the same one: these are Schmidt bases, with a single term.';
    const [p, q] = [ch[0], ch[3]];
    return `A and B agree on every pair, so these are Schmidt bases. The two matched pairs have chances ${percent(p)} and ${percent(q)}: the coefficients ${amp(Math.sqrt(p))} and ${amp(Math.sqrt(q))}, since a pair's chance is |coefficient|².`;
  }
  if (same === 0) return 'A and B differ on every pair. Turn B by 90° and they agree on every pair: these are Schmidt bases, with B\'s two results named the other way round.';
  const near = off < 0.01 ? ' (very close)' : '';
  return `A and B differ on ${percent(off)} of pairs, so these are not Schmidt bases${near}. Turn the bases to find settings where they agree on every pair.`;
}

/** Full readout for the tool's live region. It names the start state. */
export function readout(kind: Kind, state: State, degA: number, degB: number, shots: Tally): string {
  const sd = schmidt(state), ch = jointChances(state, turnedBasis(degA), turnedBasis(degB));
  const n = shots[0] + shots[1] + shots[2] + shots[3];
  const sent = n === 0 ? 'No pairs sent yet.'
    : `Pairs sent: ${n}. ${shots[0] + shots[3]} agreed (${shots[0]} as 00, ${shots[3]} as 11), ${shots[1] + shots[2]} differed (${shots[1]} as 01, ${shots[2]} as 10).`;
  return `${startText(kind)}, which gives ${ketOf(kind)}. ${coefficientText(sd)} A's basis is turned ${degA}°, B's ${degB}°. ${verdict(ch, sd)} ${sent}`;
}
