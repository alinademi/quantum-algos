import test from 'node:test';
import assert from 'node:assert/strict';
import * as q from '../quantum.ts';
import {
  SHOTS, STRENGTH, TURN, STARTS, CHANNELS,
  unit, outer, maxDiff, kraus, levels, applyKraus, completeness,
  choiOfMap, choiFromKraus, vec, choiFromVec, block, readChoi, readChoiTrace, traceOutput, choiState, bellPair,
  decompose, krausFromChoi, choiRank,
  stinespring, krausOf, turn, turned, isUnitary, dropWorkspace, circuit, choiFromCircuit,
  ket, perp, rhoOf, outcomes, keepFromOutcomes, keepFromChoi, keepFromKraus, shots, tally, keptCount,
  num, cnum, strength, workspaceName, degrees, valueText, turnText, describe,
  type Channel,
} from './channel-representations.ts';

const close = (a: number, b: number, eps = 1e-12) => assert.ok(Math.abs(a - b) < eps, `${a} != ${b}`);
const closeM = (a: q.Matrix, b: q.Matrix, eps = 1e-12) => assert.ok(maxDiff(a, b) < eps, `matrices differ by ${maxDiff(a, b)}`);
const real = (re: number[][]): q.Matrix => re.map((row) => row.map((x) => q.c(x)));
const S2 = Math.SQRT1_2;

const CH: Channel[] = ['bit', 'phase', 'depol', 'damp'];
const SOME_PS = [0, 0.01, 0.1, 0.2, 0.25, 0.37, 0.5, 0.63, 0.8, 0.99, 1];
const ANGLES = [0, 1, 17, 30, 45, 60, 90, 133, 180];
// Inputs: the six axis states, a mixed state, and a state with complex entries, all as 2 by 2 density matrices.
const RHOS: q.Matrix[] = [
  ...STARTS.map((_, i) => rhoOf(i)),
  [[q.c(0.7), q.c(0.1, -0.2)], [q.c(0.1, 0.2), q.c(0.3)]],
  [[q.c(0.5), q.c(0)], [q.c(0), q.c(0.5)]],
];
// Linear maps need not be physical: apply them to |a><b| too.
const ELEMS: q.Matrix[] = [unit(0, 0, 2), unit(0, 1, 2), unit(1, 0, 2), unit(1, 1, 2)];
const tr = (m: q.Matrix) => q.add(m[0][0], m[1][1]);
// One Stinespring matrix per (channel, strength), built once: the loops below only turn and measure it.
const CACHE = new Map<string, q.Matrix>();
const U_OF = (ch: Channel, p: number) => { const k = `${ch}${p}`; if (!CACHE.has(k)) CACHE.set(k, stinespring(kraus(ch, p))); return CACHE.get(k)!; };
const mscaleNeg = (m: q.Matrix) => m.map((row) => row.map((z) => q.scale(z, -1)));

test('constants match the sliders', () => {
  assert.equal(SHOTS, 100);
  assert.deepEqual([STRENGTH.min, STRENGTH.max, STRENGTH.step], [0, 100, 1]);
  assert.deepEqual([TURN.min, TURN.max, TURN.step, TURN.start], [0, 180, 1, 0]);
  assert.equal(STARTS.length, 6);
});

// ---- Kraus operators

test('every channel is trace preserving: the sum of A dagger A is the identity, for every slider stop', () => {
  for (const ch of CH) for (let k = 0; k <= 100; k++) closeM(completeness(kraus(ch, k / 100)), q.I);
});

test('Kraus operators give the closed-form Bloch maps of the noise-channels stop', () => {
  const blochOf = (rho: q.Matrix) => [2 * rho[0][1].re, -2 * rho[0][1].im, rho[0][0].re - rho[1][1].re];
  const cases: [Channel, (p: number) => { s: number[]; t: number[] }][] = [
    ['bit', (p) => ({ s: [1, 1 - 2 * p, 1 - 2 * p], t: [0, 0, 0] })],
    ['phase', (p) => ({ s: [1 - 2 * p, 1 - 2 * p, 1], t: [0, 0, 0] })],
    ['depol', (p) => ({ s: [1 - p, 1 - p, 1 - p], t: [0, 0, 0] })],
    ['damp', (p) => ({ s: [Math.sqrt(1 - p), Math.sqrt(1 - p), 1 - p], t: [0, 0, p] })],
  ];
  const pts = [[0.6, -0.3, 0.2], [0, 0, 1], [0, 0, -1], [1, 0, 0], [0, 1, 0], [0, 0, 0]];
  for (const [ch, f] of cases) for (const p of SOME_PS) for (const v of pts) {
    const rho = [[q.c((1 + v[2]) / 2), q.c(v[0] / 2, -v[1] / 2)], [q.c(v[0] / 2, v[1] / 2), q.c((1 - v[2]) / 2)]];
    const out = blochOf(applyKraus(kraus(ch, p), rho)), { s, t } = f(p);
    out.forEach((x, k) => close(x, s[k] * v[k] + t[k]));
  }
});

test('levels: two Kraus operators, four for depolarizing', () => {
  assert.deepEqual(CH.map(levels), [2, 2, 4, 2]);
  assert.equal(workspaceName(2), 'a qubit');
  assert.equal(workspaceName(4), 'two qubits');
});

// ---- The Choi matrix

test('the Choi matrix of the identity channel is the IBM matrix: four 1s in the corners', () => {
  const J = choiFromKraus([q.I]);
  closeM(J, real([[1, 0, 0, 1], [0, 0, 0, 0], [0, 0, 0, 0], [1, 0, 0, 1]]));
  // J/2 is the Bell pair (|00> + |11>)/sqrt2 as a density matrix.
  closeM(choiState(J), outer(bellPair()));
});

test('the Choi matrices of dephasing, depolarizing and reset are the IBM matrices', () => {
  closeM(choiFromKraus(kraus('phase', 0.5)), real([[1, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 1]]));
  closeM(choiFromKraus(kraus('depol', 1)), real([[.5, 0, 0, 0], [0, .5, 0, 0], [0, 0, .5, 0], [0, 0, 0, .5]]));
  closeM(choiFromKraus(kraus('damp', 1)), real([[1, 0, 0, 0], [0, 0, 0, 0], [0, 0, 1, 0], [0, 0, 0, 0]]));
});

test('bit flip at p = 0.2: 0.8 where the pair is untouched, 0.2 where X acted', () => {
  const J = choiFromKraus(kraus('bit', 0.2));
  const want = real([[.8, 0, 0, .8], [0, .2, .2, 0], [0, .2, .2, 0], [.8, 0, 0, .8]]);
  closeM(J, want);
});

test('three ways to make the Choi matrix agree: apply the channel to |a><b|, stack the Kraus operators, run the circuit', () => {
  for (const ch of CH) for (const p of SOME_PS) {
    const ks = kraus(ch, p), a = choiFromKraus(ks), b = choiFromVec(ks), cc = choiFromCircuit(stinespring(ks));
    closeM(a, b); closeM(a, cc);
  }
});

test('vec stacks the columns: the Choi block of |a><b| is made from the Kraus operators', () => {
  const A = real([[1, 2], [3, 4]]);
  assert.deepEqual(vec(A).map((z) => z.re), [1, 3, 2, 4]);
  // Block (a, b) of sum_k vec(A_k) vec(A_k)^dagger is sum_k A_k |a><b| A_k^dagger.
  for (const ch of CH) {
    const ks = kraus(ch, 0.3), J = choiFromVec(ks);
    for (const a of [0, 1]) for (const b of [0, 1]) closeM(block(J, a, b), applyKraus(ks, unit(a, b, 2)));
  }
});

test('a channel has a Choi matrix that is positive semidefinite with Tr_Y J = I, for every slider stop', () => {
  for (const ch of CH) for (let k = 0; k <= 100; k++) {
    const J = choiFromKraus(kraus(ch, k / 100));
    assert.ok(decompose(J) !== null, `${ch} ${k}: not positive semidefinite`);
    closeM(traceOutput(J), q.I);
    // Hermitian, with real entries for these channels.
    closeM(J, q.dagger(J));
    J.flat().forEach((z) => close(z.im, 0));
    close(J.reduce((t, row, i) => t + row[i].re, 0), 2);
  }
});

test('the Choi matrix is faithful: it gives back Phi(rho) as a sum of blocks and as Tr_X[(rho^T (x) I) J]', () => {
  for (const ch of CH) for (const p of [0, 0.2, 0.5, 1]) {
    const ks = kraus(ch, p), J = choiFromKraus(ks);
    for (const rho of [...RHOS, ...ELEMS]) {
      closeM(readChoi(J, rho), applyKraus(ks, rho));
      closeM(readChoiTrace(J, rho), applyKraus(ks, rho));
    }
  }
});

test('two channels are the same exactly when their Choi matrices are the same', () => {
  // Phase flip with p = 1/2 and the pair |0><0|, |1><1| are the same channel; bit flip at 1/2 is a different one.
  const ks1 = kraus('phase', 0.5);
  const ks2 = [real([[1, 0], [0, 0]]), real([[0, 0], [0, 1]])];
  closeM(choiFromKraus(ks1), choiFromKraus(ks2));
  for (const rho of RHOS) closeM(applyKraus(ks1, rho), applyKraus(ks2, rho));
  assert.ok(maxDiff(choiFromKraus(kraus('bit', 0.5)), choiFromKraus(ks1)) > 0.4);
  // Different strengths are different channels.
  assert.ok(maxDiff(choiFromKraus(kraus('bit', 0.2)), choiFromKraus(kraus('bit', 0.3))) > 0.09);
});

test('the Choi state is the channel applied to half of a Bell pair', () => {
  for (const ch of CH) for (const p of [0, 0.2, 0.7, 1]) {
    const ks = kraus(ch, p), pair = outer(bellPair());
    // (I (x) A_k) |Phi+><Phi+| (I (x) A_k)^dagger, summed.
    const half = ks.map((A) => q.kron(q.I, A)).map((K) => q.matMul(q.matMul(K, pair), q.dagger(K)));
    closeM(choiState(choiFromKraus(ks)), half.reduce((s, m) => s.map((row, i) => row.map((x, j) => q.add(x, m[i][j])))));
  }
});

test('the transpose map sends states to states but is not completely positive: its Choi matrix is the swap, with eigenvalue -1', () => {
  const T = (m: q.Matrix): q.Matrix => [[m[0][0], m[1][0]], [m[0][1], m[1][1]]];
  const J = choiOfMap(T);
  closeM(J, real([[1, 0, 0, 0], [0, 0, 1, 0], [0, 1, 0, 0], [0, 0, 0, 1]]));
  assert.equal(decompose(J), null);
  assert.equal(krausFromChoi(J), null);
  // A state of one qubit goes to a state of one qubit...
  for (const rho of RHOS) { const t = T(rho); close(tr(t).re, 1); assert.ok(t[0][0].re >= 0 && t[1][1].re >= 0); }
  // ...but half of a Bell pair does not: the swap's expectation in the output has a negative eigenvalue (-1 on the singlet).
  const singlet: q.State = [q.c(0), q.c(S2), q.c(-S2), q.c(0)];
  close(q.inner(singlet, q.matVec(J, singlet)).re, -1);
});

// ---- From the Choi matrix back to Kraus operators

test('Choi to Kraus: the vectors rebuild J, and the operators rebuild the channel and keep Sum A†A = I', () => {
  for (const ch of CH) for (const p of SOME_PS) {
    const J = choiFromKraus(kraus(ch, p)), ks = krausFromChoi(J)!;
    assert.ok(ks !== null);
    closeM(choiFromVec(ks), J, 1e-9);
    closeM(completeness(ks), q.I, 1e-9);
    for (const rho of RHOS) closeM(applyKraus(ks, rho), applyKraus(kraus(ch, p), rho), 1e-9);
    assert.ok(ks.length <= 4);
  }
});

test('the Choi rank is the fewest Kraus operators', () => {
  const rank = (ch: Channel, p: number) => choiRank(choiFromKraus(kraus(ch, p)));
  for (const ch of CH) { assert.equal(rank(ch, 0), 1); }
  for (const ch of ['bit', 'phase', 'damp'] as Channel[]) for (const p of [0.01, 0.3, 0.7, 0.99]) assert.equal(rank(ch, p), 2);
  assert.equal(rank('bit', 1), 1);
  assert.equal(rank('phase', 1), 1);
  assert.equal(rank('damp', 1), 2);
  for (const p of [0.01, 0.3, 1]) assert.equal(rank('depol', p), 4);
  assert.equal(choiRank(real([[1, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, -0.5]])), null);
  assert.equal(choiRank(q.kron(q.I, q.I)), 4);
});

test('the Choi rank is numerical: a weight below the tolerance counts as 0, a bigger one does not', () => {
  const J = (eps: number) => real([[1, 0, 0, 1], [0, 0, 0, 0], [0, 0, 0, 0], [1, 0, 0, 1 + eps]]); // rank 1 at eps = 0
  assert.equal(choiRank(J(0)), 1);
  assert.equal(choiRank(J(1e-12)), 1); // exactly rank 2 on paper, but the tiny piece is below the tolerance
  assert.equal(choiRank(J(1e-3)), 2);
});

test('a zero-weight Kraus operator is still there in the workspace, but the Choi rank counts only the real ones', () => {
  assert.equal(levels('bit'), 2);
  assert.equal(choiRank(choiFromKraus(kraus('bit', 0))), 1);
  assert.equal(choiRank(choiFromKraus(kraus('bit', 1))), 1);
});

// ---- Stinespring

test('the Stinespring matrix is a unitary: 4 by 4 for a qubit workspace, 8 by 8 for two qubits', () => {
  for (const ch of CH) for (const p of SOME_PS) {
    const U = stinespring(kraus(ch, p));
    assert.equal(U.length, levels(ch) * 2);
    assert.ok(isUnitary(U), `${ch} ${p}`);
    closeM(q.matMul(U, q.dagger(U)), q.matMul(q.dagger(U), U));
  }
});

test('the first two columns of U hold the Kraus operators, and the fill does not matter', () => {
  for (const ch of CH) for (const p of SOME_PS) {
    const ks = kraus(ch, p), U = stinespring(ks);
    krausOf(U).forEach((A, k) => closeM(A, ks[k]));
  }
  // A second, different unitary with the same first two columns (flip the sign of one filler column) gives the same circuit.
  const ks = kraus('bit', 0.3), U = stinespring(ks);
  const U2 = U.map((row) => row.map((z, j) => (j === 3 ? q.scale(z, -1) : z)));
  assert.ok(isUnitary(U2));
  assert.ok(maxDiff(U, U2) > 0.1);
  for (const rho of RHOS) closeM(circuit(U, rho), circuit(U2, rho));
  closeM(choiFromCircuit(U), choiFromCircuit(U2));
});

test('the circuit (workspace at 0, unitary, drop the workspace) gives the Kraus output on any input matrix', () => {
  for (const ch of CH) for (const p of SOME_PS) {
    const ks = kraus(ch, p), U = stinespring(ks);
    for (const rho of [...RHOS, ...ELEMS]) closeM(circuit(U, rho), applyKraus(ks, rho));
    for (const rho of RHOS) close(tr(circuit(U, rho)).re, 1);
  }
});

test('bit flip circuit: the workspace marks the flip. U|0>|x> = sqrt(1-p)|0>|x> + sqrt(p)|1>|1-x>', () => {
  const p = 0.2, U = stinespring(kraus('bit', p));
  for (const x of [0, 1]) {
    const out = q.matVec(U, q.basis(2, x)); // index 2w + x with w = 0
    // indices: (g, y) = 2g + y
    close(out[x].re, Math.sqrt(1 - p));
    close(out[2 + (1 - x)].re, Math.sqrt(p));
    close(q.norm2(out), 1);
  }
});

test('dropping the workspace: a pure two-qubit state with a record in W looks mixed on the qubit', () => {
  // Started as |+>, phase flip p = 1/2 circuit. The pair after U is pure (norm 1), the qubit alone is the channel output.
  const U = stinespring(kraus('phase', 0.5)), plusState: q.State = [q.c(S2), q.c(S2), q.c(0), q.c(0)];
  const pair = q.matVec(U, plusState);
  close(q.norm2(pair), 1);
  const rho = dropWorkspace(outer(pair));
  closeM(rho, real([[.5, 0], [0, .5]])); // complete dephasing of |+>: the fully mixed state
  const purity = q.matMul(rho, rho); close(tr(purity).re, 0.5);
});

// ---- Turning the workspace

test('turn is a real rotation: orthogonal, with the right entries', () => {
  for (const a of ANGLES) {
    const V = turn(2, a), V4 = turn(4, a);
    closeM(q.matMul(V, q.dagger(V)), q.I); closeM(q.matMul(V4, q.dagger(V4)), q.kron(q.I, q.I));
  }
  const V = turn(2, 30);
  close(V[0][0].re, Math.cos(Math.PI / 6)); close(V[0][1].re, 0.5); close(V[1][0].re, -0.5); close(V[1][1].re, Math.cos(Math.PI / 6));
  closeM(turn(2, 0), q.I);
  closeM(turn(2, 180), mscaleNeg(q.I));
  // At 90 degrees the two Kraus operators swap, one with a sign.
  closeM(turn(2, 90), real([[0, 1], [-1, 0]]));
});

test('turning the workspace gives new Kraus operators, A\'_j = sum_k V_jk A_k, with the same Choi matrix and the same channel', () => {
  for (const ch of CH) for (const p of [0, 0.2, 0.5, 1]) for (const a of ANGLES) {
    const ks = kraus(ch, p), U = stinespring(ks), V = turn(ks.length, a), Ut = turned(U, V);
    assert.ok(isUnitary(Ut));
    const kt = krausOf(Ut);
    kt.forEach((A, j) => {
      const mix = ks.map((B, k) => B.map((row) => row.map((z) => q.mul(z, V[j][k])))).reduce((s, m) => s.map((row, i) => row.map((x, jj) => q.add(x, m[i][jj]))));
      closeM(A, mix);
    });
    closeM(choiFromCircuit(Ut), choiFromKraus(ks));
    closeM(choiFromKraus(kt), choiFromKraus(ks));
    closeM(completeness(kt), q.I);
    for (const rho of RHOS) closeM(circuit(Ut, rho), applyKraus(ks, rho));
  }
});

test('turning really changes the Kraus operators (so the Choi matrix staying put is not trivial)', () => {
  const ks = kraus('bit', 0.2), U = stinespring(ks);
  for (const a of [10, 40, 90]) {
    const kt = krausOf(turned(U, turn(2, a)));
    assert.ok(maxDiff(kt[0], ks[0]) > 0.05 || maxDiff(kt[1], ks[1]) > 0.05, `${a}`);
  }
  // Half a turn flips the sign of every Kraus operator; the channel does not care.
  const kt = krausOf(turned(U, turn(2, 180)));
  kt.forEach((A, k) => closeM(A, mscaleNeg(ks[k])));
});

test('phase flip at p = 1/2 turned by 45 degrees gives the textbook dephasing pair |0><0| and -|1><1|', () => {
  const ks = kraus('phase', 0.5), kt = krausOf(turned(stinespring(ks), turn(2, 45)));
  closeM(kt[0], real([[1, 0], [0, 0]]));
  closeM(kt[1], real([[0, 0], [0, -1]]));
});

// ---- Shots: the Born rule

test('chances over (workspace result, qubit result) add to 1, for every channel, start state and turn', () => {
  for (const ch of CH) for (const p of SOME_PS) for (const a of [0, 40, 90, 180]) for (let i = 0; i < 6; i++) {
    const ps = outcomes(turned(U_OF(ch, p), turn(levels(ch), a)), i);
    assert.equal(ps.length, levels(ch) * 2);
    close(ps.reduce((t, x) => t + x, 0), 1);
    ps.forEach((x) => assert.ok(x >= 0));
  }
});

test('the chance of the start state is the same from the circuit, the Kraus operators and the Choi matrix, and does not depend on the turn', () => {
  for (const ch of CH) for (const p of SOME_PS) for (let i = 0; i < 6; i++) {
    const ks = kraus(ch, p), J = choiFromKraus(ks), a0 = keepFromKraus(ks, i);
    close(keepFromChoi(J, i), a0, 1e-9);
    for (const a of [0, 30, 133, 180]) close(keepFromOutcomes(outcomes(turned(U_OF(ch, p), turn(ks.length, a)), i)), a0, 1e-9);
  }
});

test('the joint chances are |<y|A\'_j|psi>|^2 for the turned Kraus operators', () => {
  for (const ch of CH) for (const a of [0, 25, 70]) for (let i = 0; i < 6; i++) {
    const ks = kraus(ch, 0.3), Ut = turned(stinespring(ks), turn(ks.length, a)), kt = krausOf(Ut), psi = ket(i);
    const ps = outcomes(Ut, i);
    kt.forEach((A, j) => {
      const out = q.matVec(A, psi);
      close(ps[2 * j], q.abs2(q.inner(psi, out)));
      close(ps[2 * j + 1], q.abs2(q.inner(perp(psi), out)));
    });
  }
});

test('known chances of the start state', () => {
  const keep = (ch: Channel, p: number, i: number) => keepFromOutcomes(outcomes(stinespring(kraus(ch, p)), i));
  // Started as |0>, a bit flip leaves 0 with chance 1 - p; started as |+>, it changes nothing.
  close(keep('bit', 0.2, 0), 0.8); close(keep('bit', 0.2, 2), 1); close(keep('bit', 0.2, 1), 0.8);
  // Started as |+>, a phase flip leaves + with chance 1 - p; started as |0> it changes nothing.
  close(keep('phase', 0.1, 2), 0.9); close(keep('phase', 0.1, 0), 1); close(keep('phase', 0.5, 4), 0.5);
  // Depolarizing leaves any axis state with chance 1 - p/2.
  for (let i = 0; i < 6; i++) close(keep('depol', 0.3, i), 0.85);
  // Amplitude damping: |0> stays, |1> stays with 1 - gamma, |+> stays with (1 + sqrt(1 - gamma))/2.
  close(keep('damp', 0.36, 0), 1); close(keep('damp', 0.36, 1), 0.64); close(keep('damp', 0.36, 2), (1 + 0.8) / 2);
  // No noise: every shot gives the start state, and the workspace always says 0.
  for (const ch of CH) for (let i = 0; i < 6; i++) {
    const ps = outcomes(stinespring(kraus(ch, 0)), i);
    close(ps[0], 1); ps.slice(1).forEach((x) => close(x, 0));
  }
});

test('exact 0 and 1 are exact: no float dust in the chance of the start state', () => {
  assert.equal(keepFromOutcomes(outcomes(stinespring(kraus('bit', 0.2)), 2)), 1);
  assert.equal(keepFromOutcomes(outcomes(stinespring(kraus('phase', 0.3)), 0)), 1);
  assert.equal(keepFromOutcomes(outcomes(stinespring(kraus('damp', 1)), 1)), 0);
  assert.equal(keepFromChoi(choiFromKraus(kraus('bit', 0.4)), 4 - 2), 1);
  assert.equal(keepFromKraus(kraus('bit', 0.4), 2), 1);
});

test('shots: each follows its own draw, the tally adds up, and an impossible outcome never happens', () => {
  const rand = q.rng(7), us = Array.from({ length: SHOTS }, () => rand());
  const ps = outcomes(stinespring(kraus('bit', 0.2)), 0);
  const outs = shots(us, ps), t = tally(outs, 2);
  assert.equal(outs.length, SHOTS);
  assert.equal(t.flat().reduce((s, x) => s + x, 0), SHOTS);
  assert.equal(keptCount(t), t[0][0] + t[1][0]);
  // Started as |0>, a bit flip: the workspace result 0 always leaves 0; result 1 always gives 1.
  assert.equal(t[0][1], 0);
  assert.equal(t[1][0], 0);
  // Same draws, same chances, same shots.
  assert.deepEqual(shots(us, ps), outs);
  // No noise: every shot is (0, gave the start state).
  assert.deepEqual(tally(shots(us, outcomes(stinespring(kraus('bit', 0)), 0)), 2), [[SHOTS, 0], [0, 0]]);
  // Draws at the edges.
  assert.equal(shots([0], ps)[0], 0);
  assert.ok(ps[shots([0.999999999], ps)[0]] > 0);
});

test('shots follow the Born rule: big seeded batches land near the chances', () => {
  const rand = q.rng(11), n = 20000;
  for (const [ch, p, a, i] of [['bit', 0.2, 0, 0], ['depol', 0.4, 40, 2], ['damp', 0.5, 70, 3]] as [Channel, number, number, number][]) {
    const ps = outcomes(turned(stinespring(kraus(ch, p)), turn(levels(ch), a)), i);
    const outs = shots(Array.from({ length: n }, () => rand()), ps), counts = ps.map(() => 0);
    outs.forEach((o) => counts[o]++);
    counts.forEach((k, o) => assert.ok(Math.abs(k / n - ps[o]) < 5 * Math.sqrt((ps[o] * (1 - ps[o])) / n) + 1e-9, `${ch} outcome ${o}: ${k / n} vs ${ps[o]}`));
  }
});

test('turning the workspace moves shots between columns but the kept total keeps its chance', () => {
  // Phase flip, started as |+>, p = 1/2, turned 45 degrees: the workspace result no longer marks "flip or not".
  const ks = kraus('phase', 0.5);
  const plain = outcomes(stinespring(ks), 2), turnedUp = outcomes(turned(stinespring(ks), turn(2, 45)), 2);
  close(keepFromOutcomes(plain), 0.5); close(keepFromOutcomes(turnedUp), 0.5);
  // Plain: the workspace result 0 (no flip) always gives +, result 1 (flip) always gives −.
  close(plain[0], 0.5); close(plain[3], 0.5);
  // Turned: A'_0 = |0><0|, A'_1 = -|1><1|. Each result gives + or − with equal chance.
  turnedUp.forEach((x) => close(x, 0.25));
});

test('a shot gave the start state exactly when its draw is below the chance, so turning never changes the kept count', () => {
  const rand = q.rng(5), us = Array.from({ length: SHOTS }, () => rand());
  for (const [ch, p, i] of [['phase', 0.5, 2], ['bit', 0.3, 0], ['depol', 0.4, 3], ['damp', 0.5, 2]] as [Channel, number, number][]) {
    const ks = kraus(ch, p), keep = keepFromKraus(ks, i), want = us.filter((u) => u < keep).length;
    for (const a of ANGLES) {
      const ps = outcomes(turned(U_OF(ch, p), turn(ks.length, a)), i), outs = shots(us, ps);
      assert.equal(keptCount(tally(outs, ks.length)), want, `${ch} ${a}`);
      outs.forEach((o, s) => assert.equal(o & 1, us[s] < keep ? 0 : 1));
    }
  }
  // Started as |+>, phase flip p = 1/2: the same kept count at 0 and 90 degrees, while shots do move between columns.
  const ps0 = outcomes(U_OF('phase', 0.5), 2), ps90 = outcomes(turned(U_OF('phase', 0.5), turn(2, 90)), 2);
  assert.equal(keptCount(tally(shots(us, ps0), 2)), keptCount(tally(shots(us, ps90), 2)));
});

// ---- Words

test('num and cnum: two decimals, true minus, never -0.00', () => {
  assert.equal(num(0.2), '0.20'); assert.equal(num(-0.25), '−0.25'); assert.equal(num(-0.001), '0.00'); assert.equal(num(0), '0.00');
  assert.equal(cnum(q.c(0.5)), '0.50'); assert.equal(cnum(q.c(-0.5, 1e-14)), '−0.50');
  assert.equal(cnum(q.c(0, 0.5)), '0.50i'); assert.equal(cnum(q.c(0, -0.5)), '−0.50i');
  assert.equal(cnum(q.c(0.5, -0.25)), '0.50 − 0.25i'); assert.equal(cnum(q.c(-0.5, 0.25)), '−0.50 + 0.25i');
  assert.equal(strength(0.2), '0.20'); assert.equal(degrees(40), '40°');
});

test('the readout names the start state and the noise, and is right about the chance', () => {
  const t = describe('bit', 0.2, 0, 0);
  assert.match(t, /Started as \|0⟩, then a bit flip with p = 0\.20/);
  assert.match(t, /a qubit that starts as 0|workspace of a qubit that starts as 0/);
  assert.match(t, /Measured in the 0\/1 basis, a shot gives \|0⟩ with chance 80% and \|1⟩ with chance 20%/);
  assert.match(t, /same chance/);
  assert.match(t, /not turned/);
  assert.match(t, /rank of its Choi matrix/);
  assert.ok(!t.includes('This batch'));
  // Started as |+>, a bit flip changes nothing.
  assert.match(describe('bit', 0.2, 2, 0), /every shot gives \|\+⟩/);
  // A turned workspace: the Kraus operators change, the Choi matrix does not.
  const turnedText = describe('phase', 0.5, 2, 45, 51);
  assert.match(turnedText, /turned by 45°: the Kraus operators changed, and the Choi matrix did not change/);
  assert.match(turnedText, /A'0 = cos 45° A0 \+ sin 45° A1/);
  assert.match(turnedText, /This batch of 100 shots gave \|\+⟩ 51 times/);
  assert.match(turnedText, /a label that depends on how the workspace is measured/);
  // Depolarizing needs two workspace qubits and four Kraus operators.
  assert.match(describe('depol', 0.5, 1, 30), /workspace of two qubits/);
  assert.match(describe('depol', 0.5, 1, 30), /A2 with A3/);
  assert.match(describe('depol', 0.5, 1, 30), /is 4, the rank/);
  assert.match(describe('damp', 1, 1, 0), /every shot gives \|0⟩/);
  assert.match(describe('damp', 0.2, 1, 0), /γ = 0\.20/);
  assert.equal(turnText(2, 0), 'The workspace is not turned: the Kraus operators are the standard ones.');
});

test('the slider text names the start state', () => {
  assert.match(valueText('phase', 0.1, 2), /Started as \|\+⟩, a shot gives \|\+⟩ with chance 90%/);
  assert.equal(CHANNELS.damp.sym, 'γ');
});
