// The measurement problem: the pure math behind the UndoMeasure tool. No DOM.
// Sources: Myrvold, SEP "Philosophical Issues in Quantum Theory" (2022), Section 4.1: a ready state |R> and
// a|0>|"0"> + b|1>|"1"> after a linear (Schrödinger) measurement. Bell's dilemma: Section 4.2. Schlosshauer, Phys. Rep. 831, 1 (2019), Section 2.1:
// local interference is set by the overlap <E0|E1> of the environment's records, which many weak records drive down fast.
// Bacciagaluppi, SEP "The Role of Decoherence in Quantum Mechanics" (2025), Section 2.1: decoherence alone gives no single outcome.
//
// A toy model. Qubit order follows ../quantum.ts (qubit 0 is the leftmost bit):
// - Qubit 0 is the system. It starts as |0>, then a Hadamard gate: (|0> + |1>)/sqrt2.
// - Qubit 1 is the pointer. It starts ready, |0>, and records the system with a CNOT: (|00> + |11>)/sqrt2.
// - Qubits 2 .. n+1 are n air molecules, each started as |0>. Where the pointer reads 1, each one turns by RY(theta);
//   where it reads 0, nothing happens. cos(theta/2) = PER, so one molecule's two possible states overlap PER, and the
//   air ends in |E0> = |0...0> or |E1> = (RY(theta)|0>)^n, with overlap v = <E0|E1> = PER^n.
// Two stories for everything before the final test. The tool shows what each predicts; it does not pick one.
// - 'collapse': the pointer's record is a measurement. The state jumps to |00> or |11>, Born odds 1/2 each.
// - 'unitary': only gates act. The final test's measurement is the first use of the Born rule.
// Three final tests, each gates and then a measurement in the standard basis:
// - 'read': measure the qubit and the pointer.
// - 'undo': undo the record (the same CNOT again), a Hadamard gate on the qubit, then measure. Acts on qubit and pointer only.
// - 'undoAll': first undo every molecule (RY(-theta) where the pointer reads 1), then as 'undo'. Acts on the air too.
import { c, H, RY, apply1, controlled, cnot, basis, probs, add, mul, conj, draw, type C, type State } from '../quantum.ts';

export type Story = 'collapse' | 'unitary';
export type Test = 'read' | 'undo' | 'undoAll';
export type Bit = 0 | 1;

/** Runs per story. Each row of dots can hold them all, in case every run gives the same result. */
export const SHOTS = 200;
/** Overlap of one molecule's two possible records: a weak record. */
export const PER = 0.9;
/** The air slider: how many molecules bump into the pointer. */
export const AIR = { min: 0, max: 60, step: 1, start: 0 } as const;
export const STORIES: readonly Story[] = ['collapse', 'unitary'];
export const TESTS: readonly Test[] = ['read', 'undo', 'undoAll'];

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const bitOf = (i: number, q: number, m: number) => (i >> (m - 1 - q)) & 1;

/** The molecule's turn theta, in radians, with cos(theta/2) = per. per = 1 is no record, per = 0 a full one (theta = pi). */
export const turn = (per = PER): number => 2 * Math.acos(clamp01(per));

/** Overlap <E0|E1> of the air's two possible records after n molecules: per^n. With no molecules it is 1. */
export const overlap = (n: number, per = PER): number => (n === 0 ? 1 : clamp01(per) ** n);

// ---- The circuit, gate by gate. Exact, and 2^(n+2) amplitudes long, so only for small n (the tests check the closed forms with it).

/** Step 1: the qubit started as 0, then a Hadamard gate. The pointer and the n molecules start as 0. */
export const start = (n: number): State => apply1(basis(n + 2, 0), H, 0);

/** Step 2: the pointer records the qubit, a CNOT from qubit 0 to qubit 1. A CNOT is its own inverse, so this also undoes it. */
export const record = (s: State): State => cnot(s, 0, 1);

/** Step 3: each of the n molecules turns by RY(sign theta) where the pointer reads 1. sign = -1 undoes the records. */
export function bump(s: State, n: number, per = PER, sign: 1 | -1 = 1): State {
  const u = RY(sign * turn(per));
  let t = s;
  for (let k = 0; k < n; k++) t = controlled(t, u, [1], 2 + k);
  return t;
}

/** The final test's gates (the measurement comes after them). */
export function testGates(s: State, n: number, test: Test, per = PER): State {
  if (test === 'read') return s;
  const t = test === 'undoAll' ? bump(s, n, per, -1) : s;
  return apply1(record(t), H, 0);
}

/** Keep only the strings where qubit q is r: the Born chance of that result and the state left, renormalized. */
export function project(s: State, q: number, r: Bit): { p: number; state: State } {
  const m = Math.log2(s.length), kept = s.map((a, i) => (bitOf(i, q, m) === r ? a : c(0)));
  const p = probs(kept).reduce((t, x) => t + x, 0);
  return { p, state: p > 0 ? kept.map((a) => c(a.re / Math.sqrt(p), a.im / Math.sqrt(p))) : kept };
}

/** The states just before the final test, with their weights: one for 'unitary', and for 'collapse' one per pointer reading. */
export function branches(n: number, story: Story, per = PER): { p: number; state: State }[] {
  const s = record(start(n));
  const parts = story === 'unitary' ? [{ p: 1, state: s }] : ([0, 1] as const).map((r) => project(s, 1, r)).filter((b) => b.p > 0);
  return parts.map((b) => ({ p: b.p, state: bump(b.state, n, per) }));
}

/** Exact chance of every basis string at the end, summed over the branches with their Born weights. */
export function final(n: number, test: Test, story: Story, per = PER): number[] {
  const out = Array.from({ length: 2 ** (n + 2) }, () => 0);
  for (const b of branches(n, story, per)) probs(testGates(b.state, n, test, per)).forEach((x, i) => { out[i] += b.p * x; });
  return out;
}

/** From final chances: the chances of qubit 0 and qubit 1 reading 00, 01, 10, 11, summed over the air. */
export function marginal(p: number[]): [number, number, number, number] {
  const m = Math.log2(p.length), out: [number, number, number, number] = [0, 0, 0, 0];
  p.forEach((x, i) => { out[(bitOf(i, 0, m) << 1) | bitOf(i, 1, m)] += x; });
  return out;
}

/** The qubit and pointer's own state: the 4x4 density matrix left when the air is traced out. Rows and columns 00, 01, 10, 11. */
export function reduced(s: State): C[][] {
  const m = Math.log2(s.length), rest = 2 ** (m - 2), rho = [0, 1, 2, 3].map(() => [0, 1, 2, 3].map(() => c(0)));
  for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) {
    let t = c(0);
    for (let e = 0; e < rest; e++) t = add(t, mul(s[i * rest + e], conj(s[j * rest + e])));
    rho[i][j] = t;
  }
  return rho;
}

/** The same, in closed form: 1/2 on |00><00| and |11><11|, and v/2 on the two cross terms in the 'unitary' story, 0 after a collapse. */
export function rhoSA(n: number, story: Story, per = PER): number[][] {
  const v = story === 'unitary' ? overlap(n, per) : 0;
  return [[0.5, 0, 0, v / 2], [0, 0, 0, 0], [0, 0, 0, 0], [v / 2, 0, 0, 0.5]];
}

// ---- The closed forms the tool uses

/**
 * Chances of the two results the test reads, [result 0, result 1].
 * 'read': the pointer reads 0 or 1 (the qubit always matches it), 1/2 each in both stories.
 * 'undo': the qubit gives 0 with chance (1 + v)/2 if nothing collapsed, 1/2 after a collapse.
 * 'undoAll': the air is undone too, so v is back to 1: 0 always if nothing collapsed, 1/2 after a collapse.
 */
export function chances(test: Test, story: Story, n: number, per = PER): [number, number] {
  if (test === 'read' || story === 'collapse') return [0.5, 0.5];
  const v = test === 'undo' ? overlap(n, per) : 1;
  return [(1 + v) / 2, (1 - v) / 2];
}

/**
 * The largest difference in any result's chance that any test on the qubit and pointer alone (gates and a measurement
 * that leave the air alone) can show between the two stories: the trace distance of their rhoSA, v/2.
 */
export const gap = (n: number, per = PER): number => overlap(n, per) / 2;

/** One run of the whole setup in one story: the test's result, drawn with the Born rule. */
export const shot = (test: Test, story: Story, n: number, rand: () => number): Bit => draw(chances(test, story, n), rand) as Bit;

/** Runs per second while a batch lands: 6 at first, so the first few arrive one by one, then faster, at most 300. */
export const rate = (landed: number): number => Math.min(300, 6 + 3 * landed);

// ---- Words the tool shows

export const STORY_NAME: Record<Story, string> = { collapse: 'Story A: collapse at the pointer', unitary: 'Story B: no collapse until the end' };
const SHORT: Record<Story, string> = { collapse: 'A', unitary: 'B' };

export const TEST_NAME: Record<Test, string> = {
  read: 'Read the pointer',
  undo: 'Undo the pointer, then test the qubit',
  undoAll: 'Undo the air and the pointer, then test the qubit',
};

/** Row label in the picture: what result r of this test means. */
export const rowLabel = (test: Test, r: Bit): string => (test === 'read' ? `reads ${r}` : `gives ${r}`);

/** A number with at most 3 significant digits, no trailing zeros, never in e-notation for this tool's range. */
export const sig3 = (x: number): string => {
  if (x === 0) return '0';
  const s = String(Number(x.toPrecision(3)));
  return s.includes('e') ? x.toFixed(8).replace(/0+$/, '') : s;
};

/** The overlap as the tool shows it, and "=" or "≈" before it: "= 0.81" at 2 molecules, "≈ 0.122" at 20. */
export function overlapText(n: number): { eq: '=' | '≈'; value: string } {
  const v = overlap(n), value = sig3(v);
  return { eq: Math.abs(Number(value) - v) < 1e-12 ? '=' : '≈', value };
}

/** Whole-percent chance. A real but tiny chance never shows as 0%, a chance under 1 never as 100%. */
export function percent(p: number): string {
  if (p <= 0) return '0%';
  if (p >= 1) return '100%';
  if (p < 0.005) return 'under 1%';
  if (p >= 0.995) return 'over 99%';
  // The tiny nudge undoes float error, so 0.905 stored as 0.90499999... still shows 91%.
  return `${Math.round(p * 100 + 1e-9)}%`;
}

/**
 * The two stories' chances as shown, [story A, story B]. Whole percents, unless they would read the same while the chances
 * differ (the air's records shrink B toward A): then both get 3 significant figures, "50%" and "50.5%".
 */
export function chanceTexts(test: Test, n: number): [string, string] {
  const a = chances(test, 'collapse', n)[0], b = chances(test, 'unitary', n)[0];
  const pa = percent(a), pb = percent(b);
  if (pa !== pb || a === b) return [pa, pb];
  const f = (x: number) => `${sig3(x * 100)}%`;
  return [f(a), f(b)];
}

/** The gap as a percent with up to 3 significant digits: "50%", "40.5%", "0.0899%". */
export const gapText = (n: number): string => `${sig3(gap(n) * 100)}%`;

const molecules = (n: number) => (n === 0 ? 'no air molecules' : n === 1 ? '1 air molecule' : `${n} air molecules`);

/** The setup in one sentence. Names the start state, since what a gate does depends on its input. */
export const setup = (n: number): string =>
  `Started as 0, then a Hadamard gate: equal amplitudes for 0 and 1. The pointer recorded the qubit, then ${molecules(n)} bumped into the pointer.`;

/** The test's steps in words. */
export const testSteps: Record<Test, string> = {
  read: 'Test: measure the qubit and read the pointer.',
  undo: "Test: undo the pointer's record with a second CNOT, apply a Hadamard gate to the qubit, then measure it.",
  undoAll: "Test: undo each molecule's record, then the pointer's, apply a Hadamard gate to the qubit, then measure it.",
};

/** What each story predicts for this test. */
export function predict(test: Test, n: number): string {
  if (test === 'read') return 'Both stories predict the pointer reads 0 half the time and 1 half the time, and the qubit always matches it.';
  const [a, b] = chanceTexts(test, n);
  return `Story A, collapse at the pointer, predicts ${a} give 0. Story B, no collapse until the end, predicts ${b}.`;
}

/** What the test shows about the two stories. */
export function verdict(test: Test, n: number): string {
  if (test === 'read') return 'Reading the pointer cannot tell the stories apart.';
  if (n === 0) return test === 'undo'
    ? 'With no air, the undo gives 0 every time if nothing collapsed, but only half the time after a collapse.'
    : 'With no air there is nothing more to undo, so this is the plain undo: 100% versus 50%.';
  if (test === 'undo') return `The air's records shrink the gap to ${gapText(n)}. No test on the qubit and pointer alone can show a bigger one.`;
  return 'This test acts on the air too, so the full gap of 50% comes back. For a real pointer in air, undoing every record is hopeless in practice.';
}

/** The counts of result 0 in each story, in words. */
function counts(test: Test, got: Record<Story, readonly [number, number]>): string {
  const what = test === 'read' ? 'the pointer read 0' : 'the qubit gave 0';
  const runs = got.collapse[0] + got.collapse[1];
  return `Out of ${runs} runs each, ${what} ${got.collapse[0]} times in story ${SHORT.collapse} and ${got.unitary[0]} times in story ${SHORT.unitary}.`;
}

/** The readout: setup, test, predictions, the counts once a batch has landed, and the verdict. */
export function report(test: Test, n: number, got?: Record<Story, readonly [number, number]>): string {
  return [setup(n), testSteps[test], predict(test, n), got ? counts(test, got) : '', verdict(test, n)].filter(Boolean).join(' ');
}

/** The slider's spoken value. */
export const valueText = (n: number): string => {
  if (n === 0) return 'No molecules, so no air records.';
  const o = overlapText(n);
  return `${n} ${n === 1 ? 'molecule' : 'molecules'}. The air's two possible records overlap ${o.value}.`;
};

// ---- Picture layout, in CSS pixels

/** Inner margin, story title line, row label line, gap between a story's two rows, gap between stories, width for side by side. */
export const PAD = 12, TITLE = 22, LABEL = 18, ROWGAP = 8, GAP = 20, WIDE = 560;

export type Grid = { x: number; y: number; w: number; rows: number; cols: number; pitch: number };
export type Block = { x: number; y: number; w: number; h: number; grids: [Grid, Grid] };
export type Layout = { w: number; h: number; blocks: [Block, Block] };

/** Dot spacing for a row w px wide: w/40, kept between 5 and 9 px. Rows filled column by column hold n dots. */
export function dots(w: number, n = SHOTS): { rows: number; cols: number; pitch: number } {
  const pitch = Math.min(9, Math.max(5, w / 40)), rows = Math.ceil(n / Math.max(1, Math.floor(w / pitch)));
  return { rows, cols: Math.ceil(n / rows), pitch };
}

/** One story's block at (x, y), w px wide: a title, then a labelled row of dots per result. */
function block(x: number, y: number, w: number, n: number): Block {
  const d = dots(w, n), gh = d.rows * d.pitch;
  const g0: Grid = { x, y: y + TITLE + LABEL, w, ...d };
  const g1: Grid = { ...g0, y: g0.y + gh + ROWGAP + LABEL };
  return { x, y, w, h: TITLE + 2 * (LABEL + gh) + ROWGAP, grids: [g0, g1] };
}

/** Where things go on a canvas w px wide. Wide: the two stories side by side. Narrow: story A above story B. */
export function layout(w: number, n = SHOTS): Layout {
  const inner = Math.max(1, w - 2 * PAD);
  if (w >= WIDE) {
    const bw = (inner - GAP) / 2, a = block(PAD, PAD, bw, n), b = block(PAD + bw + GAP, PAD, bw, n);
    return { w, h: 2 * PAD + a.h, blocks: [a, b] };
  }
  const a = block(PAD, PAD, inner, n), b = block(PAD, PAD + a.h + GAP, inner, n);
  return { w, h: 2 * PAD + a.h + GAP + b.h, blocks: [a, b] };
}

/** Centre of the k-th dot in a row, filled column by column: so a row's length reads as its count. */
export const cell = (g: Grid, k: number): [number, number] =>
  [g.x + (Math.floor(k / g.rows) + 0.5) * g.pitch, g.y + ((k % g.rows) + 0.5) * g.pitch];

/** Where a row of `count` dots ends, for the tick that marks the predicted count. */
export const tickX = (g: Grid, count: number): number => g.x + (count / g.rows) * g.pitch;
