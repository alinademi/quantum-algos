import test from 'node:test';
import assert from 'node:assert/strict';
import * as q from '../quantum.ts';
import * as d from './density-matrix.ts';

const close = (a: number, x: number, eps = 1e-12) => assert.ok(Math.abs(a - x) < eps, `${a} != ${x}`);
const closeVec = (a: readonly number[], x: readonly number[], eps = 1e-12) => a.forEach((v, i) => close(v, x[i], eps));
const closeC = (a: q.C, x: q.C, eps = 1e-12) => { close(a.re, x.re, eps); close(a.im, x.im, eps); };
const closeM = (a: q.Matrix, x: q.Matrix, eps = 1e-12) => a.forEach((row, i) => row.forEach((z, j) => closeC(z, x[i][j], eps)));
const dot = (u: readonly number[], v: readonly number[]) => u.reduce((t, x, i) => t + x * v[i], 0);
const det = (m: q.Matrix) => q.sub(q.mul(m[0][0], m[1][1]), q.mul(m[0][1], m[1][0]));
const half = (re: number, im = 0) => q.c(re / 2, im / 2);

// Whole-degree angles, as the sliders give them.
const grid: d.Angles[] = [];
for (let t = 0; t <= 180; t += 15) for (let p = 0; p < 360; p += 30) grid.push({ theta: t, phi: p });
// Seeded random recipes with whole-degree angles and whole-percent chances.
const rand = q.rng(11);
const whole = (n: number) => Math.floor(rand() * n);
const randomAngles = (): d.Angles => ({ theta: whole(181), phi: whole(360) });
const recipes: d.Recipe[] = Array.from({ length: 1500 }, () => ({ a: randomAngles(), b: randomAngles(), p: whole(101) }));
const randomState = (): q.State => q.normalize([q.c(rand() - 0.5, rand() - 0.5), q.c(rand() - 0.5, rand() - 0.5)]);
const randoms = Array.from({ length: 200 }, randomState);
/** The state orthogonal to s: (−b*, a*). */
const perp = (s: q.State): q.State => [q.scale(q.conj(s[1]), -1), q.conj(s[0])];
const preset = (name: string) => d.RECIPES.find((r) => r.name === name)!;

// ---- Pure states

test('a pure state gives ρ = |ψ⟩⟨ψ|: Hermitian, trace 1, a projector (ρ² = ρ) of rank one (det 0)', () => {
  for (const a of grid) {
    const rho = d.pureRho(a);
    closeM(rho, q.dagger(rho));
    closeC(d.trace(rho), q.c(1));
    closeM(q.matMul(rho, rho), rho);
    closeC(det(rho), q.c(0));
    assert.equal(d.kindOf(rho), 'pure');
  }
});

test('a global phase drops out: e^{iγ}|ψ⟩ gives the same ρ', () => {
  for (const s of randoms) {
    const g = q.expi(rand() * 2 * Math.PI);
    closeM(d.outer(s.map((z) => q.mul(g, z))), d.outer(s));
  }
});

test('the six named states have the density matrices in Watrous\'s table', () => {
  const want: Record<string, q.Matrix> = {
    '|0⟩': [[q.c(1), q.c(0)], [q.c(0), q.c(0)]],
    '|1⟩': [[q.c(0), q.c(0)], [q.c(0), q.c(1)]],
    '|+⟩': [[half(1), half(1)], [half(1), half(1)]],
    '|−⟩': [[half(1), half(-1)], [half(-1), half(1)]],
    '|+i⟩': [[half(1), half(0, -1)], [half(0, 1), half(1)]],
    '|−i⟩': [[half(1), half(0, 1)], [half(0, -1), half(1)]],
  };
  for (const n of d.NAMED) {
    closeM(d.pureRho(n), want[n.name], 1e-15);
    assert.equal(d.nameAt(n), n.name);
  }
});

test('Watrous\'s |v⟩ = ((1 + 2i)/3)|0⟩ − (2/3)|1⟩ gives [[5/9, (−2 − 4i)/9], [(−2 + 4i)/9, 4/9]]', () => {
  const v: q.State = [q.c(1 / 3, 2 / 3), q.c(-2 / 3)];
  closeM(d.outer(v), [[q.c(5 / 9), q.c(-2 / 9, -4 / 9)], [q.c(-2 / 9, 4 / 9), q.c(4 / 9)]], 1e-15);
});

test('ketAt and pointAt agree: the point of each pure state is its Bloch vector, on the unit sphere', () => {
  for (const a of grid) {
    closeVec(d.pointAt(a), q.bloch(d.ketAt(a)));
    closeVec(d.blochOf(d.pureRho(a)), d.pointAt(a));
    close(d.len(d.pointAt(a)), 1);
  }
});

// ---- Mixes

test('half |0⟩, half |+⟩ (the start recipe) gives [[¾, ¼], [¼, ¼]], as in Watrous', () => {
  assert.equal(d.START.name, '|0⟩ or |+⟩');
  closeM(d.rhoOf(d.START), [[q.c(0.75), q.c(0.25)], [q.c(0.25), q.c(0.25)]], 1e-15);
  closeVec(d.blochOf(d.rhoOf(d.START)), [0.5, 0, 0.5]);
});

test('its eigenvalues are cos²(π/8) = (2 + √2)/4 and sin²(π/8) = (2 − √2)/4, with eigenvectors |ψ_{π/8}⟩ and |ψ_{5π/8}⟩', () => {
  const rho = d.rhoOf(d.START), [hi, lo] = d.eigenvalues(rho);
  close(hi, (2 + Math.SQRT2) / 4); close(lo, (2 - Math.SQRT2) / 4);
  close(hi, Math.cos(Math.PI / 8) ** 2); close(lo, Math.sin(Math.PI / 8) ** 2);
  const psi = (t: number): q.State => [q.c(Math.cos(t)), q.c(Math.sin(t))];
  closeM(d.combine([[hi, d.outer(psi(Math.PI / 8))], [lo, d.outer(psi((5 * Math.PI) / 8))]]), rho);
  close(q.abs2(q.inner(psi(Math.PI / 8), psi((5 * Math.PI) / 8))), 0);
});

test('half |0⟩, half |+i⟩ gives [[¾, −i/4], [i/4, ¼]]: a complex entry off the diagonal', () => {
  closeM(d.rhoOf(preset('|0⟩ or |+i⟩')), [[q.c(0.75), q.c(0, -0.25)], [q.c(0, 0.25), q.c(0.25)]], 1e-15);
  closeVec(d.blochOf(d.rhoOf(preset('|0⟩ or |+i⟩'))), [0, 0.5, 0.5]);
});

test('half and half of any two orthogonal states is I/2: |0⟩ and |1⟩, |+⟩ and |−⟩, |+i⟩ and |−i⟩, or any pair', () => {
  const center = q.I.map((row) => row.map((z) => q.scale(z, 0.5)));
  for (const [a, b] of [[0, 1], [2, 3], [4, 5]]) {
    const r: d.Recipe = { a: d.NAMED[a], b: d.NAMED[b], p: 50 };
    closeM(d.rhoOf(r), center, 1e-15);
    assert.equal(d.kindOf(d.rhoOf(r)), 'center');
  }
  for (const s of randoms) closeM(d.combine([[0.5, d.outer(s)], [0.5, d.outer(perp(s))]]), center);
  closeM(d.rhoOf(preset('|0⟩ or |1⟩')), d.rhoOf(preset('|+⟩ or |−⟩')), 1e-15);
});

test('every recipe gives a density matrix: Hermitian, trace 1, eigenvalues in [0, 1] adding to 1, ⟨v|ρ|v⟩ ≥ 0 for every v', () => {
  for (const r of recipes) {
    const rho = d.rhoOf(r), [hi, lo] = d.eigenvalues(rho);
    closeM(rho, q.dagger(rho));
    closeC(d.trace(rho), q.c(1));
    assert.ok(lo > -1e-12 && hi < 1 + 1e-12);
    close(hi + lo, 1);
    closeC(det(rho), q.c(hi * lo));
  }
  for (const r of recipes.slice(0, 200)) for (const v of randoms.slice(0, 20)) assert.ok(d.prob(d.rhoOf(r), v) >= -1e-12);
});

test('ρ = ½(I + xX + yY + zZ) with (x, y, z) = (tr Xρ, tr Yρ, tr Zρ), and ρ₁₀ = (x + iy)/2', () => {
  for (const r of recipes) {
    const rho = d.rhoOf(r), v = d.blochOf(rho);
    closeM(d.fromVec(v), rho);
    closeC(rho[1][0], q.c(v[0] / 2, v[1] / 2));
    close(rho[0][0].re - rho[1][1].re, v[2]);
  }
});

test('mixing averages the points: r = p r_A + (1 − p) r_B, so the point lies on the line from A to B, in the ball', () => {
  for (const r of recipes) {
    const v = d.blochOf(d.rhoOf(r)), A = d.pointAt(r.a), B = d.pointAt(r.b), p = r.p / 100;
    closeVec(v, A.map((x, i) => p * x + (1 - p) * B[i]));
    assert.ok(d.len(v) <= 1 + 1e-12);
  }
});

test('purity tr ρ² = (1 + |r|²)/2 and eigenvalues (1 ± |r|)/2: from 1 and 0 on the surface to ½ and ½ at the center', () => {
  for (const r of recipes) {
    const rho = d.rhoOf(r), L = d.len(d.blochOf(rho)), [hi, lo] = d.eigenvalues(rho);
    close(d.purity(rho), (1 + L * L) / 2);
    close(hi, (1 + L) / 2); close(lo, (1 - L) / 2);
    close(d.purity(rho), hi * hi + lo * lo);
    assert.ok(d.purity(rho) >= 0.5 - 1e-12 && d.purity(rho) <= 1 + 1e-12);
  }
});

test('pure exactly when one state is made every time: chance 0 or 100%, or A and B the same state', () => {
  for (const r of recipes) {
    const rho = d.rhoOf(r), L = d.len(d.blochOf(rho)), one = r.p === 0 || r.p === 100 || d.sameState(r.a, r.b);
    assert.equal(d.kindOf(rho) === 'pure', one, JSON.stringify(r));
    if (one) { close(L, 1); close(d.purity(rho), 1); } else assert.ok(L < 1 && d.purity(rho) < 1);
  }
  // The closest two different states can be at whole degrees, at the smallest chance: still mixed, not pure.
  const near: d.Recipe = { a: { theta: 1, phi: 0 }, b: { theta: 1, phi: 1 }, p: 1 };
  assert.equal(d.kindOf(d.rhoOf(near)), 'mixed');
  // At a pole every phi is the same state.
  assert.equal(d.kindOf(d.rhoOf({ a: { theta: 0, phi: 0 }, b: { theta: 0, phi: 200 }, p: 40 })), 'pure');
  assert.equal(d.kindOf(d.rhoOf({ a: { theta: 180, phi: 10 }, b: { theta: 180, phi: 300 }, p: 40 })), 'pure');
});

test('the center exactly when B is the opposite point of A and the chance is 50%', () => {
  for (const a of grid) {
    const opp = { theta: 180 - a.theta, phi: a.phi + 180 };
    assert.equal(d.kindOf(d.rhoOf({ a, b: opp, p: 50 })), 'center');
    assert.equal(d.kindOf(d.rhoOf({ a, b: opp, p: 49 })), 'mixed');
    close(d.len(d.blochOf(d.rhoOf({ a, b: opp, p: 49 }))), 0.02);
  }
  for (const r of recipes) assert.equal(d.kindOf(d.rhoOf(r)) === 'center', r.p === 50 && d.len(d.pointAt(r.a).map((x, i) => x + d.pointAt(r.b)[i])) < 1e-9);
  // Nearly opposite, at whole degrees: still mixed.
  assert.equal(d.kindOf(d.rhoOf({ a: { theta: 1, phi: 0 }, b: { theta: 179, phi: 181 }, p: 50 })), 'mixed');
});

// ---- Measuring

test('the three bases are orthonormal, and the axis of each is the point of its first outcome', () => {
  for (const k of ['z', 'x', 'y'] as const) {
    const [v0, v1] = d.BASES[k].kets;
    close(q.norm2(v0), 1); close(q.norm2(v1), 1); close(q.abs2(q.inner(v0, v1)), 0);
    closeVec(q.bloch(v0), d.BASES[k].axis);
    closeVec(q.bloch(v1), d.BASES[k].axis.map((x) => -x));
  }
});

test('Born rule for ρ: the odds add to 1 and equal (1 ± r·n)/2', () => {
  for (const r of recipes) for (const k of ['z', 'x', 'y'] as const) {
    const rho = d.rhoOf(r), [p0, p1] = d.odds(rho, k), v = d.blochOf(rho);
    close(p0 + p1, 1);
    close(p0, (1 + dot(v, d.BASES[k].axis)) / 2);
    assert.ok(p0 >= 0 && p1 >= 0);
  }
});

test('the odds from ρ are the recipe\'s odds: p|⟨v|A⟩|² + (1 − p)|⟨v|B⟩|², a coin then a Born rule draw', () => {
  for (const r of recipes) for (const k of ['z', 'x', 'y'] as const) {
    const p = r.p / 100, [v0] = d.BASES[k].kets;
    const twoStep = p * q.abs2(q.inner(v0, d.ketAt(r.a))) + (1 - p) * q.abs2(q.inner(v0, d.ketAt(r.b)));
    close(d.odds(d.rhoOf(r), k)[0], twoStep);
  }
});

test('in the 0/1 basis the odds are the diagonal of ρ', () => {
  for (const r of recipes) {
    const rho = d.rhoOf(r);
    closeVec(d.odds(rho, 'z'), [rho[0][0].re, rho[1][1].re]);
  }
});

test('the center gives 50/50 in every basis, even a random one', () => {
  const rho = d.rhoOf(preset('|0⟩ or |1⟩'));
  for (const k of ['z', 'x', 'y'] as const) closeVec(d.odds(rho, k), [0.5, 0.5]);
  for (const s of randoms) { close(d.prob(rho, s), 0.5); close(d.prob(rho, perp(s)), 0.5); }
});

test('a mix is not a superposition: half |0⟩, half |1⟩ and just |+⟩ agree in the 0/1 basis but not in +/−', () => {
  const mix = d.rhoOf(preset('|0⟩ or |1⟩')), sup = d.rhoOf(preset('Just |+⟩'));
  closeVec(d.odds(mix, 'z'), [0.5, 0.5]); closeVec(d.odds(sup, 'z'), [0.5, 0.5]);
  closeVec(d.odds(mix, 'x'), [0.5, 0.5]); closeVec(d.odds(sup, 'x'), [1, 0]);
  closeC(mix[0][1], q.c(0)); closeC(sup[0][1], q.c(0.5));
  assert.equal(d.kindOf(sup), 'pure');
});

test('two recipes with the same ρ give the same dots in every basis: only ⟨v|ρ|v⟩ enters', () => {
  const us = Array.from({ length: d.COPIES }, rand);
  for (const k of ['z', 'x', 'y'] as const) {
    const a = d.results(us, d.odds(d.rhoOf(preset('|0⟩ or |1⟩')), k)[0]);
    const b = d.results(us, d.odds(d.rhoOf(preset('|+⟩ or |−⟩')), k)[0]);
    assert.deepEqual(a, b);
  }
});

test('each copy gives the first outcome when its draw is below p0, so evenly spread draws give p0 of them exactly', () => {
  const N = 1000, us = Array.from({ length: N }, (_, i) => (i + 0.5) / N);
  for (const r of recipes.slice(0, 300)) {
    const p0 = d.odds(d.rhoOf(r), 'x')[0], rs = d.results(us, p0);
    assert.ok(Math.abs(d.firsts(rs) - p0 * N) <= 1);
    rs.forEach((x, i) => assert.equal(x, us[i] < p0 ? 0 : 1));
  }
  assert.equal(d.firsts(d.results(us, 1)), N);
  assert.equal(d.firsts(d.results(us, 0)), 0);
});

// ---- Facts the page states

test('a unitary acts as ρ ↦ UρU†: it keeps trace and purity and turns the ball (H swaps x and z and flips y)', () => {
  for (const r of recipes.slice(0, 300)) {
    const rho = d.rhoOf(r), v = d.blochOf(rho), h = q.matMul(q.matMul(q.H, rho), q.dagger(q.H));
    closeC(d.trace(h), q.c(1)); close(d.purity(h), d.purity(rho));
    closeVec(d.blochOf(h), [v[2], -v[1], v[0]]);
    const u = q.matMul(q.RZ(rand() * 6), q.RY(rand() * 6)), w = q.matMul(q.matMul(u, rho), q.dagger(u));
    close(d.len(d.blochOf(w)), d.len(v));
  }
});

test('outside the ball is not a state: |r| > 1 gives the eigenvalue (1 − |r|)/2 < 0, and the opposite outcome a negative chance', () => {
  for (const a of grid) {
    const n = d.pointAt(a);
    for (const L of [1.01, 1.2, 2]) {
      const m = d.fromVec(n.map((x) => x * L) as d.Vec3), [, lo] = d.eigenvalues(m);
      close(lo, (1 - L) / 2); assert.ok(lo < 0);
      close(d.prob(m, d.ketAt({ theta: 180 - a.theta, phi: a.phi + 180 })), (1 - L) / 2);
      closeC(d.trace(m), q.c(1));
    }
    for (const L of [0, 0.5, 1]) assert.ok(d.eigenvalues(d.fromVec(n.map((x) => x * L) as d.Vec3))[1] >= -1e-12);
  }
});

test('a gate then a z measurement gives the same odds: H for +/−, S† then H for +i/−i', () => {
  const sdgH = q.matMul(q.H, q.dagger(q.S)); // S† first, then H
  for (const r of recipes.slice(0, 300)) {
    const rho = d.rhoOf(r);
    for (const [u, k] of [[q.H, 'x'], [sdgH, 'y']] as const) {
      const out = q.matMul(q.matMul(u, rho), q.dagger(u));
      closeVec([out[0][0].re, out[1][1].re], d.odds(rho, k));
    }
  }
});

test('two copies of the two recipes with the same ρ are the same state: ρ⊗ρ is equal', () => {
  const a = d.rhoOf(preset('|0⟩ or |1⟩')), b = d.rhoOf(preset('|+⟩ or |−⟩'));
  closeM(q.kron(a, a), q.kron(b, b), 1e-15);
  closeM(q.kron(a, b), q.kron(b, a), 1e-15);
});

test('along any unit vector n the odds are (1 + r·n)/2, for random n', () => {
  for (const r of recipes.slice(0, 300)) {
    const rho = d.rhoOf(r), v = d.blochOf(rho);
    for (let i = 0; i < 5; i++) {
      const s = q.fromBloch(Math.acos(1 - 2 * rand()), 2 * Math.PI * rand()), n = q.bloch(s);
      close(d.prob(rho, s), (1 + dot(v, n)) / 2);
    }
  }
});

// ---- Presets and names

test('the presets: just |+⟩ is pure; |0⟩ or |1⟩ and |+⟩ or |−⟩ both land on the center; presetAt finds each', () => {
  assert.equal(d.kindOf(d.rhoOf(preset('Just |+⟩'))), 'pure');
  assert.equal(d.kindOf(d.rhoOf(preset('|0⟩ or |1⟩'))), 'center');
  assert.equal(d.kindOf(d.rhoOf(preset('|+⟩ or |−⟩'))), 'center');
  assert.equal(d.kindOf(d.rhoOf(preset('|0⟩ or |+⟩'))), 'mixed');
  for (const r of d.RECIPES) assert.equal(d.presetAt(r), r.name);
  assert.equal(d.presetAt({ ...d.START, p: 51 }), null);
  assert.equal(d.presetAt({ ...d.START, b: { theta: 90, phi: 360 } }), d.START.name);
});

test('sameState and nameAt: poles ignore phi, other points need the same phi', () => {
  assert.ok(d.sameState({ theta: 0, phi: 0 }, { theta: 0, phi: 123 }));
  assert.ok(d.sameState({ theta: 180, phi: 0 }, { theta: 180, phi: 359 }));
  assert.ok(!d.sameState({ theta: 90, phi: 0 }, { theta: 90, phi: 1 }));
  assert.equal(d.nameAt({ theta: 0, phi: 77 }), '|0⟩');
  assert.equal(d.nameAt({ theta: 90, phi: 270 }), '|−i⟩');
  assert.equal(d.nameAt({ theta: 45, phi: 0 }), null);
  for (const a of grid) for (const b of grid) {
    const same = d.sameState(a, b), rA = d.pureRho(a), rB = d.pureRho(b);
    const diff = Math.max(...rA.flatMap((row, i) => row.map((z, j) => q.abs(q.sub(z, rB[i][j])))));
    assert.equal(diff < 1e-12, same);
  }
});

// ---- Words and numbers

test('num: exact 0, 1 and −1 show no decimals, others two, with a true minus sign and never −0.00', () => {
  assert.equal(d.num(0), '0'); assert.equal(d.num(1e-17), '0'); assert.equal(d.num(1), '1'); assert.equal(d.num(-1), '−1');
  assert.equal(d.num(1 - 1e-16), '1');
  assert.equal(d.num(0.25), '0.25'); assert.equal(d.num(-0.25), '−0.25'); assert.equal(d.num(0.5), '0.50');
  assert.equal(d.num(-0.001), '0.00'); assert.equal(d.num(0.004), '0.00'); assert.equal(d.num(0.9999), '1.00');
});

test('cnum writes a complex entry', () => {
  assert.equal(d.cnum(q.c(0.25)), '0.25');
  assert.equal(d.cnum(q.c(0, -0.25)), '−0.25i');
  assert.equal(d.cnum(q.c(0, 0.25)), '0.25i');
  assert.equal(d.cnum(q.c(0.25, -0.25)), '0.25 − 0.25i');
  assert.equal(d.cnum(q.c(-0.35, 0.35)), '−0.35 + 0.35i');
  assert.equal(d.cnum(q.c(0, 1)), 'i'); assert.equal(d.cnum(q.c(0, -1)), '−i');
  assert.equal(d.cnum(q.c(0)), '0');
  assert.equal(d.vecText([0.5, 0, -0.5]), '(0.50, 0, −0.50)');
});

test('amount never rounds a mixed state up to 1 or a nonzero number down to 0', () => {
  assert.equal(d.amount(0.9999), 'just under 1'); assert.equal(d.amount(1), '1');
  assert.equal(d.amount(0.001), 'just over 0'); assert.equal(d.amount(0), '0');
  assert.equal(d.amount(0.7071), '0.71');
});

test('percents add to 100 and show a real chance as neither 0% nor 100%', () => {
  for (let k = 0; k <= 1000; k++) {
    const p = k / 1000, [a, b] = d.percents(p);
    if (k === 0) assert.deepEqual([a, b], ['0%', '100%']);
    else if (k === 1000) assert.deepEqual([a, b], ['100%', '0%']);
    else {
      assert.ok(a !== '0%' && a !== '100%' && b !== '0%' && b !== '100%', `${p}: ${a} ${b}`);
      if (a.endsWith('%') && b.endsWith('%') && !a.includes(' ') && !b.includes(' ')) assert.equal(parseInt(a) + parseInt(b), 100);
    }
  }
  assert.deepEqual(d.percents(0.75), ['75%', '25%']);
  assert.deepEqual(d.percents(1 - 1e-15), ['100%', '0%']);
});

test('recipeText names the recipe, its chance and both states', () => {
  assert.equal(d.recipeText(d.START), '|0⟩ with chance 50%, else |+⟩');
  assert.equal(d.recipeText(preset('Just |+⟩')), '|+⟩ every time');
  assert.equal(d.recipeText({ ...d.START, p: 0 }), '|+⟩ every time');
  assert.equal(d.recipeText({ a: { theta: 30, phi: 400 }, b: { theta: 180, phi: 0 }, p: 25 }), 'the state at θ 30°, φ 40° with chance 25%, else |1⟩');
  assert.equal(d.recipeText({ a: { theta: 0, phi: 0 }, b: { theta: 0, phi: 90 }, p: 30 }), '|0⟩ every time (A and B are the same state)');
});

test('describe: the start recipe, where its point is, the odds in the basis, and the batch', () => {
  assert.equal(d.describe(d.START, 'z'),
    'Recipe: |0⟩ with chance 50%, else |+⟩. The point is 0.71 from the center, inside the ball: a mixed state, with purity 0.75. Measured in the 0/1 basis, the odds are 75% for 0 and 25% for 1, the diagonal of ρ.');
  assert.equal(d.describe(d.START, 'x', 70),
    'Recipe: |0⟩ with chance 50%, else |+⟩. The point is 0.71 from the center, inside the ball: a mixed state, with purity 0.75. Measured in the +/− basis, the odds are 75% for + and 25% for −. Of 100 fresh copies, each measured once, 70 gave + and 30 gave −.');
  assert.match(d.describe(preset('|+⟩ or |−⟩'), 'y', 100), /^Recipe: \|\+⟩ with chance 50%, else \|−⟩\. The point is at the center: the completely mixed state I\/2, with purity 0\.50\. Every basis gives 50\/50 here\..* all 100 gave \+i\.$/);
  assert.match(d.describe(preset('Just |+⟩'), 'x', 100), /on the surface of the ball: a pure state.*100% for \+ and 0% for −\..*all 100 gave \+\.$/);
  assert.match(d.describe({ a: { theta: 1, phi: 0 }, b: { theta: 1, phi: 1 }, p: 1 }, 'z'), /just under 1 from the center.*purity just under 1/);
  assert.match(d.describe({ a: { theta: 20, phi: 0 }, b: { theta: 160, phi: 180 }, p: 49 }, 'z'), /0\.02 from the center.*purity just over 0\.50\./);
});

test('tallyText counts a batch', () => {
  assert.equal(d.tallyText(100, 'z'), 'all 100 gave 0');
  assert.equal(d.tallyText(0, 'x'), 'all 100 gave −');
  assert.equal(d.tallyText(42, 'y'), '42 gave +i and 58 gave −i');
  assert.equal(d.batchText(74, 'z'), 'In the 0/1 basis, 74 gave 0 (filled) and 26 gave 1 (open).');
  assert.equal(d.batchText(0, 'x'), 'In the +/− basis, 0 gave + (filled) and 100 gave − (open).');
});

// ---- Drawing math

test('the camera is a right-handed orthonormal frame, so the view is a rotation that keeps lengths', () => {
  for (const [yaw, tilt] of [[0, 0], [30, 20], [200, -45], [359, 90]]) {
    const { right, up, toward } = d.camera(yaw, tilt);
    for (const [a, b, want] of [[right, right, 1], [up, up, 1], [toward, toward, 1], [right, up, 0], [right, toward, 0], [up, toward, 0]] as const) close(dot(a, b), want);
    closeVec([right[1] * up[2] - right[2] * up[1], right[2] * up[0] - right[0] * up[2], right[0] * up[1] - right[1] * up[0]], toward);
    for (const p of d.spherePoints(50)) { const s = d.project(p, d.camera(yaw, tilt)); close(Math.hypot(s.x, s.y, s.depth), 1); }
  }
  const front = d.camera(0, 0);
  closeVec(front.toward, [1, 0, 0]); closeVec(front.up, [0, 0, 1]); closeVec(front.right, [0, 1, 0]);
});

test('sphere points lie on the unit sphere and a segment runs from a to b', () => {
  for (const p of d.spherePoints(300)) close(d.len(p), 1);
  const s = d.segment([0, 0, 1], [1, 0, 0], 4);
  assert.equal(s.length, 5); closeVec(s[0], [0, 0, 1]); closeVec(s[4], [1, 0, 0]); closeVec(s[2], [0.5, 0, 0.5]);
});

test('same rho on one qubit, different joint state on two: independent coins give rho (x) rho, one shared coin does not', () => {
  const k0 = q.ket0(), k1 = q.ket1();
  const proj = (s: q.State): q.Matrix => s.map((x) => s.map((y) => q.mul(x, q.conj(y))));
  const mix = (a: q.Matrix, b: q.Matrix): q.Matrix => a.map((row, i) => row.map((x, j) => q.scale(q.add(x, b[i][j]), 0.5)));
  const r0 = proj(k0), r1 = proj(k1), rho = mix(r0, r1);
  // Independent coins: rho (x) rho. Shared coin: half |00><00| + half |11><11|.
  const indep = q.kron(rho, rho), shared = mix(proj(q.tensor(k0, k0)), proj(q.tensor(k1, k1)));
  // Each qubit alone is I/2 in both.
  const first = (m: q.Matrix): q.Matrix => [[q.add(m[0][0], m[1][1]), q.add(m[0][2], m[1][3])], [q.add(m[2][0], m[3][1]), q.add(m[2][2], m[3][3])]];
  closeM(first(indep), rho);
  closeM(first(shared), rho);
  // But the joint states differ: in the 0/1 test the two results agree with chance 1/2 (independent) or 1 (shared).
  close(indep[0][0].re + indep[3][3].re, 0.5);
  close(shared[0][0].re + shared[3][3].re, 1);
});
