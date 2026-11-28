import test from 'node:test';
import assert from 'node:assert/strict';
import * as q from '../quantum.ts';
import * as s from './hadamard.ts';

const close = (a: number, b: number, eps = 1e-12) => assert.ok(Math.abs(a - b) < eps, `${a} != ${b}`);
const closeC = (a: q.C, b: q.C, eps = 1e-12) => { close(a.re, b.re, eps); close(a.im, b.im, eps); };
const closeM = (a: q.Matrix, b: q.Matrix, eps = 1e-12) => a.forEach((row, i) => row.forEach((x, j) => closeC(x, b[i][j], eps)));
const rad = (d: number) => (d * Math.PI) / 180;
const angles = Array.from({ length: s.MAX - s.MIN + 1 }, (_, i) => s.MIN + i); // every slider value
const S2 = Math.SQRT1_2;

// ---- The gate

test('H: the matrix is (1/sqrt2) times rows (1, 1) and (1, -1)', () => {
  closeM(q.H, [[q.c(S2), q.c(S2)], [q.c(S2), q.c(-S2)]]);
});

test('H: unitary, self-adjoint, and its own inverse (H^dagger H = H H = I)', () => {
  closeM(q.matMul(q.dagger(q.H), q.H), q.I);
  closeM(q.dagger(q.H), q.H);
  closeM(q.matMul(q.H, q.H), q.I);
});

test('H: |0> to |+>, |1> to |->, and back: |+> to |0>, |-> to |1>', () => {
  const same = (a: q.State, b: q.State) => a.forEach((x, i) => closeC(x, b[i]));
  same(s.hadamard(q.ket0()), q.plus());
  same(s.hadamard(q.ket1()), q.minus());
  same(s.hadamard(q.plus()), q.ket0());
  same(s.hadamard(q.minus()), q.ket1());
});

test('H = |+><0| + |-><1| (a state-by-state definition)', () => {
  const outer = (a: q.State, b: q.State): q.Matrix => a.map((x) => b.map((y) => q.mul(x, q.conj(y))));
  const p = outer(q.plus(), q.ket0()), m = outer(q.minus(), q.ket1());
  closeM(q.H, p.map((row, i) => row.map((x, j) => q.add(x, m[i][j]))));
});

test('H on a|0> + b|1>: the amplitude for 0 is (a + b)/sqrt2 and for 1 is (a - b)/sqrt2', () => {
  for (const [a, b] of [[q.c(0.6), q.c(0, 0.8)], [q.c(0.6, 0.48), q.c(-0.64)], [q.c(S2), q.c(-S2)], [q.c(0.28, -0.96), q.c(0)]]) {
    const out = q.matVec(q.H, [a, b]);
    closeC(out[0], q.scale(q.add(a, b), S2));
    closeC(out[1], q.scale(q.sub(a, b), S2));
    close(q.norm2(out), 1);
  }
});

test('H on |+>: the two contributions to the amplitude for 1 are +1/2 and -1/2, and they cancel', () => {
  // H|+> = H(|0> + |1>)/sqrt2: the |1> parts are (1/sqrt2)(1/sqrt2) and (1/sqrt2)(-1/sqrt2).
  const fromZero = q.mul(q.H[1][0], q.plus()[0]), fromOne = q.mul(q.H[1][1], q.plus()[1]);
  close(fromZero.re, 0.5); close(fromOne.re, -0.5);
  closeC(q.add(fromZero, fromOne), q.c(0));
});

test('conjugation by H swaps the Z and X axes: HZH = X, HXH = Z, HYH = -Y', () => {
  const conj = (m: q.Matrix) => q.matMul(q.H, q.matMul(m, q.H));
  closeM(conj(q.Z), q.X);
  closeM(conj(q.X), q.Z);
  closeM(conj(q.Y), q.Y.map((row) => row.map((x) => q.scale(x, -1))));
  closeM(conj(q.I), q.I);
});

test('H = (X + Z)/sqrt2', () => {
  closeM(q.H, q.X.map((row, i) => row.map((x, j) => q.scale(q.add(x, q.Z[i][j]), S2))));
});

test('H is a half turn about the axis between x and z: Bloch (x, y, z) goes to (z, -y, x), for any state', () => {
  for (const [th, ph] of [[0, 0], [0.3, 1.1], [1, 4], [1.5708, 2.2], [2.4, 5.5], [Math.PI, 0], [0.7, 3.14]]) {
    const [x, y, z] = q.bloch(q.fromBloch(th, ph)), [x2, y2, z2] = q.bloch(s.hadamard(q.fromBloch(th, ph)));
    close(x2, z); close(y2, -y); close(z2, x);
  }
});

// ---- The start state and the picture

test('start state: cos(t/2)|0> + sin(t/2)|1>, a unit vector, real amplitudes, for every slider value', () => {
  for (const t of angles) {
    const st = s.startState(t);
    closeC(st[0], q.c(Math.cos(rad(t) / 2)));
    closeC(st[1], q.c(Math.sin(rad(t) / 2)));
    close(q.norm2(st), 1);
    assert.ok(st[0].im === 0 && st[1].im === 0, 'imaginary parts are zero');
  }
});

test('named states: 0 is |0>, 90 is |+>, 180 is |1>, -90 is |-> (no extra sign)', () => {
  const same = (a: q.State, b: q.State) => a.forEach((x, i) => closeC(x, b[i]));
  same(s.startState(0), q.ket0());
  same(s.startState(90), q.plus());
  same(s.startState(180), q.ket1());
  same(s.startState(-90), q.minus());
  assert.deepEqual(s.PRESETS.map((p) => p.name), ['|0⟩', '|+⟩', '|1⟩', '|−⟩']);
  assert.equal(s.nameOf(90), '|+⟩'); assert.equal(s.nameOf(-90), '|−⟩'); assert.equal(s.nameOf(37), null);
});

test('slider range: every state on the circle once, and -180 left out because it is 180 (a global sign apart)', () => {
  assert.equal(s.MIN, -179); assert.equal(s.MAX, 180);
  const a = s.startState(-180), b = s.startState(180);
  a.forEach((x, i) => closeC(x, q.scale(b[i], -1), 1e-12));
  const seen = new Set(angles.map((t) => s.point(s.startState(t)).map((v) => v.toFixed(9)).join()));
  assert.equal(seen.size, angles.length, 'each slider value is its own point');
});

test('picture: the point is (x, z) = (sin t, cos t), and the odds are (1 + z)/2 for 0 and (1 + x)/2 for +', () => {
  for (const t of angles) {
    const st = s.startState(t), [x, z] = s.point(st);
    close(x, Math.sin(rad(t))); close(z, Math.cos(rad(t)));
    close(x * x + z * z, 1);
    close(s.oddsZ(st)[0], (1 + z) / 2, 2e-12);
    close(s.oddsX(st)[0], (1 + x) / 2, 2e-12);
  }
});

test('wrapAngle: -179 to 180', () => {
  assert.equal(s.wrapAngle(0), 0); assert.equal(s.wrapAngle(180), 180); assert.equal(s.wrapAngle(-180), 180);
  assert.equal(s.wrapAngle(181), -179); assert.equal(s.wrapAngle(270), -90); assert.equal(s.wrapAngle(-270), 90); assert.equal(s.wrapAngle(360), 0);
  for (let d = -1000; d <= 1000; d++) { const w = s.wrapAngle(d); assert.ok(w >= -179 && w <= 180); assert.ok((w - d) % 360 === 0); }
});

// ---- The mirror

test('mirror: after one H the point is at angle 90 - t, exactly, for every slider value', () => {
  for (const t of angles) {
    const after = s.hadamard(s.startState(t)), want = s.startState(90 - t);
    after.forEach((x, i) => closeC(x, want[i])); // no global phase here at all
    const [x, z] = s.point(after), m = s.mirrorAngle(t);
    close(x, Math.sin(rad(m))); close(z, Math.cos(rad(m)));
    assert.ok(m >= -179 && m <= 180);
  }
});

test('mirror: known points. |0> to |+>, |+> to |0>, |1> to |->, |-> to |1>', () => {
  assert.equal(s.mirrorAngle(0), 90); assert.equal(s.mirrorAngle(90), 0);
  assert.equal(s.mirrorAngle(180), -90); assert.equal(s.mirrorAngle(-90), 180);
});

test('mirror: a reflection across the 45 degree line, so it swaps x and z and keeps distances', () => {
  for (const t of angles) {
    const [x, z] = s.point(s.startState(t)), [x2, z2] = s.point(s.hadamard(s.startState(t)));
    close(x2, z); close(z2, x);
  }
  for (const [a, b] of [[0, 50], [-120, 33], [90, 91], [-179, 180], [10, -10]]) {
    const d = (p: number[], r: number[]) => Math.hypot(p[0] - r[0], p[1] - r[1]);
    const p = s.point(s.startState(a)), r = s.point(s.startState(b));
    close(d(p, r), d(s.point(s.hadamard(s.startState(a))), s.point(s.hadamard(s.startState(b)))));
  }
});

test('mirror: the fixed points are t = 45 and t = -135, where H gives the same state (times +1 and -1)', () => {
  assert.equal(s.mirrorAngle(45), 45); assert.equal(s.mirrorAngle(-135), -135);
  for (const t of angles) assert.equal(s.mirrorAngle(t) === t, s.onMirror(t), `t ${t}`);
  const a = s.startState(45), ha = s.hadamard(a);
  ha.forEach((x, i) => closeC(x, a[i]));
  const b = s.startState(-135), hb = s.hadamard(b);
  hb.forEach((x, i) => closeC(x, q.scale(b[i], -1)));
});

test('a second H goes back: the start state again, exactly, for every slider value', () => {
  for (const t of angles) {
    const v = s.view(t);
    v.twice.forEach((x, i) => closeC(x, v.before[i]));
    assert.equal(s.mirrorAngle(s.mirrorAngle(t)), t);
  }
});

// ---- Born rule and the swap

test('Born rule: both measurements give odds that add to 1, for every slider value, before and after', () => {
  for (const t of angles) {
    const v = s.view(t);
    for (const cell of s.CELLS) {
      const p = v.odds[cell];
      close(p[0] + p[1], 1, 2e-12);
      p.forEach((x) => assert.ok(x >= 0 && x <= 1));
    }
  }
});

test('the swap: after one H, the Z odds are the X odds from before, and the X odds are the Z odds from before', () => {
  for (const t of angles) {
    const { odds } = s.view(t);
    odds.zAfter.forEach((p, i) => close(p, odds.xBefore[i], 2e-12));
    odds.xAfter.forEach((p, i) => close(p, odds.zBefore[i], 2e-12));
  }
});

test('the swap holds for states with complex amplitudes too: |<0|H|psi>|^2 = |<+|psi>|^2 and |<+|H|psi>|^2 = |<0|psi>|^2', () => {
  for (const th of [0.4, 1.2, 2, 2.9]) for (const ph of [0, 1, 2.5, 4, 5.9]) {
    const psi = q.fromBloch(th, ph), h = q.matVec(q.H, psi);
    close(q.abs2(q.inner(q.ket0(), h)), q.abs2(q.inner(q.plus(), psi)));
    close(q.abs2(q.inner(q.ket1(), h)), q.abs2(q.inner(q.minus(), psi)));
    close(q.abs2(q.inner(q.plus(), h)), q.abs2(q.inner(q.ket0(), psi)));
    close(q.abs2(q.inner(q.minus(), h)), q.abs2(q.inner(q.ket1(), psi)));
  }
});

test('known odds. Started as 0: Z gives 0 always, X is 50/50. After H: Z is 50/50, X gives + always', () => {
  const v = s.view(0);
  assert.deepEqual(v.odds.zBefore, [1, 0]);
  close(v.odds.xBefore[0], 0.5); close(v.odds.xBefore[1], 0.5);
  close(v.odds.zAfter[0], 0.5); close(v.odds.zAfter[1], 0.5);
  assert.deepEqual(v.odds.xAfter, [1, 0]);
});

test('known odds. Started as 1: Z gives 1 always, X is 50/50. After H: Z is 50/50, X gives - always', () => {
  const v = s.view(180);
  assert.deepEqual(v.odds.zBefore, [0, 1]);
  close(v.odds.xBefore[0], 0.5);
  close(v.odds.zAfter[1], 0.5);
  assert.deepEqual(v.odds.xAfter, [0, 1]);
});

test('known odds. |+> and |-> look the same to Z (50/50) and different to X; H then Z tells them apart', () => {
  const plus = s.view(90), minus = s.view(-90);
  plus.odds.zBefore.forEach((p, i) => close(p, minus.odds.zBefore[i]));
  assert.deepEqual(plus.odds.xBefore, [1, 0]); assert.deepEqual(minus.odds.xBefore, [0, 1]);
  assert.deepEqual(plus.odds.zAfter, [1, 0]); assert.deepEqual(minus.odds.zAfter, [0, 1]);
});

test('known odds at t = 45: cos^2(22.5 degrees) = (2 + sqrt2)/4 for 0 and for +, the same before and after H', () => {
  const v = s.view(45), p = (2 + Math.SQRT2) / 4;
  for (const cell of s.CELLS) { close(v.odds[cell][0], p, 2e-12); close(v.odds[cell][1], 1 - p, 2e-12); }
});

test('X odds really are the X basis: |+> and |-> are orthonormal and the X Pauli matrix has them as eigenvectors', () => {
  close(q.abs2(q.inner(q.plus(), q.minus())), 0);
  q.matVec(q.X, q.plus()).forEach((x, i) => closeC(x, q.plus()[i]));
  q.matVec(q.X, q.minus()).forEach((x, i) => closeC(x, q.scale(q.minus()[i], -1)));
});

test('global sign: -|psi> gives the same odds in both measurements, before and after H', () => {
  for (const t of angles) {
    const st = s.startState(t), neg = st.map((a) => q.scale(a, -1)), hn = s.hadamard(neg);
    s.oddsZ(neg).forEach((p, i) => close(p, s.oddsZ(st)[i]));
    s.oddsX(neg).forEach((p, i) => close(p, s.oddsX(st)[i]));
    s.oddsZ(hn).forEach((p, i) => close(p, s.oddsZ(s.hadamard(st))[i]));
  }
});

// ---- Shots

test('shots: zeros counts draws below p, only grows with p, and is 0 and n at the ends', () => {
  const us = Array.from({ length: s.SHOTS }, q.rng(3));
  assert.equal(s.zeros(us, 0), 0);
  assert.equal(s.zeros(us, 1), s.SHOTS);
  assert.equal(s.zeros([0], 0), 0, 'a draw of exactly 0 still gives the second outcome when p is 0');
  assert.equal(s.zeros([0.2, 0.7, 0.4], 0.5), 2);
  assert.equal(s.zeros([0.2, 0.7, 0.4], 0.5, 2), 1);
  let prev = 0;
  for (let k = 0; k <= 1000; k++) { const z = s.zeros(us, k / 1000); assert.ok(z >= prev); prev = z; }
});

test('shots: a certain result is the same on every draw, so a state at |0> never gives 1 in the Z pile', () => {
  const us = [0, 0.5, 0.999999999999, 0.25];
  for (const u of [us, Array.from({ length: 1000 }, q.rng(2))]) {
    assert.equal(s.zeros(u, s.view(0).odds.zBefore[0]), u.length);
    assert.equal(s.zeros(u, s.view(180).odds.zBefore[0]), 0);
    assert.equal(s.zeros(u, s.view(0).odds.xAfter[0]), u.length);
  }
});

test('shots follow the Born rule: frequency within 5 sigma of the odds, in every pile', () => {
  const n = 100000, us = Array.from({ length: n }, q.rng(12));
  for (const t of [0, 30, 45, 90, 137, -90, -135]) {
    for (const cell of s.CELLS) {
      const p = s.view(t).odds[cell][0], z = s.zeros(us, p);
      assert.ok(Math.abs(z / n - p) <= 5 * Math.sqrt((p * (1 - p)) / n), `t ${t} ${cell}: ${z / n} vs ${p}`);
    }
  }
});

test('pile grid: every dot fits in the box, with the pitch capped', () => {
  for (const w of [20, 37, 50, 88, 120, 200, 400]) for (const h of [40, 100, 144, 170]) for (const n of [1, 50, 100]) {
    const gr = s.pileGrid(w, h, n);
    assert.ok(gr.cols * gr.rows >= n);
    assert.ok(gr.cols * gr.pitch <= w + 1e-9, `w ${w} h ${h}`);
    assert.ok(gr.rows * gr.pitch <= h + 1e-9, `w ${w} h ${h}`);
    assert.ok(gr.pitch > 0 && gr.pitch <= 12);
  }
  assert.deepEqual(s.pileGrid(0, 100, 100), { cols: 1, rows: 100, pitch: 0 });
});

// ---- Words

test('ket text: true minus sign, two decimals, and the states match the amplitudes', () => {
  assert.equal(s.ketText(90), '0.71|0⟩ + 0.71|1⟩');
  assert.equal(s.ketText(-90), '0.71|0⟩ − 0.71|1⟩');
  assert.equal(s.ketText(0), '1.00|0⟩ + 0.00|1⟩');
  assert.equal(s.ketText(60), '0.87|0⟩ + 0.50|1⟩');
  assert.equal(s.ketText(-60), '0.87|0⟩ − 0.50|1⟩');
  for (const t of angles) assert.ok(!s.ketText(t).includes('-'), 'uses − not -');
});

test('slider text names the state', () => {
  assert.equal(s.sliderText(90), '90 degrees, the state |+⟩');
  assert.equal(s.sliderText(-90), '-90 degrees, the state |−⟩');
  assert.equal(s.sliderText(60), '60 degrees, the state 0.87|0⟩ + 0.50|1⟩');
});

test('odds in words: always, or both chances; never a false 0% or 100%', () => {
  assert.equal(s.oddsText([1, 0], '0', '1'), 'always 0');
  assert.equal(s.oddsText([0, 1], '+', '−'), 'always −');
  assert.equal(s.oddsText([0.5, 0.5], '0', '1'), '0 with chance 50%, 1 with chance 50%');
  for (const t of angles) for (const cell of s.CELLS) {
    const p = s.view(t).odds[cell], text = s.oddsText(p, 'a', 'b');
    if (p[0] < 1 && p[1] < 1) { assert.ok(!/ (0|100)%/.test(text), `${t} ${cell}: ${text}`); assert.ok(!text.startsWith('always')); }
    else assert.ok(text.startsWith('always'));
  }
});

test('readout: names the start state, gives all four odds, and the way back', () => {
  const counts = { zBefore: 100, xBefore: 47, zAfter: 52, xAfter: 100 };
  const r = s.readout(0, counts);
  assert.ok(r.startsWith('Start state |0⟩.'));
  assert.ok(r.includes('Before the gate: Z measurement, always 0. X measurement, + with chance 50%, − with chance 50%.'));
  assert.ok(r.includes('After one H: Z measurement, 0 with chance 50%, 1 with chance 50%. X measurement, always +.'));
  assert.ok(r.includes('H swapped the odds of the two measurements.'));
  assert.ok(r.includes('A second H takes the qubit back to the start state.'));
  assert.ok(r.includes('Before: Z 100 zeros and 0 ones, X 47 pluses and 53 minuses. After: Z 52 zeros and 48 ones, X 100 pluses and 0 minuses.'));
  assert.ok(s.readout(-90, counts).startsWith('Start state |−⟩.'));
  assert.ok(s.readout(37, counts).startsWith(`Start state ${s.ketText(37)}, a state with real amplitudes.`));
});

test('readout: on the mirror line it says H leaves the state as it is, and never claims a swap', () => {
  const counts = { zBefore: 85, xBefore: 85, zAfter: 85, xAfter: 85 };
  for (const t of [45, -135]) {
    const r = s.readout(t, counts);
    assert.ok(r.includes('H leaves it as it is'));
    assert.ok(!r.includes('swapped'));
  }
  for (const t of angles.filter((t) => !s.onMirror(t))) assert.ok(s.readout(t, counts).includes('H swapped the odds'));
});

test('readout: one copy reads "1 zero", not "1 zeros"', () => {
  const r = s.readout(0, { zBefore: 1, xBefore: 99, zAfter: 0, xAfter: 100 });
  assert.ok(r.includes('Z 1 zero and 99 ones'));
  assert.ok(r.includes('X 99 pluses and 1 minus'));
  assert.ok(r.includes('Z 0 zeros and 100 ones'));
});

test('H is i times the half-turn rotation about (x + z)/sqrt2: R(pi) = -i(X + Z)/sqrt2', () => {
  const r = q.X.map((row, i) => row.map((x, j) => q.scale(q.mul(q.c(0, -1), q.add(x, q.Z[i][j])), Math.SQRT1_2)));
  closeM(q.H, r.map((row) => row.map((x) => q.mul(q.c(0, 1), x))));
});
