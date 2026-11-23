import test from 'node:test';
import assert from 'node:assert/strict';
import * as q from '../quantum.ts';
import {
  ghz, w, stateOf, turnTo, afterCarol, pairChances, sameChance, concurrence, link, run, abBasisFor, tally, local, tangle, pairMatrix,
  basisName, resultName, chanceText, ketText, lesson, carolOdds, readout, pairLine, MAX, STRIP, ALICE, BOB, CAROL,
  type Kind, type Basis, type Bit, type Run,
} from './ghz-w.ts';

const close = (a: number, b: number, eps = 1e-12) => assert.ok(Math.abs(a - b) < eps, `${a} != ${b}`);
const closeC = (a: q.C, b: q.C, eps = 1e-12) => { close(a.re, b.re, eps); close(a.im, b.im, eps); };
const closeS = (a: q.State, b: q.State, eps = 1e-12) => { assert.equal(a.length, b.length); a.forEach((x, i) => closeC(x, b[i], eps)); };
/** Same state up to a global phase: |<a|b>| = 1 for unit vectors. */
const sameRay = (a: q.State, b: q.State) => close(q.abs(q.inner(a, b)), 1, 1e-9);

const KINDS: Kind[] = ['ghz', 'w'];
const BASES: Basis[] = ['Z', 'X'];
const BITS: Bit[] = [0, 1];
const s2 = Math.SQRT1_2, s3 = 1 / Math.sqrt(3);
const vec = (xs: number[]) => xs.map((x) => q.c(x));
const PHI_P = vec([s2, 0, 0, s2]), PHI_M = vec([s2, 0, 0, -s2]), PSI_P = vec([0, s2, s2, 0]), PSI_M = vec([0, s2, -s2, 0]);

/** Swap qubits i and j of a 3-qubit state. */
const swap = (s: q.State, i: number, j: number) => s.map((_, x) => {
  const bi = (x >> (2 - i)) & 1, bj = (x >> (2 - j)) & 1;
  return s[bi === bj ? x : x ^ ((1 << (2 - i)) | (1 << (2 - j)))];
});
/** One qubit's 2x2 density matrix, the other two traced out. */
const oneQubit = (s: q.State, k: number): q.Matrix => [0, 1].map((i) => [0, 1].map((j) =>
  s.reduce((t, a, x) => (((x >> (2 - k)) & 1) === i ? q.add(t, q.mul(a, q.conj(s[x ^ ((i ^ j) << (2 - k))]))) : t), q.c(0))));
const det2 = (m: q.Matrix): q.C => q.sub(q.mul(m[0][0], m[1][1]), q.mul(m[0][1], m[1][0]));
/** A seeded random 2x2 unitary: global phase, then RZ RY RZ. */
const randU = (r: () => number): q.Matrix => {
  const g = q.expi(6.3 * r());
  return q.matMul(q.matMul(q.RZ(6.3 * r()), q.RY(6.3 * r())), q.RZ(6.3 * r())).map((row) => row.map((x) => q.mul(g, x)));
};
/** A seeded random 2x2 complex matrix (almost surely invertible). */
const randM = (r: () => number): q.Matrix => [0, 1].map(() => [0, 1].map(() => q.c(2 * r() - 1, 2 * r() - 1)));

// ---- The states

test('GHZ made by H then two CNOTs from |000> is (|000> + |111>)/√2', () => {
  closeS(ghz(), vec([s2, 0, 0, 0, 0, 0, 0, s2]));
  close(q.norm2(ghz()), 1);
});

test('W is 1/√3 on |001>, |010>, |100> and 0 elsewhere', () => {
  closeS(w(), vec([0, s3, s3, 0, s3, 0, 0, 0]));
  close(q.norm2(w()), 1);
  assert.equal(ketText(ghz()), '(|000⟩ + |111⟩)/√2');
  assert.equal(ketText(w()), '(|001⟩ + |010⟩ + |100⟩)/√3');
});

test('both states are symmetric: swapping any two qubits changes nothing', () => {
  for (const k of KINDS) for (const [i, j] of [[0, 1], [0, 2], [1, 2]]) closeS(swap(stateOf(k), i, j), stateOf(k));
});

test('both entangle all three: every one-qubit reduced state is mixed (rank 2), so no qubit splits off (DVC III)', () => {
  for (const k of KINDS) for (const n of [ALICE, BOB, CAROL]) {
    const r = oneQubit(stateOf(k), n);
    close(q.add(r[0][0], r[1][1]).re, 1);
    assert.ok(q.abs(det2(r)) > 0.2, `${k} qubit ${n}`);
  }
  // GHZ: each qubit alone is I/2 (det 1/4). W: diag(2/3, 1/3) (det 2/9).
  close(det2(oneQubit(ghz(), 0)).re, 1 / 4);
  close(det2(oneQubit(w(), 0)).re, 2 / 9);
  // A product state has a pure (rank 1) one-qubit state.
  close(q.abs(det2(oneQubit(q.basis(3, 5), 1))), 0);
});

test('Born rule, all three in 0/1: GHZ gives 000 or 111 (1 in 2 each); W gives exactly one 1 (1 in 3 each)', () => {
  const g = q.probs(ghz()), v = q.probs(w());
  close(g[0], 0.5); close(g[7], 0.5);
  close(v[1], 1 / 3); close(v[2], 1 / 3); close(v[4], 1 / 3);
  for (const p of [g, v]) close(p.reduce((t, x) => t + x, 0), 1);
  [1, 2, 3, 4, 5, 6].forEach((i) => close(g[i], 0));
  [0, 3, 5, 6, 7].forEach((i) => close(v[i], 0));
});

// ---- Carol measures

test("Carol's chances sum to 1 and each pair left is a unit vector", () => {
  for (const k of KINDS) for (const b of BASES) {
    const [x, y] = BITS.map((r) => afterCarol(k, b, r));
    close(x.p + y.p, 1);
    close(q.norm2(x.pair), 1); close(q.norm2(y.pair), 1);
  }
});

test('Born rule for the whole register: P(Carol r) times P(Alice a, Bob b | r) is |amplitude of |abr>|² after the basis turns', () => {
  for (const k of KINDS) for (const cb of BASES) for (const ab of BASES) {
    const full = q.probs(turnTo(turnTo(turnTo(stateOf(k), CAROL, cb), ALICE, ab), BOB, ab));
    for (const r of BITS) {
      const { p, pair } = afterCarol(k, cb, r), pc = pairChances(pair, ab);
      for (let x = 0; x < 4; x++) close(p * pc[x], full[(x << 1) | r]);
    }
  }
});

test('Watrous, partial measurement: GHZ, Carol 0/1 leaves |00> or |11> (1 in 2 each), never entangled', () => {
  const a = afterCarol('ghz', 'Z', 0), b = afterCarol('ghz', 'Z', 1);
  close(a.p, 0.5); close(b.p, 0.5);
  closeS(a.pair, vec([1, 0, 0, 0])); closeS(b.pair, vec([0, 0, 0, 1]));
  assert.equal(link(a.pair), 'none'); assert.equal(link(b.pair), 'none');
});

test('Watrous, partial measurement: W, Carol 0/1 gives 0 with chance 2/3 and leaves the Bell pair (|01> + |10>)/√2; 1 leaves |00>', () => {
  const a = afterCarol('w', 'Z', 0), b = afterCarol('w', 'Z', 1);
  close(a.p, 2 / 3); close(b.p, 1 / 3);
  closeS(a.pair, PSI_P); closeS(b.pair, vec([1, 0, 0, 0]));
  assert.equal(link(a.pair), 'bell'); assert.equal(link(b.pair), 'none');
});

test('GHZ, Carol +/− leaves (|00> ± |11>)/√2: a Bell pair either way (1 in 2 each)', () => {
  const a = afterCarol('ghz', 'X', 0), b = afterCarol('ghz', 'X', 1);
  close(a.p, 0.5); close(b.p, 0.5);
  closeS(a.pair, PHI_P); closeS(b.pair, PHI_M);
});

test('DVC: GHZ gives a Bell pair to Alice and Bob with certainty: Carol measures +/−, and on − Alice applies Z', () => {
  const plus = afterCarol('ghz', 'X', 0), minus = afterCarol('ghz', 'X', 1);
  closeS(plus.pair, PHI_P);
  closeS(q.apply1(minus.pair, q.Z, 0, 2), PHI_P);
  close(plus.p + minus.p, 1);
  // GHZ is symmetric, so the same works for any two of the three.
});

test('W, Carol +/− leaves (±|00> + |01> + |10>)/√3: entangled (concurrence 2/3), not a Bell pair', () => {
  for (const r of BITS) {
    const { p, pair } = afterCarol('w', 'X', r);
    close(p, 0.5);
    closeS(pair, vec([r ? -s3 : s3, s3, s3, 0]));
    close(concurrence(pair), 2 / 3);
    assert.equal(link(pair), 'some');
  }
});

test('W, Carol +/−: Alice and Bob each alone are not 50/50 (a Bell pair half always is), so the pair is less than a Bell pair', () => {
  // Single-result chances from the pair: Alice reads 1 (or −) with pc[2] + pc[3], Bob with pc[1] + pc[3].
  const one = (pair: q.State, b: Basis) => { const pc = pairChances(pair, b); return [pc[2] + pc[3], pc[1] + pc[3]]; };
  for (const r of BITS) {
    const { pair } = afterCarol('w', 'X', r), [az, bz] = one(pair, 'Z'), [ax, bx] = one(pair, 'X');
    close(az, 1 / 3); close(bz, 1 / 3);
    // <X> on Alice is ±2/3, so she reads − with chance (1 ∓ 2/3)/2: 1/6 after Carol's +, 5/6 after her −. Same for Bob.
    close(ax, r ? 5 / 6 : 1 / 6); close(bx, r ? 5 / 6 : 1 / 6);
  }
  for (const pair of [PHI_P, PHI_M, PSI_P, PSI_M]) for (const b of BASES) one(pair, b).forEach((p) => close(p, 0.5));
});

test('the chance Alice and Bob match, every case the tool shows', () => {
  const want: Record<string, [number, number]> = {
    'ghz Z 0': [1, 0.5], 'ghz Z 1': [1, 0.5], 'ghz X 0': [1, 1], 'ghz X 1': [1, 0],
    'w Z 0': [0, 1], 'w Z 1': [1, 0.5], 'w X 0': [1 / 3, 5 / 6], 'w X 1': [1 / 3, 5 / 6],
  };
  for (const k of KINDS) for (const b of BASES) for (const r of BITS) {
    const { pair } = afterCarol(k, b, r), [z, x] = want[`${k} ${b} ${r}`];
    close(sameChance(pair, 'Z'), z); close(sameChance(pair, 'X'), x);
    const pz = pairChances(pair, 'Z'), px = pairChances(pair, 'X');
    close(pz.reduce((t, v) => t + v, 0), 1); close(px.reduce((t, v) => t + v, 0), 1);
  }
});

test('a Bell pair is locked in both bases: same or opposite results always, in 0/1 and in +/−', () => {
  for (const pair of [PHI_P, PHI_M, PSI_P, PSI_M]) for (const b of BASES) {
    const s = sameChance(pair, b);
    assert.ok(Math.abs(s) < 1e-12 || Math.abs(s - 1) < 1e-12);
  }
  // Relative phase shows: Φ+ and Φ− differ only by a sign, and +/− tells them apart (always same vs never same).
  close(sameChance(PHI_P, 'X'), 1); close(sameChance(PHI_M, 'X'), 0);
  // Global phase does not: −Φ+ behaves exactly like Φ+.
  const neg = PHI_P.map((a) => q.scale(a, -1));
  for (const b of BASES) close(sameChance(neg, b), sameChance(PHI_P, b));
});

test('no message by measuring: without her result, Alice and Bob see the same odds whichever basis Carol used', () => {
  for (const k of KINDS) for (const ab of BASES) {
    const mix = (cb: Basis) => [0, 1, 2, 3].map((x) => BITS.reduce((t, r) => {
      const { p, pair } = afterCarol(k, cb, r);
      return t + p * pairChances(pair, ab)[x];
    }, 0));
    const z = mix('Z'), x = mix('X');
    z.forEach((v, i) => close(v, x[i]));
  }
});

// ---- Concurrence and the link labels

test('concurrence: 0 for product pairs, 1 for all four Bell pairs, unchanged by local unitaries and global phase', () => {
  close(concurrence(vec([1, 0, 0, 0])), 0);
  close(concurrence(q.tensor(q.plus(), q.fromBloch(1.1, 0.4))), 0);
  for (const b of [PHI_P, PHI_M, PSI_P, PSI_M]) close(concurrence(b), 1);
  const r = q.rng(7);
  for (let t = 0; t < 20; t++) {
    const s = q.normalize([0, 1, 2, 3].map(() => q.c(2 * r() - 1, 2 * r() - 1)));
    const u = q.apply1(q.apply1(s, randU(r), 0, 2), randU(r), 1, 2).map((a) => q.mul(q.expi(1.3), a));
    close(concurrence(u), concurrence(s), 1e-9);
    assert.ok(concurrence(s) <= 1 + 1e-12);
  }
});

test("every 'bell' case in the tool is one of the four Bell states, up to a global phase", () => {
  for (const k of KINDS) for (const b of BASES) for (const r of BITS) {
    const { pair } = afterCarol(k, b, r);
    if (link(pair) !== 'bell') continue;
    const hits = [PHI_P, PHI_M, PSI_P, PSI_M].filter((x) => Math.abs(q.abs(q.inner(x, pair)) - 1) < 1e-9);
    assert.equal(hits.length, 1);
  }
});

// ---- Runs: the Born rule sampler

/** Exact chances run() uses step by step: Carol, then Alice given Carol, then Bob given both. */
function steps(k: Kind, cb: Basis, ab: Basis, r: Bit, a: Bit) {
  const { p, pair } = afterCarol(k, cb, r), pc = pairChances(pair, ab);
  const pA1 = pc[2] + pc[3], pB1 = pc[2 * a + 1] / (pc[2 * a] + pc[2 * a + 1]);
  return { pC1: afterCarol(k, cb, 1).p, pA1, pB1, joint: (b: Bit) => p * pc[2 * a + b] };
}

test('run(): a draw u gives result 1 exactly when u < P(1), at every step, so each triple comes out with its Born rule chance', () => {
  // measureQubit reads 1 when u < P(1). For each possible triple, pick u inside its slice and check run() returns it.
  const inside = (p1: number, bit: Bit) => (bit ? p1 / 2 : (1 + p1) / 2);
  for (const k of KINDS) for (const cb of BASES) for (const ab of BASES) for (const r of BITS) for (const a of BITS) for (const b of BITS) {
    const s = steps(k, cb, ab, r, a), chance = s.joint(b);
    if (chance < 1e-12) continue; // impossible triple: its slice has no width
    const us = [inside(s.pC1, r), inside(s.pA1, a), inside(s.pB1, b)];
    let i = 0;
    const got = run(k, cb, ab, () => us[i++]);
    assert.deepEqual(got, { carol: r, basis: ab, alice: a, bob: b }, `${k} ${cb} ${ab} ${r}${a}${b}`);
    assert.equal(i, 3);
  }
});

test('run(): the slices of all possible triples cover all draws (chances sum to 1), and impossible triples have chance 0', () => {
  for (const k of KINDS) for (const cb of BASES) for (const ab of BASES) {
    let total = 0;
    for (const r of BITS) for (const a of BITS) for (const b of BITS) total += steps(k, cb, ab, r, a).joint(b);
    close(total, 1);
  }
  // GHZ, Carol −, Alice and Bob in +/−: they never match. W, Carol 0, both 0/1: they never match.
  for (const a of BITS) close(steps('ghz', 'X', 'X', 1, a).joint(a), 0);
  for (const a of BITS) close(steps('w', 'Z', 'Z', 0, a).joint(a), 0);
});

test('Alice and Bob take turns: even runs 0/1, odd runs +/−, so each basis gets at most STRIP of MAX runs', () => {
  assert.equal(abBasisFor(0), 'Z'); assert.equal(abBasisFor(1), 'X'); assert.equal(abBasisFor(198), 'Z');
  const z = Array.from({ length: MAX }, (_, i) => abBasisFor(i)).filter((b) => b === 'Z').length;
  assert.equal(z, STRIP); assert.equal(MAX - z, STRIP);
});

test('tally sorts runs by Carol and basis and counts matches', () => {
  const runs: Run[] = [
    { carol: 0, basis: 'Z', alice: 1, bob: 1 }, { carol: 0, basis: 'X', alice: 0, bob: 1 },
    { carol: 1, basis: 'Z', alice: 0, bob: 0 }, { carol: 0, basis: 'Z', alice: 0, bob: 1 },
  ];
  const [a, b] = tally(runs);
  assert.deepEqual(a, { runs: 3, Z: { runs: 2, same: 1 }, X: { runs: 1, same: 0 } });
  assert.deepEqual(b, { runs: 1, Z: { runs: 1, same: 1 }, X: { runs: 0, same: 0 } });
  assert.deepEqual(tally([]), [{ runs: 0, Z: { runs: 0, same: 0 }, X: { runs: 0, same: 0 } }, { runs: 0, Z: { runs: 0, same: 0 }, X: { runs: 0, same: 0 } }]);
});

// ---- Two kinds: the facts the text states (Dür, Vidal, Cirac 2000; Coffman, Kundu, Wootters 2000)

test('3-tangle: 1 for GHZ, 0 for W, 0 for product and two-qubit-only states', () => {
  close(tangle(ghz()), 1);
  close(tangle(w()), 0);
  close(tangle(q.basis(3, 0)), 0);
  close(tangle(q.tensor(q.plus(), q.tensor(q.minus(), q.fromBloch(0.7, 2)))), 0);
  // Bell pair between two qubits, the third apart, in each of the three placements.
  close(tangle(q.tensor(q.ket0(), PHI_P)), 0);
  close(tangle(q.tensor(PSI_M, q.plus())), 0);
  close(tangle(swap(q.tensor(PHI_P, q.ket1()), 0, 2)), 0);
});

test('3-tangle matches DVC eq. 22 on their GHZ-kind standard form, eq. 15', () => {
  const r = q.rng(11);
  for (let t = 0; t < 20; t++) {
    const d = 0.05 + r() * (Math.PI / 4 - 0.05), al = 0.1 + r() * 1.4, be = 0.1 + r() * 1.4, ga = 0.1 + r() * 1.4, ph = 6.28 * r();
    const cs = (x: number) => [Math.cos(x), Math.sin(x)];
    const K = 1 / (1 + 2 * Math.cos(d) * Math.sin(d) * Math.cos(al) * Math.cos(be) * Math.cos(ga) * Math.cos(ph));
    const prod = q.tensor(q.tensor(vec(cs(al)), vec(cs(be))), vec(cs(ga)));
    const s = prod.map((x, i) => q.scale(q.add(q.c(i === 0 ? Math.cos(d) : 0), q.scale(q.mul(q.expi(ph), x), Math.sin(d))), Math.sqrt(K)));
    close(q.norm2(s), 1, 1e-12);
    close(tangle(s), (2 * K * Math.sin(al) * Math.sin(be) * Math.sin(ga) * Math.sin(d) * Math.cos(d)) ** 2, 1e-12);
    assert.ok(tangle(s) > 0);
  }
});

test('3-tangle is 0 on DVC eq. 20, the W-kind standard form √a|001> + √b|010> + √c|100> + √d|000>', () => {
  const r = q.rng(12);
  for (let t = 0; t < 20; t++) {
    const x = [r(), r(), r(), r()], n = x.reduce((u, v) => u + v, 0), [a, b, cc, d] = x.map((v) => v / n);
    close(tangle(vec([Math.sqrt(d), Math.sqrt(a), Math.sqrt(b), 0, Math.sqrt(cc), 0, 0, 0])), 0);
  }
});

test('local unitaries and global phase never change the 3-tangle', () => {
  const r = q.rng(3);
  for (const k of KINDS) for (let t = 0; t < 20; t++) {
    const s = local(stateOf(k), [randU(r), randU(r), randU(r)]).map((a) => q.mul(q.expi(2.1), a));
    close(q.norm2(s), 1, 1e-12);
    close(tangle(s), tangle(stateOf(k)), 1e-12);
  }
});

test('invertible local operators (SLOCC) scale the 3-tangle by |det A det B det C|²: GHZ never reaches 0, W never leaves 0', () => {
  const r = q.rng(5);
  for (let t = 0; t < 30; t++) {
    const ops = [randM(r), randM(r), randM(r)];
    const dets = q.abs(ops.map(det2).reduce(q.mul)) ** 2;
    for (const k of KINDS) {
      const raw = local(stateOf(k), ops), n2 = q.norm2(raw), s = q.normalize(raw);
      close(tangle(s) * n2 * n2, dets * tangle(stateOf(k)), 1e-9);
    }
    const g = tangle(q.normalize(local(ghz(), ops)));
    assert.ok(g > 0, 'GHZ kind stays GHZ kind');
    close(tangle(q.normalize(local(w(), ops))), 0, 1e-12);
  }
});

test('GHZ needs 2 product terms, W 3: and W cannot be written with 2 (DVC, the range of the two-qubit leftover)', () => {
  // GHZ = (|0>|0>|0> + |1>|1>|1>)/√2 and W = (|0>|0>|1> + |0>|1>|0> + |1>|0>|0>)/√3, written out as products.
  const t = (a: q.State, b: q.State, cc: q.State) => q.tensor(q.tensor(a, b), cc);
  const [z, o] = [q.ket0(), q.ket1()];
  closeS(t(z, z, z).map((x, i) => q.scale(q.add(x, t(o, o, o)[i]), s2)), ghz());
  closeS(t(z, z, o).map((x, i) => q.scale(q.add(q.add(x, t(z, o, z)[i]), t(o, z, z)[i]), s3)), w());
  // A 2-term form |a1 b1 c1> + |a2 b2 c2> needs two product states in the range of Bob and Carol's leftover (DVC, Lemma).
  // W's leftover (Alice lost) is 1/3 |00><00| + 2/3 |Ψ+><Ψ+|, range spanned by |00> and Ψ+.
  const rhoBC = pairMatrix(swap(w(), 0, 2)); // move Alice to the end, then lose her
  const want = [[1 / 3, 0, 0, 0], [0, 1 / 3, 1 / 3, 0], [0, 1 / 3, 1 / 3, 0], [0, 0, 0, 0]];
  rhoBC.forEach((row, i) => row.forEach((x, j) => closeC(x, q.c(want[i][j]))));
  // x|00> + y Ψ+ has a·d − b·c = −y²/2: a product state only when y = 0. So the range holds one product state, not two.
  for (const [x, y] of [[1, 0.3], [0.2, -1], [0.7, 0.7], [-1, 2]]) {
    const v = vec([x, y * s2, y * s2, 0]);
    close(q.sub(q.mul(v[0], v[3]), q.mul(v[1], v[2])).re, -(y * y) / 2);
  }
  // GHZ's leftover range is spanned by |00> and |11>: x|00> + y|11> has a·d − b·c = xy, so |00> and |11> are both products.
  const g = pairMatrix(swap(ghz(), 0, 2));
  g.forEach((row, i) => row.forEach((x, j) => closeC(x, q.c(i === j && (i === 0 || i === 3) ? 0.5 : 0))));
});

test("lose Carol's qubit: GHZ leaves ½(|00><00| + |11><11|), unentangled; W leaves ⅔|Ψ+><Ψ+| + ⅓|00><00|, entangled", () => {
  const g = pairMatrix(ghz()), v = pairMatrix(w());
  g.forEach((row, i) => row.forEach((x, j) => closeC(x, q.c(i === j && (i === 0 || i === 3) ? 0.5 : 0))));
  const want = [[1 / 3, 0, 0, 0], [0, 1 / 3, 1 / 3, 0], [0, 1 / 3, 1 / 3, 0], [0, 0, 0, 0]];
  v.forEach((row, i) => row.forEach((x, j) => closeC(x, q.c(want[i][j]))));
  // Same as 2/3 Ψ+ + 1/3 |00> built from the outer products.
  const outer = (a: q.State) => a.map((x) => a.map((y) => q.mul(x, q.conj(y))));
  const mixed = outer(PSI_P).map((row, i) => row.map((x, j) => q.add(q.scale(x, 2 / 3), q.scale(outer(vec([1, 0, 0, 0]))[i][j], 1 / 3))));
  v.forEach((row, i) => row.forEach((x, j) => closeC(x, mixed[i][j])));
  // Partial transpose on Bob: the {00, 11} block of W's leftover becomes [[1/3, 1/3], [1/3, 0]], with eigenvalue (1 − √5)/6 < 0.
  // A negative eigenvalue after partial transpose proves entanglement (Peres). GHZ's leftover is diagonal, so it has none.
  const pt = (m: q.Matrix) => m.map((row, i) => row.map((_, j) => m[(i & 2) | (j & 1)][(j & 2) | (i & 1)]));
  const vt = pt(v), [a, b, d] = [vt[0][0].re, vt[0][3].re, vt[3][3].re];
  const low = (a + d - Math.sqrt((a - d) ** 2 + 4 * b * b)) / 2;
  close(low, (1 - Math.sqrt(5)) / 6);
  assert.ok(low < 0);
  pt(g).forEach((row, i) => row.forEach((x, j) => { if (i !== j) closeC(x, q.c(0)); else assert.ok(x.re >= 0); }));
  // Concurrence of an X-shaped state: 2 max(0, |ρ14| − √(ρ22 ρ33), |ρ23| − √(ρ11 ρ44)). W: 2/3, so C² = 4/9 (DVC). GHZ: 0.
  const cx = (m: q.Matrix) => 2 * Math.max(0, q.abs(m[0][3]) - Math.sqrt(m[1][1].re * m[2][2].re), q.abs(m[1][2]) - Math.sqrt(m[0][0].re * m[3][3].re));
  close(cx(v), 2 / 3); close(cx(v) ** 2, 4 / 9); close(cx(g), 0);
});

test('measuring a qubit is a one-way step: after Carol measures, the 3-tangle is 0 and her qubit stands apart', () => {
  for (const k of KINDS) for (const b of BASES) for (const r of BITS) {
    const s = turnTo(stateOf(k), CAROL, b);
    const after = q.normalize(s.map((a, i) => ((i & 1) === r ? a : q.c(0))));
    close(tangle(after), 0);
    close(q.abs(det2(oneQubit(after, CAROL))), 0);
  }
});

test('two qubits have one kind: an invertible local filter turns any entangled cos d|00> + sin d|11> into a Bell pair', () => {
  for (const d of [0.05, 0.3, 0.6, Math.PI / 4]) {
    const s = vec([Math.cos(d), 0, 0, Math.sin(d)]);
    const filter: q.Matrix = [[q.c(Math.sin(d)), q.c(0)], [q.c(0), q.c(Math.cos(d))]];
    sameRay(q.normalize(q.apply1(s, filter, 0, 2)), PHI_P);
    assert.ok(q.abs(det2(filter)) > 0);
  }
});

test('a random three-qubit state is GHZ kind (W kind has measure zero, DVC): seeded samples all have 3-tangle > 0', () => {
  const r = q.rng(21);
  for (let t = 0; t < 50; t++) {
    const s = q.normalize(Array.from({ length: 8 }, () => q.c(2 * r() - 1, 2 * r() - 1)));
    assert.ok(tangle(s) > 1e-6);
  }
});

// ---- Words the tool shows

test('chanceText: simple fractions, always and never', () => {
  assert.equal(chanceText(1), 'always'); assert.equal(chanceText(0), 'never');
  assert.equal(chanceText(0.5), '1 in 2'); assert.equal(chanceText(2 / 3), '2 in 3'); assert.equal(chanceText(1 / 3), '1 in 3');
  assert.equal(chanceText(5 / 6), '5 in 6'); assert.equal(chanceText(0.5000000000000001), '1 in 2');
  assert.equal(chanceText(1 - 1e-15), 'always'); assert.equal(chanceText(0.123456), '12%');
});

test('ketText: exact kets for ±1/√k amplitudes, decimals otherwise, true minus signs', () => {
  assert.equal(ketText(vec([1, 0, 0, 0])), '|00⟩');
  assert.equal(ketText(PHI_M), '(|00⟩ − |11⟩)/√2');
  assert.equal(ketText(PSI_M), '(|01⟩ − |10⟩)/√2');
  assert.equal(ketText(afterCarol('w', 'X', 1).pair), '(−|00⟩ + |01⟩ + |10⟩)/√3');
  assert.equal(ketText(vec([0.6, 0, 0, -0.8])), '0.60|00⟩ − 0.80|11⟩');
});

test('names, odds, pair lines and lessons for every setting', () => {
  assert.equal(basisName('Z'), '0/1'); assert.equal(basisName('X'), '+/−');
  assert.equal(resultName('Z', 1), '1'); assert.equal(resultName('X', 0), '+'); assert.equal(resultName('X', 1), '−');
  assert.equal(carolOdds('ghz', 'Z'), '1 in 2 each'); assert.equal(carolOdds('w', 'Z'), '2 in 3 and 1 in 3'); assert.equal(carolOdds('w', 'X'), '1 in 2 each');
  assert.equal(pairLine('w', 'Z', 0), 'Alice and Bob now share (|01⟩ + |10⟩)/√2: a Bell pair, fully entangled.');
  assert.equal(pairLine('ghz', 'Z', 1), 'Alice and Bob now share |11⟩: not entangled.');
  assert.equal(lesson('ghz', 'Z'), 'Whatever Carol gets, Alice and Bob are left with no entanglement.');
  assert.equal(lesson('ghz', 'X'), 'Whatever Carol gets, Alice and Bob are left with a Bell pair.');
  assert.equal(lesson('w', 'Z'), 'If Carol gets 0, Alice and Bob are left with a Bell pair; if she gets 1, with no entanglement.');
  assert.equal(lesson('w', 'X'), 'Whatever Carol gets, Alice and Bob are left with some entanglement, less than a Bell pair.');
});

test('readout: odds before runs; counts, expectations and the lesson after; full at MAX', () => {
  // Every readout names the start state.
  for (const k of KINDS) for (const b of BASES) assert.ok(readout(k, b, []).startsWith(`Started as ${k === 'ghz' ? 'GHZ, (|000⟩ + |111⟩)/√2' : 'W, (|001⟩ + |010⟩ + |100⟩)/√3'}. Carol measures in ${basisName(b)}.`));
  assert.match(readout('w', 'Z', []), /gets 0 with chance 2 in 3, leaving Alice and Bob \(\|01⟩ \+ \|10⟩\)\/√2/);
  const runs: Run[] = [{ carol: 0, basis: 'Z', alice: 0, bob: 1 }, { carol: 1, basis: 'X', alice: 1, bob: 0 }];
  const txt = readout('w', 'Z', runs);
  assert.match(txt, /2 runs\. Carol got 0 in 1 and 1 in 1 \(Born rule: 2 in 3 and 1 in 3\)\./);
  assert.match(txt, /After 0, Alice and Bob matched 0 of 1 times in 0\/1 \(expected never\)\./);
  assert.match(txt, /After 1, Alice and Bob matched 0 of 1 times in \+\/− \(expected 1 in 2\)\./);
  assert.doesNotMatch(txt, /NaN|undefined|full/);
  const many = Array.from({ length: MAX }, (_, i) => run('ghz', 'X', abBasisFor(i), q.rng(i + 1)));
  assert.match(readout('ghz', 'X', many), /The boxes are full/);
});
