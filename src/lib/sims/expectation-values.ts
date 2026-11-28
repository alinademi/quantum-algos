// Expectation values: measure one observable on many fresh copies of one qubit and average the results.
// Pure math for the ShotAverage tool. No DOM.
// Conventions:
// - The qubit starts as |0>, then RY(θ): cos(θ/2)|0> + sin(θ/2)|1>. θ is in degrees, a multiple of STEP from -180 to 180.
//   Its Bloch vector is (sin θ, 0, cos θ), so the tool reaches only real amplitudes: one great circle, through |0>, |+>, |1>, |->.
// - Observables Z and X. Each has the results (eigenvalues) +1 and -1. Z: +1 for |0>, -1 for |1>. X: +1 for |+>, -1 for |->.
// - Born rule: result a_k has chance p_k = |<a_k|ψ>|^2. The expectation value is <A> = Σ a_k p_k = <ψ|A|ψ>
//   (Wilde, Quantum Information Theory, 3.4.1; Nielsen and Chuang 2.2.5). Its spread is ΔA = sqrt(<A²> - <A>²).
// - N shots on fresh copies are independent, so their average has mean <A> and standard deviation ΔA/√N.
import { X, Z, RY, abs2, draw, inner, ket0, ket1, matMul, matVec, minus, plus, type C, type Matrix, type State } from '../quantum.ts';

export type Obs = 'Z' | 'X';
/** One shot's result: an eigenvalue of the observable. */
export type Result = 1 | -1;
export type Tally = { n: number; plus: number };

const RAD = Math.PI / 180;
const DUST = 1e-12;
/** Float dust to exact values: 6e-17 becomes 0, 1 - 1e-16 becomes 1, -1 + 1e-16 becomes -1. */
const clean = (x: number) => (Math.abs(x) < DUST ? 0 : Math.abs(1 - x) < DUST ? 1 : Math.abs(1 + x) < DUST ? -1 : x);

/** The slider: RY angle in degrees. */
export const MIN_DEG = -180;
export const MAX_DEG = 180;
export const STEP = 15;
/** Every angle the tool can reach. */
export const ANGLES: readonly number[] = Array.from({ length: (MAX_DEG - MIN_DEG) / STEP + 1 }, (_, i) => MIN_DEG + i * STEP);
/** Shots one press of the big button runs, and the most one run can hold. */
export const BATCH = 100;
export const CAP = 1000;
export const OBSERVABLES: readonly Obs[] = ['Z', 'X'];
/** Preset start states: the RY angle that gives each. */
export const PRESETS: readonly [number, string][] = [[0, '|0⟩'], [90, '|+⟩'], [180, '|1⟩'], [-90, '|−⟩']];

// ---- The state

/** Started as 0, then RY(deg): cos(θ/2)|0> + sin(θ/2)|1>. */
export const prepare = (deg: number): State => matVec(RY(deg * RAD), ket0());

/** Name of the state RY(deg) gives, when it has one. RY(-180°) gives -|1>: the same state as |1> up to a global phase. */
export function stateName(deg: number): string | null {
  switch (deg) {
    case 0: return '|0⟩';
    case 90: return '|+⟩';
    case 180: return '|1⟩';
    case -90: return '|−⟩';
    case -180: return '−|1⟩';
    default: return null;
  }
}

// ---- The observable

/** The matrix of each observable, from quantum.ts. */
export const MATRIX: Record<Obs, Matrix> = { Z, X };

/** Eigenvalues and eigenvectors: A|a> = a|a>. Z: +1 for |0>, -1 for |1>. X: +1 for |+>, -1 for |->. */
export const eigen = (o: Obs): [{ value: Result; state: State }, { value: Result; state: State }] =>
  o === 'Z' ? [{ value: 1, state: ket0() }, { value: -1, state: ket1() }] : [{ value: 1, state: plus() }, { value: -1, state: minus() }];

/** Born rule: [chance of +1, chance of -1] = [|<a+|ψ>|², |<a-|ψ>|²]. They add to 1. */
export function odds(s: State, o: Obs): [number, number] {
  const [a, b] = eigen(o);
  return [clean(abs2(inner(a.state, s))), clean(abs2(inner(b.state, s)))];
}

/** <ψ|A|ψ>: the state, the matrix, then the state's bra. A complex number; real when A is Hermitian. */
export const sandwich = (s: State, A: Matrix): C => inner(s, matVec(A, s));

/** Σ value × chance: the average of a random result. */
export const weighted = (values: readonly number[], chances: readonly number[]): number =>
  values.reduce((t, v, i) => t + v * chances[i], 0);

/** The expectation value <A> = <ψ|A|ψ>, by matrices. */
export const expectation = (s: State, o: Obs): number => clean(sandwich(s, MATRIX[o]).re);

/** The spread of one shot: ΔA = sqrt(<A²> - <A>²). For Z and X, A² = I, so ΔA = sqrt(1 - <A>²). */
export function spread(s: State, o: Obs): number {
  const A = MATRIX[o], e = expectation(s, o);
  return clean(Math.sqrt(Math.max(0, sandwich(s, matMul(A, A)).re - e * e)));
}

/** The typical error of an average of n independent shots, its standard deviation ΔA/√n. It halves when n grows four times. */
export const miss = (sd: number, n: number): number => sd / Math.sqrt(n);

// ---- Shots

/** n fresh copies, each measured once: a Born-rule draw of +1 or -1. p = [chance of +1, chance of -1]. */
export const shoot = (p: [number, number], n: number, rand: () => number): Result[] =>
  Array.from({ length: n }, () => (draw(p, rand) === 0 ? 1 : -1));

/** How many shots the next press may add without passing the cap. */
export const room = (total: number, want: number): number => Math.max(0, Math.min(want, CAP - total));

/** Count of shots and how many gave +1. */
export const tally = (shots: readonly Result[]): Tally => ({ n: shots.length, plus: shots.filter((r) => r === 1).length });

/** Average of n shots of which k gave +1: (k·(+1) + (n - k)·(-1))/n = (2k - n)/n. */
export const average = (k: number, n: number): number => (2 * k - n) / n;

/** The average after each shot: entry i is the average of the first i + 1 shots. */
export function runningAverages(shots: readonly Result[]): number[] {
  let sum = 0;
  return shots.map((r, i) => (sum += r) / (i + 1));
}

// ---- Picture layout

/** Shot-axis lengths for the running-average picture: the axis is the smallest one that holds every shot so far. */
export const AXES: readonly number[] = [10, 20, 50, 100, 200, 500, 1000];
export const axisMax = (n: number): number => AXES.find((m) => m >= n) ?? CAP;

/** Grids for the piles of results: the smallest one (columns × rows) that holds the bigger pile. */
export const GRIDS: readonly [number, number][] = [[5, 5], [10, 10], [20, 20], [20, 50]];
export const grid = (count: number): [number, number] => GRIDS.find(([w, h]) => w * h >= count) ?? GRIDS[GRIDS.length - 1];

// ---- Words

/** A number with a true minus sign, rounded to d decimals, trailing zeros dropped, and never "−0". */
export function num(x: number, d: number): string {
  const t = Number(x.toFixed(d)), s = String(Math.abs(t));
  return t < 0 ? `−${s}` : s;
}
/** True when the rounded text of x is x itself, so "=" is honest; else the text needs "≈" or "about". */
export const exact = (x: number, d: number): boolean => Math.abs(Number(x.toFixed(d)) - x) < 1e-12;

/** Odds are shown with 3 decimals and <A> with 2. Over every angle the tool reaches, these never show a real chance as
 *  0 or 1, never show <A> as 0, 1 or -1 when it is not, and the shown odds add to 1 (tested). */
export const ODDS_D = 3;
export const MEAN_D = 2;

/** Degrees with a true minus sign: "−90°". */
export const degText = (deg: number): string => `${num(deg, 0)}°`;

/** The start state in words: "Started as 0, then RY(90°), which gives |+⟩". */
export function startText(deg: number): string {
  const name = stateName(deg);
  return `Started as 0, then RY(${degText(deg)})${name ? `, which gives ${name}` : ''}`;
}

/** The state as a ket: "|ψ⟩ ≈ 0.866|0⟩ + 0.5|1⟩". "=" only when both amplitudes are shown exactly. */
export function ketText(deg: number): string {
  const [a, b] = prepare(deg).map((z) => clean(z.re));
  const term = (x: number, k: string, first: boolean) => {
    if (x === 0) return '';
    const mag = Math.abs(x) === 1 ? '' : num(Math.abs(x), 3);
    return first ? `${x < 0 ? '−' : ''}${mag}${k}` : ` ${x < 0 ? '−' : '+'} ${mag}${k}`;
  };
  const rel = exact(a, 3) && exact(b, 3) ? '=' : '≈';
  return `|ψ⟩ ${rel} ${term(a, '|0⟩', true)}${term(b, '|1⟩', a === 0)}`;
}

/** The exact average as a weighted sum: "⟨Z⟩ = (+1)(0.75) + (−1)(0.25) = 0.5". "≈" wherever a shown number is rounded. */
export function sumText(deg: number, o: Obs): string {
  const s = prepare(deg), [p, q] = odds(s, o), e = expectation(s, o);
  const P = Number(p.toFixed(ODDS_D)), Q = Number(q.toFixed(ODDS_D));
  const rel1 = exact(p, ODDS_D) && exact(q, ODDS_D) ? '=' : '≈';
  const rel2 = exact(P - Q, MEAN_D) && exact(e, MEAN_D) ? '=' : '≈';
  return `⟨${o}⟩ ${rel1} (+1)(${num(p, ODDS_D)}) + (−1)(${num(q, ODDS_D)}) ${rel2} ${num(e, MEAN_D)}`;
}

/** For display: glue each sign to the term after it and each (+1)(p) pair together, so a narrow line breaks only between terms. */
export const keepTerms = (t: string): string => t.replace(/ ([+−≈=]) /g, ' $1\u00a0').replaceAll(')(', ')\u2060(');

/** What +1 and -1 mean for each observable. */
export const meaning = (o: Obs): [string, string] => (o === 'Z' ? ['result 0', 'result 1'] : ['|+⟩', '|−⟩']);

const val = (x: number, d: number) => `${exact(x, d) ? '' : 'about '}${num(x, d)}`;
/** A count with a thousands comma: "1,000". */
export const count = (n: number): string => n.toLocaleString('en-US');

/** The realized error |average − ⟨A⟩| to 3 decimals; never "0" for an error that is not 0. */
export const errText = (err: number): string => (err < 1e-12 ? '0' : err < 0.0005 ? 'under 0.001' : num(err, 3));

/** The readout: what the two pictures show, in words. Odds, <A> and the spread are exact math; counts are the shots so far. */
export function describe(deg: number, o: Obs, t: Tally): string {
  const s = prepare(deg), [p, q] = odds(s, o), e = expectation(s, o), sd = spread(s, o), [m1, m2] = meaning(o);
  const A = `⟨${o}⟩`;
  const head = `${startText(deg)}. Measuring ${o}: +1 (${m1}) has chance ${val(p, ODDS_D)} and −1 (${m2}) has chance ${val(q, ODDS_D)}, so ${A} is ${val(e, MEAN_D)}.`;
  const name = stateName(deg) ?? 'this state';
  const sure = `Every shot gives ${e > 0 ? '+1' : '−1'}, since ${name} is an eigenstate of ${o}`;
  if (t.n === 0) return `${head} Press Run to measure fresh copies.`;
  const neg = t.n - t.plus, avg = average(t.plus, t.n);
  if (t.n === 1) {
    const r = t.plus ? '+1' : '−1';
    return `${head} 1 shot gave ${r}. ${sd === 0 ? `${sure}.` : `One shot gives only +1 or −1, never ${A} itself.`}`;
  }
  const counts = `${count(t.n)} shots: ${count(t.plus)} gave +1 and ${count(neg)} gave −1, so their average is ${val(avg, 3)}.`;
  const full = t.n >= CAP ? ' The run is full.' : '';
  if (sd === 0) return `${head} ${counts} ${sure}, so the average is exactly ${A}.${full}`;
  const w = miss(sd, t.n), err = Math.abs(avg - e), inside = err <= w;
  return `${head} ${counts} Typical error of an average of ${count(t.n)} shots: about ${num(w, 3)} (one standard deviation, the shaded band). Realized error here: ${errText(err)}, so this one is ${inside ? 'inside the band.' : 'outside the band. That is normal: for many shots, about 1 in 3 averages land outside.'}${full}`;
}

/** The slider's spoken value: "60 degrees. Exact average of Z: 0.5". */
export function sliderText(deg: number, o: Obs): string {
  const name = stateName(deg), e = expectation(prepare(deg), o);
  return `${num(deg, 0)} degrees${name ? `, gives ${name}` : ''}. Exact average of ${o}: ${val(e, MEAN_D)}`;
}

/** The band in the running-average picture: <A> ± ΔA/√n, kept inside [-1, 1] where results live. */
export function band(e: number, sd: number, n: number): [number, number] {
  const w = miss(sd, n);
  return [Math.max(-1, e - w), Math.min(1, e + w)];
}

