import test from 'node:test';
import assert from 'node:assert/strict';
import * as q from '../quantum.ts';
import {
  BUMPS, STRENGTH, PHASES, PER, SHOTS, AXIS, PAD, TOP, BOTTOM,
  turn, perBump, overlap, bumpsPerE, shownOverlap, particleStates, joint, atEnd, zeroChance, reduced, reducedFormula,
  blochOf, purity, eigen, chance0, distinguish, bestGuess, draws, result, zeros, order, rate,
  percent, particles, stripesText, recordText, setup, verdict, report, bumpsValueText, strengthValueText,
  layout, xOf, ySlot, yCount,
} from './decoherence.ts';

const close = (a: number, b: number, eps = 1e-12) => assert.ok(Math.abs(a - b) < eps, `${a} != ${b}`);
const closeC = (a: q.C, b: q.C, eps = 1e-12) => { close(a.re, b.re, eps); close(a.im, b.im, eps); };
const closeM = (a: q.Matrix, b: q.Matrix, eps = 1e-12) => a.forEach((row, i) => row.forEach((x, j) => closeC(x, b[i][j], eps)));
const RAD = Math.PI / 180;
const S2 = Math.SQRT1_2;
// Small n for the full state (2^(n+1) amplitudes), and strengths across the slider.
const smallN = [0, 1, 2, 3, 4, 5, 6];
const strengths = [0, 5, 20, 45, 90, 135, 175, 180];

// ---- The model

test('sliders: whole steps, start values inside the range, 25 phase columns 15 degrees apart from 0 to 360', () => {
  assert.ok(BUMPS.min <= BUMPS.start && BUMPS.start <= BUMPS.max && BUMPS.step === 1);
  assert.ok(STRENGTH.min <= STRENGTH.start && STRENGTH.start <= STRENGTH.max && STRENGTH.max === 180);
  assert.equal((STRENGTH.max - STRENGTH.min) % STRENGTH.step, 0);
  assert.equal(PHASES.length, 25); assert.equal(PHASES[0], 0); assert.equal(PHASES.at(-1), 360);
  PHASES.forEach((p, i) => assert.equal(p, 15 * i));
  assert.equal(SHOTS, 25 * PER);
});

test('one bump is a controlled RY: |0> leaves the particle alone, |1> turns it, and the qubit itself is not flipped', () => {
  for (const d of strengths) {
    const from0 = q.controlled(q.basis(2, 0b00), q.RY(turn(d)), [0], 1);
    from0.forEach((a, i) => closeC(a, q.c(i === 0 ? 1 : 0)));
    const from1 = q.controlled(q.basis(2, 0b10), q.RY(turn(d)), [0], 1);
    closeC(from1[0b10], q.c(Math.cos(turn(d) / 2))); closeC(from1[0b11], q.c(Math.sin(turn(d) / 2)));
    close(q.probOne(from1, 0), 1);
  }
});

test('the particles\' two states: |E0> = |0...0>, |E1> = (RY|0>)^n, both normalized, overlap cos^n(theta/2)', () => {
  for (const n of smallN) for (const d of strengths) {
    const [e0, e1] = particleStates(n, d);
    assert.equal(e0.length, 2 ** n); assert.equal(e1.length, 2 ** n);
    close(q.norm2(e0), 1); close(q.norm2(e1), 1);
    closeC(e0[0], q.c(1));
    const ov = q.inner(e0, e1);
    close(ov.im, 0); close(ov.re, Math.cos(turn(d) / 2) ** n);
    close(ov.re, overlap(n, d));
  }
});

test('the joint state is (|0>|E0> + |1>|E1>)/sqrt2, normalized: Schlosshauer eq. (1)', () => {
  for (const n of smallN) for (const d of strengths) {
    const s = joint(n, d), [e0, e1] = particleStates(n, d), half = 2 ** n;
    close(q.norm2(s), 1);
    for (let e = 0; e < half; e++) { closeC(s[e], q.scale(e0[e], S2)); closeC(s[half + e], q.scale(e1[e], S2)); }
  }
});

test('overlap: 1 with no bump or no turn, exactly 0 after any full-record bump, and it multiplies bump by bump', () => {
  for (const d of strengths) assert.equal(overlap(0, d), 1);
  for (const n of [1, 5, 60]) { assert.equal(overlap(n, 0), 1); assert.equal(overlap(n, 180), 0); }
  assert.equal(perBump(180), 0); assert.equal(perBump(0), 1);
  for (const d of strengths) for (let n = 0; n < 60; n++) close(overlap(n + 1, d), overlap(n, d) * perBump(d));
  close(perBump(90), S2); close(perBump(120), 0.5); close(perBump(60), Math.sqrt(3) / 2);
});

test('overlap falls exponentially in the number of bumps: r = e^{-n/nd} (Schlosshauer eq. 7, time counted in bumps)', () => {
  for (const d of [5, 20, 45, 90, 135, 175]) {
    const nd = bumpsPerE(d);
    for (const n of [1, 10, 33, 60]) close(overlap(n, d), Math.exp(-n / nd), 1e-12);
  }
  assert.equal(bumpsPerE(0), Infinity); assert.equal(bumpsPerE(180), 0);
  // Weaker bumps take more of them: nd falls as the strength rises.
  for (let d = 5; d < 175; d += 5) assert.ok(bumpsPerE(d) > bumpsPerE(d + 5));
});

test('known values at the start strength 45 degrees: about 0.924 a bump, 0.45 after 10, 0.02 after 50, under 1% after 60', () => {
  close(perBump(45), Math.cos(22.5 * RAD)); close(perBump(45), 0.9238795325, 1e-9);
  close(overlap(10, 45), 0.4531, 1e-4);
  close(overlap(50, 45), 0.0191, 1e-4);
  assert.ok(overlap(60, 45) < 0.01 && overlap(60, 45) > 0.008);
});

// ---- Interference fades

test('Born rule: the end state is normalized and p(0) + p(1) = 1, for every phase column', () => {
  for (const n of smallN) for (const d of strengths) for (const phi of PHASES) {
    const s = atEnd(n, d, phi);
    close(q.norm2(s), 1);
    const p = q.probs(s), p0 = zeroChance(s);
    close(p.reduce((t, x) => t + x, 0), 1);
    assert.ok(p0 >= 0 && p0 <= 1);
    close(p0 + q.probOne(s, 0), 1);
  }
});

test('the closed form p(0) = (1 + r cos phi)/2 matches the full state, gate by gate (Schlosshauer eq. 5)', () => {
  for (const n of smallN) for (const d of strengths) for (const phi of PHASES) {
    close(zeroChance(atEnd(n, d, phi)), chance0(phi, overlap(n, d)), 1e-12);
  }
});

test('no bump: H P(phi) H on |0> as plain matrices, cos^2(phi/2); all 0 at 0 and 360 degrees, all 1 at 180', () => {
  for (const phi of PHASES) {
    const m = q.matVec(q.H, q.matVec(q.P(phi * RAD), q.matVec(q.H, q.ket0())));
    close(chance0(phi, 1), q.abs2(m[0])); close(chance0(phi, 1), Math.cos((phi * RAD) / 2) ** 2);
  }
  assert.equal(chance0(0, 1), 1); assert.equal(chance0(360, 1), 1); assert.equal(chance0(180, 1), 0);
  close(chance0(90, 1), 0.5); close(chance0(270, 1), 0.5);
});

test('at phi = 0 with no bump, the two contributions to the amplitude for 1 are +1/2 and -1/2 and cancel', () => {
  const viaZero = q.mul(q.H[1][0], q.H[0][0]), viaOne = q.mul(q.H[1][1], q.H[1][0]);
  closeC(viaZero, q.c(0.5)); closeC(viaOne, q.c(-0.5)); closeC(q.add(viaZero, viaOne), q.c(0));
});

test('stripe visibility (max - min)/(max + min) over the phases equals the overlap r', () => {
  for (const n of smallN) for (const d of strengths) {
    const s = PHASES.map((phi) => zeroChance(atEnd(n, d, phi))), hi = Math.max(...s), lo = Math.min(...s);
    close((hi - lo) / (hi + lo), overlap(n, d), 1e-12);
  }
});

test('the 0/1 odds never change: right after the bumps the qubit reads 0 or 1 with chance 1/2 each', () => {
  for (const n of smallN) for (const d of strengths) close(q.probOne(joint(n, d), 0), 0.5);
});

test('a full record: 1/2 at every phase, and qubit result and record are independent', () => {
  for (const n of [1, 2, 4]) for (const phi of PHASES) {
    close(zeroChance(atEnd(n, 180, phi)), 0.5);
    close(chance0(phi, 0), 0.5);
  }
  // One full-record bump acts like a CNOT on its fresh particle: the four (qubit, particle) results each have chance 1/4 after the test.
  for (const phi of PHASES) q.probs(atEnd(1, 180, phi)).forEach((p) => close(p, 0.25));
});

test('symmetries: phi and 360 - phi give the same odds; phi + 180 swaps 0 and 1', () => {
  for (const r of [0, 0.1, 0.45, 0.9, 1]) for (const phi of PHASES.slice(0, 13)) {
    close(chance0(phi, r), chance0(360 - phi, r));
    close(chance0(phi, r), 1 - chance0(phi + 180, r));
  }
});

test('global phase: a phase on both of the qubit\'s amplitudes changes nothing', () => {
  for (const alpha of [0.4, 2, Math.PI]) for (const n of [0, 2, 4]) for (const phi of [0, 45, 180, 300]) {
    let s = q.apply1(joint(n, 45), [[q.expi(alpha), q.c(0)], [q.c(0), q.expi(alpha)]], 0);
    s = q.apply1(q.apply1(s, q.P(phi * RAD), 0), q.H, 0);
    close(zeroChance(s), chance0(phi, overlap(n, 45)));
  }
});

// ---- The qubit alone looks like plain odds

test('the qubit\'s own state (partial trace) is (I + r X)/2, Schlosshauer eq. (4)', () => {
  for (const n of smallN) for (const d of strengths) closeM(reduced(joint(n, d)), reducedFormula(overlap(n, d)));
  // A trace of 1, and its Bloch vector (r, 0, 0): it shrinks toward the middle of the ball along x.
  for (const n of smallN) {
    const rho = reduced(joint(n, 45)), [x, y, z] = blochOf(rho);
    close(rho[0][0].re + rho[1][1].re, 1);
    close(x, overlap(n, 45)); close(y, 0); close(z, 0);
  }
  // No bump: the pure state |+>, the same Bloch vector quantum.ts gives.
  const [bx, by, bz] = q.bloch(q.plus()), [rx, ry, rz] = blochOf(reduced(joint(0, 45)));
  close(rx, bx); close(ry, by); close(rz, bz);
});

test('the qubit\'s own state predicts every test on the qubit alone: tr(rho P(phi)-then-H projector) = p(0)', () => {
  // p(0) = <0| H P rho P^dag H |0>, computed from rho only.
  for (const n of smallN) for (const d of strengths) for (const phi of [0, 30, 90, 200]) {
    const U = q.matMul(q.H, q.P(phi * RAD)), rho = reduced(joint(n, d));
    const out = q.matMul(U, q.matMul(rho, q.dagger(U)));
    close(out[0][0].re, zeroChance(atEnd(n, d, phi)));
  }
});

test('purity (1 + r^2)/2 and eigenvalues (1 +- r)/2, checked against rho itself', () => {
  for (const n of smallN) for (const d of strengths) {
    const r = overlap(n, d), rho = reduced(joint(n, d)), sq = q.matMul(rho, rho);
    close(sq[0][0].re + sq[1][1].re, purity(r));
    const [l1, l2] = eigen(r);
    close(l1 + l2, 1); close(l1 * l2, rho[0][0].re * rho[1][1].re - q.abs2(rho[0][1]));
  }
  close(purity(1), 1); close(purity(0), 0.5);
});

test('a full record leaves rho = I/2, the same as a plain 50/50 mix of |0> and |1>, and of |+> and |->', () => {
  const rho = reduced(joint(3, 180)), mix = (a: q.State, b: q.State): q.Matrix =>
    [0, 1].map((i) => [0, 1].map((j) => q.scale(q.add(q.mul(a[i], q.conj(a[j])), q.mul(b[i], q.conj(b[j]))), 0.5)));
  closeM(rho, [[q.c(0.5), q.c(0)], [q.c(0), q.c(0.5)]]);
  closeM(rho, mix(q.ket0(), q.ket1()));
  closeM(rho, mix(q.plus(), q.minus()));
});

// ---- Information leaks out, and the joint state stays quantum

test('the record: D = sqrt(1 - r^2) is the trace distance of |E0> and |E1>, found from their 2D span', () => {
  for (const n of [1, 2, 3, 5]) for (const d of strengths) {
    const [e0, e1] = particleStates(n, d), r = overlap(n, d);
    // Orthonormal basis {e0, f} of the span, then Delta = (|E0><E0| - |E1><E1|)/2 as a 2x2 real matrix.
    const g = q.inner(e0, e1).re, perp = e1.map((x, i) => q.sub(x, q.scale(e0[i], g))), k = Math.sqrt(q.norm2(perp));
    const b = k < 1e-15 ? 0 : q.inner(perp, e1).re / k;  // e1 = g e0 + b f
    const dA = (1 - g * g) / 2, dB = -(g * b) / 2, dC = -(b * b) / 2;   // Delta = [[dA, dB], [dB, dC]]
    const tr = dA + dC, det = dA * dC - dB * dB, disc = Math.sqrt(Math.max(0, tr * tr / 4 - det));
    const traceNorm = Math.abs(tr / 2 + disc) + Math.abs(tr / 2 - disc);
    close(traceNorm, distinguish(r), 1e-9);
  }
});

test('complementarity: the Englert bound V^2 + D^2 <= 1 (1996) holds with equality here, because the joint state is pure, from no record (50% guess) to a full one (100%)', () => {
  for (const n of [0, 1, 7, 20, 60]) for (const d of strengths) {
    const r = overlap(n, d);
    close(r * r + distinguish(r) ** 2, 1);
    close(bestGuess(r), (1 + distinguish(r)) / 2);
  }
  assert.equal(bestGuess(1), 0.5); assert.equal(bestGuess(0), 1);
  // More bumps: fewer stripes, a better guess.
  for (let n = 0; n < 60; n++) { assert.ok(overlap(n + 1, 45) < overlap(n, 45)); assert.ok(bestGuess(overlap(n + 1, 45)) >= bestGuess(overlap(n, 45))); }
});

test('the guess is real: measure the qubit 0/1 and the particle in the best basis, and they match (1 + D)/2 of the time', () => {
  // One particle, so the joint state has 4 amplitudes. The Helstrom basis for two real states at angles 0 and t/2
  // is the pair of directions at t/4 - 45 and t/4 + 45 degrees: halfway between, split by a right angle.
  for (const d of strengths) {
    const s = joint(1, d), a = (turn(d) / 4) - Math.PI / 4;
    const g0: q.State = [q.c(Math.cos(a)), q.c(Math.sin(a))], g1: q.State = [q.c(-Math.sin(a)), q.c(Math.cos(a))];
    let match = 0;
    for (const [bit, gs] of [[0, g0], [1, g1]] as const) {
      const amp = q.add(q.mul(q.conj(gs[0]), s[2 * bit]), q.mul(q.conj(gs[1]), s[2 * bit + 1]));
      match += q.abs2(amp);
    }
    close(match, bestGuess(overlap(1, d)), 1e-12);
  }
});

test('pointer states: started as 0 or as 1 with no Hadamard, the bumps make no entanglement and change nothing on the qubit', () => {
  for (const start of [0, 1]) for (const n of [1, 3, 5]) for (const d of strengths) {
    let s = q.basis(n + 1, start === 0 ? 0 : 2 ** n);
    for (let k = 1; k <= n; k++) s = q.controlled(s, q.RY(turn(d)), [0], k);
    const rho = reduced(s), sq = q.matMul(rho, rho);
    close(sq[0][0].re + sq[1][1].re, 1); // pure: no entanglement
    close(rho[start][start].re, 1);
  }
});

test('undo: running every bump backwards returns the joint state to |+>|0...0>, and the full stripes come back', () => {
  for (const n of smallN) for (const d of strengths) {
    const s = joint(n, d, true), want = q.tensor(q.plus(), q.basis(n, 0));
    s.forEach((a, i) => closeC(a, want[i]));
    for (const phi of PHASES) close(zeroChance(atEnd(n, d, phi, true)), chance0(phi, 1));
    assert.equal(shownOverlap(n, d, true), 1); assert.equal(shownOverlap(n, d, false), overlap(n, d));
  }
});

test('a plain mix cannot be undone: a coin-flip qubit (|0> or |1>), bumped and un-bumped, stays at 1/2 at every phase', () => {
  for (const n of [1, 3]) for (const d of [45, 180]) for (const phi of PHASES) {
    let p0 = 0;
    for (const start of [0, 2 ** n]) {
      let s = q.basis(n + 1, start);
      for (let k = 1; k <= n; k++) s = q.controlled(s, q.RY(turn(d)), [0], k);
      for (let k = n; k >= 1; k--) s = q.controlled(s, q.RY(-turn(d)), [0], k);
      s = q.apply1(q.apply1(s, q.P(phi * RAD), 0), q.H, 0);
      p0 += zeroChance(s) / 2;
    }
    close(p0, 0.5);
  }
});

test('a phase gate on the qubit commutes with every bump, so where the phase sits does not matter', () => {
  for (const n of [1, 3]) for (const d of [45, 135]) for (const phi of [30, 180]) {
    let early = q.apply1(q.apply1(q.basis(n + 1, 0), q.H, 0), q.P(phi * RAD), 0);
    for (let k = 1; k <= n; k++) early = q.controlled(early, q.RY(turn(d)), [0], k);
    const late = q.apply1(joint(n, d), q.P(phi * RAD), 0);
    early.forEach((a, i) => closeC(a, late[i]));
  }
});

// ---- Shots

test('shots: a draw below p(0) reads 0, so each shot follows the Born rule; p = 1 always gives 0, p = 0 always 1', () => {
  assert.equal(result(0, 1), 0); assert.equal(result(0.999999, 1), 0);
  assert.equal(result(0, 0), 1); assert.equal(result(0.5, 0.5), 1); assert.equal(result(0.4999, 0.5), 0);
  const us = [0.1, 0.3, 0.5, 0.7, 0.9];
  assert.equal(zeros(us, 0), 0); assert.equal(zeros(us, 1), 5); assert.equal(zeros(us, 0.6), 3);
});

test('a batch: PER draws per column in [0, 1); counts follow p(0) within 5 sigma over 20000 seeded shots', () => {
  const b = draws(q.rng(7));
  assert.equal(b.length, PHASES.length); b.forEach((col) => { assert.equal(col.length, PER); col.forEach((u) => assert.ok(u >= 0 && u < 1)); });
  const R = q.rng(42), N = 20000;
  for (const p of [0.5, chance0(0, 0.45), chance0(120, 0.45), 0.05]) {
    const us = Array.from({ length: N }, () => R()), k = zeros(us, p), sigma = Math.sqrt(N * p * (1 - p));
    assert.ok(Math.abs(k - N * p) < 5 * sigma, `${k} vs ${N * p}`);
  }
});

test('keeping draws: fewer stripes never move a column\'s count away from the coin-flip half', () => {
  const b = draws(q.rng(3));
  for (let col = 0; col < PHASES.length; col++) {
    const phi = PHASES[col];
    let last = zeros(b[col], chance0(phi, 1));
    for (let n = 1; n <= 60; n++) {
      const now = zeros(b[col], chance0(phi, overlap(n, 45)));
      // p(0) slides monotonically toward 1/2, so the count never moves away from the count at p = 1/2.
      const mid = zeros(b[col], 0.5);
      assert.ok(Math.abs(now - mid) <= Math.abs(last - mid));
      last = now;
    }
  }
});

test('landing order: every (column, shot) pair exactly once', () => {
  const o = order(q.rng(5)), seen = new Set(o.map(([c, k]) => `${c},${k}`));
  assert.equal(o.length, SHOTS); assert.equal(seen.size, SHOTS);
  o.forEach(([c, k]) => assert.ok(c >= 0 && c < PHASES.length && k >= 0 && k < PER));
});

test('landing rate: starts slow, never falls, caps at 400 per second, and a batch lands in under 4 seconds', () => {
  assert.equal(rate(0), 6);
  for (let k = 0; k < SHOTS; k++) assert.ok(rate(k + 1) >= rate(k) && rate(k) <= 400);
  const secs = Array.from({ length: SHOTS }, (_, k) => 1 / rate(k)).reduce((a, b) => a + b, 0);
  assert.ok(secs < 4, `${secs}`);
});

// ---- Words

test('percent: whole from 1% to 99%, one decimal near the ends, never a false 0% or 100%', () => {
  assert.equal(percent(0), '0%'); assert.equal(percent(1), '100%');
  assert.equal(percent(0.5), '50%'); assert.equal(percent(0.4531), '45%'); assert.equal(percent(0.0191), '2%');
  assert.equal(percent(0.0087), '0.9%'); assert.equal(percent(0.0001), 'under 0.1%');
  assert.equal(percent(0.996), '99.6%'); assert.equal(percent(0.99999), 'over 99.9%');
  assert.equal(percent(0.9239), '92%');
  for (let k = 1; k < 10000; k++) {
    const s = percent(k / 10000);
    assert.notEqual(s, '0%'); assert.notEqual(s, '100%'); assert.notEqual(s, '0.0%'); assert.notEqual(s, '100.0%');
  }
});

test('readouts name the start state and the setup, and say the right verdict', () => {
  for (const n of [0, 1, 12, 60]) for (const d of strengths) for (const undo of [false, true]) {
    const s = report(n, d, undo);
    assert.ok(s.startsWith('Started as 0, then a Hadamard gate'), s);
    assert.ok(!s.includes('—'), 'no em dashes');
    assert.ok(!/\bwatch|\blook at|both at once/i.test(s), s);
  }
  assert.equal(setup(0, 45, false), 'Started as 0, then a Hadamard gate, no bumps, then a phase φ and a second Hadamard.');
  assert.equal(setup(1, 45, false), 'Started as 0, then a Hadamard gate, one bump of strength 45°, then a phase φ and a second Hadamard.');
  assert.ok(setup(12, 45, true).includes('12 bumps of strength 45°, then every bump undone'));
  assert.ok(verdict(0, 45, false).includes('every shot reads 0'));
  assert.ok(verdict(10, 0, false).includes('no record'));
  assert.ok(verdict(10, 45, true).includes('full stripes return'));
  // Undoing is possible in the ideal model; real surroundings make it hopeless in practice, not impossible in principle.
  assert.ok(verdict(10, 45, true).includes('hopeless in practice')); assert.ok(!verdict(10, 45, true).includes('never allow'));
  assert.ok(verdict(3, 180, false).includes('exactly like a plain coin flip'));
  assert.ok(verdict(10, 45, false).startsWith('Stripes left: 45%.'));
  assert.ok(verdict(10, 45, false).includes(`${percent(bestGuess(overlap(10, 45)))} of the time`));
  assert.ok(verdict(60, 45, false).includes('almost exactly like a plain coin flip'));
  assert.ok(!verdict(30, 45, false).includes('coin flip'));
  assert.ok(report(5, 45, false, [17, 3]).endsWith(`at φ = 0°, 17 of ${PER} shots read 0; at φ = 180°, 3 of ${PER}.`));
});

test('readout verdicts match the physics they claim', () => {
  // "every shot reads 0 at 0 degrees" only where p(0) is exactly 1; "equal chance at every phase" only where r is exactly 0.
  for (const n of [0, 1, 12, 60]) for (const d of strengths) for (const undo of [false, true]) {
    const v = verdict(n, d, undo), r = shownOverlap(n, d, undo);
    if (v.includes('every shot reads 0')) assert.equal(chance0(0, r), 1);
    if (v.includes('No stripes are left')) PHASES.forEach((phi) => assert.equal(chance0(phi, r), 0.5));
    if (v.includes('almost exactly')) assert.ok(r > 0 && r < 0.01);
  }
});

test('stats and slider texts', () => {
  assert.equal(particles(0), 'no particles'); assert.equal(particles(1), '1 particle'); assert.equal(particles(12), '12 particles');
  assert.equal(stripesText(1), '100%'); assert.equal(stripesText(overlap(10, 45)), '45%');
  assert.equal(recordText(1), 'none (a blind guess, 50%)'); assert.equal(recordText(0), 'best guess right 100%');
  assert.equal(recordText(overlap(10, 45)), `best guess right ${percent(bestGuess(overlap(10, 45)))}`);
  assert.equal(bumpsValueText(10, 45, false), '10 particles. Stripes left: 45%.');
  assert.equal(bumpsValueText(10, 45, true), '10 particles. Stripes left: 100%, bumps undone.');
  assert.equal(strengthValueText(45), '45 degrees. Each bump keeps 92% of the stripes.');
  assert.equal(strengthValueText(180), '180 degrees. One bump leaves a full record.');
  assert.equal(strengthValueText(0), '0 degrees. A bump leaves no record.');
});

// ---- Layout

test('layout: 25 columns fit inside the canvas from 240 px up, dots fit their slots, and the theory line meets the slots', () => {
  for (const w of [240, 288, 320, 480, 640, 900]) {
    const L = layout(w);
    assert.ok(xOf(L, 0) - L.colW / 2 >= AXIS - 1e-9);
    assert.ok(xOf(L, 360) + L.colW / 2 <= w - PAD + 1e-9);
    assert.ok(2 * L.r < L.colW && 2 * L.r < L.pitch && L.r > 1.5);
    close(ySlot(L, PER - 1) - L.pitch / 2, TOP);
    close(ySlot(L, 0) + L.pitch / 2, L.base);
    close(yCount(L, PER), TOP); close(yCount(L, 0), L.base);
    close(L.h, L.base + BOTTOM);
    // Column c sits at phase 15c.
    PHASES.forEach((phi, c) => close(xOf(L, phi), L.x0 + (c + 0.5) * L.colW));
  }
});
