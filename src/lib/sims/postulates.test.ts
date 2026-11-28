import test from 'node:test';
import assert from 'node:assert/strict';
import * as q from '../quantum.ts';
import * as po from './postulates.ts';
import { pct } from '../draw.ts';

const close = (a: number, b: number, eps = 1e-12) => assert.ok(Math.abs(a - b) < eps, `${a} != ${b}`);
const closeState = (a: q.State, b: q.State, eps = 1e-12) => {
  assert.equal(a.length, b.length);
  a.forEach((x, i) => { close(x.re, b[i].re, eps); close(x.im, b[i].im, eps); });
};
const sum = (xs: number[]) => xs.reduce((t, x) => t + x, 0);
const S2 = Math.SQRT1_2;
/** Slider values the tool can reach (step 0.01), and a coarser grid for pairs. */
const fine = Array.from({ length: 201 }, (_, i) => Math.round(i - 100) / 100);
const coarse = Array.from({ length: 21 }, (_, i) => Math.round(i * 10 - 100) / 100).concat([S2, -S2]);
const pairs = coarse.flatMap((a) => coarse.map((b) => [a, b] as const));
const ALLOWED: po.Change[] = ['none', 'h', 'cnot'];
// A complex two-qubit state, to test the rules beyond the tool's real amplitudes.
const wild: q.State = q.normalize([q.c(0.3, -0.2), q.c(-0.1, 0.5), q.c(0.4, 0.1), q.c(0.2, -0.6)]);

test('State: every slider setting is a unit vector with amplitude of 1 equal to b and amplitude of 0 at least 0', () => {
  for (const b of fine) {
    const s = po.qubit(b);
    close(q.norm2(s), 1);
    close(s[1].re, b);
    assert.ok(s[0].re >= 0);
    close(s[0].re, Math.sqrt(1 - b * b));
    assert.ok(po.isState(s));
  }
});

test('State: the presets are |0>, |1>, |+> and |->, and out-of-range b is clamped', () => {
  closeState(po.qubit(0), q.ket0());
  closeState(po.qubit(1), q.ket1());
  closeState(po.qubit(S2), q.plus());
  closeState(po.qubit(-S2), q.minus());
  closeState(po.qubit(1.5), q.ket1());
  closeState(po.qubit(-1.5), [q.c(0), q.c(-1)]);
});

test('State: a list whose |amplitude|^2 values do not add up to 1 is not a state', () => {
  assert.equal(po.isState([q.c(1), q.c(1)]), false);
  assert.equal(po.isState([q.c(0), q.c(0)]), false);
  assert.equal(po.isState([q.c(0.6), q.c(0, 0.8)]), true);
});

test('Joining: amplitudes multiply, A is the left bit, and string 10 means A is 1 and B is 0', () => {
  for (const [bA, bB] of pairs) {
    const a = po.qubit(bA), b = po.qubit(bB), s = po.join(a, b);
    assert.equal(s.length, 4);
    for (let x = 0; x < 2; x++) for (let y = 0; y < 2; y++) close(s[2 * x + y].re, a[x].re * b[y].re);
    // quantum.ts reads qubit 0 as the left bit: its chance of 1 is A's.
    close(q.probOne(s, 0), bA * bA);
    close(q.probOne(s, 1), bB * bB);
  }
  assert.deepEqual(po.join(q.ket1(), q.ket0()).map((a) => a.re), [0, 0, 1, 0]);
  assert.deepEqual([...po.STRINGS], [0, 1, 2, 3].map((i) => q.label(i, 2).slice(1, 3)));
});

test('Joining: the norm multiplies, so two states always join into a state', () => {
  const u: q.State = [q.c(1, 2), q.c(-0.5, 0.25)], v: q.State = [q.c(0.3), q.c(0, -2)];
  close(q.norm2(q.tensor(u, v)), q.norm2(u) * q.norm2(v));
  for (const [bA, bB] of pairs) assert.ok(po.isState(po.join(po.qubit(bA), po.qubit(bB))));
});

test('Joining: qubits made separately give independent results, p(xy) = p_A(x) p_B(y)', () => {
  for (const [bA, bB] of pairs) {
    const p = po.born(po.join(po.qubit(bA), po.qubit(bB))), pa = [1 - bA * bA, bA * bA], pb = [1 - bB * bB, bB * bB];
    for (let x = 0; x < 2; x++) for (let y = 0; y < 2; y++) close(p[2 * x + y], pa[x] * pb[y]);
  }
});

test('Change: no change, H on A and CNOT are unitary; sending 0 and 1 both to 0 is not', () => {
  for (const k of ALLOWED) { assert.ok(po.isUnitary(po.matrix(k)), k); assert.ok(po.allowed(k), k); }
  assert.equal(po.isUnitary(po.matrix('merge')), false);
  assert.equal(po.allowed('merge'), false);
  assert.equal(po.isUnitary(po.MERGE), false);
});

test('Change: each allowed change is its own inverse, so it can be undone; merge sends |00> and |10> to the same state', () => {
  for (const k of ALLOWED) {
    const m = q.matMul(po.matrix(k), po.matrix(k));
    m.forEach((row, i) => row.forEach((x, j) => { close(x.re, i === j ? 1 : 0); close(x.im, 0); }));
  }
  const m00 = po.change('merge', q.basis(2, 0)), m10 = po.change('merge', q.basis(2, 2));
  closeState(m00, q.basis(2, 0));
  closeState(m10, q.basis(2, 0));
});

test('Change: the 4x4 matrices act like quantum.ts gates on qubit 0 (A) and CNOT from A to B', () => {
  for (const [bA, bB] of pairs) {
    const s = po.join(po.qubit(bA), po.qubit(bB));
    closeState(po.change('none', s), s);
    closeState(po.change('h', s), q.apply1(s, q.H, 0, 2));
    closeState(po.change('cnot', s), q.cnot(s, 0, 1, 2));
    closeState(po.change('merge', s), q.apply1(s, po.MERGE, 0, 2));
  }
  closeState(po.change('h', wild), q.apply1(wild, q.H, 0, 2));
  closeState(po.change('cnot', wild), q.cnot(wild, 0, 1, 2));
});

test('Change: a reset to |0> is not the merge map. It is a channel with Kraus |0><0| and |0><1|: trace preserving, |+> and |-> both go to |0><0|, no amplitudes add', () => {
  const K0: q.Matrix = [[q.c(1), q.c(0)], [q.c(0), q.c(0)]], K1: q.Matrix = [[q.c(0), q.c(1)], [q.c(0), q.c(0)]];
  // Sum K†K = I: the reset never loses or adds probability, for every state.
  const kk = [K0, K1].map((k) => q.matMul(q.dagger(k), k));
  kk[0].forEach((row, i) => row.forEach((x, j) => { close(x.re + kk[1][i][j].re, i === j ? 1 : 0); close(x.im + kk[1][i][j].im, 0); }));
  // Whichever Kraus branch fires, the output is |0>. For |+> and |-> alike each branch has chance 1/2.
  for (const s of [q.plus(), q.minus(), q.ket0(), q.ket1(), wild.slice(0, 2)]) {
    const n = q.normalize(s), outs = [K0, K1].map((k) => q.matVec(k, n));
    close(outs.reduce((t, v) => t + q.norm2(v), 0), 1);
    for (const v of outs) if (q.norm2(v) > 1e-12) close(q.abs(q.inner(q.normalize(v), q.ket0())), 1); // |0> up to a global phase
  }
  close(q.norm2(q.matVec(K0, q.plus())), 0.5);
  close(q.norm2(q.matVec(K1, q.minus())), 0.5);
  // The merge map instead adds amplitudes: |+> gets total 2, |-> gets 0. Not a channel.
  close(q.norm2(q.matVec(po.MERGE, q.plus())), 2);
  close(q.norm2(q.matVec(po.MERGE, q.minus())), 0);
});

test('Change: unitaries keep the total at 1 and keep inner products, for every state the tool reaches and a complex one', () => {
  for (const k of ALLOWED) {
    for (const [bA, bB] of pairs) close(po.total(po.change(k, po.join(po.qubit(bA), po.qubit(bB)))), 1);
    close(po.total(po.change(k, wild)), 1);
    const u = po.join(po.qubit(0.3), po.qubit(-0.8)), before = q.inner(u, wild), afterIt = q.inner(po.change(k, u), po.change(k, wild));
    close(afterIt.re, before.re); close(afterIt.im, before.im);
  }
});

test('Change: merge gives total (a0 + a1)^2 = 1 + 2 a0 a1; 200% at |+>, 0% at |->, 100% only at |0> and |1>', () => {
  for (const [bA, bB] of pairs) {
    const a = po.qubit(bA), t = po.total(po.change('merge', po.join(a, po.qubit(bB))));
    close(t, (a[0].re + a[1].re) ** 2);
    close(t, 1 + 2 * a[0].re * a[1].re);
  }
  close(po.total(po.change('merge', po.join(po.qubit(S2), po.qubit(0)))), 2);
  assert.equal(po.total(po.change('merge', po.join(po.qubit(-S2), po.qubit(0.6)))), 0);
  for (const bA of [0, 1, -1]) assert.ok(po.isState(po.change('merge', po.join(po.qubit(bA), po.qubit(0.6)))));
  // On the slider grid, no other A keeps the total at 100%: |2 a0 a1| is at least 2 * 0.01 * sqrt(1 - 0.0001).
  for (const bA of fine) if (bA !== 0 && Math.abs(bA) !== 1) assert.equal(po.isState(po.change('merge', po.join(po.qubit(bA), po.qubit(0)))), false);
  // Complex amplitudes do not rescue it: |+i> = (|0> + i|1>)/sqrt2 also goes to (1 + i)/sqrt2 |0>, total 100%, but |+> does not.
  const plusI: q.State = [q.c(S2), q.c(0, S2)];
  close(po.total(po.change('merge', q.tensor(plusI, q.ket0()))), 1);
});

test('Known values: started as |+> and |0>, CNOT gives (|00> + |11>)/sqrt2 with chances 50% and 50%', () => {
  const s = po.change('cnot', po.join(po.qubit(S2), po.qubit(0)));
  closeState(s, [q.c(S2), q.c(0), q.c(0), q.c(S2)]);
  assert.deepEqual(po.born(s).map((p) => Math.round(p * 1e12) / 1e12), [0.5, 0, 0, 0.5]);
  close(po.concurrence(s), 1);
  assert.equal(po.isProduct(s), false);
});

test('Known values: a Hadamard gate on A makes the two contributions to A = 1 cancel for |+> and add for |->', () => {
  for (const bB of coarse) {
    const b = po.qubit(bB);
    const fromPlus = po.change('h', po.join(po.qubit(S2), b)), fromMinus = po.change('h', po.join(po.qubit(-S2), b));
    closeState(fromPlus, po.join(q.ket0(), b));
    closeState(fromMinus, po.join(q.ket1(), b));
    // Cancelled amplitudes are exactly 0 after clean, so their chance shows as 0%, not <0.1%.
    assert.equal(fromPlus[2].re, 0); assert.equal(fromPlus[3].re, 0);
    assert.equal(pct(po.born(fromPlus)[2]), '0%');
  }
});

test('Product test: every joined pair splits; H on A keeps it split; CNOT entangles by 2|a0 a1 (b0^2 - b1^2)|', () => {
  for (const [bA, bB] of pairs) {
    const a = po.qubit(bA), b = po.qubit(bB), s = po.join(a, b);
    assert.ok(po.isProduct(s));
    assert.ok(po.isProduct(po.change('h', s)));
    assert.ok(po.isProduct(po.change('none', s)));
    const cn = po.change('cnot', s), want = 2 * Math.abs(a[0].re * a[1].re * (b[0].re ** 2 - b[1].re ** 2));
    close(po.concurrence(cn), want);
    assert.equal(po.isProduct(cn), want < 1e-9);
  }
  // Started as |+> and |+>, CNOT changes nothing: still a product.
  assert.ok(po.isProduct(po.change('cnot', po.join(po.qubit(S2), po.qubit(S2)))));
  // The test is exact for complex states too: a phase on one qubit keeps a product a product.
  assert.ok(po.isProduct(q.tensor([q.c(0.6), q.c(0, 0.8)], [q.c(S2), q.c(-0.5, 0.5)])));
});

test('Measurement: Born chances add up to 1 for every allowed change and every state the tool reaches', () => {
  for (const k of ALLOWED) for (const [bA, bB] of pairs) {
    const p = po.born(po.change(k, po.join(po.qubit(bA), po.qubit(bB))));
    close(sum(p), 1);
    p.forEach((x) => assert.ok(x >= 0 && x <= 1));
  }
});

test('Measurement: shot is the inverse of the running total, so over an even grid of draws each string comes up p times', () => {
  const N = 10000;
  for (const p of [[0.5, 0, 0, 0.5], [0.1, 0.2, 0.3, 0.4], [0, 0, 1, 0], [0.25, 0.25, 0.25, 0.25]]) {
    const got = [0, 0, 0, 0];
    for (let i = 0; i < N; i++) got[po.shot(p, () => (i + 0.5) / N)]++;
    got.forEach((g, i) => assert.ok(Math.abs(g / N - p[i]) <= 1 / N, `${g / N} vs ${p[i]}`));
  }
});

test('Measurement: a string with chance 0 never comes up, even when the chances add up to a hair under 1', () => {
  const p = [0.5, 0.49999999999999994, 0, 0];
  assert.equal(po.shot(p, () => 0.9999999999999999), 1);
  assert.equal(po.shot([0.5, 0, 0, 0.5], () => 0.49), 0);
  assert.equal(po.shot([0.5, 0, 0, 0.5], () => 0.5), 3);
  assert.equal(po.shot([0, 0, 1, 0], () => 0), 2);
});

test('Measurement: after outcome j the state is |j> up to a phase, and measuring again gives j for sure', () => {
  for (const s of [wild, po.change('cnot', po.join(po.qubit(S2), po.qubit(0.3)))]) {
    po.born(s).forEach((p, j) => {
      if (p === 0) return;
      const t = po.after(s, j);
      close(q.norm2(t), 1);
      close(q.abs(q.inner(q.basis(2, j), t)), 1);
      close(po.born(t)[j], 1);
    });
  }
  assert.throws(() => po.after(po.join(q.ket0(), q.ket0()), 3));
});

test('Measurement: rank-2 projectors |x><x| ⊗ I read only A, with the right odds and state left behind', () => {
  const pA = [0, 1].map((x) => q.kron([[0, 1].map((j) => q.c(x === 0 && j === 0 ? 1 : 0)), [0, 1].map((j) => q.c(x === 1 && j === 1 ? 1 : 0))], q.I));
  // A projective measurement: each P is a projector (P² = P = P†), the two are orthogonal, and they add up to I.
  for (const P of pA) {
    q.matMul(P, P).forEach((row, i) => row.forEach((x, j) => { close(x.re, P[i][j].re); close(x.im, P[i][j].im); }));
    q.dagger(P).forEach((row, i) => row.forEach((x, j) => { close(x.re, P[i][j].re); close(x.im, P[i][j].im); }));
  }
  q.matMul(pA[0], pA[1]).forEach((row) => row.forEach((x) => close(q.abs(x), 0)));
  const sumP = pA[0].map((row, i) => row.map((x, j) => q.add(x, pA[1][i][j])));
  sumP.forEach((row, i) => row.forEach((x, j) => close(x.re, i === j ? 1 : 0)));
  // Started as |+> and B = |0>, then CNOT: A reads 0 or 1 with chance 1/2 each, and B is left matching A.
  const bell = po.change('cnot', po.join(po.qubit(S2), po.qubit(0)));
  const r0 = po.project(bell, pA[0]), r1 = po.project(bell, pA[1]);
  close(r0.p, 0.5); close(r1.p, 0.5);
  closeState(r0.state, q.basis(2, 0)); closeState(r1.state, q.basis(2, 3));
  // A product state keeps B untouched: |a> ⊗ |b> goes to |x> ⊗ |b> with chance |a_x|^2.
  const b = po.qubit(-0.6), prod = po.join(po.qubit(0.8), b), m1 = po.project(prod, pA[1]);
  close(m1.p, 0.64);
  closeState(m1.state, q.tensor(q.ket1(), b));
  // On a complex state it agrees with quantum.ts measureQubit on qubit 0, and the odds add up to 1.
  for (const x of [0, 1] as const) {
    const m = po.project(wild, pA[x]);
    close(m.p, x ? q.probOne(wild, 0) : 1 - q.probOne(wild, 0));
    closeState(m.state, q.measureQubit(wild, 0, () => (x ? 0 : 1 - 1e-15), 2).state);
  }
  close(po.project(wild, pA[0]).p + po.project(wild, pA[1]).p, 1);
  // Rank 1 is the whole-string case: after() uses |j><j|.
  closeState(po.after(wild, 2), po.project(wild, po.stringProjector(2)).state);
});

test('Measurement: expected counts are n |amplitude|^2 and add up to n; counts tally shots', () => {
  const s = po.change('cnot', po.join(po.qubit(0.6), po.qubit(0)));
  const e = po.expected(s, 100);
  e.forEach((x, i) => close(x, [64, 0, 0, 36][i], 1e-9));
  close(sum(e), 100, 1e-9);
  assert.deepEqual(po.counts([0, 3, 3, 1, 0, 0]), [3, 1, 0, 2]);
});

test('Text: amplitudes to 3 decimals with a true minus sign; tiny real ones are never 0.000', () => {
  assert.equal(po.amp(S2), '0.707');
  assert.equal(po.amp(-0.6), '−0.600');
  assert.equal(po.amp(0), '0.000');
  assert.equal(po.amp(1e-4), '0.0001');
  assert.equal(po.amp(-4.1e-5), '−0.00004');
  assert.equal(po.amp(Math.SQRT2), '1.414');
});

test('Text: kets leave out zero amplitudes and show signs; the zero vector is 0', () => {
  assert.equal(po.ket(po.change('cnot', po.join(po.qubit(S2), po.qubit(0)))), '0.707|00⟩ + 0.707|11⟩');
  assert.equal(po.ket(po.join(po.qubit(0.6), po.qubit(0))), '0.800|00⟩ + 0.600|10⟩');
  assert.equal(po.ket(po.qubit(-S2)), '0.707|0⟩ − 0.707|1⟩');
  assert.equal(po.ket([q.c(0), q.c(-1)]), '−1.000|1⟩');
  assert.equal(po.ket(po.change('merge', po.join(po.qubit(-S2), po.qubit(0)))), '0');
  assert.equal(po.ket(po.change('merge', po.join(po.qubit(S2), po.qubit(0)))), '1.414|00⟩');
});

test('Text: chances use draw.ts pct, and float dust never turns a sure or impossible result into >99.9% or <0.1%', () => {
  // Started as |+> and B = |0>, a Hadamard on A makes 00 certain; float error would give 0.9999999999999998 without clean().
  const sure = po.born(po.change('h', po.join(po.qubit(Math.SQRT1_2), po.qubit(0))));
  assert.deepEqual(sure.map(pct), ['100%', '0%', '0%', '0%']);
  assert.equal(po.oddsText([0.9999, 0.0001, 0, 0]), '00 with chance >99.9%, 01 with chance <0.1%; the other strings never come up');
  assert.equal(po.oddsText([0.625, 0.375, 0, 0]), '00 with chance 63%, 01 with chance 38%; the other strings never come up');
  assert.equal(po.totalText(1 + 1e-15), '100%');
  assert.equal(po.totalText(1.9999999999999996), '200%');
  assert.equal(po.totalText(0), '0%');
  assert.equal(po.totalText(3.4e-5), '<0.1%');
  assert.equal(po.totalText(1.02), '102%');
  assert.equal(po.totalText(0.9996), '99.9%');
  assert.equal(po.totalText(1.0004), '100.1%');
});

test('Text: presets are named, other states are written as kets', () => {
  assert.equal(po.name(0), '|0⟩');
  assert.equal(po.name(1), '|1⟩');
  assert.equal(po.name(S2), '|+⟩');
  assert.equal(po.name(-S2), '|−⟩');
  assert.equal(po.name(0.6), '0.800|0⟩ + 0.600|1⟩');
  assert.equal(po.name(0.71), '0.704|0⟩ + 0.710|1⟩');
});

test('Readout: names the start state, the change and the Born odds', () => {
  assert.equal(
    po.describe(S2, 0, 'cnot'),
    'Started as A = |+⟩ and B = |0⟩. Joined, the pair is 0.707|00⟩ + 0.707|10⟩. Then a CNOT with A as control gives 0.707|00⟩ + 0.707|11⟩. '
      + 'The |amplitude|² values still add up to 100%. The pair no longer splits into one state for A and one for B: it is entangled. '
      + 'Born rule: 00 with chance 50%, 11 with chance 50%; the other strings never come up.',
  );
  assert.match(po.describe(S2, 0, 'h'), /^Started as A = \|\+⟩ and B = \|0⟩\. .*gives 1\.000\|00⟩\. .*splits into one state for A and one for B\. Born rule: 00 with chance 100%; the other strings never come up\.$/);
  assert.match(po.describe(0, 0, 'none'), /With no change it stays that way\./);
  for (const [bA, bB] of pairs) for (const k of po.CHANGES) assert.ok(po.describe(bA, bB, k).startsWith(`Started as A = ${po.name(bA)} and B = ${po.name(bB)}.`));
});

test('Readout: the not-unitary change says the total and that the rules forbid it', () => {
  const plus = po.describe(S2, 0, 'merge');
  assert.match(plus, /gives 1\.414\|00⟩\. The \|amplitude\|² values now add up to 200%, not 100%, so they cannot be odds\./);
  assert.match(plus, /not unitary, so the rules forbid it in a closed system\. Measuring is off for it\.$/);
  assert.match(po.describe(-S2, 0, 'merge'), /gives 0\. The \|amplitude\|² values now add up to 0%/);
  assert.match(po.describe(1, 0, 'merge'), /still add up to 100%, but only because A started as 0 or 1\. Start A as \|\+⟩ and they add up to 200%\./);
});

test('Readout after shots: counts against the Born prediction, with the start state and the change', () => {
  assert.equal(
    po.shotsText(S2, 0, 'cnot', [0, 3, 3, 0, 0]),
    'Started as A = |+⟩ and B = |0⟩, then a CNOT with A as control: 5 copies measured. 00 gave 3, 01 gave 0, 10 gave 0, 11 gave 2. The Born rule predicts about 2.5, 0, 0, 2.5.',
  );
  assert.match(po.shotsText(0, 0, 'none', [0]), /^Started as A = \|0⟩ and B = \|0⟩, with no change: 1 copy measured\./);
  assert.match(po.shotsText(0, 0, 'none', new Array(po.CAP).fill(0)), /The plot is full\. Press Clear to start again\.$/);
});
