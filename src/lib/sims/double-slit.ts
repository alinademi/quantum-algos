// Double slit: photons one at a time through two slits onto a far screen (Fraunhofer, small angles).
// Pure math only. The tool passes in `rand`, so tests can replay shots with a seed.
// Lengths are in millimeters. Formulas: OpenStax University Physics 3, sections 3.2, 4.2 and 4.3.
import { abs2, conj, expi, mul, scale, type C } from '../quantum.ts';

/** Green light, 500 nm. */
export const LAMBDA = 500e-6;
/** Width a of each slit: 0.020 mm, as in OpenStax Example 4.4. */
export const WIDTH = 0.02;
/** Distance L from the slits to the screen: 1 m. */
export const SCREEN = 1000;
/** Width of the middle band to its first zero, each side: lambda L / a = 25 mm. */
export const BAND = (LAMBDA * SCREEN) / WIDTH;
/** The tool shows the screen from -EDGE to EDGE: out to the second zero of the one-slit pattern, 50 mm. */
export const EDGE = 2 * BAND;
/** Slit spacing d (centre to centre) the reader can pick, in micrometres. 200 um is OpenStax Example 4.4. */
export const SPACING_UM = { min: 40, max: 200, step: 10, start: 100 } as const;

/** sin(x)/x, with its limit 1 at x = 0. */
export const sinc = (x: number): number => (Math.abs(x) < 1e-8 ? 1 - (x * x) / 6 : Math.sin(x) / x);

/** One-slit phase beta = pi a y / (lambda L). The one-slit pattern is sinc(beta)^2. */
export const beta = (y: number): number => (Math.PI * WIDTH * y) / (LAMBDA * SCREEN);

/** Phase gap between the two paths at screen point y: 2 pi (path difference d y / L) / lambda. */
export const phaseGap = (y: number, d: number): number => (2 * Math.PI * d * y) / (LAMBDA * SCREEN);

/** Nominal gap between bright stripes: lambda L / d, from d y / L = m lambda. These are the peaks of the cos^2 factor; the one-slit band can shift the true maxima a little. */
export const stripeGap = (d: number): number => (LAMBDA * SCREEN) / d;

/**
 * Amplitudes to reach screen point y through slit 1 (at x = +d/2) and slit 2 (at x = -d/2).
 * Each slit is passed with amplitude 1/sqrt(2); then each path has the one-slit shape sinc(beta)
 * and the phase 2 pi (extra length) / lambda. The path from x is -x y / L longer than the middle path,
 * which gives e^(-i phi/2) for slit 1 and e^(+i phi/2) for slit 2.
 */
export function paths(y: number, d: number): [C, C] {
  const s = Math.SQRT1_2 * sinc(beta(y)), h = phaseGap(y, d) / 2;
  return [scale(expi(-h), s), scale(expi(h), s)];
}

/**
 * Relative intensity at screen point y, up to one constant factor (the same for every y). It is not a probability: it peaks at 2, and a point has a probability density, not a chance.
 * A marker at the slits ends in state |m1> or |m2>; overlap = <m1|m2>, a real number from 0 to 1.
 * P(y) = |psi1|^2 + |psi2|^2 + 2 Re(conj(psi1) psi2) <m1|m2>.
 * overlap 1: no record, so this is |psi1 + psi2|^2. overlap 0: a full record, so this is |psi1|^2 + |psi2|^2.
 */
export function intensity(y: number, d: number, overlap = 1): number {
  const [a, b] = paths(y, d);
  return abs2(a) + abs2(b) + 2 * overlap * mul(conj(a), b).re;
}

/** The largest value intensity() can take: sinc^2 <= 1 and 1 + overlap cos(phi) <= 1 + overlap. */
export const intensityMax = (overlap = 1): number => 1 + overlap;

/** Simpson's rule for f on [lo, hi] with n (even) steps. */
export function integrate(f: (y: number) => number, lo: number, hi: number, n = 64): number {
  const h = (hi - lo) / n;
  let s = f(lo) + f(hi);
  for (let k = 1; k < n; k++) s += f(lo + k * h) * (k % 2 ? 4 : 2);
  return (s * h) / 3;
}

/** Which of `bins` equal strips of the shown screen holds point y. */
export const binOf = (y: number, bins: number): number => Math.min(bins - 1, Math.max(0, Math.floor(((y + EDGE) / (2 * EDGE)) * bins)));

/** Chance that a photon, given that it lands on the shown screen, lands in each strip. Sums to 1. */
export function binProbs(d: number, overlap: number, bins: number): number[] {
  const w = (2 * EDGE) / bins;
  const raw = Array.from({ length: bins }, (_, i) => integrate((y) => intensity(y, d, overlap), -EDGE + i * w, -EDGE + (i + 1) * w, 16));
  const total = raw.reduce((t, p) => t + p, 0);
  return raw.map((p) => p / total);
}

/**
 * Where one photon lands, from -EDGE to EDGE mm, drawn with the Born-rule odds above.
 * Rejection sampling: pick a point evenly, keep it with chance P(y) / max. Exact, with no grid.
 */
export function sampleY(d: number, overlap: number, rand: () => number): number {
  const top = intensityMax(overlap);
  for (;;) {
    const y = (rand() * 2 - 1) * EDGE;
    if (rand() * top < intensity(y, d, overlap)) return y;
  }
}

/** Height on the plate, in beam widths: a bell curve cut at 2.4. Picture only: the slits are tall, so stripes run up and down. */
export function spread(rand: () => number): number {
  for (;;) {
    let u = 0;
    while (u === 0) u = rand();
    const v = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rand());
    if (Math.abs(v) <= 2.4) return v;
  }
}

/** Photons per second while firing: starts at 6 so the first dots land one by one, then speeds up, at most 9,600. */
export const rate = (landed: number): number => Math.min(9600, 6 + landed);

// ---- Words for the readout

/** Millimeters with a fixed number of decimals: mm(0.1, 2) is "0.10 mm". */
export const mm = (x: number, digits: number): string => `${x.toFixed(digits)} mm`;

/** What the screen shows, in words. With `landed`, it starts with the photon count. */
export function describe(d: number, marked: boolean, landed?: number): string {
  const count = landed === undefined ? '' : `${landed.toLocaleString('en')} photon${landed === 1 ? '' : 's'} so far. `;
  return count + (marked
    ? `Slits ${mm(d, 2)} apart, and a marker records which slit each photon takes. The two paths can now be told apart, so their chances add, not their amplitudes. Nothing cancels, so the stripes vanish. What is left is the pattern of one slit alone: a broad band.`
    : `Slits ${mm(d, 2)} apart, and nothing records which slit each photon takes. The amplitudes for the two paths add, so they build up in some places and cancel in others: bright stripes about ${mm(stripeGap(d), 1)} apart.`);
}
