import test from 'node:test';
import assert from 'node:assert/strict';
import * as q from '../quantum.ts';
import * as sd from './state-discrimination.ts';

const close = (a: number, x: number, eps = 1e-12) => assert.ok(Math.abs(a - x) < eps, `${a} != ${x}`);
const RAD = Math.PI / 180;
const S2 = Math.SQRT1_2;
const GAMMAS = Array.from({ length: 91 }, (_, g) => g); // every slider value
const INNER = GAMMAS.filter((g) => g > 0 && g < 90);
const PRIORS = [0, 0.1, 0.25, 0.5, 0.6, 0.9, 1];
const sum = (xs: number[]) => xs.reduce((t, x) => t + x, 0);

/** Every part is Hermitian with eigenvalues in [0, 1], and the parts sum to I: a valid measurement (POVM). */
function assertPovm(E: sd.Povm) {
  for (const e of E) {
    close(e[0][1].re, e[1][0].re); close(e[0][1].im, -e[1][0].im);
    close(e[0][0].im, 0); close(e[1][1].im, 0);
    const { hi, lo } = sd.eig2(e);
    assert.ok(lo > -1e-12 && hi < 1 + 1e-12, `eigenvalues ${lo}, ${hi}`);
  }
  for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) {
    close(E[0][i][j].re + E[1][i][j].re + E[2][i][j].re, i === j ? 1 : 0);
    close(E[0][i][j].im + E[1][i][j].im + E[2][i][j].im, 0);
  }
}

/** e equals w |v><v| for a unit vector v at angle deg in the picture. */
function assertAlong(e: q.Matrix, deg: number, w: number) {
  const want = sd.proj(sd.ray(deg), w);
  for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) { close(e[i][j].re, want[i][j].re); close(e[i][j].im, want[i][j].im); }
}

// ---- The two states

test('the pair is |0> and cos γ|0> + sin γ|1>: unit vectors with overlap cos γ', () => {
  for (const g of GAMMAS) {
    const [a, b] = sd.pair(g);
    close(q.norm2(a), 1); close(q.norm2(b), 1);
    close(sd.overlap(g), Math.cos(g * RAD));
  }
  assert.equal(sd.overlap(0), 1);
  assert.equal(sd.overlap(90), 0);
  close(sd.overlap(45), S2);
  close(sd.overlap(60), 0.5);
});

test('45 degrees is the pair |0> and |+>; 90 degrees is |0> and |1>', () => {
  const [, b45] = sd.pair(45), [, b90] = sd.pair(90);
  close(q.abs(q.inner(b45, q.plus())), 1);
  close(q.abs(q.inner(b90, q.ket1())), 1);
});

test('the picture is RY applied to |0>: the arrow at angle a is RY(2a)|0>, Bloch vector (sin 2a, 0, cos 2a)', () => {
  for (const a of [-90, -45, -10, 0, 22.5, 45, 70, 90]) {
    const v = sd.ray(a), w = q.matVec(q.RY(2 * a * RAD), q.ket0());
    close(v[0].re, w[0].re); close(v[1].re, w[1].re);
    const [x, y, z] = q.bloch(v);
    close(x, Math.sin(2 * a * RAD)); close(y, 0); close(z, Math.cos(2 * a * RAD));
  }
});

test('gates keep the overlap: a unitary on both states leaves |<a|b>| the same', () => {
  // A random qubit pair, turned by a random unitary, keeps |<a|b>|: unitaries keep inner products.
  const R = q.rng(11);
  for (let k = 0; k < 20; k++) {
    const a = q.normalize([q.c(R() - 0.5, R() - 0.5), q.c(R() - 0.5, R() - 0.5)]);
    const b = q.normalize([q.c(R() - 0.5, R() - 0.5), q.c(R() - 0.5, R() - 0.5)]);
    const U = q.matMul(q.matMul(q.RZ(R() * 6), q.RY(R() * 6)), q.RX(R() * 6));
    close(q.abs(q.inner(q.matVec(U, a), q.matVec(U, b))), q.abs(q.inner(a, b)));
  }
});

test('trace distance of two pure states is √(1 − c²): ½ the sum of |eigenvalues| of ρ0 − ρ1', () => {
  for (const g of GAMMAS) {
    const { hi, lo } = sd.eig2(sd.gammaOp(g, 0.5));
    // gammaOp at p0 = ½ is ½(ρ0 − ρ1), so its trace norm is the trace distance.
    close(Math.abs(hi) + Math.abs(lo), sd.traceDistance(sd.overlap(g)));
    close(sd.traceDistance(sd.overlap(g)), Math.sin(g * RAD));
  }
});

// ---- Every measurement is a valid POVM

test('all three strategies are valid measurements at every slider angle', () => {
  for (const g of GAMMAS) for (const s of sd.STRATEGIES) assertPovm(sd.povm(s, g));
  for (const g of GAMMAS) for (const p of PRIORS) assertPovm(sd.best(g, p));
});

test('Born rule: for every sent state the three chances add to 1', () => {
  for (const g of GAMMAS) for (const s of sd.STRATEGIES) for (const row of sd.table(s, g)) {
    close(sum(row), 1);
    row.forEach((p) => assert.ok(p >= 0 && p <= 1));
  }
  for (const g of GAMMAS) for (const s of sd.STRATEGIES) {
    const o = sd.rates(s, g);
    close(o.right + o.wrong + o.unsure, 1);
  }
});

test('the parts of each measurement point where the picture draws them', () => {
  for (const g of GAMMAS) for (const s of sd.STRATEGIES) {
    const E = sd.povm(s, g), ps = sd.parts(s, g);
    for (const { said, deg } of ps) {
      const w = s === 'sure' && said < 2 ? 1 / (1 + sd.overlap(g)) : s === 'sure' ? (2 * sd.overlap(g)) / (1 + sd.overlap(g)) : 1;
      assertAlong(E[said], deg, w);
    }
    // Parts left out of the picture are zero.
    for (const k of [0, 1, 2] as const) if (!ps.some((p) => p.said === k)) E[k].flat().forEach((x) => { close(x.re, 0); close(x.im, 0); });
  }
});

// ---- Best guess (Helstrom)

test('Helstrom: the measurement reaches ½(1 + √(1 − 4 p0 p1 c²)) = ½ + ½‖p0ρ0 − p1ρ1‖₁', () => {
  for (const g of GAMMAS) for (const p of PRIORS) {
    const o = sd.odds(sd.best(g, p), g, p), k = sd.overlap(g);
    close(o.right, sd.bestRight(k, p), 1e-12);
    close(o.right, sd.bestRightTrace(g, p), 1e-12);
    close(o.unsure, 0);
  }
});

test('Helstrom with equal priors: ½(1 + sin γ), known values', () => {
  for (const g of GAMMAS) close(sd.rates('best', g).right, 0.5 * (1 + Math.sin(g * RAD)));
  close(sd.rates('best', 0).right, 0.5);
  close(sd.rates('best', 30).right, 0.75);
  close(sd.rates('best', 45).right, (2 + Math.SQRT2) / 4); // |0> vs |+>: about 85.4%
  assert.equal(sd.rates('best', 90).right, 1);
});

test('Helstrom is perfect only for orthogonal states (or a prior of 0 or 1)', () => {
  for (const g of GAMMAS) for (const p of PRIORS) {
    const perfect = sd.bestRight(sd.overlap(g), p) === 1;
    assert.equal(perfect, g === 90 || p === 0 || p === 1, `γ ${g}, p0 ${p}`);
  }
});

test('equal priors: the best basis sits at γ/2 − 45° and γ/2 + 45°, evenly around the states', () => {
  for (const g of INNER) close(sd.bestAngle(g), g / 2 - 45, 1e-9);
  close(sd.bestAngle(0), -45); // every measurement ties here; the picture uses the limit
  close(sd.bestAngle(90), 0, 1e-9);
  // Evenly around: the angle from ψ0 to "say ψ0" equals the angle from ψ1 to "say ψ1".
  for (const g of INNER) close(0 - sd.bestAngle(g), sd.bestAngle(g) + 90 - g, 1e-9);
});

test('a basis at angle t is right ½ − ½ sin γ sin(2t − γ): Born rule matches, and the best basis is the top', () => {
  for (const g of [0, 10, 30, 45, 60, 89, 90]) for (let t = -90; t <= 90; t += 5) {
    const E: sd.Povm = [sd.proj(sd.ray(t)), sd.proj(sd.ray(t + 90)), [[q.c(0), q.c(0)], [q.c(0), q.c(0)]]];
    const right = sd.odds(E, g).right;
    close(right, sd.basisRight(g, t));
    // sin(2t − γ) ≥ −1, so no basis beats ½(1 + sin γ), and t = γ/2 − 45° reaches it.
    assert.ok(right <= sd.rates('best', g).right + 1e-12);
  }
  for (const g of GAMMAS) close(sd.basisRight(g, g / 2 - 45), sd.rates('best', g).right);
});

test('no two-outcome measurement, projective or not, beats Helstrom (random POVMs)', () => {
  // A general two-outcome qubit POVM: E0 = V diag(x, y) V†, any unitary V and 0 ≤ x, y ≤ 1; E1 = I − E0.
  const R = q.rng(5);
  for (let k = 0; k < 200; k++) {
    const V = q.matMul(q.matMul(q.RZ(R() * 6.3), q.RY(R() * 6.3)), q.RZ(R() * 6.3));
    const D: q.Matrix = [[q.c(R()), q.c(0)], [q.c(0), q.c(R())]];
    const E0 = q.matMul(q.matMul(V, D), q.dagger(V));
    const E1 = E0.map((r, i) => r.map((x, j) => q.sub(i === j ? q.c(1) : q.c(0), x)));
    const zero: q.Matrix = [[q.c(0), q.c(0)], [q.c(0), q.c(0)]];
    const g = Math.floor(R() * 91), p = R();
    assert.ok(sd.odds([E0, E1, zero], g, p).right <= sd.bestRight(sd.overlap(g), p) + 1e-12);
  }
});

test('unequal priors tilt the best basis toward the likelier state', () => {
  // More ψ0 means "say ψ0" moves toward ψ0 (angle 0): γ/2 − 45° < angle ≤ 0.
  for (const g of INNER) {
    const t = sd.bestAngle(g, 0.8);
    assert.ok(t > g / 2 - 45 && t <= 1e-9, `γ ${g}: ${t}`);
  }
  // A prior of 1 means always say ψ0, which is always right.
  for (const g of GAMMAS) assert.equal(sd.odds(sd.best(g, 1), g, 1).right, 1);
});

test('the circuit: RY(90° − γ) takes the best basis to |0> and |1>, so its standard measurement has the same odds', () => {
  for (const g of GAMMAS) {
    const U = sd.ry(sd.bestGate(g)), t = sd.bestAngle(g);
    close(q.abs(q.inner(q.ket0(), q.matVec(U, sd.ray(t)))), 1);
    close(q.abs(q.inner(q.ket1(), q.matVec(U, sd.ray(t + 90)))), 1);
    const [a, b] = sd.pair(g), tb = sd.table('best', g);
    close(q.probs(q.matVec(U, a))[0], tb[0][0]);
    close(q.probs(q.matVec(U, b))[1], tb[1][1]);
  }
  assert.equal(sd.bestGate(90), 0);
  assert.equal(sd.bestGate(45), 45);
});

// ---- Never wrong (unambiguous, IDP)

test('never wrong: ψ0 never gives "say ψ1" and ψ1 never gives "say ψ0"', () => {
  for (const g of GAMMAS) {
    const [t0, t1] = sd.table('sure', g);
    assert.equal(t0[1], 0); assert.equal(t1[0], 0);
    assert.equal(sd.rates('sure', g).wrong, 0);
  }
});

test('IDP limit: names the state with chance 1 − c and says "not sure" with chance c, for each state sent', () => {
  for (const g of GAMMAS) {
    const k = sd.overlap(g), [t0, t1] = sd.table('sure', g);
    close(t0[0], 1 - k); close(t1[1], 1 - k);
    close(t0[2], k); close(t1[2], k);
    close(sd.rates('sure', g).right, sd.sureRight(k));
  }
  close(sd.rates('sure', 45).right, 1 - S2); // |0> vs |+>: about 29.3%, as in N&C 2.2.6
  close(sd.rates('sure', 60).unsure, 0.5);
  assert.equal(sd.rates('sure', 0).right, 0);
  assert.equal(sd.rates('sure', 90).right, 1);
});

test('the N&C example: for |0> and |+>, our "say ψ1" part is √2/(1 + √2) |1><1|', () => {
  const E = sd.sure(45), w = Math.SQRT2 / (1 + Math.SQRT2);
  assertAlong(E[1], 90, w);
  assertAlong(E[0], -45, w); // along (|0> − |1>)/√2
});

test('no never-wrong measurement does better: weights above 1/(1 + c) make "not sure" negative', () => {
  // In 2D, never wrong forces E0 = a0|ψ1⊥><ψ1⊥| and E1 = a1|ψ0⊥><ψ0⊥|. "Not sure" = I − E0 − E1 ≥ 0
  // holds iff a0, a1 ≤ 1 and det = 1 − a0 − a1 + a0 a1 (1 − c²) ≥ 0. Its boundary meets the line a0 = a1 at 1/(1 + c),
  // and the feasible set is convex and symmetric, so a0 + a1 ≤ 2/(1 + c): the success ½(a0 + a1)(1 − c²) ≤ 1 − c.
  for (const g of INNER) {
    const k = sd.overlap(g), a = 1 / (1 + k), det = (a0: number, a1: number) => 1 - a0 - a1 + a0 * a1 * (1 - k * k);
    close(det(a, a), 0);
    const eps = 1e-6;
    assert.ok(det(a + eps, a + eps) < 0, 'just past the limit is not a measurement');
    const ok = (a0: number, a1: number) => {
      const E0 = sd.proj(sd.ray(g - 90), a0), E1 = sd.proj(sd.ray(90), a1);
      const rest = q.I.map((r, i) => r.map((x, j) => q.sub(q.sub(x, E0[i][j]), E1[i][j])));
      return sd.eig2(rest).lo >= -1e-12;
    };
    assert.ok(ok(a, a)); assert.ok(!ok(a + eps, a + eps));
    close(0.5 * 2 * a * (1 - k * k), 1 - k);
  }
});

test('never wrong never beats the best guess: 1 − c ≤ ½(1 + √(1 − c²)), equal only at c = 0', () => {
  for (const g of GAMMAS) {
    const k = sd.overlap(g), gap = sd.bestRight(k) - sd.sureRight(k);
    assert.ok(gap >= 0);
    if (g < 90) assert.ok(gap > 0);
  }
});

// ---- Plain 0 or 1

test('plain 0 or 1: ψ0 is always right, ψ1 is right with chance sin²γ, so ½(1 + sin²γ) in all', () => {
  for (const g of GAMMAS) {
    const [t0, t1] = sd.table('plain', g);
    assert.equal(t0[0], 1);
    close(t1[1], Math.sin(g * RAD) ** 2);
    assert.equal(t1[2], 0);
    close(sd.rates('plain', g).right, sd.plainRight(g));
  }
  close(sd.rates('plain', 45).right, 0.75);
  close(sd.rates('plain', 30).right, 0.625);
});

test('plain is never better than the best guess, and equal only at 0° and 90°', () => {
  for (const g of GAMMAS) {
    const gap = sd.rates('best', g).right - sd.rates('plain', g).right;
    assert.ok(gap >= -1e-15);
    assert.equal(gap > 1e-12, g > 0 && g < 90);
  }
});

// ---- Symmetry

test('equal priors: best and never-wrong treat the two states the same', () => {
  for (const g of GAMMAS) for (const s of ['best', 'sure'] as const) {
    const [t0, t1] = sd.table(s, g);
    close(t0[0], t1[1]); close(t0[1], t1[0]); close(t0[2], t1[2]);
  }
});

test('swapping the priors gives the same Helstrom odds, from the matrices: ‖p0ρ0 − p1ρ1‖₁ = ‖p1ρ0 − p0ρ1‖₁', () => {
  // Reflecting the picture across γ/2 swaps ρ0 and ρ1 and keeps trace norms, so only the overlap and the priors count.
  for (const g of GAMMAS) for (const p of PRIORS) close(sd.bestRightTrace(g, p), sd.bestRightTrace(g, 1 - p));
});

// ---- Shots

test('a batch sends exactly half of each state, each shot with its own draw', () => {
  const shots = sd.batch(q.rng(3));
  assert.equal(shots.length, sd.BATCH);
  assert.equal(shots.filter((s) => s.sent === 0).length, sd.EACH);
  assert.equal(shots.filter((s) => s.sent === 1).length, sd.EACH);
  shots.forEach((s) => assert.ok(s.u >= 0 && s.u < 1));
});

test('a shot is a Born-rule draw: u falls into the stacked chances in order', () => {
  const p: [number, number, number] = [0.2, 0.3, 0.5];
  assert.equal(sd.say(p, 0), 0); assert.equal(sd.say(p, 0.19), 0);
  assert.equal(sd.say(p, 0.21), 1); assert.equal(sd.say(p, 0.49), 1);
  assert.equal(sd.say(p, 0.51), 2); assert.equal(sd.say(p, 0.999), 2);
  assert.equal(sd.say([1, 0, 0], 0.999), 0);
  assert.equal(sd.say([0, 1, 0], 0), 1);
});

test('tally: never-wrong batches have no wrong dots; counts add up; a 0% cell stays empty', () => {
  const shots = sd.batch(q.rng(9));
  for (const g of [0, 20, 45, 89, 90]) for (const s of sd.STRATEGIES) {
    const n = sd.tally(shots, sd.table(s, g)), tot = sd.totals(n);
    assert.equal(tot.right + tot.wrong + tot.unsure, sd.BATCH);
    assert.equal(sum(n[0]), sd.EACH); assert.equal(sum(n[1]), sd.EACH);
    if (s === 'sure') assert.equal(tot.wrong, 0);
    if (s !== 'sure') assert.equal(tot.unsure, 0);
    if (s === 'plain') assert.equal(n[0][1], 0);
  }
  const n90 = sd.tally(shots, sd.table('best', 90));
  assert.deepEqual(n90, [[sd.EACH, 0, 0], [0, sd.EACH, 0]]);
  const n0 = sd.tally(shots, sd.table('sure', 0));
  assert.deepEqual(n0, [[0, 0, sd.EACH], [0, 0, sd.EACH]]);
});

test('tally counts only the first n shots, for the reveal', () => {
  const shots = sd.batch(q.rng(4)), t = sd.table('best', 30);
  assert.equal(sum(sd.tally(shots, t, 0).flat()), 0);
  assert.equal(sum(sd.tally(shots, t, 37).flat()), 37);
  assert.equal(sum(sd.tally(shots, t, 10_000).flat()), sd.BATCH);
});

test('kind(): diagonal cells are right, off-diagonal wrong, the third column not sure', () => {
  assert.equal(sd.kind(0, 0), 'right'); assert.equal(sd.kind(1, 1), 'right');
  assert.equal(sd.kind(0, 1), 'wrong'); assert.equal(sd.kind(1, 0), 'wrong');
  assert.equal(sd.kind(0, 2), 'unsure'); assert.equal(sd.kind(1, 2), 'unsure');
});

// ---- Layout and words

test('grid() fits n dots in the box', () => {
  for (const [w, h] of [[57, 129], [140, 149], [30, 300], [300, 20], [1, 1]]) for (const n of [1, 50, 200]) {
    const g = sd.grid(w, h, n);
    assert.ok(g.cols * g.rows >= n);
    assert.ok(g.cols * g.pitch <= w + 1e-9 && g.rows * g.pitch <= h + 1e-9);
    assert.ok(g.pitch <= 9);
  }
});

test('split() gives two percents that add to 100 and never a false 0% or 100%', () => {
  for (let i = 0; i <= 2000; i++) {
    const p = i / 2000, [a, b] = sd.split(p);
    if (p > 0 && p < 1) { assert.notEqual(a, '0%'); assert.notEqual(a, '100%'); assert.notEqual(b, '0%'); assert.notEqual(b, '100%'); }
    if (!a.includes('<') && !a.includes('>')) close(parseFloat(a) + parseFloat(b), 100, 1e-9);
  }
  assert.deepEqual(sd.split(0.625), ['63%', '37%']);
  assert.deepEqual(sd.split(1), ['100%', '0%']);
  assert.deepEqual(sd.split(0.99992), ['>99.9%', '<0.1%']);
  assert.deepEqual(sd.split(0.995), ['99.5%', '0.5%']);
});

test('oddsText(): the three percents add to 100, with an exact 0% for the impossible outcome', () => {
  for (const g of GAMMAS) for (const s of sd.STRATEGIES) {
    const t = sd.oddsText(sd.rates(s, g));
    if (s === 'sure') assert.equal(t.wrong, '0%');
    else assert.equal(t.unsure, '0%');
    const nums = [t.right, t.wrong, t.unsure];
    if (nums.every((x) => !/[<>]/.test(x))) close(sum(nums.map(parseFloat)), 100, 1e-9);
  }
  assert.deepEqual(sd.oddsText(sd.rates('best', 45)), { right: '85%', wrong: '15%', unsure: '0%' });
  assert.deepEqual(sd.oddsText(sd.rates('sure', 45)), { right: '29%', wrong: '0%', unsure: '71%' });
  assert.deepEqual(sd.oddsText(sd.rates('plain', 45)), { right: '75%', wrong: '25%', unsure: '0%' });
});

test('words name both start states and match the numbers', () => {
  assert.equal(sd.psi1Text(0), '|0⟩');
  assert.equal(sd.psi1Text(90), '|1⟩');
  assert.equal(sd.psi1Text(45), '0.71|0⟩ + 0.71|1⟩, which is |+⟩');
  assert.equal(sd.psi1Text(30), '0.87|0⟩ + 0.50|1⟩');
  assert.equal(sd.psi1Text(1), '0.9998|0⟩ + 0.02|1⟩');
  // Overlap text never shows a false 1 or 0 for states that differ or overlap.
  for (const g of INNER) { const t = sd.num(sd.overlap(g)); assert.ok(t !== '1' && t !== '1.00' && t !== '0' && t !== '0.00', `${g}: ${t}`); }
  for (const g of [0, 1, 30, 45, 89, 90]) for (const s of sd.STRATEGIES) for (const counts of [null, [[1, 2, 3], [4, 5, 6]]]) {
    const t = sd.describe(s, g, counts);
    assert.ok(t.startsWith('Each shot started as |ψ₀⟩ = |0⟩ or |ψ₁⟩ = '), t);
    assert.ok(!t.includes('—'), 'no em dash');
    assert.ok(t.includes(`${g}° apart`));
  }
  assert.ok(sd.describe('best', 45, null).includes('Right 85%, wrong 15%'));
  assert.ok(sd.describe('sure', 45, null).includes('names the state 29% of the time and says “not sure” 71%'));
  assert.ok(sd.describe('plain', 45, null).includes('The best guess is right 85%'));
  assert.ok(sd.describe('best', 30, [[150, 50, 0], [48, 152, 0]]).endsWith('This batch of 400 shots: 302 right, 98 wrong, 0 not sure.'));
  for (const s of sd.STRATEGIES) for (const g of GAMMAS) assert.ok(!sd.recipeText(s, g).includes('—'));
  assert.ok(sd.recipeText('best', 45).includes('RY(45°)'));
  assert.ok(sd.recipeText('best', 90).includes('no gate'));
  assert.equal(sd.valueText(60), '60 degrees, overlap 0.50');
  assert.equal(sd.valueText(1), '1 degree, overlap 0.9998');
  assert.equal(sd.valueText(90), '90 degrees, overlap 0');
  assert.ok(sd.recipeText('best', 0).includes('every measurement does equally well'));
});

// ---- Requested checks: many batches, and the never-wrong measurement as a circuit

test('many batches: the share of each cell matches the Born-rule table within 5 standard errors', () => {
  const R = q.rng(21), B = 50, N = B * sd.EACH; // shots of each state
  for (const s of sd.STRATEGIES) for (const g of [0, 20, 45, 70, 90]) {
    const t = sd.table(s, g), n = [[0, 0, 0], [0, 0, 0]];
    for (let b = 0; b < B; b++) {
      const k = sd.tally(sd.batch(R), t);
      for (let i = 0; i < 2; i++) for (let j = 0; j < 3; j++) n[i][j] += k[i][j];
    }
    for (let i = 0; i < 2; i++) for (let j = 0; j < 3; j++) {
      const p = t[i][j], se = Math.sqrt((p * (1 - p)) / N);
      if (p === 0 || p === 1) assert.equal(n[i][j], p * N, `${s} ${g}: a ${p} cell must be exact`);
      else assert.ok(Math.abs(n[i][j] / N - p) <= 5 * se, `${s} ${g} [${i}][${j}]: ${n[i][j] / N} vs ${p}`);
    }
  }
});

test('the never-wrong measurement as a circuit: a 4x4 unitary on |ψ>|0>, then a measurement of both qubits', () => {
  for (const g of GAMMAS) {
    const U = sd.dilation(g);
    // Unitary: U†U = I.
    const UU = q.matMul(q.dagger(U), U);
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { close(UU[i][j].re, i === j ? 1 : 0, 1e-9); close(UU[i][j].im, 0, 1e-9); }
    // |00>, |01>, |10> give say ψ0, say ψ1, not sure with the POVM's chances; |11> never comes up.
    const [a, b] = sd.pair(g), t = sd.table('sure', g);
    for (const [s, row] of [[a, t[0]], [b, t[1]]] as const) {
      const p = q.probs(q.matVec(U, q.tensor(s, q.ket0())));
      close(p[0], row[0], 1e-9); close(p[1], row[1], 1e-9); close(p[2], row[2], 1e-9); close(p[3], 0, 1e-9);
    }
  }
  // |0> vs |+>: the circuit names |+> with chance 1 − 1/√2 and never calls it |0>.
  const p = q.probs(q.matVec(sd.dilation(45), q.tensor(q.plus(), q.ket0())));
  close(p[1], 1 - S2, 1e-9); close(p[0], 0, 1e-12);
});
