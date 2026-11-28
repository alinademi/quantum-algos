import test from 'node:test';
import assert from 'node:assert/strict';
import * as q from '../quantum.ts';
import * as e from './entanglement-entropy.ts';

const close = (a: number, b: number, eps = 1e-12) => assert.ok(Math.abs(a - b) < eps, `${a} != ${b}`);
const S2 = Math.SQRT1_2;
/** p from 0 to 1 in whole percents, and turns from 0 to 180 degrees. */
const PS = Array.from({ length: 101 }, (_, i) => i / 100);
const ALPHAS = [0, 15, 35, 60, 90, 120, 155, 180].map(e.rad);
/** A random normalized two-qubit state with complex amplitudes, from a seeded generator. */
const random2 = (r: () => number): q.State => q.normalize(Array.from({ length: 4 }, () => q.c(r() - 0.5, r() - 0.5)));
const rand = q.rng(42);
const RANDOM = Array.from({ length: 60 }, () => random2(rand));
const phiGrid = Array.from({ length: 361 }, (_, d) => e.rad(d));

// ---- Entropy of odds

test('entropy: 0 for certain odds, 1 for a fair coin, h(1/4) = 2 - (3/4) log2 3, and 0 log 0 = 0', () => {
  assert.ok(Object.is(e.entropy([1]), 0));
  assert.ok(Object.is(e.entropy([1, 0, 0]), 0));
  close(e.entropy([0.5, 0.5]), 1);
  close(e.binaryEntropy(0.25), 2 - 0.75 * Math.log2(3));
  close(e.binaryEntropy(0.25), 0.8112781244591328);
  assert.ok(Object.is(e.binaryEntropy(0), 0));
  assert.ok(Object.is(e.binaryEntropy(1), 0));
});

test('entropy of d equal odds is log2 d, so n bits give n and a qutrit pair gives log2 3', () => {
  for (let d = 1; d <= 64; d++) close(e.entropy(Array(d).fill(1 / d)), Math.log2(d));
  for (let n = 0; n <= 10; n++) close(e.entropy(Array(2 ** n).fill(2 ** -n)), n);
  close(e.maxEntropy(3), 1.584962500721156);
  close(e.maxEntropy(2), 1);
});

test('entropy is between 0 and log2 d for any odds (Gibbs), and the binary entropy is symmetric', () => {
  const r = q.rng(5);
  for (let d = 2; d <= 8; d++) for (let k = 0; k < 40; k++) {
    const w = Array.from({ length: d }, () => r() ** 3), t = w.reduce((a, b) => a + b, 0), odds = w.map((x) => x / t);
    const S = e.entropy(odds);
    assert.ok(S >= 0 && S <= Math.log2(d) + 1e-12, `${S} for ${d}`);
  }
  for (const p of PS) close(e.binaryEntropy(p), e.binaryEntropy(1 - p));
});

test('entropy adds for independent odds: n copies of E give n E', () => {
  const w = [0.25, 0.75], E = e.entropy(w);
  let all = [1];
  for (let n = 1; n <= 6; n++) {
    all = all.flatMap((x) => w.map((y) => x * y));
    close(e.entropy(all), n * E);
  }
});

// ---- The pair

test('pairState: started as 00, p = 0 stays 00, p = 1 is 11, p = 1/2 is the Bell pair, p is the chance of 11', () => {
  assert.deepEqual(e.pairState(0), q.basis(2, 0));
  // cos(pi/2) is 6e-17 in floats, so p = 1 is |11> up to dust.
  e.pairState(1).forEach((a, i) => { close(a.re, i === 3 ? 1 : 0); close(a.im, 0); });
  const bell = e.pairState(0.5);
  close(bell[0].re, S2); close(bell[3].re, S2); close(bell[1].re, 0); close(bell[2].re, 0);
  for (const p of PS) {
    const s = e.pairState(p);
    close(q.norm2(s), 1);
    close(q.abs2(s[3]), p); close(q.abs2(s[0]), 1 - p);
    for (const a of s) close(a.im, 0);
    assert.deepEqual(e.pairState(p, 0), s);
  }
});

/** |psi><psi| as a 4 by 4 matrix, and tr_B of a 4 by 4 matrix, written out from the definition. */
const dm = (s: q.State): q.Matrix => s.map((x) => s.map((y) => q.mul(x, q.conj(y))));
const traceB = (r: q.Matrix): q.Matrix => [0, 1].map((a) => [0, 1].map((a2) => q.add(r[2 * a][2 * a2], r[2 * a + 1][2 * a2 + 1])));
const trace = (r: q.Matrix) => r.reduce((t, row, i) => t + row[i].re, 0);
const purity = (r: q.Matrix) => trace(q.matMul(r, r));

test('Bell pair: tr_B of the pair gives I/2, entropy 1; product: entropy 0', () => {
  const rho = traceB(dm(e.pairState(0.5)));
  close(rho[0][0].re, 0.5); close(rho[1][1].re, 0.5); close(rho[0][1].re, 0); close(rho[1][0].re, 0);
  close(e.entropy(e.eigenvalues(rho)), 1);
  close(e.entropyA(e.pairState(0.5)), 1);
  close(e.entropyA(e.pairState(0)), 0); close(e.entropyA(e.pairState(1)), 0);
});

test('reducedA is tr_B of |psi><psi| for random complex pairs', () => {
  for (const s of RANDOM) {
    const want = traceB(dm(s)), got = e.reducedA(s);
    for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) { close(got[i][j].re, want[i][j].re); close(got[i][j].im, want[i][j].im); }
  }
});

test('the pair as a whole: rho_AB = |psi><psi| has trace 1 and rho^2 = rho, so its eigenvalues are 1, 0, 0, 0 and S = 0', () => {
  for (const s of [...PS.map((p) => e.pairState(p, e.rad(35))), ...RANDOM]) {
    const r = dm(s), r2 = q.matMul(r, r);
    close(trace(r), 1); close(purity(r), 1);
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { close(r2[i][j].re, r[i][j].re); close(r2[i][j].im, r[i][j].im); }
    // A projector's only nonzero eigenvalue is its trace, 1: the entropy is that of the odds [1].
    close(e.wholeEntropy(s), e.entropy([trace(r), 0, 0, 0]));
    close(e.wholeEntropy(s), 0);
  }
});

test('E = h(p) for the tool pair, however A is turned: a local gate does not change the entropy', () => {
  for (const p of PS) for (const a of ALPHAS) {
    const s = e.pairState(p, a);
    close(e.entropyA(s), e.binaryEntropy(p), 1e-9);
    close(e.entropyB(s), e.binaryEntropy(p), 1e-9);
    close(e.entanglementEntropy(s), e.binaryEntropy(p), 1e-9);
  }
});

test('Aaronson 11.2.1: (3/5)|0>|+> + (4/5)|1>|-> has weights 9/25 and 16/25 and E about 0.942', () => {
  const s = q.tensor([q.c(1), q.c(0)], q.plus()).map((a) => q.scale(a, 0.6)).map((a, i) => q.add(a, q.scale(q.tensor([q.c(0), q.c(1)], q.minus())[i], 0.8)));
  close(q.norm2(s), 1);
  const [w1, w2] = e.schmidtWeights(s);
  close(w1, 16 / 25); close(w2, 9 / 25);
  const E = -(0.36 * Math.log2(0.36) + 0.64 * Math.log2(0.64));
  close(e.entropyA(s), E); close(e.entropyB(s), E); close(e.entanglementEntropy(s), E);
  assert.ok(E > 0.942 && E < 0.943);
  close(e.entropyA(e.pairState(0.64)), E);
});

// ---- Any pure two-qubit state

test('S(A) = S(B) = H(Schmidt weights) for random complex two-qubit states (Wilde Theorem 11.2.1)', () => {
  for (const s of RANDOM) {
    close(e.entropyA(s), e.entropyB(s), 1e-9);
    close(e.entropyA(s), e.entanglementEntropy(s), 1e-9);
    const [a1, a2] = e.eigenvalues(e.reducedA(s)), [b1, b2] = e.eigenvalues(e.reducedB(s)), [w1, w2] = e.schmidtWeights(s);
    close(a1, b1, 1e-12); close(a2, b2, 1e-12); close(a1, w1, 1e-12); close(a2, w2, 1e-12);
    close(a1 + a2, 1); close(w1 + w2, 1);
    assert.ok(w1 >= w2 && w2 >= 0);
  }
});

test('reduced matrices have trace 1, are Hermitian, and give the Born rule chances of a test on A with B left alone', () => {
  const kets = [q.ket0(), q.ket1(), q.plus(), q.fromBloch(1.1, 2.3)];
  for (const s of RANDOM) {
    for (const rho of [e.reducedA(s), e.reducedB(s)]) {
      close(rho[0][0].re + rho[1][1].re, 1); close(rho[0][0].im, 0); close(rho[1][1].im, 0);
      close(rho[0][1].re, rho[1][0].re); close(rho[0][1].im, -rho[1][0].im);
    }
    for (const u of kets) {
      const side = (b: q.State) => q.abs2(q.inner(q.tensor(u, b), s));
      let t = q.c(0);
      const rho = e.reducedA(s);
      for (let j = 0; j < 2; j++) for (let k = 0; k < 2; k++) t = q.add(t, q.mul(q.mul(q.conj(u[j]), rho[j][k]), u[k]));
      close(t.re, side(q.ket0()) + side(q.ket1()));
      const rhoB = e.reducedB(s);
      let tb = q.c(0);
      for (let j = 0; j < 2; j++) for (let k = 0; k < 2; k++) tb = q.add(tb, q.mul(q.mul(q.conj(u[j]), rhoB[j][k]), u[k]));
      close(tb.re, q.abs2(q.inner(q.tensor(q.ket0(), u), s)) + q.abs2(q.inner(q.tensor(q.ket1(), u), s)));
    }
  }
});

test('closed form for two qubits: weights (1 ± sqrt(1 - C^2))/2 with C = 2|psi00 psi11 - psi01 psi10|, product of weights C^2/4', () => {
  for (const s of RANDOM) {
    const C = e.concurrence(s), [w1, w2] = e.weightsFromConcurrence(C);
    assert.ok(C >= 0 && C <= 1 + 1e-12);
    close(w1 * w2, C * C / 4); close(w1 + w2, 1);
    close(w1, (1 + Math.sqrt(1 - C * C)) / 2);
    const det = q.sub(q.mul(s[0], s[3]), q.mul(s[1], s[2]));
    close(C, 2 * q.abs(det));
  }
  close(e.concurrence(e.pairState(0.5)), 1);
  close(e.concurrence(e.pairState(0)), 0);
  close(e.concurrence(q.tensor(q.plus(), q.plus())), 0);
  for (const p of PS) close(e.concurrence(e.pairState(p)), 2 * Math.sqrt(p * (1 - p)));
  assert.deepEqual(e.weightsFromConcurrence(0), [1, 0]);
  assert.deepEqual(e.weightsFromConcurrence(1), [0.5, 0.5]);
});

test('every product state has entropy 0; the four Bell states have entropy 1', () => {
  for (const t of [0, 0.4, 1.1, 2.2, Math.PI]) for (const f of [0, 0.7, 2.5, 4.4]) for (const u of [0, 1.3, 2.9]) {
    const s = q.tensor(q.fromBloch(t, f), q.fromBloch(u, f + 1));
    close(e.entropyA(s), 0, 1e-12); close(e.entropyB(s), 0, 1e-12); close(e.entanglementEntropy(s), 0, 1e-12);
  }
  for (const s of [[S2, 0, 0, S2], [S2, 0, 0, -S2], [0, S2, S2, 0], [0, S2, -S2, 0]].map((a) => a.map((x) => q.c(x)))) {
    close(e.entropyA(s), 1); close(e.entropyB(s), 1); close(e.entanglementEntropy(s), 1);
  }
});

test('local gates on A and on B never change the entropy; a CNOT can make it from nothing', () => {
  for (const s of RANDOM.slice(0, 20)) {
    const E = e.entropyA(s);
    let t = q.apply1(s, q.RY(0.9), 0, 2); t = q.apply1(t, q.RZ(2.1), 0, 2); t = q.apply1(t, q.H, 1, 2); t = q.apply1(t, q.RX(1.3), 1, 2); t = q.apply1(t, q.T, 0, 2);
    close(e.entropyA(t), E, 1e-9); close(e.entropyB(t), E, 1e-9);
  }
  // Started as 00, a Hadamard gate on A: still a product. Then a CNOT: a Bell pair.
  const h = q.apply1(q.basis(2, 0), q.H, 0, 2);
  close(e.entropyA(h), 0, 1e-12);
  close(e.entropyA(q.cnot(h, 0, 1, 2)), 1);
});

test('the entropy never goes above log2 of the smaller side: 1 for two qubits', () => {
  for (const s of RANDOM) { const E = e.entropyA(s); assert.ok(E >= 0 && E <= 1 + 1e-12); }
  for (const p of PS) assert.ok(e.entropyA(e.pairState(p)) <= 1 + 1e-12);
  // Equal weights are the only way to reach it.
  for (const p of PS) if (Math.abs(p - 0.5) > 1e-9) assert.ok(e.entropyA(e.pairState(p)) < 1);
});

test('mixed pair caveat: a coin picking 00 or 11 has the same rho_A as the Bell pair, but its whole is mixed and each member is a product', () => {
  const half = (i: number) => dm(q.basis(2, i)).map((row) => row.map((x) => q.scale(x, 0.5)));
  const coin = half(0).map((row, i) => row.map((x, j) => q.add(x, half(3)[i][j])));
  // The whole is mixed: trace 1, purity 1/2, not a projector.
  close(trace(coin), 1); close(purity(coin), 0.5);
  // Trace out B: A alone is I/2, entropy 1, the Bell pair's A alone.
  const rhoA = traceB(coin), bellA = traceB(dm(e.pairState(0.5)));
  for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) { close(rhoA[i][j].re, bellA[i][j].re); close(rhoA[i][j].im, bellA[i][j].im); }
  close(e.entropy(e.eigenvalues(rhoA)), 1);
  // The coin is a plain mix of two product states, each with E = 0. The Bell pair is pure: purity 1.
  close(e.entanglementEntropy(q.basis(2, 0)), 0); close(e.entanglementEntropy(q.basis(2, 3)), 0);
  close(purity(dm(e.pairState(0.5))), 1);
});

// ---- Measuring A alone

test('chanceFirst: matches the whole pair (rotate A by -phi, then read qubit A) and the two results sum to 1', () => {
  for (const p of [0, 0.1, 0.25, 0.5, 0.64, 1]) for (const a of ALPHAS) for (const phi of phiGrid.filter((_, i) => i % 15 === 0)) {
    const s = e.pairState(p, a), P = e.chanceFirst(e.reducedA(s), phi);
    const back = q.apply1(s, q.RY(-phi), 0, 2);
    close(P, 1 - q.probOne(back, 0, 2), 1e-12);
    assert.ok(P >= 0 && P <= 1);
  }
});

test('spread is never below S, and equals S at A\'s own basis (Aaronson 11.6: S is the least Shannon entropy over bases)', () => {
  for (const p of PS) for (const a of ALPHAS) {
    const s = e.pairState(p, a), rho = e.reducedA(s), E = e.entropyA(s);
    for (const phi of phiGrid.filter((_, i) => i % 7 === 0)) assert.ok(e.spread(rho, phi) >= E - 1e-12, `p=${p} a=${a} phi=${phi}`);
    close(e.spread(rho, e.rad(e.lowestAngle(rho))), E, 1e-9);
  }
  for (const s of RANDOM) {
    const rho = e.reducedA(s);
    for (const phi of phiGrid.filter((_, i) => i % 5 === 0)) assert.ok(e.spread(rho, phi) >= e.entropyA(s) - 1e-12);
  }
});

test('spread has period 180 degrees and is symmetric about A\'s own basis', () => {
  for (const p of [0.1, 0.25, 0.64]) {
    const rho = e.reducedA(e.pairState(p, e.rad(35)));
    for (const d of [0, 10, 33, 80, 140]) {
      close(e.spread(rho, e.rad(d)), e.spread(rho, e.rad(d + 180)), 1e-12);
      close(e.spread(rho, e.rad(35 + d)), e.spread(rho, e.rad(35 - d)), 1e-12);
    }
  }
});

test('lowestAngle is the turn of A (mod 180) for every p but 1/2; away from it the spread is strictly above S', () => {
  for (const p of PS) for (const a of [0, 20, 35, 90, 155]) {
    const rho = e.reducedA(e.pairState(p, e.rad(a)));
    if (Math.abs(p - 0.5) < 1e-9) { assert.equal(e.lowestAngle(rho), 0); continue; }
    const d = e.lowestAngle(rho), gap = Math.min(Math.abs(d - a), 180 - Math.abs(d - a));
    assert.ok(gap < 1e-6 || p === 0 && gap < 1e-6, `p=${p} a=${a} d=${d}`);
    if (p > 0 && p < 1) assert.ok(e.spread(rho, e.rad(a + 10)) > e.entropyA(e.pairState(p, e.rad(a))));
  }
  assert.ok(e.lowestAngle(e.reducedA(e.pairState(0.3, e.rad(35)))) >= 0);
});

test('a Bell pair gives a fair coin at every angle; a product gives certainty only at its own angle', () => {
  const bell = e.reducedA(e.pairState(0.5, e.rad(20)));
  for (const phi of phiGrid) { close(e.chanceFirst(bell, phi), 0.5); close(e.spread(bell, phi), 1); }
  // Started as 00, a Hadamard gate on A is |+>: certain in the +/- basis (90 degrees), a fair coin in the 0/1 basis.
  const plus = e.reducedA(q.apply1(q.basis(2, 0), q.H, 0, 2));
  close(e.spread(plus, e.rad(90)), 0); close(e.spread(plus, 0), 1);
  close(e.lowestAngle(plus), 90);
});

test('curve has steps + 1 points from 0 to 180 degrees and matches spread', () => {
  const rho = e.reducedA(e.pairState(0.25, e.rad(40))), c = e.curve(rho, 36);
  assert.equal(c.length, 37);
  c.forEach((v, i) => close(v, e.spread(rho, e.rad(5 * i))));
  close(c[0], c[36], 1e-12);
});

test('shoot: a Born rule draw. The thresholds sit at the chance, and 20000 seeded shots land within 5 sigma', () => {
  const rho = e.reducedA(e.pairState(0.25, e.rad(35)));
  for (const phi of [0, e.rad(35), e.rad(100)]) {
    const P = e.chanceFirst(rho, phi);
    assert.equal(e.shoot(rho, phi, () => P - 1e-9), 0);
    assert.equal(e.shoot(rho, phi, () => P + 1e-9), 1);
    const r = q.rng(11), n = 20000;
    let first = 0;
    for (let i = 0; i < n; i++) if (e.shoot(rho, phi, r) === 0) first++;
    assert.ok(Math.abs(first / n - P) < 5 * Math.sqrt(P * (1 - P) / n) + 1e-12, `${first / n} vs ${P}`);
  }
  // A certain result is always the same one.
  const sure = e.reducedA(q.apply1(q.basis(2, 0), q.H, 0, 2)), r = q.rng(3);
  for (let i = 0; i < 200; i++) assert.equal(e.shoot(sure, e.rad(90), r), 0);
});

// ---- Words and numbers

test('bits never shows a real entropy as 0 or 1, and shows exact ones plainly', () => {
  assert.equal(e.bits(0), '0'); assert.equal(e.bits(1), '1'); assert.equal(e.bits(1 - 1e-12), '1'); assert.equal(e.bits(1e-12), '0');
  assert.equal(e.bits(0.9427), '0.94'); assert.equal(e.bits(0.5), '0.50');
  assert.equal(e.bits(0.003), 'under 0.01'); assert.equal(e.bits(0.9991), 'over 0.99');
  assert.equal(e.bits(e.entropyA(e.pairState(0.01))), '0.08');
  assert.equal(e.bits(e.entropyA(e.pairState(0.5, e.rad(35)))), '1');
  assert.equal(e.bits(e.entropyA(e.pairState(0, e.rad(35)))), '0');
});

test('percent and amp: true minus, no "-0", no 0% or 100% for a real chance', () => {
  assert.equal(e.percent(0), '0%'); assert.equal(e.percent(1), '100%'); assert.equal(e.percent(0.5), '50%');
  assert.equal(e.percent(0.001), 'under 1%'); assert.equal(e.percent(0.999), 'over 99%'); assert.equal(e.percent(0.625), '63%');
  assert.equal(e.amp(0), '0'); assert.equal(e.amp(-1e-17), '0'); assert.equal(e.amp(0.6), '0.60'); assert.equal(e.amp(-0.31), '−0.31');
  assert.equal(e.amp(-0.001), '0.00');
});

test('percent agrees with itself at the edges: 1% and 99% never turn into "under 1%" or "over 99%" through float dust', () => {
  for (let n = 1; n <= 99; n++) { assert.equal(e.percent(n / 100), `${n}%`); assert.equal(e.percent(1 - (100 - n) / 100), `${n}%`); }
  assert.equal(e.percent(1 - 0.01), '99%'); assert.equal(e.percent(0.99), '99%'); assert.equal(e.percent(0.01), '1%');
  assert.equal(e.percent(0.0099), 'under 1%'); assert.equal(e.percent(0.9901), 'over 99%');
  // weightsText and startText name the same percents for every whole-percent p.
  for (let n = 1; n <= 99; n++) {
    const p = n / 100, big = Math.max(p, 1 - p), small = Math.min(p, 1 - p), w = e.weightsText(e.pairState(p, e.rad(35)));
    if (n !== 50) assert.ok(w.includes(`${Math.round(big * 100)}% and ${Math.round(small * 100)}%`), `${n}: ${w}`);
    const st = e.startText(p, 0);
    assert.ok(st.includes(`${100 - n}% on 00 and ${n}% on 11`), `${n}: ${st}`);
  }
});

test('bitsWord says "1 bit", never "1 bits"', () => {
  assert.equal(e.bitsWord(1), '1 bit'); assert.equal(e.bitsWord(0), '0 bits'); assert.equal(e.bitsWord(0.5), '0.50 bits'); assert.equal(e.bitsWord(0.9427), '0.94 bits');
  for (const p of [0, 0.1, 0.5, 0.64]) for (const d of [0, 35, 90]) assert.ok(!/\b1 bits\b/.test(e.readout(p, 0, e.rad(d), 0, 0)));
});

test('pairKet: known kets and the turned pair', () => {
  assert.equal(e.pairKet(0, 0), '|00⟩');
  assert.equal(e.pairKet(1, 0), '|11⟩');
  assert.equal(e.pairKet(0.5, 0), '(|00⟩ + |11⟩)/√2');
  assert.equal(e.pairKet(0.64, 0), '0.60|00⟩ + 0.80|11⟩');
  // A turned by 90 degrees: the |0> of A becomes |+>. Started as 00 this is a product.
  assert.equal(e.pairKet(0, e.rad(90)), '(|00⟩ + |10⟩)/√2');
  assert.equal(e.pairKet(0, e.rad(180)), '|10⟩');
  assert.match(e.pairKet(0.64, e.rad(35)), /^[−\d.|⟩+ 0-9]+$/);
});

test('readout names the start state, the weights, S for both sides, 0 for the whole, and never an em dash', () => {
  const seen = new Set<string>();
  for (const p of [0, 0.25, 0.5, 0.64, 1]) for (const a of [0, 35, 90]) for (const d of [0, 35, 77, 180]) {
    const t = e.readout(p, e.rad(a), e.rad(d), 3, 4);
    seen.add(t);
    assert.match(t, /^Started as 00/);
    assert.match(t, /pure state, has 0/);
    assert.match(t, /3 shots? on A|7 shots on A/);
    assert.ok(!t.includes('—') && !t.includes(' - '), t);
    assert.ok(!/NaN|undefined|Infinity/.test(t), t);
  }
  assert.ok(seen.size > 20);
  assert.match(e.readout(0, 0, 0, 0, 0), /product.*entanglement entropy is 0/);
  assert.match(e.readout(0.5, 0, 0, 0, 0), /1 bit, one ebit, the most that two qubits can have/);
  assert.match(e.readout(0.5, 0, e.rad(33), 0, 0), /1 bit of average surprise per shot, at every angle/);
  assert.match(e.readout(0.64, 0, 0, 0, 0), /64% and 36%|36% and 64%/);
  assert.match(e.readout(0.64, 0, 0, 0, 0), /0\.94 bits/);
  assert.match(e.readout(0.25, e.rad(35), e.rad(35), 0, 0), /basis of A's Schmidt terms/);
  assert.match(e.readout(0.25, e.rad(35), e.rad(0), 0, 0), /No angle goes below it/);
  assert.match(e.readout(0.25, 0, 0, 0, 0), /No shots yet/);
  assert.equal(e.shotsText(0, 0), 'No shots yet.');
  assert.equal(e.shotsText(3, 4), '7 shots on A: 3 gave the first result and 4 the second.');
});

test('fromPercent rounds and clamps; startText names the start state', () => {
  assert.equal(e.fromPercent(64), 0.64); assert.equal(e.fromPercent(-3), 0); assert.equal(e.fromPercent(120), 1); assert.equal(e.fromPercent(49.6), 0.5);
  assert.match(e.startText(0.25, 0), /^Started as 00/);
  assert.match(e.startText(0.25, e.rad(35)), /turned by 35°/);
});
