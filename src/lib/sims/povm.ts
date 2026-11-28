// General measurements (POVMs): a measurement is a list of positive matrices that sum to I. Pure math for the
// TrineMeter tool. No DOM.
// Conventions:
// - A qubit state has real amplitudes: |ψ> = cos φ|0> + sin φ|1>, with φ in degrees, 0 to 180. 180° is -|0>, the same
//   state as |0> (a global sign cannot be seen). The picture draws |0> at 0° and |1> at 90°, so orthogonal states are
//   90° apart there. A direction and its opposite are the same state up to a global phase.
// - A measurement is a list of parts E_k: 2x2 positive semidefinite matrices that sum to I. A qubit in the state ρ gives
//   outcome k with chance tr(E_k ρ), which is <ψ|E_k|ψ> for a pure state. The parts fix the chances, not the state left over.
// - The standard measurement has two parts, |0><0| and |1><1|. The trine has three parts, E_k = (2/3)|s_k><s_k| with
//   s_k = cos θ|0> + sin θ|1> at θ = 0°, 120°, 240°. As lines these are 60° apart; on the Bloch sphere the three
//   directions are 120° apart on a great circle.
// - Naimark's theorem: V = sum_k |k> ⊗ sqrt(E_k) has V†V = sum_k E_k = I, so V is an isometry, and it extends to a
//   unitary U with U(|0> ⊗ |ψ>) = V|ψ>. Measuring the helper in the standard basis gives outcome k with chance <ψ|E_k|ψ>.
//   Same odds, not the same state left over: the parts E_k do not fix what is left (the instrument).
//   For the trine, rank-one parts let a different, smaller isometry W do it: W|ψ> = sum_k sqrt(2/3) <s_k|ψ> |k>, a state of a
//   three-level system (a qutrit) whose three amplitudes add to 0. W is 3 x 2, not helper ⊗ qubit (that V is 6 x 2); two
//   qubits have four levels, so encoding the qutrit in them leaves one outcome that never happens.
// Sources: Watrous, Understanding Quantum Information and Computation (IBM Quantum Learning), General measurements:
//   Formulations of measurements (general measurements: the definition and its examples; the trine itself is not one of them) and Naimark's theorem (statement and proof);
//   de Wolf, Quantum Computing: Lecture Notes (arXiv:1907.09415), Section 1.2.2 (POVM) and footnote 5 (Neumark).
import { c, add, sub, mul, conj, scale, abs2, inner, matVec, matMul, dagger, draw, ket0, ket1, type Matrix, type State } from '../quantum.ts';
import { pct } from '../draw.ts';

export type Mode = 'standard' | 'trine' | 'bigger';

const RAD = Math.PI / 180;
const DUST = 1e-12;
/** Float dust to exact values: 6e-17 becomes 0, 1 - 1e-16 becomes 1. */
export const clean = (p: number): number => (Math.abs(p) < DUST ? 0 : Math.abs(1 - p) < DUST ? 1 : p);

export const MODES: readonly Mode[] = ['standard', 'trine', 'bigger'];
export const NAMES: Record<Mode, string> = { standard: 'Standard 0/1', trine: 'Trine', bigger: 'Trine, from a bigger system' };
/** Outcome names, by mode. The standard measurement has no third outcome. */
export const OUTCOMES: Record<Mode, string[]> = { standard: ['0', '1'], trine: ['A', 'B', 'C'], bigger: ['A', 'B', 'C'] };
/** The slider's range, in degrees. */
export const ANGLE = { min: 0, max: 180, start: 45 } as const;
/** The trine's three directions, in degrees, and the weight of each part. */
export const TRINE: readonly number[] = [0, 120, 240];
export const WEIGHT = 2 / 3;
/** The most any trine outcome can reach, for any state. */
export const MAX_CHANCE = 2 / 3;

// ---- States and matrices

/** The state cos φ|0> + sin φ|1>. */
export const ket = (deg: number): State => [c(Math.cos(deg * RAD)), c(Math.sin(deg * RAD))];
/** w |v><v|. */
export const proj = (v: State, w = 1): Matrix => v.map((x) => v.map((y) => scale(mul(x, conj(y)), w)));
export const addM = (a: Matrix, b: Matrix): Matrix => a.map((row, i) => row.map((x, j) => add(x, b[i][j])));
export const sumParts = (E: Matrix[]): Matrix => E.reduce(addM);
export const trace = (m: Matrix): number => m.reduce((t, row, i) => t + row[i].re, 0);

/** The two eigenvalues of a 2x2 Hermitian matrix, smallest first. */
export function eigs2(m: Matrix): [number, number] {
  const t = m[0][0].re + m[1][1].re, det = m[0][0].re * m[1][1].re - abs2(m[0][1]);
  const d = Math.sqrt(Math.max(0, (t * t) / 4 - det));
  return [t / 2 - d, t / 2 + d];
}

/** The square root of a 2x2 positive semidefinite matrix: (M + sqrt(det M) I) / sqrt(tr M + 2 sqrt(det M)). */
export function sqrtPsd2(m: Matrix): Matrix {
  const s = Math.sqrt(Math.max(0, m[0][0].re * m[1][1].re - abs2(m[0][1])));
  const k = 1 / Math.sqrt(m[0][0].re + m[1][1].re + 2 * s);
  return m.map((row, i) => row.map((x, j) => scale(i === j ? add(x, c(s)) : x, k)));
}

// ---- Measurements

export const standard = (): Matrix[] => [proj(ket0()), proj(ket1())];
export const trine = (): Matrix[] => TRINE.map((d) => proj(ket(d), WEIGHT));
/** The parts of the tool's measurement: two for the standard one, three for the trine. */
export const povm = (mode: Mode): Matrix[] => (mode === 'standard' ? standard() : trine());

/** Chance of each outcome for a pure state: <ψ|E_k|ψ>. */
export const chancesOf = (E: Matrix[], psi: State): number[] => E.map((e) => inner(psi, matVec(e, psi)).re);
/** Chance of each outcome for a density matrix: tr(E_k ρ). */
export const chancesRho = (E: Matrix[], rho: Matrix): number[] => E.map((e) => matMul(e, rho).reduce((t, row, i) => t + row[i].re, 0));

/** Every part is Hermitian with eigenvalues of at least 0, and the parts sum to I. */
export function isPovm(E: Matrix[], eps = 1e-12): boolean {
  const herm = E.every((e) => Math.abs(e[0][1].re - e[1][0].re) < eps && Math.abs(e[0][1].im + e[1][0].im) < eps && Math.abs(e[0][0].im) < eps && Math.abs(e[1][1].im) < eps);
  const psd = E.every((e) => eigs2(e)[0] > -eps);
  const s = sumParts(E);
  const identity = [0, 1].every((i) => [0, 1].every((j) => Math.abs(s[i][j].re - (i === j ? 1 : 0)) < eps && Math.abs(s[i][j].im) < eps));
  return herm && psd && identity;
}

/** A part is a projector when E·E = E. */
export function isProjector(e: Matrix, eps = 1e-12): boolean {
  const ee = matMul(e, e);
  return e.every((row, i) => row.every((x, j) => Math.abs(ee[i][j].re - x.re) < eps && Math.abs(ee[i][j].im - x.im) < eps));
}

// ---- The bigger system (Naimark)

/** The general isometry V = sum_k |k> ⊗ sqrt(E_k), as an (m·2) x 2 matrix: the helper index k comes first. */
export function naimark(E: Matrix[]): Matrix {
  const roots = E.map(sqrtPsd2);
  return roots.flatMap((r) => r.map((row) => row.slice()));
}

/** Chance that the helper reads k after V|ψ>: the squared sizes of the amplitudes in block k. */
export function helperChances(V: Matrix, psi: State, m: number): number[] {
  const out = matVec(V, psi), n = V[0].length;
  return Array.from({ length: m }, (_, k) => out.slice(k * n, (k + 1) * n).reduce((t, a) => t + abs2(a), 0));
}

/** Extend an N x n matrix with orthonormal columns to an N x N unitary, by Gram-Schmidt on the standard basis. */
export function completeToUnitary(V: Matrix): Matrix {
  const N = V.length;
  const cols: State[] = V[0].map((_, j) => V.map((row) => row[j]));
  for (let e = 0; e < N && cols.length < N; e++) {
    let v: State = Array.from({ length: N }, (_, i) => c(i === e ? 1 : 0));
    for (let pass = 0; pass < 2; pass++) for (const u of cols) {
      const k = inner(u, v);
      v = v.map((x, i) => sub(x, mul(k, u[i])));
    }
    const len = Math.sqrt(v.reduce((t, x) => t + abs2(x), 0));
    if (len > 1e-8) cols.push(v.map((x) => scale(x, 1 / len)));
  }
  return V.map((_, i) => cols.map((col) => col[i]));
}

export const isUnitary = (U: Matrix, eps = 1e-12): boolean => {
  const p = matMul(dagger(U), U);
  return p.every((row, i) => row.every((x, j) => Math.abs(x.re - (i === j ? 1 : 0)) < eps && Math.abs(x.im) < eps));
};

/** The trine's small isometry, 3 x 2: row k is sqrt(2/3) <s_k|. */
export const trineIsometry = (): Matrix => TRINE.map((d) => [c(Math.sqrt(WEIGHT) * Math.cos(d * RAD)), c(Math.sqrt(WEIGHT) * Math.sin(d * RAD))]);
/** The qutrit state V|ψ>: one amplitude for each of A, B, C. */
export const qutritState = (deg: number): State => matVec(trineIsometry(), ket(deg));
/** The qutrit's three amplitudes, real, as the tool shows them. */
export const qutritAmps = (deg: number): number[] => qutritState(deg).map((a) => clean(a.re));

/** Chances of the outcomes for each mode, as three numbers (the standard measurement's third is always 0). */
export function chances(mode: Mode, deg: number): number[] {
  if (mode === 'bigger') return qutritState(deg).map((a) => clean(abs2(a)));
  const p = chancesOf(povm(mode), ket(deg)).map(clean);
  return mode === 'standard' ? [...p, 0] : p;
}

/** The parts for the picture: name, direction in degrees, weight. */
export function parts(mode: Mode): { name: string; deg: number; w: number }[] {
  return mode === 'standard'
    ? [{ name: '0', deg: 0, w: 1 }, { name: '1', deg: 90, w: 1 }]
    : TRINE.map((deg, k) => ({ name: OUTCOMES.trine[k], deg, w: WEIGHT }));
}

/** Where the state's tip drops straight onto a part's line, as a fraction of the arrow's length (signed). */
export const foot = (deg: number, partDeg: number): number => clean(Math.cos((deg - partDeg) * RAD));

// ---- Shots

export const BATCH = 300;

/** One batch: each shot is a uniform draw, kept for the shot's life, so changing the state or the measurement moves a
 *  dot between piles instead of re-rolling it. */
export const batch = (rand: () => number): number[] => Array.from({ length: BATCH }, rand);

/** The outcome a draw u gives: the Born rule, p is the list of chances. */
export const outcome = (p: number[], u: number): number => draw(p, () => u);

/** Counts of each outcome over the first n shots. */
export function tally(shots: number[], p: number[], n = shots.length): number[] {
  const out = p.map(() => 0);
  for (let i = 0; i < n; i++) out[outcome(p, shots[i])]++;
  return out;
}

/** A square grid for n dots in a w x h cell: the biggest pitch that fits, at most max. */
export function grid(w: number, h: number, n: number, max = 9): { pitch: number; cols: number; rows: number } {
  let bestP = 0, bestC = 1;
  for (let cols = 1; cols <= n; cols++) {
    const p = Math.min(w / cols, h / Math.ceil(n / cols));
    if (p > bestP) { bestP = p; bestC = cols; }
  }
  return { pitch: Math.min(bestP, max), cols: bestC, rows: Math.ceil(n / bestC) };
}

// ---- Words

/** A number as text: exact 0 and 1 as "0" and "1", else two places, or four when two would show 1.00. */
export const num = (x: number): string => {
  const v = clean(x);
  return v === 0 ? '0' : v === 1 ? '1' : v > 0.995 ? v.toFixed(4) : v.toFixed(2);
};
/** A signed number with a true minus sign. */
export const signed = (x: number): string => (clean(x) < 0 ? '−' : '') + num(Math.abs(x));

/** The state as text: "|0⟩" at 0°, "|1⟩" at 90°, else "0.71|0⟩ + 0.71|1⟩", with what it is called when it has a name. */
export function stateText(deg: number): string {
  if (deg === 0) return '|0⟩';
  if (deg === 90) return '|1⟩';
  if (deg === 180) return '−|0⟩, the same state as |0⟩';
  const t = `${signed(Math.cos(deg * RAD))}|0⟩ + ${num(Math.sin(deg * RAD))}|1⟩`;
  return deg === 45 ? `${t}, which is |+⟩` : deg === 135 ? `${t}, the same state as |−⟩` : t;
}

/** Chances as percents, in outcome order. Never shows a real chance as 0% or 100%. */
export const chanceTexts = (p: number[]): string[] => p.map((x) => pct(clean(x)));

const list = (names: string[], vals: string[], sep = ' ') => names.map((n, i) => `${n}${sep}${vals[i]}`).join(', ');

/** The measurement and its odds in words, naming the start state. */
export function modeText(mode: Mode, deg: number): string {
  const names = OUTCOMES[mode], p = chances(mode, deg).slice(0, names.length), t = chanceTexts(p);
  const head = `Each shot started as ${stateText(deg)}.`;
  if (mode === 'standard') {
    return `${head} Standard 0/1 measurement: outcome 0 with chance ${t[0]}, outcome 1 with chance ${t[1]}. It has two outcomes, because a qubit has room for only two directions at right angles.`;
  }
  const never = names.filter((_, i) => p[i] === 0);
  const tail = `${never.length ? `Outcome ${never.join(' and ')} never happens for this state. ` : ''}No state makes an outcome certain: ${pct(MAX_CHANCE)} is the most any outcome can reach.`;
  if (mode === 'trine') {
    return `${head} Trine measurement, three outcomes on one qubit: ${list(names, t)}. ${tail}`;
  }
  const a = qutritAmps(deg).map(signed);
  return `${head} Built from a bigger system: the qubit sits inside a three-level system as three amplitudes for A, B and C, here (${a.join(', ')}), which add to 0. A standard three-way measurement of that system gives ${list(names, t)}, the chance of each being |amplitude|². These are exactly the chances of the trine measurement. ${tail}`;
}

/** The readout: the measurement, and the batch so far. */
export function describe(mode: Mode, deg: number, counts: number[] | null): string {
  const t = modeText(mode, deg);
  if (!counts) return t;
  const names = OUTCOMES[mode], n = counts.reduce((s, x) => s + x, 0);
  return `${t} This batch of ${n} shots: ${list(names, counts.slice(0, names.length).map(String))}.`;
}

/** One line under the picture on what the measurement is made of. */
export function partsText(mode: Mode): string {
  if (mode === 'standard') return 'Two parts, |0⟩⟨0| and |1⟩⟨1|. Each is a projector, and together they add up to I.';
  if (mode === 'trine') return 'Three parts, each 2/3 of a projector onto one direction. None is a projector, and together they add up to I.';
  return 'The same three parts, now the shadows of three directions at right angles in a bigger space. A standard measurement there gives the same chances; the state left over can differ.';
}

/** Slider value text: the angle and the state. */
export const valueText = (deg: number): string => `${deg} ${deg === 1 ? 'degree' : 'degrees'}, state ${stateText(deg)}`;
