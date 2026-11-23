import test from 'node:test';
import assert from 'node:assert/strict';
import * as q from '../quantum.ts';
import * as b from './bloch.ts';

const close = (a: number, x: number, eps = 1e-12) => assert.ok(Math.abs(a - x) < eps, `${a} != ${x}`);
const closeVec = (a: number[], x: number[], eps = 1e-12) => a.forEach((v, i) => close(v, x[i], eps));
const closeState = (a: q.State, x: q.State, eps = 1e-12) => a.forEach((v, i) => { close(v.re, x[i].re, eps); close(v.im, x[i].im, eps); });
/** |<a|b>|^2: 1 when two unit vectors are the same state up to a global phase. */
const overlap = (a: q.State, x: q.State) => q.abs2(q.inner(a, x));
const dot = (u: number[], v: number[]) => u.reduce((t, x, i) => t + x * v[i], 0);
const len = (u: number[]) => Math.sqrt(dot(u, u));
const S2 = Math.SQRT1_2;

// A grid of whole-degree angles, the values the sliders can take.
const grid: [number, number][] = [];
for (let t = 0; t <= 180; t += 5) for (let p = 0; p < 360; p += 5) grid.push([t, p]);
// Random states with random global phases, from a seeded generator.
const rand = q.rng(7);
const randomState = (): q.State => q.normalize([q.c(rand() - 0.5, rand() - 0.5), q.c(rand() - 0.5, rand() - 0.5)]);
const randoms = Array.from({ length: 300 }, randomState);

// ---- The state

test('every (theta, phi) gives a unit vector cos(θ/2)|0⟩ + e^{iφ} sin(θ/2)|1⟩, with a real, non-negative amplitude of 0', () => {
  for (const [t, p] of grid) {
    const s = b.stateAt(t, p), r = Math.PI / 180;
    close(q.norm2(s), 1);
    assert.equal(s[0].im, 0); assert.ok(s[0].re >= 0);
    close(s[0].re, Math.cos((t * r) / 2));
    close(s[1].re, Math.sin((t * r) / 2) * Math.cos(p * r)); close(s[1].im, Math.sin((t * r) / 2) * Math.sin(p * r));
  }
});

test('the six named states are exactly |0⟩, |1⟩, |+⟩, |−⟩, |+i⟩ = (|0⟩ + i|1⟩)/√2 and |−i⟩ = (|0⟩ − i|1⟩)/√2', () => {
  const want: Record<string, q.State> = {
    '|0⟩': q.ket0(), '|1⟩': q.ket1(), '|+⟩': q.plus(), '|−⟩': q.minus(),
    '|+i⟩': [q.c(S2), q.c(0, S2)], '|−i⟩': [q.c(S2), q.c(0, -S2)],
  };
  for (const n of b.NAMED) closeState(b.stateAt(n.theta, n.phi), want[n.name]);
  assert.deepEqual(b.stateAt(0, 0), q.ket0());
  assert.deepEqual(b.stateAt(180, 0), q.ket1());
});

test('started as 0, then a Hadamard gate: the qubit is |+⟩, at θ = 90°, φ = 0, on the equator at +x, with 50/50 odds', () => {
  const s = q.matVec(q.H, q.ket0());
  closeState(s, b.stateAt(90, 0));
  closeVec(q.bloch(s), [1, 0, 0]);
  closeVec(q.probs(s), [0.5, 0.5]);
});

// ---- The point

test('the point from the amplitudes, (2 Re a*b, 2 Im a*b, |a|² − |b|²), is the point from the angles, and has length 1', () => {
  for (const [t, p] of grid) {
    closeVec(b.pointOf(t, p), b.point(t, p));
    close(len(b.pointOf(t, p)), 1);
  }
});

test('the six named states sit where the axes meet the sphere: ±z, ±x, ±y', () => {
  const want: Record<string, number[]> = { '|0⟩': [0, 0, 1], '|1⟩': [0, 0, -1], '|+⟩': [1, 0, 0], '|−⟩': [-1, 0, 0], '|+i⟩': [0, 1, 0], '|−i⟩': [0, -1, 0] };
  for (const n of b.NAMED) {
    closeVec(b.pointOf(n.theta, n.phi), want[n.name]);
    assert.deepEqual(b.point(n.theta, n.phi), want[n.name].map((x) => x + 0));
  }
});

test('the coordinates are the expectation values ⟨X⟩, ⟨Y⟩, ⟨Z⟩', () => {
  const ev = (m: q.Matrix, s: q.State) => q.inner(s, q.matVec(m, s));
  for (const [t, p] of grid) {
    const s = b.stateAt(t, p), v = b.pointOf(t, p);
    [q.X, q.Y, q.Z].forEach((m, k) => { const e = ev(m, s); close(e.re, v[k]); close(e.im, 0); });
  }
});

test('a global phase moves nothing: same point, same angles, same odds', () => {
  for (const s of randoms) {
    const g = q.expi(rand() * 2 * Math.PI), t = s.map((a) => q.mul(g, a));
    closeVec(q.bloch(t), q.bloch(s));
    closeVec(q.probs(t), q.probs(s));
    const A = b.angles(s), B = b.angles(t);
    close(A.theta, B.theta, 1e-9);
    close(Math.cos(((A.phi - B.phi) * Math.PI) / 180), 1, 1e-9);
  }
});

test('any pure state is one point: angles() then stateAt gives the same state up to a global phase', () => {
  for (const s of randoms) {
    const { theta, phi } = b.angles(s);
    assert.ok(theta >= 0 && theta <= 180 && phi >= 0 && phi < 360);
    const back = q.fromBloch((theta * Math.PI) / 180, (phi * Math.PI) / 180);
    close(overlap(back, s), 1, 1e-12);
    closeVec(q.bloch(back), q.bloch(s));
  }
});

test('angles() reads back the slider angles, except phi at the poles, which is 0 there', () => {
  for (const [t, p] of grid) {
    const a = b.angles(b.stateAt(t, p));
    close(a.theta, t, 1e-9);
    if (t === 0 || t === 180) assert.equal(a.phi, 0);
    else close(Math.cos(((a.phi - p) * Math.PI) / 180), 1, 1e-12);
  }
});

test('at the poles phi changes nothing: at the top the state is exactly |0⟩, at the bottom e^{iφ}|1⟩, the same up to a global phase', () => {
  for (let p = 0; p < 360; p += 5) {
    assert.deepEqual(b.stateAt(0, p), q.ket0());
    close(overlap(b.stateAt(180, p), q.ket1()), 1);
    assert.deepEqual(b.pointOf(0, p), [0, 0, 1]);
    closeVec(b.pointOf(180, p), [0, 0, -1]);
  }
});

// ---- Odds and geometry

test('Born rule: P(0) + P(1) = 1, and P(0) = cos²(θ/2) = (1 + z)/2', () => {
  for (const [t, p] of grid) {
    const [p0, p1] = b.odds(t, p);
    close(p0 + p1, 1);
    close(p0, Math.cos((t * Math.PI) / 360) ** 2);
    close(p0, (1 + b.pointOf(t, p)[2]) / 2);
  }
});

test('phi never changes the odds of 0 and 1; only theta does, falling from 1 at the top to 0 at the bottom', () => {
  for (let t = 0; t <= 180; t++) for (let p = 0; p < 360; p += 15) close(b.odds(t, p)[0], b.odds(t, 0)[0]);
  for (let t = 1; t <= 180; t++) assert.ok(b.odds(t, 0)[0] < b.odds(t - 1, 0)[0]);
  assert.deepEqual(b.odds(0, 0), [1, 0]);
  assert.deepEqual(b.odds(180, 0), [0, 1]);
  close(b.odds(90, 123)[0], 0.5);
});

test('phi changes X-basis odds: H then measure gives (1 + x)/2 for 0; on the equator φ = 0 gives 1, 0 and φ = 180° gives 0, 1', () => {
  const xOdds = (t: number, p: number) => q.probs(q.matVec(q.H, b.stateAt(t, p)));
  closeVec(xOdds(90, 0), [1, 0]);
  closeVec(xOdds(90, 180), [0, 1]);
  closeVec(xOdds(90, 90), [0.5, 0.5]);
  for (const [t, p] of grid) {
    const o = xOdds(t, p);
    close(o[0] + o[1], 1);
    close(o[0], (1 + b.pointOf(t, p)[0]) / 2);
  }
});

test('opposite points are orthogonal states: |⟨ψ|χ⟩|² = 0 for antipodes', () => {
  for (const [t, p] of grid) close(overlap(b.stateAt(t, p), b.stateAt(180 - t, p + 180)), 0);
  close(overlap(q.ket0(), q.ket1()), 0);
  close(overlap(q.plus(), q.minus()), 0);
});

test('half angles: |⟨ψ|χ⟩|² = (1 + r·s)/2 = cos²(Θ/2), Θ the angle between the two points', () => {
  for (let i = 0; i + 1 < randoms.length; i += 2) {
    const s = randoms[i], t = randoms[i + 1], rs = dot(q.bloch(s), q.bloch(t));
    close(overlap(s, t), (1 + rs) / 2);
    close(overlap(s, t), Math.cos(Math.acos(Math.max(-1, Math.min(1, rs))) / 2) ** 2, 1e-9);
  }
});

// ---- Measured copies

test('each copy gives 0 exactly when its draw is below P(0); p0 = 1 gives all 0, p0 = 0 gives all 1', () => {
  const us = Array.from({ length: b.COPIES }, q.rng(3));
  for (const p0 of [0, 0.1, 0.25, 0.5, 0.75, 0.93, 1]) {
    const rs = b.results(us, p0);
    assert.equal(rs.length, b.COPIES);
    assert.equal(b.zerosIn(rs), us.filter((u) => u < p0).length);
  }
  assert.equal(b.zerosIn(b.results(us, 1)), b.COPIES);
  assert.equal(b.zerosIn(b.results(us, 0)), 0);
});

test('fixed draws: raising P(0) only turns 1s into 0s, never back', () => {
  const us = Array.from({ length: b.COPIES }, q.rng(5));
  for (let t = 180; t >= 1; t--) {
    const before = b.results(us, b.odds(t, 0)[0]), after = b.results(us, b.odds(t - 1, 0)[0]);
    before.forEach((r, i) => assert.ok(!(r === 0 && after[i] === 1)));
  }
});

test('Born rule in the long run: the share of 0s lands near P(0), within 4 standard deviations', () => {
  const n = 40000, us = Array.from({ length: n }, q.rng(11));
  for (const t of [30, 60, 90, 120, 150]) {
    const p0 = b.odds(t, 0)[0], share = b.zerosIn(b.results(us, p0)) / n, sd = Math.sqrt((p0 * (1 - p0)) / n);
    assert.ok(Math.abs(share - p0) < 4 * sd, `theta ${t}: ${share} vs ${p0}`);
  }
});

// ---- Text the tool shows

test('num: two decimals, a true minus sign, never −0.00', () => {
  assert.equal(b.num(0.70710678), '0.71');
  assert.equal(b.num(-0.5), '−0.50');
  assert.equal(b.num(-0.001), '0.00');
  assert.equal(b.num(0), '0.00');
});

test('amp: real, imaginary and complex amplitudes', () => {
  assert.equal(b.amp(q.c(0.5)), '0.50');
  assert.equal(b.amp(q.c(-S2)), '−0.71');
  assert.equal(b.amp(q.c(0, S2)), '0.71i');
  assert.equal(b.amp(q.c(0, -S2)), '−0.71i');
  assert.equal(b.amp(q.c(0.35, 0.35)), '(0.35 + 0.35i)');
  assert.equal(b.amp(q.c(-0.35, -0.35)), '(−0.35 − 0.35i)');
  assert.equal(b.amp(q.c(0.001, -0.002)), '0.00');
});

test('ket: known states', () => {
  assert.equal(b.ket(0, 0), '|ψ⟩ = 1.00|0⟩ + 0.00|1⟩');
  assert.equal(b.ket(0, 200), '|ψ⟩ = 1.00|0⟩ + 0.00|1⟩');
  assert.equal(b.ket(180, 0), '|ψ⟩ = 0.00|0⟩ + 1.00|1⟩');
  assert.equal(b.ket(90, 0), '|ψ⟩ = 0.71|0⟩ + 0.71|1⟩');
  assert.equal(b.ket(90, 180), '|ψ⟩ = 0.71|0⟩ − 0.71|1⟩');
  assert.equal(b.ket(90, 90), '|ψ⟩ = 0.71|0⟩ + 0.71i|1⟩');
  assert.equal(b.ket(90, 270), '|ψ⟩ = 0.71|0⟩ − 0.71i|1⟩');
  assert.equal(b.ket(60, 45), '|ψ⟩ = 0.87|0⟩ + (0.35 + 0.35i)|1⟩');
  assert.equal(b.ket(120, 225), '|ψ⟩ = 0.50|0⟩ + (−0.61 − 0.61i)|1⟩');
});

test('vecText: the point to two decimals', () => {
  assert.equal(b.vecText(b.pointOf(90, 90)), '(0.00, 1.00, 0.00)');
  assert.equal(b.vecText(b.pointOf(60, 45)), '(0.61, 0.61, 0.50)');
  assert.equal(b.vecText(b.pointOf(180, 30)), '(0.00, 0.00, −1.00)');
});

test('percents: known values, they add to 100, and a real chance never shows as 0% or 100%', () => {
  assert.deepEqual(b.percents(1), ['100%', '0%']);
  assert.deepEqual(b.percents(0), ['0%', '100%']);
  assert.deepEqual(b.percents(0.5), ['50%', '50%']);
  assert.deepEqual(b.percents(0.75), ['75%', '25%']);
  assert.deepEqual(b.percents(b.odds(1, 0)[0]), ['over 99%', 'under 1%']);
  assert.deepEqual(b.percents(b.odds(179, 0)[0]), ['under 1%', 'over 99%']);
  for (let t = 1; t < 180; t++) {
    const [a, c] = b.percents(b.odds(t, 0)[0]);
    assert.ok(!['0%', '100%'].includes(a) && !['0%', '100%'].includes(c), `theta ${t}`);
    if (!a.includes(' ')) assert.equal(parseInt(a) + parseInt(c), 100);
  }
});

test('nameAt: the six named states, any phi at a pole, null elsewhere', () => {
  for (const n of b.NAMED) assert.equal(b.nameAt(n.theta, n.phi), n.name);
  assert.equal(b.nameAt(0, 123), '|0⟩');
  assert.equal(b.nameAt(180, 77), '|1⟩');
  assert.equal(b.nameAt(90, 45), null);
  assert.equal(b.nameAt(60, 0), null);
});

test('describe: where the point is, the odds from its height, and the counts', () => {
  assert.equal(b.describe(60, 45, 77),
    'The point is 60° down from |0⟩ and 45° around from |+⟩, on the top half. Its height is z = 0.50, so the odds are 75% for 0 and 25% for 1. Of 100 fresh copies, each measured once, 77 gave 0 and 23 gave 1.');
  assert.equal(b.describe(90, 90),
    'The point is 90° down from |0⟩ and 90° around from |+⟩, on the equator: the state |+i⟩. Its height is z = 0.00, so the odds are 50% for 0 and 50% for 1.');
  assert.equal(b.describe(0, 45, 100),
    'The point is at the top: the state |0⟩. Here φ does not appear in the state at all. Its height is z = 1.00, so the odds are 100% for 0 and 0% for 1. Of 100 fresh copies, each measured once, all 100 gave 0.');
  assert.match(b.describe(180, 10, 0), /global phase.*z = −1\.00.*0% for 0 and 100% for 1.*all 100 gave 1\./);
  assert.match(b.describe(150, 0), /on the bottom half/);
});

// ---- Gliding between presets

test('between: exact ends, whole degrees, theta straight, phi the short way round', () => {
  const a = { theta: 90, phi: 350 }, z = { theta: 90, phi: 10 };
  assert.deepEqual(b.between(a, z, 0), { theta: 90, phi: 350 });
  assert.deepEqual(b.between(a, z, 1), z);
  assert.deepEqual(b.between(a, z, 0.5), { theta: 90, phi: 0 });
  for (let f = 0; f <= 1; f += 0.05) {
    const m = b.between({ theta: 30, phi: 200 }, { theta: 120, phi: 60 }, f);
    assert.ok(Number.isInteger(m.theta) && Number.isInteger(m.phi));
    assert.ok(m.phi <= 200 && m.phi >= 60);
  }
});

test('between: leaving a pole uses the target phi, heading to a pole keeps the start phi, so the path runs along one meridian', () => {
  assert.deepEqual(b.between({ theta: 0, phi: 0 }, { theta: 90, phi: 270 }, 0.5), { theta: 45, phi: 270 });
  assert.deepEqual(b.between({ theta: 90, phi: 90 }, { theta: 180, phi: 0 }, 0.5), { theta: 135, phi: 90 });
  assert.deepEqual(b.between({ theta: 90, phi: 90 }, { theta: 180, phi: 0 }, 1), { theta: 180, phi: 0 });
});

// ---- Drawing math

test('camera: right, up and toward are orthonormal and right-handed (right × up = toward)', () => {
  for (const [yaw, tilt] of [[0, 0], [30, 20], [123, -45], [270, 90], [359, -90]]) {
    const { right: r, up: u, toward: v } = b.camera(yaw, tilt);
    [r, u, v].forEach((x) => close(len(x), 1));
    close(dot(r, u), 0); close(dot(r, v), 0); close(dot(u, v), 0);
    closeVec([r[1] * u[2] - r[2] * u[1], r[2] * u[0] - r[0] * u[2], r[0] * u[1] - r[1] * u[0]], v);
  }
});

test('project: keeps lengths, puts |0⟩ up and in view, and looking from the top puts |0⟩ in the center, in front', () => {
  const cam = b.camera(30, 20);
  for (const [t, p] of grid) {
    const s = b.project(b.point(t, p), cam);
    close(s.x ** 2 + s.y ** 2 + s.depth ** 2, 1);
  }
  const top = b.project([0, 0, 1], cam);
  assert.ok(top.y > 0.9 && Math.abs(top.x) < 1e-12);
  const plusX = b.project([1, 0, 0], cam), plusY = b.project([0, 1, 0], cam);
  assert.ok(plusX.depth > 0 && plusX.x < 0, '|+⟩ faces the viewer, a little left');
  assert.ok(plusY.x > 0, '|+i⟩ is to the right');
  const down = b.project([0, 0, 1], b.camera(0, 90));
  close(down.x, 0); close(down.y, 0); close(down.depth, 1);
});

test('spherePoints: n points on the unit sphere, spread with no lean to one side', () => {
  const ps = b.spherePoints(700);
  assert.equal(ps.length, 700);
  ps.forEach((v) => close(len(v), 1));
  const mean = [0, 1, 2].map((k) => ps.reduce((t, v) => t + v[k], 0) / ps.length);
  mean.forEach((m) => assert.ok(Math.abs(m) < 0.01));
});
