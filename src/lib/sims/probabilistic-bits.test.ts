import test from 'node:test';
import assert from 'node:assert/strict';
import * as q from '../quantum.ts';
import * as b from './probabilistic-bits.ts';

const close = (a: number, x: number, eps = 1e-12) => assert.ok(Math.abs(a - x) <= eps, `${a} != ${x}`);
const PCTS = Array.from({ length: 101 }, (_, k) => k);

test('every slider setting gives a probability vector: no negative entry, sum 1', () => {
  for (const k of PCTS) {
    const v = b.fromPercent(k);
    assert.ok(b.isProbVec(v), `k=${k}`);
    close(v[1], k / 100);
    close(v[0], 1 - k / 100);
  }
  assert.deepEqual(b.fromPercent(25), [0.75, 0.25]);
  assert.deepEqual(b.fromPercent(50), [0.5, 0.5]);
  assert.deepEqual(b.fromPercent(0), [1, 0]);
  assert.deepEqual(b.fromPercent(100), [0, 1]);
  for (const bad of [-1, 101, 2.5, NaN]) assert.throws(() => b.fromPercent(bad), RangeError);
});

test('probability vector rules: entries never negative, entries add up to 1', () => {
  for (const v of [[3 / 4, 1 / 4], [1, 0], [0, 1], [0.5, 0.5], [1 / 6, 1 / 6, 1 / 6, 1 / 6, 1 / 6, 1 / 6]]) assert.ok(b.isProbVec(v), String(v));
  assert.equal(b.isProbVec([-0.1, 1.1]), false, 'negative entry');
  assert.equal(b.isProbVec([0.5, 0.6]), false, 'sum is not 1');
  assert.equal(b.isProbVec([NaN, 1]), false);
  assert.equal(b.isProbVec([]), false);
  // Amplitude vectors of qubits are not probability vectors: |+> sums to sqrt 2, |-> has a negative entry.
  assert.equal(b.isProbVec([Math.SQRT1_2, Math.SQRT1_2]), false);
  assert.equal(b.isProbVec([Math.SQRT1_2, -Math.SQRT1_2]), false);
});

test('the sure vectors are |0> = (1, 0) and |1> = (0, 1), and every vector is p0|0> + p1|1>', () => {
  assert.deepEqual(b.seen(0), [1, 0]);
  assert.deepEqual(b.seen(1), [0, 1]);
  for (const k of PCTS) {
    const v = b.fromPercent(k), [z, o] = [b.seen(0), b.seen(1)];
    close(v[0] * z[0] + v[1] * o[0], v[0]);
    close(v[0] * z[1] + v[1] * o[1], v[1]);
  }
});

test('a flip gives 0 exactly when the uniform draw is below the chance of 0', () => {
  const v = b.fromPercent(30); // (0.7, 0.3)
  assert.equal(b.flip(v, () => 0), 0);
  assert.equal(b.flip(v, () => 0.69), 0);
  assert.equal(b.flip(v, () => 0.7), 1);
  assert.equal(b.flip(v, () => 0.999999), 1);
});

test('sure coins never give the other result, even at the edges of the draw', () => {
  for (const u of [0, 1e-12, 0.5, 1 - 1e-12]) {
    assert.equal(b.flip(b.fromPercent(0), () => u), 0);
    assert.equal(b.flip(b.fromPercent(100), () => u), 1);
  }
});

test('after a look the vector is sure, so looking again at the same bit gives the same result', () => {
  const r = q.rng(7);
  for (let i = 0; i < 1000; i++) {
    const a = b.flip(b.fromPercent(40), r);
    assert.equal(b.flip(b.seen(a), r), a);
  }
});

test('over many flips the share of 1s lands near the chance of 1 (within 5 standard deviations)', () => {
  const N = 200000;
  for (const k of [1, 10, 25, 50, 73, 99]) {
    const v = b.fromPercent(k), r = q.rng(1000 + k);
    let ones = 0;
    for (let i = 0; i < N; i++) ones += b.flip(v, r);
    assert.ok(Math.abs(ones - N * v[1]) < 5 * b.spread(v, N), `k=${k} ones=${ones}`);
  }
});

test('expected counts are n times each chance and add up to n', () => {
  for (const k of PCTS) for (const n of [0, 1, 7, 100, 1000]) {
    const e = b.expected(b.fromPercent(k), n);
    close(e[0] + e[1], n, 1e-9);
    close(e[1], (n * k) / 100, 1e-9);
  }
  assert.deepEqual(b.expected([0.75, 0.25], 1000), [750, 250]);
});

test('spread is the binomial sqrt(n p0 p1): known values, zero for sure coins, same for p and 1 - p', () => {
  close(b.spread([0.5, 0.5], 100), 5);
  close(b.spread([0.75, 0.25], 1000), Math.sqrt(187.5));
  close(b.spread([0.75, 0.25], 100), Math.sqrt(18.75));
  assert.equal(b.spread([1, 0], 1000), 0);
  assert.equal(b.spread([0, 1], 1000), 0);
  for (const k of PCTS) close(b.spread(b.fromPercent(k), 500), b.spread(b.fromPercent(100 - k), 500));
  for (const k of PCTS) assert.ok(b.spread(b.fromPercent(k), 500) <= b.spread(b.fromPercent(50), 500) + 1e-12);
});

test('the share of 1s closes in like 1 over the square root of n: 4 times the flips, half the spread', () => {
  const v = b.fromPercent(25);
  for (const n of [10, 100, 1000]) close(b.spread(v, n) / n / (b.spread(v, 4 * n) / (4 * n)), 2, 1e-9);
});

test('simulated batches match the predicted mean and spread', () => {
  const v = b.fromPercent(30), n = 100, runs = 4000, r = q.rng(42);
  const counts = Array.from({ length: runs }, () => { let ones = 0; for (let i = 0; i < n; i++) ones += b.flip(v, r); return ones; });
  const mean = counts.reduce((t, x) => t + x, 0) / runs;
  const sd = Math.sqrt(counts.reduce((t, x) => t + (x - mean) ** 2, 0) / (runs - 1));
  close(mean, b.expected(v, n)[1], 5 * b.spread(v, n) / Math.sqrt(runs));
  close(sd / b.spread(v, n), 1, 0.06);
});

test('display text: entries, kets, pairs and rough numbers', () => {
  assert.equal(b.fmt(0.75), '0.75');
  assert.equal(b.fmt(0.3), '0.30');
  assert.equal(b.fmt(0), '0');
  assert.equal(b.fmt(1), '1');
  for (const k of PCTS) {
    const v = b.fromPercent(k);
    assert.equal(b.fmt(v[0]), k === 100 ? '0' : k === 0 ? '1' : ((100 - k) / 100).toFixed(2));
  }
  assert.equal(b.ket([0.75, 0.25]), '0.75|0⟩ + 0.25|1⟩');
  assert.equal(b.ket([1, 0]), '|0⟩');
  assert.equal(b.ket([0, 1]), '|1⟩');
  assert.equal(b.pair([0.75, 0.25]), '(0.75, 0.25)');
  assert.equal(b.pair(b.seen(1)), '(0, 1)');
  assert.equal(b.approx(250), '250');
  assert.equal(b.approx(1000), '1,000');
  assert.equal(b.approx(13.69), '14');
  assert.equal(b.approx(4.33), '4.3');
  assert.equal(b.approx(0.1), '0.1');
  assert.equal(b.approx(0), '0');
});

test('pile grid holds exactly CAP dots and fits its box', () => {
  for (let w = 60; w <= 800; w += 7) for (let h = 120; h <= 400; h += 13) {
    const g = b.pileGrid(w, h);
    assert.equal(g.cols * g.rows, b.CAP);
    assert.ok(g.cols * g.pitch <= w + 1e-9 && g.rows * g.pitch <= h + 1e-9, `${w}x${h}`);
    for (let cols = 1; cols <= b.CAP; cols++) if (b.CAP % cols === 0) assert.ok(Math.min(w / cols, h / (b.CAP / cols)) <= g.pitch + 1e-12);
  }
  assert.equal(b.pileGrid(136, 220).cols, 25);
});

test('piles fill rows left to right from the bottom, and the expected line sits at count / cols rows', () => {
  const cols = 25, p = 6;
  assert.deepEqual(b.slot(0, cols, p), [3, 3]);
  assert.deepEqual(b.slot(24, cols, p), [147, 3]);
  assert.deepEqual(b.slot(25, cols, p), [3, 9]);
  close(b.fillHeight(250, cols, p), 60);
  for (let n = 1; n <= b.CAP; n++) {
    const top = b.slot(n - 1, cols, p)[1] + p / 2;
    assert.ok(top >= b.fillHeight(n, cols, p) - 1e-9 && top - b.fillHeight(n, cols, p) < p, `n=${n}`);
  }
});

test('a qubit extends the picture: amplitudes (sqrt p0, sqrt p1) give the same odds by the Born rule', () => {
  for (const k of PCTS) {
    const v = b.fromPercent(k), s: q.State = [q.c(Math.sqrt(v[0])), q.c(Math.sqrt(v[1]))];
    const p = q.probs(s);
    close(p[0], v[0]); close(p[1], v[1]);
    close(q.norm2(s), 1); // squared magnitudes add up to 1 (2-norm)
    assert.ok(s[0].re + s[1].re >= 1 - 1e-12); // the amplitudes themselves add up to more than 1 unless the bit is sure
  }
});

test('same odds, different thing: H twice on |0> gives 0 every time, a 50/50 random bit through H stays 50/50', () => {
  const plus = q.matVec(q.H, q.ket0());
  close(q.probs(plus)[0], 0.5); close(q.probs(plus)[1], 0.5); // like a fair coin
  const back = q.matVec(q.H, plus);
  close(q.probs(back)[0], 1);
  // The two contributions to the amplitude of 1 cancel: (1/sqrt2)(1/sqrt2) + (-1/sqrt2)(1/sqrt2) = 0.
  const parts = [q.mul(q.H[1][0], plus[0]), q.mul(q.H[1][1], plus[1])];
  close(parts[0].re, 0.5); close(parts[1].re, -0.5); close(q.abs(q.add(parts[0], parts[1])), 0);
  // A bit that is |0> or |1> at 50/50: average the outcome odds of each case.
  const fair = b.fromPercent(50);
  const p0 = fair[0] * q.probs(q.matVec(q.H, q.ket0()))[0] + fair[1] * q.probs(q.matVec(q.H, q.ket1()))[0];
  close(p0, 0.5);
});

test('a qubit set to |0> or |1> by a fair coin flip gives 0 half the time after H twice, while |+> gives 0 every time', () => {
  const fair = b.fromPercent(50), HH = (s: q.State) => q.matVec(q.H, q.matVec(q.H, s));
  const p0 = fair[0] * q.probs(HH(q.ket0()))[0] + fair[1] * q.probs(HH(q.ket1()))[0];
  close(p0, 0.5);
  close(q.probs(q.matVec(q.H, q.plus()))[0], 1);
  // After one Hadamard each case alone gives 50/50, so the coin-picked qubit does too.
  for (const s of [q.ket0(), q.ket1()]) close(q.probs(q.matVec(q.H, s))[0], 0.5);
});
