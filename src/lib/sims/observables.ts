// Observables: a measurable quantity is a Hermitian matrix A. Pure math for the ObservableMeter tool. No DOM.
// Conventions:
// - The tool's observable is a real symmetric 2x2 matrix with rows (a, b) and (b, d): Hermitian, with real entries.
// - Its eigenvalues are listed largest first, hi >= lo (Watrous lists them in decreasing order).
//   Outcome 0 means the result hi, outcome 1 the result lo.
// - Each eigenvector is shown with its first nonzero amplitude positive. Eigenvectors are defined only up to a sign.
// - The tool's states have real amplitudes: cos t|0> + sin t|1>, with t in degrees from -90 to 90 (the amplitude plane).
// - Measuring A (N&C 2.2.5; Watrous, "Hermitian matrix observables"; Zwiebach, 8.04 Lecture 9): write A = sum_k lambda_k P_k
//   with P_k the projector onto the eigenvectors of lambda_k. Result lambda_k comes with chance <psi|P_k|psi>,
//   and afterwards the state is P_k|psi>, normalized.
import { c, I, abs, abs2, conj, draw, fromBloch, inner, matVec, mul, normalize, sub, type Matrix, type State } from '../quantum.ts';

export type Sym = { a: number; b: number; d: number };
export type Bit = 0 | 1;
/** A 2x2 Hermitian matrix as a0 I + ax X + ay Y + az Z, all four real. */
export type Pauli = { a0: number; ax: number; ay: number; az: number };

const RAD = Math.PI / 180;
const DUST = 1e-12;
/** Float dust to exact values: 6e-17 becomes 0, 1 - 1e-16 becomes 1. */
const clean = (p: number) => (Math.abs(p) < DUST ? 0 : Math.abs(1 - p) < DUST ? 1 : p);
const MINUS = '−';

/** Slider range for each matrix entry. */
export const ENTRY = { min: -2, max: 2, step: 0.5 };
/** The number line runs from -RULER to RULER. With entries in [-2, 2], every eigenvalue is in [-4, 4] (no row sums past 4 in size). */
export const RULER = 5;
/** Shots one press of the big button measures. */
export const BATCH = 100;
/** Each pile is COLS dots wide and ROWS dots tall, so it can hold every shot: CAP in all. */
export const COLS = 12;
export const ROWS = 25;
export const CAP = COLS * ROWS;

/** Preset observables. "Surprise" has rows (1, 2) and (2, -2): eigenvalues 2 and -3, neither on its diagonal. */
export const PRESETS: readonly { id: string; name: string; o: Sym }[] = [
  { id: 'Z', name: 'Z', o: { a: 1, b: 0, d: -1 } },
  { id: 'X', name: 'X', o: { a: 0, b: 1, d: 0 } },
  { id: 'N', name: '|1⟩⟨1|', o: { a: 0, b: 0, d: 1 } },
  { id: 'S', name: 'Surprise', o: { a: 1, b: 2, d: -2 } },
];
/** Preset start states as angles in the amplitude plane. */
export const STATES: readonly { name: string; deg: number }[] = [
  { name: '|0⟩', deg: 0 }, { name: '|1⟩', deg: 90 }, { name: '|+⟩', deg: 45 }, { name: '|−⟩', deg: -45 },
];

export const sameSym = (x: Sym, y: Sym) => x.a === y.a && x.b === y.b && x.d === y.d;

// ---- The matrix

/** The observable as a matrix: rows (a, b) and (b, d). */
export const matrix = (o: Sym): Matrix => [[c(o.a), c(o.b)], [c(o.b), c(o.d)]];

/** True when M equals its conjugate transpose: M[i][j] = conj(M[j][i]) for every i, j. */
export const isHermitian = (m: Matrix, eps = 1e-12): boolean =>
  m.every((row, i) => row.every((x, j) => abs(sub(x, conj(m[j][i]))) < eps));

/** Any 2x2 Hermitian M = a0 I + ax X + ay Y + az Z: a0 = tr(M)/2, ax = Re M01, ay = -Im M01, az = (M00 - M11)/2. */
export const pauliParts = (m: Matrix): Pauli =>
  ({ a0: (m[0][0].re + m[1][1].re) / 2, ax: m[0][1].re, ay: -m[0][1].im, az: (m[0][0].re - m[1][1].re) / 2 });

/** Eigenvalues and eigenvectors of any 2x2 Hermitian M: a0 ± |a|, at the Bloch points ±â.
 *  When a = 0, M = a0 I: one eigenvalue, and every vector is an eigenvector. */
export function eigen2(m: Matrix): { values: [number, number]; vectors: [State, State]; degenerate: boolean } {
  const { a0, ax, ay, az } = pauliParts(m), r = Math.hypot(ax, ay, az);
  if (r < DUST) return { values: [a0, a0], vectors: [[c(1), c(0)], [c(0), c(1)]], degenerate: true };
  const th = Math.acos(Math.max(-1, Math.min(1, az / r))), ph = Math.atan2(ay, ax);
  return { values: [a0 + r, a0 - r], vectors: [fromBloch(th, ph), fromBloch(Math.PI - th, ph + Math.PI)], degenerate: false };
}

/** The tool's eigen-decomposition, with real eigenvectors. A = m I + r (cos 2u Z + sin 2u X), so the larger
 *  eigenvalue m + r has eigenvector (cos u, sin u) and the smaller one m - r a vector at right angles to it.
 *  u is in radians, in (-90°, 90°]. */
export function spectrum(o: Sym): { values: [number, number]; vectors: [State, State]; u: number; degenerate: boolean } {
  const m = (o.a + o.d) / 2, h = (o.a - o.d) / 2, r = Math.hypot(h, o.b);
  if (r < DUST) return { values: [m, m], vectors: [[c(1), c(0)], [c(0), c(1)]], u: 0, degenerate: true };
  const u = Math.atan2(o.b + 0, h) / 2, cu = clean(Math.cos(u)), su = clean(Math.sin(u));
  // Keep each eigenvector's first nonzero amplitude positive: (cos u, sin u) already is, since cos u >= 0.
  const lo = su > 0 ? [c(su), c(-cu)] : [c(-su), c(cu)];
  return { values: [m + r, m - r], vectors: [[c(cu), c(su)], lo], u, degenerate: false };
}

/** |v><v| */
export const projector = (v: State): Matrix => v.map((x) => v.map((y) => mul(x, conj(y))));

/** The two projectors of the measurement, P_hi and P_lo. They add to I. With one eigenvalue: I and 0. */
export function projectors(o: Sym): [Matrix, Matrix] {
  const sp = spectrum(o);
  if (sp.degenerate) return [I, [[c(0), c(0)], [c(0), c(0)]]];
  return [projector(sp.vectors[0]), projector(sp.vectors[1])];
}

// ---- States and the Born rule

/** cos t|0> + sin t|1> for t in degrees. Real amplitudes only: the tool's states lie in one plane. */
export const stateAt = (deg: number): State => [c(clean(Math.cos(deg * RAD))), c(clean(Math.sin(deg * RAD)))];

/** One amplitude per outcome: <v_hi|psi> and <v_lo|psi>. Real for the tool's real states and vectors. */
export function amplitudes(o: Sym, s: State): [number, number] {
  const [v0, v1] = spectrum(o).vectors;
  return [clean(inner(v0, s).re), clean(inner(v1, s).re)];
}

/** Born rule: the chance of hi and of lo, |<v_k|psi>|². They add to 1. With one eigenvalue: [1, 0]. */
export function odds(o: Sym, s: State): [number, number] {
  const sp = spectrum(o);
  if (sp.degenerate) return [1, 0];
  return [clean(abs2(inner(sp.vectors[0], s))), clean(abs2(inner(sp.vectors[1], s)))];
}

/** The same chances from the projectors: <psi|P_k|psi>. Used to test odds(). */
export const oddsByProjector = (o: Sym, s: State): [number, number] =>
  projectors(o).map((p) => clean(inner(s, matVec(p, s)).re)) as [number, number];

/** The state after outcome k: P_k|psi>, normalized. An eigenvector of A for that result.
 *  With one eigenvalue P = I, so the state is left as it was. */
export function after(o: Sym, s: State, k: Bit): State {
  const sp = spectrum(o);
  if (sp.degenerate) return s;
  const v = matVec(projectors(o)[k], s);
  return Math.sqrt(abs2(v[0]) + abs2(v[1])) < DUST ? sp.vectors[k] : normalize(v);
}

// ---- Shots

/** n fresh copies, each measured once: a Born-rule draw of outcome 0 (hi) or 1 (lo). */
export const shoot = (p: [number, number], n: number, rand: () => number): Bit[] =>
  Array.from({ length: n }, () => draw(p, rand) as Bit);

/** How many shots the next press may add without passing the cap. */
export const room = (total: number, want: number): number => Math.max(0, Math.min(want, CAP - total));

/** Expected count of an outcome with chance p over n shots: n p. The tool marks it on each pile. */
export const expected = (n: number, p: number): number => n * p;

// ---- Drawing math

/** Where on the number line, from 0 at -RULER to 1 at RULER. */
export const along = (v: number): number => (v + RULER) / (2 * RULER);

/** Centers for the two piles, which want to sit at want[0] (hi, right) and want[1] (lo, left).
 *  Pushes them apart to at least `sep`, keeping their midpoint, then slides both to fit in [min, max]. */
export function placePiles(want: [number, number], sep: number, min: number, max: number): [number, number] {
  let [x0, x1] = want;
  const gap = x0 - x1;
  if (gap < sep) { const mid = (x0 + x1) / 2; x0 = mid + sep / 2; x1 = mid - sep / 2; }
  if (x0 - x1 > max - min) { const mid = (min + max) / 2, half = (x0 - x1) / 2; return [mid + half, mid - half]; }
  if (x1 < min) { x0 += min - x1; x1 = min; }
  if (x0 > max) { x1 -= x0 - max; x0 = max; }
  return [x0, x1];
}

// ---- Words

/** A number with up to two decimals and a true minus sign: 2, −3, 0.5, 1.21. */
export function num(x: number): string {
  const r = Math.round(x * 100) / 100;
  if (r === 0) return '0';
  return (r < 0 ? MINUS : '') + String(Math.abs(r));
}

/** An amplitude with exactly two decimals and a true minus sign: 0.89, −0.45. */
export const amp = (x: number): string => (Math.abs(x) < 0.005 ? '0.00' : (x < 0 ? MINUS : '') + Math.abs(x).toFixed(2));

/** A real vector (x, y) as a ket: "|0⟩", "|1⟩", or "0.89|0⟩ − 0.45|1⟩". */
export function vecText(v: State): string {
  const x = clean(v[0].re), y = clean(v[1].re);
  if (y === 0) return `${x < 0 ? MINUS : ''}|0⟩`;
  if (x === 0) return `${y < 0 ? MINUS : ''}|1⟩`;
  return `${amp(x)}|0⟩ ${y < 0 ? MINUS : '+'} ${amp(Math.abs(y))}|1⟩`;
}

/** The start state at angle t: its name when it has one (|0⟩, |1⟩, |+⟩, |−⟩), else its amplitudes. */
export function ketText(deg: number): string {
  const named = STATES.find((s) => s.deg === deg);
  return named ? named.name : vecText(stateAt(deg));
}

/** "rows (1, 2) and (2, −2)", with a no-break space after each comma so a row never splits across lines. */
export const matrixText = (o: Sym): string => `rows (${num(o.a)},\u00a0${num(o.b)}) and (${num(o.b)},\u00a0${num(o.d)})`;

/** Whole-percent odds of hi and lo. They add to 100, and never show a false 0% or 100%. */
export function pctPair(p0: number): [string, string] {
  const p = clean(p0);
  if (p === 1) return ['100%', '0%'];
  if (p === 0) return ['0%', '100%'];
  if (p >= 0.995) return ['over 99%', 'under 1%'];
  if (p <= 0.005) return ['under 1%', 'over 99%'];
  const a = Math.round(p * 100);
  return [`${a}%`, `${100 - a}%`];
}

/** The amplitude for each result, which the picture shows as the state's shadow on each eigenvector. */
export function calcText(deg: number, o: Sym): string {
  const sp = spectrum(o), [hi, lo] = sp.values.map(num);
  if (sp.degenerate) return `Every vector is an eigenvector of A here, with eigenvalue ${hi}. So the only result is ${hi}, with chance 100%.`;
  const [c0, c1] = amplitudes(o, stateAt(deg));
  return `Amplitude for result ${hi}: ${amp(c0)}. Amplitude for result ${lo}: ${amp(c1)}. Each chance is |amplitude|².`;
}

/** The readout: what the canvas shows, in words. Eigenvalues and odds are exact math; counts are the shots so far. */
export function describe(deg: number, o: Sym, counts: [number, number]): string {
  const sp = spectrum(o), [hi, lo] = sp.values.map(num);
  const head = `Started as ${ketText(deg)}. A has ${matrixText(o)}.`;
  const n = counts[0] + counts[1], full = n >= CAP ? ' The piles are full.' : '';
  const none = 'Press a Measure button to test fresh copies.';
  if (sp.degenerate) {
    const shots = n === 0 ? none : n === 1 ? `1 fresh copy gave ${hi}.` : `All ${n} fresh copies gave ${hi}.`;
    return `${head} Both eigenvalues are ${hi}, and every vector is an eigenvector. So every copy gives ${hi} and is left as it was. ${shots}${full}`;
  }
  const [v0, v1] = sp.vectors.map(vecText);
  const diag = o.a === o.d ? `The diagonal entry ${num(o.a)} never shows up.` : `The diagonal entries, ${num(o.a)} and ${num(o.d)}, never show up.`;
  const eig = o.b === 0
    ? `A is diagonal, so its eigenvalues are its diagonal entries: ${hi}, with eigenvector ${v0}, and ${lo}, with eigenvector ${v1}.`
    : `Its eigenvalues are ${hi}, with eigenvector ${v0}, and ${lo}, with eigenvector ${v1}. These are the only results. ${diag}`;
  const [t0, t1] = pctPair(odds(o, stateAt(deg))[0]);
  const shots = n === 0 ? none
    : n === 1 ? `1 fresh copy gave ${counts[0] ? hi : lo} and was left in its eigenvector.`
    : `Of ${n} fresh copies, ${counts[0]} gave ${hi} and ${counts[1]} gave ${lo}. Each was left in the eigenvector for its result.`;
  return `${head} ${eig} Odds: ${t0} for ${hi}, ${t1} for ${lo}. ${shots}${full}`;
}
