import test from 'node:test';
import assert from 'node:assert/strict';
import * as q from '../quantum.ts';
import * as t from './tomography.ts';
import type { Vec3, Chosen, Truth } from './tomography.ts';

const close = (a: number, b: number, eps = 1e-12) => assert.ok(Math.abs(a - b) < eps, `${a} != ${b}`);
const closeVec = (a: readonly number[], b: readonly number[], eps = 1e-12) => a.forEach((x, i) => close(x, b[i], eps));
const ALL: Chosen = [true, true, true];
const outer = (s: q.State): q.Matrix => s.map((a) => s.map((b) => q.mul(a, q.conj(b))));

// A spread of unknown states: poles, axes, tilted, mixed, the center.
const STATES: Vec3[] = [[0, 0, 1], [1, 0, 0], [0, 1, 0], [0, 0, 0], [0, 0, 0.6], [0.5, -0.3, 0.2], [0.6, 0.48, -0.64], [-0.8, 0, 0.6]];

// ---- Exact enumeration: n shots in each basis, every possible count, weighted by the binomial chance.
const choose = (n: number, k: number) => { let r = 1; for (let i = 1; i <= k; i++) r = (r * (n - k + i)) / i; return r; };
const pmf = (n: number, k: number, p: number) => choose(n, k) * p ** k * (1 - p) ** (n - k);
type Outcome = { w: number; a: Vec3 };
/** Every outcome of n shots in each chosen basis with its exact chance, and the estimate α it gives. */
function outcomes(v: Vec3, n: number, chosen: Chosen = ALL): Outcome[] {
  let out: Outcome[] = [{ w: 1, a: [0, 0, 0] }];
  for (let ax = 0; ax < 3; ax++) {
    if (!chosen[ax]) continue;
    const p = t.chancePlus(v, ax), next: Outcome[] = [];
    for (const o of out) for (let k = 0; k <= n; k++) {
      const w = pmf(n, k, p);
      if (w === 0) continue;
      const a: Vec3 = [...o.a];
      a[ax] = (2 * k - n) / n;
      next.push({ w: o.w * w, a });
    }
    out = next;
  }
  return out;
}
const expect = (os: Outcome[], f: (a: Vec3) => number) => os.reduce((s, o) => s + o.w * f(o.a), 0);

// ---- The unknown state

test('the truth vector: pure states have length 1, r scales it, poles and axes are exact', () => {
  for (const [th, ph] of [[0, 0], [90, 0], [90, 90], [37, 211], [180, 5]]) close(t.len(t.truthVec({ theta: th, phi: ph, r: 100 })), 1);
  close(t.len(t.truthVec({ theta: 53, phi: 17, r: 60 })), 0.6);
  assert.deepEqual(t.truthVec({ theta: 0, phi: 0, r: 100 }), [0, 0, 1]);
  assert.deepEqual(t.truthVec({ theta: 90, phi: 0, r: 100 }), [1, 0, 0]);
  assert.deepEqual(t.truthVec({ theta: 90, phi: 90, r: 100 }), [0, 1, 0]);
  assert.deepEqual(t.truthVec({ theta: 180, phi: 0, r: 100 }), [0, 0, -1]);
  assert.deepEqual(t.truthVec({ theta: 70, phi: 10, r: 0 }), [0, 0, 0]);
});

test('ρ = ½(I + r·σ): trace 1, Hermitian, and r comes back out as tr(σρ)', () => {
  for (const v of STATES) {
    const rho = t.rhoOfVec(v);
    close(rho[0][0].re + rho[1][1].re, 1);
    close(rho[0][0].im, 0); close(rho[1][1].im, 0);
    close(rho[0][1].re, rho[1][0].re); close(rho[0][1].im, -rho[1][0].im);
    closeVec(t.vecOfRho(rho), v);
  }
});

test('a pure vector gives the projector |ψ⟩⟨ψ| of the state at those angles', () => {
  for (const [th, ph] of [[0, 0], [90, 0], [60, 40], [120, 250], [33, 301]]) {
    const v = t.truthVec({ theta: th, phi: ph, r: 100 }), want = outer(q.fromBloch((th * Math.PI) / 180, (ph * Math.PI) / 180));
    t.rhoOfVec(v).forEach((row, i) => row.forEach((z, j) => { close(z.re, want[i][j].re); close(z.im, want[i][j].im); }));
  }
});

test('ρ has no negative eigenvalue exactly when the vector is in the ball', () => {
  for (const v of [...STATES, [0.7, 0.7, 0.1] as Vec3, [0.6, 0.6, 0.6] as Vec3, [0, 0, 1.2] as Vec3]) {
    const [hi, lo] = t.hermEigen2(t.rhoOfVec(v)).map((e) => e.value);
    close(hi, (1 + t.len(v)) / 2); close(lo, (1 - t.len(v)) / 2);
    assert.equal(lo >= -1e-12, t.len(v) <= 1 + 1e-12);
    assert.equal(t.isState(v), lo >= -1e-12);
  }
});

// ---- Measuring a copy

test('Born rule: the chance of +1 is ⟨v₊|ρ|v₊⟩ = ½(1 + r_k), the two results add to 1, and r_k = p₊ − p₋', () => {
  for (const v of STATES) for (let ax = 0; ax < 3; ax++) {
    const rho = t.rhoOfVec(v), pPlus = t.bornPlus(rho, ax);
    close(pPlus, t.chancePlus(v, ax));
    const [, m] = t.eigenstates(ax), pMinus = q.inner(m, q.matVec(rho, m)).re;
    close(pPlus + pMinus, 1);
    close(pPlus - pMinus, v[ax]);
  }
});

test('the three bases are orthonormal pairs, and +1 is an eigenvector of its Pauli matrix', () => {
  const paulis = [q.X, q.Y, q.Z];
  for (let ax = 0; ax < 3; ax++) {
    const [p, m] = t.eigenstates(ax);
    close(q.norm2(p), 1); close(q.norm2(m), 1); close(q.abs(q.inner(p, m)), 0);
    q.matVec(paulis[ax], p).forEach((z, i) => { close(z.re, p[i].re); close(z.im, p[i].im); });
    q.matVec(paulis[ax], m).forEach((z, i) => { close(z.re, -m[i].re); close(z.im, -m[i].im); });
  }
});

test('measuring Y is a gate, then a Z measurement: S† then H turns |+i⟩ into |0⟩ and |−i⟩ into |1⟩', () => {
  const sDag = q.dagger(q.S), [p, m] = t.eigenstates(1);
  const a = q.matVec(q.H, q.matVec(sDag, p)), b = q.matVec(q.H, q.matVec(sDag, m));
  close(q.abs(q.inner(a, q.ket0())), 1); close(q.abs(q.inner(b, q.ket1())), 1);
});

test('shots: only +1 or −1, certain results are certain, the same seed gives the same shots', () => {
  const s = t.shoot([0.3, -0.2, 0.5], 2, 50, q.rng(7));
  assert.equal(s.length, 50);
  assert.ok(s.every((x) => x === 1 || x === -1));
  assert.deepEqual(s, t.shoot([0.3, -0.2, 0.5], 2, 50, q.rng(7)));
  assert.ok(t.shoot([0, 0, 1], 2, 200, q.rng(3)).every((x) => x === 1));
  assert.ok(t.shoot([0, 0, -1], 2, 200, q.rng(3)).every((x) => x === -1));
  assert.ok(t.shoot([1, 0, 0], 0, 200, q.rng(3)).every((x) => x === 1));
  // A fair coin (Z on |+⟩): the first draws below ½ are +1.
  assert.deepEqual(t.shoot([1, 0, 0], 2, 4, () => 0.49), [1, 1, 1, 1]);
  assert.deepEqual(t.shoot([1, 0, 0], 2, 4, () => 0.5), [-1, -1, -1, -1]);
});

test('Born sampling for any chance p: on an even grid of draws, the share of +1 is p to within one grid step', () => {
  const N = 1000;
  for (const v of [[0.3, -0.2, 0.5], [0.9, 0, 0], [0, 0, -0.77], [0, 0.123, 0]] as Vec3[]) for (let ax = 0; ax < 3; ax++) {
    let i = 0;
    const grid = () => (i++ + 0.5) / N, s = t.shoot(v, ax, N, grid);
    assert.ok(Math.abs(s.filter((x) => x === 1).length / N - t.chancePlus(v, ax)) <= 1 / N + 1e-12);
  }
});

test('measuring X is a Hadamard gate, then Z; measuring Y is S† then H, then Z: the chance of 0 afterwards is the chance of +1', () => {
  for (const v of STATES) {
    const rho = t.rhoOfVec(v);
    const after = (u: q.Matrix) => q.matMul(u, q.matMul(rho, q.dagger(u)))[0][0].re;
    close(after(q.H), t.chancePlus(v, 0));
    close(after(q.matMul(q.H, q.dagger(q.S))), t.chancePlus(v, 1));
    close(after(q.I), t.chancePlus(v, 2));
  }
});

test('the tally adds up shots per basis and leaves the old tally alone', () => {
  const t0 = t.emptyTally(), t1 = t.addShots(t0, 1, [1, -1, 1]), t2 = t.addShots(t1, 1, [-1]);
  assert.deepEqual(t0, { plus: [0, 0, 0], total: [0, 0, 0] });
  assert.deepEqual(t1, { plus: [0, 2, 0], total: [0, 3, 0] });
  assert.deepEqual(t2, { plus: [0, 2, 0], total: [0, 4, 0] });
});

// ---- Rebuilding

test('estimate: all +1 gives 1, all −1 gives −1, even split gives 0, an unmeasured basis gives 0', () => {
  closeVec(t.estimate({ plus: [10, 0, 5], total: [10, 10, 10] }), [1, -1, 0]);
  closeVec(t.estimate({ plus: [10, 0, 0], total: [10, 0, 0] }), [1, 0, 0]);
  closeVec(t.estimate(t.emptyTally()), [0, 0, 0]);
  closeVec(t.estimate({ plus: [3, 0, 0], total: [4, 0, 0] }), [0.5, 0, 0]);
});

test('each average is exactly unbiased with variance (1 − r_k²)/n, for every n checked', () => {
  for (const v of STATES) for (let ax = 0; ax < 3; ax++) for (const n of [1, 2, 5, 8]) {
    const p = t.chancePlus(v, ax);
    let mean = 0, second = 0;
    for (let k = 0; k <= n; k++) { const a = (2 * k - n) / n, w = pmf(n, k, p); mean += w * a; second += w * a * a; }
    close(mean, v[ax]);
    close(second - mean * mean, (1 - v[ax] * v[ax]) / n);
  }
});

test('the rebuilt vector is unbiased: its mean over all outcomes is the true vector', () => {
  for (const v of STATES) {
    const os = outcomes(v, 3);
    close(os.reduce((s, o) => s + o.w, 0), 1);
    for (let k = 0; k < 3; k++) close(expect(os, (a) => a[k]), v[k]);
  }
});

test('mean squared error is Σ(1 − r_k²)/n = (3 − r²)/n exactly, so 100 times the shots gives a typical error 10 times smaller', () => {
  for (const v of STATES) for (const n of [1, 3, 6]) {
    const os = outcomes(v, n);
    close(expect(os, (a) => (a[0] - v[0]) ** 2 + (a[1] - v[1]) ** 2 + (a[2] - v[2]) ** 2), t.expectedSqError(v, t.sameShots(n), ALL));
    close(t.expectedSqError(v, t.sameShots(n), ALL), (3 - t.len(v) ** 2) / n);
  }
  for (const v of STATES) close(t.rmsError(v, t.sameShots(100), ALL) * 10, t.rmsError(v, t.sameShots(1), ALL));
});

test('a basis never measured costs r_k² for good: the error stops shrinking, and the formula still matches exact enumeration', () => {
  const v: Vec3 = [0.5, -0.3, 0.2], chosen: Chosen = [true, false, true];
  for (const n of [1, 4, 7]) {
    const os = outcomes(v, n, chosen);
    close(expect(os, (a) => (a[0] - v[0]) ** 2 + (a[1] - v[1]) ** 2 + (a[2] - v[2]) ** 2), t.expectedSqError(v, t.sameShots(n), chosen));
  }
  const floor = Math.sqrt(0.3 ** 2) / 2;
  assert.ok(t.rmsError(v, t.sameShots(1e9), chosen) > floor - 1e-4 && t.rmsError(v, t.sameShots(1e9), chosen) < floor + 1e-4);
  assert.ok(t.rmsError(v, t.sameShots(1000), ALL) < 0.03);
});

test('the typical error falls as shots grow, for every state', () => {
  for (const v of STATES) {
    let prev = Infinity;
    for (const n of [1, 10, 100, 1000, 10000]) { const e = t.rmsError(v, t.sameShots(n), ALL); assert.ok(e < prev); prev = e; }
  }
});

test('the rebuilt matrix has trace 1 and eigenvalues ½(1 ± |α|); only the length decides if it is a state', () => {
  for (const a of [[0, 0, 0], [0.3, 0.2, -0.1], [1, 0.1, 0], [0.8, 0.8, 0.8], [0, 0, 1]] as Vec3[]) {
    const [hi, lo] = t.eigenvalues(a), rho = t.rhoOfVec(a);
    close(hi + lo, 1);
    close(hi, t.hermEigen2(rho)[0].value); close(lo, t.hermEigen2(rho)[1].value);
    assert.equal(t.isState(a), lo >= 0);
  }
});

test('a pure state with finite shots: started as 0, the rebuild is outside the ball unless X and Y both average exactly 0', () => {
  for (const n of [2, 4, 5, 6]) {
    const os = outcomes([0, 0, 1], n);
    const outside = expect(os, (a) => (t.isState(a) ? 0 : 1));
    // Z is always +1 here, so |α| = √(1 + αx² + αy²) is above 1 unless both are 0. Both are 0 only for even n, with chance pmf(n/2)² .
    const bothZero = n % 2 === 0 ? pmf(n, n / 2, 0.5) ** 2 : 0;
    close(outside, 1 - bothZero);
    for (const o of os) assert.equal(o.a[2], 1);
  }
});

test('a tilted pure state leaves the ball in a large share of runs, and a mixed state well inside rarely does', () => {
  const pure = t.truthVec({ theta: 60, phi: 40, r: 100 });
  const outPure = expect(outcomes(pure, 12), (a) => (t.isState(a) ? 0 : 1));
  assert.ok(outPure > 0.4, `${outPure}`);
  const outMixed = expect(outcomes(t.truthVec({ theta: 60, phi: 40, r: 30 }), 12), (a) => (t.isState(a) ? 0 : 1));
  assert.ok(outMixed < 0.05, `${outMixed}`);
});

// ---- Rounding

test('Watrous rounding on the matrix (negative eigenvalue to 0, divide by trace) equals moving α onto the surface', () => {
  for (const a of [[0, 0, 1.2], [0.8, 0.7, 0.1], [-0.6, 0.6, -0.9], [1, 0.1, 0], [0, 0, -1.0001]] as Vec3[]) {
    const m = t.clipRound(t.rhoOfVec(a)), want = t.rhoOfVec(t.roundVec(a));
    m.forEach((row, i) => row.forEach((z, j) => { close(z.re, want[i][j].re, 1e-9); close(z.im, want[i][j].im, 1e-9); }));
    close(t.len(t.roundVec(a)), 1);
    closeVec(t.roundVec(a).map((x) => x * t.len(a)), a);
  }
});

test('rounding leaves a state alone and always returns a state with trace 1', () => {
  for (const a of STATES) {
    closeVec(t.roundVec(a), a);
    const m = t.clipRound(t.rhoOfVec(a));
    m.forEach((row, i) => row.forEach((z, j) => { const w = t.rhoOfVec(a)[i][j]; close(z.re, w.re, 1e-9); close(z.im, w.im, 1e-9); }));
  }
  for (const a of [[0, 0, 1.3], [0.9, 0.9, 0.9], [-1.1, 0.2, 0]] as Vec3[]) {
    const m = t.clipRound(t.rhoOfVec(a));
    close(m[0][0].re + m[1][1].re, 1, 1e-9);
    const [hi, lo] = t.hermEigen2(m).map((e) => e.value);
    assert.ok(lo > -1e-9 && hi < 1 + 1e-9);
  }
});

test('rounding never moves the rebuild farther from the true state: checked on every outcome', () => {
  for (const v of STATES) for (const n of [2, 4]) for (const o of outcomes(v, n)) {
    assert.ok(t.traceDistance(t.roundVec(o.a), v) <= t.traceDistance(o.a, v) + 1e-12);
  }
});

test('the rounded point is the nearest point of the ball', () => {
  const a: Vec3 = [0.8, 0.5, 0.6];
  const best = t.len(a.map((x, i) => x - t.roundVec(a)[i]));
  for (let i = -10; i <= 10; i++) for (let j = -10; j <= 10; j++) for (let k = -10; k <= 10; k++) {
    const p: Vec3 = [i / 10, j / 10, k / 10];
    if (t.len(p) > 1) continue;
    assert.ok(t.len(a.map((x, m) => x - p[m])) >= best - 1e-12);
  }
});

test('hermEigen2 rebuilds the matrix from its eigenpairs, including diagonal matrices and the center', () => {
  for (const a of [[0.3, 0.2, -0.1], [0, 0, 0], [0, 0, 0.5], [0, 0, -0.5], [0.4, 0, 0], [0, 0.7, 0]] as Vec3[]) {
    const m = t.rhoOfVec(a), es = t.hermEigen2(m);
    close(q.abs(q.inner(es[0].vec, es[1].vec)), 0, 1e-9);
    for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) {
      const sum = es.reduce((s, e) => q.add(s, q.scale(q.mul(e.vec[i], q.conj(e.vec[j])), e.value)), q.c(0));
      close(sum.re, m[i][j].re, 1e-9); close(sum.im, m[i][j].im, 1e-9);
    }
  }
});

// ---- Distance

test('trace distance is half the distance of the Bloch vectors, and equals ½ Σ|eigenvalue| of the difference matrix', () => {
  const pairs: [Vec3, Vec3][] = [[[0, 0, 1], [0, 0, -1]], [[0, 0, 1], [1, 0, 0]], [[0.3, 0.2, 0.1], [0.1, -0.2, 0.4]], [[0, 0, 0], [0, 0, 1]], [[0.2, 0, 0], [0.2, 0, 0]], [[0, 0, 1.2], [0, 0, 1]]];
  for (const [a, b] of pairs) {
    const ra = t.rhoOfVec(a), rb = t.rhoOfVec(b);
    const diff = ra.map((row, i) => row.map((z, j) => q.sub(z, rb[i][j])));
    close(t.traceDistance(a, b), t.hermEigen2(diff).reduce((s, e) => s + Math.abs(e.value), 0) / 2, 1e-12);
    close(t.traceDistance(a, b), t.traceDistance(b, a));
  }
  close(t.traceDistance([0, 0, 1], [0, 0, -1]), 1);
  close(t.traceDistance([0, 0, 1], [1, 0, 0]), Math.SQRT1_2);
  close(t.traceDistance([0, 0, 0], [0, 0, 1]), 0.5);
  close(t.traceDistance([0.2, 0, 0], [0.2, 0, 0]), 0);
});

// ---- One basis is not enough

test('states with the same z give the same Z chances for good; an X measurement tells them apart', () => {
  const a: Vec3 = [0, 0, 0.6], b: Vec3 = [0.8, 0, 0.6], c3: Vec3 = [0.3, -0.7, 0.6];
  close(t.chancePlus(a, 2), t.chancePlus(b, 2)); close(t.chancePlus(a, 2), t.chancePlus(c3, 2));
  assert.ok(Math.abs(t.chancePlus(a, 0) - t.chancePlus(b, 0)) > 0.3);
  assert.ok(Math.abs(t.chancePlus(a, 1) - t.chancePlus(c3, 1)) > 0.3);
  // The exact outcome chances of n Z-only shots are identical for the three, so no Z data can pick one.
  const dist = (v: Vec3) => outcomes(v, 6, [false, false, true]).map((o) => [o.a[2], o.w]);
  const da = dist(a);
  for (const other of [dist(b), dist(c3)]) other.forEach(([x, w], i) => { close(x, da[i][0]); close(w, da[i][1]); });
});

test('consistent states: Z only gives a disc at that z, X and Z a segment, all three one point, none or an impossible set nothing', () => {
  const a: Vec3 = [0.3, -0.2, 0.6];
  const disc = t.consistentSet(a, [false, false, true], 200);
  assert.equal(disc.length, 200);
  for (const p of disc) { close(p[2], 0.6); assert.ok(t.len(p) <= 1 + 1e-12); }
  const R = Math.sqrt(1 - 0.36);
  assert.ok(Math.max(...disc.map((p) => Math.hypot(p[0], p[1]))) < R && Math.max(...disc.map((p) => Math.hypot(p[0], p[1]))) > 0.95 * R);
  const seg = t.consistentSet(a, [true, false, true], 11);
  assert.equal(seg.length, 11);
  for (const p of seg) { close(p[0], 0.3); close(p[2], 0.6); assert.ok(t.len(p) <= 1 + 1e-12); }
  close(seg[0][1], -Math.sqrt(1 - 0.09 - 0.36)); close(seg[10][1], Math.sqrt(1 - 0.09 - 0.36));
  assert.deepEqual(t.consistentSet(a, ALL, 50), [a]);
  assert.deepEqual(t.consistentSet(a, [false, false, false], 50), []);
  assert.deepEqual(t.consistentSet([0.9, 0, 0.9], [true, false, true], 50), []);
  // The true state is one of the consistent states when the data are exact.
  const truth: Vec3 = [0.5, -0.3, 0.2];
  assert.ok(t.consistentSet(truth, [true, false, true], 101).some((p) => Math.abs(p[1] - -0.3) < 0.01));
});

// ---- Many qubits

test('an n-qubit state takes 4^n − 1 numbers; 3^n settings are needed and are enough', () => {
  assert.deepEqual([1, 2, 3, 10].map(t.paramCount), [3, 15, 63, 1048575]);
  assert.deepEqual([1, 2, 3, 10].map(t.settingCount), [3, 9, 27, 59049]);
  for (const n of [1, 2, 3]) {
    const strings = Array.from({ length: 4 ** n }, (_, i) => Array.from({ length: n }, (_, k) => (i >> (2 * k)) & 3)).filter((s) => s.some((x) => x));
    assert.equal(strings.length, t.paramCount(n));
    const settings = Array.from({ length: 3 ** n }, (_, i) => Array.from({ length: n }, (_, k) => Math.floor(i / 3 ** k) % 3 + 1));
    assert.equal(settings.length, t.settingCount(n));
    // Setting s measures string p when p is the identity (0) or equal to s on every qubit.
    const covers = (s: number[], p: number[]) => p.every((x, k) => x === 0 || x === s[k]);
    for (const p of strings) assert.ok(settings.some((s) => covers(s, p)));
    // A string with no identity is covered by one setting only, itself, so no setting can be dropped.
    for (const s of settings) assert.equal(strings.filter((p) => p.every((x) => x !== 0) && covers(s, p)).length, 1);
    assert.equal(strings.filter((p) => p.every((x) => x !== 0)).length, 3 ** n);
  }
});

// ---- The picture

test('the camera keeps lengths, puts Z up and X right at yaw 0, and is nearer for larger depth', () => {
  for (const [yaw, tilt] of [[0, 0], [30, 20], [200, 55], [90, 90]]) {
    const cam = t.camera(yaw, tilt);
    for (const p of STATES) { const s = t.project(p, cam); close(Math.hypot(s.x, s.y, s.depth), t.len(p)); }
  }
  const flat = t.camera(0, 0);
  closeVec(Object.values(t.project([1, 0, 0], flat)), [1, 0, 0]);
  closeVec(Object.values(t.project([0, 0, 1], flat)), [0, 1, 0]);
  close(t.project([0, 1, 0], flat).depth, -1);
  const up = t.camera(0, 20);
  assert.ok(t.project([0, -1, 0], up).depth > t.project([0, 1, 0], up).depth);
  assert.ok(t.project([0, 0, 1], up).depth > 0);
});

test('sphere points lie on the unit sphere; a segment has both ends and k + 1 points', () => {
  for (const p of t.spherePoints(200)) close(t.len(p), 1);
  const s = t.segment([0, 0, 0], [1, 2, 3], 4);
  assert.equal(s.length, 5);
  closeVec(s[0], [0, 0, 0]); closeVec(s[4], [1, 2, 3]); closeVec(s[2], [0.5, 1, 1.5]);
});

// ---- Words

test('presets make the states they say, and the controls find them again', () => {
  const v = (name: string) => t.truthVec(t.PRESETS.find((p) => p.name === name)!.t);
  closeVec(v('|0⟩'), [0, 0, 1]);
  closeVec(v('|+⟩'), [1, 0, 0]);
  closeVec(v('|+i⟩'), [0, 1, 0]);
  closeVec(v('Mix, 80% 0'), [0, 0, 0.6]);
  closeVec(v('Fully mixed'), [0, 0, 0]);
  close(t.chancePlus(v('Mix, 80% 0'), 2), 0.8);
  // RY(60°) on 0, then P(40°): the vector the tool uses.
  const psi = q.matVec(q.P((40 * Math.PI) / 180), q.matVec(q.RY(Math.PI / 3), q.ket0()));
  closeVec(v('Tilted pure state'), q.bloch(psi), 1e-12);
  for (const p of t.PRESETS) assert.equal(t.presetAt(p.t), p.name);
  assert.equal(t.presetAt({ theta: 70, phi: 123, r: 0 }), 'Fully mixed');
  assert.equal(t.presetAt({ theta: 0, phi: 200, r: 100 }), '|0⟩');
  assert.equal(t.presetAt({ theta: 91, phi: 0, r: 100 }), null);
  assert.equal(t.presetAt({ theta: 90, phi: 0, r: 99 }), null);
});

test('numbers: two decimals, a real minus sign, never −0.00', () => {
  assert.equal(t.num(-0.004), '0.00');
  assert.equal(t.num(-0.5), '−0.50');
  assert.equal(t.num(1), '1.00');
  assert.equal(t.cnum(q.c(0.25, -0.125)), '0.25 − 0.13i');
  assert.equal(t.cnum(q.c(0.25, 0.001)), '0.25');
  assert.equal(t.dist(0.0456), '0.046');
  assert.equal(t.dist(0.456), '0.46');
  assert.equal(t.vecText([1, -0.001, 0.5]), '(1.00, 0.00, 0.50)');
  assert.equal(t.eigText(-0.0004), 'just below 0');
  assert.equal(t.eigText(-0.05), '−0.05');
  assert.equal(t.eigText(0.0004), '0.00');
  assert.equal(t.chosenText([true, true, true]), 'X, Y and Z');
  assert.equal(t.chosenText([true, false, true]), 'X and Z');
  assert.equal(t.chosenText([false, true, false]), 'Y');
});

test('every readout names the start state, and says what happened', () => {
  for (const p of t.PRESETS) {
    assert.ok(t.describe(p.t, ALL, t.emptyTally()).includes(p.said));
  }
  const plusT = t.PRESETS[1].t, v = t.truthVec(plusT), rand = q.rng(5);
  let tally = t.emptyTally();
  for (let ax = 0; ax < 3; ax++) tally = t.addShots(tally, ax, t.shoot(v, ax, 100, rand));
  const s = t.describe(plusT, ALL, tally);
  assert.ok(s.includes('started as 0, then a Hadamard gate'));
  assert.ok(s.includes('100 shots in each of X, Y and Z (300 copies in all)'));
  assert.ok(s.includes('Trace distance'));
  assert.ok(s.includes('not a state'), 'started as |+⟩ with finite shots, X is always +1, so the rebuild leaves the ball');
  assert.ok(t.describe(plusT, [false, false, false], t.emptyTally()).includes('at least one basis'));
  const partial = t.describe(plusT, [true, false, true], t.addShots(t.addShots(t.emptyTally(), 0, t.shoot(v, 0, 10, rand)), 2, t.shoot(v, 2, 10, rand)));
  assert.ok(partial.includes('Y not measured'));
  assert.ok(partial.includes('in X and Z') === false && partial.includes('in each of X and Z'));
  assert.ok(t.describe(plusT, [false, false, true], t.addShots(t.emptyTally(), 2, t.shoot(v, 2, 10, rand))).includes('10 shots in Z ('));
  // Started as |0⟩, Y unticked, α = (0.40, 0, 1): X and Z alone are already outside the ball, so no state matches.
  const zero = t.PRESETS[0].t, out: t.Tally = { plus: [7, 0, 10], total: [10, 0, 10] };
  closeVec(t.estimate(out), [0.4, 0, 1]);
  assert.deepEqual(t.consistentSet(t.estimate(out), [true, false, true], 50), []);
  const none = t.describe(zero, [true, false, true], out);
  assert.ok(none.includes('Even with the missing value at 0 the point is outside the ball, so no state matches these numbers exactly.'));
  assert.ok(!none.includes('equally well'));
  // A state well inside the ball: the readout says so.
  const mixed: Truth = { theta: 0, phi: 0, r: 0 };
  let tm = t.emptyTally();
  for (let ax = 0; ax < 3; ax++) tm = t.addShots(tm, ax, [1, -1, 1, -1]);
  assert.ok(t.describe(mixed, ALL, tm).includes('That is a state, inside the ball'));
});

test('the state names are right for a pure state, a pole and a mixed state', () => {
  assert.ok(t.stateName({ theta: 100, phi: 30, r: 100 }).includes('θ = 100°, φ = 30°'));
  assert.ok(!t.stateName({ theta: 180, phi: 30, r: 100 }).includes('φ'.concat(' =')));
  assert.ok(t.stateName({ theta: 40, phi: 10, r: 45 }).includes('Bloch length 0.45'));
});
