// Monogamy of entanglement: the pure math behind the PassTheLink tool and the facts the stop's text states. No DOM.
// Three qubits, one each for Alice, Bob and Carol: qubits 0, 1 and 2 of quantum.ts, written left to right as |abc>.
// Sources: Coffman, Kundu, Wootters, "Distributed entanglement", PRA 61, 052306 (2000), arXiv:quant-ph/9907047 (CKW);
// Aaronson, Introduction to Quantum Information Science, Lecture notes, Section 10.1.2.
//
// The tool's two states, both made from |000>:
//   pass(t): a Hadamard gate on Alice, a CNOT from Alice to Bob, then Bob and Carol's gate G(t):
//            (|000> + cos t|110> + sin t|101>)/√2. An X on Alice turns it into CKW's Eq. (15) family.
//   GHZ:     a Hadamard gate on Alice, then CNOTs from Alice to Bob and from Alice to Carol: (|000> + |111>)/√2.
// Tangle of a pair: the squared concurrence of its two-qubit density matrix (Wootters 1998; CKW Eq. 2).
// CKW, for every pure state of three qubits: tangle(A,B) + tangle(A,C) + three-tangle = 4 det ρ_A (Eq. 24), so the two
// pair tangles add up to at most 4 det ρ_A, which is at most 1 (Eq. 12).
// The tool: all three measure one fresh copy in the same test (0/1, or +/− as a Hadamard gate then 0/1), and each
// panel counts how often Bob's, or Carol's, result matches Alice's.
// Entanglement of formation of two qubits is E = h((1 + √(1 − τ))/2) (Wootters 1998; CKW footnote 1). It is not additive
// the way the tangle is: at 45° each pair has E ≈ 0.601, and 2 × 0.601 > 1 (CKW, after Eq. 15).
import { c, H, abs, abs2, add, apply1, basis, cnot, conj, draw, mul, probs, scale, sub, type C, type State } from '../quantum.ts';

export type Kind = 'pass' | 'ghz';
/** 'Z' is the 0/1 test, 'X' the +/− test. */
export type Basis = 'Z' | 'X';
export type Bit = 0 | 1;
/** Alice's partner in a panel: Bob (qubit 1) or Carol (qubit 2). */
export type Partner = 1 | 2;

export const ALICE = 0, BOB = 1, CAROL = 2;
export const PARTNERS: readonly Partner[] = [BOB, CAROL];
/** Most runs the tool holds. The tests take turns, so each basis gets at most half: one strip per panel. */
export const MAX = 200;
export const STRIP = MAX / 2;
/** The gate's preset angles in degrees: all with Bob, an even split, all with Carol. */
export const PRESETS = [0, 45, 90] as const;

// Float dust: (1/√2)² is 0.5000000000000001. Below this a number counts as exactly 0 (or exactly 1).
const DUST = 1e-12;
const clean = (x: number) => (Math.abs(x) < DUST ? 0 : Math.abs(x - 1) < DUST ? 1 : x);
const S2 = Math.SQRT1_2;

/** cos and sin of an angle in degrees, exact at 0°, 45° and 90° (Math.cos(π/2) is 6e-17, not 0). */
export const cosd = (deg: number): number => (deg === 0 ? 1 : deg === 90 ? 0 : deg === 45 ? S2 : Math.cos((deg * Math.PI) / 180));
export const sind = (deg: number): number => (deg === 0 ? 0 : deg === 90 ? 1 : deg === 45 ? S2 : Math.sin((deg * Math.PI) / 180));

/** Basis index of the string with Alice's bit a, Bob's b and Carol's c. */
export const idx = (a: number, b: number, cc: number): number => (a << 2) | (b << 1) | cc;
/** Qubit q's bit in basis index i. */
export const bitOf = (i: number, q: number): Bit => ((i >> (2 - q)) & 1) as Bit;

// ---- The states

/**
 * Bob and Carol's gate G(t) on qubits 1 and 2 of a three-qubit state: |10> -> cos t|10> + sin t|01>,
 * |01> -> −sin t|10> + cos t|01>, and |00>, |11> unchanged. A rotation inside the span of |10> and |01>, so it is unitary.
 * It moves Bob's 1 to Carol and never touches Alice's qubit.
 */
export function shareGate(s: State, deg: number): State {
  const k = cosd(deg), n = sind(deg), out = s.slice();
  for (const a of [0, 1]) {
    const i10 = idx(a, 1, 0), i01 = idx(a, 0, 1);
    out[i10] = sub(scale(s[i10], k), scale(s[i01], n));
    out[i01] = add(scale(s[i10], n), scale(s[i01], k));
  }
  return out;
}

/** Alice and Bob's Bell pair, Carol at 0: started as |000>, then a Hadamard gate on Alice and a CNOT from Alice to Bob. */
export const bellWithBob = (): State => cnot(apply1(basis(3, 0), H, ALICE, 3), ALICE, BOB, 3);

/** The tool's state: pass(t) is the Bell pair, then Bob and Carol's gate at t degrees; GHZ adds a CNOT to Carol instead. */
export function stateOf(k: Kind, deg: number): State {
  return k === 'ghz' ? cnot(bellWithBob(), ALICE, CAROL, 3) : shareGate(bellWithBob(), deg);
}

// ---- Tangles (exact, from the state)

/**
 * The pair (p, q) of a three-qubit pure state, split by the third qubit r: v_k lists the amplitudes with r = k, in the
 * order |00>, |01>, |10>, |11> of p and q. Then ρ_pq = |v_0><v_0| + |v_1><v_1| (the partial trace over r).
 */
export function branches(s: State, p: number, q: number): [State, State] {
  const r = 3 - p - q;
  const at = (x: number, y: number, k: number) => {
    const b = [0, 0, 0]; b[p] = x; b[q] = y; b[r] = k;
    return s[idx(b[0], b[1], b[2])];
  };
  return [0, 1].map((k) => [at(0, 0, k), at(0, 1, k), at(1, 0, k), at(1, 1, k)]) as [State, State];
}

/** v^T (σy ⊗ σy) w for two-qubit vectors: σy ⊗ σy has −1 at (00, 11) and (11, 00), +1 at (01, 10) and (10, 01). */
const yy = (v: State, w: State): C => sub(add(mul(v[1], w[2]), mul(v[2], w[1])), add(mul(v[0], w[3]), mul(v[3], w[0])));

/**
 * Tangle of the pair (p, q): the squared concurrence of ρ_pq (Wootters 1998; CKW Eq. 2), τ = (λ1 − λ2)².
 * ρ_pq has rank 2 at most, so ρ ρ̃ has two nonzero eigenvalues λ1², λ2², and λ1, λ2 are the singular values of the
 * symmetric 2x2 matrix M_kl = v_k^T (σy ⊗ σy) v_l (Wootters' τ_ij, conjugated). Hence τ = |M|² − 2|det M|, no eigen-solver.
 */
export function pairTangle(s: State, p: number, q: number): number {
  const [v0, v1] = branches(s, p, q);
  const m00 = yy(v0, v0), m01 = yy(v0, v1), m11 = yy(v1, v1);
  const frob = abs2(m00) + 2 * abs2(m01) + abs2(m11);
  const det = abs(sub(mul(m00, m11), mul(m01, m01)));
  return clean(Math.max(0, frob - 2 * det));
}

/** Entanglement of formation, in ebits, of two qubits with tangle τ: h((1 + √(1 − τ))/2), h the binary entropy. 0 at 0, 1 at 1. */
export function formation(tau: number): number {
  const x = (1 + Math.sqrt(Math.max(0, 1 - tau))) / 2;
  const h = (y: number) => (y <= 0 || y >= 1 ? 0 : -y * Math.log2(y) - (1 - y) * Math.log2(1 - y));
  return h(x);
}

/** Concurrence of the pair (p, q): the square root of its tangle. 0 for no entanglement, 1 for a Bell pair. */
export const pairConcurrence = (s: State, p: number, q: number): number => Math.sqrt(pairTangle(s, p, q));

/** Qubit q's 2x2 density matrix, the other two traced out. */
export function oneQubit(s: State, q: number): C[][] {
  const m = [[c(0), c(0)], [c(0), c(0)]];
  for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) {
    if ((i ^ j) & ~(1 << (2 - q)) & 7) continue; // the other two qubits must agree
    m[bitOf(i, q)][bitOf(j, q)] = add(m[bitOf(i, q)][bitOf(j, q)], mul(s[i], conj(s[j])));
  }
  return m;
}

/** Tangle of qubit q with the other two together, 4 det ρ_q (CKW, after Eq. 11). Between 0 and 1 for a pure state. */
export function focusTangle(s: State, q: number): number {
  const m = oneQubit(s, q);
  return clean(4 * (m[0][0].re * m[1][1].re - abs2(m[0][1])));
}

/**
 * The three-way tangle (CKW Eqs. 21 and 22): τ_ABC = 4|d1 − 2 d2 + 4 d3|, a polynomial in the amplitudes a_ijk.
 * The same whichever qubit is the focus. 1 for GHZ, 0 for W and for every state in the pass family.
 */
export function threeTangle(s: State): number {
  const m = (...xs: number[]) => xs.map((i) => s[i]).reduce(mul);
  const sum = (...xs: C[]) => xs.reduce(add);
  const d1 = sum(m(0, 0, 7, 7), m(1, 1, 6, 6), m(2, 2, 5, 5), m(4, 4, 3, 3));
  const d2 = sum(m(0, 7, 3, 4), m(0, 7, 5, 2), m(0, 7, 6, 1), m(3, 4, 5, 2), m(3, 4, 6, 1), m(5, 2, 6, 1));
  const d3 = sum(m(0, 6, 5, 3), m(7, 1, 2, 4));
  return clean(4 * abs(add(sub(d1, scale(d2, 2)), scale(d3, 4))));
}

/** Alice's tangle budget: with Bob, with Carol, three-way, and with Bob and Carol together (the limit, 4 det ρ_A). */
export type Budget = { bob: number; carol: number; three: number; limit: number };
export function budget(k: Kind, deg: number): Budget {
  const s = stateOf(k, deg);
  return { bob: pairTangle(s, ALICE, BOB), carol: pairTangle(s, ALICE, CAROL), three: threeTangle(s), limit: focusTangle(s, ALICE) };
}

// ---- What the measurements give (Born rule)

/** Turn all three qubits so that a 0/1 measurement after it is a measurement in basis b. For X that is a Hadamard gate each. */
export const turn = (s: State, b: Basis): State => (b === 'X' ? [0, 1, 2].reduce((t, q) => apply1(t, H, q, 3), s) : s);

/** Born rule chances of the eight strings |abc>, when all three measure in basis b. */
export const chances = (k: Kind, deg: number, b: Basis): number[] => probs(turn(stateOf(k, deg), b));

/** Chance that the partner's result matches Alice's, when all three measure in basis b. */
export function matchChance(k: Kind, deg: number, b: Basis, who: Partner): number {
  return clean(chances(k, deg, b).reduce((t, p, i) => t + (bitOf(i, ALICE) === bitOf(i, who) ? p : 0), 0));
}

// ---- Runs, drawn with the Born rule

/** One run: a fresh copy, measured by all three in one basis. It keeps its random number u, so a new state re-runs the same draw. */
export type Run = { u: number; basis: Basis };

/** The tests take turns: run 0 is 0/1, run 1 is +/−, and so on. */
export const basisFor = (i: number): Basis => (i % 2 === 0 ? 'Z' : 'X');
export const newRun = (i: number, rand: () => number): Run => ({ u: rand(), basis: basisFor(i) });

/** The string a run gives: one Born rule draw over the eight strings, made with the run's own random number. */
export const outcome = (p: number[], u: number): number => draw(p, () => u);

/** Every run's three bits [Alice, Bob, Carol] for this state. The chances are worked out once per basis. */
export function results(k: Kind, deg: number, runs: readonly Run[]): Bit[][] {
  const p = { Z: chances(k, deg, 'Z'), X: chances(k, deg, 'X') };
  return runs.map((r) => {
    const i = outcome(p[r.basis], r.u);
    return [bitOf(i, ALICE), bitOf(i, BOB), bitOf(i, CAROL)];
  });
}

export type Cell = { runs: number; same: number };
export type Panel = Record<Basis, Cell>;
/** For Bob and for Carol, per basis: how many runs, and in how many the partner matched Alice. */
export function tally(k: Kind, deg: number, runs: readonly Run[]): Record<Partner, Panel> {
  const panel = (): Panel => ({ Z: { runs: 0, same: 0 }, X: { runs: 0, same: 0 } });
  const t: Record<Partner, Panel> = { 1: panel(), 2: panel() };
  results(k, deg, runs).forEach((bits, i) => {
    for (const who of PARTNERS) {
      const cell = t[who][runs[i].basis];
      cell.runs++;
      if (bits[who] === bits[ALICE]) cell.same++;
    }
  });
  return t;
}

// ---- Words and numbers the tool shows

export const NAME: Record<Partner, string> = { 1: 'Bob', 2: 'Carol' };
/** Test name for people: "0/1" or "+/−". */
export const basisName = (b: Basis): string => (b === 'Z' ? '0/1' : '+/−');

/** A tangle for people: "0", "1", "0.75", "0.5", and never "0.00" or "1.00" for a value that is not exactly 0 or 1. */
export function num(x: number): string {
  const v = clean(x);
  if (v === 0 || v === 1) return String(v);
  const r = v.toFixed(2);
  if (r === '0.00') return '<0.01';
  if (r === '1.00') return '>0.99';
  return r.replace(/0$/, '');
}

/** A chance as a percent: whole numbers, one decimal near 0 and 100, and never 0% or 100% for a chance that is not exact. */
export function percent(p: number): string {
  const v = clean(p) * 100;
  if (v > 0 && v < 0.05) return '<0.1%';
  if (v > 99.95 && v < 100) return '>99.9%';
  return `${(v > 0 && v < 1) || (v > 99 && v < 100) ? v.toFixed(1) : Math.round(v)}%`;
}

const amp = (x: number) => x.toFixed(2);

/** The state as a ket, exact at 0°, 45°, 90° and for GHZ, else two decimals: "|ψ⟩ ≈ 0.71|000⟩ + 0.61|110⟩ + 0.35|101⟩". */
export function ketLine(k: Kind, deg: number): string {
  if (k === 'ghz') return '|ψ⟩ = (|000⟩ + |111⟩)/√2';
  if (deg === 0) return '|ψ⟩ = (|000⟩ + |110⟩)/√2';
  if (deg === 90) return '|ψ⟩ = (|000⟩ + |101⟩)/√2';
  if (deg === 45) return '|ψ⟩ = |000⟩/√2 + (|110⟩ + |101⟩)/2';
  return `|ψ⟩ ≈ ${amp(S2)}|000⟩ + ${amp(S2 * cosd(deg))}|110⟩ + ${amp(S2 * sind(deg))}|101⟩`;
}

/** How the state was made, from 000. Every readout starts with it: what a gate does depends on its input. */
export function madeText(k: Kind, deg: number): string {
  return k === 'ghz'
    ? 'Started as 000, then a Hadamard gate on Alice and CNOTs from Alice to Bob and from Alice to Carol: GHZ.'
    : `Started as 000, then a Hadamard gate on Alice, a CNOT from Alice to Bob, and Bob and Carol's gate at ${deg}°.`;
}

/** The slider's spoken value. */
export function sliderText(deg: number): string {
  const b = budget('pass', deg);
  return `${deg} degrees. Tangle with Bob ${num(b.bob)}, with Carol ${num(b.carol)}.`;
}

/** The tangle budget in words. */
export function budgetText(k: Kind, deg: number): string {
  const b = budget(k, deg);
  if (k === 'ghz') {
    return `Tangle: Alice and Bob ${num(b.bob)}, Alice and Carol ${num(b.carol)}, yet Alice's tangle with Bob and Carol together is ${num(b.limit)}. All of it is three-way: it needs all three qubits.`;
  }
  const head = `Tangle: Alice and Bob ${num(b.bob)}, Alice and Carol ${num(b.carol)}. The two add up to ${num(b.bob + b.carol)}, Alice's limit.`;
  if (b.bob === 1) return `${head} Alice and Bob are a Bell pair, so nothing is left for Carol.`;
  if (b.carol === 1) return `${head} Alice and Carol are a Bell pair, so nothing is left for Bob.`;
  return head;
}

/** The take-home sentence for a state, from the exact chances (not from the noisy dots). */
export function lesson(k: Kind, deg: number): string {
  if (k === 'ghz') return 'In 0/1, Bob and Carol both match Alice every time: a plain shared record, which any number can hold. In +/−, each matches only half the time, like a coin flip. Yet the three +/− results always hold an even number of −: GHZ is entangled, but only all three together.';
  const b = budget(k, deg);
  if (b.bob === 1) return 'Bob matches Alice every time in both tests, so Carol matches only half the time, like coin flips.';
  if (b.carol === 1) return 'Carol matches Alice every time in both tests, so Bob matches only half the time, like coin flips.';
  return 'Neither matches Alice every time in both tests. What Carol gains, Bob loses.';
}

/** The line above one strip: counts so far against the Born rule chance. */
export function countText(c: Cell, expected: number): string {
  return c.runs ? `Matched ${c.same} of ${c.runs}, expected ${percent(expected)}.` : `Expected to match ${percent(expected)}.`;
}

/** What the readout says, before and after runs. */
export function readout(k: Kind, deg: number, runs: readonly Run[]): string {
  const head = `${madeText(k, deg)} ${budgetText(k, deg)}`;
  if (!runs.length) return `${head} Press Run to measure copies.`;
  const t = tally(k, deg, runs);
  const out = [`${head} ${runs.length} ${runs.length === 1 ? 'run' : 'runs'}.`];
  for (const who of PARTNERS) {
    const cells = (['Z', 'X'] as Basis[])
      .filter((b) => t[who][b].runs)
      .map((b) => `${t[who][b].same} of ${t[who][b].runs} in ${basisName(b)} (expected ${percent(matchChance(k, deg, b, who))})`);
    out.push(`${NAME[who]} matched Alice ${cells.join(' and ')}.`);
  }
  out.push(lesson(k, deg));
  if (runs.length >= MAX) out.push('The panels are full. Press Clear to start again.');
  return out.join(' ');
}
