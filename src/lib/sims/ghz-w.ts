// GHZ and W states: the pure math behind the GhzW tool and the facts the stop's text states. No DOM.
// Three qubits, one each for Alice, Bob and Carol: qubits 0, 1 and 2 of quantum.ts, written left to right as |abc>.
// The two states (Watrous, Understanding Quantum Information and Computation, Multiple systems; Dür, Vidal, Cirac 2000):
//   GHZ = (|000> + |111>)/√2        W = (|001> + |010> + |100>)/√3
// The tool: Carol measures her qubit in the 0/1 basis or the +/− basis and tells the others her result.
// Then Alice and Bob both measure in one basis and check if their results match.
// A +/− measurement is a Hadamard gate, then a 0/1 measurement: result 0 reads as +, result 1 as −.
import { c, H, abs, abs2, add, apply1, basis, cnot, conj, measureQubit, mul, probs, scale, sub, type C, type Matrix, type State } from '../quantum.ts';

export type Kind = 'ghz' | 'w';
/** 'Z' is the 0/1 basis, 'X' the +/− basis. */
export type Basis = 'Z' | 'X';
export type Bit = 0 | 1;

export const ALICE = 0, BOB = 1, CAROL = 2;
/** Most runs the tool holds. Alice and Bob take turns between bases, so each basis gets at most half. */
export const MAX = 200;
/** Dots one strip (one Carol result, one basis for Alice and Bob) must have room for. */
export const STRIP = MAX / 2;

// Float dust: (1/√2)² is 0.5000000000000001. Below this we call a number 0.
const DUST = 1e-12;

// ---- The two states

/** GHZ, made the usual way: started as |000>, then a Hadamard gate on Alice's qubit, then CNOT Alice→Bob and Bob→Carol. */
export function ghz(): State {
  const s = apply1(basis(3, 0), H, ALICE, 3);
  return cnot(cnot(s, ALICE, BOB, 3), BOB, CAROL, 3);
}

/** W: amplitude 1/√3 on each string with exactly one 1, that is |001>, |010> and |100>. */
export const w = (): State => Array.from({ length: 8 }, (_, i) => c(i === 1 || i === 2 || i === 4 ? 1 / Math.sqrt(3) : 0));

export const stateOf = (k: Kind): State => (k === 'ghz' ? ghz() : w());

/** Turn qubit q so that a 0/1 measurement after it is a measurement in basis b. For X that is a Hadamard gate. */
export const turnTo = (s: State, q: number, b: Basis): State => (b === 'X' ? apply1(s, H, q, Math.log2(s.length)) : s);

// ---- Carol measures: what is left for Alice and Bob (exact)

/**
 * Carol measures in basis b and gets r. Born rule chance p = sum of |amplitude|² over the strings where she gets r,
 * and Alice and Bob are left with those amplitudes, rescaled to length 1: their pair, in the order |00>, |01>, |10>, |11>.
 * For b = X the pair is <+| or <−| on Carol's qubit applied to the state (Watrous, Multiple systems, Partial measurements).
 */
export function afterCarol(k: Kind, b: Basis, r: Bit): { p: number; pair: State } {
  const s = turnTo(stateOf(k), CAROL, b);
  const part = [0, 1, 2, 3].map((ab) => s[(ab << 1) | r]);
  const p = part.reduce((t, a) => t + abs2(a), 0);
  return { p, pair: p > 0 ? part.map((a) => scale(a, 1 / Math.sqrt(p))) : part };
}

/** Born rule for Alice and Bob both measuring their pair in basis b: chances of 00, 01, 10, 11. */
export const pairChances = (pair: State, b: Basis): number[] => probs(turnTo(turnTo(pair, 0, b), 1, b));

/** Chance that Alice and Bob get the same result: 00 or 11 (in X: ++ or −−). */
export const sameChance = (pair: State, b: Basis): number => {
  const p = pairChances(pair, b);
  return p[0] + p[3];
};

/** Concurrence of a two-qubit pure state a|00> + b|01> + c|10> + d|11>: 2|ad − bc|. 0 means a product state, 1 a Bell pair (Wootters 1998). */
export const concurrence = (pair: State): number => 2 * abs(sub(mul(pair[0], pair[3]), mul(pair[1], pair[2])));

/** How entangled Alice and Bob's pure pair is: 'none' (a product state), 'bell' (fully, like a Bell pair) or 'some' (in between). */
export type Link = 'none' | 'bell' | 'some';
export function link(pair: State): Link {
  const k = concurrence(pair);
  return k < 1e-9 ? 'none' : k > 1 - 1e-9 ? 'bell' : 'some';
}

// ---- One run, drawn with the Born rule

export type Run = { carol: Bit; basis: Basis; alice: Bit; bob: Bit };

/** Alice and Bob take turns: run 0 both measure 0/1, run 1 both +/−, and so on. */
export const abBasisFor = (i: number): Basis => (i % 2 === 0 ? 'Z' : 'X');

/**
 * One fresh copy of the state, measured one qubit at a time, each a Born rule draw (measureQubit in quantum.ts):
 * Carol in her basis, then Alice and Bob in theirs, each on the state the last measurement left.
 */
export function run(k: Kind, carolBasis: Basis, abBasis: Basis, rand: () => number): Run {
  const m = measureQubit(turnTo(stateOf(k), CAROL, carolBasis), CAROL, rand, 3);
  const a = measureQubit(turnTo(turnTo(m.state, ALICE, abBasis), BOB, abBasis), ALICE, rand, 3);
  const b = measureQubit(a.state, BOB, rand, 3);
  return { carol: m.result, basis: abBasis, alice: a.result, bob: b.result };
}

export type Cell = { runs: number; same: number };
export type Box = { runs: number; Z: Cell; X: Cell };

/** Sort runs by Carol's result, then by Alice and Bob's basis, and count the runs where Alice and Bob matched. */
export function tally(runs: readonly Run[]): [Box, Box] {
  const box = (): Box => ({ runs: 0, Z: { runs: 0, same: 0 }, X: { runs: 0, same: 0 } });
  const t: [Box, Box] = [box(), box()];
  for (const r of runs) {
    const b = t[r.carol], cell = b[r.basis];
    b.runs++; cell.runs++;
    if (r.alice === r.bob) cell.same++;
  }
  return t;
}

// ---- Facts the text states: the kind of a three-qubit state

/** (A ⊗ B ⊗ C)|ψ>: one 2x2 operator on each qubit. Any operator, not only unitary: invertible ones are SLOCC steps (DVC). */
export const local = (s: State, ops: readonly Matrix[]): State => ops.reduce((t, m, q) => apply1(t, m, q, ops.length), s);

/**
 * The 3-tangle (Coffman, Kundu, Wootters, PRA 61, 052306, 2000): tau = 4|d1 − 2 d2 + 4 d3|, a polynomial in the
 * amplitudes a_ijk. It is 1 for GHZ, never 0 on the GHZ kind, 0 on the W kind, and does not grow on average under LOCC (DVC).
 */
export function tangle(s: State): number {
  const a = (i: number) => s[i];
  const m = (...xs: number[]) => xs.map(a).reduce(mul);
  const sum = (...xs: C[]) => xs.reduce(add);
  const d1 = sum(m(0, 0, 7, 7), m(1, 1, 6, 6), m(2, 2, 5, 5), m(4, 4, 3, 3));
  const d2 = sum(m(0, 7, 3, 4), m(0, 7, 5, 2), m(0, 7, 6, 1), m(3, 4, 5, 2), m(3, 4, 6, 1), m(5, 2, 6, 1));
  const d3 = sum(m(0, 6, 5, 3), m(7, 1, 2, 4));
  return 4 * abs(add(sub(d1, scale(d2, 2)), scale(d3, 4)));
}

/** Alice and Bob's two-qubit density matrix when Carol's qubit is lost (traced out): rho[i][j] = sum over c of a_ic conj(a_jc). */
export function pairMatrix(s: State): Matrix {
  return [0, 1, 2, 3].map((i) => [0, 1, 2, 3].map((j) => add(mul(s[i << 1], conj(s[j << 1])), mul(s[(i << 1) | 1], conj(s[(j << 1) | 1])))));
}

// ---- Words and numbers the tool shows

/** Basis name for people: "0/1" or "+/−". */
export const basisName = (b: Basis): string => (b === 'Z' ? '0/1' : '+/−');

/** A result in a basis: 0 or 1 in Z, + or − in X. */
export const resultName = (b: Basis, r: Bit): string => (b === 'Z' ? String(r) : r ? '−' : '+');

/** A chance as "always", "never" or "k in d" when it is a simple fraction (every chance in this tool is). */
export function chanceText(p: number): string {
  if (p < DUST) return 'never';
  if (p > 1 - DUST) return 'always';
  for (let d = 2; d <= 12; d++) {
    const k = Math.round(p * d);
    if (Math.abs(p * d - k) < 1e-9) return `${k} in ${d}`;
  }
  return `${Math.round(p * 100)}%`;
}

/**
 * A real state as a ket, exact when every amplitude is ±1/√k: "|00⟩", "(|01⟩ + |10⟩)/√2", "(−|00⟩ + |01⟩ + |10⟩)/√3".
 * Otherwise two decimals per amplitude: "0.60|00⟩ + 0.80|11⟩". Real amplitudes only (every state in this tool is real).
 */
export function ketText(s: State): string {
  const n = Math.log2(s.length), bits = (i: number) => `|${i.toString(2).padStart(n, '0')}⟩`;
  const on = s.map((a, i) => ({ x: a.re, i })).filter(({ x }) => Math.abs(x) > DUST);
  const m = Math.abs(on[0].x), k = 1 / (m * m), K = Math.round(k);
  const sign = (x: number, j: number) => (x < 0 ? (j ? ' − ' : '−') : j ? ' + ' : '');
  if (on.every(({ x }) => Math.abs(Math.abs(x) - m) < 1e-9) && Math.abs(k - K) < 1e-9) {
    const terms = on.map(({ x, i }, j) => sign(x, j) + bits(i)).join('');
    return K === 1 ? terms : `(${terms})/√${K}`;
  }
  return on.map(({ x, i }, j) => sign(x, j) + Math.abs(x).toFixed(2) + bits(i)).join('');
}

/** The two states as the tool writes them. */
export const NAME: Record<Kind, string> = { ghz: 'GHZ', w: 'W' };

/** What a pair's link means, in words. */
export const linkText: Record<Link, string> = {
  none: 'not entangled',
  bell: 'a Bell pair, fully entangled',
  some: 'entangled, but less than a Bell pair',
};

const leftWith: Record<Link, string> = {
  none: 'no entanglement',
  bell: 'a Bell pair',
  some: 'some entanglement, less than a Bell pair',
};

/** The line under each of Carol's results: Alice and Bob's pair and how entangled it is. */
export const pairLine = (k: Kind, b: Basis, r: Bit): string => {
  const { pair } = afterCarol(k, b, r);
  return `Alice and Bob now share ${ketText(pair)}: ${linkText[link(pair)]}.`;
};

/** The take-home sentence for a state and Carol's basis, from the exact pairs. */
export function lesson(k: Kind, b: Basis): string {
  const [l0, l1] = ([0, 1] as Bit[]).map((r) => link(afterCarol(k, b, r).pair));
  if (l0 === l1) return `Whatever Carol gets, Alice and Bob are left with ${leftWith[l0]}.`;
  return `If Carol gets ${resultName(b, 0)}, Alice and Bob are left with ${leftWith[l0]}; if she gets ${resultName(b, 1)}, with ${leftWith[l1]}.`;
}

/** "1 in 2 each" or "2 in 3 and 1 in 3": Born rule chances of Carol's two results. */
export function carolOdds(k: Kind, b: Basis): string {
  const [p0, p1] = ([0, 1] as Bit[]).map((r) => afterCarol(k, b, r).p);
  return Math.abs(p0 - p1) < 1e-9 ? `${chanceText(p0)} each` : `${chanceText(p0)} and ${chanceText(p1)}`;
}

/** What the readout says, before and after runs. */
export function readout(k: Kind, b: Basis, runs: readonly Run[]): string {
  const head = `Started as ${NAME[k]}, ${ketText(stateOf(k))}. Carol measures in ${basisName(b)}.`;
  if (!runs.length) {
    const parts = ([0, 1] as Bit[]).map((r) => {
      const { p, pair } = afterCarol(k, b, r);
      return `${resultName(b, r)} with chance ${chanceText(p)}, leaving Alice and Bob ${ketText(pair)} (${linkText[link(pair)]})`;
    });
    return `${head} Born rule: she gets ${parts.join(', or ')}. Press Run.`;
  }
  const t = tally(runs);
  const out = [`${head} ${runs.length} ${runs.length === 1 ? 'run' : 'runs'}.`];
  out.push(`Carol got ${resultName(b, 0)} in ${t[0].runs} and ${resultName(b, 1)} in ${t[1].runs} (Born rule: ${carolOdds(k, b)}).`);
  for (const r of [0, 1] as Bit[]) {
    if (!t[r].runs) continue;
    const { pair } = afterCarol(k, b, r);
    const cells = (['Z', 'X'] as Basis[])
      .filter((ab) => t[r][ab].runs)
      .map((ab) => `${t[r][ab].same} of ${t[r][ab].runs} times in ${basisName(ab)} (expected ${chanceText(sameChance(pair, ab))})`);
    out.push(`After ${resultName(b, r)}, Alice and Bob matched ${cells.join(' and ')}.`);
  }
  out.push(lesson(k, b));
  if (runs.length >= MAX) out.push('The boxes are full. Press Clear to start again.');
  return out.join(' ');
}
