// Bases: measure one qubit along any axis of the Bloch sphere. Pure math for the BasisMeter tool. No DOM.
// Conventions:
// - A basis is a pair of orthonormal states {|b0>, |b1>}: two opposite ends of one axis on the Bloch sphere.
// - The axis is set by two angles in degrees: `tilt` from |0> (polar angle theta) and `turn` around the Z axis,
//   from |+> toward |+i> (azimuth phi). Its b0 end is the state fromBloch(theta, phi) of quantum.ts.
// - Born rule in a basis: outcome k has chance |<b_k|psi>|^2, and the qubit is then |b_k>
//   (de Wolf, Quantum Computing: Lecture Notes, 1.2.2; MS Katas, single_qubit_measurements).
import { c, H, S, RY, RZ, abs2, bloch, dagger, draw, fromBloch, inner, matMul, ket0, ket1, plus, minus, type Matrix, type State } from '../quantum.ts';

export type Vec3 = [number, number, number];
export type Bit = 0 | 1;
export type Axis = { tilt: number; turn: number };
export type BasisName = 'Z' | 'X' | 'Y';
export type StateId = '0' | '1' | '+' | '-' | '+i' | '-i';

const RAD = Math.PI / 180;
const S2 = Math.SQRT1_2;
const DUST = 1e-12;
/** Float dust to exact values: 6e-17 becomes 0, 1 - 1e-16 becomes 1. */
const clean = (p: number) => (Math.abs(p) < DUST ? 0 : Math.abs(1 - p) < DUST ? 1 : p);

/** Shots one press of the big button measures. */
export const BATCH = 100;
/** Each pile is COLS dots wide and ROWS dots tall, so it can hold every shot: CAP in all. */
export const COLS = 20;
export const ROWS = 25;
export const CAP = COLS * ROWS;

// ---- The six start states: the ends of the X, Y and Z axes.

export const STATE_IDS: readonly StateId[] = ['0', '1', '+', '-', '+i', '-i'];

/** |0>, |1>, |+>, |->, |+i> = (|0> + i|1>)/√2 and |-i> = (|0> - i|1>)/√2 (Watrous's names for the Y basis). */
export function startState(id: StateId): State {
  switch (id) {
    case '0': return ket0();
    case '1': return ket1();
    case '+': return plus();
    case '-': return minus();
    case '+i': return [c(S2), c(0, S2)];
    case '-i': return [c(S2), c(0, -S2)];
  }
}

/** Each start state with its Bloch vector, for the picture. Tested against bloch(startState(id)). */
export const CARDINAL: readonly [StateId, Vec3][] = [['0', [0, 0, 1]], ['1', [0, 0, -1]], ['+', [1, 0, 0]], ['-', [-1, 0, 0]], ['+i', [0, 1, 0]], ['-i', [0, -1, 0]]];

/** The ket as text, with a true minus sign: "|0⟩", "|−i⟩". */
export const ketText = (id: StateId): string => `|${id.replace('-', '−')}⟩`;

// ---- Bases as axes

/** The three named bases as axes. Z: |0>, |1>. X: |+>, |->. Y: |+i>, |-i>. */
export const NAMED: Record<BasisName, Axis> = { Z: { tilt: 0, turn: 0 }, X: { tilt: 90, turn: 0 }, Y: { tilt: 90, turn: 90 } };

/** Which named basis this axis is, with b0 at the named + end, or null. At tilt 0 the turn does not move the axis. */
export function named(a: Axis): BasisName | null {
  if (a.tilt === 0) return 'Z';
  if (a.tilt === 90 && a.turn === 0) return 'X';
  if (a.tilt === 90 && a.turn === 90) return 'Y';
  return null;
}

/** Unit vector of the axis toward its b0 end: (sin θ cos φ, sin θ sin φ, cos θ). */
export function direction(a: Axis): Vec3 {
  const t = a.tilt * RAD, f = a.turn * RAD;
  return [Math.sin(t) * Math.cos(f), Math.sin(t) * Math.sin(f), Math.cos(t)];
}

/** The two basis states: b0 at the axis end, b1 at the opposite point of the sphere, which is orthogonal to b0. */
export function ends(a: Axis): [State, State] {
  const t = a.tilt * RAD, f = a.turn * RAD;
  return [fromBloch(t, f), fromBloch(Math.PI - t, f + Math.PI)];
}

/** Born rule in the basis: [|<b0|ψ>|², |<b1|ψ>|²]. They add to 1. */
export function odds(s: State, a: Axis): [number, number] {
  const [b0, b1] = ends(a);
  return [clean(abs2(inner(b0, s))), clean(abs2(inner(b1, s)))];
}

const dotv = (u: Vec3, v: Vec3) => u[0] * v[0] + u[1] * v[1] + u[2] * v[2];

/** Angle on the Bloch sphere, in degrees, between the state and the b0 end. The chance of b0 is cos²(angle/2). */
export function angle(s: State, a: Axis): number {
  return Math.acos(Math.max(-1, Math.min(1, dotv(bloch(s), direction(a))))) / RAD;
}

/** Odds from the picture alone: (1 + r·n)/2 for Bloch vector r and axis n. Same as odds(), used to test it. */
export const oddsFromBloch = (s: State, a: Axis): [number, number] => {
  const p = clean((1 + dotv(bloch(s), direction(a))) / 2);
  return [p, clean(1 - p)];
};

/** Names of the two outcomes: the basis kets for Z, X and Y, else b₀ and b₁. */
export function outcomes(a: Axis): [string, string] {
  switch (named(a)) {
    case 'Z': return ['|0⟩', '|1⟩'];
    case 'X': return ['|+⟩', '|−⟩'];
    case 'Y': return ['|+i⟩', '|−i⟩'];
    default: return ['b₀', 'b₁'];
  }
}

// ---- How a circuit does it: a gate U with U|b0> = |0> and U|b1> = |1> (up to phase), then a standard measurement.

const SDG: Matrix = dagger(S);

/** Gates applied before a standard 0 or 1 measurement, in time order, and their product U.
 *  Z: none. X: H. Y: S†, then H. Any other axis: RZ(−turn), then RY(−tilt). */
export function recipe(a: Axis): { gates: string[]; U: Matrix } {
  const n = named(a);
  if (n === 'Z') return { gates: [], U: [[c(1), c(0)], [c(0), c(1)]] };
  if (n === 'X') return { gates: ['H'], U: H };
  if (n === 'Y') return { gates: ['S†', 'H'], U: matMul(H, SDG) };
  const gates = [...(a.turn ? [`RZ(−${a.turn}°)`] : []), `RY(−${a.tilt}°)`];
  return { gates, U: matMul(RY(-a.tilt * RAD), RZ(-a.turn * RAD)) };
}

/** One line on how a circuit measures in this basis. */
export function recipeText(a: Axis): string {
  const g = recipe(a).gates;
  if (!g.length) return 'In a circuit this is the standard measurement: it reads 0 or 1 directly.';
  return `In a circuit: ${g.join(', then ')}, then the standard 0 or 1 measurement. Result 0 means ${outcomes(a)[0]}, 1 means ${outcomes(a)[1]}.`;
}

// ---- Shots

/** n fresh copies, each measured once: a Born-rule draw of outcome 0 (b0) or 1 (b1). */
export const shoot = (p: [number, number], n: number, rand: () => number): Bit[] =>
  Array.from({ length: n }, () => draw(p, rand) as Bit);

/** How many shots the next press may add without passing the cap. */
export const room = (total: number, want: number): number => Math.max(0, Math.min(want, CAP - total));

/** Expected count of an outcome with chance p over n shots: n p. The tool marks it on each pile. */
export const expected = (n: number, p: number): number => n * p;

/** Whole-percent odds of b0 and b1. They add to 100, and never show a false 0% or 100%. */
export function oddsText(p0: number): [string, string] {
  const p = clean(p0);
  if (p === 1) return ['100%', '0%'];
  if (p === 0) return ['0%', '100%'];
  if (p > 0.99) return ['over 99%', 'under 1%'];
  if (p < 0.01) return ['under 1%', 'over 99%'];
  const a = Math.round(p * 100);
  return [`${a}%`, `${100 - a}%`];
}

/** Degrees as text: "90°", or "about 55°" when not a whole number. */
export function degText(d: number): string {
  const r = Math.round(d);
  return Math.abs(d - r) < 1e-6 ? `${r}°` : `about ${r}°`;
}

/** How it was measured, in words: "in the X basis: |+⟩ or |−⟩", or "along your own axis (tilt 30°, turn 45°): b₀ or b₁". */
export function basisText(a: Axis): string {
  const n = named(a), [o0, o1] = outcomes(a);
  return n ? `in the ${n} basis: ${o0} or ${o1}` : `along your own axis (tilt ${a.tilt}°, turn ${a.turn}°): ${o0} or ${o1}`;
}

/** The readout: what the canvas shows, in words. Odds and angle are exact math; counts are the shots so far. */
export function describe(id: StateId, a: Axis, counts: [number, number]): string {
  const s = startState(id), [p0] = odds(s, a), [o0, o1] = outcomes(a), [t0, t1] = oddsText(p0);
  const head = `Started as ${ketText(id)}, measured ${basisText(a)}. Odds: ${t0} ${o0}, ${t1} ${o1}. The state is ${degText(angle(s, a))} from ${o0} on the Bloch sphere.`;
  const n = counts[0] + counts[1];
  const shots = n === 0 ? 'Press a Measure button to test fresh copies.'
    : n === 1 ? `1 fresh copy gave ${counts[0] ? o0 : o1}.`
    : `Of ${n} fresh copies, ${counts[0]} gave ${o0} and ${counts[1]} gave ${o1}.`;
  return `${head} ${shots}${n >= CAP ? ' The piles are full.' : ''}`;
}

// ---- Drawing math for the sphere picture (a fixed camera, orthographic)

/** Camera: azimuth 25° and elevation 18°, so +x points to the lower left, +y to the right and +z up, as in most Bloch pictures. */
const AZ = 25 * RAD, EL = 18 * RAD;
const RIGHT: Vec3 = [-Math.sin(AZ), Math.cos(AZ), 0];
const UP: Vec3 = [-Math.sin(EL) * Math.cos(AZ), -Math.sin(EL) * Math.sin(AZ), Math.cos(EL)];
const TOWARD: Vec3 = [Math.cos(EL) * Math.cos(AZ), Math.cos(EL) * Math.sin(AZ), Math.sin(EL)];

/** A point on or in the sphere to [screen x (right), screen y (up), depth (toward the viewer)]. A pure rotation. */
export const view = (v: Vec3): Vec3 => [dotv(v, RIGHT), dotv(v, UP), dotv(v, TOWARD)];

/** k + 1 points along the short great-circle arc from unit vector u to unit vector w. Empty when the arc is not unique. */
export function arc(u: Vec3, w: Vec3, k: number): Vec3[] {
  const om = Math.acos(Math.max(-1, Math.min(1, dotv(u, w))));
  if (om < 1e-9 || Math.PI - om < 1e-9) return [];
  return Array.from({ length: k + 1 }, (_, i) => {
    const t = i / k, a = Math.sin((1 - t) * om) / Math.sin(om), b = Math.sin(t * om) / Math.sin(om);
    return [a * u[0] + b * w[0], a * u[1] + b * w[1], a * u[2] + b * w[2]] as Vec3;
  });
}

/** Bloch vector of a start state, for the picture. */
export const point = (id: StateId): Vec3 => bloch(startState(id));
