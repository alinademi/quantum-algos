import test from 'node:test';
import assert from 'node:assert/strict';
import * as q from '../quantum.ts';
import * as s from './pictures.ts';
import type { Drive, Meas, Vec } from './pictures.ts';

const close = (a: number, b: number, eps = 1e-12) => assert.ok(Math.abs(a - b) < eps, `${a} != ${b}`);
const closeC = (a: q.C, b: q.C, eps = 1e-12) => { close(a.re, b.re, eps); close(a.im, b.im, eps); };
const closeM = (a: q.Matrix, b: q.Matrix, eps = 1e-12) => a.forEach((row, i) => row.forEach((x, j) => closeC(x, b[i][j], eps)));
const closeV = (a: Vec, b: Vec, eps = 1e-12) => a.forEach((x, i) => close(x, b[i], eps));
const rad = (d: number) => (d * Math.PI) / 180;
const DRIVES: Drive[] = ['x', 'h'];
const MEAS: Meas[] = ['Z', 'X', 'Y'];
const degrees = Array.from({ length: 361 }, (_, d) => d); // every slider value
const some = [0, 1, 37, 45, 60, 90, 133, 180, 222, 270, 301, 359, 360];
const every = (fn: (d: Drive, m: Meas, deg: number) => void, ds = degrees) => {
  for (const d of DRIVES) for (const m of MEAS) for (const deg of ds) fn(d, m, deg);
};
const lin = (terms: [q.C, q.Matrix][]): q.Matrix =>
  [0, 1].map((i) => [0, 1].map((j) => terms.reduce((t, [k, m]) => q.add(t, q.mul(k, m[i][j])), q.c(0))));
const comm = (a: q.Matrix, b: q.Matrix) => lin([[q.c(1), q.matMul(a, b)], [q.c(-1), q.matMul(b, a)]]);
const cross = (a: Vec, b: Vec): Vec => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const dot3 = (a: Vec, b: Vec) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
/** Rodrigues' formula: v turned by deg degrees about the unit axis k, right-hand rule. Written here, apart from the sim. */
const turn = (v: Vec, k: Vec, deg: number): Vec => {
  const c = Math.cos(rad(deg)), sn = Math.sin(rad(deg)), kv = dot3(k, v), kx = cross(k, v);
  return [0, 1, 2].map((i) => v[i] * c + kx[i] * sn + k[i] * kv * (1 - c)) as Vec;
};
const Z0: Vec = [0, 0, 1];

// ---- Time evolution

test('U = cos(ωt/2) I − i sin(ωt/2) n·σ is unitary for every slider value, with the drive axis a unit vector', () => {
  for (const d of DRIVES) {
    close(Math.hypot(...s.DRIVES[d].n), 1);
    for (const deg of degrees) {
      const U = s.evolution(d, deg);
      closeM(q.matMul(q.dagger(U), U), q.I);
      closeM(q.matMul(U, q.dagger(U)), q.I);
    }
  }
});

test('U for the x drive is the rotation gate RX(ωt)', () => {
  for (const deg of degrees) closeM(s.evolution('x', deg), q.RX(rad(deg)));
});

test('U(a) U(b) = U(a + b): time steps add, so the evolution is one steady drive', () => {
  for (const d of DRIVES) for (const a of some) for (const b of some) closeM(q.matMul(s.evolution(d, a), s.evolution(d, b)), s.evolution(d, a + b));
});

test('known values: U(0) = I, U(360°) = −I, x drive at 180° is −iX, tilted drive at 180° is −iH (a Hadamard gate)', () => {
  const minusI = (m: q.Matrix) => lin([[q.c(0, -1), m]]);
  for (const d of DRIVES) { closeM(s.evolution(d, 0), q.I); closeM(s.evolution(d, 360), lin([[q.c(-1), q.I]])); }
  closeM(s.evolution('x', 180), minusI(q.X));
  closeM(s.evolution('h', 180), minusI(q.H));
});

test('Schrödinger equation: dU/dθ = −(i/2) n·σ U, with θ = ωt (central difference)', () => {
  const e = 1e-5, step = e / rad(1); // e radians, in degrees
  for (const d of DRIVES) for (const deg of some) {
    const dU = lin([[q.c(1 / (2 * e)), s.evolution(d, deg + step)], [q.c(-1 / (2 * e)), s.evolution(d, deg - step)]]);
    closeM(dU, lin([[q.c(0, -0.5), q.matMul(s.sigma(s.DRIVES[d].n), s.evolution(d, deg))]]), 1e-8);
  }
});

// ---- Born rule, in the Schrödinger picture

test('measurement eigenstates: up and down are orthonormal and are the +1 and −1 eigenstates of the observable', () => {
  for (const m of MEAS) {
    const M = s.MEASURES[m];
    close(q.norm2(M.up), 1); close(q.norm2(M.down), 1); closeC(q.inner(M.up, M.down), q.c(0));
    q.matVec(M.op, M.up).forEach((a, i) => closeC(a, M.up[i]));
    q.matVec(M.op, M.down).forEach((a, i) => closeC(a, q.scale(M.down[i], -1)));
    closeM(s.sigma(M.m), M.op);
  }
});

test('Born rule: the two odds add to 1 and lie in [0, 1], for every slider value, drive and measurement', () => {
  every((d, m, deg) => {
    const [a, b] = s.schrodingerOdds(d, m, deg);
    close(a + b, 1, 3e-12); // odds are rounded to 12 places
    assert.ok(a >= 0 && a <= 1 && b >= 0 && b <= 1);
    close(q.norm2(s.stateAt(d, deg)), 1);
  });
});

// ---- The two pictures agree

test('the pictures agree: |⟨a+|U|0⟩|² = (1 + ⟨0|U†AU|0⟩)/2 for every slider value, drive and measurement', () => {
  every((d, m, deg) => close(s.schrodingerP(d, m, deg), s.heisenbergP(d, m, deg), 2e-12));
});

test('the pictures agree on the whole distribution: each result has projector U†ΠU on |0⟩', () => {
  every((d, m, deg) => {
    const U = s.evolution(d, deg), M = s.MEASURES[m];
    [M.up, M.down].forEach((k, i) => {
      const proj = [0, 1].map((r) => [0, 1].map((c) => q.mul(k[r], q.conj(k[c]))));
      const back = q.matMul(q.dagger(U), q.matMul(proj, U));
      close(q.inner(s.start(), q.matVec(back, s.start())).re, s.schrodingerOdds(d, m, deg)[i], 2e-12);
    });
  }, some);
});

test('the shown numbers match: both formula lines and both angles read the same for every slider value', () => {
  every((d, m, deg) => {
    assert.equal(s.fixed(s.schrodingerP(d, m, deg)), s.fixed(s.heisenbergP(d, m, deg)));
    const a = s.angles(d, m, deg);
    close(a.s, a.h, 1e-6);
    assert.equal(Math.round(a.s), Math.round(a.h));
  });
});

test('P(+1) = cos²(γ/2) = (1 + m·r)/2, where γ is the angle between the state and the +1 end of the axis', () => {
  every((d, m, deg) => {
    const p = s.schrodingerP(d, m, deg), r = s.stateVec(d, deg), a = s.angles(d, m, deg);
    close(p, Math.cos(rad(a.s) / 2) ** 2, 1e-9);
    close(p, (1 + dot3(s.MEASURES[m].m, r)) / 2, 2e-12);
  });
});

// ---- The Heisenberg picture

test('A_H = U†AU stays an observable with results ±1: Hermitian, trace 0, A_H² = I, and A_H(0) = A', () => {
  every((d, m, deg) => {
    const A = s.observableAt(d, m, deg);
    closeM(A, q.dagger(A));
    closeC(s.trace(A), q.c(0));
    closeM(q.matMul(A, A), q.I);
    closeM(A, s.sigma(s.axisVec(d, m, deg))); // A_H is exactly (axis)·σ
    close(Math.hypot(...s.axisVec(d, m, deg)), 1);
  }, some);
  for (const d of DRIVES) for (const m of MEAS) closeM(s.observableAt(d, m, 0), s.MEASURES[m].op);
});

test('Heisenberg equation: dA_H/dθ = (i/2)[n·σ, A_H], with θ = ωt (central difference)', () => {
  const e = 1e-5, step = e / rad(1);
  every((d, m, deg) => {
    const dA = lin([[q.c(1 / (2 * e)), s.observableAt(d, m, deg + step)], [q.c(-1 / (2 * e)), s.observableAt(d, m, deg - step)]]);
    closeM(dA, lin([[q.c(0, 0.5), comm(s.sigma(s.DRIVES[d].n), s.observableAt(d, m, deg))]]), 1e-8);
  }, some);
});

test('products and commutators keep their form: X_H Y_H = i Z_H and [X_H, Y_H] = 2i Z_H', () => {
  for (const d of DRIVES) for (const deg of some) {
    const [x, y, z] = (['X', 'Y', 'Z'] as Meas[]).map((m) => s.observableAt(d, m, deg));
    closeM(q.matMul(x, y), lin([[q.c(0, 1), z]]));
    closeM(comm(x, y), lin([[q.c(0, 2), z]]));
  }
});

test('conserved: the drive observable n·σ never moves, and X never moves under the x drive; nothing else here is conserved', () => {
  for (const d of DRIVES) for (const deg of degrees) {
    const U = s.evolution(d, deg), N = s.sigma(s.DRIVES[d].n);
    closeM(q.matMul(q.dagger(U), q.matMul(N, U)), N);
  }
  for (const deg of degrees) closeM(s.observableAt('x', 'X', deg), q.X);
  for (const d of DRIVES) for (const m of MEAS) assert.equal(s.conserved(d, m), d === 'x' && m === 'X');
  for (const deg of degrees) close(s.schrodingerP('x', 'X', deg), 0.5); // the state stays 90° from x
});

// ---- Geometry: the state turns one way, the measurement axis the other way

test('the state turns by +ωt about the drive axis, and the measurement axis by −ωt (Rodrigues, written apart)', () => {
  every((d, m, deg) => {
    const n = s.DRIVES[d].n;
    closeV(s.stateVec(d, deg), turn(Z0, n, deg));
    closeV(s.axisVec(d, m, deg), turn(s.MEASURES[m].m, n, -deg));
  });
});

test('Gottesman runs the other way: U A U† turns the axis by +ωt, the inverse of U†AU; for a Hadamard gate both swap X and Z', () => {
  for (const deg of some) for (const m of MEAS) {
    const U = s.evolution('x', deg), fwd = q.matMul(U, q.matMul(s.MEASURES[m].op, q.dagger(U)));
    closeV(s.paulis(fwd), turn(s.MEASURES[m].m, [1, 0, 0], deg));
  }
  const U = s.evolution('x', 90), fwd = s.paulis(q.matMul(U, q.matMul(q.Z, q.dagger(U))));
  closeV(fwd, [0, -1, 0]); closeV(s.axisVec('x', 'Z', 90), [0, 1, 0]); // they differ: −Y and +Y
  for (const [a, b] of [[q.X, q.Z], [q.Z, q.X]]) {
    closeM(q.matMul(q.H, q.matMul(a, q.H)), b); // H X H† = Z and H Z H† = X
  }
  closeM(q.matMul(q.S, q.matMul(q.X, q.dagger(q.S))), q.Y); // S X S† = Y
  closeM(q.matMul(q.dagger(q.S), q.matMul(q.X, q.S)), lin([[q.c(-1), q.Y]])); // S† X S = −Y: for S the two maps differ
  closeV(s.axisVec('h', 'Z', 180), [1, 0, 0]); closeV(s.axisVec('h', 'X', 180), [0, 0, 1]); closeV(s.axisVec('h', 'Y', 180), [0, -1, 0]);
});

// ---- Known values

test('x drive, started as 0: P(0) = cos²(ωt/2), P(+i) = (1 − sin ωt)/2, and Z_H = cos ωt Z + sin ωt Y', () => {
  for (const deg of degrees) {
    const t = rad(deg);
    close(s.schrodingerP('x', 'Z', deg), Math.cos(t / 2) ** 2);
    close(s.schrodingerP('x', 'Y', deg), (1 - Math.sin(t)) / 2);
    closeV(s.axisVec('x', 'Z', deg), [0, Math.sin(t), Math.cos(t)]);
  }
  assert.equal(s.schrodingerP('x', 'Z', 0), 1); assert.equal(s.schrodingerP('x', 'Z', 180), 0); assert.equal(s.schrodingerP('x', 'Z', 360), 1);
  close(s.schrodingerP('x', 'Z', 60), 0.75); close(s.schrodingerP('x', 'Z', 90), 0.5);
  assert.equal(s.opText(s.axisVec('x', 'Z', 90)), 'Y'); assert.equal(s.opText(s.axisVec('x', 'Z', 180)), '−Z');
  assert.equal(s.opText(s.axisVec('x', 'Z', 45)), '0.71 Y + 0.71 Z');
});

test('tilted drive, started as 0: P(0) = (3 + cos ωt)/4, P(+) = (3 − cos ωt)/4, P(+i) = (1 − sin ωt/√2)/2', () => {
  for (const deg of degrees) {
    const t = rad(deg);
    close(s.schrodingerP('h', 'Z', deg), (3 + Math.cos(t)) / 4);
    close(s.schrodingerP('h', 'X', deg), (3 - Math.cos(t)) / 4);
    close(s.schrodingerP('h', 'Y', deg), (1 - Math.sin(t) * Math.SQRT1_2) / 2);
  }
  // At 180° the state is −i|+⟩: the same state as |+⟩, so X gives + every time and Z gives 50/50.
  s.stateAt('h', 180).forEach((a, i) => closeC(a, q.mul(q.c(0, -1), q.plus()[i])));
  assert.equal(s.schrodingerP('h', 'X', 180), 1); assert.equal(s.schrodingerP('h', 'Z', 180), 0.5);
  assert.equal(s.nameOf(s.stateVec('h', 180)), '|+⟩');
});

test('the state stays on one circle: a great circle for the x drive, a smaller one (radius 1/√2) for the tilted drive', () => {
  for (const deg of degrees) {
    close(s.stateVec('x', deg)[0], 0);
    const v = s.stateVec('h', deg), n = s.DRIVES.h.n;
    close(dot3(v, n), Math.SQRT1_2); // fixed height along the drive axis, so a circle of radius 1/√2
  }
  assert.equal(s.nameOf(s.stateVec('x', 90)), '|−i⟩'); assert.equal(s.nameOf(s.stateVec('x', 180)), '|1⟩'); assert.equal(s.nameOf(s.stateVec('x', 270)), '|+i⟩');
});

test('global phase: a full turn gives −|0⟩, the same Bloch point and the same odds as |0⟩', () => {
  for (const d of DRIVES) {
    s.stateAt(d, 360).forEach((a, i) => closeC(a, q.scale(q.ket0()[i], -1)));
    closeV(s.stateVec(d, 360), Z0);
    for (const m of MEAS) assert.equal(s.schrodingerP(d, m, 360), s.schrodingerP(d, m, 0));
  }
});

// ---- Shots

test('shots: copy i gives the first result when its draw is below P, so P = 0 gives none and P = 1 gives all', () => {
  const us = Array.from({ length: s.COPIES }, (_, i) => (i + 0.5) / s.COPIES);
  assert.equal(s.plusCount(us, 0), 0); assert.equal(s.plusCount(us, 1), s.COPIES);
  for (const p of [0.1, 0.25, 0.5, 0.75, 0.853]) assert.equal(s.plusCount(us, p), Math.ceil(p * s.COPIES - 0.5));
  assert.equal(s.plusCount(us, 0.5, 10), 10); // only the first 10 copies are shown
  let last = 0;
  for (const deg of degrees.slice(0, 181)) { const k = s.plusCount(us, s.schrodingerP('x', 'Z', 180 - deg)); assert.ok(k >= last); last = k; }
});

test('shots follow the Born rule: 20,000 seeded draws land within 4 standard deviations of the prediction', () => {
  const rand = q.rng(7), n = 20000;
  for (const [d, m, deg] of [['x', 'Z', 60], ['h', 'Y', 90], ['h', 'X', 33]] as [Drive, Meas, number][]) {
    const p = s.schrodingerP(d, m, deg), k = s.plusCount(Array.from({ length: n }, rand), p);
    assert.ok(Math.abs(k - n * p) < 4 * Math.sqrt(n * p * (1 - p)), `${d} ${m} ${deg}: ${k} vs ${n * p}`);
  }
});

// ---- Drawing math

test('camera: the three view vectors are orthonormal, and sphere points lie on the unit sphere', () => {
  for (const [yaw, tilt] of [[25, 18], [0, 0], [120, -40]]) {
    const v = s.view(yaw, tilt);
    [v.right, v.up, v.toward].forEach((a) => close(Math.hypot(...a), 1));
    close(dot3(v.right, v.up), 0); close(dot3(v.right, v.toward), 0); close(dot3(v.up, v.toward), 0);
  }
  const cam = s.view(25, 18);
  assert.ok(s.project([0, 0, 1], cam).y > 0.9); // |0⟩ is up
  assert.ok(s.project([0, 1, 0], cam).x > 0.9); // |+i⟩ is right
  assert.ok(s.project([1, 0, 0], cam).depth > 0.8); // |+⟩ points toward the viewer
  s.spherePoints(220).forEach((p) => close(Math.hypot(...p), 1));
  assert.equal(s.trail(360, 5, () => Z0).length, 72); assert.equal(s.trail(0, 5, () => Z0).length, 0);
});

// ---- Words

test('numbers: true minus signs, never −0.00; kets and observables read cleanly', () => {
  assert.equal(s.num(-0.001), '0.00'); assert.equal(s.num(-0.5), '−0.50'); assert.equal(s.num(0.70710678), '0.71');
  assert.equal(s.amp(q.c(0, -Math.SQRT1_2)), '−0.71i'); assert.equal(s.amp(q.c(0.5, -0.5)), '(0.50 − 0.50i)');
  assert.equal(s.ketText(s.stateAt('x', 90)), '0.71|0⟩ − 0.71i|1⟩');
  assert.equal(s.ketText(s.stateAt('x', 360)), '−1.00|0⟩ + 0.00|1⟩');
  assert.equal(s.opText([0.5, -Math.SQRT1_2, 0.5]), '0.50 X − 0.71 Y + 0.50 Z');
  assert.equal(s.opText([-1, 0, 0]), '−X');
  every((d, m, deg) => {
    for (const t of [s.ketText(s.stateAt(d, deg)), s.opText(s.axisVec(d, m, deg)), s.vecText(s.stateVec(d, deg))]) assert.ok(!t.includes('−0.00'), t);
  });
});

test('percent: whole percents, never a false 0% or 100%', () => {
  assert.equal(s.percent(0), '0%'); assert.equal(s.percent(1), '100%'); assert.equal(s.percent(0.5), '50%');
  assert.equal(s.percent(0.004), 'under 1%'); assert.equal(s.percent(0.996), 'over 99%'); assert.equal(s.percent(0.8536), '85%');
});

test('every readout and slider text names the start state and gives the shared odds; counts add up', () => {
  every((d, m, deg) => {
    const p = s.schrodingerP(d, m, deg), [up, down] = s.MEASURES[m].results;
    const t = s.readout(d, m, deg, 37);
    assert.ok(t.startsWith('Started as 0,'), t);
    assert.ok(t.includes(`P(${up}) = ${s.percent(p)}`), t);
    assert.ok(t.includes(`37 gave ${up} and 63 gave ${down}`), t);
    assert.ok(!t.includes('−0.00'), t);
    assert.ok(s.valueText(d, m, deg).includes('Started as 0'));
    assert.ok(!s.readout(d, m, deg).includes('fresh copies'));
  }, some);
  assert.ok(s.readout('x', 'Z', 90, 100).includes('all 100 gave 0'));
  assert.ok(s.readout('x', 'Z', 90, 0).includes('all 100 gave 1'));
  assert.ok(s.readout('x', 'Z', 90).includes('to |−i⟩') && s.readout('x', 'Z', 90).includes('the other way, to Y'));
  assert.ok(s.readout('x', 'X', 90).includes('conserved'));
  assert.ok(s.readout('h', 'Z', 180).includes('Hadamard gate times −i'));
  assert.ok(s.readout('x', 'Z', 360).includes('global phase'));
  assert.ok(s.readout('x', 'Z', 0).includes('No time has passed'));
});
