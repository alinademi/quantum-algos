import test from 'node:test';
import assert from 'node:assert/strict';
import * as q from '../quantum.ts';
import * as pt from './partial-trace.ts';

const close = (a: number, b: number, eps = 1e-12) => assert.ok(Math.abs(a - b) < eps, `${a} != ${b}`);
const closeM = (a: q.Matrix, b: q.Matrix, eps = 1e-12) => {
  assert.equal(a.length, b.length);
  a.forEach((row, j) => row.forEach((x, k) => { close(x.re, b[j][k].re, eps); close(x.im, b[j][k].im, eps); }));
};
const sum = (xs: number[]) => xs.reduce((t, x) => t + x, 0);
const S2 = Math.SQRT1_2;
const tr = (m: q.Matrix) => m.reduce((t, row, i) => q.add(t, row[i]), q.c(0));
const half: q.Matrix = [[q.c(0.5), q.c(0)], [q.c(0), q.c(0.5)]];

// Seeded random cases. Fixed seed, so every run checks the same ones.
const R = q.rng(77);
const rc = () => q.c(R() * 2 - 1, R() * 2 - 1);
const randomState = (n = 4): q.State => q.normalize(Array.from({ length: n }, rc));
const randomM = (): q.Matrix => [[rc(), rc()], [rc(), rc()]];
const randomRho = (): q.Matrix => {
  // A mix of three random pure pairs: a mixed 4 by 4 density matrix.
  const ws = [0.5, 0.3, 0.2], ss = ws.map(() => randomState());
  return [0, 1, 2, 3].map((i) => [0, 1, 2, 3].map((j) => ss.reduce((t, s, k) => q.add(t, q.scale(q.mul(s[i], q.conj(s[j])), ws[k])), q.c(0))));
};
const randomU = (): q.Matrix => {
  const [a, b, c2] = [R(), R(), R()].map((x) => x * 2 * Math.PI);
  return q.matMul(q.matMul(q.RZ(a), q.RY(b)), q.RZ(c2));
};
const PS = [0, 0.01, 0.1, 0.25, 0.3, 0.5, 0.75, 0.9, 0.99, 1];

test('fromPercent: whole percent, kept between 0 and 1', () => {
  assert.equal(pt.fromPercent(50), 0.5);
  assert.equal(pt.fromPercent(0), 0);
  assert.equal(pt.fromPercent(100), 1);
  assert.equal(pt.fromPercent(-5), 0);
  assert.equal(pt.fromPercent(140), 1);
  assert.equal(pt.fromPercent(33.4), 0.33);
});

test('tidy turns float dust into the exact value', () => {
  assert.equal(pt.tidy(0.5000000000000001), 0.5);
  assert.equal(pt.tidy(1.0000000000000002), 1);
  assert.equal(Object.is(pt.tidy(-1e-17), 0), true);
});

test('gateAngle: sin^2(theta/2) = p, so RY(theta) on 0 reads 1 with chance p', () => {
  for (const p of PS) {
    const t = pt.gateAngle(p);
    close(Math.sin(t / 2) ** 2, p);
    close(q.probOne(q.apply1(q.ket0(), q.RY(t), 0, 1), 0, 1), p);
  }
  close(pt.gateAngle(0), 0);
  close(pt.gateAngle(0.5), Math.PI / 2);
  close(pt.gateAngle(1), Math.PI);
});

test('RY at p = 1/2 does to 0 what a Hadamard gate does: the state |+>', () => {
  const s = q.apply1(q.ket0(), q.RY(pt.gateAngle(0.5)), 0, 1), h = q.apply1(q.ket0(), q.H, 0, 1);
  s.forEach((x, i) => { close(x.re, h[i].re); close(x.im, h[i].im); });
});

test('pair: started as 00, then RY on A, then CNOT: sqrt(1-p)|00> + sqrt(p)|11>', () => {
  for (const p of PS) {
    const s = pt.pair(p, true);
    close(s[0].re, Math.sqrt(1 - p)); close(s[3].re, Math.sqrt(p));
    close(q.abs(s[1]), 0); close(q.abs(s[2]), 0);
    close(q.norm2(s), 1);
  }
});

test('pair without the CNOT is the product (sqrt(1-p)|0> + sqrt(p)|1>) with |0>', () => {
  for (const p of PS) {
    const s = pt.pair(p, false), want = q.tensor([q.c(Math.sqrt(1 - p)), q.c(Math.sqrt(p))], q.ket0());
    s.forEach((x, i) => { close(x.re, want[i].re); close(x.im, want[i].im); });
    close(q.norm2(s), 1);
  }
});

test('the Bell pair: p = 1/2 with the CNOT is (|00> + |11>)/sqrt2', () => {
  const s = pt.pair(0.5, true);
  [S2, 0, 0, S2].forEach((v, i) => { close(s[i].re, v); close(s[i].im, 0); });
});

test('density: Hermitian, trace 1, and a pure state has rho^2 = rho', () => {
  for (let k = 0; k < 6; k++) {
    const rho = pt.density(randomState());
    closeM(rho, q.dagger(rho));
    close(tr(rho).re, 1);
    closeM(q.matMul(rho, rho), rho);
  }
});

test('traceB(M tensor N) = tr(N) M and traceA(M tensor N) = tr(M) N, for random M and N', () => {
  for (let k = 0; k < 8; k++) {
    const m = randomM(), n = randomM(), mn = q.kron(m, n);
    const a = tr(n), b = tr(m);
    closeM(pt.traceB(mn), m.map((row) => row.map((x) => q.mul(x, a))));
    closeM(pt.traceA(mn), n.map((row) => row.map((x) => q.mul(x, b))));
  }
});

test('the partial trace is linear and keeps the trace', () => {
  for (let k = 0; k < 5; k++) {
    const x = randomRho(), y = randomRho(), w = 0.3;
    const mix = x.map((row, i) => row.map((v, j) => q.add(q.scale(v, w), q.scale(y[i][j], 1 - w))));
    const want = pt.traceB(x).map((row, i) => row.map((v, j) => q.add(q.scale(v, w), q.scale(pt.traceB(y)[i][j], 1 - w))));
    closeM(pt.traceB(mix), want);
    close(tr(pt.traceB(x)).re, tr(x).re);
    close(tr(pt.traceA(x)).re, tr(x).re);
    close(tr(pt.traceB(x)).im, 0);
  }
});

test('traceB equals Watrous\'s formula: sum over b of (I tensor <b|) rho (I tensor |b>)', () => {
  // (I tensor |b>) is a 4 by 2 matrix: column a is the basis ket |ab>.
  const iKet = (b: number): q.Matrix => [0, 1, 2, 3].map((i) => [0, 1].map((a) => q.c(i === 2 * a + b ? 1 : 0)));
  const iBra = (b: number): q.Matrix => q.dagger(iKet(b));
  for (let k = 0; k < 5; k++) {
    const rho = randomRho();
    const want = [0, 1].map((b) => q.matMul(q.matMul(iBra(b), rho), iKet(b))).reduce((t, m) => t.map((row, i) => row.map((v, j) => q.add(v, m[i][j]))));
    closeM(pt.traceB(rho), want);
  }
});

test('traceA equals the same sum with A and B swapped: sum over a of (<a| tensor I) rho (|a> tensor I)', () => {
  const ket = (a: number): q.Matrix => [0, 1, 2, 3].map((i) => [0, 1].map((b) => q.c(i === 2 * a + b ? 1 : 0)));
  for (let k = 0; k < 5; k++) {
    const rho = randomRho();
    const want = [0, 1].map((a) => q.matMul(q.matMul(q.dagger(ket(a)), rho), ket(a))).reduce((t, m) => t.map((row, i) => row.map((v, j) => q.add(v, m[i][j]))));
    closeM(pt.traceA(rho), want);
  }
});

test('Aaronson eq. 6.10: (rho_B)_{jj\'} = sum_i alpha_ij alpha*_ij\' for a pure pair', () => {
  for (let k = 0; k < 6; k++) {
    const s = randomState(), rB = pt.traceA(pt.density(s));
    for (let j = 0; j < 2; j++) for (let j2 = 0; j2 < 2; j2++) {
      const want = [0, 1].reduce((t, i) => q.add(t, q.mul(s[2 * i + j], q.conj(s[2 * i + j2]))), q.c(0));
      close(rB[j][j2].re, want.re); close(rB[j][j2].im, want.im);
    }
  }
});

test('Aaronson\'s worked example: (|00> + |01> + |10>)/sqrt3 gives Bob (1/3)[[2, 1], [1, 1]]', () => {
  const s = [1, 1, 1, 0].map((v) => q.c(v / Math.sqrt(3))), rB = pt.traceA(pt.density(s));
  [[2, 1], [1, 1]].forEach((row, i) => row.forEach((v, j) => { close(rB[i][j].re, v / 3); close(rB[i][j].im, 0); }));
});

test('reducedA is Hermitian, has trace 1 and no negative eigenvalues, for random pure pairs', () => {
  for (let k = 0; k < 10; k++) {
    const r = pt.reducedA(randomState());
    closeM(r, q.dagger(r));
    close(tr(r).re, 1);
    // A 2 by 2 Hermitian matrix has eigenvalues (t +- sqrt(t^2 - 4 det))/2: both >= 0 when det >= 0 and t >= 0.
    const det = r[0][0].re * r[1][1].re - q.abs2(r[0][1]);
    assert.ok(det > -1e-12);
  }
});

test('half of a Bell pair is I/2, the fully mixed state, for A and for B', () => {
  const rho = pt.density(pt.pair(0.5, true));
  closeM(pt.traceB(rho), half);
  closeM(pt.traceA(rho), half);
  close(pt.purity(pt.reducedA(pt.pair(0.5, true))), 0.5);
  assert.equal(pt.kind(pt.reducedA(pt.pair(0.5, true))), 'fully');
});

test('the Bell pair\'s linked entry (00, 11) sits where B\'s bits differ, so the trace never uses it', () => {
  assert.equal(pt.kept(0, 3), false);
  assert.equal(pt.kept(3, 0), false);
  const rho = pt.density(pt.pair(0.5, true));
  close(rho[0][3].re, 0.5);
  closeM(pt.traceB(rho), half);
});

test('linked pair: rho_A = diag(1-p, p), purity (1-p)^2 + p^2, mixed unless p is 0, 1/2 or 1', () => {
  for (const p of PS) {
    const r = pt.reducedA(pt.pair(p, true));
    close(r[0][0].re, 1 - p); close(r[1][1].re, p); close(q.abs(r[0][1]), 0); close(q.abs(r[1][0]), 0);
    close(pt.purity(r), (1 - p) ** 2 + p ** 2);
    assert.equal(pt.kind(r), p === 0 || p === 1 ? 'pure' : p === 0.5 ? 'fully' : 'mixed');
  }
});

test('unlinked pair: rho_A is the pure state |phi><phi| with phi = (sqrt(1-p), sqrt(p))', () => {
  for (const p of PS) {
    const r = pt.reducedA(pt.pair(p, false)), phi = [q.c(Math.sqrt(1 - p)), q.c(Math.sqrt(p))];
    closeM(r, pt.density(phi));
    close(pt.purity(r), 1);
    assert.equal(pt.kind(r), 'pure');
  }
});

test('tracing a product gives each factor back: traceB(rho_A tensor rho_B) = rho_A', () => {
  for (let k = 0; k < 5; k++) {
    const a = pt.density(randomState(2)), b = pt.density(randomState(2));
    closeM(pt.traceB(q.kron(a, b)), a);
    closeM(pt.traceA(q.kron(a, b)), b);
  }
});

test('entries of the pair\'s matrix that traceB skips never change rho_A', () => {
  const rho = randomRho(), bent = rho.map((row, i) => row.map((x, j) => (pt.kept(i, j) ? x : rc())));
  closeM(pt.traceB(bent), pt.traceB(rho));
  let used = 0;
  for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) if (pt.kept(i, j)) used++;
  assert.equal(used, 8);
});

test('blockOf and kept: each of the four blocks holds exactly two kept entries, its diagonal', () => {
  const seen = new Map<string, [number, number][]>();
  for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) {
    if (!pt.kept(i, j)) continue;
    const key = pt.blockOf(i, j).join(',');
    seen.set(key, [...(seen.get(key) ?? []), [i, j]]);
  }
  assert.equal(seen.size, 4);
  for (const cells of seen.values()) {
    assert.equal(cells.length, 2);
    // Inside a block the two kept cells are (0,0) and (1,1) of that block: rows and columns move together.
    assert.deepEqual(cells.map(([i, j]) => (i & 1) - (j & 1)), [0, 0]);
  }
  assert.deepEqual(pt.blockOf(0, 3), [0, 1]);
  assert.deepEqual(pt.blockOf(3, 0), [1, 0]);
  assert.deepEqual(pt.blockOf(2, 2), [1, 1]);
});

test('Wilde eq. 4.148: tr((M tensor I) rho_AB) = tr(M rho_A), for random M and random mixed rho_AB', () => {
  const I2 = q.I;
  for (let k = 0; k < 8; k++) {
    const m = randomM(), rho = randomRho();
    const lhs = tr(q.matMul(q.kron(m, I2), rho)), rhs = tr(q.matMul(m, pt.traceB(rho)));
    close(lhs.re, rhs.re); close(lhs.im, rhs.im);
  }
});

test('Born rule from the whole pair, B left alone, equals the Born rule from rho_A, for every test', () => {
  const states = [...PS.flatMap((p) => [pt.pair(p, true), pt.pair(p, false)]), ...Array.from({ length: 8 }, () => randomState())];
  for (const s of states) {
    const rA = pt.reducedA(s);
    for (const t of pt.TESTS) {
      const a = pt.oddsPair(s, t), b = pt.oddsA(rA, t);
      close(a[0], b[0]); close(a[1], b[1]);
      close(a[0] + a[1], 1);
    }
  }
});

test('an unrecorded measurement of B in any basis leaves A with the average that equals rho_A', () => {
  for (let k = 0; k < 6; k++) {
    const s = randomState(), u = randomU(), want = pt.reducedA(s);
    let avg: q.Matrix = [[q.c(0), q.c(0)], [q.c(0), q.c(0)]];
    for (const col of [0, 1]) {
      const bk: q.State = [u[0][col], u[1][col]];
      // (I tensor <b|) psi is A's unnormalised state; its outer product already carries the chance of b.
      const phi = [0, 1].map((a) => q.add(q.mul(q.conj(bk[0]), s[2 * a]), q.mul(q.conj(bk[1]), s[2 * a + 1])));
      avg = avg.map((row, i) => row.map((v, j) => q.add(v, q.mul(phi[i], q.conj(phi[j])))));
    }
    closeM(avg, want);
  }
});

test('a pure pair has equal purity for A and B, and A is pure exactly when the pair is a product', () => {
  for (let k = 0; k < 8; k++) {
    const s = randomState(), rho = pt.density(s);
    close(pt.purity(pt.traceB(rho)), pt.purity(pt.traceA(rho)));
  }
  // A product has 1; this entangled one does not.
  close(pt.purity(pt.reducedA(q.tensor(q.normalize([rc(), rc()]), q.normalize([rc(), rc()])))), 1);
  assert.ok(pt.purity(pt.reducedA(pt.pair(0.3, true))) < 1);
});

test('purity of a qubit is (1 + r^2)/2, with r the length of the Bloch vector, and 1/2 only at the centre', () => {
  for (let k = 0; k < 8; k++) {
    const r = pt.reducedA(randomState()), [x, y, z] = pt.blochOf(r);
    close(pt.purity(r), (1 + x * x + y * y + z * z) / 2);
    assert.ok(x * x + y * y + z * z <= 1 + 1e-12);
  }
  assert.deepEqual(pt.blochOf(half).map(pt.tidy), [0, 0, 0]);
});

test('blochOf: |0>, |1>, |+>, |-i> and the matrix rho = (I + xX + yY + zZ)/2', () => {
  assert.deepEqual(pt.blochOf(pt.density(q.ket0())).map(pt.tidy), [0, 0, 1]);
  assert.deepEqual(pt.blochOf(pt.density(q.ket1())).map(pt.tidy), [0, 0, -1]);
  assert.deepEqual(pt.blochOf(pt.density(q.plus())).map(pt.tidy), [1, 0, 0]);
  assert.deepEqual(pt.blochOf(pt.density(pt.kets('y')[0])).map(pt.tidy), [0, 1, 0]);
  assert.deepEqual(pt.blochOf(pt.density(pt.kets('y')[1])).map(pt.tidy), [0, -1, 0]);
  for (let k = 0; k < 5; k++) {
    const r = pt.reducedA(randomState()), [x, y, z] = pt.blochOf(r);
    const built: q.Matrix = [[q.c(1 + z), q.c(x, -y)], [q.c(x, y), q.c(1 - z)]].map((row) => row.map((v) => q.scale(v, 0.5)));
    closeM(r, built);
  }
});

test('the three tests: orthonormal kets, and P(first result) = (1 + r_t)/2 for the Bloch vector r of rho_A', () => {
  for (const t of pt.TESTS) {
    const [u0, u1] = pt.kets(t);
    close(q.norm2(u0), 1); close(q.norm2(u1), 1); close(q.abs(q.inner(u0, u1)), 0);
  }
  for (let k = 0; k < 8; k++) {
    const r = pt.reducedA(randomState()), v = pt.blochOf(r);
    // blochOf gives (x, y, z); the tests are named z, x, y.
    const axis = { z: v[2], x: v[0], y: v[1] };
    for (const t of pt.TESTS) {
      close(pt.oddsA(r, t)[0], (1 + axis[t]) / 2);
      close(pt.oddsA(r, t)[1], (1 - axis[t]) / 2);
    }
  }
});

test('the three tests together fix rho_A: equal odds in all three means equal matrices', () => {
  const a = pt.reducedA(pt.pair(0.3, true)), b = pt.reducedA(pt.pair(0.3, false));
  // Same z odds, but the +/- test tells linked from unlinked.
  close(pt.oddsA(a, 'z')[0], pt.oddsA(b, 'z')[0]);
  assert.ok(Math.abs(pt.oddsA(a, 'x')[0] - pt.oddsA(b, 'x')[0]) > 0.1);
});

test('Bell pair: every test on A alone is 50/50', () => {
  const s = pt.pair(0.5, true);
  for (const t of pt.TESTS) pt.oddsPair(s, t).forEach((v) => close(v, 0.5));
});

test('unlinked pair at p = 1/2, A is |+>: the +/- test gives + every time, the 0/1 test is 50/50', () => {
  const s = pt.pair(0.5, false);
  close(pt.oddsPair(s, 'x')[0], 1);
  close(pt.oddsPair(s, 'z')[0], 0.5);
  close(pt.oddsPair(s, 'y')[0], 0.5);
});

test('chance is <u|rho|u>', () => {
  close(pt.chance(half, q.plus()), 0.5);
  close(pt.chance(pt.density(q.plus()), q.plus()), 1);
  close(pt.chance(pt.density(q.plus()), q.minus()), 0);
  close(pt.chance(pt.density(q.ket0()), pt.kets('y')[0]), 0.5);
});

test('ownKet recovers a pure rho up to a global phase', () => {
  for (const p of PS) {
    const phi = pt.ownKet(pt.reducedA(pt.pair(p, false)));
    close(q.norm2(phi), 1);
    closeM(pt.density(phi), pt.reducedA(pt.pair(p, false)));
  }
  for (let k = 0; k < 4; k++) {
    const s = q.normalize([rc(), rc()]);
    closeM(pt.density(pt.ownKet(pt.density(s))), pt.density(s));
  }
});

test('result: the Born rule draw. u under the first odds gives 0, otherwise 1', () => {
  assert.equal(pt.result([0.25, 0.75], 0), 0);
  assert.equal(pt.result([0.25, 0.75], 0.2499), 0);
  assert.equal(pt.result([0.25, 0.75], 0.25), 1);
  assert.equal(pt.result([0.25, 0.75], 0.9999), 1);
  for (const u of [0, 0.3, 0.9999999999999999]) {
    assert.equal(pt.result([1, 0], u), 0);
    assert.equal(pt.result([0, 1], u), 1);
  }
});

test('result: dust-sized odds (float noise on a zero) are never drawn', () => {
  for (const u of [0, 0.5, 0.9999999999999999]) {
    assert.equal(pt.result([1 - 1e-16, 1e-30], u), 0);
    assert.equal(pt.result([1e-30, 1], u), 1);
  }
});

test('counts: an even sweep of the random number gives exactly n times the Born rule odds', () => {
  const s = pt.pair(0.5, true), n = 1000;
  const shots: pt.Shot[] = pt.TESTS.flatMap((test) => Array.from({ length: n }, (_, k) => ({ test, u: (k + 0.5) / n })));
  const k = pt.counts(s, shots);
  for (const t of pt.TESTS) assert.deepEqual(k[t], [n / 2, n / 2]);
  // An uneven pair: linked at p = 0.25, the 0/1 test gives 0 with chance 0.75.
  const k2 = pt.counts(pt.pair(0.25, true), shots);
  assert.deepEqual(k2.z, [750, 250]);
  assert.equal(k2.z[0] + k2.z[1], n);
  assert.equal(k2.x[0] + k2.x[1], n);
});

test('counts: a shot belongs to one test only', () => {
  const k = pt.counts(pt.pair(0.5, true), [{ test: 'x', u: 0.1 }, { test: 'x', u: 0.9 }, { test: 'y', u: 0.4 }]);
  assert.deepEqual(k.z, [0, 0]);
  assert.deepEqual(k.x, [1, 1]);
  assert.deepEqual(k.y, [1, 0]);
});

test('spread is the binomial standard deviation sqrt(n p (1 - p)), largest at p = 1/2', () => {
  close(pt.spread(100, 0.5), 5);
  close(pt.spread(100, 0), 0);
  close(pt.spread(100, 1), 0);
  close(pt.spread(300, 0.25), Math.sqrt(300 * 0.1875));
  for (const p of PS) assert.ok(pt.spread(200, p) <= pt.spread(200, 0.5) + 1e-12);
});

test('pileGrid: dots fit the box, at the biggest pitch up to the max', () => {
  for (const [w, h, n] of [[36, 150, 300], [84, 190, 300], [10, 10, 1], [200, 200, 5]] as const) {
    const g = pt.pileGrid(w, h, n);
    assert.ok(g.pitch >= 1 && g.pitch <= 9);
    assert.ok(g.cols >= 1);
    if (g.pitch > 1) assert.ok(g.cols * Math.floor(h / g.pitch) >= n);
  }
  assert.equal(pt.pileGrid(200, 200, 5).pitch, 9);
});

test('words: num, degrees, ketText', () => {
  assert.equal(pt.num(0), '0');
  assert.equal(pt.num(1), '1');
  assert.equal(pt.num(-1), '−1');
  assert.equal(pt.num(0.5), '0.50');
  assert.equal(pt.num(0.7071067811865476), '0.71');
  assert.equal(pt.num(-0.25), '−0.25');
  assert.equal(pt.num(0.5000000000000001), '0.50');
  assert.equal(pt.num(1.0000000000000002), '1');
  assert.equal(pt.num(-1e-17), '0');
  assert.equal(pt.degrees(0.5), '90°');
  assert.equal(pt.degrees(0), '0°');
  assert.equal(pt.degrees(1), '180°');
  assert.equal(pt.degrees(0.3), '66.4°');
  assert.equal(pt.ketText(pt.pair(0.5, true)), '0.71|00⟩ + 0.71|11⟩');
  assert.equal(pt.ketText(pt.pair(0, true)), '|00⟩');
  assert.equal(pt.ketText(pt.pair(1, false)), '|10⟩');
  assert.equal(pt.ketText(q.minus()), '0.71|0⟩ − 0.71|1⟩');
});

test('made and pairText name the start state and the gates', () => {
  assert.equal(pt.made(0.5, true), 'Started as 00, then RY(90°) on A (on 0 it acts like a Hadamard gate), then a CNOT from A to B');
  assert.equal(pt.made(0.25, false), 'Started as 00, then RY(60°) on A, and no CNOT');
  assert.equal(pt.pairText(0.5, true), `${pt.made(0.5, true)}: |ψ⟩ = 0.71|00⟩ + 0.71|11⟩.`);
});

test('sumText and sumsText show the sum each entry of rho_A is made from', () => {
  const rho = pt.density(pt.pair(0.5, true));
  assert.equal(pt.sumText(rho, 0, 0), '0.50 + 0');
  assert.equal(pt.sumText(rho, 0, 1), '0 + 0');
  assert.equal(pt.sumText(rho, 1, 1), '0 + 0.50');
  assert.equal(pt.sumsText(rho), 'top left block: 0.50 + 0 = 0.50; top right block: 0 + 0 = 0; bottom left block: 0 + 0 = 0; bottom right block: 0 + 0.50 = 0.50');
  const prod = pt.density(pt.pair(0.5, false));
  assert.equal(pt.sumText(prod, 0, 1), '0.50 + 0');
});

test('verdict: fully mixed, pure with a sure test, pure with none, mixed', () => {
  const v = (p: number, l: boolean) => pt.verdict(pt.reducedA(pt.pair(p, l)));
  assert.match(v(0.5, true), /I\/2, the fully mixed state/);
  assert.match(v(0.5, true), /a state of A, but not a pure one/);
  assert.match(v(0.5, true), /50\/50 in every basis/);
  assert.doesNotMatch(v(0.5, true), /no state|whichever way/);
  assert.match(v(0.3, true), /no basis test of A alone is sure/);
  assert.match(v(0.5, true), /0\.5/);
  assert.match(v(0.5, false), /pure state/);
  assert.match(v(0.5, false), /The \+\/− test gives \+ every time/);
  assert.match(v(0, false), /The 0\/1 test gives 0 every time/);
  assert.match(v(1, false), /The 0\/1 test gives 1 every time/);
  assert.match(v(1, true), /The 0\/1 test gives 1 every time/);
  assert.doesNotMatch(v(0.3, false), /every time/);
  assert.match(v(0.3, false), /pure state/);
  assert.match(v(0.3, true), /mixed state/);
  assert.match(v(0.3, true), /below 1/);
  assert.match(v(0.3, true), /0\.58/);
});

test('rhoText says the diagonal and off-diagonal entries', () => {
  assert.match(pt.rhoText(0.5, true), /0\.50 and 0\.50 on the diagonal and 0 off it/);
  assert.match(pt.rhoText(0.5, false), /0\.50 and 0\.50 on the diagonal and 0\.50 off it/);
});

test('report: names the start state, gives counts and the Born rule from rho_A', () => {
  const none = pt.report(0.5, true, []);
  assert.match(none, /Started as 00/);
  assert.match(none, /Measure A on fresh pairs/);
  const shots: pt.Shot[] = Array.from({ length: 100 }, (_, k) => ({ test: 'x' as const, u: (k + 0.5) / 100 }));
  const t = pt.report(0.5, true, shots);
  assert.match(t, /\+\/− test, \+ on 50 of 100 \(50%\)/);
  assert.match(t, /P\(\+\) = 50%/);
  assert.match(t, /With up to 100 pairs a test/);
  assert.match(t, /at most about 5/);
  assert.doesNotMatch(t, /0\/1 test, /);
});

test('constants: a press measures 100 pairs and a test holds 300', () => {
  assert.equal(pt.BATCH, 100);
  assert.equal(pt.CAP, 300);
  assert.deepEqual(pt.NAMES.z, ['0', '1']);
  assert.deepEqual(pt.NAMES.x, ['+', '−']);
  assert.deepEqual(pt.NAMES.y, ['+i', '−i']);
  assert.ok(sum(pt.TESTS.map(() => 1)) === 3);
});

test('report: with unequal counts the wobble line uses the biggest count', () => {
  const mk = (test: pt.Test, n: number): pt.Shot[] => Array.from({ length: n }, (_, k) => ({ test, u: (k + 0.5) / n }));
  const t = pt.report(0.5, true, [...mk('x', 100), ...mk('z', 300)]);
  assert.match(t, /With up to 300 pairs a test/);
  assert.match(t, /at most about 9\./);
});

test('sorted by B\'s 0/1 result, A of the Bell pair is |0> or |1>; averaged over B\'s results it is rho_A', () => {
  const s = pt.pair(0.5, true);
  let avg: q.Matrix = [[q.c(0), q.c(0)], [q.c(0), q.c(0)]];
  for (const b of [0, 1]) {
    const phi = [q.c(s[b].re), q.c(s[2 + b].re)], pb = q.norm2(phi);
    close(pb, 0.5);
    // A's state given B read b: (I tensor <b|) psi, normalised. For |Phi+> it is |b>.
    const given = pt.density(phi.map((x) => q.scale(x, 1 / Math.sqrt(pb))));
    closeM(given, pt.density(b === 0 ? q.ket0() : q.ket1()));
    assert.equal(pt.kind(given), 'pure');
    avg = avg.map((row, i) => row.map((v, j) => q.add(v, q.scale(given[i][j], pb))));
  }
  closeM(avg, pt.reducedA(s));
  closeM(avg, half);
});

test('half a Bell pair is I/2: a state, not a pure one; 50/50 for every two-outcome projective test, but not for a trine or a one-outcome test', () => {
  const rhoA = pt.reducedA(pt.pair(0.5, true));
  closeM(rhoA, half);
  assert.equal(pt.kind(rhoA), 'fully');
  close(pt.purity(rhoA), 0.5);
  // Two-outcome projective tests along many real and complex directions: chance of the first result is 1/2.
  for (let k = 0; k < 40; k++) {
    const u = q.fromBloch(0.1 + 0.07 * k, 0.31 * k);
    close(pt.chance(rhoA, u), 0.5);
  }
  // A trine (three outcomes, elements (2/3)|v><v| at 120 degrees on the Bloch circle): 1/3 each, so not 50/50.
  const trine = [0, 1, 2].map((j) => q.fromBloch((2 * Math.PI * j) / 3, 0));
  const odds = trine.map((v) => (2 / 3) * pt.chance(rhoA, v));
  odds.forEach((x) => close(x, 1 / 3));
  close(sum(odds), 1);
  // The three elements (2/3)|v><v| add to the identity.
  const elems = trine.map((v) => v.map((x) => v.map((y) => q.scale(q.mul(x, q.conj(y)), 2 / 3))));
  closeM(elems.reduce((acc, m) => acc.map((row, i) => row.map((x, j) => q.add(x, m[i][j])))), q.I);
  // A one-outcome test (the identity) gives 1.
  close(tr(rhoA).re, 1);
  // The pair's joint odds are fixed, but not every pair of tests matches: Phi+ always matches in 0/1 and +/-, and never in +i/-i.
  const s = pt.pair(0.5, true);
  const match = (t: pt.Test) => {
    const [u0, u1] = pt.kets(t);
    return [[u0, u0], [u1, u1]].reduce((tot, [a, b]) => tot + q.abs2(q.inner(q.tensor(a, b), s)), 0);
  };
  close(match('z'), 1); close(match('x'), 1); close(match('y'), 0);
});
