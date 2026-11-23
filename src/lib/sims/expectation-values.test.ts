import test from 'node:test';
import assert from 'node:assert/strict';
import * as q from '../quantum.ts';
import * as ev from './expectation-values.ts';

const close = (a: number, b: number, eps = 1e-12) => assert.ok(Math.abs(a - b) < eps, `${a} != ${b}`);
const RAD = Math.PI / 180;
const OBS = ev.OBSERVABLES;
/** |<u|v>| = 1: the same state up to a global phase. */
const samePhysical = (u: q.State, v: q.State) => close(q.abs(q.inner(u, v)), 1);
const addM = (a: q.Matrix, b: q.Matrix, x = 1, y = 1): q.Matrix => a.map((row, i) => row.map((z, j) => q.add(q.scale(z, x), q.scale(b[i][j], y))));
const outer = (u: q.State, v: q.State): q.Matrix => u.map((a) => v.map((b) => q.mul(a, q.conj(b))));
/** n·σ for a unit axis n. */
const nSigma = (n: number[]): q.Matrix => addM(addM(q.X, q.Y, n[0], n[1]), q.Z, 1, n[2]);

// Test states beyond the tool's circle: complex amplitudes, any Bloch point, and one with a global phase.
const GENERAL: q.State[] = [
  ...ev.ANGLES.map(ev.prepare),
  q.fromBloch(1.1, 0.4), q.fromBloch(2.5, -2), q.fromBloch(0.3, 3), [q.c(1 / 3, 2 / 3), q.c(-2 / 3)],
  q.fromBloch(1.7, 1).map((a) => q.mul(q.expi(0.9), a)),
];

// ---- The state

test('the slider reaches every multiple of 15 degrees from -180 to 180, and the presets are among them', () => {
  assert.equal(ev.ANGLES.length, 25);
  assert.deepEqual([ev.ANGLES[0], ev.ANGLES.at(-1)], [ev.MIN_DEG, ev.MAX_DEG]);
  ev.ANGLES.forEach((d, i) => { if (i) assert.equal(d - ev.ANGLES[i - 1], ev.STEP); });
  for (const [d] of ev.PRESETS) assert.ok(ev.ANGLES.includes(d));
});

test('started as 0, then RY(θ): cos(θ/2)|0> + sin(θ/2)|1>, a unit vector with real amplitudes', () => {
  for (const d of ev.ANGLES) {
    const s = ev.prepare(d), t = d * RAD;
    close(q.norm2(s), 1);
    close(s[0].re, Math.cos(t / 2)); close(s[1].re, Math.sin(t / 2));
    close(s[0].im, 0); close(s[1].im, 0);
  }
});

test('the tool reaches one great circle: Bloch vector (sin θ, 0, cos θ)', () => {
  for (const d of ev.ANGLES) {
    const [x, y, z] = q.bloch(ev.prepare(d)), t = d * RAD;
    close(x, Math.sin(t)); close(y, 0); close(z, Math.cos(t));
  }
});

test('presets give |0>, |+>, |1>, |-> exactly; RY(-180°) gives -|1>, the same state as |1> up to a global phase', () => {
  const want: Record<number, q.State> = { 0: q.ket0(), 90: q.plus(), 180: q.ket1(), [-90]: q.minus() };
  for (const [d, name] of ev.PRESETS) {
    ev.prepare(d).forEach((a, i) => { close(a.re, want[d][i].re); close(a.im, 0); });
    assert.equal(ev.stateName(d), name);
  }
  const m = ev.prepare(-180);
  close(m[0].re, 0); close(m[1].re, -1);
  samePhysical(m, ev.prepare(180));
  assert.equal(ev.stateName(-180), '−|1⟩');
  assert.equal(ev.stateName(60), null);
});

// ---- The observables

test('Z and X are Hermitian, square to I, and have eigenvalues +1 and -1 with orthonormal eigenvectors', () => {
  for (const o of OBS) {
    const A = ev.MATRIX[o], AA = q.matMul(A, A), Ad = q.dagger(A);
    A.forEach((row, i) => row.forEach((z, j) => { close(z.re, Ad[i][j].re); close(z.im, Ad[i][j].im); close(AA[i][j].re, i === j ? 1 : 0); close(AA[i][j].im, 0); }));
    const [a, b] = ev.eigen(o);
    assert.deepEqual([a.value, b.value], [1, -1]);
    for (const e of [a, b]) {
      close(q.norm2(e.state), 1);
      q.matVec(A, e.state).forEach((z, i) => { close(z.re, e.value * e.state[i].re); close(z.im, e.value * e.state[i].im); });
    }
    close(q.abs(q.inner(a.state, b.state)), 0);
  }
});

test('spectral form: A = Σ a_k |a_k><a_k|', () => {
  for (const o of OBS) {
    const [a, b] = ev.eigen(o), sum = addM(outer(a.state, a.state), outer(b.state, b.state), a.value, b.value);
    sum.forEach((row, i) => row.forEach((z, j) => { close(z.re, ev.MATRIX[o][i][j].re); close(z.im, ev.MATRIX[o][i][j].im); }));
  }
});

// ---- Born rule and the expectation value

test('Born rule odds are never negative and add to 1, for every state and observable', () => {
  for (const s of GENERAL) for (const o of OBS) {
    const [p, m] = ev.odds(s, o);
    assert.ok(p >= 0 && m >= 0);
    close(p + m, 1);
  }
});

test('odds in closed form: Z gives cos²(θ/2) and sin²(θ/2); X gives (1 + sin θ)/2 and (1 - sin θ)/2', () => {
  for (const d of ev.ANGLES) {
    const s = ev.prepare(d), t = d * RAD;
    const [z0, z1] = ev.odds(s, 'Z'), [x0, x1] = ev.odds(s, 'X');
    close(z0, Math.cos(t / 2) ** 2); close(z1, Math.sin(t / 2) ** 2);
    close(x0, (1 + Math.sin(t)) / 2); close(x1, (1 - Math.sin(t)) / 2);
  }
});

test('<ψ|A|ψ> equals Σ a_k p_k and is real, for every state (Wilde 3.79 to 3.83)', () => {
  for (const s of GENERAL) for (const o of OBS) {
    const z = ev.sandwich(s, ev.MATRIX[o]), [a, b] = ev.eigen(o);
    close(z.im, 0);
    close(z.re, ev.weighted([a.value, b.value], ev.odds(s, o)));
    close(ev.expectation(s, o), z.re);
  }
});

test('<Z> = |α|² - |β|² for every state', () => {
  for (const s of GENERAL) close(ev.expectation(s, 'Z'), q.abs2(s[0]) - q.abs2(s[1]));
});

test('closed forms on the tool circle: <Z> = cos θ and <X> = sin θ', () => {
  for (const d of ev.ANGLES) {
    close(ev.expectation(ev.prepare(d), 'Z'), Math.cos(d * RAD));
    close(ev.expectation(ev.prepare(d), 'X'), Math.sin(d * RAD));
  }
});

test('known values: |0>, RY(60°), |+>, |1>, |->', () => {
  const table: [number, number, number][] = [[0, 1, 0], [60, 0.5, Math.sqrt(3) / 2], [90, 0, 1], [180, -1, 0], [-90, 0, -1], [-180, -1, 0]];
  for (const [d, z, x] of table) {
    close(ev.expectation(ev.prepare(d), 'Z'), z);
    close(ev.expectation(ev.prepare(d), 'X'), x);
  }
  // The student text: amplitudes √3/2 and 1/2, chances 3/4 and 1/4.
  const s = ev.prepare(60), [p, m] = ev.odds(s, 'Z');
  close(s[0].re, Math.sqrt(3) / 2); close(s[1].re, 0.5);
  close(p, 0.75); close(m, 0.25);
  close(ev.weighted([1, -1], [0.75, 0.25]), 0.5);
});

test('<n·σ> = n·r for a Bloch vector r and any axis n (the engineer text)', () => {
  const axes = [[0, 0, 1], [1, 0, 0], [0, 1, 0], [0.6, 0, 0.8], [1 / 3, 2 / 3, 2 / 3], [-0.48, 0.6, 0.64]];
  for (const s of GENERAL) {
    const r = q.bloch(s);
    for (const n of axes) close(ev.sandwich(s, nSigma(n)).re, n[0] * r[0] + n[1] * r[1] + n[2] * r[2]);
  }
});

test('a global phase changes no expectation value', () => {
  for (const s of GENERAL) for (const g of [0.3, 2, -1.4, Math.PI]) {
    const t = s.map((a) => q.mul(q.expi(g), a));
    for (const o of OBS) close(ev.expectation(t, o), ev.expectation(s, o));
  }
});

test('a projector gives a probability: <Π_k> = p_k', () => {
  for (const s of GENERAL) for (const o of OBS) {
    const [a, b] = ev.eigen(o), [p, m] = ev.odds(s, o);
    close(ev.sandwich(s, outer(a.state, a.state)).re, p);
    close(ev.sandwich(s, outer(b.state, b.state)).re, m);
  }
});

test('expectation values are linear: <αZ + βX> = α<Z> + β<X>', () => {
  for (const s of GENERAL) for (const [x, y] of [[1, 1], [0.5, -2], [-1.5, 0.25]]) {
    close(ev.sandwich(s, addM(q.Z, q.X, x, y)).re, x * ev.expectation(s, 'Z') + y * ev.expectation(s, 'X'));
  }
});

// ---- Spread

test('spread: (ΔA)² = <A²> - <A>² = 1 - <A>² = Σ (a_k - <A>)² p_k', () => {
  for (const s of GENERAL) for (const o of OBS) {
    const e = ev.expectation(s, o), sd = ev.spread(s, o), [p, m] = ev.odds(s, o);
    close(sd * sd, 1 - e * e, 1e-11);
    close(sd * sd, (1 - e) ** 2 * p + (-1 - e) ** 2 * m, 1e-11);
  }
});

test('spread is exactly zero for eigenstates, positive elsewhere, and 1 when <A> = 0', () => {
  const eigenstates: [number, ev.Obs][] = [[0, 'Z'], [180, 'Z'], [-180, 'Z'], [90, 'X'], [-90, 'X']];
  for (const d of ev.ANGLES) for (const o of OBS) {
    const s = ev.prepare(d), sd = ev.spread(s, o), e = ev.expectation(s, o);
    if (eigenstates.some(([a, b]) => a === d && b === o)) { assert.equal(sd, 0); assert.equal(Math.abs(e), 1); }
    else assert.ok(sd > 0.25, `${d} ${o}: ${sd}`);
    if (e === 0) assert.equal(sd, 1);
  }
});

// ---- Averages of shots

/** Exact law of the average of n independent ±1 shots with chance p of +1: value (2k - n)/n with binomial weight. */
function averageLaw(p: number, n: number): { value: number; weight: number }[] {
  const out: { value: number; weight: number }[] = [];
  let w = (1 - p) ** n;
  for (let k = 0; k <= n; k++) {
    out.push({ value: ev.average(k, n), weight: w });
    w = p === 1 ? (k === n - 1 ? 1 : 0) : (w * (n - k) * p) / ((k + 1) * (1 - p));
  }
  return out;
}

test('exact binomial law: the average of N shots has mean <A> and standard deviation ΔA/√N', () => {
  for (const d of [0, 15, 45, 60, 90, 135, -75, -180]) for (const o of OBS) for (const n of [1, 2, 5, 10, 37, 100]) {
    const s = ev.prepare(d), [p] = ev.odds(s, o), e = ev.expectation(s, o), sd = ev.spread(s, o);
    const law = averageLaw(p, n);
    const total = law.reduce((t, x) => t + x.weight, 0);
    const mean = law.reduce((t, x) => t + x.weight * x.value, 0);
    const second = law.reduce((t, x) => t + x.weight * x.value ** 2, 0);
    close(total, 1, 1e-10);
    close(mean, e, 1e-10);
    close(Math.sqrt(Math.max(0, second - mean * mean)), ev.miss(sd, n), 1e-7);
  }
});

test('the spread of the average shrinks like 1/√N: 4 times the shots halve it, 100 times shrink it 10 times', () => {
  const sd = ev.spread(ev.prepare(60), 'Z');
  close(sd, Math.sqrt(3) / 2);
  close(ev.miss(sd, 400), ev.miss(sd, 100) / 2);
  close(ev.miss(sd, 10000), ev.miss(sd, 100) / 10);
  // The student text: about 0.09 after 100 shots and 0.009 after 10,000.
  assert.equal(ev.miss(sd, 100).toFixed(2), '0.09');
  assert.equal(ev.miss(sd, 10000).toFixed(3), '0.009');
});

test('average of shots: all +1 gives 1, all -1 gives -1, half and half gives 0', () => {
  assert.equal(ev.average(10, 10), 1);
  assert.equal(ev.average(0, 10), -1);
  assert.equal(ev.average(5, 10), 0);
  assert.equal(ev.average(77, 100), 0.54);
});

test('running averages: entry i is the mean of the first i + 1 shots, and the last matches the tally', () => {
  const shots: ev.Result[] = [1, -1, -1, 1, 1, 1, -1, 1];
  const run = ev.runningAverages(shots);
  run.forEach((a, i) => close(a, shots.slice(0, i + 1).reduce((t, r) => t + r, 0) / (i + 1)));
  const t = ev.tally(shots);
  assert.deepEqual(t, { n: 8, plus: 5 });
  close(run.at(-1)!, ev.average(t.plus, t.n));
});

test('shots follow the Born rule draw: a uniform number below p(+1) gives +1', () => {
  const seq = (xs: number[]) => { let i = 0; return () => xs[i++]; };
  assert.deepEqual(ev.shoot([0.75, 0.25], 4, seq([0, 0.7499, 0.75, 0.99])), [1, 1, -1, -1]);
  assert.deepEqual(ev.shoot([1, 0], 3, seq([0, 0.5, 0.999999])), [1, 1, 1]);
  assert.deepEqual(ev.shoot([0, 1], 3, seq([0, 0.5, 0.999999])), [-1, -1, -1]);
});

test('seeded runs of 1,000 shots land within 5 standard deviations of <A>, for every angle and observable', () => {
  const rand = q.rng(2026);
  for (const d of ev.ANGLES) for (const o of OBS) {
    const s = ev.prepare(d), shots = ev.shoot(ev.odds(s, o), ev.CAP, rand), t = ev.tally(shots);
    const e = ev.expectation(s, o), sd = ev.spread(s, o), avg = ev.average(t.plus, t.n);
    assert.ok(Math.abs(avg - e) <= 5 * ev.miss(sd, t.n) + 1e-12, `${d} ${o}: ${avg} vs ${e}`);
    if (sd === 0) assert.equal(avg, e);
  }
});

test('room never lets a run pass the cap', () => {
  assert.equal(ev.room(0, ev.BATCH), ev.BATCH);
  assert.equal(ev.room(950, ev.BATCH), 50);
  assert.equal(ev.room(ev.CAP, 1), 0);
  assert.equal(ev.CAP % ev.BATCH, 0);
});

// ---- Picture layout

test('the shot axis is the smallest nice length that holds every shot', () => {
  for (let n = 1; n <= ev.CAP; n++) {
    const m = ev.axisMax(n);
    assert.ok(m >= n);
    assert.ok(ev.AXES.indexOf(m) === 0 || ev.AXES[ev.AXES.indexOf(m) - 1] < n);
  }
  assert.equal(ev.axisMax(1), 10);
  assert.equal(ev.axisMax(ev.CAP), ev.CAP);
});

test('a pile grid always holds the bigger pile, up to the cap', () => {
  for (let k = 0; k <= ev.CAP; k++) { const [w, h] = ev.grid(k); assert.ok(w * h >= k); }
  assert.deepEqual(ev.grid(1), [5, 5]);
});

test('the band is <A> ± ΔA/√N, clipped to [-1, 1], and narrows as N grows', () => {
  for (const d of ev.ANGLES) for (const o of OBS) {
    const s = ev.prepare(d), e = ev.expectation(s, o), sd = ev.spread(s, o);
    let width = Infinity;
    for (const n of [1, 2, 10, 100, 1000]) {
      const [lo, hi] = ev.band(e, sd, n);
      assert.ok(lo >= -1 && hi <= 1 && lo <= e && e <= hi);
      if (lo > -1 && hi < 1) close(hi - lo, 2 * ev.miss(sd, n));
      assert.ok(hi - lo <= width);
      width = hi - lo;
    }
  }
});

// ---- Words

test('numbers use a true minus sign, drop trailing zeros, and never show −0', () => {
  assert.equal(ev.num(-0.5, 2), '−0.5');
  assert.equal(ev.num(0.750, 3), '0.75');
  assert.equal(ev.num(-0.001, 2), '0');
  assert.equal(ev.num(1, 3), '1');
  assert.equal(ev.degText(-90), '−90°');
  assert.equal(ev.count(1000), '1,000');
});

/** The numbers in a sum line: [first relation, P, Q, second relation, E]. */
const parseSum = (t: string) => {
  const m = t.match(/^⟨[ZX]⟩ ([=≈]) \(\+1\)\(([\d.]+)\) \+ \(−1\)\(([\d.]+)\) ([=≈]) (−?[\d.]+)$/);
  assert.ok(m, t);
  return { rel1: m[1], P: +m[2], Q: +m[3], rel2: m[4], E: +m[5].replace('−', '-') };
};

test('the shown sum is honest at every angle: odds add to 1, never a false 0 or 1, and "=" only when exact', () => {
  for (const d of ev.ANGLES) for (const o of OBS) {
    const s = ev.prepare(d), [p, m] = ev.odds(s, o), e = ev.expectation(s, o);
    const { rel1, P, Q, rel2, E } = parseSum(ev.sumText(d, o));
    close(P + Q, 1);
    assert.equal(P, Number(p.toFixed(3))); assert.equal(Q, Number(m.toFixed(3)));
    assert.equal(E, Number(e.toFixed(2)), `${d} ${o}: shown ${E}, exact ${e}`);
    if (p > 0) assert.ok(P > 0); if (p < 1) assert.ok(P < 1);
    if (m > 0) assert.ok(Q > 0); if (m < 1) assert.ok(Q < 1);
    if (Math.abs(e) < 1) assert.ok(Math.abs(E) < 1); if (e !== 0) assert.ok(E !== 0);
    if (rel1 === '=') { close(P, p); close(Q, m); }
    if (rel2 === '=') { close(P - Q, E); close(E, e); }
    else assert.ok(Math.abs(P - Q - E) <= 0.005 + 1e-12);
  }
  assert.equal(ev.sumText(60, 'Z'), '⟨Z⟩ = (+1)(0.75) + (−1)(0.25) = 0.5');
  assert.equal(ev.sumText(-90, 'X'), '⟨X⟩ = (+1)(0) + (−1)(1) = −1');
});

test('the ket shows the amplitudes, with "=" only when both are exact', () => {
  assert.equal(ev.ketText(0), '|ψ⟩ = |0⟩');
  assert.equal(ev.ketText(180), '|ψ⟩ = |1⟩');
  assert.equal(ev.ketText(-180), '|ψ⟩ = −|1⟩');
  assert.equal(ev.ketText(60), '|ψ⟩ ≈ 0.866|0⟩ + 0.5|1⟩');
  assert.equal(ev.ketText(-90), '|ψ⟩ ≈ 0.707|0⟩ − 0.707|1⟩');
  for (const d of ev.ANGLES) {
    const [a, b] = ev.prepare(d).map((z) => z.re), t = ev.ketText(d);
    if (Math.abs(a) > 1e-12 && Math.abs(a) < 1 - 1e-12) assert.ok(t.includes(Math.abs(a).toFixed(3).replace(/0+$/, '')), t);
    if (Math.abs(b) > 1e-12 && Math.abs(b) < 1 - 1e-12) assert.ok(t.includes(Math.abs(b).toFixed(3).replace(/0+$/, '')), t);
    assert.ok(!/\b0\|/.test(t.replace('|ψ⟩', '')), t);
  }
});

test('every readout names the start state and the observable, and states only true facts', () => {
  const shapes = [{ n: 0, plus: 0 }, { n: 1, plus: 1 }, { n: 1, plus: 0 }, { n: 100, plus: 77 }, { n: 7, plus: 6 }, { n: ev.CAP, plus: 500 }];
  for (const d of ev.ANGLES) for (const o of OBS) {
    const s = ev.prepare(d), e = ev.expectation(s, o), sd = ev.spread(s, o);
    for (const t0 of shapes) {
      // Eigenstates give one result only, so give them only possible tallies.
      const t = sd === 0 ? { n: t0.n, plus: e === 1 ? t0.n : 0 } : t0;
      const text = ev.describe(d, o, t);
      assert.ok(text.startsWith(`Started as 0, then RY(${ev.degText(d)})`), text);
      assert.ok(text.includes(`Measuring ${o}:`));
      assert.ok(!/NaN|undefined|−0(?![.\d])|Infinity/.test(text), text);
      if (t.n === 0) assert.ok(text.includes('Press Run'));
      if (t.n === 1) assert.ok(text.includes(sd === 0 ? 'eigenstate' : `never ⟨${o}⟩ itself`), text);
      if (t.n >= 2 && sd > 0) {
        const inside = Math.abs(ev.average(t.plus, t.n) - e) <= ev.miss(sd, t.n);
        assert.ok(text.includes(inside ? 'This one is inside the band.' : 'This one is outside the band. That is normal: about 1 in 3 averages land outside.'), text);
        if (inside) assert.ok(!text.includes('That is normal'), text);
      }
      if (t.n >= 2 && sd === 0) assert.ok(text.includes('exactly'), text);
      assert.equal(text.includes('The run is full'), t.n >= ev.CAP);
    }
  }
  assert.equal(ev.describe(60, 'Z', { n: 100, plus: 77 }),
    'Started as 0, then RY(60°). Measuring Z: +1 (result 0) has chance 0.75 and −1 (result 1) has chance 0.25, so ⟨Z⟩ is 0.5. 100 shots: 77 gave +1 and 23 gave −1, so their average is 0.54. Averages of 100 shots spread about 0.087 around ⟨Z⟩ (one standard deviation, the shaded band). This one is inside the band.');
  assert.ok(ev.describe(90, 'Z', { n: 0, plus: 0 }).startsWith('Started as 0, then RY(90°), which gives |+⟩.'));
});

test('the slider value names the state and its exact average', () => {
  assert.equal(ev.sliderText(60, 'Z'), '60 degrees. Exact average of Z: 0.5');
  assert.equal(ev.sliderText(-90, 'X'), '−90 degrees, gives |−⟩. Exact average of X: −1');
  assert.equal(ev.sliderText(45, 'X'), '45 degrees. Exact average of X: about 0.71');
});

test('display glue changes only spaces into no-break joins, so the text reads the same', () => {
  for (const d of ev.ANGLES) for (const o of OBS) for (const t of [ev.sumText(d, o), ev.ketText(d)]) {
    const k = ev.keepTerms(t);
    assert.equal(k.replace(/\u00a0/g, ' ').replace(/\u2060/g, ''), t);
    assert.ok(!/[+−≈=] /.test(k.replace(/^\S+ /, '')), k);
  }
});

test('an average outside the band is called normal, with the 1 in 3 rate', () => {
  // Started as 0, then RY(60°), measuring Z: 100 shots with 90 giving +1 average 0.8, far outside 0.5 ± 0.087.
  assert.equal(ev.describe(60, 'Z', { n: 100, plus: 90 }),
    'Started as 0, then RY(60°). Measuring Z: +1 (result 0) has chance 0.75 and −1 (result 1) has chance 0.25, so ⟨Z⟩ is 0.5. 100 shots: 90 gave +1 and 10 gave −1, so their average is 0.8. Averages of 100 shots spread about 0.087 around ⟨Z⟩ (one standard deviation, the shaded band). This one is outside the band. That is normal: about 1 in 3 averages land outside.');
});
