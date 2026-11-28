import test from 'node:test';
import assert from 'node:assert/strict';
import * as q from '../quantum.ts';
import * as o from './observables.ts';

const close = (a: number, x: number, eps = 1e-12) => assert.ok(Math.abs(a - x) < eps, `${a} != ${x}`);
const closeC = (a: q.C, x: q.C, eps = 1e-12) => { close(a.re, x.re, eps); close(a.im, x.im, eps); };
const closeM = (a: q.Matrix, b: q.Matrix, eps = 1e-12) => a.forEach((row, i) => row.forEach((x, j) => closeC(x, b[i][j], eps)));
const closeV = (a: q.State, b: q.State, eps = 1e-12) => a.forEach((x, i) => closeC(x, b[i], eps));
/** |<u|v>| = 1: the same state up to a global phase. */
const samePhysical = (u: q.State, v: q.State) => close(q.abs(q.inner(u, v)), 1);
const addM = (a: q.Matrix, b: q.Matrix): q.Matrix => a.map((row, i) => row.map((x, j) => q.add(x, b[i][j])));
const scaleM = (a: q.Matrix, k: number): q.Matrix => a.map((row) => row.map((x) => q.scale(x, k)));
const ZERO: q.Matrix = [[q.c(0), q.c(0)], [q.c(0), q.c(0)]];
const S5 = Math.sqrt(5);

// Every matrix the sliders reach: each entry from -2 to 2 in steps of 0.5.
const STEPS: number[] = [];
for (let x = o.ENTRY.min; x <= o.ENTRY.max; x += o.ENTRY.step) STEPS.push(x);
const GRID: o.Sym[] = [];
for (const a of STEPS) for (const b of STEPS) for (const d of STEPS) GRID.push({ a, b, d });
// Start states: every 15 degrees, plus odd ones.
const DEGS = [-90, -75, -60, -45, -30, -15, 0, 15, 30, 45, 60, 75, 90, -89, -1, 1, 7, 26, 27, 64, 89];

test('the grid is every slider position: 9 values per entry', () => {
  assert.equal(STEPS.length, 9);
  assert.deepEqual(STEPS, [-2, -1.5, -1, -0.5, 0, 0.5, 1, 1.5, 2]);
  assert.equal(GRID.length, 729);
});

// ---- The matrix is Hermitian, and its eigen-decomposition is right

test('every slider matrix is Hermitian (real and symmetric)', () => {
  for (const s of GRID) assert.ok(o.isHermitian(o.matrix(s)));
  assert.ok(!o.isHermitian([[q.c(1), q.c(1)], [q.c(0), q.c(2)]]));
  assert.ok(!o.isHermitian([[q.c(1), q.c(0, 1)], [q.c(0, 1), q.c(1)]]));
  assert.ok(o.isHermitian(q.Y));
});

test('A v = lambda v for both eigenvectors, which are orthonormal, with real eigenvalues hi >= lo', () => {
  for (const s of GRID) {
    const A = o.matrix(s), sp = o.spectrum(s);
    const [hi, lo] = sp.values;
    assert.ok(hi >= lo);
    sp.vectors.forEach((v, k) => {
      close(q.norm2(v), 1);
      closeV(q.matVec(A, v), v.map((x) => q.scale(x, sp.values[k])), 1e-12);
    });
    close(q.abs(q.inner(sp.vectors[0], sp.vectors[1])), 0);
    // Trace and determinant: hi + lo = a + d and hi lo = ad - b².
    close(hi + lo, s.a + s.d);
    close(hi * lo, s.a * s.d - s.b * s.b, 1e-12);
  }
});

test('one eigenvalue (every vector an eigenvector) exactly when A = aI', () => {
  for (const s of GRID) {
    const sp = o.spectrum(s);
    assert.equal(sp.degenerate, s.a === s.d && s.b === 0);
    if (sp.degenerate) { assert.equal(sp.values[0], s.a); assert.equal(sp.values[1], s.a); }
    else assert.ok(sp.values[0] - sp.values[1] >= 0.5 - 1e-12, 'distinct eigenvalues differ by at least 0.5 on the grid');
  }
});

test('each eigenvector is shown with its first nonzero amplitude positive', () => {
  for (const s of GRID) for (const v of o.spectrum(s).vectors) {
    const x = v[0].re, y = v[1].re;
    assert.equal(v[0].im, 0); assert.equal(v[1].im, 0);
    assert.ok(x > 0 || (x === 0 && y > 0), `${x}, ${y}`);
  }
});

test('every eigenvalue fits on the number line from -5 to 5', () => {
  for (const s of GRID) for (const l of o.spectrum(s).values) assert.ok(Math.abs(l) < o.RULER);
  // The extremes are ±4, at rows (2, ±2), (±2, 2) and rows (-2, ±2), (±2, -2).
  close(Math.max(...GRID.map((s) => o.spectrum(s).values[0])), 4);
  close(Math.min(...GRID.map((s) => o.spectrum(s).values[1])), -4);
});

test('spectral decomposition: A = hi P_hi + lo P_lo, with projectors that add to I', () => {
  for (const s of GRID) {
    const [P0, P1] = o.projectors(s), [hi, lo] = o.spectrum(s).values;
    closeM(addM(scaleM(P0, hi), scaleM(P1, lo)), o.matrix(s));
    closeM(addM(P0, P1), q.I);
    for (const P of [P0, P1]) { closeM(q.matMul(P, P), P); closeM(q.dagger(P), P); }
    closeM(q.matMul(P0, P1), ZERO);
  }
});

test('with a nonzero off-diagonal, the eigenvalues sit strictly outside the diagonal entries', () => {
  // So the readout's "the diagonal entries never show up" is true, even after rounding to two decimals.
  for (const s of GRID) {
    if (s.b === 0) continue;
    const [hi, lo] = o.spectrum(s).values;
    assert.ok(hi > Math.max(s.a, s.d) + 0.05 && lo < Math.min(s.a, s.d) - 0.05);
    for (const l of [hi, lo]) assert.ok(o.num(l) !== o.num(s.a) && o.num(l) !== o.num(s.d));
  }
});

test('the tool formula agrees with the general one, a0 ± |a| at the Bloch points ±â', () => {
  for (const s of GRID) {
    const sp = o.spectrum(s), g = o.eigen2(o.matrix(s));
    assert.equal(g.degenerate, sp.degenerate);
    close(g.values[0], sp.values[0]); close(g.values[1], sp.values[1]);
    if (!sp.degenerate) { samePhysical(g.vectors[0], sp.vectors[0]); samePhysical(g.vectors[1], sp.vectors[1]); }
  }
});

// ---- Known values

test('presets: Z and X give ±1, |1><1| gives 1 and 0, Surprise gives 2 and -3', () => {
  const want: Record<string, [number, number]> = { Z: [1, -1], X: [1, -1], N: [1, 0], S: [2, -3] };
  for (const p of o.PRESETS) {
    const [hi, lo] = o.spectrum(p.o).values;
    close(hi, want[p.id][0]); close(lo, want[p.id][1]);
  }
  const at = (id: string) => o.spectrum(o.PRESETS.find((p) => p.id === id)!.o).vectors;
  closeV(at('Z')[0], q.ket0()); closeV(at('Z')[1], q.ket1());
  closeV(at('X')[0], q.plus()); closeV(at('X')[1], q.minus());
  closeV(at('N')[0], q.ket1()); closeV(at('N')[1], q.ket0());
  closeV(at('S')[0], [q.c(2 / S5), q.c(1 / S5)]);
  closeV(at('S')[1], [q.c(1 / S5), q.c(-2 / S5)]);
});

test('Surprise, started as 0: amplitudes 2/√5 and 1/√5, so 80% for 2 and 20% for -3', () => {
  const S = o.PRESETS[3].o, s0 = o.stateAt(0);
  const [c0, c1] = o.amplitudes(S, s0);
  close(c0, 2 / S5); close(c1, 1 / S5);
  const [p0, p1] = o.odds(S, s0);
  close(p0, 0.8); close(p1, 0.2);
  // |0> = (2/√5) v_hi + (1/√5) v_lo
  const [v0, v1] = o.spectrum(S).vectors;
  closeV(v0.map((x, i) => q.add(q.scale(x, 2 / S5), q.scale(v1[i], 1 / S5))), q.ket0());
});

test('Pauli parts of Surprise: a0 = -1/2, a = (2, 0, 3/2), |a| = 5/2', () => {
  const p = o.pauliParts(o.matrix(o.PRESETS[3].o));
  assert.deepEqual(p, { a0: -0.5, ax: 2, ay: -0, az: 1.5 });
  close(Math.hypot(p.ax, p.ay, p.az), 2.5);
});

test('Pauli parts rebuild any 2x2 Hermitian matrix, complex ones too', () => {
  const Ms: q.Matrix[] = [
    q.Y, q.X, q.Z, q.I,
    [[q.c(0.3), q.c(1.2, -0.7)], [q.c(1.2, 0.7), q.c(-1.1)]],
    [[q.c(2), q.c(0, 1)], [q.c(0, -1), q.c(2)]],
  ];
  for (const M of Ms) {
    assert.ok(o.isHermitian(M));
    const { a0, ax, ay, az } = o.pauliParts(M);
    const back = addM(addM(scaleM(q.I, a0), scaleM(q.X, ax)), addM(scaleM(q.Y, ay), scaleM(q.Z, az)));
    closeM(back, M);
    const g = o.eigen2(M), r = Math.hypot(ax, ay, az);
    close(g.values[0], a0 + r); close(g.values[1], a0 - r);
    if (!g.degenerate) g.vectors.forEach((v, k) => closeV(q.matVec(M, v), v.map((x) => q.scale(x, g.values[k]))));
  }
});

test('Y as an observable: results ±1, eigenvectors |+i> and |-i>', () => {
  const g = o.eigen2(q.Y);
  close(g.values[0], 1); close(g.values[1], -1);
  samePhysical(g.vectors[0], [q.c(Math.SQRT1_2), q.c(0, Math.SQRT1_2)]);
  samePhysical(g.vectors[1], [q.c(Math.SQRT1_2), q.c(0, -Math.SQRT1_2)]);
});

// ---- The Born rule along the eigenvectors

test('the odds add to 1, match <psi|P_k|psi>, and match cos²(t - u)', () => {
  for (const s of GRID) for (const deg of DEGS) {
    const st = o.stateAt(deg), p = o.odds(s, st), sp = o.spectrum(s);
    close(p[0] + p[1], 1);
    const pp = o.oddsByProjector(s, st);
    close(p[0], pp[0]); close(p[1], pp[1]);
    if (!sp.degenerate) close(p[0], Math.cos(deg * Math.PI / 180 - sp.u) ** 2);
  }
});

test('the odds match the Bloch picture: (1 + r·n)/2, with n the axis of the larger eigenvalue', () => {
  for (const s of GRID) {
    const sp = o.spectrum(s);
    if (sp.degenerate) continue;
    const n = q.bloch(sp.vectors[0]);
    close(n[1], 0); close(n[0], Math.sin(2 * sp.u)); close(n[2], Math.cos(2 * sp.u));
    for (const deg of DEGS) {
      const r = q.bloch(o.stateAt(deg));
      close(o.odds(s, o.stateAt(deg))[0], (1 + r[0] * n[0] + r[1] * n[1] + r[2] * n[2]) / 2);
    }
  }
});

test('the average result is <psi|A|psi>: for Surprise and |0>, 0.8 × 2 + 0.2 × (-3) = 1 = A00', () => {
  for (const s of GRID) for (const deg of DEGS) {
    const st = o.stateAt(deg), p = o.odds(s, st), [hi, lo] = o.spectrum(s).values;
    close(p[0] * hi + p[1] * lo, q.inner(st, q.matVec(o.matrix(s), st)).re);
  }
  const S = o.PRESETS[3].o, p = o.odds(S, o.stateAt(0));
  close(p[0] * 2 + p[1] * -3, 1);
});

test('after a result the state is an eigenvector for it, and measuring again gives the same result', () => {
  for (const s of GRID) for (const deg of DEGS) {
    const st = o.stateAt(deg), sp = o.spectrum(s), p = o.odds(s, st);
    ([0, 1] as const).forEach((k) => {
      if (p[k] === 0) return;
      const v = o.after(s, st, k);
      close(q.norm2(v), 1);
      closeV(q.matVec(o.matrix(s), v), v.map((x) => q.scale(x, sp.values[k])));
      if (!sp.degenerate) { samePhysical(v, sp.vectors[k]); close(o.odds(s, v)[k], 1); }
    });
  }
});

test('one eigenvalue: every copy gives it, and the state is left as it was', () => {
  const s = { a: 1, b: 0, d: 1 };
  for (const deg of DEGS) {
    const st = o.stateAt(deg);
    assert.deepEqual(o.odds(s, st), [1, 0]);
    assert.deepEqual(o.after(s, st, 0), st);
  }
});

test('eigenvalues are labels: Z, |1><1| and (1/2)Z share their projectors', () => {
  const Z = o.projectors({ a: 1, b: 0, d: -1 }), N = o.projectors({ a: 0, b: 0, d: 1 }), half = o.projectors({ a: 0.5, b: 0, d: -0.5 });
  closeM(N[0], Z[1]); closeM(N[1], Z[0]);
  closeM(half[0], Z[0]); closeM(half[1], Z[1]);
  // |1><1| = (I - Z)/2
  closeM(o.matrix({ a: 0, b: 0, d: 1 }), scaleM(addM(q.I, scaleM(q.Z, -1)), 0.5));
  for (const deg of DEGS) {
    const st = o.stateAt(deg);
    close(o.odds({ a: 0, b: 0, d: 1 }, st)[0], o.odds({ a: 1, b: 0, d: -1 }, st)[1]);
    close(o.odds({ a: 0.5, b: 0, d: -0.5 }, st)[0], o.odds({ a: 1, b: 0, d: -1 }, st)[0]);
  }
});

test('a non-Hermitian matrix fails: rows (1, 1), (0, 2) has eigenvectors |0> and |+>, and its "odds" for |0> add to 3/2', () => {
  const M: q.Matrix = [[q.c(1), q.c(1)], [q.c(0), q.c(2)]];
  closeV(q.matVec(M, q.ket0()), q.ket0());
  closeV(q.matVec(M, q.plus()), q.plus().map((x) => q.scale(x, 2)));
  close(q.abs(q.inner(q.ket0(), q.plus())), Math.SQRT1_2);
  close(q.abs2(q.inner(q.ket0(), q.ket0())) + q.abs2(q.inner(q.plus(), q.ket0())), 1.5);
});

test('myth: A|0> is not a result. For Surprise it is (1, 2), of length √5, along neither eigenvector', () => {
  const S = o.PRESETS[3].o, Av = q.matVec(o.matrix(S), q.ket0());
  closeV(Av, [q.c(1), q.c(2)]);
  close(q.norm2(Av), 5);
  for (const v of o.spectrum(S).vectors) assert.ok(q.abs(q.inner(v, Av)) / S5 < 0.99);
});

test('Z ⊗ Z has eigenvalues ±1 with two-dimensional eigenspaces: it reads parity and leaves Φ+ alone', () => {
  const ZZ = q.kron(q.Z, q.Z);
  assert.deepEqual(ZZ.map((row, i) => row[i].re), [1, -1, -1, 1]);
  const even = [0, 3], P: q.Matrix = ZZ.map((row, i) => row.map((_, j) => q.c(i === j && even.includes(i) ? 1 : 0)));
  closeM(q.matMul(P, P), P);
  close(P.reduce((t, row, i) => t + row[i].re, 0), 2);
  const phi: q.State = [q.c(Math.SQRT1_2), q.c(0), q.c(0), q.c(Math.SQRT1_2)];
  closeV(q.matVec(P, phi), phi);
  closeV(q.matVec(ZZ, phi), phi);
  // Any a|00> + b|11> keeps both amplitudes: the +1 result does not pick |00> or |11>.
  const ab: q.State = [q.c(0.6), q.c(0), q.c(0), q.c(0, 0.8)];
  closeV(q.matVec(P, ab), ab);
  closeV(q.matVec(ZZ, ab), ab);
  // |01> and |10> give -1.
  for (const i of [1, 2]) closeV(q.matVec(ZZ, q.basis(2, i)), q.basis(2, i).map((x) => q.scale(x, -1)));
});

test('a repeated eigenvalue keeps coherence: A = diag(1, 1, -1) with state (|0> + i|1> + |2>)/√3 gives +1 with chance 2/3 and lands on (|0> + i|1>)/√2, relative phase kept', () => {
  const psi = q.normalize([q.c(1), q.c(0, 1), q.c(1)]);
  const P: q.Matrix = [0, 1, 2].map((i) => [0, 1, 2].map((j) => q.c(i === j && i < 2 ? 1 : 0)));
  const kept = q.matVec(P, psi), p = q.inner(psi, kept).re;
  close(p, 2 / 3);
  closeV(kept.map((x) => q.scale(x, 1 / Math.sqrt(p))), [q.c(Math.SQRT1_2), q.c(0, Math.SQRT1_2), q.c(0)]);
  // Not one eigenvector picked in advance: both |0> and |1> keep weight 1/2, and their phase i survives.
  close(q.abs2(kept[0]) / p, 0.5); close(q.abs2(kept[1]) / p, 0.5);
  // The 2x2 identity is the same case: one result, state left exactly as it was, even with a complex phase.
  const id = { a: 1, b: 0, d: 1 }, st: q.State = [q.c(Math.SQRT1_2), q.c(0, Math.SQRT1_2)];
  assert.deepEqual(o.after(id, st, 0), st);
  assert.deepEqual(o.projectors(id)[0], q.I);
});

// ---- States

test('start states are real unit vectors, exact at the presets', () => {
  for (let deg = -90; deg <= 90; deg++) { const s = o.stateAt(deg); close(q.norm2(s), 1); assert.equal(s[0].im, 0); assert.equal(s[1].im, 0); }
  assert.deepEqual(o.stateAt(0).map((x) => x.re), [1, 0]);
  assert.deepEqual(o.stateAt(90).map((x) => x.re), [0, 1]);
  assert.deepEqual(o.stateAt(-90).map((x) => x.re), [0, -1]);
  closeV(o.stateAt(45), q.plus()); closeV(o.stateAt(-45), q.minus());
});

// ---- Shots and piles

test('shots: certain results stay certain, and a seeded run of Surprise on |0> lands near 80/20', () => {
  assert.ok(o.shoot([1, 0], 200, q.rng(3)).every((b) => b === 0));
  assert.ok(o.shoot([0, 1], 200, q.rng(3)).every((b) => b === 1));
  const n = 10000, k = o.shoot(o.odds(o.PRESETS[3].o, o.stateAt(0)), n, q.rng(11)).filter((b) => b === 0).length;
  assert.ok(Math.abs(k - 8000) < 4 * 40, `${k}`); // 4 standard deviations, sqrt(n p (1 - p)) = 40
});

test('room, cap and expected counts', () => {
  assert.equal(o.CAP, 300);
  assert.equal(o.room(0, o.BATCH), 100);
  assert.equal(o.room(250, o.BATCH), 50);
  assert.equal(o.room(o.CAP, 1), 0);
  close(o.expected(300, 0.8), 240);
});

test('number line: -5 at the left end, 0 in the middle, 5 at the right end', () => {
  close(o.along(-5), 0); close(o.along(0), 0.5); close(o.along(5), 1); close(o.along(2), 0.7);
});

test('piles: left alone when far apart, pushed apart around their midpoint when close, kept inside', () => {
  assert.deepEqual(o.placePiles([200, 50], 80, 30, 270), [200, 50]);
  const [a, b] = o.placePiles([150, 130], 80, 30, 270);
  close(a - b, 80); close((a + b) / 2, 140);
  const [c, d] = o.placePiles([268, 260], 80, 30, 270);
  close(c, 270); close(c - d, 80);
  const [e, f] = o.placePiles([35, 31], 80, 30, 270);
  close(f, 30); close(e - f, 80);
  for (const want of [[100, 90], [40, 40], [270, 30], [250, 245]] as [number, number][]) {
    const [x0, x1] = o.placePiles(want, 60, 30, 270);
    assert.ok(x0 - x1 >= 60 - 1e-9 && x1 >= 30 - 1e-9 && x0 <= 270 + 1e-9);
  }
});

// ---- Words

test('numbers: two decimals at most, a true minus sign, no "−0"', () => {
  assert.deepEqual([2, -3, 0.5, 1.2071, -0.2071, -0.001, 0, 2.5, 4.828].map(o.num), ['2', '−3', '0.5', '1.21', '−0.21', '0', '0', '2.5', '4.83']);
  assert.deepEqual([0.894, -0.447, 0.001, -0.001, 1].map(o.amp), ['0.89', '−0.45', '0.00', '0.00', '1.00']);
});

test('kets: named presets, a true minus sign, amplitudes otherwise', () => {
  assert.deepEqual([0, 90, 45, -45, -90].map(o.ketText), ['|0⟩', '|1⟩', '|+⟩', '|−⟩', '−|1⟩']);
  assert.equal(o.ketText(30), '0.87|0⟩ + 0.50|1⟩');
  assert.equal(o.ketText(-60), '0.50|0⟩ − 0.87|1⟩');
  const [v0, v1] = o.spectrum(o.PRESETS[3].o).vectors;
  assert.equal(o.vecText(v0), '0.89|0⟩ + 0.45|1⟩');
  assert.equal(o.vecText(v1), '0.45|0⟩ − 0.89|1⟩');
  assert.equal(o.matrixText(o.PRESETS[3].o), 'rows (1,\u00a02) and (2,\u00a0−2)');
});

test('odds text: whole percents that add to 100, never a false 0% or 100%', () => {
  assert.deepEqual(o.pctPair(0.8), ['80%', '20%']);
  assert.deepEqual(o.pctPair(1), ['100%', '0%']);
  assert.deepEqual(o.pctPair(0), ['0%', '100%']);
  assert.deepEqual(o.pctPair(0.996), ['over 99%', 'under 1%']);
  assert.deepEqual(o.pctPair(0.995), ['over 99%', 'under 1%']);
  assert.deepEqual(o.pctPair(0.004), ['under 1%', 'over 99%']);
  for (const s of GRID) for (const deg of DEGS) {
    const p = o.odds(s, o.stateAt(deg))[0], [a, b] = o.pctPair(p);
    if (p > 0 && p < 1) assert.ok(a !== '100%' && a !== '0%' && b !== '100%' && b !== '0%');
    if (/^\d+%$/.test(a) && /^\d+%$/.test(b)) assert.equal(parseInt(a) + parseInt(b), 100);
  }
});

test('readout: names the start state, the matrix, the eigenvalues, the odds and the shots', () => {
  const S = o.PRESETS[3].o;
  assert.equal(o.describe(0, S, [0, 0]),
    'Started as |0⟩. A has rows (1,\u00a02) and (2,\u00a0−2). Its eigenvalues are 2, with eigenvector 0.89|0⟩ + 0.45|1⟩, and −3, with eigenvector 0.45|0⟩ − 0.89|1⟩. These are the only results. The diagonal entries, 1 and −2, never show up. Odds: 80% for 2, 20% for −3. Press a Measure button to test fresh copies.');
  assert.match(o.describe(0, S, [79, 21]), /Of 100 fresh copies, 79 gave 2 and 21 gave −3\. Each was left in the eigenvector for its result\.$/);
  assert.match(o.describe(0, S, [0, 1]), /1 fresh copy gave −3 and was left in its eigenvector\.$/);
  assert.match(o.describe(0, S, [240, 60]), /The piles are full\.$/);
  assert.match(o.describe(45, { a: 0, b: 1, d: 0 }, [0, 0]), /^Started as \|\+⟩\. .* The diagonal entry 0 never shows up\. Odds: 100% for 1, 0% for −1\./);
  assert.match(o.describe(0, { a: 1, b: 0, d: -1 }, [0, 0]), /A is diagonal, so its eigenvalues are its diagonal entries: 1, with eigenvector \|0⟩, and −1, with eigenvector \|1⟩\. Odds: 100% for 1, 0% for −1\./);
  assert.match(o.describe(90, { a: 0, b: 0, d: 1 }, [0, 0]), /eigenvalues are its diagonal entries: 1, with eigenvector \|1⟩, and 0, with eigenvector \|0⟩\. Odds: 100% for 1, 0% for 0\./);
  assert.equal(o.describe(30, { a: 1, b: 0, d: 1 }, [7, 0]).endsWith('Both eigenvalues are 1, and every vector is an eigenvector. So every copy gives 1 and is left as it was. All 7 fresh copies gave 1.'), true);
  for (const s of GRID) for (const deg of [0, 90, -45, 30]) assert.ok(o.describe(deg, s, [0, 0]).startsWith(`Started as ${o.ketText(deg)}. A has ${o.matrixText(s)}.`));
});

test('amplitude line: one amplitude per result', () => {
  assert.equal(o.calcText(0, o.PRESETS[3].o), 'Amplitude for result 2: 0.89. Amplitude for result −3: 0.45. Each chance is |amplitude|².');
  assert.equal(o.calcText(45, { a: 1, b: 0, d: -1 }), 'Amplitude for result 1: 0.71. Amplitude for result −1: 0.71. Each chance is |amplitude|².');
  assert.match(o.calcText(0, { a: -1, b: 0, d: -1 }), /only result is −1, with chance 100%/);
});
