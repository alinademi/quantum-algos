import test from 'node:test';
import assert from 'node:assert/strict';
import * as q from '../quantum.ts';
import * as s from './qudits.ts';

const close = (a: number, b: number, eps = 1e-12) => assert.ok(Math.abs(a - b) < eps, `${a} != ${b}`);
const closeC = (a: q.C, b: q.C, eps = 1e-12) => { close(a.re, b.re, eps); close(a.im, b.im, eps); };
const closeM = (a: q.Matrix, b: q.Matrix, eps = 1e-12) => a.forEach((row, i) => row.forEach((x, j) => closeC(x, b[i][j], eps)));
const closeS = (a: q.State, b: q.State, eps = 1e-12) => a.forEach((x, i) => closeC(x, b[i], eps));
const eye = (d: number): q.Matrix => s.power(s.shift(d), 0);
const rad = (deg: number) => (deg * Math.PI) / 180;
const mod = (a: number, n: number) => ((a % n) + n) % n;
const LEVELS = s.LEVELS;
const ALL = [...LEVELS, 7, 8]; // the algebra holds for any d, not only the ones the tool offers
const degrees = Array.from({ length: 361 }, (_, d) => d); // every slider value

// ---- Numbers on the unit circle

test('turn: e^{2 pi i t}, exact at quarter turns, size 1 everywhere', () => {
  assert.deepEqual(s.turn(0), q.c(1)); assert.deepEqual(s.turn(1), q.c(1));
  assert.deepEqual(s.turn(0.25), q.c(0, 1)); assert.deepEqual(s.turn(0.5), q.c(-1)); assert.deepEqual(s.turn(-0.25), q.c(0, -1));
  for (let k = 0; k < 97; k++) { const t = k / 97 - 0.3; closeC(s.turn(t), q.expi(2 * Math.PI * t)); close(q.abs(s.turn(t)), 1); }
});

test('omega: w^d = 1 exactly, w^j w^k = w^{j+k}, and w^{-k} is the conjugate of w^k', () => {
  for (const d of ALL) {
    assert.deepEqual(s.omegaPow(d, d), q.c(1));
    assert.deepEqual(s.omegaPow(d, 0), q.c(1));
    for (let j = 0; j < d; j++) for (let k = 0; k < d; k++) closeC(q.mul(s.omegaPow(d, j), s.omegaPow(d, k)), s.omegaPow(d, j + k));
    for (let k = 0; k < d; k++) closeC(s.omegaPow(d, -k), q.conj(s.omegaPow(d, k)));
  }
  closeC(s.omegaPow(3, 1), q.c(-0.5, Math.sqrt(3) / 2));
});

test('roots of unity: sum_j w^{jm} is d when d divides m, and 0 otherwise', () => {
  for (const d of ALL) for (let m = -d; m <= 2 * d; m++) {
    const sum = Array.from({ length: d }, (_, j) => s.omegaPow(d, j * m)).reduce(q.add, q.c(0));
    closeC(sum, q.c(mod(m, d) === 0 ? d : 0));
  }
  // A qutrit: 1 + w + w^2 = 0, and no two of the three are opposite.
  const w = [0, 1, 2].map((k) => s.omegaPow(3, k));
  closeC(w.reduce(q.add, q.c(0)), q.c(0));
  for (let a = 0; a < 3; a++) for (let b = a + 1; b < 3; b++) assert.ok(q.abs(q.add(w[a], w[b])) > 0.99);
});

// ---- States and gates

test('levels: |j> is a unit vector, and the levels are orthonormal', () => {
  for (const d of ALL) for (let i = 0; i < d; i++) for (let j = 0; j < d; j++) closeC(q.inner(s.level(d, i), s.level(d, j)), q.c(i === j ? 1 : 0));
});

test('gates are unitary: U^dagger U = U U^dagger = I for shift, clock, Fourier and every phase step', () => {
  for (const d of ALL) {
    for (const u of [s.shift(d), s.clock(d), s.fourier(d), s.phaseStep(d, 37), s.phaseStep(d, 120)]) {
      closeM(q.matMul(q.dagger(u), u), eye(d));
      closeM(q.matMul(u, q.dagger(u)), eye(d));
    }
  }
});

test('shift: X|j> = |j+1 mod d>, X^d = I, and X^m is not I for 0 < m < d', () => {
  for (const d of ALL) {
    for (let j = 0; j < d; j++) closeS(q.matVec(s.shift(d), s.level(d, j)), s.level(d, (j + 1) % d));
    closeM(s.power(s.shift(d), d), eye(d));
    for (let m = 1; m < d; m++) assert.ok(q.abs2(s.power(s.shift(d), m)[0][0]) < 1e-24);
  }
});

test('clock: Z|j> = w^j |j>, Z^d = I, and the phase step of 360/d degrees is Z exactly', () => {
  for (const d of ALL) {
    for (let j = 0; j < d; j++) closeS(q.matVec(s.clock(d), s.level(d, j)), s.level(d, j).map((a) => q.mul(a, s.omegaPow(d, j))));
    closeM(s.power(s.clock(d), d), eye(d));
  }
  for (const d of LEVELS) for (let m = 0; m < d; m++) {
    const step = s.phaseStep(d, (360 * m) / d);
    closeM(step, s.power(s.clock(d), m));
    step.forEach((row, j) => assert.deepEqual(row[j], s.omegaPow(d, j * m))); // the same numbers, not just close
  }
});

test('clock and shift do not commute: ZX = w XZ (Wilde 3.215)', () => {
  for (const d of ALL) {
    const zx = q.matMul(s.clock(d), s.shift(d)), xz = q.matMul(s.shift(d), s.clock(d));
    closeM(zx, xz.map((row) => row.map((x) => q.mul(s.omegaPow(d, 1), x))));
  }
});

test('Fourier gate: F|j> = (1/sqrt d) sum_k w^{jk} |k>, and F|0> has d equal amplitudes 1/sqrt d', () => {
  for (const d of ALL) {
    for (let j = 0; j < d; j++) {
      const out = q.matVec(s.fourier(d), s.level(d, j));
      out.forEach((a, k) => closeC(a, q.scale(s.omegaPow(d, j * k), 1 / Math.sqrt(d))));
    }
    q.matVec(s.fourier(d), s.level(d, 0)).forEach((a) => closeC(a, q.c(1 / Math.sqrt(d))));
  }
});

test('a qubit is the case d = 2: shift is X, clock is Z, Fourier is H, the phase step is P(t)', () => {
  closeM(s.shift(2), q.X); closeM(s.clock(2), q.Z); closeM(s.fourier(2), q.H);
  for (const deg of degrees) closeM(s.phaseStep(2, deg), q.P(rad(deg)));
});

test('Fourier turns shifts into clocks: F X F^dagger = Z, so F^dagger Z^m F = X^m (Wilde ex. 3.7.8)', () => {
  for (const d of ALL) {
    const F = s.fourier(d), Fd = q.dagger(F);
    closeM(q.matMul(q.matMul(F, s.shift(d)), Fd), s.clock(d));
    for (let m = 0; m < d; m++) closeM(q.matMul(q.matMul(Fd, s.power(s.clock(d), m)), F), s.power(s.shift(d), m));
  }
});

test('Fourier squared: F^2|j> = |-j mod d>, F^4 = I, and F is its own inverse only for d = 2', () => {
  for (const d of ALL) {
    const F2 = s.power(s.fourier(d), 2);
    for (let j = 0; j < d; j++) closeS(q.matVec(F2, s.level(d, j)), s.level(d, mod(-j, d)));
    closeM(s.power(s.fourier(d), 4), eye(d));
    const selfInverse = q.abs(q.sub(F2[1][1], q.c(1))) < 1e-9;
    assert.equal(selfInverse, d === 2);
  }
});

// ---- The tool's circuit

test('prepared: started as 0, a Fourier gate, then the phase step gives amplitude e^{ijt}/sqrt d for level j', () => {
  for (const d of LEVELS) for (const deg of degrees) {
    const st = s.prepared(d, deg);
    st.forEach((a, j) => closeC(a, q.scale(q.expi(rad(j * deg)), 1 / Math.sqrt(d))));
    close(q.norm2(st), 1);
  }
});

test('Born rule: the odds add to 1, with and without the inverse Fourier gate, for every d and slider value', () => {
  for (const d of LEVELS) for (const deg of degrees) for (const undo of [true, false]) {
    const p = s.odds(d, deg, undo);
    assert.equal(p.length, d);
    close(p.reduce((a, b) => a + b, 0), 1, 1e-11); // odds are rounded to 12 places
    p.forEach((x) => assert.ok(x >= 0 && x <= 1));
  }
});

test('measured right away: every result has chance 1/d, whatever the step (the step only turns amplitudes)', () => {
  for (const d of LEVELS) for (const deg of degrees) s.odds(d, deg, false).forEach((p) => close(p, 1 / d, 1e-12));
});

test('after the inverse Fourier gate: p(k) = sin^2(d x/2) / (d^2 sin^2(x/2)), x = t - 360k/d', () => {
  for (const d of LEVELS) for (const deg of degrees) {
    const p = s.odds(d, deg, true);
    for (let k = 0; k < d; k++) {
      close(p[k], s.oddsFormula(d, deg, k), 1e-11);
      const sum = Array.from({ length: d }, (_, j) => q.expi(j * rad(deg - (360 * k) / d))).reduce(q.add, q.c(0));
      close(p[k], q.abs2(sum) / (d * d), 1e-11);
    }
  }
});

test('clock steps: a step of m * 360/d gives m every time after the inverse Fourier gate, with exact odds', () => {
  for (const d of LEVELS) for (let m = 0; m < d; m++) {
    const deg = (360 * m) / d, want = Array.from({ length: d }, (_, k) => (k === m ? 1 : 0));
    assert.deepEqual(s.odds(d, deg, true), want);
    assert.equal(s.certain(d, deg, true), m);
    assert.equal(s.clockPower(d, deg), m);
  }
  assert.deepEqual(s.odds(3, 360, true), [1, 0, 0]);
  assert.equal(s.certain(3, 360, true), 0);
});

test('between clock steps no result is certain, and nothing is certain when measured right away', () => {
  for (const d of LEVELS) for (const deg of degrees) {
    assert.equal(s.certain(d, deg, false), null);
    if (s.clockPower(d, deg) === null) assert.equal(s.certain(d, deg, true), null);
  }
});

test('a qubit reduces to the Phase stop: H, P(t), H gives P(0) = cos^2(t/2)', () => {
  for (const deg of degrees) {
    close(s.odds(2, deg, true)[0], Math.cos(rad(deg) / 2) ** 2, 1e-11);
    const viaQubit = q.probs(q.matVec(q.H, q.matVec(q.P(rad(deg)), q.matVec(q.H, q.ket0()))));
    close(s.odds(2, deg, true)[0], viaQubit[0], 1e-11);
  }
});

test('symmetry: one more clock step moves every chance up by one result; the mirror step mirrors the results', () => {
  for (const d of LEVELS) for (const deg of degrees) {
    const p = s.odds(d, deg, true), up = s.odds(d, deg + 360 / d, true), back = s.odds(d, 360 - deg, true);
    for (let k = 0; k < d; k++) {
      close(up[(k + 1) % d], p[k], 1e-11);
      close(back[mod(-k, d)], p[k], 1e-11);
    }
  }
});

test('global phase cannot be seen: e^{ig} times the state gives the same odds, with or without the last gate', () => {
  for (const d of LEVELS) for (const deg of [0, 45, 120, 200]) for (const g of [33, 90, 180, 271]) {
    const turned = s.prepared(d, deg).map((a) => q.mul(q.expi(rad(g)), a));
    const p = q.probs(q.matVec(q.dagger(s.fourier(d)), turned));
    p.forEach((x, k) => close(x, s.odds(d, deg, true)[k], 1e-11));
    q.probs(turned).forEach((x, k) => close(x, s.odds(d, deg, false)[k], 1e-11));
  }
});

// ---- The picture: contributions drawn head to tail

test('contributions: d parts of size 1/d that add up to the amplitude; right away, one part, the amplitude', () => {
  for (const d of LEVELS) for (const deg of degrees.filter((x) => x % 5 === 0 || x % 7 === 0)) {
    const fin = s.final(d, deg, true);
    for (let k = 0; k < d; k++) {
      const parts = s.contributions(d, deg, k, true);
      assert.equal(parts.length, d);
      parts.forEach((p, j) => closeC(p, q.scale(q.expi(j * rad(deg - (360 * k) / d)), 1 / d)));
      closeC(parts.reduce(q.add, q.c(0)), fin[k]);
      const now = s.contributions(d, deg, k, false);
      assert.equal(now.length, 1);
      closeC(now[0], s.prepared(d, deg)[k]);
    }
  }
});

test('contributions at a clock step: they line up for the result m and close a loop (sum 0) for the rest', () => {
  for (const d of LEVELS) for (let m = 0; m < d; m++) {
    const deg = (360 * m) / d;
    for (let k = 0; k < d; k++) {
      const parts = s.contributions(d, deg, k, true);
      if (k === m) parts.forEach((p) => closeC(p, q.c(1 / d)));
      else closeC(parts.reduce(q.add, q.c(0)), q.c(0));
    }
  }
});

test('chain: starts at 0, ends at the amplitude, and stays inside the ring of size 1', () => {
  for (const d of LEVELS) for (const deg of [0, 17, 60, 120, 199, 300]) for (let k = 0; k < d; k++) for (const undo of [true, false]) {
    const parts = s.contributions(d, deg, k, undo), pts = s.chain(parts);
    assert.equal(pts.length, parts.length + 1);
    assert.deepEqual(pts[0], q.c(0));
    closeC(pts[pts.length - 1], s.final(d, deg, undo)[k]);
    pts.forEach((p, j) => assert.ok(q.abs(p) <= (undo ? j / d : 1) + 1e-12));
  }
});

// ---- Presets and changing d

test('presets: d steps, 0 and the multiples of 360/d, all whole degrees on the slider', () => {
  for (const d of LEVELS) {
    const ps = s.presets(d);
    assert.equal(ps.length, d);
    ps.forEach((deg, m) => { assert.ok(Number.isInteger(deg)); assert.ok(deg >= s.STEP.min && deg < s.STEP.max); assert.equal(s.clockPower(d, deg), m); });
  }
  assert.deepEqual(s.presets(3), [0, 120, 240]);
  assert.deepEqual(s.presets(5), [0, 72, 144, 216, 288]);
});

test('carryStep: Z^m stays Z^(m mod d) when d changes, other steps keep their angle', () => {
  assert.equal(s.carryStep(3, 4, 120), 90);
  assert.equal(s.carryStep(2, 6, 180), 60);
  assert.equal(s.carryStep(5, 3, 288), 120); // Z^4 with d = 3 is Z^1
  assert.equal(s.carryStep(3, 2, 0), 0);
  assert.equal(s.carryStep(3, 5, 360), 0);
  assert.equal(s.carryStep(3, 4, 50), 50);
  for (const a of LEVELS) for (const b of LEVELS) for (const deg of s.presets(a)) {
    const out = s.carryStep(a, b, deg);
    assert.equal(s.clockPower(b, out), mod(s.clockPower(a, deg)!, b));
  }
});

// ---- Shots

test('pick: result k takes a share p(k) of the draws u, and never a result with chance 0', () => {
  const N = 1200;
  for (const d of LEVELS) for (const deg of [0, 30, 72, 100, 120, 250]) for (const undo of [true, false]) {
    const p = s.odds(d, deg, undo);
    const us = Array.from({ length: N }, (_, i) => (i + 0.5) / N); // evenly spread draws
    const n = s.tally(us, p);
    n.forEach((x, k) => { assert.ok(Math.abs(x - N * p[k]) <= 1, `d ${d} step ${deg} result ${k}: ${x} vs ${N * p[k]}`); if (p[k] === 0) assert.equal(x, 0); });
  }
  assert.equal(s.pick([0, 1, 0], 0.9999999999999999), 1);
  assert.equal(s.pick([0.5, 0.5 - 1e-13, 0], 0.9999999999999999), 1); // float dust can not reach a zero-chance result
});

test('tally: counts add to n, and a copy moves only when the odds pass its draw', () => {
  const rand = q.rng(7), us = Array.from({ length: s.SHOTS }, rand);
  for (const d of LEVELS) for (const deg of [0, 40, 120]) {
    const n = s.tally(us, s.odds(d, deg, true));
    assert.equal(n.reduce((a, b) => a + b, 0), s.SHOTS);
    assert.equal(s.tally(us, s.odds(d, deg, true), 10).reduce((a, b) => a + b, 0), 10);
  }
  // A clock step: every copy gives m.
  assert.deepEqual(s.tally(us, s.odds(3, 120, true)), [0, s.SHOTS, 0]);
  // Same draws, same odds, same results: nothing is re-rolled.
  assert.deepEqual(s.tally(us, s.odds(4, 33, true)), s.tally(us, s.odds(4, 33, true)));
});

// ---- Layout

test('layout: rings and piles fit the width at every d, piles hold every shot, nothing overlaps', () => {
  for (const d of LEVELS) for (const w of [240, 272, 320, 400, 560, 700, 900, 1200]) {
    const L = s.layout(w, d), { rings, piles } = L;
    assert.equal(rings.at.length, d); assert.equal(piles.x.length, d);
    assert.ok(rings.cols * rings.rows >= d && rings.cols * rings.cell <= w + 1e-9);
    assert.ok(rings.R > 30);
    rings.at.forEach(([x, y]) => { assert.ok(x - rings.R >= 0 && x + rings.R <= w); assert.ok(y - rings.R >= 0 && y + rings.R < piles.top); });
    assert.ok(piles.cols * piles.rows >= s.SHOTS);
    const wide = piles.cols * piles.pitch;
    piles.x.forEach((x, k) => { assert.ok(x >= 0 && x + wide <= w); if (k && piles.dy[k] === piles.dy[k - 1]) assert.ok(x - piles.x[k - 1] >= wide); });
    assert.ok(piles.pitch >= 3 && piles.base > piles.top && L.h > piles.labelY + piles.dy[d - 1]);
    assert.ok(rings.rows <= 3);
    if (w < 300) assert.ok(rings.R > 50); // big enough to see each contribution on a phone
    // One row of rings: each pile sits right under its ring.
    if (rings.rows === 1) piles.x.forEach((x, k) => close(x + wide / 2, rings.at[k][0], 1e-9));
  }
});

// ---- Words

test('words: the readout names the start state, the gates, the odds and the counts, with no em dash', () => {
  const r = s.readout(3, 120, true, [0, 120, 0]);
  assert.match(r, /^A qutrit, d = 3\. Started as 0, a Fourier gate gives 3 equal amplitudes of size 0\.58\./);
  assert.match(r, /the clock gate Z/);
  assert.match(r, /gives 1 every time/);
  assert.match(r, /For 0 and 2, the 3 contributions add head to tail back to 0 and cancel\./);
  assert.match(r, /This batch of 120 copies: 0 gave 0, 120 gave 1, 0 gave 2\.$/);
  assert.match(s.readout(2, 90, true), /Hadamard gate/);
  assert.match(s.readout(2, 30, false), /both results have the same chance, 50%/);
  // d = 4 and d = 6: start state, equal amplitudes, the certain result and the cancelling results.
  const r4 = s.readout(4, 180, true, [0, 0, 120, 0]);
  assert.match(r4, /^A qudit with 4 levels, d = 4\. Started as 0, a Fourier gate gives 4 equal amplitudes of size 0\.50\./);
  assert.match(r4, /gives 2 every time: the 4 contributions to the amplitude for 2 line up\./);
  assert.match(r4, /For 0, 1 and 3, the 4 contributions add head to tail back to 0 and cancel\./);
  assert.match(r4, /This batch of 120 copies: 0 gave 0, 0 gave 1, 120 gave 2, 0 gave 3\.$/);
  const r6 = s.readout(6, 300, true);
  assert.match(r6, /^A qudit with 6 levels, d = 6\. Started as 0, a Fourier gate gives 6 equal amplitudes of size 0\.41\./);
  assert.match(r6, /gives 5 every time/);
  assert.match(r6, /For 0, 1, 2, 3 and 4, the 6 contributions add head to tail back to 0 and cancel\./);
  assert.match(s.readout(6, 25, false), /all 6 results have the same chance, 17%, whatever the step/);
  assert.match(s.readout(4, 45, true), /0 with chance \d+%.*3 with chance \d+%\. The contributions only partly line up\./);
  assert.equal(s.valueText(3, 1, false), '1 degree. Measured right away: each result 33%.');
  assert.match(s.readout(4, 30, false), /all 4 results have the same chance, 25%, whatever the step/);
  assert.match(s.readout(3, 60, true), /0 with chance 44%, 1 with chance 44%, 2 with chance 11%/);
  for (const d of LEVELS) for (const deg of [0, 45, 60, 72, 90, 120, 180, 359]) for (const undo of [true, false]) {
    const counts = s.tally(Array.from({ length: s.SHOTS }, (_, i) => (i + 0.5) / s.SHOTS), s.odds(d, deg, undo));
    for (const t of [s.readout(d, deg, undo, counts), s.valueText(d, deg, undo), s.circuitText(deg, undo)]) {
      assert.ok(!t.includes('—'), t);
      assert.ok(!/chance 0%|chance 100%|result 0%|result 100%|, 0%|, 100%/.test(t), t); // never a false 0% or 100%
    }
    assert.match(s.readout(d, deg, undo), /Started as 0/);
  }
});

test('words: names of systems and gates', () => {
  assert.equal(s.kind(2), 'qubit'); assert.equal(s.kind(3), 'qutrit'); assert.equal(s.kind(5), 'qudit with 5 levels');
  assert.equal(s.gateName(3, 0), 'no change at all');
  assert.equal(s.gateName(3, 120), 'the clock gate Z');
  assert.equal(s.gateName(6, 180), 'Z³, the clock gate 3 times');
  assert.match(s.gateName(2, 180)!, /Pauli Z/);
  assert.equal(s.gateName(4, 100), null);
  assert.equal(s.valueText(3, 120, true), '120 degrees, the clock gate Z. Gives 1 every time.');
  assert.equal(s.valueText(3, 60, true), '60 degrees. Most likely 0 or 1, 44% each.');
  assert.equal(s.valueText(4, 10, false), '10 degrees. Measured right away: each result 25%.');
  assert.deepEqual(s.likeliest([0.2, 0.4, 0.4]), [1, 2]);
  assert.match(s.circuitText(120, false), /phase step of 120°, then measure/);
});
