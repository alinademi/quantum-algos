import test from 'node:test';
import assert from 'node:assert/strict';
import * as q from '../quantum.ts';
import * as e from './entanglement.ts';

const close = (a: number, x: number, eps = 1e-12) => assert.ok(Math.abs(a - x) < eps, `${a} != ${x}`);
const closeState = (u: q.State, v: q.State) => u.forEach((a, i) => { close(a.re, v[i].re); close(a.im, v[i].im); });
const S2 = Math.SQRT1_2;
const P = [0, 0.01, 0.1, 0.25, 0.3, 0.5, 0.64, 0.75, 0.9, 0.99, 1];
const SOURCES: e.Source[] = ['quantum', 'coin'];

// Two-qubit states written as [amp of 00, 01, 10, 11].
const st = (...a: (number | q.C)[]): q.State => a.map((x) => (typeof x === 'number' ? q.c(x) : x));
const PHI_PLUS = st(S2, 0, 0, S2), PHI_MINUS = st(S2, 0, 0, -S2), PSI_PLUS = st(0, S2, S2, 0), PSI_MINUS = st(0, S2, -S2, 0);
const BELL = [PHI_PLUS, PHI_MINUS, PSI_PLUS, PSI_MINUS];

// One-qubit states for product pairs: points all over the Bloch sphere, complex ones included.
const ONE: q.State[] = [];
for (const t of [0, 0.4, 1.1, Math.PI / 2, 2.2, 2.9, Math.PI]) for (const f of [0, 0.7, Math.PI / 2, 2.5, Math.PI, 4.4]) ONE.push(q.fromBloch(t, f));

// ---- The pairs

test('pairState(p) is a unit vector sqrt(1-p)|00> + sqrt(p)|11> with real, non-negative amplitudes', () => {
  for (const p of P) {
    const s = e.pairState(p);
    close(q.norm2(s), 1);
    close(s[0].re, Math.sqrt(1 - p)); close(s[3].re, Math.sqrt(p));
    assert.deepEqual([s[1], s[2]], [q.c(0), q.c(0)]);
    s.forEach((a) => { close(a.im, 0); assert.ok(a.re >= 0); });
  }
  assert.deepEqual(e.pairState(-1), e.pairState(0));
  assert.deepEqual(e.pairState(2), e.pairState(1));
});

test('presets: p = 0 is |00>, p = 1 is |11>, p = 1/2 is the Bell pair (|00> + |11>)/√2', () => {
  assert.deepEqual(e.pairState(0), q.basis(2, 0));
  assert.deepEqual(e.pairState(1), q.basis(2, 3));
  closeState(e.pairState(0.5), PHI_PLUS);
});

test('the Bell pair is made from 00 by a Hadamard gate on A, then a CNOT from A to B', () => {
  const made = q.cnot(q.apply1(q.basis(2, 0), q.H, 0, 2), 0, 1, 2);
  closeState(made, e.pairState(0.5));
});

test('the start recipe makes the pair: started as 00, RY(turnDegrees(p)) on A, then a CNOT from A to B', () => {
  for (const p of P) {
    const made = q.cnot(q.apply1(q.basis(2, 0), q.RY((e.turnDegrees(p) * Math.PI) / 180), 0, 2), 0, 1, 2);
    closeState(made, e.pairState(p));
  }
  close(e.turnDegrees(0), 0); close(e.turnDegrees(0.5), 90); close(e.turnDegrees(1), 180); close(e.turnDegrees(0.25), 60);
  // At 90° the RY turn does what a Hadamard gate does to 0.
  closeState(q.matVec(q.RY(Math.PI / 2), q.ket0()), q.matVec(q.H, q.ket0()));
  assert.equal(e.startText('quantum', 0), 'Started as 00, with no gates');
  assert.equal(e.startText('quantum', 0.25), 'Started as 00, then an RY gate on A, a turn of the qubit by 60°, then a CNOT from A to B');
  assert.equal(e.startText('quantum', 0.01), 'Started as 00, then an RY gate on A, a turn of the qubit by about 11.5°, then a CNOT from A to B');
  assert.equal(e.startText('coin', 0.5), 'Each pair starts as 00 or 11, picked by a coin: 00 with chance 50%, 11 with chance 50%');
});

test('every readout and source line names the start state', () => {
  for (const src of SOURCES) for (const p of P) for (const s of [e.sourceText(src, p), e.readout(src, p, e.tally([]), e.tally([])), e.readout(src, p, e.tally([[0, 0]]), e.tally([[1, 1]]))]) {
    assert.match(s, /Started as 00|starts as 00|starts as 11/);
  }
});

test('the coin picks |00> with chance 1 - p and |11> with chance p', () => {
  const [a, b] = e.coinPicks();
  assert.deepEqual(a, q.basis(2, 0)); assert.deepEqual(b, q.basis(2, 3));
  for (const p of P) { const [x, y] = e.coinOdds(p); close(x + y, 1); close(y, p); }
});

// ---- The split test

test('every product |a>|b> passes the split test, and factor() gives back a state per qubit', () => {
  for (const a of ONE) for (const b of ONE) {
    const s = q.tensor(a, b);
    close(q.abs(e.splitGap(s)), 0);
    assert.ok(e.splits(s));
    const f = e.factor(s)!;
    closeState(q.tensor(f[0], f[1]), s);
    close(q.norm2(f[0]), 1); close(q.norm2(f[1]), 1);
  }
});

test('Watrous: ½(|00> + i|01> − |10> − i|11>) is a product, (|0> − |1>)/√2 times (|0> + i|1>)/√2', () => {
  const s = st(0.5, q.c(0, 0.5), -0.5, q.c(0, -0.5));
  assert.ok(e.splits(s));
  closeState(q.tensor(st(S2, -S2), st(S2, q.c(0, S2))), s);
  const [a, b] = e.factor(s)!;
  closeState(q.tensor(a, b), s);
  // The factors are the same states as Watrous's, up to a global phase: |<u|v>| = 1.
  close(q.abs(q.inner(a, st(S2, -S2))), 1); close(q.abs(q.inner(b, st(S2, q.c(0, S2)))), 1);
});

test('|+>|+> = ½(|00> + |01> + |10> + |11>) splits, though all four amplitudes are non-zero', () => {
  const s = st(0.5, 0.5, 0.5, 0.5);
  closeState(s, q.tensor(q.plus(), q.plus()));
  assert.ok(e.splits(s));
});

test('all four Bell states fail the split test: the gap is ±½', () => {
  for (const s of BELL) { close(q.abs(e.splitGap(s)), 0.5); assert.ok(!e.splits(s)); assert.equal(e.factor(s), null); }
});

test('Watrous: 3/5|00> + 4/5|11> is entangled too; only a non-zero value matters', () => {
  close(e.splitGap(st(0.6, 0, 0, 0.8)).re, 0.48);
  assert.ok(!e.splits(st(0.6, 0, 0, 0.8)));
});

test('the quantum pair has gap sqrt(p(1-p)): entangled exactly when 0 < p < 1', () => {
  for (const p of P) {
    close(e.splitGap(e.pairState(p)).re, Math.sqrt(p * (1 - p)));
    assert.equal(e.entangled('quantum', p), p > 0 && p < 1);
    assert.equal(e.entangled('coin', p), false);
  }
});

test('gates on one qubit each cannot change |gap|: (U ⊗ V) multiplies it by det U det V', () => {
  const gates = [q.H, q.X, q.S, q.T, q.RY(0.8), q.RX(2.1), q.RZ(-1.3), q.P(0.4)];
  const det = (m: q.Matrix) => q.sub(q.mul(m[0][0], m[1][1]), q.mul(m[0][1], m[1][0]));
  for (const s of [...BELL, e.pairState(0.3), q.tensor(ONE[9], ONE[20])]) for (const u of gates) for (const v of gates) {
    const out = q.apply1(q.apply1(s, u, 0, 2), v, 1, 2), want = q.mul(q.mul(det(u), det(v)), e.splitGap(s)), got = e.splitGap(out);
    close(got.re, want.re); close(got.im, want.im);
    close(q.abs(got), q.abs(e.splitGap(s)));
  }
});

// ---- The tests and the Born rule

test('Born rule: the odds of 00, 01, 10, 11 are non-negative and sum to 1, for every source, test and p', () => {
  for (const src of SOURCES) for (const t of e.TESTS) for (const p of P) {
    const o = e.odds(src, p, t);
    assert.equal(o.length, 4);
    o.forEach((x) => assert.ok(x >= 0 && x <= 1));
    close(o.reduce((a, b) => a + b, 0), 1);
  }
});

test('the +/- test is a Hadamard gate on each qubit: it sends |+>|+> to |00> and |->|-> to |11>', () => {
  closeState(e.turnBoth(q.tensor(q.plus(), q.plus())), q.basis(2, 0));
  closeState(e.turnBoth(q.tensor(q.minus(), q.minus())), q.basis(2, 3));
  closeState(e.turnBoth(e.turnBoth(e.pairState(0.3))), e.pairState(0.3));
});

test('Bell pair: H on each qubit gives back the same state, so both tests give 00 or 11 with equal chance', () => {
  closeState(e.turnBoth(PHI_PLUS), PHI_PLUS);
  for (const t of e.TESTS) {
    const o = e.odds('quantum', 0.5, t);
    close(o[0], 0.5); close(o[3], 0.5);
    assert.equal(o[1], 0); assert.equal(o[2], 0); // exactly 0 after float dust is cleaned, so a draw can never land there
  }
});

test('Bell pair: each qubit alone gives 0 or 1 with equal chance in both tests', () => {
  for (const t of e.TESTS) {
    const o = e.odds('quantum', 0.5, t);
    close(o[2] + o[3], 0.5); close(o[1] + o[3], 0.5); // A reads 1; B reads 1
  }
});

test('in the 0/1 test the coin pair gives exactly the same odds as the quantum pair', () => {
  for (const p of P) { const a = e.odds('coin', p, '01'), b = e.odds('quantum', p, '01'); a.forEach((x, i) => close(x, b[i])); }
  for (const p of P) { const o = e.odds('quantum', p, '01'); close(o[0], 1 - p); close(o[3], p); }
});

test('in the +/- test the coin pair gives all four results with equal chance, whatever p', () => {
  for (const p of P) e.odds('coin', p, 'pm').forEach((x) => close(x, 0.25));
});

test('agreement matches the closed forms: 1 in the 0/1 test; ½ + sqrt(p(1-p)) or ½ in the +/- test', () => {
  for (const src of SOURCES) for (const t of e.TESTS) for (const p of P) close(e.agreeChance(src, p, t), e.agreeFormula(src, p, t));
  close(e.agreeChance('quantum', 0.25, 'pm'), 0.5 + Math.sqrt(3) / 4);
  close(e.agreeChance('quantum', 0.5, 'pm'), 1);
  close(e.agreeChance('quantum', 0, 'pm'), 0.5);
});

test('agreement is P(agree) = (1 + E)/2 with E = <ZZ> or <XX>', () => {
  // <XX> = <psi|X (x) X|psi>, worked out with quantum.ts.
  const XX = (s: q.State) => q.inner(s, q.apply1(q.apply1(s, q.X, 0, 2), q.X, 1, 2)).re;
  const ZZ = (s: q.State) => q.inner(s, q.apply1(q.apply1(s, q.Z, 0, 2), q.Z, 1, 2)).re;
  for (const s of [...BELL, e.pairState(0.2), q.tensor(ONE[7], ONE[30])]) {
    close(e.agreeOf(e.pureOdds(s, '01')), (1 + ZZ(s)) / 2);
    close(e.agreeOf(e.pureOdds(s, 'pm')), (1 + XX(s)) / 2);
  }
});

// ---- The score and the 150% bound

test('score: the quantum pair scores 1.5 + sqrt(p(1-p)), the coin pair exactly 1.5', () => {
  for (const p of P) {
    close(e.score('quantum', p), 1.5 + Math.sqrt(p * (1 - p)));
    close(e.score('coin', p), 1.5);
  }
  close(e.score('quantum', 0.5), 2);
});

test('the score is over 150% exactly when the quantum pair is entangled, so the tool’s check catches every pair it makes', () => {
  for (const src of SOURCES) for (const p of P) assert.equal(e.score(src, p) > e.UNENTANGLED_MAX + 1e-12, e.entangled(src, p));
});

test('bound: every product |a>|b> scores 1 + (z_a z_b + x_a x_b)/2, which is at most 1.5', () => {
  for (const a of ONE) for (const b of ONE) {
    const s = q.tensor(a, b), sc = e.agreeOf(e.pureOdds(s, '01')) + e.agreeOf(e.pureOdds(s, 'pm'));
    const [xa, , za] = q.bloch(a), [xb, , zb] = q.bloch(b);
    close(sc, 1 + (za * zb + xa * xb) / 2);
    assert.ok(sc <= e.UNENTANGLED_MAX + 1e-12);
  }
});

test('bound is reached: |0>|0>, |1>|1> and |+>|+> score exactly 1.5', () => {
  for (const s of [q.tensor(q.ket0(), q.ket0()), q.tensor(q.ket1(), q.ket1()), q.tensor(q.plus(), q.plus())]) {
    close(e.agreeOf(e.pureOdds(s, '01')) + e.agreeOf(e.pureOdds(s, 'pm')), 1.5);
  }
});

test('bound holds for plain-odds mixes of products: the score of a mix is the weighted average', () => {
  const mix = (states: q.State[], w: number[]) => e.TESTS.reduce((t, x) => {
    const o = states.map((s) => e.pureOdds(s, x)).reduce((acc, oi, k) => acc.map((v, i) => v + w[k] * oi[i]), [0, 0, 0, 0]);
    return t + e.agreeOf(o);
  }, 0);
  const prods = [q.tensor(ONE[3], ONE[3]), q.tensor(ONE[10], ONE[11]), q.tensor(q.plus(), q.plus()), q.basis(2, 0)];
  const w = [0.1, 0.2, 0.3, 0.4];
  const avg = prods.reduce((t, s, k) => t + w[k] * (e.agreeOf(e.pureOdds(s, '01')) + e.agreeOf(e.pureOdds(s, 'pm'))), 0);
  close(mix(prods, w), avg);
  assert.ok(mix(prods, w) <= 1.5 + 1e-12);
});

test('bound holds for products of mixed one-qubit states: Bloch vectors shorter than 1 score at most 150%', () => {
  // A qubit with Bloch vector l r (|r| = 1, 0 <= l <= 1) is the mix l |psi><psi| + (1 - l) I/2, and I/2 = ½|0><0| + ½|1><1|.
  // So a product of two such qubits is plain odds over nine product pure states, and its score is their weighted average.
  const parts = (s: q.State, l: number) => [[s, l], [q.ket0(), (1 - l) / 2], [q.ket1(), (1 - l) / 2]] as const;
  const pureScore = (s: q.State) => e.agreeOf(e.pureOdds(s, '01')) + e.agreeOf(e.pureOdds(s, 'pm'));
  for (const [la, lb] of [[0.5, 0.5], [0.9, 0.3], [0, 1]]) for (const a of ONE.slice(0, 14)) for (const b of ONE) {
    let sc = 0;
    for (const [sa, wa] of parts(a, la)) for (const [sb, wb] of parts(b, lb)) sc += wa * wb * pureScore(q.tensor(sa, sb));
    const [xa, , za] = q.bloch(a), [xb, , zb] = q.bloch(b);
    close(sc, 1 + (la * lb * (za * zb + xa * xb)) / 2);
    assert.ok(sc <= e.UNENTANGLED_MAX + 1e-12);
  }
  // Half-length Bloch vectors along Z on both qubits: 1 + (0.5 × 0.5)/2 = 1.125.
  let half = 0;
  for (const [sa, wa] of parts(q.ket0(), 0.5)) for (const [sb, wb] of parts(q.ket0(), 0.5)) half += wa * wb * pureScore(q.tensor(sa, sb));
  close(half, 1.125);
});

test('the check works one way only: (|01> + |10>)/√2 and (|00> − |11>)/√2 are entangled yet score 100%', () => {
  for (const s of [PSI_PLUS, PHI_MINUS]) {
    assert.ok(!e.splits(s));
    close(e.agreeOf(e.pureOdds(s, '01')) + e.agreeOf(e.pureOdds(s, 'pm')), 1);
  }
});

// ---- Shots

test('shoot uses the Born rule odds: a draw u picks the first result whose running total passes u', () => {
  // Quantum pair with p = 0.25 in the 0/1 test: 00 below 0.75, 11 above.
  assert.deepEqual(e.shoot('quantum', 0.25, '01', () => 0.1), [0, 0]);
  assert.deepEqual(e.shoot('quantum', 0.25, '01', () => 0.8), [1, 1]);
  // The coin pair draws twice: first the coin (below p picks |11>), then the result.
  const seq = (...u: number[]) => { let i = 0; return () => u[i++]; };
  assert.deepEqual(e.shoot('coin', 0.5, '01', seq(0.3, 0.9)), [1, 1]);
  assert.deepEqual(e.shoot('coin', 0.5, '01', seq(0.7, 0.1)), [0, 0]);
  // In the +/- test each pick gives 00, 01, 10, 11 a quarter each.
  assert.deepEqual([0.1, 0.3, 0.6, 0.9].map((u) => e.shoot('coin', 0.5, 'pm', seq(0.7, u))), [[0, 0], [0, 1], [1, 0], [1, 1]]);
});

test('over an even grid of draws, shots land on each result in exact proportion to its odds', () => {
  const N = 100;
  for (const [src, p, t] of [['quantum', 0.5, 'pm'], ['quantum', 0.25, '01'], ['coin', 0.5, 'pm'], ['coin', 0.3, '01']] as const) {
    const counts = [0, 0, 0, 0], o = e.odds(src, p, t);
    for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
      const u = [(i + 0.5) / N, (j + 0.5) / N]; let k = 0;
      const [a, b] = e.shoot(src, p, t, () => u[k++ % 2]);
      counts[2 * a + b]++;
    }
    // A grid of N points per draw puts each result within one step (1/N) of its odds.
    counts.forEach((n, i) => assert.ok(Math.abs(n / (N * N) - o[i]) <= 1 / N + 1e-12, `${src} ${p} ${t}: ${n} vs ${o[i]}`));
  }
});

test('a Bell pair never disagrees in either test, for any draw', () => {
  for (const t of e.TESTS) for (let i = 0; i < 1000; i++) { const [a, b] = e.shoot('quantum', 0.5, t, () => i / 1000); assert.equal(a, b); }
});

test('pairs take turns between the tests, and tally counts agreements and results', () => {
  assert.deepEqual([0, 1, 2, 3, 4].map(e.testFor), ['01', 'pm', '01', 'pm', '01']);
  assert.deepEqual(e.bitsOf(0), [0, 0]); assert.deepEqual(e.bitsOf(1), [0, 1]); assert.deepEqual(e.bitsOf(2), [1, 0]); assert.deepEqual(e.bitsOf(3), [1, 1]);
  const t = e.tally([[0, 0], [1, 1], [0, 1], [1, 1], [1, 0]]);
  assert.deepEqual(t, { pairs: 5, agreed: 3, counts: [1, 1, 1, 2] });
  assert.equal(e.measured(t), '60%');
  assert.equal(e.measured(e.tally([])), '–');
});

// ---- Words and numbers

test('percent never shows a real chance as 0% or 100%', () => {
  assert.equal(e.percent(0), '0%'); assert.equal(e.percent(1), '100%');
  assert.equal(e.percent(0.004), 'under 1%'); assert.equal(e.percent(0.996), 'over 99%');
  assert.equal(e.percent(0.625), '63%'); assert.equal(e.percent(0.5), '50%');
});

test('score text: 200%, 150%, and "just over 150%" for a score that rounds to 150 but is over it', () => {
  assert.equal(e.scoreText(2), '200%'); assert.equal(e.scoreText(1.5), '150%');
  assert.equal(e.scoreText(1.5 + 1e-4), 'just over 150%'); assert.equal(e.scoreText(1.5 - 1e-4), 'just under 150%');
  assert.equal(e.scoreText(e.score('quantum', 0.01)), '160%');
});

test('slider percent to p, and amplitudes as text', () => {
  assert.equal(e.fromPercent(50), 0.5); assert.equal(e.fromPercent(0), 0); assert.equal(e.fromPercent(100), 1); assert.equal(e.fromPercent(130), 1);
  assert.equal(e.amp(0), '0'); assert.equal(e.amp(1), '1'); assert.equal(e.amp(S2), '0.71'); assert.equal(e.amp(Math.sqrt(0.75)), '0.87');
});

test('kets: |00>, |11>, the Bell pair, and in between', () => {
  assert.equal(e.pairKet(0), '|00⟩'); assert.equal(e.pairKet(1), '|11⟩');
  assert.equal(e.pairKet(0.5), '(|00⟩ + |11⟩)/√2'); assert.equal(e.pairKet(0.25), '0.87|00⟩ + 0.50|11⟩');
  assert.equal(e.oneKet(q.ket0()), '|0⟩'); assert.equal(e.oneKet(q.ket1()), '|1⟩'); assert.equal(e.oneKet([q.c(0.6), q.c(-0.8)]), '0.60|0⟩ − 0.80|1⟩');
});

test('split text: the product |00> splits as |0> times |0>; the Bell pair is entangled; the coin pair is not', () => {
  const zero = e.splitText('quantum', 0), bell = e.splitText('quantum', 0.5), coin = e.splitText('coin', 0.5);
  assert.match(zero, /1 × 0 = 0/); assert.match(zero, /splits as \|0⟩ for A times \|0⟩ for B/); assert.match(zero, /Not entangled/);
  assert.match(e.splitText('quantum', 1), /\|1⟩ for A times \|1⟩ for B/);
  assert.match(bell, /0\.71 × 0\.71 ≈ 0\.50/); assert.match(bell, /Entangled\.$/);
  assert.match(coin, /not entangled/);
});

test('source text: equal amplitudes for the Bell pair, plain odds for the coin', () => {
  assert.match(e.sourceText('quantum', 0.5), /equal amplitudes for 00 and 11, so a 0\/1 measurement gives either with equal chance/);
  assert.match(e.sourceText('quantum', 0.25), /00 with chance 75% and 11 with chance 25%/);
  assert.match(e.sourceText('coin', 0.5), /plain odds, not amplitudes/);
  assert.equal(e.sourceText('coin', 0), 'Each pair starts as 00: the coin always picks 00. These are plain odds, not amplitudes.');
});

test('readout: Born rule score and verdict before any pair; luck note when a small coin batch goes over 150%', () => {
  const none = e.tally([]);
  const bell = e.readout('quantum', 0.5, none, none);
  assert.match(bell, /^Bell pair\. Started as 00, then a Hadamard gate on A and a CNOT from A to B\. Born rule: 100% \+ 100% = 200%\. Over 150%, which no unentangled pair can reach: this pair is entangled\./);
  const coin = e.readout('coin', 0.5, none, none);
  assert.match(coin, /Born rule: 100% \+ 50% = 150%\. Not over 150%/);
  const lucky = e.readout('coin', 0.5, e.tally([[0, 0], [1, 1]]), e.tally([[0, 0], [1, 1], [0, 0], [0, 1]]));
  assert.match(lucky, /Measured score: 100% \+ 75% = 175%/);
  assert.match(lucky, /luck in a small batch/);
  assert.doesNotMatch(e.readout('quantum', 0.5, e.tally([[0, 0]]), e.tally([[1, 1]])), /luck/);
  assert.match(e.readout('quantum', 0.5, e.tally([[0, 0]]), none), /\+\/− test: no pairs yet/);
});

test('text never uses an em dash', () => {
  const all = [
    ...P.flatMap((p) => SOURCES.flatMap((s) => [e.sourceText(s, p), e.splitText(s, p), e.readout(s, p, e.tally([[0, 0]]), e.tally([[0, 1]]))])),
  ].join(' ');
  assert.ok(!all.includes('\u2014'));
});
