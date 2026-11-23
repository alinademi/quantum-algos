// Phase: the pure math behind the Phase dials tool. No DOM.
// The qubit started as 0, then a Hadamard gate: |+> = (|0> + |1>)/sqrt2.
// A relative phase r turns only the amplitude of 1 (the phase gate P(r)); a global phase g turns both:
//   |psi> = e^{ig} (|0> + e^{ir}|1>)/sqrt2.
// Two batches of fresh copies are measured: one right away, one after a second Hadamard gate.
// Angles are in degrees, as on the sliders. Amplitude angles count counterclockwise from the positive real axis.
import { H, P, ket0, matVec, mul, expi, probs, arg, abs, bloch, type C, type State } from '../quantum.ts';

/** Fresh copies in each batch. */
export const SHOTS = 100;
/** Preset angles for both sliders. */
export const PRESETS: readonly number[] = [0, 90, 180, 270];

// Float dust: cos(pi/2) is 6e-17, not 0. Odds are rounded to 12 places, so dust can never move a dot.
const DUST = 1e-12;
const tidy = (p: number) => Math.round(p * 1e12) / 1e12;
const rad = (deg: number) => (deg * Math.PI) / 180;

/** Whole degrees from 0 to 359, so 360 and -90 read as 0 and 270. */
export const wrapDeg = (deg: number): number => ((Math.round(deg) % 360) + 360) % 360;

// ---- The state

/** Started as 0, then a Hadamard gate: |+>. */
export const plusState = (): State => matVec(H, ket0());

/** |+>, then a relative phase r (degrees) on the amplitude of 1, then a global phase g (degrees) on both. */
export function prepare(g: number, r: number): State {
  const turn = expi(rad(g));
  return matVec(P(rad(r)), plusState()).map((a) => mul(turn, a));
}

/** A second Hadamard gate. */
export const hadamard = (s: State): State => matVec(H, s);

// ---- What you can measure (Born rule: probability is |amplitude|^2)

/** Odds of 0 and 1 when measured right away. */
export const oddsNow = (s: State): number[] => probs(s).map(tidy);

/** Odds of 0 and 1 after a second Hadamard gate. For this qubit, P(0) = cos^2(r/2) = (1 + cos r)/2. */
export const oddsAfterH = (s: State): number[] => probs(hadamard(s)).map(tidy);

/** Top view of the Bloch sphere, (x, y). A global phase does not move it; a relative phase turns it about the z axis. */
export const blochTop = (s: State): [number, number] => {
  const [x, y] = bloch(s);
  return [x, y];
};

// ---- What the pictures show (not measurable on their own)

/** Angle of one amplitude in whole degrees, 0 to 359. */
export const phaseDeg = (a: C): number => wrapDeg((arg(a) * 180) / Math.PI);

/** Relative phase: angle of the amplitude of 1 minus angle of the amplitude of 0, 0 to 359. Null if either amplitude is 0. */
export const relativeDeg = (s: State): number | null =>
  abs(s[0]) < DUST || abs(s[1]) < DUST ? null : wrapDeg(((arg(s[1]) - arg(s[0])) * 180) / Math.PI);

/** An amplitude in polar form: size to two decimals, angle in whole degrees. */
export const polar = (a: C): { size: string; deg: number } => ({ size: abs(a).toFixed(2), deg: phaseDeg(a) });

// ---- Shots

/**
 * How many of the first n copies gave 0. Copy i gives 0 when its own uniform draw us[i] (in [0, 1)) is below p0,
 * which happens with chance p0 (Born rule). The draws stay fixed, so a copy changes result only when p0 passes its draw.
 */
export function zeros(us: readonly number[], p0: number, n = us.length): number {
  let z = 0;
  for (let i = 0; i < n; i++) if (us[i] < p0) z++;
  return z;
}

/** Biggest dot pitch (at most maxPitch) that fits n dots in a w by h box, filled row by row from the bottom. */
export function pileGrid(w: number, h: number, n: number, maxPitch = 12): { cols: number; rows: number; pitch: number } {
  if (w <= 0 || h <= 0 || n <= 0) return { cols: 1, rows: Math.max(0, n), pitch: 0 };
  let pitch = Math.min(maxPitch, Math.sqrt((w * h) / n));
  while (pitch > 0.5 && Math.floor(w / pitch) * Math.floor(h / pitch) < n) pitch *= 0.98;
  const cols = Math.max(1, Math.floor(w / pitch));
  return { cols, rows: Math.ceil(n / cols), pitch };
}

// ---- Words

/** Whole-percent chance that never shows a false 0% or 100%. */
export function pct(p: number): string {
  if (p <= 0) return '0%';
  if (p >= 1) return '100%';
  if (p < 0.01) return 'under 1%';
  if (p > 0.99) return 'over 99%';
  return `${Math.round(p * 100)}%`;
}

/** The odds of 0 in words. */
export const chance0 = (p0: number): string => (p0 >= 1 ? 'always 0' : p0 <= 0 ? 'always 1' : `${pct(p0)} chance of 0`);

const count = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/** The name of the state, up to a global phase, when it has one here. */
const named = (r: number): string | null => (wrapDeg(r) === 0 ? '|+⟩' : wrapDeg(r) === 180 ? '|−⟩' : null);

/** What a slider says to a screen reader as it moves. Slider values run 0 to 360 and are shown as set. */
export const globalText = (g: number): string => `${g} degrees. No odds change.`;
export const relativeText = (g: number, r: number): string =>
  `${r} degrees. After a Hadamard gate: ${chance0(oddsAfterH(prepare(g, r))[0])}.`;

/** The readout: the state, the Born-rule odds and this batch's counts, in words. */
export function readout(g: number, r: number, zNow: number, zAfterH: number, n = SHOTS): string {
  const s = prepare(g, r), a = polar(s[0]), b = polar(s[1]), name = named(r), gw = wrapDeg(g);
  const batch = (z: number) => `This batch of ${n} gave ${count(z, 'zero', 'zeros')} and ${count(n - z, 'one', 'ones')}.`;
  const parts = [
    `Global phase ${g}°, relative phase ${r}°.`,
    `Both amplitudes have size ${a.size}. The one for 0 points at ${a.deg}°, the one for 1 at ${b.deg}°.`,
    `Measure now: ${chance0(oddsNow(s)[0])}. ${batch(zNow)}`,
    `Hadamard gate, then measure: ${chance0(oddsAfterH(s)[0])}. ${batch(zAfterH)}`,
  ];
  if (name) {
    const who = gw === 0 ? `This is ${name}.` : gw === 180 ? `This is −1 times ${name}, the same state as ${name}.` : `This is ${name} times a global phase, the same state as ${name}.`;
    parts.push(`${who} A Hadamard gate sends it to ${name === '|+⟩' ? 0 : 1} every time.`);
  }
  if (wrapDeg(r) === 90 || wrapDeg(r) === 270) parts.push('After a Hadamard gate, 90° and 270° give the same odds. Measuring in another basis tells them apart.');
  return parts.join(' ');
}
