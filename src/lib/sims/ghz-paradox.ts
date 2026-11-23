// Pure math for the GHZ game stop: the rules, every classical plan, and the Born rule odds of the quantum team.
// No DOM here. Core math comes from ../quantum.ts.
import { H, S, apply1, basis, cnot, dagger, draw, probs, type State } from '../quantum.ts';

export type Bit = 0 | 1;
/** Three bits, one per player: Alice, Bob, Charlie. */
export type Trio = [Bit, Bit, Bit];

export const PLAYERS = ['Alice', 'Bob', 'Charlie'] as const;

// ---- The game

/** The four questions. The referee picks one with equal chance. Zero or two players get a 1. */
export const QUESTIONS: readonly Trio[] = [[0, 0, 0], [0, 1, 1], [1, 0, 1], [1, 1, 0]];

/** XOR of the bits: 1 when their sum is odd. */
export const parity = (t: readonly Bit[]): Bit => (t.reduce<number>((x, b) => x ^ b, 0) as Bit);

/** The sum of the answers must be odd (1) or even (0): odd when some player got a 1, that is r OR s OR t. */
export const needOdd = (q: Trio): Bit => (q[0] | q[1] | q[2]) as Bit;

/** The team wins when a XOR b XOR c = r OR s OR t. */
export const wins = (q: Trio, a: Trio): boolean => parity(a) === needOdd(q);

// ---- The classical team: a plan made in advance

/** plan[player][bit] is what that player answers when asked that bit. Six bits, so 64 plans. */
export type Plan = [[Bit, Bit], [Bit, Bit], [Bit, Bit]];

/** Each player looks up only their own question bit. No talking. */
export const answers = (plan: Plan, q: Trio): Trio => [plan[0][q[0]], plan[1][q[1]], plan[2][q[2]]];

/** Which of the four questions the plan wins, in the order of QUESTIONS. */
export const planWins = (plan: Plan): boolean[] => QUESTIONS.map((q) => wins(q, answers(plan, q)));

/** How many of the four questions the plan wins. */
export const score = (plan: Plan): number => planWins(plan).filter(Boolean).length;

/** Plan number k (0 to 63): bit 5 is Alice's answer to 0, bit 4 her answer to 1, then Bob, then Charlie. */
export function planOf(k: number): Plan {
  const b = (i: number) => ((k >> (5 - i)) & 1) as Bit;
  return [[b(0), b(1)], [b(2), b(3)], [b(4), b(5)]];
}

/**
 * Add the four win rules mod 2. Each of the six planned answers sits in exactly two rules, so the left sides add to 0.
 * The right sides are 0, 1, 1, 1, which add to 1. So every plan breaks an odd number of rules: it loses 1 or 3 questions.
 * Returns the sum of the left sides mod 2 for this plan (always 0); tests check it against every plan.
 */
export const leftSum = (plan: Plan): Bit => parity(QUESTIONS.map((q) => parity(answers(plan, q))));
export const rightSum: Bit = parity(QUESTIONS.map(needOdd));

/** Best win chance of any classical team: 3 of 4. A plan picked at random is an average of plans, so it cannot beat the best one. */
export const CLASSICAL_BEST = 3 / 4;

/** Win chance of a plan when the referee picks each question with chance 1/4. */
export const planChance = (plan: Plan): number => score(plan) / 4;

// ---- The quantum team: three qubits in the GHZ state

/** Start three qubits as 000, then a Hadamard gate on Alice's qubit and CNOTs from it to the others: (|000> + |111>)/sqrt(2). */
export function ghz(): State {
  let s = apply1(basis(3, 0), H, 0);
  s = cnot(s, 0, 1);
  return cnot(s, 0, 2);
}

/** S dagger, diag(1, -i). With H after it, it turns the Y basis into the 0/1 basis. */
export const SDG = dagger(S);

/** What each player measures: X when asked 0, Y when asked 1. */
export const BASIS = ['X', 'Y'] as const;

/**
 * Each player turns their own qubit so a plain 0/1 reading measures the right basis:
 * asked 0, apply H (measures X); asked 1, apply S dagger, then H (measures Y). Reading 0 means the +1 result, 1 means -1.
 */
export function rotate(s: State, q: Trio): State {
  let t = s;
  q.forEach((bit, p) => {
    if (bit) t = apply1(t, SDG, p, 3);
    t = apply1(t, H, p, 3);
  });
  return t;
}

/** Answer bits for basis index i on 3 qubits: Alice is the top bit. */
export const bitsOf = (i: number): Trio => [((i >> 2) & 1) as Bit, ((i >> 1) & 1) as Bit, (i & 1) as Bit];

const cache = new Map<string, number[]>();
/** Born rule odds of the eight answer strings for question q, index 4a + 2b + c. */
export function odds(q: Trio): number[] {
  const key = q.join('');
  if (!cache.has(key)) cache.set(key, probs(rotate(ghz(), q)));
  return cache.get(key)!.slice();
}

/** Chance the quantum team wins question q: the total odds of the answer strings with the right parity. */
export const quantumChance = (q: Trio): number => odds(q).reduce((t, p, i) => t + (wins(q, bitsOf(i)) ? p : 0), 0);

/** Expected product of the three ±1 results, sum of p(abc) (-1)^(a+b+c): +1 for X X X, -1 for X Y Y, Y X Y, Y Y X. */
export const correlation = (q: Trio): number => odds(q).reduce((t, p, i) => t + (parity(bitsOf(i)) ? -p : p), 0);

/** One quantum round: draw the three answers together from the Born rule odds. `rand` is the browser's generator here, not a qubit. */
export const quantumRound = (q: Trio, rand: () => number): Trio => bitsOf(draw(odds(q), rand));

/** Chance that one player answers 1, from the joint odds. 1/2 for every player and question: one answer alone carries no message. */
export const oneChance = (q: Trio, player: number): number => odds(q).reduce((t, p, i) => t + (bitsOf(i)[player] ? p : 0), 0);

/**
 * Noise, for the text: the shared state is the GHZ state with chance v, else fully random (I/8, every reading equally likely).
 * Win chance v * 1 + (1 - v) * 1/2 = (1 + v)/2, which beats 3/4 only when v > 1/2.
 */
export function noisyChance(q: Trio, v: number): number {
  const random = Array.from({ length: 8 }, (_, i) => (wins(q, bitsOf(i)) ? 1 / 8 : 0)).reduce((a, b) => a + b, 0);
  return v * quantumChance(q) + (1 - v) * random;
}

// ---- Rounds the tool plays

/** One round: the referee's question (index into QUESTIONS) and the quantum team's answers. The classical answers follow from the plan. */
export type Round = { q: number; a: Trio };

/** The referee picks one of the four questions with equal chance. */
export const pickQuestion = (rand: () => number): number => Math.min(3, Math.floor(rand() * 4));

export const playRound = (rand: () => number): Round => {
  const q = pickQuestion(rand);
  return { q, a: quantumRound(QUESTIONS[q], rand) };
};

export type Tally = { n: number; classical: number; quantum: number; perQuestion: number[]; ones: [number, number, number] };

/** Count wins for both teams, rounds per question, and how often each quantum player answered 1. */
export function tally(rounds: readonly Round[], plan: Plan): Tally {
  const t: Tally = { n: rounds.length, classical: 0, quantum: 0, perQuestion: [0, 0, 0, 0], ones: [0, 0, 0] };
  for (const r of rounds) {
    const q = QUESTIONS[r.q];
    t.perQuestion[r.q]++;
    if (wins(q, answers(plan, q))) t.classical++;
    if (wins(q, r.a)) t.quantum++;
    r.a.forEach((b, p) => { t.ones[p] += b; });
  }
  return t;
}

// ---- Text for the readout

/** "0 1 1" */
export const trio = (t: readonly Bit[]): string => t.join(' ');

/** "sum 2, even" */
export const sumText = (t: readonly Bit[]): string => {
  const s = t.reduce<number>((x, b) => x + b, 0);
  return `sum ${s}, ${s % 2 ? 'odd' : 'even'}`;
};

/** An expected count: whole numbers as they are, else one decimal ("37.5"). */
export const about = (x: number): string => String(Math.round(x * 10) / 10);
