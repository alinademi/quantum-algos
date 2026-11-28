import test from 'node:test';
import assert from 'node:assert/strict';
import * as q from '../quantum.ts';
import * as s from './schmidt.ts';

const close = (a: number, b: number, eps = 1e-12) => assert.ok(Math.abs(a - b) < eps, `${a} != ${b}`);
const closeC = (a: q.C, b: q.C, eps = 1e-12) => { close(a.re, b.re, eps); close(a.im, b.im, eps); };
const closeS = (a: q.State, b: q.State, eps = 1e-12) => { assert.equal(a.length, b.length); a.forEach((x, i) => closeC(x, b[i], eps)); };
const S2 = Math.SQRT1_2;
const DEG = 180 / Math.PI;
const st = (...a: number[]): q.State => a.map((x) => q.c(x));

const BELL = st(S2, 0, 0, S2), PSI_PLUS = st(0, S2, S2, 0);
const PLUS_PLUS = st(0.5, 0.5, 0.5, 0.5);
const NAMED: [string, q.State][] = [
  ['bell', s.bellState()], ['lopsided', s.lopsidedState()], ['product', s.productState()], ['|00>', q.basis(2, 0)], ['|11>', q.basis(2, 3)],
  ['|++>', PLUS_PLUS], ['psi+', PSI_PLUS], ['phi-', st(S2, 0, 0, -S2)], ['psi-', st(0, S2, -S2, 0)],
];

// Many states, complex ones included, from a seeded generator: random amplitudes, then ones with a zero row, a zero column,
// a zero diagonal, equal reduced states and a product built from Bloch points.
function manyStates(): q.State[] {
  const r = q.rng(7), out: q.State[] = [];
  for (let n = 0; n < 60; n++) out.push(q.normalize(Array.from({ length: 4 }, () => q.c(r() - 0.5, r() - 0.5))));
  for (let n = 0; n < 20; n++) out.push(q.normalize(Array.from({ length: 4 }, () => q.c(r() - 0.5))));
  out.push(q.normalize([q.c(1, 2), q.c(0.3), q.c(0), q.c(0)]), q.normalize([q.c(0), q.c(0), q.c(-0.5, 0.25), q.c(1)]));
  out.push(q.normalize([q.c(1), q.c(0), q.c(2, 1), q.c(0)]), q.normalize([q.c(0), q.c(0.2, 1), q.c(0), q.c(-1, 1)]));
  out.push(q.normalize([q.c(0), q.c(1), q.c(0, 1), q.c(0)]), q.normalize([q.c(1, 1), q.c(0), q.c(0), q.c(2, -1)]));
  for (let n = 0; n < 10; n++) out.push(q.tensor(q.fromBloch(r() * 3, r() * 6), q.fromBloch(r() * 3, r() * 6)));
  NAMED.forEach(([, x]) => out.push(x));
  return out;
}
const MANY = manyStates();
const REAL = MANY.filter(s.isReal);

// ---- Amplitude matrix and reduced states

test('amplitude matrix: M[j][k] is the amplitude of |j>_A |k>_B, in the order of the state', () => {
  const m = s.amplitudeMatrix(st(1, 2, 3, 4));
  assert.deepEqual(m.map((row) => row.map((x) => x.re)), [[1, 2], [3, 4]]);
  // Qubit 0 is A: index 0b10 is A = 1, B = 0.
  const one = s.amplitudeMatrix(q.basis(2, 2));
  assert.equal(one[1][0].re, 1);
});

test('reduced states: Bell pair gives I/2 for each side, a product gives a pure state, the lopsided pair gives 0.64 and 0.36', () => {
  for (const rho of [s.reducedA(BELL), s.reducedB(BELL)]) {
    closeC(rho[0][0], q.c(0.5)); closeC(rho[1][1], q.c(0.5)); closeC(rho[0][1], q.c(0)); closeC(rho[1][0], q.c(0));
  }
  // |0>|+>: A is |0><0|, B is |+><+| (all entries 1/2).
  const p = s.productState(), a = s.reducedA(p), b = s.reducedB(p);
  closeC(a[0][0], q.c(1)); closeC(a[1][1], q.c(0)); closeC(a[0][1], q.c(0));
  [0, 1].forEach((i) => [0, 1].forEach((j) => closeC(b[i][j], q.c(0.5))));
  // 0.8|0>|+> + 0.6|1>|->: rho_A = diag(0.64, 0.36), rho_B = 0.64|+><+| + 0.36|-><-|: diagonal 1/2, off-diagonal 0.14.
  const l = s.lopsidedState(), la = s.reducedA(l), lb = s.reducedB(l);
  closeC(la[0][0], q.c(0.64)); closeC(la[1][1], q.c(0.36)); closeC(la[0][1], q.c(0));
  closeC(lb[0][0], q.c(0.5)); closeC(lb[1][1], q.c(0.5)); closeC(lb[0][1], q.c(0.14)); closeC(lb[1][0], q.c(0.14));
});

test('reduced states are Hermitian with trace 1, and rho_A = M M-dagger', () => {
  for (const x of MANY) {
    const m = s.amplitudeMatrix(x);
    for (const rho of [s.reducedA(x), s.reducedB(x)]) {
      close(rho[0][0].re + rho[1][1].re, 1);
      close(rho[0][0].im, 0); close(rho[1][1].im, 0);
      closeC(rho[0][1], q.conj(rho[1][0]));
    }
    closeS(s.reducedA(x).flat(), q.matMul(m, q.dagger(m)).flat());
  }
});

// ---- The decomposition

test('rebuild gives back the state: two terms are enough for any two-qubit state, complex or real', () => {
  for (const x of MANY) closeS(s.rebuild(s.schmidt(x)), x, 1e-11);
});

test('coefficients are non-negative, largest first, and their squares add to 1', () => {
  for (const x of MANY) {
    const { lambda } = s.schmidt(x);
    assert.ok(lambda[0] >= lambda[1] && lambda[1] >= 0);
    close(lambda[0] ** 2 + lambda[1] ** 2, 1);
  }
});

test('each side gets an orthonormal basis', () => {
  for (const x of MANY) {
    const sd = s.schmidt(x);
    for (const bs of [sd.a, sd.b]) {
      close(q.norm2(bs[0]), 1); close(q.norm2(bs[1]), 1);
      closeC(q.inner(bs[0], bs[1]), q.c(0), 1e-11);
    }
  }
});

test('lambda squared are the eigenvalues of both reduced states, with the Schmidt vectors as eigenvectors', () => {
  for (const x of MANY) {
    const sd = s.schmidt(x), ra = s.reducedA(x), rb = s.reducedB(x);
    for (let i = 0; i < 2; i++) {
      if (sd.lambda[i] === 0) continue; // a zero coefficient: a[i] is only a completing vector, but it is still in rho's null space
      closeS(q.matVec(ra, sd.a[i]), sd.a[i].map((v) => q.scale(v, sd.lambda[i] ** 2)), 1e-11);
      closeS(q.matVec(rb, sd.b[i]), sd.b[i].map((v) => q.scale(v, sd.lambda[i] ** 2)), 1e-11);
    }
    // For rank 1 the completing vectors are in the null space of the reduced state.
    if (sd.rank === 1) {
      closeS(q.matVec(ra, sd.a[1]), [q.c(0), q.c(0)], 1e-11);
      closeS(q.matVec(rb, sd.b[1]), [q.c(0), q.c(0)], 1e-11);
    }
    // Same spectrum: tr(rho^2) is the sum of the squared eigenvalues, equal for A and B.
    const purity = (r: q.Matrix) => q.matMul(r, r)[0][0].re + q.matMul(r, r)[1][1].re;
    close(purity(ra), sd.lambda[0] ** 4 + sd.lambda[1] ** 4, 1e-11);
    close(purity(rb), purity(ra), 1e-11);
  }
});

test('the SVD link: with M = sum lambda_i a_i v_i-dagger, B holds the complex conjugates of the v_i (M v_i = lambda_i a_i)', () => {
  for (const x of MANY) {
    const sd = s.schmidt(x), m = s.amplitudeMatrix(x);
    for (let i = 0; i < 2; i++) {
      const v = sd.b[i].map(q.conj);
      closeS(q.matVec(m, v), sd.a[i].map((z) => q.scale(z, sd.lambda[i])), 1e-11);
      closeS(q.matVec(q.dagger(m), sd.a[i]), v.map((z) => q.scale(z, sd.lambda[i])), 1e-11);
    }
  }
});

test('two qubits: lambda_1 lambda_2 = |psi00 psi11 - psi01 psi10|, so the state is a product exactly when that is 0', () => {
  for (const x of MANY) {
    const { lambda } = s.schmidt(x), d = s.determinant(x);
    close(lambda[0] * lambda[1], Math.hypot(d.re, d.im), 1e-11);
  }
  // The test from the Entanglement stop: Bell pair 1/2, |++> 0.
  close(s.determinant(BELL).re, 0.5); closeC(s.determinant(PLUS_PLUS), q.c(0));
  closeC(s.determinant(PSI_PLUS), q.c(-0.5));
});

test('known values: Bell pair, product states, the lopsided pair, and (|01> + |10>)/sqrt 2', () => {
  for (const x of [BELL, PSI_PLUS, st(S2, 0, 0, -S2)]) {
    const sd = s.schmidt(x);
    close(sd.lambda[0], S2); close(sd.lambda[1], S2); assert.equal(sd.rank, 2);
  }
  for (const x of [q.basis(2, 0), q.basis(2, 3), PLUS_PLUS, s.productState(), q.tensor(q.fromBloch(1.1, 0.4), q.fromBloch(2.2, -1.3))]) {
    const sd = s.schmidt(x);
    close(sd.lambda[0], 1); assert.equal(sd.lambda[1], 0); assert.equal(sd.rank, 1);
  }
  const l = s.schmidt(s.lopsidedState());
  close(l.lambda[0], 0.8); close(l.lambda[1], 0.6); assert.equal(l.rank, 2);
  // Lopsided pair in the 0/1 basis for both qubits: four terms 0.8/sqrt2, 0.8/sqrt2, 0.6/sqrt2, -0.6/sqrt2.
  const amps = s.lopsidedState().map((a) => a.re);
  [0.8 * S2, 0.8 * S2, 0.6 * S2, -0.6 * S2].forEach((v, i) => close(amps[i], v));
  // |++> has four terms in the 0/1 basis and still rank 1: counting terms in one basis does not tell.
  assert.equal(PLUS_PLUS.filter((a) => a.re !== 0).length, 4);
});

test('a state very close to a product still has rank 2; rank 1 needs an exact zero', () => {
  const near = q.normalize([q.c(1), q.c(0), q.c(0), q.c(1e-4)]);
  const sd = s.schmidt(near);
  assert.equal(sd.rank, 2);
  close(sd.lambda[1], 1e-4, 1e-8);
  assert.equal(s.schmidt(q.normalize([q.c(1), q.c(0), q.c(0), q.c(0)])).rank, 1);
});

test('a state that is not normalized is normalized first', () => {
  const sd = s.schmidt(st(3, 0, 0, 4));
  close(sd.lambda[0], 0.8); close(sd.lambda[1], 0.6);
});

test('equal coefficients leave the bases free: |00> + |11> is also |++> + |-->, both over sqrt 2', () => {
  const pp = q.tensor(q.plus(), q.plus()), mm = q.tensor(q.minus(), q.minus());
  closeS(pp.map((a, i) => q.scale(q.add(a, mm[i]), S2)), BELL);
  // So the +/- bases are Schmidt bases of the Bell pair too: A and B never differ in them.
  const turn45 = s.turnedBasis(45);
  const ch = s.jointChances(BELL, turn45, turn45);
  assert.equal(s.differ(ch), 0); close(ch[0], 0.5); close(ch[3], 0.5);
});

// ---- Local unitaries and entanglement

test('local gates leave the Schmidt coefficients unchanged (a different basis is not more or less entanglement)', () => {
  const gates = [q.H, q.S, q.T, q.RX(0.7), q.RY(2.1), q.RZ(-1.3), q.P(0.4), q.X, q.Y, q.Z];
  for (const x of MANY.slice(0, 40)) {
    const base = s.schmidt(x).lambda;
    gates.forEach((g, i) => {
      const moved = q.apply1(q.apply1(x, g, 0, 2), gates[(i + 3) % gates.length], 1, 2);
      const after = s.schmidt(moved).lambda;
      close(after[0], base[0], 1e-10); close(after[1], base[1], 1e-10);
    });
  }
});

test('a CNOT can change them: it makes a Bell pair from |+>|0>', () => {
  const made = q.cnot(q.tensor(q.plus(), q.ket0()), 0, 1, 2);
  assert.equal(s.schmidt(q.tensor(q.plus(), q.ket0())).rank, 1);
  close(s.schmidt(made).lambda[1], S2);
});

test('same coefficients means one unitary on A and one on B turn one state into the other', () => {
  // lopsided (0.8, 0.6) and a state with the same coefficients and other bases.
  const x = s.lopsidedState();
  const y = s.randomState({ phi: Math.acos(0.8) * DEG, ta: 33, tb: 117 });
  const sx = s.schmidt(x), sy = s.schmidt(y);
  close(sx.lambda[0], sy.lambda[0]); close(sx.lambda[1], sy.lambda[1]);
  // U sends a_i to a'_i, V sends b_i to b'_i: U = sum |a'_i><a_i|.
  const op = (from: q.Basis, to: q.Basis): q.Matrix => [0, 1].map((r) => [0, 1].map((col) => [0, 1].reduce((t, i) => q.add(t, q.mul(to[i][r], q.conj(from[i][col]))), q.c(0))));
  const U = op(sx.a, sy.a), V = op(sx.b, sy.b);
  // U and V are unitary.
  const eye = [q.c(1), q.c(0), q.c(0), q.c(1)];
  closeS(q.matMul(q.dagger(U), U).flat(), eye, 1e-11);
  closeS(q.matMul(q.dagger(V), V).flat(), eye, 1e-11);
  closeS(q.apply1(q.apply1(x, U, 0, 2), V, 1, 2), y, 1e-11);
});

// ---- Entropy

test('entropy: 0 for a product, 1 bit for a Bell pair, 0.943 for coefficients 0.8 and 0.6 (Aaronson 11.2.1 writes ≈ .942)', () => {
  close(s.entropy(s.schmidt(s.productState()).lambda), 0);
  close(s.entropy(s.schmidt(BELL).lambda), 1);
  const e = s.entropy([0.8, 0.6]);
  close(e, -(0.64 * Math.log2(0.64) + 0.36 * Math.log2(0.36)));
  assert.equal(e.toFixed(3), '0.943'); assert.equal(e.toFixed(2), '0.94');
  assert.ok(Math.abs(e - 0.9427) < 1e-4);
  // Aaronson's own state 3/5|0>|+> + 4/5|1>|-> has the same coefficients, so the same entropy.
  const his = q.tensor(q.ket0(), q.plus()).map((a, i) => q.add(q.scale(a, 0.6), q.scale(q.tensor(q.ket1(), q.minus())[i], 0.8)));
  close(s.entropy(s.schmidt(his).lambda), e);
});

test('entropy is at most 1 bit for two qubits, with 1 only at equal coefficients, and grows as the coefficients even out', () => {
  let last = -1;
  for (let deg = 0; deg <= 45; deg += 1) {
    const lam = [Math.cos(deg / DEG), Math.sin(deg / DEG)];
    const e = s.entropy(lam);
    assert.ok(e <= 1 + 1e-12 && e >= last - 1e-12);
    if (deg < 45) assert.ok(e < 1 - 1e-6); else close(e, 1);
    last = e;
  }
  for (const x of MANY) { const e = s.entropy(s.schmidt(x).lambda); assert.ok(e >= 0 && e <= 1 + 1e-12); }
});

// ---- Measuring both qubits, each in its own basis

test('turned bases: result 0 is cos|0> + sin|1>, result 1 is -sin|0> + cos|1>, orthonormal', () => {
  for (let deg = 0; deg < 180; deg += 7) {
    const [e0, e1] = s.turnedBasis(deg);
    close(e0[0].re, Math.cos(deg / DEG)); close(e0[1].re, Math.sin(deg / DEG));
    close(e1[0].re, -Math.sin(deg / DEG)); close(e1[1].re, Math.cos(deg / DEG));
    close(q.inner(e0, e1).re, 0); close(q.norm2(e0), 1);
  }
  // At 0 it is the 0/1 basis, at 45 the +/- basis, at 90 the 0/1 basis with the results swapped (and a sign).
  closeS(s.turnedBasis(0)[0], q.ket0()); closeS(s.turnedBasis(0)[1], q.ket1());
  closeS(s.turnedBasis(45)[0], q.plus()); closeS(s.turnedBasis(45)[1].map((a) => q.scale(a, -1)), q.minus());
  closeS(s.turnedBasis(90)[0], q.ket1());
  // No float dust at the edges.
  assert.equal(s.turnedBasis(90)[0][0].re, 0); assert.equal(s.turnedBasis(180)[0][1].re, 0);
});

test('amplitudes in the turned bases are E_A^T M E_B', () => {
  const x = s.lopsidedState(), m = s.amplitudeMatrix(x);
  for (const [da, db] of [[0, 0], [20, 100], [45, 135], [170, 3]]) {
    const A = s.turnedBasis(da), B = s.turnedBasis(db), got = s.amplitudesIn(x, A, B);
    for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) {
      let t = 0;
      for (let jj = 0; jj < 2; jj++) for (let kk = 0; kk < 2; kk++) t += A[i][jj].re * m[jj][kk].re * B[j][kk].re;
      close(got[i][j].re, t); close(got[i][j].im, 0);
    }
  }
});

test('Born rule: the four chances add to 1 for every state and every pair of settings', () => {
  for (const x of MANY) for (const [da, db] of [[0, 0], [13, 77], [45, 45], [90, 0], [123, 171]]) {
    const ch = s.jointChances(x, s.turnedBasis(da), s.turnedBasis(db));
    close(ch.reduce((a, b) => a + b, 0), 1, 1e-11);
    ch.forEach((p) => assert.ok(p >= 0));
    close(s.agree(ch) + s.differ(ch), 1, 1e-11);
  }
});

test('Born rule: A alone sees <a_i|rho_A|a_i>, whatever B measures', () => {
  for (const x of MANY.slice(0, 30)) {
    const A = s.turnedBasis(29), ra = s.reducedA(x);
    for (const db of [0, 50, 111]) {
      const ch = s.jointChances(x, A, s.turnedBasis(db));
      for (let i = 0; i < 2; i++) close(ch[2 * i] + ch[2 * i + 1], q.inner(A[i], q.matVec(ra, A[i])).re, 1e-11);
    }
  }
});

test('in Schmidt bases A and B never differ, and pair (i, i) has chance lambda_i squared (Aaronson 11.1)', () => {
  for (const x of MANY) {
    const sd = s.schmidt(x), ch = s.jointChances(x, sd.a, sd.b);
    assert.ok(s.differ(ch) < 1e-20, `differ ${s.differ(ch)}`);
    close(ch[0], sd.lambda[0] ** 2, 1e-11); close(ch[3], sd.lambda[1] ** 2, 1e-11);
    // The bases are a basis, so the chances still add to 1.
    close(ch[0] + ch[3], 1, 1e-11);
  }
});

test('real states: whole-degree turns from schmidtTurns give exactly zero differing chance (presets and random states)', () => {
  const r = q.rng(11), cases: [s.Kind, q.State][] = [['lopsided', s.lopsidedState()], ['bell', s.bellState()], ['product', s.productState()]];
  for (let n = 0; n < 150; n++) cases.push(['random', s.randomState(s.randomHidden(r))]);
  for (const [, x] of cases) {
    const t = s.schmidtTurns(x);
    assert.ok(Number.isInteger(t.a) && t.a >= 0 && t.a < 180 && Number.isInteger(t.b) && t.b >= 0 && t.b < 180);
    const ch = s.jointChances(x, s.turnedBasis(t.a), s.turnedBasis(t.b));
    assert.equal(s.differ(ch), 0);
    close(ch[0] + ch[3], 1);
  }
  assert.deepEqual(s.schmidtTurns(s.lopsidedState()), { a: 0, b: 45 });
  assert.deepEqual(s.schmidtTurns(s.bellState()), { a: 0, b: 0 });
  assert.deepEqual(s.schmidtTurns(s.productState()), { a: 0, b: 45 });
});

// For a real state, write its amplitudes at the Schmidt turns as the diagonal (d1, d2): d1 = +-lambda_1 and d2 = +-lambda_2 (a sign can
// sit on a basis vector). Turning the bases by (da, db) more gives
// c01 = -d1 cos(da) sin(db) + d2 sin(da) cos(db) and c10 = -d1 sin(da) cos(db) + d2 cos(da) sin(db).
// Both are 0 only if tan(db) = (d2/d1) tan(da) and tan(db) = (d1/d2) tan(da), which forces tan(da) = 0 when |d1| != |d2|.
test('real states: the differing chance follows the closed form around the Schmidt turns', () => {
  const x = s.lopsidedState(), tt = s.schmidtTurns(x);
  const m = s.amplitudesIn(x, s.turnedBasis(tt.a), s.turnedBasis(tt.b)), d1 = m[0][0].re, d2 = m[1][1].re;
  close(Math.abs(d1), 0.8); close(Math.abs(d2), 0.6); close(m[0][1].re, 0); close(m[1][0].re, 0);
  for (const [da, db] of [[0, 0], [3, 0], [0, 3], [10, 25], [-40, 17], [90, 0], [90, 90], [45, 45], [120, 33]]) {
    const ch = s.jointChances(x, s.turnedBasis(tt.a + da), s.turnedBasis(tt.b + db));
    const ca = Math.cos(da / DEG), sa = Math.sin(da / DEG), cb = Math.cos(db / DEG), sb = Math.sin(db / DEG);
    const c01 = -d1 * ca * sb + d2 * sa * cb, c10 = -d1 * sa * cb + d2 * ca * sb;
    close(ch[1], c01 * c01, 1e-12); close(ch[2], c10 * c10, 1e-12);
  }
});

test('lopsided pair (distinct coefficients): only the Schmidt turns make A and B agree every time', () => {
  const x = s.lopsidedState(), found: string[] = [];
  for (let da = 0; da < 180; da += 5) for (let db = 0; db < 180; db += 5) {
    const ch = s.jointChances(x, s.turnedBasis(da), s.turnedBasis(db));
    if (s.differ(ch) === 0) found.push(`${da},${db}`);
    else assert.ok(s.differ(ch) > 1e-4, `${da},${db}: ${s.differ(ch)}`);
  }
  // Turns (0, 45) and, with both result names swapped, (90, 135).
  assert.deepEqual(found, ['0,45', '90,135']);
});

test('lopsided pair: one basis turned 90 from the Schmidt turns makes A and B differ every time', () => {
  const x = s.lopsidedState(), ch = s.jointChances(x, s.turnedBasis(0), s.turnedBasis(135));
  assert.equal(s.agree(ch), 0); close(s.differ(ch), 1);
});

test('Bell pair (equal coefficients): the same turn on both sides makes A and B agree every time, for every turn', () => {
  for (let deg = 0; deg < 180; deg++) {
    const ch = s.jointChances(BELL, s.turnedBasis(deg), s.turnedBasis(deg));
    assert.equal(s.differ(ch), 0); close(ch[0], 0.5); close(ch[3], 0.5);
  }
  // Different turns do not: the chance of differing is sin^2 of the difference.
  for (const d of [10, 30, 90, 135]) {
    const ch = s.jointChances(BELL, s.turnedBasis(50), s.turnedBasis(50 + d));
    close(s.differ(ch), Math.sin(d / DEG) ** 2, 1e-12);
  }
});

test('product state: the 0/1 basis on A and the +/- basis on B give one result pair, 00, every time', () => {
  const ch = s.jointChances(s.productState(), s.turnedBasis(0), s.turnedBasis(45));
  assert.deepEqual(ch, [ch[0], 0, 0, 0]); close(ch[0], 1);
  // With the 0/1 basis on B, B is random while A is not.
  const ch0 = s.jointChances(s.productState(), s.turnedBasis(0), s.turnedBasis(0));
  close(ch0[0], 0.5); close(ch0[1], 0.5); assert.equal(ch0[2], 0);
});

// ---- Shots follow the Born rule

test('shots: a zero-chance pair never appears, and counts follow the chances', () => {
  const x = s.lopsidedState(), ch = s.jointChances(x, s.turnedBasis(0), s.turnedBasis(45)), r = q.rng(5);
  const shots = Array.from({ length: 4000 }, () => s.shoot(ch, r));
  const t = s.tally(shots);
  assert.equal(t[1] + t[2], 0);
  assert.equal(t[0] + t[3], 4000);
  // 4000 shots: the 64% pair is within 5 standard deviations (5 * sqrt(4000 * 0.64 * 0.36) = 152).
  assert.ok(Math.abs(t[0] - 4000 * 0.64) < 152, `${t[0]}`);
  // Away from the Schmidt turns, all four appear, with chances from the sim.
  const ch2 = s.jointChances(x, s.turnedBasis(20), s.turnedBasis(100));
  const t2 = s.tally(Array.from({ length: 4000 }, () => s.shoot(ch2, r)));
  ch2.forEach((p, i) => assert.ok(Math.abs(t2[i] - 4000 * p) < 5 * Math.sqrt(4000 * p * (1 - p)) + 1, `${i}: ${t2[i]} vs ${4000 * p}`));
});

test('tally counts each pair of results', () => {
  assert.deepEqual(s.tally([]), [0, 0, 0, 0]);
  assert.deepEqual(s.tally([0, 3, 3, 1, 2, 3]), [1, 1, 1, 3]);
});

// ---- The states the tool offers

test('presets: unit vectors with real amplitudes, made from 00 by the gates the page names', () => {
  for (const k of s.KINDS) {
    const x = s.makeState(k, { phi: 25, ta: 40, tb: 150 });
    assert.equal(x.length, 4); close(q.norm2(x), 1); assert.ok(s.isReal(x));
  }
  closeS(s.bellState(), BELL);
  closeS(s.lopsidedState(), [q.c(0.8 * S2), q.c(0.8 * S2), q.c(0.6 * S2), q.c(-0.6 * S2)]);
  closeS(s.productState(), q.tensor(q.ket0(), q.matVec(q.H, q.ket0())));
  // Lopsided: 0.8|00> + 0.6|11> after the CNOT, then a Hadamard gate on B gives 0.8|0>|+> + 0.6|1>|->.
  const direct = q.tensor(q.ket0(), q.plus()).map((a, i) => q.add(q.scale(a, 0.8), q.scale(q.tensor(q.ket1(), q.minus())[i], 0.6)));
  closeS(s.lopsidedState(), direct);
  assert.deepEqual(s.makeState('bell'), s.bellState());
});

test('random states: hidden settings are the Schmidt angle and the Schmidt turns', () => {
  const r = q.rng(3);
  for (let n = 0; n < 100; n++) {
    const h = s.randomHidden(r);
    assert.ok(Number.isInteger(h.phi) && h.phi >= 10 && h.phi <= 40);
    assert.ok(Number.isInteger(h.ta) && h.ta >= 0 && h.ta < 180 && Number.isInteger(h.tb) && h.tb >= 0 && h.tb < 180);
    const x = s.randomState(h), sd = s.schmidt(x);
    close(q.norm2(x), 1);
    close(sd.lambda[0], Math.cos(h.phi / DEG), 1e-12); close(sd.lambda[1], Math.sin(h.phi / DEG), 1e-12);
    assert.deepEqual(s.schmidtTurns(x), { a: h.ta, b: h.tb });
    // Distinct coefficients, so the state is entangled and its bases are unique.
    assert.equal(sd.rank, 2); assert.ok(sd.lambda[0] - sd.lambda[1] > 0.1);
  }
  // randomHidden covers its whole range.
  const lo = s.randomHidden(() => 0), hi = s.randomHidden(() => 0.999999);
  assert.deepEqual(lo, { phi: 10, ta: 0, tb: 0 }); assert.deepEqual(hi, { phi: 40, ta: 179, tb: 179 });
  // The same hidden settings make the same state.
  assert.deepEqual(s.randomState({ phi: 30, ta: 12, tb: 99 }), s.randomState({ phi: 30, ta: 12, tb: 99 }));
});

test('angleOf: the turn of a real vector, 0 up to 180, whatever its sign', () => {
  for (let deg = 0; deg < 180; deg += 3) {
    const [e0] = s.turnedBasis(deg);
    close(s.angleOf(e0), deg, 1e-9);
    close(s.angleOf(e0.map((a) => q.scale(a, -1))), deg, 1e-9);
  }
  close(s.angleOf(q.ket1()), 90); close(s.angleOf(q.minus()), 135); close(s.angleOf(q.plus()), 45);
  // Never 180.
  assert.ok(s.angleOf([q.c(1), q.c(-1e-16)]) < 180 + 1e-9);
});

// ---- Words

test('percent never shows a real chance as 0% or 100%', () => {
  assert.equal(s.percent(0), '0%'); assert.equal(s.percent(1), '100%'); assert.equal(s.percent(0.5), '50%');
  assert.equal(s.percent(0.64), '64%'); assert.equal(s.percent(0.625), '63%');
  assert.equal(s.percent(0.0003), 'under 0.1%'); assert.equal(s.percent(0.9999), 'over 99.9%');
  assert.equal(s.percent(0.004), '0.4%'); assert.equal(s.percent(0.995), '99.5%');
  assert.equal(s.percent(1e-30), '0%');
});

test('amp: 2 decimals, a real minus sign, no -0.00', () => {
  assert.equal(s.amp(0), '0'); assert.equal(s.amp(1), '1'); assert.equal(s.amp(-1), '−1');
  assert.equal(s.amp(0.8), '0.80'); assert.equal(s.amp(-0.6), '−0.60'); assert.equal(s.amp(S2), '0.71');
  assert.equal(s.amp(-0.001), '0.00'); assert.equal(s.amp(1e-17), '0');
});

test('ketText and basisText', () => {
  assert.equal(s.ketText(q.ket0()), '|0⟩'); assert.equal(s.ketText(q.ket1()), '|1⟩');
  assert.equal(s.ketText(s.turnedBasis(30)[0]), '0.87|0⟩ + 0.50|1⟩');
  assert.equal(s.ketText(s.turnedBasis(30)[1]), '−0.50|0⟩ + 0.87|1⟩');
  assert.equal(s.ketText(s.turnedBasis(135)[0]), '−0.71|0⟩ + 0.71|1⟩');
  assert.equal(s.ketText(s.turnedBasis(90)[1]), '−|0⟩');
  assert.equal(s.basisText(0), 'Result 0 is |0⟩. Result 1 is |1⟩.');
  assert.equal(s.basisText(30), 'Result 0 is 0.87|0⟩ + 0.50|1⟩. Result 1 is −0.50|0⟩ + 0.87|1⟩.');
});

test('every readout names the start state, the coefficients and the settings, for every state and setting', () => {
  const r = q.rng(2);
  for (const k of s.KINDS) {
    const x = s.makeState(k, s.randomHidden(r));
    for (const [da, db] of [[0, 0], [0, 45], [90, 135], [33, 71], [179, 2]]) for (const shots of [[0, 0, 0, 0], [3, 1, 0, 2]] as s.Tally[]) {
      const t = s.readout(k, x, da, db, shots);
      assert.ok(t.startsWith('Started as 00'), t);
      assert.ok(t.includes(s.startText(k)) && t.includes(s.ketOf(k)));
      assert.ok(t.includes('Schmidt coefficient'));
      assert.ok(t.includes(`A's basis is turned ${da}°, B's ${db}°`));
      assert.ok(!t.includes('—') && !t.includes('–'), t);
      assert.ok(!/NaN|undefined|Infinity/.test(t), t);
    }
  }
  for (const k of s.KINDS) assert.ok(s.startText(k).startsWith('Started as 00'));
});

test('verdicts: matched, swapped, and not matched', () => {
  const x = s.lopsidedState(), sd = s.schmidt(x);
  const good = s.verdict(s.jointChances(x, s.turnedBasis(0), s.turnedBasis(45)), sd);
  assert.ok(good.startsWith('A and B agree on every pair, so these are Schmidt bases'));
  assert.ok(good.includes('64%') && good.includes('36%') && good.includes('0.80') && good.includes('0.60'));
  const swapped = s.verdict(s.jointChances(x, s.turnedBasis(0), s.turnedBasis(135)), sd);
  assert.ok(swapped.startsWith('A and B differ on every pair') && swapped.includes('Turn B by 90°'));
  const bad = s.verdict(s.jointChances(x, s.turnedBasis(0), s.turnedBasis(0)), sd);
  assert.ok(bad.includes('differ on 50% of pairs') && bad.includes('not Schmidt bases'));
  const close1 = s.verdict(s.jointChances(x, s.turnedBasis(0), s.turnedBasis(46)), sd);
  assert.ok(close1.includes('very close'), close1);
  // Product state, matched: a single term.
  const p = s.productState(), pv = s.verdict(s.jointChances(p, s.turnedBasis(0), s.turnedBasis(45)), s.schmidt(p));
  assert.ok(pv.includes('single term'));
  // Bell pair, same turn: matched, 50% and 50%.
  const bv = s.verdict(s.jointChances(BELL, s.turnedBasis(20), s.turnedBasis(20)), s.schmidt(BELL));
  assert.ok(bv.includes('50% and 50%') && bv.includes('0.71'));
});

test('coefficientText: rank, coefficients and entropy', () => {
  assert.equal(s.coefficientText(s.schmidt(s.lopsidedState())), 'Schmidt coefficients: 0.80 and 0.60. Schmidt rank 2: entangled (entropy 0.94 bits).');
  assert.ok(s.coefficientText(s.schmidt(BELL)).includes('entropy 1.00 bits'));
  assert.ok(s.coefficientText(s.schmidt(s.productState())).includes('rank 1: a product state'));
});

test('shot counts in the readout add up', () => {
  const x = s.bellState(), t = s.readout('bell', x, 0, 0, [3, 1, 0, 2]);
  assert.ok(t.includes('Pairs sent: 6. 5 agreed (3 as 00, 2 as 11), 1 differed (1 as 01, 0 as 10).'));
  assert.ok(s.readout('bell', x, 0, 0, [0, 0, 0, 0]).includes('No pairs sent yet.'));
});

test('complex case: local gates with complex entries leave the coefficients of a complex state unchanged', () => {
  const x = q.normalize([q.c(1, 2), q.c(0.3, -0.4), q.c(-0.5, 0.25), q.c(0.1, 0.9)]);
  const base = s.schmidt(x).lambda;
  assert.equal(s.schmidt(x).rank, 2);
  const moved = q.apply1(q.apply1(x, q.matMul(q.RZ(0.9), q.matMul(q.RX(1.3), q.S)), 0, 2), q.matMul(q.T, q.RY(-2.2)), 1, 2);
  assert.ok(!s.isReal(moved));
  const after = s.schmidt(moved).lambda;
  close(after[0], base[0], 1e-11); close(after[1], base[1], 1e-11);
});

test('freedom: opposite phases on a_i and b_i keep the state; with a repeated coefficient A may use any basis and B follows', () => {
  for (const x of MANY.slice(0, 20)) {
    const sd = s.schmidt(x), th = [0.7, -1.9];
    const turned: s.Schmidt = { ...sd, a: [0, 1].map((i) => sd.a[i].map((v) => q.mul(v, q.expi(th[i])))) as q.State[] as s.Basis, b: [0, 1].map((i) => sd.b[i].map((v) => q.mul(v, q.expi(-th[i])))) as q.State[] as s.Basis };
    closeS(s.rebuild(turned), x, 1e-11);
  }
  // Bell pair: take A's basis to be any unitary image of 0/1; b_i = (1/lambda)(<a_i| x I)|psi> is then conj(U) applied to B's basis.
  const lam = S2;
  for (const first of [q.fromBloch(0.35, 0), q.fromBloch(1.1, 0.4), q.fromBloch(2.5, -2)]) {
    // A's first vector is any state, its second the orthogonal one.
    const basisA: s.Basis = [first, [q.scale(q.conj(first[1]), -1), q.conj(first[0])]];
    const b = basisA.map((av) => [0, 1].map((k) => q.scale([0, 1].reduce((t, j) => q.add(t, q.mul(BELL[2 * j + k], q.conj(av[j]))), q.c(0)), 1 / lam)));
    const sd: s.Schmidt = { lambda: [lam, lam], a: basisA, b: b as s.Basis, rank: 2 };
    closeS(s.rebuild(sd), BELL, 1e-11);
    closeC(q.inner(b[0], b[1]), q.c(0), 1e-11);
  }
});

test('lambdaText: two numbers, or just 1 for a product state', () => {
  assert.equal(s.lambdaText(s.schmidt(s.lopsidedState())), '0.80, 0.60');
  assert.equal(s.lambdaText(s.schmidt(s.productState())), '1');
  assert.equal(s.lambdaText(s.schmidt(BELL)), '0.71, 0.71');
});
