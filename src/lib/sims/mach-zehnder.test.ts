import test from 'node:test';
import assert from 'node:assert/strict';
import * as q from '../quantum.ts';
import {
  SHOTS, PHASE, PRESETS, PARTS, HALF_W, HALF_H, LABEL, PAD, WIDE,
  markTurn, inArms, atDetectors, chances, formula, amplitudes, ways, visibility, detect, fire, rate,
  percents, report, valueText, trayGrid, layout,
} from './mach-zehnder.ts';

const close = (a: number, b: number, eps = 1e-12) => assert.ok(Math.abs(a - b) < eps, `${a} != ${b}`);
const closeC = (a: q.C, b: q.C, eps = 1e-12) => { close(a.re, b.re, eps); close(a.im, b.im, eps); };
const RAD = Math.PI / 180;
const S2 = Math.SQRT1_2;
const degs = Array.from({ length: 361 }, (_, i) => i);
const overlaps = [0, 0.1, 0.25, 0.5, 0.7071, 0.9, 1];

// ---- The parts

test('the beam splitter is H, Zwiebach eq. 1.14: s = t = u = 1/sqrt2, v = -1/sqrt2, balanced and unitary', () => {
  const [[s, u], [t, v]] = q.H;
  close(s.re, S2); close(t.re, S2); close(u.re, S2); close(v.re, -S2);
  for (const row of q.H) for (const x of row) close(q.abs2(x), 0.5);
  const hh = q.matMul(q.H, q.dagger(q.H));
  hh.forEach((row, i) => row.forEach((x, j) => closeC(x, q.c(i === j ? 1 : 0))));
});

test('inside the arms: the photon is in each arm with chance 1/2, each amplitude 1/sqrt2', () => {
  const s = inArms();
  closeC(s[0], q.c(S2)); closeC(s[1], q.c(S2));
  close(q.probs(s)[0], 0.5); close(q.probs(s)[1], 0.5);
});

test('the phase shifter changes no chance on its own: |e^{i phi} a|^2 = |a|^2 (Zwiebach, Figure 2)', () => {
  for (const d of degs) {
    const s = q.apply1(inArms(), q.P(d * RAD), 0);
    close(q.probs(s)[0], 0.5); close(q.probs(s)[1], 0.5);
  }
  // At 180 degrees it flips the sign, e^{i pi} = -1.
  closeC(q.P(Math.PI)[1][1], q.c(-1));
});

test('markTurn leaves the two arms\' marker states with overlap <m0|m1> equal to the asked overlap', () => {
  for (const v of overlaps) {
    const m1 = q.matVec(q.RY(markTurn(v)), q.ket0());
    close(q.inner(q.ket0(), m1).re, v); close(q.inner(q.ket0(), m1).im, 0);
  }
  close(markTurn(1), 0); close(markTurn(0), Math.PI);
  close(markTurn(-0.5), Math.PI); close(markTurn(2), 0);
});

// ---- Born rule

test('the state at the detectors is normalized, and the chances are in [0, 1] and add to 1', () => {
  for (const v of overlaps) for (const d of degs) {
    close(q.norm2(atDetectors(d, v)), 1);
    const [a, b] = chances(d, v);
    assert.ok(a >= 0 && a <= 1 && b >= 0 && b <= 1);
    close(a + b, 1);
  }
});

test('no mark: p(D0) = cos^2(phi/2), p(D1) = sin^2(phi/2), the formula, and H P(phi) H |0> as plain matrices', () => {
  for (const d of degs) {
    const [a, b] = chances(d);
    close(a, Math.cos((d * RAD) / 2) ** 2); close(b, Math.sin((d * RAD) / 2) ** 2);
    const [fa, fb] = formula(d); close(a, fa); close(b, fb);
    const m = q.matVec(q.H, q.matVec(q.P(d * RAD), q.matVec(q.H, q.ket0())));
    close(a, q.abs2(m[0])); close(b, q.abs2(m[1]));
  }
});

test('no mark: the amplitudes are (1 + e^{i phi})/2 and (1 - e^{i phi})/2, and the marker stays |0>', () => {
  for (const d of degs) {
    const s = atDetectors(d), [a0, a1] = amplitudes(d);
    closeC(s[0], a0); closeC(s[2], a1); // |path 0, marker 0> and |path 1, marker 0>
    closeC(s[1], q.c(0)); closeC(s[3], q.c(0));
  }
});

test('known values: 0 degrees all at D0, 180 all at D1, 90 an even split, 60 and 120 give 3/4 and 1/4', () => {
  assert.deepEqual(chances(0), [1, 0]);
  assert.deepEqual(chances(360), [1, 0]);
  assert.deepEqual(chances(180), [0, 1]);
  close(chances(90)[0], 0.5); close(chances(270)[0], 0.5);
  close(chances(60)[0], 0.75); close(chances(120)[0], 0.25);
  close(chances(300)[0], 0.75); close(chances(240)[0], 0.25);
});

test('the path sum: each way into a detector has amplitude of size 1/2, and the two ways add to the amplitude', () => {
  for (const d of degs) for (const x of [0, 1] as const) {
    const [w0, w1] = ways(d, x);
    close(q.abs2(w0), 0.25); close(q.abs2(w1), 0.25);
    closeC(q.add(w0, w1), amplitudes(d)[x]);
  }
  // At 0 degrees the two ways into D1 are +1/2 and -1/2 and cancel; into D0 they are 1/2 + 1/2 = 1.
  closeC(ways(0, 1)[0], q.c(0.5)); closeC(ways(0, 1)[1], q.c(-0.5));
  closeC(ways(0, 0)[0], q.c(0.5)); closeC(ways(0, 0)[1], q.c(0.5));
});

test('if chances of the two ways simply added, each detector would get 1/2 at every phase', () => {
  for (const d of degs) for (const x of [0, 1] as const) {
    const [w0, w1] = ways(d, x);
    close(q.abs2(w0) + q.abs2(w1), 0.5);
  }
});

// ---- The mark

test('a full record (overlap 0): 1/2 at each detector, at every phase', () => {
  for (const d of degs) { close(chances(d, 0)[0], 0.5, 1e-12); close(chances(d, 0)[1], 0.5, 1e-12); }
});

test('a full record: arm and detector are independent, each of the four (detector, record) pairs has chance 1/4', () => {
  for (const d of degs) q.probs(atDetectors(d, 0)).forEach((p) => close(p, 0.25));
});

test('any overlap: p(D0) = (1 + <m0|m1> cos phi)/2, the formula', () => {
  for (const v of overlaps) for (const d of degs) {
    const [a, b] = chances(d, v), [fa, fb] = formula(d, v);
    close(a, fa, 1e-12); close(b, fb, 1e-12);
  }
});

test('fringe visibility equals the overlap <m0|m1>: 1 with no mark, 0 with a full record', () => {
  for (const v of overlaps) close(visibility(v), v, 1e-12);
  close(visibility(1), 1); close(visibility(0), 0, 1e-12);
});

test('the mark changes no chance inside the arms: each arm still has chance 1/2', () => {
  for (const v of overlaps) {
    let s = q.apply1(q.basis(2, 0), q.H, 0);
    s = q.controlled(s, q.RY(markTurn(v)), [0], 1);
    close(q.probOne(s, 0), 0.5);
  }
});

// ---- Symmetries and phase

test('global phase: the same phase on both arms changes nothing', () => {
  for (const alpha of [0.3, 1, 2.5, Math.PI, 5]) for (const d of [0, 45, 90, 137, 180, 300]) {
    const both: q.Matrix = [[q.expi(alpha), q.c(0)], [q.c(0), q.expi(alpha)]];
    let s = q.apply1(q.basis(1, 0), q.H, 0);
    s = q.apply1(s, both, 0);
    s = q.apply1(s, q.P(d * RAD), 0);
    s = q.apply1(s, q.H, 0);
    close(q.probs(s)[0], chances(d)[0]);
  }
});

test('only the relative phase counts: phi and 360 - phi give the same odds, and phi + 180 swaps the detectors', () => {
  for (const d of degs.slice(0, 181)) {
    close(chances(d)[0], chances(360 - d)[0]);
    close(chances(d)[0], chances(d + 180)[1]);
    close(chances(d, 0.5)[0], chances(360 - d, 0.5)[0]);
  }
});

test('any balanced lossless beam splitters (diagonal phases times H times diagonal phases) only shift phi by a constant', () => {
  const R = q.rng(11), D = (a: number, b: number): q.Matrix => [[q.expi(a), q.c(0)], [q.c(0), q.expi(b)]];
  for (let k = 0; k < 20; k++) {
    const p = Array.from({ length: 8 }, () => R() * 2 * Math.PI);
    const bs1 = q.matMul(D(p[0], p[1]), q.matMul(q.H, D(p[2], p[3])));
    const bs2 = q.matMul(D(p[4], p[5]), q.matMul(q.H, D(p[6], p[7])));
    for (const row of [...bs1, ...bs2]) for (const x of row) close(q.abs2(x), 0.5);
    const shift = p[1] - p[0] + (p[7] - p[6]);
    for (const d of [0, 30, 90, 180, 222, 359]) {
      const out = q.matVec(bs2, q.matVec(q.P(d * RAD), q.matVec(bs1, q.ket0())));
      close(q.abs2(out[0]), Math.cos((d * RAD + shift) / 2) ** 2);
    }
  }
});

test('every balanced 2x2 unitary (all |entries|^2 = 1/2) is D H D, with D, D diagonal phases', () => {
  const R = q.rng(23), TAU = 2 * Math.PI;
  for (let k = 0; k < 200; k++) {
    // The general 2x2 unitary: e^{i g} [[a, b], [-conj(b), conj(a)]] with |a|^2 + |b|^2 = 1. Balanced: |a| = |b| = 1/sqrt2.
    const g = q.expi(R() * TAU), a = q.scale(q.expi(R() * TAU), S2), b = q.scale(q.expi(R() * TAU), S2);
    const U: q.Matrix = [[q.mul(g, a), q.mul(g, b)], [q.mul(g, q.scale(q.conj(b), -1)), q.mul(g, q.conj(a))]];
    for (const row of U) for (const x of row) close(q.abs2(x), 0.5);
    q.matMul(U, q.dagger(U)).forEach((row, i) => row.forEach((x, j) => closeC(x, q.c(i === j ? 1 : 0))));
    // Solve U = diag(l0, l1) H diag(1, r1) from three entries; the fourth must then match.
    const l0 = q.scale(U[0][0], Math.SQRT2), l1 = q.scale(U[1][0], Math.SQRT2);
    const r1 = q.mul(q.scale(U[0][1], Math.SQRT2), q.conj(l0));
    for (const z of [l0, l1, r1]) close(q.abs2(z), 1);
    const DHD = q.matMul([[l0, q.c(0)], [q.c(0), l1]], q.matMul(q.H, [[q.c(1), q.c(0)], [q.c(0), r1]]));
    DHD.forEach((row, i) => row.forEach((x, j) => closeC(x, U[i][j])));
  }
});

test('the drawing puts the minus sign where H does: on the lower arm reflecting at BS2 into D1', () => {
  const minus = (a: readonly number[], b: readonly number[]) => [a[0] - b[0], a[1] - b[1]];
  const same = (a: number[], b: number[]) => a[0] * b[1] - a[1] * b[0] === 0 && a[0] * b[0] + a[1] * b[1] > 0;
  const flip = (d: number[]) => [d[0], -d[1]]; // a horizontal plate or mirror flips the vertical motion
  // Zwiebach's ports: a beam moving down arrives from above (input 0); a beam leaving upward is output 0.
  // Then H[out][in] gives s (above, reflected), t (above, transmitted), u (below, transmitted), v (below, reflected).
  const port = (d: number[], incoming: boolean) => (incoming ? (d[1] > 0 ? 0 : 1) : (d[1] < 0 ? 0 : 1));
  const split = (din: number[], dout: number[]) => {
    assert.ok(same(dout, din) || same(dout, flip(din)), 'a beam splitter only passes or reflects');
    return { amp: q.H[port(dout, false)][port(din, true)], reflected: same(dout, flip(din)), from: port(din, true) };
  };
  const { source, bs1, mirrorUp, mirrorDown, bs2, d0, d1, shifter } = PARTS;
  // The phase shifter sits on the segment from BS1 to the lower mirror.
  assert.ok(same(minus(shifter, bs1), minus(mirrorDown, bs1)));
  let negatives = 0;
  for (const d of degs.filter((x) => x % 15 === 0)) for (const [x, det] of [[0, d0], [1, d1]] as const) {
    let sum = q.c(0);
    for (const arm of [mirrorUp, mirrorDown]) {
      const a = split(minus(bs1, source), minus(arm, bs1));
      assert.ok(same(minus(bs2, arm), flip(minus(arm, bs1))), 'mirrors reflect');
      const b = split(minus(bs2, arm), minus(det, bs2));
      const phase = arm === mirrorDown ? q.expi(d * RAD) : q.c(1);
      sum = q.add(sum, q.mul(q.mul(b.amp, phase), a.amp));
      if (b.amp.re < 0) {
        negatives++;
        assert.ok(arm === mirrorDown && det === d1 && b.reflected && b.from === 1, 'minus sign only on the lower arm reflecting into D1');
      }
      assert.ok(a.amp.re > 0, 'BS1 adds no sign to a photon from above');
    }
    closeC(sum, amplitudes(d)[x]);
  }
  assert.ok(negatives > 0);
});

test('a complex overlap <m0|m1> = v e^{i a}: p(D0) = (1 + Re(e^{i phi} <m0|m1>))/2, fringe shifted by a, visibility v', () => {
  for (const [v, aDeg] of [[0.8, 37], [0.5, 90], [0.3, 200], [1, 123], [0, 45]] as const) {
    const a = aDeg * RAD;
    const m0 = q.ket0(), m1: q.State = [q.scale(q.expi(a), v), q.c(Math.sqrt(1 - v * v))];
    closeC(q.inner(m0, m1), q.scale(q.expi(a), v));
    const p0 = (d: number) => {
      // (|0>|m0> + e^{i phi}|1>|m1>)/sqrt2, then H on the path.
      const s = [...q.tensor([q.c(S2), q.c(0)], m0)].map((z, i) => q.add(z, q.tensor([q.c(0), q.scale(q.expi(d * RAD), S2)], m1)[i]));
      const out = q.apply1(s, q.H, 0);
      return 1 - q.probOne(out, 0);
    };
    let hi = -Infinity, lo = Infinity;
    for (const d of degs) {
      const p = p0(d);
      close(p, (1 + q.mul(q.expi(d * RAD), q.inner(m0, m1)).re) / 2);
      hi = Math.max(hi, p); lo = Math.min(lo, p);
    }
    close((hi - lo) / (hi + lo), v, 1e-12);
    // The bright phase moves to -a: the fringe only shifts.
    close(p0((360 - aDeg) % 360), (1 + v) / 2);
  }
});

test('Zwiebach eq. 1.19 to 1.20: his BS1 with BS2 = H maps (a, b) to (b, -a), so a photon from below always reaches D0', () => {
  const bs1: q.Matrix = [[q.c(-S2), q.c(S2)], [q.c(S2), q.c(S2)]];
  const m = q.matMul(q.H, bs1);
  closeC(m[0][0], q.c(0)); closeC(m[0][1], q.c(1)); closeC(m[1][0], q.c(-1)); closeC(m[1][1], q.c(0));
  const out = q.matVec(m, q.ket1());
  close(q.abs2(out[0]), 1); close(q.abs2(out[1]), 0);
});

test('a symmetric beam splitter (1/sqrt2)[[1, i], [i, 1]] gives the same fringe, shifted by 180 degrees', () => {
  const B: q.Matrix = [[q.c(S2), q.c(0, S2)], [q.c(0, S2), q.c(S2)]];
  for (const d of degs) {
    const out = q.matVec(B, q.matVec(q.P(d * RAD), q.matVec(B, q.ket0())));
    close(q.abs2(out[0]), chances(d)[1]);
  }
});

test('Zwiebach eq. 1.23: block one arm and the photon is absorbed half the time, and each detector gets 1/4', () => {
  for (const blocked of [0, 1]) {
    const arms = inArms();
    const absorbed = q.abs2(arms[blocked]);
    const left = arms.map((a, i) => (i === blocked ? q.c(0) : a));
    const out = q.matVec(q.H, left);
    close(absorbed, 0.5); close(q.abs2(out[0]), 0.25); close(q.abs2(out[1]), 0.25);
  }
});

// ---- Shots

test('detect follows the odds: p0 = 1 always D0, p0 = 0 always D1, for any draw in [0, 1)', () => {
  for (const u of [0, 1e-9, 0.3, 0.5, 0.999999]) {
    assert.equal(detect(1, () => u), 0); assert.equal(detect(0, () => u), 1);
    assert.equal(detect(0.5, () => u), u < 0.5 ? 0 : 1);
  }
});

test('runs: no mark at 0 degrees sends every photon to D0, at 180 every photon to D1', () => {
  assert.deepEqual(fire(SHOTS, 0, 1, q.rng(1)), [SHOTS, 0]);
  assert.deepEqual(fire(SHOTS, 360, 1, q.rng(2)), [SHOTS, 0]);
  assert.deepEqual(fire(SHOTS, 180, 1, q.rng(3)), [0, SHOTS]);
});

test('runs: counts add to n and land within 5 standard deviations of the Born rule', () => {
  const n = 20000;
  for (const [d, v] of [[0, 0], [90, 1], [60, 1], [120, 0.5], [180, 0], [45, 1]] as const) {
    const [n0, n1] = fire(n, d, v, q.rng(d + 7));
    assert.equal(n0 + n1, n);
    const p = chances(d, v)[0], sd = Math.sqrt(n * p * (1 - p));
    assert.ok(Math.abs(n0 - n * p) <= 5 * sd, `phase ${d}, overlap ${v}: ${n0} vs ${n * p}`);
  }
});

test('rate: the first photons come one by one (4 a second), then faster, never above 240 a second', () => {
  assert.equal(rate(0), 4);
  for (let n = 1; n <= 1000; n++) { assert.ok(rate(n) >= rate(n - 1)); assert.ok(rate(n) <= 240); }
  // A run of SHOTS photons lands in under 4 seconds.
  let t = 0;
  for (let n = 0; n < SHOTS; n++) t += 1 / rate(n);
  assert.ok(t < 4, `a run takes ${t} s`);
});

// ---- Words

test('percents: whole numbers that add to 100, and no false 0% or 100%', () => {
  for (const d of degs) {
    const p0 = chances(d)[0], [a, b] = percents(p0);
    if (a.endsWith('%') && b.endsWith('%') && !a.includes(' ') && !b.includes(' ')) assert.equal(parseInt(a) + parseInt(b), 100);
    if (p0 > 0 && p0 < 1) { assert.notEqual(a, '0%'); assert.notEqual(a, '100%'); assert.notEqual(b, '0%'); assert.notEqual(b, '100%'); }
  }
  assert.deepEqual(percents(1), ['100%', '0%']); assert.deepEqual(percents(0), ['0%', '100%']);
  assert.deepEqual(percents(0.5), ['50%', '50%']); assert.deepEqual(percents(0.001), ['under 1%', 'over 99%']);
  assert.deepEqual(percents(0.9999), ['over 99%', 'under 1%']); assert.deepEqual(percents(0.75), ['75%', '25%']);
});

test('report: says which detector stays dark, that a mark gives 50/50, and the counts once a run is done', () => {
  assert.equal(report(0, false), 'No mark, phase 0°. The two ways to D1 cancel, so D1 never clicks: 100% at D0.');
  assert.equal(report(180, false), 'No mark, phase 180°. The two ways to D0 cancel, so D0 never clicks: 100% at D1.');
  assert.equal(report(60, false), 'No mark, phase 60°. Predicted: 75% at D0, 25% at D1.');
  for (const d of [0, 45, 180, 270]) assert.equal(report(d, true), `Path marked, phase ${d}°. The record of the arm stops the canceling: 50% at D0, 50% at D1, at any phase.`);
  assert.equal(report(0, false, [200, 0]), 'No mark, phase 0°. The two ways to D1 cancel, so D1 never clicks: 100% at D0. Got 200 at D0 and 0 at D1, out of 200 photons.');
  for (const d of degs) for (const m of [false, true]) {
    const r = report(d, m, [100, 100]);
    assert.ok(!/—|watch|look|both at once|observ/i.test(r), r);
  }
});

test('valueText says the degrees and the predicted odds', () => {
  assert.equal(valueText(0, false), '0 degrees. Predicted: 100% at D0, 0% at D1.');
  assert.equal(valueText(90, false), '90 degrees. Predicted: 50% at D0, 50% at D1.');
  assert.equal(valueText(0, true), '0 degrees. Predicted: 50% at D0, 50% at D1.');
});

test('the phase slider and presets cover a full turn and start with D1 dark', () => {
  assert.equal(PHASE.min, 0); assert.equal(PHASE.max, 360);
  assert.deepEqual(chances(PHASE.start), [1, 0]);
  for (const d of PRESETS) assert.ok(d >= PHASE.min && d <= PHASE.max && (d - PHASE.min) % PHASE.step === 0);
});

// ---- Picture layout

test('trayGrid: holds n dots, fits the width, keeps the pitch from 4.5 to 9 px, and fits the height when it can', () => {
  for (let w = 120; w <= 1200; w += 7) for (const n of [1, 50, SHOTS]) for (const hMax of [20, 40, 64, 100]) {
    const g = trayGrid(w, n, hMax);
    assert.ok(g.rows * g.cols >= n);
    assert.ok(g.cols * g.pitch <= w + 1e-9);
    assert.ok(g.pitch >= 4.5 && g.pitch <= 9);
    if (g.pitch > 4.5) assert.ok(g.rows * g.pitch <= hMax);
  }
  assert.deepEqual(trayGrid(1000, SHOTS, 100), { rows: 2, cols: 100, pitch: 9 });
});

test('the diagram matches the setup: BS1 and BS2 on the middle line, mirrors above and below, detectors past BS2', () => {
  assert.deepEqual(PARTS.bs1, [-1, 0]); assert.deepEqual(PARTS.bs2, [1, 0]);
  assert.deepEqual(PARTS.mirrorUp, [0, -1]); assert.deepEqual(PARTS.mirrorDown, [0, 1]);
  // D0 is the upper output, D1 the lower; the source feeds the upper input of BS1.
  assert.ok(PARTS.d0[1] < 0 && PARTS.d1[1] > 0 && PARTS.source[1] < 0);
  // The phase shifter and the marker sit on the lower arm, the line from BS1 to the lower mirror and on to BS2.
  assert.equal(PARTS.shifter[1], PARTS.shifter[0] + 1);
  assert.equal(PARTS.marker[1], 1 - PARTS.marker[0]);
  for (const [x, y] of Object.values(PARTS)) assert.ok(Math.abs(x) <= HALF_W && Math.abs(y) <= HALF_H);
});

test('layout: from a 320 px phone (240 px of tool) to desktop, everything fits, nothing overlaps', () => {
  for (let w = 240; w <= 1000; w += 4) {
    const L = layout(w);
    assert.ok(L.h > 0 && L.u > 0);
    // The drawing stays inside the margin.
    assert.ok(L.ox - HALF_W * L.u >= PAD - 1e-9 && L.ox + HALF_W * L.u <= w - PAD + 1e-9, `drawing x at ${w}`);
    assert.ok(L.oy - HALF_H * L.u >= PAD - 1e-9 && L.oy + HALF_H * L.u <= L.h - PAD + 1e-9, `drawing y at ${w}`);
    const [a, b] = L.trays;
    for (const t of L.trays) {
      const bottom = t.y + LABEL + t.rows * t.pitch;
      assert.ok(t.x >= PAD && t.x + t.cols * t.pitch <= w - PAD + 1e-9, `tray x at ${w}`);
      assert.ok(t.y >= PAD / 2 - 1e-9 && bottom <= L.h - PAD / 2 + 1e-9, `tray y at ${w}`);
      assert.ok(t.pitch >= 6, `dots too small at ${w}`);
      assert.ok(t.rows * t.cols >= SHOTS);
    }
    // The two trays do not overlap.
    assert.ok(a.y + LABEL + a.rows * a.pitch <= b.y, `trays overlap at ${w}`);
    if (w >= WIDE) {
      // Beside the detectors: trays start right of D0 and D1.
      assert.ok(a.x > L.ox + PARTS.d0[0] * L.u);
    } else {
      // Under the drawing.
      assert.ok(a.y >= L.oy + HALF_H * L.u);
    }
  }
});
