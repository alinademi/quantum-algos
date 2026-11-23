import test from 'node:test';
import assert from 'node:assert/strict';
import * as q from '../quantum.ts';
import * as b from './bases.ts';

const close = (a: number, x: number, eps = 1e-12) => assert.ok(Math.abs(a - x) < eps, `${a} != ${x}`);
const RAD = Math.PI / 180;
/** |<u|v>| = 1: the same state up to a global phase. */
const samePhysical = (u: q.State, v: q.State) => close(q.abs(q.inner(u, v)), 1);

// A grid of axes: every tilt and turn in 15 degree steps, plus odd ones.
const AXES: b.Axis[] = [];
for (let tilt = 0; tilt <= 180; tilt += 15) for (let turn = 0; turn < 360; turn += 15) AXES.push({ tilt, turn });
AXES.push({ tilt: 1, turn: 359 }, { tilt: 37, turn: 211 }, { tilt: 179, turn: 7 }, { tilt: 90, turn: 180 }, { tilt: 90, turn: 270 });

// Test states: the six presets, plus states off the axes and one with a global phase.
const STATES: q.State[] = [
  ...b.STATE_IDS.map(b.startState),
  q.fromBloch(1.1, 0.4), q.fromBloch(2.5, -2), q.fromBloch(0.3, 3),
  [q.c(0.6), q.c(0.8)], [q.c(1 / 3, 2 / 3), q.c(-2 / 3)],
  q.fromBloch(1.7, 1).map((a) => q.mul(q.expi(0.9), a)),
];

// ---- The start states

test('start states are unit vectors at the six ends of the X, Y and Z axes', () => {
  const where: Record<b.StateId, b.Vec3> = { '0': [0, 0, 1], '1': [0, 0, -1], '+': [1, 0, 0], '-': [-1, 0, 0], '+i': [0, 1, 0], '-i': [0, -1, 0] };
  for (const id of b.STATE_IDS) {
    const s = b.startState(id);
    close(q.norm2(s), 1);
    b.point(id).forEach((x, i) => close(x, where[id][i]));
  }
});

test('CARDINAL (the picture\'s six points) lists every start state once, at its Bloch vector', () => {
  assert.deepEqual(b.CARDINAL.map(([id]) => id), [...b.STATE_IDS]);
  for (const [id, v] of b.CARDINAL) b.point(id).forEach((x, i) => close(x, v[i]));
});

test('ket text uses a true minus sign', () => {
  assert.deepEqual(b.STATE_IDS.map(b.ketText), ['|0⟩', '|1⟩', '|+⟩', '|−⟩', '|+i⟩', '|−i⟩']);
});

// ---- Bases as axes

test('every axis gives an orthonormal basis: b0 at the axis end, b1 at the opposite point', () => {
  for (const a of AXES) {
    const [b0, b1] = b.ends(a), n = b.direction(a);
    close(q.norm2(b0), 1); close(q.norm2(b1), 1);
    close(q.abs(q.inner(b0, b1)), 0);
    close(Math.hypot(...n), 1);
    q.bloch(b0).forEach((x, i) => close(x, n[i]));
    q.bloch(b1).forEach((x, i) => close(x, -n[i]));
  }
});

test('named bases: Z is |0>, |1>; X is |+>, |->; Y is |+i>, |-i> (up to a global phase)', () => {
  const want: Record<b.BasisName, [b.StateId, b.StateId]> = { Z: ['0', '1'], X: ['+', '-'], Y: ['+i', '-i'] };
  for (const n of ['Z', 'X', 'Y'] as const) {
    const [b0, b1] = b.ends(b.NAMED[n]);
    samePhysical(b0, b.startState(want[n][0]));
    samePhysical(b1, b.startState(want[n][1]));
    assert.equal(b.named(b.NAMED[n]), n);
  }
});

test('named(): Z at tilt 0 for any turn, X and Y only at their exact axes', () => {
  for (const turn of [0, 45, 359]) assert.equal(b.named({ tilt: 0, turn }), 'Z');
  assert.equal(b.named({ tilt: 90, turn: 0 }), 'X');
  assert.equal(b.named({ tilt: 90, turn: 90 }), 'Y');
  for (const a of [{ tilt: 180, turn: 0 }, { tilt: 90, turn: 180 }, { tilt: 90, turn: 270 }, { tilt: 89, turn: 0 }, { tilt: 30, turn: 0 }]) assert.equal(b.named(a), null);
  assert.deepEqual(b.outcomes(b.NAMED.Z), ['|0⟩', '|1⟩']);
  assert.deepEqual(b.outcomes(b.NAMED.X), ['|+⟩', '|−⟩']);
  assert.deepEqual(b.outcomes(b.NAMED.Y), ['|+i⟩', '|−i⟩']);
  assert.deepEqual(b.outcomes({ tilt: 30, turn: 45 }), ['b₀', 'b₁']);
});

test('at tilt 0 the turn changes nothing: same odds as the Z basis', () => {
  for (const s of STATES) for (const turn of [0, 45, 200]) {
    const p = b.odds(s, { tilt: 0, turn }), z = q.probs(s);
    close(p[0], z[0]); close(p[1], z[1]);
  }
});

// ---- Born rule in any basis

test('Born rule: odds are |<b_k|psi>|^2, add to 1, and match (1 + r·n)/2 = cos²(angle/2)', () => {
  for (const s of STATES) for (const a of AXES) {
    const [p0, p1] = b.odds(s, a), [b0, b1] = b.ends(a);
    close(p0 + p1, 1);
    assert.ok(p0 >= 0 && p0 <= 1 && p1 >= 0 && p1 <= 1);
    close(p0, q.abs2(q.inner(b0, s)), 1e-12); close(p1, q.abs2(q.inner(b1, s)), 1e-12);
    const f = b.oddsFromBloch(s, a);
    close(p0, f[0], 1e-12); close(p1, f[1], 1e-12);
    close(p0, Math.cos((b.angle(s, a) * RAD) / 2) ** 2, 1e-9);
  }
});

test('the same state gives different odds in different bases: each preset is certain in its own basis, 50/50 in the other two', () => {
  const own: Record<b.StateId, [b.BasisName, 0 | 1]> = { '0': ['Z', 0], '1': ['Z', 1], '+': ['X', 0], '-': ['X', 1], '+i': ['Y', 0], '-i': ['Y', 1] };
  for (const id of b.STATE_IDS) for (const n of ['Z', 'X', 'Y'] as const) {
    const p = b.odds(b.startState(id), b.NAMED[n]);
    if (n === own[id][0]) assert.deepEqual(p, own[id][1] === 0 ? [1, 0] : [0, 1], `${id} in ${n}`);
    else { close(p[0], 0.5); close(p[1], 0.5); }
  }
});

test('|+> and |-> look the same in Z (50/50) but X tells them apart every time', () => {
  const zp = b.odds(q.plus(), b.NAMED.Z), zm = b.odds(q.minus(), b.NAMED.Z);
  close(zp[0], zm[0]); close(zp[0], 0.5);
  assert.deepEqual(b.odds(q.plus(), b.NAMED.X), [1, 0]);
  assert.deepEqual(b.odds(q.minus(), b.NAMED.X), [0, 1]);
});

test('a global phase changes no odds in any basis', () => {
  for (const s of STATES) for (const g of [0.3, Math.PI / 2, Math.PI, 5]) {
    const t = s.map((x) => q.mul(q.expi(g), x));
    for (const a of AXES) { const p = b.odds(s, a), r = b.odds(t, a); close(p[0], r[0]); close(p[1], r[1]); }
  }
});

test('flipping the axis end for end swaps the two odds', () => {
  for (const s of STATES) for (const a of AXES) {
    const p = b.odds(s, a), r = b.odds(s, { tilt: 180 - a.tilt, turn: (a.turn + 180) % 360 });
    close(p[0], r[1]); close(p[1], r[0]);
  }
});

test('turning the state and the axis together around Z changes nothing', () => {
  for (const s of STATES) for (const a of AXES) for (const d of [30, 90, 250]) {
    const t = q.matVec(q.RZ(d * RAD), s), p = b.odds(s, a), r = b.odds(t, { tilt: a.tilt, turn: a.turn + d });
    close(p[0], r[0], 1e-12);
  }
});

test('after a measurement the qubit is the basis state it gave, so the same basis repeats the result', () => {
  for (const a of AXES) {
    const [b0, b1] = b.ends(a);
    assert.deepEqual(b.odds(b0, a), [1, 0]);
    assert.deepEqual(b.odds(b1, a), [0, 1]);
  }
});

test('angle(): 0 at its own end, 180 at the other, 90 across; never outside 0 to 180', () => {
  close(b.angle(q.ket0(), b.NAMED.Z), 0);
  close(b.angle(q.ket1(), b.NAMED.Z), 180);
  close(b.angle(q.ket0(), b.NAMED.X), 90);
  close(b.angle(b.startState('+i'), b.NAMED.X), 90);
  for (const s of STATES) for (const a of AXES) { const g = b.angle(s, a); assert.ok(g >= 0 && g <= 180); }
  for (const tilt of [0, 30, 60, 90, 120, 180]) close(b.angle(q.ket0(), { tilt, turn: 0 }), tilt, 1e-9);
});

// ---- How a circuit does it

test('recipe: U is unitary and sends b0 to |0> and b1 to |1> (up to phase)', () => {
  for (const a of AXES) {
    const { U } = b.recipe(a), [b0, b1] = b.ends(a), UU = q.matMul(q.dagger(U), U);
    UU.forEach((row, i) => row.forEach((x, j) => { close(x.re, i === j ? 1 : 0); close(x.im, 0); }));
    close(q.probs(q.matVec(U, b0))[0], 1);
    close(q.probs(q.matVec(U, b1))[1], 1);
  }
});

test('recipe: gate, then a standard measurement, gives the same odds as measuring in the basis', () => {
  for (const s of STATES) for (const a of AXES) {
    const z = q.probs(q.matVec(b.recipe(a).U, s)), p = b.odds(s, a);
    close(z[0], p[0], 1e-12); close(z[1], p[1], 1e-12);
  }
});

test('recipe: X uses H = |0><+| + |1><-|; Y uses S† then H, and H S† = |0><+i| + |1><-i| exactly', () => {
  const outer = (k: q.State, u: q.State): q.Matrix => k.map((x) => u.map((y) => q.mul(x, q.conj(y))));
  const sum = (m: q.Matrix, n: q.Matrix): q.Matrix => m.map((row, i) => row.map((x, j) => q.add(x, n[i][j])));
  const eq = (m: q.Matrix, n: q.Matrix) => m.forEach((row, i) => row.forEach((x, j) => { close(x.re, n[i][j].re); close(x.im, n[i][j].im); }));
  const x = b.recipe(b.NAMED.X), y = b.recipe(b.NAMED.Y), z = b.recipe(b.NAMED.Z);
  assert.deepEqual(x.gates, ['H']); assert.deepEqual(y.gates, ['S†', 'H']); assert.deepEqual(z.gates, []);
  eq(x.U, sum(outer(q.ket0(), q.plus()), outer(q.ket1(), q.minus())));
  eq(y.U, sum(outer(q.ket0(), b.startState('+i')), outer(q.ket1(), b.startState('-i'))));
  eq(y.U, q.matMul(q.H, q.dagger(q.S)));
});

test('recipe: U† after the Z result leaves the qubit in |b_k> (U†|k> = |b_k> up to phase)', () => {
  for (const a of AXES) {
    const Ud = q.dagger(b.recipe(a).U), [b0, b1] = b.ends(a);
    samePhysical(q.matVec(Ud, q.ket0()), b0);
    samePhysical(q.matVec(Ud, q.ket1()), b1);
  }
});

test('recipe text: names the gates in time order and what each result means', () => {
  assert.equal(b.recipeText(b.NAMED.Z), 'In a circuit this is the standard measurement: it reads 0 or 1 directly.');
  assert.equal(b.recipeText(b.NAMED.X), 'In a circuit: H, then the standard 0 or 1 measurement. Result 0 means |+⟩, 1 means |−⟩.');
  assert.equal(b.recipeText(b.NAMED.Y), 'In a circuit: S†, then H, then the standard 0 or 1 measurement. Result 0 means |+i⟩, 1 means |−i⟩.');
  assert.equal(b.recipeText({ tilt: 30, turn: 45 }), 'In a circuit: RZ(−45°), then RY(−30°), then the standard 0 or 1 measurement. Result 0 means b₀, 1 means b₁.');
  assert.equal(b.recipeText({ tilt: 30, turn: 0 }), 'In a circuit: RY(−30°), then the standard 0 or 1 measurement. Result 0 means b₀, 1 means b₁.');
});

// ---- Shots

test('shots: right length, only 0 or 1, same seed same shots', () => {
  const p = b.odds(q.ket0(), b.NAMED.X);
  const x = b.shoot(p, b.BATCH, q.rng(4)), y = b.shoot(p, b.BATCH, q.rng(4));
  assert.equal(x.length, b.BATCH);
  assert.ok(x.every((r) => r === 0 || r === 1));
  assert.deepEqual(x, y);
});

test('shots follow the Born rule (within 5 sigma), and certain outcomes never miss', () => {
  const n = 100000;
  const cases: [q.State, b.Axis][] = [[q.ket0(), b.NAMED.X], [q.ket0(), { tilt: 60, turn: 0 }], [b.startState('+i'), { tilt: 37, turn: 211 }], [q.fromBloch(2.5, -2), { tilt: 120, turn: 300 }]];
  cases.forEach(([s, a], k) => {
    const p = b.odds(s, a), zeros = b.shoot(p, n, q.rng(10 + k)).filter((r) => r === 0).length;
    assert.ok(Math.abs(zeros / n - p[0]) < 5 * Math.sqrt((p[0] * p[1]) / n), `case ${k}: ${zeros / n} vs ${p[0]}`);
  });
  for (const id of b.STATE_IDS) for (const n2 of ['Z', 'X', 'Y'] as const) {
    const p = b.odds(b.startState(id), b.NAMED[n2]);
    if (p[0] === 1) assert.ok(b.shoot(p, 2000, q.rng(3)).every((r) => r === 0));
    if (p[1] === 1) assert.ok(b.shoot(p, 2000, q.rng(3)).every((r) => r === 1));
  }
});

test('the cap: piles hold every shot, and room() never passes the cap', () => {
  assert.equal(b.CAP, b.COLS * b.ROWS);
  assert.equal(b.CAP % b.BATCH, 0);
  assert.equal(b.room(0, b.BATCH), b.BATCH);
  assert.equal(b.room(b.CAP - 30, b.BATCH), 30);
  assert.equal(b.room(b.CAP, 1), 0);
  for (let t = 0; t <= b.CAP; t += 7) assert.ok(t + b.room(t, b.BATCH) <= b.CAP);
  close(b.expected(200, 0.25), 50);
});

// ---- Text the tool shows

test('odds text: adds to 100, never a false 0% or 100%', () => {
  assert.deepEqual(b.oddsText(1), ['100%', '0%']);
  assert.deepEqual(b.oddsText(0), ['0%', '100%']);
  assert.deepEqual(b.oddsText(0.5), ['50%', '50%']);
  assert.deepEqual(b.oddsText(1 - 1e-16), ['100%', '0%']);
  assert.deepEqual(b.oddsText(0.995), ['over 99%', 'under 1%']);
  assert.deepEqual(b.oddsText(0.004), ['under 1%', 'over 99%']);
  assert.deepEqual(b.oddsText(0.125), ['13%', '87%']);
  for (let k = 1; k < 10000; k++) {
    const [x, y] = b.oddsText(k / 10000);
    for (const t of [x, y]) { assert.notEqual(t, '0%'); assert.notEqual(t, '100%'); }
    if (/^\d+%$/.test(x)) assert.equal(parseInt(x) + parseInt(y), 100);
  }
});

test('degrees text: whole numbers plain, others "about"', () => {
  assert.equal(b.degText(90), '90°');
  assert.equal(b.degText(90 + 1e-9), '90°');
  assert.equal(b.degText(54.7356), 'about 55°');
});

test('readout: known values, in words', () => {
  assert.equal(b.describe('0', b.NAMED.Z, [0, 0]),
    'Started as |0⟩, measured in the Z basis: |0⟩ or |1⟩. Odds: 100% |0⟩, 0% |1⟩. The state is 0° from |0⟩ on the Bloch sphere. Press a Measure button to test fresh copies.');
  assert.equal(b.describe('0', b.NAMED.X, [47, 53]),
    'Started as |0⟩, measured in the X basis: |+⟩ or |−⟩. Odds: 50% |+⟩, 50% |−⟩. The state is 90° from |+⟩ on the Bloch sphere. Of 100 fresh copies, 47 gave |+⟩ and 53 gave |−⟩.');
  assert.equal(b.describe('-i', b.NAMED.Y, [0, 1]),
    'Started as |−i⟩, measured in the Y basis: |+i⟩ or |−i⟩. Odds: 0% |+i⟩, 100% |−i⟩. The state is 180° from |+i⟩ on the Bloch sphere. 1 fresh copy gave |−i⟩.');
  assert.equal(b.describe('0', { tilt: 60, turn: 0 }, [370, 130]),
    'Started as |0⟩, measured along your own axis (tilt 60°, turn 0°): b₀ or b₁. Odds: 75% b₀, 25% b₁. The state is 60° from b₀ on the Bloch sphere. Of 500 fresh copies, 370 gave b₀ and 130 gave b₁. The piles are full.');
  for (const id of b.STATE_IDS) for (const a of AXES.slice(0, 40)) {
    assert.doesNotMatch(b.describe(id, a, [3, 4]), /square the amplitude|both at once|watch|mix/i);
  }
});

// ---- Drawing math

test('view() is a rotation: keeps lengths and angles, +z is up, +y is right, +x comes toward the viewer', () => {
  const vs: b.Vec3[] = [[1, 0, 0], [0, 1, 0], [0, 0, 1], [0.3, -0.5, 0.81], [-0.7, 0.1, 0.2]];
  for (const v of vs) close(Math.hypot(...b.view(v)), Math.hypot(...v));
  const dot = (u: b.Vec3, w: b.Vec3) => u[0] * w[0] + u[1] * w[1] + u[2] * w[2];
  for (const u of vs) for (const w of vs) close(dot(b.view(u), b.view(w)), dot(u, w));
  const [x, y, z] = [b.view([1, 0, 0]), b.view([0, 1, 0]), b.view([0, 0, 1])];
  close(z[0], 0); assert.ok(z[1] > 0.9);
  assert.ok(y[0] > 0.9);
  assert.ok(x[2] > 0.8 && x[0] < 0);
  // Right-handed: x cross y = z also on screen, so the picture is not a mirror image.
  const cross = (u: b.Vec3, w: b.Vec3): b.Vec3 => [u[1] * w[2] - u[2] * w[1], u[2] * w[0] - u[0] * w[2], u[0] * w[1] - u[1] * w[0]];
  cross(x, y).forEach((v, i) => close(v, z[i]));
});

test('arc(): unit points from u to w, evenly spaced, and empty when there is no single arc', () => {
  const u: b.Vec3 = [0, 0, 1], w: b.Vec3 = [1, 0, 0], pts = b.arc(u, w, 10);
  assert.equal(pts.length, 11);
  pts.forEach((p) => close(Math.hypot(...p), 1));
  pts[0].forEach((x, i) => close(x, u[i])); pts[10].forEach((x, i) => close(x, w[i]));
  for (let i = 0; i < 10; i++) close(Math.acos(pts[i][0] * pts[i + 1][0] + pts[i][1] * pts[i + 1][1] + pts[i][2] * pts[i + 1][2]), Math.PI / 20);
  assert.deepEqual(b.arc(u, u, 10), []);
  assert.deepEqual(b.arc(u, [0, 0, -1], 10), []);
});

// ---- Claims in the stop text

test('Text: |0> = (|+> + |->)/√2, so each X amplitude is 1/√2 and each chance is 1/2', () => {
  const s = q.ket0();
  close(q.inner(q.plus(), s).re, Math.SQRT1_2); close(q.inner(q.minus(), s).re, Math.SQRT1_2);
  close(q.abs2(q.c(Math.SQRT1_2)), 0.5);
});

test('Text: cos²(a/2) is 100% at 0°, 75% at 60°, 50% at 90°, 0% at 180°', () => {
  for (const [a, p] of [[0, 1], [60, 0.75], [90, 0.5], [180, 0]]) {
    close(Math.cos((a * RAD) / 2) ** 2, p);
    close(b.odds(q.ket0(), { tilt: a, turn: 0 })[0], p);
  }
});

test('Text (Vazirani 0.7.1): (|0> + e^{iθ}|1>)/√2 in the X basis gives |+> with chance cos²(θ/2)', () => {
  for (const t of [0, 0.4, Math.PI / 2, 2, Math.PI]) {
    const s: q.State = [q.c(Math.SQRT1_2), q.scale(q.expi(t), Math.SQRT1_2)];
    close(b.odds(s, b.NAMED.X)[0], Math.cos(t / 2) ** 2);
  }
});

test('Text (MS Katas): 0.6|0> + 0.8|1> gives 98% |+> in X and 50/50 in Y', () => {
  const s: q.State = [q.c(0.6), q.c(0.8)];
  close(b.odds(s, b.NAMED.X)[0], 0.98);
  close(b.odds(s, b.NAMED.Y)[0], 0.5);
  close(b.odds(s, b.NAMED.Z)[0], 0.36);
});

test('Text: a Z result alone cannot tell |0> from |+>: both can give 0', () => {
  assert.ok(b.odds(q.ket0(), b.NAMED.Z)[0] > 0);
  assert.ok(b.odds(q.plus(), b.NAMED.Z)[0] > 0);
});

test('Text: measure |0> in X, then in Z: the Z result is now 50/50', () => {
  for (const k of [0, 1] as const) {
    const after = b.ends(b.NAMED.X)[k];
    const p = b.odds(after, b.NAMED.Z);
    close(p[0], 0.5); close(p[1], 0.5);
  }
});
