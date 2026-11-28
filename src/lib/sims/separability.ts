// Testing for entanglement: the pure math behind the PptLab tool. No DOM.
// Sources: Peres, "Separability criterion for density matrices", PRL 77, 1413 (1996): a separable state is a mix of
// product states, rho = sum_k w_k rho'_k ⊗ rho''_k (eq. 1); the partial transpose of such a mix is
// sum_k w_k (rho'_k)^T ⊗ rho''_k (eq. 6), a mix of density matrices, so it has no negative eigenvalue; eigenvalues do not
// change under U ⊗ V (eqs. 4, 5); a Bell pair with a fraction x of noise has partial transpose eigenvalues (1 + x)/4
// three times and (1 - 3x)/4 (eq. 7 and below), so it is entangled for x > 1/3. Horodecki, Horodecki, Horodecki,
// "Separability of mixed states: necessary and sufficient conditions", PLA 223, 1 (1996): for 2 ⊗ 2 and 2 ⊗ 3 the PPT
// test is exact. Horodecki et al., Rev. Mod. Phys. 81, 865 (2009), Sec. VI.B: entanglement witnesses, and the witness
// W = I/d - P+ with fidelity F = tr(P+ rho) <= 1/d for every PPT state. Aaronson, Introduction to Quantum Information
// Science, 11.3 (separable = mix of products; I/4 is both). Watrous, The Theory of Quantum Information, 6.2.3.
// Conventions (as in quantum.ts):
// - Two qubits. A is qubit 0, B is qubit 1. Index i = 2a + b: in |ab> A's bit is on the left. A density matrix is a 4 by 4 Matrix.
// - Partial transpose on B: <ab|rho^Γ|a'b'> = <ab'|rho|a'b>. Entries whose row and column have the same B bit stay;
//   the others swap with the entry in the mirrored place.
// - The tool's states: started as |00>, a Hadamard gate on A, then a CNOT from A to B: the Bell pair
//   |Φ+> = (|00> + |11>)/√2. The machine makes it with chance x and otherwise noise N:
//     white: N = I/4, one of 00, 01, 10, 11 at random.     coin: N = (|00><00| + |11><11|)/2, 00 or 11 at random.
//   Then a gate RY(beta) on B alone. A gate on one qubit does not change the partial transpose eigenvalues, so the PPT
//   verdict does not depend on beta. beta = 180° turns the Bell pair into the singlet (|01> - |10>)/√2.
// - The witness: W = I/2 - |Φ+><Φ+|. tr(W sigma) >= 0 for every separable sigma, because a product state has
//   overlap at most 1/2 with |Φ+>. |Φ+><Φ+| = (II + XX - YY + ZZ)/4, so W = (II - XX + YY - ZZ)/4: three settings,
//   each qubit measured alone (XX: both in the +/- basis, YY: both in the +i/-i basis, ZZ: both in the 0/1 basis).
import { c, add, mul, scale, conj, inner, tensor, matVec, matMul, kron, dagger, apply1, cnot, basis, ket0, ket1, plus, minus, H, I, RY, draw, type State, type Matrix } from '../quantum.ts';
import { pct } from '../draw.ts';

export type Noise = 'white' | 'coin';
export type Basis = 'x' | 'y' | 'z';
export type Bit = 0 | 1;
/** One pair measured in one setting: A's result and B's result. */
export type Pair = [Bit, Bit];
/** The pairs measured so far in one setting: how many, and how many had equal results. */
export type Tally = { pairs: number; agree: number };

export const NOISES: readonly Noise[] = ['white', 'coin'];
export const BASES: readonly Basis[] = ['x', 'y', 'z'];
/** How the tool writes each setting: the product both results make, and the basis both qubits are measured in. */
export const SETTING: Record<Basis, { op: string; test: string }> = {
  x: { op: 'XX', test: '+/−' },
  y: { op: 'YY', test: '+i/−i' },
  z: { op: 'ZZ', test: '0/1' },
};
/** The most pairs one setting holds. */
export const CAP = 100;
/** The witness's limit: no separable state has fidelity with the Bell pair above this. */
export const WITNESS_LIMIT = 0.5;

const DEG = Math.PI / 180;
const S2 = Math.SQRT1_2;
/** Below this a gap is float dust: cos(90°) is 6e-17, and an eigenvalue that is exactly 0 can come out as 1e-17. */
const DUST = 1e-9;
const clamp01 = (p: number) => Math.max(0, Math.min(1, p));

/** Float dust to exact values for readouts: 0.5000000000000001 becomes 0.5, -1e-17 becomes 0. */
export const tidy = (x: number): number => Math.round(x * 1e12) / 1e12 + 0;
/** x from the slider (whole percent, 0 to 100) as a chance. */
export const fromPercent = (n: number): number => clamp01(Math.round(n) / 100);
/** beta from the slider: whole degrees, 0 to 180. */
export const clampDegrees = (n: number): number => Math.max(0, Math.min(180, Math.round(n)));

// ---- Matrices

/** |s><s|: entry (i, j) is s_i times the conjugate of s_j. */
export const outer = (s: State): Matrix => s.map((a) => s.map((b) => mul(a, conj(b))));

/** The weighted sum w_1 M_1 + w_2 M_2 + ... of same-size matrices. */
export const combine = (terms: [number, Matrix][]): Matrix =>
  terms[0][1].map((row, i) => row.map((_, j) => terms.reduce((t, [w, m]) => add(t, scale(m[i][j], w)), c(0))));

/** The sum of the diagonal. */
export const trace = (m: Matrix): number => m.reduce((t, row, i) => t + row[i].re, 0);

/** tr(a b) for Hermitian a and b: real, so only the real part is kept. */
const trProduct = (a: Matrix, b: Matrix): number => a.reduce((t, row, i) => t + row.reduce((u, x, j) => u + mul(x, b[j][i]).re, 0), 0);

/** (I ⊗ U) rho (I ⊗ U)†: the gate U on B alone. */
export function onB(rho: Matrix, u: Matrix): Matrix {
  const k = kron(I, u);
  return matMul(matMul(k, rho), dagger(k));
}

/** The partial transpose on B: entry (ab, a'b') of the result is entry (ab', a'b) of m. */
export const partialTransposeB = (m: Matrix): Matrix =>
  m.map((row, i) => row.map((_, j) => m[(i & ~1) | (j & 1)][(j & ~1) | (i & 1)]));

/** True when entry (i, j) swaps places under the partial transpose on B: B's bit differs between row i and column j. */
export const moves = (i: number, j: number): boolean => (i & 1) !== (j & 1);

/** The Bell pair (|00> + |11>)/√2: started as |00>, a Hadamard gate on A, then a CNOT from A to B. */
export const bellPair = (): State => cnot(apply1(basis(2, 0), H, 0, 2), 0, 1, 2);

/** The noise the machine makes when it does not make the Bell pair. */
export const noiseMatrix = (noise: Noise): Matrix =>
  noise === 'white'
    ? [0, 1, 2, 3].map((i) => [0, 1, 2, 3].map((j) => c(i === j ? 0.25 : 0)))
    : combine([[0.5, outer(basis(2, 0))], [0.5, outer(basis(2, 3))]]);

/** The tool's state: the Bell pair with chance x, else the noise, then RY(beta degrees) on B alone. */
export const rho = (noise: Noise, x: number, beta: number): Matrix =>
  onB(combine([[x, outer(bellPair())], [1 - x, noiseMatrix(noise)]]), RY(beta * DEG));

// ---- Eigenvalues

/** Eigenvalues of a real symmetric matrix by cyclic Jacobi rotations. Changes a. */
function jacobi(a: number[][]): number[] {
  const n = a.length;
  const scale2 = a.reduce((t, row) => t + row.reduce((u, v) => u + v * v, 0), 0);
  for (let sweep = 0; sweep < 60; sweep++) {
    let off = 0;
    for (let p = 0; p < n; p++) for (let q = p + 1; q < n; q++) off += a[p][q] * a[p][q];
    if (off <= 1e-32 * scale2) break;
    for (let p = 0; p < n - 1; p++) {
      for (let q = p + 1; q < n; q++) {
        const apq = a[p][q];
        if (apq === 0) continue;
        const theta = (a[q][q] - a[p][p]) / (2 * apq);
        const t = (theta < 0 ? -1 : 1) / (Math.abs(theta) + Math.sqrt(theta * theta + 1));
        const cs = 1 / Math.sqrt(t * t + 1), sn = t * cs;
        for (let k = 0; k < n; k++) { const kp = a[k][p], kq = a[k][q]; a[k][p] = cs * kp - sn * kq; a[k][q] = sn * kp + cs * kq; }
        for (let k = 0; k < n; k++) { const pk = a[p][k], qk = a[q][k]; a[p][k] = cs * pk - sn * qk; a[q][k] = sn * pk + cs * qk; }
      }
    }
  }
  return a.map((row, i) => row[i]);
}

/** Eigenvalues of a Hermitian matrix A + iB, smallest first. The real matrix [[A, -B], [B, A]] has each of them twice. */
export function eigenvalues(m: Matrix): number[] {
  const n = m.length;
  const big = Array.from({ length: 2 * n }, (_, i) => Array.from({ length: 2 * n }, (_, j) => {
    const x = m[i % n][j % n];
    if ((i < n) === (j < n)) return x.re;
    return i < n ? -x.im : x.im;
  }));
  return jacobi(big).sort((p, q) => p - q).filter((_, i) => i % 2 === 0);
}

/** The eigenvalues of rho^Γ, smallest first. */
export const pptEigenvalues = (r: Matrix): number[] => eigenvalues(partialTransposeB(r));
/** The smallest eigenvalue of rho^Γ. Below 0 means entangled. */
export const smallestPpt = (r: Matrix): number => pptEigenvalues(r)[0];
/** True when rho^Γ has no negative eigenvalue: the state passes the PPT test. */
export const isPpt = (r: Matrix): boolean => smallestPpt(r) >= -DUST;

// ---- The witness and the three settings

/** F = <Φ+|rho|Φ+>, how close the state is to the Bell pair. */
export function fidelity(r: Matrix): number {
  const p = bellPair();
  return inner(p, matVec(r, p)).re;
}

/** tr(W rho) for W = I/2 - |Φ+><Φ+|, which is 1/2 - F. Below 0: the witness detects entanglement. */
export const witness = (r: Matrix): number => WITNESS_LIMIT - fidelity(r);

/** The two kets of a setting; the first is result 0. */
export function kets(b: Basis): [State, State] {
  if (b === 'z') return [ket0(), ket1()];
  if (b === 'x') return [plus(), minus()];
  return [[c(S2), c(0, S2)], [c(S2), c(0, -S2)]];
}

/** Born rule chances of (A's result, B's result) = 00, 01, 10, 11 when both qubits are measured in basis b. */
export function outcomeProbs(r: Matrix, b: Basis): [number, number, number, number] {
  const ks = kets(b);
  return [0, 1, 2, 3].map((i) => {
    const v = tensor(ks[i >> 1], ks[i & 1]);
    return Math.max(0, inner(v, matVec(r, v)).re);
  }) as [number, number, number, number];
}

/** <σ ⊗ σ> for the setting: the chance the two results are equal, minus the chance they differ. */
export function corr(r: Matrix, b: Basis): number {
  const p = outcomeProbs(r, b);
  return p[0] + p[3] - p[1] - p[2];
}

/** tr(W rho) from the three correlations: (1 - <XX> + <YY> - <ZZ>)/4. */
export const witnessFrom = (cx: number, cy: number, cz: number): number => (1 - cx + cy - cz) / 4;

/** The setting a new pair goes to: the three take turns. */
export const basisFor = (i: number): Basis => BASES[i % 3];

/** Measure both qubits of one fresh pair in basis b: a Born rule draw. */
export function shoot(r: Matrix, b: Basis, rand: () => number): Pair {
  const i = draw(outcomeProbs(r, b), rand);
  return [(i >> 1) as Bit, (i & 1) as Bit];
}

/** How many pairs were measured and how many had equal results. */
export const tally = (shots: readonly Pair[]): Tally => ({ pairs: shots.length, agree: shots.filter(([a, b]) => a === b).length });

/** The measured <σ ⊗ σ>: +1 for each pair with equal results, -1 for each with different results, averaged. */
export const measuredCorr = (t: Tally): number => (2 * t.agree - t.pairs) / t.pairs;

/** The witness from the shots so far, and how far chance alone moves it (one standard deviation, from the Born rule
 *  correlations): sqrt(sum (1 - c^2)/n)/4. Null until every setting has a pair. */
export function estimate(r: Matrix, t: Record<Basis, Tally>): { value: number; wobble: number } | null {
  if (BASES.some((b) => t[b].pairs === 0)) return null;
  const value = witnessFrom(measuredCorr(t.x), measuredCorr(t.y), measuredCorr(t.z));
  const wobble = Math.sqrt(BASES.reduce((s, b) => s + Math.max(0, 1 - corr(r, b) ** 2) / t[b].pairs, 0)) / 4;
  return { value, wobble };
}

// ---- A recipe: product pairs that make the state

/** One product pair in a recipe: the machine makes |a> ⊗ |b> with chance w. */
export type Product = { w: number; a: State; b: State; aName: string; bName: string };

/** The six pairs |a> ⊗ |a*> for a = |0>, |1>, |+>, |->, |+i>, |-i>: |a*> is |a> with the i's flipped. */
const SIX: [Basis, Bit][] = [['z', 0], ['z', 1], ['x', 0], ['x', 1], ['y', 0], ['y', 1]];
const KET_NAME: Record<Basis, [string, string]> = { z: ['0', '1'], x: ['+', '−'], y: ['+i', '−i'] };

/** A recipe of product pairs for the state, or null when none is known: the Bell pair with chance x and white noise is
 *  a mix of product pairs exactly when x <= 1/3 (six pairs with chance x/2 each, and the four pairs |jk> with chance
 *  (1 - 3x)/4 each; |00> and |11> are in both lists, so each shows once with chance (1 - x)/4); with coin noise only
 *  x = 0 is (00 or 11). beta turns every B state, since the gate is on B alone. */
export function recipe(noise: Noise, x: number, beta: number): Product[] | null {
  const g = RY(beta * DEG), label = (n: string) => (beta === 0 ? `|${n}⟩` : `RY(${beta}°)|${n}⟩`);
  const make = (w: number, a: State, b: State, an: string, bn: string): Product => ({ w, a, b: matVec(g, b), aName: `|${an}⟩`, bName: label(bn) });
  const out: Product[] = [];
  if (noise === 'white' && x <= 1 / 3 + DUST) {
    for (const [s, i] of SIX) {
      const a = kets(s)[i], j = s === 'y' ? 1 - i : i;
      out.push(make(x / 2, a, kets(s)[j], KET_NAME[s][i], KET_NAME[s][j]));
    }
    for (const j of [0, 1] as Bit[]) for (const k of [0, 1] as Bit[]) out.push(make(Math.max(0, 1 - 3 * x) / 4, kets('z')[j], kets('z')[k], String(j), String(k)));
  } else if (noise === 'coin' && x <= DUST) {
    for (const j of [0, 1] as Bit[]) out.push(make(0.5, kets('z')[j], kets('z')[j], String(j), String(j)));
  } else return null;
  // A pair that is in the list twice shows once, with the two chances added.
  const merged: Product[] = [];
  for (const p of out) {
    const same = merged.find((m) => m.aName === p.aName && m.bName === p.bName);
    if (same) same.w += p.w; else merged.push({ ...p });
  }
  return merged.filter((p) => p.w > DUST);
}

/** The state a recipe makes: the weighted sum of |a><a| ⊗ |b><b|. */
export const mixture = (rec: readonly Product[]): Matrix => combine(rec.map((p) => [p.w, outer(tensor(p.a, p.b))] as [number, Matrix]));

// ---- Words and numbers for the page

/** An eigenvalue or a witness value: two decimals, three below 0.1; exact 0 as "0", a minus sign as "−". */
export function val(x: number): string {
  const v = tidy(x);
  if (v === 0) return '0';
  const a = Math.abs(v);
  return (v < 0 ? '−' : '') + (a >= 0.1 ? a.toFixed(2) : a.toFixed(3));
}

/** A matrix entry (all the tool's matrices are real): two decimals, exact 0 and 1 as "0" and "1". */
export function entry(x: number): string {
  const v = tidy(x);
  if (v === 0 || Math.abs(v) === 1) return v < 0 ? '−1' : String(v);
  return (v < 0 ? '−' : '') + Math.abs(v).toFixed(2);
}

/** How the state was made, naming the start state. */
export function madeText(noise: Noise, x: number, beta: number): string {
  const n = noise === 'white' ? 'white noise (00, 01, 10 or 11 at random)' : 'coin noise (00 or 11 at random)';
  const g = beta === 0 ? 'no gate on B' : `then a gate RY(${beta}°) on B alone${beta === 180 ? ', which turns the Bell pair into the singlet (|01⟩ − |10⟩)/√2' : ''}`;
  return `Started as 00, then a Hadamard gate on A and a CNOT from A to B: the Bell pair (|00⟩ + |11⟩)/√2. The machine makes that pair with chance ${pct(x)}, and otherwise ${n}; ${g}.`;
}

/** A list of eigenvalues in words: "0.10, 0.10, 0.10 and 0.70". */
const list = (v: number[]): string => `${v.slice(0, -1).map(val).join(', ')} and ${val(v[v.length - 1])}`;

/** The four eigenvalues of rho and of rho^Γ. rho's are never negative; rho^Γ's can be. Both add to 1. */
export function eigenText(r: Matrix): string {
  return `ρ has the eigenvalues ${list(eigenvalues(r))}: none is negative, and they add to 1. ρ^Γ, ρ with B's half flipped, has ${list(pptEigenvalues(r))}: they also add to 1.`;
}

/** The PPT verdict. */
export function pptText(r: Matrix): string {
  const m = smallestPpt(r);
  return isPpt(r)
    ? `Partial transpose on B: the smallest eigenvalue of ρ^Γ is ${val(m)}, not below 0, so the state passes the PPT test. For two qubits that means a mix of product pairs makes it: it is separable.`
    : `Partial transpose on B: the smallest eigenvalue of ρ^Γ is ${val(m)}, below 0. No mix of product pairs can make this state: it is entangled.`;
}

/** The witness's exact value and what it says, with the PPT verdict as the check. */
export function witnessText(r: Matrix): string {
  const w = witness(r), detects = w < -DUST;
  const t = `The witness W = I/2 − |Φ+⟩⟨Φ+| has the exact value ${val(w)} here (Born rule, no shot noise)`;
  if (detects) return `${t}, below 0: it detects entanglement.`;
  return isPpt(r)
    ? `${t}, not below 0. The state is separable, so no witness can detect it.`
    : `${t}, not below 0: this witness says nothing, yet the state is entangled. The PPT test sees it.`;
}

/** What the shots so far say about the witness. */
export function measuredText(r: Matrix, shots: Record<Basis, readonly Pair[]>): string {
  const t = { x: tally(shots.x), y: tally(shots.y), z: tally(shots.z) };
  const total = t.x.pairs + t.y.pairs + t.z.pairs;
  if (!total) return 'Measure pairs to estimate the witness from shots.';
  const e = estimate(r, t);
  if (!e) return `${total} ${total === 1 ? 'pair' : 'pairs'} measured so far. The witness needs all three settings: measure more pairs.`;
  const head = `From ${total} measured pairs the witness reads ${val(e.value)}, and chance alone moves it by about ${e.wobble.toFixed(2)} either way.`;
  if (e.value + 2 * e.wobble < 0) return `${head} That is below 0 by more than two of those: luck alone does that about 1 time in 40, so the shots say entangled.`;
  if (e.value < 0) return `${head} That is below 0 by less than two of those: luck could do this, so measure more pairs.`;
  return `${head} That is not below 0: the shots do not show entanglement.`;
}

/** The readout: how the state was made, its eigenvalues, then each test's verdict, then the shots. */
export function report(noise: Noise, x: number, beta: number, shots: Record<Basis, readonly Pair[]>): string {
  const r = rho(noise, x, beta);
  return `${madeText(noise, x, beta)} ${eigenText(r)} ${pptText(r)} ${witnessText(r)} ${measuredText(r, shots)}`;
}

/** A chance as a percent with at most one decimal, so a recipe's lines add up: 0.165 becomes "16.5%". */
export function chance(w: number): string {
  const v = Math.round(w * 1000) / 10;
  if (w > 0 && v < 0.1) return '<0.1%';
  return `${v}%`;
}

/** The chances of a recipe as percents in steps of 0.1 that add to exactly 100 (largest remainder), so the shown lines add up. */
export function shownChances(rec: readonly Product[]): number[] {
  const tenths = rec.map((p) => p.w * 1000), floors = tenths.map(Math.floor);
  let left = Math.round(tenths.reduce((s, v) => s + v, 0)) - floors.reduce((s, v) => s + v, 0);
  const order = tenths.map((v, i) => [v - floors[i], i]).sort((p, q) => q[0] - p[0]);
  for (const [, i] of order) { if (left <= 0) break; floors[i]++; left--; }
  return floors.map((v) => v / 10);
}

/** One line per product pair of a recipe: "16.5%  |+i⟩ ⊗ |−i⟩". The percents add to 100%. */
export const recipeLines = (rec: readonly Product[]): string[] => {
  const shown = shownChances(rec);
  return rec.map((p, i) => `${shown[i] === 0 ? '<0.1' : shown[i]}%  ${p.aName} ⊗ ${p.bName}`);
};
