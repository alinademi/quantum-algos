// Entanglement: two-qubit pairs, the split test, and two agreement tests. Pure math for the LinkedPairs tool. No DOM.
// Conventions (from quantum.ts): qubit 0 is A, qubit 1 is B, and A's bit is written first: |jk> has amplitude s[2j + k].
// - The quantum pair: sqrt(1 - p)|00> + sqrt(p)|11>. At p = 1/2 it is the Bell pair (|00> + |11>)/sqrt2.
// - The coin pair: plain odds, not amplitudes. A coin picks |00> (chance 1 - p) or |11> (chance p). Each pick has one
//   state per qubit, so the pair is not entangled: it is a mix of product states, linked only by the shared coin.
// - Two tests. '01': measure both qubits. 'pm': a Hadamard gate on each qubit, then measure. Since H|+> = |0> and
//   H|-> = |1>, the 'pm' test asks each qubit "+ or -?" (result 0 means +, 1 means -).
// - Split test (Zwiebach, MIT 8.05 notes, Tensor products, section 2): a two-qubit state is a product |a>|b> exactly
//   when psi00 psi11 - psi01 psi10 = 0. Otherwise it is entangled (Watrous, Multiple systems: Entangled states).
// - Score: P(agree in '01') + P(agree in 'pm'). No unentangled pair can score over 3/2 (proof at UNENTANGLED_MAX).
import { c, abs, abs2, mul, sub, scale, conj, apply1, basis, probs, draw, H, type C, type State } from '../quantum.ts';

export type Source = 'quantum' | 'coin';
export type Test = '01' | 'pm';
export type Bit = 0 | 1;
export type Pair = [Bit, Bit];

export const TESTS: readonly Test[] = ['01', 'pm'];
/** Pairs one test panel holds. */
export const CAP = 100;

// Float dust: H then H gives amplitudes like 1e-17 where the exact value is 0. Below this we call a number 0.
const DUST = 1e-12;
const clean = (x: number) => (Math.abs(x) < DUST ? 0 : Math.abs(1 - x) < DUST ? 1 : x);
const clamp01 = (p: number) => Math.max(0, Math.min(1, p));

/**
 * The most an unentangled pair can score: P(agree, 0/1 test) + P(agree, +/- test) <= 3/2.
 * Proof. Write E = P(agree) - P(disagree) = <Z (x) Z> or <X (x) X>, so P(agree) = (1 + E) / 2 and
 * score = 1 + (<ZZ> + <XX>) / 2. For a product |a>|b> the expectations factor: <ZZ> + <XX> = z_a z_b + x_a x_b,
 * with (x, y, z) each qubit's Bloch vector. By Cauchy-Schwarz this is at most |r_a| |r_b| <= 1. A mix of product
 * states (plain odds over them) averages this, so it stays <= 1, and the score stays <= 3/2.
 * |0>|0> and |+>|+> reach it. The Bell pair has <ZZ> = <XX> = 1 and scores 2.
 */
export const UNENTANGLED_MAX = 1.5;

// ---- The pairs

/** The quantum pair sqrt(1 - p)|00> + sqrt(p)|11>, real amplitudes, p clamped to [0, 1]. */
export function pairState(p: number): State {
  const q = clamp01(p);
  return [c(Math.sqrt(1 - q)), c(0), c(0), c(Math.sqrt(q))];
}

/** The two states the coin can pick: |00> and |11>. */
export const coinPicks = (): [State, State] => [basis(2, 0), basis(2, 3)];

/** Plain odds of the coin's picks: [P(|00>), P(|11>)] = [1 - p, p]. */
export const coinOdds = (p: number): [number, number] => [1 - clamp01(p), clamp01(p)];

// ---- The split test

/** psi00 psi11 - psi01 psi10. Zero exactly when the state splits into one state per qubit. */
export const splitGap = (s: State): C => sub(mul(s[0], s[3]), mul(s[1], s[2]));

/** True when the state is a product |a>|b> (up to float dust). */
export const splits = (s: State): boolean => abs(splitGap(s)) < DUST;

/**
 * One state per qubit, [a, b] with a (x) b = s, or null when s is entangled. Zwiebach (2.44)-(2.49):
 * in a product psi_jk = a_j b_k, so row j of the amplitude table is a_j times b, and column k is b_k times a.
 * Take the row and column through the largest amplitude, normalize both, and give a the phase left over.
 */
export function factor(s: State): [State, State] | null {
  if (!splits(s)) return null;
  let m = 0;
  for (let i = 1; i < 4; i++) if (abs2(s[i]) > abs2(s[m])) m = i;
  const j = m >> 1, k = m & 1;
  const unit = (v: State) => { const n = Math.sqrt(abs2(v[0]) + abs2(v[1])); return v.map((x) => scale(x, 1 / n)); };
  const b = unit([s[2 * j], s[2 * j + 1]]), a = unit([s[k], s[2 + k]]);
  // s[m] = lambda a_j b_k, and |lambda| = 1 for a unit s. lambda = s[m] conj(a_j b_k) / |a_j b_k|^2.
  const ab = mul(a[j], b[k]), lambda = scale(mul(s[m], conj(ab)), 1 / abs2(ab));
  return [a.map((x) => mul(lambda, x)), b];
}

// ---- The tests

/** A Hadamard gate on each qubit. */
export const turnBoth = (s: State): State => apply1(apply1(s, H, 0, 2), H, 1, 2);

/** The state that the final 0/1 measurement sees in test t. */
export const inTest = (s: State, t: Test): State => (t === 'pm' ? turnBoth(s) : s);

/** Born rule odds of the four results 00, 01, 10, 11 (A's bit first) for one pure state in test t. Sum to 1. */
export const pureOdds = (s: State, t: Test): number[] => probs(inTest(s, t)).map(clean);

/**
 * Odds of 00, 01, 10, 11 for one pair from the source. The coin pair's odds are plain odds over its picks:
 * (1 - p) times the odds for |00> plus p times the odds for |11>.
 */
export function odds(src: Source, p: number, t: Test): number[] {
  if (src === 'quantum') return pureOdds(pairState(p), t);
  const [q0, q1] = coinOdds(p), [s0, s1] = coinPicks(), a = pureOdds(s0, t), b = pureOdds(s1, t);
  return a.map((x, i) => clean(q0 * x + q1 * b[i]));
}

/** Chance the two results agree (00 or 11). */
export const agreeOf = (o: readonly number[]): number => clean(o[0] + o[3]);

/** Chance a pair from the source agrees in test t. */
export const agreeChance = (src: Source, p: number, t: Test): number => agreeOf(odds(src, p, t));

/** The score: chance of agreeing in the 0/1 test plus chance of agreeing in the +/- test. */
export const score = (src: Source, p: number): number => agreeChance(src, p, '01') + agreeChance(src, p, 'pm');

/**
 * Closed forms (checked against the Born rule in the tests).
 * 0/1 test: both sources give only 00 or 11, so they always agree.
 * +/- test: quantum pair 1/2 + sqrt(p(1 - p)); coin pair 1/2, since H on each qubit of |00> or |11> gives 50/50 each.
 */
export const agreeFormula = (src: Source, p: number, t: Test): number =>
  t === '01' ? 1 : src === 'quantum' ? 0.5 + Math.sqrt(clamp01(p) * (1 - clamp01(p))) : 0.5;

/** True when the pair the source makes is entangled: only the quantum pair with 0 < p < 1. */
export const entangled = (src: Source, p: number): boolean => src === 'quantum' && !splits(pairState(p));

// ---- Shots

/** Bits of result index i: [A, B]. */
export const bitsOf = (i: number): Pair => [(i >> 1) as Bit, (i & 1) as Bit];

/**
 * Make one pair and measure it in test t. The quantum pair: one Born rule draw over its four results.
 * The coin pair: first the coin picks |00> or |11> (plain odds), then one Born rule draw for the state it picked.
 */
export function shoot(src: Source, p: number, t: Test, rand: () => number): Pair {
  const s = src === 'quantum' ? pairState(p) : coinPicks()[rand() < clamp01(p) ? 1 : 0];
  return bitsOf(draw(pureOdds(s, t), rand));
}

/** Which test the n-th pair (from 0) goes to: they take turns, 0/1 first. */
export const testFor = (n: number): Test => (n % 2 === 0 ? '01' : 'pm');

export type Tally = { pairs: number; agreed: number; counts: [number, number, number, number] };

/** Count pairs, agreements, and each result 00, 01, 10, 11. */
export function tally(pairs: readonly Pair[]): Tally {
  const t: Tally = { pairs: pairs.length, agreed: 0, counts: [0, 0, 0, 0] };
  for (const [a, b] of pairs) { t.counts[2 * a + b]++; if (a === b) t.agreed++; }
  return t;
}

// ---- Words and numbers the tool shows

/** p from the slider (whole percent, 0 to 100) as a chance. */
export const fromPercent = (n: number): number => clamp01(Math.round(n) / 100);

/** A real amplitude: "0", "1", or two decimals ("0.71"). */
export function amp(x: number): string {
  if (Math.abs(x) < DUST) return '0';
  if (Math.abs(1 - x) < DUST) return '1';
  return x.toFixed(2);
}

/** True when amp(x) shows x exactly. */
const shownExactly = (x: number) => Math.abs(x - Number(amp(x))) < 1e-9;

/** A chance as a whole percent. A real chance never shows as 0% or 100%: it says "under 1%" or "over 99%". */
export function percent(p: number): string {
  if (p <= DUST) return '0%';
  if (p >= 1 - DUST) return '100%';
  if (p < 0.01) return 'under 1%';
  if (p > 0.99) return 'over 99%';
  // The nudge undoes float error, so 0.625 computed as 0.62499999... still shows 63%.
  return `${Math.round(p * 100 + 1e-9)}%`;
}

/** A score (0 to 2) as a percent. A score just over 150% never shows as "150%". */
export function scoreText(x: number): string {
  const r = Math.round(x * 100 + 1e-9);
  if (r === 150 && x > UNENTANGLED_MAX + DUST) return 'just over 150%';
  if (r === 150 && x < UNENTANGLED_MAX - DUST) return 'just under 150%';
  return `${r}%`;
}

/** Measured agreement as a whole percent of the pairs, or a dash before any pair. */
export const measured = (t: Tally): string => (t.pairs ? `${Math.round((100 * t.agreed) / t.pairs)}%` : '–');

/** One qubit's ket: "|0⟩", "|1⟩", or "0.60|0⟩ + 0.80|1⟩" (real amplitudes, the tool's only kind). */
export function oneKet(q: State): string {
  if (Math.abs(q[1].re) < DUST && Math.abs(q[1].im) < DUST) return '|0⟩';
  if (Math.abs(q[0].re) < DUST && Math.abs(q[0].im) < DUST) return '|1⟩';
  const b = q[1].re;
  return `${amp(q[0].re)}|0⟩ ${b < 0 ? '−' : '+'} ${amp(Math.abs(b))}|1⟩`;
}

/** The quantum pair as a ket: "|00⟩", "(|00⟩ + |11⟩)/√2", or "0.87|00⟩ + 0.50|11⟩". */
export function pairKet(p: number): string {
  const s = pairState(p), a = s[0].re, b = s[3].re;
  if (b < DUST) return '|00⟩';
  if (a < DUST) return '|11⟩';
  if (Math.abs(a - b) < DUST) return '(|00⟩ + |11⟩)/√2';
  return `${amp(a)}|00⟩ + ${amp(b)}|11⟩`;
}

/** RY angle in degrees that turns A, started as 0, so that a CNOT then makes pairState(p): 2 asin(sqrt p). */
export const turnDegrees = (p: number): number => (2 * Math.asin(Math.sqrt(clamp01(p))) * 180) / Math.PI;

/** How each pair is made, from its start state. At 90° the RY turn does what a Hadamard gate does to 0. */
export function startText(src: Source, p: number): string {
  if (src === 'coin') {
    const [q0, q1] = coinOdds(p);
    if (q1 === 0) return 'Each pair starts as 00: the coin always picks 00';
    if (q0 === 0) return 'Each pair starts as 11: the coin always picks 11';
    return `Each pair starts as 00 or 11, picked by a coin: 00 with chance ${percent(q0)}, 11 with chance ${percent(q1)}`;
  }
  const d = turnDegrees(p);
  if (d < DUST) return 'Started as 00, with no gates';
  if (Math.abs(d - 90) < 1e-9) return 'Started as 00, then a Hadamard gate on A and a CNOT from A to B';
  const deg = Math.abs(d - Math.round(d)) < 1e-9 ? `${Math.round(d)}°` : `about ${d.toFixed(1)}°`;
  return `Started as 00, then an RY gate on A, a turn of the qubit by ${deg}, then a CNOT from A to B`;
}

/** What the source makes, in words, starting from its start state. */
export function sourceText(src: Source, p: number): string {
  const start = `${startText(src, p)}.`;
  if (src === 'coin') return `${start} These are plain odds, not amplitudes.`;
  const s = pairState(p);
  if (Math.abs(s[0].re - s[3].re) < DUST) return `${start} This is the Bell pair: equal amplitudes for 00 and 11, so a 0/1 measurement gives either with equal chance.`;
  if (s[3].re < DUST) return `${start} Amplitude 1 for 00, so the 0/1 test always gives 00.`;
  if (s[0].re < DUST) return `${start} Amplitude 1 for 11, so the 0/1 test always gives 11.`;
  return `${start} Amplitude ${amp(s[0].re)} for 00 and ${amp(s[3].re)} for 11, so a 0/1 measurement gives 00 with chance ${percent(1 - clamp01(p))} and 11 with chance ${percent(clamp01(p))}.`;
}

/** The split test worked out, and its verdict. */
export function splitText(src: Source, p: number): string {
  if (src === 'coin') return 'Each pick, |0⟩|0⟩ or |1⟩|1⟩, already has one state per qubit. The results are linked only by the shared coin, so the pair is not entangled.';
  const s = pairState(p), g = splitGap(s).re;
  const x = s[0].re, y = s[3].re, eq = shownExactly(x) && shownExactly(y) && shownExactly(g) ? '=' : '≈';
  const head = `Split test: amplitude of 00 × amplitude of 11 is ${amp(x)} × ${amp(y)} ${eq} ${amp(g)}, and amplitude of 01 × amplitude of 10 is 0 × 0 = 0.`;
  const f = factor(s);
  if (f) return `${head} Equal, so it splits as ${oneKet(f[0])} for A times ${oneKet(f[1])} for B. Not entangled.`;
  return `${head} Not equal, so no state for A times a state for B makes this pair. Entangled.`;
}

const name = (t: Test) => (t === '01' ? '0/1 test' : '+/− test');

/** What the readout says: the source, each test's agreement against the Born rule, and the score against 150%. */
export function readout(src: Source, p: number, t01: Tally, tpm: Tally): string {
  const title = src === 'coin' ? 'Coin pair' : pairKet(p) === '(|00⟩ + |11⟩)/√2' ? 'Bell pair' : `Quantum pair ${pairKet(p)}`;
  const who = `${title}. ${startText(src, p)}`;
  const e01 = agreeChance(src, p, '01'), epm = agreeChance(src, p, 'pm'), e = score(src, p);
  const born = `Born rule: ${percent(e01)} + ${percent(epm)} = ${scoreText(e)}`;
  const verdict = e > UNENTANGLED_MAX + DUST
    ? 'Over 150%, which no unentangled pair can reach: this pair is entangled.'
    : 'Not over 150%, the most any unentangled pair can reach.';
  if (!t01.pairs && !tpm.pairs) return `${who}. ${born}. ${verdict} Press a Make button to measure pairs.`;
  const part = (t: Test, x: Tally) => (x.pairs ? `${name(t)}: ${x.agreed} of ${x.pairs} agreed` : `${name(t)}: no pairs yet`);
  let txt = `${who}. ${part('01', t01)}. ${part('pm', tpm)}.`;
  if (t01.pairs && tpm.pairs) {
    const m = t01.agreed / t01.pairs + tpm.agreed / tpm.pairs;
    txt += ` Measured score: ${measured(t01)} + ${measured(tpm)} = ${Math.round(m * 100)}%. ${born}. ${verdict}`;
    if (e <= UNENTANGLED_MAX + DUST && m > UNENTANGLED_MAX + DUST) txt += ' Going over 150% here is luck in a small batch; more pairs bring the score closer to the Born rule value.';
  } else txt += ` ${born}.`;
  if (t01.pairs >= CAP && tpm.pairs >= CAP) txt += ' Both panels are full. Press Clear to start again.';
  return txt;
}
