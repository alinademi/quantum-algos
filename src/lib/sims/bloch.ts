// Bloch sphere stop: the pure math behind the BlochSphere tool. No DOM.
// The state cos(θ/2)|0⟩ + e^{iφ} sin(θ/2)|1⟩ is the point (sin θ cos φ, sin θ sin φ, cos θ) on the unit sphere:
// +z is |0⟩, +x is |+⟩, +y is |+i⟩ (N&C 1.2; Watrous, Understanding Quantum Information and Computation,
// Density matrices: Bloch sphere). Angles are whole degrees at the edges (sliders, text), radians inside.
import { c, abs, arg, bloch, fromBloch, normalize, probs, type C, type State } from '../quantum.ts';

export type Vec = [number, number, number];
export type Angles = { theta: number; phi: number };

const RAD = Math.PI / 180;
// Float dust: cos(90°) is 6e-17, not 0. Below this we call it exactly 0.
const DUST = 1e-12;
const clean = (x: number) => (Math.abs(x) < DUST ? 0 : x);
/** Any angle in degrees to [0, 360). */
export const wrap = (deg: number): number => ((deg % 360) + 360) % 360;

// ---- The state and its point

/** The state at polar angle theta (0 to 180, down from |0⟩) and azimuth phi (around from |+⟩ toward |+i⟩), in degrees. */
export const stateAt = (theta: number, phi: number): State =>
  fromBloch(theta * RAD, phi * RAD).map((a) => c(clean(a.re), clean(a.im)));

/** The point for (theta, phi) in degrees, from the angles: (sin θ cos φ, sin θ sin φ, cos θ). */
export function point(theta: number, phi: number): Vec {
  const t = theta * RAD, p = phi * RAD;
  return [clean(Math.sin(t) * Math.cos(p)), clean(Math.sin(t) * Math.sin(p)), clean(Math.cos(t))];
}

/** The point the tool draws, computed from the state's amplitudes: (2 Re a*b, 2 Im a*b, |a|² − |b|²). */
export const pointOf = (theta: number, phi: number): Vec => bloch(stateAt(theta, phi)).map(clean) as Vec;

/** Born rule odds [P(0), P(1)] = [|a|², |b|²] for the state at (theta, phi). */
export const odds = (theta: number, phi: number): [number, number] => {
  const [p0, p1] = probs(stateAt(theta, phi));
  return [p0, p1];
};

/** The angles of any one-qubit pure state, in degrees, after its global phase is dropped. At a pole phi has no meaning; it is set to 0. */
export function angles(s: State): Angles {
  const [a, b] = normalize(s), ra = abs(a), rb = abs(b);
  const theta = (2 * Math.atan2(rb, ra)) / RAD;
  return { theta, phi: ra < 1e-9 || rb < 1e-9 ? 0 : wrap((arg(b) - arg(a)) / RAD) };
}

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

/** The named state at these whole-degree angles, or null. At a pole every phi gives the same point. */
export const nameAt = (theta: number, phi: number): string | null =>
  NAMED.find((n) => n.theta === theta && (pole(theta) || n.phi === wrap(phi)))?.name ?? null;

// ---- Measured copies

/** Copies in one measured batch. */
export const COPIES = 100;

/**
 * One batch of fresh copies, each measured once in the 0/1 basis. Copy i gives 0 when its own uniform
 * draw us[i] (in [0, 1)) is below p0, so each copy gives 0 with chance p0 (Born rule). The draws stay
 * fixed while the angles change, so a copy flips only when p0 passes its draw: nothing is re-rolled.
 */
export const results = (us: readonly number[], p0: number): (0 | 1)[] => us.map((u) => (u < p0 ? 0 : 1));

export const zerosIn = (rs: readonly number[]): number => rs.filter((r) => r === 0).length;

// ---- Words and numbers the tool shows

const MINUS = '−';

/** A real number to two decimals with a true minus sign, never "−0.00". */
export function num(x: number): string {
  const s = Math.abs(x).toFixed(2);
  return x < 0 && s !== '0.00' ? MINUS + s : s;
}

/** A complex amplitude to two decimals: "0.71", "−0.71i", "(0.35 + 0.35i)". */
export function amp(z: C): string {
  const re = num(z.re), im = num(z.im);
  if (im === '0.00') return re;
  if (re === '0.00') return im + 'i';
  return `(${re} ${im.startsWith(MINUS) ? MINUS : '+'} ${im.replace(MINUS, '')}i)`;
}

/** The ket, e.g. "|ψ⟩ = 0.87|0⟩ + (0.35 + 0.35i)|1⟩". The amplitude of 0 is cos(θ/2), never negative. */
export function ket(theta: number, phi: number): string {
  const [a, b] = stateAt(theta, phi), B = amp(b), neg = B.startsWith(MINUS);
  return `|ψ⟩ = ${amp(a)}|0⟩ ${neg ? MINUS : '+'} ${neg ? B.slice(1) : B}|1⟩`;
}

/** The point as text: "(0.61, 0.61, 0.50)". */
export const vecText = (v: Vec): string => `(${v.map(num).join(', ')})`;

/** Whole-percent odds of 0 and of 1. They add to 100, and a real chance is never shown as 0% or 100%. */
export function percents(p0: number): [string, string] {
  if (p0 >= 1 - DUST) return ['100%', '0%'];
  if (p0 <= DUST) return ['0%', '100%'];
  if (p0 > 0.99) return ['over 99%', 'under 1%'];
  if (p0 < 0.01) return ['under 1%', 'over 99%'];
  const a = Math.round(p0 * 100);
  return [`${a}%`, `${100 - a}%`];
}

/** Where the point is, in words. */
export function place(theta: number, phi: number): string {
  if (theta === 0) return 'The point is at the top: the state |0⟩. Here φ does not appear in the state at all.';
  if (theta === 180) return 'The point is at the bottom: the state |1⟩. Here φ only adds a global phase, which no measurement can see.';
  const half = theta === 90 ? 'on the equator' : theta < 90 ? 'on the top half' : 'on the bottom half';
  const name = nameAt(theta, phi);
  return `The point is ${theta}° down from |0⟩ and ${wrap(phi)}° around from |+⟩, ${half}${name ? `: the state ${name}` : ''}.`;
}

const tally = (zeros: number, n: number): string =>
  zeros === n ? `all ${n} gave 0` : zeros === 0 ? `all ${n} gave 1` : `${zeros} gave 0 and ${n - zeros} gave 1`;

/** The readout: where the point is, the odds its height gives, and the counts from one measured batch. */
export function describe(theta: number, phi: number, zeros?: number, n = COPIES): string {
  const [p0, p1] = percents(odds(theta, phi)[0]);
  let s = `${place(theta, phi)} Its height is z = ${num(pointOf(theta, phi)[2])}, so the odds are ${p0} for 0 and ${p1} for 1.`;
  if (zeros !== undefined) s += ` Of ${n} fresh copies, each measured once, ${tally(zeros, n)}.`;
  return s;
}

// ---- Moving between states (presets glide; the path is only for the eye, not a gate)

/** Whole-degree angles a fraction f (0 to 1) of the way from a to b: theta straight, phi the short way round.
 *  Leaving a pole, phi starts at b's value; heading to a pole, phi keeps a's value until the end. There phi does not move the point. */
export function between(a: Angles, b: Angles, f: number): Angles {
  if (f >= 1) return { theta: b.theta, phi: wrap(b.phi) };
  const theta = Math.round(a.theta + (b.theta - a.theta) * f);
  if (pole(a.theta)) return { theta, phi: wrap(b.phi) };
  if (pole(b.theta)) return { theta, phi: wrap(a.phi) };
  const d = wrap(b.phi - a.phi + 180) - 180;
  return { theta, phi: wrap(Math.round(a.phi + d * f)) };
}

// ---- Drawing math: the view and the dots that draw the sphere

export type Camera = { right: Vec; up: Vec; toward: Vec };

/** A camera at azimuth yaw (turned about z, from +x toward +y) and elevation tilt above the equator, in degrees. */
export function camera(yaw: number, tilt: number): Camera {
  const a = yaw * RAD, e = tilt * RAD, ca = Math.cos(a), sa = Math.sin(a), ce = Math.cos(e), se = Math.sin(e);
  return { right: [-sa, ca, 0], up: [-se * ca, -se * sa, ce], toward: [ce * ca, ce * sa, se] };
}

const dot3 = (a: Vec, b: Vec) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

/** Orthographic view of a point: x to the right and y up on screen, in sphere radii, and depth toward the viewer (front > 0). */
export const project = (p: Vec, cam: Camera): { x: number; y: number; depth: number } =>
  ({ x: dot3(p, cam.right), y: dot3(p, cam.up), depth: dot3(p, cam.toward) });

/** n points spread evenly over the unit sphere (a Fibonacci lattice). They only draw the sphere: they are not states or shots. */
export function spherePoints(n: number): Vec[] {
  const turn = Math.PI * (3 - Math.sqrt(5));
  return Array.from({ length: n }, (_, k) => {
    const z = 1 - (2 * k + 1) / n, r = Math.sqrt(1 - z * z);
    return [r * Math.cos(k * turn), r * Math.sin(k * turn), z] as Vec;
  });
}
