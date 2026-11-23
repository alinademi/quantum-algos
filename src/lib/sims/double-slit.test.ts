import test from 'node:test';
import assert from 'node:assert/strict';
import * as q from '../quantum.ts';
import {
  BAND, EDGE, LAMBDA, SCREEN, SPACING_UM, WIDTH,
  beta, binOf, binProbs, chance, chanceMax, describe, integrate, mm, paths, phaseGap, rate, sampleY, sinc, spread, stripeGap,
} from './double-slit.ts';

const close = (a: number, b: number, eps = 1e-12) => assert.ok(Math.abs(a - b) < eps, `${a} != ${b}`);
const um = (v: number) => v / 1000;
const spacings = Array.from({ length: (SPACING_UM.max - SPACING_UM.min) / SPACING_UM.step + 1 }, (_, i) => um(SPACING_UM.min + i * SPACING_UM.step));
const ys = Array.from({ length: 401 }, (_, i) => -EDGE + (i * 2 * EDGE) / 400);

// ---- Setup

test('setup: 500 nm light, 0.020 mm slits, screen 1 m away; band 25 mm, screen shown to 50 mm', () => {
  close(LAMBDA, 500e-6); close(WIDTH, 0.02); close(SCREEN, 1000);
  close(BAND, 25, 1e-9); close(EDGE, 50, 1e-9);
  // The shown screen ends on a zero of the one-slit pattern: beta = 2 pi.
  close(beta(EDGE), 2 * Math.PI, 1e-9);
});

test('slider spacings run 0.04 to 0.20 mm and never let the slits overlap (d >= 2a)', () => {
  assert.equal(spacings[0], 0.04); assert.equal(spacings.at(-1), 0.2);
  assert.ok(SPACING_UM.start >= SPACING_UM.min && SPACING_UM.start <= SPACING_UM.max);
  for (const d of spacings) assert.ok(d >= 2 * WIDTH - 1e-12);
});

test('far field holds over the whole slider: L >> d^2 / lambda (at least 10 times), and L >> a^2 / lambda', () => {
  for (const d of spacings) assert.ok(SCREEN >= (10 * d * d) / LAMBDA, `d=${d}: d^2/lambda = ${(d * d) / LAMBDA} mm`);
  assert.ok(SCREEN >= (1000 * WIDTH * WIDTH) / LAMBDA);
  close((0.2 * 0.2) / LAMBDA, 80, 1e-9); // the largest spacing: d^2/lambda = 80 mm, against L = 1000 mm
});

test('sinc: 1 at 0, sin(x)/x elsewhere, zero at multiples of pi', () => {
  assert.equal(sinc(0), 1);
  close(sinc(1e-9), 1);
  close(sinc(0.5), Math.sin(0.5) / 0.5);
  for (const k of [1, 2, 3]) close(sinc(k * Math.PI), 0, 1e-15);
});

// ---- Amplitudes and the Born rule

test('each slit is passed with amplitude 1/sqrt(2): at the center both paths are 1/sqrt(2), in phase', () => {
  const [a, b] = paths(0, 0.1);
  close(a.re, Math.SQRT1_2); close(a.im, 0); close(b.re, Math.SQRT1_2); close(b.im, 0);
});

test('far field: each path alone gives the same one-slit pattern |psi_j|^2 = sinc(beta)^2 / 2', () => {
  for (const d of [0.04, 0.1, 0.2]) for (const y of ys) {
    const [a, b] = paths(y, d), one = sinc(beta(y)) ** 2 / 2;
    close(q.abs2(a), one); close(q.abs2(b), one);
  }
});

test('relative phase between the paths is 2 pi (d y / L) / lambda, the path difference in wavelengths', () => {
  for (const y of [0.3, 1, 2.2]) {
    const [a, b] = paths(y, 0.1), rel = q.arg(q.mul(q.conj(a), b));
    close(rel, phaseGap(y, 0.1), 1e-9);
    close(phaseGap(y, 0.1), (2 * Math.PI * ((0.1 * y) / SCREEN)) / LAMBDA, 1e-9);
  }
});

test('a phase on both paths (global phase) changes nothing', () => {
  for (const y of [0, 1.3, 7, -12]) {
    const [a, b] = paths(y, 0.1), g = q.expi(1.234);
    close(q.abs2(q.add(q.mul(g, a), q.mul(g, b))), q.abs2(q.add(a, b)));
  }
});

test('Born rule, no mark: chance is |psi1 + psi2|^2, the amplitudes add', () => {
  for (const d of [0.04, 0.1, 0.2]) for (const y of ys) {
    const [a, b] = paths(y, d);
    close(chance(y, d, 1), q.abs2(q.add(a, b)));
  }
});

test('Born rule, full mark: chance is |psi1|^2 + |psi2|^2, the chances add', () => {
  for (const d of [0.04, 0.1, 0.2]) for (const y of ys) {
    const [a, b] = paths(y, d);
    close(chance(y, d, 0), q.abs2(a) + q.abs2(b));
  }
});

test('closed form matches OpenStax eq. 4.4 times two-slit fringes: 2 sinc^2(pi a y/lambda L) cos^2(pi d y/lambda L)', () => {
  for (const d of [0.04, 0.1, 0.2]) for (const y of ys) {
    const p = (Math.PI * y) / (LAMBDA * SCREEN);
    close(chance(y, d, 1), 2 * sinc(p * WIDTH) ** 2 * Math.cos(p * d) ** 2);
  }
});

test('chance never goes above chanceMax, so the rejection sampler is exact', () => {
  for (const g of [0, 0.4, 1]) for (const d of [0.04, 0.1, 0.2]) for (const y of ys) {
    const p = chance(y, d, g);
    assert.ok(p >= -1e-15 && p <= chanceMax(g) + 1e-12);
  }
  close(chance(0, 0.1, 1), chanceMax(1)); close(chance(0, 0.1, 0), chanceMax(0));
});

test('the pattern is mirror symmetric: P(-y) = P(y)', () => {
  for (const g of [0, 1]) for (const y of ys) close(chance(-y, 0.13, g), chance(y, 0.13, g));
});

// ---- Stripes

test('bright stripes sit at y = m lambda L / d, so the gap is lambda L / d (OpenStax eq. 3.6)', () => {
  close(stripeGap(0.1), 5, 1e-9); close(stripeGap(0.2), 2.5, 1e-9); close(stripeGap(0.04), 12.5, 1e-9);
  for (const d of spacings) for (let m = -3; m <= 3; m++) {
    const y = m * stripeGap(d);
    close(chance(y, d, 1), 2 * sinc(beta(y)) ** 2, 1e-9); // cos^2 = 1: the two paths arrive in phase
  }
});

test('closer slits make wider stripes: the gap shrinks as d grows', () => {
  for (let i = 1; i < spacings.length; i++) assert.ok(stripeGap(spacings[i]) < stripeGap(spacings[i - 1]));
});

test('dark stripes: halfway between bright ones the amplitudes cancel and the chance is zero', () => {
  for (const d of spacings) for (let m = -3; m < 3; m++) {
    const y = (m + 0.5) * stripeGap(d), [a, b] = paths(y, d);
    assert.ok(chance(y, d, 1) < 1e-20, `d=${d} m=${m}`);
    if (Math.abs(y) < BAND) assert.ok(q.abs2(a) > 1e-3 && q.abs2(b) > 1e-3); // in the middle band, each path alone does reach this spot
  }
});

test('more ways, lower chance: with amplitudes 1/2 and -1/2 the spot gets 0, one path alone gives 1/4 (Aaronson, eq. 2.3)', () => {
  close(q.abs2(q.add(q.c(0.5), q.c(-0.5))), 0);
  close(q.abs2(q.c(0.5)), 0.25);
  close(q.abs2(q.c(0.5)) + q.abs2(q.c(-0.5)), 0.5);
});

test('OpenStax Example 4.4: d = 0.20 mm, a = 0.020 mm gives 19 bright stripes in the middle band, m = 10 and 20 missing', () => {
  const d = 0.2, top = chance(0, d, 1);
  let bright = 0;
  for (let m = -30; m <= 30; m++) {
    const y = m * stripeGap(d);
    if (Math.abs(y) < BAND - 1e-9 && chance(y, d, 1) > 1e-6 * top) bright++;
  }
  assert.equal(bright, 19);
  for (const m of [10, -10, 20]) assert.ok(chance(m * stripeGap(d), d, 1) < 1e-20, `m=${m}`);
});

test('OpenStax Example 4.3: d = 3a, the m = 1 stripe has 0.684 of the center, m = 3 is missing', () => {
  const d = 3 * WIDTH;
  close(chance(stripeGap(d), d, 1) / chance(0, d, 1), 0.684, 5e-4);
  close(chance(stripeGap(d), d, 1) / chance(0, d, 1), sinc(Math.PI / 3) ** 2, 1e-12);
  assert.ok(chance(3 * stripeGap(d), d, 1) < 1e-20);
});

// ---- Marking the slit

test('full mark: no stripes; the pattern is the one-slit band and does not depend on d', () => {
  for (const y of ys) {
    const band = sinc(beta(y)) ** 2;
    for (const d of spacings) close(chance(y, d, 0), band);
  }
});

test('with a marker of real overlap g: P(y) = sinc^2(beta) (1 + g cos phi), as on the engineer page', () => {
  for (const g of [0, 0.3, 0.8, 1]) for (const d of [0.04, 0.1, 0.2]) for (const y of ys) {
    close(chance(y, d, g), sinc(beta(y)) ** 2 * (1 + g * Math.cos(phaseGap(y, d))));
  }
});

test('stripe contrast equals the overlap <m1|m2>: P / sinc^2 runs from 1 - overlap to 1 + overlap', () => {
  const d = 0.1;
  for (const g of [0, 0.25, 0.5, 1]) {
    const hi = chance(0, d, g) / sinc(beta(0)) ** 2;
    const yd = stripeGap(d) / 2, lo = chance(yd, d, g) / sinc(beta(yd)) ** 2;
    close(hi, 1 + g, 1e-12); close(lo, 1 - g, 1e-12);
    close((hi - lo) / (hi + lo), g, 1e-12);
  }
});

// ---- Strips of the screen and random shots

test('binOf: the left edge is strip 0, the right edge the last strip, the center the middle strip', () => {
  assert.equal(binOf(-EDGE, 201), 0); assert.equal(binOf(EDGE, 201), 200); assert.equal(binOf(0, 201), 100);
  assert.equal(binOf(-EDGE - 1, 201), 0); assert.equal(binOf(EDGE + 1, 201), 200);
});

test('binProbs: non-negative, sums to 1, mirror symmetric, brightest in the middle', () => {
  for (const g of [0, 1]) for (const d of [0.04, 0.1, 0.2]) {
    const p = binProbs(d, g, 201);
    assert.ok(p.every((x) => x >= 0));
    close(p.reduce((s, x) => s + x, 0), 1, 1e-12);
    p.forEach((x, i) => close(x, p[200 - i], 1e-12));
    assert.equal(p.indexOf(Math.max(...p)), 100);
  }
});

test('integrate: Simpson rule is exact for cubics and close for smooth curves', () => {
  close(integrate((x) => x ** 3 - 2 * x + 1, -1, 2, 2), 3.75, 1e-12);
  close(integrate((x) => Math.sin(x), 0, Math.PI, 64), 2, 1e-6);
});

/** The 0.999 point of the chi-square curve with df degrees of freedom (Wilson-Hilferty, good to about 1%). */
const chi999 = (df: number) => df * (1 - 2 / (9 * df) + 3.0902 * Math.sqrt(2 / (9 * df))) ** 3;

/** Pearson chi-square of counts against probabilities, over strips that expect at least 5 shots. */
function chiSquare(counts: number[], p: number[], n: number): { chi: number; df: number } {
  let chi = 0, df = -1;
  p.forEach((pi, i) => { const e = n * pi; if (e >= 5) { chi += (counts[i] - e) ** 2 / e; df++; } });
  return { chi, df };
}

test('sampleY keeps a point with chance P(y) / max: an exact dark spot is never kept, the bright center is', () => {
  const script = (xs: number[]) => { let i = 0; return () => { if (i >= xs.length) throw new Error('script ran out'); return xs[i++]; }; };
  const u = (y: number) => (y / EDGE + 1) / 2; // the rand value that picks screen point y
  // First try: the dark stripe at 2.5 mm (P = 0) is thrown away even with a tiny draw. Second try: the center (P = max) is kept.
  assert.equal(sampleY(0.1, 1, script([u(2.5), 1e-9, u(0), 0.999])), 0);
  // With a full mark the same spot has P = sinc^2(0.1 pi) = 0.968 of the max, so a draw of 0.9 keeps it.
  close(chance(2.5, 0.1, 0), sinc(0.1 * Math.PI) ** 2, 1e-12);
  close(sampleY(0.1, 0, script([u(2.5), 0.9])), 2.5, 1e-9);
});

test('shots follow the Born rule: a seeded run of 20,000 matches binProbs (chi-square, p > 0.001)', () => {
  for (const g of [0, 1]) {
    const rand = q.rng(7 + g), bins = 21, n = 20000, counts = new Array(bins).fill(0);
    for (let k = 0; k < n; k++) {
      const y = sampleY(0.1, g, rand);
      assert.ok(y >= -EDGE && y <= EDGE);
      counts[binOf(y, bins)]++;
    }
    const { chi, df } = chiSquare(counts, binProbs(0.1, g, bins), n);
    assert.ok(df >= 18);
    assert.ok(chi < chi999(df), `overlap ${g}: chi-square ${chi.toFixed(1)} on ${df} df`);
  }
});

test('shots show stripes without a mark and none with a mark', () => {
  const d = 0.1, gap = stripeGap(d), n = 20000;
  const ratio = (g: number) => {
    const rand = q.rng(11);
    let bright = 0, dark = 0;
    for (let k = 0; k < n; k++) {
      const y = sampleY(d, g, rand);
      if (Math.abs(y) < 0.5) bright++;
      else if (Math.abs(y - gap / 2) < 0.5) dark++;
    }
    return bright / dark;
  };
  assert.ok(ratio(1) > 10);
  const r = ratio(0);
  assert.ok(r > 0.9 && r < 1.2, `marked ratio ${r}`);
});

test('spread: a bell curve cut at 2.4, centered on 0', () => {
  const rand = q.rng(3);
  let sum = 0;
  for (let k = 0; k < 20000; k++) { const v = spread(rand); assert.ok(Math.abs(v) <= 2.4); sum += v; }
  assert.ok(Math.abs(sum / 20000) < 0.03);
});

test('rate: 6 photons a second at first, faster as dots land, capped at 9,600', () => {
  assert.equal(rate(0), 6); assert.equal(rate(1e6), 9600);
  for (let n = 1; n < 20000; n += 97) assert.ok(rate(n) >= rate(n - 1));
});

// ---- Readout words

test('readout: no mark names the stripe gap from stripeGap; a mark says the stripes vanish', () => {
  assert.equal(mm(0.1, 2), '0.10 mm'); assert.equal(mm(stripeGap(0.07), 1), '7.1 mm');
  for (const d of spacings) {
    const free = describe(d, false), marked = describe(d, true);
    assert.ok(free.includes(`Slits ${d.toFixed(2)} mm apart`) && free.includes(`stripes ${stripeGap(d).toFixed(1)} mm apart`), free);
    assert.ok(free.includes('cancel') && !free.includes('vanish'));
    assert.ok(marked.includes('stripes vanish') && marked.includes('one slit alone') && !marked.includes(' mm apart:'));
  }
  assert.ok(describe(0.1, false, 5000).startsWith('5,000 photons so far. '));
  assert.ok(describe(0.1, true, 1).startsWith('1 photon so far. '));
});
