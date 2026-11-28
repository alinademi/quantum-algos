// Partial trace: the pure math behind the HalfPair tool. No DOM.
// Sources: Watrous, Understanding Quantum Information and Computation, "Multiple systems: Reduced states and the partial
// trace" (the definition, tr_B(M ⊗ N) = tr(N) M, the block rule for two qubits, the e-bit example); Aaronson,
// Introduction to Quantum Information Science lecture notes, 6.1.3 (eq. 6.10); Wilde, Quantum Information Theory, 4.3.3
// (eq. 4.148: tr((Λ ⊗ I) ρ_AB) = tr(Λ ρ_A), and the parity tests that tell |Φ+> from π ⊗ π).
// Conventions (as in quantum.ts):
// - Two qubits. A is qubit 0, B is qubit 1. Index i = 2a + b: in |ab> A's bit is on the left.
// - A density matrix is a Matrix. The pair's is 4 by 4, A's is 2 by 2.
// - tr_B: (rho_A)_{a a'} = sum_b rho_{2a+b, 2a'+b}. Cut the 4 by 4 matrix into four 2 by 2 blocks, one per (a, a');
//   each block's trace, the sum of its two diagonal entries, is one entry of rho_A. Entries whose row and column have
//   different B bits are never used.
// - The tool's pair: started as |00>, then RY(theta) on A with sin^2(theta/2) = p, then, if `linked`, a CNOT from A to B.
//     linked:    sqrt(1-p)|00> + sqrt(p)|11>,        rho_A = diag(1-p, p). At p = 1/2 this is the Bell pair.
//     unlinked:  (sqrt(1-p)|0> + sqrt(p)|1>) ⊗ |0>,  rho_A pure.
//   RY(90 deg)|0> = |+> = H|0>, so at p = 1/2 the gate does to 0 what a Hadamard gate does.
// - Three tests on A alone, each a measurement in an orthonormal basis; result 0 is the first ket.
//     'z': |0>, |1>.   'x': |+>, |->.   'y': |+i>, |-i>, with |±i> = (|0> ± i|1>)/sqrt2.
//   P(first result) = (1 + r_t)/2 for the Bloch vector r of rho_A, so the three tests together fix rho_A.
import { c, add, mul, conj, abs2, inner, tensor, basis, ket0, ket1, plus, minus, apply1, cnot, RY, draw, type State, type Matrix } from '../quantum.ts';
import { pct } from '../draw.ts';

export type Test = 'z' | 'x' | 'y';
export type Bit = 0 | 1;
export type Vec3 = [number, number, number];
export type Kind = 'pure' | 'mixed' | 'fully';
/** One fresh pair, with A measured in one test. u is the pair's own uniform random number: a new setting re-reads it. */
export type Shot = { test: Test; u: number };

export const TESTS: readonly Test[] = ['z', 'x', 'y'];
/** How the tool writes the two results of each test. */
export const NAMES: Record<Test, [string, string]> = { z: ['0', '1'], x: ['+', '−'], y: ['+i', '−i'] };
export const TEST_NAMES: Record<Test, string> = { z: '0/1', x: '+/−', y: '+i/−i' };
/** Pairs per test that one press measures, and the most pairs one test holds. */
export const BATCH = 100;
export const CAP = 300;

const S2 = Math.SQRT1_2;
/** Below this a gap is float dust: H|+> gives 1.0000000000000002 where the exact value is 1. */
const DUST = 1e-9;
const clamp01 = (p: number) => Math.max(0, Math.min(1, p));

/** Float dust to exact values for readouts: 0.5000000000000001 becomes 0.5, -1e-17 becomes 0. */
export const tidy = (x: number): number => Math.round(x * 1e12) / 1e12 + 0;

/** p from the slider (whole percent, 0 to 100) as a chance. */
export const fromPercent = (n: number): number => clamp01(Math.round(n) / 100);

// ---- The pair

/** The RY angle, in radians, that turns |0> into sqrt(1-p)|0> + sqrt(p)|1>: sin^2(theta/2) = p. */
export const gateAngle = (p: number): number => 2 * Math.asin(Math.sqrt(clamp01(p)));

/** Started as |00>, then RY(theta) on A with sin^2(theta/2) = p, then a CNOT from A to B if `linked`. */
export function pair(p: number, linked: boolean): State {
  const s = apply1(basis(2, 0), RY(gateAngle(p)), 0, 2);
  return linked ? cnot(s, 0, 1, 2) : s;
}

/** |psi><psi|, the density matrix of a pure state. */
export const density = (s: State): Matrix => s.map((x) => s.map((y) => mul(x, conj(y))));

// ---- The partial trace

/** tr_B of a 4 by 4 matrix: entry (a, a') is the trace of block (a, a'), sum_b rho_{2a+b, 2a'+b}. */
export const traceB = (rho: Matrix): Matrix =>
  [0, 1].map((a) => [0, 1].map((a2) => add(rho[2 * a][2 * a2], rho[2 * a + 1][2 * a2 + 1])));

/** tr_A of a 4 by 4 matrix: entry (b, b') is sum_a rho_{2a+b, 2a+b'}, the sum of the two diagonal blocks. */
export const traceA = (rho: Matrix): Matrix =>
  [0, 1].map((b) => [0, 1].map((b2) => add(rho[b][b2], rho[2 + b][2 + b2])));

/** A's reduced density matrix for a pure pair: tr_B |psi><psi|. */
export const reducedA = (s: State): Matrix => traceB(density(s));

/** True when entry (i, j) of the pair's matrix is used by tr_B: B's bit is the same in row i and column j. */
export const kept = (i: number, j: number): boolean => (i & 1) === (j & 1);

/** The entry of rho_A that entry (i, j) of the pair's matrix sits over: (A's bit of i, A's bit of j). */
export const blockOf = (i: number, j: number): [Bit, Bit] => [(i >> 1) as Bit, (j >> 1) as Bit];

// ---- One qubit's density matrix

/** Bloch vector (x, y, z) of a qubit density matrix: rho = (I + x X + y Y + z Z)/2. */
export const blochOf = (rho: Matrix): Vec3 => [2 * rho[0][1].re, -2 * rho[0][1].im, rho[0][0].re - rho[1][1].re];

/** tr(rho^2) = sum |rho_jk|^2 for a Hermitian rho. 1 for a pure state; for a qubit, 1/2 only for I/2. */
export const purity = (rho: Matrix): number => rho.reduce((t, row) => t + row.reduce((u, x) => u + abs2(x), 0), 0);

/** Pure, mixed, or fully mixed (I/2, purity 1/2, the least a qubit can have). */
export function kind(rho: Matrix): Kind {
  const q = purity(rho);
  if (Math.abs(q - 1) < DUST) return 'pure';
  if (Math.abs(q - 0.5) < DUST) return 'fully';
  return 'mixed';
}

/** For a pure rho = |phi><phi|: a state vector phi, up to a global phase. Taken from the column with the biggest diagonal. */
export function ownKet(rho: Matrix): State {
  const j = rho[0][0].re >= rho[1][1].re ? 0 : 1, k = Math.sqrt(rho[j][j].re);
  return [0, 1].map((i) => c(rho[i][j].re / k, rho[i][j].im / k));
}

// ---- Tests on A alone

/** The two kets of a test. */
export function kets(t: Test): [State, State] {
  if (t === 'z') return [ket0(), ket1()];
  if (t === 'x') return [plus(), minus()];
  return [[c(S2), c(0, S2)], [c(S2), c(0, -S2)]];
}

/** <u|rho|u>: the Born rule chance of result u for a qubit with density matrix rho. */
export function chance(rho: Matrix, u: State): number {
  let t = c(0);
  for (let j = 0; j < 2; j++) for (let k = 0; k < 2; k++) t = add(t, mul(mul(conj(u[j]), rho[j][k]), u[k]));
  return t.re;
}

/** The odds of a test's two results from A's reduced state alone. */
export const oddsA = (rhoA: Matrix, t: Test): [number, number] => {
  const [u0, u1] = kets(t);
  return [chance(rhoA, u0), chance(rhoA, u1)];
};

/** The odds of a test on A from the whole pair, B left alone: P(r) = sum_b |(<u_r| ⊗ <b|) psi|^2. */
export const oddsPair = (s: State, t: Test): [number, number] => {
  const [u0, u1] = kets(t), side = (u: State) => abs2(inner(tensor(u, ket0()), s)) + abs2(inner(tensor(u, ket1()), s));
  return [side(u0), side(u1)];
};

/** A's result for a pair whose random number is u: the Born rule draw, re-read for every new setting. */
export const result = (odds: readonly number[], u: number): Bit => draw(odds.map((p) => (p < DUST ? 0 : p)), () => u) as Bit;

/** Counts of each result per test for the shots so far, with A's odds from the whole pair s. */
export function counts(s: State, shots: readonly Shot[]): Record<Test, [number, number]> {
  const out = { z: [0, 0], x: [0, 0], y: [0, 0] } as Record<Test, [number, number]>;
  const odds = { z: oddsPair(s, 'z'), x: oddsPair(s, 'x'), y: oddsPair(s, 'y') };
  for (const sh of shots) out[sh.test][result(odds[sh.test], sh.u)]++;
  return out;
}

/** Standard deviation of a count with chance p over n independent tries (binomial): sqrt(n p (1 - p)). */
export const spread = (n: number, p: number): number => Math.sqrt(n * p * (1 - p));

/** Dot grid for a pile in a w by h box: the largest pitch, up to max and in steps of 0.25, at which n dots fit. */
export function pileGrid(w: number, h: number, n: number, max = 9): { pitch: number; cols: number } {
  let p = Math.max(1, Math.min(max, Math.floor(Math.min(w, h) * 4) / 4));
  while (p > 1 && Math.floor(w / p) * Math.floor(h / p) < n) p -= 0.25;
  return { pitch: p, cols: Math.max(1, Math.floor(w / p)) };
}

// ---- Words and numbers for the page

/** A real matrix entry, two decimals; exact 0 and 1 as "0" and "1", a minus sign as "−". */
export function num(x: number): string {
  const v = tidy(x);
  if (v === 0 || Math.abs(v) === 1) return v < 0 ? '−1' : String(v);
  return (v < 0 ? '−' : '') + Math.abs(v).toFixed(2);
}

/** A gate angle in degrees, at most one decimal: 90, 66.4. */
export const degrees = (p: number): string => `${tidy(Math.round((gateAngle(p) * 1800) / Math.PI) / 10)}°`;

/** A ket with real amplitudes, two decimals, zero terms left out: "0.71|00⟩ + 0.71|11⟩", "|00⟩". */
export function ketText(s: State): string {
  const n = Math.log2(s.length), terms: string[] = [];
  s.forEach((a, i) => {
    const v = tidy(a.re);
    if (v === 0) return;
    const name = `|${i.toString(2).padStart(n, '0')}⟩`, size = Math.abs(v) === 1 ? '' : Math.abs(v).toFixed(2);
    terms.push(`${terms.length ? (v < 0 ? ' − ' : ' + ') : v < 0 ? '−' : ''}${size}${name}`);
  });
  return terms.join('');
}

/** How the pair was made, naming the start state. */
export function made(p: number, linked: boolean): string {
  const h = Math.abs(p - 0.5) < DUST ? ' (on 0 it acts like a Hadamard gate)' : '';
  return `Started as 00, then RY(${degrees(p)}) on A${h}, ${linked ? 'then a CNOT from A to B' : 'and no CNOT'}`;
}

/** The pair's state and how it was made, in one line. */
export const pairText = (p: number, linked: boolean): string => `${made(p, linked)}: |ψ⟩ = ${ketText(pair(p, linked))}.`;

/** Entry (a, a') of rho_A as the sum the trace makes: "0.50 + 0". */
export const sumText = (rho: Matrix, a: Bit, a2: Bit): string => `${num(rho[2 * a][2 * a2].re)} + ${num(rho[2 * a + 1][2 * a2 + 1].re)}`;

const SPOT = [['top left', 'top right'], ['bottom left', 'bottom right']];
/** The four sums the trace makes, for a caption: "top left 0.50 + 0 = 0.50; top right 0 + 0 = 0; ...". */
export function sumsText(rho: Matrix): string {
  const r = traceB(rho);
  return ([0, 1] as const).flatMap((a) => ([0, 1] as const).map((a2) => `${SPOT[a][a2]} block: ${sumText(rho, a, a2)} = ${num(r[a][a2].re)}`)).join('; ');
}

/** What rho_A is, in words. */
export function verdict(rhoA: Matrix): string {
  const q = num(purity(rhoA)), k = kind(rhoA);
  if (k === 'fully') return `That is I/2, the fully mixed state: a state of A, but not a pure one. A alone gives 50/50 in every basis. Purity tr(ρ_A²) = ${q}, the least a qubit can have.`;
  if (k === 'pure') {
    // A pure qubit has at most one sure test among these three (the Bloch vector points along at most one axis).
    const sure = TESTS.find((t) => oddsA(rhoA, t).some((p) => Math.abs(p - 1) < DUST));
    const then = sure ? ` The ${TEST_NAMES[sure]} test gives ${NAMES[sure][oddsA(rhoA, sure)[0] > 0.5 ? 0 : 1]} every time.` : '';
    return `That is a pure state: A has a state vector of its own, ${ketText(ownKet(rhoA))}, and the pair is a product. Purity tr(ρ_A²) = 1.${then}`;
  }
  return `That is a mixed state: no basis test of A alone is sure. Purity tr(ρ_A²) = ${q}, below 1.`;
}

/** A's reduced state in one sentence: its diagonal, its off-diagonal entry and the verdict. */
export function rhoText(p: number, linked: boolean): string {
  const r = reducedA(pair(p, linked));
  return `Tracing out B leaves ρ_A with ${num(r[0][0].re)} and ${num(r[1][1].re)} on the diagonal and ${num(r[0][1].re)} off it. ${verdict(r)}`;
}

/** The readout: the pair, A's reduced state, and the shots so far against the Born rule odds from rho_A. */
export function report(p: number, linked: boolean, shots: readonly Shot[]): string {
  const s = pair(p, linked), rA = reducedA(s), k = counts(s, shots);
  let t = `${pairText(p, linked)} ${rhoText(p, linked)}`;
  const done = TESTS.filter((x) => k[x][0] + k[x][1] > 0);
  if (!done.length) return `${t} Measure A on fresh pairs to test this.`;
  const parts = done.map((x) => {
    const n = k[x][0] + k[x][1];
    return `${TEST_NAMES[x]} test, ${NAMES[x][0]} on ${k[x][0]} of ${n} (${pct(k[x][0] / n)})`;
  });
  const born = TESTS.map((x) => `P(${NAMES[x][0]}) = ${pct(tidy(oddsA(rA, x)[0]))}`);
  t += ` A alone, measured on fresh pairs: ${parts.join('; ')}. The Born rule from ρ_A gives ${born.join(', ')}.`;
  // sqrt(n p (1 - p)) is largest at p = 1/2, so sqrt(n)/2 bounds the typical wobble of every count.
  const n = Math.max(...done.map((x) => k[x][0] + k[x][1]));
  t += ` With up to ${n} pairs a test, a typical chance wobble in a count is at most about ${Math.round(spread(n, 0.5))}.`;
  return t;
}
