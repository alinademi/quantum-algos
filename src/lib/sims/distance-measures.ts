// Trace distance and fidelity stop: the pure math behind the TwoStatesApart tool. No DOM.
// For two states ρ and σ, the trace distance is T = ½‖ρ − σ‖₁ and the fidelity is F = tr √(√ρ σ √ρ) = ‖√ρ √σ‖₁
// (N&C 9.2; Watrous, Understanding Quantum Information and Computation, Fidelity; Watrous, Theory of Quantum Information 3.1.1).
// F here is the unsquared "root fidelity": some authors call F² the fidelity.
// For one qubit, ρ = ½(I + r·σ) with Bloch vector r (length ≤ 1), and both numbers have closed forms:
//   T = ½|r − s|   and   F² = tr(ρσ) + 2√(det ρ det σ) = ½(1 + r·s + √((1 − r²)(1 − s²))).
// The first is half the distance between the two Bloch points. The second holds because √ρ σ √ρ is a 2x2 positive matrix M,
// and for such a matrix tr √M = √(tr M + 2√(det M)), with tr M = tr(ρσ) and det M = det ρ det σ.
// With equal chances of A and B, the best one-shot guess is right with chance ½ + ½T (Helstrom), reached by measuring
// along the direction of r − s. The tool keeps to the x-z plane (real states); the formulas hold for the whole ball.
// Angles are whole degrees and lengths whole percents at the edges, radians and fractions inside.
import { c, add, sub, mul, scale, matMul, dagger, type C, type Matrix } from '../quantum.ts';

export type Vec3 = [number, number, number];
/** A state in the x-z plane: angle in whole degrees from the |0⟩ direction toward the |+⟩ direction, length in whole percent
 *  of the Bloch ball's radius (100 is a pure state, 0 is the center, the completely mixed state I/2). */
export type St = { angle: number; len: number };

export const ANGLE = { min: 0, max: 359, step: 1 };
export const LEN = { min: 0, max: 100, step: 1 };
/** Copies of each state in one batch. */
export const SHOTS = 50;

const RAD = Math.PI / 180;
// Float dust: sin(180°) is 1.2e-16, not 0. Below this a number counts as exactly 0 (or exactly 1).
const DUST = 1e-12;
const clean = (x: number) => (Math.abs(x) < DUST ? 0 : x);
const clean01 = (p: number) => Math.min(1, Math.max(0, p < DUST ? 0 : p > 1 - DUST ? 1 : p));
/** Any angle in degrees to [0, 360). */
export const wrap = (deg: number): number => ((deg % 360) + 360) % 360;
const dot = (u: readonly number[], v: readonly number[]) => u.reduce((t, x, i) => t + x * v[i], 0);

// ---- The two numbers, from Bloch vectors

/** The Bloch vector of a state in the plane: (r sin a, 0, r cos a). */
export const vecOf = (s: St): Vec3 => {
  const r = s.len / 100, a = s.angle * RAD;
  return [clean(r * Math.sin(a)), 0, clean(r * Math.cos(a))];
};

/** Trace distance of two qubit states with Bloch vectors u and v: half the distance between the points. */
export const traceDistance = (u: Vec3, v: Vec3): number => Math.min(1, clean(0.5 * Math.hypot(u[0] - v[0], u[1] - v[1], u[2] - v[2])));

/** Fidelity of two qubit states: F² = ½(1 + u·v + √((1 − |u|²)(1 − |v|²))), then the square root. */
export function fidelity(u: Vec3, v: Vec3): number {
  const room = (w: Vec3) => Math.max(0, clean(1 - dot(w, w)));
  const f2 = clean(0.5 * (1 + dot(u, v) + Math.sqrt(room(u) * room(v))));
  return Math.sqrt(Math.min(1, Math.max(0, f2)));
}

/** Fuchs-van de Graaf: for every pair, 1 − F ≤ T ≤ √(1 − F²). Returns [lowest T, highest T] for this F. */
export const boundsOnT = (f: number): [number, number] => [Math.max(0, clean(1 - f)), Math.sqrt(Math.max(0, clean(1 - f * f)))];

/** Best chance to name the state right from one measurement, when A and B are equally likely (Helstrom): ½ + ½T. */
export const bestGuess = (t: number): number => 0.5 + 0.5 * t;

// ---- Measuring

/** Axis angle in whole or fractional degrees, from |0⟩ toward |+⟩, as a unit Bloch vector. */
export const axisVec = (mu: number): Vec3 => [clean(Math.sin(mu * RAD)), 0, clean(Math.cos(mu * RAD))];

/** The axis along r − s, where the odds of "+" differ most. Points at A's side. Any axis is as good when the states match: 0 then. */
export function bestAxis(u: Vec3, v: Vec3): number {
  const dx = u[0] - v[0], dz = u[2] - v[2];
  return Math.hypot(dx, dz) < DUST ? 0 : wrap(Math.atan2(dx, dz) / RAD);
}

/** Born rule for a measurement along axis mu: "+" is the outcome |m⟩⟨m| at the point m, with chance ½(1 + r·m). "−" has the rest. */
export const plusChance = (v: Vec3, mu: number): number => clean01(0.5 * (1 + dot(v, axisVec(mu))));

/** How much more often A gives "+" than B does, as a positive number: the gap |p_A(+) − p_B(+)|. Never above T. */
export const gap = (u: Vec3, v: Vec3, mu: number): number => Math.abs(plusChance(u, mu) - plusChance(v, mu));

/** Say "A" on "+" when A gives "+" at least as often as B does, else say "A" on "−". */
export const saysAOnPlus = (u: Vec3, v: Vec3, mu: number): boolean => plusChance(u, mu) >= plusChance(v, mu);

/** The chance of a right guess with this axis and the better rule, A and B equally likely: ½ + ½·gap. */
export const guessChance = (u: Vec3, v: Vec3, mu: number): number => 0.5 + 0.5 * gap(u, v, mu);

// ---- Shots

/** One state's batch: copy i gives "+" when its own uniform draw us[i] (in [0, 1)) is below p, so each copy gives "+" with
 *  chance p (Born rule). The draws stay fixed while the controls move, so a copy flips only when p passes its draw. */
export const results = (us: readonly number[], p: number): boolean[] => us.map((x) => x < p);

/** Right guesses out of both batches: a "+" from A is right when the rule says A on "+", and so on. */
export const countRight = (a: readonly boolean[], b: readonly boolean[], aOnPlus: boolean): number =>
  a.filter((plus) => plus === aOnPlus).length + b.filter((plus) => plus !== aOnPlus).length;

// ---- Matrix definitions, for checking the closed forms above

/** ρ = ½(I + xX + zZ + yY) for a Bloch vector. A density matrix when the vector is in the ball. */
export const rhoOf = ([x, y, z]: Vec3): Matrix => [
  [c((1 + z) / 2), c(x / 2, -y / 2)],
  [c(x / 2, y / 2), c((1 - z) / 2)],
];

const det2 = (m: Matrix): C => sub(mul(m[0][0], m[1][1]), mul(m[0][1], m[1][0]));
const tr2 = (m: Matrix): C => add(m[0][0], m[1][1]);

/** The positive square root of a 2x2 positive matrix: (M + √det·I) / √(tr M + 2√det). It squares back to M (Cayley-Hamilton). */
export function sqrtPsd(m: Matrix): Matrix {
  const d = Math.sqrt(Math.max(0, det2(m).re)), t = tr2(m).re, k = Math.sqrt(t + 2 * d);
  if (k < DUST) return [[c(0), c(0)], [c(0), c(0)]];
  return m.map((row, i) => row.map((z, j) => scale(add(z, i === j ? c(d) : c(0)), 1 / k)));
}

/** ‖M‖₁ = tr √(M†M) for a 2x2 matrix: the sum of its singular values. */
export const traceNorm = (m: Matrix): number => tr2(sqrtPsd(matMul(dagger(m), m))).re;

/** T = ½‖ρ − σ‖₁ from the matrices. */
export const traceDistanceMatrix = (rho: Matrix, sigma: Matrix): number =>
  0.5 * traceNorm(rho.map((row, i) => row.map((z, j) => sub(z, sigma[i][j]))));

/** F = tr √(√ρ σ √ρ) from the matrices. */
export const fidelityMatrix = (rho: Matrix, sigma: Matrix): number => {
  const r = sqrtPsd(rho);
  return tr2(sqrtPsd(matMul(matMul(r, sigma), r))).re;
};

/** The projector |m⟩⟨m| = ½(I + m·σ) onto the "+" outcome along a unit vector m (any vector in the x-z plane here). */
export const plusProjector = (m: Vec3): Matrix => rhoOf(m);

/** tr(Eρ): the chance of an outcome E, from the matrices (Born rule). */
export const chanceOf = (e: Matrix, rho: Matrix): number => tr2(matMul(e, rho)).re;

// ---- Words

const MINUS = '\u2212'; // the minus sign, as in |−⟩

/** A decimal for T and F. Never shows a real number just under 1 as 1, or just above 0 as 0. */
export function num(x: number): string {
  if (x >= 1) return '1';
  if (x <= 0) return '0';
  const t = x.toFixed(3);
  if (t === '1.000') return '>0.999';
  if (t === '0.000') return '<0.001';
  return t;
}

/** Percent for a chance, never 0% or 100% for a real chance. */
export const pct = (p: number): string => {
  const v = p * 100;
  if (v > 0 && v < 0.05) return '<0.1%';
  if (v >= 99.95 && v < 100) return '>99.9%';
  return `${(v > 0 && v < 1) || (v > 99 && v < 100) ? v.toFixed(1) : Math.round(v)}%`;
};

const KETS: Record<number, string> = { 0: '|0⟩', 90: '|+⟩', 180: '|1⟩', 270: `|${MINUS}⟩` };

/** A name for the start state, so every readout says what A and B are. */
export function nameOf(s: St): string {
  if (s.len === 0) return 'the center I/2 (completely mixed)';
  if (s.len === 100) return KETS[s.angle] ?? `the pure state at ${s.angle}°`;
  return `a mix at ${s.angle}°, length ${s.len}%`;
}

/** The presets: each sets A and B. The notes say what to look for. */
export const PRESETS: { name: string; a: St; b: St }[] = [
  { name: '|0⟩ and |+⟩', a: { angle: 0, len: 100 }, b: { angle: 90, len: 100 } },
  { name: '|0⟩ and |1⟩', a: { angle: 0, len: 100 }, b: { angle: 180, len: 100 } },
  { name: 'Two pure states 60° apart', a: { angle: 0, len: 100 }, b: { angle: 60, len: 100 } },
  { name: 'Pure state and the center', a: { angle: 0, len: 100 }, b: { angle: 0, len: 0 } },
  { name: '|0⟩ and a mix', a: { angle: 0, len: 100 }, b: { angle: 0, len: 50 } },
];

/** The start: A is |0⟩ and B is |+⟩. */
export const START = { a: PRESETS[0].a, b: PRESETS[0].b };

/** Spoken value for the angle and length sliders. */
export const angleText = (deg: number): string => `${deg} degrees`;
export const lenText = (len: number): string =>
  len === 100 ? '100 percent, a pure state' : len === 0 ? '0 percent, the completely mixed state' : `${len} percent, a mix`;

/** What the tool says once the reader lets go: the start states, both numbers, the bounds and what a measurement does. */
export function describe(a: St, b: St, mu: number, best: boolean, right?: number): string {
  const u = vecOf(a), v = vecOf(b);
  const t = traceDistance(u, v), f = fidelity(u, v), [lo, hi] = boundsOnT(f);
  const head = `A started as ${nameOf(a)}, B as ${nameOf(b)}.`;
  if (t === 0) {
    return `${head} They are the same state: T = 0, F = 1. No measurement tells A from B, and a guess is right half the time.`;
  }
  const pa = plusChance(u, mu), pb = plusChance(v, mu), g = gap(u, v, mu);
  const bound =
    a.len === 100 && b.len === 100
      ? 'Both are pure, so T is at the top of its range.'
      : `By Fuchs-van de Graaf, T lies between ${num(lo)} and ${num(hi)}.`;
  const axis = best ? `the best axis (${Math.round(mu)}°)` : `your axis (${Math.round(mu)}°)`;
  const rule = saysAOnPlus(u, v, mu) ? 'A on +' : `A on ${MINUS}`;
  const verdict = g >= t - 1e-9
    ? `No axis does better. Say ${rule}: right with chance ${pct(bestGuess(t))}.`
    : num(g) === num(t)
    ? `That matches T to 3 decimals. Say ${rule}: right with chance ${pct(guessChance(u, v, mu))}.`
    : `That is below T. Say ${rule}: right with chance ${pct(guessChance(u, v, mu))}, where the best axis gives ${pct(bestGuess(t))}.`;
  const shots = right === undefined ? '' : ` In the ${2 * SHOTS} copies shown, ${right} guesses were right.`;
  return `${head} T = ${num(t)}, F = ${num(f)}. ${bound} Along ${axis}, A gives + with chance ${pct(pa)} and B with chance ${pct(pb)}, a gap of ${num(g)}. ${verdict}${shots}`;
}
