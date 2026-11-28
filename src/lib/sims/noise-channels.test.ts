import test from 'node:test';
import assert from 'node:assert/strict';
import * as q from '../quantum.ts';
import {
  COPIES, STRENGTH, YAW, TILT, STARTS, CHANNELS,
  outer, rhoOf, blochOf, length, purity, kraus, applyKraus, after, affine, shape, ket, startPoint, keepChance, results, kept,
  num, vecText, lenText, percents, strength, shapeText, valueText, describe, camera, project, spherePoints, wrap,
  type Channel, type Vec,
} from './noise-channels.ts';

const close = (a: number, b: number, eps = 1e-12) => assert.ok(Math.abs(a - b) < eps, `${a} != ${b}`);
const closeV = (a: readonly number[], b: readonly number[], eps = 1e-12) => a.forEach((x, k) => close(x, b[k], eps));
const closeM = (a: q.Matrix, b: q.Matrix, eps = 1e-12) => a.forEach((row, i) => row.forEach((x, j) => { close(x.re, b[i][j].re, eps); close(x.im, b[i][j].im, eps); }));
const madd = (a: q.Matrix, b: q.Matrix): q.Matrix => a.map((row, i) => row.map((x, j) => q.add(x, b[i][j])));
const mscale = (m: q.Matrix, k: number): q.Matrix => m.map((row) => row.map((x) => q.scale(x, k)));
const conjBy = (u: q.Matrix, rho: q.Matrix) => q.matMul(q.matMul(u, rho), q.dagger(u));
const tr = (m: q.Matrix) => q.add(m[0][0], m[1][1]);
const S2 = Math.SQRT1_2;

const CH: Channel[] = ['bit', 'phase', 'depol', 'damp'];
// Every slider stop, p = k/100.
const PS = Array.from({ length: 101 }, (_, k) => k / 100);
const SOME_PS = [0, 0.01, 0.1, 0.2, 0.25, 0.37, 0.5, 0.63, 0.8, 0.99, 1];
// Points in the ball: the six axis ends, the center, the sphere lattice, and points inside.
const BALL: Vec[] = [
  ...STARTS.map((_, i) => startPoint(i)), [0, 0, 0],
  ...spherePoints(12), ...spherePoints(6).map((v) => v.map((x) => x * 0.55) as Vec), [0.3, -0.4, 0.5], [-0.6, 0.2, -0.7],
];
// A smaller set for the heavier loops: the axis ends, the center and a few points inside.
const FEW: Vec[] = [...BALL.slice(0, 7), [0.3, -0.4, 0.5], [-0.6, 0.2, -0.7], spherePoints(3)[1]];
const pure = (v: Vec) => Math.abs(length(v) - 1) < 1e-9;

// ---- Density matrices

test('rho = (I + xX + yY + zZ)/2 has trace 1, is Hermitian, and blochOf undoes rhoOf', () => {
  for (const v of BALL) {
    const r = rhoOf(v);
    close(tr(r).re, 1); close(tr(r).im, 0);
    closeM(r, q.dagger(r));
    closeV(blochOf(r), v);
    // Entries: rho00 = (1 + z)/2, rho10 = (x + iy)/2.
    close(r[0][0].re, (1 + v[2]) / 2); close(r[1][0].re, v[0] / 2); close(r[1][0].im, v[1] / 2);
  }
});

test('for a pure state, rhoOf of its Bloch point is |psi><psi|, and blochOf agrees with quantum.ts bloch()', () => {
  for (const [t, f] of [[0, 0], [180, 0], [90, 0], [37, 211], [123, 64], [90, 270]]) {
    const s = q.fromBloch((t * Math.PI) / 180, (f * Math.PI) / 180), v = q.bloch(s) as Vec;
    closeM(rhoOf(v), outer(s));
    closeV(blochOf(outer(s)), v);
  }
});

test('purity Tr rho^2 = (1 + |r|^2)/2: 1 on the surface, 1/2 at the center', () => {
  for (const v of BALL) close(purity(rhoOf(v)), (1 + length(v) ** 2) / 2);
  close(purity(rhoOf([0, 0, 0])), 0.5);
  for (let i = 0; i < 6; i++) close(purity(outer(ket(i))), 1);
});

// ---- The channels are channels

test('Kraus operators are complete, sum K^dagger K = I, for every channel at every slider stop', () => {
  for (const ch of CH) for (const p of PS) {
    const sum = kraus(ch, p).map((K) => q.matMul(q.dagger(K), K)).reduce(madd);
    closeM(sum, q.I);
  }
});

test('outputs are density matrices: trace 1, Hermitian, and the Bloch point stays in the ball (so both eigenvalues are >= 0)', () => {
  for (const ch of CH) for (const p of SOME_PS) for (const v of BALL) {
    const out = applyKraus(kraus(ch, p), rhoOf(v));
    close(tr(out).re, 1); close(tr(out).im, 0);
    closeM(out, q.dagger(out));
    assert.ok(length(blochOf(out)) <= 1 + 1e-12);
  }
});

test('the Kraus map equals the closed form: bit flip (x, (1-2p)y, (1-2p)z), phase flip ((1-2p)x, (1-2p)y, z), Wilde 4.339', () => {
  for (const p of SOME_PS) for (const v of BALL) {
    const f = 1 - 2 * p, [x, y, z] = v;
    closeV(after('bit', p, v), [x, f * y, f * z]);
    closeV(after('phase', p, v), [f * x, f * y, z]);
  }
});

test('the Kraus map equals the closed form: depolarizing (1-p)r, Wilde 4.347; amplitude damping (sqrt(1-g)x, sqrt(1-g)y, g + (1-g)z)', () => {
  for (const p of SOME_PS) for (const v of BALL) {
    const [x, y, z] = v, d = Math.sqrt(1 - p);
    closeV(after('depol', p, v), [(1 - p) * x, (1 - p) * y, (1 - p) * z]);
    closeV(after('damp', p, v), [d * x, d * y, p + (1 - p) * z]);
  }
});

test('affine() is the same map as the Kraus operators, and shape() is the image of the sphere', () => {
  for (const ch of CH) for (const p of SOME_PS) {
    const { scale: s, shift: t } = affine(ch, p);
    for (const v of BALL) closeV(after(ch, p, v), v.map((x, k) => s[k] * x + t[k]));
    const { axes, center } = shape(ch, p);
    closeV(after(ch, p, [0, 0, 0]), center);
    // The axis ends land at center +- semi-axis, and every surface point lands on the ellipsoid.
    for (let k = 0; k < 3; k++) {
      const e: Vec = [0, 0, 0]; e[k] = 1;
      close(Math.abs(after(ch, p, e)[k] - center[k]), axes[k]);
    }
    if (axes.every((a) => a > 1e-9)) {
      for (const v of spherePoints(50)) {
        const w = after(ch, p, v);
        close(w.reduce((acc, x, k) => acc + ((x - center[k]) / axes[k]) ** 2, 0), 1, 1e-9);
      }
    }
  }
});

test('the amplitude damping matrix matches Wilde 4.356: rho = [[1-a, h], [h*, a]] goes to [[1-(1-g)a, sqrt(1-g)h], [., (1-g)a]]', () => {
  const a = 0.35, h = q.c(0.2, -0.15);
  const rho: q.Matrix = [[q.c(1 - a), h], [q.conj(h), q.c(a)]];
  for (const g of SOME_PS) {
    const out = applyKraus(kraus('damp', g), rho);
    close(out[0][0].re, 1 - (1 - g) * a); close(out[1][1].re, (1 - g) * a);
    close(out[0][1].re, Math.sqrt(1 - g) * h.re); close(out[0][1].im, Math.sqrt(1 - g) * h.im);
  }
});

// ---- Known values and limits

test('p = 0 is no noise: every channel leaves every state alone', () => {
  for (const ch of CH) for (const v of BALL) closeV(after(ch, 0, v), v);
});

test('a sure flip is a gate, not noise: bit flip at p = 1 is X rho X, phase flip at p = 1 is Z rho Z, and pure stays pure', () => {
  for (const v of BALL) {
    closeM(applyKraus(kraus('bit', 1), rhoOf(v)), conjBy(q.X, rhoOf(v)));
    closeM(applyKraus(kraus('phase', 1), rhoOf(v)), conjBy(q.Z, rhoOf(v)));
    if (pure(v)) { assert.ok(pure(after('bit', 1, v))); assert.ok(pure(after('phase', 1, v))); }
  }
});

test('phase flip at p = 1/2 is complete dephasing: it zeros the off-diagonal entries and keeps the diagonal (Watrous; Wilde 4.338)', () => {
  for (const v of BALL) {
    const r = rhoOf(v), out = applyKraus(kraus('phase', 0.5), r);
    close(out[0][1].re, 0); close(out[0][1].im, 0); close(out[1][0].re, 0); close(out[1][0].im, 0);
    close(out[0][0].re, r[0][0].re); close(out[1][1].re, r[1][1].re);
  }
});

test('bit flip at p = 1/2 squashes the ball onto the x axis; phase flip onto the z axis', () => {
  for (const v of BALL) {
    closeV(after('bit', 0.5, v), [v[0], 0, 0]);
    closeV(after('phase', 0.5, v), [0, 0, v[2]]);
  }
});

test('depolarizing at p = 1 is the completely depolarizing channel Tr(rho) I/2 (Watrous Omega)', () => {
  for (const v of BALL) closeM(applyKraus(kraus('depol', 1), rhoOf(v)), mscale(q.I, 0.5));
});

test('amplitude damping at gamma = 1 is the reset channel Tr(rho)|0><0| (Watrous)', () => {
  for (const v of BALL) closeM(applyKraus(kraus('damp', 1), rhoOf(v)), outer(q.ket0()));
});

test('fixed points: bit flip keeps the x axis, phase flip keeps the z axis, amplitude damping keeps |0>', () => {
  for (const p of PS) {
    for (const s of [-1, -0.4, 0, 0.7, 1]) {
      closeV(after('bit', p, [s, 0, 0]), [s, 0, 0]);
      closeV(after('phase', p, [0, 0, s]), [0, 0, s]);
    }
    closeV(after('damp', p, [0, 0, 1]), [0, 0, 1]);
  }
});

test('unital: bit flip, phase flip and depolarizing keep I/2; amplitude damping moves it to (0, 0, gamma)', () => {
  for (const p of PS) {
    for (const ch of ['bit', 'phase', 'depol'] as const) closeV(after(ch, p, [0, 0, 0]), [0, 0, 0]);
    closeV(after('damp', p, [0, 0, 0]), [0, 0, p]);
  }
});

test('unital channels never raise purity; amplitude damping can (I/2 becomes purer, and at gamma = 1 pure)', () => {
  for (const ch of ['bit', 'phase', 'depol'] as const) for (const p of SOME_PS) for (const v of BALL) {
    assert.ok(length(after(ch, p, v)) <= length(v) + 1e-12);
  }
  for (const g of SOME_PS.filter((g) => g > 0)) assert.ok(purity(rhoOf(after('damp', g, [0, 0, 0]))) > 0.5);
  assert.ok(pure(after('damp', 1, [0, 0, 0])));
});

// ---- The forms the lesson quotes

test('depolarizing in Pauli form: (1 - 3p/4) rho + (p/4)(X rho X + Y rho Y + Z rho Z) = (1 - p) rho + p I/2 (Wilde 4.344, 4.346)', () => {
  for (const p of SOME_PS) for (const v of BALL) {
    const r = rhoOf(v);
    const pauli = [conjBy(q.X, r), conjBy(q.Y, r), conjBy(q.Z, r)].reduce(madd);
    const lhs = madd(mscale(r, 1 - (3 * p) / 4), mscale(pauli, p / 4));
    closeM(lhs, madd(mscale(r, 1 - p), mscale(q.I, p / 2)));
    closeM(applyKraus(kraus('depol', p), r), lhs);
    // Counted as the total chance p' = 3p/4 of an X, Y or Z, the shrink factor 1 - p is 1 - 4p'/3.
    const a = (3 * p) / 4;
    closeM(madd(mscale(r, 1 - a), mscale(pauli, a / 3)), applyKraus(kraus('depol', p), r));
  }
});

test('the Pauli twirl: (rho + X rho X + Y rho Y + Z rho Z)/4 = I/2 (Wilde 4.345)', () => {
  for (const v of BALL) {
    const r = rhoOf(v);
    closeM(mscale([r, conjBy(q.X, r), conjBy(q.Y, r), conjBy(q.Z, r)].reduce(madd), 0.25), mscale(q.I, 0.5));
  }
});

test('phase damping {|0><0| + sqrt(1-l)|1><1|, sqrt(l)|1><1|} is the phase flip with 1 - 2p = sqrt(1 - l) (N&C 8.3.6)', () => {
  for (const l of SOME_PS) {
    const K0: q.Matrix = [[q.c(1), q.c(0)], [q.c(0), q.c(Math.sqrt(1 - l))]], K1: q.Matrix = [[q.c(0), q.c(0)], [q.c(0), q.c(Math.sqrt(l))]];
    const p = (1 - Math.sqrt(1 - l)) / 2;
    closeM(madd(q.matMul(q.dagger(K0), K0), q.matMul(q.dagger(K1), K1)), q.I);
    for (const v of BALL) closeM(applyKraus([K0, K1], rhoOf(v)), applyKraus(kraus('phase', p), rhoOf(v)));
  }
});

test('the bit flip is the Pauli channel with pI = 1 - p, pX = p, which Wilde 4.343 maps to (x, (1-2p)y, (1-2p)z)', () => {
  for (const p of SOME_PS) {
    const [pI, pX, pY, pZ] = [1 - p, p, 0, 0];
    const m = [pI + pX - pY - pZ, pI + pY - pX - pZ, pI + pZ - pX - pY];
    closeV(affine('bit', p).scale, m);
    const [qI, qX, qY, qZ] = [1 - p, 0, 0, p];
    closeV(affine('phase', p).scale, [qI + qX - qY - qZ, qI + qY - qX - qZ, qI + qZ - qX - qY]);
    const [dI, d] = [1 - (3 * p) / 4, p / 4];
    closeV(affine('depol', p).scale, [dI + d - d - d, dI + d - d - d, dI + d - d - d]);
  }
});

test('composition: damping g1 then g2 is damping 1 - (1-g1)(1-g2) (Wilde Ex. 4.7.8); flips and depolarizing multiply their shrink', () => {
  const AB = [0, 0.1, 0.37, 0.8, 1];
  for (const a of AB) for (const b of AB) for (const v of FEW) {
    closeV(after('damp', b, after('damp', a, v)), after('damp', 1 - (1 - a) * (1 - b), v));
    // Two bit flips: an odd number of X's happens with chance a(1-b) + b(1-a), and (1-2a)(1-2b) = 1 - 2(a + b - 2ab).
    closeV(after('bit', b, after('bit', a, v)), after('bit', a + b - 2 * a * b, v));
    closeV(after('phase', b, after('phase', a, v)), after('phase', a + b - 2 * a * b, v));
    closeV(after('depol', b, after('depol', a, v)), after('depol', 1 - (1 - a) * (1 - b), v));
  }
});

// ---- Symmetries

test('depolarizing treats every direction alike: E(U rho U^dagger) = U E(rho) U^dagger for rotations U', () => {
  const us = [q.H, q.S, q.RX(0.7), q.RY(2.1), q.RZ(-1.3), q.matMul(q.RY(0.4), q.RZ(1.9))];
  for (const p of SOME_PS) for (const u of us) for (const v of FEW) {
    const ks = kraus('depol', p);
    closeM(applyKraus(ks, conjBy(u, rhoOf(v))), conjBy(u, applyKraus(ks, rhoOf(v))));
  }
});

test('a Hadamard swaps bit flip and phase flip: H (bit flip) H = phase flip, since H X H = Z', () => {
  for (const p of SOME_PS) for (const v of BALL) {
    const lhs = conjBy(q.H, applyKraus(kraus('bit', p), conjBy(q.H, rhoOf(v))));
    closeM(lhs, applyKraus(kraus('phase', p), rhoOf(v)));
  }
});

test('bit flip and phase flip commute with every Pauli; amplitude damping is not symmetric under X (it favors |0>)', () => {
  for (const ch of ['bit', 'phase', 'depol'] as const) for (const s of [q.X, q.Y, q.Z]) for (const p of SOME_PS) for (const v of FEW) {
    closeM(applyKraus(kraus(ch, p), conjBy(s, rhoOf(v))), conjBy(s, applyKraus(kraus(ch, p), rhoOf(v))));
  }
  // Mirrored by X, damping would push toward |1>: X E(X|0><0|X) X has z = 1 - 2g, while E(|0><0|) stays at z = 1.
  for (const g of SOME_PS.filter((g) => g > 0)) {
    const mirrored = blochOf(conjBy(q.X, applyKraus(kraus('damp', g), conjBy(q.X, rhoOf([0, 0, 1])))));
    close(mirrored[2], 1 - 2 * g); close(after('damp', g, [0, 0, 1])[2], 1);
  }
});

// ---- The start states and the Born rule

test('the six start states sit at the axis ends, and each "other" is the orthogonal state at the opposite end', () => {
  const ends: Vec[] = [[0, 0, 1], [0, 0, -1], [1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0]];
  STARTS.forEach((s, i) => {
    closeV(startPoint(i), ends[i]);
    close(q.norm2(ket(i)), 1);
    const j = STARTS.findIndex((t) => t.name === s.other);
    closeV(startPoint(j), startPoint(i).map((x) => -x));
    close(q.abs2(q.inner(ket(i), ket(j))), 0);
    assert.equal(STARTS[j].basis, s.basis);
  });
});

test('keep chance = <psi|E(psi)|psi> = (1 + n.r\')/2, in [0, 1], and with its partner it sums to 1 (Born rule)', () => {
  for (const ch of CH) for (const p of SOME_PS) STARTS.forEach((s, i) => {
    const k = keepChance(ch, p, i), n = startPoint(i), w = after(ch, p, n);
    close(k, (1 + n[0] * w[0] + n[1] * w[1] + n[2] * w[2]) / 2);
    assert.ok(k >= 0 && k <= 1);
    // The other outcome, by the Born rule on the orthogonal state.
    const j = STARTS.findIndex((t) => t.name === s.other), out = applyKraus(kraus(ch, p), outer(ket(i)));
    close(k + q.inner(ket(j), q.matVec(out, ket(j))).re, 1);
  });
});

test('known keep chances: bit flip |0> 1-p, phase flip |0> 1, phase flip |+> 1-p, depolarizing 1-p/2, damping |1> 1-g, |+> (1+sqrt(1-g))/2', () => {
  for (const p of PS) {
    close(keepChance('bit', p, 0), 1 - p); close(keepChance('bit', p, 2), 1); close(keepChance('bit', p, 4), 1 - p);
    close(keepChance('phase', p, 0), 1); close(keepChance('phase', p, 1), 1); close(keepChance('phase', p, 2), 1 - p); close(keepChance('phase', p, 5), 1 - p);
    for (let i = 0; i < 6; i++) close(keepChance('depol', p, i), 1 - p / 2);
    close(keepChance('damp', p, 0), 1); close(keepChance('damp', p, 1), 1 - p);
    for (const i of [2, 3, 4, 5]) close(keepChance('damp', p, i), (1 + Math.sqrt(1 - p)) / 2);
  }
  // The student example: started as |+>, a phase flip with p = 0.1 leaves x = 0.8, so + with chance 90%.
  close(after('phase', 0.1, startPoint(2))[0], 0.8); close(keepChance('phase', 0.1, 2), 0.9);
  // Exact ends are exact: no float dust at 0 or 1.
  assert.equal(keepChance('bit', 1, 0), 0); assert.equal(keepChance('phase', 0.37, 0), 1); assert.equal(keepChance('damp', 1, 1), 0);
});

test('results: copy j gives the start state when its draw is below the chance; fixed draws flip one way as the chance grows', () => {
  const us = Array.from({ length: COPIES }, (_, j) => (j + 0.5) / COPIES);
  for (const k of [0, 0.2, 0.5, 0.83, 1]) assert.equal(kept(results(us, k)), Math.round(k * COPIES));
  const r = q.rng(7), draws = Array.from({ length: COPIES }, r);
  let last = -1;
  for (const k of PS) { const n = kept(results(draws, k)); assert.ok(n >= last); last = n; }
  assert.equal(results(draws, 1).every(Boolean), true); assert.equal(results(draws, 0).some(Boolean), false);
});

test('many seeded copies match the Born chance within 4 sigma', () => {
  const r = q.rng(2024), N = 20000;
  for (const [ch, p, i] of [['bit', 0.2, 0], ['damp', 0.3, 2], ['depol', 0.6, 4]] as const) {
    const k = keepChance(ch, p, i), n = kept(results(Array.from({ length: N }, r), k));
    assert.ok(Math.abs(n / N - k) < 4 * Math.sqrt((k * (1 - k)) / N), `${ch}: ${n / N} vs ${k}`);
  }
});

// ---- Words and numbers

test('num and vecText: two decimals, a true minus sign, never "−0.00"', () => {
  assert.equal(num(0.6), '0.60'); assert.equal(num(-0.4), '−0.40'); assert.equal(num(-0.001), '0.00'); assert.equal(num(1 - 2 * 0.35), '0.30');
  assert.equal(vecText([0, 0, -1]), '(0.00, 0.00, −1.00)');
  assert.equal(vecText(after('damp', 0.2, startPoint(2))), '(0.89, 0.00, 0.20)');
});

test('lenText never shows 1 for a mixed state or 0 for a state that is not fully mixed', () => {
  assert.equal(lenText([0, 0, 1]), '1'); assert.equal(lenText([0, 0, 0]), '0'); assert.equal(lenText([0.6, 0, 0]), '0.60');
  assert.equal(lenText(after('damp', 0.01, startPoint(2))), 'over 0.99');
  assert.equal(lenText([0.003, 0, 0]), 'under 0.01');
  for (const ch of CH) for (const p of PS) for (let i = 0; i < 6; i++) {
    const w = after(ch, p, startPoint(i)), t = lenText(w);
    if (t === '1') assert.ok(pure(w)); if (t === '0') assert.ok(length(w) < 1e-9);
  }
});

test('percents add to 100, and a real chance is never shown as 0% or 100%', () => {
  assert.deepEqual(percents(0.8), ['80%', '20%']); assert.deepEqual(percents(1), ['100%', '0%']); assert.deepEqual(percents(0), ['0%', '100%']);
  assert.deepEqual(percents(0.997), ['over 99%', 'under 1%']); assert.deepEqual(percents(0.003), ['under 1%', 'over 99%']);
  for (const ch of CH) for (const p of PS) for (let i = 0; i < 6; i++) {
    const k = keepChance(ch, p, i), [a, b] = percents(k);
    if (a.endsWith('%') && b.endsWith('%') && !a.includes(' ')) assert.equal(parseInt(a) + parseInt(b), 100);
    if (k > 0 && k < 1) { assert.notEqual(a, '100%'); assert.notEqual(a, '0%'); }
  }
  assert.equal(strength(0.2), '0.20'); assert.equal(strength(1), '1.00');
});

test('shapeText names the shape at the ends and in between', () => {
  for (const ch of CH) assert.equal(shapeText(ch, 0), 'No noise: the ball is unchanged.');
  assert.match(shapeText('bit', 0.2), /cigar along the x axis: y and z shrink to 0\.60\./);
  assert.match(shapeText('bit', 0.5), /squashed onto the x axis: a line from \|−⟩ to \|\+⟩/);
  assert.match(shapeText('bit', 0.8), /turned half a turn about it: y and z shrink to 0\.60 and change sign, since most copies get an X/);
  assert.match(shapeText('bit', 1), /Every copy gets an X, which is just a gate/);
  assert.match(shapeText('phase', 0.2), /cigar along the z axis: x and y shrink to 0\.60/);
  assert.match(shapeText('phase', 0.5), /line from \|1⟩ to \|0⟩/);
  assert.match(shapeText('phase', 1), /Every copy gets a Z/);
  assert.match(shapeText('depol', 0.3), /radius 0\.70/);
  assert.match(shapeText('depol', 1), /center, the fully mixed state I\/2/);
  assert.match(shapeText('damp', 0.2), /x and y shrink to 0\.89, z to 0\.80, and the center moves up to z = 0\.20/);
  assert.match(shapeText('damp', 1), /single point \|0⟩/);
});

test('every readout names the start state and the noise, and its numbers come from the channel', () => {
  for (const ch of CH) for (const p of SOME_PS) STARTS.forEach((s, i) => {
    const t = describe(ch, p, i, 37);
    assert.ok(t.startsWith(`Started as ${s.name}, then ${CHANNELS[ch].phrase} with ${CHANNELS[ch].sym} = ${strength(p)}.`), t);
    assert.ok(t.includes(`Measured in the ${s.basis} basis`), t);
    assert.ok(t.includes(vecText(after(ch, p, startPoint(i)))), t);
    assert.ok(t.endsWith(`Of ${COPIES} fresh copies, 37 gave ${s.name} and ${COPIES - 37} gave ${s.other}.`), t);
    assert.ok(!t.includes('—'));
  });
  assert.equal(describe('bit', 0.2, 0),
    'Started as |0⟩, then a bit flip with p = 0.20. The ball is squeezed into a cigar along the x axis: y and z shrink to 0.60. '
    + 'The point moves from (0.00, 0.00, 1.00) to (0.00, 0.00, 0.60), length 0.60. '
    + 'Measured in the 0/1 basis, a copy gives |0⟩ with chance 80% and |1⟩ with chance 20%.');
  assert.match(describe('phase', 0.3, 0), /The point stays at \(0\.00, 0\.00, 1\.00\): this noise leaves \|0⟩ alone\. Measured in the 0\/1 basis, every copy gives \|0⟩\./);
  assert.match(describe('bit', 1, 0, 0), /length 1: the state \|1⟩\. Measured in the 0\/1 basis, every copy gives \|1⟩\. Of 100 fresh copies, all 100 gave \|1⟩\./);
  assert.match(describe('damp', 0.5, 1), /length 0: the center, the fully mixed state I\/2/);
  assert.match(describe('depol', 0, 2, 100), /No noise: the ball is unchanged\. The point stays at \(1\.00, 0\.00, 0\.00\)\. Measured/);
  assert.match(valueText('damp', 0.2, 2), /^0\.20\. Started as \|\+⟩, a copy gives \|\+⟩ with chance 95%\.$/);
});

test('every channel has a name, a slider label with its symbol, and a one-line meaning', () => {
  for (const ch of CH) {
    const C = CHANNELS[ch];
    assert.ok(C.slider.endsWith(C.sym)); assert.ok(C.what.length > 20); assert.ok(!C.what.includes('—'));
  }
  assert.match(CHANNELS.phase.what, /dephasing/);
});

// ---- Settings and drawing math

test('the slider runs in hundredths from 0 to 1 and starts on a stop', () => {
  assert.equal(STRENGTH.min, 0); assert.equal(STRENGTH.max, 100); assert.equal(STRENGTH.step, 1);
  assert.ok(Number.isInteger(STRENGTH.start)); assert.ok(COPIES % 5 === 0);
  assert.equal(wrap(-30), 330); assert.equal(wrap(725), 5);
});

test('the camera is orthonormal and right-handed, and projecting keeps lengths (orthographic)', () => {
  for (const [yaw, tilt] of [[YAW, TILT], [0, 0], [137, -45], [300, 90]]) {
    const { right, up, toward } = camera(yaw, tilt), d = (a: Vec, b: Vec) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
    close(d(right, right), 1); close(d(up, up), 1); close(d(toward, toward), 1);
    close(d(right, up), 0); close(d(right, toward), 0); close(d(up, toward), 0);
    // right x up = toward
    closeV([right[1] * up[2] - right[2] * up[1], right[2] * up[0] - right[0] * up[2], right[0] * up[1] - right[1] * up[0]], toward);
    for (const v of BALL) { const s = project(v, camera(yaw, tilt)); close(s.x ** 2 + s.y ** 2 + s.depth ** 2, length(v) ** 2); }
  }
  // Seen from the default view, |0> is up on screen and in front of the equator's back half.
  assert.ok(project([0, 0, 1], camera(YAW, TILT)).y > 0.9);
});

test('spherePoints lie on the unit sphere and balance out', () => {
  const pts = spherePoints(640);
  assert.equal(pts.length, 640);
  for (const v of pts) close(length(v), 1);
  const m = pts.reduce((a, v) => a.map((x, k) => x + v[k] / pts.length), [0, 0, 0]);
  m.forEach((x) => assert.ok(Math.abs(x) < 0.01));
});
