// No faster-than-light messages: the pure math behind the NoSignal tool. No DOM.
// Conventions (as in quantum.ts):
// - Two qubits. Alice holds qubit 0, Bob holds qubit 1. Amplitude index i = 2a + b: in |ab> Alice's bit is on the left.
// - The pair starts as |00>; a Hadamard gate on Alice's qubit, then a CNOT, makes the Bell pair (|00> + |11>)/sqrt2.
// - A measurement basis is two orthonormal kets; result 0 is the first. 'z' is {|0>, |1>}, 'x' is {|+>, |->}.
// - Alice does nothing ('none') or measures in 'z' or 'x'. Bob always measures, in 'z' or 'x'.
// - No-signaling (no-communication theorem): nothing Alice does to her qubit changes Bob's reduced state
//   rho_B = tr_A |psi><psi|, so it changes none of Bob's odds (Aaronson, Intro to QIS lecture notes, 6.1.3).
import { c, add, mul, conj, abs2, scale, inner, tensor, ket0, ket1, plus, minus, H, apply1, cnot, basis, draw, type State, type Matrix } from '../quantum.ts';

export type Basis = 'z' | 'x';
export type Choice = 'none' | Basis;
export type Bit = 0 | 1;
/** A measurement basis as two orthonormal one-qubit kets. */
export type Pair = [State, State];
/** One pair, measured: what Alice did, her result (null if she did nothing) and Bob's result. */
export type Shot = { alice: Choice; a: Bit | null; b: Bit };

/** Pairs one press of the button sends. */
export const BATCH = 100;
/** Most pairs one group (one choice of Alice's) holds. */
export const CAP = 300;
/** Alice's three choices, in the order the tool shows them. */
export const CHOICES: readonly Choice[] = ['none', 'z', 'x'];

/** Float dust to exact values for readouts: (1/sqrt2)^2 = 0.5000000000000001 becomes 0.5, -1e-17 becomes 0. */
export const tidy = (p: number): number => Math.round(p * 1e12) / 1e12 + 0;

// ---- The pair and the bases

/** The Bell pair: started as |00>, then a Hadamard gate on Alice's qubit, then a CNOT from Alice's qubit to Bob's. */
export const bellPair = (): State => cnot(apply1(basis(2, 0), H, 0, 2), 0, 1, 2);

/** The two kets of a named basis. 'z': |0>, |1>. 'x': |+>, |->. */
export const kets = (b: Basis): Pair => (b === 'z' ? [ket0(), ket1()] : [plus(), minus()]);

/** How the tool writes the two results of a basis. */
export const NAMES: Record<Basis, [string, string]> = { z: ['0', '1'], x: ['+', '−'] };

const pairOf = (b: Basis | Pair): Pair => (typeof b === 'string' ? kets(b) : b);

// ---- Born rule for the pair

/** Joint odds p[a][b] = |(<u_a| ⊗ <v_b|)|psi>|^2 when Alice measures in basis u and Bob in basis v. They sum to 1. */
export function joint(s: State, alice: Basis | Pair, bob: Basis | Pair): number[][] {
  const v = pairOf(bob);
  return pairOf(alice).map((ua) => v.map((vb) => abs2(inner(tensor(ua, vb), s))));
}

/** Bob's reduced density matrix, the partial trace over Alice: (rho_B)_{jk} = sum_a psi_{aj} conj(psi_{ak}).
 *  Linear in |psi><psi|, so it also works for an unnormalized vector (it then has trace |psi|^2). */
export function reducedBob(s: State): Matrix {
  return [0, 1].map((j) => [0, 1].map((k) => add(mul(s[j], conj(s[k])), mul(s[2 + j], conj(s[2 + k])))));
}

/** <phi|rho|phi>: the Born rule chance of result phi for a qubit with density matrix rho. */
export function expect(rho: Matrix, phi: State): number {
  let t = c(0);
  for (let j = 0; j < 2; j++) for (let k = 0; k < 2; k++) t = add(t, mul(mul(conj(phi[j]), rho[j][k]), phi[k]));
  return t.re;
}

/** Density matrix of a mix: sum_k p_k |phi_k><phi_k|. */
export function mixture(e: readonly { p: number; bob: State }[]): Matrix {
  return [0, 1].map((j) => [0, 1].map((k) => e.reduce((t, { p, bob }) => add(t, scale(mul(bob[j], conj(bob[k])), p)), c(0))));
}

/** What Alice's measurement in basis u leaves Bob's qubit in: for each result a, its chance p_a and Bob's state.
 *  Bob's unnormalized state is (<u_a| ⊗ I)|psi>, entry j = sum_i conj(u_a[i]) psi_{ij}. A result with p_a = 0 keeps the zero vector. */
export function ensemble(s: State, alice: Basis | Pair): { p: number; bob: State }[] {
  return pairOf(alice).map((u) => {
    const v = [0, 1].map((j) => add(mul(conj(u[0]), s[j]), mul(conj(u[1]), s[2 + j])));
    const p = abs2(v[0]) + abs2(v[1]);
    return { p, bob: p > 0 ? v.map((x) => scale(x, 1 / Math.sqrt(p))) : v };
  });
}

/** Bob's odds [P(result 0), P(result 1)] in his basis. If Alice does nothing they come from his reduced state;
 *  if she measures, they are the joint odds summed over her results. No-signaling: the two are always equal. */
export function bobOdds(s: State, alice: Choice | Pair, bob: Basis | Pair): [number, number] {
  if (alice === 'none') {
    const r = reducedBob(s), v = pairOf(bob);
    return [expect(r, v[0]), expect(r, v[1])];
  }
  const p = joint(s, alice, bob);
  return [p[0][0] + p[1][0], p[0][1] + p[1][1]];
}

/** For i = 0 and 1: the chance that Bob reads result i, given that Alice read result i, p(i, i) / p_Alice(i).
 *  Bell pair, same basis on both sides: 1 and 1. One on 'z', the other on 'x': 1/2 and 1/2. */
export function sameGiven(s: State, alice: Basis | Pair, bob: Basis | Pair): [number, number] {
  const p = joint(s, alice, bob);
  return [p[0][0] / (p[0][0] + p[0][1]), p[1][1] / (p[1][0] + p[1][1])];
}

// ---- Shots

/** Measure one fresh pair. Results are drawn with the Born rule odds for the whole pair, which do not depend on
 *  who measures first. If Alice does nothing, only Bob measures, with the odds of his reduced state. */
export function shot(s: State, alice: Choice, bob: Basis, rand: () => number): Shot {
  if (alice === 'none') return { alice, a: null, b: draw(bobOdds(s, 'none', bob), rand) as Bit };
  const i = draw(joint(s, alice, bob).flat(), rand);
  return { alice, a: (i >> 1) as Bit, b: (i & 1) as Bit };
}

export type Tally = { n: number; bob: [number, number]; seen: [number, number]; same: [number, number] };

/** Count shots: n pairs; Bob's results; for each Alice result i, how often she read it (seen[i]) and how often
 *  Bob read the same result i on those pairs (same[i]). */
export function tally(shots: readonly Shot[]): Tally {
  const t: Tally = { n: shots.length, bob: [0, 0], seen: [0, 0], same: [0, 0] };
  for (const s of shots) {
    t.bob[s.b]++;
    if (s.a === null) continue;
    t.seen[s.a]++;
    if (s.a === s.b) t.same[s.a]++;
  }
  return t;
}

/** Standard deviation of a count with chance p over n independent tries (binomial): sqrt(n p (1 - p)). */
export const spread = (n: number, p: number): number => Math.sqrt(n * p * (1 - p));

/** Dots one pile is sized for: half a full group plus four standard deviations, so piles almost never outgrow it. */
export const PILE_FIT = Math.ceil(CAP / 2 + 4 * spread(CAP, 0.5));

/** Dot grid for a pile in a w by h box: the largest pitch, up to max and in steps of 0.25, at which n dots fit. */
export function pileGrid(w: number, h: number, n: number, max = 9): { pitch: number; cols: number } {
  let p = Math.max(1, Math.min(max, Math.floor(Math.min(w, h) * 4) / 4));
  while (p > 1 && Math.floor(w / p) * Math.floor(h / p) < n) p -= 0.25;
  return { pitch: p, cols: Math.max(1, Math.floor(w / p)) };
}
