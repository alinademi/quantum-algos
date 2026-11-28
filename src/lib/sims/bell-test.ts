// The CHSH game, the simplest Bell test: the pure math behind the Bell test tool. No DOM.
// Conventions:
// - Alice gets question x, Bob gets question y; they answer a and b. All four are bits.
//   They win when a XOR b = x AND y: the same answers, unless both are asked 1, then different answers.
// - The referee picks each of the four question pairs (x, y) with chance 1/4.
// - A dial at angle t (degrees) is a measurement on one qubit: answer 0 means the qubit is found in
//   cos t|0> + sin t|1>, answer 1 means -sin t|0> + cos t|1> (Watrous's |psi_t> and |psi_{t+90}>).
//   It works like a polarizing filter's angle: on the Bloch sphere the axis sits at 2t in the x-z plane,
//   so t and t + 180 are the same dial.
// - The entangled pair is |Phi+> = (|00> + |11>)/sqrt2. Both qubits started as 0, then a Hadamard gate on
//   qubit 0 (Alice's) and a CNOT from qubit 0 onto qubit 1 (Bob's).
// - The hidden plan is a local model: each round the pair carries a hidden angle (an arrow), and each side
//   answers from its own dial and the arrow only.
import { H, RY, apply1, basis, cnot, draw, probs, type Matrix, type State } from '../quantum.ts';

export type Bit = 0 | 1;
/** Dial angles in degrees: a[x] is Alice's dial when she is asked x, b[y] is Bob's when he is asked y. */
export type Dials = { a: [number, number]; b: [number, number] };
/** How the players answer: with an entangled pair (quantum), or with a hidden plan made at the source (classical). */
export type Model = 'quantum' | 'hidden';
/** A fixed plan: Alice answers a[x] when asked x, Bob answers b[y] when asked y. */
export type Plan = { a: [Bit, Bit]; b: [Bit, Bit] };
/** One round of the game. */
export type Round = { x: Bit; y: Bit; a: Bit; b: Bit; won: boolean };

const RAD = Math.PI / 180;

/** The four question pairs (x, y) in the order the tool draws them. Index = 2x + y. */
export const PAIRS: readonly (readonly [Bit, Bit])[] = [[0, 0], [0, 1], [1, 0], [1, 1]];

/** The CHSH rule: win when a XOR b = x AND y. */
export const wins = (x: Bit, y: Bit, a: Bit, b: Bit): boolean => (a ^ b) === (x & y);

/** Dials that reach the quantum maximum: Alice 0 and 45, Bob 22.5 and -22.5 (Watrous; Aaronson 14.1.3). */
export const BEST: Dials = { a: [0, 45], b: [22.5, -22.5] };
/** All four dials at 0: the pair then always agrees, like a shared plan. */
export const SAME: Dials = { a: [0, 0], b: [0, 0] };

/** Best win chance of any classical strategy: 3/4. */
export const CLASSICAL_MAX = 3 / 4;
/** The tool's classical limit, as words. It names the local scope: a small batch of rounds can pass 75% by luck. */
export const LIMIT_NOTE = 'No local plan fixed in advance can beat 75% on average (S = 2); a small batch of rounds can go over by luck.';
/** Best win chance of any quantum strategy (Tsirelson): cos^2(22.5) = (2 + sqrt2)/4, about 0.854. */
export const TSIRELSON = (2 + Math.SQRT2) / 4;
/** The CHSH value S matching each limit: 2 and 2 sqrt2. */
export const S_CLASSICAL = 2;
export const S_TSIRELSON = 2 * Math.SQRT2;

/** With questions picked evenly, win chance and S are two scales for one number: P = 1/2 + S/8. */
export const winFromS = (s: number): number => 0.5 + s / 8;
export const sFromWin = (p: number): number => 8 * (p - 0.5);

/** The angle between two dial axes, folded into 0 to 90 degrees (a dial repeats every 180). */
export function between(a: number, b: number): number {
  const x = (((b - a) % 180) + 180) % 180;
  return Math.min(x, 180 - x);
}

// ---- Fixed plans

/** How many of the four question pairs a fixed plan wins. */
export const planWins = (p: Plan): number => PAIRS.filter(([x, y]) => wins(x, y, p.a[x], p.b[y])).length;

/** All 16 fixed plans. */
export const PLANS: Plan[] = Array.from({ length: 16 }, (_, i) => ({
  a: [((i >> 3) & 1) as Bit, ((i >> 2) & 1) as Bit],
  b: [((i >> 1) & 1) as Bit, (i & 1) as Bit],
}));

// ---- The entangled pair (quantum)

/** |Phi+> = (|00> + |11>)/sqrt2, made from |00> by a Hadamard gate on qubit 0 and a CNOT onto qubit 1. */
export const bellPair = (): State => cnot(apply1(basis(2, 0), H, 0), 0, 1);

/** U_t = RY(-2t): it turns cos t|0> + sin t|1> into |0> and -sin t|0> + cos t|1> into |1>,
 *  so a standard measurement after it is a measurement along dial t. */
export const turn = (t: number): Matrix => RY(-2 * t * RAD);

/** Born rule chances of the answer pairs 00, 01, 10, 11 (Alice's bit first), Alice's dial at alpha, Bob's at beta.
 *  Computed on the state vector: each qubit turned by its own dial, then |amplitude|^2. */
export const joint = (alpha: number, beta: number): number[] =>
  probs(apply1(apply1(bellPair(), turn(alpha), 0), turn(beta), 1));

/** The same chances in closed form: [cos^2 d, sin^2 d, sin^2 d, cos^2 d] / 2 with d = alpha - beta. */
export function jointExact(alpha: number, beta: number): number[] {
  const c2 = Math.cos((alpha - beta) * RAD) ** 2, s2 = 1 - c2;
  return [c2 / 2, s2 / 2, s2 / 2, c2 / 2];
}

/** Correlation E = P(same) - P(different) = cos 2(alpha - beta) for the entangled pair. */
export const correlation = (alpha: number, beta: number): number => Math.cos(2 * (alpha - beta) * RAD);

// ---- The hidden plan (classical, local)

/** The hidden plan's answer: 0 if the dial is within 45 degrees of the hidden arrow lam, else 1.
 *  It uses only this side's dial and the arrow, so nothing passes between the sides. */
export const hiddenAnswer = (t: number, lam: number): Bit => (between(t, lam) < 45 ? 0 : 1);

/** The hidden plan as a mix of fixed plans: the arrow's half circle (0 to 180) splits into arcs where all four
 *  answers stay the same. Each arc is one fixed plan, weighted by its share of the half circle.
 *  A dial t changes its answer where the arrow is 45 degrees from it: at t + 45 and t + 135 (mod 180). */
export function hiddenMix(d: Dials): { weight: number; plan: Plan }[] {
  const mod = (v: number) => ((v % 180) + 180) % 180;
  const cuts = [...new Set([...d.a, ...d.b].flatMap((t) => [mod(t + 45), mod(t + 135)]))].sort((p, q) => p - q);
  return cuts.map((c, i) => {
    const next = i + 1 < cuts.length ? cuts[i + 1] : cuts[0] + 180;
    const mid = (c + next) / 2;
    return {
      weight: (next - c) / 180,
      plan: { a: [hiddenAnswer(d.a[0], mid), hiddenAnswer(d.a[1], mid)], b: [hiddenAnswer(d.b[0], mid), hiddenAnswer(d.b[1], mid)] },
    };
  });
}

// ---- Both models

/** Chance that the two answers are the same. Quantum: cos^2 of the angle between the dials.
 *  Hidden plan: 1 - (angle between the dials)/90, since the arrow splits them on a share 2*angle/180 of the half circle. */
export const agree = (m: Model, alpha: number, beta: number): number =>
  m === 'quantum' ? Math.cos((alpha - beta) * RAD) ** 2 : 1 - between(alpha, beta) / 90;

/** Chance to win when the questions are (x, y). */
export function pairWin(m: Model, d: Dials, x: Bit, y: Bit): number {
  const p = agree(m, d.a[x], d.b[y]);
  return x & y ? 1 - p : p;
}

/** Chance to win one round, averaged over the four question pairs. */
export const winChance = (m: Model, d: Dials): number => PAIRS.reduce((t, [x, y]) => t + pairWin(m, d, x, y), 0) / 4;

/** CHSH value S = E00 + E01 + E10 - E11, with E = P(same) - P(different). */
export const chsh = (m: Model, d: Dials): number =>
  PAIRS.reduce((t, [x, y]) => t + (x & y ? -1 : 1) * (2 * agree(m, d.a[x], d.b[y]) - 1), 0);

// ---- Playing rounds

/** The referee: one of the four question pairs, each with chance 1/4. */
export function referee(rand: () => number): [Bit, Bit] {
  const i = Math.min(3, Math.floor(rand() * 4));
  return [(i >> 1) as Bit, (i & 1) as Bit];
}

/** A player for many rounds with fixed dials. Each round uses exactly two random numbers: one for the
 *  questions, one for the answers.
 *  Quantum: the answers are one Born rule draw from the joint chances above. This draw needs both questions in
 *  one place, which a simulation has and real players far apart do not: that is why a computer can mimic it.
 *  Hidden plan: a random arrow, then each side answers from its own dial alone. */
export function player(m: Model, d: Dials): (rand: () => number) => Round {
  if (m === 'quantum') {
    const tables = PAIRS.map(([x, y]) => joint(d.a[x], d.b[y]));
    return (rand) => {
      const [x, y] = referee(rand);
      const i = draw(tables[2 * x + y], rand);
      const a = (i >> 1) as Bit, b = (i & 1) as Bit;
      return { x, y, a, b, won: wins(x, y, a, b) };
    };
  }
  return (rand) => {
    const [x, y] = referee(rand);
    const lam = rand() * 180;
    const a = hiddenAnswer(d.a[x], lam), b = hiddenAnswer(d.b[y], lam);
    return { x, y, a, b, won: wins(x, y, a, b) };
  };
}

/** Running counts: all rounds, wins, rounds and wins for each question pair, and how often each side said 0. */
export type Tally = { n: number; won: number; pairs: { n: number; won: number }[]; aZero: number; bZero: number };

export const emptyTally = (): Tally => ({ n: 0, won: 0, pairs: PAIRS.map(() => ({ n: 0, won: 0 })), aZero: 0, bZero: 0 });

/** Add one round to a tally (changes it in place). */
export function record(t: Tally, r: Round): Tally {
  const p = t.pairs[2 * r.x + r.y];
  t.n++; p.n++;
  if (r.won) { t.won++; p.won++; }
  if (r.a === 0) t.aZero++;
  if (r.b === 0) t.bZero++;
  return t;
}

/** Play n rounds and count them. */
export function play(m: Model, d: Dials, n: number, rand: () => number): Tally {
  const go = player(m, d), t = emptyTally();
  for (let k = 0; k < n; k++) record(t, go(rand));
  return t;
}

// ---- Display helpers

/** A chance as a percent with at most one decimal: 0.75 -> "75%", 0.8536 -> "85.4%".
 *  Never shows a real chance as 0% or 100%. */
export function percent(p: number): string {
  const v = Math.round(p * 1000) / 10;
  if (p > 0 && v === 0) return '<0.1%';
  if (p < 1 && v === 100) return '>99.9%';
  return `${v}%`;
}

/** Dot grid for a pile of up to n dots in a w by h box: the largest pitch (up to max) that fits them all. */
export function pileGrid(w: number, h: number, n: number, max = 7): { pitch: number; cols: number; rows: number } {
  let p = Math.min(max, w, h);
  for (; p > 1; p *= 0.98) if (Math.ceil(n / Math.max(1, Math.floor(w / p))) * p <= h) break;
  p = Math.max(p, 1);
  return { pitch: p, cols: Math.max(1, Math.floor(w / p)), rows: Math.floor(h / p) };
}

/** Room each question pair's pile should have for a run of n planned rounds: a pair gets n/4 rounds on average,
 *  plus four standard deviations (sqrt(n * 3/16)) so a pile rarely outgrows it. */
export const pileRoom = (n: number): number => Math.ceil(n / 4 + 4 * Math.sqrt((3 * n) / 16)) + 4;
