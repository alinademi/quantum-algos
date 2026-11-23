// Elitzur-Vaidman bomb tester: the pure math behind the BombTester tool. No DOM.
// Conventions:
// - The photon's arm is a qubit: |0> is the free arm, |1> is the arm with the bomb.
// - The photon enters as |0>. A balanced beam splitter is the Hadamard gate H, so with nothing in the way
//   H H |0> = |0>: output port 0 is the bright detector, port 1 the dark one (its amplitude cancels).
// - A live bomb measures the arm in the {|0>, |1>} basis: result 1 sets it off, result 0 leaves the photon in |0>.
//   A dud lets the photon pass and changes nothing.
// - Zeno version (Aaronson, Lecture 4.4): start at |0>, then N rounds of "turn by eps = pi/2N, bomb checks",
//   then measure. The turn R_eps = [[cos eps, -sin eps], [sin eps, cos eps]] is RY(2 eps).
// - Every result the tool shows is one of three: 0 boom, 1 safe proof (live bomb, no boom), 2 the rest.
import { c, H, RY, ket0, matVec, probs, abs2, normalize, measureQubit, draw, type Matrix, type State } from '../quantum.ts';

export type Bomb = 'live' | 'dud';
export type Method = 'basic' | 'zeno';
/** Three exact chances that sum to 1. */
export type Odds = [number, number, number];

/** Bombs tested per press, and the most the piles hold. */
export const BATCH = 100;
export const CAP = 1000;
/** Range of the Zeno rounds slider. */
export const N_MIN = 1;
export const N_MAX = 100;

// Float dust: cos(pi/2) is 6e-17, not 0. Below this we call it exactly 0.
const DUST = 1e-12;
const clean = (x: number) => (Math.abs(x) < DUST ? 0 : Math.abs(1 - x) < DUST ? 1 : x);

// ---- The basic Mach-Zehnder test: one photon, two beam splitters

/** Exact chances for one photon: [boom, port 0, port 1]. bs1 and bs2 are the two beam splitters.
 *  A live bomb sees the arm amplitudes after bs1; if it does not go off, the photon is left in |0>. */
export function mzOdds(bomb: Bomb, bs1: Matrix = H, bs2: Matrix = H): Odds {
  const arms = matVec(bs1, ket0());
  if (bomb === 'dud') {
    const [p0, p1] = probs(matVec(bs2, arms));
    return [0, p0, p1];
  }
  const boom = abs2(arms[1]);
  if (boom >= 1) return [1, 0, 0];
  const [p0, p1] = probs(matVec(bs2, normalize([arms[0], c(0)])));
  return [boom, (1 - boom) * p0, (1 - boom) * p1];
}

/** One photon through the interferometer, with Born-rule draws. Returns 0 boom, 1 port 0, 2 port 1. */
export function mzShot(bomb: Bomb, rand: () => number, bs1: Matrix = H, bs2: Matrix = H): 0 | 1 | 2 {
  let s: State = matVec(bs1, ket0());
  if (bomb === 'live') {
    const m = measureQubit(s, 0, rand);
    if (m.result === 1) return 0;
    s = m.state;
  }
  return draw(probs(matVec(bs2, s)), rand) === 0 ? 1 : 2;
}

/** A matched pair of unbalanced splitters: the first sends the photon into the bomb arm with chance r,
 *  the second undoes the first, so a dud still never reaches the dark port. r = 1/2 gives the same odds as H, H. */
export function splitters(r: number): [Matrix, Matrix] {
  const t = 2 * Math.asin(Math.sqrt(r));
  return [RY(t), RY(-t)];
}

/** Keep sending photons after each no-answer (bright) click: the share of live bombs found safely,
 *  dark / (dark + boom). For balanced splitters it is 1/4 + 1/16 + ... = 1/3. */
export const resendSafe = ([boom, , dark]: Odds): number => dark / (dark + boom);

// ---- The Zeno version: N small turns, the bomb checks after each

/** The turn per round, eps = pi / 2N, in radians. N turns add up to pi/2. */
export const turnAngle = (n: number): number => Math.PI / (2 * n);

/** R_eps: maps |0> to cos(eps)|0> + sin(eps)|1>. Same matrix as RY(2 eps). */
export const turn = (n: number): Matrix => RY(2 * turnAngle(n));

/** Chance that one check sets a live bomb off: |sin eps|^2. */
export const checkRisk = (n: number): number => Math.sin(turnAngle(n)) ** 2;

/** Closed form: chance a live bomb survives all N checks, cos^(2N)(pi/2N). */
export const zenoSafe = (n: number): number => clean(Math.cos(turnAngle(n)) ** (2 * n));

/** Simple lower bound on zenoSafe: 1 - pi^2/(4N). */
export const zenoBound = (n: number): number => 1 - Math.PI ** 2 / (4 * n);

/** Exact chances by stepping the state, not the closed form: [boom, reads 0, reads 1]. */
export function zenoOdds(bomb: Bomb, n: number): Odds {
  const R = turn(n);
  let s: State = ket0(), alive = 1, boom = 0;
  for (let k = 0; k < n; k++) {
    s = matVec(R, s);
    if (bomb === 'live') {
      const p = abs2(s[1]);
      boom += alive * p;
      alive *= 1 - p;
      s = ket0();
    }
  }
  const [p0, p1] = probs(s);
  return [clean(boom), clean(alive * p0), clean(alive * p1)];
}

/** One photon through N rounds, with Born-rule draws. Returns 0 boom, 1 reads 0, 2 reads 1. */
export function zenoShot(bomb: Bomb, n: number, rand: () => number): 0 | 1 | 2 {
  const R = turn(n);
  let s: State = ket0();
  for (let k = 0; k < n; k++) {
    s = matVec(R, s);
    if (bomb === 'live') {
      const m = measureQubit(s, 0, rand);
      if (m.result === 1) return 0;
      s = m.state;
    }
  }
  return measureQubit(s, 0, rand).result === 0 ? 1 : 2;
}

// ---- What the tool shows: [boom, safe proof, other]

/** Basic: safe proof is a dark click (port 1), other is a bright click (port 0). Zeno: reads 0, reads 1. */
export function odds(method: Method, bomb: Bomb, n: number): Odds {
  if (method === 'zeno') return zenoOdds(bomb, n);
  const [boom, bright, dark] = mzOdds(bomb);
  return [clean(boom), clean(dark), clean(bright)];
}

/** One bomb tested by one photon: 0 boom, 1 safe proof, 2 other. */
export function shot(method: Method, bomb: Bomb, n: number, rand: () => number): 0 | 1 | 2 {
  if (method === 'zeno') return zenoShot(bomb, n, rand);
  const r = mzShot(bomb, rand);
  return r === 0 ? 0 : r === 2 ? 1 : 2;
}

// ---- Readout helpers

/** A chance in words for readouts. Never shows a real chance as 0% or 100%: 0.0247% stays "0.025%". */
export function share(p: number): string {
  if (p <= 0) return '0%';
  if (p >= 1) return '100%';
  const v = p * 100;
  if (v < 0.01) return 'under 0.01%';
  if (v < 0.1) return `${Number(v.toPrecision(2))}%`;
  if (v < 10) return `${Number(v.toFixed(1))}%`;
  if (v >= 90) return `${Math.min(99.9, Number(v.toFixed(1)))}%`;
  return `${Math.round(v)}%`;
}

/** The turn per round in degrees, for labels: 90 / N to one decimal. This is the amplitude (polarization) angle eps. */
export const turnDeg = (n: number): string => `${Number((90 / n).toFixed(1))}°`;

/** The same turn on the Bloch sphere, where angles double: 180 / N to one decimal. */
export const blochDeg = (n: number): string => `${Number((180 / n).toFixed(1))}°`;

// ---- Dot piles

/** Layout for a pile of up to cap dots in a w by h box, filled row by row from the bottom:
 *  the largest pitch (up to max) that fits them all, centered across. The tool passes the bombs
 *  tested so far as cap, so a pile that holds every result fills the box and heights read as shares. */
export function pile(w: number, h: number, cap = CAP, max = 8): { pitch: number; cols: number; x0: number } {
  let p = Math.min(max, w, h);
  while (p > 0.5 && Math.ceil(cap / Math.floor(w / p)) * p > h) p -= 0.05;
  const cols = Math.max(1, Math.floor(w / p));
  return { pitch: p, cols, x0: (w - cols * p) / 2 };
}

/** Center of dot k in a pile laid out by pile(), in a box h tall. */
export const dotAt = (k: number, g: { pitch: number; cols: number; x0: number }, h: number): [number, number] =>
  [g.x0 + ((k % g.cols) + 0.5) * g.pitch, h - (Math.floor(k / g.cols) + 0.5) * g.pitch];
