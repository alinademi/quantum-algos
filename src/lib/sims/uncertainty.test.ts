import test from 'node:test';
import assert from 'node:assert/strict';
import * as q from '../quantum.ts';
import * as u from './uncertainty.ts';

const close = (a: number, x: number, eps = 1e-12) => assert.ok(Math.abs(a - x) < eps, `${a} != ${x}`);
const RAD = Math.PI / 180;
const { X, Y, Z, I } = q;
const eqM = (m: q.Matrix, n: q.Matrix, eps = 1e-12) =>
  m.forEach((row, i) => row.forEach((x, j) => { close(x.re, n[i][j].re, eps); close(x.im, n[i][j].im, eps); }));
const times = (k: q.C, m: q.Matrix): q.Matrix => m.map((row) => row.map((x) => q.mul(k, x)));
const plusM = (...ms: q.Matrix[]): q.Matrix => ms[0].map((row, i) => row.map((_, j) => ms.reduce((t, m) => q.add(t, m[i][j]), q.c(0))));
const hermitian = (m: q.Matrix) => eqM(q.dagger(m), m);

// A grid of states: every tilt and turn in 15 degree steps.
const GRID: u.Angles[] = [];
for (let tilt = 0; tilt <= 180; tilt += 15) for (let turn = 0; turn < 360; turn += 15) GRID.push({ tilt, turn });
const blochOf = (a: u.Angles): [number, number, number] =>
  [Math.sin(a.tilt * RAD) * Math.cos(a.turn * RAD), Math.sin(a.tilt * RAD) * Math.sin(a.turn * RAD), Math.cos(a.tilt * RAD)];
/** a·σ for a real 3-vector a. */
const sigma = (a: number[]): q.Matrix => plusM(times(q.c(a[0]), X), times(q.c(a[1]), Y), times(q.c(a[2]), Z));

// ---- Pauli algebra ([Z, X] = 2iY is Wilde Exercise 3.4.4; the other checks here are direct matrix algebra)

test('Pauli commutators: [Z, X] = 2iY, [X, Y] = 2iZ, [Y, Z] = 2iX, and each Pauli squares to I', () => {
  eqM(u.commutator(Z, X), times(q.c(0, 2), Y));
  eqM(u.commutator(X, Y), times(q.c(0, 2), Z));
  eqM(u.commutator(Y, Z), times(q.c(0, 2), X));
  eqM(u.anticommutator(Z, X), [[q.c(0), q.c(0)], [q.c(0), q.c(0)]]);
  for (const P of [X, Y, Z]) eqM(q.matMul(P, P), I);
});

test('the commutator of two Hermitian matrices is anti-Hermitian, so [A, B]/(2i) is Hermitian (Zwiebach eq. 2.16)', () => {
  const r = q.rng(5);
  for (let k = 0; k < 10; k++) {
    const A = plusM(times(q.c(r() - 0.5), I), sigma([r() - 0.5, r() - 0.5, r() - 0.5]));
    const B = plusM(times(q.c(r() - 0.5), I), sigma([r() - 0.5, r() - 0.5, r() - 0.5]));
    hermitian(A); hermitian(B);
    const Cm = u.commutator(A, B);
    eqM(q.dagger(Cm), times(q.c(-1), Cm));
    hermitian(times(q.c(0, -0.5), Cm));
  }
});

// ---- The state and its averages

test('stateAt is a unit vector, and <X>, <Y>, <Z> are its Bloch vector (sin θ cos φ, sin θ sin φ, cos θ)', () => {
  for (const a of GRID) {
    const s = u.stateAt(a), r = blochOf(a);
    close(q.norm2(s), 1);
    close(u.mean(s, X), r[0]); close(u.mean(s, Y), r[1]); close(u.mean(s, Z), r[2]);
    q.bloch(s).forEach((v, i) => close(v, r[i]));
    for (const P of [X, Y, Z]) close(u.braket(s, P).im, 0); // Hermitian: the average is real
  }
});

test('Born rule: odds of +1 and -1 add to 1, equal (1 ± <A>)/2, and give <A> = P(+1) - P(-1) (Wilde eq. 3.79)', () => {
  for (const a of GRID) for (const o of ['Z', 'X'] as const) {
    const s = u.stateAt(a), [pp, pm] = u.odds(s, o), m = u.mean(s, u.PAULI[o]);
    close(pp + pm, 1);
    assert.ok(pp >= 0 && pp <= 1 && pm >= 0 && pm <= 1);
    close(pp, (1 + m) / 2); close(pm, (1 - m) / 2);
    close(pp - pm, m);
  }
});

test('eigenstates: Z gives +1 for |0> and -1 for |1>; X gives +1 for |+> and -1 for |->', () => {
  for (const o of ['Z', 'X'] as const) {
    const [ep, em] = u.EIGEN[o], A = u.PAULI[o];
    eqM([q.matVec(A, ep)], [ep]);
    eqM([q.matVec(A, em)], [em.map((x) => q.scale(x, -1))]);
    assert.deepEqual(u.odds(ep, o), [1, 0]);
    assert.deepEqual(u.odds(em, o), [0, 1]);
  }
});

// ---- Spreads

test('spread: sqrt(<A²> - <A>²) equals |(A - <A>)ψ| (Zwiebach eqs. 1.2 and 1.9), and for a Pauli, sqrt(1 - <A>²) = 2 sqrt(P(+1) P(-1))', () => {
  for (const a of GRID) for (const P of [X, Y, Z]) {
    const s = u.stateAt(a), d = u.spread(s, P), m = u.mean(s, P);
    close(d, u.spreadByNorm(s, P), 1e-7);
    close(d * d, 1 - m * m, 1e-12);
    assert.ok(d >= 0 && d <= 1);
  }
  for (const a of GRID) for (const o of ['Z', 'X'] as const) {
    const s = u.stateAt(a), [pp, pm] = u.odds(s, o);
    close(u.spread(s, u.PAULI[o]), 2 * Math.sqrt(pp * pm), 1e-7);
  }
});

test('a spread is exactly 0 only at an eigenstate: Z at |0> and |1>, X at |+> and |->', () => {
  for (const a of GRID) {
    const e = u.exact(a);
    assert.equal(e.dZ === 0, a.tilt === 0 || a.tilt === 180, `Z at ${a.tilt}, ${a.turn}`);
    assert.equal(e.dX === 0, a.tilt === 90 && (a.turn === 0 || a.turn === 180), `X at ${a.tilt}, ${a.turn}`);
  }
});

// ---- Robertson's relation

test('Robertson for Z and X: the bound |<[Z, X]>|/2 is |<Y>|, and dZ dX >= it for every state', () => {
  for (const a of GRID) {
    const s = u.stateAt(a), e = u.exact(a);
    close(e.bound, Math.abs(blochOf(a)[1]));
    close(e.bound, Math.abs(u.mean(s, Y)));
    assert.ok(e.product >= e.bound - 1e-12, `${a.tilt}, ${a.turn}: ${e.product} < ${e.bound}`);
  }
});

test('Robertson holds for any two qubit observables a0 I + a·σ, and for a 3-level example', () => {
  const r = q.rng(11), pairs: [q.Matrix, q.Matrix][] = [];
  for (let k = 0; k < 12; k++) pairs.push([
    plusM(times(q.c(2 * r() - 1), I), sigma([2 * r() - 1, 2 * r() - 1, 2 * r() - 1])),
    plusM(times(q.c(2 * r() - 1), I), sigma([2 * r() - 1, 2 * r() - 1, 2 * r() - 1])),
  ]);
  for (const [A, B] of pairs) for (const a of GRID) {
    const s = u.stateAt(a);
    assert.ok(u.spread(s, A) * u.spread(s, B) >= u.bound(s, A, B) - 1e-9);
  }
  // Spin-1 Jz and Jx, three states.
  const h = Math.SQRT1_2, n = q.c(0);
  const Jz: q.Matrix = [[q.c(1), n, n], [n, n, n], [n, n, q.c(-1)]];
  const Jx: q.Matrix = [[n, q.c(h), n], [q.c(h), n, q.c(h)], [n, q.c(h), n]];
  const states: q.State[] = [[q.c(1), n, n], q.normalize([q.c(1), q.c(0, 1), q.c(0.5)]), q.normalize([q.c(0.2, 0.3), q.c(-0.7), q.c(0.1, -0.4)])];
  for (const s of states) {
    const dA = u.spread(s, Jz), dB = u.spread(s, Jx), b = u.bound(s, Jz, Jx), cv = u.covariance(s, Jz, Jx);
    assert.ok(dA * dB >= b - 1e-12);
    assert.ok(dA * dA * dB * dB >= b * b + cv * cv - 1e-12); // Schrodinger's stronger form (Zwiebach eq. 2.28)
  }
  // (1, 0, 0) is an eigenstate of Jz, so dJz = 0; the bound |<[Jz, Jx]>|/2 = |<Jy>|/2 must then be 0 too, and it is.
  close(u.spread(states[0], Jz), 0);
  close(u.bound(states[0], Jz, Jx), 0);
});

test('qubit form: for unit axes a and b, the bound is |(a × b)·r| and the spread of a·σ is sqrt(1 - (a·r)²)', () => {
  const axes = [[0, 0, 1], [1, 0, 0], [0, 1, 0], [0.6, 0, 0.8], [0, -0.28, 0.96], [1 / Math.sqrt(3), 1 / Math.sqrt(3), -1 / Math.sqrt(3)]];
  const dot = (x: number[], y: number[]) => x[0] * y[0] + x[1] * y[1] + x[2] * y[2];
  const cross = (x: number[], y: number[]) => [x[1] * y[2] - x[2] * y[1], x[2] * y[0] - x[0] * y[2], x[0] * y[1] - x[1] * y[0]];
  for (const a of GRID) {
    const s = u.stateAt(a), r = blochOf(a);
    for (const m of axes) for (const k of axes) {
      close(u.bound(s, sigma(m), sigma(k)), Math.abs(dot(cross(m, k), r)), 1e-12);
      close(u.spread(s, sigma(m)) ** 2, 1 - dot(m, r) ** 2, 1e-12);
    }
  }
});

test('Schrodinger form is an equality for a pure qubit state: dZ² dX² = <Y>² + (<Z><X>)²', () => {
  for (const a of GRID) {
    const s = u.stateAt(a), e = u.exact(a), cv = u.covariance(s, Z, X);
    close(cv, -e.z * e.x, 1e-12); // {Z, X} = 0
    close(e.dZ ** 2 * e.dX ** 2, e.bound ** 2 + cv ** 2, 1e-12);
  }
});

test('the product meets the bound exactly when <Z> = 0 or <X> = 0 (Zwiebach eq. 2.31)', () => {
  const angles: u.Angles[] = [...GRID];
  for (const tilt of [1, 89, 90, 91, 179]) for (let turn = 0; turn < 360; turn++) angles.push({ tilt, turn });
  for (const turn of [1, 89, 90, 91, 269, 270, 271]) for (let tilt = 0; tilt <= 180; tilt++) angles.push({ tilt, turn });
  for (const a of angles) {
    const e = u.exact(a);
    assert.equal(u.meetsBound(e), e.z === 0 || e.x === 0, `${a.tilt}, ${a.turn}`);
  }
});

test('the bound depends on the state: 0 at |0>, |1>, |+>, |->; 1 at |+i> and |-i>, where both spreads are 1', () => {
  for (const a of [{ tilt: 0, turn: 0 }, { tilt: 180, turn: 0 }, { tilt: 90, turn: 0 }, { tilt: 90, turn: 180 }]) assert.equal(u.exact(a).bound, 0);
  for (const a of [{ tilt: 90, turn: 90 }, { tilt: 90, turn: 270 }]) {
    const e = u.exact(a);
    assert.equal(e.bound, 1); assert.equal(e.dZ, 1); assert.equal(e.dX, 1); assert.equal(e.product, 1);
  }
});

test('Z and X are never both sharp: [Z, X]ψ = 2iYψ is never 0, since Y has eigenvalues ±1', () => {
  const pi: q.State = [q.c(Math.SQRT1_2), q.c(0, Math.SQRT1_2)], mi: q.State = [q.c(Math.SQRT1_2), q.c(0, -Math.SQRT1_2)];
  eqM([q.matVec(Y, pi)], [pi]); eqM([q.matVec(Y, mi)], [mi.map((x) => q.scale(x, -1))]);
  const det = q.sub(q.mul(Y[0][0], Y[1][1]), q.mul(Y[0][1], Y[1][0]));
  close(det.re, -1); close(det.im, 0);
  for (const a of GRID) {
    const s = u.stateAt(a), e = u.exact(a);
    close(q.norm2(q.matVec(u.commutator(Z, X), s)), 4);
    assert.ok(!(e.dZ === 0 && e.dX === 0));
  }
});

test('commuting observables can both be sharp: Z and 2I + 3Z have bound 0 everywhere and both spreads 0 at |0>', () => {
  const B = plusM(times(q.c(2), I), times(q.c(3), Z));
  eqM(u.commutator(Z, B), [[q.c(0), q.c(0)], [q.c(0), q.c(0)]]);
  for (const a of GRID) assert.equal(u.bound(u.stateAt(a), Z, B), 0);
  const s = q.ket0();
  assert.equal(u.spread(s, Z), 0); assert.equal(u.spread(s, B), 0);
});

test('noncommuting does not always mean no shared eigenvector: in 3 levels A = diag(0, 1, -1) and B = 0 ⊕ X do not commute, yet |0> makes both spreads 0', () => {
  const n = q.c(0), one = q.c(1);
  const A: q.Matrix = [[n, n, n], [n, one, n], [n, n, q.c(-1)]];
  const B: q.Matrix = [[n, n, n], [n, n, one], [n, one, n]];
  const AB = q.matMul(A, B), BA = q.matMul(B, A);
  // [A, B] is not 0: on the block it is [Z, X] = 2iY.
  const comm = AB.map((row, i) => row.map((x, j) => q.sub(x, BA[i][j])));
  assert.ok(comm.some((row) => row.some((x) => q.abs(x) > 1)));
  const zero: q.State = [one, n, n];
  close(q.norm2(q.matVec(A, zero)), 0);
  close(q.norm2(q.matVec(B, zero)), 0);
  close(u.spread(zero, A), 0);
  close(u.spread(zero, B), 0);
  close(u.bound(zero, A, B), 0);
  // Other states do not make both sharp: the spreads are not both 0 on the block.
  const blockState = q.normalize([n, one, q.c(0, 1)]);
  assert.ok(u.spread(blockState, A) * u.spread(blockState, B) >= u.bound(blockState, A, B) - 1e-12);
  assert.ok(u.spread(blockState, A) > 0 || u.spread(blockState, B) > 0);
  // The qubit pair Z, X is different: no unit vector is sharp for both (checked by the Y argument above and here on a grid).
  for (const a of GRID) { const s = u.stateAt(a); assert.ok(u.spread(s, Z) > 1e-9 || u.spread(s, X) > 1e-9); }
});

test('a floor that never vanishes: dZ² + dX² = 1 + <Y>² >= 1 for pure states, and >= 1 for mixed states too', () => {
  for (const a of GRID) { const e = u.exact(a); close(e.dZ ** 2 + e.dX ** 2, 1 + e.y ** 2, 1e-12); }
  // Mixed: rho = (I + r·σ)/2 with |r| <= 1. Spread from tr(rho A²) - tr(rho A)².
  const tr = (rho: q.Matrix, A: q.Matrix) => q.matMul(rho, A).reduce((t, row, i) => t + row[i].re, 0);
  const r = q.rng(3);
  for (let k = 0; k < 200; k++) {
    let v = [2 * r() - 1, 2 * r() - 1, 2 * r() - 1];
    const len = Math.hypot(...v), want = r();
    v = v.map((x) => (x / len) * want);
    const rho = times(q.c(0.5), plusM(I, sigma(v)));
    const d2 = (A: q.Matrix) => tr(rho, q.matMul(A, A)) - tr(rho, A) ** 2;
    close(tr(rho, Z), v[2]); close(tr(rho, X), v[0]);
    assert.ok(d2(Z) + d2(X) >= 1 - 1e-12);
  }
});

// ---- Shots

test('one copy: +1 when its draw is below P(+1); certain outcomes never miss', () => {
  assert.equal(u.result(0.29, [0.3, 0.7]), 1);
  assert.equal(u.result(0.3, [0.3, 0.7]), -1);
  const us = Array.from({ length: 2000 }, q.rng(9));
  assert.equal(u.countPlus(us, [1, 0]), 2000);
  assert.equal(u.countPlus(us, [0, 1]), 0);
  assert.equal(u.countPlus(us, [1, 0], 37), 37);
});

test('fixed draws: raising P(+1) never turns a +1 into -1, so moving a slider flips dots instead of re-rolling', () => {
  const us = Array.from({ length: u.MAX }, q.rng(2));
  let last = -1;
  for (let k = 0; k <= 100; k++) {
    const p = k / 100, n = u.countPlus(us, [p, 1 - p]);
    assert.ok(n >= last); last = n;
  }
});

test('shots follow the Born rule (within 5 sigma)', () => {
  const n = 20000, us = Array.from({ length: n }, q.rng(17));
  for (const a of [{ tilt: 0, turn: 0 }, { tilt: 60, turn: 0 }, { tilt: 120, turn: 45 }, { tilt: 90, turn: 90 }, { tilt: 33, turn: 200 }]) {
    for (const o of ['Z', 'X'] as const) {
      const p = u.odds(u.stateAt(a), o), k = u.countPlus(us, p);
      assert.ok(Math.abs(k / n - p[0]) <= 5 * Math.sqrt((p[0] * p[1]) / n), `${o} at ${a.tilt}, ${a.turn}`);
    }
  }
});

test('stats of results: average and spread from counts match the list formula, with known values', () => {
  const cases: number[][] = [[1, 1, -1, -1], [1, 1, 1, -1], [1], [-1, -1, -1], [1, -1, 1, 1, -1, 1, 1]];
  for (const rs of cases) {
    const k = rs.filter((r) => r === 1).length, a = u.listStats(rs), b = u.countStats(k, rs.length);
    close(a.mean, b.mean); close(a.spread, b.spread);
  }
  assert.deepEqual(u.countStats(2, 4), { mean: 0, spread: 1 });
  close(u.countStats(3, 4).mean, 0.5); close(u.countStats(3, 4).spread, Math.sqrt(0.75));
  assert.deepEqual(u.countStats(1, 1), { mean: 1, spread: 0 }); // one result has no spread
  assert.deepEqual(u.countStats(0, 0), { mean: 0, spread: 0 });
});

test('estimates from a batch of 400 copies sit near the exact average (within 5 sigma)', () => {
  const r = q.rng(23), usZ = Array.from({ length: u.MAX }, r), usX = Array.from({ length: u.MAX }, r), n = u.MAX;
  for (const a of GRID) {
    const e = u.exact(a);
    for (const [us, m, d, p] of [[usZ, e.z, e.dZ, e.pZ], [usX, e.x, e.dX, e.pX]] as const) {
      const got = u.countStats(u.countPlus(us, p, n), n);
      if (d === 0) { assert.equal(got.mean, m); assert.equal(got.spread, 0); }
      else assert.ok(Math.abs(got.mean - m) <= 5 * (d / Math.sqrt(n)), `${a.tilt}, ${a.turn}`);
    }
  }
});

test('copies: choices fit the pool, and each pile grid holds all copies and fits its box', () => {
  assert.equal(u.MAX, Math.max(...u.COPIES));
  for (const n of u.COPIES) {
    const { cols, rows } = u.pileShape(n);
    assert.ok(cols * rows >= n);
    for (const [w, h] of [[80, 80], [120, 60], [40, 160]]) {
      const f = u.pileFit(w, h, n);
      assert.ok(f.cols * f.pitch <= w + 1e-9 && f.rows * f.pitch <= h + 1e-9 && f.pitch > 0);
    }
  }
});

// ---- The spread map

test('bound curve: points on dZ dX = b from (b, 1) to (1, b), inside the unit square; none for b = 0', () => {
  for (const b of [0.1, 0.5, 0.9, 1]) {
    const pts = u.boundCurve(b, 24);
    assert.equal(pts.length, 25);
    pts.forEach(([x, y]) => { close(x * y, b); assert.ok(x >= b - 1e-12 && x <= 1 + 1e-12 && y >= b - 1e-12 && y <= 1 + 1e-12); });
    close(pts[0][0], b); close(pts[0][1], 1); close(pts[24][0], 1); close(pts[24][1], b);
  }
  assert.deepEqual(u.boundCurve(0, 24), []);
});

test('every state sits on or outside the quarter circle, and on or above its own bound curve', () => {
  for (const a of GRID) {
    const e = u.exact(a);
    assert.ok(!u.inCorner(e.dZ, e.dX));
    if (e.bound > 0) assert.ok(e.dX >= e.bound / e.dZ - 1e-12);
  }
  assert.ok(u.inCorner(0.5, 0.5));
  assert.ok(!u.inCorner(1, 0));
});

// ---- Words

test('names: the six named states, and the start text', () => {
  assert.equal(u.stateName({ tilt: 0, turn: 123 }), '|0⟩');
  assert.equal(u.stateName({ tilt: 180, turn: 5 }), '|1⟩');
  assert.equal(u.stateName({ tilt: 90, turn: 0 }), '|+⟩');
  assert.equal(u.stateName({ tilt: 90, turn: 90 }), '|+i⟩');
  assert.equal(u.stateName({ tilt: 90, turn: 180 }), '|−⟩');
  assert.equal(u.stateName({ tilt: 90, turn: 270 }), '|−i⟩');
  assert.equal(u.stateName({ tilt: 90, turn: 45 }), null);
  assert.equal(u.stateName({ tilt: 60, turn: 0 }), null);
  assert.equal(u.startText({ tilt: 0, turn: 0 }), 'Started as |0⟩');
  assert.equal(u.startText({ tilt: 60, turn: 90 }), 'Started as 0, then turned to tilt 60°, turn 90°');
  for (const p of u.PRESETS) assert.equal(u.stateName(p.angles), p.label);
  assert.equal(u.sliderText(90, { tilt: 90, turn: 0 }), '90 degrees, the state |+⟩');
  assert.equal(u.sliderText(60, { tilt: 60, turn: 0 }), '60 degrees');
});

test('numbers: exact 0 and ±1 plain, near ones "≈", others two decimals with a true minus', () => {
  assert.equal(u.fmt(0), '0'); assert.equal(u.fmt(1), '1'); assert.equal(u.fmt(-1), '−1');
  assert.equal(u.fmt(6e-17), '0'); assert.equal(u.fmt(1 - 2e-16), '1');
  assert.equal(u.fmt(0.0003), '≈0'); assert.equal(u.fmt(-0.0003), '≈0');
  assert.equal(u.fmt(0.9998), '≈1'); assert.equal(u.fmt(-0.9998), '≈−1');
  assert.equal(u.fmt(0.5), '0.50'); assert.equal(u.fmt(-0.866), '−0.87'); assert.equal(u.fmt(0.707), '0.71');
});

test('verdicts: each named case gets the right words', () => {
  assert.match(u.verdict({ tilt: 0, turn: 0 }), /^Z is sharp here, so X is fully spread/);
  assert.match(u.verdict({ tilt: 180, turn: 70 }), /^Z is sharp here/);
  assert.match(u.verdict({ tilt: 90, turn: 0 }), /^X is sharp here, so Z is fully spread/);
  assert.match(u.verdict({ tilt: 90, turn: 180 }), /^X is sharp here/);
  assert.match(u.verdict({ tilt: 45, turn: 0 }), /⟨Y⟩ = 0, so Robertson's bound is only 0 here/);
  assert.match(u.verdict({ tilt: 90, turn: 90 }), /^The product equals the bound/);
  assert.match(u.verdict({ tilt: 45, turn: 90 }), /^The product equals the bound/);
  assert.match(u.verdict({ tilt: 60, turn: 45 }), /^The product is above the bound/);
});

test('readout: known values, in words, naming the start state', () => {
  assert.equal(u.readout({ tilt: 0, turn: 0 }, 100, 100, 52),
    'Started as |0⟩. Exact: ΔZ = 0 and ΔX = 1, so ΔZ × ΔX = 0, and Robertson\'s bound |⟨Y⟩| is 0. ' +
    'Of 100 copies measured in Z, 100 gave +1 and 0 gave −1 (spread 0). Of 100 other copies measured in X, 52 gave +1 and 48 gave −1 (spread ≈1). ' +
    'Z is sharp here, so X is fully spread: ΔX = 1. No state makes both sharp.');
  assert.equal(u.readout({ tilt: 90, turn: 90 }, 10, 7, 5),
    'Started as |+i⟩. Exact: ΔZ = 1 and ΔX = 1, so ΔZ × ΔX = 1, and Robertson\'s bound |⟨Y⟩| is 1. ' +
    'Of 10 copies measured in Z, 7 gave +1 and 3 gave −1 (spread 0.92). Of 10 other copies measured in X, 5 gave +1 and 5 gave −1 (spread 1). ' +
    'The product equals the bound: for this state, Robertson\'s relation allows nothing smaller. ' +
    'Here the product from these 10 copies is below the bound: a batch only estimates the spreads, and more copies come closer to the exact ones. ' +
    'At |+i⟩ a batch can never land above the bound: both exact spreads are already 1, the most a ±1 result can have.');
  assert.match(u.verdict({ tilt: 60, turn: 45 }), /only requires that the product is not below it/);
  assert.match(u.readout({ tilt: 0, turn: 0 }, 10, 10, 8), /lands inside the quarter circle, where no state can be/);
  assert.equal(u.noiseText({ tilt: 0, turn: 0 }, 100, 100, 52), ''); // too small a dip to show
  for (const a of GRID) for (const n of u.COPIES) {
    const t = u.readout(a, n, Math.floor(n / 3), Math.floor(n / 2));
    assert.match(t, /^Started as /);
    assert.doesNotMatch(t, /square the amplitude|both at once|watch|mix|disturb/i);
  }
});

// ---- Claims in the stop text

test('Text: started as 0, Z gives +1 every time (dZ = 0) and X gives ±1 half and half (average 0, dX = 1)', () => {
  const e = u.exact({ tilt: 0, turn: 0 });
  assert.deepEqual(e.pZ, [1, 0]);
  close(e.pX[0], 0.5); close(e.x, 0);
  assert.equal(e.dZ, 0); assert.equal(e.dX, 1);
});

test('Text: |+i> = S H|0> = (|0> + i|1>)/√2 has <Y> = 1, so dZ dX >= 1 and both spreads are 1', () => {
  const s = q.matVec(q.S, q.matVec(q.H, q.ket0()));
  close(s[0].re, Math.SQRT1_2); close(s[1].im, Math.SQRT1_2);
  close(u.mean(s, Y), 1);
  close(u.spread(s, Z), 1); close(u.spread(s, X), 1);
  close(q.abs(q.inner(s, u.stateAt({ tilt: 90, turn: 90 }))), 1);
});

test('Text (N&C Box 2.4): for |0>, [X, Y] = 2iZ gives dX dY >= <0|Z|0> = 1, and both spreads are 1', () => {
  const s = q.ket0();
  close(u.bound(s, X, Y), 1);
  close(u.spread(s, X), 1); close(u.spread(s, Y), 1);
});

test('Text: a ±1 result spreads at most 1, reached exactly when both results have chance 1/2', () => {
  for (let k = 0; k <= 100; k++) {
    const p = k / 100, d = 2 * Math.sqrt(p * (1 - p));
    assert.ok(d <= 1 + 1e-15);
    if (Math.abs(d - 1) < 1e-12) close(p, 0.5);
  }
});
