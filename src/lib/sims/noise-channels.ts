// Common noise channels: the pure math behind the NoiseChannels tool. No DOM.
// Sources: Wilde, Quantum Information Theory (arXiv:1106.1445), Section 4.7: bit flip (4.330), phase flip (4.332, 4.339),
// Pauli channels (4.342, 4.343), depolarizing (4.344 to 4.347), amplitude damping (4.350 to 4.356, Exercise 4.7.8).
// Watrous, Understanding Quantum Information and Computation, Quantum channel basics: Examples of qubit channels.
// Nielsen and Chuang, Section 8.3.
// Conventions:
// - A qubit density matrix is rho = (I + xX + yY + zZ)/2, and (x, y, z) is its Bloch vector: +z is |0>, +x is |+>, +y is |+i>.
// - A channel acts as rho -> sum_k K rho K^dagger, with sum_k K^dagger K = I (its Kraus operators).
// - p is the chance that the noise acts. Bit flip: X with chance p (Wilde 4.330; Nielsen and Chuang count 1 - p instead, for the phase flip too).
//   Phase flip: Z with chance p (Wilde 4.332). Depolarizing: the qubit is replaced by I/2 with chance p (Wilde 4.344,
//   Watrous's Omega_eps). Amplitude damping: |1> decays to |0> with chance gamma = p (Wilde 4.350 to 4.354).
// - The slider runs in hundredths, so p is k/100 for whole k from 0 to 100.
// - Angles the reader sees are whole degrees.
import { c, add, mul, scale, conj, inner, matVec, matMul, dagger, bloch, fromBloch, I, X, Y, Z, type C, type Matrix, type State } from '../quantum.ts';

export type Vec = [number, number, number];
export type Channel = 'bit' | 'phase' | 'depol' | 'damp';

const RAD = Math.PI / 180;
// Float dust: cos(90°) is 6e-17, not 0. Below this we call a number exactly 0.
const DUST = 1e-12;
const clean = (x: number) => (Math.abs(x) < DUST ? 0 : x);

/** Copies in one measured batch. */
export const COPIES = 100;
/** The strength slider, in hundredths: p = k/100. */
export const STRENGTH = { min: 0, max: 100, step: 1, start: 20 } as const;
/** The default view: turned about z, then tilted above the equator, in degrees. Turned 60°, the x axis lies mostly across the screen. */
export const YAW = 60, TILT = 20;

// ---- 2x2 matrix helpers (quantum.ts has the products; these add and scale)

const madd = (a: Matrix, b: Matrix): Matrix => a.map((row, i) => row.map((x, j) => add(x, b[i][j])));
const mscale = (m: Matrix, k: number): Matrix => m.map((row) => row.map((x) => scale(x, k)));
const trace = (m: Matrix): C => add(m[0][0], m[1][1]);
/** |psi><psi| */
export const outer = (s: State): Matrix => s.map((a) => s.map((b) => mul(a, conj(b))));

// ---- Density matrices and Bloch vectors

/** rho = (I + xX + yY + zZ)/2. */
export const rhoOf = ([x, y, z]: Vec): Matrix =>
  mscale([mscale(I, 1), mscale(X, x), mscale(Y, y), mscale(Z, z)].reduce(madd), 0.5);

/** The Bloch vector (Tr X rho, Tr Y rho, Tr Z rho) of a qubit density matrix. */
export const blochOf = (rho: Matrix): Vec => [X, Y, Z].map((s) => clean(trace(matMul(s, rho)).re)) as Vec;

/** Length of a Bloch vector: 1 on the surface (a pure state), 0 at the center (the fully mixed state I/2). */
export const length = (v: Vec): number => Math.hypot(v[0], v[1], v[2]);

/** Purity Tr rho^2 = (1 + |r|^2)/2: 1 for a pure state, 1/2 for I/2. */
export const purity = (rho: Matrix): number => trace(matMul(rho, rho)).re;

// ---- The four channels

/** The Kraus operators of each channel at strength p, from 0 to 1. */
export function kraus(ch: Channel, p: number): Matrix[] {
  const k = (m: Matrix, w: number) => mscale(m, Math.sqrt(w));
  switch (ch) {
    case 'bit': return [k(I, 1 - p), k(X, p)];
    case 'phase': return [k(I, 1 - p), k(Z, p)];
    // (1 - p) rho + p I/2 = (1 - 3p/4) rho + (p/4)(X rho X + Y rho Y + Z rho Z), Wilde 4.346.
    case 'depol': return [k(I, 1 - (3 * p) / 4), k(X, p / 4), k(Y, p / 4), k(Z, p / 4)];
    // K0 = |0><0| + sqrt(1 - gamma)|1><1| keeps |0> and shrinks |1>; K1 = sqrt(gamma)|0><1| is the decay, Wilde 4.350, 4.354 (Wilde names these A1 and A0, in the other order).
    case 'damp': return [[[c(1), c(0)], [c(0), c(Math.sqrt(1 - p))]], [[c(0), c(Math.sqrt(p))], [c(0), c(0)]]];
  }
}

/** sum_k K rho K^dagger */
export const applyKraus = (ks: readonly Matrix[], rho: Matrix): Matrix => ks.map((K) => matMul(matMul(K, rho), dagger(K))).reduce(madd);

/** Where the channel sends the point v of the Bloch ball, computed on the density matrix with the Kraus operators. */
export const after = (ch: Channel, p: number, v: Vec): Vec => blochOf(applyKraus(kraus(ch, p), rhoOf(v)));

/** The same map in closed form: r -> (a x, b y, c z) + shift. Wilde 4.339, 4.343, 4.347 and 4.356. */
export function affine(ch: Channel, p: number): { scale: Vec; shift: Vec } {
  const f = 1 - 2 * p, d = Math.sqrt(1 - p);
  switch (ch) {
    case 'bit': return { scale: [1, f, f], shift: [0, 0, 0] };
    case 'phase': return { scale: [f, f, 1], shift: [0, 0, 0] };
    case 'depol': return { scale: [1 - p, 1 - p, 1 - p], shift: [0, 0, 0] };
    case 'damp': return { scale: [d, d, 1 - p], shift: [0, 0, p] };
  }
}

/** The image of the Bloch sphere: an ellipsoid with these semi-axes along x, y, z, around this center. */
export function shape(ch: Channel, p: number): { axes: Vec; center: Vec } {
  const { scale: s, shift } = affine(ch, p);
  return { axes: s.map((x) => Math.abs(clean(x))) as Vec, center: shift };
}

// ---- Start states and one measured copy

/** The six start states, at the ends of the axes. Each copy is measured in the basis of its start state. */
export const STARTS = [
  { name: '|0⟩', other: '|1⟩', basis: '0/1', theta: 0, phi: 0 },
  { name: '|1⟩', other: '|0⟩', basis: '0/1', theta: 180, phi: 0 },
  { name: '|+⟩', other: '|−⟩', basis: '+/−', theta: 90, phi: 0 },
  { name: '|−⟩', other: '|+⟩', basis: '+/−', theta: 90, phi: 180 },
  { name: '|+i⟩', other: '|−i⟩', basis: '+i/−i', theta: 90, phi: 90 },
  { name: '|−i⟩', other: '|+i⟩', basis: '+i/−i', theta: 90, phi: 270 },
] as const;

/** Start state i as amplitudes: cos(θ/2)|0⟩ + e^{iφ} sin(θ/2)|1⟩. */
export const ket = (i: number): State => fromBloch(STARTS[i].theta * RAD, STARTS[i].phi * RAD).map((a) => c(clean(a.re), clean(a.im)));

/** Start state i as a point, from its amplitudes: (2 Re a*b, 2 Im a*b, |a|² − |b|²). */
export const startPoint = (i: number): Vec => bloch(ket(i)).map(clean) as Vec;

/**
 * Born rule for one copy: prepared as start state i, sent through the channel, then measured in the basis {start, opposite}.
 * The chance it gives the start state is <psi| E(|psi><psi|) |psi>, which equals (1 + n·r')/2 with n the start point and
 * r' the output point. Float dust next to 0 or 1 is set to 0 or 1.
 */
export function keepChance(ch: Channel, p: number, i: number): number {
  const psi = ket(i), out = applyKraus(kraus(ch, p), outer(psi)), v = inner(psi, matVec(out, psi)).re;
  return v < DUST ? 0 : v > 1 - DUST ? 1 : v;
}

/**
 * One batch of fresh copies. Copy j gives the start state when its own uniform draw us[j] (in [0, 1)) is below the keep
 * chance, so each copy gives it with exactly that chance (Born rule). The draws stay fixed while the settings change, so a
 * copy flips only when the chance passes its draw: nothing is re-rolled.
 */
export const results = (us: readonly number[], keep: number): boolean[] => us.map((u) => u < keep);

export const kept = (rs: readonly boolean[]): number => rs.filter(Boolean).length;

// ---- Words and numbers the tool shows

const MINUS = '−';

/** A real number to two decimals with a true minus sign, never "−0.00". */
export function num(x: number): string {
  const s = Math.abs(x).toFixed(2);
  return x < 0 && s !== '0.00' ? MINUS + s : s;
}

/** A point as text: "(0.00, 0.00, 0.60)". */
export const vecText = (v: Vec): string => `(${v.map(num).join(', ')})`;

/** A length to two decimals that never shows 1.00 for a state that is not pure, or 0.00 for one that is not fully mixed. */
export function lenText(v: Vec): string {
  const r = length(v);
  if (Math.abs(r - 1) < 1e-9) return '1';
  if (r < 1e-9) return '0';
  if (r >= 0.995) return 'over 0.99';
  if (r < 0.005) return 'under 0.01';
  return r.toFixed(2);
}

/** Whole-percent chances of the start state and the opposite one. They add to 100, and a real chance never shows as 0% or 100%. */
export function percents(p: number): [string, string] {
  if (p >= 1) return ['100%', '0%'];
  if (p <= 0) return ['0%', '100%'];
  if (p >= 0.995) return ['over 99%', 'under 1%'];
  if (p < 0.005) return ['under 1%', 'over 99%'];
  const a = Math.round(p * 100);
  return [`${a}%`, `${100 - a}%`];
}

/** The noise strength as text: "0.20". */
export const strength = (p: number): string => p.toFixed(2);

/** How each channel is named and explained in the tool. */
export const CHANNELS: Record<Channel, { name: string; phrase: string; sym: string; slider: string; what: string }> = {
  bit: {
    name: 'Bit flip', phrase: 'a bit flip', sym: 'p', slider: 'Flip chance p',
    what: 'With chance p, an X gate hits the qubit: 0 and 1 swap. States on the x axis stay put.',
  },
  phase: {
    name: 'Phase flip', phrase: 'a phase flip', sym: 'p', slider: 'Flip chance p',
    what: 'Also called dephasing. With chance p, a Z gate hits the qubit: 0 and 1 stay, but the amplitude for 1 changes sign. You never learn whether it hit, so superpositions fade; at p = 1 it always hits, a known Z gate. States on the z axis stay put.',
  },
  depol: {
    name: 'Depolarizing', phrase: 'depolarizing noise', sym: 'p', slider: 'Replace chance p',
    what: 'With chance p, the qubit is swapped for the fully mixed state I/2, which gives plain 50/50 odds in every basis.',
  },
  damp: {
    name: 'Amplitude damping', phrase: 'amplitude damping', sym: 'γ', slider: 'Decay chance γ',
    what: 'Energy loss: with chance γ, the excited state 1 decays to 0. The state 0 stays put.',
  },
};

/** What the channel does to the whole ball, in words. */
export function shapeText(ch: Channel, p: number): string {
  if (p === 0) return 'No noise: the ball is unchanged.';
  const { scale: s, shift } = affine(ch, p);
  if (ch === 'bit' || ch === 'phase') {
    const f = clean(s[ch === 'bit' ? 1 : 0]), axis = ch === 'bit' ? 'x' : 'z', rest = ch === 'bit' ? 'y and z' : 'x and y';
    const gate = ch === 'bit' ? 'an X' : 'a Z', ends = ch === 'bit' ? '|−⟩ to |+⟩' : '|1⟩ to |0⟩';
    if (f === 0) return `The ball is squashed onto the ${axis} axis: a line from ${ends}.`;
    if (f === -1) return `Every copy gets ${gate}, which is just a gate: the ball is turned half a turn about the ${axis} axis, not shrunk.`;
    if (f > 0) return `The ball is squeezed into a cigar along the ${axis} axis: ${rest} shrink to ${num(f)}.`;
    return `The ball is squeezed into a cigar along the ${axis} axis and turned half a turn about it: ${rest} shrink to ${num(-f)} and change sign, since most copies get ${gate}.`;
  }
  if (ch === 'depol') {
    if (p === 1) return 'The ball shrinks to its center, the fully mixed state I/2.';
    return `The ball shrinks evenly to a smaller ball of radius ${num(s[0])}.`;
  }
  if (p === 1) return 'The ball shrinks to the single point |0⟩: every state ends as |0⟩.';
  return `The ball shrinks and slides up toward |0⟩: x and y shrink to ${num(s[0])}, z to ${num(s[2])}, and the center moves up to z = ${num(shift[2])}. The state |0⟩ stays put.`;
}

const same = (a: Vec, b: Vec) => a.every((x, k) => Math.abs(x - b[k]) < 1e-9);

/** A name for the point, if it has one: the center, or one of the six start states. */
function named(v: Vec): string {
  if (length(v) < 1e-9) return ': the center, the fully mixed state I/2';
  const i = STARTS.findIndex((_, k) => same(startPoint(k), v));
  return i < 0 ? '' : `: the state ${STARTS[i].name}`;
}

/** The slider's spoken value. */
export function valueText(ch: Channel, p: number, i: number): string {
  return `${strength(p)}. Started as ${STARTS[i].name}, a copy gives ${STARTS[i].name} with chance ${percents(keepChance(ch, p, i))[0]}.`;
}

/** The readout: the setup, what happens to the ball and the start point, the Born-rule odds, and the counts of one batch. */
export function describe(ch: Channel, p: number, i: number, got?: number, n = COPIES): string {
  const s = STARTS[i], C = CHANNELS[ch], v = startPoint(i), w = after(ch, p, v), keep = keepChance(ch, p, i), [a, b] = percents(keep);
  const head = `Started as ${s.name}, then ${C.phrase} with ${C.sym} = ${strength(p)}.`;
  const point = same(v, w)
    ? `The point stays at ${vecText(w)}${p === 0 ? '' : `: this noise leaves ${s.name} alone`}.`
    : `The point moves from ${vecText(v)} to ${vecText(w)}, length ${lenText(w)}${named(w)}.`;
  const odds = keep === 1 ? `Measured in the ${s.basis} basis, every copy gives ${s.name}.`
    : keep === 0 ? `Measured in the ${s.basis} basis, every copy gives ${s.other}.`
    : `Measured in the ${s.basis} basis, a copy gives ${s.name} with chance ${a} and ${s.other} with chance ${b}.`;
  let tail = '';
  if (got !== undefined) {
    tail = got === n ? ` Of ${n} fresh copies, all ${n} gave ${s.name}.`
      : got === 0 ? ` Of ${n} fresh copies, all ${n} gave ${s.other}.`
      : ` Of ${n} fresh copies, ${got} gave ${s.name} and ${n - got} gave ${s.other}.`;
  }
  return `${head} ${shapeText(ch, p)} ${point} ${odds}${tail}`;
}

// ---- Drawing math: the view and the dots that draw the sphere (the same camera as the Bloch sphere stop)

export type Camera = { right: Vec; up: Vec; toward: Vec };

/** A camera at azimuth yaw (turned about z, from +x toward +y) and elevation tilt above the equator, in degrees. */
export function camera(yaw: number, tilt: number): Camera {
  const a = yaw * RAD, e = tilt * RAD, ca = Math.cos(a), sa = Math.sin(a), ce = Math.cos(e), se = Math.sin(e);
  return { right: [-sa, ca, 0], up: [-se * ca, -se * sa, ce], toward: [ce * ca, ce * sa, se] };
}

const dot3 = (a: Vec, b: Vec) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

/** Orthographic view of a point: x to the right and y up on screen, in sphere radii, and depth toward the viewer (front > 0). */
export const project = (v: Vec, cam: Camera): { x: number; y: number; depth: number } =>
  ({ x: dot3(v, cam.right), y: dot3(v, cam.up), depth: dot3(v, cam.toward) });

/** n points spread evenly over the unit sphere (a Fibonacci lattice). They draw the sphere: they are not shots. */
export function spherePoints(n: number): Vec[] {
  const turn = Math.PI * (3 - Math.sqrt(5));
  return Array.from({ length: n }, (_, k) => {
    const z = 1 - (2 * k + 1) / n, r = Math.sqrt(1 - z * z);
    return [r * Math.cos(k * turn), r * Math.sin(k * turn), z] as Vec;
  });
}

/** Any angle in degrees to [0, 360). */
export const wrap = (deg: number): number => ((deg % 360) + 360) % 360;
