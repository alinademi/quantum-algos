// Mixed states: plain odds over quantum states, next to a superposition. Pure math for the ThreeRecipes tool. No DOM.
// Sources: Aaronson, Introduction to Quantum Information Science, Lecture 6.1 (mixed states, density matrices, and the
// even mixes of {|0>, |1>} and {|+>, |->} giving the same I/2); Watrous, Understanding Quantum Information and
// Computation, "Convex combinations of density matrices"; de Wolf, Quantum Computing lecture notes, 15.1.
// Model, ideal noise-free qubits:
// - psi+-(p) = sqrt(1 - p)|0> +- sqrt(p)|1>, real amplitudes. p is the chance of 1 in the 0/1 test, for every recipe.
// - Three recipes, each an ensemble: plain odds over pure states.
//     'super':  psi+(p) for sure. Started as 0, then RY(theta) with sin^2(theta/2) = p. At p = 1/2 this is |+>, which a
//               Hadamard gate also makes from |0>; at p = 1 it is |1>, which an X gate also makes.
//     'coin01': |0> with chance 1 - p, |1> with chance p. Started as 0, then a coin decides on an X gate.
//     'sign':   psi+(p) or psi-(p), chance 1/2 each. Made like 'super', then a fair coin decides on a Z gate (Z psi+ = psi-).
// - Three tests, each some gates and then a standard 0/1 measurement: 'z' no gate; 'x' H; 'y' S-dagger, then H.
//   H|+> = |0> and H S-dagger|+i> = |0>, so result 0 means 0, + or +i.
// - A recipe's odds are plain odds times Born rule odds: Pr(0) = sum_i p_i |<0|U|psi_i>|^2 = <0|U rho U-dagger|0>, with
//   rho = sum_i p_i |psi_i><psi_i| (Aaronson eq. 6.1, 6.7). Two recipes with the same rho give the same odds in every test.
//   'coin01' and 'sign' both have rho = diag(1 - p, p); 'super' has the extra off-diagonal sqrt(p(1 - p)).
import { c, add, mul, conj, scale, abs2, inner, matVec, dagger, probs, draw, bloch, fromBloch, ket0, ket1, H, S, type State, type Matrix } from '../quantum.ts';

export type Recipe = 'super' | 'coin01' | 'sign';
export type Test = 'z' | 'x' | 'y';
export type Bit = 0 | 1;
export type Vec3 = [number, number, number];
/** A mixed state as its recipe: plain odds over pure states. */
export type Ensemble = { odds: number; state: State }[];

export const RECIPES: readonly Recipe[] = ['super', 'coin01', 'sign'];
export const TESTS: readonly Test[] = ['z', 'x', 'y'];
/** Shots one box holds. */
export const CAP = 100;

// Float dust: H|+> gives an amplitude like 1.0000000000000002 where the exact value is 1. Below this a gap is 0.
const DUST = 1e-12;
const clean = (x: number) => (Math.abs(x) < DUST ? 0 : Math.abs(1 - x) < DUST ? 1 : x);
const clamp01 = (p: number) => Math.max(0, Math.min(1, p));
const isHalf = (p: number) => Math.abs(p - 0.5) < DUST;

/** p from the slider (whole percent, 0 to 100) as a chance. */
export const fromPercent = (n: number): number => clamp01(Math.round(n) / 100);

// ---- The recipes

/** psi+(p) = sqrt(1 - p)|0> + sqrt(p)|1>, or psi-(p) with a minus sign, p clamped to [0, 1]. */
export function psi(p: number, sign: 1 | -1 = 1): State {
  const q = clamp01(p);
  return [c(Math.sqrt(1 - q)), c(sign * Math.sqrt(q))];
}

/** The plain odds over pure states that each recipe makes. */
export function ensemble(r: Recipe, p: number): Ensemble {
  const q = clamp01(p);
  if (r === 'super') return [{ odds: 1, state: psi(q, 1) }];
  if (r === 'coin01') return [{ odds: 1 - q, state: ket0() }, { odds: q, state: ket1() }];
  return [{ odds: 0.5, state: psi(q, 1) }, { odds: 0.5, state: psi(q, -1) }];
}

/** The density matrix rho = sum_i p_i |psi_i><psi_i|. Entry [j][k] is sum_i p_i a_j conj(a_k). */
export function rho(r: Recipe, p: number): Matrix {
  const m: Matrix = [[c(0), c(0)], [c(0), c(0)]];
  for (const { odds: w, state: s } of ensemble(r, p))
    for (let j = 0; j < 2; j++) for (let k = 0; k < 2; k++) m[j][k] = add(m[j][k], scale(mul(s[j], conj(s[k])), w));
  return m;
}

/** The average Bloch vector sum_i p_i r_i. rho = (I + xX + yY + zZ)/2 with (x, y, z) this vector. */
export function blochOf(r: Recipe, p: number): Vec3 {
  const v: Vec3 = [0, 0, 0];
  for (const { odds: w, state } of ensemble(r, p)) bloch(state).forEach((x, i) => { v[i] += w * x; });
  return v.map(clean) as Vec3;
}

// ---- The tests

const SDG = dagger(S);
/** The gates before the final 0/1 measurement, in the order applied. */
export const gatesFor = (t: Test): Matrix[] => (t === 'z' ? [] : t === 'x' ? [H] : [SDG, H]);

/** The state the final measurement sees in test t. */
export const inTest = (s: State, t: Test): State => gatesFor(t).reduce((v, g) => matVec(g, v), s);

/** The Bloch axis each test asks about: the state that gives result 0 for sure (|0>, |+>, |+i>). */
export const AXIS: Record<Test, Vec3> = { z: [0, 0, 1], x: [1, 0, 0], y: [0, 1, 0] };

/** Born rule odds [P(0), P(1)] for one pure state in test t. Sum to 1. */
export function pureOdds(s: State, t: Test): [number, number] {
  const [a, b] = probs(inTest(s, t));
  return [clean(a), clean(b)];
}

/** Odds [P(0), P(1)] for a fresh qubit from recipe r in test t: plain odds over the coin's picks, Born rule within each. */
export function odds(r: Recipe, p: number, t: Test): [number, number] {
  let a = 0, b = 0;
  for (const { odds: w, state } of ensemble(r, p)) { const [x, y] = pureOdds(state, t); a += w * x; b += w * y; }
  return [clean(a), clean(b)];
}

/** Chance of result 0 (0, + or +i) for recipe r in test t. */
export const chance0 = (r: Recipe, p: number, t: Test): number => odds(r, p, t)[0];

/**
 * Closed forms, checked against the Born rule in the tests. Pr(0) = (1 + r . axis)/2 with r the average Bloch vector.
 * 0/1 test: 1 - p for all three. +/- test: 1/2 + sqrt(p(1 - p)) for 'super'; 1/2 for both coins, whose picks give
 * 1/2 each ('coin01') or 1/2 +- sqrt(p(1 - p)) ('sign'). +i/-i test: 1/2 for all, since every amplitude is real.
 */
export function chance0Formula(r: Recipe, p: number, t: Test): number {
  const q = clamp01(p);
  if (t === 'z') return 1 - q;
  if (t === 'x' && r === 'super') return 0.5 + Math.sqrt(q * (1 - q));
  return 0.5;
}

/** Chance that a measurement along any Bloch axis (theta, phi) finds the state fromBloch(theta, phi). */
export function chanceAlong(r: Recipe, p: number, theta: number, phi: number): number {
  const b = fromBloch(theta, phi);
  return clean(ensemble(r, p).reduce((t, { odds: w, state }) => t + w * abs2(inner(b, state)), 0));
}

/** True when recipes a and b give the same odds in test t. */
export const sameIn = (a: Recipe, b: Recipe, p: number, t: Test): boolean => Math.abs(chance0(a, p, t) - chance0(b, p, t)) < DUST;

/** Tests whose odds differ for a and b: each one, a gate and then a measurement, can tell them apart given enough shots. */
export const tellApart = (a: Recipe, b: Recipe, p: number): Test[] => TESTS.filter((t) => !sameIn(a, b, p, t));

/**
 * True when no measurement at all tells a from b. For one qubit the three tests fix the average Bloch vector, so they
 * fix rho and with it every other test: same odds in all three means the same odds everywhere.
 */
export const alike = (a: Recipe, b: Recipe, p: number): boolean => tellApart(a, b, p).length === 0;

// ---- Shots

/**
 * One fresh qubit from recipe r, sent through test t. For a coin recipe the coin picks a pure state first (plain odds),
 * then one Born rule draw for that state gives the result.
 */
export function shoot(r: Recipe, p: number, t: Test, rand: () => number): Bit {
  const e = ensemble(r, p);
  const s = e.length === 1 ? e[0].state : e[draw(e.map((x) => x.odds), rand)].state;
  return draw(pureOdds(s, t), rand) as Bit;
}

/** Shots per box (every box has the same number) and how many gave 0 in each. */
export type Tally = { shots: number; zeros: Record<Recipe, Record<Test, number>> };

/** Count the results in each box. Boxes are filled together, so all hold the same number of shots. */
export function tally(results: Record<Recipe, Record<Test, readonly Bit[]>>): Tally {
  const zeros = {} as Tally['zeros'];
  for (const r of RECIPES) {
    zeros[r] = { z: 0, x: 0, y: 0 };
    for (const t of TESTS) zeros[r][t] = results[r][t].filter((b) => b === 0).length;
  }
  return { shots: results.super.z.length, zeros };
}

/** A tally with no shots. */
export const empty = (): Tally => tally({ super: { z: [], x: [], y: [] }, coin01: { z: [], x: [], y: [] }, sign: { z: [], x: [], y: [] } });

// ---- Words and numbers the tool shows

/** Short recipe names. */
export const NAME: Record<Recipe, string> = { super: 'Superposition', coin01: 'Coin over 0 and 1', sign: 'Coin over the sign' };

/** Test names, what result 0 means, and how each test is done. */
export const TEST_NAME: Record<Test, string> = { z: '0/1 test', x: '+/− test', y: '+i/−i test' };
export const ZERO: Record<Test, string> = { z: '0', x: '+', y: '+i' };
export const TEST_HOW: Record<Test, string> = {
  z: 'Measure. Result 0 or 1.',
  x: 'A Hadamard gate, then measure. Result 0 means +, 1 means −.',
  y: 'An S† gate, then a Hadamard gate, then measure. Result 0 means +i, 1 means −i.',
};

/** Each test in a few words, for verdicts. */
const DONE_BY: Record<Test, string> = { z: 'a measurement alone', x: 'a Hadamard gate, then a measurement', y: 'an S† gate and a Hadamard gate, then a measurement' };

/** A chance as a whole percent. A real chance never shows as 0% or 100%: it says "under 1%" or "over 99%". */
export function percent(x: number): string {
  if (x <= DUST) return '0%';
  if (x >= 1 - DUST) return '100%';
  if (x < 0.01) return 'under 1%';
  if (x > 0.99) return 'over 99%';
  // The nudge undoes float error, so 0.625 computed as 0.62499999... still shows 63%.
  return `${Math.round(x * 100 + 1e-9)}%`;
}

/** A real amplitude: "0", "1", or two decimals ("0.87"). */
export function amp(x: number): string {
  if (Math.abs(x) < DUST) return '0';
  if (Math.abs(1 - x) < DUST) return '1';
  return x.toFixed(2);
}

/** psi+(p) or psi-(p) as a ket: "|0⟩", "|1⟩", "−|1⟩", "|+⟩", "|−⟩", or "0.87|0⟩ + 0.50|1⟩". */
export function psiKet(p: number, sign: 1 | -1 = 1): string {
  const q = clamp01(p);
  if (q < DUST) return '|0⟩';
  if (q > 1 - DUST) return sign > 0 ? '|1⟩' : '−|1⟩';
  if (isHalf(q)) return sign > 0 ? '|+⟩' : '|−⟩';
  return `${amp(Math.sqrt(1 - q))}|0⟩ ${sign > 0 ? '+' : '−'} ${amp(Math.sqrt(q))}|1⟩`;
}

/** The gate that makes the superposition from 0: none, a Hadamard gate, an X gate, or an RY gate. */
function gate(p: number): string {
  const q = clamp01(p);
  if (q < DUST) return '';
  if (q > 1 - DUST) return 'an X gate';
  return isHalf(q) ? 'a Hadamard gate' : 'an RY gate';
}

/** How each recipe makes its qubit, from the start state, and the state or states it ends in. */
export function recipeText(r: Recipe, p: number): string {
  const q = clamp01(p), g = gate(q);
  if (r === 'super') {
    if (q < DUST) return 'Started as 0, with no gate: |0⟩. At this p it is not a superposition.';
    if (q > 1 - DUST) return `Started as 0, then ${g}: |1⟩. At this p it is not a superposition.`;
    if (isHalf(q)) return `Started as 0, then ${g}: |+⟩ = (|0⟩ + |1⟩)/√2, equal amplitudes for 0 and 1.`;
    return `Started as 0, then ${g}: ${psiKet(q)}, amplitude ${amp(Math.sqrt(1 - q))} for 0 and ${amp(Math.sqrt(q))} for 1.`;
  }
  if (r === 'coin01') {
    if (q < DUST) return 'Started as 0, and the coin never calls for the X gate: |0⟩ every time.';
    if (q > 1 - DUST) return 'Started as 0, and the coin always calls for the X gate: |1⟩ every time.';
    if (isHalf(q)) return 'Started as 0, then a fair coin decides on an X gate: |0⟩ or |1⟩, plain odds 50% each.';
    return `Started as 0, then a coin decides on an X gate: |0⟩ with chance ${percent(1 - q)} or |1⟩ with chance ${percent(q)}. Plain odds.`;
  }
  if (q < DUST) return 'Started as 0, then a fair coin decides on a Z gate, which flips the sign of the 1 part. There is no 1 part, so it is |0⟩ either way.';
  const head = `Started as 0, then ${g}, then a fair coin decides on a Z gate, which flips the sign of the 1 part`;
  if (q > 1 - DUST) return `${head}: |1⟩ or −|1⟩, which differ only by a global phase. The same state.`;
  return `${head}: ${psiKet(q, 1)} or ${psiKet(q, -1)}, plain odds 50% each.`;
}

/** The recipe in a few words, for the readout. */
export function recipeShort(r: Recipe, p: number): string {
  const q = clamp01(p);
  if (r === 'super') return q < DUST ? 'started as 0, no gate: |0⟩' : `started as 0, then ${gate(q)}: ${psiKet(q)}`;
  if (r === 'coin01') {
    if (q < DUST || q > 1 - DUST) return `always ${psiKet(q)}`;
    return isHalf(q) ? 'a fair coin picks |0⟩ or |1⟩' : `a coin picks |0⟩ or |1⟩ with odds ${percent(1 - q)} and ${percent(q)}`;
  }
  if (q < DUST) return 'always |0⟩';
  if (q > 1 - DUST) return 'a fair coin picks |1⟩ or −|1⟩, the same state';
  return `a fair coin picks ${psiKet(q, 1)} or ${psiKet(q, -1)}`;
}

/** Verdicts from the Born rule odds: which test tells the superposition from the coins, and whether anything tells the coins apart. */
export function verdict(p: number): string {
  const q = clamp01(p), out: string[] = [];
  const vsA = tellApart('super', 'coin01', q), vsB = tellApart('super', 'sign', q);
  if (!vsA.length && !vsB.length && alike('coin01', 'sign', q)) return `At p = ${percent(q)} all three recipes make ${psiKet(q)}, so no test tells them apart.`;
  for (const t of vsA.filter((t) => vsB.includes(t))) {
    const a = chance0('super', q, t), b = chance0('coin01', q, t);
    out.push(`The ${TEST_NAME[t]} (${DONE_BY[t]}) tells ${psiKet(q)} from both coins: ${ZERO[t]} comes up with chance ${percent(a)} against ${percent(b)}.`);
  }
  const blind = TESTS.filter((t) => !vsA.includes(t) && !vsB.includes(t));
  if (blind.length) out.push(`The ${blind.map((t) => TEST_NAME[t].replace(' test', '')).join(' and ')} test${blind.length > 1 ? 's' : ''} cannot.`);
  if (alike('coin01', 'sign', q)) out.push('The two coins give the same odds in all three tests, and for one qubit these three fix the odds of every test: no measurement tells the two coins apart.');
  return out.join(' ');
}

/** What the readout says: p, each recipe's counts against the Born rule, and the verdicts. */
export function readout(p: number, x: Tally): string {
  const q = clamp01(p), n = x.shots;
  const head = n ? `p = ${percent(q)}, ${n} shot${n === 1 ? '' : 's'} in each box.` : `p = ${percent(q)}.`;
  const lines = RECIPES.map((r) => {
    const e = TESTS.map((t) => percent(chance0(r, q, t)));
    const born = e.every((v) => v === e[0]) ? `${e[0]} each` : e.join(', ');
    const body = n
      ? `gave 0 in ${x.zeros[r].z}, + in ${x.zeros[r].x}, +i in ${x.zeros[r].y}; chance ${born}`
      : `chance of 0, + and +i: ${born}`;
    return `${NAME[r]} (${recipeShort(r, q)}) ${n ? body : `has ${body}`}.`;
  });
  let txt = `${head} ${lines.join(' ')} ${verdict(q)}`;
  if (!n) return `${txt} Press Run to measure.`;
  if (alike('coin01', 'sign', q) && TESTS.some((t) => x.zeros.coin01[t] !== x.zeros.sign[t])) txt += " The gaps between the two coins' counts are chance.";
  if (n >= CAP) txt += ' The boxes are full. Press Clear to start again.';
  return txt;
}

/** The slider's spoken value. */
export const valueText = (p: number): string => `${percent(clamp01(p))} chance of 1 in the 0/1 test`;
