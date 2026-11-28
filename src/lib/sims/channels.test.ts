import test from 'node:test';
import assert from 'node:assert/strict';
import * as q from '../quantum.ts';
import {
  KINDS, SHOTS, THETA, CHANNELS,
  trace, traceC, outer, gap, num, pointText, startKet, startPoint, startText, shrinkWeights, krausOps, completeness, keepsTrace, applyMap,
  pointOf, output, circleImage, jumps, lostChance, pick, batch, tally, pairOutput, hermitianEigenvalues, pairEigenvalues, pairVerdict,
  valueText, valueShort, describe, type Kind,
} from './channels.ts';

const close = (a: number, b: number, eps = 1e-12) => assert.ok(Math.abs(a - b) < eps, `${a} != ${b}`);
const closeM = (a: q.Matrix, b: q.Matrix, eps = 1e-12) => assert.ok(gap(a, b) < eps, `matrices differ by ${gap(a, b)}`);
const madd = (a: q.Matrix, b: q.Matrix): q.Matrix => a.map((r, i) => r.map((x, j) => q.add(x, b[i][j])));
const mscale = (m: q.Matrix, k: number): q.Matrix => m.map((r) => r.map((x) => q.scale(x, k)));
const conjBy = (u: q.Matrix, rho: q.Matrix) => q.matMul(q.matMul(u, rho), q.dagger(u));
const S = (m: number[][]): q.Matrix => m.map((r) => r.map((x) => q.c(x)));
const S2 = Math.SQRT1_2;

// Slider values worth testing for each kind.
const VALUES: Record<Kind, number[]> = {
  gate: [0, 5, 45, 90, 135, 180, 270, 355],
  flip: [0, 1, 25, 50, 75, 99, 100],
  damp: [0, 1, 25, 50, 75, 99, 100],
  shrink: [-33, -20, -1, 0, 1, 50, 99, 100],
  drop: [0, 1, 25, 50, 75, 99, 100],
};
const THETAS = [0, 45, 90, 135, 180, 225, 270, 315, 30];
// Maps that keep trace and have Kraus operators (shrink only for λ ≥ −1/3, where it is completely positive).
const TP: Kind[] = ['gate', 'flip', 'damp', 'shrink'];

// ---- Start state

test('the start state is cos(theta/2)|0> + sin(theta/2)|1>: |0>, |+>, |1>, |−> at 0, 90, 180, 270', () => {
  const [a, b, c1, d] = [0, 90, 180, 270].map(startKet);
  close(a[0].re, 1); close(a[1].re, 0);
  close(b[0].re, S2); close(b[1].re, S2);
  close(c1[0].re, 0); close(c1[1].re, 1);
  close(d[0].re, -S2); close(d[1].re, S2); // |−> up to a global minus sign
  for (const t of THETAS) close(q.norm2(startKet(t)), 1);
});

test('the start point is (sin theta, cos theta) and matches the Bloch vector of the state', () => {
  for (const t of THETAS) {
    const [x, z] = startPoint(t), [bx, by, bz] = q.bloch(startKet(t));
    close(x, bx); close(by, 0); close(z, bz);
    close(Math.hypot(x, z), 1);
  }
  assert.deepEqual(startPoint(0), [0, 1]);
  assert.deepEqual(startPoint(90), [1, 0]);
  assert.deepEqual(startPoint(180), [0, -1]);
});

test('the start state is the RY turn of |0>', () => {
  for (const t of THETAS) {
    const s = q.matVec(q.RY((t * Math.PI) / 180), q.ket0());
    close(Math.abs(q.inner(s, startKet(t)).re), 1, 1e-9);
  }
});

// ---- Kraus operators and trace

test('every Kraus set that is a channel has sum K†K = I, exactly', () => {
  for (const kind of TP) for (const v of VALUES[kind]) {
    const ops = krausOps(kind, v)!;
    assert.ok(ops && ops.length >= 1);
    closeM(completeness(ops), q.I);
    assert.ok(keepsTrace(ops), `${kind} ${v}`);
  }
});

test('the drop-left-out set has sum K†K = diag(1, 1 − γ), so it is not a channel unless γ = 0', () => {
  for (const v of VALUES.drop) {
    const ops = krausOps('drop', v)!;
    closeM(completeness(ops), S([[1, 0], [0, 1 - v / 100]]));
    assert.equal(keepsTrace(ops), v === 0);
  }
});

test('a channel keeps trace on every matrix, not only on states: tr E(M) = tr M', () => {
  const mats = [outer(startKet(30)), q.I, q.X, q.Z, S([[2, 3], [-1, 5]])];
  for (const kind of TP) for (const v of VALUES[kind]) for (const m of mats) close(trace(applyMap(kind, v, m)), trace(m));
});

test('the number of operators: gate 1, flip 2, damp 2, drop 1, shrink 4 (fewer at the ends); zero weights are left out', () => {
  assert.equal(krausOps('gate', 90)!.length, 1);
  assert.equal(krausOps('flip', 25)!.length, 2);
  assert.equal(krausOps('flip', 0)!.length, 1);
  assert.equal(krausOps('flip', 100)!.length, 1);
  assert.equal(krausOps('damp', 50)!.length, 2);
  assert.equal(krausOps('damp', 0)!.length, 1);
  assert.equal(krausOps('drop', 50)!.length, 1);
  assert.equal(krausOps('shrink', 50)!.length, 4);
  assert.equal(krausOps('shrink', 100)!.length, 1); // lambda = 1: only "do nothing"
  assert.equal(krausOps('shrink', 0)!.length, 4);
});

test('the operator matrices are the textbook ones', () => {
  const [k0, k1] = krausOps('flip', 25)!;
  closeM(k0.m, mscale(q.I, Math.sqrt(0.75))); closeM(k1.m, mscale(q.X, 0.5));
  const [d0, d1] = krausOps('damp', 36)!;
  closeM(d0.m, S([[1, 0], [0, 0.8]])); closeM(d1.m, S([[0, 0.6], [0, 0]]));
  closeM(krausOps('gate', 90)![0].m, q.RY(Math.PI / 2));
});

// ---- Born rule for the doors

test('the chances of the doors add to 1 for every channel and every start state', () => {
  for (const kind of TP) for (const v of VALUES[kind]) for (const t of THETAS) {
    const js = jumps(kind, v, t);
    close(js.reduce((s, j) => s + j.p, 0), 1, 1e-12);
    close(lostChance(js), 0, 1e-12);
    js.forEach((j) => assert.ok(j.p > 0 && j.p <= 1 + 1e-12));
  }
});

test('p_k = <psi|K†K|psi> = tr(K rho K†)', () => {
  for (const kind of TP) for (const v of [25, 50, 75]) for (const t of [0, 60, 90, 200]) {
    const ops = krausOps(kind, v)!, psi = startKet(t), rho = outer(psi);
    for (const j of jumps(kind, v, t)) {
      const K = ops[j.k].m;
      close(j.p, q.inner(psi, q.matVec(q.matMul(q.dagger(K), K), psi)).re);
      close(j.p, trace(conjBy(K, rho)));
    }
  }
});

test('the dots average to the channel output: sum p_k point_k = Bloch point of E(rho), exactly', () => {
  for (const kind of TP) for (const v of VALUES[kind]) for (const t of THETAS) {
    const js = jumps(kind, v, t), out = output(kind, v, t).point!;
    close(js.reduce((s, j) => s + j.p * j.point[0], 0), out[0], 1e-12);
    close(js.reduce((s, j) => s + j.p * j.point[1], 0), out[1], 1e-12);
  }
});

test('the same holds as matrices: sum p_k |psi_k><psi_k| = E(rho)', () => {
  for (const kind of TP) for (const v of [10, 50, 90]) for (const t of [0, 90, 140]) {
    const ops = krausOps(kind, v)!, psi = startKet(t);
    let sum = S([[0, 0], [0, 0]]);
    for (const o of ops) sum = madd(sum, outer(q.matVec(o.m, psi))); // |K psi><K psi| = p_k |psi_k><psi_k|
    closeM(sum, applyMap(kind, v, outer(psi)));
  }
});

test('every jump lands on the unit circle: one pure state in, one pure state out of each door', () => {
  for (const kind of [...TP, 'drop'] as Kind[]) for (const v of VALUES[kind]) for (const t of THETAS) {
    for (const j of jumps(kind, v, t)) close(Math.hypot(...j.point), 1, 1e-9);
  }
});

test('bit flip started as 0: stay with chance 1 − p, or land on 1 with chance p', () => {
  const js = jumps('flip', 25, 0);
  assert.equal(js.length, 2);
  close(js[0].p, 0.75); assert.deepEqual(js[0].point, [0, 1]);
  close(js[1].p, 0.25); assert.deepEqual(js[1].point, [0, -1]);
});

test('bit flip started as |+>: the flip door does nothing to |+>, both doors land on |+>', () => {
  for (const j of jumps('flip', 40, 90)) { close(j.point[0], 1); close(j.point[1], 0); }
});

test('amplitude damping started as 1: no drop leaves 1 with chance 1 − γ, drop lands on 0 with chance γ', () => {
  const js = jumps('damp', 30, 180);
  close(js[0].p, 0.7); assert.deepEqual(js[0].point, [0, -1]);
  close(js[1].p, 0.3); assert.deepEqual(js[1].point, [0, 1]);
});

test('amplitude damping started as 0: the drop door never fires, 0 stays 0', () => {
  const js = jumps('damp', 80, 0);
  assert.equal(js.length, 1);
  close(js[0].p, 1); assert.deepEqual(js[0].point, [0, 1]);
});

test('a gate has one door with chance 1, and it turns the state: RY(90°) on |0> is |+>', () => {
  const js = jumps('gate', 90, 0);
  assert.equal(js.length, 1);
  close(js[0].p, 1); close(js[0].point[0], 1); close(js[0].point[1], 0);
});

test('depolarizing (shrink, λ = 0) has four doors; started as 0 the X door and Y door both land on 1', () => {
  const js = jumps('shrink', 0, 0);
  assert.equal(js.length, 4);
  js.forEach((j) => close(j.p, 0.25));
  assert.deepEqual(js.map((j) => j.point), [[0, 1], [0, -1], [0, -1], [0, 1]]);
});

test('no operators means no doors: scale factors below −1/3 have no jump picture', () => {
  assert.deepEqual(jumps('shrink', -34, 90), []);
  assert.deepEqual(jumps('shrink', -100, 0), []);
});

// ---- Bloch picture of each channel (textbook formulas)

test('bit flip scales z by 1 − 2p and leaves x alone', () => {
  for (const v of VALUES.flip) for (const t of THETAS) {
    const [x, z] = startPoint(t), p = v / 100, o = output('flip', v, t).point!;
    close(o[0], x); close(o[1], (1 - 2 * p) * z);
  }
});

test('amplitude damping: x scales by √(1 − γ), z goes to γ + (1 − γ) z', () => {
  for (const v of VALUES.damp) for (const t of THETAS) {
    const [x, z] = startPoint(t), g = v / 100, o = output('damp', v, t).point!;
    close(o[0], Math.sqrt(1 - g) * x); close(o[1], g + (1 - g) * z);
  }
});

test('amplitude damping is not unital: the center moves up to z = γ', () => {
  const rho = applyMap('damp', 40, mscale(q.I, 0.5));
  close(pointOf(rho)![1], 0.4);
  assert.ok(gap(rho, mscale(q.I, 0.5)) > 0.1);
});

test('the three Pauli-type channels keep the center fixed (unital); damping does not', () => {
  for (const kind of ['gate', 'flip', 'shrink'] as Kind[]) for (const v of VALUES[kind]) closeM(applyMap(kind, v, mscale(q.I, 0.5)), mscale(q.I, 0.5));
});

test('shrink scales the whole Bloch vector by λ, at every start state and for any λ in [−1, 1]', () => {
  for (const v of [-100, -50, -34, -33, 0, 25, 100]) for (const t of THETAS) {
    const [x, z] = startPoint(t), l = v / 100, o = output('shrink', v, t).point!;
    close(o[0], l * x); close(o[1], l * z);
  }
});

test('a gate keeps the length 1: it only turns the arrow, by the angle', () => {
  for (const v of VALUES.gate) for (const t of THETAS) {
    const o = output('gate', v, t).point!, a = ((t + v) * Math.PI) / 180;
    close(Math.hypot(...o), 1);
    close(o[0], Math.sin(a), 1e-12); close(o[1], Math.cos(a), 1e-12);
  }
});

test('a gate with no turn does nothing', () => {
  for (const t of THETAS) { const [x, z] = startPoint(t), o = output('gate', 0, t).point!; close(o[0], x); close(o[1], z); }
});

test('output is a density matrix (trace 1, eigenvalues in [0, 1]) for every channel, positive map or not', () => {
  for (const kind of TP) for (const v of VALUES[kind]) for (const t of THETAS) {
    const { rho, trace: tr } = output(kind, v, t);
    close(tr, 1);
    const [hi, lo] = hermitianEigenvalues(rho);
    assert.ok(lo > -1e-12 && hi < 1 + 1e-12, `${kind} ${v} ${t}: ${lo} ${hi}`);
  }
  // λ down to −1 still maps every one-qubit state to a state: the map is positive.
  for (const v of [-100, -90, -60, -34]) for (const t of THETAS) {
    const [hi, lo] = hermitianEigenvalues(output('shrink', v, t).rho);
    assert.ok(lo > -1e-12 && hi < 1 + 1e-12);
  }
});

test('the image of the start circle: an ellipse inside the circle for flip, a smaller circle for shrink', () => {
  for (const pt of circleImage('flip', 25, 72)) {
    close((pt[0] / 1) ** 2 + (pt[1] / 0.5) ** 2, 1, 1e-9); // x^2 + (z / (1 − 2p))^2 = 1 with 1 − 2p = 0.5
  }
  for (const pt of circleImage('shrink', 40, 72)) close(Math.hypot(...pt), 0.4);
  for (const pt of circleImage('gate', 60, 72)) close(Math.hypot(...pt), 1);
  assert.equal(circleImage('flip', 25).length, 120);
});

// ---- Linearity and the unraveling is not the channel

test('channels are linear: E(pρ + (1 − p)σ) = pE(ρ) + (1 − p)E(σ)', () => {
  const rho = outer(startKet(20)), sigma = outer(startKet(250));
  for (const kind of TP) for (const v of [30, 70]) for (const w of [0.2, 0.5, 0.9]) {
    const mix = madd(mscale(rho, w), mscale(sigma, 1 - w));
    closeM(applyMap(kind, v, mix), madd(mscale(applyMap(kind, v, rho), w), mscale(applyMap(kind, v, sigma), 1 - w)));
  }
});

test('different Kraus sets can give the same channel: the Pauli set and the matrix-unit set both give the completely depolarizing map', () => {
  // Watrous: A = I/2, X/2, Y/2, Z/2 (the tool's set at λ = 0), or A = |a><b| / √2 for a, b in {0, 1}.
  const units: q.Matrix[] = [];
  for (let a = 0; a < 2; a++) for (let b = 0; b < 2; b++) { const m = S([[0, 0], [0, 0]]); m[a][b] = q.c(S2); units.push(m); }
  const sumK = units.reduce((t, k) => madd(t, q.matMul(q.dagger(k), k)), S([[0, 0], [0, 0]]));
  closeM(sumK, q.I); // it is a Kraus set too
  for (const t of [0, 40, 90, 200, 270]) {
    const rho = outer(startKet(t));
    const viaUnits = units.reduce((s, k) => madd(s, conjBy(k, rho)), S([[0, 0], [0, 0]]));
    closeM(viaUnits, applyMap('shrink', 0, rho));
    closeM(viaUnits, mscale(q.I, 0.5));
  }
});

test('the same channel, different jump pictures: the average is shared, the dots are not', () => {
  // Dephasing with a fair coin between I and Z, written two ways: the doors differ, the map does not.
  const phase = [mscale(q.I, S2), mscale(q.Z, S2)]; // dephasing, p = 1/2
  const rho = outer(startKet(90));
  const out = phase.reduce((s, k) => madd(s, conjBy(k, rho)), S([[0, 0], [0, 0]]));
  close(pointOf(out)![0], 0); // x is gone
  // Rotating the operators by a unitary u (K'_j = sum u_jk K_k) gives the same map with different doors.
  const u = [[S2, S2], [S2, -S2]];
  const rot = [0, 1].map((j) => madd(mscale(phase[0], u[j][0]), mscale(phase[1], u[j][1])));
  const out2 = rot.reduce((s, k) => madd(s, conjBy(k, rho)), S([[0, 0], [0, 0]]));
  closeM(out, out2);
  closeM(rot[0], S([[1, 0], [0, 0]])); closeM(rot[1], S([[0, 0], [0, 1]])); // |0><0| and |1><1|: a measurement whose result is ignored
});

// ---- The shots

test('a shot picks a door by the chances: a grid of draws gives counts within 1 of N p_k', () => {
  const us = Array.from({ length: SHOTS }, (_, i) => (i + 0.5) / SHOTS);
  for (const [kind, v, t] of [['flip', 25, 0], ['damp', 50, 180], ['shrink', 0, 0], ['shrink', 60, 40]] as [Kind, number, number][]) {
    const js = jumps(kind, v, t), s = tally(js, batch(js, us));
    assert.equal(s.kept, SHOTS); assert.equal(s.lost, 0);
    js.forEach((j, i) => assert.ok(Math.abs(s.counts[i] - SHOTS * j.p) <= 1, `${kind}: ${s.counts[i]} vs ${SHOTS * j.p}`));
  }
});

test('pick: below the first chance picks 0, past all of them is lost', () => {
  const js = jumps('drop', 50, 180); // K0 on |1>: chance 0.5, the rest is lost
  assert.equal(js.length, 1); close(js[0].p, 0.5);
  assert.equal(pick(js, 0), 0); assert.equal(pick(js, 0.4999), 0);
  assert.equal(pick(js, 0.5001), -1); assert.equal(pick(js, 0.99), -1);
  close(lostChance(js), 0.5);
});

test('a lost shot has no dot: kept + lost is the batch, the mean ignores the lost', () => {
  const js = jumps('drop', 75, 135), us = Array.from({ length: SHOTS }, (_, i) => (i + 0.5) / SHOTS);
  const s = tally(js, batch(js, us));
  assert.equal(s.kept + s.lost, SHOTS);
  assert.ok(s.lost > 0 && s.kept > 0);
  close(s.kept / SHOTS, 1 - lostChance(js), 1 / SHOTS);
  assert.equal(tally([], [-1, -1]).mean, null);
});

test('the average of a fine grid of shots matches the exact output, and the exact output of drop is the survivors', () => {
  const us = Array.from({ length: 4000 }, (_, i) => (i + 0.5) / 4000);
  for (const [kind, v, t] of [['flip', 30, 60], ['damp', 40, 100], ['shrink', 25, 300], ['drop', 60, 100]] as [Kind, number, number][]) {
    const js = jumps(kind, v, t), s = tally(js, batch(js, us)), exact = output(kind, v, t).point!;
    close(s.mean![0], exact[0], 1e-3); close(s.mean![1], exact[1], 1e-3);
  }
});

// ---- Dropping a door breaks the trace

test('drop left out: the surviving share is 1 − γ times the chance of a 1, and it equals the trace of the output', () => {
  for (const v of [10, 50, 90]) for (const t of THETAS) {
    const p1 = Math.sin((t * Math.PI) / 360) ** 2; // chance of 1 for cos(t/2)|0> + sin(t/2)|1>
    const o = output('drop', v, t);
    close(o.trace, 1 - (v / 100) * p1, 1e-12);
    close(1 - lostChance(jumps('drop', v, t)), o.trace, 1e-12);
  }
});

test('drop left out: started as 1 with γ = 100% nothing survives', () => {
  const o = output('drop', 100, 180);
  close(o.trace, 0); assert.equal(o.point, null);
  assert.deepEqual(jumps('drop', 100, 180), []);
  close(lostChance([]), 1);
  assert.match(describe('drop', 100, 180), /Nothing survives/);
});

test('drop left out: the survivors are pushed toward 0, like damping given a result', () => {
  const [x, z] = output('drop', 50, 90).point!; // |+>, K0 = diag(1, √0.5)
  assert.ok(z > 0 && x < 1);
  close(Math.hypot(x, z), 1); // still pure
  close(z, (1 - 0.5) / (1 + 0.5)); // K0|+> = (1, √0.5)/√2: z = (1 − 0.5)/(1 + 0.5)
});

// ---- Half of an entangled pair: complete positivity

test('the identity on half of the pair leaves the Bell state: eigenvalues 1, 0, 0, 0', () => {
  const e = pairEigenvalues('gate', 0);
  e.forEach((x, i) => close(x, i === 0 ? 1 : 0, 1e-12));
  const phi = [q.c(S2), q.c(0), q.c(0), q.c(S2)];
  closeM(pairOutput('gate', 0), outer(phi));
});

test('a gate on half of the pair gives a pure state: eigenvalues 1, 0, 0, 0', () => {
  for (const v of VALUES.gate) pairEigenvalues('gate', v).forEach((x, i) => close(x, i === 0 ? 1 : 0, 1e-9));
});

test('a gate on half of the pair is U tensor I on the state: pairOutput = |phi><phi| with phi = (U tensor I)(|00> + |11>)/√2', () => {
  for (const v of [30, 90, 200]) {
    const U = krausOps('gate', v)![0].m, phi = q.apply1([q.c(S2), q.c(0), q.c(0), q.c(S2)], U, 0, 2);
    closeM(pairOutput('gate', v), outer(phi));
  }
});

test('every Kraus channel gives a state on half of the pair: no negative eigenvalue, trace 1', () => {
  for (const kind of TP) for (const v of VALUES[kind]) {
    const e = pairEigenvalues(kind, v), ve = pairVerdict(kind, v);
    assert.ok(e[3] > -1e-12, `${kind} ${v}: ${e}`);
    close(e.reduce((s, x) => s + x, 0), 1, 1e-12);
    assert.ok(ve.state && ve.keeps);
    close(trace(pairOutput(kind, v)), 1);
  }
});

test('the pair output is Hermitian', () => {
  for (const kind of KINDS) for (const v of [CHANNELS[kind].min, 0, CHANNELS[kind].start, CHANNELS[kind].max].filter((x) => x >= CHANNELS[kind].min)) {
    const m = pairOutput(kind, v);
    closeM(m, q.dagger(m), 1e-12);
  }
});

test('scaling the Bloch vector by λ on half of the pair: eigenvalues (1 + 3λ)/4 once and (1 − λ)/4 three times', () => {
  for (let v = -100; v <= 100; v += 1) {
    const l = v / 100, w = shrinkWeights(l), e = pairEigenvalues('shrink', v);
    const want = [w.identity, w.pauli, w.pauli, w.pauli].sort((a, b) => b - a);
    e.forEach((x, i) => close(x, want[i], 1e-12));
  }
});

test('the cutoff is λ = −1/3: negative eigenvalue exactly below it', () => {
  for (let v = -100; v <= 100; v++) {
    const ve = pairVerdict('shrink', v), l = v / 100;
    assert.equal(ve.state, l >= -1 / 3, `λ = ${l}`);
    assert.equal(krausOps('shrink', v) !== null, l >= -1 / 3, `λ = ${l}`);
    assert.ok(ve.keeps); // it keeps trace either way
  }
  assert.ok(pairVerdict('shrink', -33).state && !pairVerdict('shrink', -34).state);
});

test('flip through the center (λ = −1) sends every one-qubit state to a state, yet half a pair gets eigenvalue −1/2', () => {
  for (const t of THETAS) {
    const o = output('shrink', -100, t);
    const [hi, lo] = hermitianEigenvalues(o.rho);
    close(lo, 0, 1e-12); close(hi, 1, 1e-12); // a pure state again: the antipode
    const [x, z] = startPoint(t);
    close(o.point![0], -x); close(o.point![1], -z);
  }
  const e = pairEigenvalues('shrink', -100);
  [0.5, 0.5, 0.5, -0.5].forEach((x, i) => close(e[i], x, 1e-12));
});

test('flip through the center is the transpose followed by a Y gate: rho goes to Y rho^T Y = tr(rho) I − rho', () => {
  const T = (m: q.Matrix): q.Matrix => m[0].map((_, j) => m.map((r) => r[j]));
  for (const t of THETAS) {
    const rho = outer(startKet(t));
    closeM(applyMap('shrink', -100, rho), conjBy(q.Y, T(rho)));
    closeM(applyMap('shrink', -100, rho), madd(mscale(q.I, trace(rho)), mscale(rho, -1)));
  }
});

test('the transpose on half of a Bell pair is SWAP/2: eigenvalues 1/2, 1/2, 1/2, −1/2', () => {
  // (T tensor id)(|Phi+><Phi+|) = (1/2) sum |b><a| tensor |a><b|.
  const out = Array.from({ length: 4 }, () => Array.from({ length: 4 }, () => q.c(0)));
  for (let a = 0; a < 2; a++) for (let b = 0; b < 2; b++) out[2 * b + a][2 * a + b] = q.c(0.5);
  const e = hermitianEigenvalues(out);
  [0.5, 0.5, 0.5, -0.5].forEach((x, i) => close(e[i], x, 1e-12));
});

test('the untouched half does not feel the map: tracing out the acted-on qubit gives I/2 for every channel that keeps trace', () => {
  for (const kind of TP) for (const v of [10, 50, 90, -50].filter((x) => x >= CHANNELS[kind].min)) {
    const m = pairOutput(kind, v), red = S([[0, 0], [0, 0]]);
    for (let i = 0; i < 2; i++) for (let a = 0; a < 2; a++) for (let b = 0; b < 2; b++) red[a][b] = q.add(red[a][b], m[2 * i + a][2 * i + b]);
    closeM(red, mscale(q.I, 0.5));
  }
});

test('the drop-left-out map: a state on half of the pair, but its trace is below 1', () => {
  for (const v of [10, 50, 90]) {
    const ve = pairVerdict('drop', v);
    assert.ok(ve.state && !ve.keeps);
    close(ve.sum, 1 - (v / 100) * 0.5, 1e-12); // the 1 half of the pair holds chance 1/2
  }
});

test('damping on half of the pair has two non-zero eigenvalues, the Choi matrix of a two-operator channel', () => {
  for (const v of [10, 50, 90]) {
    const e = pairEigenvalues('damp', v);
    assert.ok(e[0] > 0 && e[1] > 0); close(e[2], 0, 1e-12); close(e[3], 0, 1e-12);
    close(e[0] + e[1], 1, 1e-12);
  }
  // γ = 0 is the identity, γ = 1 the reset to 0: a product state, eigenvalues 1/2, 1/2 (|0><0| tensor I/2).
  [0.5, 0.5, 0, 0].forEach((x, i) => close(pairEigenvalues('damp', 100)[i], x, 1e-12));
});

// ---- The eigenvalue solver

test('hermitianEigenvalues: known matrices', () => {
  const d = S([[3, 0, 0], [0, -1, 0], [0, 0, 2]]);
  const e = hermitianEigenvalues(d); [3, 2, -1].forEach((x, i) => close(e[i], x));
  const pauliY = hermitianEigenvalues(q.Y); close(pauliY[0], 1); close(pauliY[1], -1);
  const h = [[q.c(2), q.c(0, 1)], [q.c(0, -1), q.c(2)]]; // eigenvalues 3 and 1
  const eh = hermitianEigenvalues(h); close(eh[0], 3); close(eh[1], 1);
  const proj = hermitianEigenvalues(outer([q.c(S2), q.c(0), q.c(0), q.c(S2)]));
  [1, 0, 0, 0].forEach((x, i) => close(proj[i], x, 1e-12));
});

test('hermitianEigenvalues: the sum is the trace, the sum of squares is tr(M²), on a random-looking 4 x 4', () => {
  const v = [[1, 2, 0.5, -1], [0.3, -1, 2, 1], [2, 0.7, 1, 0.2], [-0.5, 1, 1.5, 3]];
  const m = v.map((r, i) => r.map((_, j) => (i === j ? q.c(r[i]) : q.c((r[j] + v[j][i]) / 2, i < j ? (r[j] - v[j][i]) / 3 : -(v[j][i] - r[j]) / 3))));
  closeM(m, q.dagger(m));
  const e = hermitianEigenvalues(m);
  close(e.reduce((s, x) => s + x, 0), trace(m), 1e-12);
  close(e.reduce((s, x) => s + x * x, 0), trace(q.matMul(m, m)), 1e-12);
  assert.deepEqual([...e], [...e].sort((a, b) => b - a));
});

// ---- Words

test('num uses a real minus sign and never shows −0', () => {
  assert.equal(num(-0.5), '−0.50'); assert.equal(num(0.5), '0.50'); assert.equal(num(-0.0001), '0.00'); assert.equal(num(0.1234, 3), '0.123');
  assert.equal(pointText([0, -1]), '(0.00, −1.00)');
});

test('start text names the start state', () => {
  assert.match(startText(0), /^Started as 0 with no gate, the qubit is \|0⟩/);
  assert.match(startText(90), /^Started as 0, then an RY turn of 90°, the qubit is \|\+⟩/);
  assert.match(startText(180), /\|1⟩/); assert.match(startText(270), /\|−⟩/);
  assert.match(startText(45), /45°/);
});

test('value texts', () => {
  assert.equal(valueText('gate', 90), '90 degrees'); assert.equal(valueText('flip', 25), '25 percent'); assert.equal(valueText('shrink', -50), 'scale factor −0.50');
  assert.equal(valueShort('gate', 90), '90°'); assert.equal(valueShort('shrink', 50), '0.50'); assert.equal(valueShort('damp', 30), '30%');
});

test('every readout names the start state and says whether the pair test passes', () => {
  for (const kind of KINDS) for (const v of [CHANNELS[kind].start, CHANNELS[kind].min, CHANNELS[kind].max]) for (const t of [0, 90, 180]) {
    const s = describe(kind, v, t);
    assert.match(s, /^Started as 0/);
    assert.match(s, /Half of the pair/);
    assert.ok(/None is negative|The lowest is negative/.test(s));
    assert.ok(!s.includes('\u2014'));
  }
});

test('readouts: a channel says the chances add to 1, a non-channel says it is not I, flip-through-center names the negative chance', () => {
  assert.match(describe('flip', 25, 0), /chances of the operators add to 1/);
  assert.match(describe('drop', 50, 90), /not I, so shots can be lost/);
  assert.match(describe('drop', 50, 90), /share 0\.\d\d of the shots survive/);
  const bad = describe('shrink', -100, 90);
  assert.match(bad, /No set of operators/); assert.match(bad, /negative chance/);
  assert.doesNotMatch(describe('shrink', 0, 90), /negative chance/);
  assert.match(describe('flip', 25, 0, tally(jumps('flip', 25, 0), [0, 0, 1])), /3 shots: 3 fired an operator\. Average of the dots/);
});

test('with no operators there are no shots to run: the readout never says shots were lost', () => {
  const s = describe('shrink', -100, 90, tally([], []));
  assert.doesNotMatch(s, /lost|fired an operator/);
  assert.match(s, /No set of operators/);
});

test('the sliders: every start is inside its range and on its step', () => {
  for (const kind of KINDS) {
    const { min, max, step, start } = CHANNELS[kind];
    assert.ok(start >= min && start <= max && (start - min) % step === 0, kind);
    assert.ok(krausOps(kind, start) !== null);
  }
  assert.ok(THETA.start >= THETA.min && THETA.start <= THETA.max && THETA.max % THETA.step === 0);
});

test('every map is complex linear: E(iM) = iE(M), and shrink at 0 sends i|0><0| to diag(i/2, i/2)', () => {
  const iM: q.Matrix = [[q.c(0, 1), q.c(0)], [q.c(0), q.c(0)]];
  closeM(applyMap('shrink', 0, iM), [[q.c(0, 0.5), q.c(0)], [q.c(0), q.c(0, 0.5)]]);
  const r = q.rng(5), rnd = () => q.c(r() - 0.5, r() - 0.5);
  for (const kind of KINDS) for (const v of [CHANNELS[kind].min, CHANNELS[kind].start, CHANNELS[kind].max]) {
    const m: q.Matrix = [[rnd(), rnd()], [rnd(), rnd()]];
    const times = (a: q.Matrix, z: q.C) => a.map((row) => row.map((x) => q.mul(x, z)));
    closeM(applyMap(kind, v, times(m, q.c(0, 1))), times(applyMap(kind, v, m), q.c(0, 1)));
    const t = traceC(m);
    close(t.re, m[0][0].re + m[1][1].re); close(t.im, m[0][0].im + m[1][1].im);
  }
});

test('shrink matches its Kraus sum on every matrix unit wherever it has operators', () => {
  const units: q.Matrix[] = [0, 1, 2, 3].map((k) => [0, 1].map((i) => [0, 1].map((j) => q.c(2 * i + j === k ? 1 : 0))));
  for (let v = CHANNELS.shrink.min; v <= CHANNELS.shrink.max; v++) {
    const ops = krausOps('shrink', v);
    if (!ops) continue;
    for (const e of units) closeM(applyMap('shrink', v, e), ops.reduce((t, o) => t.map((row, i) => row.map((x, j) => q.add(x, q.matMul(q.matMul(o.m, e), q.dagger(o.m))[i][j]))), [[q.c(0), q.c(0)], [q.c(0), q.c(0)]]));
  }
});

test('a shot is never lost to rounding when the operators keep trace', () => {
  for (const kind of KINDS) {
    const v = CHANNELS[kind].start, js = jumps(kind, v, 90);
    if (!js.length || lostChance(js) > 0) continue;
    assert.notEqual(pick(js, 1 - Number.EPSILON / 2), -1, kind);
  }
});
