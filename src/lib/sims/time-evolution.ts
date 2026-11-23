// Time evolution stop: the pure math behind the Precession tool. No DOM.
// One qubit with a time-independent Hamiltonian H = (ħω/2)(n·σ) + shift·(ħω/2)·I, with n = (sin α, 0, cos α):
// energies (±1 + shift)·ħω/2, gap ΔE = ħω. Schrödinger's equation iħ d|ψ⟩/dt = H|ψ⟩ gives |ψ(t)⟩ = e^{−iHt/ħ}|ψ(0)⟩, and
// because (n·σ)² = I, e^{−iHt/ħ} = e^{−i·shift·ωt/2}[cos(ωt/2) I − i sin(ωt/2) n·σ]: a turn of the Bloch sphere by ωt about n.
// Sources: Zwiebach, MIT 8.05 notes, Quantum Dynamics 2.1 to 2.3 and Two State Systems 2 to 3; Aaronson, QIS notes 25.2.
// Time is counted in periods T = 2π/ω = h/ΔE, the time for one full turn, so ωt/2 = π·(t/T). Angles at the edges are degrees.
import { c, add, mul, scale, conj, matVec, bloch, probs, H as HADAMARD, I, type C, type Matrix, type State } from '../quantum.ts';
import { pct } from '../draw.ts';

export type Vec3 = [number, number, number];
export type StartId = '0' | '1' | '+' | '-';
/** Z: measure 0/1 right away. X: a Hadamard gate, then measure 0/1 (the X basis). */
export type Basis = 'Z' | 'X';

const RAD = Math.PI / 180;
// Float dust: cos(90°) is 6e-17, not 0. Below this we call it exactly 0.
const DUST = 1e-12;
const clean = (x: number) => (Math.abs(x) < DUST ? 0 : x);
/** Odds to 12 places, so float dust never shows as a tiny chance. */
const round12 = (p: number) => Math.round(p * 1e12) / 1e12 + 0; // + 0 turns −0 into 0

// ---- Start states

export const STARTS: readonly StartId[] = ['0', '1', '+', '-'];

const S2 = Math.SQRT1_2;
/** |0⟩, |1⟩, |+⟩ = H|0⟩ and |−⟩ = H|1⟩. */
export function startState(id: StartId): State {
  if (id === '0') return [c(1), c(0)];
  if (id === '1') return [c(0), c(1)];
  return id === '+' ? [c(S2), c(S2)] : [c(S2), c(-S2)];
}

export const ketName = (id: StartId): string => `|${id.replace('-', '−')}⟩`;

/** How the start state was made, for every readout: a gate's effect depends on its input. */
export const startText = (id: StartId): string =>
  ({ '0': 'Started as 0', '1': 'Started as 1', '+': 'Started as 0, then a Hadamard gate (|+⟩)', '-': 'Started as 1, then a Hadamard gate (|−⟩)' })[id];

// ---- The Hamiltonian and its evolution operator

/** The unit axis n of H for a tilt alpha (degrees) from +z toward +x. The tool keeps n in the x-z plane. */
export const axis = (alpha: number): Vec3 => [clean(Math.sin(alpha * RAD)), 0, clean(Math.cos(alpha * RAD))];

/** n·σ = n_x X + n_y Y + n_z Z for any unit vector n. Hermitian, with (n·σ)² = I. */
export const nSigma = (n: Vec3): Matrix => [[c(n[2]), c(n[0], -n[1])], [c(n[0], n[1]), c(-n[2])]];

/** H in units of ħω/2: n·σ + shift·I. The shift adds the same energy to both eigenstates. */
export const hamiltonian = (alpha: number, shift = 0): Matrix =>
  nSigma(axis(alpha)).map((row, i) => row.map((x, j) => (i === j ? add(x, c(shift)) : x)));

/** cos(πx) and sin(πx), exact at whole and half numbers, so U(T/2) and U(T) carry no float dust. */
const cosPi = (x: number) => clean(Math.cos(Math.PI * x));
const sinPi = (x: number) => clean(Math.sin(Math.PI * x));

/** U = e^{−iHt/ħ} for t = turns·T, in closed form: e^{−iπ·shift·turns}[cos(π turns) I − i sin(π turns) n·σ]. */
export function evolution(alpha: number, turns: number, shift = 0): Matrix {
  const n = nSigma(axis(alpha)), co = cosPi(turns), si = sinPi(turns), g = c(cosPi(shift * turns), -sinPi(shift * turns));
  return I.map((row, i) => row.map((one, j) => mul(g, add(scale(one, co), mul(c(0, -si), n[i][j])))));
}

/** The state at time t = turns·T, from the start state: U(t)|ψ(0)⟩. */
export const evolve = (id: StartId, alpha: number, turns: number, shift = 0): State =>
  matVec(evolution(alpha, turns, shift), startState(id)).map((a) => c(clean(a.re), clean(a.im)));

/** The Bloch point of the state at time t, from its amplitudes: (2 Re a*b, 2 Im a*b, |a|² − |b|²). */
export const pointAt = (id: StartId, alpha: number, turns: number): Vec3 => bloch(evolve(id, alpha, turns)).map(clean) as Vec3;

/** Born rule odds [P(0), P(1)] at time t. Basis X puts a Hadamard gate before the 0/1 measurement. */
export function oddsAt(id: StartId, alpha: number, turns: number, basis: Basis, shift = 0): [number, number] {
  const s = evolve(id, alpha, turns, shift);
  const [p0, p1] = probs(basis === 'Z' ? s : matVec(HADAMARD, s)).map(round12);
  return [p0, p1];
}

/** ⟨ψ|M|ψ⟩ for a 2x2 matrix M (real when M is Hermitian). */
export function expect(s: State, m: Matrix): number {
  const ms = matVec(m, s);
  return clean(s.reduce((t, a, i) => t + mul(conj(a), ms[i]).re, 0));
}

/** The energy ⟨H⟩ in units of ħω/2. It equals n·r for the Bloch point r, and it never changes in time. */
export const energy = (id: StartId, alpha: number, turns = 0): number => expect(evolve(id, alpha, turns), hamiltonian(alpha));

/** True when the start state is an energy eigenstate of H: its point lies on the axis. */
export const isEigen = (id: StartId, alpha: number): boolean => Math.abs(Math.abs(energy(id, alpha)) - 1) < 1e-9;

// ---- Geometry: the turn on the Bloch sphere

const dot3 = (a: Vec3, b: Vec3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: Vec3, b: Vec3): Vec3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];

/** Turn r by deg degrees about the unit axis n, right-handed (Rodrigues). The orbit the tool draws. */
export function rotate(r: Vec3, n: Vec3, deg: number): Vec3 {
  const a = deg * RAD, co = Math.cos(a), si = Math.sin(a), k = dot3(n, r) * (1 - co), x = cross(n, r);
  return r.map((v, i) => clean(v * co + x[i] * si + n[i] * k)) as Vec3;
}

/** The axis the measurement reads on the Bloch sphere: z for 0/1, x after a Hadamard gate. */
const measureAxis = (basis: Basis): Vec3 => (basis === 'Z' ? [0, 0, 1] : [1, 0, 0]);

/**
 * The lowest and highest chance to read 1 over all time. With m the measured axis and r(t) the turning point,
 * m·r(t) = (m·n)(n·r0) + A cos ωt + B sin ωt, with A = m·r0 − (m·n)(n·r0) and B = m·(n × r0), and P(1) = (1 − m·r)/2.
 */
export function range(id: StartId, alpha: number, basis: Basis): [number, number] {
  const n = axis(alpha), r0 = bloch(startState(id)), m = measureAxis(basis);
  const mid = dot3(m, n) * dot3(n, r0), amp = Math.hypot(dot3(m, r0) - mid, dot3(m, cross(n, r0)));
  return [round12((1 - mid - amp) / 2), round12((1 - mid + amp) / 2)];
}

// ---- Measured copies over time

/** Time columns in the strip: t = 0, T/20, ..., 2T. */
export const COLS = 41;
export const PER_TURN = 20;
/** Fresh copies measured at each time. */
export const COPIES = 12;
/** The longest time the tool runs, in periods. */
export const MAX_TURNS = 2;

/** The time of column k, in periods. */
export const columnTurns = (k: number): number => k / PER_TURN;

/** How many columns have a time at or before t (t in periods). */
export const columnsUpTo = (turns: number): number => Math.min(COLS, Math.floor(turns * PER_TURN + 1e-9) + 1);

/** Copy j gives 1 when its own uniform draw us[j] is below p1: each copy gives 1 with chance p1 (Born rule).
 *  The draws stay fixed while settings change, so a copy flips only when p1 passes its draw. */
export const onesIn = (us: readonly number[], p1: number): number => us.filter((u) => u < p1).length;

// ---- Words and numbers the tool shows

const MINUS = '−';

/** A real number to two decimals with a true minus sign, never "−0.00". */
export function num(x: number): string {
  const s = Math.abs(x).toFixed(2);
  return x < 0 && s !== '0.00' ? MINUS + s : s;
}

/** A complex amplitude to two decimals: "0.71", "−0.71i", "(0.50 − 0.50i)". */
export function amp(z: C): string {
  const re = num(z.re), im = num(z.im);
  if (im === '0.00') return re;
  if (re === '0.00') return im + 'i';
  return `(${re} ${im.startsWith(MINUS) ? MINUS : '+'} ${im.replace(MINUS, '')}i)`;
}

/** "|ψ(t)⟩ = 0.71|0⟩ − 0.71i|1⟩". A zero amplitude is left out, and a size-1 one is written bare: "−i|1⟩". */
export function ketText(s: State): string {
  const terms = s.map((a, i) => ({ t: amp(a), k: `|${i}⟩` })).filter((x) => x.t !== '0.00');
  return '|ψ(t)⟩ = ' + terms.map((x, i) => {
    const neg = x.t.startsWith(MINUS), body = neg ? x.t.slice(1) : x.t;
    const coef = body === '1.00' ? '' : body === '1.00i' ? 'i' : body;
    return i === 0 ? `${neg ? MINUS : ''}${coef}${x.k}` : ` ${neg ? MINUS : '+'} ${coef}${x.k}`;
  }).join('');
}

/** Time in periods: "0.25 T". */
export const timeText = (turns: number): string => `${turns.toFixed(2)} T`;

/** The angle turned so far, in whole degrees. */
export const turnedDeg = (turns: number): number => Math.round(turns * 360);

/** Where H's axis points, in words. */
export function axisText(alpha: number): string {
  if (alpha === 0) return 'along Z, through |0⟩ and |1⟩';
  if (alpha === 90) return 'along X, through |+⟩ and |−⟩';
  if (alpha === 180) return 'along −Z, through |1⟩ and |0⟩';
  return `${alpha}° from Z toward X`;
}

/** H as text: "H = ½ħω (0.71 Z + 0.71 X)", or "H = ½ħω X" on a named axis. */
export function hText(alpha: number): string {
  const [x, , z] = axis(alpha);
  if (x === 0) return `H = ${z < 0 ? MINUS : ''}½ħω Z`;
  if (z === 0) return 'H = ½ħω X';
  return `H = ½ħω (${num(z)} Z + ${num(x)} X)`;
}

/** The energy ⟨H⟩ as text, in units of ħω/2: "0.71 × ħω/2". */
export const energyText = (e: number): string => (Math.abs(e) < 0.005 ? '0' : `${num(e)} × ħω/2`);

/** A Bloch point as text: "(0.00, −1.00, 0.00)". */
export const pointText = (v: Vec3): string => `(${v.map(num).join(', ')})`;

const basisWords = (basis: Basis): string => (basis === 'Z' ? 'Measured in 0/1' : 'In the X basis (a Hadamard gate, then the 0/1 measurement)');

/**
 * The readout: the start state, H's axis, where the point is at time t, the chance to read 1 now and over all time,
 * and, when shots are given, how many of the fresh copies measured so far gave 1.
 */
export function describe(id: StartId, alpha: number, turns: number, basis: Basis, shots?: { ones: number; columns: number }): string {
  const parts = [`${startText(id)}. The axis of H points ${axisText(alpha)}.`];
  if (isEigen(id, alpha)) {
    const e = energy(id, alpha) > 0 ? '+ħω/2' : '−ħω/2';
    parts.push(`This start state is an energy eigenstate of H, with energy ${e}, so it only gains a global phase: the point stays put and no chance ever changes.`);
  } else if (turns === 0) {
    parts.push(`At t = 0 the point is at the start, ${pointText(pointAt(id, alpha, 0))}.`);
  } else {
    parts.push(`At t = ${timeText(turns)} the point has turned ${turnedDeg(turns)}° around that axis, to ${pointText(pointAt(id, alpha, turns))}.`);
  }
  if (turns === 1) parts.push('After one full turn the state is −1 times the start state: a global phase, which no measurement can see.');
  if (turns === 2) parts.push('After two full turns the state is exactly the start state again.');
  const p1 = oddsAt(id, alpha, turns, basis)[1], [lo, hi] = range(id, alpha, basis);
  parts.push(lo === hi
    ? `${basisWords(basis)}, the chance to read 1 is ${pct(p1)} at every time.`
    : `${basisWords(basis)}, the chance to read 1 is ${pct(p1)} now, and over time it goes between ${pct(lo)} and ${pct(hi)}.`);
  if (lo === hi && basis === 'Z' && !isEigen(id, alpha)) parts.push('Only the relative phase turns. A Hadamard gate before the measurement shows it.');
  if (shots) {
    const n = shots.columns * COPIES, last = columnTurns(shots.columns - 1);
    const when = shots.columns === 1 ? 'at t = 0' : `${COPIES} at each of ${shots.columns} times from 0 to ${timeText(last)}`;
    parts.push(`Of ${n} fresh copies (${when}), ${shots.ones} gave 1.`);
  }
  return parts.join(' ');
}

// ---- Drawing math: a fixed view of the sphere and the dots that draw it

const YAW = 30 * RAD, TILT = 20 * RAD;
const RIGHT: Vec3 = [-Math.sin(YAW), Math.cos(YAW), 0];
const UP: Vec3 = [-Math.sin(TILT) * Math.cos(YAW), -Math.sin(TILT) * Math.sin(YAW), Math.cos(TILT)];
const TOWARD: Vec3 = [Math.cos(TILT) * Math.cos(YAW), Math.cos(TILT) * Math.sin(YAW), Math.sin(TILT)];

/** Orthographic view from azimuth 30° and 20° above the equator: [screen x (right), screen y (up), depth (toward the viewer)]. */
export const view = (v: Vec3): Vec3 => [dot3(v, RIGHT), dot3(v, UP), dot3(v, TOWARD)];

/** n points spread evenly over the unit sphere (a Fibonacci lattice). They only draw the sphere: they are not states or shots. */
export function spherePoints(n: number): Vec3[] {
  const turn = Math.PI * (3 - Math.sqrt(5));
  return Array.from({ length: n }, (_, k) => {
    const z = 1 - (2 * k + 1) / n, r = Math.sqrt(1 - z * z);
    return [r * Math.cos(k * turn), r * Math.sin(k * turn), z] as Vec3;
  });
}

/** The six named states at the ends of the axes, for labels. */
export const NAMED: readonly [string, Vec3][] = [
  ['|0⟩', [0, 0, 1]], ['|1⟩', [0, 0, -1]], ['|+⟩', [1, 0, 0]], ['|−⟩', [-1, 0, 0]], ['|+i⟩', [0, 1, 0]], ['|−i⟩', [0, -1, 0]],
];
