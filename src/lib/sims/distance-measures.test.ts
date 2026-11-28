import test from 'node:test';
import assert from 'node:assert/strict';
import * as q from '../quantum.ts';
import * as d from './distance-measures.ts';

const close = (a: number, x: number, eps = 1e-9) => assert.ok(Math.abs(a - x) < eps, `${a} != ${x}`);
const closeC = (a: q.C, x: q.C, eps = 1e-9) => { close(a.re, x.re, eps); close(a.im, x.im, eps); };
const closeM = (a: q.Matrix, x: q.Matrix, eps = 1e-9) => a.forEach((row, i) => row.forEach((z, j) => closeC(z, x[i][j], eps)));
const dot = (u: readonly number[], v: readonly number[]) => u.reduce((t, x, i) => t + x * v[i], 0);
const tr = (m: q.Matrix) => q.add(m[0][0], m[1][1]);
const RAD = Math.PI / 180;

const rand = q.rng(7);
/** A random Bloch vector in the ball (any direction, any length, sometimes exactly pure). */
function randomVec(pure = false): d.Vec3 {
  const z = 2 * rand() - 1, t = 2 * Math.PI * rand(), s = Math.sqrt(1 - z * z);
  const r = pure ? 1 : Math.cbrt(rand());
  return [r * s * Math.cos(t), r * s * Math.sin(t), r * z];
}
const pairs = Array.from({ length: 2000 }, () => [randomVec(), randomVec()] as [d.Vec3, d.Vec3]);
const purePairs = Array.from({ length: 500 }, () => [randomVec(true), randomVec(true)] as [d.Vec3, d.Vec3]);
const norm = (v: readonly number[]) => Math.hypot(...v);
const ket = (v: d.Vec3): q.State => {
  // The pure state at Bloch point v: theta down from |0⟩, phi around from |+⟩.
  const theta = Math.acos(Math.max(-1, Math.min(1, v[2]))), phi = Math.atan2(v[1], v[0]);
  return q.fromBloch(theta, phi);
};

// ---- The matrix definitions agree with the closed forms

test('rhoOf makes a density matrix: Hermitian, trace 1, and its Bloch vector comes back', () => {
  for (const [u] of pairs.slice(0, 200)) {
    const rho = d.rhoOf(u);
    closeM(rho, q.dagger(rho));
    closeC(tr(rho), q.c(1));
    close(tr(q.matMul(rho, q.X)).re, u[0]);
    close(tr(q.matMul(rho, q.Y)).re, u[1]);
    close(tr(q.matMul(rho, q.Z)).re, u[2]);
  }
});

test('sqrtPsd squares back to the matrix, and is positive', () => {
  for (const [u, v] of pairs.slice(0, 300)) {
    for (const w of [u, v]) {
      const rho = d.rhoOf(w), s = d.sqrtPsd(rho);
      closeM(q.matMul(s, s), rho);
      closeM(s, q.dagger(s));
    }
  }
  // A pure state is its own square root; the zero matrix has the zero root.
  const pure = d.rhoOf([0, 0, 1]);
  closeM(d.sqrtPsd(pure), pure);
  closeM(d.sqrtPsd(d.rhoOf([0.6, 0, 0.8])), d.rhoOf([0.6, 0, 0.8]));
  closeM(d.sqrtPsd([[q.c(0), q.c(0)], [q.c(0), q.c(0)]]), [[q.c(0), q.c(0)], [q.c(0), q.c(0)]]);
});

test('trace distance: half the Bloch distance equals ½‖ρ − σ‖₁ from the matrices', () => {
  for (const [u, v] of pairs) close(d.traceDistance(u, v), d.traceDistanceMatrix(d.rhoOf(u), d.rhoOf(v)));
});

test('fidelity: the qubit formula equals tr √(√ρ σ √ρ) and ‖√ρ √σ‖₁ from the matrices', () => {
  for (const [u, v] of pairs) {
    const rho = d.rhoOf(u), sigma = d.rhoOf(v);
    close(d.fidelity(u, v), d.fidelityMatrix(rho, sigma), 1e-7);
    close(d.fidelity(u, v), d.traceNorm(q.matMul(d.sqrtPsd(rho), d.sqrtPsd(sigma))), 1e-7);
  }
});

test('F² = tr(ρσ) + 2√(det ρ det σ) for qubits', () => {
  for (const [u, v] of pairs) {
    const rho = d.rhoOf(u), sigma = d.rhoOf(v);
    const det = (m: q.Matrix) => q.sub(q.mul(m[0][0], m[1][1]), q.mul(m[0][1], m[1][0])).re;
    const f2 = tr(q.matMul(rho, sigma)).re + 2 * Math.sqrt(Math.max(0, det(rho) * det(sigma)));
    close(d.fidelity(u, v) ** 2, f2);
  }
});

// ---- Known values

test('known values: |0⟩ vs |+⟩, |0⟩ vs |1⟩, a pure state vs the center, and vs a mix on its axis', () => {
  const at = (a: d.St, b: d.St) => { const u = d.vecOf(a), v = d.vecOf(b); return [d.traceDistance(u, v), d.fidelity(u, v)]; };
  const [p0, p1, p2, p3, p4] = d.PRESETS.map((p) => at(p.a, p.b));
  close(p0[0], Math.SQRT1_2); close(p0[1], Math.SQRT1_2);
  close(p1[0], 1); close(p1[1], 0);
  // 60° apart on the sphere: T = sin 30° = 1/2, F = cos 30°.
  close(p2[0], 0.5); close(p2[1], Math.sqrt(3) / 2);
  // Pure state vs the center: T = 1/2, F = 1/√2. Same T as the 60° pair, a different F (the myth on the page).
  close(p3[0], 0.5); close(p3[1], Math.SQRT1_2);
  assert.ok(Math.abs(p2[1] - p3[1]) > 0.15);
  // |0⟩ vs ¾|0⟩⟨0| + ¼|1⟩⟨1|: T = ¼ (a classical gap), F² = ½(1 + ½) = ¾.
  close(p4[0], 0.25); close(p4[1], Math.sqrt(0.75));
  // Cross-check with the matrices: the second pair is diag(1,0) and diag(¾,¼).
  const rho = d.rhoOf(d.vecOf(d.PRESETS[4].a)), sigma = d.rhoOf(d.vecOf(d.PRESETS[4].b));
  closeC(sigma[0][0], q.c(0.75)); closeC(sigma[1][1], q.c(0.25));
  close(d.traceDistanceMatrix(rho, sigma), 0.25);
  close(d.fidelityMatrix(rho, sigma), Math.sqrt(0.75));
});

test('the sliders reach the named states and the start is |0⟩ and |+⟩', () => {
  close(norm(d.vecOf({ angle: 0, len: 100 })), 1);
  assert.deepEqual(d.vecOf({ angle: 0, len: 100 }), [0, 0, 1]);
  assert.deepEqual(d.vecOf({ angle: 90, len: 100 }), [1, 0, 0]);
  assert.deepEqual(d.vecOf({ angle: 180, len: 100 }), [0, 0, -1]);
  assert.deepEqual(d.vecOf({ angle: 270, len: 100 }), [-1, 0, 0]);
  assert.deepEqual(d.START, { a: { angle: 0, len: 100 }, b: { angle: 90, len: 100 } });
  // The same convention as quantum.ts: the angle is the Bloch angle theta with phi = 0 (real amplitudes cos(a/2), sin(a/2)).
  for (let a = 0; a < 360; a += 15) {
    const b = q.bloch(q.fromBloch(a * RAD, 0)), v = d.vecOf({ angle: a, len: 100 });
    for (let i = 0; i < 3; i++) close(b[i], v[i]);
  }
});

// ---- Properties of both numbers

test('T and F lie in [0, 1], are symmetric, and are 0/1 only where they should be', () => {
  for (const [u, v] of pairs) {
    const t = d.traceDistance(u, v), f = d.fidelity(u, v);
    assert.ok(t >= 0 && t <= 1 && f >= 0 && f <= 1);
    close(t, d.traceDistance(v, u)); close(f, d.fidelity(v, u));
  }
  for (const [u] of pairs) { close(d.traceDistance(u, u), 0); close(d.fidelity(u, u), 1); }
  // T = 0 and F = 1 only for the same state; T = 1 and F = 0 only for opposite pure points (orthogonal states).
  const u = randomVec(true), opp: d.Vec3 = [-u[0], -u[1], -u[2]];
  close(d.traceDistance(u, opp), 1); close(d.fidelity(u, opp), 0);
  assert.ok(d.traceDistance(u, [u[0] * 0.999, u[1] * 0.999, u[2] * 0.999]) > 0);
  assert.ok(d.fidelity(u, [u[0] * 0.999, u[1] * 0.999, u[2] * 0.999]) < 1);
});

test('pure states: F = |⟨ψ|φ⟩| and T = √(1 − F²) = sin(Δ/2) where Δ is the angle between the Bloch points', () => {
  for (const [u, v] of purePairs) {
    const f = q.abs(q.inner(ket(u), ket(v)));
    close(d.fidelity(u, v), f, 1e-7);
    close(d.traceDistance(u, v), Math.sqrt(1 - f * f), 1e-7);
    const delta = Math.acos(Math.max(-1, Math.min(1, dot(u, v))));
    close(f, Math.cos(delta / 2), 1e-7);
    close(d.traceDistance(u, v), Math.sin(delta / 2), 1e-7);
  }
});

test('Fuchs-van de Graaf: 1 − F ≤ T ≤ √(1 − F²), and the top is reached by pure states', () => {
  for (const [u, v] of pairs) {
    const t = d.traceDistance(u, v), f = d.fidelity(u, v), [lo, hi] = d.boundsOnT(f);
    assert.ok(lo <= t + 1e-9 && t <= hi + 1e-9, `${lo} ${t} ${hi}`);
  }
  for (const [u, v] of purePairs) close(d.traceDistance(u, v), d.boundsOnT(d.fidelity(u, v))[1], 1e-7);
  // Both ends are real: the pure/center pair is strictly inside, and a pure state vs a mix on its axis too.
  const [lo, hi] = d.boundsOnT(Math.SQRT1_2);
  assert.ok(lo < 0.5 && 0.5 < hi);
});

test('trace distance and fidelity are not the same number: equal T, different F', () => {
  const t1 = d.traceDistance([0, 0, 1], [Math.sin(60 * RAD), 0, Math.cos(60 * RAD)]);
  const t2 = d.traceDistance([0, 0, 1], [0, 0, 0]);
  close(t1, t2);
  assert.notEqual(d.fidelity([0, 0, 1], [Math.sin(60 * RAD), 0, Math.cos(60 * RAD)]).toFixed(3), d.fidelity([0, 0, 1], [0, 0, 0]).toFixed(3));
});

test('a unitary on both states changes neither T nor F', () => {
  for (const [u, v] of pairs.slice(0, 200)) {
    const U = q.matMul(q.RX(rand() * 6), q.matMul(q.RZ(rand() * 6), q.RY(rand() * 6)));
    const move = (w: d.Vec3) => { const rho = d.rhoOf(w); return q.matMul(U, q.matMul(rho, q.dagger(U))); };
    const a = move(u), b = move(v);
    close(d.traceDistanceMatrix(a, b), d.traceDistance(u, v), 1e-7);
    close(d.fidelityMatrix(a, b), d.fidelity(u, v), 1e-6);
  }
  // In the plane, a turn is a change of angle for both.
  const a: d.St = { angle: 10, len: 80 }, b: d.St = { angle: 100, len: 30 };
  const turned = (s: d.St): d.St => ({ ...s, angle: (s.angle + 77) % 360 });
  close(d.traceDistance(d.vecOf(a), d.vecOf(b)), d.traceDistance(d.vecOf(turned(a)), d.vecOf(turned(b))));
  close(d.fidelity(d.vecOf(a), d.vecOf(b)), d.fidelity(d.vecOf(turned(a)), d.vecOf(turned(b))));
});

test('noise on both states cannot raise T or lower F (depolarizing, dephasing, amplitude damping)', () => {
  const maps: ((v: d.Vec3, k: number) => d.Vec3)[] = [
    (v, k) => [v[0] * (1 - k), v[1] * (1 - k), v[2] * (1 - k)],
    (v, k) => [v[0] * (1 - k), v[1] * (1 - k), v[2]],
    (v, k) => [v[0] * Math.sqrt(1 - k), v[1] * Math.sqrt(1 - k), k + (1 - k) * v[2]],
  ];
  for (const [u, v] of pairs.slice(0, 500)) {
    for (const map of maps) {
      const k = rand();
      assert.ok(d.traceDistance(map(u, k), map(v, k)) <= d.traceDistance(u, v) + 1e-9);
      assert.ok(d.fidelity(map(u, k), map(v, k)) >= d.fidelity(u, v) - 1e-9);
    }
  }
  // Depolarizing shrinks T by exactly the same factor.
  const [u, v] = pairs[0];
  close(d.traceDistance(maps[0](u, 0.3), maps[0](v, 0.3)), 0.7 * d.traceDistance(u, v));
});

// ---- Uhlmann: F is the best overlap between purifications

test('Uhlmann: F = the largest |⟨Ψ_ρ|Ψ_σ⟩| over purifications, reached by one unitary on the helper qubit', () => {
  const purify = (m: q.Matrix): q.State => [0, 1].flatMap((i) => [0, 1].map((j) => m[i][j])); // |Ψ⟩ = Σ M_ij |i⟩|j⟩
  const mulM = q.matMul;
  const inv = (m: q.Matrix): q.Matrix => {
    const det = q.sub(q.mul(m[0][0], m[1][1]), q.mul(m[0][1], m[1][0])), k = q.c(det.re / (det.re ** 2 + det.im ** 2), -det.im / (det.re ** 2 + det.im ** 2));
    return [[q.mul(m[1][1], k), q.mul(q.scale(m[0][1], -1), k)], [q.mul(q.scale(m[1][0], -1), k), q.mul(m[0][0], k)]];
  };
  for (const [u, v] of pairs.slice(0, 200)) {
    if (norm(u) > 0.97 || norm(v) > 0.97) continue; // full rank, so the polar factor below exists
    const rho = d.rhoOf(u), sigma = d.rhoOf(v), f = d.fidelity(u, v);
    const sr = d.sqrtPsd(rho), ss = d.sqrtPsd(sigma);
    // Both are purifications: tracing out the second qubit gives back ρ (resp. σ).
    const psi = purify(sr);
    for (let i = 0; i < 2; i++) for (let k = 0; k < 2; k++) closeC([0, 1].reduce((t, j) => q.add(t, q.mul(psi[2 * i + j], q.conj(psi[2 * k + j]))), q.c(0)), rho[i][k]);
    // Any unitary V on the helper gives another purification of σ, and its overlap never beats F.
    const V0 = q.matMul(q.RZ(rand() * 6), q.RY(rand() * 6));
    const overlap = (V: q.Matrix) => q.abs(q.inner(psi, purify(mulM(ss, V))));
    assert.ok(overlap(V0) <= f + 1e-9);
    assert.ok(overlap(q.I) <= f + 1e-9);
    // The best V: with A = √ρ √σ = P W (polar form, P = √(√ρ σ √ρ)), V = W†. Then tr(A V) = tr P = F.
    const A = mulM(sr, ss), P = d.sqrtPsd(mulM(mulM(sr, sigma), sr)), W = mulM(inv(P), A);
    closeM(mulM(W, q.dagger(W)), q.I, 1e-7); // W is unitary
    close(overlap(q.dagger(W)), f, 1e-7);
  }
});

// ---- Measuring: Born rule and the best guess

test('"+" and "−" along an axis sum to 1, and the "+" chance matches tr(Eρ) with E = |m⟩⟨m|', () => {
  for (const [u] of pairs.slice(0, 300)) {
    const mu = rand() * 360;
    close(d.plusChance(u, mu) + d.plusChance(u, mu + 180), 1);
    const m = d.axisVec(mu), e = d.plusProjector(m);
    close(d.chanceOf(e, d.rhoOf(u)), d.plusChance(u, mu));
    closeM(q.matMul(e, e), e); // a projector
    assert.ok(d.plusChance(u, mu) >= 0 && d.plusChance(u, mu) <= 1);
  }
});

test('T is the largest gap in the odds of an outcome: the best axis reaches it, no axis beats it', () => {
  for (const [u, v] of pairs.slice(0, 300)) {
    const flat = (w: d.Vec3): d.Vec3 => [w[0], 0, w[2]]; // the tool's plane
    const a = flat(u), b = flat(v), t = d.traceDistance(a, b), best = d.bestAxis(a, b);
    close(d.gap(a, b, best), t);
    assert.ok(d.saysAOnPlus(a, b, best));
    for (let mu = 0; mu < 360; mu += 5) assert.ok(d.gap(a, b, mu) <= t + 1e-9);
    // The best axis points along r − s.
    const dx = a[0] - b[0], dz = a[2] - b[2];
    if (Math.hypot(dx, dz) > 1e-6) {
      const m = d.axisVec(best);
      close(m[0] * Math.hypot(dx, dz), dx, 1e-9); close(m[2] * Math.hypot(dx, dz), dz, 1e-9);
    }
  }
  // Same states: any axis, 0 is chosen.
  assert.equal(d.bestAxis([0, 0, 1], [0, 0, 1]), 0);
  assert.equal(d.bestAxis([0, 0, 0], [0, 0, 0]), 0);
});

test('Helstrom: with A and B equally likely the best guess is ½ + ½T, from the definition and from tr(E(ρ − σ))', () => {
  for (const [u, v] of pairs.slice(0, 200)) {
    const a: d.Vec3 = [u[0], 0, u[2]], b: d.Vec3 = [v[0], 0, v[2]];
    const t = d.traceDistance(a, b), mu = d.bestAxis(a, b);
    // Right when A is sent (half the time) and gives "+", or B is sent and gives "−".
    const byHand = 0.5 * d.plusChance(a, mu) + 0.5 * (1 - d.plusChance(b, mu));
    close(byHand, d.bestGuess(t));
    close(d.guessChance(a, b, mu), d.bestGuess(t));
    // tr(E(ρ − σ)) for E the projector on the + side of ρ − σ equals T.
    const e = d.plusProjector(d.axisVec(mu));
    close(d.chanceOf(e, d.rhoOf(a)) - d.chanceOf(e, d.rhoOf(b)), t);
    // And for any other axis the guess is no better.
    const other = rand() * 360;
    assert.ok(d.guessChance(a, b, other) <= d.bestGuess(t) + 1e-9);
  }
  // |0⟩ vs |+⟩: about 85%. Pure states: ½(1 + √(1 − c²)) with overlap c = 1/√2.
  const u = d.vecOf(d.START.a), v = d.vecOf(d.START.b);
  close(d.bestGuess(d.traceDistance(u, v)), 0.5 * (1 + Math.sqrt(1 - 0.5)));
  // |0⟩ vs |1⟩: a measurement along z tells them apart every time. The same state twice: a coin flip.
  close(d.guessChance([0, 0, 1], [0, 0, -1], 0), 1);
  close(d.guessChance([0, 0, 1], [0, 0, 1], 33), 0.5);
});

test('readout: an own axis rounded from a non-integer best axis that matches T to 3 decimals', () => {
  const a: d.St = { angle: 0, len: 100 }, b: d.St = { angle: 101, len: 100 };
  const u = d.vecOf(a), v = d.vecOf(b), best = d.bestAxis(u, v);
  assert.ok(Math.abs(best - Math.round(best)) > 0.01);
  const own = Math.round(best);
  assert.ok(d.gap(u, v, own) < d.traceDistance(u, v));
  assert.equal(d.num(d.gap(u, v, own)), d.num(d.traceDistance(u, v)));
  const s = d.describe(a, b, own, false);
  assert.match(s, /That matches T to 3 decimals\. Say A on \+: right with chance/);
  assert.ok(!/below T/.test(s));
  // A clearly worse axis still says "below T".
  assert.match(d.describe(a, b, own + 60, false), /That is below T/);
});

test('no 3D axis and no random 0 ≤ E ≤ I gives tr[E(ρ − σ)] above T', () => {
  for (const [u, v] of pairs.slice(0, 300)) {
    const t = d.traceDistance(u, v), rho = d.rhoOf(u), sigma = d.rhoOf(v);
    // Random 3D unit axes: the projector ½(I + m·σ).
    for (let k = 0; k < 10; k++) {
      const m = randomVec(true);
      assert.ok(d.chanceOf(d.rhoOf(m), rho) - d.chanceOf(d.rhoOf(m), sigma) <= t + 1e-9);
    }
    // Random effects E = U diag(e1, e2) U† with e1, e2 in [0, 1].
    for (let k = 0; k < 10; k++) {
      const U = q.matMul(q.RX(rand() * 6), q.matMul(q.RZ(rand() * 6), q.RY(rand() * 6)));
      const D: q.Matrix = [[q.c(rand()), q.c(0)], [q.c(0), q.c(rand())]];
      const E = q.matMul(U, q.matMul(D, q.dagger(U)));
      assert.ok(d.chanceOf(E, rho) - d.chanceOf(E, sigma) <= t + 1e-9);
    }
  }
});

test('measuring along z gives the Born odds: |0⟩ always 0, |+⟩ half and half', () => {
  close(d.plusChance([0, 0, 1], 0), 1);
  close(d.plusChance([1, 0, 0], 0), 0.5);
  close(d.plusChance([1, 0, 0], 90), 1);
  close(d.plusChance([0, 0, 0], 123), 0.5);
});

// ---- Shots

test('shots: each copy gives "+" with the Born chance (seeded draws), and the draws stay fixed while p moves', () => {
  const r = q.rng(5), N = 40000, us = Array.from({ length: N }, () => r());
  for (const p of [0, 0.15, 0.5, 0.854, 1]) {
    const k = d.results(us, p).filter(Boolean).length / N;
    assert.ok(Math.abs(k - p) < 0.01, `${k} vs ${p}`);
  }
  // Raising p only flips copies from "−" to "+", never back.
  const small = d.results(us.slice(0, 500), 0.3), big = d.results(us.slice(0, 500), 0.6);
  small.forEach((plus, i) => { if (plus) assert.ok(big[i]); });
  // A chance of 0 gives no "+", a chance of 1 gives only "+".
  assert.ok(d.results(us.slice(0, 500), 0).every((x) => !x));
  assert.ok(d.results(us.slice(0, 500), 1).every(Boolean));
});

test('countRight: a "+" from A and a "−" from B are right when the rule is A on "+"', () => {
  const n = d.SHOTS;
  assert.equal(d.countRight(Array(n).fill(true), Array(n).fill(false), true), 2 * n);
  assert.equal(d.countRight(Array(n).fill(true), Array(n).fill(false), false), 0);
  assert.equal(d.countRight(Array(n).fill(false), Array(n).fill(true), false), 2 * n);
  assert.equal(d.countRight([true, false, true], [true, true, false], true), 2 + 1);
});

test('the expected number of right guesses over a batch is 2·SHOTS·(½ + ½·gap), with fixed uniform grids', () => {
  // Evenly spaced draws give exact counts, so no luck is involved.
  const us = Array.from({ length: d.SHOTS }, (_, i) => (i + 0.5) / d.SHOTS);
  const u = d.vecOf(d.START.a), v = d.vecOf(d.START.b), mu = d.bestAxis(u, v);
  const right = d.countRight(d.results(us, d.plusChance(u, mu)), d.results(us, d.plusChance(v, mu)), d.saysAOnPlus(u, v, mu));
  assert.ok(Math.abs(right / (2 * d.SHOTS) - d.guessChance(u, v, mu)) <= 1 / d.SHOTS);
});

// ---- Words

test('numbers are never rounded to a false 0 or 1, and chances never to a false 0% or 100%', () => {
  assert.equal(d.num(1), '1'); assert.equal(d.num(0), '0');
  assert.equal(d.num(0.9996), '>0.999'); assert.equal(d.num(0.0004), '<0.001');
  assert.equal(d.num(Math.SQRT1_2), '0.707');
  assert.equal(d.pct(0.5), '50%'); assert.equal(d.pct(0.9996), '>99.9%'); assert.equal(d.pct(0.0003), '<0.1%');
});

test('names say what A and B started as', () => {
  assert.equal(d.nameOf({ angle: 0, len: 100 }), '|0⟩');
  assert.equal(d.nameOf({ angle: 90, len: 100 }), '|+⟩');
  assert.equal(d.nameOf({ angle: 180, len: 100 }), '|1⟩');
  assert.equal(d.nameOf({ angle: 270, len: 100 }), '|−⟩');
  assert.match(d.nameOf({ angle: 33, len: 100 }), /pure state at 33°/);
  assert.match(d.nameOf({ angle: 33, len: 0 }), /center/);
  assert.match(d.nameOf({ angle: 33, len: 50 }), /mix at 33°, length 50%/);
});

test('readout: names the start states, gives T and F, and agrees with the numbers', () => {
  const [a, b] = [d.START.a, d.START.b], u = d.vecOf(a), v = d.vecOf(b), mu = d.bestAxis(u, v);
  const s = d.describe(a, b, mu, true, 86);
  assert.match(s, /A started as \|0⟩, B as \|\+⟩\./);
  assert.match(s, /T = 0\.707/); assert.match(s, /F = 0\.707/);
  assert.match(s, /best axis \(315°\)/);
  assert.match(s, /A gives \+ with chance 85% and B with chance 15%/);
  assert.match(s, /right with chance 85%/);
  assert.match(s, /86 guesses were right/);
  assert.match(s, /Both are pure/);
  // Another axis: the gap is smaller and the readout says the best axis does better.
  const z = d.describe(a, b, 0, false);
  assert.match(z, /your axis \(0°\)/); assert.match(z, /a gap of 0\.5\d*\. That is below T/); assert.match(z, /right with chance 75%/);
  // The same state twice.
  assert.match(d.describe(a, a, 0, true), /same state/);
  assert.match(d.describe({ angle: 0, len: 0 }, { angle: 99, len: 0 }, 0, true), /same state/);
  // A mix: the range is named.
  assert.match(d.describe(d.PRESETS[3].a, d.PRESETS[3].b, 0, true), /between 0\.293 and 0\.707/);
  // No em or en dashes anywhere in the words.
  for (const p of d.PRESETS) for (const mu2 of [0, 50]) {
    const text = d.describe(p.a, p.b, mu2, mu2 === 0) + p.name + d.nameOf(p.a) + d.nameOf(p.b) + d.angleText(30) + d.lenText(40);
    assert.ok(!/[\u2013\u2014]/.test(text));
  }
});

test('every preset is a valid state pair on the slider grids', () => {
  for (const p of d.PRESETS) for (const s of [p.a, p.b]) {
    assert.ok(Number.isInteger(s.angle) && s.angle >= d.ANGLE.min && s.angle <= d.ANGLE.max);
    assert.ok(Number.isInteger(s.len) && s.len >= d.LEN.min && s.len <= d.LEN.max);
    assert.ok(d.rhoOf(d.vecOf(s))[0][0].re >= -1e-12 && d.rhoOf(d.vecOf(s))[1][1].re >= -1e-12);
  }
  assert.equal(d.wrap(-30), 330); assert.equal(d.wrap(360), 0);
});
