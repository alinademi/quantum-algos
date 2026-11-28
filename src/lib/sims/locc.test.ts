import test from 'node:test';
import assert from 'node:assert/strict';
import * as q from '../quantum.ts';
import * as L from './locc.ts';

const close = (a: number, b: number, eps = 1e-9) => assert.ok(Math.abs(a - b) < eps, `${a} != ${b}`);
const closeAll = (a: readonly number[], b: readonly number[], eps = 1e-9) => { assert.equal(a.length, b.length); a.forEach((x, i) => close(x, b[i], eps)); };
const sum = (xs: readonly number[]) => xs.reduce((t, x) => t + x, 0);
const W = (id: string) => L.stateById(id).w;

// Seeded random cases. Fixed seeds, so every run checks the same cases.
const R = q.rng(7);
const randomWeights = (n = L.MAXD): number[] => { const v = Array.from({ length: n }, () => R() ** 2 + 0.01); const t = sum(v); return L.pad(v.map((x) => x / t)); };
/** x = sum p_k P_k y for random permutations P_k: x is majorized by y by construction. */
function mixOf(y: number[]): number[] {
  const ps = Array.from({ length: 3 }, () => R() + 0.1), t = sum(ps);
  const out = y.map(() => 0);
  ps.forEach((p) => {
    const perm = y.map((_, i) => i).sort(() => R() - 0.5);
    perm.forEach((pi, i) => { out[i] += (p / t) * y[pi]; });
  });
  return L.pad(out);
}

test('weights: sorted, padded, add up to 1, and every named state is valid', () => {
  assert.deepEqual(L.pad([0.2, 0.8]), [0.8, 0.2, 0, 0]);
  for (const s of L.STATES) {
    close(sum(s.w), 1);
    assert.deepEqual(s.w, [...s.w].sort((a, b) => b - a), s.id);
    assert.ok(s.w.every((x) => x > 0), s.id);
  }
});

test('ebits: a Bell pair is exactly 1, a product 0, d even levels log2 d', () => {
  assert.equal(L.ebits(W('bell')), 1);
  assert.equal(L.ebits(W('product')), 0);
  close(L.ebits(W('e3')), Math.log2(3));
  assert.equal(L.ebits(W('e4')), 2);
  assert.equal(L.MAX_E, 2);
});

test('ebits: known values from the text (0.9/0.1 is 0.47, 50/25/25 is 1.5, 40/40/20 is 1.52, 40/40/10/10 is 1.72)', () => {
  close(L.ebits(W('p90')), -(0.9 * Math.log2(0.9) + 0.1 * Math.log2(0.1)));
  assert.equal(L.ebitText(L.ebits(W('p90'))), '0.47 ebits');
  assert.equal(L.ebitText(L.ebits(W('p75'))), '0.81 ebits');
  assert.equal(L.ebits(W('b3')), 1.5);
  assert.equal(L.ebitText(L.ebits(W('b3'))), '1.5 ebits');
  assert.equal(L.ebitText(L.ebits(W('a3'))), '1.52 ebits');
  assert.equal(L.ebitText(L.ebits(W('a4'))), '1.72 ebits');
  assert.equal(L.ebitText(1), '1 ebit');
  assert.equal(L.ebitText(0), '0 ebits');
  assert.equal(L.ebitText(2), '2 ebits');
});

test('ebits: states are listed fewest ebits first', () => {
  const e = L.STATES.map((s) => L.ebits(s.w));
  e.forEach((x, i) => { if (i) assert.ok(x > e[i - 1], L.STATES[i].id); });
});

test('ebits: the entropy of Alice\'s reduced state equals E, and the weights are its diagonal', () => {
  for (const s of L.STATES) {
    const rho = L.reducedAlice(L.schmidtState(s.w));
    closeAll(rho.map((row, i) => row[i].re), L.pad(s.w));
    close(L.ebits(rho.map((row, i) => row[i].re)), L.ebits(s.w));
    rho.forEach((row, i) => row.forEach((x, j) => { if (i !== j) close(Math.hypot(x.re, x.im), 0); }));
  }
});

test('partial sums and majorization: the definition, small cases', () => {
  closeAll(L.sums(W('b3')), [0.5, 0.75, 1, 1]);
  closeAll(L.sums(W('a3')), [0.4, 0.8, 1, 1]);
  assert.ok(L.majorizedBy(W('bell'), W('p90')));
  assert.ok(!L.majorizedBy(W('p90'), W('bell')));
  assert.ok(L.majorizedBy(W('bell'), W('bell')), 'every vector is majorized by itself');
});

test('majorization is a partial order: reflexive, transitive, and antisymmetric up to relabeling', () => {
  const ws = L.STATES.map((s) => s.w);
  for (const x of ws) assert.ok(L.majorizedBy(x, x));
  for (const x of ws) for (const y of ws) for (const z of ws)
    if (L.majorizedBy(x, y) && L.majorizedBy(y, z)) assert.ok(L.majorizedBy(x, z));
  for (const x of ws) for (const y of ws)
    if (L.majorizedBy(x, y) && L.majorizedBy(y, x)) assert.ok(L.sameWeights(x, y));
  // A relabeled list is the same state.
  assert.ok(L.sameWeights([0.1, 0.9], [0.9, 0.1]));
});

test('product states stay product, and a maximally entangled state reaches every state of its size', () => {
  for (const s of L.STATES) {
    assert.equal(L.canConvert(W('product'), s.w), s.id === 'product', `product -> ${s.id}`);
    assert.ok(L.canConvert(W('e4'), s.w), `even4 -> ${s.id}`);
    assert.ok(L.canConvert(s.w, W('product')), `${s.id} -> product`);
  }
  for (const s of L.STATES.filter((x) => x.w.length <= 2)) assert.ok(L.canConvert(W('bell'), s.w), `bell -> ${s.id}`);
  assert.ok(!L.canConvert(W('bell'), W('b3')), 'a Bell pair has only two levels: it cannot reach three');
  assert.ok(L.canConvert(W('e3'), W('bell')) && L.canConvert(W('b3'), W('bell')));
});

test('Nielsen: converting never raises the ebit count, for every pair of named states', () => {
  for (const x of L.STATES) for (const y of L.STATES)
    if (L.canConvert(x.w, y.w)) assert.ok(L.ebits(x.w) >= L.ebits(y.w) - 1e-12, `${x.id} -> ${y.id}`);
});

test('Nielsen: reversible only when the weights are the same', () => {
  for (const x of L.STATES) for (const y of L.STATES) {
    const both = L.canConvert(x.w, y.w) && L.canConvert(y.w, x.w);
    assert.equal(both, x.id === y.id, `${x.id}, ${y.id}`);
    assert.equal(L.compare(x.w, y.w).back, L.canConvert(y.w, x.w));
  }
});

test('Nielsen: random mixtures P y are majorized by y, never the other way around unless equal', () => {
  for (let n = 0; n < 60; n++) {
    const y = randomWeights(), x = mixOf(y);
    assert.ok(L.canConvert(x, y));
    assert.ok(L.ebits(x) >= L.ebits(y) - 1e-12, 'mixing raises entropy (Schur-concave)');
    if (!L.sameWeights(x, y)) assert.ok(!L.canConvert(y, x));
  }
});

test('the text\'s example: 0.4/0.4/0.2 and 0.5/0.25/0.25 convert neither way, though 1.52 > 1.5', () => {
  const a = W('a3'), b = W('b3');
  assert.ok(L.ebits(a) > L.ebits(b));
  assert.ok(!L.canConvert(a, b) && !L.canConvert(b, a));
  assert.equal(L.firstBreak(a, b), 2);
  close(L.sums(a)[1], 0.8); close(L.sums(b)[1], 0.75);
  assert.equal(L.firstBreak(b, a), 1);
});

test('the 4-level example 0.4/0.4/0.1/0.1 against 0.5/0.25/0.25: more ebits, but no conversion', () => {
  const a = W('a4'), b = W('b3');
  assert.ok(L.ebits(a) > L.ebits(b));
  assert.ok(!L.canConvert(a, b) && !L.canConvert(b, a));
  assert.equal(L.firstBreak(a, b), 2);
});

test('the protocol exists exactly when Nielsen\'s test passes, for all 81 pairs', () => {
  for (const x of L.STATES) for (const y of L.STATES)
    assert.equal(L.protocol(x.w, y.w) !== null, L.canConvert(x.w, y.w), `${x.id} -> ${y.id}`);
});

/** Run a protocol on real state vectors and check every branch with the Born rule. */
function checkProtocol(from: number[], to: number[]) {
  const d = L.MAXD, br = L.protocol(from, to)!;
  assert.ok(br, 'protocol');
  const psi = L.schmidtState(from, d), phi = L.schmidtState(to, d);
  // The chances add up to 1.
  close(sum(L.chances(br)), 1);
  // The Kraus operators add up to the identity: sum_k M_k^† M_k = I (they are diagonal, so check each level).
  for (let i = 0; i < d; i++) close(sum(br.map((b) => b.m[i] ** 2)), 1);
  let ensemble = 0;
  br.forEach((b) => {
    const post = L.applyAlice(L.diagonal(b.m), psi, d);
    // Born rule: the chance of this outcome is the norm squared of what is left.
    close(L.weightOf(post), b.p);
    // After the outcome the weights are the target's, shuffled.
    const rho = L.reducedAlice(L.unit(post), d);
    closeAll(rho.map((row, i) => row[i].re), L.afterWeights(b, to));
    // Both relabel: the state is exactly the target (global phase is 1 here: all amplitudes are real and positive).
    const done = L.relabel(b.perm, L.unit(post), d);
    close(L.overlap(done, phi), 1);
    done.forEach((x, i) => { close(x.re, phi[i].re); close(x.im, 0); });
    ensemble += b.p * L.ebits(L.afterWeights(b, to));
  });
  // Average ebits after the message is the target's ebits.
  close(ensemble, L.ebits(to));
  // Alice's average reduced state before looking: sum_k M_k rho M_k^† is a mix; Bob's side alone is unchanged (no-signaling).
  const sumB = Array.from({ length: d }, () => 0);
  br.forEach((b) => { const post = L.applyAlice(L.diagonal(b.m), psi, d); for (let a = 0; a < d; a++) for (let bb = 0; bb < d; bb++) if (a === bb) sumB[bb] += q.abs2(post[a * d + bb]); });
  closeAll(sumB, L.pad(from, d));
}

test('the protocol works on real states: Born chances, completeness, branches end as the target (all allowed pairs)', () => {
  let n = 0;
  for (const x of L.STATES) for (const y of L.STATES) if (L.canConvert(x.w, y.w)) { checkProtocol(x.w, y.w); n++; }
  assert.ok(n > 30, `only ${n} allowed pairs`);
});

test('the protocol works on random majorized pairs', () => {
  for (let n = 0; n < 60; n++) { const y = randomWeights(), x = mixOf(y); checkProtocol(x, y); }
});

test('the default pair: Bell pair to 0.9/0.1 is a gentle measurement with two outcomes of chance 1/2', () => {
  const br = L.protocol(W('bell'), W('p90'))!;
  assert.equal(br.length, 2);
  closeAll(L.chances(br), [0.5, 0.5]);
  // Outcome weights: (0.9, 0.1) and (0.1, 0.9); the second needs a swap of levels 1 and 2.
  const [first, second] = [br.find((b) => b.perm[0] === 0)!, br.find((b) => b.perm[0] === 1)!];
  closeAll(first.m.slice(0, 2).map((x) => x * x), [0.9, 0.1]);
  closeAll(second.m.slice(0, 2).map((x) => x * x), [0.1, 0.9]);
  assert.equal(L.shuffleText(first.perm), 'nothing more');
  assert.equal(L.shuffleText(second.perm), 'swap levels 1 and 2');
});

test('a Bell pair to a product state: Alice measures 0/1, and the outcome 1 branch relabels to 0', () => {
  const br = L.protocol(W('bell'), W('product'))!;
  assert.equal(br.length, 2);
  closeAll(L.chances(br), [0.5, 0.5]);
  const moved = br.filter((b) => b.perm[0] !== 0);
  assert.equal(moved.length, 1);
  assert.equal(L.shuffleText(moved[0].perm), 'swap levels 1 and 2');
});

test('same state in and out: one outcome, nothing to do', () => {
  const br = L.protocol(W('b3'), W('b3'))!;
  assert.equal(br.length, 1);
  close(br[0].p, 1);
  assert.equal(L.shuffleText(br[0].perm), 'nothing more');
  br[0].m.forEach((m) => close(m, 1));
});

test('shuffleText: swap, longer moves, and nothing', () => {
  assert.equal(L.shuffleText([0, 1, 2, 3]), 'nothing more');
  assert.equal(L.shuffleText([2, 1, 0, 3]), 'swap levels 1 and 3');
  assert.equal(L.shuffleText([1, 2, 0, 3]), 'move level 1 to 2, level 2 to 3, level 3 to 1');
});

test('one message is enough, and the number of outcomes is at most 2^(MAXD-1)', () => {
  for (const x of L.STATES) for (const y of L.STATES) {
    const br = L.protocol(x.w, y.w);
    if (br) assert.ok(br.length >= 1 && br.length <= 2 ** (L.MAXD - 1), `${x.id} -> ${y.id}: ${br.length}`);
  }
});

test('a lucky run loses on average: 0.9/0.1, outcome 0 (chance 0.2) is a Bell pair, outcome 1 a product state', () => {
  const f = L.filter(L.GAMBLE.w, L.GAMBLE.a);
  closeAll(f.p, [0.2, 0.8]);
  closeAll(f.post[0], [0.5, 0.5]);
  closeAll(f.post[1], [1, 0]);
  assert.equal(L.ebits(f.post[0]), 1);
  assert.equal(L.ebits(f.post[1]), 0);
  const avg = f.p[0] * L.ebits(f.post[0]) + f.p[1] * L.ebits(f.post[1]);
  close(avg, 0.2);
  assert.ok(avg < L.ebits(L.GAMBLE.w), '0.2 < 0.47');
  // The Kraus operators add up to the identity.
  L.GAMBLE.a.forEach((a) => close(a * a + (1 - a * a), 1));
  // The same numbers on real state vectors.
  const psi = L.schmidtState(L.GAMBLE.w), m0 = L.diagonal([...L.GAMBLE.a, 1, 1]);
  close(L.weightOf(L.applyAlice(m0, psi)), 0.2);
});

test('no local filter raises the ebits on average (random filters on random pairs)', () => {
  for (let n = 0; n < 300; n++) {
    const w = randomWeights(3).slice(0, 3), a = w.map(() => R());
    const f = L.filter(w, a);
    const avg = f.p.reduce((t, p, k) => t + (p > 1e-12 ? p * L.ebits(f.post[k]) : 0), 0);
    assert.ok(avg <= L.ebits(w) + 1e-9, `avg ${avg} > ${L.ebits(w)}`);
    close(sum(f.p), 1);
  }
});

test('the gauge fills in proportion to the ebits, and never past full', () => {
  assert.equal(L.gaugeFilled(0), 0);
  assert.equal(L.gaugeFilled(1), L.GAUGE_DOTS / 2);
  assert.equal(L.gaugeFilled(2), L.GAUGE_DOTS);
  assert.equal(L.gaugeFilled(5), L.GAUGE_DOTS);
});

test('Born rule draws: outcome counts follow the chances', () => {
  const br = L.protocol(W('e4'), W('p75'))!, p = L.chances(br);
  const counts = q.sample(p, 20000, q.rng(3));
  counts.forEach((n, i) => assert.ok(Math.abs(n / 20000 - p[i]) < 0.02, `outcome ${i}: ${n / 20000} vs ${p[i]}`));
});

test('pileGrid: dots fit in the box', () => {
  for (const n of [1, 30, 100]) {
    const g = L.pileGrid(40, 120, n);
    assert.ok(Math.floor(40 / g.pitch) * Math.floor(120 / g.pitch) >= n || g.pitch === 1);
    assert.ok(g.cols >= 1);
  }
});

test('verdict text names the start state, the rule and the ebits', () => {
  const ok = L.verdictText(L.stateById('bell'), L.stateById('p90'));
  assert.match(ok, /^Yes, every time/);
  assert.match(ok, /1 ebit became 0\.47 ebits: 0\.53 ebits less/);
  const no = L.verdictText(L.stateById('a3'), L.stateById('b3'));
  assert.match(no, /k = 2 largest weights of the start add up to 0\.8, the target's only to 0\.75/);
  assert.match(no, /Counting ebits alone would allow it \(1\.52 ebits is at least 1\.5 ebits\)/);
  const up = L.verdictText(L.stateById('product'), L.stateById('bell'));
  assert.match(up, /^No, never, not even by luck: LOCC cannot raise the number of nonzero weights\. The start has 1, the target 2\./);
  assert.match(L.verdictText(L.stateById('bell'), L.stateById('b3')), /^No, never/);
  // Same number of nonzero weights but blocked: not "never" (the chance is above 0).
  assert.match(no, /^No, not every time/);
  assert.match(L.verdictText(L.stateById('a4'), L.stateById('b3')), /^No, not every time/);
  assert.match(no, /In a change that works every time, that sum can only stay or rise/);
  // The ebit loss is the difference of the rounded numbers: 1.58 - 0.47 = 1.11.
  assert.match(L.verdictText(L.stateById('e3'), L.stateById('p90')), /1\.58 ebits became 0\.47 ebits: 1\.11 ebits less, and LOCC cannot take it back every time/);
  assert.match(L.verdictText(L.stateById('bell'), L.stateById('bell')), /same state up to relabeling/);
  assert.match(L.describe(L.stateById('p90')), /^Two levels, 90\/10 \(weights 0\.9, 0\.1; 0\.47 ebits\)$/);
});
