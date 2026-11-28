import test from 'node:test';
import assert from 'node:assert/strict';
import * as q from './quantum.ts';

const close = (a: number, b: number, eps = 1e-12) => assert.ok(Math.abs(a - b) < eps, `${a} != ${b}`);
const closeState = (a: q.State, b: q.State) => a.forEach((x, i) => { close(x.re, b[i].re); close(x.im, b[i].im); });

test('Born rule: H|0> gives 50/50 and probabilities sum to 1', () => {
  const p = q.probs(q.matVec(q.H, q.ket0()));
  close(p[0], 0.5); close(p[1], 0.5);
  close(p.reduce((a, b) => a + b), 1);
});

test('gates are unitary', () => {
  for (const u of [q.X, q.Y, q.Z, q.H, q.S, q.T, q.RX(0.7), q.RY(1.1), q.RZ(-2.3), q.P(0.4)]) {
    const m = q.matMul(q.dagger(u), u);
    close(m[0][0].re, 1); close(m[1][1].re, 1); close(q.abs(m[0][1]), 0); close(q.abs(m[1][0]), 0);
  }
});

test('HH = I and HZH = X', () => {
  closeState(q.matVec(q.H, q.matVec(q.H, q.ket1())), q.ket1());
  const hzh = q.matMul(q.H, q.matMul(q.Z, q.H));
  hzh.forEach((row, i) => row.forEach((x, j) => { close(x.re, q.X[i][j].re); close(x.im, 0); }));
});

test('RY(theta)|0> gives P(1) = sin^2(theta/2)', () => {
  for (const t of [0, 0.3, 1, Math.PI / 2, 2.5, Math.PI]) close(q.probs(q.matVec(q.RY(t), q.ket0()))[1], Math.sin(t / 2) ** 2);
});

test('Bloch vectors of the six cardinal states', () => {
  const v = (s: q.State) => q.bloch(s).map((x) => Math.round(x * 1e9) / 1e9 + 0);
  assert.deepEqual(v(q.ket0()), [0, 0, 1]);
  assert.deepEqual(v(q.ket1()), [0, 0, -1]);
  assert.deepEqual(v(q.plus()), [1, 0, 0]);
  assert.deepEqual(v(q.minus()), [-1, 0, 0]);
  assert.deepEqual(v(q.matVec(q.S, q.plus())), [0, 1, 0]);
  assert.deepEqual(v(q.fromBloch(Math.PI / 2, Math.PI / 2)), [0, 1, 0]);
});

test('global phase does not change probabilities or the Bloch vector', () => {
  const s = q.fromBloch(1.2, 0.5), t = s.map((a) => q.mul(q.expi(0.9), a));
  q.probs(s).forEach((p, i) => close(p, q.probs(t)[i]));
  q.bloch(s).forEach((x, i) => close(x, q.bloch(t)[i]));
});

test('qubit order: apply1 on qubit 0 flips the left bit', () => {
  closeState(q.apply1(q.basis(2, 0), q.X, 0), q.basis(2, 0b10));
  closeState(q.apply1(q.basis(2, 0), q.X, 1), q.basis(2, 0b01));
});

test('H then CNOT makes the Bell state (|00> + |11>)/sqrt2', () => {
  const s = q.cnot(q.apply1(q.basis(2, 0), q.H, 0), 0, 1);
  const p = q.probs(s);
  close(p[0], 0.5); close(p[3], 0.5); close(p[1], 0); close(p[2], 0);
});

test('tensor matches apply1 on product states', () => {
  closeState(q.tensor(q.plus(), q.ket1()), q.apply1(q.apply1(q.basis(2, 0), q.H, 0), q.X, 1));
});

test('measuring one qubit of a Bell pair fixes the other', () => {
  const bellState = q.cnot(q.apply1(q.basis(2, 0), q.H, 0), 0, 1);
  const r = q.rng(7);
  for (let k = 0; k < 50; k++) {
    const m = q.measureQubit(bellState, 0, r);
    close(q.probOne(m.state, 1), m.result);
  }
});

test('sampling converges to the Born probabilities', () => {
  const p = [0.2, 0.8], n = 200000, counts = q.sample(p, n, q.rng(42));
  close(counts[1] / n, 0.8, 0.005);
});

test('seeded rng repeats and stays in [0, 1)', () => {
  const a = q.rng(3), b = q.rng(3);
  for (let k = 0; k < 1000; k++) { const x = a(); assert.equal(x, b()); assert.ok(x >= 0 && x < 1); }
});

test('inner product and normalize', () => {
  close(q.abs2(q.inner(q.plus(), q.minus())), 0);
  close(q.norm2(q.normalize([q.c(3), q.c(0, 4)])), 1);
});

test('draw never returns a zero-chance outcome, even when chances sum a hair under 1', () => {
  const p = [0.5, 0.5 - 1e-12, 0];
  assert.equal(q.draw(p, () => 0.9999999999999), 1);
  assert.equal(q.draw([0, 1], () => 0), 1);
  for (let k = 0; k < 2000; k++) assert.notEqual(q.draw([0.3, 0, 0.7 - 1e-13], Math.random), 1);
});

test('measureQubit never picks a branch with no amplitude, even when the norm is a hair under 1', () => {
  const s = q.normalize([q.c(0), q.c(0), q.c(1), q.c(1)]);
  for (const u of [0, 0.5, 1 - Number.EPSILON / 2]) assert.equal(q.measureQubit(s, 0, () => u).result, 1);
  assert.equal(q.measureQubit(q.basis(2, 0), 0, () => 1 - Number.EPSILON / 2).result, 0);
  assert.throws(() => q.measureQubit([q.c(0), q.c(0)], 0, () => 0.5));
});
