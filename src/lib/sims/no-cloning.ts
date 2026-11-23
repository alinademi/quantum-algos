// Pure math for the No-cloning stop: two copy machines built from gates, what they give for an input state,
// what two true copies would be, how close the two are, and the odds of each readout. No DOM.
// Core math comes from ../quantum.ts. Two qubits: qubit 0 (left digit of |ab⟩) is the input,
// qubit 1 (right digit) is the blank, started as 0.
// The readout sentences use pct from ../draw.ts, the site's one percent format; it touches no DOM.
import { c, H, RY, abs2, apply1, cnot, draw, inner, ket0, probs, tensor, type State } from '../quantum.ts';
import { pct } from '../draw.ts';

/** 'z' copies |0⟩ and |1⟩ (one CNOT). 'x' copies |+⟩ and |−⟩ (Hadamard, CNOT, then a Hadamard on each qubit). */
export type Machine = 'z' | 'x';
/** 'read': read both qubits as they are. 'undo': first turn each qubit back by the input's angle, then read both. */
export type Check = 'read' | 'undo';

/** Most runs the tool keeps on screen. Each pile has room for all of them. */
export const CAP = 200;
/** The two-qubit readouts in counting order: entry i is i in binary, input qubit on the left. */
export const OUTCOMES = ['00', '01', '10', '11'] as const;
/** Named inputs: the angle (degrees) that turns a qubit started as 0 into each one. */
export const PRESETS = [
  { deg: 0, name: '|0⟩' },
  { deg: 90, name: '|+⟩' },
  { deg: -90, name: '|−⟩' },
  { deg: 180, name: '|1⟩' },
] as const;

// Float dust: (1/√2)(1/√2) − (1/√2)(1/√2) can come out as 1e-17 instead of 0. Below this we call a number 0.
const DUST = 1e-12;
const S = Math.SQRT1_2;
const snap = (x: number): number => (Math.abs(x) < DUST ? 0 : Math.abs(x - 1) < DUST ? 1 : x);
/** Set float dust in every amplitude to an exact 0, so a readout that cannot happen has chance exactly 0. */
const clean = (s: State): State => s.map((a) => c(Math.abs(a.re) < DUST ? 0 : a.re, Math.abs(a.im) < DUST ? 0 : a.im));

/** Exact amplitudes for the angles of the named states and of −|1⟩, so presets copy with a match of exactly 1. */
const EXACT: Record<number, [number, number]> = { 0: [1, 0], 90: [S, S], [-90]: [S, -S], 180: [0, 1], [-180]: [0, -1] };

/**
 * The input: a qubit started as 0, then turned by an RY gate of `deg` degrees (−180 to 180).
 * That is cos(θ/2)|0⟩ + sin(θ/2)|1⟩: real amplitudes only, one great circle of the Bloch sphere.
 * 180° gives |1⟩ and −180° gives −|1⟩, the same state up to a global phase.
 */
export function prepare(deg: number): State {
  const e = EXACT[deg];
  if (e) return [c(e[0]), c(e[1])];
  const h = (deg * Math.PI) / 360;
  return clean([c(Math.cos(h)), c(Math.sin(h))]);
}

/** The angle in radians of the RY gate that makes the input. */
export const radians = (deg: number): number => (deg * Math.PI) / 180;

/** Run a copy machine on any two-qubit state. Both machines are unitary: a CNOT, or H⊗H · CNOT · H⊗I. */
export function machine(m: Machine, s: State): State {
  if (m === 'z') return clean(cnot(s, 0, 1, 2));
  const t = cnot(apply1(s, H, 0, 2), 0, 1, 2);
  return clean(apply1(apply1(t, H, 0, 2), H, 1, 2));
}

/** What the machine gives for input psi and a blank qubit started as 0. */
export const copier = (m: Machine, psi: State): State => machine(m, tensor(psi, ket0()));

/** Two true copies of psi: |ψ⟩|ψ⟩. */
export const copies = (psi: State): State => clean(tensor(psi, psi));

/**
 * How close the machine's output is to two true copies: |⟨ψψ|out⟩|², between 0 and 1.
 * It is 1 only when out is |ψ⟩|ψ⟩ up to a global phase. It is also the chance the 'undo' check reads 00.
 */
export const match = (out: State, want: State): number => snap(abs2(inner(want, out)));

/** True when out matches want perfectly but is not equal to it: they differ by a global phase only (here a minus sign). */
export const phaseOnly = (out: State, want: State): boolean =>
  match(out, want) === 1 && out.some((a, i) => Math.abs(a.re - want[i].re) > DUST || Math.abs(a.im - want[i].im) > DUST);

/** The 'undo' check: turn each qubit back with RY(−θ), where θ made the input. A true copy turns back into 0. */
export function undo(s: State, deg: number): State {
  const back = RY(-radians(deg));
  return clean(apply1(apply1(s, back, 0, 2), back, 1, 2));
}

/** Born rule odds of 00, 01, 10, 11 when both qubits are read after the check. They add up to 1. */
export const chances = (s: State, check: Check, deg: number): number[] => probs(check === 'undo' ? undo(s, deg) : s).map(snap);

export type Prediction = {
  /** The input state. */ psi: State;
  /** The machine's output. */ out: State;
  /** Two true copies of the input. */ two: State;
  /** |⟨ψψ|out⟩|². */ match: number;
  /** Odds of each readout for the machine's output. */ pOut: number[];
  /** Odds of each readout for two true copies. */ pTwo: number[];
};

/** Everything the tool shows for one setting: input angle, machine and check. */
export function predict(deg: number, m: Machine, check: Check): Prediction {
  const psi = prepare(deg), out = copier(m, psi), two = copies(psi);
  return { psi, out, two, match: match(out, two), pOut: chances(out, check, deg), pTwo: chances(two, check, deg) };
}

/** One run: read both qubits, a draw from the Born rule odds p. Returns the entry number (0 to 3). Never a readout with chance 0. */
export function shot(p: number[], rand: () => number): number {
  const i = draw(p, rand);
  if (p[i] > 0) return i;
  let j = p.length - 1;
  while (j > 0 && !(p[j] > 0)) j--;
  return j;
}

/** Average counts over n runs: n times each chance. */
export const expected = (p: number[], n: number): number[] => p.map((x) => n * x);

// ---- Layout of the four piles (pure geometry, so it can be tested)

/** Full rectangle of exactly cap dots in a w by h box, dots as big as possible. */
export function pileGrid(w: number, h: number, cap = CAP): { cols: number; rows: number; pitch: number } {
  let best = { cols: 1, rows: cap, pitch: 0 };
  for (let cols = 1; cols <= cap; cols++) {
    if (cap % cols) continue;
    const rows = cap / cols, pitch = Math.min(w / cols, h / rows);
    if (pitch > best.pitch) best = { cols, rows, pitch };
  }
  return best;
}

/** Centre of the k-th dot (k = 0, 1, ...) of a pile, rows filled left to right from the bottom up. y is the height above the base. */
export const slot = (k: number, cols: number, pitch: number): [number, number] => [(k % cols + 0.5) * pitch, (Math.floor(k / cols) + 0.5) * pitch];

/** Height that `count` dots fill, so a line there marks an expected count. */
export const fillHeight = (count: number, cols: number, pitch: number): number => (count / cols) * pitch;

// ---- Text. Real amplitudes only.

/** An amplitude with 3 decimals and a true minus sign. Exact 0 is "0"; a tiny nonzero one keeps one digit ("0.00008"), never "0.000". */
export function amp(x: number): string {
  if (x === 0) return '0';
  const a = Math.abs(x), s = a < 0.0005 ? a.toPrecision(1) : a.toFixed(3);
  return x < 0 ? `−${s}` : s;
}

/** Ket text with the nonzero terms only: "0.707|00⟩ + 0.707|11⟩", "|0⟩", "−|11⟩". Labels follow the state size. */
export function ket(s: State): string {
  const n = Math.log2(s.length);
  const terms = s.map((a, i) => ({ x: a.re, l: `|${i.toString(2).padStart(n, '0')}⟩` })).filter((t) => t.x !== 0);
  return terms.map((t, k) => {
    const sign = t.x < 0 ? (k ? ' − ' : '−') : k ? ' + ' : '';
    return sign + (Math.abs(Math.abs(t.x) - 1) < DUST ? '' : amp(Math.abs(t.x))) + t.l;
  }).join('');
}

/** An angle in degrees with a true minus sign: "90°", "−45°". */
export const degrees = (deg: number): string => `${deg < 0 ? '−' : ''}${Math.abs(deg)}°`;

/** The preset name of an input angle ("|+⟩"), "−|1⟩" for −180°, else null. */
export const nameOf = (deg: number): string | null => (deg === -180 ? '−|1⟩' : PRESETS.find((p) => p.deg === deg)?.name ?? null);

/** A rough count for readouts: whole at 10 and above, one decimal below ("2.5", "0", "50"). */
export const about = (x: number): string => (x >= 10 ? String(Math.round(x)) : String(Math.round(x * 10) / 10));

// ---- Readout sentences. Each one names the start state, since a machine's effect depends on its input.

export const MACHINE_NAMES: Record<Machine, string> = { z: '0/1 copier', x: '+/− copier' };

/** The input as text: "|+⟩ = 0.707|0⟩ + 0.707|1⟩", "|0⟩", or just the ket when it has no name. */
export function inputText(deg: number, short = false): string {
  const k = ket(prepare(deg)), n = nameOf(deg);
  if (!n || n === k) return k;
  return short ? n : `${n} = ${k}`;
}

/** "Input: started as 0, turned 90°: |+⟩ = 0.707|0⟩ + 0.707|1⟩." */
export const startText = (deg: number, short = false): string => `Input: started as 0, turned ${degrees(deg)}: ${inputText(deg, short)}.`;

/** What the machine gives for this input, next to two true copies, and the match. */
export function verdict(deg: number, m: Machine): string {
  const p = predict(deg, m, 'read'), name = `The ${MACHINE_NAMES[m]}`;
  if (p.match === 1 && phaseOnly(p.out, p.two)) {
    return `${name} gives ${ket(p.out)}. Two true copies are ${ket(p.two)}: the same state up to an overall minus sign, a global phase no measurement can see. Match: 100%.`;
  }
  if (p.match === 1) return `${name} gives ${ket(p.out)}: two true copies. Match: 100%.`;
  return `${name} gives ${ket(p.out)}. Two true copies would be ${ket(p.two)}. Match: ${pct(p.match)}.`;
}

/** The readout before any run. */
export const idleText = (deg: number, m: Machine): string => `${startText(deg)} ${verdict(deg, m)} Press Run to test it.`;

const runs = (k: number) => `${k.toLocaleString('en')} ${k === 1 ? 'run' : 'runs'}`;
const times = (k: number) => (k === 1 ? 'once' : `${k.toLocaleString('en')} times`);

/** The readout after runs: the counts of 00, 01, 10, 11, next to what this machine and two true copies predict. */
export function reportText(deg: number, m: Machine, check: Check, counts: number[]): string {
  const N = counts.reduce((t, x) => t + x, 0), p = predict(deg, m, check);
  const head = `${runs(N)}. ${startText(deg, true)} ${MACHINE_NAMES[m]}, ${check === 'read' ? 'read both' : 'undo, then read'}.`;
  if (check === 'read') {
    const tail = p.match === 1 ? 'Same odds: this input is copied, match 100%.' : `Not two copies: match ${pct(p.match)}.`;
    return `${head} Counts for 00, 01, 10, 11: ${counts.join(', ')}. The machine's output predicts about ${expected(p.pOut, N).map(about).join(', ')}. Two true copies would give about ${expected(p.pTwo, N).map(about).join(', ')}. ${tail}`;
  }
  const rest = `00 came up ${times(counts[0])}; 01, 10, 11: ${counts.slice(1).join(', ')}.`;
  const tail = p.match === 1
    ? `Two true copies read 00 every time, and so does this output: match 100%.`
    : `Two true copies would read 00 ${N === 1 ? 'every time' : `all ${times(N)}`}. This machine's match, ${pct(p.match)}, predicts 00 about ${about(N * p.match)} ${N * p.match === 1 ? 'time' : 'times'}.`;
  return `${head} ${rest} ${tail}`;
}
