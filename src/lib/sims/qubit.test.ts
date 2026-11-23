import test from 'node:test';
import assert from 'node:assert/strict';
import * as q from '../quantum.ts';
import * as s from './qubit.ts';

const close = (a: number, b: number, eps = 1e-12) => assert.ok(Math.abs(a - b) < eps, `${a} != ${b}`);
const closeC = (a: q.C, b: q.C) => { close(a.re, b.re); close(a.im, b.im); };
const closeM = (a: q.Matrix, b: q.Matrix) => a.forEach((row, i) => row.forEach((x, j) => closeC(x, b[i][j])));

/** Every list of steps up to a length, so claims are checked on all sequences the tool allows (8 steps max). */
function allSeqs(max: number): s.Step[][] {
  const out: s.Step[][] = [[]];
  for (let n = 1; n <= max; n++) {
    for (let m = 0; m < 2 ** n; m++) out.push(Array.from({ length: n }, (_, i) => ((m >> i) & 1 ? 'half' : 'flip')));
  }
  return out;
}
const SEQS = allSeqs(8);
const halves = (k: s.Step[]) => k.filter((x) => x === 'half').length;
const flips = (k: s.Step[]) => k.length - halves(k);

test('half flip is R = HSH = 1/2 [[1+i, 1-i], [1-i, 1+i]], as in Watrous', () => {
  closeM(s.HALF, [[q.c(0.5, 0.5), q.c(0.5, -0.5)], [q.c(0.5, -0.5), q.c(0.5, 0.5)]]);
});

test('half flip is unitary', () => {
  closeM(q.matMul(q.dagger(s.HALF), s.HALF), q.I);
  closeM(q.matMul(s.HALF, q.dagger(s.HALF)), q.I);
});

test('two half flips make exactly one flip: R^2 = X, and R^4 = I', () => {
  const r2 = q.matMul(s.HALF, s.HALF);
  closeM(r2, q.X);
  closeM(q.matMul(r2, r2), q.I);
});

test('half flip commutes with flip, so only the total count of half flips matters', () => {
  closeM(q.matMul(s.HALF, q.X), q.matMul(q.X, s.HALF));
});

test('known states: R|0> = ((1+i)/2, (1-i)/2), RR|0> = |1>, and from 1 two half flips give |0>', () => {
  const a = s.qubitState(['half']);
  closeC(a[0], q.c(0.5, 0.5)); closeC(a[1], q.c(0.5, -0.5));
  const b = s.qubitState(['half', 'half']);
  closeC(b[0], q.c(0)); closeC(b[1], q.c(1));
  const d = s.qubitState(['flip', 'half', 'half']);
  closeC(d[0], q.c(1)); closeC(d[1], q.c(0));
});

test('Born rule: qubit odds are |amplitude|^2 and sum to 1 on every sequence', () => {
  for (const k of SEQS) {
    const st = s.qubitState(k), [p0, p1] = s.qubitOdds(k);
    close(p0, q.abs2(st[0])); close(p1, q.abs2(st[1]));
    close(p0 + p1, 1);
    close(q.norm2(st), 1);
  }
});

test('qubit odds of 1 follow (half flips + 2 x flips) mod 4: 0, 1/2, 1, 1/2', () => {
  const want = [0, 0.5, 1, 0.5];
  for (const k of SEQS) close(s.qubitOdds(k)[1], want[(halves(k) + 2 * flips(k)) % 4]);
});

test('on 0 and 1 with flips only, the qubit acts like the bit', () => {
  for (const k of SEQS.filter((x) => halves(x) === 0)) {
    const p = flips(k) % 2;
    assert.deepEqual(s.bitOdds(k), [1 - p, p]);
    close(s.qubitOdds(k)[1], p);
  }
});

test('bit odds: a coin toss makes 50/50, and it stays 50/50 after any later step', () => {
  for (const k of SEQS) {
    const [p0, p1] = s.bitOdds(k);
    close(p0 + p1, 1);
    if (halves(k) > 0) { close(p0, 0.5); close(p1, 0.5); }
  }
});

test('one half flip from 0: bit and qubit have the same odds; two: they differ', () => {
  close(s.bitOdds(['half'])[1], s.qubitOdds(['half'])[1]);
  close(s.bitOdds(['half', 'half'])[1], 0.5);
  close(s.qubitOdds(['half', 'half'])[1], 1);
});

test('the coin toss is the only bit step with 50/50 odds from both 0 and 1, and it squares to itself', () => {
  // A stochastic matrix is fixed by its columns, which are its outputs for 0 and for 1.
  assert.deepEqual(s.stochApply(s.COIN_BIT, [1, 0]), [0.5, 0.5]);
  assert.deepEqual(s.stochApply(s.COIN_BIT, [0, 1]), [0.5, 0.5]);
  assert.deepEqual(s.stochMul(s.COIN_BIT, s.COIN_BIT), s.COIN_BIT);
  assert.deepEqual(s.stochMul(s.FLIP_BIT, s.FLIP_BIT), [[1, 0], [0, 1]]);
});

test('no stochastic M on one bit has M^2 = NOT', () => {
  const M = (a: number, b: number): s.Stochastic => [[a, b], [1 - a, 1 - b]];
  // Formula used on the page: (M^2)_00 = a^2 + b(1 - a), which is 0 only at a = b = 0.
  const r = q.rng(7);
  for (let i = 0; i < 1000; i++) { const a = r(), b = r(); close(s.stochMul(M(a, b), M(a, b))[0][0], a * a + b * (1 - a)); }
  assert.deepEqual(s.stochMul(M(0, 0), M(0, 0)), [[0, 0], [1, 1]]);
  // Scan the whole square: M^2 never gets close to NOT.
  let best = Infinity;
  for (let i = 0; i <= 200; i++) for (let j = 0; j <= 200; j++) {
    const m2 = s.stochMul(M(i / 200, j / 200), M(i / 200, j / 200));
    const d = Math.max(...m2.flat().map((x, k) => Math.abs(x - [0, 1, 1, 0][k])));
    best = Math.min(best, d);
  }
  assert.ok(best > 0.3, `closest M^2 to NOT is ${best} away`);
});

test('any bit step with 50/50 from 0, done twice from 0, gives 1 at most 75% of the time', () => {
  // Column 0 is fixed at (1/2, 1/2); b is the chance a 1 becomes 0. Then P(1) = 3/4 - b/2.
  let most = 0;
  for (let i = 0; i <= 1000; i++) {
    const b = i / 1000, m: s.Stochastic = [[0.5, b], [0.5, 1 - b]];
    const p1 = s.stochApply(m, s.stochApply(m, [1, 0]))[1];
    close(p1, 0.75 - b / 2);
    assert.ok(p1 <= 0.75 + 1e-12);
    most = Math.max(most, p1);
  }
  close(most, 0.75);
  close(s.qubitOdds(['half', 'half'])[1], 1);
});

test('qubit shots: sure states never miss, 50/50 states land near half', () => {
  const r = q.rng(42), N = 20000;
  assert.equal(s.ones(s.readQubits([], 500, r)), 0);
  assert.equal(s.ones(s.readQubits(['half', 'half'], 500, r)), 500);
  assert.equal(s.ones(s.readQubits(['flip', 'half', 'half'], 500, r)), 0);
  const f = s.ones(s.readQubits(['half'], N, r)) / N;
  assert.ok(Math.abs(f - 0.5) < 4 * Math.sqrt(0.25 / N), `qubit frequency ${f}`);
});

test('bit shots: each copy really runs its coin tosses; frequencies match the exact odds', () => {
  const r = q.rng(9), N = 20000;
  assert.equal(s.ones(s.readBits(['flip'], 500, r)), 500);
  assert.equal(s.ones(s.readBits(['flip', 'flip'], 500, r)), 0);
  for (const k of [['half'], ['half', 'half'], ['flip', 'half', 'half'], ['half', 'flip']] as s.Step[][]) {
    const f = s.ones(s.readBits(k, N, r)) / N;
    assert.ok(Math.abs(f - s.bitOdds(k)[1]) < 4 * Math.sqrt(0.25 / N), `bit frequency ${f} for ${k}`);
  }
});

test('amplitudes print to 2 decimals with a true minus sign', () => {
  assert.equal(s.fmtC(q.c(1)), '1');
  assert.equal(s.fmtC(q.c(0)), '0');
  assert.equal(s.fmtC(q.c(1e-17, -1e-17)), '0');
  assert.equal(s.fmtC(q.c(-1)), '−1');
  assert.equal(s.fmtC(q.c(0.5, 0.5)), '0.5+0.5i');
  assert.equal(s.fmtC(q.c(0.5, -0.5)), '0.5−0.5i');
  assert.equal(s.fmtC(q.c(0, 1)), 'i');
  assert.equal(s.fmtC(q.c(0, -1)), '−i');
  assert.equal(s.fmtC(q.c(Math.SQRT1_2)), '0.71');
  const st = s.qubitState(['half', 'half', 'half']);
  assert.deepEqual(st.map(s.fmtC), ['0.5−0.5i', '0.5+0.5i']);
});

test('readout: a sure bit always means a sure qubit, so the words never contradict the math', () => {
  for (const k of SEQS) if (s.sure(s.bitOdds(k)[1])) assert.ok(s.sure(s.qubitOdds(k)[1]));
});

test('readout words match the odds', () => {
  assert.match(s.describe([], 0, 0, 100), /^Both start at 0\. Bit: all 100 read 0, odds of 1 are 0%\. Qubit: all 100 read 0, odds of 1 are 0%\./);
  const two = s.describe(['half', 'half'], 47, 100, 100);
  assert.match(two, /Bit: 47 of 100 read 1, odds of 1 are 50%/);
  assert.match(two, /Qubit: all 100 read 1, odds of 1 are 100%/);
  assert.match(two, /reads 1 every time/);
  assert.match(s.describe(['half', 'half', 'half', 'half'], 52, 0, 100), /reads 0 every time/);
  assert.match(s.describe(['flip'], 100, 100, 100), /acts just like the bit/);
  assert.match(s.describe(['half'], 51, 49, 100), /Same odds/);
  assert.match(s.describe(['half', 'flip'], 51, 49, 100), /Steps: half flip, flip\./);
});
