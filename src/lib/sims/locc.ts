// LOCC: the pure math behind the PairConverter tool and the facts the stop's text states. No DOM.
// Sources: Watrous, The Theory of Quantum Information, Sections 6.1.2 (LOCC) and 6.2.1 (Theorem 6.33, Nielsen's theorem,
// and its one-way protocol); Nielsen and Chuang, 12.5.1; Chitambar et al., "Everything You Always Wanted to Know About
// LOCC", Commun. Math. Phys. 328, 303 (2014), arXiv:1210.4583 (the introduction: teleportation costs one ebit plus two
// classical bits, and any measure of entanglement must not rise on average under LOCC); Marshall and Olkin, Inequalities:
// Theory of Majorization, 2.B.1 (T-transforms).
// Conventions:
// - A pure state of Alice and Bob is written in Schmidt form: sum_i sqrt(w_i) |i>|i>. The weights w_i are the squares
//   of the Schmidt coefficients: they are positive, sort from largest to smallest, and add up to 1. They are also the
//   eigenvalues of Alice's reduced state, so the weights say everything about the entanglement.
// - Both sides know which state they share, and so its Schmidt basis (Nielsen's theorem assumes this).
// - Each side has MAXD levels. A state with fewer nonzero weights pads with zeros.
// - Entanglement in ebits: E(w) = -sum w_i log2 w_i. A Bell pair, weights (1/2, 1/2), has E = 1. This is the entropy of
//   entanglement of a pure state.
// - Nielsen's theorem: |psi> becomes |phi> by LOCC with certainty exactly when the weights of psi are majorized by the
//   weights of phi: for every k, the k largest weights of psi add up to no more than the k largest of phi.
//   One message from Alice to Bob is enough (Watrous Theorem 6.33, statements 1 and 3).
// - The protocol built here follows the proof. If x (psi) is majorized by y (phi), x is a chain of T-transforms of y.
//   Each T-transform is "keep" with chance t or "swap two entries" with chance 1 - t, so x = sum_k p_k P_k y with P_k
//   permutations. Alice measures with diagonal Kraus operators M_k, written in the Schmidt basis of psi:
//   (M_k)_ii^2 = p_k (P_k y)_i / x_i. They add up to the identity, outcome k has chance p_k, and it leaves a state with
//   weights P_k y. Alice tells Bob k, and both relabel their levels with that permutation: the state is phi again.
import { c, abs2, add, mul, conj, scale, type C, type State, type Matrix } from '../quantum.ts';

export const MAXD = 4;
/** Two numbers closer than this count as equal: float dust from sums like 0.4 + 0.4 + 0.2. */
const EPS = 1e-12;

/** Float dust to exact values for readouts: 0.5000000000000001 becomes 0.5, -1e-17 becomes 0. */
export const tidy = (x: number): number => Math.round(x * 1e12) / 1e12 + 0;

// ---- The states the tool offers

export type Named = { id: string; name: string; text: string; w: number[] };
/** Weights as the tool writes them. Sorted by ebits, fewest first. */
export const STATES: readonly Named[] = [
  { id: 'product', name: 'Product state, no link', text: '1', w: [1] },
  { id: 'p90', name: 'Two levels, 90/10', text: '0.9, 0.1', w: [0.9, 0.1] },
  { id: 'p75', name: 'Two levels, 75/25', text: '0.75, 0.25', w: [0.75, 0.25] },
  { id: 'bell', name: 'Bell pair', text: '0.5, 0.5', w: [0.5, 0.5] },
  { id: 'b3', name: 'Three levels, 50/25/25', text: '0.5, 0.25, 0.25', w: [0.5, 0.25, 0.25] },
  { id: 'a3', name: 'Three levels, 40/40/20', text: '0.4, 0.4, 0.2', w: [0.4, 0.4, 0.2] },
  { id: 'e3', name: 'Three levels, even', text: '1/3, 1/3, 1/3', w: [1 / 3, 1 / 3, 1 / 3] },
  { id: 'a4', name: 'Four levels, 40/40/10/10', text: '0.4, 0.4, 0.1, 0.1', w: [0.4, 0.4, 0.1, 0.1] },
  { id: 'e4', name: 'Four levels, even', text: '1/4, 1/4, 1/4, 1/4', w: [0.25, 0.25, 0.25, 0.25] },
];
export const stateById = (id: string): Named => STATES.find((s) => s.id === id) ?? STATES[0];

// ---- Weights, ebits, majorization

/** Weights sorted from largest to smallest and padded with zeros to d entries. */
export function pad(w: readonly number[], d = MAXD): number[] {
  const s = [...w].sort((a, b) => b - a);
  while (s.length < d) s.push(0);
  return s;
}

/** Entanglement in ebits of a pure state with these weights: -sum w log2 w. Zero weights add nothing. */
export const ebits = (w: readonly number[]): number => tidy(-w.reduce((t, x) => t + (x > 0 ? x * Math.log2(x) : 0), 0));

/** k largest weights added up, for k = 1 ... d. */
export function sums(w: readonly number[]): number[] {
  let t = 0;
  return pad(w).map((x) => (t += x));
}

/** x is majorized by y (x ≺ y): for every k, the k largest of x add up to no more than the k largest of y. */
export const majorizedBy = (x: readonly number[], y: readonly number[]): boolean => firstBreak(x, y) === 0;

/** The first k (1 to MAXD) where the k largest weights of `from` add up to more than those of `to`; 0 if none. */
export function firstBreak(from: readonly number[], to: readonly number[]): number {
  const a = sums(from), b = sums(to);
  for (let k = 0; k < a.length; k++) if (a[k] > b[k] + EPS) return k + 1;
  return 0;
}

/** True when both lists have the same weights (a state with the same Schmidt weights, up to relabeling levels). */
export const sameWeights = (x: readonly number[], y: readonly number[]): boolean => {
  const a = pad(x), b = pad(y);
  return a.every((v, i) => Math.abs(v - b[i]) < EPS);
};

/** Nielsen's theorem: can psi (weights `from`) become phi (weights `to`) by LOCC, every time? */
export const canConvert = (from: readonly number[], to: readonly number[]): boolean => majorizedBy(from, to);

export type Verdict = {
  ok: boolean;
  /** First k where the sum would have to fall, 0 when the conversion is allowed. */
  k: number;
  sumFrom: number[];
  sumTo: number[];
  eFrom: number;
  eTo: number;
  same: boolean;
  /** Can the target be turned back into the start? Only when the two have the same weights. */
  back: boolean;
};

/** Everything the tool says about one start and one target. */
export function compare(from: readonly number[], to: readonly number[]): Verdict {
  const k = firstBreak(from, to);
  return {
    ok: k === 0, k, sumFrom: sums(from), sumTo: sums(to), eFrom: ebits(from), eTo: ebits(to),
    same: sameWeights(from, to), back: canConvert(to, from),
  };
}

// ---- The protocol

export type Branch = {
  /** Chance of Alice's outcome. */
  p: number;
  /** Alice's Kraus operator, diagonal in the Schmidt basis of the start state: its diagonal entries. */
  m: number[];
  /** After Alice's outcome the weights are the target's, shuffled: level i has weight to[perm[i]]. */
  perm: number[];
};

/** T-transform steps that turn y into x (x ≺ y, both sorted largest first): swap entries j and k with chance 1 - t. */
function tSteps(y0: number[], x: number[]): { j: number; k: number; t: number }[] {
  const y = y0.slice(), steps: { j: number; k: number; t: number }[] = [];
  for (let guard = 0; guard < y.length; guard++) {
    const k = y.findIndex((v, i) => v < x[i] - EPS);
    if (k < 0) break;
    let j = -1;
    for (let i = k - 1; i >= 0; i--) if (y[i] > x[i] + EPS) { j = i; break; }
    if (j < 0) throw new Error('locc: start is not majorized by target');
    const d = Math.min(y[j] - x[j], x[k] - y[k]);
    steps.push({ j, k, t: 1 - d / (y[j] - y[k]) });
    y[j] -= d; y[k] += d;
  }
  if (y.some((v, i) => Math.abs(v - x[i]) > 1e-9)) throw new Error('locc: T-transforms did not reach the start');
  return steps;
}

/**
 * One-way LOCC protocol that turns the start (weights `from`) into the target (weights `to`) with certainty.
 * Null when Nielsen's theorem says there is none. Branches with the same shuffled weights are merged; largest chance first.
 */
export function protocol(from: readonly number[], to: readonly number[]): Branch[] | null {
  if (!canConvert(from, to)) return null;
  const x = pad(from), y = pad(to), id = x.map((_, i) => i);
  let branches: { p: number; perm: number[] }[] = [{ p: 1, perm: id }];
  for (const { j, k, t } of tSteps(y, x)) {
    const next: { p: number; perm: number[] }[] = [];
    for (const b of branches) {
      if (t > EPS) next.push({ p: b.p * t, perm: b.perm });
      if (1 - t > EPS) {
        const perm = b.perm.slice();
        [perm[j], perm[k]] = [perm[k], perm[j]];
        next.push({ p: b.p * (1 - t), perm });
      }
    }
    branches = next;
  }
  // Merge branches that leave the same weights (a swap of two equal target weights changes nothing).
  const merged: { p: number; perm: number[] }[] = [];
  for (const b of branches) {
    const same = merged.find((m) => m.perm.every((pi, i) => Math.abs(y[pi] - y[b.perm[i]]) < EPS));
    if (same) same.p += b.p; else merged.push({ ...b });
  }
  merged.sort((a, b) => b.p - a.p);
  return merged.map(({ p, perm }, idx) => ({
    p,
    perm,
    // Levels where the start has weight 0 are never occupied: let the first outcome keep them whole, so the Kraus
    // operators still add up to the identity on all MAXD levels.
    m: x.map((xi, i) => (xi > EPS ? Math.sqrt((p * y[perm[i]]) / xi) : idx === 0 ? 1 : 0)),
  }));
}

/** Chances of Alice's outcomes. They add up to 1. */
export const chances = (br: readonly Branch[]): number[] => br.map((b) => b.p);

/** Weights left after outcome b: the target's weights, shuffled. */
export const afterWeights = (b: Branch, to: readonly number[]): number[] => b.perm.map((pi) => pad(to)[pi]);

/** What both sides do after Alice's message, in words: "nothing", "swap levels 1 and 2", "move level 1 to 3, ...". */
export function shuffleText(perm: readonly number[]): string {
  const moved = perm.map((to, from) => [from, to]).filter(([a, b]) => a !== b);
  if (!moved.length) return 'nothing more';
  if (moved.length === 2 && perm[moved[0][1]] === moved[0][0]) return `swap levels ${moved[0][0] + 1} and ${moved[0][1] + 1}`;
  return 'move ' + moved.map(([a, b]) => `level ${a + 1} to ${b + 1}`).join(', ');
}

// ---- The real state vectors, to check the protocol with the Born rule (used by the tests)

/** sum_i sqrt(w_i)|i>|i> as a vector of d*d amplitudes: index a*d + b is Alice's level a and Bob's level b. */
export function schmidtState(w: readonly number[], d = MAXD): State {
  const s: State = Array.from({ length: d * d }, () => c(0));
  pad(w, d).forEach((x, i) => { s[i * d + i] = c(Math.sqrt(x)); });
  return s;
}

/** Diagonal operator on Alice's side as a matrix. */
export const diagonal = (m: readonly number[]): Matrix => m.map((x, i) => m.map((_, j) => c(i === j ? x : 0)));

/** (M ⊗ I) s: an operator M on Alice's level, nothing on Bob's. */
export function applyAlice(m: Matrix, s: State, d = MAXD): State {
  const out: State = Array.from({ length: d * d }, () => c(0));
  for (let a = 0; a < d; a++) for (let b = 0; b < d; b++)
    for (let a2 = 0; a2 < d; a2++) out[a * d + b] = add(out[a * d + b], mul(m[a][a2], s[a2 * d + b]));
  return out;
}

/** Both sides move their level i to level perm[i]: the amplitude at (i, j) goes to (perm[i], perm[j]). */
export function relabel(perm: readonly number[], s: State, d = MAXD): State {
  const out: State = Array.from({ length: d * d }, () => c(0));
  for (let a = 0; a < d; a++) for (let b = 0; b < d; b++) out[perm[a] * d + perm[b]] = s[a * d + b];
  return out;
}

/** Alice's reduced state of a pair: rho_a,a' = sum_b s[a,b] conj(s[a',b]). Its diagonal is the weights for these states. */
export function reducedAlice(s: State, d = MAXD): Matrix {
  return Array.from({ length: d }, (_, a) => Array.from({ length: d }, (_, a2) => {
    let t = c(0);
    for (let b = 0; b < d; b++) t = add(t, mul(s[a * d + b], conj(s[a2 * d + b])));
    return t;
  }));
}

/** Norm squared of a state vector: the chance of the outcome that left it, when it is unnormalized. */
export const weightOf = (s: State): number => s.reduce((t, x) => t + abs2(x), 0);
/** A state vector scaled to length 1. */
export const unit = (s: State): State => s.map((x) => scale(x, 1 / Math.sqrt(weightOf(s))));
/** Overlap |<a|b>|^2 of two unit vectors. */
export const overlap = (a: State, b: State): number => {
  let t: C = c(0);
  a.forEach((x, i) => { t = add(t, mul(conj(x), b[i])); });
  return abs2(t);
};

// ---- A lucky run that loses on average

/**
 * Alice filters a pair with weights w: outcome 0 uses M_0 = diag(a), outcome 1 uses M_1 = diag(sqrt(1 - a_i^2)).
 * Returns the chance of each outcome and the weights it leaves.
 */
export function filter(w: readonly number[], a: readonly number[]): { p: [number, number]; post: [number[], number[]] } {
  const w0 = w.map((x, i) => x * a[i] ** 2), w1 = w.map((x, i) => x * (1 - a[i] ** 2));
  const p0 = w0.reduce((t, x) => t + x, 0), p1 = w1.reduce((t, x) => t + x, 0);
  return { p: [p0, p1], post: [w0.map((x) => x / p0), p1 > 0 ? w1.map((x) => x / p1) : w1] };
}
/** The text's example: start with weights 0.9, 0.1. Outcome 0 (chance 0.2) leaves a Bell pair, outcome 1 a product state. */
export const GAMBLE = { w: [0.9, 0.1], a: [1 / 3, 1] } as const;

// ---- Words and numbers for the page

/** Ebits for a sentence: "1 ebit", "0.47 ebits", "0 ebits". Two decimals at most, no trailing zeros. */
export function ebitText(e: number): string {
  const t = String(Number(tidy(e).toFixed(2)));
  return `${t} ${t === '1' ? 'ebit' : 'ebits'}`;
}

/** Standard deviation of a count with chance p over n independent runs (binomial): sqrt(n p (1 - p)). */
export const spread = (n: number, p: number): number => Math.sqrt(n * p * (1 - p));

/** The first n sums of the k largest weights, for a sentence: "0.4, 0.8, 1". */
export const sumsText = (w: readonly number[], n: number): string => sums(w).slice(0, n).map(sumText).join(', ');

/** A sum for a sentence: 0.8, 0.75, 1. */
export const sumText = (x: number): string => String(Number(tidy(x).toFixed(3)));

/** Dot gauge: how many of `n` dots are filled for e ebits, when the full gauge is MAX_E ebits. */
export const MAX_E = Math.log2(MAXD);
export const GAUGE_DOTS = 40;
export const gaugeFilled = (e: number): number => Math.round((Math.min(e, MAX_E) / MAX_E) * GAUGE_DOTS);

/** Dot grid for a pile in a w by h box: the largest pitch, up to max, in steps of 0.25, at which n dots fit. */
export function pileGrid(w: number, h: number, n: number, max = 8): { pitch: number; cols: number } {
  let p = Math.max(1, Math.min(max, Math.floor(Math.min(w, h) * 4) / 4));
  while (p > 1 && Math.floor(w / p) * Math.floor(h / p) < n) p -= 0.25;
  return { pitch: p, cols: Math.max(1, Math.floor(w / p)) };
}

/** The sentence that names a state and its ebits, so every readout says where it started. */
export const describe = (s: Named): string => `${s.name} (weights ${s.text}; ${ebitText(ebits(s.w))})`;

/** The verdict in words for a start and a target. Names the start state. */
export function verdictText(from: Named, to: Named): string {
  const v = compare(from.w, to.w);
  if (v.same) return `These two have the same weights, so they are the same state up to relabeling levels. Nothing to do, and the way back works too.`;
  if (v.ok) {
    const br = protocol(from.w, to.w)!, n = br.length;
    const lost = ebitText(Number(v.eFrom.toFixed(2)) - Number(v.eTo.toFixed(2)));
    return `Yes, every time. Alice measures her half, tells Bob which of ${n} outcome${n > 1 ? 's' : ''} she got, and each side relabels its levels by the rule for that outcome. ${ebitText(v.eFrom)} became ${ebitText(v.eTo)}: ${lost} less, and LOCC cannot take it back every time, since that would raise the entanglement.`;
  }
  const rank = (w: readonly number[]) => w.filter((x) => x > EPS).length, rf = rank(from.w), rt = rank(to.w);
  if (rt > rf) return `No, never, not even by luck: LOCC cannot raise the number of nonzero weights. The start has ${rf}, the target ${rt}.`;
  const k = v.k, a = sumText(v.sumFrom[k - 1]), b = sumText(v.sumTo[k - 1]);
  const fall = `The k = ${k} largest weights of the start add up to ${a}, the target's only to ${b}. In a change that works every time, that sum can only stay or rise, so this fails.`;
  const more = v.eTo > v.eFrom ? ` The target also has more entanglement (${ebitText(v.eTo)}) than the start (${ebitText(v.eFrom)}), and LOCC cannot raise it.`
    : ` Counting ebits alone would allow it (${ebitText(v.eFrom)} is at least ${ebitText(v.eTo)}), but the ebit count does not decide this.`;
  return `No, not every time. ${fall}${more}`;
}
