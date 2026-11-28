import test from 'node:test';
import assert from 'node:assert/strict';
import * as q from '../quantum.ts';
import {
  cosd, sind, idx, bitOf, shareGate, bellWithBob, stateOf, branches, pairTangle, pairConcurrence, formation, oneQubit, focusTangle,
  threeTangle, budget, turn, chances, matchChance, basisFor, newRun, outcome, results, tally, num, percent, ketLine, madeText,
  sliderText, budgetText, lesson, countText, readout, basisName, NAME, PRESETS, MAX, STRIP, ALICE, BOB, CAROL,
  type Run, type Kind, type Basis,
} from './monogamy.ts';

const close = (a: number, b: number, eps = 1e-12) => assert.ok(Math.abs(a - b) < eps, `${a} != ${b}`);
const closeC = (a: q.C, b: q.C, eps = 1e-12) => { close(a.re, b.re, eps); close(a.im, b.im, eps); };
const closeS = (a: q.State, b: q.State, eps = 1e-12) => { assert.equal(a.length, b.length); a.forEach((x, i) => closeC(x, b[i], eps)); };

const S2 = Math.SQRT1_2;
const W = [0, 1, 1, 0, 1, 0, 0, 0].map((x) => q.c(x / Math.sqrt(3)));
const GHZ = [1, 0, 0, 0, 0, 0, 0, 1].map((x) => q.c(x * S2));
const ANGLES = [0, 1, 10, 30, 45, 60, 80, 89, 90];
/** The three-qubit state as the test writes it by hand: (|000> + cos t|110> + sin t|101>)/√2. */
const byHand = (deg: number): q.State => {
  const s = Array.from({ length: 8 }, () => q.c(0));
  s[idx(0, 0, 0)] = q.c(S2); s[idx(1, 1, 0)] = q.c(S2 * cosd(deg)); s[idx(1, 0, 1)] = q.c(S2 * sind(deg));
  return s;
};
/** A seeded random pure state of three qubits with complex amplitudes. */
const randState = (r: () => number): q.State => q.normalize(Array.from({ length: 8 }, () => q.c(2 * r() - 1, 2 * r() - 1)));
/** A seeded random 2x2 unitary: global phase, then RZ RY RZ. */
const randU = (r: () => number): q.Matrix => {
  const g = q.expi(6.3 * r());
  return q.matMul(q.matMul(q.RZ(6.3 * r()), q.RY(6.3 * r())), q.RZ(6.3 * r())).map((row) => row.map((x) => q.mul(g, x)));
};
/** Swap qubits i and j of a 3-qubit state. */
const swap = (s: q.State, i: number, j: number): q.State => s.map((_, x) => {
  const bi = (x >> (2 - i)) & 1, bj = (x >> (2 - j)) & 1;
  return s[bi === bj ? x : x ^ ((1 << (2 - i)) | (1 << (2 - j)))];
});
/** 4 det of one qubit's reduced state, the tangle of that qubit with the other two together (CKW Eq. 12). */
const focus = (s: q.State, k: number) => focusTangle(s, k);
const tau = (s: q.State, p: number, r: number) => pairTangle(s, p, r);

// ---- Angles and indices

test('cosd and sind are exact at 0, 45 and 90 degrees and match Math elsewhere', () => {
  assert.equal(cosd(0), 1); assert.equal(sind(0), 0);
  assert.equal(cosd(90), 0); assert.equal(sind(90), 1);
  assert.equal(cosd(45), S2); assert.equal(sind(45), S2);
  close(cosd(30), Math.sqrt(3) / 2); close(sind(30), 0.5);
  for (const d of ANGLES) close(cosd(d) ** 2 + sind(d) ** 2, 1);
});

test('idx and bitOf: Alice is the left bit, Carol the right bit', () => {
  assert.equal(idx(1, 0, 0), 4); assert.equal(idx(0, 1, 0), 2); assert.equal(idx(0, 0, 1), 1); assert.equal(idx(1, 1, 1), 7);
  for (let i = 0; i < 8; i++) assert.equal(idx(bitOf(i, ALICE), bitOf(i, BOB), bitOf(i, CAROL)), i);
  assert.deepEqual([ALICE, BOB, CAROL], [0, 1, 2]);
});

// ---- The states

test('Alice and Bob start as 000, then a Hadamard gate and a CNOT: the Bell pair, Carol still 0', () => {
  closeS(bellWithBob(), byHand(0));
  closeS(stateOf('pass', 0), [q.c(S2), q.c(0), q.c(0), q.c(0), q.c(0), q.c(0), q.c(S2), q.c(0)]);
});

test('the gate G(t) is unitary: it keeps the norm, and G(-t) undoes G(t)', () => {
  const r = q.rng(7);
  for (const d of [0, 17, 45, 90, 133]) {
    const s = randState(r);
    close(q.norm2(shareGate(s, d)), 1);
    closeS(shareGate(shareGate(s, d), -d), s, 1e-12);
  }
});

test('G(a) then G(b) is G(a + b): a rotation', () => {
  const r = q.rng(8);
  for (const [a, b] of [[10, 20], [30, 60], [45, 45], [25, -70]]) {
    const s = randState(r);
    closeS(shareGate(shareGate(s, a), b), shareGate(s, a + b));
  }
});

test('G(t) never touches Alice: her one-qubit state is the same before and after', () => {
  const r = q.rng(9);
  for (const d of [12, 45, 77]) {
    const s = randState(r), t = shareGate(s, d), a = oneQubit(s, ALICE), b = oneQubit(t, ALICE);
    for (const i of [0, 1]) for (const j of [0, 1]) closeC(a[i][j], b[i][j]);
  }
});

test('the pass state is (|000> + cos t|110> + sin t|101>)/√2 for every angle', () => {
  for (const d of ANGLES) closeS(stateOf('pass', d), byHand(d));
  closeS(stateOf('pass', 45), [S2, 0, 0, 0, 0, 0.5, 0.5, 0].map((x) => q.c(x)));
});

test('at 90 degrees G moves Bob\'s 1 to Carol: Alice and Carol are the Bell pair, Bob is 0', () => {
  const s = stateOf('pass', 90);
  close(s[idx(0, 0, 0)].re, S2); close(s[idx(1, 0, 1)].re, S2);
  close(q.norm2(s.filter((_, i) => i !== idx(0, 0, 0) && i !== idx(1, 0, 1))), 0);
});

test('GHZ is (|000> + |111>)/√2: a Hadamard gate, then CNOTs from Alice to Bob and to Carol', () => {
  closeS(stateOf('ghz', 0), GHZ);
  closeS(stateOf('ghz', 55), GHZ);
});

test('every state is a unit vector', () => {
  for (const d of ANGLES) close(q.norm2(stateOf('pass', d)), 1);
  close(q.norm2(stateOf('ghz', 0)), 1);
});

// ---- Tangles: known values

test('known two-qubit values: a Bell pair has tangle 1, a product has 0', () => {
  const bellAC = stateOf('pass', 90);
  close(tau(bellAC, ALICE, CAROL), 1); close(pairConcurrence(bellAC, ALICE, CAROL), 1);
  close(tau(bellAC, ALICE, BOB), 0);
  const product = q.tensor(q.tensor(q.plus(), q.ket1()), q.minus());
  for (const [p, r] of [[0, 1], [0, 2], [1, 2]]) close(tau(product, p, r), 0);
});

test('GHZ: every pair has tangle 0, the three-way tangle is 1, and Alice with the rest is 1 (CKW, after Eq. 24)', () => {
  for (const [p, r] of [[0, 1], [0, 2], [1, 2]]) close(tau(GHZ, p, r), 0);
  close(threeTangle(GHZ), 1);
  for (const k of [0, 1, 2]) close(focus(GHZ, k), 1);
});

test('W: each pair touching a qubit has tangle 4/9, the three-way tangle is 0, and the pairs fill the limit 8/9', () => {
  for (const [p, r] of [[0, 1], [0, 2], [1, 2]]) close(tau(W, p, r), 4 / 9);
  close(threeTangle(W), 0);
  close(focus(W, ALICE), 8 / 9);
  close(tau(W, 0, 1) + tau(W, 0, 2), focus(W, ALICE));
});

test('CKW Eq. 15 family with alpha = 1/√2, beta = gamma = 1/2: each pair has tangle 1/2 and entanglement of formation 0.601', () => {
  const s = [0, 0.5, 0.5, 0, S2, 0, 0, 0].map((x) => q.c(x)); // |001>/2 + |010>/2 + |100>/√2
  close(q.norm2(s), 1);
  close(tau(s, ALICE, BOB), 0.5); close(tau(s, ALICE, CAROL), 0.5);
  close(Math.round(formation(tau(s, ALICE, BOB)) * 1000) / 1000, 0.601, 1e-12);
});

test('the pass family: tangle with Bob is cos² t, with Carol sin² t, three-way 0, and the two fill Alice\'s limit of 1', () => {
  for (const d of ANGLES) {
    const b = budget('pass', d);
    close(b.bob, cosd(d) ** 2); close(b.carol, sind(d) ** 2);
    close(b.three, 0); close(b.limit, 1); close(b.bob + b.carol, b.limit);
  }
});

test('the pass family: Bob and Carol\'s tangle with each other is cos² t sin² t (X-state concurrence, worked by hand)', () => {
  for (const d of ANGLES) close(tau(stateOf('pass', d), BOB, CAROL), (cosd(d) * sind(d)) ** 2);
});

test('budget for GHZ: no pair tangle at all, all of Alice\'s limit is three-way', () => {
  assert.deepEqual(budget('ghz', 0), { bob: 0, carol: 0, three: 1, limit: 1 });
});

test('Alice alone looks like a fair coin in every tool state: her reduced state is I/2', () => {
  for (const d of ANGLES) {
    const m = oneQubit(stateOf('pass', d), ALICE);
    closeC(m[0][0], q.c(0.5)); closeC(m[1][1], q.c(0.5)); closeC(m[0][1], q.c(0)); closeC(m[1][0], q.c(0));
  }
  const g = oneQubit(GHZ, ALICE);
  closeC(g[0][0], q.c(0.5)); closeC(g[1][1], q.c(0.5)); closeC(g[0][1], q.c(0));
});

// ---- Tangles: the laws

test('CKW Eq. 24 on random states: tangle(A,B) + tangle(A,C) + three-way = 4 det of Alice, and the same for Bob and Carol', () => {
  const r = q.rng(2000);
  for (let n = 0; n < 150; n++) {
    const s = randState(r), t3 = threeTangle(s);
    close(tau(s, 0, 1) + tau(s, 0, 2) + t3, focus(s, 0), 1e-9);
    close(tau(s, 1, 0) + tau(s, 1, 2) + t3, focus(s, 1), 1e-9);
    close(tau(s, 2, 0) + tau(s, 2, 1) + t3, focus(s, 2), 1e-9);
  }
});

test('CKW Eqs. 8 and 20 on random states: the pair tangle is 2(det A + det B - det C) minus half the three-way tangle', () => {
  const r = q.rng(2001);
  const det = (s: q.State, k: number) => focus(s, k) / 4;
  for (let n = 0; n < 150; n++) {
    const s = randState(r);
    close(tau(s, 0, 1), 2 * (det(s, 0) + det(s, 1) - det(s, 2)) - threeTangle(s) / 2, 1e-9);
    close(tau(s, 0, 2), 2 * (det(s, 0) + det(s, 2) - det(s, 1)) - threeTangle(s) / 2, 1e-9);
  }
});

test('monogamy (CKW Eq. 11 and 12): the two pair tangles add up to at most 4 det of Alice, which is at most 1', () => {
  const r = q.rng(2002);
  for (let n = 0; n < 300; n++) {
    const s = randState(r), sum = tau(s, 0, 1) + tau(s, 0, 2);
    assert.ok(sum <= focus(s, 0) + 1e-9, `${sum} > ${focus(s, 0)}`);
    assert.ok(focus(s, 0) <= 1 + 1e-12 && focus(s, 0) >= -1e-12);
    assert.ok(threeTangle(s) >= -1e-12 && threeTangle(s) <= 1 + 1e-9);
  }
});

test('a Bell pair leaves nothing for a third qubit: tangle 1 with Bob forces tangle 0 with Carol, and no correlation at all', () => {
  const s = stateOf('pass', 0);
  close(tau(s, ALICE, BOB), 1); close(tau(s, ALICE, CAROL), 0);
  // the pair is a pure state, so Carol is a product factor: Alice's joint odds with Carol are the product of their own odds
  for (const b of ['Z', 'X'] as Basis[]) close(matchChance('pass', 0, b, CAROL), 0.5);
  const r = q.rng(2003);
  for (let n = 0; n < 50; n++) { // the same for any pure Bell-type pair: a random local unitary on each of Alice and Bob
    let t = q.cnot(q.apply1(q.tensor(q.tensor(q.ket0(), q.ket0()), q.fromBloch(2 * r(), 6 * r())), q.H, 0, 3), 0, 1, 3);
    t = q.apply1(q.apply1(t, randU(r), 0, 3), randU(r), 1, 3);
    close(tau(t, 0, 1), 1, 1e-9); close(tau(t, 0, 2), 0, 1e-9); close(tau(t, 1, 2), 0, 1e-9);
  }
});

test('a pure pair with Carol left out: tangle is 4 det of Alice (CKW, after Eq. 2)', () => {
  const r = q.rng(2004);
  for (let n = 0; n < 50; n++) {
    const ab = q.normalize(Array.from({ length: 4 }, () => q.c(2 * r() - 1, 2 * r() - 1))), carol = q.fromBloch(3 * r(), 6 * r());
    const s = q.tensor(ab, carol);
    close(tau(s, 0, 1), focus(s, 0), 1e-9);
    close(tau(s, 0, 2), 0, 1e-9);
  }
});

test('tangles do not change under a local unitary, and do not depend on the order of the two qubits', () => {
  const r = q.rng(2005);
  for (let n = 0; n < 40; n++) {
    const s = randState(r), t = q.apply1(q.apply1(s, randU(r), 1, 3), randU(r), 2, 3);
    close(tau(t, 0, 1), tau(s, 0, 1), 1e-9); close(tau(t, 0, 2), tau(s, 0, 2), 1e-9); close(tau(t, 1, 2), tau(s, 1, 2), 1e-9);
    close(threeTangle(t), threeTangle(s), 1e-9);
    close(tau(s, 0, 1), tau(s, 1, 0), 1e-12);
    close(tau(s, 1, 2), tau(s, 2, 1), 1e-12);
  }
});

test('the three-way tangle is the same whichever qubits swap places', () => {
  const r = q.rng(2006);
  for (let n = 0; n < 30; n++) {
    const s = randState(r), t = threeTangle(s);
    close(threeTangle(swap(s, 0, 1)), t, 1e-9); close(threeTangle(swap(s, 1, 2)), t, 1e-9); close(threeTangle(swap(s, 0, 2)), t, 1e-9);
  }
});

test('branches: the pair state is the sum of two projectors, one for each result of the third qubit', () => {
  const [v0, v1] = branches(GHZ, ALICE, BOB);
  closeS(v0, [q.c(S2), q.c(0), q.c(0), q.c(0)]);
  closeS(v1, [q.c(0), q.c(0), q.c(0), q.c(S2)]);
  const [w0, w1] = branches(W, ALICE, BOB);
  close(q.norm2(w0) + q.norm2(w1), 1);
});

test('entanglement of formation: 0 at tangle 0, 1 at tangle 1, rising, and it does not add up the way the tangle does', () => {
  close(formation(0), 0); close(formation(1), 1);
  let last = -1;
  for (let k = 0; k <= 20; k++) { const e = formation(k / 20); assert.ok(e > last - 1e-12); last = e; }
  // CKW: two pairs of tangle 1/2 each use up all of Alice's tangle, yet hold 2 x 0.601 ebits, more than 1
  const b = budget('pass', 45);
  close(b.bob, 0.5); close(b.carol, 0.5);
  assert.ok(formation(b.bob) + formation(b.carol) > 1.2);
  // every pass state respects the tangle sum, though the ebit sum can pass 1
  for (const d of ANGLES) assert.ok(budget('pass', d).bob + budget('pass', d).carol <= 1 + 1e-12);
});

// ---- Measurements

test('chances: eight strings, adding up to 1, in both tests', () => {
  for (const [k, d] of [['pass', 0], ['pass', 33], ['pass', 45], ['pass', 90], ['ghz', 0]] as [Kind, number][]) {
    for (const b of ['Z', 'X'] as Basis[]) {
      const p = chances(k, d, b);
      assert.equal(p.length, 8);
      close(p.reduce((a, x) => a + x, 0), 1);
    }
  }
});

test('turn: +/− is a Hadamard gate on each of the three qubits, 0/1 changes nothing', () => {
  const s = stateOf('pass', 33);
  closeS(turn(s, 'Z'), s);
  closeS(turn(s, 'X'), [0, 1, 2].reduce((t, k) => q.apply1(t, q.H, k, 3), s));
  closeS(turn(turn(s, 'X'), 'X'), s); // a Hadamard gate is its own undo
});

test('GHZ chances: in 0/1 only 000 and 111, each 1/2; in +/− the four strings with an even number of minus results, each 1/4', () => {
  const z = chances('ghz', 0, 'Z'), x = chances('ghz', 0, 'X');
  close(z[0], 0.5); close(z[7], 0.5); close(z.reduce((a, p) => a + p, 0) - z[0] - z[7], 0);
  x.forEach((p, i) => { const ones = bitOf(i, 0) + bitOf(i, 1) + bitOf(i, 2); close(p, ones % 2 === 0 ? 0.25 : 0); });
});

test('match chances, worked by hand: Z gives (1 + cos² t)/2 for Bob and (1 + sin² t)/2 for Carol; +/− gives (1 + cos t)/2 and (1 + sin t)/2', () => {
  for (const d of ANGLES) {
    const k = cosd(d), n = sind(d);
    close(matchChance('pass', d, 'Z', BOB), (1 + k * k) / 2);
    close(matchChance('pass', d, 'Z', CAROL), (1 + n * n) / 2);
    close(matchChance('pass', d, 'X', BOB), (1 + k) / 2);
    close(matchChance('pass', d, 'X', CAROL), (1 + n) / 2);
  }
});

test('match chances at the three presets: all Bob, an even split, all Carol (started as 000, then H, CNOT, and the gate)', () => {
  assert.deepEqual([PRESETS[0], PRESETS[1], PRESETS[2]], [0, 45, 90]);
  for (const b of ['Z', 'X'] as Basis[]) {
    assert.equal(matchChance('pass', 0, b, BOB), 1); close(matchChance('pass', 0, b, CAROL), 0.5);
    assert.equal(matchChance('pass', 90, b, CAROL), 1); close(matchChance('pass', 90, b, BOB), 0.5);
  }
  close(matchChance('pass', 45, 'Z', BOB), 0.75); close(matchChance('pass', 45, 'Z', CAROL), 0.75);
  close(matchChance('pass', 45, 'X', BOB), (1 + S2) / 2); close(matchChance('pass', 45, 'X', CAROL), (1 + S2) / 2);
});

test('match chances for GHZ: both partners match every time in 0/1, and only half the time in +/−', () => {
  for (const who of [BOB, CAROL] as const) { assert.equal(matchChance('ghz', 0, 'Z', who), 1); close(matchChance('ghz', 0, 'X', who), 0.5); }
});

test('a Bell pair is matched in both tests; a plain shared list is matched in one test only', () => {
  // Bob with Alice at 0 degrees: 1 and 1. GHZ with Bob: 1 and 1/2.
  assert.ok(matchChance('pass', 0, 'Z', BOB) === 1 && matchChance('pass', 0, 'X', BOB) === 1);
  assert.ok(matchChance('ghz', 0, 'Z', BOB) === 1 && matchChance('ghz', 0, 'X', BOB) < 1);
});

test('what Carol gains, Bob loses: in both tests, Bob\'s match chance falls and Carol\'s rises with the angle', () => {
  for (const b of ['Z', 'X'] as Basis[]) {
    let bob = 2, carol = -1;
    for (let d = 0; d <= 90; d += 5) {
      const pb = matchChance('pass', d, b, BOB), pc = matchChance('pass', d, b, CAROL);
      assert.ok(pb <= bob + 1e-12 && pc >= carol - 1e-12); bob = pb; carol = pc;
    }
  }
});

// ---- Runs and the Born rule

test('the tests take turns: run 0 is 0/1, run 1 is +/−, and so on; each basis gets half of the runs', () => {
  assert.deepEqual([0, 1, 2, 3].map(basisFor), ['Z', 'X', 'Z', 'X']);
  assert.equal(STRIP * 2, MAX);
  assert.equal(newRun(0, () => 0.25).basis, 'Z'); assert.equal(newRun(1, () => 0.25).basis, 'X');
  assert.equal(newRun(3, () => 0.25).u, 0.25);
});

test('outcome: a Born rule draw with the run\'s own random number, at the exact edges of each chance', () => {
  const p = chances('pass', 0, 'Z'); // 000 and 110, each 1/2
  assert.equal(outcome(p, 0), idx(0, 0, 0)); assert.equal(outcome(p, 0.4999), idx(0, 0, 0));
  assert.equal(outcome(p, 0.5000001), idx(1, 1, 0)); assert.equal(outcome(p, 0.9999999), idx(1, 1, 0));
});

test('results at 0 degrees, 0/1: u below 1/2 gives 000, above gives 110; Bob always matches, Carol only when Alice read 0', () => {
  const runs: Run[] = [{ u: 0.1, basis: 'Z' }, { u: 0.9, basis: 'Z' }];
  assert.deepEqual(results('pass', 0, runs), [[0, 0, 0], [1, 1, 0]]);
  const t = tally('pass', 0, runs);
  assert.deepEqual(t[BOB].Z, { runs: 2, same: 2 }); assert.deepEqual(t[CAROL].Z, { runs: 2, same: 1 });
  assert.deepEqual(t[BOB].X, { runs: 0, same: 0 });
});

test('results never show a string that cannot happen, whatever the random number (a fine grid of u)', () => {
  for (const [k, d] of [['pass', 0], ['pass', 45], ['pass', 90], ['pass', 20], ['ghz', 0]] as [Kind, number][]) {
    for (const b of ['Z', 'X'] as Basis[]) {
      const p = chances(k, d, b);
      for (let n = 0; n < 2000; n++) assert.ok(p[outcome(p, (n + 0.5) / 2000)] > 1e-9);
    }
  }
});

test('over an even grid of random numbers the match counts equal the Born rule chances (exact, no random draws)', () => {
  const N = 2000;
  for (const [k, d] of [['pass', 0], ['pass', 25], ['pass', 45], ['pass', 90], ['ghz', 0]] as [Kind, number][]) {
    for (const b of ['Z', 'X'] as Basis[]) {
      const runs: Run[] = Array.from({ length: N }, (_, n) => ({ u: (n + 0.5) / N, basis: b }));
      const t = tally(k, d, runs);
      for (const who of [BOB, CAROL] as const) {
        assert.equal(t[who][b].runs, N);
        assert.ok(Math.abs(t[who][b].same / N - matchChance(k, d, b, who)) <= 4 / N, `${k} ${d} ${b} ${who}`);
      }
    }
  }
});

test('a new state re-runs the same draws: each run keeps its u, so only the dots near an edge can flip', () => {
  const runs: Run[] = Array.from({ length: 40 }, (_, n) => ({ u: (n + 0.5) / 40, basis: basisFor(n) }));
  const a = results('pass', 0, runs), b = results('pass', 90, runs);
  assert.equal(a.length, b.length);
  assert.ok(a.some((x, i) => x.join() !== b[i].join()));
  assert.deepEqual(results('pass', 0, runs), a); // same state, same results
});

test('tally counts every run once per partner and splits them by test', () => {
  const runs = Array.from({ length: 11 }, (_, n) => newRun(n, () => 0.3));
  const t = tally('pass', 45, runs);
  for (const who of [BOB, CAROL] as const) {
    assert.equal(t[who].Z.runs, 6); assert.equal(t[who].X.runs, 5);
    assert.ok(t[who].Z.same <= 6 && t[who].X.same <= 5);
  }
});

// ---- Words and numbers

test('num: exact 0 and 1, two decimals, never 0.00 or 1.00 for a value that is not exact', () => {
  assert.equal(num(0), '0'); assert.equal(num(1), '1'); assert.equal(num(1 + 1e-15), '1'); assert.equal(num(1e-15), '0');
  assert.equal(num(0.5), '0.5'); assert.equal(num(0.75), '0.75'); assert.equal(num(0.1), '0.1'); assert.equal(num(4 / 9), '0.44');
  assert.equal(num(0.001), '<0.01'); assert.equal(num(0.999), '>0.99');
});

test('percent: whole numbers, one decimal near the ends, never 0% or 100% for a chance that is not exact', () => {
  assert.equal(percent(0.5), '50%'); assert.equal(percent(1), '100%'); assert.equal(percent(0), '0%');
  assert.equal(percent(0.75), '75%'); assert.equal(percent((1 + S2) / 2), '85%');
  assert.equal(percent(0.0002), '<0.1%'); assert.equal(percent(0.9998), '>99.9%'); assert.equal(percent(0.995), '99.5%');
  assert.equal(percent(1 - 1e-15), '100%');
});

test('ketLine writes the state exactly at the presets and with two decimals between', () => {
  assert.equal(ketLine('pass', 0), '|ψ⟩ = (|000⟩ + |110⟩)/√2');
  assert.equal(ketLine('pass', 90), '|ψ⟩ = (|000⟩ + |101⟩)/√2');
  assert.equal(ketLine('pass', 45), '|ψ⟩ = |000⟩/√2 + (|110⟩ + |101⟩)/2');
  assert.equal(ketLine('ghz', 0), '|ψ⟩ = (|000⟩ + |111⟩)/√2');
  assert.equal(ketLine('pass', 30), '|ψ⟩ ≈ 0.71|000⟩ + 0.61|110⟩ + 0.35|101⟩');
});

test('the ket text matches the real state: the amplitudes it prints are the amplitudes in the state', () => {
  const s = stateOf('pass', 30);
  assert.equal(s[idx(0, 0, 0)].re.toFixed(2), '0.71'); assert.equal(s[idx(1, 1, 0)].re.toFixed(2), '0.61'); assert.equal(s[idx(1, 0, 1)].re.toFixed(2), '0.35');
  const t = stateOf('pass', 45);
  close(t[idx(1, 1, 0)].re, 0.5); close(t[idx(1, 0, 1)].re, 0.5); close(t[idx(0, 0, 0)].re, S2);
});

test('every text names the start state, and uses no em dash', () => {
  for (const [k, d] of [['pass', 0], ['pass', 45], ['pass', 90], ['pass', 31], ['ghz', 0]] as [Kind, number][]) {
    assert.ok(madeText(k, d).startsWith('Started as 000'));
    assert.ok(readout(k, d, []).startsWith('Started as 000'));
    const runs = Array.from({ length: 9 }, (_, n) => newRun(n, () => (n + 0.5) / 9));
    assert.ok(readout(k, d, runs).startsWith('Started as 000'));
    for (const text of [madeText(k, d), budgetText(k, d), lesson(k, d), readout(k, d, runs), readout(k, d, []), sliderText(d), ketLine(k, d)]) {
      assert.ok(!/[—–]/.test(text), text);
    }
  }
});

test('madeText says how each state was made', () => {
  assert.equal(madeText('ghz', 0), 'Started as 000, then a Hadamard gate on Alice and CNOTs from Alice to Bob and from Alice to Carol: GHZ.');
  assert.equal(madeText('pass', 45), "Started as 000, then a Hadamard gate on Alice, a CNOT from Alice to Bob, and Bob and Carol's gate at 45°.");
});

test('budgetText and lesson say what the numbers show', () => {
  assert.ok(budgetText('pass', 0).includes('Alice and Bob 1, Alice and Carol 0'));
  assert.ok(budgetText('pass', 0).includes('Bell pair, so nothing is left for Carol'));
  assert.ok(budgetText('pass', 90).includes('Alice and Carol are a Bell pair, so nothing is left for Bob'));
  assert.ok(budgetText('pass', 45).includes('Alice and Bob 0.5, Alice and Carol 0.5. The two add up to 1'));
  assert.ok(!budgetText('pass', 45).includes('nothing is left'));
  assert.ok(budgetText('ghz', 0).includes('Alice and Bob 0, Alice and Carol 0'));
  assert.ok(budgetText('ghz', 0).includes('All of it is three-way'));
  assert.ok(lesson('pass', 0).startsWith('Bob matches Alice every time in both tests'));
  assert.ok(lesson('pass', 90).startsWith('Carol matches Alice every time in both tests'));
  assert.ok(lesson('pass', 45).includes('What Carol gains, Bob loses'));
  assert.ok(lesson('ghz', 0).includes('plain shared record'));
  assert.ok(lesson('ghz', 0).endsWith('Yet the three +/− results always hold an even number of −: GHZ is entangled, but only all three together.'));
});

test('lesson only says "every time" when the chance is exactly 1 in both tests', () => {
  for (const d of ANGLES) {
    const says = /^(Bob|Carol) matches Alice every time/.test(lesson('pass', d));
    const exact = [BOB, CAROL].some((w) => matchChance('pass', d, 'Z', w) === 1 && matchChance('pass', d, 'X', w) === 1);
    assert.equal(says, exact, `${d}`);
  }
});

test('sliderText speaks the angle and both tangles', () => {
  assert.equal(sliderText(0), '0 degrees. Tangle with Bob 1, with Carol 0.');
  assert.equal(sliderText(45), '45 degrees. Tangle with Bob 0.5, with Carol 0.5.');
  assert.equal(sliderText(90), '90 degrees. Tangle with Bob 0, with Carol 1.');
});

test('countText: counts so far against the Born rule chance', () => {
  assert.equal(countText({ runs: 0, same: 0 }, 0.75), 'Expected to match 75%.');
  assert.equal(countText({ runs: 12, same: 9 }, 0.75), 'Matched 9 of 12, expected 75%.');
});

test('readout lists the runs, the counts per test and the lesson; names and tests are spelled out', () => {
  assert.equal(NAME[BOB], 'Bob'); assert.equal(NAME[CAROL], 'Carol');
  assert.equal(basisName('Z'), '0/1'); assert.equal(basisName('X'), '+/−');
  const runs: Run[] = [{ u: 0.1, basis: 'Z' }, { u: 0.9, basis: 'X' }];
  const text = readout('pass', 0, runs);
  assert.ok(text.includes('2 runs.'));
  assert.ok(text.includes('Bob matched Alice 1 of 1 in 0/1 (expected 100%) and 1 of 1 in +/− (expected 100%).'));
  assert.ok(text.includes('Carol matched Alice'));
  assert.ok(readout('pass', 0, [runs[0]]).includes('1 run.'));
  assert.ok(readout('pass', 0, []).endsWith('Press Run to measure copies.'));
});

test('readout says when the panels are full', () => {
  const runs = Array.from({ length: MAX }, (_, n) => newRun(n, () => 0.5));
  assert.ok(readout('ghz', 0, runs).endsWith('The panels are full. Press Clear to start again.'));
  assert.ok(!readout('ghz', 0, runs.slice(0, MAX - 1)).includes('panels are full'));
});

test('a full set of runs fills each strip exactly', () => {
  const runs = Array.from({ length: MAX }, (_, n) => newRun(n, () => 0.5));
  const t = tally('pass', 45, runs);
  for (const who of [BOB, CAROL] as const) { assert.equal(t[who].Z.runs, STRIP); assert.equal(t[who].X.runs, STRIP); }
});

// ---- Mixed states of three qubits (CKW Eq. 14)

/** v^T (σy ⊗ σy) w for two-qubit vectors. */
const yy = (v: q.State, w: q.State): q.C => q.sub(q.add(q.mul(v[1], w[2]), q.mul(v[2], w[1])), q.add(q.mul(v[0], w[3]), q.mul(v[3], w[0])));
/** Eigenvalues of a real symmetric matrix, by cyclic Jacobi sweeps. */
const eigSym = (a: number[][]): number[] => {
  const n = a.length, m = a.map((r) => r.slice());
  for (let sweep = 0; sweep < 60; sweep++) {
    let off = 0;
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) off += m[i][j] ** 2;
    if (off < 1e-26) break;
    for (let p = 0; p < n; p++) for (let r = p + 1; r < n; r++) {
      if (Math.abs(m[p][r]) < 1e-300) continue;
      const th = (m[r][r] - m[p][p]) / (2 * m[p][r]), t = Math.sign(th || 1) / (Math.abs(th) + Math.sqrt(th * th + 1));
      const c = 1 / Math.sqrt(t * t + 1), s = t * c;
      for (let k = 0; k < n; k++) { const x = m[k][p], y = m[k][r]; m[k][p] = c * x - s * y; m[k][r] = s * x + c * y; }
      for (let k = 0; k < n; k++) { const x = m[p][k], y = m[r][k]; m[p][k] = c * x - s * y; m[r][k] = s * x + c * y; }
    }
  }
  return m.map((r, i) => r[i]);
};
/**
 * Tangle of the pair (p, r) when the three qubits are in the mixture of the given pure states (weights w).
 * Wootters 1998: if rho = sum |v_k><v_k|, the square roots of the eigenvalues of rho rho~ are the singular values of the
 * symmetric matrix M_kl = v_k^T (σy ⊗ σy) v_l. Singular values come from the Hermitian M†M, through a real embedding.
 */
const mixedTangle = (states: q.State[], w: number[], p: number, r: number): number => {
  const v = states.flatMap((s, k) => branches(s, p, r).map((b) => b.map((x) => q.scale(x, Math.sqrt(w[k])))));
  const n = v.length, M = v.map((a) => v.map((b) => yy(a, b)));
  const H = M[0].map((_, i) => M[0].map((__, j) => M.reduce((t, row) => q.add(t, q.mul(q.conj(row[i]), row[j])), q.c(0))));
  const big = Array.from({ length: 2 * n }, (_, i) => Array.from({ length: 2 * n }, (__, j) => {
    const x = H[i % n][j % n], top = i < n, left = j < n;
    return top === left ? x.re : (top ? -x.im : x.im);
  }));
  const ev = eigSym(big).sort((a, b) => b - a).filter((_, i) => i % 2 === 0).map((x) => Math.sqrt(Math.max(0, x)));
  return Math.max(0, ev[0] - ev[1] - (ev[2] ?? 0) - (ev[3] ?? 0)) ** 2;
};

test('the mixed-state helper agrees with the sim on pure states (so the check below means something)', () => {
  const r = q.rng(3000);
  for (let n = 0; n < 20; n++) {
    const s = randState(r);
    close(mixedTangle([s], [1], 0, 1), tau(s, 0, 1), 1e-8); close(mixedTangle([s], [1], 0, 2), tau(s, 0, 2), 1e-8);
  }
  close(mixedTangle([W], [1], 0, 1), 4 / 9, 1e-8);
  close(mixedTangle([GHZ], [1], 0, 1), 0, 1e-8);
  // an equal mix of two Bell pairs with a sign flip is the classical mix of 00 and 11: tangle 0
  const phiM = [S2, 0, 0, -S2].map((x) => q.c(x)), phiP = [S2, 0, 0, S2].map((x) => q.c(x));
  const withC = (ab: q.State) => q.tensor(ab, q.ket0());
  close(mixedTangle([withC(phiP), withC(phiM)], [0.5, 0.5], 0, 1), 0, 1e-8);
  close(mixedTangle([withC(phiP)], [1], 0, 1), 1, 1e-8);
});

test('CKW Eq. 14 on random mixed states of three qubits: tangle(A,B) + tangle(A,C) is at most 1', () => {
  const r = q.rng(3001);
  for (let n = 0; n < 150; n++) {
    const k = 2 + Math.floor(3 * r()), raw = Array.from({ length: k }, () => 0.05 + r()), tot = raw.reduce((a, x) => a + x, 0);
    const w = raw.map((x) => x / tot), states = w.map(() => randState(r));
    const sum = mixedTangle(states, w, 0, 1) + mixedTangle(states, w, 0, 2);
    assert.ok(sum <= 1 + 1e-9, `${sum} > 1`);
  }
});

test('mixing Bell pairs of Alice and Bob with Alice and Carol keeps the tangle sum at most 1', () => {
  const bellAB = stateOf('pass', 0), bellAC = stateOf('pass', 90);
  for (const x of [0, 0.25, 0.5, 0.75, 1]) {
    const sum = mixedTangle([bellAB, bellAC], [1 - x || 1e-12, x || 1e-12], 0, 1) + mixedTangle([bellAB, bellAC], [1 - x || 1e-12, x || 1e-12], 0, 2);
    assert.ok(sum <= 1 + 1e-9, `${x}: ${sum}`);
  }
});
