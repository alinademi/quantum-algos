// Purification: the pure math behind the HiddenPartner tool. No DOM.
// Sources: Watrous, Understanding Quantum Information and Computation, "Purifications" (definition, existence, the
// theorem on unitary equivalence of purifications, and the Hughston-Jozsa-Wootters theorem); Nielsen and Chuang 2.5
// and Exercise 2.81; Preskill ch. 2.
// Conventions (as in quantum.ts):
// - Two qubits. A is qubit 0, the partner R is qubit 1. Index i = 2a + r: in |ar> A's bit is on the left.
// - A's own state is plain odds along 0/1: rho_A = diag(l0, l1), l0 = chance of 0, l0 >= 1/2, l1 = 1 - l0.
//   (Any rho_A has such a basis; the tool fixes it as 0/1. The tool says so.)
// - Purification, built from the spectral form: |psi> = sqrt(l0)|00> + sqrt(l1)|11>.
//   tr_R |psi><psi| = rho_A by the definition of the partial trace (the two R kets are orthonormal).
// - Another purification of the same rho_A: (I x RY(alpha)) |psi>, a gate on the partner alone. RY(alpha) is a real turn,
//   RY(alpha)|0> = c|0> + s|1>, RY(alpha)|1> = -s|0> + c|1>, with c = cos(alpha/2), s = sin(alpha/2). The tool only
//   reaches these (real amplitudes). Every purification on a qubit partner is (I x U)|psi> for some unitary U (Watrous),
//   and a U with phases would leave this circle of the Bloch sphere.
// - Measure the partner in 0/1 after that gate. Outcome k has chance p_k = |<k|_R (I x RY)|psi>|^2 and leaves A in
//   |phi_k> = <k|_R |psi_alpha> / sqrt(p_k):
//     k = 0:  p0 = l0 c^2 + l1 s^2,  |phi_0> proportional to sqrt(l0) c |0> - sqrt(l1) s |1>
//     k = 1:  p1 = l0 s^2 + l1 c^2,  |phi_1> proportional to sqrt(l0) s |0> + sqrt(l1) c |1>
//   and p0 |phi_0><phi_0| + p1 |phi_1><phi_1| = rho_A for every alpha: the gate cannot change A alone.
import { c, add, sub, mul, conj, abs, abs2, scale, apply1, RY, probOne, bloch, normalize, norm2, type State, type Matrix, type C } from '../quantum.ts';
import { pct } from '../draw.ts';

export type Bit = 0 | 1;
/** One fresh pair: A's 0/1 result and the partner's 0/1 result. u1 draws A's, u2 draws the partner's given A's. */
export type Draw = { u1: number; u2: number };
export type Shot = { a: Bit; r: Bit };
export type Tally = { n: number; a0: number; r0: number };
export type Branch = { k: Bit; p: number; state: State | null };

/** The sliders. ODDS: chance of 0 for A alone, in whole percent. TURN: the partner's gate angle, in whole degrees. */
export const ODDS = { min: 50, max: 100, step: 1, start: 80 } as const;
export const TURN = { min: 0, max: 180, step: 1, start: 0 } as const;
/** Pairs one press measures. */
export const PAIRS = 40;

/** Below this a chance is float dust: it counts as "never". */
const NEVER = 1e-9;
const clamp = (x: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, x));
const RAD = Math.PI / 180;

/** A's chance of 0 from the slider (whole percent) as a chance, kept inside the slider's range. */
export const fromPercent = (n: number): number => clamp(Math.round(n), ODDS.min, ODDS.max) / 100;
/** The gate angle from the slider, in radians. */
export const turnRad = (deg: number): number => clamp(Math.round(deg), TURN.min, TURN.max) * RAD;

// ---- The states

/** sqrt(l0)|00> + sqrt(l1)|11>: a purification of diag(l0, 1 - l0). */
export function purify(l0: number): State {
  const p = clamp(l0, 0, 1);
  return [c(Math.sqrt(p)), c(0), c(0), c(Math.sqrt(1 - p))];
}

/** The purification after a turn of alpha (radians) on the partner alone: (I x RY(alpha)) |psi>. */
export const turned = (l0: number, alpha: number): State => apply1(purify(l0), RY(alpha), 1, 2);

/** A purification built from any list of pure states of A with chances: sum_k sqrt(p_k) |phi_k>|k>. Two entries, partner is a qubit. */
export function fromEnsemble(list: { p: number; state: State }[]): State {
  const out: State = [c(0), c(0), c(0), c(0)];
  list.forEach(({ p, state }, k) => {
    for (let a = 0; a < 2; a++) out[2 * a + k] = add(out[2 * a + k], scale(state[a], Math.sqrt(p)));
  });
  return out;
}

// ---- Reduced states

const dyad = (s: State): Matrix => s.map((x) => s.map((y) => mul(x, conj(y))));

/** tr_R of |psi><psi|: entry (a, a') is sum_r psi[2a+r] conj(psi[2a'+r]). */
export function reducedA(psi: State): Matrix {
  const m = dyad(psi);
  return [0, 1].map((a) => [0, 1].map((a2) => add(m[2 * a][2 * a2], m[2 * a + 1][2 * a2 + 1])));
}

/** tr_A of |psi><psi|: entry (r, r') is sum_a psi[2a+r] conj(psi[2a+r']). */
export function reducedR(psi: State): Matrix {
  const m = dyad(psi);
  return [0, 1].map((r) => [0, 1].map((r2) => add(m[r][r2], m[2 + r][2 + r2])));
}

/** tr rho^2 for a 2 by 2 density matrix: 1 for a pure state, 1/2 for the fully mixed one. */
export const purity = (rho: Matrix): number => {
  let t = 0;
  for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) t += mul(rho[i][j], rho[j][i]).re;
  return t;
};

/** A's chance of reading 0, from the joint state. The partner's gate never changes it. */
export const aChance0 = (psi: State): number => 1 - probOne(psi, 0, 2);
/** The partner's chances of reading 0 and 1. */
export const partnerChances = (psi: State): [number, number] => [1 - probOne(psi, 1, 2), probOne(psi, 1, 2)];

// ---- Measuring the partner

/** Turn a state so its first non-negligible amplitude is real and positive. A global phase cannot be seen, so this shows the same state. */
function dropPhase(s: State): State {
  const a = s.find((x) => abs(x) > 1e-9);
  if (!a) return s;
  const k = c(a.re / abs(a), -a.im / abs(a));
  return s.map((x) => mul(x, k));
}

/** Measure the partner in 0/1: for each result, its chance and the state A is left in (null if the result never happens). */
export function branches(psi: State): [Branch, Branch] {
  const make = (k: Bit): Branch => {
    const v = [psi[k], psi[2 + k]];
    const p = abs2(v[0]) + abs2(v[1]);
    return { k, p, state: p < NEVER ? null : dropPhase(normalize(v)) };
  };
  return [make(0), make(1)];
}

/** sum_k p_k |phi_k><phi_k| over the results that can happen. Equals reducedA(psi): the ensemble A is left in, averaged. */
export function average(bs: Branch[]): Matrix {
  let m: Matrix = [[c(0), c(0)], [c(0), c(0)]];
  for (const b of bs) {
    if (!b.state) continue;
    const d = dyad(b.state);
    m = m.map((row, i) => row.map((x, j) => add(x, scale(d[i][j], b.p))));
  }
  return m;
}

/** A state's point on the flat slice of the Bloch ball the tool draws: x to the right (+), z up (0). y is 0 for real amplitudes. */
export function slice(s: State): { x: number; y: number; z: number } {
  const [x, y, z] = bloch(s);
  return { x, y, z };
}

/** A's own point: rho = diag(l0, l1) sits on the z axis at height l0 - l1, the length of its Bloch vector. */
export const rhoHeight = (l0: number): number => 2 * l0 - 1;

// ---- Shots

/** A's result from u1, then the partner's from u2 given A's: the chain rule, so the joint chances are exactly |psi|^2 and A's results never depend on the gate. */
export function conditionalR0(psi: State, a: Bit): number {
  const pa = abs2(psi[2 * a]) + abs2(psi[2 * a + 1]);
  return pa < NEVER ? 1 : abs2(psi[2 * a]) / pa;
}
export function shot(psi: State, d: Draw): Shot {
  const a: Bit = d.u1 < aChance0(psi) ? 0 : 1;
  const r: Bit = d.u2 < conditionalR0(psi, a) ? 0 : 1;
  return { a, r };
}
/** One pair per draw, all from the same joint state. */
export const shots = (psi: State, ds: Draw[]): Shot[] => ds.map((d) => shot(psi, d));
/** Fresh uniform draws for a batch. */
export const draws = (rand: () => number, n = PAIRS): Draw[] => Array.from({ length: n }, () => ({ u1: rand(), u2: rand() }));
export const tally = (ss: Shot[]): Tally => ({ n: ss.length, a0: ss.filter((s) => s.a === 0).length, r0: ss.filter((s) => s.r === 0).length });

// ---- Two purifications differ by a unitary on the partner

const det = (m: Matrix): C => sub(mul(m[0][0], m[1][1]), mul(m[0][1], m[1][0]));
const inv = (m: Matrix): Matrix | null => {
  const d = det(m), n = abs2(d);
  if (n < 1e-18) return null;
  const k = c(d.re / n, -d.im / n); // 1/d
  return [[mul(m[1][1], k), mul(scale(m[0][1], -1), k)], [mul(scale(m[1][0], -1), k), mul(m[0][0], k)]];
};

/** The gate U on the partner with (I x U) psi1 = psi2, found when rho_A has full rank (then U is unique). Null otherwise. */
export function unitaryBetween(psi1: State, psi2: State): Matrix | null {
  // Write a state as the matrix M[a][r] = psi[2a + r]. Then (I x U) psi becomes M U^T, so U^T = M1^-1 M2.
  const m1: Matrix = [[psi1[0], psi1[1]], [psi1[2], psi1[3]]], m2: Matrix = [[psi2[0], psi2[1]], [psi2[2], psi2[3]]];
  const i1 = inv(m1);
  if (!i1) return null;
  const ut = i1.map((row) => [0, 1].map((j) => add(mul(row[0], m2[0][j]), mul(row[1], m2[1][j]))));
  return [[ut[0][0], ut[1][0]], [ut[0][1], ut[1][1]]];
}

/** True when m m-dagger is the identity: m is a unitary. */
export function isUnitary(m: Matrix, eps = 1e-9): boolean {
  for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) {
    const t = add(mul(m[i][0], conj(m[j][0])), mul(m[i][1], conj(m[j][1])));
    if (abs(sub(t, c(i === j ? 1 : 0))) > eps) return false;
  }
  return true;
}

// ---- Words

const MINUS = '−';
const num = (x: number) => Math.abs(x).toFixed(2);

/** Real-amplitude state as text: "0.89|00> + 0.45|11>", with a minus sign for a negative amplitude. Tiny terms are left out. */
export function stateText(s: State): string {
  const n = Math.log2(s.length);
  let out = '';
  s.forEach((a, i) => {
    if (Math.abs(a.re) < 0.005) return;
    const term = `${num(a.re)}|${i.toString(2).padStart(n, '0')}\u27E9`;
    out += out === '' ? (a.re < 0 ? MINUS : '') + term : ` ${a.re < 0 ? MINUS : '+'} ${term}`;
  });
  return out;
}

export const oddsValueText = (odds: number): string => `${odds} percent chance of 0 for A alone`;
export const turnValueText = (deg: number): string =>
  deg === 0 ? 'No gate on the partner' : `${deg} degrees${deg === 180 ? '. This gives the same two states as no gate, with the results swapped' : ''}`;

const chanceText = (p: number): string => pct(p);

/** A alone, as the tool's table shows it. */
export const rhoText = (l0: number): string => `diag(${num(l0)}, ${num(1 - l0)})`;
/** The pair's purity, tr (|psi><psi|)^2: 1 for any pure state, so always 1 here. */
export const pairPurity = (psi: State): number => norm2(psi) ** 2;
/** One line for a partner result: its chance and the state A is left in. */
export const branchLine = (b: Branch): string => (b.state ? `${chanceText(b.p)}, then A is ${stateText(b.state)}` : 'never');
/** A number for the table: two decimals. */
export const fixed = (x: number): string => x.toFixed(2);

/** The one sentence the tool speaks: start state, what A alone does, what the partner's result leaves A in. */
export function describe(odds: number, deg: number, t?: Tally): string {
  const l0 = fromPercent(odds), l1 = 1 - l0;
  const start = purify(l0), psi = turned(l0, turnRad(deg));
  const parts: string[] = [`Started as the pair ${stateText(start)}.`];
  parts.push(deg === 0 ? 'No gate on the partner.' : `Then a gate turns the partner by ${deg}°, and the pair is ${stateText(psi)}.`);
  if (l1 < NEVER) {
    parts.push('A alone is |0⟩ here, and the partner is not linked to it: A stays |0⟩ whatever the partner reads.');
  } else {
    parts.push(`A alone reads 0 with chance ${chanceText(l0)} and 1 with chance ${chanceText(l1)}, the same for every gate on the partner.`);
    for (const b of branches(psi)) {
      parts.push(b.state
        ? `The partner reads ${b.k} with chance ${chanceText(b.p)}, and then A is ${stateText(b.state)}.`
        : `The partner never reads ${b.k}.`);
    }
    parts.push('Weighted by those chances, A’s two states give back A’s own ρ.');
  }
  if (t) parts.push(batchText(t, odds, deg));
  return parts.join(' ');
}

/** The result of one batch, in words. Names the odds so it can be checked. */
export function batchText(t: Tally, odds: number, deg: number): string {
  const l0 = fromPercent(odds), psi = turned(l0, turnRad(deg)), [p0] = partnerChances(psi);
  return `Of ${t.n} new pairs, A alone read 0 in ${t.a0} (the odds say ${chanceText(l0)}) and the partner read 0 in ${t.r0} (the odds say ${chanceText(p0)}).`;
}
