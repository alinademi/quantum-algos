// Hadamard: the pure math behind the Hadamard mirror tool. No DOM.
// The qubit's start state has real amplitudes: cos(t/2)|0> + sin(t/2)|1>, with t in whole degrees from -179 to 180.
// On the picture (a slice of the Bloch sphere) t is the angle clockwise from the top: t = 0 is |0>, 90 is |+>,
// 180 is |1> and -90 is |->. The point is (x, z) = (sin t, cos t), so the chance of 0 is (1 + z)/2 and of + is (1 + x)/2.
// H sends the Bloch point (x, y, z) to (z, -y, x): a half turn about the axis halfway between x and z.
// On this slice that is a mirror across the 45 degree line, so t becomes 90 - t.
// Two measurements: Z asks 0 or 1, X asks + or -. After one H, the Z odds are the old X odds and the X odds are the old Z odds,
// because P(0 after H) = |<0|H|psi>|^2 = |<+|psi>|^2 and H = H^dagger (de Wolf, Quantum Computing: Lecture Notes, 1.4; Watrous, Single systems).
import { H, abs2, bloch, fromBloch, inner, matVec, minus, plus, probs, type State } from '../quantum.ts';
import { pct } from '../draw.ts';

/** Fresh copies in each of the four piles. */
export const SHOTS = 100;
/** The slider runs from MIN to MAX degrees. -180 is left out because it is the same state as 180 (both are |1>, up to a sign). */
export const MIN = -179;
export const MAX = 180;
/** Preset buttons. */
export const PRESETS: readonly { angle: number; name: string }[] = [
  { angle: 0, name: '|0⟩' }, { angle: 90, name: '|+⟩' }, { angle: 180, name: '|1⟩' }, { angle: -90, name: '|−⟩' },
];

const rad = (deg: number) => (deg * Math.PI) / 180;
// Float dust: cos(pi/2) is 6e-17, not 0. Odds are rounded to 12 places, so dust can never move a dot.
const tidy = (p: number) => Math.round(p * 1e12) / 1e12;

/** An angle in degrees, wrapped to -179 ... 180. */
export const wrapAngle = (deg: number): number => {
  const w = ((Math.round(deg) % 360) + 360) % 360;
  return w > 180 ? w - 360 : w;
};

// ---- States and the gate

/** The start state at angle t: cos(t/2)|0> + sin(t/2)|1>. */
export const startState = (t: number): State => fromBloch(rad(t), 0);

/** One Hadamard gate. */
export const hadamard = (s: State): State => matVec(H, s);

/** Where the picture's point goes: H turns the angle t into 90 - t, a mirror across the 45 degree line. */
export const mirrorAngle = (t: number): number => wrapAngle(90 - t);

/** The picture's point (x, z) of a state with real amplitudes: x to the right (toward |+>), z up (toward |0>). */
export const point = (s: State): [number, number] => {
  const [x, , z] = bloch(s);
  return [x, z];
};

/** The state is on the mirror line, so H leaves it as it is (up to a global sign): t = 45, or t = -135 (the opposite end). */
export const onMirror = (t: number): boolean => t === 45 || t === -135;

// ---- What the two measurements give (Born rule: probability is |amplitude|^2)

/** Z measurement: [chance of 0, chance of 1]. */
export const oddsZ = (s: State): number[] => probs(s).map(tidy);

/** X measurement: [chance of +, chance of -], that is |<+|psi>|^2 and |<-|psi>|^2. */
export const oddsX = (s: State): number[] => [abs2(inner(plus(), s)), abs2(inner(minus(), s))].map(tidy);

export type Cell = 'zBefore' | 'xBefore' | 'zAfter' | 'xAfter';
export const CELLS: readonly Cell[] = ['zBefore', 'xBefore', 'zAfter', 'xAfter'];

/** Everything the tool shows for start angle t. */
export function view(t: number) {
  const before = startState(t), after = hadamard(before), twice = hadamard(after);
  return {
    before, after, twice,
    odds: { zBefore: oddsZ(before), xBefore: oddsX(before), zAfter: oddsZ(after), xAfter: oddsX(after) } as Record<Cell, number[]>,
  };
}

// ---- Shots

/**
 * How many of the first n copies gave the first outcome. Copy i gives it when its own uniform draw us[i] (in [0, 1))
 * is below p, which happens with chance p (Born rule). The draws stay fixed, so a copy changes result only when p passes its draw.
 */
export function zeros(us: readonly number[], p: number, n = us.length): number {
  let z = 0;
  for (let i = 0; i < n; i++) if (us[i] < p) z++;
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

/** The name of the state when it has one: the four preset states. */
export const nameOf = (t: number): string | null => PRESETS.find((p) => p.angle === t)?.name ?? null;

/** The state as a ket with two decimals and a true minus sign, like "0.95|0⟩ + 0.32|1⟩". */
export function ketText(t: number): string {
  const [a, b] = startState(t);
  return `${a.re.toFixed(2)}|0⟩ ${b.re < 0 ? '−' : '+'} ${Math.abs(b.re).toFixed(2)}|1⟩`;
}

/** What the slider says to a screen reader. */
export const sliderText = (t: number): string => {
  const name = nameOf(t);
  return name ? `${t} degrees, the state ${name}` : `${t} degrees, the state ${ketText(t)}`;
};

/** Odds in words: "always 0", or "0 with chance 50%, 1 with chance 50%". */
export function oddsText(p: number[], a: string, b: string): string {
  if (p[0] >= 1) return `always ${a}`;
  if (p[1] >= 1) return `always ${b}`;
  return `${a} with chance ${pct(p[0])}, ${b} with chance ${pct(p[1])}`;
}

/** Plural counts: "1 zero", "52 zeros". */
const count = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/**
 * The readout: start state, the Born-rule odds of both measurements before and after one H, the swap, the way back,
 * and this batch's counts. counts holds, per pile in CELLS order, how many copies gave the first outcome.
 */
export function readout(t: number, counts: Record<Cell, number>, n = SHOTS): string {
  const v = view(t), name = nameOf(t);
  const start = name ? `Start state ${name}.` : `Start state ${ketText(t)}, a state with real amplitudes.`;
  const parts = [
    start,
    `Before the gate: Z measurement, ${oddsText(v.odds.zBefore, '0', '1')}. X measurement, ${oddsText(v.odds.xBefore, '+', '−')}.`,
    `After one H: Z measurement, ${oddsText(v.odds.zAfter, '0', '1')}. X measurement, ${oddsText(v.odds.xAfter, '+', '−')}.`,
  ];
  if (onMirror(t)) parts.push('This state sits on the mirror line, so H leaves it as it is, up to a global sign. The two measurements already give the same odds.');
  else parts.push('H swapped the odds of the two measurements.');
  parts.push('A second H takes the qubit back to the start state.');
  parts.push(
    `This batch, ${n} copies in each pile. Before: Z ${count(counts.zBefore, 'zero', 'zeros')} and ${count(n - counts.zBefore, 'one', 'ones')}, X ${count(counts.xBefore, 'plus', 'pluses')} and ${count(n - counts.xBefore, 'minus', 'minuses')}.` +
    ` After: Z ${count(counts.zAfter, 'zero', 'zeros')} and ${count(n - counts.zAfter, 'one', 'ones')}, X ${count(counts.xAfter, 'plus', 'pluses')} and ${count(n - counts.xAfter, 'minus', 'minuses')}.`,
  );
  return parts.join(' ');
}
