import test from 'node:test';
import assert from 'node:assert/strict';
import * as q from '../quantum.ts';
import {
  SIGMA, D, LEFT, RIGHT, T, tau, width, OVERLAP, packet, packetDx, psi, psiDx, density, packetDensity, velocity, fringeK, bright,
  cdfTable, quantile, cdfAt, waveTable, screenTable, SCREEN_N, NORMAL, packetQuantile, packetCdf, ROWS, rowTime, rowTables, path, slitOf,
  VIEW, offView, branches, startOf,
  LAMBDA, R_C, APART, SIZES, noHitOne, coherence, hitChance, meanWait, hitTime, APART_PICTURE,
  STORIES, CAP, BATCH, newShot, land, strength, pattern, brightBands, brightShares, brightShare,
  tenTo, sizeText, percent, startText, storyText, sizeVerdict, describe, FAR_APART,
  type Story, type Shot,
} from './interpretations.ts';

const close = (a: number, b: number, eps = 1e-12) => assert.ok(Math.abs(a - b) < eps, `${a} != ${b} (eps ${eps})`);
const closeC = (a: q.C, b: q.C, eps = 1e-12) => { close(a.re, b.re, eps); close(a.im, b.im, eps); };

/** Simpson's rule on [a, b] with n (even) steps. */
function simpson(f: (x: number) => number, a: number, b: number, n = 2000): number {
  const h = (b - a) / n;
  let s = f(a) + f(b);
  for (let i = 1; i < n; i++) s += f(a + i * h) * (i % 2 ? 4 : 2);
  return (s * h) / 3;
}
/** Simpson integral of a complex function, as a complex number. */
const simpsonC = (f: (x: number) => q.C, a: number, b: number, n = 4000): q.C =>
  q.c(simpson((x) => f(x).re, a, b, n), simpson((x) => f(x).im, a, b, n));

// One screen table for most tests.
const screen = screenTable();
const SHOT = (hit: number, side: number, place: number): Shot => ({ hit, side, place, lift: 0.5 });

// ---- The wave

test('setup: slits at -D/2 and D/2, widths and times in model units', () => {
  assert.equal(LEFT, -D / 2); assert.equal(RIGHT, D / 2);
  assert.ok(D / SIGMA >= 10, 'the two starting packets are far apart');
  close(tau(0), 0); close(tau(T), T / (2 * SIGMA * SIGMA));
  close(width(0), SIGMA);
  close(width(T), SIGMA * Math.sqrt(1 + tau(T) ** 2));
  // The row times run from the slits (j = 0) to the screen (j = ROWS).
  close(rowTime(0), 0); close(rowTime(ROWS), T); close(rowTime(1), T / ROWS);
});

test('one packet at t = 0 is a real Gaussian with |g|^2 of standard deviation sigma, and has norm 1', () => {
  for (const x of [-3, -0.5, 0, 0.7, 2.5]) {
    const g = packet(x, 0, 0);
    close(g.im, 0);
    close(g.re, (2 * Math.PI * SIGMA * SIGMA) ** -0.25 * Math.exp(-(x * x) / (4 * SIGMA * SIGMA)));
  }
  for (const t of [0, 7, T]) {
    const w = width(t), m = 12 * w;
    close(simpson((x) => packetDensity(x, t, 3), 3 - m, 3 + m, 4000), 1, 1e-9);
    // Second moment: the standard deviation of |g|^2 is width(t).
    close(Math.sqrt(simpson((x) => (x - 3) ** 2 * packetDensity(x, t, 3), 3 - m, 3 + m, 4000)), w, 1e-7);
  }
});

test('one packet solves the free Schrödinger equation i dg/dt = -(1/2) d2g/dx2 (hbar = m = 1)', () => {
  const h = 1e-3;
  for (const [x, t] of [[0.4, 3], [-5, 8], [12, 20], [30, 60]] as const) {
    const a = -4;
    const dt = q.scale(q.sub(packet(x, t + h, a), packet(x, t - h, a)), 1 / (2 * h));
    const lap = q.scale(q.add(q.sub(packet(x + h, t, a), q.scale(packet(x, t, a), 2)), packet(x - h, t, a)), 1 / (h * h));
    closeC(q.mul(q.c(0, 1), dt), q.scale(lap, -0.5), 2e-6);
  }
});

test('packetDx and psiDx are the x-derivatives', () => {
  const h = 1e-5;
  for (const [x, t] of [[0.4, 3], [-5, 8], [12, 20], [30, 60]] as const) {
    const fd = q.scale(q.sub(packet(x + h, t, 2), packet(x - h, t, 2)), 1 / (2 * h));
    closeC(packetDx(x, t, 2), fd, 1e-9);
    const fp = q.scale(q.sub(psi(x + h, t), psi(x - h, t)), 1 / (2 * h));
    closeC(psiDx(x, t), fp, 1e-9);
  }
});

test('overlap of two packets is exp(-d^2 / (8 sigma^2)) and does not change in time (the flight is unitary)', () => {
  for (const d of [0, 1, 3, 6]) {
    for (const t of [0, 5, 40]) {
      const m = 14 * width(t) + d;
      const ov = simpsonC((x) => q.mul(q.conj(packet(x, t, -d / 2)), packet(x, t, d / 2)), -m, m, 8000);
      close(ov.re, Math.exp(-(d * d) / (8 * SIGMA * SIGMA)), 1e-8);
      close(ov.im, 0, 1e-8);
    }
  }
  close(OVERLAP, Math.exp(-50)); assert.ok(OVERLAP < 1e-20);
});

test('the two-slit wave has norm 1 at the slits and at the screen, and is mirror symmetric', () => {
  for (const t of [0, 30, T]) {
    const m = 10 + 10 * width(t);
    close(simpson((x) => density(x, t), -m, m, 20000), 1, 1e-8);
    for (const x of [0.5, 7, 19]) close(density(x, t), density(-x, t), 1e-14);
  }
  close(screen.total, 1, 1e-8);
});

// ---- The pilot-wave velocity

test('velocity: for one packet it is (x - a) tau / (2 sigma^2 (1 + tau^2)); the packet spreads by the stretch sqrt(1 + tau^2)', () => {
  for (const [x, t] of [[3, 5], [-8, 20], [40, 60]] as const) {
    const a = 1, g = packet(x, t, a), dg = packetDx(x, t, a);
    const v = q.mul(dg, q.conj(g)).im / q.abs2(g);
    close(v, ((x - a) * tau(t)) / (2 * SIGMA * SIGMA * (1 + tau(t) ** 2)), 1e-12);
  }
});

test('velocity: zero on the middle line, odd, and at t = 0 zero everywhere the packets are separate', () => {
  for (const t of [1, 20, T]) {
    close(velocity(0, t), 0, 1e-12);
    for (const x of [2, 9, 25]) close(velocity(-x, t), -velocity(x, t), 1e-12);
  }
  for (const x of [-12, -10, -9, 9, 10, 11]) close(velocity(x, 0), 0, 1e-12);
});

test('velocity keeps the odds: d(rho)/dt + d(rho v)/dx = 0, with rho v = Im(conj(psi) psi_x)', () => {
  const h = 1e-3;
  const flux = (x: number, t: number) => density(x, t) * velocity(x, t);
  for (const [x, t] of [[4, 10], [-13, 30], [22, 45], [60, 60], [1.5, 55]] as const) {
    const drho = (density(x, t + h) - density(x, t - h)) / (2 * h);
    const dflux = (flux(x + h, t) - flux(x - h, t)) / (2 * h);
    close(drho + dflux, 0, 1e-8);
  }
  // And the flux is Im(conj(psi) psi_x) itself.
  close(flux(7, 22), q.mul(q.conj(psi(7, 22)), psiDx(7, 22)).im, 1e-14);
});

// ---- Stripes

test('cross term: |psi|^2 = (|g_L|^2 + |g_R|^2 + 2 |g_L||g_R| cos(k x)) / (2 (1 + overlap)), with k = D tau / (2 sigma^2 (1 + tau^2))', () => {
  for (const t of [5, 20, T]) {
    const k = fringeK(t);
    close(k, (D * tau(t)) / (2 * SIGMA * SIGMA * (1 + tau(t) ** 2)));
    for (const x of [-40, -7, 0, 3.3, 18, 55]) {
      const l = packet(x, t, LEFT), r = packet(x, t, RIGHT);
      const cross = 2 * q.mul(q.conj(l), r).re;
      close(cross, 2 * q.abs(l) * q.abs(r) * Math.cos(k * x), 1e-14);
      close(density(x, t), (q.abs2(l) + q.abs2(r) + cross) / (2 * (1 + OVERLAP)), 1e-14);
    }
  }
  close(fringeK(0), 0);
  // The stripe spacing 2 pi / k is largest-wavenumber at tau = 1 and grows without bound at late times.
  assert.ok(fringeK(2 * SIGMA * SIGMA) > fringeK(T) && fringeK(2 * SIGMA * SIGMA) > fringeK(1));
  close(2 * Math.PI / fringeK(T), (4 * Math.PI * SIGMA * SIGMA * (1 + tau(T) ** 2)) / (D * tau(T)), 1e-12);
});

test('bright bands: where cos(kx) > 0, each half a stripe wide, inside the range, and cut where the density rises above the no-stripe curve', () => {
  const k = fringeK(T), bands = brightBands(-120, 120);
  assert.ok(bands.length >= 6);
  for (const [a, b] of bands) {
    assert.ok(a >= -120 && b <= 120 && b > a);
    assert.ok(bright((a + b) / 2));
    assert.ok(b - a <= Math.PI / k + 1e-12);
    // Just inside each full band the density beats the no-stripe curve, just outside it does not.
    if (b - a > Math.PI / k - 1e-9) {
      const m = (a + b) / 2, e = (b - a) / 2;
      assert.ok(density(m, T) > (packetDensity(m, T, LEFT) + packetDensity(m, T, RIGHT)) / 2);
      assert.ok(!bright(m + e + 1e-6) && !bright(m - e - 1e-6) && bright(m + e - 1e-6));
    }
  }
  // The bands do not overlap and are in order.
  bands.forEach(([a], i) => { if (i) assert.ok(a >= bands[i - 1][1]); });
  // The middle of the screen is bright: cos(0) = 1.
  assert.ok(bright(0));
});

test('bright shares: stripes put about 80% of the dots in bright bands, no stripes about half', () => {
  const s = brightShares(screen);
  // Independent check by Simpson integration over each band.
  let p1 = 0, p0 = 0;
  for (const [a, b] of brightBands(screen.lo, screen.hi)) {
    p1 += simpson((x) => density(x, T), a, b, 400);
    p0 += simpson((x) => (packetDensity(x, T, LEFT) + packetDensity(x, T, RIGHT)) / 2, a, b, 400);
  }
  close(s.p1, p1, 1e-4); close(s.p0, p0, 1e-4);
  close(s.p0, 0.5, 2e-3);
  assert.ok(s.p1 > 0.79 && s.p1 < 0.81);
});

// ---- CDF tables and quantiles

test('cdf tables: rise from 0 to 1, never fall, and quantile undoes the CDF', () => {
  assert.equal(screen.n, SCREEN_N); assert.equal(screen.F[0], 0); close(screen.F[screen.n], 1, 1e-15);
  for (let i = 1; i <= screen.n; i++) assert.ok(screen.F[i] >= screen.F[i - 1]);
  for (const x of [-60, -22.3, -3, 0.4, 14, 51]) close(quantile(screen, cdfAt(screen, x)), x, 1e-9);
  for (const u of [0.001, 0.2, 0.5, 0.77, 0.999]) close(cdfAt(screen, quantile(screen, u)), u, 1e-12);
  assert.equal(cdfAt(screen, screen.lo - 1), 0); assert.equal(cdfAt(screen, screen.hi + 1), 1);
  assert.ok(quantile(screen, 0) >= screen.lo && quantile(screen, 1 - 1e-12) <= screen.hi);
});

test('the standard bell curve table gives the known quantiles', () => {
  close(quantile(NORMAL, 0.5), 0, 1e-9);
  close(quantile(NORMAL, 0.8413447460685429), 1, 1e-4);
  close(quantile(NORMAL, 0.9750021048517795), 1.959963984540054, 1e-4);
  close(quantile(NORMAL, 0.1), -quantile(NORMAL, 0.9), 1e-9);
  close(cdfAt(NORMAL, 1), 0.8413447460685429, 1e-6);
});

test('one packet: quantile and CDF are a + width z, and they undo each other', () => {
  for (const t of [0, 10, T]) for (const u of [0.1, 0.5, 0.93]) {
    close(packetCdf(packetQuantile(u, t, LEFT), t, LEFT), u, 1e-9);
    close(packetQuantile(u, t, RIGHT) - packetQuantile(u, t, LEFT), D, 1e-12);
  }
  // CDF check against the density itself.
  const x = 5, t = 30;
  close(packetCdf(x, t, LEFT), simpson((y) => packetDensity(y, t, LEFT), LEFT - 14 * width(t), x, 8000), 1e-6);
});

test('the Born rule draw: dots at Q(u) for uniform u fill the screen with density |psi|^2', () => {
  // A fine, even grid of u (every shot number the generator could give) lands in an interval in the share the density gives.
  const N = 20000, xs: number[] = [];
  for (let i = 0; i < N; i++) xs.push(quantile(screen, (i + 0.5) / N));
  for (const [a, b] of [[-25, 0], [0, 12], [-60, 60], [20, 45]] as const) {
    const share = xs.filter((x) => x >= a && x < b).length / N;
    close(share, simpson((x) => density(x, T), a, b, 4000), 1e-3);
  }
  // In bright bands: the sampled share is the tabulated one.
  const s = brightShares(screen);
  close(xs.filter(bright).length / N, s.p1, 2e-3);
});

// ---- Pilot wave: the path starting at quantile u is x(t) = Q_t(u)

test('start: the starting place is the quantile of the starting density, left of the middle for u < 1/2', () => {
  const t0 = waveTable(0);
  for (const u of [0.01, 0.2, 0.49, 0.51, 0.7, 0.99]) close(startOf(u), quantile(t0, u), 1e-3);
  close(startOf(0.25), LEFT, 1e-9); close(startOf(0.75), RIGHT, 1e-9);
  assert.equal(slitOf(startOf(0.3)), 'left'); assert.equal(slitOf(startOf(0.8)), 'right');
});

test('pilot wave: integrating dx/dt = Im(psi_x / psi) from the start reproduces the quantile paths', () => {
  const tabs = rowTables(2000), steps = 300, h = T / steps;
  for (const u of [0.03, 0.2, 0.37, 0.45, 0.6, 0.85, 0.97]) {
    let x = quantile(tabs[0], u);
    for (let i = 0; i < steps; i++) {
      const t = i * h;
      const k1 = velocity(x, t), k2 = velocity(x + (h * k1) / 2, t + h / 2), k3 = velocity(x + (h * k2) / 2, t + h / 2), k4 = velocity(x + h * k3, t + h);
      x += (h * (k1 + 2 * k2 + 2 * k3 + k4)) / 6;
      if (i === steps / 2 - 1) close(x, quantile(tabs[ROWS / 2], u), 0.03);
    }
    close(x, quantile(tabs[ROWS], u), 0.03);
  }
});

test('pilot wave, one packet alone: the path is a + (x0 - a) sqrt(1 + tau^2), which is the quantile rule', () => {
  for (const u of [0.1, 0.5, 0.8]) {
    const x0 = packetQuantile(u, 0, 0);
    for (const t of [3, 20, T]) close(packetQuantile(u, t, 0), x0 * Math.sqrt(1 + tau(t) ** 2), 1e-9);
  }
});

test('pilot wave: paths keep their order, never cross each other or the middle line, and mirror each other', () => {
  const tabs = rowTables(600, screen);
  const us = [0.02, 0.15, 0.35, 0.49, 0.51, 0.65, 0.85, 0.98], ps = us.map((u) => path(tabs, u));
  ps.forEach((p) => assert.equal(p.length, ROWS + 1));
  for (let j = 0; j <= ROWS; j++) {
    for (let i = 1; i < us.length; i++) assert.ok(ps[i][j] >= ps[i - 1][j]);
    us.forEach((u, i) => { if (u < 0.5) assert.ok(ps[i][j] < 0.1, `u = ${u}, row ${j}`); else assert.ok(ps[i][j] > -0.1); });
    // The picture is mirror symmetric: the path of 1 - u is the mirror image of the path of u.
    for (let i = 0; i < us.length / 2; i++) close(ps[i][j], -ps[us.length - 1 - i][j], 1e-6);
  }
  // Each path ends at the dot the same u gives under the rule.
  close(ps[1][ROWS], quantile(screen, 0.15), 1e-12);
});

// ---- Many-worlds picture and the edge of the view

test('branches: slice 0 is this branch, the others are equal slices of the weight, and they wrap around', () => {
  for (const u of [0.05, 0.4, 0.93]) {
    const xs = branches(screen, u, 6);
    assert.equal(xs.length, 6);
    close(xs[0], quantile(screen, u), 1e-12);
    const cdfs = xs.map((x) => cdfAt(screen, x)).sort((a, b) => a - b);
    for (let i = 1; i < 6; i++) close(cdfs[i] - cdfs[i - 1], 1 / 6, 1e-9);
    close(cdfs[5] - cdfs[0], 5 / 6, 1e-9);
  }
  assert.equal(branches(screen, 0.2).length, 6);
});

test('view: the picture cuts off where fewer than 1 dot in 1000 would land', () => {
  assert.ok(VIEW > 3 * width(T));
  assert.ok(offView(screen) < 1e-3 && offView(screen) > 0);
  close(offView(screen), 1 - simpson((x) => density(x, T), -VIEW, VIEW, 20000), 1e-6);
});

// ---- Collapse (GRW)

test('collapse numbers: GRW values from the Stanford Encyclopedia, 1e-16 per second and 1e-5 cm', () => {
  assert.equal(LAMBDA, 1e-16); assert.equal(R_C, 1e-7); assert.equal(APART, 1);
  assert.equal(SIZES.min, 0); assert.equal(SIZES.max, 20); assert.equal(SIZES.step, 1);
  assert.ok(SIZES.start >= SIZES.min && SIZES.start <= SIZES.max);
  close(noHitOne(0), 1); close(noHitOne(1e16), Math.exp(-1));
});

test('collapse: with N particles a hit comes at rate N lambda, so mean wait 1/(N lambda) and no-hit chance e^{-N lambda t}', () => {
  close(meanWait(1) / 1e16, 1); // one particle: 10^16 seconds
  close(meanWait(1e23) / 1e-7, 1, 1e-12); // a macroscopic body (SEP: one hit every 10^-7 s)
  close(meanWait(1e16), 1, 1e-12);
  for (const n of [1, 1e8, 1e16, 1e17, 1e19]) {
    close(coherence(n), Math.exp(-n * LAMBDA * APART), 1e-15);
    close(coherence(n) + hitChance(n), 1, 1e-15);
  }
  // The product rule: N particles, each with no hit. (Over 10^12 s, so that e^{-lambda t} is far from 1 and floats stay exact.)
  close(noHitOne(1e12) ** 1e4, coherence(1e4, 1e12), 1e-12);
  close(coherence(1e4, 1e12), Math.exp(-1), 1e-12);
  close(hitChance(1e16), 1 - Math.exp(-1), 1e-15);
  assert.ok(hitChance(1) > 0 && hitChance(1) < 2e-16, 'one particle: tiny but not zero');
  // More particles, more hits.
  for (let k = 1; k <= SIZES.max; k++) assert.ok(hitChance(10 ** k) >= hitChance(10 ** (k - 1)));
  assert.equal(coherence(1e20), 0); assert.equal(hitChance(1e20), 1);
});

test('collapse: hitTime inverts P(hit by s) = 1 - e^{-N lambda s}; a hit lands in the APART seconds exactly when u < hitChance', () => {
  for (const n of [1e10, 1e16, 1e17]) {
    close(hitTime(n, hitChance(n)) / APART, 1, 1e-9);
    close(hitTime(n, 0.5), Math.LN2 / (n * LAMBDA), 1e-9 / (n * LAMBDA));
    for (const u of [0.01, 0.4, 0.9]) {
      close(1 - Math.exp(-n * LAMBDA * hitTime(n, u)), u, 1e-12);
      assert.equal(hitTime(n, u) <= APART, u <= hitChance(n));
    }
  }
});

test('GRW teaching numbers: N lambda t = 1 gives 0.368 far apart, but 0.802 at D = r_C, and 0.368 only as D grows', () => {
  const f = (d: number) => Math.exp(-(1 - Math.exp(-(d * d) / 4)));
  close(coherence(1e16, 1, R_C), f(1), 1e-12); close(f(1), 0.8016, 5e-4);
  close(coherence(1e16), Math.exp(-1), 1e-15); close(Math.exp(-1), 0.3679, 5e-4);
  assert.ok(coherence(1e16, 1, 3 * R_C) < coherence(1e16, 1, R_C)); close(coherence(1e16, 1, 20 * R_C), Math.exp(-1), 1e-12);
});

test('collapse: the loss of coherence for paths a distance sep apart is 1 - the overlap of two hit Gaussians, e^{-sep^2/(4 R_C^2)}', () => {
  // Independent check: overlap of the hit shape G(q) = exp(-q^2 / (2 R_C^2)) with its copy shifted by sep, in units of R_C.
  const G = (x: number, s: number) => Math.exp(-(x * x) / 2) * Math.exp(-((x - s) * (x - s)) / 2);
  for (const s of [0.3, 1, 2.5]) {
    const ov = simpson((x) => G(x, s), -15, 15 + s, 4000) / simpson((x) => G(x, 0), -15, 15, 4000);
    close(ov, Math.exp(-(s * s) / 4), 1e-9);
    const n = 1e16;
    close(coherence(n, APART, s * R_C), Math.exp(-n * LAMBDA * APART * (1 - ov)), 1e-9);
  }
  close(coherence(1e16, APART, 0), 1);
  assert.ok(coherence(1e16, APART, 10 * R_C) < coherence(1e16, APART, 1 * R_C));
  close(coherence(1e16, APART, 100 * R_C), coherence(1e16), 1e-12);
  close(coherence(1e16, 2 * APART), coherence(1e16) ** 2, 1e-12);
});

test('collapse: each of the two paths picks the same chance, and the sizes on the slider cross from "never" to "always"', () => {
  assert.ok(coherence(1) > 0.999999999);
  assert.ok(hitChance(10 ** 8) < 1e-7);
  assert.ok(hitChance(10 ** 16) > 0.6 && hitChance(10 ** 16) < 0.65);
  assert.ok(hitChance(10 ** 20) > 0.999);
});

// ---- Pattern: stripes fade into the sum of the two broad bands

test('pattern: v |psi|^2 + (1 - v) (g_L^2 + g_R^2)/2 adds up to 1, is |psi|^2 at v = 1, and fades linearly', () => {
  for (const v of [0, 0.25, 0.6, 1]) close(simpson((x) => pattern(x, v), -300, 300, 20000), 1, 1e-8);
  for (const x of [-30, 0, 4.4, 21]) {
    close(pattern(x, 1), density(x, T), 1e-15);
    close(pattern(x, 0), (packetDensity(x, T, LEFT) + packetDensity(x, T, RIGHT)) / 2, 1e-15);
    close(pattern(x, 0.4), 0.4 * pattern(x, 1) + 0.6 * pattern(x, 0), 1e-15);
  }
  // With no stripes, the dots pile up with no dark gaps: the density is smooth, with no zeros.
  assert.ok(pattern(0, 0) > 0);
});

test('bright share of a pattern is v p1 + (1 - v) p0', () => {
  const s = brightShares(screen);
  for (const v of [0, 0.3, 0.7, 1]) {
    let p = 0;
    for (const [a, b] of brightBands(screen.lo, screen.hi)) p += simpson((x) => pattern(x, v), a, b, 400);
    close(brightShare(v, s), p, 1e-4);
  }
  close(brightShare(1, s), s.p1); close(brightShare(0, s), s.p0);
});

// ---- Stories and shots

test('stories: one rule-only choice first, then the five stories in alphabetical order, so the list ranks nothing', () => {
  assert.equal(STORIES[0].id, 'rule');
  const named = STORIES.slice(1).map((s) => s.name);
  assert.deepEqual(named, [...named].sort((a, b) => a.localeCompare(b)));
  assert.deepEqual(STORIES.slice(1).map((s) => s.id).sort(), ['collapse', 'copenhagen', 'many-worlds', 'pilot-wave', 'qbism']);
  assert.equal(new Set(STORIES.map((s) => s.id)).size, STORIES.length);
});

test('strength: every story that keeps the standard rules predicts full stripes at any size; only collapse fades them', () => {
  for (const s of STORIES) for (const k of [0, 8, 16, 20]) {
    const v = strength(s.id, 10 ** k);
    if (s.id === 'collapse') close(v, coherence(10 ** k)); else assert.equal(v, 1);
  }
  close(strength('collapse', 1), 1, 1e-15);
  assert.ok(strength('collapse', 1e16) < 0.4 && strength('collapse', 1e20) === 0);
});

test('the picture holds whole batches', () => {
  assert.equal(CAP % BATCH, 0); assert.ok(BATCH >= 10);
});

test('new shots: four numbers in [0, 1), drawn in order from the generator', () => {
  const seq = [0.1, 0.2, 0.3, 0.4];
  let i = 0;
  assert.deepEqual(newShot(() => seq[i++]), { hit: 0.1, side: 0.2, place: 0.3, lift: 0.4 });
  const sh = newShot(Math.random);
  for (const v of Object.values(sh)) assert.ok(v >= 0 && v < 1);
});

test('every story that keeps the standard rules puts the same shot at the same dot, whatever the size', () => {
  for (const place of [0.01, 0.3, 0.5, 0.74, 0.99]) {
    const sh = SHOT(0.05, 0.9, place), want = quantile(screen, place);
    for (const k of [0, 8, 16, 20]) for (const s of STORIES) {
      if (s.id === 'collapse') continue;
      const l = land(s.id, 10 ** k, sh, screen);
      assert.equal(l.x, want); assert.equal(l.hit, null);
    }
  }
});

test('collapse landing: no hit gives the rule dot; a hit leaves one path and that packet\'s broad band', () => {
  const n = 1e16, h = hitChance(n);
  // No hit (shot.hit above the chance) and one particle: same as the rule.
  assert.equal(land('collapse', 1, SHOT(0.3, 0.1, 0.62), screen).x, quantile(screen, 0.62));
  assert.equal(land('collapse', n, SHOT(h + 1e-9, 0.1, 0.62), screen).x, quantile(screen, 0.62));
  // A hit: left or right by `side`, landing at that packet's own quantile; the hit time is inside the APART seconds.
  const left = land('collapse', n, SHOT(0.2, 0.3, 0.5), screen), right = land('collapse', n, SHOT(0.2, 0.7, 0.5), screen);
  assert.equal(left.hit?.side, 'left'); assert.equal(right.hit?.side, 'right');
  close(left.x, packetQuantile(0.5, T, LEFT), 1e-12); close(right.x, packetQuantile(0.5, T, RIGHT), 1e-12);
  close(left.hit!.at, hitTime(n, 0.2), 1e-6); assert.ok(left.hit!.at <= APART);
  // Huge object: any hit chance below 1 is a hit; a million-times-bigger shot still lands somewhere.
  assert.ok(land('collapse', 1e20, SHOT(0.999, 0.1, 0.5), screen).hit);
});

test('collapse landings over every shot number: a share e^{-N lambda} of the dots follow the stripes, the rest the two broad bands', () => {
  const n = 1e16, v = coherence(n), s = brightShares(screen), H = 200, P = 400;
  let inBright = 0, total = 0, left = 0, hits = 0;
  for (let i = 0; i < H; i++) for (let j = 0; j < P; j++) for (const side of [0.25, 0.75]) {
    const l = land('collapse', n, SHOT((i + 0.5) / H, side, (j + 0.5) / P), screen);
    total++; if (bright(l.x)) inBright++; if (l.x < 0) left++; if (l.hit) hits++;
  }
  close(hits / total, hitChance(n), 1e-2);
  close(inBright / total, brightShare(v, s), 1e-2);
  close(left / total, 0.5, 1e-3);
});

// ---- Words

test('tenTo, sizeText and percent', () => {
  assert.equal(tenTo(0), '1'); assert.equal(tenTo(3), '1,000'); assert.equal(tenTo(4), '10⁴'); assert.equal(tenTo(16), '10¹⁶'); assert.equal(tenTo(20), '10²⁰');
  assert.equal(sizeText(0), '1 particle'); assert.equal(sizeText(2), '100 particles'); assert.equal(sizeText(16), '10 to the power 16 particles');
  assert.equal(percent(0), '0%'); assert.equal(percent(1), '100%'); assert.equal(percent(0.5), '50%'); assert.equal(percent(0.8007), '80.1%');
  assert.equal(percent(1e-16), '<0.1%'); assert.equal(percent(1 - 1e-16), '>99.9%'); assert.equal(percent(0, true), '<0.1%'); assert.equal(percent(1, true), '>99.9%');
  assert.equal(percent(0.3679), '36.8%');
});

test('every readout names the start state, uses the right numbers and avoids banned words', () => {
  const sh = brightShares(screen), banned = [/—/, /\bwatch/i, /both at once/i, /tries every/i, /squares? the amplitude/i];
  const lastRight = { x0: 4, landing: { x: 12, hit: null } };
  const lastHit = { x0: -4, landing: { x: -33, hit: { side: 'left' as const, at: 0.2 } } };
  for (const st of STORIES) for (const k of [0, 3, 16, 20]) for (const last of [null, lastRight, lastHit]) for (const counts of [{ shots: 0, inBright: 0 }, { shots: 200, inBright: 160 }]) {
    const text = describe(st.id as Story, k, counts, sh, last);
    assert.ok(text.includes(startText(k)), 'names the start state');
    assert.ok(text.includes('equal amplitudes for the two'));
    assert.ok(text.includes(sizeVerdict(st.id, k)));
    for (const b of banned) assert.ok(!b.test(text), `${b} in: ${text}`);
    const pred = k > 0 || st.id !== 'collapse' ? `${percent(brightShare(strength(st.id, 10 ** k), sh))}` : '';
    assert.ok(text.includes(pred), `predicts ${pred}`);
  }
  // The tally: the dots so far, and what fraction is in bright bands.
  assert.ok(describe('rule', 0, { shots: 200, inBright: 160 }, sh).includes('200 dots so far: 80% in the bright bands'));
  assert.ok(describe('rule', 0, { shots: 1000, inBright: 800 }, sh).includes('1,000 dots so far'));
});

test('stories keep their facts straight', () => {
  const t = (s: Story, last: Parameters<typeof storyText>[1] = null) => storyText(s, last);
  assert.match(t('copenhagen'), /tool/); assert.match(t('copenhagen'), /differ/);
  assert.match(t('many-worlds'), /never collapses/); assert.match(t('many-worlds'), /critics doubt it/);
  assert.match(t('pilot-wave', { x0: -10, landing: { x: -5, hit: null } }), /left slit/);
  assert.match(t('pilot-wave', { x0: 10, landing: { x: 5, hit: null } }), /right slit/);
  assert.match(t('pilot-wave'), /theory takes/);
  assert.match(t('qbism'), /belief/);
  assert.match(t('collapse', { x0: 0, landing: { x: -30, hit: { side: 'left', at: 0.1 } } }), /left path/);
  assert.match(t('collapse', { x0: 0, landing: { x: 3, hit: null } }), /no hit/);
  assert.match(t('rule'), /only the rule/);
  // Sizes: only the collapse verdict has numbers that change with size.
  assert.equal(sizeVerdict('qbism', 0), sizeVerdict('qbism', 20));
  assert.notEqual(sizeVerdict('collapse', 0), sizeVerdict('collapse', 20));
  // The slider is the far-apart limit, and says so (the exact factor for closer paths is tested above).
  assert.match(sizeVerdict('collapse', 16), /far apart/); assert.match(FAR_APART, /far apart/); assert.match(FAR_APART, /Closer paths lose fewer/);
  assert.match(storyText('pilot-wave', null), /quantum equilibrium/); assert.match(storyText('many-worlds', null), /not a count of worlds/);
  assert.match(sizeVerdict('collapse', 16), /63\.2%/); assert.match(sizeVerdict('collapse', 16), /36\.8%/); assert.match(sizeVerdict('collapse', 16), /100%/);
  assert.match(sizeVerdict('collapse', 20), />99\.9%/); assert.match(sizeVerdict('collapse', 20), /<0\.1%/);
  assert.match(sizeVerdict('rule', 20), /Only the collapse story says otherwise/);
  assert.equal(startText(0), 'Each shot: one object, made of 1 particle, reaches the two slits with equal amplitudes for the two.');
});

test('picture only: the APART seconds are drawn up to the time the packets start to overlap, when the width reaches D/4', () => {
  close(width(APART_PICTURE), D / 4, 1e-12);
  assert.ok(APART_PICTURE > 0 && APART_PICTURE < T / 2);
});
