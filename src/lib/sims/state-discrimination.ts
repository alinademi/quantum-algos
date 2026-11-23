// Telling states apart: guess which of two known qubit states was sent, from one measurement.
// Pure math for the TellApart tool. No DOM.
// Conventions:
// - The two states have real amplitudes: |ψ0> = |0> and |ψ1> = cos γ|0> + sin γ|1>, with γ (gamma) in degrees, 0 to 90.
//   Their overlap is c = |<ψ0|ψ1>| = cos γ. Up to a global phase, any two pure states look like this in a suitable basis.
// - The picture draws real amplitudes as arrows: |0> at 0°, |1> at 90°. Orthogonal states are 90° apart there
//   (on the Bloch sphere they would be opposite). A direction and its opposite are the same state up to a global phase.
// - A measurement is a POVM with three parts, in this order: say ψ0, say ψ1, not sure. The parts are 2x2 positive
//   matrices that sum to I. A qubit in state ψ gives part k with chance <ψ|E_k|ψ>, the Born rule.
// - Unless a prior p0 (the chance that ψ0 is sent) is given, each state is sent half the time.
// Sources: Watrous, Understanding Quantum Information and Computation, General measurements: Discrimination and
//   tomography (Helstrom–Holevo theorem); Watrous, TQI, Theorem 3.4; Barnett and Croke, Adv. Opt. Photon. 1, 238 (2009),
//   arXiv:0810.1970, eq. 12 (Helstrom bound) and eqs. 37 to 40 (unambiguous discrimination, the IDP limit).
import { c, sub, mul, conj, scale, abs, inner, matVec, draw, RY, I, type Matrix, type State } from '../quantum.ts';
import { pct } from '../draw.ts';

export type Strategy = 'best' | 'sure' | 'plain';
/** Which state was sent: 0 for ψ0, 1 for ψ1. */
export type Sent = 0 | 1;
/** What the measurement said: 0 "ψ0", 1 "ψ1", 2 "not sure". */
export type Said = 0 | 1 | 2;
export type Povm = [Matrix, Matrix, Matrix];
export type Odds = { right: number; wrong: number; unsure: number };

const RAD = Math.PI / 180;
const DUST = 1e-12;
/** Float dust to exact values: 6e-17 becomes 0, 1 - 1e-16 becomes 1. */
export const clean = (p: number): number => (Math.abs(p) < DUST ? 0 : Math.abs(1 - p) < DUST ? 1 : p);

/** The slider's range, in degrees. */
export const GAMMA = { min: 0, max: 90, start: 45 } as const;
export const STRATEGIES: readonly Strategy[] = ['best', 'sure', 'plain'];
export const NAMES: Record<Strategy, string> = { best: 'Best guess', sure: 'Never wrong', plain: 'Plain 0 or 1' };

// ---- The two states

/** A real unit vector at angle a degrees in the picture: cos a |0> + sin a |1>. */
export const ray = (a: number): State => [c(Math.cos(a * RAD)), c(Math.sin(a * RAD))];

/** [|ψ0>, |ψ1>] = [|0>, cos γ|0> + sin γ|1>]. */
export const pair = (gamma: number): [State, State] => [ray(0), ray(gamma)];

/** The overlap c = |<ψ0|ψ1>|, from the inner product. It is cos γ. */
export const overlap = (gamma: number): number => {
  const [a, b] = pair(gamma);
  return clean(abs(inner(a, b)));
};

/** Trace distance ½‖ρ0 − ρ1‖₁ of two pure states with overlap c: √(1 − c²). */
export const traceDistance = (k: number): number => Math.sqrt(Math.max(0, 1 - k * k));

// ---- 2x2 helpers

/** w |v><v|: a rank-one positive matrix along v. */
export const proj = (v: State, w = 1): Matrix => v.map((x) => v.map((y) => scale(mul(x, conj(y)), w)));
const ZERO: Matrix = [[c(0), c(0)], [c(0), c(0)]];
const minus = (a: Matrix, b: Matrix): Matrix => a.map((r, i) => r.map((x, j) => sub(x, b[i][j])));

/** Eigenvalues (larger first) and the angle, in degrees, of the larger one's eigenvector of a real symmetric 2x2 matrix.
 *  The angle is null when both eigenvalues are equal, since then every direction is an eigenvector. */
export function eig2(m: Matrix): { hi: number; lo: number; deg: number | null } {
  const a = m[0][0].re, b = m[0][1].re, d = m[1][1].re;
  const mean = (a + d) / 2, r = Math.hypot((a - d) / 2, b);
  return { hi: mean + r, lo: mean - r, deg: r < DUST ? null : Math.atan2(2 * b, a - d) / 2 / RAD };
}

// ---- The three measurements

/** Γ = p0 ρ0 − p1 ρ1, the weighted difference whose eigenvectors give the best measurement (Helstrom). */
export function gammaOp(gamma: number, p0 = 0.5): Matrix {
  const [a, b] = pair(gamma);
  return minus(proj(a, p0), proj(b, 1 - p0));
}

/** Angle, in degrees, of the "say ψ0" direction of the best measurement: the eigenvector of Γ with the larger eigenvalue.
 *  Γ always has one eigenvalue ≥ 0 and one ≤ 0 here. When Γ = 0 (equal priors, same state) every measurement is
 *  equally good; then we use γ/2 − 45°, the limit of the equal-prior answer, so the picture does not jump. */
export function bestAngle(gamma: number, p0 = 0.5): number {
  const { deg } = eig2(gammaOp(gamma, p0));
  return deg ?? gamma / 2 - 45;
}

/** The Helstrom measurement: project onto the "say ψ0" direction or the one at 90° to it. It never says "not sure". */
export function best(gamma: number, p0 = 0.5): Povm {
  const t = bestAngle(gamma, p0);
  return [proj(ray(t)), proj(ray(t + 90)), ZERO];
}

/** The never-wrong measurement for equal priors (Ivanovic, Dieks, Peres). "Say ψ0" lies along the state at 90° to ψ1,
 *  so ψ1 never gives it; "say ψ1" lies along |1>, at 90° to ψ0. Both have weight 1/(1 + c), the most that keeps
 *  "not sure" = I − E0 − E1 positive. */
export function sure(gamma: number): Povm {
  const w = 1 / (1 + overlap(gamma));
  const e0 = proj(ray(gamma - 90), w), e1 = proj(ray(90), w);
  return [e0, e1, minus(minus(I, e0), e1)];
}

/** Measure 0 or 1: 0 means say ψ0, 1 means say ψ1. */
export const plain = (): Povm => [proj(ray(0)), proj(ray(90)), ZERO];

export function povm(s: Strategy, gamma: number): Povm {
  return s === 'best' ? best(gamma) : s === 'sure' ? sure(gamma) : plain();
}

/** Where each part of the measurement points in the picture, in degrees, by construction. Parts that are zero are left out.
 *  "Not sure" of the never-wrong measurement lies along γ/2, halfway between the states. */
export function parts(s: Strategy, gamma: number): { said: Said; deg: number }[] {
  if (s === 'plain') return [{ said: 0, deg: 0 }, { said: 1, deg: 90 }];
  if (s === 'best') { const t = bestAngle(gamma); return [{ said: 0, deg: t }, { said: 1, deg: t + 90 }]; }
  const out: { said: Said; deg: number }[] = [{ said: 0, deg: gamma - 90 }, { said: 1, deg: 90 }];
  if (overlap(gamma) > 0) out.push({ said: 2, deg: gamma / 2 });
  return out;
}

/** The never-wrong measurement as a circuit: a 4x4 unitary on |ψ>|helper 0>, then a measurement of both qubits.
 *  Qubit 0 is the state, qubit 1 the helper (quantum.ts order). U|s>|0> = Σ_k <e_k|s> |k>, with E_k = |e_k><e_k|
 *  and |k> = |00>, |01>, |10> for say ψ0, say ψ1, not sure; |11> never comes up (Naimark). The columns for |00> and |10>
 *  are set by the parts; the other two finish an orthonormal basis (Gram–Schmidt on |01>, |11>, |00>, |10>). */
export function dilation(gamma: number): Matrix {
  const E = sure(gamma);
  // e_k = √(weight) times the part's direction: real, since every part lies in the real plane.
  const e = [0, 1, 2].map((k) => {
    const w = E[k][0][0].re + E[k][1][1].re, p = parts('sure', gamma).find((x) => x.said === k);
    return p ? ray(p.deg).map((x) => x.re * Math.sqrt(w)) : [0, 0];
  });
  const col = (s: 0 | 1) => [e[0][s], e[1][s], e[2][s], 0];
  const cols = [col(0), col(1)];
  for (const i of [1, 3, 0, 2]) {
    if (cols.length === 4) break;
    const v = [0, 0, 0, 0]; v[i] = 1;
    for (const u of cols) { const d = u.reduce((t, x, j) => t + x * v[j], 0); for (let j = 0; j < 4; j++) v[j] -= d * u[j]; }
    const n = Math.hypot(...v);
    if (n > 1e-9) cols.push(v.map((x) => x / n));
  }
  // Input |s>|0> is basis index 2s; inputs |s>|1> (indices 1, 3) take the two new columns.
  const order = [cols[0], cols[2], cols[1], cols[3]];
  return [0, 1, 2, 3].map((r) => order.map((col) => c(col[r])));
}

/** The angle of the RY gate that turns the best basis into 0 and 1, so a standard measurement can follow:
 *  RY(90° − γ) takes the "say ψ0" direction (γ/2 − 45°) to |0> and the "say ψ1" direction to |1>. Equal priors. */
export const bestGate = (gamma: number): number => 90 - gamma;

/** RY(θ) for θ in degrees, from quantum.ts. */
export const ry = (deg: number): Matrix => RY(deg * RAD);

// ---- Born rule

/** Chances of each part for a qubit in state s: <s|E_k|s>. They add to 1. */
export function chances(E: Povm, s: State): [number, number, number] {
  return E.map((e) => clean(inner(s, matVec(e, s)).re)) as [number, number, number];
}

/** table[sent][said]: chance that the measurement says `said` when `sent` was sent. */
export function table(s: Strategy, gamma: number): [[number, number, number], [number, number, number]] {
  const E = povm(s, gamma), [a, b] = pair(gamma);
  return [chances(E, a), chances(E, b)];
}

/** Chance to be right, wrong or not sure, when ψ0 is sent with chance p0. */
export function odds(E: Povm, gamma: number, p0 = 0.5): Odds {
  const [a, b] = pair(gamma), t0 = chances(E, a), t1 = chances(E, b), p1 = 1 - p0;
  return {
    right: clean(p0 * t0[0] + p1 * t1[1]),
    wrong: clean(p0 * t0[1] + p1 * t1[0]),
    unsure: clean(p0 * t0[2] + p1 * t1[2]),
  };
}

export const rates = (s: Strategy, gamma: number): Odds => odds(povm(s, gamma), gamma);

// ---- Closed forms, used to check the matrices above

/** Helstrom bound for two pure states with overlap c and priors p0, 1 − p0: ½(1 + √(1 − 4 p0 p1 c²)). */
export const bestRight = (k: number, p0 = 0.5): number => clean(0.5 * (1 + Math.sqrt(Math.max(0, 1 - 4 * p0 * (1 - p0) * k * k))));

/** Helstrom bound as ½ + ½‖p0ρ0 − p1ρ1‖₁, the sum of |eigenvalues| of Γ. */
export const bestRightTrace = (gamma: number, p0 = 0.5): number => {
  const { hi, lo } = eig2(gammaOp(gamma, p0));
  return clean(0.5 + 0.5 * (Math.abs(hi) + Math.abs(lo)));
};

/** Never wrong, equal priors: names the state with chance 1 − c and says "not sure" with chance c (the IDP limit). */
export const sureRight = (k: number): number => clean(1 - k);

/** Measure 0 or 1, equal priors: ψ0 is always right, ψ1 is right with chance sin²γ. */
export const plainRight = (gamma: number): number => clean(0.5 * (1 + Math.sin(gamma * RAD) ** 2));

/** Equal priors: chance a basis whose "say ψ0" direction sits at angle t is right. ½ − ½ sin γ sin(2t − γ). */
export const basisRight = (gamma: number, t: number): number => clean(0.5 - 0.5 * Math.sin(gamma * RAD) * Math.sin((2 * t - gamma) * RAD));

// ---- Shots

/** Shots in a batch: half send ψ0, half send ψ1, in random order. */
export const BATCH = 400;
export const EACH = BATCH / 2;

/** One shot: which state was sent, and its own uniform draw u, kept while the settings change. */
export type Shot = { sent: Sent; u: number };

/** A batch: EACH copies of ψ0 and EACH of ψ1, shuffled (Fisher–Yates), each with its own draw. */
export function batch(rand: () => number): Shot[] {
  const sent: Sent[] = Array.from({ length: BATCH }, (_, i) => (i < EACH ? 0 : 1));
  for (let i = BATCH - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [sent[i], sent[j]] = [sent[j], sent[i]];
  }
  return sent.map((s) => ({ sent: s, u: rand() }));
}

/** What one shot's measurement says: a Born-rule draw with the shot's own u (inverse CDF, from quantum.ts). */
export const say = (p: [number, number, number], u: number): Said => draw(p, () => u) as Said;

/** counts[sent][said] over the first n shots of a batch. */
export function tally(shots: Shot[], t: [number, number, number][], n = shots.length): number[][] {
  const out = [[0, 0, 0], [0, 0, 0]];
  for (let i = 0; i < n && i < shots.length; i++) out[shots[i].sent][say(t[shots[i].sent], shots[i].u)]++;
  return out;
}

/** Is a cell right, wrong or not sure? */
export const kind = (sent: Sent, said: Said): keyof Odds => (said === 2 ? 'unsure' : said === sent ? 'right' : 'wrong');

/** Right, wrong and not sure counts from a tally. */
export const totals = (n: number[][]): Odds => ({ right: n[0][0] + n[1][1], wrong: n[0][1] + n[1][0], unsure: n[0][2] + n[1][2] });

// ---- Layout

/** Dot grid for a pile of up to n dots in a w by h box: the largest pitch that fits, at most max. */
export function grid(w: number, h: number, n: number, max = 9): { pitch: number; cols: number; rows: number } {
  let bestP = 0, bestC = 1;
  for (let cols = 1; cols <= n; cols++) {
    const p = Math.min(w / cols, h / Math.ceil(n / cols));
    if (p > bestP) { bestP = p; bestC = cols; }
  }
  const pitch = Math.min(bestP, max);
  return { pitch, cols: bestC, rows: Math.ceil(n / bestC) };
}

// ---- Words

/** Percents for two chances that add to 1, so the two texts add to 100%. The first is pct() from draw.ts, which
 *  never shows a real chance as 0% or 100%; the second is its complement. */
export function split(p0: number): [string, string] {
  const a = pct(clean(p0));
  if (a.startsWith('<')) return [a, '>99.9%'];
  if (a.startsWith('>')) return [a, '<0.1%'];
  const v = parseFloat(a);
  return [a, `${a.includes('.') ? (100 - v).toFixed(1) : 100 - v}%`];
}

/** Right, wrong and not sure as percents that add to 100%. Each strategy has at most two nonzero chances. */
export function oddsText(o: Odds): Record<keyof Odds, string> {
  const [r, rest] = split(o.right);
  return o.unsure === 0 ? { right: r, wrong: rest, unsure: '0%' } : o.wrong === 0 ? { right: r, wrong: '0%', unsure: rest } : (() => {
    const [w] = split(o.wrong), [u] = split(o.unsure);
    return { right: r, wrong: w, unsure: u };
  })();
}

/** A number from 0 to 1 as text: exact 0 and 1 as "0" and "1", else two places, or four when two would show 1.00.
 *  0.866 -> "0.87", cos 1° -> "0.9998". */
export const num = (x: number): string => {
  const v = clean(x);
  return v === 0 ? '0' : v === 1 ? '1' : v > 0.995 ? v.toFixed(4) : v.toFixed(2);
};

/** |ψ1> as text: "|0⟩" at 0°, "|1⟩" at 90°, else "0.71|0⟩ + 0.71|1⟩", with "(that is |+⟩)" at 45°. */
export function psi1Text(gamma: number): string {
  if (gamma === 0) return '|0⟩';
  if (gamma === 90) return '|1⟩';
  const t = `${num(Math.cos(gamma * RAD))}|0⟩ + ${num(Math.sin(gamma * RAD))}|1⟩`;
  return gamma === 45 ? `${t}, which is |+⟩` : t;
}

/** One line on how a circuit does this measurement. */
export function recipeText(s: Strategy, gamma: number): string {
  if (s === 'plain') return 'In a circuit: no gate, just the standard measurement. 0 means say |ψ₀⟩, 1 means say |ψ₁⟩.';
  if (s === 'sure') return 'This measurement has three outcomes, so it is not a measurement in a basis: it is a POVM. A circuit builds it with one helper qubit, a gate on both qubits, then a measurement of both.';
  const g = bestGate(gamma);
  if (gamma === 0) return 'In a circuit: here every measurement does equally well. The tool uses an RY(90°) gate, then the standard measurement. 0 means say |ψ₀⟩, 1 means say |ψ₁⟩.';
  return g === 0
    ? 'In a circuit: here the best basis is 0 and 1, so no gate is needed, just the standard measurement. 0 means say |ψ₀⟩, 1 means say |ψ₁⟩.'
    : `In a circuit: an RY(${g}°) gate turns the best basis into 0 and 1, then the standard measurement reads it. 0 means say |ψ₀⟩, 1 means say |ψ₁⟩.`;
}

/** The odds of one strategy in words, naming what it does. */
export function strategyText(s: Strategy, gamma: number): string {
  const o = rates(s, gamma), t = oddsText(o), k = overlap(gamma);
  if (s === 'best') {
    if (k === 1) return `Best guess: the states are the same, so no measurement beats a coin flip. Right ${t.right}, wrong ${t.wrong}.`;
    if (k === 0) return `Best guess: the states are orthogonal, so measuring 0 or 1 tells them apart. Right ${t.right}.`;
    return `Best guess (Helstrom): measure in the basis set evenly around the two states. Right ${t.right}, wrong ${t.wrong}, never “not sure”. No measurement is right more often.`;
  }
  if (s === 'sure') {
    if (k === 1) return 'Never wrong: the states are the same, so it says “not sure” every time.';
    if (k === 0) return 'Never wrong: the states are orthogonal, so it names the state every time.';
    return `Never wrong: it names the state ${t.right} of the time and says “not sure” ${t.unsure} of the time, and it is never wrong. No never-wrong measurement names the state more often.`;
  }
  if (k === 1) return `Plain 0 or 1: both states give 0 every time, so it always says |ψ₀⟩. Right ${t.right}, wrong ${t.wrong}.`;
  if (k === 0) return `Plain 0 or 1: here it is the best measurement. Right ${t.right}.`;
  return `Plain 0 or 1: right ${t.right}, wrong ${t.wrong}. A 1 comes only from |ψ₁⟩, so it is never wrong, but a 0 can come from either state. The best guess is right ${split(rates('best', gamma).right)[0]}.`;
}

/** The readout: the start states, the odds, and the batch so far. */
export function describe(s: Strategy, gamma: number, counts: number[][] | null): string {
  const k = overlap(gamma);
  const head = `Each shot started as |ψ₀⟩ = |0⟩ or |ψ₁⟩ = ${psi1Text(gamma)}, each half the time. They are ${gamma}° apart, with overlap ${num(k)}.`;
  if (!counts) return `${head} ${strategyText(s, gamma)}`;
  const n = totals(counts), all = n.right + n.wrong + n.unsure;
  return `${head} ${strategyText(s, gamma)} This batch of ${all} shots: ${n.right} right, ${n.wrong} wrong, ${n.unsure} not sure.`;
}

/** Slider value text: the angle and the overlap. */
export const valueText = (gamma: number): string => `${gamma} ${gamma === 1 ? 'degree' : 'degrees'}, overlap ${num(overlap(gamma))}`;
