import test from 'node:test';
import assert from 'node:assert/strict';
import * as q from '../quantum.ts';
import * as s from './interference.ts';

const close = (a: number, b: number, eps = 1e-12) => assert.ok(Math.abs(a - b) < eps, `${a} != ${b}`);
const closeC = (a: q.C, b: q.C, eps = 1e-12) => { close(a.re, b.re, eps); close(a.im, b.im, eps); };
const RAD = Math.PI / 180;
const phases = Array.from({ length: 361 }, (_, d) => d);
const results = [0, 1] as const;

// ---- The two ways and the path sum

test('each way is the product of the amplitudes along its path: 1/2 and (-1)^x e^{i phi} / 2', () => {
  for (const d of phases) {
    const e = q.expi(d * RAD);
    closeC(s.way(d, 0, 0), q.c(0.5));
    closeC(s.way(d, 1, 0), q.c(0.5));
    closeC(s.way(d, 0, 1), q.scale(e, 0.5));
    closeC(s.way(d, 1, 1), q.scale(e, -0.5));
  }
});

test('the path sum matches the circuit run as matrices: H P(phi) H |0>', () => {
  for (const d of phases) {
    const st = s.finalState(d);
    for (const x of results) closeC(s.amplitude(d, x), st[x]);
  }
});

test('H P(phi) H = e^{i phi/2} RX(phi), so the state is cos(phi/2)|0> - i sin(phi/2)|1> up to a global phase', () => {
  for (const d of phases) {
    const t = d * RAD, u = q.matMul(q.H, q.matMul(q.P(t), q.H)), v = q.RX(t), g = q.expi(t / 2);
    for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) closeC(u[i][j], q.mul(g, v[i][j]));
    const st = s.finalState(d).map((a) => q.mul(q.expi(-t / 2), a));
    closeC(st[0], q.c(Math.cos(t / 2)));
    closeC(st[1], q.c(0, -Math.sin(t / 2)));
  }
});

// ---- Born rule

test('Born rule: P(0) = cos^2(phi/2) = (1 + cos phi)/2 and P(1) = sin^2(phi/2), adding to 1', () => {
  for (const d of phases) {
    const t = d * RAD, [p0, p1] = s.chances(d);
    close(p0, Math.cos(t / 2) ** 2);
    close(p1, Math.sin(t / 2) ** 2);
    close(p0, (1 + Math.cos(t)) / 2);
    close(p0 + p1, 1);
    const pr = q.probs(s.finalState(d));
    close(p0, pr[0]); close(p1, pr[1]);
  }
});

test('known values: 0 and 360 give 0 for sure, 180 gives 1 for sure, 90 and 270 give 50/50, 60 gives 75/25', () => {
  assert.deepEqual(s.chances(0), [1, 0]);
  assert.equal(s.chance(180, 0), 0);
  close(s.chance(180, 1), 1);
  assert.equal(s.chance(360, 1), 0);
  close(s.chance(360, 0), 1);
  close(s.chance(90, 0), 0.5); close(s.chance(270, 1), 0.5);
  close(s.chance(60, 0), 0.75); close(s.chance(120, 0), 0.25);
});

test('exact cancel: at phi = 0 the amplitude of 1 is exactly 0, at 180 the amplitude of 0 is', () => {
  assert.deepEqual(s.amplitude(0, 1), q.c(0));
  assert.deepEqual(s.amplitude(180, 0), q.c(0));
});

test('symmetries: P0(phi) = P0(360 - phi), P0(phi) = P1(phi + 180), and P0 falls from 0 to 180', () => {
  for (const d of phases) {
    close(s.chance(d, 0), s.chance(360 - d, 0));
    close(s.chance(d, 0), s.chance(d + 180, 1));
  }
  for (let d = 1; d <= 180; d++) assert.ok(s.chance(d, 0) < s.chance(d - 1, 0));
});

// ---- Odds adding versus amplitudes adding

test('each way alone gives 1/4, so adding chances gives 1/2 for every phase', () => {
  for (const d of phases) for (const x of results) {
    close(s.alone(d, x, 0), 0.25); close(s.alone(d, x, 1), 0.25);
    close(s.oddsAdded(d, x), 0.5);
  }
});

test('|a + b|^2 = |a|^2 + |b|^2 + 2 Re(conj(a) b), and the interference term is (-1)^x cos(phi)/2', () => {
  for (const d of phases) for (const x of results) {
    close(s.chance(d, x), s.oddsAdded(d, x) + s.cross(d, x));
    close(s.cross(d, x), ((-1) ** x * Math.cos(d * RAD)) / 2);
  }
});

test('the two interference terms are equal and opposite: what cancels at one result builds up at the other', () => {
  for (const d of phases) close(s.cross(d, 0) + s.cross(d, 1), 0);
});

test('two ways in can give less than one way alone: at 180 result 0 gets 0, though each way alone gives 1/4', () => {
  assert.equal(s.chance(180, 0), 0);
  assert.ok(s.alone(180, 0, 0) > 0 && s.alone(180, 0, 1) > 0);
});

test('a full record of the middle value gives the plain sum of chances, 1/2, for every phase', () => {
  // Measure in the middle: middle m with chance |<m|H|0>|^2, then the rest of the circuit from |m>.
  for (const d of phases) {
    const mid = q.matVec(q.P(d * RAD), q.matVec(q.H, q.ket0()));
    const p = [0, 0];
    for (const m of results) {
      const pm = q.abs2(mid[m]), after = q.normalize(mid.map((a, i) => (i === m ? a : q.c(0))));
      q.probs(q.matVec(q.H, after)).forEach((v, x) => (p[x] += pm * v));
    }
    close(p[0], s.oddsAdded(d, 0)); close(p[1], s.oddsAdded(d, 1));
  }
});

test('global phase does nothing: e^{i g} on the middle state leaves both chances alone', () => {
  for (const d of [0, 37, 90, 180, 300]) for (const g of [0.4, 1.9, Math.PI, 5]) {
    const mid = q.matVec(q.P(d * RAD), q.matVec(q.H, q.ket0())).map((a) => q.mul(q.expi(g), a));
    const pr = q.probs(q.matVec(q.H, mid));
    close(pr[0], s.chance(d, 0)); close(pr[1], s.chance(d, 1));
  }
});

test('relative phase does matter: the chances change as phi changes', () => {
  assert.ok(Math.abs(s.chance(0, 0) - s.chance(90, 0)) > 0.4);
  assert.ok(Math.abs(s.chance(90, 0) - s.chance(180, 0)) > 0.4);
});

// ---- Arrows

test('arrow headings: way through 0 at 0 degrees, way through 1 at phi for result 0 and phi + 180 for result 1', () => {
  for (const d of phases) {
    for (const x of results) assert.equal(s.heading(s.way(d, x, 0)), 0);
    assert.equal(s.heading(s.way(d, 0, 1)), s.fold(d));
    assert.equal(s.heading(s.way(d, 1, 1)), s.fold(d + 180));
    for (const x of results) assert.equal(s.fold(s.heading(s.way(d, x, 1))! - s.heading(s.way(d, x, 0))!), s.gap(d, x));
  }
  assert.equal(s.heading(q.c(0)), null);
  assert.equal(s.heading(q.c(-0.5, -1e-17)), 180);
  assert.equal(s.heading(q.c(0.5, -1e-17)), 0);
});

test('sum length is |cos(phi/2)| for result 0 and |sin(phi/2)| for result 1, at most 1', () => {
  for (const d of phases) {
    const t = d * RAD;
    close(q.abs(s.amplitude(d, 0)), Math.abs(Math.cos(t / 2)));
    close(q.abs(s.amplitude(d, 1)), Math.abs(Math.sin(t / 2)));
    for (const x of results) assert.ok(q.abs(s.amplitude(d, x)) <= 1 + 1e-12);
  }
});

test('combine: the words match the chance against the plain sum 1/2', () => {
  for (const d of phases) for (const x of results) {
    const how = s.combine(d, x), p = s.chance(d, x);
    if (how === 'add') close(p, 1);
    else if (how === 'cancel') assert.equal(p, 0);
    else if (how === 'right angle') close(p, 0.5);
    else if (how === 'partly add') assert.ok(p > 0.5 && p < 1);
    else assert.ok(p > 0 && p < 0.5);
  }
  assert.equal(s.combine(0, 0), 'add'); assert.equal(s.combine(0, 1), 'cancel');
  assert.equal(s.combine(180, 0), 'cancel'); assert.equal(s.combine(180, 1), 'add');
  assert.equal(s.combine(90, 0), 'right angle'); assert.equal(s.combine(270, 1), 'right angle');
  assert.equal(s.combine(60, 0), 'partly add'); assert.equal(s.combine(60, 1), 'partly cancel');
});

// ---- Words and numbers

test('percent: whole numbers, never a false 0% or 100%', () => {
  assert.equal(s.percent(0), '0%'); assert.equal(s.percent(1), '100%');
  assert.equal(s.percent(0.25), '25%'); assert.equal(s.percent(0.004), 'under 1%');
  assert.equal(s.percent(0.996), 'over 99%'); assert.equal(s.percent(0.005), '1%');
});

test('percents: add to 100 when both are whole numbers, and match the chances', () => {
  const n = (t: string) => Number(t.replace('%', ''));
  for (const d of phases) {
    const [a, b] = s.percents(d), p0 = s.chance(d, 0);
    if (/^\d+%$/.test(a) && /^\d+%$/.test(b)) {
      assert.equal(n(a) + n(b), 100);
      assert.ok(Math.abs(n(a) - p0 * 100) <= 0.5 + 1e-9, `${d}: ${a} vs ${p0}`);
    } else assert.deepEqual([a, b].sort(), ['over 99%', 'under 1%']);
  }
  assert.deepEqual(s.percents(0), ['100%', '0%']);
  assert.deepEqual(s.percents(180), ['0%', '100%']);
  assert.deepEqual(s.percents(90), ['50%', '50%']);
  assert.deepEqual(s.percents(120), ['25%', '75%']);
  assert.deepEqual(s.percents(1), ['over 99%', 'under 1%']);
  assert.deepEqual(s.percents(179), ['under 1%', 'over 99%']);
});

test('len: two decimals, never -0.00', () => {
  assert.equal(s.len(0.5), '0.50'); assert.equal(s.len(-1e-17), '0.00'); assert.equal(s.len(Math.SQRT1_2), '0.71');
});

test('readout: known sentences', () => {
  assert.equal(s.describe(0, 200, 200),
    'Phase 0°. Result 0: both arrows point the same way, at 0°, and add, to length 1.00, chance 100%. ' +
    'Result 1: the arrows at 0° and 180° point opposite ways and cancel, to length 0.00, chance 0%. ' +
    'Shots: 200 of 200 gave 0, 0 gave 1.');
  assert.equal(s.sayResult(180, 0), 'Result 0: the arrows at 0° and 180° point opposite ways and cancel, to length 0.00, chance 0%.');
  assert.equal(s.sayResult(180, 1), 'Result 1: both arrows point the same way, at 0°, and add, to length 1.00, chance 100%.');
  assert.equal(s.sayResult(90, 0), 'Result 0: the arrows at 0° and 90° are at right angles, to length 0.71, chance 50%, the same as if chances added.');
  assert.equal(s.sayResult(120, 0), 'Result 0: the arrows at 0° and 120° partly cancel, to length 0.50, chance 25%.');
  assert.equal(s.sayResult(120, 1), 'Result 1: the arrows at 0° and 300° partly add, to length 0.87, chance 75%.');
  assert.equal(s.describe(360, 0, 0), s.describe(0, 0, 0).replace('Phase 0°', 'Phase 360°'));
  assert.ok(!s.describe(45, 0, 0).includes('Shots'));
});

test('slider value text', () => {
  assert.equal(s.valueText(0), '0 degrees. Chance of 0: 100%. Chance of 1: 0%.');
  assert.equal(s.valueText(120), '120 degrees. Chance of 0: 25%. Chance of 1: 75%.');
  assert.equal(s.valueText(360), '360 degrees. Chance of 0: 100%. Chance of 1: 0%.');
});

test('the readout gives the phase as set and arrow headings from 0 to 359, never negative', () => {
  for (const d of phases) {
    const t = s.describe(d, 0, 0);
    assert.ok(t.startsWith(`Phase ${d}°. `), t);
    const heads = [...t.slice(t.indexOf('Result')).matchAll(/(-|−)?(\d+)°/g)];
    assert.ok(heads.length >= 2, t);
    heads.forEach((m) => { assert.equal(m[1], undefined, t); assert.ok(+m[2] < 360, t); });
  }
});

// ---- Shots

test('shots follow the Born rule: 100,000 seeded shots land within 5 sigma of P(0)', () => {
  for (const d of [0, 45, 90, 120, 180, 300]) {
    const n = 100000, us = s.draws(n, q.rng(7 + d)), p0 = s.chance(d, 0);
    const z = s.countZeros(us, p0), sigma = Math.sqrt(n * p0 * (1 - p0));
    assert.ok(Math.abs(z - n * p0) <= 5 * sigma + 1e-9, `${d}: ${z} vs ${n * p0}`);
  }
});

test('certain results are certain: at 0 every shot gives 0, at 180 none do', () => {
  const us = s.draws(s.SHOTS, q.rng(3));
  assert.equal(s.countZeros(us, s.chance(0, 0)), s.SHOTS);
  assert.equal(s.countZeros(us, s.chance(180, 0)), 0);
});

test('fixed draws: as P(0) falls, shots only move from pile 0 to pile 1, never back', () => {
  const us = s.draws(s.SHOTS, q.rng(11));
  let prev = s.gaveZero(us, s.chance(0, 0));
  for (let d = 1; d <= 180; d++) {
    const now = s.gaveZero(us, s.chance(d, 0));
    now.forEach((z, i) => assert.ok(!z || prev[i], `shot ${i} moved back at ${d}`));
    assert.equal(now.filter(Boolean).length, s.countZeros(us, s.chance(d, 0)));
    prev = now;
  }
});

test('draws are uniform in [0, 1) and the batch has SHOTS shots', () => {
  const us = s.draws(s.SHOTS, q.rng(5));
  assert.equal(us.length, 200);
  us.forEach((u) => assert.ok(u >= 0 && u < 1));
});

test('slider and presets are inside the range', () => {
  assert.equal(s.PHASE.min, 0); assert.equal(s.PHASE.max, 360);
  assert.ok(s.PHASE.start >= s.PHASE.min && s.PHASE.start <= s.PHASE.max);
  s.PRESETS.forEach((p) => assert.ok(p >= s.PHASE.min && p <= s.PHASE.max));
});

test('pile grid: holds every shot, fits the box, and picks the layout with the biggest dots', () => {
  for (const [w, h] of [[100, 150], [111, 147], [160, 98], [300, 88], [420, 120], [60, 40]]) {
    const g = s.pileGrid(w, h, s.SHOTS);
    assert.equal(g.cols * g.rows, s.SHOTS);
    assert.ok(g.cols * g.pitch <= w + 1e-9 && g.rows * g.pitch <= h + 1e-9, `${w}x${h}`);
    for (const c of s.PILE_COLS) {
      const r = s.SHOTS / c, p = Math.min(w / c, h / r, s.PILE_MAX);
      assert.ok(p <= g.pitch + 1e-9);
    }
  }
  assert.deepEqual(s.pileGrid(111, 147, 200), { cols: 10, rows: 20, pitch: 7.35 });
  assert.deepEqual(s.pileGrid(300, 88, 200), { cols: 25, rows: 8, pitch: 10 });
});

test('one way blocked: zero the other middle amplitude (no renormalizing), then H: 1/4 per result, 1/2 lost', () => {
  for (const d of phases) for (const open of results) {
    const mid = q.matVec(q.P(d * RAD), q.matVec(q.H, q.ket0())).map((a, m) => (m === open ? a : q.c(0)));
    const p = q.probs(q.matVec(q.H, mid));
    close(p[0], 0.25); close(p[1], 0.25);
    close(1 - p[0] - p[1], 0.5);
    for (const x of results) close(p[x], s.alone(d, x, open));
  }
});
