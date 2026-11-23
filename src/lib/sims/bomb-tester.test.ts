import test from 'node:test';
import assert from 'node:assert/strict';
import * as q from '../quantum.ts';
import * as bt from './bomb-tester.ts';

const close = (a: number, b: number, eps = 1e-12) => assert.ok(Math.abs(a - b) < eps, `${a} != ${b}`);
const closeAll = (a: number[], b: number[], eps = 1e-12) => { assert.equal(a.length, b.length); a.forEach((x, i) => close(x, b[i], eps)); };
const sum = (xs: number[]) => xs.reduce((t, x) => t + x, 0);
const isUnitary = (m: q.Matrix) => {
  const p = q.matMul(q.dagger(m), m);
  p.forEach((row, i) => row.forEach((x, j) => { close(x.re, i === j ? 1 : 0); close(x.im, 0); }));
};
const Ns = [1, 2, 3, 4, 5, 7, 10, 13, 20, 50, 99, 100];
// Elitzur and Vaidman's symmetric splitter, |1> -> (|1> + i|2>)/sqrt2: a different but valid convention.
const S2 = Math.SQRT1_2;
const EV: q.Matrix = [[q.c(S2), q.c(0, S2)], [q.c(0, S2), q.c(S2)]];
/** Count the results of many shots and check each share is within 5 standard errors of the exact chance. */
function agrees(fire: (r: () => number) => number, exact: number[], shots = 20000, seed = 7) {
  const r = q.rng(seed), n = [0, 0, 0];
  for (let k = 0; k < shots; k++) n[fire(r)]++;
  exact.forEach((p, i) => {
    if (p === 0) assert.equal(n[i], 0, `result ${i} should never happen`);
    else if (p === 1) assert.equal(n[i], shots, `result ${i} should always happen`);
    else assert.ok(Math.abs(n[i] / shots - p) < 5 * Math.sqrt((p * (1 - p)) / shots), `result ${i}: ${n[i] / shots} vs ${p}`);
  });
}

test('the beam splitters are unitary, and the first gives each arm amplitude 1/sqrt2', () => {
  isUnitary(q.H); isUnitary(EV);
  for (const r of [0.01, 0.1, 0.25, 0.5, 0.9]) bt.splitters(r).forEach(isUnitary);
  const arms = q.matVec(q.H, q.ket0());
  close(arms[0].re, S2); close(arms[1].re, S2);
  closeAll(q.probs(arms), [0.5, 0.5]);
});

test('dud: the dark-port amplitudes cancel, so every photon reaches the bright detector', () => {
  const out = q.matVec(q.H, q.matVec(q.H, q.ket0()));
  assert.equal(q.abs2(out[1]), 0); // 1/2 - 1/2, exactly
  closeAll(bt.mzOdds('dud'), [0, 1, 0]);
  closeAll(bt.odds('basic', 'dud', 10), [0, 0, 1]);
});

test('live bomb, one photon: 1/2 boom, 1/4 bright, 1/4 dark (Zwiebach 2.25, Elitzur-Vaidman eq. 5)', () => {
  closeAll(bt.mzOdds('live'), [0.5, 0.25, 0.25]);
  closeAll(bt.odds('basic', 'live', 10), [0.5, 0.25, 0.25]);
  close(sum(bt.mzOdds('live')), 1);
});

test('the physics does not depend on the splitter convention: same odds with the Elitzur-Vaidman splitter', () => {
  // With EV splitters the dud goes to port 1, so port 1 is bright and port 0 is dark.
  closeAll(bt.mzOdds('dud', EV, EV), [0, 0, 1]);
  closeAll(bt.mzOdds('live', EV, EV), [0.5, 0.25, 0.25]);
  // A global phase on a splitter (like the i from a mirror) changes nothing.
  const iH = q.H.map((row) => row.map((x) => q.mul(q.c(0, 1), x)));
  closeAll(bt.mzOdds('live', iH, q.H), [0.5, 0.25, 0.25]);
  closeAll(bt.mzOdds('dud', iH, q.H), [0, 1, 0]);
});

test('a dark click proves the bomb is live: a dud never gives one, in exact odds or in shots', () => {
  assert.equal(bt.odds('basic', 'dud', 1)[1], 0);
  assert.equal(bt.odds('basic', 'dud', 1)[0], 0);
  agrees((r) => bt.shot('basic', 'dud', 1, r), [0, 0, 1]);
});

test('shots follow the Born rule: basic live bomb', () => {
  agrees((r) => bt.shot('basic', 'live', 1, r), [0.5, 0.25, 0.25]);
  agrees((r) => bt.mzShot('live', r) , bt.mzOdds('live'), 20000, 3);
});

test('resending after each bright click finds 1/3 of live bombs safely: 1/4 + 1/16 + ... (Elitzur-Vaidman sec. 4)', () => {
  close(bt.resendSafe(bt.mzOdds('live')), 1 / 3);
  let series = 0;
  for (let k = 1; k <= 60; k++) series += 0.25 ** k;
  close(series, 1 / 3);
});

test('unbalanced splitters: boom r, bright (1-r)^2, dark r(1-r); the safe share stays below 1/2', () => {
  for (const r of [0.5, 0.3, 0.1, 0.01, 1e-4]) {
    const [b1, b2] = bt.splitters(r);
    closeAll(bt.mzOdds('dud', b1, b2), [0, 1, 0]);
    const o = bt.mzOdds('live', b1, b2);
    closeAll(o, [r, (1 - r) ** 2, r * (1 - r)]);
    close(sum(o), 1);
    // Elitzur and Vaidman: dark / boom = a^2 with a^2 = 1 - r, so the resend share is a^2 / (1 + a^2).
    close(o[2] / o[0], 1 - r);
    close(bt.resendSafe(o), (1 - r) / (2 - r));
    assert.ok(bt.resendSafe(o) < 0.5);
  }
  closeAll(bt.mzOdds('live', ...bt.splitters(0.5)), bt.mzOdds('live'));
  assert.ok(bt.resendSafe(bt.mzOdds('live', ...bt.splitters(1e-6))) > 0.4999);
});

test('the Zeno turn is Aaronson R_eps, and N turns take |0> to |1>', () => {
  for (const n of Ns) {
    const e = Math.PI / (2 * n), R = bt.turn(n);
    closeAll(R.flat().map((x) => x.re), [Math.cos(e), -Math.sin(e), Math.sin(e), Math.cos(e)]);
    R.flat().forEach((x) => close(x.im, 0));
    let s = q.ket0();
    for (let k = 0; k < n; k++) s = q.matVec(R, s);
    closeAll(q.probs(s), [0, 1], 1e-10);
    close(bt.checkRisk(n), q.abs2(q.matVec(R, q.ket0())[1]));
  }
});

test('Zeno, live bomb: stepping the state matches cos^(2N)(pi/2N), and there is never a "reads 1"', () => {
  for (const n of Ns) {
    const o = bt.zenoOdds('live', n);
    close(o[1], Math.cos(Math.PI / (2 * n)) ** (2 * n), 1e-12);
    close(o[1], bt.zenoSafe(n));
    close(o[1], (1 - bt.checkRisk(n)) ** n);
    assert.equal(o[2], 0);
    close(sum(o), 1);
  }
});

test('Zeno, known values: N = 1 always goes off, N = 2 is 1/4, N = 3 is 27/64, N = 10 is about 78%', () => {
  closeAll(bt.zenoOdds('live', 1), [1, 0, 0]);
  close(bt.zenoSafe(2), 0.25);
  close(bt.zenoSafe(3), 27 / 64);
  close(bt.zenoSafe(4), ((2 + Math.SQRT2) / 4) ** 4);
  close(bt.zenoSafe(10), 0.78054606978, 1e-10);
  close(bt.zenoSafe(100), 0.97562691414, 1e-10);
  // N = 4 already beats the 1/2 limit of the one-pass scheme with resends.
  assert.ok(bt.zenoSafe(4) > 0.5 && bt.zenoSafe(3) < 0.5);
});

test('Zeno success grows with N, stays above 1 - pi^2/4N, tends to 1, and never reaches it', () => {
  for (let n = 1; n < 400; n++) {
    assert.ok(bt.zenoSafe(n + 1) > bt.zenoSafe(n), `N = ${n}`);
    assert.ok(bt.zenoSafe(n) >= bt.zenoBound(n), `N = ${n}`);
    assert.ok(bt.zenoSafe(n) < 1);
  }
  assert.ok(bt.zenoSafe(1e5) > 0.9999);
  assert.ok(bt.zenoSafe(1e5) < 1);
  // The bound is tight: boom chance times N / (pi^2/4) tends to 1.
  close((1 - bt.zenoSafe(1e5)) / (Math.PI ** 2 / 4e5), 1, 1e-4);
});

test('Zeno, dud: the turns add up to 90 degrees, so every photon reads 1; never boom, never reads 0', () => {
  for (const n of Ns) closeAll(bt.zenoOdds('dud', n), [0, 0, 1]);
  for (const n of Ns) assert.deepEqual(bt.odds('zeno', 'dud', n), [0, 0, 1]);
  agrees((r) => bt.shot('zeno', 'dud', 7, r), [0, 0, 1], 5000);
});

test('shots follow the Born rule: Zeno live bomb at several N', () => {
  for (const n of [1, 2, 3, 10, 40]) agrees((r) => bt.shot('zeno', 'live', n, r), bt.odds('zeno', 'live', n), 20000, n);
});

test('every exact odds list the tool shows is three chances in [0, 1] that sum to 1', () => {
  for (const method of ['basic', 'zeno'] as const)
    for (const bomb of ['live', 'dud'] as const)
      for (let n = bt.N_MIN; n <= bt.N_MAX; n++) {
        const o = bt.odds(method, bomb, n);
        o.forEach((p) => assert.ok(p >= 0 && p <= 1));
        close(sum(o), 1);
      }
});

test('share() reads chances in words and never shows a real chance as 0% or 100%', () => {
  assert.equal(bt.share(0), '0%');
  assert.equal(bt.share(1), '100%');
  assert.equal(bt.share(0.5), '50%');
  assert.equal(bt.share(0.25), '25%');
  assert.equal(bt.share(0.25000000000000006), '25%');
  assert.equal(bt.share(bt.zenoSafe(10)), '78%');
  assert.equal(bt.share(bt.zenoSafe(100)), '97.6%');
  assert.equal(bt.share(0.95), '95%');
  assert.equal(bt.share(bt.checkRisk(10)), '2.4%');
  assert.equal(bt.share(bt.checkRisk(100)), '0.025%');
  assert.equal(bt.share(0.9996), '99.9%');
  assert.equal(bt.share(0.99999), '99.9%');
  assert.equal(bt.share(1e-9), 'under 0.01%');
  assert.equal(bt.share(0.0005), '0.05%');
  for (let n = bt.N_MIN; n <= bt.N_MAX; n++) {
    for (const p of [bt.zenoSafe(n), bt.checkRisk(n)]) if (p > 0 && p < 1) assert.ok(!['0%', '100%', '0.0%', '100.0%'].includes(bt.share(p)), `${p}`);
  }
});

test('turnDeg labels the turn as 90/N degrees', () => {
  assert.equal(bt.turnDeg(1), '90°');
  assert.equal(bt.turnDeg(10), '9°');
  assert.equal(bt.turnDeg(7), '12.9°');
  assert.equal(bt.turnDeg(100), '0.9°');
});

test('blochDeg is twice the turn: R_eps is RY(2 eps), so the Bloch vector turns by 180/N degrees', () => {
  assert.equal(bt.blochDeg(1), '180°');
  assert.equal(bt.blochDeg(10), '18°');
  assert.equal(bt.blochDeg(7), '25.7°');
  for (const n of [1, 2, 10, 45]) {
    const [x, , z] = q.bloch(q.matVec(bt.turn(n), q.ket0()));
    close(Math.atan2(x, z) * 180 / Math.PI, 180 / n, 1e-9);
  }
});

test('dot piles: up to CAP dots always fit inside the box', () => {
  for (const [w, h] of [[60, 150], [72, 144], [72, 160], [181, 176], [190, 200], [300, 120], [30, 40]]) {
    for (const cap of [1, 100, 300, 1000]) {
      const g = bt.pile(w, h, cap, 16);
      assert.ok(g.pitch > 0.5 && g.pitch <= 16 && g.cols * g.pitch <= w + 1e-9);
      assert.ok(Math.ceil(cap / g.cols) * g.pitch <= h + 1e-9, `${w}x${h}, ${cap}`);
    }
    const g = bt.pile(w, h);
    assert.ok(g.pitch > 0.5 && g.cols >= 1);
    assert.ok(g.cols * g.pitch <= w + 1e-9);
    assert.ok(Math.ceil(bt.CAP / g.cols) * g.pitch <= h + 1e-9, `${w}x${h}`);
    for (const k of [0, g.cols - 1, g.cols, bt.CAP - 1]) {
      const [x, y] = bt.dotAt(k, g, h);
      assert.ok(x > 0 && x < w && y > 0 && y < h, `${k}: ${x},${y}`);
    }
  }
});
