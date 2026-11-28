// Entanglement entropy: the pure math behind the HalfEntropy tool. No DOM.
// Sources: Aaronson, Introduction to Quantum Information Science lecture notes, 11.2 and 11.2.1 (S(rho) from the
// eigenvalues, eq. 11.5; S(rho) = the least Shannon entropy over measurement bases, eq. 11.6; E(psi) = S(rho_A) =
// S(rho_B) = H of the Schmidt weights, eq. 11.8; the example (3/5)|0>|+> + (4/5)|1>|-> with E about 0.942);
// Wilde, Quantum Information Theory, 11.2.1 (Theorem 11.2.1: the marginal entropies of a pure bipartite state are
// equal and the joint entropy is 0) and chapter 19 (many copies: concentration and dilution at the rate E).
// Conventions (as in quantum.ts):
// - Two qubits. A is qubit 0, B is qubit 1. Index i = 2a + b: in |ab> A's bit is on the left.
// - Entropy is in bits (log base 2). 0 log 0 = 0.
// - The tool's pair, started as |00>: RY(theta) on A with sin^2(theta/2) = p, then a CNOT from A to B, then RY(alpha)
//   on A alone.
//     before the turn: sqrt(1-p)|00> + sqrt(p)|11>, the Schmidt form with weights 1-p and p.
//     after the turn:  (RY(alpha) ⊗ I) of that. A turn on one side is a local gate, so it cannot change E.
//   All amplitudes are real, so A's Bloch vector lies in the x-z plane.
// - Measuring A in the real basis at angle phi: first ket cos(phi/2)|0> + sin(phi/2)|1> (RY(phi)|0>), second ket
//   -sin(phi/2)|0> + cos(phi/2)|1>. phi + 180 degrees is the same basis with the two results swapped.
import { c, add, mul, conj, abs2, abs, norm2, apply1, cnot, basis, RY, draw, type State, type Matrix } from '../quantum.ts';

export type Pair = [number, number];

/** Shots the tool keeps. */
export const CAP = 200;
/** Below this a gap is float dust. */
const DUST = 1e-9;
/** Two weights closer than this are equal: sqrt(1 - C^2) turns float dust of 1e-16 into 1e-8. */
const WEQ = 1e-6;
const clamp01 = (p: number) => Math.max(0, Math.min(1, p));
export const rad = (deg: number): number => (deg * Math.PI) / 180;
export const deg = (r: number): number => (r * 180) / Math.PI;

// ---- Entropy of a list of odds

/** Shannon entropy of odds in bits: sum of w log2(1/w). Odds of 0 add nothing. For a density matrix, pass its eigenvalues. */
export function entropy(weights: readonly number[]): number {
  let t = 0;
  for (const w of weights) if (w > 0) t -= w * Math.log2(w);
  return t + 0;
}

/** h(p): the entropy of a coin that gives 1 with chance p. h(1/2) = 1. */
export const binaryEntropy = (p: number): number => entropy([clamp01(p), 1 - clamp01(p)]);

/** The most entropy d odds can have, reached by equal odds: log2 d. */
export const maxEntropy = (d: number): number => Math.log2(d);

// ---- The pair

/** The RY angle, in radians, that turns |0> into sqrt(1-p)|0> + sqrt(p)|1>: sin^2(theta/2) = p. */
export const gateAngle = (p: number): number => 2 * Math.asin(Math.sqrt(clamp01(p)));

/** Started as |00>, then RY on A (sin^2(theta/2) = p), then a CNOT from A to B, then RY(alpha) on A alone. */
export function pairState(p: number, alpha = 0): State {
  let s = apply1(basis(2, 0), RY(gateAngle(p)), 0, 2);
  s = cnot(s, 0, 1, 2);
  return alpha === 0 ? s : apply1(s, RY(alpha), 0, 2);
}

/** A's reduced density matrix: (rho_A)_{a a'} = sum_b psi_{ab} conj(psi_{a'b}). */
export const reducedA = (s: State): Matrix =>
  [0, 1].map((a) => [0, 1].map((a2) => add(mul(s[2 * a], conj(s[2 * a2])), mul(s[2 * a + 1], conj(s[2 * a2 + 1])))));

/** B's reduced density matrix: (rho_B)_{b b'} = sum_a psi_{ab} conj(psi_{ab'}). */
export const reducedB = (s: State): Matrix =>
  [0, 1].map((b) => [0, 1].map((b2) => add(mul(s[b], conj(s[b2])), mul(s[2 + b], conj(s[2 + b2])))));

/** Eigenvalues of a 2 by 2 density matrix, biggest first. From trace 1 and the determinant, so it never goes negative. */
export function eigenvalues(rho: Matrix): Pair {
  const a = rho[0][0].re, d = rho[1][1].re, off = abs2(rho[0][1]), t = a + d;
  const hi = (t + Math.sqrt((a - d) ** 2 + 4 * off)) / 2;
  const lo = hi > 0 ? Math.max(0, (a * d - off) / hi) : 0;
  return [hi, lo];
}

/** 2 |psi00 psi11 - psi01 psi10|: 0 for a product state, 1 for a Bell pair. */
export const concurrence = (s: State): number => 2 * abs(add(mul(s[0], s[3]), mul(c(-1), mul(s[1], s[2]))));

/** The two Schmidt weights from C: (1 ± sqrt(1 - C^2))/2. The small one is written to stay exact when C is tiny. */
export function weightsFromConcurrence(C: number): Pair {
  const k = Math.sqrt(Math.max(0, 1 - C * C));
  return [(1 + k) / 2, (C * C) / (2 * (1 + k))];
}

/** The Schmidt weights of a pure two-qubit state, biggest first. The same list is the spectrum of rho_A and of rho_B. */
export const schmidtWeights = (s: State): Pair => weightsFromConcurrence(concurrence(s) / norm2(s));

/** Entanglement entropy: S(rho_A), the entropy of A's eigenvalues. */
export const entropyA = (s: State): number => entropy(eigenvalues(reducedA(s)));
/** S(rho_B). Equal to S(rho_A) for every pure pair. */
export const entropyB = (s: State): number => entropy(eigenvalues(reducedB(s)));
/** E from the Schmidt weights (the closed form): the same number as entropyA. */
export const entanglementEntropy = (s: State): number => entropy(schmidtWeights(s));
/** The pair as a whole: a pure state has one eigenvalue, norm^2 = 1, so its entropy is 0. */
export const wholeEntropy = (s: State): number => entropy([norm2(s)]);

// ---- Measuring A alone in a real basis

/** The first ket of the basis at angle phi (radians): cos(phi/2)|0> + sin(phi/2)|1>. */
export const basisKet = (phi: number): State => [c(Math.cos(phi / 2)), c(Math.sin(phi / 2))];

/** <u|rho|u>: the Born rule chance of the first result in the basis at angle phi. */
export function chanceFirst(rho: Matrix, phi: number): number {
  const u = basisKet(phi);
  let t = c(0);
  for (let j = 0; j < 2; j++) for (let k = 0; k < 2; k++) t = add(t, mul(mul(conj(u[j]), rho[j][k]), u[k]));
  return clamp01(t.re);
}

/** The Shannon entropy of A's results in the basis at angle phi. Never below S(rho_A); equal at A's own basis. */
export const spread = (rho: Matrix, phi: number): number => binaryEntropy(chanceFirst(rho, phi));

/** The angle in [0, 180) degrees where the spread is lowest: A's own basis (the eigenvectors of rho_A). Any angle if rho_A = I/2. */
export function lowestAngle(rho: Matrix): number {
  const x = 2 * rho[0][1].re, z = rho[0][0].re - rho[1][1].re;
  if (Math.hypot(x, z) < DUST) return 0;
  const d = deg(Math.atan2(x, z));
  return ((Math.round(d * 1e9) / 1e9) % 180 + 180) % 180;
}

/** The spread at `steps + 1` angles from 0 to 180 degrees, for drawing. */
export const curve = (rho: Matrix, steps: number): number[] =>
  Array.from({ length: steps + 1 }, (_, i) => spread(rho, rad((180 * i) / steps)));

/** One shot on A: 0 for the first result, 1 for the second. A Born rule draw. */
export const shoot = (rho: Matrix, phi: number, rand: () => number): 0 | 1 => {
  const p = chanceFirst(rho, phi);
  return draw([p, 1 - p], rand) as 0 | 1;
};

// ---- Words and numbers for the page

/** Slider percent (0 to 100) as a chance. */
export const fromPercent = (n: number): number => clamp01(Math.round(n) / 100);

/** bits(x) with its unit: "1 bit", "0 bits", "0.94 bits". */
export const bitsWord = (x: number): string => `${bits(x)} ${bits(x) === '1' ? 'bit' : 'bits'}`;

/** Entropy for a readout: "0", "1", "0.94", never "0.00" or "1.00" for a value that is not exactly that. */
export function bits(x: number): string {
  if (Math.abs(x) < DUST) return '0';
  if (Math.abs(1 - x) < DUST) return '1';
  const t = x.toFixed(2);
  if (t === '0.00') return 'under 0.01';
  if (t === '1.00') return 'over 0.99';
  return t;
}

/** A chance as a whole percent. A real chance never shows as 0% or 100%. */
export function percent(p: number): string {
  if (p <= DUST) return '0%';
  if (p >= 1 - DUST) return '100%';
  // The gaps keep float dust (0.99 computed as 1 - 0.01) from turning 1% into "under 1%" or 99% into "over 99%".
  if (p < 0.01 - DUST) return 'under 1%';
  if (p > 0.99 + DUST) return 'over 99%';
  return `${Math.round(p * 100 + 1e-9)}%`;
}

/** An amplitude with a true minus sign and two decimals: "0.60", "−0.31", "0". */
export function amp(x: number): string {
  if (Math.abs(x) < 1e-9) return '0';
  const t = Math.abs(x).toFixed(2);
  return `${x < 0 && t !== '0.00' ? '−' : ''}${t}`;
}

/** The pair's ket for the page: "|00⟩", "(|00⟩ + |11⟩)/√2" or the four amplitudes. */
export function pairKet(p: number, alpha: number): string {
  const s = pairState(p, alpha), names = ['00', '01', '10', '11'];
  const parts = s.map((a, i) => ({ x: a.re, n: names[i] })).filter((t) => Math.abs(t.x) > 1e-9);
  if (parts.length === 1 && Math.abs(Math.abs(parts[0].x) - 1) < 1e-9) return `${parts[0].x < 0 ? '−' : ''}|${parts[0].n}⟩`;
  if (parts.length === 2 && Math.abs(Math.abs(parts[0].x) - Math.SQRT1_2) < 1e-9 && Math.abs(Math.abs(parts[1].x) - Math.SQRT1_2) < 1e-9 && parts[0].x > 0)
    return `(|${parts[0].n}⟩ ${parts[1].x < 0 ? '−' : '+'} |${parts[1].n}⟩)/√2`;
  return parts.map((t, i) => `${i ? (t.x < 0 ? ' − ' : ' + ') : t.x < 0 ? '−' : ''}${amp(Math.abs(t.x))}|${t.n}⟩`).join('');
}

/** How the pair is made, from its start state. */
export function startText(p: number, alpha: number): string {
  const turn = alpha === 0 ? '' : `, then A alone turned by ${Math.round(deg(alpha))}°`;
  return `Started as 00, a gate on A and a CNOT make a pair with weight ${percent(1 - p)} on 00 and ${percent(p)} on 11${turn}.`;
}

/** What the two weights say about A alone. */
export function weightsText(s: State): string {
  const [w1, w2] = schmidtWeights(s), E = entropyA(s);
  if (w2 < DUST) return `One weight is 100%, so the pair is a product: A is in a pure state, and the entanglement entropy is 0.`;
  if (Math.abs(w1 - w2) < WEQ) return `The two weights are 50% and 50%, so the entanglement entropy is 1 bit, one ebit, the most that two qubits can have.`;
  return `The two Schmidt weights are ${percent(w1)} and ${percent(w2)}, so the entanglement entropy is ${bitsWord(E)}.`;
}

/** The words for a count of shots. */
export const shotsText = (n0: number, n1: number): string =>
  n0 + n1 === 0 ? 'No shots yet.' : `${n0 + n1} shots on A: ${n0} gave the first result and ${n1} the second.`;

/** The whole readout: names the start state, gives S, then what this measuring angle gives. */
export function readout(p: number, alpha: number, phi: number, n0: number, n1: number): string {
  const s = pairState(p, alpha), rho = reducedA(s), E = entropyA(s), H = spread(rho, phi);
  const flat = Math.abs(schmidtWeights(s)[0] - schmidtWeights(s)[1]) < WEQ, at = `At ${Math.round(deg(phi))}°`;
  const here = flat
    ? `${at} A's results give 1 bit of average surprise per shot, at every angle: A alone is the mixed state I/2, a fair coin in every basis.`
    : Math.abs(H - E) < 1e-9
      ? `${at} A's results give ${bitsWord(H)} of average surprise per shot, equal to the entanglement entropy: this is the basis of A's Schmidt terms.`
      : `${at} A's results give ${bitsWord(H)} of average surprise per shot, above the entanglement entropy of ${bitsWord(E)}. No angle goes below it.`;
  return `${startText(p, alpha)} ${weightsText(s)} B alone has the same entropy, and the pair as a whole, a pure state, has 0. ${here} ${shotsText(n0, n1)}`;
}
