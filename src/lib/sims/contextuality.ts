// Mermin-Peres magic square: the pure math behind the MagicSquare tool. No DOM.
// Conventions:
// - A value is +1 or -1. Rows must multiply to +1 (an even number of -1s), columns to -1 (an odd number).
//   Rows and columns are 0, 1, 2 in code and 1, 2, 3 in words.
// - The square of observables is the one in de Wolf, Quantum Computing: Lecture Notes, section 17.3.
//   Cell (r, c) is P ⊗ Q with P, Q in {X, Y, Z}: P acts on a player's first qubit, Q on the second.
//   Each row multiplies to +I and each column to -I (tested in contextuality.test.ts).
// - The game: the referee asks Alice for row x and Bob for column y, both at random. They win when Alice's
//   three values multiply to +1, Bob's to -1, and they agree on the shared cell: alice[y] = bob[x].
// - Quantum strategy: Alice and Bob share two singlet pairs, (|01> - |10>)/sqrt2 each. Qubits in quantum.ts order:
//   0 = Alice's first, 1 = Bob's first (pair 1), 2 = Alice's second, 3 = Bob's second (pair 2).
//   Each player measures the three observables of their line, one after another, with Born-rule draws.
// - Fixed strategy (no entanglement): two answer sheets made before the game. Alice reads her row from hers,
//   Bob reads his column from his. Shared randomness cannot beat the best fixed pair: it only mixes them.
import { c, X, Y, Z, add, sub, scale, kron, matMul, apply1, norm2, normalize, tensor, type Matrix, type State } from '../quantum.ts';

export type Sign = 1 | -1;
export type Pauli = 'X' | 'Y' | 'Z';
/** An answer sheet: sheet[r][c] is the value written in row r, column c. */
export type Sheet = Sign[][];
export type Mode = 'fixed' | 'quantum';
/** What one round asked and answered. */
export type Round = { x: number; y: number; alice: Sign[]; bob: Sign[]; won: boolean };

export const LINES = [0, 1, 2] as const;
export const PAULI: Record<Pauli, Matrix> = { X, Y, Z };

/** de Wolf's square: SQUARE[r][c] = [P, Q] means the observable P ⊗ Q. */
export const SQUARE: [Pauli, Pauli][][] = [
  [['X', 'X'], ['Y', 'Z'], ['Z', 'Y']],
  [['Y', 'Y'], ['Z', 'X'], ['X', 'Z']],
  [['Z', 'Z'], ['X', 'Y'], ['Y', 'X']],
];

/** What each line must multiply to. */
export const ROW_RULE: Sign = 1;
export const COL_RULE: Sign = -1;

/** Rounds per press, and the most the board holds before it starts over. */
export const BATCH = 90;
export const CAP = 900;

// Float dust: a chance within this of 0 or 1 is exactly 0 or 1.
const DUST = 1e-12;
const clean = (p: number) => (p < DUST ? 0 : p > 1 - DUST ? 1 : p);
const S2 = Math.SQRT1_2;

// ---- The square of observables

/** Label like "X⊗Z" for cell (r, c). */
export const cellName = (r: number, c: number): string => SQUARE[r][c].join('⊗');

/** The 4x4 matrix P ⊗ Q of cell (r, c), on one player's two qubits. */
export const cellMatrix = (r: number, c: number): Matrix => kron(PAULI[SQUARE[r][c][0]], PAULI[SQUARE[r][c][1]]);

/** Matrix product of a list of matrices, left to right. */
export const productOf = (ms: Matrix[]): Matrix => ms.reduce((a, b) => matMul(a, b));

/** A ±1 observable as a map on states: the Paulis of cell (r, c) applied to the two given qubits. */
export const cellOn = (r: number, c: number, qubits: [number, number]) => (s: State): State =>
  apply1(apply1(s, PAULI[SQUARE[r][c][0]], qubits[0]), PAULI[SQUARE[r][c][1]], qubits[1]);

export const rowObs = (x: number, qubits: [number, number]) => LINES.map((c) => cellOn(x, c, qubits));
export const colObs = (y: number, qubits: [number, number]) => LINES.map((r) => cellOn(r, y, qubits));

// ---- Measuring a ±1 observable O: projectors (I ± O)/2

/** The parts (s + Os)/2 and (s - Os)/2. Their squared lengths are the Born-rule chances of +1 and -1. */
export function split(s: State, o: (s: State) => State): [State, State] {
  const os = o(s);
  return [s.map((a, i) => scale(add(a, os[i]), 0.5)), s.map((a, i) => scale(sub(a, os[i]), 0.5))];
}

/** Measure O on a normalized state with one random draw: the value and the state after it. */
export function measure(s: State, o: (s: State) => State, rand: () => number): { value: Sign; state: State } {
  const [plus, minus] = split(s, o);
  const value: Sign = rand() < clean(norm2(plus)) ? 1 : -1;
  return { value, state: normalize(value === 1 ? plus : minus) };
}

export type Branch = { p: number; values: Sign[] };

/** Every result sequence of measuring the observables in order, with its exact Born-rule chance.
 *  Branches with zero chance are left out. */
export function branches(s: State, obs: ((s: State) => State)[]): Branch[] {
  let live = [{ p: 1, values: [] as Sign[], state: normalize(s) }];
  for (const o of obs) {
    live = live.flatMap((b) => {
      const [plus, minus] = split(b.state, o);
      return ([[1, plus], [-1, minus]] as [Sign, State][])
        .map(([v, part]) => ({ q: clean(norm2(part)), v, part }))
        .filter(({ q }) => q > 0)
        .map(({ q, v, part }) => ({ p: b.p * q, values: [...b.values, v], state: normalize(part) }));
    });
  }
  return live.map(({ p, values }) => ({ p, values }));
}

// ---- The quantum strategy

export const ALICE: [number, number] = [0, 2];
export const BOB: [number, number] = [1, 3];

/** The singlet (|01> - |10>)/sqrt2. */
export const singlet = (): State => [c(0), c(S2), c(-S2), c(0)];

/** Two singlet pairs on qubits (Alice 1st, Bob 1st, Alice 2nd, Bob 2nd). */
export const pairs = (): State => tensor(singlet(), singlet());

/** Product of a list of values. */
export const product = (v: Sign[]): Sign => v.reduce<Sign>((t, a) => (t * a) as Sign, 1);

/** The referee's check for one round. */
export const wins = (x: number, y: number, alice: Sign[], bob: Sign[]): boolean =>
  product(alice) === ROW_RULE && product(bob) === COL_RULE && alice[y] === bob[x];

/** One quantum round from fresh pairs: Alice measures row x on her qubits, then Bob column y on his. */
export function quantumRound(x: number, y: number, rand: () => number): Round {
  let s = pairs();
  const run = (o: (s: State) => State) => { const m = measure(s, o, rand); s = m.state; return m.value; };
  const alice = rowObs(x, ALICE).map(run);
  const bob = colObs(y, BOB).map(run);
  return { x, y, alice, bob, won: wins(x, y, alice, bob) };
}

/** Exact chances of every answer pair in a quantum round: values are Alice's three, then Bob's three. */
export const quantumBranches = (x: number, y: number): Branch[] => branches(pairs(), [...rowObs(x, ALICE), ...colObs(y, BOB)]);

/** Exact chance the quantum players win when asked row x and column y. */
export const quantumWin = (x: number, y: number): number =>
  quantumBranches(x, y).reduce((t, b) => t + (wins(x, y, b.values.slice(0, 3), b.values.slice(3)) ? b.p : 0), 0);

// ---- Fixed answer sheets

/** de Wolf's best fixed sheets: Alice's rows all multiply to +1, Bob's columns all to -1.
 *  They differ only in row 3, column 3, so they lose only when asked that pair: 8 of 9. */
export const BEST_ALICE: Sheet = [[1, 1, 1], [1, 1, 1], [-1, -1, 1]];
export const BEST_BOB: Sheet = [[1, 1, 1], [1, 1, 1], [-1, -1, -1]];

export const copy = (g: Sheet): Sheet => g.map((row) => [...row]);
export const column = (g: Sheet, y: number): Sign[] => g.map((row) => row[y]);
export const rowKept = (g: Sheet, x: number): boolean => product(g[x]) === ROW_RULE;
export const colKept = (g: Sheet, y: number): boolean => product(column(g, y)) === COL_RULE;

/** How many of the six rules one grid breaks. Always odd (1, 3 or 5), so never 0. */
export const broken = (g: Sheet): number =>
  LINES.filter((x) => !rowKept(g, x)).length + LINES.filter((y) => !colKept(g, y)).length;

/** One round with fixed sheets. Nothing random: the answers are written down before the game. */
export function sheetRound(a: Sheet, b: Sheet, x: number, y: number): Round {
  const alice = [...a[x]], bob = column(b, y);
  return { x, y, alice, bob, won: wins(x, y, alice, bob) };
}

/** won[x][y]: does this pair of sheets win when asked row x and column y? */
export const pairWins = (a: Sheet, b: Sheet): boolean[][] => LINES.map((x) => LINES.map((y) => sheetRound(a, b, x, y).won));

/** How many of the 9 row and column pairs these sheets win. The exact win chance is this over 9. */
export const winCount = (a: Sheet, b: Sheet): number => pairWins(a, b).flat().filter(Boolean).length;

/** Cells [r, c] where the two sheets hold different values. */
export const differ = (a: Sheet, b: Sheet): [number, number][] =>
  LINES.flatMap((r) => LINES.filter((c) => a[r][c] !== b[r][c]).map((c): [number, number] => [r, c]));

// ---- A round of either kind

/** The referee picks a row and a column, each uniform. */
export const ask = (rand: () => number): [number, number] => [Math.floor(rand() * 3), Math.floor(rand() * 3)];

export function playRound(mode: Mode, a: Sheet, b: Sheet, rand: () => number): Round {
  const [x, y] = ask(rand);
  return mode === 'quantum' ? quantumRound(x, y, rand) : sheetRound(a, b, x, y);
}

// ---- Words for readouts

/** "+1" or "−1" (a true minus sign). */
export const sign = (v: number): string => (v > 0 ? '+1' : '−1');
export const signs = (v: Sign[]): string => v.map(sign).join(', ');
const cellWords = (r: number, c: number) => `row ${r + 1}, column ${c + 1}`;
export const cellList = (cells: [number, number][]): string => {
  const w = cells.map(([r, c]) => cellWords(r, c));
  return w.length < 2 ? w.join('') : `${w.slice(0, -1).join('; ')} and ${w[w.length - 1]}`;
};

/** What the players start with, named in every readout. */
export const startWords = (mode: Mode): string =>
  mode === 'quantum' ? 'Alice and Bob share two fresh singlet pairs, (|01⟩ − |10⟩)/√2 each.' : 'Alice and Bob answer from sheets written before the game.';

/** One round in words: what was asked, what each said, and the verdict. */
export function roundWords(mode: Mode, r: Round): string {
  const { x, y, alice, bob, won } = r;
  const rowOk = product(alice) === ROW_RULE, colOk = product(bob) === COL_RULE, same = alice[y] === bob[x];
  const shared = mode === 'quantum' ? `the shared cell, ${cellWords(x, y)} (${cellName(x, y)})` : `the shared cell, ${cellWords(x, y)}`;
  const why = won ? 'Won.' : `Lost: ${[!rowOk && 'Alice\'s row does not multiply to +1', !colOk && 'Bob\'s column does not multiply to −1', !same && 'they disagree on the shared cell'].filter(Boolean).join(', and ')}.`;
  return `${startWords(mode)} Alice was asked row ${x + 1} and said ${signs(alice)} (product ${sign(product(alice))}). ` +
    `Bob was asked column ${y + 1} and said ${signs(bob)} (product ${sign(product(bob))}). ` +
    `In ${shared}, Alice said ${sign(alice[y])} and Bob said ${sign(bob[x])}. ${why}`;
}

/** A win count out of the 9 asks as an exact fraction with its percent: 8 gives "8/9 (about 89%)". */
export const ninths = (w: number): string =>
  w === 0 || w === 9 ? `${w}/9 (${w === 0 ? 0 : 100}%)` : `${w}/9 (about ${Math.round((100 * w) / 9)}%)`;

/** The fixed sheets in words: which rules hold, where they differ, and the exact win chance. */
export function sheetWords(a: Sheet, b: Sheet): string {
  const rows = LINES.filter((x) => rowKept(a, x)).length, cols = LINES.filter((y) => colKept(b, y)).length;
  const d = differ(a, b), w = winCount(a, b);
  const diff = d.length === 0
    ? 'The two sheets are the same, so Alice and Bob always agree, but one grid always breaks at least one of the six rules.'
    : `The sheets differ in ${d.length} ${d.length === 1 ? 'cell' : 'cells'}: ${cellList(d)}.`;
  return `Alice's rows that multiply to +1: ${rows} of 3. Bob's columns that multiply to −1: ${cols} of 3. ${diff} ` +
    `${w} of the 9 asks win, so the exact win chance is ${ninths(w)}.`;
}

/** A batch of rounds in words, with the exact win chance. Fixed sheets are not random, so their losses
 *  come exactly from the asks they always lose. */
export function batchWords(mode: Mode, batch: Round[], a: Sheet, b: Sheet): string {
  const won = batch.filter((r) => r.won).length, n = batch.length;
  const head = `${startWords(mode)} ${n} ${n === 1 ? 'round' : 'rounds'}: ${won} won, ${n - won} lost.`;
  if (mode === 'quantum') return `${head} With ideal qubits the exact win chance is 100%, yet each player's own answers come out at random.`;
  const lost = LINES.flatMap((x) => LINES.filter((y) => batch.some((r) => !r.won && r.x === x && r.y === y)).map((y): [number, number] => [x, y]));
  const asks = lost.map(([x, y]) => `row ${x + 1} with column ${y + 1}`);
  const where = asks.length === 0 ? '' : asks.length === 1 ? ` Every loss came when the referee asked ${asks[0]}.`
    : ` Every loss came when the referee asked one of these: ${asks.join(', ')}.`;
  const w = winCount(a, b);
  return `${head}${where} With these sheets ${w} of the 9 asks win, so the exact win chance is ${ninths(w)}.`;
}

// ---- The round board: a 3x3 grid of cells, one dot per round in the cell of the row and column asked

/** Columns of dots per cell, for a board whose fullest cell holds n dots: room for at least `room`,
 *  more once a cell holds more. */
export const cellCols = (n: number, room = 36): number => Math.ceil(Math.sqrt(Math.max(n, room)));

/** Center of dot k in a cell of side `side` with `cols` dots across, filled row by row from the bottom left. */
export const dotIn = (k: number, side: number, cols: number): [number, number] => {
  const pitch = side / cols;
  return [((k % cols) + 0.5) * pitch, side - (Math.floor(k / cols) + 0.5) * pitch];
};
