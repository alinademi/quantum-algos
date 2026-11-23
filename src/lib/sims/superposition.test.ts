import test from 'node:test';
import assert from 'node:assert/strict';
import * as q from '../quantum.ts';
import * as s from './superposition.ts';

const close = (a: number, b: number, eps = 1e-12) => assert.ok(Math.abs(a - b) < eps, `${a} != ${b}`);
const degrees = Array.from({ length: 181 }, (_, d) => d);
const pct = (t: string) => Number(t.replace(/\D/g, ''));

// ---- Four ways: the state

test('RY from 0: known states at 0, 60, 90, 120 and 180 degrees', () => {
  assert.deepEqual(s.rotated(0), [q.c(1), q.c(0)]);
  assert.deepEqual(s.rotated(180), [q.c(0), q.c(1)]);
  close(s.rotated(60)[0].re, Math.sqrt(3) / 2); close(s.rotated(60)[1].re, 0.5);
  close(s.rotated(120)[0].re, 0.5); close(s.rotated(120)[1].re, Math.sqrt(3) / 2);
});

test('RY 90 degrees on 0 is the same state as a Hadamard gate on 0: |+>', () => {
  s.rotated(90).forEach((a, i) => { close(a.re, q.plus()[i].re); close(a.im, 0); });
  s.rotated(90).forEach((a, i) => close(a.re, s.hadamardState()[i].re));
});

test('every angle gives a unit vector with real, non-negative amplitudes', () => {
  for (const d of degrees) {
    const st = s.rotated(d);
    close(q.norm2(st), 1);
    st.forEach((a) => { assert.equal(a.im, 0); assert.ok(a.re >= 0); });
  }
});

test('Born rule: P(0) = cos^2(deg/2) = (1 + cos deg)/2, and P(0) + P(1) = 1', () => {
  for (const d of degrees) {
    const p = q.probs(s.rotated(d)), r = (d * Math.PI) / 180;
    close(s.probZero(s.rotated(d)), Math.cos(r / 2) ** 2);
    close(p[0], (1 + Math.cos(r)) / 2);
    close(p[0] + p[1], 1);
  }
});

test('P(0) falls strictly from 1 to 0, and the odds mirror: P0(d) = P1(180 - d)', () => {
  for (let d = 1; d <= 180; d++) assert.ok(s.probZero(s.rotated(d)) < s.probZero(s.rotated(d - 1)));
  for (const d of degrees) close(s.probZero(s.rotated(d)), q.probs(s.rotated(180 - d))[1]);
});

// ---- Four ways: the words and numbers it shows

test('Words: known values', () => {
  const w = (d: number) => s.words(s.probZero(s.rotated(d)));
  assert.equal(w(0), 'Always 0.');
  assert.equal(w(180), 'Always 1.');
  assert.equal(w(90), '50% chance of 0, 50% chance of 1.');
  assert.equal(w(60), '75% chance of 0, 25% chance of 1.');
  assert.equal(w(120), '25% chance of 0, 75% chance of 1.');
  assert.equal(w(1), 'over 99% chance of 0, under 1% chance of 1.');
  assert.equal(w(179), 'under 1% chance of 0, over 99% chance of 1.');
});

test('Words: odds add to 100% at every angle, mirror at 180 - d, and never claim a false 0% or 100%', () => {
  for (const d of degrees.slice(1, 180)) {
    const p0 = s.probZero(s.rotated(d)), [a, b] = s.odds(p0);
    if (/^\d+%$/.test(a)) assert.equal(pct(a) + pct(b), 100);
    else assert.ok([a, b].sort().join() === 'over 99%,under 1%', `${a} ${b}`);
    assert.notEqual(a, '0%'); assert.notEqual(a, '100%'); assert.notEqual(b, '0%'); assert.notEqual(b, '100%');
    assert.deepEqual(s.odds(s.probZero(s.rotated(180 - d))), [b, a]);
  }
  for (let k = 0; k <= 10000; k++) {
    const [a, b] = s.odds(k / 10000);
    if (/^\d+%$/.test(a)) assert.equal(pct(a) + pct(b), 100);
  }
  assert.deepEqual(s.odds(0.125), ['13%', '87%']);
  assert.deepEqual(s.odds(0.99), ['99%', '1%']);
  assert.deepEqual(s.odds(0.995), ['over 99%', 'under 1%']);
});

test('Ket and vector text: two decimals, true minus sign, never -0.00', () => {
  assert.equal(s.ket(s.rotated(90)), '|ψ⟩ = 0.71|0⟩ + 0.71|1⟩');
  assert.equal(s.ket(s.rotated(0)), '|ψ⟩ = 1.00|0⟩ + 0.00|1⟩');
  assert.equal(s.ket(s.rotated(180)), '|ψ⟩ = 0.00|0⟩ + 1.00|1⟩');
  assert.equal(s.ket(s.rotated(60)), '|ψ⟩ = 0.87|0⟩ + 0.50|1⟩');
  assert.equal(s.ket(q.minus()), '|ψ⟩ = 0.71|0⟩ − 0.71|1⟩');
  assert.equal(s.amp(-0.001), '0.00');
  assert.equal(s.amp(-0.5), '−0.50');
  assert.equal(s.amp(Math.SQRT1_2), '0.71');
});

// ---- Four ways: the batch of 100 dots

test('Batch: all copies give 0 at |0>, none at |1>', () => {
  const us = Array.from({ length: s.DOTS }, q.rng(7));
  assert.ok(s.gaveZero(us, s.probZero(s.rotated(0))).every(Boolean));
  assert.ok(!s.gaveZero(us, s.probZero(s.rotated(180))).some(Boolean));
  assert.equal(s.gaveZero([0], s.probZero(s.rotated(180)))[0], false, 'a draw of exactly 0 still gives 1 at |1>');
});

test('Batch: turning the angle up only flips copies from 0 to 1, never back', () => {
  const us = Array.from({ length: s.DOTS }, q.rng(3));
  let prev = s.gaveZero(us, 1);
  for (const d of degrees) {
    const now = s.gaveZero(us, s.probZero(s.rotated(d)));
    now.forEach((z, i) => assert.ok(!z || prev[i], `copy ${i} flipped back at ${d} degrees`));
    prev = now;
  }
});

test('Batch: each copy follows the Born rule (frequency within 5 sigma)', () => {
  const n = 200000, us = Array.from({ length: n }, q.rng(11));
  for (const d of [30, 60, 90, 135]) {
    const p0 = s.probZero(s.rotated(d)), z = s.gaveZero(us, p0).filter(Boolean).length;
    assert.ok(Math.abs(z / n - p0) < 5 * Math.sqrt((p0 * (1 - p0)) / n), `${d} degrees: ${z / n} vs ${p0}`);
  }
});

// ---- Guess, then run

test('Hadamard on 0: odds are 1/2 and 1/2 and add to 1', () => {
  const p = s.hadamardOdds();
  close(p[0], 0.5); close(p[1], 0.5); close(p[0] + p[1], 1);
});

test('Shots: 1,000 results, each 0 or 1, the same for the same seed', () => {
  const a = s.runShots(s.hadamardOdds(), s.SHOTS, q.rng(5)), b = s.runShots(s.hadamardOdds(), s.SHOTS, q.rng(5));
  assert.equal(a.length, s.SHOTS);
  assert.ok(a.every((x) => x === 0 || x === 1));
  assert.deepEqual(a, b);
});

test('Shots follow the Born rule: zeros within 5 sigma of n/2, and certain states never miss', () => {
  const n = 200000, z = s.runShots(s.hadamardOdds(), n, q.rng(9)).filter((x) => x === 0).length;
  assert.ok(Math.abs(z - n / 2) < 5 * Math.sqrt(n / 4), `${z} zeros of ${n}`);
  assert.ok(s.runShots(q.probs(q.ket0()), 1000, q.rng(2)).every((x) => x === 0));
  assert.ok(s.runShots(q.probs(q.ket1()), 1000, q.rng(2)).every((x) => x === 1));
});

test('Guess: only "About 500" is right for 1,000 shots at 50/50', () => {
  assert.equal(s.bestGuess(s.hadamardOdds()[0]), 500);
  assert.equal(s.bestGuess(1), 1000);
  assert.equal(s.bestGuess(0), 0);
  assert.equal(s.bestGuess(0.25), 250);
});

test('Verdict: judged on the guess, says the counts, and never says "not exactly 500" when it was 500', () => {
  assert.match(s.verdict(500, 512), /^Right\. You got 512 zeros and 488 ones, not exactly 500 each, because each shot is random\./);
  assert.match(s.verdict(500, 487), /^Right\./);
  const exact = s.verdict(500, 500);
  assert.match(exact, /^Right\. You got exactly 500 zeros and 500 ones this time\./);
  assert.doesNotMatch(exact, /not exactly/);
  for (const g of [0, 250, 1000]) assert.match(s.verdict(g, 503), /^Not quite\. You got 503 zeros and 497 ones\..*about 500 of each\.$/);
  for (const g of s.GUESSES) assert.doesNotMatch(s.verdict(g, 503), /square the amplitude|both at once/i);
});

test('Verdict: every message names the start state, since a Hadamard gate alone does not fix the odds (H|+> gives 0)', () => {
  for (const g of s.GUESSES) for (const z of [480, 500, 503]) assert.match(s.verdict(g, z), /Started as 0, a Hadamard gate gives a 50\/50 split/);
  close(q.probs(q.matVec(q.H, q.plus()))[0], 1);
});

// The verdict says most runs land a little off 500. Binomial(1000, 1/2) backs that up.
const logChoose = (n: number, k: number) => { let t = 0; for (let i = 1; i <= k; i++) t += Math.log((n - k + i) / i); return t; };
const pmf = (n: number, k: number) => Math.exp(logChoose(n, k) - n * Math.LN2);

test('1,000 fair shots: exactly 500 zeros is rare (about 2.5%), and over 99.8% of runs land within 50 of 500', () => {
  close(pmf(s.SHOTS, 500), 0.0252, 1e-4);
  let near = 0;
  for (let k = 450; k <= 550; k++) near += pmf(s.SHOTS, k);
  assert.ok(near > 0.998, String(near));
  let all = 0;
  for (let k = 0; k <= s.SHOTS; k++) all += pmf(s.SHOTS, k);
  close(all, 1, 1e-9);
});

// ---- Claims in the stop text

test('Text: a second Hadamard gate sends |+> to 0 every time; the two amplitudes for 1 are +1/2 and -1/2', () => {
  const plus = s.hadamardState(), back = q.matVec(q.H, plus);
  close(q.probs(back)[0], 1); close(q.probs(back)[1], 0);
  const viaZero = q.mul(q.H[1][0], plus[0]), viaOne = q.mul(q.H[1][1], plus[1]);
  close(viaZero.re, 0.5); close(viaOne.re, -0.5); close(q.add(viaZero, viaOne).re, 0);
});

test('Text: |+> and |-> give the same 50/50 odds, yet a Hadamard gate tells them apart', () => {
  q.probs(q.plus()).forEach((p, i) => close(p, q.probs(q.minus())[i]));
  close(q.probs(q.matVec(q.H, q.plus()))[0], 1);
  close(q.probs(q.matVec(q.H, q.minus()))[1], 1);
  close(q.abs(q.inner(q.plus(), q.minus())), 0);
});

test('Text: a 50/50 mix of 0 and 1 stays 50/50 after a Hadamard gate', () => {
  const after0 = q.probs(q.matVec(q.H, q.ket0())), after1 = q.probs(q.matVec(q.H, q.ket1()));
  close(0.5 * after0[0] + 0.5 * after1[0], 0.5);
  close(0.5 * after0[1] + 0.5 * after1[1], 0.5);
});

test('Text: (1+2i)/3 |0> - 2/3 |1> gives 0 with chance 5/9 and 1 with chance 4/9', () => {
  const st: q.State = [q.c(1 / 3, 2 / 3), q.c(-2 / 3)];
  close(q.probs(st)[0], 5 / 9); close(q.probs(st)[1], 4 / 9); close(q.norm2(st), 1);
});

test('Text: a global phase changes no odds, even after a Hadamard gate', () => {
  for (const g of [0.3, Math.PI / 2, Math.PI, 4]) {
    const st = s.rotated(70), ph = st.map((a) => q.mul(q.expi(g), a));
    q.probs(st).forEach((p, i) => close(p, q.probs(ph)[i]));
    q.probs(q.matVec(q.H, st)).forEach((p, i) => close(p, q.probs(q.matVec(q.H, ph))[i]));
  }
});
