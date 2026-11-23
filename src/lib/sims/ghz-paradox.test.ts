import test from 'node:test';
import assert from 'node:assert/strict';
import * as q from '../quantum.ts';
import {
  QUESTIONS, parity, needOdd, wins, answers, planWins, score, planOf, leftSum, rightSum, CLASSICAL_BEST, planChance,
  ghz, SDG, rotate, bitsOf, odds, quantumChance, correlation, quantumRound, oneChance, noisyChance,
  pickQuestion, playRound, tally, trio, sumText, about, type Bit, type Plan, type Trio, type Round,
} from './ghz-paradox.ts';

const close = (a: number, b: number, eps = 1e-12) => assert.ok(Math.abs(a - b) < eps, `${a} != ${b}`);
const PLANS = Array.from({ length: 64 }, (_, k) => planOf(k));
const S2 = Math.SQRT1_2;

// Eigenvectors of X and Y: index 0 is the +1 result (answer 0), index 1 the -1 result (answer 1).
const EIG = {
  X: [[q.c(S2), q.c(S2)], [q.c(S2), q.c(-S2)]],
  Y: [[q.c(S2), q.c(0, S2)], [q.c(S2), q.c(0, -S2)]],
} as const;
const pauli = (bit: Bit) => (bit ? q.Y : q.X);
const op3 = (t: Trio) => q.kron(pauli(t[0]), q.kron(pauli(t[1]), pauli(t[2])));

test('the GHZ state: started as 000, then H and two CNOTs, gives (|000> + |111>)/√2', () => {
  const s = ghz();
  assert.equal(s.length, 8);
  close(q.norm2(s), 1);
  s.forEach((a, i) => { close(a.re, i === 0 || i === 7 ? S2 : 0); close(a.im, 0); });
});

test('rules: 000 needs an even sum, 011, 101, 110 need an odd sum', () => {
  assert.deepEqual(QUESTIONS.map(needOdd), [0, 1, 1, 1]);
  QUESTIONS.forEach((t) => assert.ok(parity(t) === 0, 'zero or two players get a 1'));
  assert.ok(wins([0, 0, 0], [1, 1, 0]));
  assert.ok(!wins([0, 0, 0], [1, 0, 0]));
  assert.ok(wins([0, 1, 1], [1, 1, 1]));
  assert.ok(!wins([1, 1, 0], [0, 1, 1]));
  assert.equal(parity([1, 1, 1]), 1);
  assert.equal(parity([]), 0);
});

test('planOf lists all 64 plans once, and each player reads only their own bit', () => {
  assert.equal(new Set(PLANS.map((p) => p.flat().join(''))).size, 64);
  assert.deepEqual(planOf(0), [[0, 0], [0, 0], [0, 0]]);
  assert.deepEqual(planOf(63), [[1, 1], [1, 1], [1, 1]]);
  assert.deepEqual(planOf(0b100100), [[1, 0], [0, 1], [0, 0]]);
  const p: Plan = [[0, 1], [1, 0], [1, 1]];
  assert.deepEqual(answers(p, [0, 1, 1]), [0, 0, 1]);
  assert.deepEqual(answers(p, [1, 1, 0]), [1, 0, 1]);
});

test('parity proof: the four left sides add to 0 for every plan, the right sides add to 1', () => {
  assert.equal(rightSum, 1);
  for (const p of PLANS) assert.equal(leftSum(p), 0);
  // Each planned answer sits in exactly two of the four rules.
  for (let player = 0; player < 3; player++) for (const bit of [0, 1]) {
    assert.equal(QUESTIONS.filter((t) => t[player] === bit).length, 2);
  }
});

test('every plan loses 1 or 3 questions, never 0 or 2; the best wins 3 of 4', () => {
  const by = new Map<number, number>();
  for (const p of PLANS) {
    const s = score(p);
    assert.ok(s === 1 || s === 3, `plan ${p.flat().join('')} wins ${s}`);
    by.set(s, (by.get(s) ?? 0) + 1);
  }
  // The loss patterns are exactly the 8 odd-weight patterns, 8 plans each.
  assert.deepEqual([...by.entries()].sort(), [[1, 32], [3, 32]]);
  const patterns = new Map<string, number>();
  for (const p of PLANS) { const k = planWins(p).map(Number).join(''); patterns.set(k, (patterns.get(k) ?? 0) + 1); }
  assert.equal(patterns.size, 8);
  for (const [k, n] of patterns) { assert.equal(n, 8); assert.equal((4 - [...k].filter((x) => x === '1').length) % 2, 1); }
  assert.equal(Math.max(...PLANS.map(planChance)), CLASSICAL_BEST);
  close(CLASSICAL_BEST, 0.75);
});

test('known plans: everyone says 0 wins only 000; everyone says 1 wins the other three', () => {
  assert.deepEqual(planWins([[0, 0], [0, 0], [0, 0]]), [true, false, false, false]);
  assert.deepEqual(planWins([[1, 1], [1, 1], [1, 1]]), [false, true, true, true]);
  // Alice says the bit she is asked, the others say 0: 000 -> 000 even (win), 011 -> 000 even (lose), 101 and 110 -> 100 odd (win).
  assert.deepEqual(planWins([[0, 1], [0, 0], [0, 0]]), [true, false, true, true]);
});

test('a plan picked at random never beats 3/4: it is an average of plans', () => {
  const rand = q.rng(11);
  for (let k = 0; k < 50; k++) {
    const w = PLANS.map(() => rand()), total = w.reduce((a, b) => a + b, 0);
    const mix = PLANS.reduce((t, p, i) => t + (w[i] / total) * planChance(p), 0);
    assert.ok(mix <= CLASSICAL_BEST + 1e-12);
  }
  close(PLANS.reduce((t, p) => t + planChance(p), 0) / 64, 0.5);
});

test('S dagger is diag(1, -i), and S dagger then H turns the Y basis into the 0/1 basis', () => {
  const want = [[q.c(1), q.c(0)], [q.c(0), q.c(0, -1)]];
  SDG.forEach((row, i) => row.forEach((x, j) => { close(x.re, want[i][j].re); close(x.im, want[i][j].im); }));
  const plusI = EIG.Y[0], minusI = EIG.Y[1];
  const a = q.matVec(q.H, q.matVec(SDG, [...plusI])), b = q.matVec(q.H, q.matVec(SDG, [...minusI]));
  close(q.abs2(a[0]), 1); close(q.abs2(b[1]), 1);
  const c = q.matVec(q.H, [...EIG.X[0]]), d = q.matVec(q.H, [...EIG.X[1]]);
  close(q.abs2(c[0]), 1); close(q.abs2(d[1]), 1);
});

test('the eigenvectors used: X and Y give +1 for answer 0 and -1 for answer 1', () => {
  for (const [m, e] of [[q.X, EIG.X], [q.Y, EIG.Y]] as const) {
    e.forEach((v, bit) => {
      const mv = q.matVec(m, [...v]), sign = bit ? -1 : 1;
      mv.forEach((x, i) => { close(x.re, sign * v[i].re); close(x.im, sign * v[i].im); });
    });
  }
});

test('Born rule: for each question the eight odds sum to 1 and match |<e_a e_b e_c|GHZ>|^2', () => {
  const g = ghz();
  for (const t of QUESTIONS) {
    const p = odds(t);
    close(p.reduce((a, b) => a + b, 0), 1);
    for (let i = 0; i < 8; i++) {
      const [a, b, c] = bitsOf(i), e = (bit: Bit, x: Bit) => [...(bit ? EIG.Y : EIG.X)[x]];
      const v = q.tensor(e(t[0], a), q.tensor(e(t[1], b), e(t[2], c)));
      close(p[i], q.abs2(q.inner(v, g)));
    }
  }
});

test('the quantum answers are spread evenly over the four strings with the right parity', () => {
  for (const t of QUESTIONS) {
    const p = odds(t);
    for (let i = 0; i < 8; i++) close(p[i], wins(t, bitsOf(i)) ? 1 / 4 : 0);
    close(quantumChance(t), 1);
  }
  // Same state, same rule, but rotate() built directly: 000 means everyone measures X.
  close(q.probs(rotate(ghz(), [0, 0, 0]))[0b011], 1 / 4);
  close(q.probs(rotate(ghz(), [0, 1, 1]))[0b011], 0);
});

test('Mermin: XXX|GHZ> = +|GHZ>, and XYY, YXY, YYX give -|GHZ>', () => {
  const g = ghz();
  for (const t of QUESTIONS) {
    const out = q.matVec(op3(t), g), sign = needOdd(t) ? -1 : 1;
    out.forEach((x, i) => { close(x.re, sign * g[i].re); close(x.im, sign * g[i].im); });
    close(correlation(t), sign);
  }
  // A product with only one Y is not fixed: <XXY> = 0.
  const xxy = q.inner(g, q.matVec(op3([0, 0, 1]), g));
  close(xxy.re, 0); close(xxy.im, 0);
});

test('local values cannot match: (-1)(-1)(-1) forces x1 x2 x3 = -1, but quantum theory says +1', () => {
  // Values ±1 fixed in advance for X and Y on each qubit. y^2 = 1, so the three -1 products multiply to x1 x2 x3.
  for (let k = 0; k < 64; k++) {
    const [[x1, y1], [x2, y2], [x3, y3]] = planOf(k).map(([a, b]) => [1 - 2 * a, 1 - 2 * b]);
    assert.equal((x1 * y2 * y3) * (y1 * x2 * y3) * (y1 * y2 * x3), x1 * x2 * x3);
    const predicted = [x1 * x2 * x3 === 1, x1 * y2 * y3 === -1, y1 * x2 * y3 === -1, y1 * y2 * x3 === -1];
    assert.ok(predicted.filter(Boolean).length < 4);
  }
});

test('no message: each answer alone is 1 with chance 1/2, and each pair of answers is spread evenly', () => {
  for (const t of QUESTIONS) {
    const p = odds(t);
    for (let player = 0; player < 3; player++) close(oneChance(t, player), 1 / 2);
    for (const [i, j] of [[0, 1], [0, 2], [1, 2]]) {
      for (const u of [0, 1]) for (const v of [0, 1]) {
        close(p.reduce((s, x, k) => s + (bitsOf(k)[i] === u && bitsOf(k)[j] === v ? x : 0), 0), 1 / 4);
      }
    }
  }
  // Alice's odds do not depend on what Bob and Charlie were asked: X for 000, X for 011.
  close(oneChance([0, 0, 0], 0), oneChance([0, 1, 1], 0));
});

test('noise: GHZ with chance v, else fully random, wins with chance (1 + v)/2', () => {
  for (const t of QUESTIONS) {
    for (const v of [0, 0.25, 0.5, 0.6, 0.9, 1]) close(noisyChance(t, v), (1 + v) / 2);
    close(noisyChance(t, 0.5), CLASSICAL_BEST);
    assert.ok(noisyChance(t, 0.51) > CLASSICAL_BEST);
    assert.ok(noisyChance(t, 0.49) < CLASSICAL_BEST);
  }
});

test('the referee picks each question with chance 1/4', () => {
  assert.equal(pickQuestion(() => 0), 0);
  assert.equal(pickQuestion(() => 0.2499), 0);
  assert.equal(pickQuestion(() => 0.25), 1);
  assert.equal(pickQuestion(() => 0.5), 2);
  assert.equal(pickQuestion(() => 0.75), 3);
  assert.equal(pickQuestion(() => 0.999999), 3);
  assert.equal(pickQuestion(() => 1), 3);
});

test('quantum rounds drawn from the Born rule always win, with each answer bit near half ones', () => {
  const rand = q.rng(7), n = 2000;
  for (const t of QUESTIONS) {
    const ones = [0, 0, 0];
    for (let k = 0; k < n; k++) {
      const a = quantumRound(t, rand);
      assert.ok(wins(t, a));
      a.forEach((b, p) => { ones[p] += b; });
    }
    // Mean n/2, spread sqrt(n)/2 ≈ 22. A fixed seed, so this never flakes; 5 spreads is a loose check.
    ones.forEach((m) => assert.ok(Math.abs(m - n / 2) < 5 * Math.sqrt(n) / 2, `${m}`));
  }
});

test('tally counts wins for both teams, rounds per question, and quantum ones', () => {
  const rounds: Round[] = [
    { q: 0, a: [0, 1, 1] }, { q: 1, a: [1, 0, 0] }, { q: 2, a: [1, 1, 1] }, { q: 3, a: [0, 0, 1] }, { q: 1, a: [0, 0, 1] },
  ];
  const all0: Plan = [[0, 0], [0, 0], [0, 0]];
  assert.deepEqual(tally(rounds, all0), { n: 5, classical: 1, quantum: 5, perQuestion: [1, 2, 1, 1], ones: [2, 2, 4] });
  const all1: Plan = [[1, 1], [1, 1], [1, 1]];
  assert.equal(tally(rounds, all1).classical, 4);
  assert.deepEqual(tally([], all1), { n: 0, classical: 0, quantum: 0, perQuestion: [0, 0, 0, 0], ones: [0, 0, 0] });
  const r = playRound(q.rng(3));
  assert.ok(r.q >= 0 && r.q < 4 && wins(QUESTIONS[r.q], r.a));
});

test('readout text', () => {
  assert.equal(trio([0, 1, 1]), '0 1 1');
  assert.equal(sumText([1, 1, 0]), 'sum 2, even');
  assert.equal(sumText([1, 1, 1]), 'sum 3, odd');
  assert.equal(sumText([0, 0, 0]), 'sum 0, even');
  assert.equal(about(37.5), '37.5');
  assert.equal(about(150), '150');
  assert.equal(about(100 / 3), '33.3');
});
