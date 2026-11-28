// Qudits: the pure math behind the Qudit steps tool. No DOM.
// A qudit has d levels, |0⟩ to |d−1⟩, and one complex amplitude per level. Born rule: p(k) = |amplitude_k|².
// With ω = e^{2πi/d} (Wilde 3.7.2, Wang et al. 2020 eqs. 13 and 19):
//   shift X|j⟩ = |j+1 mod d⟩, clock Z|j⟩ = ω^j |j⟩, Fourier gate F|j⟩ = (1/√d) Σ_k ω^{jk} |k⟩.
// For d = 2 these are the Pauli X, the Pauli Z and the Hadamard gate.
// The tool: started as 0, a Fourier gate, then a phase step D(t) = diag(1, e^{it}, e^{2it}, ...) that turns
// level j by j·t, then either the inverse Fourier gate F† or nothing, then a measurement.
// D(m·360°/d) = Z^m, and F† Z^m F = X^m, so that circuit gives m every time.
// Angles are in degrees, as on the slider. The readout sentences use pct from ../draw.ts; it touches no DOM.
import { c, add, mul, scale, expi, matVec, matMul, dagger, probs, type C, type State, type Matrix } from '../quantum.ts';
import { pct } from '../draw.ts';

/** The level counts the tool offers. */
export const LEVELS: readonly number[] = [2, 3, 4, 5, 6];
/** Fresh copies in each batch. 120 splits evenly into 2, 3, 4, 5 or 6 equal piles. */
export const SHOTS = 120;
/** The phase step slider, in degrees. */
export const STEP = { min: 0, max: 360, step: 1 } as const;
/** Where the tool starts: a qutrit with the clock gate Z, then the inverse Fourier gate. */
export const START = { d: 3, deg: 120, undo: true } as const;

const TAU = 2 * Math.PI;
const mod = (a: number, n: number): number => ((a % n) + n) % n;
// Float dust: odds like 1e-33 instead of 0. Odds are rounded to 12 places, so dust can never move a dot.
const DUST = 1e-12;
const tidy = (p: number): number => Math.round(p * 1e12) / 1e12;

// ---- Numbers on the unit circle

/** e^{2πi t}: a turn by t full turns. Exact at quarter turns, so 1, i, −1 and −i carry no float dust. */
export function turn(t: number): C {
  const r = mod(t, 1);
  if (r === 0) return c(1);
  if (r === 0.25) return c(0, 1);
  if (r === 0.5) return c(-1);
  if (r === 0.75) return c(0, -1);
  return expi(TAU * r);
}

/** ω^k with ω = e^{2πi/d}. k is taken mod d first, so ω^d is exactly 1. */
export const omegaPow = (d: number, k: number): C => turn(mod(k, d) / d);

// ---- States and gates on one qudit

/** The level |j⟩ of a d-level qudit, as d amplitudes. */
export const level = (d: number, j: number): State => Array.from({ length: d }, (_, i) => c(i === j ? 1 : 0));

const diag = (xs: C[]): Matrix => xs.map((x, i) => xs.map((_, j) => (i === j ? x : c(0))));
const square = (d: number, f: (row: number, col: number) => C): Matrix =>
  Array.from({ length: d }, (_, row) => Array.from({ length: d }, (_, col) => f(row, col)));

/** Shift gate X: |j⟩ to |j+1 mod d⟩. For d = 2 it is the Pauli X gate. */
export const shift = (d: number): Matrix => square(d, (row, col) => c(row === mod(col + 1, d) ? 1 : 0));

/** Clock gate Z: |j⟩ to ω^j |j⟩. For d = 2 it is the Pauli Z gate. */
export const clock = (d: number): Matrix => diag(Array.from({ length: d }, (_, j) => omegaPow(d, j)));

/** Fourier gate F: |j⟩ to (1/√d) Σ_k ω^{jk} |k⟩, so row k, column j holds ω^{jk}/√d. For d = 2 it is the Hadamard gate. */
export const fourier = (d: number): Matrix => {
  const s = Math.sqrt(1 / d);
  return square(d, (k, j) => scale(omegaPow(d, j * k), s));
};

/** Phase step D(t): turns the amplitude of level j by j·t degrees. D(m·360°/d) is exactly Z^m: the angle is taken mod 360 first. */
export const phaseStep = (d: number, deg: number): Matrix => diag(Array.from({ length: d }, (_, j) => turn(mod(j * deg, 360) / 360)));

/** The matrix m times in a row: m^k, with m^0 the identity. */
export function power(m: Matrix, k: number): Matrix {
  let out = square(m.length, (i, j) => c(i === j ? 1 : 0));
  for (let n = 0; n < k; n++) out = matMul(out, m);
  return out;
}

// ---- The tool's circuit

/** Just before the last gate: started as 0, a Fourier gate, then the phase step. The amplitude of level j is e^{ijt}/√d. */
export const prepared = (d: number, deg: number): State => matVec(phaseStep(d, deg), matVec(fourier(d), level(d, 0)));

/** The amplitudes at measurement, one per result: after the inverse Fourier gate (undo) or right away. */
export function final(d: number, deg: number, undo: boolean): State {
  const s = prepared(d, deg);
  return undo ? matVec(dagger(fourier(d)), s) : s;
}

/** Born rule odds, one per result. Rounded to 12 places, so a result that cannot happen has chance exactly 0. */
export const odds = (d: number, deg: number, undo: boolean): number[] => probs(final(d, deg, undo)).map(tidy);

/**
 * Closed form of the odds after the inverse Fourier gate. With x = t − 360°·k/d,
 * p(k) = |(1/d) Σ_j e^{ijx}|² = sin²(d·x/2) / (d² sin²(x/2)), and 1 when x is a whole number of turns.
 */
export function oddsFormula(d: number, deg: number, k: number): number {
  const x = ((deg - (360 * k) / d) * Math.PI) / 180, s = Math.sin(x / 2);
  if (Math.abs(s) < 1e-9) return 1;
  return Math.sin((d * x) / 2) ** 2 / (d * d * s * s);
}

/**
 * The parts that add up to the amplitude for result k. After the inverse Fourier gate: d contributions,
 * (F†)_{kj} times the amplitude of level j, each e^{ij(t − 360°k/d)}/d. Measured right away: the one amplitude itself.
 */
export function contributions(d: number, deg: number, k: number, undo: boolean): C[] {
  const s = prepared(d, deg);
  if (!undo) return [s[k]];
  return dagger(fourier(d))[k].map((x, j) => mul(x, s[j]));
}

/** The parts drawn head to tail: the points from 0 to their sum, the amplitude. */
export const chain = (parts: readonly C[]): C[] => parts.reduce<C[]>((pts, p) => [...pts, add(pts[pts.length - 1], p)], [c(0)]);

/** If the step is m·360°/d, the gate is Z^m (m from 0 to d−1). Otherwise null. */
export function clockPower(d: number, deg: number): number | null {
  const m = (deg * d) / 360;
  return Number.isInteger(m) ? mod(m, d) : null;
}

/** The result the circuit gives every time, if one does: m for the step m·360°/d after the inverse Fourier gate. */
export function certain(d: number, deg: number, undo: boolean): number | null {
  const p = odds(d, deg, undo), k = p.indexOf(1);
  return k < 0 ? null : k;
}

/** Steps for the preset buttons: 0, 360°/d, 2·360°/d, ... Whole degrees for every d the tool offers. */
export const presets = (d: number): number[] => Array.from({ length: d }, (_, m) => (360 * m) / d);

/** When d changes: a clock gate Z^m stays Z^(m mod d), other steps keep their angle. */
export function carryStep(dOld: number, dNew: number, deg: number): number {
  const m = clockPower(dOld, deg);
  return m === null ? deg : (360 * mod(m, dNew)) / dNew;
}

// ---- Shots

/**
 * The result of one copy that drew its own uniform number u in [0, 1): the first k whose running total of odds passes u.
 * So result k takes a share p(k) of all u (Born rule). It never gives a result with chance 0, even with float dust.
 */
export function pick(p: readonly number[], u: number): number {
  let r = u, last = 0;
  for (let k = 0; k < p.length; k++) {
    if (p[k] <= 0) continue;
    last = k; r -= p[k];
    if (r < 0) return k;
  }
  return last;
}

/** How many of the first n copies gave each result. Each copy keeps its draw, so it moves only when the odds pass it. */
export function tally(us: readonly number[], p: readonly number[], n = us.length): number[] {
  const out = p.map(() => 0);
  for (let i = 0; i < n; i++) out[pick(p, us[i])]++;
  return out;
}

// ---- Picture layout, in CSS pixels

/** Height of a label line, the gap between blocks, the ring size to aim for, and the biggest ring size. */
export const LABEL = 16, GAP = 14, CELL = 100, MAX_CELL = 120;
export type Grid = { cols: number; rows: number; pitch: number };
export type Layout = {
  w: number; h: number;
  /** Rings: one per result, in a grid of cols by rows. Centers, and R, the radius for an amplitude of size 1. */
  rings: { cols: number; rows: number; cell: number; R: number; at: [number, number][]; labelY: number[] };
  /** Piles: one per result, side by side (two rows of piles when d is large and the canvas narrow). x is each pile's left edge, dy its row's drop below the first row; dots fill rows from the base up. */
  piles: Grid & { x: number[]; dy: number[]; width: number; base: number; top: number; labelY: number };
};

/** Biggest dot pitch, from max down to min px, that fits n dots in a box w wide and h tall, filled row by row. */
export function pileGrid(w: number, h: number, n: number, min = 3, max = 9): Grid {
  for (let pitch = max; ; pitch -= 0.25) {
    const cols = Math.max(1, Math.floor(w / pitch)), rows = Math.ceil(n / cols);
    if (rows * pitch <= h || pitch - 0.25 < min) return { cols, rows, pitch };
  }
}

/**
 * Where things go on a canvas w px wide for a d-level qudit. Rings sit in one row when each still gets CELL px,
 * else in up to three rows. Piles sit in one row: under their rings when the rings fit in one row, else spread across the width.
 */
export function layout(w: number, d: number, n = SHOTS): Layout {
  const cols = Math.max(Math.ceil(d / 3), Math.min(d, Math.floor(w / CELL))), rows = Math.ceil(d / cols);
  const cell = Math.min(MAX_CELL, w / cols), R = cell / 2 - 6, rowH = cell + LABEL;
  const at: [number, number][] = [], labelY: number[] = [];
  for (let k = 0; k < d; k++) {
    const r = Math.floor(k / cols), inRow = Math.min(cols, d - r * cols), x0 = (w - inRow * cell) / 2;
    at.push([x0 + ((k % cols) + 0.5) * cell, r * rowH + cell / 2]);
    labelY.push(r * rowH + cell + LABEL / 2);
  }
  const pr = rows > 1 && w / d < 50 ? 2 : 1, pc = Math.ceil(d / pr); // rows of piles, piles per row
  const slot = rows === 1 ? cell : w / pc;
  const width = Math.min(slot - 8, 110), top = rows * rowH + GAP;
  const g = pileGrid(width, w < 400 ? 132 : 156, n);
  const base = top + g.rows * g.pitch, drop = g.rows * g.pitch + 2 * LABEL + 4 + GAP;
  const x: number[] = [], dy: number[] = [];
  for (let k = 0; k < d; k++) {
    const r = Math.floor(k / pc), inRow = Math.min(pc, d - r * pc), left = (w - slot * inRow) / 2;
    x.push(left + ((k % pc) + 0.5) * slot - (g.cols * g.pitch) / 2); dy.push(r * drop);
  }
  return { w, h: base + (pr - 1) * drop + 2 * LABEL + 4, rings: { cols, rows, cell, R, at, labelY }, piles: { ...g, x, dy, width, base, top, labelY: base + 4 + LABEL / 2 } };
}

// ---- Words

/** The name of a d-level system. */
export const kind = (d: number): string => (d === 2 ? 'qubit' : d === 3 ? 'qutrit' : `qudit with ${d} levels`);

const SUP = ['⁰', '¹', '²', '³', '⁴', '⁵', '⁶', '⁷', '⁸', '⁹'];
/** The gate a step makes, in words, or null for a step between the clock steps. */
export function gateName(d: number, deg: number): string | null {
  const m = clockPower(d, deg);
  if (m === null) return null;
  if (m === 0) return 'no change at all';
  const pauli = d === 2 ? ', for a qubit the Pauli Z gate' : '';
  return m === 1 ? `the clock gate Z${pauli}` : `Z${SUP[m]}, the clock gate ${m} times`;
}

const list = (ks: number[]): string => (ks.length === 1 ? `${ks[0]}` : `${ks.slice(0, -1).join(', ')} and ${ks[ks.length - 1]}`);
const or = (ks: number[]): string => (ks.length === 1 ? `${ks[0]}` : `${ks.slice(0, -1).join(', ')} or ${ks[ks.length - 1]}`);

/** The results with the biggest chance (ties kept). */
export function likeliest(p: readonly number[]): number[] {
  const top = Math.max(...p);
  return p.flatMap((x, k) => (top - x < DUST ? [k] : []));
}

/** What the slider says to a screen reader as it moves. */
export function valueText(d: number, deg: number, undo: boolean): string {
  const gate = gateName(d, deg), p = odds(d, deg, undo);
  const head = `${deg} ${deg === 1 ? 'degree' : 'degrees'}${gate ? `, ${gate}` : ''}.`;
  if (!undo) return `${head} Measured right away: each result ${pct(1 / d)}.`;
  const m = certain(d, deg, undo);
  if (m !== null) return `${head} Gives ${m} every time.`;
  const top = likeliest(p);
  return `${head} Most likely ${or(top)}, ${pct(p[top[0]])}${top.length > 1 ? ' each' : ''}.`;
}

/** The circuit in words, for the circuit picture. */
export const circuitText = (deg: number, undo: boolean): string =>
  `Circuit: start at level 0, a Fourier gate, a phase step of ${deg}°, ${undo ? 'an inverse Fourier gate, ' : ''}then measure.`;

/** The readout: start state, gates, Born rule odds and this batch's counts, in words. */
export function readout(d: number, deg: number, undo: boolean, counts?: readonly number[]): string {
  const gate = gateName(d, deg), p = odds(d, deg, undo), size = Math.sqrt(1 / d).toFixed(2);
  const parts = [
    `A ${kind(d)}, d = ${d}.`,
    `Started as 0, a Fourier gate gives ${d} equal amplitudes of size ${size}${d === 2 ? ' (for a qubit, the Fourier gate and its inverse are both the Hadamard gate)' : ''}.`,
    `The phase step of ${deg}° turns the amplitude of level j by j × ${deg}°${gate ? `: ${gate}` : ''}.`,
  ];
  if (!undo) {
    parts.push(`Measured right away, the ${d} amplitudes still have equal size, so ${d === 2 ? 'both results have' : `all ${d} results have`} the same chance, ${pct(1 / d)}, whatever the step.`);
  } else {
    const m = certain(d, deg, undo);
    if (m !== null) {
      const rest = p.flatMap((_, k) => (k === m ? [] : [k]));
      parts.push(`Then the inverse Fourier gate gives ${m} every time: the ${d} contributions to the amplitude for ${m} line up.`);
      parts.push(`For ${list(rest)}, the ${d} contributions add head to tail back to 0 and cancel.`);
    } else {
      parts.push(`Then the inverse Fourier gate gives ${p.map((x, k) => `${k} with chance ${pct(x)}`).join(', ')}. The contributions only partly line up.`);
    }
  }
  if (counts) parts.push(`This batch of ${counts.reduce((a, b) => a + b, 0)} copies: ${counts.map((x, k) => `${x} gave ${k}`).join(', ')}.`);
  return parts.join(' ');
}
