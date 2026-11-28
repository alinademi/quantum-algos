// Decoherence: the pure math behind the FadingStripes tool. No DOM. Core math comes from ../quantum.ts.
// Sources: Schlosshauer, Phys. Rep. 831, 1 (2019), arXiv:1911.06282: eqs. (1), (4), (5) and (7), Secs. 2.3, 2.6 and 4.4;
// Bacciagaluppi, SEP "The Role of Decoherence in Quantum Mechanics" (2025), Sec. 1.
//
// The model, a toy version of Zurek's spin model (Schlosshauer Sec. 4.4), with no energy exchange:
// - The qubit is qubit 0. It starts as |0>, then a Hadamard gate: |+> = (|0> + |1>)/sqrt2.
// - n particles of the surroundings are qubits 1..n, each started as |0>. Each bumps the qubit once: a controlled RY(theta)
//   with the qubit as control. A particle is left alone by |0> and turned by theta by |1>. So
//   |0>|0...0> -> |0>|E0> and |1>|0...0> -> |1>|E1>, with |E0> = |0...0> and |E1> = (RY(theta)|0>)^{(x)n}.
// - The overlap r = <E0|E1> = cos^n(theta/2) is real and in [0, 1]. The qubit's own state (partial trace over the particles)
//   is rho = (I + r X)/2: the 0/1 odds stay 1/2 and only the off-diagonal terms shrink, Schlosshauer eq. (4).
// - The interference test: a phase P(phi) on the qubit, then a second Hadamard, then a 0/1 measurement of the qubit.
//   p(0) = (1 + r cos phi)/2, so the stripes' visibility is r, Schlosshauer eq. (5).
// - Undo: every bump run backwards, last first (controlled RY(-theta)). The joint state is back to |+>|0...0>, so r = 1 again.
//   That needs every particle; with real surroundings it cannot be done (Schlosshauer Sec. 1, "irreversible for all practical purposes").
// Angles the reader sees are in whole degrees.
import { c, conj, mul, add, H, P, RY, apply1, controlled, basis, probOne, type Matrix, type State } from '../quantum.ts';

const RAD = Math.PI / 180;

/** The particles slider: how many particles bump the qubit. */
export const BUMPS = { min: 0, max: 60, step: 1, start: 0 } as const;
/** The bump strength slider, in degrees: how far one bump turns its particle when the qubit is 1. 180 is a full record. */
export const STRENGTH = { min: 0, max: 180, step: 5, start: 45 } as const;
/** The phases the picture sweeps, in degrees: one column each, every 15 degrees from 0 to 360. */
export const PHASES: readonly number[] = Array.from({ length: 25 }, (_, i) => 15 * i);
/** Shots per column, and in one batch. */
export const PER = 20;
export const SHOTS = PHASES.length * PER;

export type Bit = 0 | 1;

// Float dust: cos(pi/2) is 6e-17, not 0. A chance this close to 0 or 1 is exactly that.
const DUST = 1e-12;
const clean = (p: number): number => (Math.abs(p) < DUST ? 0 : Math.abs(1 - p) < DUST ? 1 : p);

/** One bump's turn, in radians. */
export const turn = (deg: number): number => deg * RAD;

/** The overlap one bump leaves between the particle's two states, <0|RY(theta)|0> = cos(theta/2). 180 degrees gives exactly 0. */
export const perBump = (deg: number): number => (deg >= 180 ? 0 : clean(Math.cos(turn(Math.max(0, deg)) / 2)));

/** The overlap r = <E0|E1> = cos^n(theta/2) after n bumps. No bump: 1. It falls as e^{-n/nd}, Schlosshauer eq. (7) with t in bumps. */
export const overlap = (n: number, deg: number): number => (n <= 0 ? 1 : perBump(deg) ** n);

/** Bumps that cut the overlap by a factor e: nd = -1/ln cos(theta/2). Infinite for no turn, 0 for a full record. */
export const bumpsPerE = (deg: number): number => {
  const k = perBump(deg);
  return k === 1 ? Infinity : k === 0 ? 0 : -1 / Math.log(k);
};

/** The overlap the tool uses: the undo brings it back to 1. */
export const shownOverlap = (n: number, deg: number, undo: boolean): number => (undo ? 1 : overlap(n, deg));

// ---- The full quantum state, for small n (it has 2^(n+1) amplitudes). The tool uses the closed forms; the tests check them here.

/** The two states of the particles: |E0> = |0...0>, what |0> leaves, and |E1> = (RY(theta)|0>)^{(x)n}, what |1> leaves. */
export function particleStates(n: number, deg: number): [State, State] {
  const one = RY(turn(deg)), e1Single: State = [one[0][0], one[1][0]];
  let e0: State = [c(1)], e1: State = [c(1)];
  for (let k = 0; k < n; k++) {
    e0 = e0.flatMap((x) => [x, c(0)]);
    e1 = e1.flatMap((x) => e1Single.map((y) => mul(x, y)));
  }
  return [e0, e1];
}

/** Qubit and particles after the bumps (and their undo, if asked), built gate by gate: H on the qubit, then each bump. */
export function joint(n: number, deg: number, undo = false): State {
  let s = apply1(basis(n + 1, 0), H, 0);
  for (let k = 1; k <= n; k++) s = controlled(s, RY(turn(deg)), [0], k);
  if (undo) for (let k = n; k >= 1; k--) s = controlled(s, RY(-turn(deg)), [0], k);
  return s;
}

/** Then the interference test on the qubit alone: P(phi), then a second H. */
export function atEnd(n: number, deg: number, phiDeg: number, undo = false): State {
  return apply1(apply1(joint(n, deg, undo), P(phiDeg * RAD), 0), H, 0);
}

/** Born rule: the chance that the qubit (qubit 0) reads 0, summed over every state of the particles. */
export const zeroChance = (s: State): number => clean(1 - probOne(s, 0));

/** The qubit's own state: the partial trace over every other qubit. rho[i][j] = sum over e of a(i, e) conj(a(j, e)). */
export function reduced(s: State): Matrix {
  const half = s.length / 2, rho: Matrix = [[c(0), c(0)], [c(0), c(0)]];
  for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++)
    for (let e = 0; e < half; e++) rho[i][j] = add(rho[i][j], mul(s[i * half + e], conj(s[j * half + e])));
  return rho;
}

/** The closed form of the qubit's own state after the bumps: (I + r X)/2. */
export const reducedFormula = (r: number): Matrix => [[c(0.5), c(r / 2)], [c(r / 2), c(0.5)]];

/** Bloch vector of a one-qubit density matrix: x = 2 Re rho10, y = 2 Im rho10, z = rho00 - rho11. Here (r, 0, 0). */
export const blochOf = (rho: Matrix): [number, number, number] => [2 * rho[1][0].re, 2 * rho[1][0].im, rho[0][0].re - rho[1][1].re];

/** Purity tr(rho^2) = (1 + r^2)/2: 1 for a pure state, 1/2 for a plain 50/50 mix. */
export const purity = (r: number): number => (1 + r * r) / 2;

/** Eigenvalues of rho, (1 + r)/2 and (1 - r)/2: also the squared Schmidt coefficients of the joint state. */
export const eigen = (r: number): [number, number] => [(1 + r) / 2, (1 - r) / 2];

// ---- Closed forms the tool shows

/** The interference test: p(0) = (1 + r cos phi)/2. Float dust is set to 0 or 1. */
export const chance0 = (phiDeg: number, r: number): number => clean((1 + r * Math.cos(phiDeg * RAD)) / 2);

/** How far the particles can tell |E0> from |E1>: D = sqrt(1 - r^2), the trace distance of two pure states. */
export const distinguish = (r: number): number => clean(Math.sqrt(Math.max(0, 1 - r * r)));

/** Best chance that a guess of 0 or 1, made from the particles alone, matches a 0/1 measurement of the qubit made right after the bumps, in place of the phase and second Hadamard: (1 + D)/2 (Helstrom). */
export const bestGuess = (r: number): number => clean((1 + distinguish(r)) / 2);

// ---- Shots. Each shot keeps one uniform draw u, so changing a setting flips dots instead of re-rolling them.

/** A fresh batch: PER uniform draws for each phase. */
export const draws = (rand: () => number): number[][] => PHASES.map(() => Array.from({ length: PER }, () => rand()));

/** Born rule: a shot reads 0 when its draw is below p(0). */
export const result = (u: number, p0: number): Bit => (u < p0 ? 0 : 1);

/** Shots that read 0 among some draws. */
export const zeros = (us: readonly number[], p0: number): number => us.filter((u) => result(u, p0) === 0).length;

/** The order shots land in: every (column, shot) pair once, shuffled (Fisher-Yates). */
export function order(rand: () => number): [number, number][] {
  const out: [number, number][] = PHASES.flatMap((_, col) => Array.from({ length: PER }, (_, k) => [col, k] as [number, number]));
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Shots per second while a batch lands: 6 at first, so the first few arrive one by one, then faster, at most 400. */
export const rate = (landed: number): number => Math.min(400, 6 + 3 * landed);

// ---- Words the tool shows. Every number comes from here.

/** A chance as a percent. Whole from 1% to 99%, one decimal near the ends. Never a false 0% or 100%. */
export function percent(p: number): string {
  if (p <= 0) return '0%';
  if (p >= 1) return '100%';
  const x = p * 100;
  if (x < 0.05) return 'under 0.1%';
  if (x >= 99.95) return 'over 99.9%';
  if (x < 0.95 || x >= 99.5) return `${x.toFixed(1)}%`;
  return `${Math.round(x)}%`;
}

/** "no particles", "1 particle", "12 particles". */
export const particles = (n: number): string => (n === 0 ? 'no particles' : `${n} ${n === 1 ? 'particle' : 'particles'}`);

/** The stripes left, for the stats line: the visibility r. */
export const stripesText = (r: number): string => percent(r);

/** The particles' record, for the stats line. */
export const recordText = (r: number): string => (r >= 1 ? 'none (a blind guess, 50%)' : `best guess right ${percent(bestGuess(r))}`);

/** What was done to the qubit, naming the start state. */
export function setup(n: number, deg: number, undo: boolean): string {
  const bumps = n === 0 ? 'no bumps' : `${n === 1 ? 'one bump' : `${n} bumps`} of strength ${deg}°${undo ? ', then every bump undone' : ''}`;
  return `Started as 0, then a Hadamard gate, ${bumps}, then a phase φ and a second Hadamard.`;
}

/** What theory says for this setting. Does not depend on the random draws. */
export function verdict(n: number, deg: number, undo: boolean): string {
  const r = overlap(n, deg);
  if (n === 0) return 'Nothing holds a record, so the stripes are full: at φ = 0° the two contributions to the amplitude for 1 cancel, and every shot reads 0.';
  if (r === 1) return 'Bumps of strength 0° leave no record, so the stripes are full: every shot reads 0 at φ = 0°.';
  if (undo) return 'Running every bump backwards erases the record, and the full stripes return: every shot reads 0 at φ = 0°. '
    + 'This works because the qubit and the particles stayed in one quantum state. It needs every particle back, which real surroundings never allow.';
  if (r === 0) return 'The particles hold a full record: a guess made from them alone always matches a 0/1 measurement of the qubit made right after the bumps, in place of the phase and second Hadamard. '
    + 'No stripes are left: at every phase the qubit gives 0 or 1 with equal chance, exactly like a plain coin flip.';
  return `Stripes left: ${percent(r)}. A best guess of 0 or 1 made from the particles alone would match a 0/1 measurement of the qubit made right after the bumps, in place of the phase and second Hadamard, ${percent(bestGuess(r))} of the time.`
    + (r < 0.01 ? ' The qubit alone now looks almost exactly like a plain coin flip.' : '');
}

/** The live readout: the setup, the verdict and, once a batch has landed, its counts at 0 and 180 degrees. */
export function report(n: number, deg: number, undo: boolean, got?: readonly [number, number]): string {
  const tail = got ? ` This batch: at φ = 0°, ${got[0]} of ${PER} shots read 0; at φ = 180°, ${got[1]} of ${PER}.` : '';
  return `${setup(n, deg, undo)} ${verdict(n, deg, undo)}${tail}`;
}

/** The particles slider's spoken value. */
export const bumpsValueText = (n: number, deg: number, undo: boolean): string =>
  `${particles(n)}. Stripes left: ${percent(shownOverlap(n, deg, undo))}${undo && n > 0 ? ', bumps undone' : ''}.`;

/** The strength slider's spoken value. */
export const strengthValueText = (deg: number): string =>
  deg >= 180 ? '180 degrees. One bump leaves a full record.' : deg === 0 ? '0 degrees. A bump leaves no record.'
    : `${deg} degrees. Each bump keeps ${percent(perBump(deg))} of the stripes.`;

// ---- Picture layout, in CSS pixels

/** Room for the left axis labels, the inner margin, the top margin, and the bottom labels. */
export const AXIS = 30, PAD = 8, TOP = 12, BOTTOM = 34;

export type Layout = { w: number; h: number; x0: number; colW: number; pitch: number; r: number; base: number };

/** Where the columns go on a canvas w px wide. Column c is centered at x0 + (c + 0.5) colW; its shot k sits pitch px per slot above base. */
export function layout(w: number): Layout {
  const colW = Math.max(1, (w - AXIS - PAD) / PHASES.length), pitch = Math.min(10, Math.max(6, colW));
  const r = Math.min(colW, pitch) * 0.36, base = TOP + PER * pitch;
  return { w, h: base + BOTTOM, x0: AXIS, colW, pitch, r, base };
}

/** x of a phase in degrees: the phase columns are 15 degrees apart. */
export const xOf = (L: Layout, phiDeg: number): number => L.x0 + (phiDeg / 15 + 0.5) * L.colW;

/** y of the middle of slot k (0 at the bottom) in a column, and y of a count of shots. */
export const ySlot = (L: Layout, k: number): number => L.base - (k + 0.5) * L.pitch;
export const yCount = (L: Layout, count: number): number => L.base - count * L.pitch;
