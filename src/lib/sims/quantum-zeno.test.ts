import test from 'node:test';
import assert from 'node:assert/strict';
import * as q from '../quantum.ts';
import {
  QUBITS, MIN_CHECKS, MAX_CHECKS, HALF_TURN, stepAngle, stepGate, flipChance, allZeroChance, oneChanceAt, endOneChance, largeN,
  run, batch, tally, percent, degrees, checks, valueText, theory, summary, type Bit,
} from './quantum-zeno.ts';

const close = (a: number, b: number, eps = 1e-12) => assert.ok(Math.abs(a - b) < eps, `${a} != ${b}`);
const NS = [1, 2, 3, 4, 5, 8, 10, 16, 32, 64, 100];

/** Every history of n checks with its Born rule probability, worked out on the state vector (no shortcut formulas). */
function histories(n: number, total = HALF_TURN): { bits: Bit[]; p: number; z: number[] }[] {
  const u = stepGate(n, total), out: { bits: Bit[]; p: number; z: number[] }[] = [];
  const go = (s: q.State, bits: Bit[], p: number, z: number[]) => {
    if (bits.length === n) { out.push({ bits, p, z }); return; }
    const t = q.matVec(u, s), pr = q.probs(t);
    close(pr[0] + pr[1], 1);
    for (const r of [0, 1] as Bit[]) {
      if (pr[r] === 0) continue;
      const after = q.normalize(t.map((a, i) => (i === r ? a : q.c(0))));
      go(after, [...bits, r], p * pr[r], [...z, q.bloch(after)[2]]);
    }
  };
  go(q.ket0(), [], 1, []);
  return out;
}

test('the drive alone (1 check, at the end) turns |0> into |1>: every qubit reads 1', () => {
  const s = q.matVec(stepGate(1), q.ket0());
  close(q.probs(s)[1], 1);
  // Exactly, not just close: cos(pi/2) float dust is cleaned away.
  assert.equal(endOneChance(1), 1);
  assert.equal(allZeroChance(1), 0);
  assert.equal(flipChance(1), 1);
  const rand = q.rng(3);
  for (let k = 0; k < 2000; k++) assert.deepEqual(run(1, rand), [1]);
});

test('the drive alone over a turn theta gives 1 with chance sin^2(theta/2), the Born rule on RY(theta)|0>', () => {
  for (const t of [0, 0.3, 1, Math.PI / 2, 2, Math.PI]) {
    const p1 = q.probs(q.matVec(q.RY(t), q.ket0()))[1];
    close(endOneChance(1, t), Math.sin(t / 2) ** 2);
    close(endOneChance(1, t), p1);
  }
});

test('n checks split the half turn into equal steps of 180°/n on the Bloch sphere', () => {
  for (const n of NS) close(stepAngle(n) * n, Math.PI);
  close(stepAngle(4), Math.PI / 4);
  // n steps of RY(pi/n) with no checks in between make RY(pi), which takes |0> to |1>.
  for (const n of [2, 3, 7, 16]) {
    let s = q.ket0();
    for (let k = 0; k < n; k++) s = q.matVec(stepGate(n), s);
    close(q.probs(s)[1], 1);
  }
});

test('flip chance is sin^2(step/2) and the same from |0> as from |1>, global phase or not', () => {
  for (const n of NS) {
    const u = stepGate(n), f = flipChance(n);
    close(q.probs(q.matVec(u, q.ket0()))[1], f);
    close(q.probs(q.matVec(u, q.ket1()))[0], f);
    // A qubit that flipped back can be -|0>: same state, same odds.
    close(q.probs(q.matVec(u, [q.c(-1), q.c(0)]))[1], f);
    close(q.probs(q.matVec(u, [q.c(0), q.expi(1.3)]))[0], f);
  }
});

test('short gaps: the flip chance grows as the square of the step, so halving the gap quarters it', () => {
  for (const n of [1000, 10000]) {
    close(flipChance(n) / (Math.PI / (2 * n)) ** 2, 1, 1e-5);
    close(flipChance(n / 2) / flipChance(n), 4, 1e-4);
  }
});

test('Born rule over whole histories: the chances of all 2^n results sum to 1', () => {
  for (const n of [1, 2, 3, 4, 6, 8, 10]) {
    const h = histories(n);
    close(h.reduce((t, x) => t + x.p, 0), 1);
    for (const x of h) assert.ok(x.p >= 0);
  }
});

test('the formulas match the exact sum over histories: end at 1, all 0, and the chance of 1 at each check', () => {
  for (const total of [HALF_TURN, 1, 2.5]) for (const n of [1, 2, 3, 4, 5, 8, 10]) {
    const h = histories(n, total);
    close(h.filter((x) => x.bits[n - 1] === 1).reduce((t, x) => t + x.p, 0), endOneChance(n, total));
    close(h.filter((x) => x.bits.every((b) => b === 0)).reduce((t, x) => t + x.p, 0), allZeroChance(n, total));
    for (let k = 1; k <= n; k++) {
      close(h.filter((x) => x.bits[k - 1] === 1).reduce((t, x) => t + x.p, 0), oneChanceAt(k, n, total));
      // Averaged over results, the Bloch vector's z part after check k is cos^k(step).
      close(h.reduce((t, x) => t + x.p * x.z[k - 1], 0), Math.cos(stepAngle(n, total)) ** k);
    }
  }
});

test('ending at 1 means an odd number of flips: a binomial sum over flips gives the same chance', () => {
  for (const n of [1, 2, 3, 7, 16, 30]) {
    const f = flipChance(n);
    let odd = 0, choose = 1;
    for (let j = 0; j <= n; j++) {
      if (j % 2) odd += choose * f ** j * (1 - f) ** (n - j);
      choose = (choose * (n - j)) / (j + 1);
    }
    close(odd, endOneChance(n), 1e-12);
  }
});

test('known values, from exact cosines: Itano et al. P2(T) = (1 - cos^n(pi/n))/2', () => {
  close(endOneChance(2), 1 / 2);
  close(endOneChance(3), 7 / 16);
  close(endOneChance(4), 3 / 8);
  close(endOneChance(6), 37 / 128);
  close(endOneChance(8), (1 - ((2 + Math.SQRT2) / 4) ** 4) / 2);
  close(allZeroChance(2), 1 / 4);
  close(allZeroChance(3), 27 / 64);
  close(allZeroChance(4), ((2 + Math.SQRT2) / 4) ** 4);
  // The n of the ion test: 1, 2, 4, ..., 64 pulses. Rounded to 3 places.
  const want = [1, 0.5, 0.375, 0.235, 0.133, 0.072, 0.037];
  [1, 2, 4, 8, 16, 32, 64].forEach((n, i) => close(endOneChance(n), want[i], 6e-4));
});

test('the numbers in the stop text: 20% at 10 checks, 2.4% at 100, and the 1.8° step', () => {
  close(endOneChance(10), 0.197, 5e-4);
  close(endOneChance(100), 0.024, 5e-4);
  // 100 checks: each Bloch turn is 1.8°, so the amplitude of 1 is sin(0.9°) = sin(pi/200).
  const a = q.matVec(stepGate(100), q.ket0())[1].re;
  close(a, Math.sin(Math.PI / 200));
  close(a, 0.016, 5e-4);
  close(a * a, 0.00025, 5e-6);
  close(flipChance(100), a * a);
});

test('more checks, less change: ending at 1 falls and reading 0 at every check rises with n', () => {
  for (let n = MIN_CHECKS; n < MAX_CHECKS; n++) {
    assert.ok(endOneChance(n + 1) < endOneChance(n), `n=${n}`);
    assert.ok(allZeroChance(n + 1) > allZeroChance(n), `n=${n}`);
    // Ending at 1 needs at least one check that read 1.
    assert.ok(endOneChance(n) <= 1 - allZeroChance(n) + 1e-15, `n=${n}`);
    for (const p of [endOneChance(n), allZeroChance(n), flipChance(n)]) assert.ok(p >= 0 && p <= 1);
  }
});

test('the Zeno limit: both leftover chances fall like pi^2/(4n), and never reach 0 for finite n', () => {
  for (const n of [1e4, 1e6]) {
    close(endOneChance(n) / largeN(n), 1, 1e-3);
    close((1 - allZeroChance(n)) / largeN(n), 1, 1e-3);
    assert.ok(endOneChance(n) > 0);
  }
  close(largeN(100), Math.PI ** 2 / 400);
  // For many checks, doubling them roughly halves the chance to end at 1.
  close(endOneChance(100) / endOneChance(50), 0.5, 0.02);
});

test('no drive, nothing to stop: every check reads 0', () => {
  const rand = q.rng(9);
  for (const n of [1, 5, 40]) {
    close(endOneChance(n, 0), 0); close(allZeroChance(n, 0), 1); close(flipChance(n, 0), 0);
    for (let k = 0; k < 200; k++) assert.ok(run(n, rand, 0).every((b) => b === 0));
  }
});

test('run and batch: n results per qubit, one row per qubit, only 0 and 1', () => {
  const rows = batch(16, q.rng(2));
  assert.equal(rows.length, QUBITS);
  for (const r of rows) { assert.equal(r.length, 16); assert.ok(r.every((b) => b === 0 || b === 1)); }
  assert.equal(batch(3, q.rng(2), 7).length, 7);
  // Seeded: the same seed replays the same shots.
  assert.deepEqual(batch(10, q.rng(42)), batch(10, q.rng(42)));
});

// Statistical checks use a seeded generator, so they are repeatable. 5 standard deviations: a false fail is about 1 in 3.5 million.
const within5 = (count: number, trials: number, p: number, what: string) => {
  const mean = trials * p, sd = Math.sqrt(trials * p * (1 - p));
  assert.ok(Math.abs(count - mean) <= 5 * sd + 1e-9, `${what}: ${count}, expected ${mean.toFixed(1)} ± ${sd.toFixed(1)}`);
};

test('simulated runs follow the Born rule: ending at 1 and reading 0 at every check match theory', () => {
  for (const n of [2, 3, 4, 8, 16, 64]) {
    const N = n > 16 ? 6000 : 20000, t = tally(batch(n, q.rng(100 + n), N));
    within5(t.endOne, N, endOneChance(n), `n=${n} end at 1`);
    within5(t.allZero, N, allZeroChance(n), `n=${n} all 0`);
    assert.equal(t.endOne + t.endZero, N);
  }
});

test('simulated flips: each check flips with chance sin^2(step/2), from 0 and from 1 alike', () => {
  for (const n of [3, 8, 32]) {
    const rows = batch(n, q.rng(500 + n), 8000);
    let from0 = 0, flip0 = 0, from1 = 0, flip1 = 0;
    for (const r of rows) {
      let last: Bit = 0;
      for (const b of r) { if (last === 0) { from0++; flip0 += b; } else { from1++; flip1 += 1 - b; } last = b; }
    }
    within5(flip0, from0, flipChance(n), `n=${n} flips from 0`);
    within5(flip1, from1, flipChance(n), `n=${n} flips from 1`);
    within5(tally(rows).flips, from0 + from1, flipChance(n), `n=${n} all flips`);
  }
});

test('simulated runs: the chance of 1 at each check follows (1 - cos^k(step))/2', () => {
  const n = 8, N = 20000, rows = batch(n, q.rng(77), N);
  for (let k = 1; k <= n; k++) within5(rows.filter((r) => r[k - 1] === 1).length, N, oneChanceAt(k, n), `check ${k}`);
});

test('tally counts ends, all-zero rows and flips from the start state 0', () => {
  const t = tally([[0, 0, 0], [0, 1, 1], [1, 0, 1], [0, 0, 1], [1, 1, 0]]);
  assert.deepEqual(t, { qubits: 5, endZero: 2, endOne: 3, allZero: 1, flips: 0 + 1 + 3 + 1 + 2 });
  assert.deepEqual(tally([]), { qubits: 0, endZero: 0, endOne: 0, allZero: 0, flips: 0 });
});

test('text: percents never show a false 0% or 100%', () => {
  assert.equal(percent(0), '0%');
  assert.equal(percent(1), '100%');
  assert.equal(percent(0.5), '50%');
  assert.equal(percent(0.13343), '13%');
  assert.equal(percent(0.0372), '3.7%');
  assert.equal(percent(0.05), '5%');
  assert.equal(percent(0.0096), '0.96%');
  assert.equal(percent(0.000247), '0.025%');
  assert.equal(percent(0.006), '0.6%');
  assert.equal(percent(0.9756), '98%');
  assert.equal(percent(0.995), 'over 99%');
  assert.equal(percent(1e-9), '0.0000001%');
  for (const n of NS) for (const p of [endOneChance(n), allZeroChance(n), flipChance(n)]) {
    if (p > 0 && p < 1) assert.ok(!['0%', '100%'].includes(percent(p)), `${p} -> ${percent(p)}`);
  }
});

test('text: angles, counts and readouts', () => {
  assert.equal(degrees(stepAngle(1)), '180°');
  assert.equal(degrees(stepAngle(16)), '11.25°');
  assert.equal(degrees(stepAngle(100)), '1.8°');
  assert.equal(degrees(stepAngle(64)), 'about 2.81°');
  assert.equal(degrees(stepAngle(7)), 'about 25.71°');
  assert.equal(checks(1), '1 check');
  assert.equal(checks(16), '16 checks');
  assert.equal(valueText(16), '16 checks. Theory: 13% of qubits end at 1.');
  assert.equal(valueText(1), '1 check. Theory: 100% of qubits end at 1.');
  assert.match(theory(1), /every qubit reads 1/);
  assert.equal(theory(16), 'Between checks, each qubit turns 11.25° on the Bloch sphere. So at each check the result flips (0 to 1, or 1 to 0) with chance 0.96%. Theory: 13% of qubits end at 1 (about 7 of 50), and 86% read 0 at every check. With no checks before the end, all would end at 1.');
  assert.equal(theory(2), 'Between checks, each qubit turns 90° on the Bloch sphere. So at each check the result flips (0 to 1, or 1 to 0) with chance 50%. Theory: 50% of qubits end at 1 (about 25 of 50), and 25% read 0 at every check. With no checks before the end, all would end at 1.');
  const t = tally([[0, 0], [0, 1], [1, 1], [1, 0]]);
  assert.equal(summary(2, t), '2 checks: 1 of 4 qubits read 0 at every check. At the end, 2 read 1 (50%) and 2 read 0. Theory: 50% end at 1.');
  assert.equal(summary(1, tally([[1], [1]])), '1 check, at the end: all 2 qubits read 1. Theory: all read 1.');
  assert.equal(summary(1, tally([[1], [0]])), '1 check, at the end: 1 of 2 qubits read 1. Theory: all read 1.');
  assert.equal(summary(1, tally(batch(1, q.rng(1)))), `1 check, at the end: all ${QUBITS} qubits read 1. Theory: all read 1.`);
});
