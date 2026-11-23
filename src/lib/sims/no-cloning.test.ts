import test from 'node:test';
import assert from 'node:assert/strict';
import * as q from '../quantum.ts';
import * as nc from './no-cloning.ts';
import type { Machine, Check } from './no-cloning.ts';

const close = (a: number, x: number, eps = 1e-12) => assert.ok(Math.abs(a - x) <= eps, `${a} != ${x}`);
const closeState = (s: q.State, t: q.State, eps = 1e-12) => {
  assert.equal(s.length, t.length);
  s.forEach((a, i) => { close(a.re, t[i].re, eps); close(a.im, t[i].im, eps); });
};
/** Every slider setting: whole degrees from −180 to 180. */
const DEGS = Array.from({ length: 361 }, (_, k) => k - 180);
const MACHINES: Machine[] = ['z', 'x'];
const CHECKS: Check[] = ['read', 'undo'];
const ab = (deg: number) => { const s = nc.prepare(deg); return [s[0].re, s[1].re]; };
const S = Math.SQRT1_2;

test('the input is RY(θ) applied to a qubit started as 0: a real unit vector', () => {
  for (const d of DEGS) {
    const s = nc.prepare(d), r = q.matVec(q.RY(nc.radians(d)), q.ket0());
    close(q.norm2(s), 1);
    closeState(s, r);
    close(s[0].im, 0); close(s[1].im, 0);
  }
});

test('presets are exact: 0° is |0>, 90° is |+>, −90° is |->, 180° is |1>, −180° is −|1>', () => {
  assert.deepEqual(nc.prepare(0), q.ket0());
  assert.deepEqual(nc.prepare(90), q.plus());
  assert.deepEqual(nc.prepare(-90), q.minus());
  assert.deepEqual(nc.prepare(180), q.ket1());
  assert.deepEqual(nc.prepare(-180), [q.c(0), q.c(-1)]);
  for (const p of nc.PRESETS) assert.equal(nc.nameOf(p.deg), p.name);
  assert.equal(nc.nameOf(-180), '−|1⟩');
  assert.equal(nc.nameOf(45), null);
});

test('both machines are unitary (U†U = I), so they are real gates', () => {
  for (const m of MACHINES) {
    // Column j of U is U applied to basis state j.
    const cols = [0, 1, 2, 3].map((j) => nc.machine(m, q.basis(2, j)));
    const U: q.Matrix = [0, 1, 2, 3].map((i) => cols.map((col) => col[i]));
    const P = q.matMul(q.dagger(U), U);
    P.forEach((row, i) => row.forEach((x, j) => { close(x.re, i === j ? 1 : 0); close(x.im, 0); }));
  }
});

test('the 0/1 copier is a CNOT: it copies |0> and |1> exactly', () => {
  assert.deepEqual(nc.copier('z', q.ket0()), q.basis(2, 0b00));
  assert.deepEqual(nc.copier('z', q.ket1()), q.basis(2, 0b11));
  closeState(nc.copier('z', q.ket1()), nc.copies(q.ket1()));
  for (let j = 0; j < 4; j++) closeState(nc.machine('z', q.basis(2, j)), q.cnot(q.basis(2, j), 0, 1));
});

test('the +/− copier copies |+> and |-> exactly', () => {
  closeState(nc.copier('x', q.plus()), q.tensor(q.plus(), q.plus()));
  closeState(nc.copier('x', q.minus()), q.tensor(q.minus(), q.minus()));
  assert.equal(nc.match(nc.copier('x', q.plus()), nc.copies(q.plus())), 1);
  assert.equal(nc.match(nc.copier('x', q.minus()), nc.copies(q.minus())), 1);
});

test('linearity: each machine acts on a|0> + b|1> as a times its result for |0> plus b times its result for |1>', () => {
  for (const m of MACHINES) {
    const r0 = nc.copier(m, q.ket0()), r1 = nc.copier(m, q.ket1());
    for (const d of DEGS) {
      const [a, b] = ab(d), out = nc.copier(m, nc.prepare(d));
      closeState(out, r0.map((x, i) => q.add(q.scale(x, a), q.scale(r1[i], b))));
    }
  }
});

test('the 0/1 copier gives a|00> + b|11>, but two copies are a²|00> + ab|01> + ab|10> + b²|11>', () => {
  for (const d of DEGS) {
    const [a, b] = ab(d);
    closeState(nc.copier('z', nc.prepare(d)), [a, 0, 0, b].map((x) => q.c(x)));
    closeState(nc.copies(nc.prepare(d)), [a * a, a * b, a * b, b * b].map((x) => q.c(x)));
  }
  // The worked example: started as 0, a turn of 90° gives |+>.
  closeState(nc.copier('z', q.plus()), [S, 0, 0, S].map((x) => q.c(x)));
  closeState(nc.copies(q.plus()), [0.5, 0.5, 0.5, 0.5].map((x) => q.c(x)));
});

test('the +/− copier gives (a/√2)(|00> + |11>) + (b/√2)(|01> + |10>)', () => {
  for (const d of DEGS) {
    const [a, b] = ab(d);
    closeState(nc.copier('x', nc.prepare(d)), [a * S, b * S, b * S, a * S].map((x) => q.c(x)));
  }
});

test('match is |<ψψ|out>|²: (a³ + b³)² for the 0/1 copier, (a\'³ + b\'³)² for the +/− copier', () => {
  for (const d of DEGS) {
    const [a, b] = ab(d), ap = (a + b) * S, bp = (a - b) * S, psi = nc.prepare(d), two = nc.copies(psi);
    close(nc.match(nc.copier('z', psi), two), (a ** 3 + b ** 3) ** 2);
    close(nc.match(nc.copier('x', psi), two), (ap ** 3 + bp ** 3) ** 2);
  }
});

test('known matches: 0/1 copier gives 1/2 for |+> and 0 for |->; +/− copier gives 1/2 for |0> and 0 for |1>', () => {
  const m = (mm: Machine, d: number) => nc.predict(d, mm, 'read').match;
  assert.equal(m('z', 0), 1); assert.equal(m('z', 180), 1); assert.equal(m('z', -180), 1);
  close(m('z', 90), 0.5); assert.equal(m('z', -90), 0);
  assert.equal(m('x', 90), 1); assert.equal(m('x', -90), 1);
  close(m('x', 0), 0.5); assert.equal(m('x', 180), 0); assert.equal(m('x', -180), 0);
});

test('each machine copies only its own two states (up to a global phase) and fails on every other input', () => {
  const perfect = (m: Machine) => DEGS.filter((d) => nc.predict(d, m, 'read').match === 1);
  assert.deepEqual(perfect('z'), [-180, 0, 180]);
  assert.deepEqual(perfect('x'), [-90, 90]);
  for (const m of MACHINES) {
    const all = DEGS.map((d) => nc.predict(d, m, 'read').match);
    all.forEach((f) => assert.ok(f >= 0 && f <= 1));
    assert.equal(Math.min(...all), 0, 'every machine has an input it gets completely wrong');
  }
  // Exact reason for the 0/1 copier: a³ + b³ = ±1 with a² + b² = 1 needs ab = 0.
  for (const d of DEGS) {
    const [a, b] = ab(d);
    assert.equal(nc.predict(d, 'z', 'read').match === 1, Math.abs(a * b) < 1e-12, `deg=${d}`);
  }
});

test('the inner product proof: machines keep <φ|ψ>, copying squares it, so both hold only if it is 0 or 1', () => {
  const pairs = [[0, 90], [0, 180], [90, -90], [30, 100], [-45, 135], [10, 11], [0, 60]];
  for (const m of MACHINES) {
    for (const [d1, d2] of pairs) {
      const phi = nc.prepare(d1), psi = nc.prepare(d2), x = q.inner(phi, psi);
      const kept = q.inner(nc.copier(m, phi), nc.copier(m, psi)), sq = q.inner(nc.copies(phi), nc.copies(psi));
      close(kept.re, x.re); close(kept.im, x.im);
      close(sq.re, q.mul(x, x).re); close(sq.im, q.mul(x, x).im);
    }
  }
  // x = x² only for x = 0 (orthogonal) or x = 1 (the same state): |0>,|1> are orthogonal, |0>,|+> are not.
  close(q.inner(nc.prepare(0), nc.prepare(180)).re, 0);
  close(q.inner(nc.prepare(0), nc.prepare(90)).re, S);
});

test('the +/− copier is the 0/1 copier seen through Hadamards: match_x(ψ) = match_z(Hψ)', () => {
  for (const d of DEGS) {
    const psi = nc.prepare(d), h = q.matVec(q.H, psi);
    close(nc.match(nc.copier('x', psi), nc.copies(psi)), nc.match(nc.copier('z', h), nc.copies(h)));
  }
});

test('mirror symmetry: the 0/1 copier matches θ and 180° − θ equally (a and b swap)', () => {
  for (let d = 0; d <= 180; d++) close(nc.predict(d, 'z', 'read').match, nc.predict(180 - d, 'z', 'read').match);
});

test('Born rule: every readout list is never negative and adds up to 1', () => {
  for (const d of DEGS) for (const m of MACHINES) for (const ch of CHECKS) {
    const p = nc.predict(d, m, ch);
    for (const list of [p.pOut, p.pTwo]) {
      assert.equal(list.length, 4);
      list.forEach((x) => assert.ok(x >= 0 && x <= 1));
      close(list.reduce((t, x) => t + x, 0), 1, 1e-12);
    }
  }
});

test('reading both: copies give a⁴, a²b², a²b², b⁴; the 0/1 copier a², 0, 0, b²; the +/− copier a²/2, b²/2, b²/2, a²/2', () => {
  for (const d of DEGS) {
    const [a, b] = ab(d), [a2, b2] = [a * a, b * b];
    const z = nc.predict(d, 'z', 'read'), x = nc.predict(d, 'x', 'read');
    [a2 * a2, a2 * b2, a2 * b2, b2 * b2].forEach((v, i) => close(z.pTwo[i], v));
    [a2, 0, 0, b2].forEach((v, i) => close(z.pOut[i], v));
    [a2 / 2, b2 / 2, b2 / 2, a2 / 2].forEach((v, i) => close(x.pOut[i], v));
  }
  // The 0/1 copier's outputs always agree: 01 and 10 have chance exactly 0.
  for (const d of DEGS) { const p = nc.predict(d, 'z', 'read').pOut; assert.equal(p[1], 0); assert.equal(p[2], 0); }
  // |+> and |-> give the same readout odds with the 0/1 copier, though their matches are 1/2 and 0.
  assert.deepEqual(nc.predict(90, 'z', 'read').pOut, nc.predict(-90, 'z', 'read').pOut);
});

test('the undo check: two true copies read 00 every time, and the machine reads 00 with chance equal to its match', () => {
  for (const d of DEGS) for (const m of MACHINES) {
    const p = nc.predict(d, m, 'undo');
    assert.deepEqual(p.pTwo, [1, 0, 0, 0], `deg=${d}`);
    close(p.pOut[0], p.match);
  }
  // Started as 0, turned 90° (|+>), 0/1 copier: 00 or 11, half each. Turned −90° (|->): never 00, only 01 or 10.
  const plus = nc.predict(90, 'z', 'undo').pOut, minus = nc.predict(-90, 'z', 'undo').pOut;
  [0.5, 0, 0, 0.5].forEach((v, i) => close(plus[i], v));
  [0, 0.5, 0.5, 0].forEach((v, i) => close(minus[i], v));
});

test('the undo check turns each input back into |0>', () => {
  for (const d of DEGS) closeState(q.matVec(q.RY(-nc.radians(d)), nc.prepare(d)), q.ket0());
});

test('global phase: −180° gives −|1>, which the 0/1 copier turns into −|11>: a perfect match, not equal entries', () => {
  const p = nc.predict(-180, 'z', 'read');
  assert.equal(nc.ket(p.out), '−|11⟩');
  assert.equal(nc.ket(p.two), '|11⟩');
  assert.equal(p.match, 1);
  assert.equal(nc.phaseOnly(p.out, p.two), true);
  assert.deepEqual(p.pOut, p.pTwo);
  for (const d of [0, 180]) {
    const r = nc.predict(d, 'z', 'read');
    assert.equal(nc.phaseOnly(r.out, r.two), false);
  }
  assert.equal(nc.phaseOnly(nc.predict(90, 'x', 'read').out, nc.predict(90, 'x', 'read').two), false);
  assert.equal(nc.phaseOnly(nc.predict(90, 'z', 'read').out, nc.predict(90, 'z', 'read').two), false);
});

test('a shot follows the Born rule: on an even grid of draws, each readout gets its chance, and chance 0 never shows', () => {
  const N = 1000;
  for (const d of [0, 30, 90, -90, 135, 180]) for (const m of MACHINES) for (const ch of CHECKS) {
    const p = nc.predict(d, m, ch).pOut, counts = [0, 0, 0, 0];
    for (let k = 0; k < N; k++) counts[nc.shot(p, () => (k + 0.5) / N)]++;
    counts.forEach((n, i) => { assert.ok(Math.abs(n - N * p[i]) <= 1, `deg=${d} ${m} ${ch} i=${i}: ${n} vs ${N * p[i]}`); if (p[i] === 0) assert.equal(n, 0); });
  }
  // Even a draw a hair below 1 never lands on a readout with chance 0.
  for (const u of [0, 1 - 2 ** -53]) {
    assert.equal(nc.shot([0.5, 0, 0, 0.5], () => u) % 3, 0);
    assert.equal(nc.shot([1, 0, 0, 0], () => u), 0);
    assert.equal(nc.shot([0.4999999999999999, 0.5, 0, 0], () => u) <= 1, true);
  }
});

test('expected counts are n times each chance', () => {
  assert.deepEqual(nc.expected([0.5, 0, 0, 0.5], 200), [100, 0, 0, 100]);
  assert.deepEqual(nc.expected([0.25, 0.25, 0.25, 0.25], 100), [25, 25, 25, 25]);
});

test('pile layout: exactly CAP dots per pile, inside the box', () => {
  for (const [w, h] of [[50, 180], [53.5, 192], [120, 224], [200, 224], [10, 10]]) {
    const g = nc.pileGrid(w, h);
    assert.equal(g.cols * g.rows, nc.CAP);
    assert.ok(g.cols * g.pitch <= w + 1e-9 && g.rows * g.pitch <= h + 1e-9);
    const [x, y] = nc.slot(nc.CAP - 1, g.cols, g.pitch);
    assert.ok(x < g.cols * g.pitch && y < g.rows * g.pitch);
    close(nc.fillHeight(nc.CAP, g.cols, g.pitch), g.rows * g.pitch, 1e-9);
  }
  assert.deepEqual(nc.slot(0, 10, 2), [1, 1]);
  assert.deepEqual(nc.slot(10, 10, 2), [1, 3]);
});

test('text: amplitudes, kets, angles and rough counts', () => {
  assert.equal(nc.amp(S), '0.707');
  assert.equal(nc.amp(-0.5), '−0.500');
  assert.equal(nc.amp(0), '0');
  assert.equal(nc.amp(-0), '0');
  assert.equal(nc.amp(0.0001), '0.0001');
  assert.equal(nc.amp(-0.00008), '−0.00008');
  assert.equal(nc.ket(q.plus()), '0.707|0⟩ + 0.707|1⟩');
  assert.equal(nc.ket(q.minus()), '0.707|0⟩ − 0.707|1⟩');
  assert.equal(nc.ket(q.ket0()), '|0⟩');
  assert.equal(nc.ket(nc.copier('z', q.plus())), '0.707|00⟩ + 0.707|11⟩');
  assert.equal(nc.ket(nc.copies(q.plus())), '0.500|00⟩ + 0.500|01⟩ + 0.500|10⟩ + 0.500|11⟩');
  assert.equal(nc.ket(nc.copies(q.minus())), '0.500|00⟩ − 0.500|01⟩ − 0.500|10⟩ + 0.500|11⟩');
  assert.equal(nc.ket(nc.copier('x', q.ket0())), '0.707|00⟩ + 0.707|11⟩');
  assert.equal(nc.ket(nc.copier('x', q.ket1())), '0.707|01⟩ + 0.707|10⟩');
  assert.equal(nc.degrees(90), '90°');
  assert.equal(nc.degrees(-45), '−45°');
  assert.equal(nc.degrees(0), '0°');
  assert.equal(nc.about(100), '100');
  assert.equal(nc.about(12.5), '13');
  assert.equal(nc.about(2.25), '2.3');
  assert.equal(nc.about(0), '0');
});

test('readouts name the start state and give the right numbers', () => {
  assert.equal(nc.startText(90), 'Input: started as 0, turned 90°: |+⟩ = 0.707|0⟩ + 0.707|1⟩.');
  assert.equal(nc.startText(90, true), 'Input: started as 0, turned 90°: |+⟩.');
  assert.equal(nc.startText(0), 'Input: started as 0, turned 0°: |0⟩.');
  assert.equal(nc.startText(60), 'Input: started as 0, turned 60°: 0.866|0⟩ + 0.500|1⟩.');
  assert.equal(nc.verdict(90, 'z'), 'The 0/1 copier gives 0.707|00⟩ + 0.707|11⟩. Two true copies would be 0.500|00⟩ + 0.500|01⟩ + 0.500|10⟩ + 0.500|11⟩. Match: 50%.');
  assert.equal(nc.verdict(-90, 'z').endsWith('Match: 0%.'), true);
  assert.equal(nc.verdict(0, 'z'), 'The 0/1 copier gives |00⟩: two true copies. Match: 100%.');
  assert.equal(nc.verdict(90, 'x'), 'The +/− copier gives 0.500|00⟩ + 0.500|01⟩ + 0.500|10⟩ + 0.500|11⟩: two true copies. Match: 100%.');
  assert.match(nc.verdict(-180, 'z'), /gives −\|11⟩\. Two true copies are \|11⟩: the same state up to an overall minus sign, a global phase/);
  // A near miss is never rounded up to a perfect copy.
  assert.equal(nc.verdict(1, 'z').endsWith('Match: >99.9%.'), true);
  for (const d of DEGS) for (const m of MACHINES) {
    assert.ok(nc.idleText(d, m).startsWith(`Input: started as 0, turned ${nc.degrees(d)}`));
    for (const ch of CHECKS) assert.ok(nc.reportText(d, m, ch, [1, 2, 3, 4]).includes('started as 0'));
  }
  assert.equal(nc.reportText(90, 'z', 'read', [52, 0, 0, 48]),
    '100 runs. Input: started as 0, turned 90°: |+⟩. 0/1 copier, read both. Counts for 00, 01, 10, 11: 52, 0, 0, 48. The machine\'s output predicts about 50, 0, 0, 50. Two true copies would give about 25, 25, 25, 25. Not two copies: match 50%.');
  assert.equal(nc.reportText(90, 'z', 'undo', [52, 0, 0, 48]),
    '100 runs. Input: started as 0, turned 90°: |+⟩. 0/1 copier, undo, then read. 00 came up 52 times; 01, 10, 11: 0, 0, 48. Two true copies would read 00 all 100 times. This machine\'s match, 50%, predicts 00 about 50 times.');
  assert.equal(nc.reportText(0, 'z', 'undo', [1, 0, 0, 0]),
    '1 run. Input: started as 0, turned 0°: |0⟩. 0/1 copier, undo, then read. 00 came up once; 01, 10, 11: 0, 0, 0. Two true copies read 00 every time, and so does this output: match 100%.');
});

test('one run of the undo check reads naturally: "every time", never "all once"', () => {
  const t = nc.reportText(90, 'z', 'undo', [1, 0, 0, 0]);
  assert.equal(t, '1 run. Input: started as 0, turned 90°: |+⟩. 0/1 copier, undo, then read. 00 came up once; 01, 10, 11: 0, 0, 0. Two true copies would read 00 every time. This machine\'s match, 50%, predicts 00 about 0.5 times.');
  assert.ok(!t.includes('all once'));
  assert.ok(nc.reportText(90, 'z', 'undo', [0, 0, 0, 2]).includes('would read 00 all 2 times'));
});
