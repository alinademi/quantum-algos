import test from 'node:test';
import assert from 'node:assert/strict';
import * as q from '../quantum.ts';
import * as m from './multi-qubit.ts';
import type { Order, Setting } from './multi-qubit.ts';

const close = (a: number, b: number, eps = 1e-12) => assert.ok(Math.abs(a - b) < eps, `${a} != ${b}`);
const ORDERS: Order[] = ['left', 'right'];
const NS = [1, 2, 3, 4];
/** Every way to set n qubits: 3^n lists. */
const allSettings = (n: number): Setting[][] =>
  n === 0 ? [[]] : allSettings(n - 1).flatMap((s) => m.SETTINGS.map((x) => [...s, x]));
const every = (fn: (s: Setting[], order: Order, n: number) => void) => {
  for (const n of NS) for (const s of allSettings(n)) for (const o of ORDERS) fn(s, o, n);
};

// ---- Counting: 2^n amplitudes

test('n qubits need 2^n amplitudes: known values, and each qubit doubles the count', () => {
  assert.deepEqual([1, 2, 3, 4].map(m.amplitudeCount), [2, 4, 8, 16]);
  assert.equal(m.amplitudeCount(10), 1024);
  assert.equal(m.amplitudeCount(30), 1_073_741_824);
  assert.ok(m.amplitudeCount(30) > 1e9, '30 qubits: over a billion');
  assert.equal(m.amplitudeCount(50), 1_125_899_906_842_624);
  for (let n = 1; n < 50; n++) assert.equal(m.amplitudeCount(n + 1), 2 * m.amplitudeCount(n));
});

test('the state vector of the register has exactly 2^n entries', () => {
  every((s, o, n) => assert.equal(m.registerState(s, o).length, m.amplitudeCount(n)));
});

test('strings in counting order: n digits, all different, alphabetical order is the same as number order', () => {
  for (const n of [1, 2, 3, 4, 10]) {
    const strs = Array.from({ length: 2 ** n }, (_, i) => m.bitString(i, n));
    strs.forEach((t) => assert.match(t, new RegExp(`^[01]{${n}}$`)));
    assert.equal(new Set(strs).size, 2 ** n);
    assert.deepEqual([...strs].sort(), strs);
    strs.forEach((t, i) => assert.equal(parseInt(t, 2), i));
  }
  assert.deepEqual([0, 1, 2, 3].map((i) => m.bitString(i, 2)), ['00', '01', '10', '11']);
});

// ---- Bit order

test('weights: qubit 0 on the left is worth 2^(n-1); on the right it is worth 1', () => {
  assert.deepEqual([0, 1, 2].map((k) => m.weight(k, 3, 'left')), [4, 2, 1]);
  assert.deepEqual([0, 1, 2].map((k) => m.weight(k, 3, 'right')), [1, 2, 4]);
  for (const n of NS) for (const o of ORDERS) {
    const w = Array.from({ length: n }, (_, k) => m.weight(k, n, o));
    assert.equal(w.reduce((a, b) => a + b, 0), 2 ** n - 1, 'all ones is the last entry');
    assert.deepEqual([...w].sort((a, b) => a - b), Array.from({ length: n }, (_, k) => 2 ** k));
  }
});

test('written order and position agree: the qubit written at position p sits at position p', () => {
  assert.deepEqual(m.writtenOrder(3, 'left'), [0, 1, 2]);
  assert.deepEqual(m.writtenOrder(3, 'right'), [2, 1, 0]);
  for (const n of NS) for (const o of ORDERS) m.writtenOrder(n, o).forEach((k, p) => assert.equal(m.position(k, n, o), p));
});

test('indexOf and bitsOf undo each other, and the character at qubit k\'s position is qubit k\'s bit', () => {
  for (const n of NS) for (const o of ORDERS) for (let i = 0; i < 2 ** n; i++) {
    const bits = m.bitsOf(i, n, o);
    assert.equal(m.indexOf(bits, o), i);
    bits.forEach((b, k) => assert.equal(Number(m.bitString(i, n)[m.position(k, n, o)]), b));
  }
});

test('example: 3 qubits, qubit 0 is 1 and the rest 0. Left order: 100, entry 4. Right order: 001, entry 1', () => {
  assert.equal(m.indexOf([1, 0, 0], 'left'), 4);
  assert.equal(m.bitString(4, 3), '100');
  assert.equal(m.indexOf([1, 0, 0], 'right'), 1);
  assert.equal(m.bitString(1, 3), '001');
});

test('Watrous example, qubit 0 on the right: in 0000000110, qubits 1 and 2 are 1 and the rest 0', () => {
  const i = parseInt('0000000110', 2);
  assert.deepEqual(m.bitsOf(i, 10, 'right'), [0, 1, 1, 0, 0, 0, 0, 0, 0, 0]);
});

test('flipping the order moves entry i to its bit reversal, and flipping twice changes nothing', () => {
  assert.equal(m.bitReverse(1, 3), 4);
  assert.equal(m.bitReverse(6, 3), 3);
  assert.equal(m.bitReverse(5, 3), 5);
  for (const n of NS) for (let i = 0; i < 2 ** n; i++) {
    assert.equal(m.bitReverse(m.bitReverse(i, n), n), i);
    const bits = m.bitsOf(i, n, 'left');
    assert.equal(m.indexOf(bits, 'right'), m.bitReverse(i, n));
  }
});

// ---- One qubit, then the register

test('each qubit setting: |0>, |1>, and |+> = H|0> with amplitudes 1/sqrt2; P(1) is 0, 1 and 1/2', () => {
  assert.deepEqual(m.qubitState('0'), [q.c(1), q.c(0)]);
  m.qubitState('1').forEach((a, i) => { close(a.re, i); close(a.im, 0); });
  m.qubitState('+').forEach((a) => { close(a.re, Math.SQRT1_2); close(a.im, 0); });
  close(m.probOne('0'), 0); close(m.probOne('1'), 1); close(m.probOne('+'), 0.5);
});

test('every register state is a unit vector: the Born-rule chances add to 1', () => {
  every((s, o) => close(q.norm2(m.registerState(s, o)), 1));
});

test('left order matches the core simulator (qubit 0 is the leftmost bit there): set each qubit with a gate on |0...0>', () => {
  for (const n of NS) for (const s of allSettings(n)) {
    let st = q.basis(n, 0);
    s.forEach((x, k) => { if (x !== '0') st = q.apply1(st, x === '1' ? q.X : q.H, k, n); });
    m.registerState(s, 'left').forEach((a, i) => { close(a.re, st[i].re); close(a.im, st[i].im); });
  }
});

test('right order is the same state with each entry moved to its bit reversal', () => {
  every((s, _o, n) => {
    const L = m.registerState(s, 'left'), R = m.registerState(s, 'right');
    R.forEach((a, i) => { close(a.re, L[m.bitReverse(i, n)].re); close(a.im, L[m.bitReverse(i, n)].im); });
  });
});

test('amplitudes multiply: entry x gets the product of each qubit\'s amplitude for its bit', () => {
  every((s, o, n) => {
    m.registerState(s, o).forEach((a, i) => {
      const bits = m.bitsOf(i, n, o);
      close(a.re, bits.reduce((t, b, k) => t * m.qubitState(s[k])[b].re, 1));
      close(a.im, 0);
    });
  });
});

test('with k qubits on +, exactly 2^k amplitudes are not zero, each 1/sqrt(2^k), so each chance is 1/2^k', () => {
  every((s, o) => {
    const k = s.filter((x) => x === '+').length, st = m.registerState(s, o);
    const on = st.filter((a) => !m.isZero(a));
    assert.equal(on.length, 2 ** k);
    on.forEach((a) => { close(a.re, 2 ** (-k / 2)); close(q.abs2(a), 1 / 2 ** k); });
  });
});

test('known states: H on both of two qubits gives 1/2 on all four strings; |1>|0>|+> gives 1/sqrt2 on 100 and 101', () => {
  m.registerState(['+', '+'], 'left').forEach((a) => close(a.re, 0.5));
  const st = m.registerState(['1', '0', '+'], 'left');
  st.forEach((a, i) => close(a.re, i === 4 || i === 5 ? Math.SQRT1_2 : 0));
  const r = m.registerState(['1', '0', '+'], 'right');
  r.forEach((a, i) => close(a.re, i === 1 || i === 5 ? Math.SQRT1_2 : 0));
});

// ---- Shots follow the Born rule

test('Born rule: the chance a shot lands on entry x is |alpha_x|^2, in both orders, and the chances add to 1', () => {
  every((s, o, n) => {
    const p = q.probs(m.registerState(s, o));
    let t = 0;
    for (let i = 0; i < 2 ** n; i++) { const c = m.landingChance(i, s, o); close(c, p[i]); t += c; }
    close(t, 1);
  });
});

test('shots: counts add to the batch size, and no shot lands on an amplitude of 0', () => {
  const rand = q.rng(7);
  for (let rep = 0; rep < 5; rep++) {
    const us = m.newDraws(rand);
    assert.equal(us.length, m.SHOTS);
    us.forEach((u) => { assert.equal(u.length, m.MAX_QUBITS); u.forEach((x) => assert.ok(x >= 0 && x < 1)); });
    every((s, o, n) => {
      const st = m.registerState(s, o), k = m.counts(m.landing(m.measureAll(us, s), o), n);
      assert.equal(k.reduce((a, b) => a + b, 0), m.SHOTS);
      k.forEach((x, i) => { if (m.isZero(st[i])) assert.equal(x, 0); });
    });
  }
});

test('a register with no + qubit gives the same string every shot', () => {
  const us = m.newDraws(q.rng(3));
  for (const n of NS) for (const s of allSettings(n).filter((x) => !x.includes('+'))) for (const o of ORDERS) {
    const k = m.counts(m.landing(m.measureAll(us, s), o), n);
    assert.equal(k[m.indexOf(s.map(Number), o)], m.SHOTS);
  }
});

test('many shots: each string turns up about |amplitude|^2 of the time (within 5 standard errors)', () => {
  const N = 200_000, us = m.newDraws(q.rng(11), N);
  for (const s of [['+', '+', '+', '+'], ['1', '+', '0', '+'], ['+', '1', '+']] as Setting[][]) for (const o of ORDERS) {
    const n = s.length, p = q.probs(m.registerState(s, o)), k = m.counts(m.landing(m.measureAll(us, s), o), n);
    p.forEach((pi, i) => {
      const se = Math.sqrt((pi * (1 - pi)) / N);
      assert.ok(Math.abs(k[i] / N - pi) <= 5 * se + 1e-12, `${m.bitString(i, n)}: ${k[i] / N} vs ${pi}`);
    });
  }
});

test('flipping the order relabels the same shots: each count moves to the bit-reversed entry', () => {
  const us = m.newDraws(q.rng(5));
  for (const n of NS) for (const s of allSettings(n)) {
    const res = m.measureAll(us, s), L = m.counts(m.landing(res, 'left'), n), R = m.counts(m.landing(res, 'right'), n);
    L.forEach((x, i) => assert.equal(R[m.bitReverse(i, n)], x));
  }
});

test('changing one qubit changes only that qubit\'s bit in each shot, so the other qubits\' results stay put', () => {
  const us = m.newDraws(q.rng(9));
  for (const s of allSettings(4)) for (let k = 0; k < 4; k++) for (const x of m.SETTINGS) {
    const t = [...s]; t[k] = x;
    const a = m.measureAll(us, s), b = m.measureAll(us, t);
    a.forEach((bits, j) => bits.forEach((v, i) => { if (i !== k) assert.equal(b[j][i], v); }));
  }
});

test('expected counts are SHOTS * |amplitude|^2 and add to SHOTS', () => {
  every((s, o) => {
    const st = m.registerState(s, o), e = m.expected(st);
    close(e.reduce((a, b) => a + b, 0), m.SHOTS, 1e-9);
    e.forEach((x, i) => close(x, m.SHOTS * q.abs2(st[i]), 1e-9));
  });
});

// ---- Words and numbers

test('amp: two decimals, exact 0 shows as 0, true minus sign', () => {
  assert.equal(m.amp(0), '0');
  assert.equal(m.amp(1e-17), '0');
  assert.equal(m.amp(1), '1.00');
  assert.equal(m.amp(Math.SQRT1_2), '0.71');
  assert.equal(m.amp(0.5), '0.50');
  assert.equal(m.amp(2 ** -1.5), '0.35');
  assert.equal(m.amp(0.25), '0.25');
  assert.equal(m.amp(-Math.SQRT1_2), '−0.71');
});

test('chance: exact 1 in N for 1/N, else a whole percent', () => {
  assert.equal(m.chance(0.5), '1 in 2');
  assert.equal(m.chance(0.5000000000000001), '1 in 2');
  assert.equal(m.chance(1 / 8), '1 in 8');
  assert.equal(m.chance(1 / 16), '1 in 16');
  assert.equal(m.chance(0.3), '30%');
});

test('order line: |q0 q1 q2> on the left, |q2 q1 q0> on the right', () => {
  assert.equal(m.orderText(3, 'left'), '|q0 q1 q2⟩');
  assert.equal(m.orderText(3, 'right'), '|q2 q1 q0⟩');
  assert.equal(m.orderText(1, 'right'), '|q0⟩');
});

test('state line: product form, then written out with zero terms left out', () => {
  assert.equal(m.stateText(['1', '0', '+'], 'left'), '|1⟩|0⟩|+⟩ = 0.71|100⟩ + 0.71|101⟩');
  assert.equal(m.stateText(['1', '0', '+'], 'right'), '|+⟩|0⟩|1⟩ = 0.71|001⟩ + 0.71|101⟩');
  assert.equal(m.stateText(['+', '+'], 'left'), '|+⟩|+⟩ = 0.50|00⟩ + 0.50|01⟩ + 0.50|10⟩ + 0.50|11⟩');
  assert.equal(m.stateText(['1', '1'], 'left'), '|1⟩|1⟩ = |11⟩');
  assert.equal(m.stateText(['0'], 'left'), '|0⟩');
  assert.equal(m.stateText(['+'], 'right'), '|+⟩ = 0.71|0⟩ + 0.71|1⟩');
  every((s, o) => {
    const st = m.registerState(s, o);
    assert.equal(m.ketText(st).split(' + ').length, st.filter((a) => !m.isZero(a)).length);
  });
});

test('readout: known sentences for the default register in both orders', () => {
  const s: Setting[] = ['1', '0', '+'];
  const L = [0, 0, 0, 0, 47, 53, 0, 0], R = [0, 47, 0, 0, 0, 53, 0, 0];
  assert.equal(m.readout(s, 'left', L),
    '3 qubits, so 8 amplitudes. Not zero: 0.71 on |100⟩ (entry 4) and 0.71 on |101⟩ (entry 5), a 1 in 2 chance each. ' +
    'Qubit 0 is the leftmost bit, worth 4 in the entry number. Of 100 shots, 47 gave 100 and 53 gave 101. None gave a string with amplitude 0.');
  assert.equal(m.readout(s, 'right', R),
    '3 qubits, so 8 amplitudes. Not zero: 0.71 on |001⟩ (entry 1) and 0.71 on |101⟩ (entry 5), a 1 in 2 chance each. ' +
    'Qubit 0 is the rightmost bit, worth 1 in the entry number. Of 100 shots, 47 gave 001 and 53 gave 101. None gave a string with amplitude 0.');
});

test('readout: one string, all strings, one qubit, and many strings', () => {
  const one = new Array(8).fill(0); one[4] = 100;
  assert.equal(m.readout(['1', '0', '0'], 'left', one),
    '3 qubits, so 8 amplitudes. Only the amplitude on |100⟩ (entry 4) is not zero: it is 1. Qubit 0 is the leftmost bit, worth 4 in the entry number. All 100 shots gave the string 100. None gave a string with amplitude 0.');
  assert.equal(m.readout(['+', '+'], 'right', [23, 27, 24, 26]),
    '2 qubits, so 4 amplitudes. All 4 are 0.50, so each string has a 1 in 4 chance. Qubit 0 is the rightmost bit, worth 1 in the entry number. Of 100 shots, 23 gave 00, 27 gave 01, 24 gave 10 and 26 gave 11.');
  assert.equal(m.readout(['+'], 'left', [52, 48]),
    '1 qubit, so 2 amplitudes. Both are 0.71, so each string has a 1 in 2 chance. With one qubit, both orders are the same. Of 100 shots, 52 gave 0 and 48 gave 1.');
  const many = [7, 5, 6, 8, 4, 9, 6, 5, 11, 2, 7, 6, 8, 5, 6, 5];
  assert.equal(m.readout(['+', '+', '+', '+'], 'left', many),
    '4 qubits, so 16 amplitudes. All 16 are 0.25, so each string has a 1 in 16 chance. Qubit 0 is the leftmost bit, worth 8 in the entry number. Of 100 shots, each of these 16 strings got between 2 and 11.');
  const some = new Array(16).fill(0); [0, 1, 2, 3, 8, 9, 10, 11].forEach((i, j) => { some[i] = 10 + j; });
  assert.match(m.readout(['+', '0', '+', '+'], 'left', some), /8 are 0\.35, so each of those strings has a 1 in 8 chance\. The other 8 are 0\..*between 10 and 17\. None gave a string with amplitude 0\.$/);
});

test('readout always states the right number of amplitudes, and says "None gave" only when some amplitude is 0', () => {
  const us = m.newDraws(q.rng(2));
  every((s, o, n) => {
    const st = m.registerState(s, o), k = m.counts(m.landing(m.measureAll(us, s), o), n), t = m.readout(s, o, k);
    assert.ok(t.startsWith(`${n} qubit${n > 1 ? 's' : ''}, so ${2 ** n} amplitudes.`));
    assert.equal(t.includes('None gave'), st.some((a) => m.isZero(a)));
    assert.ok(!/NaN|undefined|Infinity/.test(t));
  });
});
