import test from 'node:test';
import assert from 'node:assert/strict';
import * as q from '../quantum.ts';
import * as m from './mixed-states.ts';

const close = (a: number, x: number, eps = 1e-12) => assert.ok(Math.abs(a - x) < eps, `${a} != ${x}`);
const closeState = (u: q.State, v: q.State) => u.forEach((a, i) => { close(a.re, v[i].re); close(a.im, v[i].im); });
const closeMatrix = (a: q.Matrix, b: q.Matrix) => a.forEach((row, j) => row.forEach((x, k) => { close(x.re, b[j][k].re); close(x.im, b[j][k].im); }));
/** Equal up to a global phase: |<u|v>| = 1 for unit vectors. */
const sameRay = (u: q.State, v: q.State) => close(q.abs(q.inner(u, v)), 1);
const S2 = Math.SQRT1_2;
const P = [0, 0.01, 0.1, 0.2, 0.25, 0.3, 0.5, 0.64, 0.75, 0.9, 0.99, 1];
const INNER = P.filter((p) => p > 0 && p < 1);
const plusI: q.State = [q.c(S2), q.c(0, S2)], minusI: q.State = [q.c(S2), q.c(0, -S2)];
// Measurement axes all over the Bloch sphere, as (theta, phi).
const AXES: [number, number][] = [];
for (const t of [0, 0.3, 1, Math.PI / 2, 2.1, 2.8, Math.PI]) for (const f of [0, 0.5, Math.PI / 2, 2, Math.PI, 4, 5.5]) AXES.push([t, f]);
// One-qubit pure states all over the Bloch sphere, complex ones included.
const ONE = AXES.map(([t, f]) => q.fromBloch(t, f));
const dot3 = (u: m.Vec3, v: m.Vec3) => u[0] * v[0] + u[1] * v[1] + u[2] * v[2];
const axisOf = (t: number, f: number): m.Vec3 => [Math.sin(t) * Math.cos(f), Math.sin(t) * Math.sin(f), Math.cos(t)];
const det = (a: q.Matrix) => q.sub(q.mul(a[0][0], a[1][1]), q.mul(a[0][1], a[1][0]));

// ---- The recipes

test('psi±(p) are unit vectors sqrt(1-p)|0> ± sqrt(p)|1> with real amplitudes', () => {
  for (const p of P) for (const sign of [1, -1] as const) {
    const s = m.psi(p, sign);
    close(q.norm2(s), 1);
    close(s[0].re, Math.sqrt(1 - p)); close(s[1].re, sign * Math.sqrt(p));
    close(s[0].im, 0); close(s[1].im, 0);
  }
  closeState(m.psi(0.5, 1), q.plus()); closeState(m.psi(0.5, -1), q.minus());
  closeState(m.psi(0, 1), q.ket0()); closeState(m.psi(0, -1), q.ket0());
  closeState(m.psi(1, 1), q.ket1()); closeState(m.psi(1, -1), [q.c(0), q.c(-1)]);
  assert.deepEqual(m.psi(-1), m.psi(0)); assert.deepEqual(m.psi(2), m.psi(1));
});

test('every ensemble has plain odds that are non-negative and sum to 1, and unit-vector states', () => {
  for (const r of m.RECIPES) for (const p of P) {
    const e = m.ensemble(r, p);
    close(e.reduce((t, x) => t + x.odds, 0), 1);
    for (const { odds, state } of e) { assert.ok(odds >= 0); close(q.norm2(state), 1); }
  }
});

test('the recipes are made as the texts say, from a start state of 0', () => {
  const z = q.ket0();
  for (const p of P) {
    // Superposition: RY(theta)|0> with sin^2(theta/2) = p. At p = 1/2 a Hadamard gate gives the same state; at p = 1 an X gate.
    const theta = 2 * Math.asin(Math.sqrt(p));
    closeState(q.matVec(q.RY(theta), z), m.psi(p, 1));
    // Coin over the sign: the superposition, then Z on one branch.
    const [a, b] = m.ensemble('sign', p);
    closeState(q.matVec(q.Z, a.state), b.state);
    close(a.odds, 0.5); close(b.odds, 0.5);
    // Coin over 0 and 1: |0>, then X with chance p.
    const [c0, c1] = m.ensemble('coin01', p);
    closeState(c0.state, z); closeState(c1.state, q.matVec(q.X, z));
    close(c0.odds, 1 - p); close(c1.odds, p);
  }
  closeState(q.matVec(q.H, z), m.psi(0.5, 1));
  closeState(q.matVec(q.X, z), m.psi(1, 1));
});

// ---- The tests

test('each test maps its 0 state to |0> and its 1 state to |1>, so result 0 means 0, + or +i', () => {
  const pairs: Record<m.Test, [q.State, q.State]> = { z: [q.ket0(), q.ket1()], x: [q.plus(), q.minus()], y: [plusI, minusI] };
  for (const t of m.TESTS) {
    const [s0, s1] = pairs[t];
    sameRay(m.inTest(s0, t), q.ket0()); sameRay(m.inTest(s1, t), q.ket1());
    assert.deepEqual(m.pureOdds(s0, t), [1, 0]); assert.deepEqual(m.pureOdds(s1, t), [0, 1]);
    q.bloch(s0).forEach((x, i) => close(x, m.AXIS[t][i]));
  }
  assert.deepEqual(m.gatesFor('z'), []);
});

test('Born rule for one pure state: odds sum to 1 and equal (1 + r . axis)/2 in every test', () => {
  for (const s of ONE) for (const t of m.TESTS) {
    const [a, b] = m.pureOdds(s, t);
    close(a + b, 1); assert.ok(a >= 0 && b >= 0);
    close(a, (1 + dot3(q.bloch(s) as m.Vec3, m.AXIS[t])) / 2);
  }
});

test('the gates in a test are unitary, so they keep the norm', () => {
  for (const t of m.TESTS) for (const s of ONE) close(q.norm2(m.inTest(s, t)), 1);
});

test('recipe odds sum to 1 and match the closed forms', () => {
  for (const r of m.RECIPES) for (const p of P) for (const t of m.TESTS) {
    const [a, b] = m.odds(r, p, t);
    close(a + b, 1);
    close(a, m.chance0Formula(r, p, t));
    close(m.chance0(r, p, t), a);
  }
});

test('known values: started as 0, a Hadamard gate, then the +/- test gives + every time; the coins give 50/50', () => {
  assert.equal(m.chance0('super', 0.5, 'x'), 1);
  assert.equal(m.odds('super', 0.5, 'x')[1], 0);
  close(m.chance0('coin01', 0.5, 'x'), 0.5); close(m.chance0('sign', 0.5, 'x'), 0.5);
  for (const r of m.RECIPES) close(m.chance0(r, 0.5, 'z'), 0.5);
  // p = 1/4: + comes up with chance 1/2 + sqrt(3)/4 for 0.87|0> + 0.50|1>.
  close(m.chance0('super', 0.25, 'x'), 0.5 + Math.sqrt(3) / 4);
  close(m.chance0('super', 0.75, 'x'), 0.5 + Math.sqrt(3) / 4);
});

test('the coin over the sign: its two picks give 1/2 ± sqrt(p(1-p)) for +, which average to 1/2', () => {
  for (const p of P) {
    const [a, b] = m.ensemble('sign', p), d = Math.sqrt(p * (1 - p));
    close(m.pureOdds(a.state, 'x')[0], 0.5 + d);
    close(m.pureOdds(b.state, 'x')[0], 0.5 - d);
  }
});

test('real amplitudes only: the +i/-i test gives 1/2 for every recipe and every p', () => {
  for (const r of m.RECIPES) for (const p of P) close(m.chance0(r, p, 'y'), 0.5);
});

// ---- Density matrices

test('rho is Hermitian, has trace 1 and no negative eigenvalue', () => {
  for (const r of m.RECIPES) for (const p of P) {
    const a = m.rho(r, p);
    closeMatrix(a, q.dagger(a));
    close(a[0][0].re + a[1][1].re, 1);
    // A 2x2 Hermitian matrix with trace 1 has eigenvalues >= 0 exactly when its determinant is >= 0.
    assert.ok(det(a).re > -1e-12); close(det(a).im, 0);
  }
});

test('both coins have rho = diag(1 - p, p); the superposition adds the off-diagonal sqrt(p(1-p))', () => {
  for (const p of P) {
    const diag = [[q.c(1 - p), q.c(0)], [q.c(0), q.c(p)]];
    closeMatrix(m.rho('coin01', p), diag);
    closeMatrix(m.rho('sign', p), diag);
    const d = Math.sqrt(p * (1 - p));
    closeMatrix(m.rho('super', p), [[q.c(1 - p), q.c(d)], [q.c(d), q.c(p)]]);
    // Pure has rank 1 (det 0); the coins have det p(1 - p), so they are mixed for 0 < p < 1.
    close(det(m.rho('super', p)).re, 0);
    close(det(m.rho('coin01', p)).re, p * (1 - p));
  }
});

test('at p = 1/2 both coins are I/2 (Aaronson eq. 6.3, 6.4), and so is any fair coin over two orthogonal states', () => {
  const half = [[q.c(0.5), q.c(0)], [q.c(0), q.c(0.5)]];
  closeMatrix(m.rho('coin01', 0.5), half); closeMatrix(m.rho('sign', 0.5), half);
  for (const s of ONE) {
    const t = [q.scale(q.conj(s[1]), -1), q.conj(s[0])]; // orthogonal to s
    close(q.abs(q.inner(s, t)), 0);
    const r: q.Matrix = [[q.c(0), q.c(0)], [q.c(0), q.c(0)]];
    for (const v of [s, t]) for (let j = 0; j < 2; j++) for (let k = 0; k < 2; k++) r[j][k] = q.add(r[j][k], q.scale(q.mul(v[j], q.conj(v[k])), 0.5));
    closeMatrix(r, half);
  }
});

test('recipe odds equal <0|U rho U†|0>: the plain-odds average is the density-matrix rule', () => {
  for (const r of m.RECIPES) for (const p of P) for (const t of m.TESTS) {
    const u = m.gatesFor(t).reduce((acc, g) => q.matMul(g, acc), q.I);
    const out = q.matMul(q.matMul(u, m.rho(r, p)), q.dagger(u));
    close(out[0][0].re, m.chance0(r, p, t)); close(out[0][0].im, 0);
  }
});

test('the average Bloch vector: (2 sqrt(p(1-p)), 0, 1 - 2p) for the superposition, (0, 0, 1 - 2p) for both coins', () => {
  for (const p of P) {
    const s = m.blochOf('super', p), a = m.blochOf('coin01', p), b = m.blochOf('sign', p);
    [2 * Math.sqrt(p * (1 - p)), 0, 1 - 2 * p].forEach((x, i) => close(s[i], x));
    for (const v of [a, b]) [0, 0, 1 - 2 * p].forEach((x, i) => close(v[i], x));
    // rho = (I + xX + yY + zZ)/2
    for (const r of m.RECIPES) {
      const [x, y, z] = m.blochOf(r, p);
      closeMatrix(m.rho(r, p), [[q.c((1 + z) / 2), q.c(x / 2, -y / 2)], [q.c(x / 2, y / 2), q.c((1 - z) / 2)]]);
    }
  }
});

// ---- Every test, not just three

test('along any axis, Pr = (1 + r . n)/2 with r the average Bloch vector', () => {
  for (const r of m.RECIPES) for (const p of P) for (const [t, f] of AXES) {
    close(m.chanceAlong(r, p, t, f), (1 + dot3(m.blochOf(r, p), axisOf(t, f))) / 2);
  }
});

test('the two coins give the same odds along every axis; the superposition differs from them somewhere iff 0 < p < 1', () => {
  for (const p of P) {
    let gap = 0;
    for (const [t, f] of AXES) {
      close(m.chanceAlong('coin01', p, t, f), m.chanceAlong('sign', p, t, f));
      gap = Math.max(gap, Math.abs(m.chanceAlong('super', p, t, f) - m.chanceAlong('coin01', p, t, f)));
    }
    if (p > 0 && p < 1) assert.ok(gap > 1e-3, `p = ${p}`); else close(gap, 0);
  }
});

test('three tests fix every test: the 0/1, +/- and +i/-i odds rebuild r, which predicts every axis', () => {
  for (const r of m.RECIPES) for (const p of P) {
    const v = m.TESTS.map((t) => 2 * m.chance0(r, p, t) - 1); // [z, x, y]
    const rebuilt: m.Vec3 = [v[1], v[2], v[0]];
    for (const [t, f] of AXES) close(m.chanceAlong(r, p, t, f), (1 + dot3(rebuilt, axisOf(t, f))) / 2);
  }
});

test('any two ensembles with the same average Bloch vector agree on every axis (Watrous: |0> or |+>, 1/2 each)', () => {
  // A fair coin over |0> and |+> (not orthogonal), and plain odds over the two orthogonal states along the same axis.
  const mix = (e: { w: number; s: q.State }[], t: number, f: number) => e.reduce((a, { w, s }) => a + w * q.abs2(q.inner(q.fromBloch(t, f), s)), 0);
  const e1 = [{ w: 0.5, s: q.ket0() }, { w: 0.5, s: q.plus() }];
  // Its average Bloch vector is (1/2, 0, 1/2): the same as the pure-state mix below with orthogonal eigenstates.
  const len = Math.SQRT1_2, th = Math.PI / 4;
  const lam = (1 + len) / 2;
  const e2 = [{ w: lam, s: q.fromBloch(th, 0) }, { w: 1 - lam, s: q.fromBloch(Math.PI - th, Math.PI) }];
  for (const [t, f] of AXES) close(mix(e1, t, f), mix(e2, t, f));
  // Watrous's density matrix for e1: [[3/4, 1/4], [1/4, 1/4]]; its 0/1 test gives 3/4.
  close(mix(e1, 0, 0), 0.75);
});

// ---- Verdicts from the sim

test('tellApart: only the +/- test tells the superposition from either coin, for 0 < p < 1', () => {
  for (const p of INNER) {
    assert.deepEqual(m.tellApart('super', 'coin01', p), ['x']);
    assert.deepEqual(m.tellApart('super', 'sign', p), ['x']);
    assert.deepEqual(m.tellApart('coin01', 'sign', p), []);
    assert.ok(m.alike('coin01', 'sign', p)); assert.ok(!m.alike('super', 'coin01', p));
  }
  for (const p of [0, 1]) for (const a of m.RECIPES) for (const b of m.RECIPES) assert.ok(m.alike(a, b, p));
});

test('alike(a, b) agrees with equal density matrices', () => {
  for (const p of P) for (const a of m.RECIPES) for (const b of m.RECIPES) {
    const ra = m.rho(a, p), rb = m.rho(b, p);
    const same = ra.every((row, j) => row.every((x, k) => Math.abs(x.re - rb[j][k].re) + Math.abs(x.im - rb[j][k].im) < 1e-12));
    assert.equal(m.alike(a, b, p), same, `${a} ${b} p=${p}`);
  }
});

test('either qubit of a Bell pair, tested on its own, gives 1/2 in every test, the same as the fair coin over 0 and 1', () => {
  const bell = q.cnot(q.apply1(q.basis(2, 0), q.H, 0, 2), 0, 1, 2);
  for (const k of [0, 1]) {
    for (const t of m.TESTS) {
      const s = m.gatesFor(t).reduce((v, g) => q.apply1(v, g, k, 2), bell);
      close(1 - q.probOne(s, k, 2), m.chance0('coin01', 0.5, t));
    }
    // Any axis: turn the axis to Z with U = RY(-theta) RZ(-phi), then measure.
    for (const [t, f] of AXES) {
      const s = q.apply1(q.apply1(bell, q.RZ(-f), k, 2), q.RY(-t), k, 2);
      close(1 - q.probOne(s, k, 2), 0.5);
    }
  }
});

// ---- Shots

test('shoot: the coin picks a state by plain odds first, then a Born rule draw gives the result', () => {
  const seq = (...xs: number[]) => { let i = 0; return () => xs[i++]; };
  // Coin over 0 and 1 at p = 0.3: first draw 0.69 picks |0>, 0.71 picks |1>. The 0/1 test then is certain.
  assert.equal(m.shoot('coin01', 0.3, 'z', seq(0.69, 0.999)), 0);
  assert.equal(m.shoot('coin01', 0.3, 'z', seq(0.71, 0)), 1);
  // Coin over the sign at p = 1/2: 0.2 picks |+>, 0.7 picks |->. The +/- test then is certain.
  assert.equal(m.shoot('sign', 0.5, 'x', seq(0.2, 0.999)), 0);
  assert.equal(m.shoot('sign', 0.5, 'x', seq(0.7, 0)), 1);
  // The superposition uses no coin: one draw only.
  let calls = 0;
  assert.equal(m.shoot('super', 0.5, 'x', () => { calls++; return 0.999; }), 0);
  assert.equal(calls, 1);
  // Certain results never depend on the draw.
  for (const x of [0, 0.5, 0.999999]) { assert.equal(m.shoot('super', 0, 'z', () => x), 0); assert.equal(m.shoot('coin01', 1, 'z', () => x), 1); }
});

test('shoot follows the Born rule odds (seeded, 4000 shots per box, within 4.5 standard deviations)', () => {
  const rand = q.rng(7), N = 4000;
  for (const p of [0.25, 0.5]) for (const r of m.RECIPES) for (const t of m.TESTS) {
    let zeros = 0;
    for (let i = 0; i < N; i++) if (m.shoot(r, p, t, rand) === 0) zeros++;
    const e = m.chance0(r, p, t), sd = Math.sqrt(N * e * (1 - e));
    assert.ok(Math.abs(zeros - N * e) <= Math.max(4.5 * sd, 0), `${r} ${t} p=${p}: ${zeros} vs ${N * e}`);
  }
});

test('tally counts zeros in each box; empty() has no shots', () => {
  const t = m.tally({ super: { z: [0, 1, 0], x: [0, 0, 0], y: [1, 1, 0] }, coin01: { z: [1, 1, 1], x: [0, 1, 0], y: [0, 0, 1] }, sign: { z: [0, 0, 0], x: [1, 0, 1], y: [1, 1, 1] } });
  assert.equal(t.shots, 3);
  assert.deepEqual(t.zeros, { super: { z: 2, x: 3, y: 1 }, coin01: { z: 0, x: 2, y: 2 }, sign: { z: 3, x: 1, y: 0 } });
  const e = m.empty();
  assert.equal(e.shots, 0);
  for (const r of m.RECIPES) for (const k of m.TESTS) assert.equal(e.zeros[r][k], 0);
});

// ---- Words and numbers

test('fromPercent and percent: whole percents; a real chance never shows as 0% or 100%', () => {
  assert.equal(m.fromPercent(50), 0.5); assert.equal(m.fromPercent(-3), 0); assert.equal(m.fromPercent(140), 1); assert.equal(m.fromPercent(24.6), 0.25);
  assert.equal(m.percent(0), '0%'); assert.equal(m.percent(1), '100%'); assert.equal(m.percent(0.5), '50%');
  assert.equal(m.percent(0.004), 'under 1%'); assert.equal(m.percent(0.996), 'over 99%');
  assert.equal(m.percent(0.625 - 1e-15), '63%'); assert.equal(m.percent(0.5 + Math.sqrt(3) / 4), '93%');
  // The superposition's + chance is never shown as 100% unless it is 1.
  for (let n = 1; n < 100; n++) if (n !== 50) assert.notEqual(m.percent(m.chance0('super', n / 100, 'x')), '100%', `p = ${n}%`);
});

test('kets: |+>, |->, |0>, |1>, -|1>, and rounded amplitudes otherwise', () => {
  assert.equal(m.psiKet(0.5), '|+⟩'); assert.equal(m.psiKet(0.5, -1), '|−⟩');
  assert.equal(m.psiKet(0), '|0⟩'); assert.equal(m.psiKet(1), '|1⟩'); assert.equal(m.psiKet(1, -1), '−|1⟩');
  assert.equal(m.psiKet(0.25), '0.87|0⟩ + 0.50|1⟩'); assert.equal(m.psiKet(0.25, -1), '0.87|0⟩ − 0.50|1⟩');
  assert.equal(m.amp(1), '1'); assert.equal(m.amp(0), '0'); assert.equal(m.amp(S2), '0.71');
});

test('every recipe text names the start state, and the readout names the gate or the coin for each recipe', () => {
  for (const p of P) {
    for (const r of m.RECIPES) assert.match(m.recipeText(r, p), /^Started as 0/);
    const t = m.readout(p, m.empty());
    assert.match(t, /Superposition \(started as 0/);
    assert.match(t, /Coin over 0 and 1 \(/); assert.match(t, /Coin over the sign \(/);
  }
  assert.match(m.recipeText('super', 0.5), /Hadamard gate: \|\+⟩/);
  assert.match(m.recipeText('super', 0.3), /RY gate/);
  assert.match(m.recipeText('sign', 0.5), /Hadamard gate, then a fair coin decides on a Z gate.*\|\+⟩ or \|−⟩/);
  assert.match(m.recipeText('sign', 1), /global phase/);
});

test('verdicts follow the odds', () => {
  const v = m.verdict(0.5);
  assert.match(v, /The \+\/− test \(a Hadamard gate, then a measurement\) tells \|\+⟩ from both coins: \+ comes up with chance 100% against 50%\./);
  assert.match(v, /The 0\/1 and \+i\/−i tests cannot\./);
  assert.match(v, /no measurement on the qubits tells the two coins apart, when each qubit has its own coin flip/);
  assert.match(m.verdict(0.25), /chance 93% against 50%/);
  assert.equal(m.verdict(0), 'At p = 0% all three recipes make |0⟩, so no test tells them apart.');
  assert.equal(m.verdict(1), 'At p = 100% all three recipes make |1⟩, so no test tells them apart.');
});

test('readout: counts against the Born rule, chance gaps, full boxes', () => {
  const x = m.tally({ super: { z: [0, 1], x: [0, 0], y: [1, 0] }, coin01: { z: [0, 0], x: [1, 1], y: [0, 1] }, sign: { z: [1, 1], x: [0, 1], y: [0, 0] } });
  const t = m.readout(0.5, x);
  assert.match(t, /^p = 50%, 2 shots in each box\./);
  assert.match(t, /Superposition \(started as 0, then a Hadamard gate: \|\+⟩\) gave 0 in 1, \+ in 2, \+i in 1; chance 50%, 100%, 50%\./);
  assert.match(t, /Coin over 0 and 1 \(a fair coin picks \|0⟩ or \|1⟩\) gave 0 in 2, \+ in 0, \+i in 1; chance 50% each\./);
  assert.match(t, /gaps between the two coins' counts are chance/);
  assert.match(m.readout(0.5, m.empty()), /Press Run to measure\.$/);
  const full = { ...m.empty(), shots: m.CAP };
  assert.match(m.readout(0.5, full), /The boxes are full\. Press Clear to start again\.$/);
});

test('words: no em dashes, no "both at once", no watching or looking, no squared amplitudes', () => {
  const texts: string[] = [m.valueText(0.5), ...Object.values(m.TEST_HOW)];
  for (const p of P) {
    texts.push(m.verdict(p), m.readout(p, m.empty()));
    for (const r of m.RECIPES) texts.push(m.recipeText(r, p), m.recipeShort(r, p));
  }
  for (const s of texts) {
    assert.ok(!s.includes('—'), s);
    assert.ok(!/both at once|watch|look|square the amplitude/i.test(s), s);
  }
});

test('a record of the coin, checked against the results, tells the coin recipes apart', () => {
  // The coin's pick is the first random draw; the test result comes from the second.
  const r = q.rng(11), n = 4000;
  const withPick = (pick: number) => { let used = false; return () => (used ? r() : ((used = true), pick)); };
  let match01 = 0, matchSign = 0;
  for (let k = 0; k < n; k++) {
    const a = r(), b = r();
    if (m.shoot('coin01', 0.5, 'z', withPick(a)) === (a < 0.5 ? 0 : 1)) match01++;
    if (m.shoot('sign', 0.5, 'z', withPick(b)) === (b < 0.5 ? 0 : 1)) matchSign++;
  }
  assert.equal(match01, n); // the 0/1 coin's pick always shows in the 0/1 test
  assert.ok(Math.abs(matchSign / n - 0.5) < 0.04, `sign coin matched ${matchSign / n}`); // the sign coin's pick does not
});

test('half a Bell pair is I/2, as is a fair 0/1 coin: the same rho from a coin (proper mixture) and from a pure pair (improper), no coin needed', () => {
  const coin: q.Matrix = [[q.c(0.5), q.c(0)], [q.c(0), q.c(0.5)]];
  const bell: q.State = [q.c(S2), q.c(0), q.c(0), q.c(S2)];
  const rho = [[q.c(0), q.c(0)], [q.c(0), q.c(0)]].map((row, a) => row.map((_, a2) => [0, 1].reduce((t, b) => q.add(t, q.mul(bell[2 * a + b], q.conj(bell[2 * a2 + b]))), q.c(0))));
  closeMatrix(rho, coin);
  // The pair itself is pure: purity 1, against 1/2 for the half.
  close(q.abs2(q.inner(bell, bell)), 1);
  close(rho.reduce((t, row) => t + row.reduce((u, x) => u + q.abs2(x), 0), 0), 0.5);
});
