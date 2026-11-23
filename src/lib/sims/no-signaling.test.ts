import test from 'node:test';
import assert from 'node:assert/strict';
import * as q from '../quantum.ts';
import * as ns from './no-signaling.ts';

const close = (a: number, b: number, eps = 1e-12) => assert.ok(Math.abs(a - b) < eps, `${a} != ${b}`);
const closeAll = (a: number[], b: number[], eps = 1e-12) => { assert.equal(a.length, b.length); a.forEach((x, i) => close(x, b[i], eps)); };
const closeM = (a: q.Matrix, b: q.Matrix, eps = 1e-12) =>
  a.forEach((row, j) => row.forEach((x, k) => { close(x.re, b[j][k].re, eps); close(x.im, b[j][k].im, eps); }));
const closeS = (a: q.State, b: q.State, eps = 1e-12) => a.forEach((x, i) => { close(x.re, b[i].re, eps); close(x.im, b[i].im, eps); });
const sum = (xs: number[]) => xs.reduce((t, x) => t + x, 0);
const S2 = Math.SQRT1_2;
const BASES: ns.Basis[] = ['z', 'x'];
const half: q.Matrix = [[q.c(0.5), q.c(0)], [q.c(0), q.c(0.5)]];

// Seeded random test cases: states, one-qubit unitaries and bases. Fixed seeds, so every run checks the same cases.
const R = q.rng(2024);
const rc = () => q.c(R() * 2 - 1, R() * 2 - 1);
const randomState = (): q.State => q.normalize([rc(), rc(), rc(), rc()]);
/** e^{i g} RZ(a) RY(b) RZ(c): every one-qubit unitary has this form. */
const randomU = (): q.Matrix => {
  const [a, b, c2, g] = [R(), R(), R(), R()].map((x) => x * 2 * Math.PI);
  return q.matMul(q.matMul(q.RZ(a), q.RY(b)), q.RZ(c2)).map((row) => row.map((x) => q.mul(x, q.expi(g))));
};
const col = (m: q.Matrix, k: number): q.State => [m[0][k], m[1][k]];
const randomBasis = (): ns.Pair => { const u = randomU(); return [col(u, 0), col(u, 1)]; };
const STATES = [ns.bellPair(), ...Array.from({ length: 12 }, randomState)];
const PAIRS: ns.Pair[] = [ns.kets('z'), ns.kets('x'), [[q.c(S2), q.c(0, S2)], [q.c(S2), q.c(0, -S2)]], ...Array.from({ length: 8 }, randomBasis)];
/** cos t|00> + sin t|11>: entangled but not a Bell pair for t strictly between 0 and pi/4. */
const partly = (t: number): q.State => [q.c(Math.cos(t)), q.c(0), q.c(0), q.c(Math.sin(t))];
const trace = (m: q.Matrix) => m[0][0].re + m[1][1].re;

test('the Bell pair: started as |00>, then H on Alice, then CNOT, is (|00> + |11>)/sqrt2', () => {
  closeS(ns.bellPair(), [q.c(S2), q.c(0), q.c(0), q.c(S2)]);
  close(q.norm2(ns.bellPair()), 1);
});

test('the bases are orthonormal and named as the tool writes them', () => {
  for (const b of BASES) {
    const [u0, u1] = ns.kets(b);
    close(q.norm2(u0), 1); close(q.norm2(u1), 1); close(q.abs(q.inner(u0, u1)), 0);
  }
  assert.deepEqual(ns.NAMES.z, ['0', '1']);
  assert.deepEqual(ns.NAMES.x, ['+', '−']);
});

test('joint odds: Born rule sums to 1 for any state and any bases', () => {
  for (const s of STATES) for (const u of PAIRS) for (const v of PAIRS) close(sum(ns.joint(s, u, v).flat()), 1);
});

test('Bell pair joint odds: same basis always match, 0/1 against +/- are four even outcomes', () => {
  const tidy = (m: number[][]) => m.map((r) => r.map(ns.tidy));
  assert.deepEqual(tidy(ns.joint(ns.bellPair(), 'z', 'z')), [[0.5, 0], [0, 0.5]]);
  assert.deepEqual(tidy(ns.joint(ns.bellPair(), 'x', 'x')), [[0.5, 0], [0, 0.5]]);
  assert.deepEqual(tidy(ns.joint(ns.bellPair(), 'z', 'x')), [[0.25, 0.25], [0.25, 0.25]]);
  assert.deepEqual(tidy(ns.joint(ns.bellPair(), 'x', 'z')), [[0.25, 0.25], [0.25, 0.25]]);
});

test('reduced state: Hermitian, trace 1, no negative eigenvalues; I/2 for the Bell pair', () => {
  closeM(ns.reducedBob(ns.bellPair()), half);
  for (const s of STATES) {
    const r = ns.reducedBob(s);
    close(trace(r), 1);
    close(r[0][1].re, r[1][0].re); close(r[0][1].im, -r[1][0].im); close(r[0][0].im, 0); close(r[1][1].im, 0);
    const det = r[0][0].re * r[1][1].re - q.abs2(r[0][1]);
    assert.ok(det > -1e-12, 'a 2x2 density matrix has det >= 0, so both eigenvalues are >= 0');
  }
});

test('reduced state of a product state is Bob\'s own pure state; of cos t|00> + sin t|11> it is diag(cos^2 t, sin^2 t)', () => {
  for (const u of PAIRS) for (const v of PAIRS) {
    const r = ns.reducedBob(q.tensor(u[0], v[1]));
    closeM(r, [[q.mul(v[1][0], q.conj(v[1][0])), q.mul(v[1][0], q.conj(v[1][1]))], [q.mul(v[1][1], q.conj(v[1][0])), q.mul(v[1][1], q.conj(v[1][1]))]]);
  }
  for (const t of [0, 0.3, Math.PI / 8, Math.PI / 4, 1.2]) {
    closeM(ns.reducedBob(partly(t)), [[q.c(Math.cos(t) ** 2), q.c(0)], [q.c(0), q.c(Math.sin(t) ** 2)]]);
  }
});

test('expect is the Born rule for a density matrix: pure states give |<phi|psi>|^2, I/2 gives 1/2 in every basis', () => {
  for (const u of PAIRS) for (const v of PAIRS) {
    const psi = u[0], rho = [0, 1].map((j) => [0, 1].map((k) => q.mul(psi[j], q.conj(psi[k]))));
    close(ns.expect(rho, v[0]), q.abs2(q.inner(v[0], psi)));
    close(ns.expect(half, v[0]), 0.5); close(ns.expect(half, v[1]), 0.5);
  }
});

test('Bell pair: Alice measuring 0/1 leaves Bob |0> or |1>, measuring +/- leaves |+> or |->, each with chance 1/2', () => {
  const ez = ns.ensemble(ns.bellPair(), 'z'), ex = ns.ensemble(ns.bellPair(), 'x');
  closeAll(ez.map((e) => e.p), [0.5, 0.5]); closeAll(ex.map((e) => e.p), [0.5, 0.5]);
  closeS(ez[0].bob, q.ket0()); closeS(ez[1].bob, q.ket1());
  closeS(ex[0].bob, q.plus()); closeS(ex[1].bob, q.minus());
  // Two different mixes, one density matrix: I/2. This is why Bob cannot tell them apart.
  closeM(ns.mixture(ez), half); closeM(ns.mixture(ex), half);
});

test('Bell pair: whatever basis Alice measures, Bob is left in its complex conjugate, |u*>', () => {
  for (const u of PAIRS) {
    const e = ns.ensemble(ns.bellPair(), u);
    for (let a = 0; a < 2; a++) {
      close(e[a].p, 0.5);
      const want = u[a].map(q.conj);
      close(q.abs2(q.inner(want, e[a].bob)), 1); // equal up to a global phase
    }
  }
  // Y basis: Alice reads |+i> = (|0> + i|1>)/sqrt2, Bob is left in |-i>.
  const e = ns.ensemble(ns.bellPair(), PAIRS[2]);
  closeS(e[0].bob, PAIRS[2][1]);
});

test('no-signaling for measurements: averaged over Alice\'s results, Bob\'s state is rho_B, for any state and basis', () => {
  for (const s of STATES) for (const u of PAIRS) {
    const e = ns.ensemble(s, u);
    close(e[0].p + e[1].p, 1);
    closeM(ns.mixture(e), ns.reducedBob(s));
  }
});

test('no-signaling for gates: a unitary on Alice\'s qubit leaves Bob\'s reduced state unchanged', () => {
  for (const s of STATES) for (let k = 0; k < 6; k++) closeM(ns.reducedBob(q.apply1(s, randomU(), 0, 2)), ns.reducedBob(s));
});

test('no-signaling for any operation: sum over a of tr_A[(K_a x I) rho (K_a x I)^dagger] = rho_B when sum K_a^dagger K_a = I', () => {
  const g = 0.3;
  const damp: q.Matrix[] = [[[q.c(1), q.c(0)], [q.c(0), q.c(Math.sqrt(1 - g))]], [[q.c(0), q.c(Math.sqrt(g))], [q.c(0), q.c(0)]]];
  const proj = (u: q.State): q.Matrix => [0, 1].map((j) => [0, 1].map((k) => q.mul(u[j], q.conj(u[k]))));
  const instruments: q.Matrix[][] = [damp];
  for (const u of PAIRS) instruments.push([proj(u[0]), q.matMul(q.X, proj(u[1]))]); // measure, then flip on result 1
  const I2: q.Matrix = [[q.c(1), q.c(0)], [q.c(0), q.c(1)]];
  for (const ks of instruments) {
    closeM(ks.map((k) => q.matMul(q.dagger(k), k)).reduce((a, b) => a.map((r, j) => r.map((x, l) => q.add(x, b[j][l])))), I2);
    for (const s of STATES) {
      const parts = ks.map((k) => ns.reducedBob(q.apply1(s, k, 0, 2)));
      closeM(parts.reduce((a, b) => a.map((r, j) => r.map((x, l) => q.add(x, b[j][l])))), ns.reducedBob(s));
    }
  }
});

test('Bob\'s odds do not depend on what Alice does, and sum to 1', () => {
  for (const s of STATES) for (const v of PAIRS) {
    const base = ns.bobOdds(s, 'none', v);
    close(sum(base), 1);
    for (const a of [...BASES, ...PAIRS]) closeAll(ns.bobOdds(s, a, v), base);
  }
  for (const a of ['none', 'z', 'x'] as const) for (const b of BASES) assert.deepEqual(ns.bobOdds(ns.bellPair(), a, b).map(ns.tidy), [0.5, 0.5]);
});

test('no-signaling is not about 50/50: on cos t|00> + sin t|11>, Bob reads 0 with chance cos^2 t whatever Alice does', () => {
  for (const t of [0.2, Math.PI / 8, 1.1]) for (const a of ['none', 'z', 'x'] as const) {
    closeAll(ns.bobOdds(partly(t), a, 'z'), [Math.cos(t) ** 2, Math.sin(t) ** 2]);
    closeAll(ns.bobOdds(partly(t), a, 'x'), [0.5, 0.5]);
  }
});

test('Bob\'s best guess at Alice\'s choice is a coin toss: his result odds are identical, total variation distance 0', () => {
  for (const s of STATES) for (const v of BASES) {
    const [p, r] = [ns.bobOdds(s, 'z', v), ns.bobOdds(s, 'x', v)];
    const tv = 0.5 * (Math.abs(p[0] - r[0]) + Math.abs(p[1] - r[1]));
    close(0.5 + tv / 2, 0.5); // the best guess between two equally likely choices succeeds with chance (1 + TV) / 2
  }
});

test('the link does depend on Alice\'s choice: it shows in the joint odds, sorted by her results', () => {
  const s = ns.bellPair();
  assert.deepEqual(ns.sameGiven(s, 'z', 'z').map(ns.tidy), [1, 1]);
  assert.deepEqual(ns.sameGiven(s, 'x', 'x').map(ns.tidy), [1, 1]);
  assert.deepEqual(ns.sameGiven(s, 'z', 'x').map(ns.tidy), [0.5, 0.5]);
  assert.deepEqual(ns.sameGiven(s, 'x', 'z').map(ns.tidy), [0.5, 0.5]);
  assert.notDeepEqual(ns.joint(s, 'z', 'z').map((r) => r.map(ns.tidy)), ns.joint(s, 'x', 'z').map((r) => r.map(ns.tidy)));
});

test('order does not matter: Alice first then Bob, or Bob first then Alice, give the same joint odds', () => {
  // Measure one qubit in a basis, step by step: chance of result k, then the jump to that result (renormalized).
  const step = (s: q.State, u: q.State, qubit: number) => {
    const p = [0, 1].map((j) => [0, 1].map((k) => q.mul(u[j], q.conj(u[k]))));
    const out = q.apply1(s, p, qubit, 2), pr = q.norm2(out);
    return { pr, after: pr > 1e-15 ? q.normalize(out) : out };
  };
  for (const s of STATES) for (const u of PAIRS.slice(0, 5)) for (const v of PAIRS.slice(0, 5)) {
    const want = ns.joint(s, u, v);
    for (let a = 0; a < 2; a++) for (let b = 0; b < 2; b++) {
      const A = step(s, u[a], 0), AB = step(A.after, v[b], 1);
      const B = step(s, v[b], 1), BA = step(B.after, u[a], 0);
      close(A.pr * AB.pr, want[a][b]);
      close(B.pr * BA.pr, want[a][b]);
    }
  }
});

test('shot: results follow the joint odds; on a Bell pair with matching bases Alice and Bob always agree', () => {
  const s = ns.bellPair();
  // draw() walks the four outcomes 00, 01, 10, 11 in order: a fixed rand picks one.
  assert.deepEqual(ns.shot(s, 'z', 'z', () => 0.1), { alice: 'z', a: 0, b: 0 });
  assert.deepEqual(ns.shot(s, 'z', 'z', () => 0.9), { alice: 'z', a: 1, b: 1 });
  assert.deepEqual(ns.shot(s, 'z', 'x', () => 0.3), { alice: 'z', a: 0, b: 1 });
  assert.deepEqual(ns.shot(s, 'z', 'x', () => 0.6), { alice: 'z', a: 1, b: 0 });
  assert.deepEqual(ns.shot(s, 'none', 'x', () => 0.7), { alice: 'none', a: null, b: 1 });
  const r = q.rng(5);
  for (let k = 0; k < 500; k++) for (const b of BASES) { const x = ns.shot(s, b, b, r); assert.equal(x.a, x.b); }
});

test('shot: counts land near the Born rule odds (5 standard deviations, seeded)', () => {
  const r = q.rng(11), n = 4000, s = ns.bellPair();
  for (const a of ns.CHOICES) for (const b of BASES) {
    const shots = Array.from({ length: n }, () => ns.shot(s, a, b, r));
    const t = ns.tally(shots);
    assert.ok(Math.abs(t.bob[1] - n / 2) < 5 * ns.spread(n, 0.5), `${a}/${b}: ${t.bob[1]}`);
    if (a === 'none') { assert.deepEqual(t.seen, [0, 0]); continue; }
    const want = ns.sameGiven(s, a, b);
    for (let i = 0; i < 2; i++) assert.ok(Math.abs(t.same[i] - t.seen[i] * want[i]) <= 5 * ns.spread(t.seen[i], want[i]) + 1e-9);
  }
});

test('tally counts Bob\'s results and, for each Alice result, how often Bob read the same result', () => {
  const shots: ns.Shot[] = [
    { alice: 'z', a: 0, b: 0 }, { alice: 'z', a: 0, b: 1 }, { alice: 'z', a: 1, b: 1 },
    { alice: 'z', a: 1, b: 1 }, { alice: 'none', a: null, b: 0 },
  ];
  assert.deepEqual(ns.tally(shots), { n: 5, bob: [2, 3], seen: [2, 2], same: [1, 2] });
  assert.deepEqual(ns.tally([]), { n: 0, bob: [0, 0], seen: [0, 0], same: [0, 0] });
});

test('spread is the binomial standard deviation sqrt(n p (1 - p))', () => {
  close(ns.spread(100, 0.5), 5); close(ns.spread(400, 0.5), 10); close(ns.spread(50, 0), 0); close(ns.spread(50, 1), 0);
  close(ns.spread(10, 0.1), Math.sqrt(0.9));
  assert.equal(ns.PILE_FIT, 185); // 300 / 2 + 4 * sqrt(75) = 184.6, rounded up
});

test('pileGrid: n dots fit, and the pitch is the largest that fits (in steps of 0.25, up to max)', () => {
  for (const [w, h, n] of [[30, 190, 240], [80, 250, 240], [60, 120, 10], [24, 160, 240], [300, 300, 1]]) {
    const g = ns.pileGrid(w, h, n);
    assert.ok(g.pitch <= 9 && g.pitch >= 1);
    assert.equal(g.cols, Math.floor(w / g.pitch));
    assert.ok(g.cols * Math.floor(h / g.pitch) >= n, `${w}x${h}: ${n} dots do not fit at ${g.pitch}`);
    const up = g.pitch + 0.25;
    if (up <= Math.min(9, w, h)) assert.ok(Math.floor(w / up) * Math.floor(h / up) < n, 'a larger pitch would also fit');
  }
  assert.deepEqual(ns.pileGrid(0, 0, 5), { pitch: 1, cols: 1 });
});

test('tidy removes float dust only', () => {
  assert.equal(ns.tidy(S2 * S2), 0.5);
  assert.equal(ns.tidy(1 - 1e-16), 1);
  assert.ok(Object.is(ns.tidy(-1e-17), 0));
  assert.equal(ns.tidy(0.123456), 0.123456);
});
