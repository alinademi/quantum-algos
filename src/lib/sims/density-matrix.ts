// Density matrices stop: the pure math behind the DensityBall tool. No DOM.
// A recipe makes the pure state A with chance p, else the pure state B. Its density matrix is
// ρ = p|A⟩⟨A| + (1 − p)|B⟩⟨B|, and the Born rule reads p(v) = ⟨v|ρ|v⟩ (N&C 2.4.1; Watrous, Understanding Quantum
// Information and Computation, Density matrices; Aaronson, Lecture notes 6.1.1). For one qubit ρ = ½(I + xX + yY + zZ),
// with Bloch vector (x, y, z) = (tr Xρ, tr Yρ, tr Zρ): length 1 for a pure state, less for a mix (Watrous, Bloch sphere).
// Angles and chances are whole numbers at the edges (degrees, percent), radians and fractions inside.
import { c, add, mul, scale, conj, inner, matVec, matMul, fromBloch, ket0, ket1, plus, minus, I, X, Y, Z, type C, type Matrix, type State } from '../quantum.ts';

export type Vec3 = [number, number, number];
/** A pure state as a point on the sphere: theta down from |0⟩, phi around from |+⟩ toward |+i⟩, whole degrees. */
export type Angles = { theta: number; phi: number };
/** Make A with chance p percent (0 to 100, whole), else B. */
export type Recipe = { a: Angles; b: Angles; p: number };
export type Basis = 'z' | 'x' | 'y';

const RAD = Math.PI / 180;
const S2 = Math.SQRT1_2;
// Float dust: cos(90°) is 6e-17, not 0. Below this a number counts as exactly 0 (or exactly 1).
const DUST = 1e-12;
const clean = (x: number) => (Math.abs(x) < DUST ? 0 : x);
/** Any angle in degrees to [0, 360). */
export const wrap = (deg: number): number => ((deg % 360) + 360) % 360;

// ---- Matrices

/** The outer product |s⟩⟨s|: entry (i, j) is s_i times the conjugate of s_j. */
export const outer = (s: State): Matrix => s.map((a) => s.map((b) => mul(a, conj(b))));

/** The weighted sum w_1 M_1 + w_2 M_2 + ... of same-size matrices. */
export const combine = (terms: [number, Matrix][]): Matrix =>
  terms[0][1].map((row, i) => row.map((_, j) => terms.reduce((t, [w, m]) => add(t, scale(m[i][j], w)), c(0))));

/** The sum of the diagonal. */
export const trace = (m: Matrix): C => m.reduce((t, row, i) => add(t, row[i]), c(0));

/** tr(Aρ). Real when A and ρ are Hermitian, so only the real part is kept. */
const tr = (a: Matrix, rho: Matrix): number => trace(matMul(a, rho)).re;

// ---- Pure states and recipes

/** The pure state cos(θ/2)|0⟩ + e^{iφ} sin(θ/2)|1⟩ at whole-degree angles. */
export const ketAt = (a: Angles): State => fromBloch(a.theta * RAD, a.phi * RAD).map((z) => c(clean(z.re), clean(z.im)));

/** Its point on the unit sphere, from the angles: (sin θ cos φ, sin θ sin φ, cos θ). */
export function pointAt(a: Angles): Vec3 {
  const t = a.theta * RAD, f = a.phi * RAD;
  return [clean(Math.sin(t) * Math.cos(f)), clean(Math.sin(t) * Math.sin(f)), clean(Math.cos(t))];
}

/** ρ = |ψ⟩⟨ψ| for the pure state at these angles. */
export const pureRho = (a: Angles): Matrix => outer(ketAt(a));

/** ρ = p|A⟩⟨A| + (1 − p)|B⟩⟨B|: a convex combination of the two pure states' density matrices. */
export const rhoOf = (r: Recipe): Matrix => combine([[r.p / 100, pureRho(r.a)], [1 - r.p / 100, pureRho(r.b)]]);

// ---- The Bloch ball

/** The Bloch vector (tr Xρ, tr Yρ, tr Zρ). */
export const blochOf = (rho: Matrix): Vec3 => [clean(tr(X, rho)), clean(tr(Y, rho)), clean(tr(Z, rho))];

/** ½(I + xX + yY + zZ): the matrix for a point. A density matrix only when the point is in the ball. */
export const fromVec = ([x, y, z]: Vec3): Matrix => combine([[0.5, I], [x / 2, X], [y / 2, Y], [z / 2, Z]]);

/** Distance from the center. */
export const len = (v: readonly number[]): number => Math.hypot(...v);

/** Purity tr(ρ²): 1 for a pure state, down to ½ for a qubit at the center. */
export const purity = (rho: Matrix): number => trace(matMul(rho, rho)).re;

/** Eigenvalues of a 2x2 Hermitian matrix, larger first: mean of the diagonal ± √(half-difference² + |off-diagonal|²). */
export function eigenvalues(m: Matrix): [number, number] {
  const a = m[0][0].re, d = m[1][1].re, b = m[0][1];
  const mid = (a + d) / 2, s = Math.sqrt(((a - d) / 2) ** 2 + b.re * b.re + b.im * b.im);
  return [mid + s, mid - s];
}

export type Kind = 'pure' | 'mixed' | 'center';

/** Pure when the smaller eigenvalue is 0 (rank one), the center when both are ½, mixed otherwise. */
export function kindOf(rho: Matrix): Kind {
  const [hi, lo] = eigenvalues(rho);
  if (Math.abs(lo) < DUST) return 'pure';
  return hi - lo < DUST ? 'center' : 'mixed';
}

// ---- Measuring

const PLUS_I: State = [c(S2), c(0, S2)], MINUS_I: State = [c(S2), c(0, -S2)];

/** The three bases the tool measures in. Each pair is orthonormal; axis is the Bloch point of the first outcome. */
export const BASES: Record<Basis, { name: string; outcomes: [string, string]; kets: [State, State]; axis: Vec3 }> = {
  z: { name: '0/1', outcomes: ['0', '1'], kets: [ket0(), ket1()], axis: [0, 0, 1] },
  x: { name: '+/−', outcomes: ['+', '−'], kets: [plus(), minus()], axis: [1, 0, 0] },
  y: { name: '+i/−i', outcomes: ['+i', '−i'], kets: [PLUS_I, MINUS_I], axis: [0, 1, 0] },
};

/** Born rule for any state: the chance of outcome |v⟩ is ⟨v|ρ|v⟩. */
export const prob = (rho: Matrix, v: State): number => clean(inner(v, matVec(rho, v)).re);

/** [chance of the first outcome, chance of the second] when ρ is measured in this basis. */
export const odds = (rho: Matrix, basis: Basis): [number, number] => {
  const [v0, v1] = BASES[basis].kets;
  return [prob(rho, v0), prob(rho, v1)];
};

/** Copies in one measured batch. */
export const COPIES = 100;

/**
 * One batch of fresh copies, each measured once. Copy i gives the first outcome (0) when its own uniform draw us[i]
 * (in [0, 1)) is below p0, so each copy gives it with chance p0 (Born rule). The draws stay fixed while the controls
 * move, so a copy flips only when p0 passes its draw. Only p0 enters, so two recipes with the same ρ give the same dots.
 */
export const results = (us: readonly number[], p0: number): (0 | 1)[] => us.map((u) => (u < p0 ? 0 : 1));

export const firsts = (rs: readonly number[]): number => rs.filter((r) => r === 0).length;

// ---- Named states and recipes

/** The six states on the axes. */
export const NAMED = [
  { name: '|0⟩', theta: 0, phi: 0 },
  { name: '|1⟩', theta: 180, phi: 0 },
  { name: '|+⟩', theta: 90, phi: 0 },
  { name: '|−⟩', theta: 90, phi: 180 },
  { name: '|+i⟩', theta: 90, phi: 90 },
  { name: '|−i⟩', theta: 90, phi: 270 },
] as const;

const pole = (theta: number) => theta === 0 || theta === 180;

/** Same state (same ρ) at whole-degree angles. At a pole every phi gives the same state. */
export const sameState = (a: Angles, b: Angles): boolean =>
  a.theta === b.theta && (pole(a.theta) || wrap(a.phi) === wrap(b.phi));

/** The named state at these angles, or null. */
export const nameAt = (a: Angles): string | null => NAMED.find((n) => sameState(n, a))?.name ?? null;

/** Recipes to try. */
export const RECIPES: readonly ({ name: string; said: string } & Recipe)[] = [
  { name: 'Just |+⟩', said: '|+⟩ every time', a: { theta: 90, phi: 0 }, b: { theta: 90, phi: 180 }, p: 100 },
  { name: '|0⟩ or |1⟩', said: 'half |0⟩, half |1⟩', a: { theta: 0, phi: 0 }, b: { theta: 180, phi: 0 }, p: 50 },
  { name: '|+⟩ or |−⟩', said: 'half |+⟩, half |−⟩', a: { theta: 90, phi: 0 }, b: { theta: 90, phi: 180 }, p: 50 },
  { name: '|0⟩ or |+⟩', said: 'half |0⟩, half |+⟩', a: { theta: 0, phi: 0 }, b: { theta: 90, phi: 0 }, p: 50 },
  { name: '|0⟩ or |+i⟩', said: 'half |0⟩, half |+i⟩', a: { theta: 0, phi: 0 }, b: { theta: 90, phi: 90 }, p: 50 },
];

/** The recipe the tool starts with: half |0⟩, half |+⟩ (Watrous's example, ρ = [[¾, ¼], [¼, ¼]]). */
export const START = RECIPES[3];

/** The preset these exact control values match, or null. */
export const presetAt = (r: Recipe): string | null =>
  RECIPES.find((x) => x.p === r.p && x.a.theta === r.a.theta && wrap(x.a.phi) === wrap(r.a.phi)
    && x.b.theta === r.b.theta && wrap(x.b.phi) === wrap(r.b.phi))?.name ?? null;

// ---- Words and numbers the tool shows

const MINUS = '−';

/**
 * A real number to two decimals with a true minus sign. Exactly 0, 1 or −1 (within float dust) shows with no
 * decimals, so "0" means zero and "0.00" means a small number rounded. Never "−0.00".
 */
export function num(x: number): string {
  if (Math.abs(x) < DUST) return '0';
  if (Math.abs(Math.abs(x) - 1) < DUST) return x < 0 ? `${MINUS}1` : '1';
  const s = Math.abs(x).toFixed(2);
  return x < 0 && s !== '0.00' ? MINUS + s : s;
}

/** A complex entry: "0.25", "−0.25i", "0.25 − 0.25i". */
export function cnum(z: C): string {
  const re = num(z.re), im = num(z.im);
  if (im === '0') return re;
  const mag = im.replace(MINUS, ''), i = mag === '1' ? 'i' : `${mag}i`;
  if (re === '0') return im.startsWith(MINUS) ? MINUS + i : i;
  return `${re} ${im.startsWith(MINUS) ? MINUS : '+'} ${i}`;
}

/** A point as text: "(0.50, 0, 0.50)". */
export const vecText = (v: Vec3): string => `(${v.map(num).join(', ')})`;

/** A number in [0, 1] for a sentence: never rounds a value below 1 up to "1.00" or one above 0 down to "0.00". */
export function amount(x: number): string {
  const s = num(x);
  if (s === '1.00') return 'just under 1';
  if (s === '0.00') return 'just over 0';
  return s;
}

/** Whole-percent odds of the two outcomes. They add to 100, and a real chance is never shown as 0% or 100%. */
export function percents(p0: number): [string, string] {
  if (p0 >= 1 - DUST) return ['100%', '0%'];
  if (p0 <= DUST) return ['0%', '100%'];
  if (p0 > 0.99) return ['over 99%', 'under 1%'];
  if (p0 < 0.01) return ['under 1%', 'over 99%'];
  const a = Math.round(p0 * 100);
  return [`${a}%`, `${100 - a}%`];
}

/** A pure state in words: its name, or its angles. */
export const stateText = (a: Angles): string => nameAt(a) ?? `the state at θ ${a.theta}°, φ ${wrap(a.phi)}°`;

/** The recipe in words. */
export function recipeText(r: Recipe): string {
  const A = stateText(r.a), B = stateText(r.b);
  if (sameState(r.a, r.b)) return `${A} every time (A and B are the same state)`;
  if (r.p === 100) return `${A} every time`;
  if (r.p === 0) return `${B} every time`;
  return `${A} with chance ${r.p}%, else ${B}`;
}

/** Where the point sits, in words. */
export function whereText(rho: Matrix): string {
  const k = kindOf(rho), P = purity(rho);
  // A mixed state's purity is above ½, even when it rounds to 0.50.
  const pur = num(P) === '0.50' ? 'just over 0.50' : amount(P);
  if (k === 'pure') return 'The point is on the surface of the ball: a pure state, ρ = |ψ⟩⟨ψ|, with purity 1.';
  if (k === 'center') return `The point is at the center: the completely mixed state I/2, with purity ${num(P)}. Every basis gives 50/50 here.`;
  return `The point is ${amount(len(blochOf(rho)))} from the center, inside the ball: a mixed state, with purity ${pur}.`;
}

/** How one batch came out. */
export function tallyText(zeros: number, basis: Basis, n = COPIES): string {
  const [o0, o1] = BASES[basis].outcomes;
  return zeros === n ? `all ${n} gave ${o0}` : zeros === 0 ? `all ${n} gave ${o1}` : `${zeros} gave ${o0} and ${n - zeros} gave ${o1}`;
}

/** The caption under the batch: the basis, the counts, and which dots mean what. */
export function batchText(zeros: number, basis: Basis, n = COPIES): string {
  const [o0, o1] = BASES[basis].outcomes;
  return `In the ${BASES[basis].name} basis, ${zeros} gave ${o0} (filled) and ${n - zeros} gave ${o1} (open).`;
}

/** The readout: the recipe, where its point sits, the odds in the chosen basis, and one batch's counts. */
export function describe(r: Recipe, basis: Basis, zeros?: number, n = COPIES): string {
  const rho = rhoOf(r), [o0, o1] = BASES[basis].outcomes, [p0, p1] = percents(odds(rho, basis)[0]);
  let s = `Recipe: ${recipeText(r)}. ${whereText(rho)} Measured in the ${BASES[basis].name} basis, the odds are ${p0} for ${o0} and ${p1} for ${o1}`;
  s += basis === 'z' ? ', the diagonal of ρ.' : '.';
  if (zeros !== undefined) s += ` Of ${n} fresh copies, each measured once, ${tallyText(zeros, basis, n)}.`;
  return s;
}

// ---- Drawing math: the view, and the dots that draw the ball (they are not states or shots)

export type Camera = { right: Vec3; up: Vec3; toward: Vec3 };

/** An orthographic camera looking at the center from azimuth yaw (about z, from +x toward +y) and elevation tilt, in degrees. */
export function camera(yaw: number, tilt: number): Camera {
  const a = yaw * RAD, e = tilt * RAD;
  const toward: Vec3 = [Math.cos(e) * Math.cos(a), Math.cos(e) * Math.sin(a), Math.sin(e)];
  const right: Vec3 = [-Math.sin(a), Math.cos(a), 0];
  // up = toward × right, so (right, up, toward) is a right-handed orthonormal frame.
  const up: Vec3 = [
    toward[1] * right[2] - toward[2] * right[1],
    toward[2] * right[0] - toward[0] * right[2],
    toward[0] * right[1] - toward[1] * right[0],
  ];
  return { right, up, toward };
}

const dot3 = (a: Vec3, b: Vec3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

/** Screen x (right) and y (up) in ball radii, and depth toward the viewer (front > 0). */
export const project = (p: Vec3, cam: Camera): { x: number; y: number; depth: number } =>
  ({ x: dot3(p, cam.right), y: dot3(p, cam.up), depth: dot3(p, cam.toward) });

/** n points spread evenly over the unit sphere (a golden-angle spiral). */
export function spherePoints(n: number): Vec3[] {
  const turn = Math.PI * (3 - Math.sqrt(5));
  return Array.from({ length: n }, (_, k) => {
    const z = 1 - (2 * k + 1) / n, r = Math.sqrt(1 - z * z);
    return [r * Math.cos(k * turn), r * Math.sin(k * turn), z] as Vec3;
  });
}

/** k + 1 evenly spaced points on the straight line from a to b. */
export const segment = (a: Vec3, b: Vec3, k: number): Vec3[] =>
  Array.from({ length: k + 1 }, (_, i) => [0, 1, 2].map((j) => a[j] + ((b[j] - a[j]) * i) / k) as Vec3);
