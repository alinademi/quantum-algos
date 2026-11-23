import test from 'node:test';
import assert from 'node:assert/strict';
import * as q from '../quantum.ts';
import * as ms from './contextuality.ts';

const close = (a: number, b: number, eps = 1e-12) => assert.ok(Math.abs(a - b) < eps, `${a} != ${b}`);
const sum = (xs: number[]) => xs.reduce((t, x) => t + x, 0);
const L = [0, 1, 2];
const id4 = q.kron(q.I, q.I);
/** a equals k times b, entry by entry, for a real number k. */
const isMultiple = (a: q.Matrix, b: q.Matrix, k: number) =>
  a.forEach((row, i) => row.forEach((x, j) => { close(x.re, k * b[i][j].re); close(x.im, k * b[i][j].im); }));
const commute = (a: q.Matrix, b: q.Matrix) => {
  const d = q.matMul(a, b).map((row, i) => row.map((x, j) => q.sub(x, q.matMul(b, a)[i][j])));
  return d.flat().every((x) => q.abs(x) < 1e-12);
};
const trace = (m: q.Matrix) => m.reduce((t, row, i) => q.add(t, row[i]), q.c(0));
/** All 512 ways to fill a 3x3 grid with +1 and -1. */
const allSheets = (): ms.Sheet[] => Array.from({ length: 512 }, (_, n) => L.map((r) => L.map((c) => ((n >> (3 * r + c)) & 1 ? -1 : 1) as ms.Sign)));
/** The 8 ways to answer one line. */
const lines: ms.Sign[][] = Array.from({ length: 8 }, (_, n) => L.map((k) => ((n >> k) & 1 ? -1 : 1) as ms.Sign));
/** A random normalized state on n qubits, from a seeded generator. */
const randomState = (n: number, seed: number): q.State => {
  const r = q.rng(seed);
  return q.normalize(Array.from({ length: 2 ** n }, () => q.c(r() - 0.5, r() - 0.5)));
};

// ---- The square of observables

test('every cell is a Hermitian ±1 observable: O = O†, O² = I, trace 0 (two +1 and two −1 eigenvalues)', () => {
  for (const r of L) for (const c of L) {
    const o = ms.cellMatrix(r, c);
    isMultiple(q.dagger(o), o, 1);
    isMultiple(q.matMul(o, o), id4, 1);
    close(trace(o).re, 0); close(trace(o).im, 0);
  }
});

test('the Pauli rules the proof uses: XYZ = iI, and distinct Paulis anticommute', () => {
  const xyz = ms.productOf([q.X, q.Y, q.Z]);
  xyz.forEach((row, i) => row.forEach((x, j) => { close(x.re, 0); close(x.im, i === j ? 1 : 0); }));
  for (const [a, b] of [[q.X, q.Y], [q.Y, q.Z], [q.Z, q.X]]) isMultiple(q.matMul(a, b), q.matMul(b, a), -1);
});

test('each row and each column is a commuting set, so its three observables can be measured together', () => {
  for (const k of L) for (const i of L) for (const j of L) {
    assert.ok(commute(ms.cellMatrix(k, i), ms.cellMatrix(k, j)), `row ${k}: cells ${i}, ${j}`);
    assert.ok(commute(ms.cellMatrix(i, k), ms.cellMatrix(j, k)), `column ${k}: cells ${i}, ${j}`);
  }
});

test('each row multiplies to +I and each column to −I, in any order', () => {
  const orders = [[0, 1, 2], [0, 2, 1], [1, 0, 2], [1, 2, 0], [2, 0, 1], [2, 1, 0]];
  for (const k of L) for (const o of orders) {
    isMultiple(ms.productOf(o.map((c) => ms.cellMatrix(k, c))), id4, 1);
    isMultiple(ms.productOf(o.map((r) => ms.cellMatrix(r, k))), id4, -1);
  }
});

test('a cell\'s row and its column are different contexts: they cannot all be measured together', () => {
  for (const r of L) for (const c of L) {
    const row = L.map((k) => ms.cellMatrix(r, k)), col = L.map((k) => ms.cellMatrix(k, c));
    assert.ok(row.some((a) => col.some((b) => !commute(a, b))), `cell ${r}, ${c}`);
  }
});

test('one system is enough: on any state of two qubits, a row always gives product +1 and a column −1', () => {
  for (const seed of [1, 2, 3, 4, 5]) {
    const s = randomState(2, seed);
    for (const k of L) {
      const rows = ms.branches(s, ms.rowObs(k, [0, 1])), cols = ms.branches(s, ms.colObs(k, [0, 1]));
      close(sum(rows.map((b) => b.p)), 1); close(sum(cols.map((b) => b.p)), 1);
      rows.forEach((b) => assert.equal(ms.product(b.values), 1));
      cols.forEach((b) => assert.equal(ms.product(b.values), -1));
    }
  }
});

test('the third value of a line is fixed by the first two: it never has its own randomness', () => {
  const s = randomState(2, 9);
  for (const k of L) {
    for (const b of ms.branches(s, ms.rowObs(k, [0, 1]))) assert.equal(b.values[2], b.values[0] * b.values[1]);
    for (const b of ms.branches(s, ms.colObs(k, [0, 1]))) assert.equal(b.values[2], -b.values[0] * b.values[1]);
  }
});

// ---- Fixed values: the grid puzzle

test('no grid of fixed values keeps all six rules; every grid breaks 1, 3 or 5 (always an odd number)', () => {
  const tally = new Map<number, number>();
  for (const g of allSheets()) tally.set(ms.broken(g), (tally.get(ms.broken(g)) ?? 0) + 1);
  // The six rules are 5 independent parity checks on 9 bits: each allowed pattern of kept and broken rules has 2^4 = 16 grids.
  assert.deepEqual([...tally.entries()].sort((a, b) => a[0] - b[0]), [[1, 6 * 16], [3, 20 * 16], [5, 6 * 16]]);
});

test('the reason: by rows the nine values multiply to +1, by columns to −1', () => {
  for (const g of allSheets()) {
    const all = ms.product(g.flat());
    assert.equal(ms.product(L.map((x) => ms.product(g[x]))), all);
    assert.equal(ms.product(L.map((y) => ms.product(ms.column(g, y)))), all);
  }
});

test('de Wolf\'s sheets: each keeps its own player\'s rules, they differ only in row 3, column 3, and win 8 of 9', () => {
  for (const k of L) { assert.ok(ms.rowKept(ms.BEST_ALICE, k)); assert.ok(ms.colKept(ms.BEST_BOB, k)); }
  assert.equal(ms.broken(ms.BEST_ALICE), 1); assert.equal(ms.broken(ms.BEST_BOB), 1);
  assert.deepEqual(ms.differ(ms.BEST_ALICE, ms.BEST_BOB), [[2, 2]]);
  assert.equal(ms.winCount(ms.BEST_ALICE, ms.BEST_BOB), 8);
  const w = ms.pairWins(ms.BEST_ALICE, ms.BEST_BOB);
  L.forEach((x) => L.forEach((y) => assert.equal(w[x][y], !(x === 2 && y === 2))));
});

test('no fixed sheets win more than 8 of 9: exact best response of Bob to every one of Alice\'s 512 sheets', () => {
  let best = 0;
  for (const a of allSheets()) {
    // Bob answers each column on his own, so his best is the best answer per column.
    const total = sum(L.map((y) => Math.max(...lines.map((b) => L.filter((x) => ms.wins(x, y, a[x], b)).length))));
    best = Math.max(best, total);
  }
  assert.equal(best, 8);
});

test('one shared sheet does worse: at best 6 of 9, since it always breaks a rule', () => {
  assert.equal(Math.max(...allSheets().map((g) => ms.winCount(g, g))), 6);
});

test('fixed sheets are not random: the same row and column always give the same answers', () => {
  const r = q.rng(3);
  for (let k = 0; k < 200; k++) {
    const round = ms.playRound('fixed', ms.BEST_ALICE, ms.BEST_BOB, r);
    assert.deepEqual(round.alice, ms.BEST_ALICE[round.x]);
    assert.deepEqual(round.bob, ms.column(ms.BEST_BOB, round.y));
    assert.equal(round.won, !(round.x === 2 && round.y === 2));
  }
});

// ---- The quantum strategy

test('the shared state: two normalized singlet pairs, and each singlet gives opposite values for X, Y and Z', () => {
  close(q.norm2(ms.singlet()), 1); close(q.norm2(ms.pairs()), 1);
  for (const p of [q.X, q.Y, q.Z]) {
    const s = ms.singlet(), both = q.apply1(q.apply1(s, p, 0), p, 1);
    const e = q.inner(s, both);
    close(e.re, -1); close(e.im, 0);
  }
});

test('for every cell, Alice\'s and Bob\'s copies of the observable always agree: ⟨O_A O_B⟩ = (−1)(−1) = +1', () => {
  for (const r of L) for (const c of L) {
    const s = ms.pairs(), e = q.inner(s, ms.cellOn(r, c, ms.BOB)(ms.cellOn(r, c, ms.ALICE)(s)));
    close(e.re, 1); close(e.im, 0);
  }
});

test('quantum players win every round: exact Born-rule chances for all 9 row and column pairs', () => {
  for (const x of L) for (const y of L) {
    const bs = ms.quantumBranches(x, y);
    close(sum(bs.map((b) => b.p)), 1);
    close(ms.quantumWin(x, y), 1);
    bs.forEach((b) => assert.ok(ms.wins(x, y, b.values.slice(0, 3), b.values.slice(3))));
  }
});

test('yet each answer is random: Alice\'s row is one of the 4 patterns with product +1, each with chance 1/4', () => {
  for (const x of L) for (const y of L) {
    const seen = new Map<string, number>();
    for (const b of ms.quantumBranches(x, y)) {
      const k = b.values.slice(0, 3).join();
      seen.set(k, (seen.get(k) ?? 0) + b.p);
    }
    assert.equal(seen.size, 4);
    for (const [k, p] of seen) { close(p, 0.25); assert.equal(ms.product(k.split(',').map(Number) as ms.Sign[]), 1); }
  }
});

test('Bob\'s answers alone carry no sign of Alice\'s row: his column patterns each have chance 1/4 for every row she is asked', () => {
  for (const y of L) {
    const marg = L.map((x) => {
      const m = new Map<string, number>();
      for (const b of ms.quantumBranches(x, y)) { const k = b.values.slice(3).join(); m.set(k, (m.get(k) ?? 0) + b.p); }
      return m;
    });
    for (const m of marg) { assert.equal(m.size, 4); for (const p of m.values()) close(p, 0.25); }
  }
});

test('measurement order does not matter: Bob first gives the same exact chances', () => {
  for (const [x, y] of [[0, 0], [1, 2], [2, 2]]) {
    const key = (v: ms.Sign[]) => v.join();
    const ab = new Map(ms.quantumBranches(x, y).map((b) => [key(b.values), b.p]));
    const ba = ms.branches(ms.pairs(), [...ms.colObs(y, ms.BOB), ...ms.rowObs(x, ms.ALICE)]);
    assert.equal(ba.length, ab.size);
    for (const b of ba) close(ab.get(key([...b.values.slice(3), ...b.values.slice(0, 3)]))!, b.p);
  }
});

test('sampled quantum rounds: every one wins, and Alice\'s patterns match 1/4 within 5 standard errors', () => {
  const r = q.rng(11), n = 1800, counts = new Map<string, number>();
  for (let k = 0; k < n; k++) {
    const round = ms.quantumRound(0, 0, r);
    assert.ok(round.won);
    counts.set(round.alice.join(), (counts.get(round.alice.join()) ?? 0) + 1);
  }
  assert.equal(counts.size, 4);
  for (const m of counts.values()) assert.ok(Math.abs(m / n - 0.25) < 5 * Math.sqrt(0.25 * 0.75 / n), `${m / n}`);
});

test('the referee asks each row and column pair equally often', () => {
  const r = q.rng(5), n = 9000, counts = Array(9).fill(0);
  for (let k = 0; k < n; k++) { const [x, y] = ms.ask(r); counts[3 * x + y]++; }
  counts.forEach((m) => assert.ok(Math.abs(m / n - 1 / 9) < 5 * Math.sqrt((1 / 9) * (8 / 9) / n), `${m / n}`));
});

// ---- Words and layout

test('round words name the start, the answers and the verdict', () => {
  const lost = ms.sheetRound(ms.BEST_ALICE, ms.BEST_BOB, 2, 2);
  const t = ms.roundWords('fixed', lost);
  assert.match(t, /sheets written before the game/);
  assert.match(t, /row 3 and said −1, −1, \+1 \(product \+1\)/);
  assert.match(t, /column 3 and said \+1, \+1, −1 \(product −1\)/);
  assert.match(t, /Alice said \+1 and Bob said −1\. Lost: they disagree on the shared cell\./);
  const won = ms.roundWords('quantum', { x: 1, y: 2, alice: [1, -1, -1], bob: [1, -1, 1], won: true });
  assert.match(won, /two fresh singlet pairs/);
  assert.match(won, /row 2, column 3 \(X⊗Z\)/);
  assert.match(won, /Won\.$/);
  assert.equal(ms.sign(1), '+1'); assert.equal(ms.sign(-1), '−1');
  assert.equal(ms.cellList([[2, 2]]), 'row 3, column 3');
  assert.equal(ms.cellList([[0, 1], [2, 2]]), 'row 1, column 2 and row 3, column 3');
});

test('sheet and batch words: exact chances, the cells that differ, and where losses land', () => {
  assert.equal(ms.sheetWords(ms.BEST_ALICE, ms.BEST_BOB),
    'Alice\'s rows that multiply to +1: 3 of 3. Bob\'s columns that multiply to −1: 3 of 3. The sheets differ in 1 cell: row 3, column 3. 8 of the 9 asks win, so the exact win chance is 8/9 (about 89%).');
  assert.match(ms.sheetWords(ms.BEST_ALICE, ms.BEST_ALICE), /sheets are the same.*6 of the 9 asks win, so the exact win chance is 6\/9 \(about 67%\)\./);
  assert.deepEqual([0, 1, 8, 9].map(ms.ninths), ['0/9 (0%)', '1/9 (about 11%)', '8/9 (about 89%)', '9/9 (100%)']);
  const r = q.rng(2), fixed = Array.from({ length: 90 }, () => ms.playRound('fixed', ms.BEST_ALICE, ms.BEST_BOB, r));
  const lost = fixed.filter((x) => !x.won).length;
  assert.ok(lost > 0);
  assert.equal(ms.batchWords('fixed', fixed, ms.BEST_ALICE, ms.BEST_BOB),
    `Alice and Bob answer from sheets written before the game. 90 rounds: ${90 - lost} won, ${lost} lost. Every loss came when the referee asked row 3 with column 3. With these sheets 8 of the 9 asks win, so the exact win chance is 8/9 (about 89%).`);
  const quantum = Array.from({ length: 90 }, () => ms.playRound('quantum', ms.BEST_ALICE, ms.BEST_BOB, r));
  const broken = ms.copy(ms.BEST_ALICE); broken[2][2] = -1;
  const many = Array.from({ length: 270 }, () => ms.playRound('fixed', broken, ms.BEST_BOB, r));
  assert.match(ms.batchWords('fixed', many, broken, ms.BEST_BOB),
    /Every loss came when the referee asked one of these: row 3 with column 1, row 3 with column 2, row 3 with column 3\. With these sheets 6 of the 9 asks win, so the exact win chance is 6\/9 \(about 67%\)\.$/);
  assert.match(ms.batchWords('quantum', quantum, ms.BEST_ALICE, ms.BEST_BOB), /^Alice and Bob share two fresh singlet pairs.* 90 rounds: 90 won, 0 lost\. With ideal qubits the exact win chance is 100%/);
});

test('the singlet is made from 11 by a Hadamard gate on the first qubit, then a CNOT', () => {
  const s = q.cnot(q.apply1(q.basis(2, 3), q.H, 0), 0, 1);
  s.forEach((a, i) => { close(a.re, ms.singlet()[i].re); close(a.im, ms.singlet()[i].im); });
});

test('board layout: dots stay inside their cell, and a full cell still fits', () => {
  for (const n of [1, 36, 37, 100, 144, 145, 200]) {
    const cols = ms.cellCols(n), side = 70;
    assert.ok(cols * cols >= n);
    for (const k of [0, n - 1]) {
      const [x, y] = ms.dotIn(k, side, cols);
      assert.ok(x > 0 && x < side && y > 0 && y < side, `${n}: dot ${k} at ${x}, ${y}`);
    }
  }
  assert.equal(ms.cellCols(10), 6); assert.equal(ms.cellCols(100), 10); assert.equal(ms.cellCols(130), 12);
});
