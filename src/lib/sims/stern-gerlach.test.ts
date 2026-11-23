import test from 'node:test';
import assert from 'node:assert/strict';
import * as q from '../quantum.ts';
import * as sg from './stern-gerlach.ts';

const close = (a: number, b: number, eps = 1e-12) => assert.ok(Math.abs(a - b) < eps, `${a} != ${b}`);
const closeAll = (a: number[], b: number[], eps = 1e-12) => { assert.equal(a.length, b.length); a.forEach((x, i) => close(x, b[i], eps)); };
const sum = (xs: number[]) => xs.reduce((t, x) => t + x, 0);
const degs = [0, 15, 30, 45, 60, 75, 90, 105, 120, 135, 150, 165, 180];
const tilts = [...degs.map(sg.rad), 0.37, 2.9, -1.2, 4.4];
const S2 = Math.SQRT1_2;
// A spin that is not in the x-z plane, to test the Born rule beyond the tool's states.
const yUp: q.State = [q.c(S2), q.c(0, S2)];

/** n.sigma for an axis n, built from the Pauli matrices in quantum.ts. */
const nSigma = (n: sg.Vec3): q.Matrix =>
  [0, 1].map((i) => [0, 1].map((j) => q.add(q.add(q.scale(q.X[i][j], n[0]), q.scale(q.Y[i][j], n[1])), q.scale(q.Z[i][j], n[2]))));
/** Sampling check: count/shots within 5 standard errors of p. */
const near = (count: number, shots: number, p: number) => {
  const tol = 5 * Math.sqrt(Math.max(p * (1 - p), 1e-9) / shots) + 1e-9;
  assert.ok(Math.abs(count / shots - p) <= tol, `${count}/${shots} = ${count / shots}, expected ${p} +- ${tol}`);
};

test('axis: 0 is Z, 90 degrees is X, 180 is -Z; always a unit vector across the beam (y = 0)', () => {
  closeAll(sg.axis(0), [0, 0, 1]);
  closeAll(sg.axis(sg.rad(90)), [1, 0, 0]);
  closeAll(sg.axis(sg.rad(180)), [0, 0, -1]);
  for (const t of tilts) { const n = sg.axis(t); close(sg.dot3(n, n), 1); close(n[1], 0); }
});

test('up and down along Z are |0> and |1>; along X they are |+> and -|->', () => {
  closeAll(sg.upAlong(0).map((a) => a.re), [1, 0]);
  closeAll(sg.downAlong(0).map((a) => a.re), [0, 1]);
  closeAll(sg.upAlong(sg.rad(90)).map((a) => a.re), q.plus().map((a) => a.re));
  closeAll(sg.downAlong(sg.rad(90)).map((a) => a.re), q.minus().map((a) => -a.re));
});

test('up and down are the closed forms cos(t/2)|0> + sin(t/2)|1> and -sin(t/2)|0> + cos(t/2)|1>', () => {
  for (const t of tilts) {
    closeAll(sg.upAlong(t).flatMap((a) => [a.re, a.im]), [Math.cos(t / 2), 0, Math.sin(t / 2), 0]);
    closeAll(sg.downAlong(t).flatMap((a) => [a.re, a.im]), [-Math.sin(t / 2), 0, Math.cos(t / 2), 0]);
  }
});

test('up and down are an orthonormal pair, eigenstates of n.sigma with eigenvalues +1 and -1', () => {
  for (const t of tilts) {
    const u = sg.upAlong(t), d = sg.downAlong(t), m = nSigma(sg.axis(t));
    close(q.norm2(u), 1); close(q.norm2(d), 1); close(q.abs(q.inner(u, d)), 0);
    q.matVec(m, u).forEach((a, i) => { close(a.re, u[i].re); close(a.im, u[i].im); });
    q.matVec(m, d).forEach((a, i) => { close(a.re, -d[i].re); close(a.im, -d[i].im); });
  }
});

test('Bloch vector of up along a turned magnet is its axis, and of down is minus its axis', () => {
  for (const t of tilts) {
    closeAll(q.bloch(sg.upAlong(t)), sg.axis(t));
    closeAll(q.bloch(sg.downAlong(t)), sg.axis(t).map((x) => -x));
  }
});

test('Born rule: up and down odds sum to 1 at every magnet, for any spin', () => {
  const states = [q.ket0(), q.ket1(), q.plus(), q.minus(), yUp, ...tilts.map(sg.upAlong), ...tilts.map(sg.downAlong)];
  for (const s of states) for (const t of tilts) {
    const p = sg.pUp(s, t);
    assert.ok(p >= -1e-12 && p <= 1 + 1e-12);
    close(p + q.abs2(q.inner(sg.downAlong(t), s)), 1);
  }
});

test('turned magnet: from spin up along Z, chance of up is cos^2(theta/2)', () => {
  for (const t of tilts) close(sg.pUp(q.ket0(), t), Math.cos(t / 2) ** 2);
  // Known values: 100% at 0, 75% at 60, 50% at 90, 25% at 120, 0% at 180.
  closeAll([0, 60, 90, 120, 180].map((d) => sg.pUp(q.ket0(), sg.rad(d))), [1, 0.75, 0.5, 0.25, 0]);
});

test('general rule: up along m goes up along n with chance (1 + m.n)/2, for any two magnets', () => {
  for (const a of tilts) for (const b of tilts) {
    close(sg.pUp(sg.upAlong(a), b), sg.pUpFromUp(sg.axis(a), sg.axis(b)));
    close(sg.pUp(sg.upAlong(a), b), Math.cos((b - a) / 2) ** 2);
    close(sg.pUp(sg.downAlong(a), b), Math.sin((b - a) / 2) ** 2);
  }
  // Symmetry: the chance only depends on the angle between the magnets.
  for (const a of tilts) for (const b of tilts) close(sg.pUp(sg.upAlong(a), b), sg.pUp(sg.upAlong(b), a));
  // A spin up along y has no preferred side for any magnet across the beam in the x-z plane.
  for (const t of tilts) close(sg.pUp(yUp, t), 0.5);
});

test('global phase cannot be seen: multiplying a spin by e^{i phi} changes no odds', () => {
  for (const t of tilts) for (const phi of [0.3, 1.9, Math.PI]) {
    const s = sg.upAlong(0.8).map((a) => q.mul(a, q.expi(phi)));
    close(sg.pUp(s, t), sg.pUp(sg.upAlong(0.8), t));
  }
});

test('Z and X share no eigenstate: [sigma_z, sigma_x] = 2i sigma_y', () => {
  const zx = q.matMul(q.Z, q.X), xz = q.matMul(q.X, q.Z);
  for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) {
    const comm = q.sub(zx[i][j], xz[i][j]), want = q.mul(q.c(0, 2), q.Y[i][j]);
    close(comm.re, want.re); close(comm.im, want.im);
  }
  // An X eigenstate is a 50/50 split at Z, and a Z eigenstate a 50/50 split at X.
  for (const s of [sg.upAlong(sg.rad(90)), sg.downAlong(sg.rad(90))]) close(sg.pUp(s, 0), 0.5);
  for (const s of [q.ket0(), q.ket1()]) close(sg.pUp(s, sg.rad(90)), 0.5);
});

test('unpolarized oven atoms (I/2) split 1/2 to 1/2 along any axis', () => {
  // tr(P_up I/2) = (P(up | 0) + P(up | 1)) / 2.
  for (const t of tilts) close((sg.pUp(q.ket0(), t) + sg.pUp(q.ket1(), t)) / 2, 0.5);
  for (const t of tilts) { const p = sg.predict([{ tilt: t, keep: 'both' }]); close(p.up, 0.5); close(p.down, 0.5); }
});

test('measure: after a magnet the atom is in the state of its result, so the same magnet repeats it', () => {
  const rand = q.rng(7);
  for (const t of tilts) for (const s of [null, q.ket0(), q.plus(), yUp]) {
    const m = sg.measure(s, t, rand);
    close(sg.pUp(m.state, t), m.port === 'up' ? 1 : 0);
    close(q.norm2(m.state), 1);
    for (let k = 0; k < 5; k++) assert.equal(sg.measure(m.state, t, rand).port, m.port);
  }
});

test('measure: draws follow the Born rule', () => {
  const rand = q.rng(11), N = 20000;
  for (const [s, t] of [[null, 0.4], [q.ket0(), sg.rad(60)], [q.ket0(), sg.rad(90)], [yUp, 1.3], [sg.upAlong(2), 0.5]] as [q.State | null, number][]) {
    let ups = 0;
    for (let k = 0; k < N; k++) if (sg.measure(s, t, rand).port === 'up') ups++;
    near(ups, N, s ? sg.pUp(s, t) : 0.5);
  }
});

test('chain: the setups the tool offers', () => {
  const t = sg.rad(60);
  assert.deepEqual(sg.chain('classical', t, 'up'), [{ tilt: 0, keep: 'both' }]);
  assert.deepEqual(sg.chain('one', t, 'up'), [{ tilt: 0, keep: 'both' }]);
  assert.deepEqual(sg.chain('two', t, 'down'), [{ tilt: 0, keep: 'up' }, { tilt: t, keep: 'both' }]);
  assert.deepEqual(sg.chain('three', t, 'down'), [{ tilt: 0, keep: 'up' }, { tilt: t, keep: 'down' }, { tilt: 0, keep: 'both' }]);
});

test('predict: every atom ends somewhere (chances sum to 1) for every setup the tool offers', () => {
  for (const setup of ['one', 'two', 'three'] as sg.Setup[]) for (const d of degs) for (const keep of ['up', 'down'] as sg.Port[]) {
    const p = sg.predict(sg.chain(setup, sg.rad(d), keep));
    close(sum(p.blocked) + p.up + p.down, 1);
    for (const x of [...p.blocked, p.up, p.down]) assert.ok(x >= -1e-15);
  }
});

test('one magnet: two spots, half up and half down', () => {
  const p = sg.predict(sg.chain('one', 0, 'up'));
  closeAll(p.blocked, [0]); close(p.up, 0.5); close(p.down, 0.5); close(sg.screenUp(p)!, 0.5);
});

test('Z then Z: the answer repeats, every atom up again', () => {
  const p = sg.predict(sg.chain('two', 0, 'up'));
  closeAll(p.blocked, [0.5, 0]); close(p.up, 0.5); close(p.down, 0); close(sg.screenUp(p)!, 1);
});

test('Z then a magnet turned theta: up with chance cos^2(theta/2) among atoms that pass magnet 1', () => {
  for (const d of degs) {
    const t = sg.rad(d), p = sg.predict(sg.chain('two', t, 'up'));
    close(p.blocked[0], 0.5); close(p.up, Math.cos(t / 2) ** 2 / 2); close(p.down, Math.sin(t / 2) ** 2 / 2);
    close(sg.screenUp(p)!, Math.cos(t / 2) ** 2);
  }
  close(sg.screenUp(sg.predict(sg.chain('two', sg.rad(90), 'up')))!, 0.5);
  // Sure and impossible results come out exact, so readouts say 100% and 0%, not 99.99...%.
  assert.equal(sg.screenUp(sg.predict(sg.chain('two', 0, 'up'))), 1);
  assert.equal(sg.screenUp(sg.predict(sg.chain('two', Math.PI, 'up'))), 0);
  assert.equal(sg.predict(sg.chain('three', Math.PI, 'up')).up, 0);
});

test('Z, X (keep one beam), Z: half come out down, though magnet 1 threw all down atoms away', () => {
  for (const keep of ['up', 'down'] as sg.Port[]) {
    const p = sg.predict(sg.chain('three', sg.rad(90), keep));
    closeAll(p.blocked, [0.5, 0.25, 0]); close(p.up, 0.125); close(p.down, 0.125); close(sg.screenUp(p)!, 0.5);
  }
});

test('Z, theta (keep up or down), Z: closed forms, and only the last result matters', () => {
  for (const d of degs) {
    const t = sg.rad(d), c2 = Math.cos(t / 2) ** 2, s2 = Math.sin(t / 2) ** 2;
    const u = sg.predict(sg.chain('three', t, 'up'));
    closeAll(u.blocked, [0.5, s2 / 2, 0]); close(u.up, (c2 * c2) / 2); close(u.down, (c2 * s2) / 2);
    const w = sg.predict(sg.chain('three', t, 'down'));
    closeAll(w.blocked, [0.5, c2 / 2, 0]); close(w.up, (s2 * s2) / 2); close(w.down, (s2 * c2) / 2);
    // Magnet 3 sees a fresh up_theta or down_theta: its odds do not depend on magnet 1.
    if (c2 > 1e-12) close(sg.screenUp(u)!, sg.pUp(sg.upAlong(t), 0));
    if (s2 > 1e-12) close(sg.screenUp(w)!, sg.pUp(sg.downAlong(t), 0));
  }
  // Z, Z, Z keeps the answer; Z, upside-down Z keeping its up beam lets nothing through.
  close(sg.screenUp(sg.predict(sg.chain('three', 0, 'up')))!, 1);
  const none = sg.predict(sg.chain('three', Math.PI, 'up'));
  close(none.up + none.down, 0); assert.equal(sg.screenUp(none), null);
});

test('fire: sampled atoms match predict for every setup', () => {
  const rand = q.rng(2026), N = 40000;
  const cases: [sg.Setup, number, sg.Port][] = [['one', 0, 'up'], ['two', 0, 'up'], ['two', 60, 'up'], ['two', 90, 'up'], ['two', 180, 'up'],
    ['three', 90, 'down'], ['three', 90, 'up'], ['three', 45, 'up'], ['three', 135, 'down'], ['three', 180, 'up']];
  for (const [setup, d, keep] of cases) {
    const stages = sg.chain(setup, sg.rad(d), keep), p = sg.predict(stages);
    const blocked = stages.map(() => 0); let up = 0, down = 0;
    for (let k = 0; k < N; k++) {
      const f = sg.fire(stages, rand);
      if (f.blockedAt >= 0) { blocked[f.blockedAt]++; assert.equal(f.ports.length, f.blockedAt + 1); continue; }
      assert.equal(f.ports.length, stages.length);
      if (f.ports.at(-1) === 'up') up++; else down++;
    }
    blocked.forEach((b, k) => near(b, N, p.blocked[k]));
    near(up, N, p.up); near(down, N, p.down);
  }
});

test('fire: a kept beam is never the blocked one, and atoms past magnet 1 were all up there', () => {
  const rand = q.rng(5), stages = sg.chain('three', sg.rad(90), 'down');
  for (let k = 0; k < 5000; k++) {
    const f = sg.fire(stages, rand);
    if (f.blockedAt === 0) assert.equal(f.ports[0], 'down');
    if (f.blockedAt === 1) assert.equal(f.ports[1], 'up');
    if (f.blockedAt === -1) { assert.equal(f.ports[0], 'up'); assert.equal(f.ports[1], 'down'); }
  }
});

test('classical guess: random directions are even over the sphere', () => {
  const rand = q.rng(3), N = 60000;
  const m = [0, 0, 0], m2 = [0, 0, 0];
  for (let k = 0; k < N; k++) {
    const v = sg.randomDirection(rand);
    close(sg.dot3(v, v), 1, 1e-12);
    v.forEach((x, i) => { m[i] += x / N; m2[i] += (x * x) / N; });
  }
  m.forEach((x) => assert.ok(Math.abs(x) < 0.02));
  m2.forEach((x) => assert.ok(Math.abs(x - 1 / 3) < 0.01));
});

test('classical guess: landing spots spread evenly over [-1, 1] along any magnet axis, a smear not two spots', () => {
  const rand = q.rng(9), N = 50000, B = 10;
  for (const t of [0, sg.rad(60), sg.rad(90), 2.2]) {
    const bins = Array(B).fill(0); let ends = 0;
    for (let k = 0; k < N; k++) {
      const o = sg.classicalOffset(sg.randomDirection(rand), t);
      assert.ok(o >= -1 - 1e-12 && o <= 1 + 1e-12);
      bins[Math.min(B - 1, Math.floor(((o + 1) / 2) * B))]++;
      if (Math.abs(o) > 0.95) ends++;
    }
    bins.forEach((b) => near(b, N, 1 / B));
    near(ends, N, 0.05); // only 5% land near the two quantum spots
  }
});

test('screen: up lands at the tip of the magnet axis, down opposite; atoms land where their spin points', () => {
  closeAll(sg.onScreen(1, 0), [0, 1]);
  closeAll(sg.onScreen(-1, 0), [0, -1]);
  closeAll(sg.onScreen(1, sg.rad(90)), [1, 0]);
  closeAll(sg.onScreen(sg.portOffset('down'), sg.rad(180)), [0, 1]);
  // Spin up along Z, upside-down magnet: every atom is "down" for that magnet, and lands at the top, as before.
  close(sg.pUp(q.ket0(), Math.PI), 0);
  for (const t of tilts) { const [x, z] = sg.onScreen(1, t); close(x * x + z * z, 1); }
});

test('labels name the turn of magnet 2', () => {
  assert.equal(sg.shortName(0), 'Z'); assert.equal(sg.shortName(90), 'X'); assert.equal(sg.shortName(45), '45°');
  assert.equal(sg.turnName(0), 'upright, Z'); assert.equal(sg.turnName(90), 'on its side, X');
  assert.equal(sg.turnName(180), 'upside down'); assert.equal(sg.turnName(30), 'turned 30°');
});
