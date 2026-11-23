import test from 'node:test';
import assert from 'node:assert/strict';
import * as q from '../quantum.ts';
import { prepare, turn, born, run, matchChance, tally, binomial, amp, ket, percent, chance, about, type Bit, type Mode } from './measurement.ts';

const close = (a: number, b: number, eps = 1e-12) => assert.ok(Math.abs(a - b) < eps, `${a} != ${b}`);
const B = [-1, -0.8, -Math.SQRT1_2, -0.5, -0.01, 0, 0.01, 0.3, 0.5, Math.SQRT1_2, 0.8, 0.99, 1];

test('prepare(b) is a unit vector with a >= 0 and amplitude b for 1', () => {
  for (const b of B) {
    const s = prepare(b);
    close(q.norm2(s), 1);
    assert.ok(s[0].re >= 0);
    close(s[1].re, b);
    close(s[0].im, 0); close(s[1].im, 0);
  }
  assert.deepEqual(prepare(2), prepare(1));
  assert.deepEqual(prepare(-3), prepare(-1));
});

test('prepare(b) is RY(turn(b)) applied to a qubit started as 0', () => {
  for (const b of B) {
    const r = q.matVec(q.RY(turn(b)), q.ket0()), s = prepare(b);
    close(r[0].re, s[0].re); close(r[1].re, s[1].re);
  }
  close(turn(1), Math.PI); close(turn(0), 0); close(turn(Math.SQRT1_2), Math.PI / 2);
});

test('presets: b = 0 is |0>, b = 1 is |1>, b = ±1/√2 are |+> and |->', () => {
  assert.deepEqual(prepare(0), q.ket0());
  assert.deepEqual(prepare(1), q.ket1());
  const p = prepare(Math.SQRT1_2), m = prepare(-Math.SQRT1_2);
  close(p[0].re, q.plus()[0].re); close(p[1].re, q.plus()[1].re);
  close(m[0].re, q.minus()[0].re); close(m[1].re, q.minus()[1].re);
});

test('Born rule: odds are |amplitude|^2 and sum to 1', () => {
  for (const b of B) {
    const [p0, p1] = born(prepare(b));
    close(p0 + p1, 1);
    close(p1, b * b);
    assert.ok(p0 >= 0 && p1 >= 0);
  }
});

test('Born rule known values: 0.6|0> + 0.8|1> gives 36% and 64%; amplitude 0.5 gives 25%, not 50%', () => {
  const [p0, p1] = born(prepare(0.8));
  close(p0, 0.36); close(p1, 0.64);
  close(born(prepare(0.5))[1], 0.25);
});

test('Born rule with complex amplitudes (Watrous): (1+2i)/3 |0> - 2/3 |1> gives 5/9 and 4/9', () => {
  const [p0, p1] = born([q.c(1 / 3, 2 / 3), q.c(-2 / 3)]);
  close(p0, 5 / 9); close(p1, 4 / 9);
});

test('|+> and |-> give the same 50/50 odds; a minus sign on b never changes them', () => {
  const [a0, a1] = born(q.plus()), [b0, b1] = born(q.minus());
  close(a0, 0.5); close(a1, 0.5); close(b0, 0.5); close(b1, 0.5);
  for (const b of B) { const x = born(prepare(b)), y = born(prepare(-b)); close(x[0], y[0]); close(x[1], y[1]); }
});

test('global phase e^{i theta} changes no odds', () => {
  for (const b of B) for (const t of [0.4, 1, Math.PI, -2.2]) {
    const s = prepare(b), g = s.map((x) => q.mul(q.expi(t), x));
    const x = born(s), y = born(g);
    close(x[0], y[0]); close(x[1], y[1]);
  }
});

test('certain states: |0> always gives 0 and |1> always gives 1, in both modes', () => {
  const rand = q.rng(5);
  for (const mode of ['same', 'fresh'] as Mode[]) for (let k = 0; k < 2000; k++) {
    assert.deepEqual(run(prepare(0), mode, rand), [0, 0, 0]);
    assert.deepEqual(run(prepare(1), mode, rand), [1, 1, 1]);
    assert.deepEqual(run(prepare(-1), mode, rand), [1, 1, 1]);
  }
});

test('the jump: after result r the state is |r> (up to a global phase), so its odds are certain', () => {
  const rand = q.rng(11);
  for (const b of [-0.9, -0.5, 0.3, Math.SQRT1_2, 0.8]) for (let k = 0; k < 200; k++) {
    const m = q.measureQubit(prepare(b), 0, rand, 1);
    close(q.abs2(m.state[m.result]), 1, 1e-15);
    close(q.abs2(m.state[1 - m.result]), 0);
  }
  // A complex state jumps to |0> times the phase a/|a|.
  const m = q.measureQubit([q.c(1 / 3, 2 / 3), q.c(-2 / 3)], 0, () => 0.99, 1);
  assert.equal(m.result, 0);
  close(m.state[0].re, 1 / Math.sqrt(5)); close(m.state[0].im, 2 / Math.sqrt(5));
});

test('the jump from a complex state: result 1 leaves |1> times the phase b/|b|', () => {
  const s = [q.c(1 / 3, 2 / 3), q.c(0, -2 / 3)];
  const m = q.measureQubit(s, 0, () => 0, 1);
  assert.equal(m.result, 1);
  close(q.abs2(m.state[0]), 0);
  close(m.state[1].re, 0); close(m.state[1].im, -1);
});

test('same mode with a complex start state: repeats match, first results follow |amplitude|^2', () => {
  const s = [q.c(1 / 3, 2 / 3), q.c(0, -2 / 3)], rand = q.rng(99), n = 40000;
  let ones = 0;
  for (let k = 0; k < n; k++) {
    const r = run(s, 'same', rand, 4);
    assert.ok(r.every((x) => x === r[0]));
    ones += r[0];
  }
  const { mean, sd } = binomial(n, 4 / 9);
  assert.ok(Math.abs(ones - mean) < 5 * sd, `${ones} ones, expected ${mean} ± ${sd}`);
});

test('same qubit: every repeat matches the first result', () => {
  const rand = q.rng(7);
  for (const b of B) for (let k = 0; k < 500; k++) {
    const r = run(prepare(b), 'same', rand, 5);
    assert.ok(r.every((x) => x === r[0]), `run ${r} for b=${b}`);
  }
});

// Statistical checks use a seeded generator, so they are repeatable. 5 standard deviations: a false fail is about 1 in 3.5 million.
const N = 40000;
test('first results follow the Born rule over many runs, in both modes', () => {
  for (const mode of ['same', 'fresh'] as Mode[]) for (const b of [0.2, 0.5, -Math.SQRT1_2, 0.8, -0.95]) {
    const rand = q.rng(1000 + Math.round(b * 100)), p1 = born(prepare(b))[1];
    let ones = 0;
    for (let k = 0; k < N; k++) ones += run(prepare(b), mode, rand)[0];
    const { mean, sd } = binomial(N, p1);
    assert.ok(Math.abs(ones - mean) < 5 * sd, `${mode} b=${b}: ${ones} ones, expected ${mean} ± ${sd}`);
  }
});

test('fresh copies: repeats match the first with chance p0^2 + p1^2, and each repeat is its own Born draw', () => {
  for (const b of [0.3, 0.5, Math.SQRT1_2, -0.8]) {
    const s = prepare(b), rand = q.rng(77 + Math.round(b * 100)), p1 = born(s)[1], m = matchChance(s, 'fresh');
    const runs: Bit[][] = [];
    for (let k = 0; k < N; k++) runs.push(run(s, 'fresh', rand));
    const t = tally(runs), e = binomial(t.repeats, m);
    assert.ok(Math.abs(t.matches - e.mean) < 5 * e.sd, `b=${b}: ${t.matches} matches, expected ${e.mean} ± ${e.sd}`);
    const second = runs.reduce((n, r) => n + r[1], 0), e1 = binomial(N, p1);
    assert.ok(Math.abs(second - e1.mean) < 5 * e1.sd);
  }
});

test('matchChance: 1 on the same qubit; p0^2 + p1^2 on fresh copies, lowest (1/2) at an even split', () => {
  for (const b of B) close(matchChance(prepare(b), 'same'), 1);
  close(matchChance(q.plus(), 'fresh'), 0.5);
  close(matchChance(prepare(0.5), 'fresh'), 0.75 ** 2 + 0.25 ** 2);
  close(matchChance(prepare(0), 'fresh'), 1);
  close(matchChance(prepare(1), 'fresh'), 1);
  for (const b of B) assert.ok(matchChance(prepare(b), 'fresh') >= 0.5 - 1e-12);
});

test('the same seed gives the same results for b and -b: one basis measurement cannot see the sign', () => {
  for (const b of [0.3, Math.SQRT1_2, 0.9]) for (const mode of ['same', 'fresh'] as Mode[]) {
    const r1 = q.rng(3), r2 = q.rng(3);
    for (let k = 0; k < 300; k++) assert.deepEqual(run(prepare(b), mode, r1), run(prepare(-b), mode, r2));
  }
});

test('tally counts first results and matching repeats', () => {
  const t = tally([[0, 0, 0], [1, 1, 1], [0, 1, 0], [1, 0, 0]]);
  assert.deepEqual(t, { runs: 4, zeros: 2, ones: 2, repeats: 8, matches: 5 });
  assert.deepEqual(tally([]), { runs: 0, zeros: 0, ones: 0, repeats: 0, matches: 0 });
});

test('binomial mean and spread', () => {
  const e = binomial(100, 0.25);
  close(e.mean, 25); close(e.sd, Math.sqrt(18.75));
  assert.equal(binomial(50, 0).sd, 0);
  assert.equal(binomial(50, 1).sd, 0);
});

test('text: amplitudes, kets and percents', () => {
  assert.equal(amp(0.5), '0.500');
  assert.equal(amp(-0.5), '−0.500');
  assert.equal(amp(-0.0001), '0.000');
  assert.equal(ket(prepare(0.5)), '0.866|0⟩ + 0.500|1⟩');
  assert.equal(ket(prepare(-Math.SQRT1_2)), '0.707|0⟩ − 0.707|1⟩');
  assert.equal(ket(prepare(-1)), '0.000|0⟩ − 1.000|1⟩');
  assert.equal(ket(prepare(0)), '1.000|0⟩ + 0.000|1⟩');
  assert.equal(percent(0), '0%');
  assert.equal(percent(1), '100%');
  assert.equal(percent(0.0025), 'under 1%');
  assert.equal(percent(0.996), 'over 99%');
  assert.equal(percent(0.25), '25%');
  assert.equal(percent(born(prepare(Math.SQRT1_2))[0]), '50%');
  assert.equal(percent(matchChance(prepare(0.5), 'fresh')), '63%');
  assert.equal(about(30), '30');
  assert.equal(about(10 * 0.75), '7.5');
  assert.equal(about(7 * born(prepare(Math.SQRT1_2))[0]), '3.5');
  assert.equal(about(3 * 0.36), '1.1');
});

test('text: the Born rule worked out, "=" only when exact', () => {
  const [p0, p1] = born(prepare(0.5));
  assert.equal(chance(prepare(0.5)[1].re, p1), '|0.500|² = 25%');
  assert.equal(chance(prepare(0.5)[0].re, p0), '|0.866|² ≈ 75%');
  assert.equal(chance(prepare(0.8)[0].re, born(prepare(0.8))[0]), '|0.600|² = 36%');
  assert.equal(chance(-0.5, 0.25), '|−0.500|² = 25%');
  assert.equal(chance(0.05, 0.0025), '|0.050|² is under 1%');
  assert.equal(chance(1, 1), '|1.000|² = 100%');
  assert.equal(chance(0, 0), '|0.000|² = 0%');
});
