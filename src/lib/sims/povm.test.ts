import test from 'node:test';
import assert from 'node:assert/strict';
import * as q from '../quantum.ts';
import * as pv from './povm.ts';

const close = (a: number, x: number, eps = 1e-12) => assert.ok(Math.abs(a - x) < eps, `${a} != ${x}`);
const RAD = Math.PI / 180;
const ANGLES = Array.from({ length: 181 }, (_, g) => g); // every slider value
const sum = (xs: number[]) => xs.reduce((t, x) => t + x, 0);
const S3 = Math.sqrt(3);

const matClose = (a: q.Matrix, b: q.Matrix, eps = 1e-12) => {
  for (let i = 0; i < a.length; i++) for (let j = 0; j < a[0].length; j++) {
    close(a[i][j].re, b[i][j].re, eps); close(a[i][j].im, b[i][j].im, eps);
  }
};
const identity = (n: number): q.Matrix => Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => q.c(i === j ? 1 : 0)));

// ---- What a POVM is

test('the standard measurement and the trine are POVMs: Hermitian, positive, summing to I', () => {
  assert.ok(pv.isPovm(pv.standard()));
  assert.ok(pv.isPovm(pv.trine()));
  matClose(pv.sumParts(pv.trine()), identity(2));
  matClose(pv.sumParts(pv.standard()), identity(2));
});

test('the standard parts are projectors; the trine parts are not', () => {
  for (const e of pv.standard()) assert.ok(pv.isProjector(e));
  for (const e of pv.trine()) {
    assert.ok(!pv.isProjector(e));
    // E·E = (2/3) E, since E = (2/3) |s><s|: eigenvalues 0 and 2/3, not 0 and 1.
    const [lo, hi] = pv.eigs2(e);
    close(lo, 0); close(hi, 2 / 3);
    close(pv.trace(e), 2 / 3);
  }
});

test('a list that breaks a rule is not a POVM', () => {
  const half = pv.trine().map((e) => e.map((r) => r.map((x) => q.scale(x, 0.5)))); // sums to I/2
  assert.ok(!pv.isPovm(half));
  const negative: q.Matrix[] = [[[q.c(1.5), q.c(0)], [q.c(0), q.c(1)]], [[q.c(-0.5), q.c(0)], [q.c(0), q.c(0)]]]; // sums to I, one part has a negative eigenvalue
  matClose(pv.sumParts(negative), [[q.c(1), q.c(0)], [q.c(0), q.c(1)]]);
  assert.ok(!pv.isPovm(negative));
});

test('the trine parts have trace 2/3 each, which a projector never has (its trace is its rank, a whole number), and E·E = (2/3) E ≠ E', () => {
  for (const e of pv.trine()) {
    close(pv.trace(e), 2 / 3);
    assert.ok(!pv.isProjector(e));
    matClose(q.matMul(e, e), e.map((r) => r.map((x) => q.scale(x, 2 / 3))));
  }
  close(pv.trine().reduce((t, e) => t + pv.trace(e), 0), 2); // 3 × 2/3 = 2, the dimension: the parts sum to I
});

test('two-outcome limit for the three trine states: the trine names the state with chance 2/3, and the best two-outcome measurement reaches (1 + √3/2)/3', () => {
  const s = pv.TRINE.map((d) => pv.ket(d));
  // Trine: each part is right for its own state with chance 2/3, so the average over equal priors is 2/3.
  close(sum(s.map((v, k) => pv.chancesOf(pv.trine(), v)[k])) / 3, 2 / 3);
  // Two outcomes name at most two of the three states. For a pair at overlap c = 1/2 the best is (1 + sqrt(1 - c²))/2 per
  // pair of equal priors, so over three equal priors: (1/3)(1 + sqrt(1 - c²)). Check the overlap and the number.
  close(Math.abs(q.inner(s[0], s[1]).re), 1 / 2);
  close((1 / 3) * (1 + Math.sqrt(1 - 0.25)), (1 + S3 / 2) / 3);
  assert.ok((1 + S3 / 2) / 3 < 2 / 3);
  // Brute check over every projective measurement in the plane (angle t): name s_a on outcome 0, s_b on outcome 1.
  let best = 0;
  for (let t = 0; t < 180; t += 0.5) for (const [a, b] of [[0, 1], [0, 2], [1, 2]]) {
    const p = pv.chancesOf([pv.proj(pv.ket(t)), pv.proj(pv.ket(t + 90))], s[a])[0] + pv.chancesOf([pv.proj(pv.ket(t)), pv.proj(pv.ket(t + 90))], s[b])[1];
    best = Math.max(best, p / 3);
  }
  assert.ok(best <= (1 + S3 / 2) / 3 + 1e-9);
  assert.ok(best > (1 + S3 / 2) / 3 - 1e-3);
});

test('sum of the three |<s_k|ψ>|² is 3/2 for every state, so weight 2/3 makes the chances add to 1', () => {
  for (const g of ANGLES) {
    const psi = pv.ket(g);
    const total = sum(pv.TRINE.map((d) => q.abs2(q.inner(pv.ket(d), psi))));
    close(total, 1.5);
  }
});

// ---- The Born rule for each mode

test('chances are never negative and add to 1, for every mode and every slider value', () => {
  for (const m of pv.MODES) for (const g of ANGLES) {
    const p = pv.chances(m, g);
    assert.equal(p.length, 3);
    for (const x of p) assert.ok(x >= 0 && x <= 1);
    close(sum(p), 1);
  }
});

test('standard measurement: cos² φ and sin² φ, and never a third outcome', () => {
  for (const g of ANGLES) {
    const p = pv.chances('standard', g);
    close(p[0], Math.cos(g * RAD) ** 2); close(p[1], Math.sin(g * RAD) ** 2); assert.equal(p[2], 0);
  }
});

test('trine chances are (2/3) cos²(φ - 120° k)', () => {
  for (const g of ANGLES) {
    const p = pv.chances('trine', g);
    pv.TRINE.forEach((d, k) => close(p[k], (2 / 3) * Math.cos((g - d) * RAD) ** 2));
  }
});

test('known trine values: |0>, |1>, |+>, and the three states where one outcome never happens', () => {
  const eq = (g: number, want: number[]) => pv.chances('trine', g).forEach((x, i) => close(x, want[i]));
  eq(0, [2 / 3, 1 / 6, 1 / 6]); // started as |0>
  eq(90, [0, 1 / 2, 1 / 2]); // started as |1>: A never
  eq(30, [1 / 2, 0, 1 / 2]); // B never
  eq(150, [1 / 2, 1 / 2, 0]); // C never
  eq(45, [1 / 3, (1 - S3 / 2) / 3, (1 + S3 / 2) / 3]); // started as |+>
  eq(180, [2 / 3, 1 / 6, 1 / 6]); // -|0> is the same state as |0>
  eq(60, [1 / 6, 1 / 6, 2 / 3]);
  eq(120, [1 / 6, 2 / 3, 1 / 6]);
});

test('no trine outcome is ever certain: 2/3 is the most, reached at 0°, 120° and 60°; and each outcome has one state where it never happens', () => {
  let top = 0;
  for (const g of ANGLES) top = Math.max(top, ...pv.chances('trine', g));
  close(top, pv.MAX_CHANCE);
  close(pv.chances('trine', 0)[0], 2 / 3); close(pv.chances('trine', 120)[1], 2 / 3); close(pv.chances('trine', 60)[2], 2 / 3);
  const zero = (k: number) => ANGLES.filter((g) => pv.chances('trine', g)[k] === 0);
  assert.deepEqual(zero(0), [90]); assert.deepEqual(zero(1), [30]); assert.deepEqual(zero(2), [150]);
});

test('the trine chance for a Bloch vector r is (1 + r·n_k)/3, with the n_k 120° apart on a great circle', () => {
  for (const g of ANGLES) {
    const r = q.bloch(pv.ket(g));
    const p = pv.chances('trine', g);
    pv.TRINE.forEach((d, k) => {
      // The Hilbert angle θ is the Bloch angle 2θ: n_k = (sin 2θ, 0, cos 2θ).
      const n = [Math.sin(2 * d * RAD), 0, Math.cos(2 * d * RAD)];
      close(p[k], (1 + r[0] * n[0] + r[1] * n[1] + r[2] * n[2]) / 3);
    });
  }
  // The three Bloch directions are unit vectors that sum to zero.
  const ns = pv.TRINE.map((d) => [Math.sin(2 * d * RAD), Math.cos(2 * d * RAD)]);
  close(sum(ns.map((n) => n[0])), 0); close(sum(ns.map((n) => n[1])), 0);
});

test('turning the state by 120° moves each trine outcome to the next: the trine has a three-fold symmetry', () => {
  for (const g of ANGLES) {
    const a = pv.chances('trine', g), b = pv.chances('trine', g + 120);
    close(b[0], a[2]); close(b[1], a[0]); close(b[2], a[1]);
  }
});

test('a global phase changes no chance', () => {
  const psi = pv.ket(37), phased = psi.map((a) => q.mul(a, q.expi(1.234)));
  const a = pv.chancesOf(pv.trine(), psi), b = pv.chancesOf(pv.trine(), phased);
  a.forEach((x, i) => close(x, b[i]));
});

test('tr(E ρ) agrees with <ψ|E|ψ> for pure states and is linear in ρ; the maximally mixed state gives 1/3 each', () => {
  for (const g of [0, 17, 45, 90, 133]) {
    const a = pv.chancesOf(pv.trine(), pv.ket(g)), b = pv.chancesRho(pv.trine(), pv.proj(pv.ket(g)));
    a.forEach((x, i) => close(x, b[i]));
  }
  const rho = pv.addM(pv.proj(pv.ket(10), 0.3), pv.proj(pv.ket(100), 0.7));
  const mix = pv.chancesRho(pv.trine(), rho);
  const p1 = pv.chancesOf(pv.trine(), pv.ket(10)), p2 = pv.chancesOf(pv.trine(), pv.ket(100));
  mix.forEach((x, i) => close(x, 0.3 * p1[i] + 0.7 * p2[i]));
  const maxMixed = pv.addM(pv.proj(q.ket0(), 0.5), pv.proj(q.ket1(), 0.5));
  pv.chancesRho(pv.trine(), maxMixed).forEach((x) => close(x, 1 / 3));
});

// ---- The bigger system (Naimark)

test('square root of a positive matrix: S is positive and S·S = M', () => {
  const a: q.Matrix = [[q.c(1, 0.5), q.c(0.2, -1)], [q.c(0.3, 0.1), q.c(-0.4, 0.6)]];
  const ms: q.Matrix[] = [...pv.trine(), ...pv.standard(), pv.proj(pv.ket(33), 0.4), q.matMul(q.dagger(a), a)];
  for (const m of ms) {
    const s = pv.sqrtPsd2(m);
    matClose(q.matMul(s, s), m);
    assert.ok(pv.eigs2(s)[0] > -1e-12);
    close(s[0][1].re, s[1][0].re); close(s[0][1].im, -s[1][0].im);
  }
});

test('the trine isometry: V†V = I, and V†|k><k|V is the part E_k', () => {
  const V = pv.trineIsometry();
  matClose(q.matMul(q.dagger(V), V), identity(2));
  pv.trine().forEach((e, k) => {
    const row: q.Matrix = [V[k]]; // <k|V
    matClose(q.matMul(q.dagger(row), row), e);
  });
});

test('the qutrit amplitudes are sqrt(2/3) cos(φ - 120° k), add to 0, form a unit vector, and square to the trine chances', () => {
  for (const g of ANGLES) {
    const a = pv.qutritAmps(g);
    a.forEach((x, k) => close(x, Math.sqrt(2 / 3) * Math.cos((g - pv.TRINE[k]) * RAD)));
    close(sum(a), 0);
    close(sum(a.map((x) => x * x)), 1);
    const p = pv.chances('trine', g);
    a.forEach((x, k) => close(x * x, p[k]));
    pv.chances('bigger', g).forEach((x, k) => close(x, p[k]));
  }
});

test('the qutrit amplitudes add to 0 for complex qubit states too, since the three s_k sum to the zero vector', () => {
  const V = pv.trineIsometry();
  for (const [t, ph] of [[0.4, 1.1], [1.3, -2.0], [2.2, 0.7]]) {
    const out = q.matVec(V, q.fromBloch(t, ph));
    close(sum(out.map((a) => a.re)), 0); close(sum(out.map((a) => a.im)), 0);
  }
});

test('two isometries, same odds: the trine W is 3 x 2, the general V is 6 x 2, and both give the trine chances', () => {
  const W = pv.trineIsometry(), V = pv.naimark(pv.trine());
  assert.equal(W.length, 3); assert.equal(V.length, 6); assert.equal(W[0].length, 2); assert.equal(V[0].length, 2);
  for (const g of [0, 25, 90, 143, 180]) {
    const psi = pv.ket(g);
    pv.helperChances(V, psi, 3).forEach((x, k) => close(x, pv.chances('trine', g)[k]));
    pv.chances('bigger', g).forEach((x, k) => close(x, pv.chances('trine', g)[k]));
  }
  assert.match(pv.partsText('bigger'), /the state left over can differ/);
});

test('same odds, different state left over: X after each √E_k gives the same helper chances but another state after outcome 0', () => {
  const V = pv.naimark(pv.trine()), V2 = V.map((_, i) => V[i ^ 1]);
  const psi = pv.ket(0);
  pv.helperChances(V2, psi, 3).forEach((x, k) => close(x, pv.helperChances(V, psi, 3)[k]));
  const left = (M: q.Matrix) => { const o = q.matVec(M, psi).slice(0, 2); const n = Math.hypot(...o.map((a) => Math.hypot(a.re, a.im))); return o.map((a) => Math.hypot(a.re, a.im) / n); };
  left(V).forEach((x, i) => close(x, [1, 0][i]));   // started as |0>: outcome A leaves |0> with V
  left(V2).forEach((x, i) => close(x, [0, 1][i]));  // and |1> with V2
});

test('Naimark for any POVM: V†V = I, and the helper reads k with chance <ψ|E_k|ψ>', () => {
  const unsharp = (l: number): q.Matrix[] => [[[q.c((1 + l) / 2), q.c(0)], [q.c(0), q.c((1 - l) / 2)]], [[q.c((1 - l) / 2), q.c(0)], [q.c(0), q.c((1 + l) / 2)]]];
  const sets: q.Matrix[][] = [pv.standard(), pv.trine(), unsharp(0.6), unsharp(1)];
  for (const E of sets) {
    assert.ok(pv.isPovm(E));
    const V = pv.naimark(E);
    assert.equal(V.length, E.length * 2);
    matClose(q.matMul(q.dagger(V), V), identity(2));
    for (const g of [0, 25, 45, 90, 140]) {
      const want = pv.chancesOf(E, pv.ket(g)), got = pv.helperChances(V, pv.ket(g), E.length);
      want.forEach((x, k) => close(got[k], x));
    }
  }
});

test('Naimark with a complex state: the same chances hold for any qubit state', () => {
  const E = pv.trine(), V = pv.naimark(E);
  for (const [t, ph] of [[0.4, 1.1], [1.3, -2.0], [2.9, 0.3]]) {
    const psi = q.fromBloch(t, ph);
    const want = pv.chancesOf(E, psi), got = pv.helperChances(V, psi, 3);
    want.forEach((x, k) => close(got[k], x));
  }
});

test('the isometry extends to a unitary U on (helper, qubit) with U(|0> ⊗ ψ) = Vψ, and measuring the helper gives the POVM chances', () => {
  const E = pv.trine(), V = pv.naimark(E);
  const U = pv.completeToUnitary(V);
  assert.equal(U.length, 6);
  assert.ok(pv.isUnitary(U));
  for (const g of [0, 45, 90, 130]) {
    const psi = pv.ket(g);
    const out = q.matVec(U, q.tensor([q.c(1), q.c(0), q.c(0)], psi)); // helper has 3 levels, starts at 0
    const direct = q.matVec(V, psi);
    out.forEach((a, i) => { close(a.re, direct[i].re); close(a.im, direct[i].im); });
    const want = pv.chancesOf(E, psi);
    const p = [0, 1, 2].map((k) => out.slice(2 * k, 2 * k + 2).reduce((t, a) => t + q.abs2(a), 0)); // helper reads k
    p.forEach((x, k) => close(x, want[k]));
  }
});

test('two qubits are enough for the trine: one helper qubit, a gate, and the standard measurement gives A, B, C as 00, 01, 10 and never 11', () => {
  const V3 = pv.trineIsometry();
  const V4: q.Matrix = [...V3, [q.c(0), q.c(0)]]; // rows 00, 01, 10, 11
  const U = pv.completeToUnitary(V4);
  assert.equal(U.length, 4);
  assert.ok(pv.isUnitary(U));
  for (const g of ANGLES.filter((x) => x % 5 === 0)) {
    const out = q.matVec(U, q.tensor(q.ket0(), pv.ket(g))); // helper qubit first, starting as 0
    const p = q.probs(out);
    const want = pv.chances('trine', g);
    close(p[0], want[0]); close(p[1], want[1]); close(p[2], want[2]); close(p[3], 0);
  }
});

// ---- Shots

test('a batch is BATCH draws in [0, 1)', () => {
  const b = pv.batch(q.rng(7));
  assert.equal(b.length, pv.BATCH);
  for (const u of b) assert.ok(u >= 0 && u < 1);
});

test('the same draw lands in the same pile in the trine and in the bigger system, so dots do not move between them', () => {
  const b = pv.batch(q.rng(3));
  for (const g of [0, 45, 90, 133]) {
    const t = pv.tally(b, pv.chances('trine', g)), big = pv.tally(b, pv.chances('bigger', g));
    assert.deepEqual(t, big);
  }
});

test('even draws fill each pile to its chance (within one shot), and a zero-chance outcome gets nothing', () => {
  const N = 3000, even = Array.from({ length: N }, (_, i) => (i + 0.5) / N);
  for (const m of pv.MODES) for (const g of [0, 30, 45, 90, 150]) {
    const p = pv.chances(m, g), n = pv.tally(even, p);
    assert.equal(sum(n), N);
    p.forEach((x, k) => { assert.ok(Math.abs(n[k] - N * x) <= 1, `${m} ${g} ${k}`); if (x === 0) assert.equal(n[k], 0); });
  }
  // The edges of the draw range never land in a zero-chance pile.
  for (const u of [0, 1e-16, 0.5, 1 - 1e-16]) assert.notEqual(pv.outcome([0, 0.5, 0.5], u), 0);
});

test('a partial tally counts only the first n shots', () => {
  const b = pv.batch(q.rng(5)), p = pv.chances('trine', 45);
  assert.equal(sum(pv.tally(b, p, 100)), 100);
  assert.equal(sum(pv.tally(b, p)), pv.BATCH);
});

test('the pile grid fits the cell and holds every dot', () => {
  for (const [w, h] of [[60, 80], [110, 200], [30, 30], [300, 20]]) {
    const g = pv.grid(w, h, pv.BATCH);
    assert.ok(g.cols * g.pitch <= w + 1e-9 || g.pitch === 9);
    assert.ok(g.rows * g.pitch <= h + 1e-9);
    assert.ok(g.cols * g.rows >= pv.BATCH);
    assert.ok(g.pitch <= 9);
  }
});

// ---- Words

test('state text names the start state', () => {
  assert.equal(pv.stateText(0), '|0⟩');
  assert.equal(pv.stateText(90), '|1⟩');
  assert.equal(pv.stateText(45), '0.71|0⟩ + 0.71|1⟩, which is |+⟩');
  assert.equal(pv.stateText(135), '−0.71|0⟩ + 0.71|1⟩, the same state as |−⟩');
  assert.equal(pv.stateText(180), '−|0⟩, the same state as |0⟩');
  assert.equal(pv.stateText(30), '0.87|0⟩ + 0.50|1⟩');
});

test('chance texts never show a real chance as 0% or 100%, and show exact zero as 0%', () => {
  assert.deepEqual(pv.chanceTexts(pv.chances('trine', 90)), ['0%', '50%', '50%']);
  assert.deepEqual(pv.chanceTexts(pv.chances('trine', 0)), ['67%', '17%', '17%']);
  assert.deepEqual(pv.chanceTexts([0.9996, 0.0004, 0]), ['>99.9%', '<0.1%', '0%']);
  assert.deepEqual(pv.chanceTexts(pv.chances('standard', 0)), ['100%', '0%', '0%']);
});

test('every readout names the start state and the measurement', () => {
  for (const m of pv.MODES) for (const g of ANGLES) {
    const s = pv.describe(m, g, null);
    assert.ok(s.includes('Each shot started as '), s);
    assert.ok(s.includes(pv.stateText(g)), s);
    assert.ok(!s.includes('NaN') && !s.includes('undefined'), s);
  }
  assert.ok(pv.describe('standard', 0, null).includes('outcome 0 with chance 100%'));
  assert.ok(pv.describe('trine', 90, null).includes('Outcome A never happens'));
  assert.ok(pv.describe('trine', 30, null).includes('Outcome B never happens'));
  assert.ok(pv.describe('trine', 150, null).includes('Outcome C never happens'));
  assert.ok(!pv.describe('trine', 45, null).includes('never happens'));
  assert.ok(pv.describe('bigger', 0, null).includes('(0.82, −0.41, −0.41)'));
  assert.ok(pv.describe('trine', 0, null).includes('67% is the most'));
});

test('the batch line lists counts for the outcomes the mode has', () => {
  assert.ok(pv.describe('trine', 0, [190, 50, 60]).endsWith('This batch of 300 shots: A 190, B 50, C 60.'));
  assert.ok(pv.describe('standard', 0, [300, 0, 0]).endsWith('This batch of 300 shots: 0 300, 1 0.'));
});

test('slider text gives the angle and the state', () => {
  assert.equal(pv.valueText(45), '45 degrees, state 0.71|0⟩ + 0.71|1⟩, which is |+⟩');
  assert.equal(pv.valueText(1), '1 degree, state 0.9998|0⟩ + 0.02|1⟩');
});
