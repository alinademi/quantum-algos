// Uncertainty: Robertson's relation on one qubit. Pure math for the TwoSpreads tool. No DOM.
// Conventions:
// - Observables are Hermitian matrices. Z and X (Pauli) give results +1 or -1:
//   Z gives +1 for |0> and -1 for |1>; X gives +1 for |+> and -1 for |->.
// - The state is set by two angles in degrees: `tilt` from |0> (polar angle theta) and `turn` around the Z axis,
//   from |+> toward |+i> (azimuth phi). It is fromBloch(theta, phi) of quantum.ts:
//   cos(theta/2)|0> + e^{i phi} sin(theta/2)|1>, with Bloch vector (sin theta cos phi, sin theta sin phi, cos theta).
// - Spread (uncertainty) of A in the state: dA = sqrt(<A^2> - <A>^2), the standard deviation of A's results over many
//   copies of the state, each copy measured once (Zwiebach, MIT 8.05 notes, eq. 1.9; Wilde, Quantum Information Theory, 3.4.1).
// - Robertson's relation: dA dB >= |<[A, B]>| / 2 (Hilgevoord and Uffink, SEP, eq. 12; Zwiebach eq. 2.17; Wilde eq. 3.88).
//   For Z and X, [Z, X] = 2iY, so dZ dX >= |<Y>|.
import { c, add, sub, abs, abs2, inner, matVec, matMul, fromBloch, draw, ket0, ket1, plus, minus, X, Y, Z, type C, type Matrix, type State } from '../quantum.ts';

export type Angles = { tilt: number; turn: number };
export type Obs = 'Z' | 'X';
export type Sign = 1 | -1;

const RAD = Math.PI / 180;
const DUST = 1e-12;
/** Float dust to exact values: 6e-17 becomes 0, 1 - 2e-16 becomes 1, -1 + 2e-16 becomes -1. */
export const clean = (v: number): number =>
  Math.abs(v) < DUST ? 0 : Math.abs(1 - Math.abs(v)) < DUST ? Math.sign(v) : v;

/** Copies per question the tool offers, and the most it keeps random draws for. */
export const COPIES: readonly number[] = [10, 100, 400];
export const MAX = 400;

/** The two observables the tool measures, and the one Robertson's bound needs. */
export const PAULI: Record<'X' | 'Y' | 'Z', Matrix> = { X, Y, Z };

// ---- Matrix algebra

const mat = (f: (i: number, j: number) => C, n: number): Matrix =>
  Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => f(i, j)));

/** [A, B] = AB - BA. */
export const commutator = (A: Matrix, B: Matrix): Matrix => {
  const ab = matMul(A, B), ba = matMul(B, A);
  return mat((i, j) => sub(ab[i][j], ba[i][j]), A.length);
};

/** {A, B} = AB + BA. */
export const anticommutator = (A: Matrix, B: Matrix): Matrix => {
  const ab = matMul(A, B), ba = matMul(B, A);
  return mat((i, j) => add(ab[i][j], ba[i][j]), A.length);
};

// ---- The state

/** The qubit at tilt and turn (degrees) on the Bloch sphere. A unit vector. */
export const stateAt = (a: Angles): State => fromBloch(a.tilt * RAD, a.turn * RAD);

/** <psi|A|psi> as a complex number. For Hermitian A it is real; for an anti-Hermitian one, such as [A, B], imaginary. */
export const braket = (s: State, A: Matrix): C => inner(s, matVec(A, s));

/** Average result <A> = <psi|A|psi> for a Hermitian A (Wilde eq. 3.83). */
export const mean = (s: State, A: Matrix): number => clean(braket(s, A).re);

/** Spread dA = sqrt(<A^2> - <A>^2). Zero exactly when the state is an eigenstate of A (Zwiebach eq. 1.5). */
export function spread(s: State, A: Matrix): number {
  const m = mean(s, A), v = clean(braket(s, matMul(A, A)).re - m * m);
  return Math.sqrt(Math.max(0, v));
}

/** The same spread as a length: |(A - <A>)psi| (Zwiebach eq. 1.2). Used to test spread(). */
export function spreadByNorm(s: State, A: Matrix): number {
  const m = mean(s, A), As = matVec(A, s);
  return Math.sqrt(As.reduce((t, x, i) => t + abs2(sub(x, c(s[i].re * m, s[i].im * m))), 0));
}

/** Robertson's bound |<[A, B]>| / 2. */
export const bound = (s: State, A: Matrix, B: Matrix): number => clean(abs(braket(s, commutator(A, B))) / 2);

/** Schrodinger's extra term: (1/2)<{A, B}> - <A><B>, the covariance of A and B in the state. */
export const covariance = (s: State, A: Matrix, B: Matrix): number =>
  clean(braket(s, anticommutator(A, B)).re / 2 - mean(s, A) * mean(s, B));

// ---- Born rule for Z and X

/** Eigenstates of each observable: result +1 first, then -1. */
export const EIGEN: Record<Obs, [State, State]> = { Z: [ket0(), ket1()], X: [plus(), minus()] };

/** Chances of +1 and -1 when one copy is measured: |<e+|psi>|^2 and |<e-|psi>|^2. They add to 1. */
export function odds(s: State, o: Obs): [number, number] {
  const [e0, e1] = EIGEN[o];
  return [clean(abs2(inner(e0, s))), clean(abs2(inner(e1, s)))];
}

/** One copy's result from its own uniform draw u in [0, 1): +1 when u < P(+1), which has chance P(+1). */
export const result = (u: number, p: [number, number]): Sign => (draw(p, () => u) === 0 ? 1 : -1);

/** How many of the first n copies gave +1. Each copy keeps its draw, so a copy flips only when P(+1) passes it. */
export function countPlus(us: readonly number[], p: [number, number], n = us.length): number {
  let k = 0;
  for (let i = 0; i < n; i++) if (result(us[i], p) === 1) k++;
  return k;
}

/** Average and spread of a list of results, with the same formula as the state: sqrt(avg(r^2) - avg(r)^2). */
export function listStats(rs: readonly number[]): { mean: number; spread: number } {
  const n = rs.length;
  if (!n) return { mean: 0, spread: 0 };
  const m = rs.reduce((t, r) => t + r, 0) / n, m2 = rs.reduce((t, r) => t + r * r, 0) / n;
  return { mean: clean(m), spread: Math.sqrt(Math.max(0, clean(m2 - m * m))) };
}

/** The same for k results of +1 and n - k of -1. Then avg(r^2) = 1, so the spread is sqrt(1 - avg^2). */
export function countStats(k: number, n: number): { mean: number; spread: number } {
  if (!n) return { mean: 0, spread: 0 };
  const m = (2 * k - n) / n;
  return { mean: m, spread: Math.sqrt(Math.max(0, 1 - m * m)) };
}

// ---- Everything the tool shows for one state

export type Exact = { z: number; x: number; y: number; dZ: number; dX: number; product: number; bound: number; pZ: [number, number]; pX: [number, number] };

/** Averages, spreads, product and bound for Z and X, all from the state with the matrices above. */
export function exact(a: Angles): Exact {
  const s = stateAt(a), dZ = spread(s, Z), dX = spread(s, X);
  return {
    z: mean(s, Z), x: mean(s, X), y: mean(s, Y), dZ, dX, product: clean(dZ * dX), bound: bound(s, Z, X),
    pZ: odds(s, 'Z'), pX: odds(s, 'X'),
  };
}

/** True when the product of the spreads equals Robertson's bound (for a pure qubit state: when <Z> = 0 or <X> = 0). */
export const meetsBound = (e: Exact): boolean => Math.abs(e.product - e.bound) < 1e-9;

// ---- Pictures

/** Each pile of results is a grid: few copies get big dots, many get small ones. cols x rows holds n. */
export function pileShape(n: number): { cols: number; rows: number } {
  const cols = n <= 10 ? 5 : n <= 100 ? 10 : 20;
  return { cols, rows: Math.ceil(n / cols) };
}

/** Dot pitch so a pile of n fits in a w by h box. */
export function pileFit(w: number, h: number, n: number): { cols: number; rows: number; pitch: number } {
  const { cols, rows } = pileShape(n);
  return { cols, rows, pitch: Math.max(0, Math.min(w / cols, h / rows)) };
}

/** k + 1 points (dZ, dX) on Robertson's curve dZ dX = b, from (b, 1) to (1, b), evenly spaced in log dZ. Empty for b = 0. */
export function boundCurve(b: number, k: number): [number, number][] {
  if (b <= 0 || b > 1) return [];
  const lo = Math.log(b);
  return Array.from({ length: k + 1 }, (_, i) => {
    const dz = Math.exp(lo * (1 - i / k));
    return [dz, b / dz] as [number, number];
  });
}

/** True inside the quarter circle dZ^2 + dX^2 < 1, where no qubit state lies. */
export const inCorner = (dz: number, dx: number): boolean => dz * dz + dx * dx < 1 - 1e-12;

// ---- Words

/** The state as a ket when it is one of the six named states, else null. At tilt 0 or 180 the turn does not matter. */
export function stateName(a: Angles): string | null {
  if (a.tilt === 0) return '|0⟩';
  if (a.tilt === 180) return '|1⟩';
  if (a.tilt !== 90) return null;
  return ({ 0: '|+⟩', 90: '|+i⟩', 180: '|−⟩', 270: '|−i⟩' } as Record<number, string>)[a.turn] ?? null;
}

/** "Started as |0⟩", or "Started as 0, then turned to tilt 60°, turn 90°". */
export function startText(a: Angles): string {
  const n = stateName(a);
  return n ? `Started as ${n}` : `Started as 0, then turned to tilt ${a.tilt}°, turn ${a.turn}°`;
}

/** A number for the readout: "0", "1", "−1" when exact, "≈0" or "≈1" when only close, else two decimals with a true minus. */
export function fmt(v: number): string {
  const x = clean(v), m = Math.abs(x), sign = x < 0 ? '−' : '';
  if (m === 0) return '0';
  if (m === 1) return `${sign}1`;
  if (m < 0.005) return '≈0';
  if (m > 0.995) return `≈${sign}1`;
  return sign + m.toFixed(2);
}

/** What the exact numbers say about this state, in one or two sentences. */
export function verdict(a: Angles): string {
  const e = exact(a);
  if (e.dZ === 0) return 'Z is sharp here, so X is fully spread: ΔX = 1. No state makes both sharp.';
  if (e.dX === 0) return 'X is sharp here, so Z is fully spread: ΔZ = 1. No state makes both sharp.';
  if (e.bound === 0) return 'This state has ⟨Y⟩ = 0, so Robertson\'s bound is only 0 here. Still neither spread is 0: no qubit state makes both sharp.';
  if (meetsBound(e)) return 'The product equals the bound: for this state, Robertson\'s relation allows nothing smaller.';
  return 'The product is above the bound. Robertson\'s relation only requires that the product is not below it.';
}

/** A note when a batch lands visibly off the exact picture: product below the bound, or the pair inside the quarter circle.
 *  Small dips (under 0.01 in the product, 0.02 in dZ^2 + dX^2) are left alone: the map cannot show them. */
export function noiseText(a: Angles, n: number, kZ: number, kX: number): string {
  const e = exact(a), sz = countStats(kZ, n).spread, sx = countStats(kX, n).spread;
  const where = e.bound - sz * sx > 0.01 ? `the product from these ${n} copies is below the bound`
    : 1 - (sz * sz + sx * sx) > 0.02 ? `the pair from these ${n} copies lands inside the quarter circle, where no state can be`
    : '';
  const why = e.bound === 1 ? ` At ${stateName(a)} a batch can never land above the bound: both exact spreads are already 1, the most a ±1 result can have.` : '';
  return where ? ` Here ${where}: a batch only estimates the spreads, and more copies come closer to the exact ones.${why}` : '';
}

/** The exact part of the readout: start state, both spreads, their product and the bound. */
export function headText(a: Angles): string {
  const e = exact(a);
  return `${startText(a)}. Exact: ΔZ = ${fmt(e.dZ)} and ΔX = ${fmt(e.dX)}, so ΔZ × ΔX = ${fmt(e.product)}, and Robertson's bound |⟨Y⟩| is ${fmt(e.bound)}.`;
}

/** The readout: what the pictures show, in words. Exact values come from the state; measured ones from the copies. */
export function readout(a: Angles, n: number, kZ: number, kX: number): string {
  const mz = countStats(kZ, n), mx = countStats(kX, n);
  const shots = `Of ${n} copies measured in Z, ${kZ} gave +1 and ${n - kZ} gave −1 (spread ${fmt(mz.spread)}). Of ${n} other copies measured in X, ${kX} gave +1 and ${n - kX} gave −1 (spread ${fmt(mx.spread)}).`;
  return `${headText(a)} ${shots} ${verdict(a)}${noiseText(a, n, kZ, kX)}`;
}

/** Slider text for screen readers: "60 degrees", plus the state's name when it has one. */
export function sliderText(deg: number, a: Angles): string {
  const n = stateName(a);
  return `${deg} degrees${n ? `, the state ${n}` : ''}`;
}

/** The three preset states. */
export const PRESETS: readonly { label: string; angles: Angles }[] = [
  { label: '|0⟩', angles: { tilt: 0, turn: 0 } },
  { label: '|+⟩', angles: { tilt: 90, turn: 0 } },
  { label: '|+i⟩', angles: { tilt: 90, turn: 90 } },
];
