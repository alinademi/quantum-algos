// Schrödinger and Heisenberg pictures: the pure math behind the Two pictures tool. No DOM.
// One ideal qubit, started as 0, is driven by a steady Hamiltonian H = (ħω/2) n·σ for a time t, then measured.
// The tool shows time as the turn angle ωt, in whole degrees. Inside, angles are radians.
//   U(t) = e^{−iHt/ħ} = cos(ωt/2) I − i sin(ωt/2) n·σ. It turns Bloch vectors by ωt about n (right-hand rule).
// Schrödinger picture: the state changes, |ψ(t)⟩ = U|0⟩, and the observable A stays put. P(+1) = |⟨a₊|ψ(t)⟩|².
// Heisenberg picture: the state stays |0⟩, and the observable changes, A_H(t) = U† A U. P(+1) = (1 + ⟨0|A_H|0⟩)/2.
// The two are computed separately below, with matrices, and agree for every t (Zwiebach, 8.05 Quantum Dynamics
// notes, eq. 3.15; Sakurai and Napolitano 2.2). For A = m·σ, U†AU = (R_n(−ωt) m)·σ: the measurement axis turns
// the other way. Bloch vectors: +z is |0⟩, +x is |+⟩, +y is |+i⟩.
import { c, add, mul, abs2, inner, matVec, matMul, dagger, bloch, ket0, I, X, Y, Z, type C, type Matrix, type State } from '../quantum.ts';

export type Vec = [number, number, number];
export type Drive = 'x' | 'h';
export type Meas = 'Z' | 'X' | 'Y';

const S2 = Math.SQRT1_2;
const RAD = Math.PI / 180;
// Float dust: cos(90°) is 6e-17, not 0. Odds are rounded to 12 places, so dust can never move a dot or a word.
const DUST = 1e-12;
const tidy = (p: number) => Math.round(p * 1e12) / 1e12;
const clean = (x: number) => (Math.abs(x) < DUST ? 0 : x);
const MINUS = '−';

/** The two drives. n is the axis the drive turns the Bloch sphere about. */
export const DRIVES: Record<Drive, { n: Vec; words: string; short: string }> = {
  x: { n: [1, 0, 0], words: 'about the x axis', short: 'x' },
  h: { n: [S2, 0, S2], words: 'about the axis halfway between x and z', short: 'halfway between x and z' },
};

/** The three measurements. Each observable m·σ has results +1 and −1; up and down are their eigenstates. */
export const MEASURES: Record<Meas, { m: Vec; op: Matrix; up: State; down: State; results: [string, string] }> = {
  Z: { m: [0, 0, 1], op: Z, up: [c(1), c(0)], down: [c(0), c(1)], results: ['0', '1'] },
  X: { m: [1, 0, 0], op: X, up: [c(S2), c(S2)], down: [c(S2), c(-S2)], results: ['+', '−'] },
  Y: { m: [0, 1, 0], op: Y, up: [c(S2), c(0, S2)], down: [c(S2), c(0, -S2)], results: ['+i', '−i'] },
};

// ---- Small matrix helpers (2x2)

/** A sum of complex numbers times matrices. */
const lin = (terms: [C, Matrix][]): Matrix =>
  [0, 1].map((i) => [0, 1].map((j) => terms.reduce((t, [k, m]) => add(t, mul(k, m[i][j])), c(0))));

/** v·σ = vx X + vy Y + vz Z. */
export const sigma = (v: Vec): Matrix => lin([[c(v[0]), X], [c(v[1]), Y], [c(v[2]), Z]]);

/** Trace of a 2x2 matrix. */
export const trace = (m: Matrix): C => add(m[0][0], m[1][1]);

/** Pauli parts (x, y, z) of a 2x2 matrix A = a0 I + x X + y Y + z Z: each is tr(σ A)/2. Real for a Hermitian A. */
export const paulis = (a: Matrix): Vec => [X, Y, Z].map((s) => clean(trace(matMul(s, a)).re / 2)) as Vec;

// ---- Time evolution

/** U for a turn of deg degrees (ωt) about the drive axis: cos(ωt/2) I − i sin(ωt/2) n·σ. */
export function evolution(d: Drive, deg: number): Matrix {
  const h = (deg * RAD) / 2;
  return lin([[c(Math.cos(h)), I], [c(0, -Math.sin(h)), sigma(DRIVES[d].n)]]);
}

/** The start state, |0⟩. */
export const start = (): State => ket0();

// ---- Schrödinger picture: the state changes, the observable stays put

/** |ψ(t)⟩ = U|0⟩, global phase included. */
export const stateAt = (d: Drive, deg: number): State => matVec(evolution(d, deg), start());

/** Born rule odds [P(+1), P(−1)] = [|⟨up|ψ(t)⟩|², |⟨down|ψ(t)⟩|²]. */
export function schrodingerOdds(d: Drive, m: Meas, deg: number): [number, number] {
  const s = stateAt(d, deg), M = MEASURES[m];
  return [tidy(abs2(inner(M.up, s))), tidy(abs2(inner(M.down, s)))];
}

/** P(+1) in the Schrödinger picture. */
export const schrodingerP = (d: Drive, m: Meas, deg: number): number => schrodingerOdds(d, m, deg)[0];

// ---- Heisenberg picture: the state stays |0⟩, the observable changes

/** A_H(t) = U† A U. */
export function observableAt(d: Drive, m: Meas, deg: number): Matrix {
  const U = evolution(d, deg);
  return matMul(dagger(U), matMul(MEASURES[m].op, U));
}

/** ⟨0|A_H(t)|0⟩, the expectation value on the start state. */
export const heisenbergMean = (d: Drive, m: Meas, deg: number): number =>
  clean(inner(start(), matVec(observableAt(d, m, deg), start())).re);

/** P(+1) in the Heisenberg picture: A_H has results ±1, so P(+1) = ⟨(I + A_H)/2⟩ = (1 + ⟨0|A_H|0⟩)/2. */
export const heisenbergP = (d: Drive, m: Meas, deg: number): number => tidy((1 + heisenbergMean(d, m, deg)) / 2);

// ---- The pictures on the Bloch sphere

/** Where the state points at time t (Schrödinger picture). Global phase does not move it. */
export const stateVec = (d: Drive, deg: number): Vec => bloch(stateAt(d, deg)).map(clean) as Vec;

/** Where the measurement axis points at time t (Heisenberg picture): A_H = (that vector)·σ. */
export const axisVec = (d: Drive, m: Meas, deg: number): Vec => paulis(observableAt(d, m, deg));

const dot3 = (a: Vec, b: Vec) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

/** The angle between two unit vectors, in degrees. */
export const angleDeg = (a: Vec, b: Vec): number => Math.acos(Math.max(-1, Math.min(1, dot3(a, b)))) / RAD;

/** Angle between the state and the +1 end of the axis: Schrödinger (moved state, fixed axis) and Heisenberg (fixed state, moved axis). */
export const angles = (d: Drive, m: Meas, deg: number): { s: number; h: number } => ({
  s: angleDeg(stateVec(d, deg), MEASURES[m].m),
  h: angleDeg(stateVec(d, 0), axisVec(d, m, deg)),
});

/** True when the observable commutes with the drive, so in the Heisenberg picture it never moves. */
export const conserved = (d: Drive, m: Meas): boolean => Math.abs(dot3(DRIVES[d].n, MEASURES[m].m)) > 1 - DUST;

/** Points along a path for drawing a trail, every step degrees from 0 to deg. */
export const trail = (deg: number, step: number, at: (t: number) => Vec): Vec[] => {
  const out: Vec[] = [];
  for (let t = 0; t < deg; t += step) out.push(at(t));
  return out;
};

// ---- Measured copies

/** Fresh copies in one batch. */
export const COPIES = 100;

/**
 * How many of the first n copies gave the +1 result. Copy i gives +1 when its own uniform draw us[i] (in [0, 1))
 * is below p, which happens with chance p (Born rule). The draws stay fixed, so a copy flips only when p passes it.
 */
export function plusCount(us: readonly number[], p: number, n = us.length): number {
  let k = 0;
  for (let i = 0; i < n; i++) if (us[i] < p) k++;
  return k;
}

// ---- Drawing math: a fixed camera and the dots that draw a sphere

export type View = { right: Vec; up: Vec; toward: Vec };

/** A camera turned yaw degrees about z (from +x toward +y) and tilted tilt degrees above the equator. */
export function view(yaw: number, tilt: number): View {
  const a = yaw * RAD, e = tilt * RAD;
  return {
    right: [-Math.sin(a), Math.cos(a), 0],
    up: [-Math.sin(e) * Math.cos(a), -Math.sin(e) * Math.sin(a), Math.cos(e)],
    toward: [Math.cos(e) * Math.cos(a), Math.cos(e) * Math.sin(a), Math.sin(e)],
  };
}

/** Orthographic view: screen x to the right, y up, in sphere radii; depth > 0 is the front half. */
export const project = (p: Vec, v: View): { x: number; y: number; depth: number } =>
  ({ x: dot3(p, v.right), y: dot3(p, v.up), depth: dot3(p, v.toward) });

/** n points spread evenly over the unit sphere. They only draw the sphere: they are not states or shots. */
export function spherePoints(n: number): Vec[] {
  const golden = Math.PI * (3 - Math.sqrt(5));
  return Array.from({ length: n }, (_, k) => {
    const z = 1 - (2 * k + 1) / n, r = Math.sqrt(1 - z * z);
    return [r * Math.cos(k * golden), r * Math.sin(k * golden), z] as Vec;
  });
}

// ---- Words and numbers

/** A real number to two decimals with a true minus sign, never "−0.00". */
export function num(x: number): string {
  const s = Math.abs(x).toFixed(2);
  return x < 0 && s !== '0.00' ? MINUS + s : s;
}

/** A complex amplitude to two decimals: "0.71", "−0.71i", "(0.35 − 0.35i)". */
export function amp(z: C): string {
  const re = num(z.re), im = num(z.im);
  if (im === '0.00') return re;
  if (re === '0.00') return im + 'i';
  return `(${re} ${im.startsWith(MINUS) ? MINUS : '+'} ${im.replace(MINUS, '')}i)`;
}

/** The ket U|0⟩ as computed, global phase included: "0.71|0⟩ − 0.71i|1⟩". */
export function ketText(s: State): string {
  const a = amp(s[0]), b = amp(s[1]), neg = b.startsWith(MINUS);
  return `${a}|0⟩ ${neg ? MINUS : '+'} ${neg ? b.slice(1) : b}|1⟩`;
}

/** A Bloch vector as text: "(0.00, −0.71, 0.71)". */
export const vecText = (v: Vec): string => `(${v.map(num).join(', ')})`;

const NAMED: [Vec, string][] = [
  [[0, 0, 1], '|0⟩'], [[0, 0, -1], '|1⟩'], [[1, 0, 0], '|+⟩'], [[-1, 0, 0], '|−⟩'], [[0, 1, 0], '|+i⟩'], [[0, -1, 0], '|−i⟩'],
];
const near = (a: Vec, b: Vec) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]) < 1e-9;

/** The named state at this Bloch point, or null. */
export const nameOf = (v: Vec): string | null => NAMED.find(([p]) => near(p, v))?.[1] ?? null;

/** An observable v·σ as text: "Y", "−Z", "0.71 Y + 0.71 Z". Parts that round to 0.00 are left out. */
export function opText(v: Vec): string {
  const parts = v.map((k, i) => ({ k: num(k), name: 'XYZ'[i] })).filter((p) => p.k !== '0.00');
  if (parts.length === 1 && parts[0].k.endsWith('1.00')) return (parts[0].k.startsWith(MINUS) ? MINUS : '') + parts[0].name;
  return parts.map((p, i) => {
    const neg = p.k.startsWith(MINUS), size = neg ? p.k.slice(1) : p.k;
    return i === 0 ? `${neg ? MINUS : ''}${size} ${p.name}` : ` ${neg ? MINUS : '+'} ${size} ${p.name}`;
  }).join('');
}

/** A chance as a whole percent that never shows a false 0% or 100%. */
export function percent(p: number): string {
  if (p <= 0) return '0%';
  if (p >= 1) return '100%';
  if (p < 0.01) return 'under 1%';
  if (p > 0.99) return 'over 99%';
  return `${Math.round(p * 100)}%`;
}

/** A chance to two decimals, for the formula lines. */
export const fixed = (p: number): string => p.toFixed(2);

/** Where the state is, in words. */
const where = (v: Vec): string => nameOf(v) ?? `the point ${vecText(v)}`;

/** What the time slider says to a screen reader. */
export function valueText(d: Drive, m: Meas, deg: number): string {
  return `${deg} degrees. Started as 0: P(${MEASURES[m].results[0]}) is ${percent(schrodingerP(d, m, deg))} in both pictures.`;
}

/** Counts in words: "all 100 gave 0" or "52 gave 0 and 48 gave 1". */
const tally = (k: number, n: number, up: string, down: string): string =>
  k === n ? `all ${n} gave ${up}` : k === 0 ? `all ${n} gave ${down}` : `${k} gave ${up} and ${n - k} gave ${down}`;

/** The readout: both pictures in words, the odds they share, and the counts from one batch (left out when plus is not given). */
export function readout(d: Drive, m: Meas, deg: number, plus?: number, n = COPIES): string {
  const D = DRIVES[d], M = MEASURES[m], [up, down] = M.results;
  const p = schrodingerP(d, m, deg), gap = Math.round(angles(d, m, deg).s);
  const parts = [`Started as 0, driven ${D.words} for ωt = ${deg}°, then ${m} is measured.`];
  if (deg === 0) parts.push(`No time has passed, so both pictures show the state |0⟩ and the ${m} axis as they started.`);
  else {
    parts.push(`Schrödinger picture: the ${m} axis stays put and the state turns ${deg}° about the drive axis, to ${where(stateVec(d, deg))}.`);
    parts.push(conserved(d, m)
      ? `Heisenberg picture: the state stays |0⟩, and ${m} stays ${m}: it lies on the drive axis and commutes with the drive, so it is conserved.`
      : `Heisenberg picture: the state stays |0⟩ and the measurement turns ${deg}° the other way, to ${opText(axisVec(d, m, deg))}.`);
  }
  parts.push(`Both pictures put the state ${gap}° from the ${up} end of the measurement axis, so P(${up}) = ${percent(p)}.`);
  if (d === 'h' && deg === 180) parts.push('At 180° this drive is a Hadamard gate times −i, a global phase that no measurement can see.');
  if (deg === 360) parts.push('A full turn multiplies the state by −1, a global phase, so every result has its starting odds.');
  if (plus !== undefined) parts.push(`Of ${n} fresh copies, ${tally(plus, n, up, down)}.`);
  return parts.join(' ');
}
