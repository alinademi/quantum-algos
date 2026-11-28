// Quantum channels stop: the pure math behind the ChannelMachine tool. No DOM.
// Sources: Watrous, Understanding Quantum Information and Computation, "Quantum channel basics" (a channel is a linear map
// that must still give a density matrix when it acts on one part of a larger system; transposition is the simplest
// linear map that fails this) and "Channel representations: Kraus representations" (Phi(rho) = sum_k A_k rho A_k^dagger,
// trace preserving exactly when sum_k A_k^dagger A_k = I, at most n*m operators; the Choi matrix is the channel applied to
// half of a maximally entangled pair). Wilde, Quantum Information Theory, 4.4.1 and 4.7. Nielsen and Chuang, 8.2.
// Conventions (as in quantum.ts):
// - One qubit. Bloch vector (x, y, z): z = +1 is |0>. The tool draws the x-z plane only, so a point is (x, z).
// - The start state is cos(theta/2)|0> + sin(theta/2)|1>, whole degrees: real amplitudes, Bloch point (sin theta, 0, cos theta).
//   Theta 0 is |0>, 90 is |+>, 180 is |1>, 270 is |->. This is "started as 0, then an RY turn of theta".
// - A channel here is a list of Kraus operators K_k, all real or Pauli. Its action on any 2x2 matrix M is sum_k K_k M K_k^dagger.
//   Door k "fires" with chance p_k = <psi|K_k^dagger K_k|psi> and leaves the state K_k|psi> / sqrt(p_k). The channel only fixes
//   the average of these jumps; a different Kraus set for the same channel gives different jumps with the same average.
//   So a Kraus label is not one physical event. A channel (nothing picked out) is CPTP: sum K†K = I.
//   The "drop left out" map is one kept branch: completely positive, trace-nonincreasing, not a channel. The state shown for it
//   is that branch divided by its trace, which is not linear in the input; nothing is shown when the trace is 0.
// - The pair test: (E tensor id) applied to (|00> + |11>)/sqrt2, E on qubit 0, qubit 1 untouched. Index 2a + b.
//   The result is a valid state only when E is completely positive. Its trace is 1 only when E preserves trace.
import { c, add, mul, scale, conj, norm2, normalize, matMul, matVec, dagger, fromBloch, I, X, Y, Z, RY, type C, type Matrix, type State } from '../quantum.ts';
import { pct } from '../draw.ts';

export type Kind = 'gate' | 'flip' | 'damp' | 'shrink' | 'drop';
export type Pt = [number, number];
/** One Kraus operator: its matrix and a short text for it, like "√0.75 · I". */
export type Op = { name: string; m: Matrix; text: string };
/** One door for a given start state: which operator, its chance, and the state it leaves as a point (x, z). */
export type Jump = { k: number; p: number; point: Pt };

export const KINDS: readonly Kind[] = ['gate', 'flip', 'damp', 'shrink', 'drop'];
/** Shots per batch. */
export const SHOTS = 200;
export const THETA = { min: 0, max: 355, step: 5, start: 0 };

export const CHANNELS: Record<Kind, { name: string; slider: string; min: number; max: number; step: number; start: number; what: string }> = {
  gate: { name: 'A gate', slider: 'Turn (RY angle)', min: 0, max: 355, step: 5, start: 90, what: 'One operator: a turn of the state. A gate is a channel with a single operator.' },
  flip: { name: 'Bit flip', slider: 'Chance p of a flip', min: 0, max: 100, step: 1, start: 25, what: 'Two operators: do nothing, or swap 0 and 1 (an X gate). The chances are 1 − p and p.' },
  damp: { name: 'Amplitude damping', slider: 'Chance γ that a 1 drops to 0', min: 0, max: 100, step: 1, start: 50, what: 'Two operators: no drop, and drop. A 1 can fall to 0, but a 0 never rises.' },
  shrink: { name: 'Shrink the ball', slider: 'Scale factor λ', min: -100, max: 100, step: 1, start: 50, what: 'Every arrow from the center is scaled by λ. At 1 nothing changes, at 0 every state becomes the center, below 0 the arrow also flips.' },
  drop: { name: 'Damping, drop left out', slider: 'Chance γ that a 1 drops to 0', min: 0, max: 100, step: 1, start: 50, what: 'The damping operators with the drop operator removed. Only "no drop" is kept: one result of a measurement. For γ above 0 the chances can add to less than 1, so this is not a channel.' },
};

const DEG = Math.PI / 180;
// Float dust: cos(90 deg) is 6e-17, not 0. Below this a number counts as exactly 0.
const DUST = 1e-12;
const clean = (x: number) => (Math.abs(x) < DUST ? 0 : x);
const SUB = ['₀', '₁', '₂', '₃'];
const S = (m: number[][]): Matrix => m.map((r) => r.map((x) => c(x)));

// ---- Small matrix helpers

const mAdd = (a: Matrix, b: Matrix): Matrix => a.map((r, i) => r.map((x, j) => add(x, b[i][j])));
const mScale = (a: Matrix, k: number): Matrix => a.map((r) => r.map((x) => scale(x, k)));
/** K M K^dagger */
const conjugate = (k: Matrix, m: Matrix): Matrix => matMul(matMul(k, m), dagger(k));
const zeros = (n: number): Matrix => Array.from({ length: n }, () => Array.from({ length: n }, () => c(0)));
/** The sum of the diagonal, as a complex number. */
export const traceC = (m: Matrix): C => m.reduce((t, r, i) => add(t, r[i]), c(0));
/** The real part of the trace: for chances and readouts of Hermitian matrices only. */
export const trace = (m: Matrix): number => traceC(m).re;
/** |s><s| */
export const outer = (s: State): Matrix => s.map((a) => s.map((b) => mul(a, conj(b))));
/** Largest gap between two same-size matrices. */
export const gap = (a: Matrix, b: Matrix): number =>
  Math.max(...a.flatMap((r, i) => r.map((x, j) => Math.hypot(x.re - b[i][j].re, x.im - b[i][j].im))));

// ---- Numbers as text

/** "0.75", "−0.5", "0.063": up to 3 decimals, a real minus sign, never "−0". */
export const num = (x: number, digits = 2): string => {
  const t = x.toFixed(digits);
  return Number(t) === 0 ? (0).toFixed(digits) : t.replace('-', '−');
};
const w3 = (x: number): string => String(Number(x.toFixed(3)));
export const pointText = (p: Pt): string => `(${num(p[0])}, ${num(p[1])})`;

// ---- Start state

/** cos(theta/2)|0> + sin(theta/2)|1> at whole-degree theta. */
export const startKet = (theta: number): State => fromBloch(theta * DEG, 0).map((z) => c(clean(z.re), clean(z.im)));
/** Its point (x, z) on the unit circle. */
export const startPoint = (theta: number): Pt => [clean(Math.sin(theta * DEG)), clean(Math.cos(theta * DEG))];
/** "Started as 0, then an RY turn of 90°" and the state it makes. */
export function startText(theta: number): string {
  const name = ({ 0: '|0⟩', 90: '|+⟩', 180: '|1⟩', 270: '|−⟩' } as Record<number, string>)[theta];
  if (theta === 0) return 'Started as 0 with no gate, the qubit is |0⟩';
  return `Started as 0, then an RY turn of ${theta}°, the qubit is ${name ?? 'cos(θ/2)|0⟩ + sin(θ/2)|1⟩ with θ = ' + theta + '°'}`;
}

// ---- The channels

const WEIGHT_LOW = -1 / 3;

/** The Pauli weights of "scale by lambda": rho goes to w_I rho + w_P (X rho X + Y rho Y + Z rho Z). */
export const shrinkWeights = (lambda: number): { identity: number; pauli: number } => ({ identity: (1 + 3 * lambda) / 4, pauli: (1 - lambda) / 4 });

/**
 * The Kraus operators for a channel at slider value v (degrees for a gate, percent for the rest; the scale factor is v/100).
 * Operators with weight 0 are left out. Null when no set of operators gives the map: scale factors below −1/3.
 */
export function krausOps(kind: Kind, v: number): Op[] | null {
  const p = v / 100;
  const list = (items: [Matrix, string, number][]): Op[] =>
    items.filter(([, , w]) => w > 0).map(([m, text], k) => ({ name: 'K' + SUB[k], m, text }));
  switch (kind) {
    case 'gate': return [{ name: 'K₀', m: RY(v * DEG).map((r) => r.map((z) => c(clean(z.re), clean(z.im)))), text: `RY(${v}°)` }];
    case 'flip': return list([[mScale(I, Math.sqrt(1 - p)), `√${w3(1 - p)} · I`, 1 - p], [mScale(X, Math.sqrt(p)), `√${w3(p)} · X`, p]]);
    case 'damp': return list([
      [S([[1, 0], [0, Math.sqrt(1 - p)]]), `diag(1, √${w3(1 - p)})`, 1],
      [S([[0, Math.sqrt(p)], [0, 0]]), `√${w3(p)} · |0⟩⟨1|`, p],
    ]);
    case 'shrink': {
      const { identity, pauli } = shrinkWeights(p);
      if (identity < 0) return null;
      return list([[mScale(I, Math.sqrt(identity)), `√${w3(identity)} · I`, identity],
        [mScale(X, Math.sqrt(pauli)), `√${w3(pauli)} · X`, pauli], [mScale(Y, Math.sqrt(pauli)), `√${w3(pauli)} · Y`, pauli], [mScale(Z, Math.sqrt(pauli)), `√${w3(pauli)} · Z`, pauli]]);
    }
    case 'drop': return [{ name: 'K₀', m: S([[1, 0], [0, Math.sqrt(1 - p)]]), text: `diag(1, √${w3(1 - p)})` }];
  }
}

/** The sum of K^dagger K. It is the identity exactly when the operators are a channel that keeps trace. */
export function completeness(ops: Op[]): Matrix {
  return ops.reduce((t, o) => mAdd(t, matMul(dagger(o.m), o.m)), zeros(2));
}
export const keepsTrace = (ops: Op[]): boolean => gap(completeness(ops), I) < 1e-9;

/** The map on any 2x2 matrix M (not only density matrices). Linear. */
export function applyMap(kind: Kind, v: number, m: Matrix): Matrix {
  if (kind === 'shrink') {
    const l = v / 100;
    // lambda M + (1 − lambda) tr(M) I/2: the Bloch vector is scaled by lambda, the trace is kept.
    const t = scale(traceC(m), (1 - l) / 2);
    return mAdd(mScale(m, l), I.map((r) => r.map((x) => mul(x, t))));
  }
  return krausOps(kind, v)!.reduce((t, o) => mAdd(t, conjugate(o.m, m)), zeros(m.length));
}

// ---- One qubit in, one qubit out

/** The point (x, z) of a 2x2 matrix with trace t > 0: its Bloch vector. Null when nothing is left. */
export function pointOf(rho: Matrix): Pt | null {
  const t = trace(rho);
  if (t < DUST) return null;
  return [clean((2 * rho[0][1].re) / t), clean((rho[0][0].re - rho[1][1].re) / t)];
}

/** What comes out for a start state: the matrix (trace 1 for a channel that keeps trace), its trace, and its point. */
export function output(kind: Kind, v: number, theta: number): { rho: Matrix; trace: number; point: Pt | null } {
  const rho = applyMap(kind, v, outer(startKet(theta)));
  return { rho, trace: trace(rho), point: pointOf(rho) };
}

/** Where the whole start circle goes: n points. For the ball, this is an ellipse inside the circle. */
export function circleImage(kind: Kind, v: number, n = 120): Pt[] {
  const out: Pt[] = [];
  for (let i = 0; i < n; i++) { const pt = output(kind, v, (360 * i) / n).point; if (pt) out.push(pt); }
  return out;
}

// ---- The doors, shot by shot

/** Each operator that can fire for this start state: chance p_k = |K_k psi|^2 and the state it leaves. Empty without operators. */
export function jumps(kind: Kind, v: number, theta: number): Jump[] {
  const ops = krausOps(kind, v);
  if (!ops) return [];
  const psi = startKet(theta);
  const out: Jump[] = [];
  ops.forEach((o, k) => {
    const out_ = matVec(o.m, psi), p = norm2(out_);
    if (p > DUST) out.push({ k, p, point: pointOf(outer(normalize(out_)))! });
  });
  return out;
}
/** Chance that no operator fires and the shot is lost: 1 minus the chances, 0 when the operators keep trace. */
export const lostChance = (js: Jump[]): number => clean(1 - js.reduce((t, j) => t + j.p, 0));

/** One shot: u in [0, 1) picks index into js by the chances, or −1 when the shot is lost. */
export function pick(js: Jump[], u: number): number {
  let r = u;
  for (let i = 0; i < js.length; i++) { r -= js[i].p; if (r < 0) return i; }
  // Past every chance: a real loss only if the operators lose trace, else rounding, so keep the last door.
  return lostChance(js) > 0 || !js.length ? -1 : js.length - 1;
}
/** A batch: one pick per fixed uniform draw. */
export const batch = (js: Jump[], us: number[]): number[] => us.map((u) => pick(js, u));

/** What a batch shows: how many shots fired an operator, how many were lost, and the average of the dots. */
export function tally(js: Jump[], picks: number[]): { kept: number; lost: number; mean: Pt | null; counts: number[] } {
  const counts = js.map(() => 0);
  let x = 0, z = 0, kept = 0;
  for (const i of picks) if (i >= 0) { counts[i]++; kept++; x += js[i].point[0]; z += js[i].point[1]; }
  return { kept, lost: picks.length - kept, mean: kept ? [x / kept, z / kept] : null, counts };
}

// ---- Half of an entangled pair

/** (E tensor id)(|Phi+><Phi+|): E acts on qubit 0 of (|00> + |11>)/sqrt2. Entry [2 iA + a][2 jA + b] is E(|a><b|)[iA][jA] / 2. */
export function pairOutput(kind: Kind, v: number): Matrix {
  const out = Array.from({ length: 4 }, () => Array.from({ length: 4 }, () => c(0)));
  for (let a = 0; a < 2; a++) for (let b = 0; b < 2; b++) {
    const unit = S([[0, 0], [0, 0]]); unit[a][b] = c(1);
    const e = applyMap(kind, v, unit);
    for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) out[2 * i + a][2 * j + b] = scale(e[i][j], 0.5);
  }
  return out;
}

/** Eigenvalues of a Hermitian matrix, largest first. A complex n x n matrix A + iB becomes the real 2n x 2n matrix
 *  [[A, −B], [B, A]], whose eigenvalues are the same, each twice. Cyclic Jacobi sweeps then rotate it to a diagonal. */
export function hermitianEigenvalues(m: Matrix): number[] {
  const n = m.length, N = 2 * n;
  const a = Array.from({ length: N }, () => new Array<number>(N).fill(0));
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    a[i][j] = a[i + n][j + n] = m[i][j].re; a[i][j + n] = -m[i][j].im; a[i + n][j] = m[i][j].im;
  }
  for (let sweep = 0; sweep < 60; sweep++) {
    let off = 0;
    for (let p = 0; p < N; p++) for (let q = p + 1; q < N; q++) off += a[p][q] * a[p][q];
    if (off < 1e-30) break;
    for (let p = 0; p < N; p++) for (let q = p + 1; q < N; q++) {
      if (Math.abs(a[p][q]) < 1e-300) continue;
      const th = (a[q][q] - a[p][p]) / (2 * a[p][q]);
      const t = (th >= 0 ? 1 : -1) / (Math.abs(th) + Math.sqrt(th * th + 1));
      const cs = 1 / Math.sqrt(t * t + 1), sn = t * cs;
      for (let k = 0; k < N; k++) { const kp = a[k][p], kq = a[k][q]; a[k][p] = cs * kp - sn * kq; a[k][q] = sn * kp + cs * kq; }
      for (let k = 0; k < N; k++) { const pk = a[p][k], qk = a[q][k]; a[p][k] = cs * pk - sn * qk; a[q][k] = sn * pk + cs * qk; }
    }
  }
  const all = a.map((r, i) => r[i]).sort((x, y) => y - x);
  return all.filter((_, i) => i % 2 === 0).map(clean);
}

/** The four eigenvalues of the pair after the map, largest first. A map is completely positive exactly when none is negative. */
export const pairEigenvalues = (kind: Kind, v: number): number[] => hermitianEigenvalues(pairOutput(kind, v));

export type Verdict = { low: number; sum: number; state: boolean; keeps: boolean };
/** Is the pair's output a state? `state`: no negative eigenvalue. `keeps`: the trace is still 1. */
export function pairVerdict(kind: Kind, v: number): Verdict {
  const e = pairEigenvalues(kind, v), low = e[e.length - 1], sum = e.reduce((t, x) => t + x, 0);
  return { low, sum, state: low >= -1e-9, keeps: Math.abs(sum - 1) < 1e-9 };
}

// ---- Words

export function valueText(kind: Kind, v: number): string {
  if (kind === 'gate') return `${v} degrees`;
  if (kind === 'shrink') return `scale factor ${num(v / 100)}`;
  return `${v} percent`;
}
export const valueShort = (kind: Kind, v: number): string => (kind === 'gate' ? `${v}°` : kind === 'shrink' ? num(v / 100) : `${v}%`);

const symbol = (kind: Kind) => (kind === 'flip' ? 'p' : kind === 'shrink' ? 'λ' : kind === 'gate' ? 'angle' : 'γ');

/** The readout: the start state, the operators, what comes out, the trace check, the pair test, and a batch if there is one. */
export function describe(kind: Kind, v: number, theta: number, sample?: ReturnType<typeof tally>): string {
  const ops = krausOps(kind, v), out = output(kind, v, theta), verdict = pairVerdict(kind, v);
  const parts: string[] = [`${startText(theta)}. ${CHANNELS[kind].name}, ${symbol(kind)} = ${valueShort(kind, v)}.`];

  if (!ops) {
    parts.push(`No set of operators gives this map, because it is not completely positive: the weight on "do nothing" would be ${num(shrinkWeights(v / 100).identity, 3)}, below 0.`);
  } else {
    parts.push(`${ops.length === 1 ? 'One operator' : `${ops.length} operators`}: ${ops.map((o) => `${o.name} = ${o.text}`).join(', ')}.`);
    const tot = completeness(ops);
    parts.push(keepsTrace(ops)
      ? 'The sum of K†K is I, so the chances of the operators add to 1 for every start state.'
      : `The sum of K†K is diag(${num(tot[0][0].re)}, ${num(tot[1][1].re)}), not I, so this is not a channel: it is one kept branch, and shots can be lost.`);
  }

  if (!out.point) parts.push('Nothing survives this map for this start state.');
  else if (ops && !keepsTrace(ops)) parts.push(`A share ${num(out.trace)} of the shots survive, and the survivors, rescaled to trace 1, sit at (x, z) = ${pointText(out.point)}.`);
  else parts.push(`Out comes the point (x, z) = ${pointText(out.point)}, at distance ${num(Math.hypot(...out.point))} from the center${Math.hypot(...out.point) > 1 - 1e-9 ? ': still a pure state' : ''}.`);

  const eig = pairEigenvalues(kind, v);
  parts.push(`Half of the pair (|00⟩ + |11⟩)/√2 through the same map gives eigenvalues ${eig.map((x) => num(x, 3)).join(', ')}.`);
  parts.push(verdict.state
    ? (verdict.keeps ? 'None is negative: a state.' : `None is negative, so the map is completely positive, but they add to ${num(verdict.sum)}, not 1: the trace is not kept.`)
    : `The lowest is negative, so the pair would predict a negative chance. No physical process does this, even though one qubit alone comes out as a state.`);

  if (sample && ops) {
    const mean = sample.mean ? ` Average of the dots: (x, z) = ${pointText(sample.mean)}.` : '';
    parts.push(`${sample.kept + sample.lost} shots: ${sample.kept} fired an operator${sample.lost ? `, ${sample.lost} were lost` : ''}.${mean}`);
  }
  return parts.join(' ');
}

/** The chance of each door as a percent, for the operator list. */
export const chanceText = (p: number): string => pct(p);
