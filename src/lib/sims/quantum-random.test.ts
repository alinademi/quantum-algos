import test from 'node:test';
import assert from 'node:assert/strict';
import * as q from '../quantum.ts';
import { BATCH, MAX_BITS, LCG, coinState, flip, flips, lcgBit, lcgBits, lcgNext, matches, ones, pOne, usualRange, type Bit } from './quantum-random.ts';

const close = (a: number, b: number, eps = 1e-12) => assert.ok(Math.abs(a - b) < eps, `${a} != ${b}`);

/** Exact binomial chance that a count of fair 50/50 events out of n lands in [lo, hi]. */
function binomialBetween(n: number, lo: number, hi: number): number {
  let pk = 2 ** -n, total = 0;
  for (let k = 0; k <= n; k++) {
    if (k >= lo && k <= hi) total += pk;
    pk = (pk * (n - k)) / (k + 1);
  }
  return total;
}

// ---- The quantum coin

test('start as 0, then H: amplitudes 1/sqrt(2) each, which is |+>', () => {
  const s = coinState(), r = Math.SQRT1_2;
  close(s[0].re, r); close(s[0].im, 0); close(s[1].re, r); close(s[1].im, 0);
  close(q.abs(q.inner(q.plus(), s)), 1);
});

test('Born rule: |1/sqrt(2)|^2 = 1/2 for each result, and the two sum to 1', () => {
  const p = q.probs(coinState());
  close(p[0], 0.5); close(p[1], 0.5); close(p[0] + p[1], 1);
  close(pOne(), 0.5);
});

test('a flip reads 1 when the draw falls below P(1) = 1/2, else 0', () => {
  assert.equal(flip(() => 0), 1);
  assert.equal(flip(() => 0.49), 1);
  assert.equal(flip(() => 0.51), 0);
  assert.equal(flip(() => 0.999), 0);
});

test('measuring the same qubit again repeats the bit, so each new bit needs a fresh qubit', () => {
  const rand = q.rng(5);
  for (let k = 0; k < 200; k++) {
    const first = q.measureQubit(coinState(), 0, rand);
    const again = q.measureQubit(first.state, 0, rand);
    assert.equal(again.result, first.result);
    close(q.probOne(first.state, 0), first.result);
  }
});

test('many flips land near half ones (within 5 standard deviations)', () => {
  const n = 100000, k = ones(flips(n, q.rng(11)));
  assert.ok(Math.abs(k - n / 2) < 5 * Math.sqrt(n) / 2, `${k} ones of ${n}`);
});

test('n fresh qubits: every n-bit string has probability 2^-n', () => {
  for (const n of [1, 2, 3, 4]) {
    let s = coinState();
    for (let i = 1; i < n; i++) s = q.tensor(s, coinState());
    const p = q.probs(s);
    assert.equal(p.length, 2 ** n);
    p.forEach((x) => close(x, 2 ** -n));
    close(p.reduce((a, b) => a + b, 0), 1);
  }
});

test('3-bit strings from flips come out evenly (chi-square, 7 degrees of freedom)', () => {
  const rand = q.rng(21), runs = 80000, counts = new Array(8).fill(0);
  for (let k = 0; k < runs; k++) { const [a, b, c] = flips(3, rand); counts[a * 4 + b * 2 + c]++; }
  const e = runs / 8, chi2 = counts.reduce((t, o) => t + (o - e) ** 2 / e, 0);
  assert.ok(chi2 < 24.32, `chi2 ${chi2}`); // 24.32 is the 0.999 point of chi-square with 7 degrees of freedom
});

// ---- The pseudo-random program

test('the LCG step matches exact big-integer math: (a x + c) mod 2^31', () => {
  const ref = (x: number) => Number((BigInt(LCG.a) * BigInt(x) + BigInt(LCG.c)) % BigInt(LCG.m));
  const rand = q.rng(3), xs = [0, 1, 42, LCG.m - 1, LCG.m - 2, 2 ** 30, 2 ** 30 - 1];
  for (let k = 0; k < 2000; k++) xs.push(Math.floor(rand() * LCG.m));
  for (const x of xs) { const y = lcgNext(x); assert.equal(y, ref(x)); assert.ok(y >= 0 && y < LCG.m); }
});

test('the output bit is the top bit of the state: 1 exactly when X >= 2^30', () => {
  assert.equal(lcgBit(2 ** 30 - 1), 0);
  assert.equal(lcgBit(2 ** 30), 1);
  assert.equal(lcgBit(LCG.m - 1), 1);
  assert.equal(lcgBit(0), 0);
});

test('same seed, same bits: anyone with the seed and the rule predicts every bit', () => {
  for (const seed of [1, 42, 100]) {
    const run1 = lcgBits(seed, MAX_BITS), run2 = lcgBits(seed, MAX_BITS);
    assert.deepEqual(run2, run1);
    assert.equal(matches(run1, run2), MAX_BITS);
    // Predict bit by bit from the rule alone.
    let x = seed;
    run1.forEach((b) => { x = lcgNext(x); assert.equal(lcgBit(x), b); });
    // A shorter run is the start of a longer one.
    assert.deepEqual(lcgBits(seed, BATCH), run1.slice(0, BATCH));
  }
});

test('different seeds give different bit lists (seeds 1 to 100)', () => {
  const seen = new Set<string>();
  for (let s = 1; s <= 100; s++) seen.add(lcgBits(s, MAX_BITS).join(''));
  assert.equal(seen.size, 100);
});

test('the constants meet the full-period conditions for mod 2^31: c odd, a - 1 divisible by 4', () => {
  assert.equal(LCG.m, 2 ** 31);
  assert.equal(LCG.c % 2, 1);
  assert.equal((LCG.a - 1) % 4, 0);
});

test('jump ahead: after 2^30 steps the state has not come back, after 2^31 it has, so the period is the full 2^31', () => {
  // The step x -> a x + c (mod m) composed with itself is x -> a^2 x + (a c + c). Squaring k times gives 2^k steps exactly.
  const m = BigInt(LCG.m);
  const jump = (k: number) => { let a = BigInt(LCG.a), c = BigInt(LCG.c); for (let i = 0; i < k; i++) { c = (a * c + c) % m; a = (a * a) % m; } return { a, c }; };
  const run = (j: { a: bigint; c: bigint }, x: number) => Number((j.a * BigInt(x) + j.c) % m);
  // One step of the jump code agrees with lcgNext.
  for (const x of [0, 1, 42, LCG.m - 1]) assert.equal(run(jump(0), x), lcgNext(x));
  // 2^31 steps is the identity map, so every cycle length divides 2^31 and is a power of 2.
  assert.deepEqual(jump(31), { a: 1n, c: 0n });
  // 2^30 steps add exactly 2^30 (mod 2^31) to every state, so no state is back: no cycle is shorter than 2^31.
  // One cycle therefore visits all 2^31 states, and the top bit is 1 on exactly half of them (those at or above 2^30).
  const half = jump(30);
  assert.deepEqual(half, { a: 1n, c: m / 2n });
  for (const x of [0, 1, 42, 100, 2 ** 30, LCG.m - 1]) assert.notEqual(run(half, x), x);
});

test('the bottom bit only alternates, which is why the top bit is used', () => {
  let x = 42, prev = x & 1;
  for (let k = 0; k < 1000; k++) { x = lcgNext(x); assert.equal(x & 1, 1 - prev); prev = x & 1; }
});

test('the top bit looks fair: over seeds 1 to 100 and 128 bits each, ones are near half', () => {
  let total = 0, inRange = 0;
  const { lo, hi } = usualRange(MAX_BITS);
  for (let s = 1; s <= 100; s++) { const k = ones(lcgBits(s, MAX_BITS)); total += k; if (k >= lo && k <= hi) inRange++; }
  const n = 100 * MAX_BITS;
  assert.ok(Math.abs(total - n / 2) < 5 * Math.sqrt(n) / 2, `${total} ones of ${n}`);
  assert.ok(inRange >= 85, `${inRange} of 100 seeds in the usual range`);
});

// ---- Counting and the usual range

test('ones and matches count correctly', () => {
  const a: Bit[] = [1, 0, 1, 1, 0], b: Bit[] = [1, 1, 0, 1, 0];
  assert.equal(ones(a), 3);
  assert.equal(matches(a, a), 5);
  assert.equal(matches(a, b), 3);
  assert.equal(matches(a, a.map((x) => (1 - x) as Bit)), 0);
  assert.equal(matches(a, b.slice(0, 2)), 1);
});

test('usual range is n/2 plus or minus sqrt(n), the known values the tool shows', () => {
  assert.deepEqual(usualRange(32), { lo: 11, hi: 21 });
  assert.deepEqual(usualRange(64), { lo: 24, hi: 40 });
  assert.deepEqual(usualRange(96), { lo: 39, hi: 57 });
  assert.deepEqual(usualRange(128), { lo: 53, hi: 75 });
});

test('usual range holds about 95% of the time (94.8% to 96.7%) for every row size the tool shows (exact binomial)', () => {
  for (let n = BATCH; n <= MAX_BITS; n += BATCH) {
    const { lo, hi } = usualRange(n), p = binomialBetween(n, lo, hi);
    assert.ok(p > 0.945 && p < 0.97, `n=${n}: ${p}`);
    close(binomialBetween(n, 0, n), 1, 1e-9);
  }
});

test('run the qubit again from the same start: about half the bits match, unlike the seeded program', () => {
  const rand = q.rng(8), trials = 2000;
  let total = 0, inRange = 0;
  const { lo, hi } = usualRange(MAX_BITS);
  for (let t = 0; t < trials; t++) {
    const m = matches(flips(MAX_BITS, rand), flips(MAX_BITS, rand));
    total += m; if (m >= lo && m <= hi) inRange++;
  }
  const n = trials * MAX_BITS;
  assert.ok(Math.abs(total - n / 2) < 5 * Math.sqrt(n) / 2, `${total} matches of ${n}`);
  assert.ok(inRange / trials > 0.93, `${inRange} of ${trials} in range`);
});
