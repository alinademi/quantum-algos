import test from 'node:test';
import assert from 'node:assert/strict';
import * as q from '../quantum.ts';
import * as e from './epr.ts';

const close = (a: number, b: number, eps = 1e-12) => assert.ok(Math.abs(a - b) < eps, `${a} != ${b}`);
const closeAll = (a: number[], b: number[], eps = 1e-12) => { assert.equal(a.length, b.length); a.forEach((x, i) => close(x, b[i], eps)); };
const closeState = (a: q.State, b: q.State) => closeAll(a.flatMap((x) => [x.re, x.im]), b.flatMap((x) => [x.re, x.im]));
const sum = (xs: number[]) => xs.reduce((t, x) => t + x, 0);
/** Same state up to a global phase: |<a|b>| = 1 for unit vectors. */
const sameRay = (a: q.State, b: q.State) => close(q.abs(q.inner(a, b)), 1);
const S2 = Math.SQRT1_2;
const angles = [0, Math.PI / 6, Math.PI / 4, Math.PI / 3, Math.PI / 2, 2 * Math.PI / 3, Math.PI, 0.37, 2.9, -1.2, 4.4];
const pairs: [e.Setting, e.Setting][] = e.SETTINGS.flatMap((a) => e.SETTINGS.map((b) => [a, b] as [e.Setting, e.Setting]));
const Z = 0, X = Math.PI / 2;
/** Sampling check: count/shots within 5 standard errors of p. */
const near = (count: number, shots: number, p: number) => {
  const tol = 5 * Math.sqrt(Math.max(p * (1 - p), 1e-9) / shots) + 1e-9;
  assert.ok(Math.abs(count / shots - p) <= tol, `${count}/${shots} = ${count / shots}, expected ${p} +- ${tol}`);
};

test('singlet: |11>, then H on qubit 0, then CNOT 0 -> 1 gives (|01> - |10>)/sqrt2, a unit vector', () => {
  const psi = e.singlet();
  closeState(psi, [q.c(0), q.c(S2), q.c(-S2), q.c(0)]);
  close(q.norm2(psi), 1);
});

test('singlet is entangled: its amplitude matrix [[a, b], [c, d]] has ad - bc = 1/2, while a product state has 0', () => {
  const [a, b, c, d] = e.singlet();
  const det = q.sub(q.mul(a, d), q.mul(b, c));
  close(det.re, 0.5); close(det.im, 0);
});

test('up and down along an axis: Z gives |0>, |1>; X gives |+>, -|->; always an orthonormal pair', () => {
  closeState(e.along(Z, 0), q.ket0());
  closeState(e.along(Z, 1), q.ket1());
  closeState(e.along(X, 0), q.plus());
  closeState(e.along(X, 1), q.minus().map((a) => q.scale(a, -1)));
  for (const t of angles) {
    const u = e.along(t, 0), d = e.along(t, 1);
    close(q.norm2(u), 1); close(q.norm2(d), 1); close(q.abs(q.inner(u, d)), 0);
    closeAll(q.bloch(u), [Math.sin(t), 0, Math.cos(t)]);
    closeAll(q.bloch(d), [-Math.sin(t), 0, -Math.cos(t)]);
  }
});

test('singlet has the same form along every axis: (up down - down up)/sqrt2 is exactly the singlet', () => {
  for (const t of angles) {
    const u = e.along(t, 0), d = e.along(t, 1);
    const form = q.tensor(u, d).map((x, i) => q.scale(q.sub(x, q.tensor(d, u)[i]), S2));
    closeState(form, e.singlet());
  }
});

test('singlet is unchanged when both qubits get the same rotation (up to a global phase for RX and RZ)', () => {
  for (const t of angles) for (const g of [q.RY(t), q.RX(t), q.RZ(t)]) {
    const turned = q.apply1(q.apply1(e.singlet(), g, 0), g, 1);
    sameRay(turned, e.singlet());
  }
  for (const t of angles) closeState(q.apply1(q.apply1(e.singlet(), q.RY(t), 0), q.RY(t), 1), e.singlet());
});

test('Born rule: the four joint odds lie in [0, 1] and sum to 1 for any two axes', () => {
  for (const ta of angles) for (const tb of angles) {
    const p = e.jointAt(e.singlet(), ta, tb);
    p.forEach((x) => assert.ok(x >= 0 && x <= 1));
    close(sum(p), 1);
  }
});

test('joint odds match the closed form: both up sin^2(theta/2)/2, opposite cos^2(theta/2)/2 each', () => {
  for (const ta of angles) for (const tb of angles) closeAll(e.jointAt(e.singlet(), ta, tb), e.jointClosed(ta, tb));
  for (const ta of angles) for (const tb of angles) close(e.opposite(e.jointAt(e.singlet(), ta, tb)), Math.cos((ta - tb) / 2) ** 2);
});

test('known values (Zwiebach 8.05, section 5): P(z up, x up) = 1/4, P(a up, -a up) = 1/2, same axis never both up', () => {
  close(e.jointAt(e.singlet(), Z, X)[0], 0.25);
  for (const t of angles) close(e.jointAt(e.singlet(), t, t + Math.PI)[0], 0.5);
  for (const t of angles) closeAll(e.jointAt(e.singlet(), t, t), [0, 0.5, 0.5, 0]);
});

test('tool settings: same setting gives opposite results every time; Z with X gives all four results 1/4 each', () => {
  for (const [a, b] of pairs) {
    const p = e.quantumJoint(a, b);
    if (a === b) { closeAll(p, [0, 0.5, 0.5, 0]); assert.equal(p[0], 0); assert.equal(p[3], 0); assert.equal(e.opposite(p), 1); }
    else { closeAll(p, [0.25, 0.25, 0.25, 0.25]); close(e.opposite(p), 0.5); }
  }
});

test('symmetry: odds depend only on the angle between the axes, and swapping Alice and Bob swaps the results', () => {
  for (const ta of angles) for (const tb of angles) {
    const p = e.jointAt(e.singlet(), ta, tb);
    closeAll(e.jointAt(e.singlet(), ta + 0.8, tb + 0.8), p);
    const s = e.jointAt(e.singlet(), tb, ta);
    closeAll([s[0], s[2], s[1], s[3]], p);
  }
});

test('no signaling: each side alone gets up with chance 1/2, whatever the other side measures', () => {
  for (const ta of angles) for (const tb of angles) {
    const p = e.jointAt(e.singlet(), ta, tb);
    close(p[0] + p[1], 0.5); close(p[0] + p[2], 0.5);
  }
  for (const ta of angles) for (const r of e.RESULTS) close(e.aliceChance(e.singlet(), ta, r), 0.5);
});

test('Alice measures first: her result leaves Bob with the opposite state along her axis', () => {
  for (const ta of angles) for (const r of e.RESULTS) {
    const bob = e.bobAfter(e.singlet(), ta, r);
    close(q.norm2(bob), 1);
    sameRay(bob, e.along(ta, e.flip(r)));
    assert.equal(e.chance(bob, ta, e.flip(r)), 1);
    assert.equal(e.chance(bob, ta, r), 0);
  }
});

test('Alice first, then Bob: chance of her result times his gives the joint odds, so the order does not matter', () => {
  for (const ta of angles) for (const tb of angles) for (const a of e.RESULTS) for (const b of e.RESULTS) {
    const psi = e.singlet();
    close(e.aliceChance(psi, ta, a) * e.chance(e.bobAfter(psi, ta, a), tb, b), e.jointAt(psi, ta, tb)[2 * a + b]);
  }
});

test("after Alice's Z result Bob is sure for Z and 50/50 for X; after her X result, the other way round", () => {
  for (const r of e.RESULTS) {
    const afterZ = e.bobAfter(e.singlet(), Z, r), afterX = e.bobAfter(e.singlet(), X, r);
    assert.equal(Math.abs(e.spinMean(afterZ, Z)), 1); close(e.spinMean(afterZ, X), 0);
    assert.equal(Math.abs(e.spinMean(afterX, X)), 1); close(e.spinMean(afterX, Z), 0);
  }
});

test('no qubit state is sure for both Z and X: <Z>^2 + <X>^2 <= 1, so a sure Z means a 50/50 X', () => {
  for (let i = 0; i <= 24; i++) for (let j = 0; j < 24; j++) {
    const theta = (Math.PI * i) / 24, phi = (2 * Math.PI * j) / 24, s = q.fromBloch(theta, phi);
    const mz = e.spinMean(s, Z), mx = e.spinMean(s, X);
    close(mz, Math.cos(theta)); close(mx, Math.sin(theta) * Math.cos(phi));
    assert.ok(mz * mz + mx * mx <= 1 + 1e-12);
    if (Math.abs(mz) === 1) close(mx, 0);
  }
});

test('spin mean is chance of up minus chance of down, and up and down chances sum to 1 for any state', () => {
  const states = [q.ket0(), q.ket1(), q.plus(), q.minus(), [q.c(S2), q.c(0, S2)], ...angles.map((t) => e.along(t, 0))];
  for (const s of states) for (const t of angles) {
    close(e.chance(s, t, 0) + e.chance(s, t, 1), 1);
    close(e.spinMean(s, t), q.bloch(s)[0] * Math.sin(t) + q.bloch(s)[2] * Math.cos(t));
  }
});

test('hidden answers: four distinct cards, and every card gives opposite answers when both use the same setting', () => {
  assert.equal(new Set(e.CARDS.map((c) => `${c.Z}${c.X}`)).size, 4);
  for (const card of e.CARDS) for (const s of e.SETTINGS) {
    const r = e.read(card, s, s);
    assert.equal(r.a, e.flip(r.b));
  }
});

test('for Z and X only, the hidden-answer model gives exactly the odds of quantum theory', () => {
  for (const [a, b] of pairs) {
    const h = e.hiddenJoint(a, b);
    close(sum(h), 1);
    closeAll(h, e.quantumJoint(a, b));
    closeAll(e.theory('hidden', a, b), e.theory('quantum', a, b));
  }
});

test('beyond Z and X no card model fits (Bell, 1964): axes 120 degrees apart give 1/4 opposite, cards give at least 1/3', () => {
  const axes = [0, (2 * Math.PI) / 3, (4 * Math.PI) / 3];
  const diff: [number, number][] = [];
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) if (i !== j) diff.push([i, j]);
  // Quantum theory: opposite results with chance cos^2(60 degrees) = 1/4 for every pair of different axes.
  for (const [i, j] of diff) close(e.opposite(e.jointAt(e.singlet(), axes[i], axes[j])), 0.25);
  // A card sets Alice's answer for each of the three axes; Bob's card is the opposite, so the results are opposite
  // when Alice's card has equal answers on the two axes. Among three bits two always agree: at least 2 of the 6 pairs.
  let least = 1;
  for (let k = 0; k < 8; k++) {
    const card = [0, 1, 2].map((i) => (k >> i) & 1);
    least = Math.min(least, diff.filter(([i, j]) => card[i] === card[j]).length / diff.length);
  }
  close(least, 1 / 3);
  // A random card is a mix of these eight, so its average is at least 1/3 too, never 1/4.
  assert.ok(least > 0.25);
});

test('sampled quantum pairs: same setting is opposite every time; otherwise the counts follow the Born rule', () => {
  const rand = q.rng(7), N = 3000;
  for (const [a, b] of pairs) {
    const counts = [0, 0, 0, 0];
    for (let k = 0; k < N; k++) { const r = e.quantumPair(a, b, rand); counts[2 * r.a + r.b]++; }
    const p = e.quantumJoint(a, b);
    if (a === b) assert.equal(counts[0] + counts[3], 0);
    counts.forEach((n, i) => near(n, N, p[i]));
    near(counts[0] + counts[2], N, 0.5);
  }
});

test('sampled hidden pairs: same counts as the model, and pair() picks the source', () => {
  const rand = q.rng(11), N = 3000;
  for (const [a, b] of pairs) {
    const counts = [0, 0, 0, 0];
    for (let k = 0; k < N; k++) { const r = e.pair('hidden', a, b, rand); counts[2 * r.a + r.b]++; }
    const p = e.hiddenJoint(a, b);
    if (a === b) assert.equal(counts[0] + counts[3], 0);
    counts.forEach((n, i) => near(n, N, p[i]));
  }
  // rand() just below 1 still picks a card.
  assert.deepEqual(e.hiddenPair('Z', 'Z', () => 0.9999999999999999), { a: 1, b: 0 });
  assert.deepEqual(e.hiddenPair('X', 'Z', () => 0), { a: 0, b: 1 });
});

test('words: results and settings', () => {
  assert.equal(e.resultName(0), 'up'); assert.equal(e.resultName(1), 'down');
  assert.equal(e.settingWords('Z'), 'Z (upright)'); assert.equal(e.settingWords('X'), 'X (on its side)');
  assert.equal(e.flip(0), 1); assert.equal(e.flip(1), 0);
});
