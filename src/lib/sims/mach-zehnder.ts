// Mach-Zehnder interferometer: the pure math behind the MachZehnder tool. No DOM.
// Source: Zwiebach, MIT 8.04 (2016), Chapter 2, Section 1. The tool passes in `rand`, so tests can replay shots with a seed.
// Conventions:
// - The photon's path is qubit 0: |0> = upper arm, |1> = lower arm. After the second beam splitter, |0> goes to D0, |1> to D1.
// - The photon starts in the upper input, |0>.
// - Each beam splitter is balanced and acts as the Hadamard gate H, Zwiebach's eq. (1.14): from above, s = t = 1/sqrt2;
//   from below, u = 1/sqrt2 and v = -1/sqrt2 (that reflection adds the minus sign).
// - The phase shifter sits in the lower arm and multiplies its amplitude by e^{i phi} (Zwiebach, Figure 2): the gate P(phi).
// - The marker is qubit 1, started as |0>. A photon in the lower arm turns it by RY(theta); the upper arm leaves it alone.
//   So the arms leave it in |m0> = |0> or |m1> = RY(theta)|0>, with overlap <m0|m1> = cos(theta/2): 1 is no record, 0 a full one.
// Angles the reader sees are in whole degrees.
import { c, add, mul, scale, expi, H, P, RY, apply1, controlled, basis, probs, type C, type State } from '../quantum.ts';

const RAD = Math.PI / 180;

/** Photons in one run. Each tray holds them all, in case every one reaches the same detector. */
export const SHOTS = 200;
/** The phase slider, in degrees. */
export const PHASE = { min: 0, max: 360, step: 1, start: 0 } as const;
/** Preset phases: D1 dark, an even split, D0 dark. */
export const PRESETS: readonly number[] = [0, 90, 180];

export type Port = 0 | 1;

// Float dust: cos(pi/2) is 6e-17, not 0. Below this we call a chance exactly 0.
const DUST = 1e-12;

/** The marker's turn, in radians, that leaves overlap <m0|m1> = cos(theta/2) between the two arms' records. */
export const markTurn = (overlap: number): number => 2 * Math.acos(Math.min(1, Math.max(0, overlap)));

/** The path inside the arms, after the first beam splitter: H|0> = (|0> + |1>)/sqrt2. */
export const inArms = (): State => apply1(basis(1, 0), H, 0);

/**
 * The photon and the marker at the detectors, a two-qubit state (path, marker), built gate by gate:
 * first beam splitter H, the marker turn if the lower arm, the phase shifter P(phi) on the lower arm, second beam splitter H.
 */
export function atDetectors(deg: number, overlap = 1): State {
  let s = basis(2, 0);
  s = apply1(s, H, 0);
  s = controlled(s, RY(markTurn(overlap)), [0], 1);
  s = apply1(s, P(deg * RAD), 0);
  return apply1(s, H, 0);
}

/** Born rule: chances that D0 and D1 click, summed over the marker. They add to 1, and float dust is set to 0. */
export function chances(deg: number, overlap = 1): [number, number] {
  const p = probs(atDetectors(deg, overlap));
  const raw = [p[0] + p[1], p[2] + p[3]], t = raw[0] + raw[1];
  const [a, b] = raw.map((x) => (x / t < DUST ? 0 : x / t));
  return a === 0 ? [0, 1] : b === 0 ? [1, 0] : [a, b];
}

/** The closed form: p(D0) = (1 + v cos phi)/2 and p(D1) = (1 - v cos phi)/2, with v the overlap <m0|m1>. */
export const formula = (deg: number, overlap = 1): [number, number] => {
  const k = overlap * Math.cos(deg * RAD);
  return [(1 + k) / 2, (1 - k) / 2];
};

/** With no mark, the amplitudes at D0 and D1: (1 + e^{i phi})/2 and (1 - e^{i phi})/2. */
export const amplitudes = (deg: number): [C, C] => {
  const e = expi(deg * RAD);
  return [scale(add(c(1), e), 0.5), scale(add(c(1), scale(e, -1)), 0.5)];
};

/** The two ways into detector x, through the upper arm and through the lower arm: the products of the amplitudes along each. */
export const ways = (deg: number, x: Port): [C, C] => [
  mul(H[x][0], H[0][0]),
  mul(mul(H[x][1], expi(deg * RAD)), H[1][0]),
];

/** Fringe visibility (max - min)/(max + min) of p(D0) as the phase turns: the max is at 0 degrees, the min at 180. */
export const visibility = (overlap: number): number => {
  const hi = chances(0, overlap)[0], lo = chances(180, overlap)[0];
  return (hi - lo) / (hi + lo);
};

/** One photon: D0 with chance p0, else D1 (Born rule). */
export const detect = (p0: number, rand: () => number): Port => (rand() < p0 ? 0 : 1);

/** Counts at D0 and D1 over n photons, drawn one at a time. */
export function fire(n: number, deg: number, overlap: number, rand: () => number): [number, number] {
  const [p0] = chances(deg, overlap), n0 = Array.from({ length: n }, () => detect(p0, rand)).filter((x) => x === 0).length;
  return [n0, n - n0];
}

/** Photons per second while a run lands: 4 at first, so the first few arrive one by one, then faster, at most 240. */
export const rate = (landed: number): number => Math.min(240, 4 + 2 * landed);

// ---- Words the tool shows

/** Whole-percent chances of D0 and D1. They add to 100, and a real chance never shows as 0% or 100%. */
export function percents(p0: number): [string, string] {
  if (p0 <= 0) return ['0%', '100%'];
  if (p0 >= 1) return ['100%', '0%'];
  if (p0 < 0.005) return ['under 1%', 'over 99%'];
  if (p0 >= 0.995) return ['over 99%', 'under 1%'];
  const a = Math.round(p0 * 100);
  return [`${a}%`, `${100 - a}%`];
}

/** The setup and its predicted odds in words, then the counts once a run is done. */
export function report(deg: number, marked: boolean, got?: readonly [number, number]): string {
  const [p0, p1] = chances(deg, marked ? 0 : 1), [a, b] = percents(p0);
  const head = marked ? `Path marked, phase ${deg}°.` : `No mark, phase ${deg}°.`;
  const why = marked ? `The record of the arm stops the canceling: ${a} at D0, ${b} at D1, at any phase.`
    : p1 === 0 ? 'The two ways to D1 cancel, so D1 never clicks: 100% at D0.'
    : p0 === 0 ? 'The two ways to D0 cancel, so D0 never clicks: 100% at D1.'
    : `Predicted: ${a} at D0, ${b} at D1.`;
  const tail = got ? ` Got ${got[0]} at D0 and ${got[1]} at D1, out of ${got[0] + got[1]} photons.` : '';
  return `${head} ${why}${tail}`;
}

/** The slider's spoken value. */
export function valueText(deg: number, marked: boolean): string {
  const [a, b] = percents(chances(deg, marked ? 0 : 1)[0]);
  return `${deg} degrees. Predicted: ${a} at D0, ${b} at D1.`;
}

// ---- Picture layout, in CSS pixels

/** Parts of the drawing in arm units, with y down: the arms form a diamond between the two beam splitters. */
export const PARTS = {
  source: [-2, -1], bs1: [-1, 0], mirrorUp: [0, -1], mirrorDown: [0, 1], bs2: [1, 0], d0: [2, -1], d1: [2, 1],
  shifter: [-0.5, 0.5], marker: [0.5, 0.5],
} as const;
/** The drawing with its labels spans x from -HALF_W to HALF_W and y from -HALF_H to HALF_H arm units. */
export const HALF_W = 2.35, HALF_H = 1.5;
/** Height of the label line above each tray, the gap between blocks, the inner margin, and the width at which trays move beside the detectors. */
export const LABEL = 18, GAP = 12, PAD = 12, WIDE = 600;

export type Grid = { rows: number; cols: number; pitch: number };
export type Tray = Grid & { x: number; y: number; w: number };
export type Layout = { w: number; h: number; u: number; ox: number; oy: number; trays: [Tray, Tray] };

/** Dot grid for a tray w px wide and at most hMax px tall that holds n dots, filled column by column:
 *  the largest pitch, from max down to min px, that fits. */
export function trayGrid(w: number, n: number, hMax: number, min = 4.5, max = 9): Grid {
  for (let pitch = max; ; pitch -= 0.25) {
    const rows = Math.ceil(n / Math.max(1, Math.floor(w / pitch)));
    if (rows * pitch <= hMax || pitch - 0.25 < min) return { rows, cols: Math.ceil(n / rows), pitch };
  }
}

/** Where things go on a canvas w px wide. Wide: trays beside D0 and D1. Narrow: trays under the drawing. Returns the height too. */
export function layout(w: number, n = SHOTS): Layout {
  const inner = w - 2 * PAD;
  if (w >= WIDE) {
    const u = Math.min(72, inner / 2 / (2 * HALF_W)), ox = PAD + HALF_W * u, oy = PAD + HALF_H * u;
    const x = ox + 2.5 * u, tw = w - PAD - x;
    const g = trayGrid(tw, n, u + PAD - LABEL), th = LABEL + g.rows * g.pitch;
    const tray = (dy: number): Tray => ({ ...g, x, y: oy + dy * u - th / 2, w: tw });
    return { w, h: 2 * oy, u, ox, oy, trays: [tray(PARTS.d0[1]), tray(PARTS.d1[1])] };
  }
  const u = Math.min(64, inner / (2 * HALF_W)), top = PAD + 2 * HALF_H * u;
  const g = trayGrid(inner, n, 64), th = LABEL + g.rows * g.pitch;
  const tray = (k: number): Tray => ({ ...g, x: PAD, y: top + GAP + k * (th + GAP), w: inner });
  return { w, h: top + 2 * (GAP + th) + PAD, u, ox: w / 2, oy: PAD + HALF_H * u, trays: [tray(0), tray(1)] };
}
