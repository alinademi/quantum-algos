import test from 'node:test';
import assert from 'node:assert/strict';
import * as q from '../quantum.ts';
import * as s from './separability.ts';

const close = (a: number, b: number, eps = 1e-12) => assert.ok(Math.abs(a - b) < eps, `${a} != ${b}`);
const closeM = (a: q.Matrix, b: q.Matrix, eps = 1e-12) => {
  assert.equal(a.length, b.length);
  a.forEach((row, j) => row.forEach((x, k) => { close(x.re, b[j][k].re, eps); close(x.im, b[j][k].im, eps); }));
};
const closeList = (a: number[], b: number[], eps = 1e-12) => { assert.equal(a.length, b.length); a.forEach((x, i) => close(x, b[i], eps)); };
const S2 = Math.SQRT1_2;
const sum = (xs: number[]) => xs.reduce((t, x) => t + x, 0);
const tr = (m: q.Matrix) => sum(m.map((row, i) => row[i].re));

// Seeded random cases. Fixed seed, so every run checks the same ones.
const R = q.rng(2024);
const rc = () => q.c(R() * 2 - 1, R() * 2 - 1);
const randomState = (n = 4): q.State => q.normalize(Array.from({ length: n }, rc));
const randomOne = (): q.State => randomState(2);
/** A mixed 4 by 4 density matrix: three random pure pairs, entangled ones included. */
const randomRho = (): q.Matrix => s.combine([[0.5, s.outer(randomState())], [0.3, s.outer(randomState())], [0.2, s.outer(randomState())]]);
/** A random mix of four product pairs, complex amplitudes included. */
const randomSeparable = (): q.Matrix => s.combine([0.4, 0.3, 0.2, 0.1].map((w) => [w, s.outer(q.tensor(randomOne(), randomOne()))] as [number, q.Matrix]));
const randomU = (): q.Matrix => {
  const [a, b, d] = [R(), R(), R()].map((x) => x * 2 * Math.PI);
  return q.matMul(q.matMul(q.RZ(a), q.RY(b)), q.RZ(d));
};
const randomHermitian = (n: number): q.Matrix => {
  const m = Array.from({ length: n }, () => Array.from({ length: n }, () => rc()));
  return m.map((row, i) => row.map((_, j) => q.scale(q.add(m[i][j], q.conj(m[j][i])), 0.5)));
};

const NOISES: s.Noise[] = ['white', 'coin'];
const XS = [0, 0.01, 0.1, 0.25, 0.33, 0.34, 0.5, 0.6, 0.75, 0.99, 1];
const BETAS = [0, 1, 30, 60, 90, 120, 179, 180];
const grid = (f: (noise: s.Noise, x: number, beta: number) => void) => { for (const n of NOISES) for (const x of XS) for (const b of BETAS) f(n, x, b); };

// ---- Small helpers

test('fromPercent and clampDegrees: whole numbers, kept in range', () => {
  assert.equal(s.fromPercent(50), 0.5);
  assert.equal(s.fromPercent(33.4), 0.33);
  assert.equal(s.fromPercent(-5), 0);
  assert.equal(s.fromPercent(140), 1);
  assert.equal(s.clampDegrees(90.4), 90);
  assert.equal(s.clampDegrees(-3), 0);
  assert.equal(s.clampDegrees(200), 180);
});

test('tidy turns float dust into the exact value', () => {
  assert.equal(s.tidy(0.5000000000000001), 0.5);
  assert.equal(Object.is(s.tidy(-1e-17), 0), true);
});

// ---- The states

test('bellPair is (|00> + |11>)/√2: started as 00, a Hadamard gate on A, a CNOT from A to B', () => {
  const b = s.bellPair();
  closeList(b.map((a) => a.re), [S2, 0, 0, S2]);
  closeList(b.map((a) => a.im), [0, 0, 0, 0]);
  const manual = q.cnot(q.apply1(q.basis(2, 0), q.H, 0, 2), 0, 1, 2);
  closeM(s.outer(b), s.outer(manual));
});

test('outer, combine and trace: |s><s| has trace 1, a weighted sum of matrices adds entry by entry', () => {
  const m = s.outer(randomState());
  close(tr(m), 1);
  const w = s.combine([[0.25, m], [0.75, m]]);
  closeM(w, m);
});

test('rho at beta = 0 has the entries of x|Φ+><Φ+| + (1 - x) N, written out', () => {
  for (const x of XS) {
    const white = s.rho('white', x, 0), coin = s.rho('coin', x, 0);
    // White: diagonal (1 + x)/4 on 00 and 11, (1 - x)/4 on 01 and 10, coherence x/2 between 00 and 11.
    closeList([0, 1, 2, 3].map((i) => white[i][i].re), [(1 + x) / 4, (1 - x) / 4, (1 - x) / 4, (1 + x) / 4]);
    close(white[0][3].re, x / 2); close(white[3][0].re, x / 2);
    // Coin: 1/2 on 00 and 11, nothing on 01 and 10, coherence x/2.
    closeList([0, 1, 2, 3].map((i) => coin[i][i].re), [0.5, 0, 0, 0.5]);
    close(coin[0][3].re, x / 2); close(coin[3][0].re, x / 2);
  }
});

test('rho is a density matrix everywhere: Hermitian, real, trace 1, no negative eigenvalue', () => {
  grid((n, x, b) => {
    const r = s.rho(n, x, b);
    close(tr(r), 1);
    r.forEach((row, i) => row.forEach((e, j) => { close(e.re, r[j][i].re); close(e.im, 0, 1e-15); }));
    const ev = s.eigenvalues(r);
    assert.ok(ev[0] > -1e-12, `${n} ${x} ${b}: ${ev[0]}`);
    close(sum(ev), 1);
  });
});

test('beta = 180° turns the Bell pair into the singlet (|01> - |10>)/√2, and x = 1 gives exactly that state', () => {
  const r = s.rho('white', 1, 180), single = s.outer([q.c(0), q.c(S2), q.c(-S2), q.c(0)]);
  closeM(r, single, 1e-12);
});

// ---- Eigenvalues

test('eigenvalues: known matrices', () => {
  closeList(s.eigenvalues(q.Y), [-1, 1]);
  closeList(s.eigenvalues(q.X), [-1, 1]);
  closeList(s.eigenvalues(q.Z), [-1, 1]);
  closeList(s.eigenvalues(q.I), [1, 1]);
  closeList(s.eigenvalues([[q.c(2), q.c(1, -1)], [q.c(1, 1), q.c(3)]]), [1, 4]); // trace 5, determinant 4
  closeList(s.eigenvalues([[q.c(3), q.c(0)], [q.c(0), q.c(-2)]]), [-2, 3]);
  closeList(s.eigenvalues(s.outer(randomState())), [0, 0, 0, 1]); // a pure state
});

test('eigenvalues of a random Hermitian matrix match its traces tr(M^k), k = 1 to 4 (these four fix four eigenvalues)', () => {
  for (let k = 0; k < 6; k++) {
    const m = randomHermitian(4), ev = s.eigenvalues(m);
    let p = m;
    for (let pow = 1; pow <= 4; pow++) {
      close(sum(ev.map((l) => l ** pow)), tr(p), 1e-10);
      p = q.matMul(p, m);
    }
    assert.deepEqual(ev, [...ev].sort((a, b) => a - b));
  }
});

test('eigenvalues of rho: white noise gives (1 + 3x)/4 once and (1 - x)/4 three times; coin noise gives (1 ± x)/2 and 0 twice, for every beta', () => {
  for (const x of XS) for (const b of BETAS) {
    closeList(s.eigenvalues(s.rho('white', x, b)), [(1 - x) / 4, (1 - x) / 4, (1 - x) / 4, (1 + 3 * x) / 4], 1e-9);
    closeList(s.eigenvalues(s.rho('coin', x, b)), [0, 0, (1 - x) / 2, (1 + x) / 2], 1e-9);
  }
});

// ---- The partial transpose

test('partialTransposeB: entry (ab, a\'b\') of the result is entry (ab\', a\'b) of the matrix', () => {
  const m = randomRho(), t = s.partialTransposeB(m);
  for (let a = 0; a < 2; a++) for (let b = 0; b < 2; b++) for (let a2 = 0; a2 < 2; a2++) for (let b2 = 0; b2 < 2; b2++) {
    const x = t[2 * a + b][2 * a2 + b2], y = m[2 * a + b2][2 * a2 + b];
    close(x.re, y.re); close(x.im, y.im);
  }
});

test('partialTransposeB: doing it twice gives back the matrix, the trace is kept, and the result is still Hermitian', () => {
  for (let k = 0; k < 5; k++) {
    const m = randomRho(), t = s.partialTransposeB(m);
    closeM(s.partialTransposeB(t), m);
    close(tr(t), tr(m));
    t.forEach((row, i) => row.forEach((e, j) => { close(e.re, t[j][i].re); close(e.im, -t[j][i].im); }));
  }
});

test('moves(i, j) is true exactly for the entries that change place: B\'s bit differs between row and column', () => {
  const m = randomRho(), t = s.partialTransposeB(m);
  for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) {
    assert.equal(s.moves(i, j), (i & 1) !== (j & 1));
    if (!s.moves(i, j)) { close(t[i][j].re, m[i][j].re); close(t[i][j].im, m[i][j].im); }
  }
  assert.equal([0, 1, 2, 3].flatMap((i) => [0, 1, 2, 3].filter((j) => s.moves(i, j))).length, 8);
});

test('Peres eq. 6: the partial transpose of |a><a| ⊗ |b><b| is |a><a| ⊗ |b*><b*|, a density matrix; so a separable mix keeps no negative eigenvalue', () => {
  for (let k = 0; k < 6; k++) {
    const a = randomOne(), b = randomOne();
    closeM(s.partialTransposeB(s.outer(q.tensor(a, b))), s.outer(q.tensor(a, b.map(q.conj))));
  }
  for (let k = 0; k < 6; k++) {
    const r = randomSeparable();
    assert.ok(s.smallestPpt(r) > -1e-12);
    assert.ok(s.isPpt(r));
  }
});

test('the partial transpose of the Bell pair is half the swap: eigenvalues 1/2 three times and -1/2 once', () => {
  const t = s.partialTransposeB(s.outer(s.bellPair()));
  // SWAP/2: 1/2 on 00 and 11, and 1/2 between 01 and 10.
  closeM(t, [[0.5, 0, 0, 0], [0, 0, 0.5, 0], [0, 0.5, 0, 0], [0, 0, 0, 0.5]].map((row) => row.map((v) => q.c(v))));
  closeList(s.eigenvalues(t), [-0.5, 0.5, 0.5, 0.5]);
  assert.equal(s.isPpt(s.outer(s.bellPair())), false);
});

test('a gate on each qubit alone does not change the eigenvalues of the partial transpose (Peres eqs. 4, 5), even for a random state', () => {
  for (let k = 0; k < 6; k++) {
    const r = randomRho(), u = randomU(), v = randomU(), uv = q.kron(u, v);
    const moved = q.matMul(q.matMul(uv, r), q.dagger(uv));
    closeList(s.pptEigenvalues(moved), s.pptEigenvalues(r), 1e-9);
    // Not true of a gate on both qubits together: the partial transpose is not a unitary change.
  }
});

test('Peres: for white noise the partial transpose has eigenvalues (1 + x)/4 three times and (1 - 3x)/4; for coin noise ±x/2 and 1/2 twice; for every beta', () => {
  for (const x of XS) for (const b of BETAS) {
    closeList(s.pptEigenvalues(s.rho('white', x, b)), [(1 - 3 * x) / 4, (1 + x) / 4, (1 + x) / 4, (1 + x) / 4], 1e-9);
    closeList(s.pptEigenvalues(s.rho('coin', x, b)), [-x / 2, x / 2, 0.5, 0.5], 1e-9);
  }
});

test('PPT verdict: white noise is entangled exactly when x > 1/3, coin noise when x > 0, whatever beta is', () => {
  for (const b of BETAS) {
    for (const x of [0, 0.1, 0.3, 0.33, 1 / 3]) assert.equal(s.isPpt(s.rho('white', x, b)), true, `white ${x} ${b}`);
    for (const x of [0.34, 0.4, 0.5, 1]) assert.equal(s.isPpt(s.rho('white', x, b)), false, `white ${x} ${b}`);
    assert.equal(s.isPpt(s.rho('coin', 0, b)), true);
    for (const x of [0.01, 0.1, 0.5, 1]) assert.equal(s.isPpt(s.rho('coin', x, b)), false, `coin ${x} ${b}`);
  }
  // The slider steps either side of one third.
  close(s.smallestPpt(s.rho('white', 0.33, 0)), 0.0025);
  close(s.smallestPpt(s.rho('white', 0.34, 0)), -0.005);
});

// ---- The recipe: a certificate of separability

test('recipe for white noise at x = 1/3: six product pairs |a> ⊗ |a*>, one chance in six each, make the state exactly', () => {
  const rec = s.recipe('white', 1 / 3, 0)!;
  assert.equal(rec.length, 6);
  rec.forEach((p) => close(p.w, 1 / 6));
  rec.forEach((p) => { closeList(p.b.map((a) => a.re), p.a.map((a) => a.re)); closeList(p.b.map((a) => a.im), p.a.map((a) => -a.im)); });
  closeM(s.mixture(rec), s.rho('white', 1 / 3, 0));
  assert.deepEqual(rec.map((p) => `${p.aName} ⊗ ${p.bName}`), ['|0⟩ ⊗ |0⟩', '|1⟩ ⊗ |1⟩', '|+⟩ ⊗ |+⟩', '|−⟩ ⊗ |−⟩', '|+i⟩ ⊗ |−i⟩', '|−i⟩ ⊗ |+i⟩']);
});

test('recipe makes the state exactly for white noise with x <= 1/3, and for coin noise at x = 0, for every beta', () => {
  for (const b of BETAS) {
    for (const x of [0, 0.01, 0.1, 0.25, 0.33, 1 / 3]) {
      const rec = s.recipe('white', x, b)!;
      assert.ok(rec, `white ${x} ${b}`);
      close(sum(rec.map((p) => p.w)), 1);
      rec.forEach((p) => { assert.ok(p.w > 0); close(q.norm2(p.a), 1); close(q.norm2(p.b), 1); });
      closeM(s.mixture(rec), s.rho('white', x, b));
    }
    const coin = s.recipe('coin', 0, b)!;
    assert.equal(coin.length, 2);
    closeM(s.mixture(coin), s.rho('coin', 0, b));
  }
});

test('recipe at x = 0 with white noise is the four pairs |jk>, one in four each', () => {
  const rec = s.recipe('white', 0, 0)!;
  assert.equal(rec.length, 4);
  rec.forEach((p) => close(p.w, 0.25));
  assert.deepEqual(rec.map((p) => `${p.aName} ⊗ ${p.bName}`), ['|0⟩ ⊗ |0⟩', '|1⟩ ⊗ |1⟩', '|0⟩ ⊗ |1⟩', '|1⟩ ⊗ |0⟩']);
});

test('no pair shows twice in a recipe: |00> and |11> are one line each with chance (1 - x)/4, and the shown lines add to exactly 100%', () => {
  for (const b of [0, 60, 180]) for (let pc = 0; pc <= 33; pc++) {
    const x = pc / 100, rec = s.recipe('white', x, b)!;
    const names = rec.map((p) => `${p.aName} ⊗ ${p.bName}`);
    assert.equal(new Set(names).size, names.length);
    close(rec.find((p) => p.aName === '|0⟩' && p.bName.endsWith('|0⟩'))!.w, (1 - x) / 4);
    const lines = s.recipeLines(rec), shown = lines.map((l) => (l.startsWith('<') ? 0 : parseFloat(l)));
    close(sum(shown), 100, 1e-9);
    lines.forEach((l, i) => assert.ok(l.endsWith(names[i]) && /^(<0\.1|\d+(\.\d)?)%  /.test(l), l));
    shown.forEach((v, i) => close(v, rec[i].w * 100, 0.1 + 1e-9));
  }
  for (const rec of [s.recipe('white', 1 / 3, 0)!, s.recipe('coin', 0, 0)!]) close(sum(s.recipeLines(rec).map(parseFloat)), 100, 1e-9);
});

test('recipe names the gate on B: RY(60°)|−i⟩ after a gate of 60°, plain kets at beta = 0', () => {
  assert.equal(s.recipe('white', 1 / 3, 60)![4].bName, 'RY(60°)|−i⟩');
  assert.equal(s.recipe('white', 1 / 3, 0)![4].bName, '|−i⟩');
});

test('a recipe exists exactly when the state passes the PPT test: the two agree at every percent, every beta (2 qubits: PPT is exact)', () => {
  for (const n of NOISES) for (let pc = 0; pc <= 100; pc++) for (const b of [0, 45, 90, 180]) {
    const x = s.fromPercent(pc);
    assert.equal(s.recipe(n, x, b) !== null, s.isPpt(s.rho(n, x, b)), `${n} ${pc} ${b}`);
  }
});

// ---- The witness

test('fidelity: white noise gives x cos²(β/2) + (1 - x)/4, coin noise gives (1 + x) cos²(β/2)/2', () => {
  grid((n, x, b) => {
    const c2 = Math.cos((b * Math.PI) / 360) ** 2;
    close(s.fidelity(s.rho(n, x, b)), n === 'white' ? x * c2 + (1 - x) / 4 : ((1 + x) * c2) / 2, 1e-12);
  });
  close(s.fidelity(s.outer(s.bellPair())), 1);
});

test('|Φ+><Φ+| = (II + XX - YY + ZZ)/4: fidelity is (1 + <XX> - <YY> + <ZZ>)/4 for every state, entangled or not', () => {
  for (let k = 0; k < 8; k++) {
    const r = randomRho();
    close(s.fidelity(r), (1 + s.corr(r, 'x') - s.corr(r, 'y') + s.corr(r, 'z')) / 4, 1e-12);
    close(s.witness(r), s.witnessFrom(s.corr(r, 'x'), s.corr(r, 'y'), s.corr(r, 'z')), 1e-12);
  }
  grid((n, x, b) => {
    const r = s.rho(n, x, b);
    close(s.witness(r), s.witnessFrom(s.corr(r, 'x'), s.corr(r, 'y'), s.corr(r, 'z')), 1e-12);
  });
});

test('witness W = I/2 - |Φ+><Φ+|: -1/2 on the Bell pair, 0 on the singlet side of the limit (+1/2 on the singlet), tr(W rho) = 1/2 - F', () => {
  close(s.witness(s.outer(s.bellPair())), -0.5);
  close(s.witness(s.rho('white', 1, 180)), 0.5);
  close(s.witness(s.rho('white', 0, 0)), 0.25); // I/4: F = 1/4
  assert.equal(s.WITNESS_LIMIT, 0.5);
});

test('a product pair has fidelity |<a*|b>|²/2 with the Bell pair, never above 1/2; 1/2 exactly when b = a*', () => {
  for (let k = 0; k < 20; k++) {
    const a = randomOne(), b = randomOne(), f = s.fidelity(s.outer(q.tensor(a, b)));
    close(f, q.abs2(q.inner(a.map(q.conj), b)) / 2);
    assert.ok(f <= 0.5 + 1e-12);
    close(s.fidelity(s.outer(q.tensor(a, a.map(q.conj)))), 0.5);
  }
});

test('no separable state is detected: tr(W sigma) >= 0 for random mixes of product pairs', () => {
  for (let k = 0; k < 20; k++) assert.ok(s.witness(randomSeparable()) >= -1e-12);
});

test('the witness detects white noise when x(1 + 2 cos β) > 1 and coin noise when (1 + x) cos²(β/2) > 1', () => {
  let seen = 0;
  grid((n, x, b) => {
    const need = n === 'white' ? x * (1 + 2 * Math.cos((b * Math.PI) / 180)) - 1 : (1 + x) * Math.cos((b * Math.PI) / 360) ** 2 - 1;
    if (Math.abs(need) < 1e-9) return;
    seen++;
    assert.equal(s.witness(s.rho(n, x, b)) < -1e-9, need > 0, `${n} ${x} ${b}`);
  });
  assert.ok(seen > 100);
});

test('at beta = 0 the witness and the PPT test agree on every percent; beyond 90° the witness is blind to white noise at every x', () => {
  for (const n of NOISES) for (let pc = 0; pc <= 100; pc++) {
    const r = s.rho(n, s.fromPercent(pc), 0);
    assert.equal(s.witness(r) < -1e-9, !s.isPpt(r), `${n} ${pc}`);
  }
  for (const b of [90, 120, 150, 180]) for (let pc = 0; pc <= 100; pc++) {
    const r = s.rho('white', s.fromPercent(pc), b);
    assert.ok(s.witness(r) >= -1e-9, `${pc} ${b}`);
    assert.equal(s.isPpt(r), pc <= 33);
  }
});

// ---- The three settings and the shots

test('outcomeProbs: four non-negative chances adding to 1, and each qubit alone is 50/50 for these states', () => {
  grid((n, x, b) => {
    const r = s.rho(n, x, b);
    for (const k of s.BASES) {
      const p = s.outcomeProbs(r, k);
      p.forEach((v) => assert.ok(v >= 0));
      close(sum(p), 1);
      close(p[0] + p[1], 0.5, 1e-9);
      close(p[0] + p[2], 0.5, 1e-9);
    }
  });
});

test('corr: Bell pair gives <XX> = 1, <YY> = -1, <ZZ> = 1; the singlet gives -1 each; I/4 gives 0', () => {
  const bell = s.outer(s.bellPair());
  closeList(s.BASES.map((k) => s.corr(bell, k)), [1, -1, 1]);
  closeList(s.BASES.map((k) => s.corr(s.rho('white', 1, 180), k)), [-1, -1, -1], 1e-12);
  closeList(s.BASES.map((k) => s.corr(s.rho('white', 0, 0), k)), [0, 0, 0]);
});

test('corr is tr((σ ⊗ σ) rho), checked against the matrices X ⊗ X, Y ⊗ Y, Z ⊗ Z', () => {
  const ops = { x: q.kron(q.X, q.X), y: q.kron(q.Y, q.Y), z: q.kron(q.Z, q.Z) };
  for (let k = 0; k < 6; k++) {
    const r = randomRho();
    for (const b of s.BASES) close(s.corr(r, b), tr(q.matMul(ops[b], r)), 1e-12);
  }
  grid((n, x, b) => { const r = s.rho(n, x, b); for (const k of s.BASES) close(s.corr(r, k), tr(q.matMul(ops[k], r)), 1e-12); });
});

test('for white noise at beta = 0 the correlations are x, -x, x; for coin noise x, -x, 1', () => {
  for (const x of XS) {
    closeList(s.BASES.map((k) => s.corr(s.rho('white', x, 0), k)), [x, -x, x]);
    closeList(s.BASES.map((k) => s.corr(s.rho('coin', x, 0), k)), [x, -x, 1]);
  }
});

test('shoot is a Born rule draw: the share of random numbers u that give each result is its chance', () => {
  const r = s.rho('white', 0.6, 0), N = 4000;
  for (const k of s.BASES) {
    const p = s.outcomeProbs(r, k), got = [0, 0, 0, 0];
    for (let i = 0; i < N; i++) { const [a, b] = s.shoot(r, k, () => (i + 0.5) / N); got[2 * a + b]++; }
    closeList(got.map((v) => v / N), p, 1 / N);
  }
  // A result with chance 0 never happens, even at the edge of the random number's range.
  const bell = s.outer(s.bellPair());
  for (const u of [0, 1e-9, 0.5, 0.999999999]) { const [a, b] = s.shoot(bell, 'z', () => u); assert.equal(a, b); }
});

test('basisFor: the three settings take turns, x then y then z', () => {
  assert.deepEqual([0, 1, 2, 3, 4, 5].map(s.basisFor), ['x', 'y', 'z', 'x', 'y', 'z']);
});

test('tally and measuredCorr: +1 for each pair with equal results, -1 for each with different results', () => {
  const t = s.tally([[0, 0], [1, 1], [0, 1], [1, 0], [0, 0]]);
  assert.deepEqual(t, { pairs: 5, agree: 3 });
  close(s.measuredCorr(t), 0.2);
  close(s.measuredCorr({ pairs: 4, agree: 4 }), 1);
  close(s.measuredCorr({ pairs: 4, agree: 0 }), -1);
});

test('estimate: none until every setting has a pair; the Bell pair, always agreeing in X and Z and never in Y, reads exactly -1/2 with no wobble', () => {
  const bell = s.outer(s.bellPair());
  assert.equal(s.estimate(bell, { x: { pairs: 3, agree: 3 }, y: { pairs: 0, agree: 0 }, z: { pairs: 3, agree: 3 } }), null);
  const e = s.estimate(bell, { x: { pairs: 5, agree: 5 }, y: { pairs: 5, agree: 0 }, z: { pairs: 5, agree: 5 } })!;
  close(e.value, -0.5); close(e.wobble, 0);
});

test('estimate is unbiased and its wobble is right: the exact mean and spread over every outcome of one pair per setting', () => {
  for (const [n, x, b] of [['white', 0.6, 0], ['white', 0.4, 60], ['coin', 0.5, 30], ['white', 0.2, 180]] as [s.Noise, number, number][]) {
    const r = s.rho(n, x, b), W = s.witness(r);
    let mean = 0, second = 0, w = 0;
    for (const sx of [0, 1]) for (const sy of [0, 1]) for (const sz of [0, 1]) {
      const sign = [sx, sy, sz], t = {} as Record<s.Basis, s.Tally>;
      let prob = 1;
      s.BASES.forEach((k, i) => { const c = s.corr(r, k); prob *= (1 + (sign[i] ? 1 : -1) * c) / 2; t[k] = { pairs: 1, agree: sign[i] }; });
      const e = s.estimate(r, t)!;
      mean += prob * e.value; second += prob * e.value ** 2; w = e.wobble;
    }
    close(mean, W, 1e-12);
    close(Math.sqrt(second - mean ** 2), w, 1e-12);
    // n pairs per setting: the wobble shrinks as 1/√n.
    const four = s.estimate(r, { x: { pairs: 4, agree: 2 }, y: { pairs: 4, agree: 2 }, z: { pairs: 4, agree: 2 } })!;
    close(four.wobble, w / 2, 1e-12);
  }
});

test('white noise at x = 0 (I/4) has wobble √3/(4√n): every correlation is 0', () => {
  const e = s.estimate(s.rho('white', 0, 0), { x: { pairs: 100, agree: 50 }, y: { pairs: 100, agree: 50 }, z: { pairs: 100, agree: 50 } })!;
  close(e.wobble, Math.sqrt(3 / 100) / 4);
  close(e.value, 0.25);
});

// ---- Words

test('val and entry: signs, decimals, exact values', () => {
  assert.equal(s.val(0), '0');
  assert.equal(s.val(-1e-17), '0');
  assert.equal(s.val(-0.2), '−0.20');
  assert.equal(s.val(0.0025), '0.003');
  assert.equal(s.val(-0.005), '−0.005');
  assert.equal(s.val(0.5), '0.50');
  assert.equal(s.entry(0.5000000000000001), '0.50');
  assert.equal(s.entry(0), '0');
  assert.equal(s.entry(1), '1');
  assert.equal(s.entry(-0.25), '−0.25');
  assert.equal(s.entry(-1e-17), '0');
});

test('chance and recipeLines: one decimal at most, tiny chances as <0.1%', () => {
  assert.equal(s.chance(1 / 6), '16.7%');
  assert.equal(s.chance(0.165), '16.5%');
  assert.equal(s.chance(0.25), '25%');
  assert.equal(s.chance(0.0002), '<0.1%');
  assert.deepEqual(s.recipeLines(s.recipe('coin', 0, 0)!), ['50%  |0⟩ ⊗ |0⟩', '50%  |1⟩ ⊗ |1⟩']);
});

test('madeText names the start state and the gates; beta = 180° says singlet', () => {
  const t = s.madeText('white', 0.6, 0);
  assert.match(t, /^Started as 00, then a Hadamard gate on A and a CNOT from A to B/);
  assert.match(t, /chance 60%/);
  assert.match(t, /white noise/);
  assert.match(t, /no gate on B/);
  assert.match(s.madeText('coin', 0.5, 60), /coin noise.*RY\(60°\) on B alone/);
  assert.match(s.madeText('coin', 0.5, 180), /singlet/);
});

test('eigenText lists the four eigenvalues of ρ and of ρ^Γ, smallest first', () => {
  const t = s.eigenText(s.rho('white', 0.6, 0));
  assert.match(t, /ρ has the eigenvalues 0\.10, 0\.10, 0\.10 and 0\.70: none is negative, and they add to 1/);
  assert.match(t, /ρ\^Γ, ρ with B's half flipped, has −0\.20, 0\.40, 0\.40 and 0\.40: they also add to 1/);
});

test('pptText: white noise at 33% passes (0.003, separable), at 34% fails (−0.005, entangled)', () => {
  const pass = s.pptText(s.rho('white', 0.33, 0)), fail = s.pptText(s.rho('white', 0.34, 0));
  assert.match(pass, /0\.003/); assert.match(pass, /separable/); assert.doesNotMatch(pass, /is entangled/);
  assert.match(fail, /−0\.005/); assert.match(fail, /entangled/);
  assert.match(s.pptText(s.outer(s.bellPair())), /−0\.50.*entangled/);
});

test('witnessText: detects at 60% and beta = 0 (−0.20); blind at beta = 120° though entangled; separable states cannot be detected', () => {
  assert.match(s.witnessText(s.rho('white', 0.6, 0)), /exact value −0\.20.*detects entanglement/);
  const blind = s.witnessText(s.rho('white', 1, 120));
  assert.match(blind, /not below 0: this witness says nothing, yet the state is entangled/);
  assert.match(s.witnessText(s.rho('white', 0.2, 0)), /separable, so no witness can detect it/);
});

test('measuredText: asks for shots, then all three settings, then reads the witness with its wobble and a verdict', () => {
  const none = { x: [], y: [], z: [] } as Record<s.Basis, s.Pair[]>;
  const bell = s.outer(s.bellPair());
  assert.match(s.measuredText(bell, none), /Measure pairs/);
  assert.match(s.measuredText(bell, { ...none, x: [[0, 0]] }), /1 pair measured so far.*all three settings/);
  // Bell pair: X and Z results agree, Y results differ.
  const shots = { x: [[0, 0], [1, 1]], y: [[0, 1], [1, 0]], z: [[0, 0], [1, 1]] } as Record<s.Basis, s.Pair[]>;
  const t = s.measuredText(bell, shots);
  assert.match(t, /From 6 measured pairs the witness reads −0\.50/);
  assert.match(t, /by about 0\.00/);
  assert.match(t, /shots say entangled/);
  // Every pair agrees in every setting: <XX> = <YY> = <ZZ> = 1, so the witness reads (1 - 1 + 1 - 1)/4 = 0, not below 0.
  const flat = { x: [[0, 0]], y: [[0, 0]], z: [[0, 0]] } as Record<s.Basis, s.Pair[]>;
  const f = s.measuredText(s.rho('white', 0.6, 0), flat);
  assert.match(f, /From 3 measured pairs the witness reads 0, and chance alone moves it by about 0\.35/);
  assert.match(f, /not below 0: the shots do not show entanglement/);
});

test('measuredText: a reading below 0 by less than two wobbles says luck could do this; by more, it says entangled', () => {
  const r = s.rho('white', 0.4, 0); // exact value -0.05; correlations 0.4, -0.4, 0.4
  // Four pairs a setting: X and Z agree 3 times, Y agrees once: <XX> = 0.5, <YY> = -0.5, <ZZ> = 0.5, so W = -0.125.
  const four = { x: [[0, 0], [0, 0], [0, 0], [0, 1]], y: [[0, 1], [0, 1], [0, 1], [0, 0]], z: [[0, 0], [0, 0], [0, 0], [0, 1]] } as Record<s.Basis, s.Pair[]>;
  const t = s.measuredText(r, four);
  assert.match(t, /reads −0\.13, and chance alone moves it by about 0\.20/); // -0.125 rounds to -0.13 (0.125 is exact in binary)
  assert.match(t, /by less than two of those: luck could do this/);
  // Fifty pairs a setting at 60%: correlations 0.6, -0.6, 0.6 measured as 0.6, -0.6, 0.6, so W = -0.2, wobble 0.049.
  const agree = (n: number, k: number): s.Pair[] => Array.from({ length: n }, (_, i) => (i < k ? [0, 0] : [0, 1]) as s.Pair);
  const strong = { x: agree(50, 40), y: agree(50, 10), z: agree(50, 40) };
  const u = s.measuredText(s.rho('white', 0.6, 0), strong);
  assert.match(u, /From 150 measured pairs the witness reads −0\.20, and chance alone moves it by about 0\.05/);
  assert.match(u, /by more than two of those.*shots say entangled/);
});

test('report: starts with the start state, then PPT, witness and shots', () => {
  const none = { x: [], y: [], z: [] } as Record<s.Basis, s.Pair[]>;
  const t = s.report('white', 0.6, 0, none);
  assert.match(t, /^Started as 00/);
  assert.match(t, /ρ has the eigenvalues 0\.10, 0\.10, 0\.10 and 0\.70/);
  assert.match(t, /smallest eigenvalue of ρ\^Γ is −0\.20/);
  assert.match(t, /exact value −0\.20/);
  assert.match(t, /Measure pairs to estimate/);
  const twisted = s.report('white', 0.6, 120, none);
  assert.match(twisted, /RY\(120°\)/);
  assert.match(twisted, /smallest eigenvalue of ρ\^Γ is −0\.20/); // unchanged by the gate on B
  assert.match(twisted, /says nothing, yet the state is entangled/);
});
