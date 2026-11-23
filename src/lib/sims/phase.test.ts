import test from 'node:test';
import assert from 'node:assert/strict';
import * as q from '../quantum.ts';
import * as s from './phase.ts';

const close = (a: number, b: number, eps = 1e-12) => assert.ok(Math.abs(a - b) < eps, `${a} != ${b}`);
const closeC = (a: q.C, b: q.C, eps = 1e-12) => { close(a.re, b.re, eps); close(a.im, b.im, eps); };
const rad = (d: number) => (d * Math.PI) / 180;
const degrees = Array.from({ length: 361 }, (_, d) => d); // every slider value
const some = [0, 1, 37, 90, 135, 180, 222, 270, 359, 360];

// ---- The state

test('start: started as 0, then a Hadamard gate, is |+> = (|0> + |1>)/sqrt2', () => {
  s.plusState().forEach((a, i) => closeC(a, q.plus()[i]));
  s.prepare(0, 0).forEach((a, i) => closeC(a, q.plus()[i]));
});

test('prepare(g, r) = e^{ig} (|0> + e^{ir}|1>)/sqrt2, a unit vector, for every slider pair', () => {
  for (const g of degrees) for (const r of degrees) {
    const st = s.prepare(g, r);
    closeC(st[0], q.scale(q.expi(rad(g)), Math.SQRT1_2));
    closeC(st[1], q.scale(q.expi(rad(g + r)), Math.SQRT1_2));
    close(q.norm2(st), 1);
  }
});

test('known states: r = 180 is |->, and g = 180 with r = 180 is -|->', () => {
  s.prepare(0, 180).forEach((a, i) => closeC(a, q.minus()[i]));
  s.prepare(180, 180).forEach((a, i) => closeC(a, q.scale(q.minus()[i], -1)));
  s.prepare(0, 360).forEach((a, i) => closeC(a, q.plus()[i]));
});

// ---- Born rule

test('Born rule: odds add to 1, right away and after a Hadamard gate, for every slider pair', () => {
  for (const g of degrees) for (const r of degrees) {
    const st = s.prepare(g, r), a = s.oddsNow(st), b = s.oddsAfterH(st);
    close(a[0] + a[1], 1, 2e-12); close(b[0] + b[1], 1, 2e-12); // odds are rounded to 12 places
    [...a, ...b].forEach((p) => assert.ok(p >= 0 && p <= 1));
  }
});

test('measured right away: exactly 50/50 for every global and relative phase', () => {
  for (const g of degrees) for (const r of degrees) assert.deepEqual(s.oddsNow(s.prepare(g, r)), [0.5, 0.5]);
});

test('after a Hadamard gate: P(0) = cos^2(r/2) = (1 + cos r)/2 = |(1 + e^{ir})/2|^2', () => {
  for (const r of degrees) {
    const p0 = s.oddsAfterH(s.prepare(0, r))[0];
    close(p0, Math.cos(rad(r) / 2) ** 2);
    close(p0, (1 + Math.cos(rad(r))) / 2);
    close(p0, q.abs2(q.scale(q.add(q.c(1), q.expi(rad(r))), 0.5)));
  }
});

test('after a Hadamard gate: known values, exact at the ends', () => {
  const p = (r: number) => s.oddsAfterH(s.prepare(0, r));
  assert.deepEqual(p(0), [1, 0]);
  assert.deepEqual(p(180), [0, 1]);
  assert.deepEqual(p(360), [1, 0]);
  close(p(60)[0], 0.75); close(p(90)[0], 0.5); close(p(120)[0], 0.25); close(p(270)[0], 0.5);
  close(p(45)[0], (2 + Math.SQRT2) / 4);
});

test('after a Hadamard gate: r and 360 - r give the same odds, and P(0) falls from 0 to 180', () => {
  for (const r of degrees) close(s.oddsAfterH(s.prepare(0, r))[0], s.oddsAfterH(s.prepare(0, 360 - r))[0]);
  for (let r = 1; r <= 180; r++) assert.ok(s.oddsAfterH(s.prepare(0, r))[0] < s.oddsAfterH(s.prepare(0, r - 1))[0]);
});

// ---- Global phase cannot be seen

test('global phase: no odds change, right away or after a Hadamard gate, for every slider pair', () => {
  for (const r of degrees) {
    const now = s.oddsNow(s.prepare(0, r)), h = s.oddsAfterH(s.prepare(0, r));
    for (const g of degrees) {
      const st = s.prepare(g, r);
      s.oddsNow(st).forEach((p, i) => close(p, now[i], 2e-12)); // odds are rounded to 12 places
      s.oddsAfterH(st).forEach((p, i) => close(p, h[i], 2e-12));
    }
  }
});

test('global phase: survives any gates, so no experiment sees it (U e^{ig}|psi> = e^{ig} U|psi>)', () => {
  const gates = [q.H, q.X, q.Y, q.Z, q.S, q.T, q.RX(0.7), q.RY(1.9), q.RZ(2.3), q.P(0.4)];
  for (const g of some) for (const r of some) {
    let a = s.prepare(0, r), b = s.prepare(g, r);
    for (const u of [...gates, ...gates.slice().reverse()]) {
      a = q.matVec(u, a); b = q.matVec(u, b);
      b.forEach((x, i) => closeC(x, q.mul(q.expi(rad(g)), a[i]), 1e-11));
      q.probs(b).forEach((p, i) => close(p, q.probs(a)[i]));
    }
  }
});

test('global phase: a fixed batch of draws gives the same counts at every global phase', () => {
  const us = Array.from({ length: s.SHOTS }, q.rng(4)), ush = Array.from({ length: s.SHOTS }, q.rng(5));
  for (const r of degrees) {
    const z0 = s.zeros(us, s.oddsNow(s.prepare(0, r))[0]), h0 = s.zeros(ush, s.oddsAfterH(s.prepare(0, r))[0]);
    for (const g of degrees) {
      assert.equal(s.zeros(us, s.oddsNow(s.prepare(g, r))[0]), z0);
      assert.equal(s.zeros(ush, s.oddsAfterH(s.prepare(g, r))[0]), h0);
    }
  }
});

test('global phase: the Bloch point does not move; relative phase turns it to (cos r, sin r, 0)', () => {
  for (const r of degrees) {
    const ref = q.bloch(s.prepare(0, r));
    close(ref[0], Math.cos(rad(r))); close(ref[1], Math.sin(rad(r))); close(ref[2], 0);
    for (const g of some) {
      const [x, y] = s.blochTop(s.prepare(g, r));
      close(x, ref[0]); close(y, ref[1]);
    }
  }
});

test('global phase: the readout changes only the angles, never an odd or a count', () => {
  const strip = (t: string) => t.replace(/Global phase \d+°/, '').replace(/points at \d+°, the one for 1 at \d+°/, '').replace(/This is .*? the same state as /, 'This is ');
  for (const r of degrees) {
    const ref = strip(s.readout(0, r, 47, 61));
    for (const g of [1, 90, 180, 270, 359]) assert.equal(strip(s.readout(g, r, 47, 61)), ref, `g ${g}, r ${r}`);
  }
});

// ---- Relative phase can be seen

test('relative phase: the angle between the amplitudes is r, whatever the global phase', () => {
  for (const g of degrees) for (const r of some) {
    const st = s.prepare(g, r);
    assert.equal(s.relativeDeg(st), s.wrapDeg(r));
    assert.equal(s.phaseDeg(st[0]), s.wrapDeg(g));
    assert.equal(s.phaseDeg(st[1]), s.wrapDeg(g + r));
  }
  assert.equal(s.relativeDeg(q.ket0()), null);
  assert.equal(s.relativeDeg(q.ket1()), null);
});

test('relative phase: changing it moves the after-Hadamard batch only, never the measure-now batch', () => {
  const us = Array.from({ length: s.SHOTS }, q.rng(8)), ush = Array.from({ length: s.SHOTS }, q.rng(9));
  const now = s.zeros(us, s.oddsNow(s.prepare(0, 0))[0]);
  for (const r of degrees) assert.equal(s.zeros(us, s.oddsNow(s.prepare(0, r))[0]), now);
  assert.equal(s.zeros(ush, s.oddsAfterH(s.prepare(0, 0))[0]), s.SHOTS);
  assert.equal(s.zeros(ush, s.oddsAfterH(s.prepare(0, 180))[0]), 0);
});

test('Y basis tells 90 from 270: P(+i) = (1 + sin r)/2', () => {
  const plusI: q.State = [q.c(Math.SQRT1_2), q.c(0, Math.SQRT1_2)];
  for (const r of degrees) close(q.abs2(q.inner(plusI, s.prepare(37, r))), (1 + Math.sin(rad(r))) / 2);
  close(q.abs2(q.inner(plusI, s.prepare(0, 90))), 1);
  close(q.abs2(q.inner(plusI, s.prepare(0, 270))), 0);
  close(s.oddsAfterH(s.prepare(0, 90))[0], s.oddsAfterH(s.prepare(0, 270))[0]);
});

// ---- Shots

test('shots: zeros counts draws below p0, only grows with p0, and is 0 and n at the ends', () => {
  const us = Array.from({ length: s.SHOTS }, q.rng(3));
  assert.equal(s.zeros(us, 0), 0);
  assert.equal(s.zeros(us, 1), s.SHOTS);
  assert.equal(s.zeros([0], 0), 0, 'a draw of exactly 0 still gives 1 when P(0) is 0');
  assert.equal(s.zeros([0.2, 0.7, 0.4], 0.5), 2);
  assert.equal(s.zeros([0.2, 0.7, 0.4], 0.5, 2), 1);
  let prev = 0;
  for (let k = 0; k <= 1000; k++) { const z = s.zeros(us, k / 1000); assert.ok(z >= prev); prev = z; }
});

test('shots follow the Born rule: frequency within 5 sigma of P(0)', () => {
  const n = 200000, us = Array.from({ length: n }, q.rng(12));
  for (const r of [0, 45, 90, 120, 180, 300]) {
    const p0 = s.oddsAfterH(s.prepare(0, r))[0], z = s.zeros(us, p0);
    assert.ok(Math.abs(z / n - p0) <= 5 * Math.sqrt((p0 * (1 - p0)) / n), `${r}°: ${z / n} vs ${p0}`);
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

test('percent: known values, and never a false 0% or 100%', () => {
  assert.equal(s.pct(0), '0%'); assert.equal(s.pct(1), '100%'); assert.equal(s.pct(0.5), '50%');
  assert.equal(s.pct(0.75), '75%'); assert.equal(s.pct(0.004), 'under 1%'); assert.equal(s.pct(0.996), 'over 99%');
  for (let k = 1; k < 10000; k++) assert.ok(!['0%', '100%'].includes(s.pct(k / 10000)));
  for (const r of degrees) {
    const p0 = s.oddsAfterH(s.prepare(0, r))[0];
    if (p0 > 0 && p0 < 1) assert.ok(!['0%', '100%'].includes(s.pct(p0)), `${r}°`);
  }
  assert.equal(s.chance0(1), 'always 0'); assert.equal(s.chance0(0), 'always 1'); assert.equal(s.chance0(0.25), '25% chance of 0');
});

test('wrapDeg: 0 to 359', () => {
  assert.equal(s.wrapDeg(360), 0); assert.equal(s.wrapDeg(-90), 270); assert.equal(s.wrapDeg(359.6), 0); assert.equal(s.wrapDeg(-0.2), 0); assert.equal(s.wrapDeg(725), 5);
});

test('slider text: global says no odds change; relative gives the after-Hadamard odds', () => {
  assert.equal(s.globalText(120), '120 degrees. No odds change.');
  assert.equal(s.relativeText(0, 0), '0 degrees. After a Hadamard gate: always 0.');
  assert.equal(s.relativeText(50, 90), '90 degrees. After a Hadamard gate: 50% chance of 0.');
  assert.equal(s.relativeText(0, 120), '120 degrees. After a Hadamard gate: 25% chance of 0.');
  assert.equal(s.relativeText(300, 180), '180 degrees. After a Hadamard gate: always 1.');
});

test('readout: known texts', () => {
  assert.equal(s.readout(0, 0, 49, 100),
    'Global phase 0°, relative phase 0°. Both amplitudes have size 0.71. The one for 0 points at 0°, the one for 1 at 0°. Measure now: 50% chance of 0. This batch of 100 gave 49 zeros and 51 ones. Hadamard gate, then measure: always 0. This batch of 100 gave 100 zeros and 0 ones. This is |+⟩. A Hadamard gate sends it to 0 every time.');
  assert.match(s.readout(180, 180, 50, 0), /The one for 0 points at 180°, the one for 1 at 0°\..*always 1\..*This is −1 times \|−⟩, the same state as \|−⟩\. A Hadamard gate sends it to 1 every time\.$/);
  assert.match(s.readout(40, 180, 50, 0), /This is \|−⟩ times a global phase, the same state as \|−⟩\./);
  assert.match(s.readout(360, 360, 50, 100), /This is \|\+⟩\. A Hadamard gate sends it to 0 every time\.$/);
  assert.match(s.readout(40, 90, 52, 49), /points at 40°, the one for 1 at 130°\..*50% chance of 0\. This batch of 100 gave 49 zeros and 51 ones\. After a Hadamard gate, 90° and 270° give the same odds\./);
  assert.match(s.readout(0, 60, 1, 99), /gave 1 zero and 99 ones\..*75% chance of 0\. This batch of 100 gave 99 zeros and 1 one\.$/);
  for (const g of some) for (const r of some) {
    assert.doesNotMatch(s.readout(g, r, 50, 50), /—|both at once|mix|watch|square the amplitude/i);
  }
});

// ---- Claims in the stop text

test('Text: probability is |amplitude|^2, so turning every amplitude by -1 changes no odds', () => {
  const st = s.prepare(0, 70), neg = st.map((a) => q.scale(a, -1));
  q.probs(st).forEach((p, i) => close(p, q.probs(neg)[i]));
});

test('Text: 0.71 and -0.71 is |->; a second Hadamard gate sends |+> to 0 and |-> to 1 every time', () => {
  close(q.probs(q.matVec(q.H, q.plus()))[0], 1);
  close(q.probs(q.matVec(q.H, q.minus()))[1], 1);
  q.probs(q.minus()).forEach((p) => close(p, 0.5));
});

test('Text: for result 0, a Hadamard gate adds the two amplitudes: <0|H|psi> = (a + b)/sqrt2', () => {
  for (const r of some) {
    const st = s.prepare(25, r), out = s.hadamard(st);
    closeC(out[0], q.scale(q.add(st[0], st[1]), Math.SQRT1_2));
    closeC(out[1], q.scale(q.sub(st[0], st[1]), Math.SQRT1_2));
  }
});

test('Text: any state is e^{ig}(cos(t/2)|0> + e^{ip} sin(t/2)|1>); the Bloch point ignores g', () => {
  for (const [t, p, g] of [[0.3, 1.1, 2.0], [2.5, 4.0, -1.2], [Math.PI / 2, 0.5, 3.0]]) {
    const st = q.fromBloch(t, p).map((a) => q.mul(q.expi(g), a));
    const [x, y, z] = q.bloch(st);
    close(x, Math.sin(t) * Math.cos(p)); close(y, Math.sin(t) * Math.sin(p)); close(z, Math.cos(t));
    close(q.probs(st)[0], Math.cos(t / 2) ** 2);
  }
});

test('Text: RZ(p) = e^{-ip/2} P(p), the same gate up to a global phase', () => {
  for (const p of [0.4, 1, Math.PI / 2, 2.8]) {
    const k = q.expi(-p / 2), rz = q.RZ(p), ph = q.P(p);
    for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) closeC(rz[i][j], q.mul(k, ph[i][j]));
  }
});

test('Text: controlled, that global phase turns relative: controlled RZ and controlled P differ', () => {
  const p = Math.PI / 2, start = q.tensor(q.plus(), q.ket1()); // control |+>, target |1>
  const after = (u: q.Matrix) => q.probOne(q.apply1(q.controlled(start, u, [0], 1), q.H, 0), 0);
  close(after(q.P(p)), Math.sin(p / 2) ** 2); // control gets relative phase p
  close(after(q.RZ(p)), Math.sin(p / 4) ** 2); // control gets relative phase p/2
  assert.ok(Math.abs(after(q.P(p)) - after(q.RZ(p))) > 0.1);
});

test('Text: controlled RZ(p) = controlled P(p), then P(-p/2) on the control, for any input', () => {
  const ins: q.State[] = [
    q.tensor(q.plus(), q.fromBloch(1.1, 0.4)),
    q.tensor(q.fromBloch(2.2, -0.9), q.fromBloch(0.7, 2.5)),
    q.normalize([q.c(0.3, 0.1), q.c(-0.5, 0.2), q.c(0.1, -0.6), q.c(0.4, 0.3)]), // entangled
  ];
  for (const st of ins) for (let d = 0; d <= 360; d += 15) {
    const p = rad(d), viaRz = q.controlled(st, q.RZ(p), [0], 1);
    const viaP = q.apply1(q.controlled(st, q.P(p), [0], 1), q.P(-p / 2), 0);
    viaRz.forEach((a, i) => closeC(a, viaP[i]));
  }
});
