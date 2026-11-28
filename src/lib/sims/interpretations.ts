// Interpretations: one two-slit run, told five ways. The pure math behind the tool. No DOM.
// Conventions:
// - Model units with hbar = m = 1, so the picture is not to scale. x runs across the screen; time t runs from the
//   slits (t = 0) to the screen (t = T).
// - Start: each shot sends one object at two slits, with equal amplitudes for the two. Each slit gives a Gaussian
//   packet at rest, width SIGMA, centred at LEFT = -D/2 or RIGHT = +D/2. Free flight spreads each packet. Where they
//   overlap, the two contributions to the amplitude add or cancel, and stripes form.
// - Born rule: a dot lands at x with density |psi(x, T)|^2. A shot is one uniform number u in (0, 1), and the dot
//   lands at x = Q_T(u), where Q_t is the quantile function (inverse CDF) of |psi(x, t)|^2. This is inverse-CDF sampling:
//   exact up to the step of the CDF table (screenTable: 8000 steps, CDF error below 1e-4).
// - Copenhagen-style views, many worlds, the pilot wave and QBism all keep the standard rules, so they use the same
//   rule for the same u: the same dot. They differ only in the story told about it. (Reading one number the same way is
//   how the tool shows that the odds agree. It is not a claim that a hidden number sits behind a Copenhagen-style dot.)
// - Pilot wave (de Broglie-Bohm): the object has a place at all times and moves by dx/dt = Im(psi_x / psi).
//   In one dimension the continuity equation keeps the CDF fixed along a path, F_t(x(t)) = u, so the path that starts
//   at quantile u is x(t) = Q_t(u). Starting with |psi|^2 odds, it stays with |psi|^2 odds (equivariance).
// - Collapse (GRW): each particle is hit at random times, LAMBDA per second, and its wave is multiplied by a Gaussian of
//   width R_C. N particles moved together on two paths more than R_C apart: any hit picks one path, so a hit comes
//   at rate N LAMBDA. The tool imagines the paths kept apart for APART seconds. With no hit (chance e^{-N LAMBDA APART})
//   the wave reaches the screen whole. After a hit the object is on one path (chance 1/2 each) and shows that path's
//   broad band alone. Values: SEP "Collapse Theories", section 5 (f = 1e-16 per second, d = 1e-5 cm).
import { abs2, add, c, conj, expi, mul, scale, type C } from '../quantum.ts';

// ---- The two-slit wave (model units)

/** Width of each packet at the slits. */
export const SIGMA = 1;
/** Slit spacing, centre to centre. */
export const D = 20;
/** Centres of the left and right packets. */
export const LEFT = -D / 2, RIGHT = D / 2;
/** Flight time from the slits to the screen. */
export const T = 60;

/** Spreading time scale: tau = t / (2 sigma^2) (with hbar = m = 1). */
export const tau = (t: number): number => t / (2 * SIGMA * SIGMA);

/** Standard deviation of one packet's |g|^2 at time t: sigma sqrt(1 + tau^2). */
export const width = (t: number): number => SIGMA * Math.sqrt(1 + tau(t) ** 2);

/** <g_left|g_right>: real, exp(-D^2 / (8 sigma^2)), and the same at every time (the flight is unitary). */
export const OVERLAP = Math.exp(-(D * D) / (8 * SIGMA * SIGMA));

/** 1 / sqrt(2 (1 + overlap)): makes psi = g_left + g_right a unit vector. */
const NORM = 1 / Math.sqrt(2 * (1 + OVERLAP));

/** One free packet at rest, centred at a, at time t:
 *  g(x, t) = (2 pi sigma^2)^(-1/4) (1 + i tau)^(-1/2) exp(-(x - a)^2 / (4 sigma^2 (1 + i tau))). */
export function packet(x: number, t: number, a: number): C {
  const tt = tau(t), q = 1 + tt * tt, dx = x - a, s2 = SIGMA * SIGMA;
  const size = (2 * Math.PI * s2 * q) ** -0.25 * Math.exp(-(dx * dx) / (4 * s2 * q));
  return scale(expi((dx * dx * tt) / (4 * s2 * q) - Math.atan(tt) / 2), size);
}

/** d/dx of one packet: -(x - a) / (2 sigma^2 (1 + i tau)) times the packet. */
export function packetDx(x: number, t: number, a: number): C {
  const tt = tau(t), k = -(x - a) / (2 * SIGMA * SIGMA * (1 + tt * tt));
  return mul(c(k, -k * tt), packet(x, t, a));
}

/** The wave after both slits: psi = (g_left + g_right) / sqrt(2 (1 + overlap)). */
export const psi = (x: number, t: number): C => scale(add(packet(x, t, LEFT), packet(x, t, RIGHT)), NORM);

/** d psi / dx. */
export const psiDx = (x: number, t: number): C => scale(add(packetDx(x, t, LEFT), packetDx(x, t, RIGHT)), NORM);

/** Born rule density |psi(x, t)|^2. */
export const density = (x: number, t: number): number => abs2(psi(x, t));

/** One packet's density |g(x, t)|^2: a bell curve centred at a with standard deviation width(t). */
export const packetDensity = (x: number, t: number, a: number): number => abs2(packet(x, t, a));

/** Pilot-wave velocity dx/dt = Im(psi_x / psi) = Im(psi_x conj(psi)) / |psi|^2 (hbar = m = 1). */
export function velocity(x: number, t: number): number {
  const p = psi(x, t), dp = psiDx(x, t);
  return mul(dp, conj(p)).im / abs2(p);
}

/** Stripe wavenumber at time t: the phase of g_right minus that of g_left is -k x, with k = D tau / (2 sigma^2 (1 + tau^2)).
 *  So the cross term 2 Re(conj(g_left) g_right) = 2 |g_left| |g_right| cos(k x). */
export const fringeK = (t: number): number => (D * tau(t)) / (2 * SIGMA * SIGMA * (1 + tau(t) ** 2));

/** True where the two contributions add on the screen (cos(k x) > 0): the bright bands of standard quantum mechanics. */
export const bright = (x: number): boolean => Math.cos(fringeK(T) * x) > 0;

// ---- Distribution tables: CDF and quantile

/** A density sampled on n equal steps of [lo, hi]. F is its CDF (trapezoid rule), scaled to end at 1; total is the
 *  integral before scaling. */
export type Table = { lo: number; hi: number; n: number; h: number; F: Float64Array; total: number };

export function cdfTable(f: (x: number) => number, lo: number, hi: number, n = 2000): Table {
  const h = (hi - lo) / n, F = new Float64Array(n + 1);
  let prev = f(lo);
  for (let i = 1; i <= n; i++) {
    const v = f(lo + i * h);
    F[i] = F[i - 1] + ((prev + v) * h) / 2;
    prev = v;
  }
  const total = F[n];
  for (let i = 1; i <= n; i++) F[i] /= total;
  return { lo, hi, n, h, F, total };
}

/** Q(u): the x where the CDF reaches u, by bisection and a straight line between grid points. */
export function quantile(tab: Table, u: number): number {
  let a = 0, b = tab.n;
  while (b - a > 1) {
    const m = (a + b) >> 1;
    if (tab.F[m] <= u) a = m; else b = m;
  }
  const gap = tab.F[b] - tab.F[a];
  return tab.lo + tab.h * (a + (gap > 0 ? Math.min(1, Math.max(0, (u - tab.F[a]) / gap)) : 0));
}

/** F(x), the CDF at x: 0 below the table, 1 above it, a straight line between grid points. */
export function cdfAt(tab: Table, x: number): number {
  if (x <= tab.lo) return 0;
  if (x >= tab.hi) return 1;
  const s = (x - tab.lo) / tab.h, i = Math.min(tab.n - 1, Math.floor(s));
  return tab.F[i] + (s - i) * (tab.F[i + 1] - tab.F[i]);
}

/** Table of |psi(x, t)|^2, wide enough (8 packet widths past each centre) that the tails left out are below 1e-14. */
export const waveTable = (t: number, n = 2000): Table =>
  cdfTable((x) => density(x, t), LEFT - 8 * width(t), RIGHT + 8 * width(t), n);

/** The screen's table, finer than the rows: the dots, the predicted shares and the pilot-wave landing places all read it. */
export const SCREEN_N = 8000;
export const screenTable = (): Table => waveTable(T, SCREEN_N);

/** Table of the standard bell curve, for one packet's quantiles: x = a + width(t) z(u). */
export const NORMAL = cdfTable((z) => Math.exp(-(z * z) / 2) / Math.sqrt(2 * Math.PI), -9, 9, 6000);

/** Quantile of one packet centred at a, at time t. */
export const packetQuantile = (u: number, t: number, a: number): number => a + width(t) * quantile(NORMAL, u);

/** CDF of one packet centred at a, at time t. */
export const packetCdf = (x: number, t: number, a: number): number => cdfAt(NORMAL, (x - a) / width(t));

/** Half-width of the picture's screen. A dot past it is counted but not drawn. */
export const VIEW = 120;

/** Chance that a dot lands past the edge of the picture: 1 - (F(VIEW) - F(-VIEW)). */
export const offView = (screen: Table): number => 1 - (cdfAt(screen, VIEW) - cdfAt(screen, -VIEW));

/** Many-worlds picture: k equal slices of the weight. Slice 0 holds this branch's dot, Q(u); the others sit at
 *  Q((u + j/k) mod 1). Each slice has weight 1/k. The rings are a picture of "the other branches", not a count of worlds. */
export const branches = (screen: Table, u: number, k = 6): number[] =>
  Array.from({ length: k }, (_, j) => quantile(screen, (u + j / k) % 1));

/** Where a pilot-wave object starts: the quantile of the starting density. The two packets do not overlap (overlap
 *  1e-22), so u < 1/2 is the left packet and u >= 1/2 the right one. */
export const startOf = (u: number): number => (u < 0.5 ? packetQuantile(2 * u, 0, LEFT) : packetQuantile(2 * u - 1, 0, RIGHT));

/** Time rows for pictures and pilot-wave paths: t_j = T j / ROWS, j = 0..ROWS. */
export const ROWS = 120;
export const rowTime = (j: number): number => (T * j) / ROWS;

/** One table per time row. About 240,000 wave values: build once. Pass the screen table as `last` to make the final row the
 *  finer one, so a pilot-wave path ends exactly where the same u lands under the rule. */
export const rowTables = (n = 2000, last?: Table): Table[] =>
  Array.from({ length: ROWS + 1 }, (_, j) => (j === ROWS && last ? last : waveTable(rowTime(j), n)));

/** Pilot-wave path of the shot with quantile u: x(t_j) = Q_{t_j}(u) on every row. */
export const path = (tables: Table[], u: number): number[] => tables.map((tab) => quantile(tab, u));

/** The slit a path came through: the left one if it starts left of the middle. */
export const slitOf = (x0: number): 'left' | 'right' => (x0 < 0 ? 'left' : 'right');

// ---- Collapse model (GRW), in real units

/** Hit rate per particle, per second: GRW's value. */
export const LAMBDA = 1e-16;
/** Width of a hit (localization accuracy), in meters: GRW's value. */
export const R_C = 1e-7;
/** Seconds the tool imagines the two paths kept apart, more than R_C, before they meet. */
export const APART = 1;
/** Sizes on the slider: N = 10^k particles. */
export const SIZES = { min: 0, max: 20, step: 1, start: 0 } as const;

/** Chance that one particle goes t seconds without a hit: e^{-lambda t}. */
export const noHitOne = (t: number): number => Math.exp(-LAMBDA * t);

/** Coherence left between two paths of N particles, each moved by sep meters, after t seconds.
 *  One hit on one particle multiplies the cross term by e^{-sep^2 / (4 R_C^2)} on average (the overlap of the two
 *  shifted Gaussians), and hits come at rate N lambda, so it decays as e^{-N lambda t (1 - e^{-sep^2 / (4 R_C^2)})}.
 *  For sep much larger than R_C, this is e^{-N lambda t}: the chance of no hit at all. */
export function coherence(n: number, t = APART, sep = Infinity): number {
  const pick = sep === Infinity ? 1 : -Math.expm1(-(sep * sep) / (4 * R_C * R_C));
  return Math.exp(-n * LAMBDA * t * pick);
}

/** Chance of at least one hit while the paths are apart: 1 - e^{-N lambda APART} (exact for tiny values too). */
export const hitChance = (n: number): number => -Math.expm1(-n * LAMBDA * APART);

/** Mean wait for the first hit on N particles moved together: 1 / (N lambda) seconds. */
export const meanWait = (n: number): number => 1 / (n * LAMBDA);

/** When the first hit comes, for the shot's number u: the inverse of P(hit by s) = 1 - e^{-N lambda s}.
 *  A hit lands while the paths are apart exactly when u < hitChance(n). */
export const hitTime = (n: number, u: number): number => -Math.log1p(-u) / (n * LAMBDA);

/** Picture only: the model time when the two packets start to overlap (width reaches D/4). The tool draws the APART
 *  seconds of the thought experiment on this stretch of the flight. */
export const APART_PICTURE = 2 * SIGMA * SIGMA * Math.sqrt((D / (4 * SIGMA)) ** 2 - 1);

// ---- Stories and shots

/** Dots the picture holds, and shots per Fire press for the big button. */
export const CAP = 3000;
export const BATCH = 100;

export type Story = 'rule' | 'collapse' | 'copenhagen' | 'many-worlds' | 'pilot-wave' | 'qbism';
/** "rule" first: the Born rule alone, no story. The five stories follow in alphabetical order, so the list ranks nothing. */
export const STORIES: readonly { id: Story; name: string }[] = [
  { id: 'rule', name: 'No story, only the rule' },
  { id: 'collapse', name: 'Collapse (GRW)' },
  { id: 'copenhagen', name: 'Copenhagen-style' },
  { id: 'many-worlds', name: 'Many worlds' },
  { id: 'pilot-wave', name: 'Pilot wave (Bohm)' },
  { id: 'qbism', name: 'QBism' },
];

/** One shot's random numbers, each uniform on [0, 1): hit (when a collapse hit comes), side (which path a hit picks),
 *  place (the Born rule draw), lift (height in the dot band: picture only). Every story reads the same numbers. */
export type Shot = { hit: number; side: number; place: number; lift: number };
export const newShot = (rand: () => number): Shot => ({ hit: rand(), side: rand(), place: rand(), lift: rand() });

/** Where a shot lands under a story, and the collapse hit if one came while the paths were apart. */
export type Landing = { x: number; hit: null | { side: 'left' | 'right'; at: number } };

/** Fringe strength a story predicts for an object of n particles: 1 for every story that keeps the standard rules,
 *  e^{-N lambda APART} for the collapse model. */
export const strength = (story: Story, n: number): number => (story === 'collapse' ? coherence(n) : 1);

/** The shot rule. Standard stories: x = Q_T(u). Collapse: the same, unless a hit came while the paths were apart;
 *  then the object is on one path and lands by that packet's quantile of the same u. */
export function land(story: Story, n: number, shot: Shot, screen: Table): Landing {
  if (story === 'collapse' && shot.hit < hitChance(n)) {
    const side = shot.side < 0.5 ? 'left' : 'right';
    return { x: packetQuantile(shot.place, T, side === 'left' ? LEFT : RIGHT), hit: { side, at: hitTime(n, shot.hit) } };
  }
  return { x: quantile(screen, shot.place), hit: null };
}

/** Density of landing places for fringe strength v: v |psi|^2 + (1 - v) (|g_left|^2 + |g_right|^2) / 2.
 *  v = 1 is the pure wave; v = 0 is one path or the other, with no stripes. */
export const pattern = (x: number, v: number): number =>
  v * density(x, T) + ((1 - v) * (packetDensity(x, T, LEFT) + packetDensity(x, T, RIGHT))) / 2;

/** The bright bands on the screen, |x| up to the table's edge: intervals where cos(k x) > 0. */
export function brightBands(lo: number, hi: number): [number, number][] {
  const k = fringeK(T), out: [number, number][] = [];
  for (let m = Math.floor((k * lo) / (2 * Math.PI)) - 1; m <= Math.ceil((k * hi) / (2 * Math.PI)) + 1; m++) {
    const a = Math.max(lo, ((2 * m - 0.5) * Math.PI) / k), b = Math.min(hi, ((2 * m + 0.5) * Math.PI) / k);
    if (b > a) out.push([a, b]);
  }
  return out;
}

/** Chance of landing in a bright band: with stripes (v = 1) and with none (v = 0). For any v it is v p1 + (1 - v) p0. */
export function brightShares(screen: Table): { p1: number; p0: number } {
  let p1 = 0, p0 = 0;
  for (const [a, b] of brightBands(screen.lo, screen.hi)) {
    p1 += cdfAt(screen, b) - cdfAt(screen, a);
    p0 += (packetCdf(b, T, LEFT) - packetCdf(a, T, LEFT) + packetCdf(b, T, RIGHT) - packetCdf(a, T, RIGHT)) / 2;
  }
  return { p1, p0 };
}

/** Predicted share of dots in the bright bands for fringe strength v. */
export const brightShare = (v: number, s: { p1: number; p0: number }): number => v * s.p1 + (1 - v) * s.p0;

// ---- Words for the readout

const SUP = '⁰¹²³⁴⁵⁶⁷⁸⁹';
/** 10^k as text: plain up to 1,000, then 10 with a raised power: 10⁴, 10¹⁶. */
export const tenTo = (k: number): string => (k <= 3 ? (10 ** k).toLocaleString('en') : '10' + String(k).split('').map((d) => SUP[+d]).join(''));

/** Size in words for a slider: "1 particle", "1,000 particles", "10 to the power 16 particles". */
export const sizeText = (k: number): string => (k === 0 ? '1 particle' : k <= 3 ? `${tenTo(k)} particles` : `10 to the power ${k} particles`);

/** A chance as a percent with at most one decimal; never shows a real chance as 0% or 100%.
 *  open: the true value is known to lie strictly between 0 and 1, even if it rounds to 0 or 1 in floating point
 *  (e^{-10000}, say). */
export function percent(p: number, open = false): string {
  const v = Math.round(p * 1000) / 10;
  if ((p > 0 || open) && v === 0) return '<0.1%';
  if ((p < 1 || open) && v === 100) return '>99.9%';
  return `${v}%`;
}

/** The start state, said in every readout: a gate's or a slit's effect depends on what goes in. */
export const startText = (k: number): string =>
  `Each shot: one object, made of ${k === 0 ? '1 particle' : `${tenTo(k)} particles`}, reaches the two slits with equal amplitudes for the two.`;

const side = (x: number): string => (x < 0 ? 'left' : 'right');

/** What the story says happened, for the last shot if there is one. */
export function storyText(story: Story, last: { x0: number; landing: Landing } | null): string {
  switch (story) {
    case 'rule':
      return 'No story: only the rule. A dot lands where |amplitude|² says, and nothing is said about what happens on the way. Four of the five stories change no number. The collapse story changes the numbers for large objects.';
    case 'copenhagen':
      return 'Copenhagen-style story: the wave is a tool for working out the odds, not a picture of a path. The screen is described in everyday terms, and it shows one result. Views of this kind differ in the details.';
    case 'many-worlds':
      return 'Many-worlds story: the wave never collapses, which gives up one result per run. The screen and you join the superposition, so every possible spot gets a dot, each in its own branch. The filled dot is this branch; the rings stand for a few of the others, drawn as equal slices of the weight. Each branch has weight |amplitude|²; Everettians derive why that weight acts as a chance; critics doubt it.';
    case 'pilot-wave':
      return `Pilot-wave story: the object always has a place, steered by the wave, which went through both slits.${last ? ` This one came through the ${slitOf(last.x0)} slit.` : ''} The theory takes its starting place to be random with |ψ|² odds, so the dots follow the Born rule. In this mirror-image setup no path crosses the middle line.`;
    case 'collapse':
      return last?.landing.hit
        ? `Collapse story (GRW): the wave really collapses, at random moments. This object was hit while the paths were apart, which left it on the ${last.landing.hit.side} path, so this dot belongs to that path's own broad band, with no stripes.`
        : `Collapse story (GRW): the wave really collapses, at random moments. ${last ? 'This object got no hit on the way, so its whole wave reached the screen. ' : ''}The detector's record moves a huge number of particles, so a hit comes almost at once and picks one spot.`;
    case 'qbism':
      return 'QBism story: the wave is one agent\'s belief, the odds that agent holds for what comes next. The dot is that agent\'s experience, and the belief is updated. QBism treats the state as a guide for an agent, not as a thing out there.';
  }
}

/** The size check: only the collapse model predicts that size matters. */
export function sizeVerdict(story: Story, k: number): string {
  const n = 10 ** k, v = coherence(n);
  if (story !== 'collapse')
    return `Standard quantum mechanics predicts full stripes at any size, if the object is perfectly cut off from its surroundings.${story === 'rule' ? '' : ' This story agrees.'} Only the collapse story says otherwise.`;
  return `GRW: with ${tenTo(k)} particles on paths kept apart for ${APART} second, a hit comes first in ${percent(hitChance(n), true)} of shots, so the stripes keep ${percent(v, true)} of their strength. Standard quantum mechanics predicts 100%.`;
}

/** The whole readout. counts: dots so far and how many landed in the bright bands. */
export function describe(
  story: Story, k: number, counts: { shots: number; inBright: number }, shares: { p1: number; p0: number },
  last: { x0: number; landing: Landing } | null = null,
): string {
  const pred = brightShare(strength(story, 10 ** k), shares);
  const where = last ? ` The last dot landed ${bright(last.landing.x) ? 'in a bright band' : 'between bright bands'}, ${side(last.landing.x)} of the middle.` : '';
  const tally = counts.shots
    ? ` ${counts.shots.toLocaleString('en')} dots so far: ${percent(counts.inBright / counts.shots)} in the bright bands; this story predicts ${percent(pred)}. With no stripes it would be ${percent(shares.p0)}.`
    : ` This story predicts ${percent(pred)} of the dots in the bright bands (with no stripes: ${percent(shares.p0)}). Fire some shots.`;
  return `${startText(k)} ${storyText(story, last)}${where}${tally} ${sizeVerdict(story, k)}`;
}
