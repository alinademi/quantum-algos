// State tomography stop: the pure math behind the StateRebuild tool. No DOM.
// A source makes the same one-qubit state again and again. Its density matrix is ρ = ½(I + xX + yY + zZ), with Bloch
// vector r = (x, y, z) = (tr Xρ, tr Yρ, tr Zρ). Measuring a fresh copy in the X, Y or Z basis gives +1 with chance
// ½(1 + r_k) (Born rule), so the average of many such results estimates r_k. Three averages rebuild ρ̃ = ½(I + αxX + αyY + αzZ)
// (Watrous, Understanding Quantum Information and Computation, Quantum state tomography: Qubit tomography using Pauli
// measurements; N&C 8.4.2; James, Kwiat, Munro, White, PRA 64, 052312, 2001). With noise ρ̃ can fail to be positive: its
// eigenvalues are ½(1 ± |α|), so it is a state only when |α| ≤ 1. Watrous's fix: set negative eigenvalues to 0, renormalize.
// Angles are whole degrees at the edges, radians inside.
import { c, add, mul, scale, conj, inner, matMul, matVec, ket0, ket1, plus, minus, I, X, Y, Z, type C, type Matrix, type State } from '../quantum.ts';

export type Vec3 = [number, number, number];
/** The three Pauli bases, by index: 0 is X, 1 is Y, 2 is Z. */
export const AXES = ['X', 'Y', 'Z'] as const;
/** The unknown state the source makes: a direction (θ down from |0⟩, φ around from |+⟩, whole degrees) and the Bloch length r in percent. */
export type Truth = { theta: number; phi: number; r: number };
/** Which of X, Y, Z are measured. */
export type Chosen = [boolean, boolean, boolean];
/** One shot is +1 or −1: the eigenvalue of the measured Pauli matrix. */
export type Shot = 1 | -1;
/** Counts so far, per basis: how many shots gave +1 and how many in all. */
export type Tally = { plus: Vec3; total: Vec3 };

const RAD = Math.PI / 180;
// Float dust: cos(90°) is 6e-17, not 0. Below this a number counts as exactly 0.
const DUST = 1e-12;
const clean = (x: number) => (Math.abs(x) < DUST ? 0 : x);
/** Any angle in degrees to [0, 360). */
export const wrap = (deg: number): number => ((deg % 360) + 360) % 360;
export const len = (v: readonly number[]): number => Math.hypot(...v);

// ---- The unknown state

/** The Bloch vector of the source's state: r·(sin θ cos φ, sin θ sin φ, cos θ). */
export function truthVec(t: Truth): Vec3 {
  const a = t.theta * RAD, f = t.phi * RAD, r = t.r / 100;
  return [clean(r * Math.sin(a) * Math.cos(f)), clean(r * Math.sin(a) * Math.sin(f)), clean(r * Math.cos(a))];
}

/** ρ = ½(I + xX + yY + zZ): the density matrix for a Bloch vector. A state only when the vector is in the ball. */
export function rhoOfVec([x, y, z]: Vec3): Matrix {
  const terms: [number, Matrix][] = [[0.5, I], [x / 2, X], [y / 2, Y], [z / 2, Z]];
  return I.map((row, i) => row.map((_, j) => terms.reduce((t, [w, m]) => add(t, scale(m[i][j], w)), c(0))));
}

/** tr of a matrix. */
const trace = (m: Matrix): C => m.reduce((t, row, i) => add(t, row[i]), c(0));
/** The Bloch vector (tr Xρ, tr Yρ, tr Zρ) of a density matrix. */
export const vecOfRho = (rho: Matrix): Vec3 => [clean(trace(matMul(X, rho)).re), clean(trace(matMul(Y, rho)).re), clean(trace(matMul(Z, rho)).re)];

// ---- Measuring a fresh copy

/** The two eigenvectors of X, Y or Z: the basis for measuring that Pauli matrix. Index 0 is the +1 result. */
export function eigenstates(axis: number): [State, State] {
  const s = Math.SQRT1_2;
  if (axis === 0) return [plus(), minus()];
  if (axis === 1) return [[c(s), c(0, s)], [c(s), c(0, -s)]];
  return [ket0(), ket1()];
}

/** Chance of +1 when measuring Pauli matrix `axis` on a copy with Bloch vector v: ½(1 + v_k). This is ⟨v₊|ρ|v₊⟩. */
export const chancePlus = (v: Vec3, axis: number): number => (1 + v[axis]) / 2;

/** The same chance straight from the Born rule on the density matrix: ⟨v₊|ρ|v₊⟩. Used to check chancePlus. */
export const bornPlus = (rho: Matrix, axis: number): number => {
  const [p] = eigenstates(axis);
  return inner(p, matVec(rho, p)).re;
};

/** Measure n fresh copies in basis `axis`, one shot each. rand is a uniform draw in [0, 1). */
export function shoot(v: Vec3, axis: number, n: number, rand: () => number): Shot[] {
  const p = chancePlus(v, axis);
  return Array.from({ length: n }, () => (rand() < p ? 1 : -1));
}

export const emptyTally = (): Tally => ({ plus: [0, 0, 0], total: [0, 0, 0] });

/** A new tally with these shots added to basis `axis`. */
export function addShots(t: Tally, axis: number, shots: readonly Shot[]): Tally {
  const plus: Vec3 = [...t.plus], total: Vec3 = [...t.total];
  plus[axis] += shots.filter((s) => s === 1).length;
  total[axis] += shots.length;
  return { plus, total };
}

/** The largest number of shots per basis the tool runs. */
export const MAX_SHOTS = 10000;
/** How many of the latest shots per basis the picture shows as dots. */
export const SHOWN = 40;

// ---- Rebuilding

/** α_k = (shots at +1 minus shots at −1) / shots, the average result in basis k. A basis with no shots counts as 0. */
export const estimate = (t: Tally): Vec3 => [0, 1, 2].map((k) => (t.total[k] > 0 ? (2 * t.plus[k] - t.total[k]) / t.total[k] : 0)) as Vec3;

/** Eigenvalues of ρ̃ = ½(I + α·σ), larger first. They sum to 1; the smaller is negative when |α| > 1. */
export const eigenvalues = (a: Vec3): [number, number] => [(1 + len(a)) / 2, (1 - len(a)) / 2];

/** True when the rebuilt matrix is a state: no negative eigenvalue, so |α| ≤ 1. */
export const isState = (a: Vec3): boolean => len(a) <= 1 + DUST;

/** Round to a state: set the negative eigenvalue to 0 and renormalize. For a qubit that moves α straight onto the surface, at α/|α|. */
export function roundVec(a: Vec3): Vec3 {
  const l = len(a);
  return l <= 1 + DUST ? a : [a[0] / l, a[1] / l, a[2] / l];
}

/** Eigenvalues and unit eigenvectors of a 2x2 Hermitian matrix, larger eigenvalue first. */
export function hermEigen2(m: Matrix): { value: number; vec: State }[] {
  const a = m[0][0].re, d = m[1][1].re, b = m[0][1];
  const mid = (a + d) / 2, s = Math.sqrt(((a - d) / 2) ** 2 + b.re * b.re + b.im * b.im);
  return [mid + s, mid - s].map((value, i) => {
    // (b, λ − a) solves the eigen-equation when b ≠ 0. With b = 0 the matrix is diagonal and the larger entry's basis vector comes first.
    let vec: State;
    if (b.re === 0 && b.im === 0) vec = (a >= d) === (i === 0) ? [c(1), c(0)] : [c(0), c(1)];
    else vec = [b, c(value - a)];
    const k = Math.sqrt(vec.reduce((t, z) => t + z.re * z.re + z.im * z.im, 0));
    return { value, vec: vec.map((z) => scale(z, 1 / k)) };
  });
}

/** Watrous's rounding on a matrix: spectral decomposition, negative eigenvalues to 0, divide by the trace. */
export function clipRound(m: Matrix): Matrix {
  const parts = hermEigen2(m).map((e) => ({ w: Math.max(0, e.value), vec: e.vec }));
  const total = parts.reduce((t, p) => t + p.w, 0);
  const out: Matrix = [[c(0), c(0)], [c(0), c(0)]];
  for (const p of parts) for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) out[i][j] = add(out[i][j], scale(mul(p.vec[i], conj(p.vec[j])), p.w / total));
  return out;
}

/** The states that match the measured numbers exactly: fix each measured coordinate at its α, let the others range over the ball.
 *  One basis missing: a segment. Two missing: a disc. None missing: the one point. No basis measured, or numbers no state can have: nothing. */
export function consistentSet(a: Vec3, chosen: Chosen, count: number): Vec3[] {
  const free = [0, 1, 2].filter((k) => !chosen[k]);
  if (free.length === 3) return [];
  const fixed = [0, 1, 2].filter((k) => chosen[k]).reduce((t, k) => t + a[k] * a[k], 0);
  if (fixed > 1 + DUST) return [];
  const R = Math.sqrt(Math.max(0, 1 - fixed));
  const at = (...f: number[]): Vec3 => { const v: Vec3 = [...a]; free.forEach((k, i) => { v[k] = f[i]; }); return v; };
  if (free.length === 0) return [at()];
  if (free.length === 1) return Array.from({ length: count }, (_, i) => at(R * (count === 1 ? 0 : (2 * i) / (count - 1) - 1)));
  // A sunflower: evenly spread points over the disc, nearest the center first.
  return Array.from({ length: count }, (_, i) => {
    const r = R * Math.sqrt((i + 0.5) / count), ang = i * 2.399963229728653;
    return at(r * Math.cos(ang), r * Math.sin(ang));
  });
}

// ---- How close

/** Trace distance ½·tr|ρ − σ| between two Bloch vectors: ρ − σ = ½ (Δr)·σ has eigenvalues ±½|Δr|, so D = ½|Δr|. Also right when a vector is outside the ball. */
export const traceDistance = (a: Vec3, b: Vec3): number => len([a[0] - b[0], a[1] - b[1], a[2] - b[2]]) / 2;

/** Mean squared distance E|α − r|² when basis k gets n_k shots: (1 − r_k²)/n_k for a measured basis, r_k² for one never measured (taken as 0). */
export const expectedSqError = (v: Vec3, n: Vec3, chosen: Chosen): number =>
  [0, 1, 2].reduce((t, k) => t + (chosen[k] ? (1 - v[k] * v[k]) / n[k] : v[k] * v[k]), 0);

/** Chart and readout labels. The raw matrix may have a negative eigenvalue, so ½tr|ρ̃ − ρ| for it is a half trace-norm error,
 *  not an operational trace distance; the rounded rebuild is a state, so there it is the trace distance. */
export const RAW_ERROR_LABEL = 'half trace-norm error (raw matrix, may not be a state)';
export const STATE_ERROR_LABEL = 'trace distance';

/** Typical (root mean square) half trace-norm error of the unrounded rebuild: ½√E|α − r|². */
export const rmsError = (v: Vec3, n: Vec3, chosen: Chosen): number => Math.sqrt(expectedSqError(v, n, chosen)) / 2;

/** Same shots n in every chosen basis. */
export const sameShots = (n: number): Vec3 => [n, n, n];

// ---- Many qubits

/** Real numbers that fix an n-qubit state: 4^n − 1 (James et al., Section II.B). */
export const paramCount = (n: number): number => 4 ** n - 1;
/** Settings needed when each setting measures every qubit in X, Y or Z: 3^n. A Pauli string with no identity in it needs its own setting. */
export const settingCount = (n: number): number => 3 ** n;

// ---- A turnable ball for the picture (drawing only)

export type Camera = { cy: number; sy: number; ct: number; st: number };
/** A camera turned yaw degrees around the vertical axis and raised tilt degrees above the equator. */
export const camera = (yaw: number, tilt: number): Camera => ({ cy: Math.cos(yaw * RAD), sy: Math.sin(yaw * RAD), ct: Math.cos(tilt * RAD), st: Math.sin(tilt * RAD) });

/** Screen position (x right, y up) and depth (larger is nearer) of a point of the ball. Lengths are kept. At yaw 0, X points right and Z up. */
export function project(p: Vec3, cam: Camera): { x: number; y: number; depth: number } {
  const x1 = p[0] * cam.cy - p[1] * cam.sy, y1 = p[0] * cam.sy + p[1] * cam.cy;
  return { x: x1, y: p[2] * cam.ct + y1 * cam.st, depth: p[2] * cam.st - y1 * cam.ct };
}

/** About n points spread evenly over the unit sphere (a spiral), for drawing the ball's skin. */
export function spherePoints(n: number): Vec3[] {
  return Array.from({ length: n }, (_, i) => {
    const z = 1 - (2 * (i + 0.5)) / n, r = Math.sqrt(1 - z * z), a = i * 2.399963229728653;
    return [r * Math.cos(a), r * Math.sin(a), z] as Vec3;
  });
}

/** k + 1 points from a to b. */
export const segment = (a: Vec3, b: Vec3, k: number): Vec3[] =>
  Array.from({ length: k + 1 }, (_, i) => [a[0] + ((b[0] - a[0]) * i) / k, a[1] + ((b[1] - a[1]) * i) / k, a[2] + ((b[2] - a[2]) * i) / k] as Vec3);

// ---- Words

export type Preset = { name: string; said: string; t: Truth };
/** Sources to try. Each says how it is made, so every readout names its start state. */
export const PRESETS: Preset[] = [
  { name: '|0⟩', said: 'started as 0', t: { theta: 0, phi: 0, r: 100 } },
  { name: '|+⟩', said: 'started as 0, then a Hadamard gate', t: { theta: 90, phi: 0, r: 100 } },
  { name: '|+i⟩', said: 'started as 0, then a Hadamard gate, then an S gate', t: { theta: 90, phi: 90, r: 100 } },
  { name: 'Tilted pure state', said: 'started as 0, then an RY(60°) gate, then a phase gate P(40°)', t: { theta: 60, phi: 40, r: 100 } },
  { name: 'Mix, 80% 0', said: 'a source that makes 0 with chance 80%, else 1', t: { theta: 0, phi: 0, r: 60 } },
  { name: 'Fully mixed', said: 'a source that makes 0 or 1 with equal chance, the completely mixed state I/2', t: { theta: 0, phi: 0, r: 0 } },
];

const sameTruth = (a: Truth, b: Truth) => a.r === b.r && (a.r === 0 || (a.theta === b.theta && (a.theta % 180 === 0 || a.phi === b.phi)));
/** The name of the preset these settings match, or null. At the center θ and φ do not matter; at a pole φ does not. */
export const presetAt = (t: Truth): string | null => PRESETS.find((p) => sameTruth(p.t, t))?.name ?? null;

/** Minus sign U+2212, two decimals, never "-0.00". */
export const num = (x: number): string => {
  const s = Math.abs(x).toFixed(2);
  return (x < 0 && s !== '0.00' ? '−' : '') + s;
};
/** A complex number to two decimals, like "0.25 − 0.13i". */
export const cnum = (z: C): string => (Math.abs(z.im) < 0.005 ? num(z.re) : `${num(z.re)} ${z.im < 0 ? '−' : '+'} ${Math.abs(z.im).toFixed(2)}i`);
/** A distance: three decimals when small, so a shrinking error stays visible. */
export const dist = (x: number): string => (x < 0.1 ? x.toFixed(3) : x.toFixed(2));
/** An eigenvalue to two decimals; a negative one too small to show says "just below 0" so it never reads as "0.00" or "−0.00". */
export const eigText = (x: number): string => (x < 0 && x > -0.005 ? 'just below 0' : num(x));
/** "(0.50, −0.12, 0.00)" */
export const vecText = (v: Vec3): string => `(${v.map(num).join(', ')})`;

/** What the source makes, in words, with its start state. */
export function stateName(t: Truth): string {
  const p = PRESETS.find((x) => sameTruth(x.t, t));
  if (p) return `${p.name} (${p.said})`;
  if (t.r === 100) {
    const pole = t.theta === 0 || t.theta === 180;
    return `the pure state cos(θ/2)|0⟩ + e^{iφ} sin(θ/2)|1⟩ with θ = ${t.theta}°${pole ? '' : `, φ = ${t.phi}°`}`;
  }
  return `a mixed state with Bloch length ${(t.r / 100).toFixed(2)}, pointing at θ = ${t.theta}°, φ = ${t.phi}°`;
}

/** Names of the chosen bases, like "X, Y and Z". */
export function chosenText(chosen: Chosen): string {
  const names = AXES.filter((_, k) => chosen[k]);
  return names.length < 2 ? names.join('') : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}

/** The words for the live region: the source, the shots, the rebuild, whether it is a state, and the error. */
export function describe(t: Truth, chosen: Chosen, tally: Tally): string {
  const name = stateName(t), shots = tally.total.reduce((a, b) => a + b, 0);
  const made = `Each fresh copy is made as ${name}.`;
  if (!chosen.some(Boolean)) return `${made} Pick at least one basis to measure in.`;
  if (shots === 0) return `${made} Press Run: every copy is measured once, in one of ${chosenText(chosen)}, and the counts rebuild the state.`;
  const v = truthVec(t), a = estimate(tally), l = len(a), n = Math.max(...tally.total);
  const parts = [`${made} ${n} shots in ${chosen.filter(Boolean).length > 1 ? 'each of ' : ''}${chosenText(chosen)} (${shots} copies in all).`, `Rebuilt Bloch vector ${vecText(a)}, length ${num(l)}.`];
  if (isState(a)) parts.push('That is a state, inside the ball.');
  else parts.push(`The length is above 1, so the rebuilt matrix is not a state: it has a negative eigenvalue (${eigText(eigenvalues(a)[1])}), a negative chance for some measurement. Rounded to the nearest state, on the surface at ${vecText(roundVec(a))}.`);
  const missing = AXES.filter((_, k) => !chosen[k]);
  if (missing.length) {
    const some = consistentSet(a, chosen, 1).length > 0;
    parts.push(some
      ? `${missing.join(' and ')} not measured: counted as 0 here, but any value that stays in the ball matches the data equally well.`
      : `${missing.join(' and ')} not measured. Even with the missing ${missing.length > 1 ? 'values' : 'value'} at 0 the point is outside the ball, so no state matches these numbers exactly.`);
  }
  const raw = isState(a)
    ? `Trace distance from the rebuilt state to the truth: ${dist(traceDistance(a, v))}.`
    : `Trace distance from the rounded state to the truth: ${dist(traceDistance(roundVec(a), v))}. The raw matrix is not a state, so its error is a ${RAW_ERROR_LABEL.replace(' (raw matrix, may not be a state)', '')}: ${dist(traceDistance(a, v))}.`;
  parts.push(`True Bloch vector ${vecText(v)}. ${raw}`);
  return parts.join(' ');
}
