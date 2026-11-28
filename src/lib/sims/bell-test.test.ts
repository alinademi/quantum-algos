import test from 'node:test';
import assert from 'node:assert/strict';
import * as q from '../quantum.ts';
import * as bt from './bell-test.ts';

const close = (a: number, b: number, eps = 1e-12) => assert.ok(Math.abs(a - b) < eps, `${a} != ${b}`);
const closeAll = (a: number[], b: number[], eps = 1e-12) => { assert.equal(a.length, b.length); a.forEach((x, i) => close(x, b[i], eps)); };
const sum = (xs: number[]) => xs.reduce((t, x) => t + x, 0);
const RAD = Math.PI / 180;
const S2 = Math.SQRT1_2;
const angles = [0, 10, 22.5, -22.5, 30, 45, 60, 67.5, 90, -90, 112.5, 135, 180, 251, -37.5];
const bits = [0, 1] as const;

/** Seeded random dials, in the slider range -90 to 90. */
function randomDials(n: number, seed: number): bt.Dials[] {
  const R = q.rng(seed), t = () => R() * 180 - 90;
  return Array.from({ length: n }, () => ({ a: [t(), t()], b: [t(), t()] }));
}
const models = ['quantum', 'hidden'] as const;

test('the CHSH rule: same answers win, except both asked 1, where different answers win (Watrous table)', () => {
  for (const x of bits) for (const y of bits) for (const a of bits) for (const b of bits) {
    const want = x === 1 && y === 1 ? a !== b : a === b;
    assert.equal(bt.wins(x, y, a, b), want);
  }
});

test('every fixed plan wins 3 or 1 of the 4 question pairs, never 4: classical best is 3/4', () => {
  assert.equal(bt.PLANS.length, 16);
  assert.equal(new Set(bt.PLANS.map((p) => p.a.join('') + p.b.join(''))).size, 16);
  const counts = bt.PLANS.map(bt.planWins);
  // Adding the four rules a_x + b_y = x AND y (mod 2) gives 0 = 1, so an odd number of them fail.
  for (const k of counts) assert.ok(k === 1 || k === 3);
  assert.equal(counts.filter((k) => k === 3).length, 8);
  assert.equal(Math.max(...counts) / 4, bt.CLASSICAL_MAX);
  assert.equal(bt.planWins({ a: [0, 0], b: [0, 0] }), 3); // "always say 0" loses only (1, 1)
});

test('a shared random choice of plans averages them, so it never beats 3/4', () => {
  const R = q.rng(4);
  for (let k = 0; k < 100; k++) {
    const w = bt.PLANS.map(() => R()), tot = sum(w);
    const p = sum(bt.PLANS.map((plan, i) => (w[i] / tot) * (bt.planWins(plan) / 4)));
    assert.ok(p <= bt.CLASSICAL_MAX + 1e-15);
  }
});

test('the classical limit note names the local scope, 75%, and luck in small batches', () => {
  assert.match(bt.LIMIT_NOTE, /local plan/);
  assert.match(bt.LIMIT_NOTE, /75%/);
  assert.match(bt.LIMIT_NOTE, /luck/);
  assert.equal(bt.CLASSICAL_MAX, 0.75);
});

test('the pair is (|00> + |11>)/sqrt2, made from |00> by H then CNOT', () => {
  const s = bt.bellPair();
  closeAll(s.map((a) => a.re), [S2, 0, 0, S2]);
  closeAll(s.map((a) => a.im), [0, 0, 0, 0]);
  close(q.norm2(s), 1);
});

test('turn(t) is unitary and maps cos t|0> + sin t|1> to |0>, and -sin t|0> + cos t|1> to |1>', () => {
  for (const t of angles) {
    const u = bt.turn(t), r = t * RAD;
    const along: q.State = [q.c(Math.cos(r)), q.c(Math.sin(r))], across: q.State = [q.c(-Math.sin(r)), q.c(Math.cos(r))];
    closeAll(q.probs(q.matVec(u, along)), [1, 0]);
    closeAll(q.probs(q.matVec(u, across)), [0, 1]);
    q.matMul(q.dagger(u), u).forEach((row, i) => row.forEach((x, j) => { close(x.re, i === j ? 1 : 0); close(x.im, 0); }));
  }
});

test('joint chances from the state vector match the closed form and sum to 1', () => {
  for (const a of angles) for (const b of angles) {
    const p = bt.joint(a, b);
    closeAll(p, bt.jointExact(a, b));
    close(sum(p), 1);
    p.forEach((x) => assert.ok(x >= 0));
  }
});

test('Watrous case (0, 0): dials 0 and 22.5 give (2 + sqrt2)/8 for 00 and 11, (2 - sqrt2)/8 for 01 and 10', () => {
  const hi = (2 + Math.SQRT2) / 8, lo = (2 - Math.SQRT2) / 8;
  closeAll(bt.joint(0, 22.5), [hi, lo, lo, hi]);
  closeAll(bt.joint(45, -22.5), [lo, hi, hi, lo]); // case (1, 1): the chances swap places
});

test('the answers agree with chance cos^2 of the angle between the dials, and E = cos 2(alpha - beta)', () => {
  for (const a of angles) for (const b of angles) {
    const p = bt.joint(a, b), same = p[0] + p[3], diff = p[1] + p[2];
    close(same, bt.agree('quantum', a, b));
    close(same, Math.cos((a - b) * RAD) ** 2);
    close(same, Math.cos(bt.between(a, b) * RAD) ** 2);
    close(same - diff, bt.correlation(a, b));
  }
  close(bt.agree('quantum', 0, 0), 1); close(bt.agree('quantum', 0, 90), 0); close(bt.agree('quantum', 0, 45), 0.5);
});

test('E is the expectation of A(alpha) x A(beta) on the pair, with A(t) = cos 2t Z + sin 2t X', () => {
  const A = (t: number): q.Matrix => {
    const c2 = Math.cos(2 * t * RAD), s2 = Math.sin(2 * t * RAD);
    return [[q.c(c2), q.c(s2)], [q.c(s2), q.c(-c2)]];
  };
  const s = bt.bellPair();
  for (const a of angles) for (const b of angles) {
    const e = q.inner(s, q.matVec(q.kron(A(a), A(b)), s));
    close(e.re, bt.correlation(a, b)); close(e.im, 0);
  }
});

test('no signal: each side alone gives 0 with chance 1/2, whatever either dial is', () => {
  for (const a of angles) for (const b of angles) {
    const p = bt.joint(a, b);
    close(p[0] + p[1], 0.5); // Alice says 0
    close(p[0] + p[2], 0.5); // Bob says 0
  }
});

test('symmetries: only the angle between the dials counts; a dial turned by 180 is the same; by 90 flips its answer', () => {
  for (const a of angles) for (const b of angles) {
    const p = bt.joint(a, b);
    for (const r of [17, -40, 90]) closeAll(bt.joint(a + r, b + r), p);
    closeAll(bt.joint(a + 180, b), p);
    closeAll(bt.joint(a, b - 180), p);
    closeAll(bt.joint(a + 90, b), [p[2], p[3], p[0], p[1]]); // Alice's bit flips
    closeAll(bt.joint(a, b + 90), [p[1], p[0], p[3], p[2]]); // Bob's bit flips
  }
});

test('best dials: every question pair is won with cos^2(22.5) = (2 + sqrt2)/4, so S = 2 sqrt2', () => {
  for (const [x, y] of bt.PAIRS) close(bt.pairWin('quantum', bt.BEST, x, y), bt.TSIRELSON);
  close(bt.TSIRELSON, Math.cos(Math.PI / 8) ** 2);
  close(bt.TSIRELSON, 0.5 + Math.SQRT2 / 4);
  close(bt.winChance('quantum', bt.BEST), bt.TSIRELSON);
  close(bt.chsh('quantum', bt.BEST), bt.S_TSIRELSON);
  close(bt.TSIRELSON - bt.CLASSICAL_MAX, (Math.SQRT2 - 1) / 4);
  assert.equal(bt.percent(bt.TSIRELSON), '85.4%');
  assert.equal(bt.S_TSIRELSON.toFixed(2), '2.83');
});

test('win chance and S are one number on two scales: P = 1/2 + S/8, for both models and any dials', () => {
  close(bt.winFromS(bt.S_CLASSICAL), bt.CLASSICAL_MAX);
  close(bt.winFromS(bt.S_TSIRELSON), bt.TSIRELSON);
  for (const d of randomDials(200, 2)) for (const m of models) {
    close(bt.winChance(m, d), bt.winFromS(bt.chsh(m, d)));
    close(bt.sFromWin(bt.winChance(m, d)), bt.chsh(m, d));
  }
});

test('Tsirelson for these strategies: S = u0.(v0 + v1) + u1.(v0 - v1) <= |v0 + v1| + |v0 - v1| <= 2 sqrt2 (Aaronson 14.1.3)', () => {
  const v = (t: number) => [Math.cos(2 * t * RAD), Math.sin(2 * t * RAD)];
  const dotp = (p: number[], r: number[]) => p[0] * r[0] + p[1] * r[1];
  const len = (p: number[]) => Math.hypot(p[0], p[1]);
  for (const d of [bt.BEST, bt.SAME, ...randomDials(300, 5)]) {
    const [u0, u1, v0, v1] = [v(d.a[0]), v(d.a[1]), v(d.b[0]), v(d.b[1])];
    const plus = [v0[0] + v1[0], v0[1] + v1[1]], minus = [v0[0] - v1[0], v0[1] - v1[1]];
    const s = bt.chsh('quantum', d);
    close(s, dotp(u0, plus) + dotp(u1, minus));
    assert.ok(s <= len(plus) + len(minus) + 1e-12);
    close(len(plus) ** 2 + len(minus) ** 2, 4); // parallelogram law for unit vectors
    assert.ok(len(plus) + len(minus) <= bt.S_TSIRELSON + 1e-12);
    assert.ok(Math.abs(s) <= bt.S_TSIRELSON + 1e-12);
    const p = bt.winChance('quantum', d);
    assert.ok(p <= bt.TSIRELSON + 1e-12 && p >= 1 - bt.TSIRELSON - 1e-12);
  }
});

test('all dials at 0: the pair always agrees, so it wins exactly 3/4, like the plan "always say 0"', () => {
  for (const m of models) {
    close(bt.winChance(m, bt.SAME), bt.CLASSICAL_MAX);
    close(bt.pairWin(m, bt.SAME, 1, 1), 0);
  }
});

test('hidden plan: answers agree with chance 1 - (angle between dials)/90', () => {
  for (const a of angles) for (const b of angles) {
    const d: bt.Dials = { a: [a, a], b: [b, b] };
    const mix = bt.hiddenMix(d);
    close(sum(mix.map((m) => m.weight)), 1);
    const same = sum(mix.map((m) => (m.plan.a[0] === m.plan.b[0] ? m.weight : 0)));
    close(same, bt.agree('hidden', a, b));
  }
  close(bt.agree('hidden', 0, 22.5), 0.75); close(bt.agree('hidden', 0, 45), 0.5); close(bt.agree('hidden', 0, 90), 0);
  close(bt.agree('hidden', 0, 67.5), 0.25);
});

test('hidden plan is a mix of fixed plans, so it never beats 3/4 (S <= 2); it reaches 3/4 at the best quantum dials', () => {
  for (const d of [bt.BEST, bt.SAME, ...randomDials(300, 9)]) {
    const mix = bt.hiddenMix(d);
    close(sum(mix.map((m) => m.weight)), 1);
    mix.forEach((m) => assert.ok(m.weight >= 0));
    const exact = sum(mix.map((m) => m.weight * (bt.planWins(m.plan) / 4)));
    close(bt.winChance('hidden', d), exact);
    assert.ok(bt.winChance('hidden', d) <= bt.CLASSICAL_MAX + 1e-12);
    assert.ok(Math.abs(bt.chsh('hidden', d)) <= bt.S_CLASSICAL + 1e-12);
  }
  close(bt.winChance('hidden', bt.BEST), bt.CLASSICAL_MAX);
  for (const [x, y] of bt.PAIRS) close(bt.pairWin('hidden', bt.BEST, x, y), 0.75);
});

test('each arc of the hidden mix holds one fixed plan', () => {
  for (const d of [bt.BEST, ...randomDials(50, 13)]) {
    const mod = (v: number) => ((v % 180) + 180) % 180;
    const cuts = [...new Set([...d.a, ...d.b].flatMap((t) => [mod(t + 45), mod(t + 135)]))].sort((p, r) => p - r);
    bt.hiddenMix(d).forEach((m, i) => {
      const lo = cuts[i], hi = i + 1 < cuts.length ? cuts[i + 1] : cuts[0] + 180;
      for (const f of [0.01, 0.3, 0.7, 0.99]) {
        const lam = lo + f * (hi - lo);
        assert.deepEqual([bt.hiddenAnswer(d.a[0], lam), bt.hiddenAnswer(d.a[1], lam), bt.hiddenAnswer(d.b[0], lam), bt.hiddenAnswer(d.b[1], lam)],
          [...m.plan.a, ...m.plan.b]);
      }
    });
  }
});

test('hidden plan is local: changing Bob dials never changes Alice answers, round by round', () => {
  const d1: bt.Dials = { a: [0, 45], b: [22.5, -22.5] }, d2: bt.Dials = { a: [0, 45], b: [80, 3] };
  const p1 = bt.player('hidden', d1), p2 = bt.player('hidden', d2), r1 = q.rng(21), r2 = q.rng(21);
  for (let k = 0; k < 2000; k++) {
    const a = p1(r1), b = p2(r2);
    assert.equal(a.x, b.x); assert.equal(a.y, b.y); assert.equal(a.a, b.a);
  }
});

test('the referee picks each question pair with chance 1/4', () => {
  closeAll([0, 0.2499, 0.25, 0.5, 0.75, 0.9999].map((u) => { const [x, y] = bt.referee(() => u); return 2 * x + y; }), [0, 0, 1, 2, 3, 3]);
  const N = 40_000, R = q.rng(3), n = [0, 0, 0, 0];
  for (let k = 0; k < N; k++) { const [x, y] = bt.referee(R); n[2 * x + y]++; }
  const sd = Math.sqrt((0.25 * 0.75) / N);
  n.forEach((c) => assert.ok(Math.abs(c / N - 0.25) <= 5 * sd));
});

test('rounds follow the predicted chances (seeded Monte Carlo, 5 standard deviations)', () => {
  const N = 40_000;
  for (const m of models) for (const d of [bt.BEST, bt.SAME, randomDials(1, 17)[0]]) {
    const t = bt.play(m, d, N, q.rng(31));
    assert.equal(t.n, N);
    assert.equal(sum(t.pairs.map((p) => p.n)), N);
    assert.equal(sum(t.pairs.map((p) => p.won)), t.won);
    const p = bt.winChance(m, d), sd = Math.sqrt((p * (1 - p)) / N);
    assert.ok(Math.abs(t.won / N - p) <= 5 * sd + 1e-12, `${m}: ${t.won / N} vs ${p}`);
    bt.PAIRS.forEach(([x, y], i) => {
      const pp = bt.pairWin(m, d, x, y), n = t.pairs[i].n, s = Math.sqrt((pp * (1 - pp)) / n);
      assert.ok(Math.abs(t.pairs[i].won / n - pp) <= 5 * s + 1e-12, `${m} pair ${x}${y}`);
    });
    const half = Math.sqrt(0.25 / N);
    assert.ok(Math.abs(t.aZero / N - 0.5) <= 5 * half && Math.abs(t.bZero / N - 0.5) <= 5 * half);
  }
});

test('with all dials at 0, every round is decided: (1, 1) always lost, the rest always won', () => {
  for (const m of models) {
    const t = bt.play(m, bt.SAME, 4000, q.rng(8));
    assert.equal(t.pairs[3].won, 0);
    for (let i = 0; i < 3; i++) assert.equal(t.pairs[i].won, t.pairs[i].n);
  }
});

test('each round carries the right win flag', () => {
  for (const m of models) {
    const go = bt.player(m, bt.BEST), R = q.rng(2);
    for (let k = 0; k < 500; k++) { const r = go(R); assert.equal(r.won, bt.wins(r.x, r.y, r.a, r.b)); }
  }
});

test('between folds the angle between two dials into 0 to 90', () => {
  close(bt.between(0, 22.5), 22.5); close(bt.between(45, -22.5), 67.5); close(bt.between(0, 180), 0);
  close(bt.between(-90, 90), 0); close(bt.between(0, 135), 45); close(bt.between(10, 170), 20);
  for (const a of angles) for (const b of angles) {
    const d = bt.between(a, b);
    assert.ok(d >= 0 && d <= 90);
    close(d, bt.between(b, a));
  }
});

test('percent shows at most one decimal and never rounds a real chance to 0% or 100%', () => {
  assert.equal(bt.percent(0.75), '75%');
  assert.equal(bt.percent(0.8536), '85.4%');
  assert.equal(bt.percent(1), '100%');
  assert.equal(bt.percent(0), '0%');
  assert.equal(bt.percent(0.9999), '>99.9%');
  assert.equal(bt.percent(0.0004), '<0.1%');
  assert.equal(bt.percent(1 - bt.TSIRELSON), '14.6%');
});

test('pileGrid fits n dots in the box; pileRoom covers a pair share of the rounds', () => {
  for (const w of [40, 52, 80, 140]) for (const h of [60, 90, 200]) for (const n of [0, 1, 70, 260, 520]) {
    const g = bt.pileGrid(w, h, n);
    assert.ok(g.cols * g.pitch <= w + 1e-9 && g.rows * g.pitch <= h + 1e-9);
    if (g.pitch > 1 + 1e-9) assert.ok(g.cols * g.rows >= n, `${w}x${h} n=${n}`);
  }
  for (const n of [250, 1000, 2000]) assert.ok(bt.pileRoom(n) > n / 4 + 4 * Math.sqrt((3 * n) / 16));
});

test('a local plan wins 3/4 on average, yet a 250-round batch tops 75% about half the time by luck', () => {
  close(bt.winChance('hidden', bt.BEST), 0.75);
  // Exact binomial tail P(wins >= 188 of 250) at p = 3/4, built term by term.
  const n = 250, p = 0.75;
  let pmf = (1 - p) ** n, tail = 0;
  for (let k = 0; k <= n; k++) { if (k >= 188) tail += pmf; pmf *= ((n - k) / (k + 1)) * (p / (1 - p)); }
  assert.ok(tail > 0.4 && tail < 0.6, `tail ${tail}`);
});
