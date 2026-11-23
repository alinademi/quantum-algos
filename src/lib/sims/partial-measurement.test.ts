import test from 'node:test';
import assert from 'node:assert/strict';
import * as q from '../quantum.ts';
import {
  PRESETS, QUBITS, MAX_COPIES, preset, bitAt, bits, dropBit, insertBit, restNames, branchChance, odds, collapse, leftover,
  sameLeftover, firstResult, drawIndex, measureCopy, chainChance, columns, tally, roomFor, amp, ketText, percent, dec,
  rootText, about, branch, intro, report, type Bit, type Copy,
} from './partial-measurement.ts';

const close = (a: number, b: number, eps = 1e-12) => assert.ok(Math.abs(a - b) < eps, `${a} != ${b}`);
const closeC = (a: q.C, b: q.C, eps = 1e-12) => { close(a.re, b.re, eps); close(a.im, b.im, eps); };
const closeS = (a: q.State, b: q.State, eps = 1e-12) => { assert.equal(a.length, b.length); a.forEach((x, i) => closeC(x, b[i], eps)); };
const R: Bit[] = [0, 1];
const S2 = Math.SQRT1_2, S3 = Math.sqrt(3), S6 = Math.sqrt(6);
const real = (a: number[]): q.State => a.map((x) => q.c(x));

// Watrous, Multiple systems, Partial measurements: (X, Y) = 1/√2|00> - 1/√6|01> + i/√6|10> + 1/√6|11>, X written first.
const WATROUS: q.State = [q.c(1 / Math.SQRT2), q.c(-1 / S6), q.c(0, 1 / S6), q.c(1 / S6)];

// A few unentangled and entangled states beyond the presets, some complex, on 2 to 4 qubits.
const EXTRA: q.State[] = [
  WATROUS,
  q.tensor(q.tensor(q.fromBloch(1.1, 0.4), q.fromBloch(2.2, -1.3)), q.fromBloch(0.7, 2.5)),
  q.normalize([q.c(1, 2), q.c(0.3), q.c(-0.5, 0.25), q.c(0), q.c(0.1, -0.9), q.c(2), q.c(0, -1), q.c(0.4, 0.4)]),
  q.normalize(Array.from({ length: 16 }, (_, i) => q.c(Math.cos(3 * i + 1), Math.sin(i * i)))),
];
const ALL = [...PRESETS.map((p) => p.state), ...EXTRA];
const n = (s: q.State) => Math.log2(s.length);

test('presets: unit vectors, real amplitudes, and the exact states the page names', () => {
  for (const p of PRESETS) {
    assert.equal(p.state.length, 2 ** QUBITS);
    close(q.norm2(p.state), 1);
    p.state.forEach((a) => close(a.im, 0));
  }
  // Three separate qubits: |+> (started as 0, then a Hadamard gate), 0.6|0> + 0.8|1>, |+>. Amplitudes 0.3 and 0.4.
  const sep = preset('separate').state, h0 = q.matVec(q.H, q.ket0());
  closeS(sep, q.tensor(q.tensor(h0, [q.c(0.6), q.c(0.8)]), h0));
  closeS(sep, real([0.3, 0.3, 0.4, 0.4, 0.3, 0.3, 0.4, 0.4]), 1e-15);
  closeS(preset('agree').state, real([S2, 0, 0, 0, 0, 0, 0, S2]));
  closeS(preset('signed').state, real([0.36, 0, 0, 0.48, 0, 0.48, -0.64, 0]));
  assert.equal(ketText(preset('signed').state), '0.36|000⟩ + 0.48|011⟩ + 0.48|101⟩ − 0.64|110⟩');
  assert.equal(preset('nope' as never).id, PRESETS[0].id);
});

test('bit order matches quantum.ts: qubit 0 is the leftmost bit', () => {
  assert.equal(bitAt(0b100, 0, 3), 1); assert.equal(bitAt(0b100, 2, 3), 0);
  assert.equal(bits(5, 3), '101'); assert.equal(bits(1, 2), '01');
  for (const s of ALL) for (let k = 0; k < n(s); k++) close(branchChance(s, k, 1), q.probOne(s, k));
  for (let i = 0; i < 8; i++) for (let k = 0; k < 3; k++) assert.equal(bitAt(i, k, 3), +bits(i, 3)[k]);
});

test('dropBit and insertBit undo each other and remove exactly qubit k', () => {
  for (const N of [2, 3, 4, 5]) for (let k = 0; k < N; k++) {
    for (let i = 0; i < 2 ** N; i++) {
      const j = dropBit(i, k, N), b = bits(i, N);
      assert.equal(bits(j, N - 1), b.slice(0, k) + b.slice(k + 1));
      assert.equal(insertBit(j, k, bitAt(i, k, N), N), i);
    }
    for (let j = 0; j < 2 ** (N - 1); j++) for (const r of R) assert.equal(dropBit(insertBit(j, k, r, N), k, N), j);
  }
  assert.equal(restNames(1, 3), 'q0 q2'); assert.equal(restNames(0, 3), 'q1 q2'); assert.equal(restNames(2, 3), 'q0 q1');
});

test('Born rule for one qubit: sum |amplitude|^2 over the strings that agree; the two odds add up to 1', () => {
  for (const s of ALL) for (let k = 0; k < n(s); k++) {
    const [p0, p1] = odds(s, k);
    close(p0 + p1, 1);
    for (const r of R) {
      let t = 0;
      s.forEach((a, i) => { if (+bits(i, n(s))[k] === r) t += q.abs2(a); });
      close(branchChance(s, k, r), t);
    }
  }
});

test('known odds for every preset and qubit', () => {
  const want: Record<string, [number, number][]> = {
    separate: [[0.5, 0.5], [0.36, 0.64], [0.5, 0.5]],
    agree: [[0.5, 0.5], [0.5, 0.5], [0.5, 0.5]],
    signed: [[0.36, 0.64], [0.36, 0.64], [0.5392, 0.4608]],
  };
  for (const p of PRESETS) want[p.id].forEach(([a, b], k) => { const [p0, p1] = odds(p.state, k); close(p0, a); close(p1, b); });
});

test('Watrous example: measure X, then measure Y, of 1/√2|00> - 1/√6|01> + i/√6|10> + 1/√6|11>', () => {
  // X gives 0 with 2/3, leaving Y in √3/2|0> - 1/2|1>; X gives 1 with 1/3, leaving Y in i/√2|0> + 1/√2|1>.
  close(branchChance(WATROUS, 0, 0), 2 / 3); close(branchChance(WATROUS, 0, 1), 1 / 3);
  closeS(leftover(WATROUS, 0, 0), [q.c(S3 / 2), q.c(-1 / 2)]);
  closeS(leftover(WATROUS, 0, 1), [q.c(0, S2), q.c(S2)]);
  closeS(collapse(WATROUS, 0, 0), [q.c(S3 / 2), q.c(-1 / 2), q.c(0), q.c(0)]);
  // Y gives 0 with 2/3, leaving X in √3/2|0> + i/2|1>; Y gives 1 with 1/3, leaving X in -1/√2|0> + 1/√2|1>.
  close(branchChance(WATROUS, 1, 0), 2 / 3); close(branchChance(WATROUS, 1, 1), 1 / 3);
  closeS(leftover(WATROUS, 1, 0), [q.c(S3 / 2), q.c(0, 1 / 2)]);
  closeS(leftover(WATROUS, 1, 1), [q.c(-S2), q.c(S2)]);
  assert.equal(sameLeftover(WATROUS, 0), false);
});

test('collapse matches quantum.ts measureQubit for each forced result', () => {
  for (const s of ALL) for (let k = 0; k < n(s); k++) {
    const [p0, p1] = odds(s, k);
    // measureQubit gives 1 when rand() < P(1): rand 0 forces 1, rand just under 1 forces 0.
    if (p1 > 0) closeS(q.measureQubit(s, k, () => 0).state, collapse(s, k, 1));
    if (p0 > 0 && p1 < 1 - 1e-9) closeS(q.measureQubit(s, k, () => 1 - 1e-12).state, collapse(s, k, 0));
  }
});

test('the state left behind: unit length, qubit k now certain, the other strings dropped', () => {
  for (const s of ALL) for (let k = 0; k < n(s); k++) for (const r of R) {
    if (!(branchChance(s, k, r) > 0)) continue;
    const after = collapse(s, k, r), rest = leftover(s, k, r);
    close(q.norm2(after), 1); close(q.norm2(rest), 1);
    close(branchChance(after, k, r), 1);
    after.forEach((a, i) => { if (bitAt(i, k, n(s)) !== r) assert.deepEqual(a, q.c(0)); });
    // The whole state is |r> on qubit k with the leftover on the others.
    rest.forEach((a, j) => closeC(after[insertBit(j, k, r, n(s))], a));
  }
});

test('kept amplitudes are all divided by the same positive number √P, so ratios, signs and phases survive', () => {
  for (const s of ALL) for (let k = 0; k < n(s); k++) for (const r of R) {
    const p = branchChance(s, k, r);
    if (!(p > 0)) continue;
    const after = collapse(s, k, r);
    after.forEach((a, i) => { if (bitAt(i, k, n(s)) === r) closeC(a, q.scale(s[i], 1 / Math.sqrt(p))); });
  }
  // The page's example: 0.36|000> + 0.48|011> + 0.48|101> - 0.64|110>, measure q0.
  const s = preset('signed').state;
  closeS(leftover(s, 0, 0), real([0.6, 0, 0, 0.8])); // 0.6|00> + 0.8|11>
  closeS(leftover(s, 0, 1), real([0, 0.6, -0.8, 0])); // 0.6|01> - 0.8|10>: the minus sign is kept
  closeS(collapse(s, 0, 0), real([0.6, 0, 0, 0.8, 0, 0, 0, 0])); // 0.6|000> + 0.8|011>
  closeS(leftover(s, 1, 0), real([0.6, 0, 0, 0.8])); closeS(leftover(s, 1, 1), real([0, 0.6, -0.8, 0]));
  closeS(leftover(s, 2, 0), real([0.36 / Math.sqrt(0.5392), 0, 0, -0.64 / Math.sqrt(0.5392)]));
  closeS(leftover(s, 2, 1), real([0, S2, S2, 0]));
});

test('all agree: whatever one qubit gives, the other two are left giving the same bit', () => {
  const s = preset('agree').state;
  for (let k = 0; k < 3; k++) {
    closeS(leftover(s, k, 0), real([1, 0, 0, 0])); closeS(leftover(s, k, 1), real([0, 0, 0, 1]));
    assert.equal(sameLeftover(s, k), false);
  }
});

test('separate qubits: the rest is left in the same state whatever qubit k gives', () => {
  const s = preset('separate').state, h0 = q.matVec(q.H, q.ket0()), t = [q.c(0.6), q.c(0.8)];
  const rests = [q.tensor(t, h0), q.tensor(h0, h0), q.tensor(h0, t)];
  for (let k = 0; k < 3; k++) {
    assert.equal(sameLeftover(s, k), true);
    for (const r of R) closeS(leftover(s, k, r), rests[k]);
  }
});

test('sameLeftover is true exactly for states that split across the cut (product states)', () => {
  const prod = EXTRA[1];
  for (let k = 0; k < 3; k++) assert.equal(sameLeftover(prod, k), true);
  // A minus sign on every term of one leftover is a global phase: still the same state.
  const minus = q.tensor(q.tensor(q.plus(), q.minus()), q.plus());
  assert.equal(sameLeftover(minus, 1), true);
  closeS(leftover(minus, 1, 1), leftover(minus, 1, 0).map((a) => q.scale(a, -1)));
  // A basis state: one result is impossible, only one leftover exists.
  assert.equal(sameLeftover(q.basis(3, 5), 0), true);
  for (const id of ['agree', 'signed'] as const) for (let k = 0; k < 3; k++) assert.equal(sameLeftover(preset(id).state, k), false);
});

test('measure qubit k, then the rest: each full string comes up with chance |amplitude|^2, as if all were measured at once', () => {
  for (const s of ALL) for (let k = 0; k < n(s); k++) {
    let t = 0;
    s.forEach((a, x) => { close(chainChance(s, k, x), q.abs2(a)); t += chainChance(s, k, x); });
    close(t, 1);
  }
});

test('order does not matter: qubit a then b gives the same joint odds as b then a', () => {
  for (const s of ALL) {
    const N = n(s);
    for (let a = 0; a < N; a++) for (let b = 0; b < N; b++) {
      if (a === b) continue;
      for (const ra of R) for (const rb of R) {
        const pa = branchChance(s, a, ra), pb = branchChance(s, b, rb);
        const ab = pa > 0 ? pa * branchChance(collapse(s, a, ra), b, rb) : 0;
        const ba = pb > 0 ? pb * branchChance(collapse(s, b, rb), a, ra) : 0;
        close(ab, ba);
        // Both equal the plain sum over strings with those two bits.
        close(ab, s.reduce((t, x, i) => t + (bitAt(i, a, N) === ra && bitAt(i, b, N) === rb ? q.abs2(x) : 0), 0));
      }
    }
  }
});

// Random complex states on 2 to 4 qubits, and products with complex phases (some only split at one cut).
const rnd = q.rng(77);
const randomState = (N: number): q.State => q.normalize(Array.from({ length: 2 ** N }, () => q.c(rnd() - 0.5, rnd() - 0.5)));
const randomQubit = (): q.State => { const g = q.expi(2 * Math.PI * rnd()); return q.fromBloch(Math.PI * rnd(), 2 * Math.PI * rnd()).map((a) => q.mul(a, g)); };
const RANDOM = [randomState(2), randomState(3), randomState(3), randomState(4)];
const PRODUCTS = [
  q.tensor(randomQubit(), randomQubit()),
  q.tensor(q.tensor(randomQubit(), randomQubit()), randomQubit()),
  q.tensor(q.tensor(q.tensor(randomQubit(), randomQubit()), randomQubit()), randomQubit()),
  q.tensor(randomQubit(), randomState(2)), // splits off q0 only
  q.tensor(randomState(2), randomQubit()), // splits off q2 only
];

/** Rest index j, outcome r: the coefficient matrix M[r][j] = amplitude of the string with bit r at qubit k and rest j. */
const coeffs = (s: q.State, k: number): q.C[][] => R.map((r) => Array.from({ length: s.length / 2 }, (_, j) => s[insertBit(j, k, r, n(s))]));

test('no signalling, exactly: the rest\'s reduced density matrix equals the average of the leftovers, sum P(r) |l_r><l_r|', () => {
  for (const s of [...ALL, ...RANDOM, ...PRODUCTS]) for (let k = 0; k < n(s); k++) {
    const M = coeffs(s, k), m = s.length / 2;
    for (let a = 0; a < m; a++) for (let b = 0; b < m; b++) {
      // Before: partial trace over qubit k, rho[a][b] = sum over r of M[r][a] conj(M[r][b]).
      const before = R.reduce((t, r) => q.add(t, q.mul(M[r][a], q.conj(M[r][b]))), q.c(0));
      const after = R.reduce((t, r) => {
        const p = branchChance(s, k, r);
        if (!(p > 0)) return t;
        const l = leftover(s, k, r);
        return q.add(t, q.scale(q.mul(l[a], q.conj(l[b])), p));
      }, q.c(0));
      closeC(after, before, 1e-12);
    }
  }
});

test('sameLeftover is true exactly when the coefficient matrix has rank 1 (every 2x2 minor M0[a] M1[b] - M0[b] M1[a] is 0)', () => {
  let yes = 0, no = 0;
  for (const s of [...ALL, ...RANDOM, ...PRODUCTS]) for (let k = 0; k < n(s); k++) {
    const [M0, M1] = coeffs(s, k);
    let worst = 0;
    for (let a = 0; a < M0.length; a++) for (let b = 0; b < M0.length; b++) worst = Math.max(worst, q.abs(q.sub(q.mul(M0[a], M1[b]), q.mul(M0[b], M1[a]))));
    const rank1 = worst < 1e-10;
    assert.ok(rank1 || worst > 1e-3, `minor ${worst} is neither 0 nor clearly not`);
    assert.equal(sameLeftover(s, k), rank1, `k = ${k}, worst minor ${worst}`);
    rank1 ? yes++ : no++;
  }
  assert.ok(yes >= 15 && no >= 15, `${yes} rank 1, ${no} not`);
  // Products split at every cut; a product with an entangled pair splits only off its single qubit.
  for (const s of PRODUCTS.slice(0, 3)) for (let k = 0; k < n(s); k++) assert.equal(sameLeftover(s, k), true);
  assert.deepEqual([0, 1, 2].map((k) => sameLeftover(PRODUCTS[3], k)), [true, false, false]);
  assert.deepEqual([0, 1, 2].map((k) => sameLeftover(PRODUCTS[4], k)), [false, false, true]);
});

test('no signalling: not told the result, the rest shows the same odds as before, even in another basis', () => {
  for (const s of ALL) {
    const N = n(s);
    for (let k = 0; k < N; k++) {
      // Hadamard on every other qubit, so the rest is measured in the X basis.
      const hRest = (v: q.State, m: number) => Array.from({ length: m }, (_, i) => i).reduce((u, i) => q.apply1(u, q.H, i, m), v);
      // Without measuring qubit k: the chance of each rest string j, summed over qubit k's bit.
      const before = q.probs(Array.from({ length: N }, (_, i) => i).filter((i) => i !== k).reduce((u, i) => q.apply1(u, q.H, i, N), s));
      for (let j = 0; j < 2 ** (N - 1); j++) {
        const want = R.reduce((t, r) => t + before[insertBit(j, k, r, N)], 0);
        // After measuring qubit k: average over its result of the leftover's X-basis odds.
        const got = R.reduce((t, r) => {
          const p = branchChance(s, k, r);
          return p > 0 ? t + p * q.probs(hRest(leftover(s, k, r), N - 1))[j] : t;
        }, 0);
        close(got, want, 1e-12);
      }
    }
  }
});

test('firstResult: 1 exactly when u < P(1), as in quantum.ts; a result with chance 0 never comes up', () => {
  assert.equal(firstResult(0.36, 0.64, 0), 1);
  assert.equal(firstResult(0.36, 0.64, 0.64 - 1e-12), 1);
  assert.equal(firstResult(0.36, 0.64, 0.64), 0);
  assert.equal(firstResult(0.36, 0.64, 1 - 1e-16), 0);
  for (const u of [0, 0.5, 1 - 1e-16]) { assert.equal(firstResult(1, 0, u), 0); assert.equal(firstResult(0, 1, u), 1); }
  // Float dust in the odds is normalized away: the threshold is P(1) / (P(0) + P(1)).
  assert.equal(firstResult(0.5000000000000001, 0.5000000000000001, 0.5 - 1e-12), 1);
});

test('drawIndex: index i owns an interval of length p[i] / total, and never an index with chance 0', () => {
  const p = [0.1296, 0, 0, 0.2304, 0, 0.2304, 0.4096, 0];
  let edge = 0;
  p.forEach((x, i) => {
    if (!x) return;
    assert.equal(drawIndex(p, edge), i);
    edge += x;
    assert.equal(drawIndex(p, edge - 1e-12), i);
  });
  close(edge, 1);
  assert.equal(drawIndex(p, 1 - 1e-16), 6); // the last index with a chance, not index 7
  for (let u = 0; u < 1; u += 1 / 997) assert.ok(p[drawIndex(p, u)] > 0);
  assert.equal(drawIndex([0, 2, 0, 6], 0.24), 1); assert.equal(drawIndex([0, 2, 0, 6], 0.25), 3); // unnormalized input
  assert.throws(() => drawIndex([0, 0], 0.5));
});

test('measureCopy: the string agrees with the first result and always has an amplitude that is not 0', () => {
  const rand = q.rng(11);
  for (const s of ALL) for (let k = 0; k < n(s); k++) for (let t = 0; t < 40; t++) {
    const c = measureCopy(s, k, rand(), rand());
    assert.equal(bitAt(c.string, k, n(s)), c.first);
    assert.ok(q.abs2(s[c.string]) > 1e-12);
  }
  // Fixed draws, signed preset, q0: u1 < 0.64 gives 1; then u2 splits the leftover 36% / 64%.
  const s = preset('signed').state;
  assert.deepEqual(measureCopy(s, 0, 0.1, 0.1), { first: 1, string: 0b101 });
  assert.deepEqual(measureCopy(s, 0, 0.1, 0.5), { first: 1, string: 0b110 });
  assert.deepEqual(measureCopy(s, 0, 0.9, 0.3), { first: 0, string: 0b000 });
  assert.deepEqual(measureCopy(s, 0, 0.9, 0.4), { first: 0, string: 0b011 });
});

test('a seeded run of measureCopy lands within 5 standard deviations of N |amplitude|^2 on every string', () => {
  const s = preset('signed').state, N = 4000, rand = q.rng(2024);
  const copies: Copy[] = Array.from({ length: N }, () => measureCopy(s, 1, rand(), rand()));
  const t = tally(copies);
  assert.equal(t.copies, N); assert.equal(t.firsts[0] + t.firsts[1], N);
  t.strings.forEach((cnt, x) => {
    const p = q.abs2(s[x]);
    assert.ok(Math.abs(cnt - N * p) <= 5 * Math.sqrt(N * p * (1 - p)) + 1e-9, `${bits(x, 3)}: ${cnt} vs ${N * p}`);
  });
  assert.equal(t.firsts[1], t.strings[0b011] + t.strings[0b110]);
});

test('columns: strings with bit k = r and an amplitude, in counting order', () => {
  const s = preset('signed').state;
  assert.deepEqual(columns(s, 0, 0), [0b000, 0b011]); assert.deepEqual(columns(s, 0, 1), [0b101, 0b110]);
  assert.deepEqual(columns(s, 2, 0), [0b000, 0b110]); assert.deepEqual(columns(s, 2, 1), [0b011, 0b101]);
  assert.deepEqual(columns(preset('agree').state, 1, 1), [0b111]);
  assert.deepEqual(columns(preset('separate').state, 1, 0), [0b000, 0b001, 0b100, 0b101]);
});

test('roomFor: mean plus 5 standard deviations plus 2, never more than the copies', () => {
  assert.equal(roomFor(0.5, 200), Math.ceil(100 + 5 * Math.sqrt(50)) + 2);
  assert.equal(roomFor(1, 200), 200);
  assert.equal(roomFor(0, 200), 2);
  for (const p of [0.09, 0.1296, 0.16, 0.4096, 0.5]) assert.ok(roomFor(p) >= MAX_COPIES * p);
});

test('text: amplitudes, kets, percents, decimals and square roots', () => {
  assert.equal(amp(0.36), '0.36'); assert.equal(amp(-0.64), '−0.64'); assert.equal(amp(S2), '0.71'); assert.equal(amp(0), '0');
  assert.equal(amp(-0.001), '0.00'); assert.equal(amp(1e-17), '0');
  assert.equal(ketText(real([0, 0.6, -0.8, 0])), '0.60|01⟩ − 0.80|10⟩');
  assert.equal(ketText(real([-0.6, 0, 0, 0.8])), '−0.60|00⟩ + 0.80|11⟩');
  assert.equal(ketText(real([1, 0, 0, 0])), '|00⟩');
  assert.equal(ketText(real([0, 0, 0, -1])), '−|11⟩');
  assert.throws(() => ketText([q.c(0, 1), q.c(0)]));
  assert.equal(percent(0.1296), '13%'); assert.equal(percent(0.5000000000000001), '50%'); assert.equal(percent(0.125), '13%');
  assert.equal(percent(0.004), 'under 1%'); assert.equal(percent(0.996), 'over 99%'); assert.equal(percent(0), '0%'); assert.equal(percent(1), '100%');
  assert.equal(dec(0.36), '0.36'); assert.equal(dec(0.5000000000000001), '0.5'); assert.equal(dec(0.5392), '0.5392');
  assert.equal(rootText(0.36), '√0.36 = 0.60'); assert.equal(rootText(0.64), '√0.64 = 0.80');
  assert.equal(rootText(0.5000000000000001), '√0.5 ≈ 0.71'); assert.equal(rootText(0.5392), '√0.5392 ≈ 0.73');
  assert.equal(rootText(1 / 3), '√0.3333 ≈ 0.58');
  assert.equal(about(4.32), '4.3'); assert.equal(about(25.92), '25.9'); assert.equal(about(72), '72');
});

test('branch cards: the shown chances add up to the shown total, and the after column is amplitude ÷ √P', () => {
  for (const p of PRESETS) for (let k = 0; k < 3; k++) for (const r of R) {
    const b = branch(p.state, k, r);
    assert.ok(b.possible);
    const parts = b.rows.map((x) => +x.chance.replace('%', '')), total = +percent(b.p).replace('%', '');
    assert.equal(parts.reduce((t, x) => t + x, 0), total, `${p.id} q${k}=${r}: ${b.sum}`);
    b.rows.forEach((x) => assert.equal(x.after, amp(p.state[x.index].re / Math.sqrt(b.p))));
    assert.equal(b.left, ketText(leftover(p.state, k, r)));
  }
  const b = branch(preset('signed').state, 0, 0);
  assert.equal(b.sum, '13% + 23% = 36%'); assert.equal(b.root, '√0.36 = 0.60'); assert.equal(b.left, '0.60|00⟩ + 0.80|11⟩');
  assert.deepEqual(b.rows.map((x) => [x.string, x.amp, x.chance, x.after]), [['000', '0.36', '13%', '0.60'], ['011', '0.48', '23%', '0.80']]);
  assert.equal(branch(preset('signed').state, 0, 1).left, '0.60|01⟩ − 0.80|10⟩');
  assert.equal(branch(preset('agree').state, 2, 1).left, '|11⟩');
  assert.equal(branch(preset('separate').state, 1, 1).left, '0.50|00⟩ + 0.50|01⟩ + 0.50|10⟩ + 0.50|11⟩');
  const none = branch(q.basis(3, 0), 1, 1);
  assert.equal(none.possible, false); assert.deepEqual(none.rows, []);
});

test('readout: odds and both leftovers before any copy; counts, predictions and the last copy after', () => {
  const sg = preset('signed');
  assert.equal(sg.start, ketText(sg.state)); assert.equal(preset('agree').start, '(|000⟩ + |111⟩)/√2');
  assert.equal(ketText(preset('agree').state), '0.71|000⟩ + 0.71|111⟩'); close(1 / Math.SQRT2, 0.7071067811865476);
  assert.equal(intro(sg.state, 0),
    'Start state: 0.36|000⟩ + 0.48|011⟩ + 0.48|101⟩ − 0.64|110⟩. Measuring q0 gives 0 with chance 36% and 1 with chance 64%. If it gives 0, q1 q2 are left in 0.60|00⟩ + 0.80|11⟩. If it gives 1, they are left in 0.60|01⟩ − 0.80|10⟩.');
  assert.match(intro(preset('separate').state, 1), /left in that same state, so q1's result changes nothing for q0 q2\.$/);
  assert.match(intro(q.tensor(q.tensor(q.plus(), q.minus()), q.plus()), 1), /that same state times −1, a global phase no measurement can see/);
  assert.equal(intro(q.basis(3, 2), 1), 'Start state: |010⟩. Measuring q1 gives 1 every time. It leaves q0 q2 in |00⟩.');
  assert.match(intro(preset('separate').state, 0, preset('separate').start), /^Start state: q0 = \|\+⟩, q1 = 0\.6\|0⟩ \+ 0\.8\|1⟩, q2 = \|\+⟩, each set on its own\. /);
  const s = preset('signed').state;
  assert.equal(report(s, 0, []), intro(s, 0));
  assert.equal(report(s, 0, [{ first: 1, string: 0b110 }]),
    'Start state: 0.36|000⟩ + 0.48|011⟩ + 0.48|101⟩ − 0.64|110⟩. 1 copy: q0 gave 1 (chance 64%), which left q1 q2 in 0.60|01⟩ − 0.80|10⟩; then q1 q2 gave 10 (chance 64%).');
  const cs: Copy[] = [{ first: 0, string: 0 }, { first: 1, string: 5 }, { first: 1, string: 6 }, { first: 0, string: 3 }];
  assert.equal(report(s, 0, cs, 'S'),
    'Start state: S. 4 copies. q0 gave 0 in 2 and 1 in 2; the Born rule predicts about 1.4 and 2.6. '
    + 'Full strings: 000 in 1, 011 in 1, 101 in 1, 110 in 1; predicted about 0.5, 0.9, 0.9, 1.6. '
    + 'Last copy: q0 gave 0 (chance 36%), which left q1 q2 in 0.60|00⟩ + 0.80|11⟩; then q1 q2 gave 11 (chance 64%).');
});
