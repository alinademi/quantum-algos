import test from 'node:test';
import assert from 'node:assert/strict';
import * as q from '../quantum.ts';
import {
  SHOTS, PER, AIR, STORIES, TESTS, STORY_NAME, TEST_NAME, PAD, WIDE,
  turn, overlap, start, record, bump, testGates, project, branches, final, marginal, reduced, rhoSA,
  chances, chanceTexts, gap, shot, rate, rowLabel, sig3, overlapText, percent, gapText, setup, testSteps, predict, verdict, report, valueText,
  dots, layout, cell, tickX, type Story,
} from './measurement-problem.ts';

const close = (a: number, b: number, eps = 1e-12) => assert.ok(Math.abs(a - b) < eps, `${a} != ${b}`);
const S2 = Math.SQRT1_2;
const SMALL = [0, 1, 2, 3, 4, 5];
const PERS = [0, 0.3, 0.5, PER, 1];
const ALL_N = Array.from({ length: AIR.max + 1 }, (_, i) => i);

/** The two halves of a state on n + 2 qubits after the record: the air's state where the pair reads 00, and where it reads 11. */
function airParts(s: q.State): [q.State, q.State] {
  const rest = s.length / 4;
  return [s.slice(0, rest), s.slice(3 * rest)].map((part) => part.map((a) => q.scale(a, Math.SQRT2))) as [q.State, q.State];
}

// ---- The parts of the model

test('one molecule: cos(theta/2) = per, so RY(theta)|0> overlaps |0> by per; per = 0 is a full record (|1>), per = 1 none', () => {
  for (const per of PERS) {
    close(Math.cos(turn(per) / 2), per);
    const m = q.matVec(q.RY(turn(per)), q.ket0());
    close(q.inner(q.ket0(), m).re, per); close(q.inner(q.ket0(), m).im, 0);
  }
  close(turn(0), Math.PI); close(turn(1), 0);
  close(turn(PER) * 180 / Math.PI, 51.68, 0.01);
});

test('overlaps multiply: v = per^n, 1 with no molecules, and 0.9^n for the tool', () => {
  for (const per of PERS) for (const n of SMALL) close(overlap(n, per), per ** n);
  close(overlap(0, 0), 1);
  close(overlap(1), 0.9); close(overlap(2), 0.81); close(overlap(3), 0.729); close(overlap(20), 0.12157665459056929);
});

test('step 1: started as 0, then a Hadamard gate: amplitude 1/sqrt2 for 0 and for 1, pointer and air at 0', () => {
  for (const n of SMALL) {
    const s = start(n), rest = s.length / 2;
    s.forEach((a, i) => close(a.re, i === 0 || i === rest ? S2 : 0));
    close(q.norm2(s), 1);
  }
});

test('Myrvold 4.1: a linear record turns (a|0> + b|1>)|R> into a|0>|"0"> + b|1>|"1">, for any a, b', () => {
  const a = q.c(0.6, 0.0), b = q.c(0, 0.8), s = q.tensor([a, b], q.ket0());
  const t = record(s);
  assert.deepEqual(t, [a, q.c(0), q.c(0), b]);
  // Reading the pointer gives "0" with chance |a|^2 and "1" with |b|^2, and the qubit always matches.
  const p = q.probs(t);
  close(p[0], 0.36); close(p[3], 0.64); close(p[1] + p[2], 0);
});

test('step 2: the record makes (|00> + |11>)/sqrt2, entangled: the pointer has no reading of its own', () => {
  const s = record(start(0));
  [S2, 0, 0, S2].forEach((x, i) => close(s[i].re, x));
  // A product state (a|0> + b|1>)(c|0> + d|1>) has a d * b c = a c * b d; here 00 * 11 != 01 * 10.
  assert.ok(Math.abs(s[0].re * s[3].re - s[1].re * s[2].re) > 0.4);
});

test('step 3: the air ends in |E0> or |E1>, both unit vectors, with <E0|E1> = per^n (Schlosshauer eq. 1, 6)', () => {
  for (const per of PERS) for (const n of SMALL) {
    const s = bump(record(start(n)), n, per), [e0, e1] = airParts(s);
    close(q.norm2(s), 1); close(q.norm2(e0), 1); close(q.norm2(e1), 1);
    const o = q.inner(e0, e1);
    close(o.re, overlap(n, per)); close(o.im, 0);
    // The air is untouched where the pointer reads 0, and nothing sits on 01 or 10.
    close(e0[0].re, 1);
    const rest = s.length / 4;
    for (let i = rest; i < 3 * rest; i++) close(q.abs2(s[i]), 0);
  }
});

test('undoing the molecules and then the record returns the whole state to the start, every amplitude', () => {
  for (const per of PERS) for (const n of SMALL) {
    const s = record(bump(bump(record(start(n)), n, per), n, per, -1)), s0 = start(n);
    s.forEach((a, i) => { close(a.re, s0[i].re); close(a.im, s0[i].im); });
  }
});

test('project: the Born chance of the result, the matching strings kept and renormalized', () => {
  const s = record(start(2));
  for (const r of [0, 1] as const) {
    const { p, state } = project(s, 1, r);
    close(p, 0.5); close(q.norm2(state), 1);
    close(q.probOne(state, 1), r); close(q.probOne(state, 0), r);
  }
  assert.equal(project(q.basis(2, 0), 0, 1).p, 0);
});

test('branches: one state for no collapse, two of weight 1/2 for a collapse at the pointer, each a single reading', () => {
  for (const n of SMALL) {
    const u = branches(n, 'unitary'), k = branches(n, 'collapse');
    assert.equal(u.length, 1); close(u[0].p, 1);
    assert.equal(k.length, 2);
    k.forEach((b, r) => { close(b.p, 0.5); close(q.probOne(b.state, 1), r); close(q.probOne(b.state, 0), r); close(q.norm2(b.state), 1); });
  }
});

// ---- The chances: gate by gate against the closed forms

test('Born rule: every final chance list sums to 1 and has no negative entries', () => {
  for (const n of SMALL) for (const t of TESTS) for (const s of STORIES) {
    const p = final(n, t, s);
    close(p.reduce((a, b) => a + b, 0), 1);
    assert.ok(p.every((x) => x >= -1e-15));
    const [a, b] = chances(t, s, n);
    close(a + b, 1); assert.ok(a >= 0 && b >= 0);
  }
});

test('the closed forms match the circuit, gate by gate, for every test, story, n <= 5 and per', () => {
  for (const per of PERS) for (const n of SMALL) for (const s of STORIES) {
    const read = marginal(final(n, 'read', s, per));
    close(read[0], chances('read', s, n, per)[0]); close(read[3], chances('read', s, n, per)[1]);
    for (const t of ['undo', 'undoAll'] as const) {
      const m = marginal(final(n, t, s, per));
      // After either undo the pointer reads 0 for sure; the qubit's result is what the test reads.
      close(m[1] + m[3], 0);
      close(m[0], chances(t, s, n, per)[0]); close(m[2], chances(t, s, n, per)[1]);
    }
  }
});

test('read the pointer: both stories give 00 or 11 half the time each, never 01 or 10, at any n', () => {
  for (const n of SMALL) for (const s of STORIES) {
    const m = marginal(final(n, 'read', s));
    close(m[0], 0.5); close(m[3], 0.5); close(m[1], 0); close(m[2], 0);
  }
});

test('undo with no air: 0 every time if nothing collapsed (H H = I), 1/2 after a collapse', () => {
  assert.deepEqual(chances('undo', 'unitary', 0), [1, 0]);
  assert.deepEqual(chances('undo', 'collapse', 0), [0.5, 0.5]);
  const s = testGates(record(start(0)), 0, 'undo');
  close(s[0].re, 1);
});

test('undo with air: P(0) = (1 + v)/2 with v = 0.9^n (Schlosshauer eq. 5); known values', () => {
  close(chances('undo', 'unitary', 1)[0], 0.95);
  close(chances('undo', 'unitary', 2)[0], 0.905);
  close(chances('undo', 'unitary', 10)[0], (1 + 0.9 ** 10) / 2);
  for (const n of ALL_N) close(chances('undo', 'unitary', n)[0], (1 + PER ** n) / 2);
});

test('undo the air too: the full gap is back at every n, 0 for sure with no collapse, 1/2 after one', () => {
  for (const n of ALL_N) {
    assert.deepEqual(chances('undoAll', 'unitary', n), [1, 0]);
    assert.deepEqual(chances('undoAll', 'collapse', n), [0.5, 0.5]);
  }
  for (const n of SMALL) close(final(n, 'undoAll', 'unitary')[0], 1);
});

test('a collapse later, after the air, gives the same chances as one at the pointer: the cut can move up the chain', () => {
  for (const per of PERS) for (const n of SMALL) for (const t of TESTS) {
    const s = bump(record(start(n)), n, per), late = Array.from({ length: s.length }, () => 0);
    for (const r of [0, 1] as const) {
      const b = project(s, 1, r);
      q.probs(testGates(b.state, n, t, per)).forEach((x, i) => { late[i] += b.p * x; });
    }
    final(n, t, 'collapse', per).forEach((x, i) => close(x, late[i]));
  }
});

test('the stories agree more as the air grows: the undo chance falls toward 1/2, strictly, and never reaches it', () => {
  for (let n = 1; n <= AIR.max; n++) assert.ok(chances('undo', 'unitary', n)[0] < chances('undo', 'unitary', n - 1)[0]);
  const end = chances('undo', 'unitary', AIR.max)[0];
  assert.ok(end > 0.5 && end - 0.5 < 0.001);
});

// ---- Decoherence: what the qubit and pointer alone can show

test('the reduced state of qubit and pointer: 1/2 on 00 and 11, v/2 on the cross terms, 0 after a collapse', () => {
  for (const per of PERS) for (const n of SMALL) for (const s of STORIES) {
    const want = rhoSA(n, s, per), got = [0, 1, 2, 3].map(() => [0, 0, 0, 0].map(() => q.c(0)));
    for (const b of branches(n, s, per)) reduced(b.state).forEach((row, i) => row.forEach((x, j) => { got[i][j] = q.add(got[i][j], q.scale(x, b.p)); }));
    got.forEach((row, i) => row.forEach((x, j) => { close(x.re, want[i][j]); close(x.im, 0); }));
    close(want.reduce((t, row, i) => t + row[i], 0), 1);
  }
});

test('with a full record (v = 0) the two stories leave the qubit and pointer in exactly the same state', () => {
  for (const n of [1, 2, 3]) assert.deepEqual(rhoSA(n, 'unitary', 0), rhoSA(n, 'collapse', 0));
});

test('trace distance of the two reduced states is v/2: the difference has eigenvalues +v/2 and -v/2 on the 00-11 block', () => {
  for (const per of PERS) for (const n of SMALL) {
    const a = rhoSA(n, 'unitary', per), b = rhoSA(n, 'collapse', per), d = a.map((row, i) => row.map((x, j) => x - b[i][j]));
    // Only the cross terms differ, so the difference is (v/2)(|00><11| + |11><00|).
    d.forEach((row, i) => row.forEach((x, j) => close(x, (i === 0 && j === 3) || (i === 3 && j === 0) ? overlap(n, per) / 2 : 0)));
    // The 2x2 block [[0, k], [k, 0]] has eigenvalues +k and -k; the trace norm is 2k and the trace distance half that.
    const k = d[0][3], eig = [k, -k];
    close(eig.reduce((t, x) => t + Math.abs(x), 0) / 2, gap(n, per));
  }
});

test('the undo test reaches the bound: its chances differ by exactly v/2 between the stories', () => {
  for (const n of ALL_N) close(chances('undo', 'unitary', n)[0] - chances('undo', 'collapse', n)[0], gap(n));
  close(gap(0), 0.5);
});

test('no test on the qubit and pointer alone beats v/2: 60 random two-qubit circuits, then measuring both', () => {
  const rand = q.rng(7), n = 3;
  for (const per of [0, 0.5, PER]) for (let k = 0; k < 20; k++) {
    // A random circuit on qubits 0 and 1 only: three layers of RY, RZ on each, then a CNOT.
    const layers = Array.from({ length: 3 }, () => [0, 1, 2, 3].map(() => rand() * 2 * Math.PI));
    const circuit = (s: q.State) => layers.reduce((t, [a, b, c2, d]) => {
      let x = q.apply1(q.apply1(t, q.RY(a), 0), q.RZ(b), 0);
      x = q.apply1(q.apply1(x, q.RY(c2), 1), q.RZ(d), 1);
      return q.cnot(x, 0, 1);
    }, s);
    const out = (s: Story) => {
      const m = [0, 0, 0, 0];
      for (const b of branches(n, s, per)) marginal(q.probs(circuit(b.state))).forEach((x, i) => { m[i] += b.p * x; });
      return m;
    };
    const a = out('unitary'), b = out('collapse');
    for (let i = 0; i < 4; i++) assert.ok(Math.abs(a[i] - b[i]) <= gap(n, per) + 1e-12, `${a[i] - b[i]} > ${gap(n, per)}`);
    // Any two-outcome grouping too: the bound holds for every set of results.
    close(a.reduce((t, x) => t + x, 0), 1);
    assert.ok(Math.abs(a[0] + a[3] - b[0] - b[3]) <= gap(n, per) + 1e-12);
  }
});

// ---- Runs

test('shot follows the odds: undo with no air and no collapse gives 0 every time', () => {
  const rand = q.rng(3);
  for (let k = 0; k < 500; k++) assert.equal(shot('undo', 'unitary', 0, rand), 0);
});

test('runs: counts of 0 land within 5 standard deviations of the Born rule, in every case', () => {
  const rand = q.rng(11);
  for (const t of TESTS) for (const s of STORIES) for (const n of [0, 1, 5, 20, AIR.max]) {
    const [p] = chances(t, s, n);
    let zeros = 0;
    for (let k = 0; k < SHOTS; k++) if (shot(t, s, n, rand) === 0) zeros++;
    const sd = Math.sqrt(SHOTS * p * (1 - p));
    assert.ok(Math.abs(zeros - SHOTS * p) <= 5 * sd + 1e-9, `${t} ${s} ${n}: ${zeros}`);
  }
});

test('rate: the first runs land one by one (6 a second), then faster, never above 300 a second', () => {
  assert.equal(rate(0), 6);
  for (let k = 1; k <= SHOTS; k++) assert.ok(rate(k) >= rate(k - 1) && rate(k) <= 300);
  assert.equal(rate(SHOTS), 300);
});

// ---- Words

test('sig3: up to 3 significant digits, no trailing zeros, no e-notation over the whole slider', () => {
  assert.equal(sig3(1), '1'); assert.equal(sig3(0.9), '0.9'); assert.equal(sig3(0.81), '0.81'); assert.equal(sig3(0.6561), '0.656');
  assert.equal(sig3(0.12157665), '0.122'); assert.equal(sig3(0), '0');
  for (const n of ALL_N) { assert.ok(!/e/.test(sig3(overlap(n)))); assert.ok(!/e/.test(gapText(n))); }
});

test('overlapText: "=" only when exact (0.9, 0.81, 0.729), else "≈"', () => {
  assert.deepEqual(overlapText(0), { eq: '=', value: '1' });
  assert.deepEqual(overlapText(1), { eq: '=', value: '0.9' });
  assert.deepEqual(overlapText(2), { eq: '=', value: '0.81' });
  assert.deepEqual(overlapText(3), { eq: '=', value: '0.729' });
  assert.deepEqual(overlapText(20), { eq: '≈', value: '0.122' });
  assert.deepEqual(overlapText(AIR.max), { eq: '≈', value: '0.0018' });
});

test('percent: whole numbers, 0.905 shows 91%, no false 0% or 100%', () => {
  assert.equal(percent(0.5), '50%'); assert.equal(percent(1), '100%'); assert.equal(percent(0), '0%');
  assert.equal(percent(0.905), '91%'); assert.equal(percent(0.95), '95%');
  assert.equal(percent(0.999), 'over 99%'); assert.equal(percent(0.001), 'under 1%');
  for (const n of ALL_N) { const p = percent(chances('undo', 'unitary', n)[0]); assert.ok(n === 0 ? p === '100%' : p !== '100%', p); }
});

test('gapText: v/2 as a percent: 50% with no air, 45% at 1, 40.5% at 2, under 0.1% at the end of the slider', () => {
  assert.equal(gapText(0), '50%'); assert.equal(gapText(1), '45%'); assert.equal(gapText(2), '40.5%');
  assert.equal(gapText(AIR.max), '0.0899%');
});

test('every readout names the start state, the test, both stories and the verdict, with no banned words', () => {
  const got = { collapse: [97, 103], unitary: [150, 50] } as const;
  for (const t of TESTS) for (const n of [0, 1, 2, 20, AIR.max]) for (const g of [undefined, got]) {
    const r = report(t, n, g);
    assert.ok(r.startsWith('Started as 0, then a Hadamard gate'), r);
    assert.ok(r.includes(testSteps[t]) && r.includes(verdict(t, n)) && r.includes(predict(t, n)), r);
    assert.ok(!/—|watch|look|both at once|observ|square the amplitude|mix/i.test(r), r);
    if (g) assert.ok(r.includes('200 runs each') && r.includes('97 times in story A') && r.includes('150 times in story B'), r);
  }
  assert.ok(setup(0).includes('no air molecules') && setup(1).includes('1 air molecule ') && setup(20).includes('20 air molecules'));
});

test('predictions in words match the numbers', () => {
  assert.ok(predict('undo', 0).includes('predicts 50% give 0') && predict('undo', 0).includes('predicts 100%'));
  assert.ok(predict('undo', 2).includes('predicts 91%'));
  assert.ok(predict('undoAll', 30).includes('predicts 100%'));
  assert.ok(predict('read', 7).includes('half the time') && predict('read', 7).includes('always matches'));
});

test('verdicts: reading cannot tell; the undo gap shrinks with the air; undoing the air brings it back', () => {
  assert.ok(verdict('read', 0).includes('cannot tell'));
  assert.ok(verdict('undo', 0).includes('0 every time') && verdict('undo', 0).includes('half the time'));
  assert.ok(verdict('undo', 20).includes(gapText(20)));
  assert.ok(verdict('undoAll', 20).includes('50%') && verdict('undoAll', 20).includes('in practice'));
  assert.ok(verdict('undoAll', 0).includes('100% versus 50%'));
});

test('names and labels: two stories, three tests, row labels per test', () => {
  assert.equal(STORIES.length, 2); assert.equal(TESTS.length, 3);
  assert.ok(STORY_NAME.collapse.startsWith('Story A') && STORY_NAME.unitary.startsWith('Story B'));
  for (const t of TESTS) assert.ok(TEST_NAME[t].length > 0);
  assert.equal(rowLabel('read', 1), 'reads 1'); assert.equal(rowLabel('undo', 0), 'gives 0');
});

test('valueText says the molecules and the overlap', () => {
  assert.equal(valueText(0), 'No molecules, so no air records.');
  assert.equal(valueText(1), "1 molecule. The air's two possible records overlap 0.9.");
  assert.equal(valueText(20), "20 molecules. The air's two possible records overlap 0.122.");
});

test('the slider: whole molecules from 0 to 60, starting with no air', () => {
  assert.equal(AIR.min, 0); assert.equal(AIR.max, 60); assert.equal(AIR.step, 1); assert.equal(AIR.start, 0);
});

// ---- Layout

test('dots: each row holds every run, fits its width, pitch from 5 to 9 px', () => {
  for (let w = 150; w <= 900; w += 7) {
    const d = dots(w);
    assert.ok(d.rows * d.cols >= SHOTS);
    assert.ok(d.cols * d.pitch <= w + 1e-9, `${w}`);
    assert.ok(d.pitch >= 5 && d.pitch <= 9);
  }
});

test('layout: from a 320 px phone (about 238 px of tool) to desktop, every dot and tick fits, nothing overlaps', () => {
  for (let w = 230; w <= 1200; w += 3) {
    const L = layout(w);
    assert.ok(L.h > 0);
    const [a, b] = L.blocks;
    if (w >= WIDE) { assert.ok(a.x + a.w <= b.x); close(a.y, b.y); } else { assert.ok(a.y + a.h <= b.y); close(a.x, b.x); }
    for (const blk of L.blocks) {
      assert.ok(blk.x >= PAD - 1e-9 && blk.x + blk.w <= w - PAD + 1e-9 && blk.y + blk.h <= L.h - PAD + 1e-9);
      const [g0, g1] = blk.grids;
      assert.ok(g0.y + g0.rows * g0.pitch <= g1.y);
      for (const g of blk.grids) {
        const [x0, y0] = cell(g, 0), [x1, y1] = cell(g, SHOTS - 1);
        assert.ok(x0 > g.x && x1 < g.x + g.w + 1e-9 && y0 > g.y && y1 < blk.y + blk.h + 1e-9);
        assert.ok(tickX(g, SHOTS) <= g.x + g.w + 1e-9 && tickX(g, 0) === g.x);
      }
    }
  }
});

test('cell fills column by column, so a row of k dots ends at tickX(k)', () => {
  const g = layout(320).blocks[0].grids[0];
  for (const k of [g.rows, 2 * g.rows, 5 * g.rows]) close(cell(g, k - 1)[0] + g.pitch / 2, tickX(g, k));
  assert.equal(cell(g, 1)[0], cell(g, 0)[0]);
});


test('chanceTexts: story A and B never show the same text when their chances differ, at any n and test', () => {
  for (const test of TESTS) for (const n of ALL_N) {
    const [a, b] = chanceTexts(test, n), [pa, pb] = [chances(test, 'collapse', n)[0], chances(test, 'unitary', n)[0]];
    assert.equal(a === b, pa === pb, `${test} n=${n}: ${a} vs ${b}`);
    assert.ok(predict(test, n).includes(a) && predict(test, n).includes(b) || test === 'read');
  }
  assert.deepEqual(chanceTexts('undo', 43), ['50%', '51%']);
  assert.deepEqual(chanceTexts('undo', 44), ['50%', '50.5%']);
  assert.deepEqual(chanceTexts('undo', 60), ['50%', '50.1%']);
  assert.deepEqual(chanceTexts('undo', 2), ['50%', '91%']);
});
