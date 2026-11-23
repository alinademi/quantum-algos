import test from 'node:test';
import assert from 'node:assert/strict';
import * as q from '../quantum.ts';
import * as pol from './polarization.ts';

const close = (a: number, b: number, eps = 1e-12) => assert.ok(Math.abs(a - b) < eps, `${a} != ${b}`);
const closeAll = (a: number[], b: number[], eps = 1e-12) => { assert.equal(a.length, b.length); a.forEach((x, i) => close(x, b[i], eps)); };
const sum = (xs: number[]) => xs.reduce((t, x) => t + x, 0);
const S2 = Math.SQRT1_2;
const circular: q.State = [q.c(S2), q.c(0, S2)]; // (|H> + i|V>)/sqrt2
const angles = [0, 10, 30, 45, 60, 71.6, 90, 120, 135, 170, 180, 222, -35];

test('H, V and 45 degrees are |0>, |1> and |+>; every linear state is normalized', () => {
  const v = (s: q.State) => s.map((x) => [Math.round(x.re * 1e12) / 1e12 + 0, Math.round(x.im * 1e12) / 1e12 + 0]);
  assert.deepEqual(v(pol.linear(0)), v(q.ket0()));
  assert.deepEqual(v(pol.linear(90)), v(q.ket1()));
  assert.deepEqual(v(pol.linear(45)), v(q.plus()));
  assert.deepEqual(v(pol.linear(-45)), v(q.minus()));
  for (const a of angles) close(q.norm2(pol.linear(a)), 1);
});

test('linear(theta) is RY(2 theta)|0>, so its Bloch vector is (sin 2theta, 0, cos 2theta)', () => {
  for (const a of angles) {
    const t = (a * Math.PI) / 180;
    const ry = q.matVec(q.RY(2 * t), q.ket0());
    pol.linear(a).forEach((x, i) => { close(x.re, ry[i].re); close(x.im, ry[i].im); });
    closeAll(q.bloch(pol.linear(a)), [Math.sin(2 * t), 0, Math.cos(2 * t)]);
  }
});

test('orthogonal polarizations are 90 degrees apart, not 180', () => {
  for (const a of angles) close(q.abs(q.inner(pol.linear(a), pol.linear(a + 90))), 0);
});

test('Malus per photon: pass chance is cos^2 of the angle between polarization and axis', () => {
  for (const a of angles) for (const f of angles) {
    close(pol.passChance(pol.linear(a), f), pol.malus(a - f));
    close(pol.passChance(pol.linear(a), f), pol.malus(pol.between(a, f)));
  }
  close(pol.malus(0), 1); close(pol.malus(90), 0); close(pol.malus(45), 0.5);
  close(pol.malus(60), 0.25); close(pol.malus(30), 0.75);
  close(pol.malus(71.6), 0.1, 1e-3); // OpenStax UP3 Example 1.7: 71.6 degrees cuts intensity to 10%
});

test('a filter is a measurement in a basis: pass and block chances sum to 1 for any state', () => {
  const R = q.rng(7);
  const states = [circular, ...angles.map(pol.linear)];
  for (let k = 0; k < 20; k++) states.push(q.normalize([q.c(R() - 0.5, R() - 0.5), q.c(R() - 0.5, R() - 0.5)]));
  for (const s of states) for (const f of angles) close(pol.passChance(s, f) + pol.passChance(s, f + 90), 1);
});

test('a photon that passed a filter always passes the same filter again', () => {
  for (const a of angles) close(pol.passChance(pol.linear(a), a), 1);
  for (const a of angles) closeAll(pol.fates([a, a]), [0.5, 0, 0.5]);
});

test('global phase: turning a filter or a polarization by 180 degrees changes nothing', () => {
  for (const a of angles) {
    pol.linear(a + 180).forEach((x, i) => { close(x.re, -pol.linear(a)[i].re); });
    for (const f of angles) {
      close(pol.passChance(pol.linear(a + 180), f), pol.passChance(pol.linear(a), f));
      close(pol.passChance(pol.linear(a), f + 180), pol.passChance(pol.linear(a), f));
    }
  }
});

test('relative phase shows: circular light passes any linear filter half the time, |+> passes 45 always', () => {
  for (const f of angles) close(pol.passChance(circular, f), 0.5);
  close(pol.passChance(q.plus(), 45), 1);
  close(pol.passChance(circular, 45), 0.5);
});

test('unpolarized light passes half: cos^2 averaged over all angles is 1/2', () => {
  const N = 3600;
  let t = 0;
  for (let k = 0; k < N; k++) t += pol.malus((180 * (k + 0.5)) / N);
  close(t / N, pol.UNPOLARIZED, 1e-9);
  for (const a of angles) closeAll(pol.fates([a]), [0.5, 0.5]);
});

test('crossed filters pass nothing; a 45 degree filter between them passes 1/8 of the lamp', () => {
  closeAll(pol.fates([0, 90]), [0.5, 0.5, 0]);
  closeAll(pol.fates([0, 45, 90]), [0.5, 0.25, 0.125, 0.125]);
  close(pol.fates([0, 45, 90])[3] / 0.5, 0.25); // 1/4 of the photons that passed the first (Vazirani CS294 L1, 0.7)
  assert.ok(pol.fates([0, 45, 90])[3] > pol.fates([0, 90])[2]);
});

test('three filters: screen chance is sin^2(2 phi)/8, peaks at 45, zero at 0 and 90, period 90', () => {
  for (let phi = 0; phi <= 180; phi += 0.5) {
    const p = pol.fates([0, phi, 90])[3];
    close(p, Math.sin((2 * phi * Math.PI) / 180) ** 2 / 8);
    close(p, 0.5 * pol.malus(phi) * pol.malus(90 - phi));
    close(p, pol.fates([0, 90 - phi, 90])[3]);
    close(p, pol.fates([0, phi + 90, 90])[3]);
    assert.ok(p <= 0.125 + 1e-15);
  }
  close(pol.fates([0, 0, 90])[3], 0);
  close(pol.fates([0, 90, 90])[3], 0);
  close(pol.fates([0, 135, 90])[3], 0.125);
});

test('only angles between filters matter: turning the whole stack changes nothing', () => {
  closeAll(pol.fates([30, 75, 120]), pol.fates([0, 45, 90]));
  closeAll(pol.fates([30, 75, 120]), [0.5, 0.25, 0.125, 0.125]);
  for (const t of angles) for (const phi of [0, 20, 45, 100]) closeAll(pol.fates([t, t + phi, t + 90]), pol.fates([0, phi, 90]));
});

test('order matters: 0, 90, 45 passes nothing but 0, 45, 90 passes 1/8', () => {
  close(pol.fates([0, 90, 45]).at(-1)!, 0);
  close(pol.fates([0, 45, 90]).at(-1)!, 0.125);
});

test('fate chances are a probability list for any filter stack', () => {
  const R = q.rng(3);
  for (let k = 0; k < 200; k++) {
    const fs = Array.from({ length: 1 + Math.floor(R() * 5) }, () => R() * 360 - 90);
    const p = pol.fates(fs);
    assert.equal(p.length, fs.length + 1);
    p.forEach((x) => assert.ok(x >= -1e-15 && x <= 1 + 1e-15));
    close(sum(p), 1);
  }
});

test('stepped filters: cos^(2n)(90/n) matches the stack, and goes to 1 as n grows', () => {
  for (const n of [1, 2, 3, 5, 10, 50]) {
    const fs = Array.from({ length: n + 1 }, (_, k) => (90 * k) / n);
    close(pol.fates(fs).at(-1)! / 0.5, pol.stepped(n));
  }
  close(pol.stepped(1), 0); close(pol.stepped(2), 0.25);
  for (let n = 2; n < 200; n++) assert.ok(pol.stepped(n + 1) > pol.stepped(n));
  assert.ok(pol.stepped(1000) > 0.99);
});

test('between folds the angle between two axes into 0 to 90', () => {
  close(pol.between(0, 90), 90); close(pol.between(0, 135), 45); close(pol.between(10, 170), 20);
  close(pol.between(0, 180), 0); close(pol.between(45, -45), 90); close(pol.between(120, 90), 30);
  for (const a of angles) for (const b of angles) {
    const d = pol.between(a, b);
    assert.ok(d >= 0 && d <= 90);
    close(d, pol.between(b, a));
  }
});

test('photon by photon draws follow the Born rule (seeded Monte Carlo)', () => {
  const N = 200_000;
  for (const fs of [[0, 90], [0, 45, 90], [0, 30, 90], [0, 120, 90], [0, 0, 90]]) {
    const counts = pol.run(fs, N, q.rng(11));
    assert.equal(sum(counts), N);
    pol.fates(fs).forEach((p, i) => {
      const sd = Math.sqrt((p * (1 - p)) / N);
      assert.ok(Math.abs(counts[i] / N - p) <= 5 * sd + 1e-12, `${fs}: fate ${i} ${counts[i] / N} vs ${p}`);
    });
  }
  assert.equal(pol.run([0, 90], N, q.rng(5))[2], 0); // crossed: never a single photon
});

test('passes draws with the right chance, including for unpolarized photons', () => {
  const N = 100_000, R = q.rng(9);
  for (const [s, a, p] of [[null, 30, 0.5], [pol.linear(0), 60, 0.25], [circular, 10, 0.5]] as const) {
    let k = 0;
    for (let i = 0; i < N; i++) if (pol.passes(s, a, R)) k++;
    assert.ok(Math.abs(k / N - p) <= 5 * Math.sqrt((p * (1 - p)) / N));
  }
});

test('pileGrid fits n dots in the box', () => {
  for (const w of [30, 46, 80, 140]) for (const h of [60, 120, 200]) for (const n of [0, 1, 50, 300, 620, 1820]) {
    const g = pol.pileGrid(w, h, n);
    assert.ok(g.cols * g.pitch <= w + 1e-9 && g.rows * g.pitch <= h + 1e-9);
    if (g.pitch > 0.5 + 1e-9) assert.ok(g.cols * g.rows >= n, `${w}x${h} n=${n}`);
  }
});

