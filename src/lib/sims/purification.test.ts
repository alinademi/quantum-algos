import test from 'node:test';
import assert from 'node:assert/strict';
import * as q from '../quantum.ts';
import {
  ODDS, TURN, PAIRS, fromPercent, turnRad, purify, turned, fromEnsemble, reducedA, reducedR, purity, aChance0, partnerChances,
  branches, average, slice, rhoHeight, conditionalR0, shot, shots, draws, tally, unitaryBetween, isUnitary,
  stateText, oddsValueText, turnValueText, describe, batchText, rhoText, pairPurity, branchLine, fixed,
} from './purification.ts';

const close = (a: number, b: number, eps = 1e-12) => assert.ok(Math.abs(a - b) < eps, `${a} != ${b}`);
const closeC = (a: q.C, b: q.C, eps = 1e-12) => { close(a.re, b.re, eps); close(a.im, b.im, eps); };
const closeM = (a: q.Matrix, b: q.Matrix, eps = 1e-12) => a.forEach((row, i) => row.forEach((x, j) => closeC(x, b[i][j], eps)));
const dyad = (s: q.State): q.Matrix => s.map((x) => s.map((y) => q.mul(x, q.conj(y))));
const rho = (l0: number): q.Matrix => [[q.c(l0), q.c(0)], [q.c(0), q.c(1 - l0)]];
const RAD = Math.PI / 180;
const odds = [50, 51, 60, 80, 99, 100];
const degs = [0, 1, 30, 45, 90, 135, 179, 180];

// ---- The sliders

test('sliders: whole steps, start inside the range, odds from a fair coin up to certain, gate from 0 to a half turn', () => {
  assert.ok(ODDS.min <= ODDS.start && ODDS.start <= ODDS.max);
  assert.equal(ODDS.min, 50); assert.equal(ODDS.max, 100); assert.equal(ODDS.step, 1);
  assert.ok(TURN.min <= TURN.start && TURN.start <= TURN.max);
  assert.equal(TURN.min, 0); assert.equal(TURN.max, 180); assert.equal(TURN.step, 1);
  close(fromPercent(80), 0.8); close(fromPercent(49), 0.5); close(fromPercent(120), 1);
  close(turnRad(90), Math.PI / 2); close(turnRad(-5), 0); close(turnRad(400), Math.PI);
});

// ---- Existence: every mixed state has a purification

test('purify gives sqrt(l0)|00> + sqrt(l1)|11>, normalized', () => {
  for (const o of odds) {
    const l0 = fromPercent(o), s = purify(l0);
    close(q.norm2(s), 1);
    close(s[0].re, Math.sqrt(l0)); close(s[3].re, Math.sqrt(1 - l0));
    close(q.abs2(s[1]), 0); close(q.abs2(s[2]), 0);
  }
});

test('definition: tracing out the partner leaves exactly diag(l0, l1), so the pair purifies A’s state', () => {
  for (const o of odds) closeM(reducedA(purify(fromPercent(o))), rho(fromPercent(o)));
});

test('the partial trace is right on a product state and on the Bell pair', () => {
  // |+>|0>: A is pure |+>.
  closeM(reducedA(q.tensor(q.plus(), q.ket0())), dyad(q.plus()));
  // Bell pair (|00> + |11>)/sqrt2: A is I/2, so is the partner.
  const bell = purify(0.5);
  closeM(reducedA(bell), rho(0.5)); closeM(reducedR(bell), rho(0.5));
  // |0>|+>: tracing out the partner leaves |0><0|, tracing out A leaves |+><+|.
  closeM(reducedA(q.tensor(q.ket0(), q.plus())), dyad(q.ket0()));
  closeM(reducedR(q.tensor(q.ket0(), q.plus())), dyad(q.plus()));
});

test('purity: tr rho^2 = l0^2 + l1^2; 1/2 for the fully mixed qubit, 1 for a pure one', () => {
  for (const o of odds) { const l0 = fromPercent(o); close(purity(reducedA(purify(l0))), l0 * l0 + (1 - l0) ** 2); }
  close(purity(reducedA(purify(0.5))), 0.5);
  close(purity(reducedA(purify(1))), 1);
  close(purity(rho(0.8)), 0.68);
});

test('the pair itself is pure while A alone is mixed: |psi><psi| has trace of its square (norm^2)^2 = 1', () => {
  for (const o of odds) for (const d of degs) {
    const s = turned(fromPercent(o), turnRad(d));
    close(q.norm2(s), 1);
    // Purity of the whole pair: tr (|psi><psi|)^2 = (<psi|psi>)^2.
    const m = dyad(s);
    let t = 0;
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) t += q.mul(m[i][j], m[j][i]).re;
    close(t, 1);
  }
  assert.ok(purity(reducedA(purify(0.8))) < 1);
});

test('both parts of a pure pair have the same purity (same Schmidt coefficients)', () => {
  for (const o of odds) for (const d of degs) {
    const s = turned(fromPercent(o), turnRad(d));
    close(purity(reducedA(s)), purity(reducedR(s)));
  }
});

// ---- Unitary equivalence: a gate on the partner changes the pair, never A alone

test('the gate on the partner is a real turn: RY(alpha)|0> = c|0> + s|1>, RY(alpha)|1> = -s|0> + c|1>', () => {
  const l0 = 0.8, a = 70 * RAD, cc = Math.cos(a / 2), ss = Math.sin(a / 2);
  const s = turned(l0, a);
  close(s[0].re, Math.sqrt(l0) * cc); close(s[1].re, Math.sqrt(l0) * ss);
  close(s[2].re, -Math.sqrt(1 - l0) * ss); close(s[3].re, Math.sqrt(1 - l0) * cc);
  s.forEach((x) => close(x.im, 0));
});

test('A alone is the same for every gate on the partner: rho_A does not move, and neither does A’s chance of 0', () => {
  for (const o of odds) for (const d of degs) {
    const l0 = fromPercent(o), s = turned(l0, turnRad(d));
    closeM(reducedA(s), rho(l0));
    close(aChance0(s), l0);
  }
});

test('the pair does change with the gate: the amplitudes move even though A alone does not', () => {
  const s0 = turned(0.8, 0), s90 = turned(0.8, turnRad(90));
  assert.ok(Math.abs(s0[0].re - s90[0].re) > 0.2);
  assert.ok(Math.abs(q.inner(s0, s90).re) < 0.999);
  // The partner's own state does change.
  const r0 = reducedR(s0), r90 = reducedR(s90);
  assert.ok(Math.abs(r0[0][1].re - r90[0][1].re) > 0.1);
});

test('two purifications of the same state differ by a unitary on the partner: the one that is found is the gate, and it is unitary', () => {
  for (const o of [50, 51, 60, 80, 99]) for (const d of degs) {
    const l0 = fromPercent(o), a = turnRad(d), s0 = turned(l0, 0), s = turned(l0, a);
    const u = unitaryBetween(s0, s)!;
    assert.ok(u && isUnitary(u));
    closeM(u, q.RY(a), 1e-9);
    // (I x U) s0 is s.
    const back = q.apply1(s0, u, 1, 2);
    back.forEach((x, i) => closeC(x, s[i], 1e-9));
  }
});

test('a purification built another way is also one gate away: the pair made from the ensemble {1/2 psi+, 1/2 psi-}', () => {
  const l0 = 0.8, sq0 = Math.sqrt(l0), sq1 = Math.sqrt(1 - l0);
  const plusS: q.State = [q.c(sq0), q.c(sq1)], minusS: q.State = [q.c(sq0), q.c(-sq1)];
  const other = fromEnsemble([{ p: 0.5, state: plusS }, { p: 0.5, state: minusS }]);
  assert.equal(other.length, 4); close(q.norm2(other), 1);
  closeM(reducedA(other), rho(l0));
  const u = unitaryBetween(purify(l0), other)!;
  assert.ok(u && isUnitary(u));
  q.apply1(purify(l0), u, 1, 2).forEach((x, i) => closeC(x, other[i], 1e-9));
});

test('with a pure A there is no unique gate (the partner is not linked), and unitaryBetween says so', () => {
  assert.equal(unitaryBetween(purify(1), turned(1, turnRad(40))), null);
});

test('isUnitary: accepts gates, rejects a non-unitary matrix', () => {
  for (const g of [q.I, q.X, q.Y, q.Z, q.H, q.RY(0.7)]) assert.ok(isUnitary(g));
  assert.ok(!isUnitary([[q.c(1), q.c(1)], [q.c(0), q.c(1)]]));
});

// ---- Measuring the partner: the two states A is left in

test('the partner’s chances: p0 = l0 c^2 + l1 s^2, p1 = l0 s^2 + l1 c^2, summing to 1', () => {
  for (const o of odds) for (const d of degs) {
    const l0 = fromPercent(o), l1 = 1 - l0, a = turnRad(d), cc = Math.cos(a / 2) ** 2, ss = Math.sin(a / 2) ** 2;
    const [p0, p1] = partnerChances(turned(l0, a));
    close(p0, l0 * cc + l1 * ss); close(p1, l0 * ss + l1 * cc); close(p0 + p1, 1);
  }
});

test('no gate: the partner reads 0 with chance l0 and then A is |0>; it reads 1 with chance l1 and then A is |1>', () => {
  const [b0, b1] = branches(turned(0.8, 0));
  close(b0.p, 0.8); close(b1.p, 0.2);
  closeM(dyad(b0.state!), dyad(q.ket0())); closeM(dyad(b1.state!), dyad(q.ket1()));
});

test('the formulas for the two states: phi_0 ~ sqrt(l0) c|0> - sqrt(l1) s|1>, phi_1 ~ sqrt(l0) s|0> + sqrt(l1) c|1>', () => {
  for (const o of [50, 60, 80, 99]) for (const d of [0, 30, 90, 150, 180]) {
    const l0 = fromPercent(o), l1 = 1 - l0, a = turnRad(d), cc = Math.cos(a / 2), ss = Math.sin(a / 2);
    const [b0, b1] = branches(turned(l0, a));
    const p0 = l0 * cc * cc + l1 * ss * ss, p1 = l0 * ss * ss + l1 * cc * cc;
    // Compare as density matrices: a global phase on a state cannot be seen.
    closeM(dyad(b0.state!), dyad(q.normalize([q.c(Math.sqrt(l0) * cc), q.c(-Math.sqrt(l1) * ss)])), 1e-9);
    closeM(dyad(b1.state!), dyad(q.normalize([q.c(Math.sqrt(l0) * ss), q.c(Math.sqrt(l1) * cc)])), 1e-9);
    close(b0.p, p0); close(b1.p, p1);
  }
});

test('the states A is left in, weighted by their chances, add back to rho_A for every gate (so no test on A alone can tell the gates apart)', () => {
  for (const o of odds) for (const d of degs) {
    const l0 = fromPercent(o), s = turned(l0, turnRad(d)), bs = branches(s);
    closeM(average(bs), rho(l0));
    closeM(average(bs), reducedA(s));
    for (const b of bs) if (b.state) close(q.norm2(b.state), 1);
  }
});

test('on the Bloch sphere: both states are on the rim of the x-z slice (length 1, y = 0), and their weighted point is rho’s, at height l0 - l1 on the z axis', () => {
  for (const o of [50, 60, 80, 99]) for (const d of [0, 20, 90, 160, 180]) {
    const l0 = fromPercent(o), bs = branches(turned(l0, turnRad(d)));
    let x = 0, z = 0;
    for (const b of bs) {
      const v = slice(b.state!);
      close(v.x * v.x + v.y * v.y + v.z * v.z, 1, 1e-9); close(v.y, 0, 1e-9);
      x += b.p * v.x; z += b.p * v.z;
    }
    close(x, 0, 1e-9); close(z, rhoHeight(l0), 1e-9);
  }
  close(rhoHeight(0.5), 0); close(rhoHeight(1), 1); close(rhoHeight(0.8), 0.6);
});

test('fully mixed A (50/50): the two states are always opposite points at (x, z) = (-sin a, cos a) and (sin a, -cos a), each with chance 1/2', () => {
  for (const d of degs) {
    const a = turnRad(d), [b0, b1] = branches(turned(0.5, a));
    close(b0.p, 0.5); close(b1.p, 0.5);
    const v0 = slice(b0.state!), v1 = slice(b1.state!);
    close(v0.x, -Math.sin(a), 1e-9); close(v0.z, Math.cos(a), 1e-9);
    close(v1.x, Math.sin(a), 1e-9); close(v1.z, -Math.cos(a), 1e-9);
    close(v0.x + v1.x, 0, 1e-9); close(v0.z + v1.z, 0, 1e-9);
  }
});

test('the example from Mixed states: odds 80/20, a quarter turn gives psi+ and psi- = sqrt(0.8)|0> +- sqrt(0.2)|1>, each with chance 1/2', () => {
  const [b0, b1] = branches(turned(0.8, Math.PI / 2));
  close(b0.p, 0.5); close(b1.p, 0.5);
  const want = (sign: number) => dyad([q.c(Math.sqrt(0.8)), q.c(sign * Math.sqrt(0.2))]);
  closeM(dyad(b0.state!), want(-1), 1e-9); closeM(dyad(b1.state!), want(1), 1e-9);
});

test('a half turn gives the same two states as no gate, with the results swapped', () => {
  const [n0, n1] = branches(turned(0.8, 0)), [h0, h1] = branches(turned(0.8, Math.PI));
  close(h0.p, n1.p, 1e-12); close(h1.p, n0.p, 1e-12);
  closeM(dyad(h0.state!), dyad(n1.state!), 1e-9); closeM(dyad(h1.state!), dyad(n0.state!), 1e-9);
});

test('a pure A (certain 0): every gate leaves A as |0>, so the partner tells nothing and the pair is a product', () => {
  for (const d of degs) {
    const bs = branches(turned(1, turnRad(d)));
    for (const b of bs) if (b.state) closeM(dyad(b.state), dyad(q.ket0()), 1e-9);
    close(bs[0].p + bs[1].p, 1);
    close(purity(reducedA(turned(1, turnRad(d)))), 1);
  }
  // At no gate the partner always reads 0, so the result 1 never happens.
  const [b0, b1] = branches(turned(1, 0));
  close(b0.p, 1); assert.equal(b1.state, null);
});

test('the displayed first amplitude of a state A is left in is not negative: a global phase is dropped, never a relative one', () => {
  for (const d of degs) for (const b of branches(turned(0.8, turnRad(d)))) {
    const s = b.state!, first = s.find((x) => q.abs(x) > 1e-9)!;
    assert.ok(first.re > 0); close(first.im, 0, 1e-12);
  }
  // The relative sign survives: psi- keeps its minus.
  const [b0] = branches(turned(0.8, Math.PI / 2));
  assert.ok(b0.state![1].re < 0);
});

test('fromEnsemble: the partner reading k leaves A in phi_k with chance p_k, so the ensemble is the one the partner picks', () => {
  const list = [{ p: 0.3, state: q.ket0() }, { p: 0.7, state: q.plus() }];
  const s = fromEnsemble(list);
  close(q.norm2(s), 1); // the |k> are orthonormal, so the norm is the sum of the p_k
  const [b0, b1] = branches(s);
  close(b0.p, 0.3); close(b1.p, 0.7);
  closeM(dyad(b0.state!), dyad(q.ket0()), 1e-12); closeM(dyad(b1.state!), dyad(q.plus()), 1e-12);
  // The mix of the two non-orthogonal states is A's state.
  closeM(reducedA(s), average(branches(s)));
});

// ---- Shots

test('shots follow the Born rule: A’s result flips exactly at its chance, the partner’s at its chance given A’s', () => {
  for (const o of [50, 80, 99]) for (const d of [0, 45, 90, 135]) {
    const l0 = fromPercent(o), s = turned(l0, turnRad(d)), e = 1e-9;
    assert.equal(shot(s, { u1: l0 - e, u2: 0 }).a, 0);
    assert.equal(shot(s, { u1: l0 + e, u2: 0 }).a, 1);
    for (const a of [0, 1] as const) {
      const pa = a === 0 ? l0 : 1 - l0, r0 = conditionalR0(s, a);
      close(r0, q.abs2(s[2 * a]) / pa, 1e-12);
      const u1 = a === 0 ? l0 / 2 : l0 + (1 - l0) / 2;
      assert.equal(shot(s, { u1, u2: r0 - e }).r, 0);
      if (r0 < 1 - 1e-6) assert.equal(shot(s, { u1, u2: r0 + e }).r, 1);
    }
  }
});

test('chain rule: P(a) P(r | a) is exactly the joint chance |psi[2a + r]|^2, and the four chances sum to 1', () => {
  for (const o of odds) for (const d of degs) {
    const l0 = fromPercent(o), s = turned(l0, turnRad(d));
    let sum = 0;
    for (const a of [0, 1] as const) {
      const pa = a === 0 ? l0 : 1 - l0;
      if (pa < 1e-9) continue;
      const r0 = conditionalR0(s, a);
      close(pa * r0, q.abs2(s[2 * a])); close(pa * (1 - r0), q.abs2(s[2 * a + 1]));
      sum += pa * r0 + pa * (1 - r0);
    }
    close(sum, 1);
  }
});

test('A’s results do not depend on the partner’s gate: the same draws give the same A row at every angle', () => {
  const ds = draws(q.rng(7));
  for (const o of [50, 60, 80, 99]) {
    const l0 = fromPercent(o), base = shots(turned(l0, 0), ds).map((s) => s.a);
    for (const d of degs) assert.deepEqual(shots(turned(l0, turnRad(d)), ds).map((s) => s.a), base);
  }
});

test('a pair where A is certain: the partner’s result needs no chance from A (no divide by zero)', () => {
  const s = turned(1, 0);
  assert.equal(shot(s, { u1: 0.999, u2: 0.5 }).a, 0);
  assert.ok(Number.isFinite(conditionalR0(s, 1)));
});

test('draws and tally: PAIRS pairs, every draw in [0, 1), and the counts are of the shots made', () => {
  const ds = draws(q.rng(3));
  assert.equal(ds.length, PAIRS);
  for (const d of ds) { assert.ok(d.u1 >= 0 && d.u1 < 1 && d.u2 >= 0 && d.u2 < 1); }
  const t = tally([{ a: 0, r: 1 }, { a: 1, r: 1 }, { a: 0, r: 0 }]);
  assert.deepEqual(t, { n: 3, a0: 2, r0: 1 });
  const all = shots(turned(0.8, 0), ds), tt = tally(all);
  assert.equal(tt.n, PAIRS); assert.ok(tt.a0 >= 0 && tt.a0 <= PAIRS);
});

test('with no gate A and the partner always agree (the pair sqrt(l0)|00> + sqrt(l1)|11> has no |01> or |10>)', () => {
  for (const s of shots(turned(0.7, 0), draws(q.rng(11)))) assert.equal(s.a, s.r);
});

// ---- Words

test('stateText: signs, two decimals, tiny terms left out', () => {
  assert.equal(stateText(purify(0.8)), '0.89|00⟩ + 0.45|11⟩');
  assert.equal(stateText([q.c(0.6), q.c(-0.8)]), '0.60|0⟩ − 0.80|1⟩');
  assert.equal(stateText([q.c(-1), q.c(0)]), '−1.00|0⟩');
  assert.equal(stateText([q.c(0), q.c(1)]), '1.00|1⟩');
  assert.equal(stateText(turned(0.8, Math.PI / 2)), '0.63|00⟩ + 0.63|01⟩ − 0.32|10⟩ + 0.32|11⟩');
});

test('slider texts', () => {
  assert.equal(oddsValueText(80), '80 percent chance of 0 for A alone');
  assert.equal(turnValueText(0), 'No gate on the partner');
  assert.equal(turnValueText(45), '45 degrees');
  assert.ok(turnValueText(180).includes('swapped'));
});

test('describe: names the start state, gives A’s odds and both branches with numbers that match the sim', () => {
  const t = describe(80, 90);
  assert.ok(t.startsWith('Started as the pair 0.89|00⟩ + 0.45|11⟩.'));
  assert.ok(t.includes('turns the partner by 90°'));
  assert.ok(t.includes('A alone reads 0 with chance 80% and 1 with chance 20%'));
  assert.ok(t.includes('The partner reads 0 with chance 50%, and then A is 0.89|0⟩ − 0.45|1⟩'));
  assert.ok(t.includes('The partner reads 1 with chance 50%, and then A is 0.89|0⟩ + 0.45|1⟩'));
  assert.ok(describe(80, 0).includes('No gate on the partner.'));
  assert.ok(describe(80, 0).includes('reads 0 with chance 80%, and then A is 1.00|0⟩'));
  assert.ok(describe(100, 0).includes('not linked'));
  assert.ok(describe(100, 0).startsWith('Started as the pair 1.00|00⟩.'));
  assert.ok(describe(100, 0).includes('A stays |0⟩'));
  // A result that cannot happen is said never to happen, not given a chance of 0%.
  assert.ok(!/ 0%/.test(describe(100, 0)));
});

test('batchText: counts with the exact odds, shown with no 0% or 100% for a real chance', () => {
  const s = batchText({ n: 40, a0: 33, r0: 19 }, 80, 90);
  assert.equal(s, 'Of 40 new pairs, A alone read 0 in 33 (the odds say 80%) and the partner read 0 in 19 (the odds say 50%).');
  assert.ok(describe(99, 0, { n: 40, a0: 40, r0: 40 }).includes('the odds say 99%'));
});

test('no em dashes in any string the tool shows', () => {
  for (const o of [50, 80, 100]) for (const d of [0, 90, 180]) {
    for (const s of [describe(o, d), describe(o, d, { n: 40, a0: 20, r0: 20 }), turnValueText(d), oddsValueText(o)]) assert.ok(!s.includes('—'));
  }
});

test('table texts: rho, the pair\u2019s purity (always 1), and one line per partner result', () => {
  assert.equal(rhoText(0.8), 'diag(0.80, 0.20)');
  assert.equal(rhoText(0.5), 'diag(0.50, 0.50)');
  for (const d of degs) close(pairPurity(turned(0.8, turnRad(d))), 1);
  assert.equal(fixed(purity(rho(0.8))), '0.68');
  const [b0, b1] = branches(turned(0.8, Math.PI / 2));
  assert.equal(branchLine(b0), '50%, then A is 0.89|0⟩ \u2212 0.45|1⟩');
  assert.equal(branchLine(b1), '50%, then A is 0.89|0⟩ + 0.45|1⟩');
  assert.equal(branchLine(branches(turned(1, 0))[1]), 'never');
});

test('unitary equivalence holds for a gate with phases too: (I x U) psi purifies the same A, and the gate is found back', () => {
  // A complex unitary: RX(0.9) has entries -i sin(0.45), so it has real phases that do not drop out of the partner's 0/1 result.
  const U = q.RX(0.9);
  assert.ok(isUnitary(U));
  assert.ok(Math.abs(U[1][0].im) > 0.1 || Math.abs(U[1][1].im) > 0.1);
  for (const o of [50, 60, 80, 99]) {
    const l0 = fromPercent(o), s0 = purify(l0), s1 = q.apply1(s0, U, 1, 2);
    closeM(reducedA(s1), rho(l0));
    const back = unitaryBetween(s0, s1)!;
    assert.ok(back && isUnitary(back));
    closeM(back, U, 1e-9);
    // Its steered states leave the real circle: y is not 0 for a gate with phases.
    const ys = branches(s1).map((b) => Math.abs(slice(b.state!).y));
    if (o < 99) assert.ok(Math.max(...ys) > 1e-3);
    closeM(average(branches(s1)), rho(l0));
  }
});

test('the student\u2019s Hadamard example: odds 80/20, a Hadamard gate on the partner gives 0.89|0> + 0.45|1> and 0.89|0> - 0.45|1>, 50% each', () => {
  const s = q.apply1(purify(0.8), q.H, 1, 2);
  const [b0, b1] = branches(s);
  close(b0.p, 0.5); close(b1.p, 0.5);
  assert.equal(stateText(b0.state!), '0.89|0⟩ + 0.45|1⟩');
  assert.equal(stateText(b1.state!), '0.89|0⟩ \u2212 0.45|1⟩');
  closeM(reducedA(s), rho(0.8));
  // The quarter turn in the tool gives the same two states with the results swapped.
  const [t0, t1] = branches(turned(0.8, Math.PI / 2));
  closeM(dyad(t0.state!), dyad(b1.state!), 1e-9); closeM(dyad(t1.state!), dyad(b0.state!), 1e-9);
  // Student text: the 0/1 test gives 80/20, the +/- test gives 50/50.
  const r = reducedA(s);
  close(r[0][0].re, 0.8); close(0.5 * (r[0][0].re + r[1][1].re) + r[0][1].re, 0.5);
});
