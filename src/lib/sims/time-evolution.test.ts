import test from 'node:test';
import assert from 'node:assert/strict';
import * as q from '../quantum.ts';
import * as te from './time-evolution.ts';

const close = (a: number, b: number, eps = 1e-12) => assert.ok(Math.abs(a - b) < eps, `${a} != ${b}`);
const closeC = (a: q.C, b: q.C, eps = 1e-12) => { close(a.re, b.re, eps); close(a.im, b.im, eps); };
const closeM = (a: q.Matrix, b: q.Matrix, eps = 1e-12) => a.forEach((row, i) => row.forEach((x, j) => closeC(x, b[i][j], eps)));
const closeV = (a: number[], b: number[], eps = 1e-12) => a.forEach((x, i) => close(x, b[i], eps));
const rad = (d: number) => (d * Math.PI) / 180;

const alphas = Array.from({ length: 13 }, (_, k) => k * 15); // 0°, 15°, ..., 180°
const tilts = Array.from({ length: 181 }, (_, d) => d); // every tilt slider value
const times = Array.from({ length: 201 }, (_, k) => k / 100); // every time slider value, 0 to 2 periods
const steps = times.filter((_, k) => k % 5 === 0); // the strip's column times
const someTimes = [0, 0.01, 0.13, 0.25, 0.5, 0.75, 1, 1.37, 1.5, 2];
const bases: te.Basis[] = ['Z', 'X'];
/** A matrix with −0 turned into 0, for exact comparisons. */
const exact = (m: q.Matrix): q.Matrix => m.map((r) => r.map((x) => q.c(x.re + 0, x.im + 0)));

/** e^A by its Taylor series, an independent check of the closed form. */
function expm(a: q.Matrix, terms = 90): q.Matrix {
  let sum: q.Matrix = q.I.map((r) => [...r]), term: q.Matrix = q.I.map((r) => [...r]);
  for (let k = 1; k < terms; k++) {
    term = q.matMul(term, a).map((r) => r.map((x) => q.scale(x, 1 / k)));
    sum = sum.map((r, i) => r.map((x, j) => q.add(x, term[i][j])));
  }
  return sum;
}
const times2 = (m: q.Matrix, z: q.C): q.Matrix => m.map((r) => r.map((x) => q.mul(x, z)));

// ---- Start states

test('start states: |0>, |1>, |+> = H|0> and |-> = H|1>', () => {
  te.startState('0').forEach((a, i) => closeC(a, q.ket0()[i]));
  te.startState('1').forEach((a, i) => closeC(a, q.ket1()[i]));
  te.startState('+').forEach((a, i) => closeC(a, q.matVec(q.H, q.ket0())[i]));
  te.startState('-').forEach((a, i) => closeC(a, q.matVec(q.H, q.ket1())[i]));
});

test('every readout names how the start state was made', () => {
  assert.equal(te.startText('0'), 'Started as 0');
  assert.equal(te.startText('+'), 'Started as 0, then a Hadamard gate (|+⟩)');
  assert.equal(te.startText('-'), 'Started as 1, then a Hadamard gate (|−⟩)');
  for (const id of te.STARTS) for (const a of [0, 45, 90]) for (const b of bases) {
    assert.ok(te.describe(id, a, 0.5, b).startsWith(te.startText(id) + '.'));
  }
});

// ---- The Hamiltonian

test('axis: a unit vector in the x-z plane, exact on the named axes', () => {
  for (const a of tilts) { const n = te.axis(a); close(Math.hypot(...n), 1); assert.equal(n[1], 0); }
  assert.deepEqual(te.axis(0), [0, 0, 1]);
  assert.deepEqual(te.axis(90), [1, 0, 0]);
  assert.deepEqual(te.axis(180), [0, 0, -1]);
});

test('n·sigma is the Pauli sum, Hermitian, and squares to I', () => {
  const n: te.Vec3 = [0.36, 0.48, 0.8];
  const sum = [q.X, q.Y, q.Z].reduce<q.Matrix>((t, p, k) => t.map((r, i) => r.map((x, j) => q.add(x, q.scale(p[i][j], n[k])))), [[q.c(0), q.c(0)], [q.c(0), q.c(0)]]);
  closeM(te.nSigma(n), sum);
  for (const a of tilts) {
    const m = te.nSigma(te.axis(a));
    closeM(q.dagger(m), m);
    closeM(q.matMul(m, m), q.I);
  }
});

test('H = n·sigma + shift I has energies shift ± 1 (in units of ħω/2), eigenstates on the axis', () => {
  for (const a of tilts) for (const shift of [0, 0.4, -1.3]) {
    const h = te.hamiltonian(a, shift), t = rad(a);
    closeM(q.dagger(h), h);
    // Eigenstates of n·sigma for n = (sin a, 0, cos a): (cos a/2, sin a/2) with +1 and (−sin a/2, cos a/2) with −1.
    const up: q.State = [q.c(Math.cos(t / 2)), q.c(Math.sin(t / 2))], down: q.State = [q.c(-Math.sin(t / 2)), q.c(Math.cos(t / 2))];
    q.matVec(h, up).forEach((x, i) => closeC(x, q.scale(up[i], shift + 1)));
    q.matVec(h, down).forEach((x, i) => closeC(x, q.scale(down[i], shift - 1)));
  }
});

// ---- U = e^{−iHt/ħ}

test('closed form equals the Taylor series of e^{−iHt/ħ}, with ωt/2 = π·t/T', () => {
  for (const a of [0, 30, 90, 135, 180]) for (const t of someTimes) for (const shift of [0, 0.7]) {
    const series = expm(times2(te.hamiltonian(a, shift), q.c(0, -Math.PI * t)));
    closeM(te.evolution(a, t, shift), series, 1e-9);
  }
});

test('closed form equals the spectral form: each energy turns its own eigenstate by e^{−iEt/ħ}', () => {
  for (const a of alphas) for (const t of someTimes) {
    const h = rad(a) / 2, up = [Math.cos(h), Math.sin(h)], down = [-Math.sin(h), Math.cos(h)];
    const eUp = q.expi(-Math.PI * t), eDown = q.expi(Math.PI * t); // E = ±ħω/2, so Et/ħ = ±π t/T
    const spec: q.Matrix = [0, 1].map((i) => [0, 1].map((j) => q.add(q.scale(eUp, up[i] * up[j]), q.scale(eDown, down[i] * down[j]))));
    closeM(te.evolution(a, t), spec);
  }
});

test('Schrödinger equation: d|ψ>/dt = −(i/ħ) H|ψ>, checked by a central difference', () => {
  const h = 1e-5;
  for (const id of te.STARTS) for (const a of [0, 20, 90, 150]) for (const t of [0.1, 0.5, 1.3]) for (const shift of [0, 0.5]) {
    const fwd = te.evolve(id, a, t + h, shift), back = te.evolve(id, a, t - h, shift), now = te.evolve(id, a, t, shift);
    const rhs = q.matVec(te.hamiltonian(a, shift), now).map((x) => q.mul(x, q.c(0, -Math.PI))); // d/d(t/T) = −iπ (H / (ħω/2))
    fwd.forEach((x, i) => closeC(q.scale(q.sub(x, back[i]), 1 / (2 * h)), rhs[i], 1e-7));
  }
});

test('U is unitary at every tilt and every time on the slider', () => {
  for (const a of alphas) for (const t of times) {
    const u = te.evolution(a, t);
    closeM(q.matMul(q.dagger(u), u), q.I);
  }
});

test('U(0) = I, U(T) = −I and U(2T) = I exactly; U(s)U(t) = U(s + t); U(−t) = U(t)†', () => {
  for (const a of tilts) {
    assert.deepEqual(exact(te.evolution(a, 0)), [[q.c(1), q.c(0)], [q.c(0), q.c(1)]]);
    assert.deepEqual(exact(te.evolution(a, 1)), [[q.c(-1), q.c(0)], [q.c(0), q.c(-1)]]);
    assert.deepEqual(exact(te.evolution(a, 2)), [[q.c(1), q.c(0)], [q.c(0), q.c(1)]]);
  }
  for (const a of [0, 35, 90, 170]) for (const s of [0.2, 0.75]) for (const t of [0.05, 0.6, 1.1]) {
    closeM(q.matMul(te.evolution(a, s), te.evolution(a, t)), te.evolution(a, s + t));
    closeM(te.evolution(a, -t), q.dagger(te.evolution(a, t)));
  }
});

// ---- The turn on the Bloch sphere

test('the point from the amplitudes is the start point turned by 360°·t/T about the axis (precession)', () => {
  for (const id of te.STARTS) for (const a of alphas) for (const t of times) {
    closeV(te.pointAt(id, a, t), te.rotate(q.bloch(te.startState(id)), te.axis(a), 360 * t), 1e-12);
  }
});

test('precession: dr/dt = ω n × r, so the point keeps its height along the axis and stays on the sphere', () => {
  const h = 1e-5;
  for (const id of te.STARTS) for (const a of [10, 90, 135]) for (const t of [0.2, 0.9]) {
    const n = te.axis(a), r = te.pointAt(id, a, t), f = te.pointAt(id, a, t + h), b = te.pointAt(id, a, t - h);
    const cross = [n[1] * r[2] - n[2] * r[1], n[2] * r[0] - n[0] * r[2], n[0] * r[1] - n[1] * r[0]];
    closeV(f.map((x, i) => (x - b[i]) / (2 * h)), cross.map((x) => 2 * Math.PI * x), 1e-7); // ω = 2π per period
    close(Math.hypot(...r), 1);
    close(n[0] * r[0] + n[2] * r[2], n[0] * te.pointAt(id, a, 0)[0] + n[2] * te.pointAt(id, a, 0)[2]);
  }
});

test('rotate: right-handed, keeps length, a full turn is the identity', () => {
  closeV(te.rotate([1, 0, 0], [0, 0, 1], 90), [0, 1, 0]);
  closeV(te.rotate([0, 0, 1], [1, 0, 0], 90), [0, -1, 0]);
  closeV(te.rotate([0.6, 0, 0.8], [0, 0, 1], 360), [0.6, 0, 0.8]);
  closeV(te.rotate([0.6, 0, 0.8], [0.6, 0, 0.8], 123), [0.6, 0, 0.8]);
});

// ---- Born rule and the physics the strip shows

test('Born rule: odds add to 1 and lie in [0, 1], in both bases, at every slider setting', () => {
  for (const id of te.STARTS) for (const a of alphas) for (const b of bases) for (const t of times) {
    const [p0, p1] = te.oddsAt(id, a, t, b);
    close(p0 + p1, 1, 3e-12); // odds are rounded to 12 places
    assert.ok(p0 >= 0 && p0 <= 1 && p1 >= 0 && p1 <= 1);
  }
});

test('odds follow the point: P(1) = (1 − z)/2 in 0/1, and (1 − x)/2 after a Hadamard gate', () => {
  for (const id of te.STARTS) for (const a of alphas) for (const t of someTimes) {
    const [x, , z] = te.pointAt(id, a, t);
    close(te.oddsAt(id, a, t, 'Z')[1], (1 - z) / 2, 1e-11);
    close(te.oddsAt(id, a, t, 'X')[1], (1 - x) / 2, 1e-11);
  }
});

test('Rabi: started as 0, P(1) = sin²α · sin²(ωt/2), for every tilt and time', () => {
  for (const a of tilts) for (const t of steps) close(te.oddsAt('0', a, t, 'Z')[1], Math.sin(rad(a)) ** 2 * Math.sin(Math.PI * t) ** 2, 1e-11);
});

test('Rabi known values: H along X takes 0 to 1 in half a period, exactly', () => {
  const p = (t: number) => te.oddsAt('0', 90, t, 'Z')[1];
  assert.equal(p(0), 0); assert.equal(p(0.25), 0.5); assert.equal(p(0.5), 1); assert.equal(p(0.75), 0.5); assert.equal(p(1), 0);
  assert.equal(te.oddsAt('0', 45, 0.5, 'Z')[1], 0.5); // a 45° axis reaches at most 50%
  assert.deepEqual(te.range('0', 45, 'Z'), [0, 0.5]);
  assert.deepEqual(te.range('0', 90, 'Z'), [0, 1]);
});

test('H along Z, started as 0 then a Hadamard gate: 0/1 odds stay 50/50; with a Hadamard gate first, P(1) = sin²(ωt/2)', () => {
  for (const t of times) {
    assert.deepEqual(te.oddsAt('+', 0, t, 'Z'), [0.5, 0.5]);
    close(te.oddsAt('+', 0, t, 'X')[1], Math.sin(Math.PI * t) ** 2);
  }
  assert.deepEqual(te.range('+', 0, 'Z'), [0.5, 0.5]);
  assert.deepEqual(te.range('+', 0, 'X'), [0, 1]);
  assert.ok(te.describe('+', 0, 0.3, 'Z').includes('A Hadamard gate before the measurement shows it.'));
  assert.ok(te.describe('+', 0, 0.3, 'X').includes('In the X basis (a Hadamard gate, then the 0/1 measurement), the chance to read 1'));
  for (const id of te.STARTS) for (const a of [0, 45, 90]) assert.ok(te.describe(id, a, 0.5, 'X').includes('X basis'));
});

test('energy eigenstates (on the axis) only gain a global phase e^{∓iωt/2}: nothing measurable changes', () => {
  const eig: [te.StartId, number, number][] = [['0', 0, 1], ['1', 0, -1], ['1', 180, 1], ['0', 180, -1], ['+', 90, 1], ['-', 90, -1]];
  for (const [id, a, e] of eig) {
    assert.ok(te.isEigen(id, a));
    close(te.energy(id, a), e);
    for (const t of times) {
      te.evolve(id, a, t).forEach((x, i) => closeC(x, q.mul(q.expi(-e * Math.PI * t), te.startState(id)[i])));
      closeV(te.pointAt(id, a, t), te.pointAt(id, a, 0));
      for (const b of bases) assert.deepEqual(te.oddsAt(id, a, t, b), te.oddsAt(id, a, 0, b));
    }
    assert.ok(te.describe(id, a, 0.4, 'Z').includes('energy eigenstate'));
  }
  for (const id of te.STARTS) for (const a of [10, 45, 135]) assert.ok(!te.isEigen(id, a));
});

test('energy <H> = n·r is the same at every time (conserved)', () => {
  for (const id of te.STARTS) for (const a of alphas) {
    const e0 = te.energy(id, a), n = te.axis(a), r = q.bloch(te.startState(id));
    close(e0, n[0] * r[0] + n[1] * r[1] + n[2] * r[2]);
    for (const t of someTimes) close(te.energy(id, a, t), e0);
  }
});

test('adding the same energy to both levels changes only a global phase: no odds change', () => {
  for (const id of te.STARTS) for (const a of [0, 60, 90]) for (const t of someTimes) for (const shift of [0.5, -2, 3.3]) {
    const g = q.expi(-Math.PI * shift * t);
    te.evolve(id, a, t, shift).forEach((x, i) => closeC(x, q.mul(g, te.evolve(id, a, t)[i])));
    for (const b of bases) closeV(te.oddsAt(id, a, t, b, shift), te.oddsAt(id, a, t, b));
  }
});

test('symmetries: odds repeat every period T and are mirror images about T/2', () => {
  for (const id of te.STARTS) for (const a of alphas) for (const b of bases) for (const t of steps.slice(0, 21)) {
    close(te.oddsAt(id, a, t + 1, b)[1], te.oddsAt(id, a, t, b)[1], 1e-11);
    close(te.oddsAt(id, a, 1 - t, b)[1], te.oddsAt(id, a, t, b)[1], 1e-11);
  }
});

test('range: every odds value lies inside it, and its ends are reached at t = 0 or T/2', () => {
  // Start and axis both lie in the x-z plane, so the sin ωt term is 0 and the extremes sit at ωt = 0 and π.
  for (const id of te.STARTS) for (const a of alphas) for (const b of bases) {
    const [lo, hi] = te.range(id, a, b), ends = [te.oddsAt(id, a, 0, b)[1], te.oddsAt(id, a, 0.5, b)[1]];
    close(lo, Math.min(...ends), 1e-11); close(hi, Math.max(...ends), 1e-11);
    for (const t of times) { const p = te.oddsAt(id, a, t, b)[1]; assert.ok(p >= lo - 1e-11 && p <= hi + 1e-11); }
  }
});

// ---- Measured copies

test('columns: times 0, T/20, ..., 2T, and the count shown at every time slider value', () => {
  assert.equal(te.columnTurns(0), 0); assert.equal(te.columnTurns(te.COLS - 1), te.MAX_TURNS);
  for (let v = 0; v <= 200; v++) assert.equal(te.columnsUpTo(v / 100), Math.floor(v / 5) + 1, `t = ${v / 100}`);
  assert.equal(te.columnsUpTo(5), te.COLS);
});

test('shots: a copy gives 1 when its draw is below P(1), so a draw u gives 1 with chance P(1), and raising P(1) only adds 1s', () => {
  const n = 1000, us = Array.from({ length: n }, (_, j) => (j + 0.5) / n); // evenly spread draws
  for (const p of [0, 0.123, 0.5, 0.9, 1]) close(te.onesIn(us, p) / n, p, 1 / n);
  const fixed = [0.03, 0.4, 0.41, 0.77, 0.99];
  let last = -1;
  for (let p = 0; p <= 1; p += 0.01) { const k = te.onesIn(fixed, p); assert.ok(k >= last); last = k; }
  assert.equal(te.onesIn(fixed, 0), 0); assert.equal(te.onesIn(fixed, 1), fixed.length);
});

// ---- Words and numbers

test('number and ket text', () => {
  assert.equal(te.num(-0.001), '0.00'); assert.equal(te.num(-0.5), '−0.50');
  assert.equal(te.amp(q.c(0.5, -0.5)), '(0.50 − 0.50i)'); assert.equal(te.amp(q.c(0, -0.71)), '−0.71i');
  assert.equal(te.ketText(te.evolve('0', 90, 0)), '|ψ(t)⟩ = |0⟩');
  assert.equal(te.ketText(te.evolve('0', 90, 0.5)), '|ψ(t)⟩ = −i|1⟩');
  assert.equal(te.ketText(te.evolve('0', 0, 1)), '|ψ(t)⟩ = −|0⟩');
  assert.equal(te.ketText(te.evolve('0', 90, 0.25)), '|ψ(t)⟩ = 0.71|0⟩ − 0.71i|1⟩');
  assert.equal(te.ketText(te.evolve('+', 0, 0.25)), '|ψ(t)⟩ = (0.50 − 0.50i)|0⟩ + (0.50 + 0.50i)|1⟩');
});

test('H, axis, time and energy text', () => {
  assert.equal(te.hText(0), 'H = ½ħω Z'); assert.equal(te.hText(90), 'H = ½ħω X'); assert.equal(te.hText(180), 'H = −½ħω Z');
  assert.equal(te.hText(45), 'H = ½ħω (0.71 Z + 0.71 X)'); assert.equal(te.hText(120), 'H = ½ħω (−0.50 Z + 0.87 X)');
  assert.equal(te.axisText(37), '37° from Z toward X');
  assert.equal(te.timeText(0.5), '0.50 T'); assert.equal(te.turnedDeg(1.37), 493);
  assert.equal(te.energyText(te.energy('0', 45)), '0.71 × ħω/2'); assert.equal(te.energyText(te.energy('0', 90)), '0');
});

test('readout: point, odds and shot counts match the sim', () => {
  const s = te.describe('0', 45, 0.5, 'Z', { ones: 40, columns: te.columnsUpTo(0.5) });
  assert.ok(s.includes('turned 180° around that axis, to (1.00, 0.00, 0.00)'));
  assert.ok(s.includes('the chance to read 1 is 50% now, and over time it goes between 0% and 50%'));
  assert.ok(s.includes('Of 132 fresh copies (12 at each of 11 times from 0 to 0.50 T), 40 gave 1.'));
  assert.ok(te.describe('0', 90, 1, 'Z').includes('−1 times the start state'));
  assert.ok(te.describe('0', 90, 2, 'Z').includes('exactly the start state again'));
  assert.ok(te.describe('0', 90, 0, 'Z', { ones: 0, columns: 1 }).includes('Of 12 fresh copies (at t = 0), 0 gave 1.'));
});

// ---- Drawing math

test('view is a rotation (lengths and right-handedness kept); sphere points lie on the sphere', () => {
  const e: te.Vec3[] = [[1, 0, 0], [0, 1, 0], [0, 0, 1]], v = e.map(te.view);
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) close(v[i][0] * v[j][0] + v[i][1] * v[j][1] + v[i][2] * v[j][2], i === j ? 1 : 0);
  const [a, b, c] = v; // det = +1: x × y = z on screen too
  close(a[0] * (b[1] * c[2] - b[2] * c[1]) - a[1] * (b[0] * c[2] - b[2] * c[0]) + a[2] * (b[0] * c[1] - b[1] * c[0]), 1);
  for (const p of te.spherePoints(300)) close(Math.hypot(...p), 1);
});
