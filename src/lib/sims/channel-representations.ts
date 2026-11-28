// Stinespring and Choi: the pure math behind the ChannelThreeWays tool. No DOM.
// Sources: Watrous, Understanding Quantum Information and Computation (IBM Quantum Learning), "Channel representations"
// (Stinespring form with a workspace W that starts as |0>, Kraus form, Choi matrix J(Phi) = sum |a><b| (x) Phi(|a><b|),
// the Choi state, the Choi matrices of the dephasing, depolarizing, reset and identity channels) and "Equivalence of the
// representations" (Choi to Kraus by vectorizing, Kraus to Stinespring by completing the first block column to a unitary);
// Watrous, The Theory of Quantum Information, Section 2.2.2 (Corollary 2.27: a channel has a Kraus operator list and a
// Stinespring isometry with workspace dimension equal to the Choi rank; eq. 2.66, Phi(X) = Tr_X[(1 (x) X^T) J]).
// Conventions:
// - Qubits only. A two-qubit index is 2a + b: the first qubit is the left one, as in quantum.ts.
// - Choi: the INPUT is the first factor, J = sum_{a,b} |a><b| (x) Phi(|a><b|), a 4 by 4 matrix (as in the IBM course;
//   the book's eq. 2.65 puts the output first). Row 2a + y, column 2b + y': a, b are input bits, y, y' are output bits.
// - Stinespring: W is the first factor of the pair (W, X), like the formula Phi(rho) = Tr_G[U(|0><0|_W (x) rho)U^dagger].
//   Columns of U are indexed (w, x) = 2w + x, rows (g, y) = 2g + y. The workspace has N levels, N = the number of Kraus
//   operators: a qubit for N = 2, two qubits for N = 4. U is 2N by 2N.
// - U's first two columns (w = 0) hold the Kraus operators stacked: A_k[y][x] = U[2k + y][x]. The other columns are filler
//   chosen only to make U unitary (Gram-Schmidt); any other fill gives the same channel.
// - "Turning the workspace": U' = (V (x) I) U with V a real rotation by alpha in the planes (0,1) and (2,3) of the workspace.
//   Kraus operators become A'_j = sum_k V_jk A_k, with A'_0 = cos(alpha) A_0 + sin(alpha) A_1 and
//   A'_1 = -sin(alpha) A_0 + cos(alpha) A_1 (and the same for A_2, A_3). It is the same as measuring the workspace in a turned basis.
// - Channels (same as the noise-channels stop): p is the chance the noise acts. Bit flip: X with chance p. Phase flip: Z with
//   chance p. Depolarizing: the qubit is replaced by I/2 with chance p. Amplitude damping: |1> decays to |0> with chance gamma = p.
// - Shots: start as psi (one of six axis states) with W = |0>, apply U', measure the workspace in its standard basis (result j),
//   then measure the qubit in the basis {psi, psi-perp}. Outcome index 2j + (0 if it gave psi, 1 if it gave psi-perp).
// - The slider runs in hundredths, so p is k/100 for whole k from 0 to 100. Angles are whole degrees from 0 to 180.
import { c, add, sub, mul, scale, conj, abs2, inner, norm2, fromBloch, I, X, Y, Z, matMul, dagger, kron, matVec, draw, type C, type Matrix, type State } from '../quantum.ts';
import { pct } from '../draw.ts';

export type Channel = 'bit' | 'phase' | 'depol' | 'damp';

const RAD = Math.PI / 180;
/** Float dust: cos(90 degrees) is 6e-17, not 0. Below this we call a number exactly 0. */
const DUST = 1e-12;
const clean = (x: number) => (Math.abs(x) < DUST ? 0 : x);
/** A chance with float dust next to 0 or 1 set to exactly 0 or 1. */
const snap = (x: number) => (x < DUST ? 0 : x > 1 - DUST ? 1 : x);

/** Shots in one batch. */
export const SHOTS = 100;
/** The strength slider, in hundredths: p = k/100. */
export const STRENGTH = { min: 0, max: 100, step: 1, start: 20 } as const;
/** The workspace-turn slider, in degrees. 180 turns each pair of workspace levels a half turn: every Kraus operator changes sign. */
export const TURN = { min: 0, max: 180, step: 1, start: 0 } as const;

// ---- Small matrix helpers (quantum.ts has the products; these add, scale and build)

const zeros = (r: number, k: number): Matrix => Array.from({ length: r }, () => Array.from({ length: k }, () => c(0)));
const eye = (n: number): Matrix => Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => c(i === j ? 1 : 0)));
const madd = (a: Matrix, b: Matrix): Matrix => a.map((row, i) => row.map((x, j) => add(x, b[i][j])));
const mscale = (m: Matrix, k: number): Matrix => m.map((row) => row.map((x) => scale(x, k)));
/** |a><b| on n levels. */
export const unit = (a: number, b: number, n: number): Matrix => Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => c(i === a && j === b ? 1 : 0)));
/** |u><v|, or |u><u| when v is left out. */
export const outer = (u: State, v: State = u): Matrix => u.map((x) => v.map((y) => mul(x, conj(y))));
const sumM = (ms: Matrix[], r: number, k: number): Matrix => ms.reduce(madd, zeros(r, k));
/** The largest size of any entry of a - b. */
export const maxDiff = (a: Matrix, b: Matrix): number => Math.sqrt(Math.max(0, ...a.flatMap((row, i) => row.map((x, j) => abs2(sub(x, b[i][j]))))));

// ---- The four channels and their Kraus operators

/** The Kraus operators of each channel at strength p, from 0 to 1. Four for depolarizing, two for the others. */
export function kraus(ch: Channel, p: number): Matrix[] {
  const k = (m: Matrix, w: number) => mscale(m, Math.sqrt(w));
  switch (ch) {
    case 'bit': return [k(I, 1 - p), k(X, p)];
    case 'phase': return [k(I, 1 - p), k(Z, p)];
    // (1 - p) rho + p I/2 = (1 - 3p/4) rho + (p/4)(X rho X + Y rho Y + Z rho Z), Wilde 4.346.
    case 'depol': return [k(I, 1 - (3 * p) / 4), k(X, p / 4), k(Y, p / 4), k(Z, p / 4)];
    // K0 = |0><0| + sqrt(1 - gamma)|1><1| keeps |0> and shrinks |1>; K1 = sqrt(gamma)|0><1| is the decay.
    case 'damp': return [[[c(1), c(0)], [c(0), c(Math.sqrt(1 - p))]], [[c(0), c(Math.sqrt(p))], [c(0), c(0)]]];
  }
}

/** Workspace levels the tool uses for a channel: one per Kraus operator. */
export const levels = (ch: Channel): number => kraus(ch, 0).length;

/** sum_k A rho A^dagger. rho may be any matrix, not only a state: the map is linear. */
export const applyKraus = (ks: readonly Matrix[], rho: Matrix): Matrix => sumM(ks.map((A) => matMul(matMul(A, rho), dagger(A))), 2, 2);

/** sum_k A_k^dagger A_k. A valid channel gives the identity. */
export const completeness = (ks: readonly Matrix[]): Matrix => sumM(ks.map((A) => matMul(dagger(A), A)), 2, 2);

// ---- The Choi matrix

/** J = sum_{a,b} |a><b| (x) f(|a><b|) for any linear map f on 2 by 2 matrices. Input first. */
export const choiOfMap = (f: (m: Matrix) => Matrix): Matrix =>
  sumM([0, 1].flatMap((a) => [0, 1].map((b) => kron(unit(a, b, 2), f(unit(a, b, 2))))), 4, 4);

/** The Choi matrix of the Kraus form, by applying the channel to each |a><b|. */
export const choiFromKraus = (ks: readonly Matrix[]): Matrix => choiOfMap((m) => applyKraus(ks, m));

/** vec(A) = sum_a |a> (x) A|a>: the columns of A stacked, one on top of another. Entry 2a + y is A[y][a]. */
export const vec = (A: Matrix): State => [0, 1].flatMap((a) => [0, 1].map((y) => A[y][a]));

/** The Choi matrix as a sum of |vec(A_k)><vec(A_k)|, no channel applied. Same matrix as choiFromKraus. */
export const choiFromVec = (ks: readonly Matrix[]): Matrix => sumM(ks.map((A) => outer(vec(A))), 4, 4);

/** The block of J for the input pair (a, b): the 2 by 2 matrix Phi(|a><b|). */
export const block = (J: Matrix, a: number, b: number): Matrix => [0, 1].map((y) => [0, 1].map((y2) => J[2 * a + y][2 * b + y2]));

/** Phi(rho) from J alone: a sum of the four blocks, each times the matching entry of rho. Watrous eq. 2.66 in sum form. */
export const readChoi = (J: Matrix, rho: Matrix): Matrix =>
  sumM([0, 1].flatMap((a) => [0, 1].map((b) => mscaleC(block(J, a, b), rho[a][b]))), 2, 2);
const mscaleC = (m: Matrix, k: C): Matrix => m.map((row) => row.map((x) => mul(x, k)));

/** The same, written the way the book writes it: Tr_X[(rho^T (x) I) J]. */
export function readChoiTrace(J: Matrix, rho: Matrix): Matrix {
  const rhoT = [0, 1].map((i) => [0, 1].map((j) => rho[j][i]));
  const m = matMul(kron(rhoT, I), J);
  return [0, 1].map((y) => [0, 1].map((y2) => add(m[y][y2], m[2 + y][2 + y2])));
}

/** Tr_Y J: sum over the output bit. Entry (a, b) is sum_y J[2a + y][2b + y]. A channel gives the 2 by 2 identity. */
export const traceOutput = (J: Matrix): Matrix => [0, 1].map((a) => [0, 1].map((b) => add(J[2 * a][2 * b], J[2 * a + 1][2 * b + 1])));

/** J/2, the Choi state: the pair |00> + |11> over root 2, with the channel applied to its second qubit. */
export const choiState = (J: Matrix): Matrix => mscale(J, 0.5);

/** The two-qubit state that has the channel applied to its second qubit: (I (x) A_k) |Phi+> summed with weights. */
export const bellPair = (): State => [c(Math.SQRT1_2), c(0), c(0), c(Math.SQRT1_2)];

// ---- From a Choi matrix back to Kraus operators

/**
 * Write a positive semidefinite matrix as a sum of |v><v| by pivoted elimination: take the largest diagonal entry d,
 * peel off v = (that column)/sqrt(d), repeat. Returns the vectors, or null when the matrix is not positive semidefinite
 * (a diagonal entry below zero, or a leftover that does not vanish). The count of vectors is the rank.
 */
export function decompose(J: Matrix, tol = 1e-9): State[] | null {
  const n = J.length;
  let R = J.map((row) => row.map((x) => ({ ...x })));
  const vs: State[] = [];
  for (let step = 0; step <= n; step++) {
    let p = 0, d = -Infinity;
    for (let i = 0; i < n; i++) if (R[i][i].re > d) { d = R[i][i].re; p = i; }
    if (d < -tol) return null;
    if (d <= tol) break;
    const v: State = R.map((row) => scale(row[p], 1 / Math.sqrt(d)));
    R = R.map((row, i) => row.map((x, j) => sub(x, mul(v[i], conj(v[j])))));
    vs.push(v);
  }
  const left = Math.max(0, ...R.flatMap((row) => row.map((x) => Math.sqrt(abs2(x)))));
  return left < 1e-7 ? vs : null;
}

/** Kraus operators from a Choi matrix: un-stack each vector, A_k[y][a] = v_k[2a + y]. Null if J is not positive semidefinite. */
export function krausFromChoi(J: Matrix): Matrix[] | null {
  const vs = decompose(J);
  return vs && vs.map((v) => [0, 1].map((y) => [0, 1].map((a) => v[2 * a + y])));
}

/** The Choi rank: the fewest workspace levels any Stinespring form of this channel can use. Null if J is not positive semidefinite. */
export const choiRank = (J: Matrix): number | null => decompose(J)?.length ?? null;

// ---- Stinespring: a unitary on the workspace and the qubit

/** The unitary of a Stinespring form for these Kraus operators. 2N by 2N. Its first two columns hold the Kraus operators. */
export function stinespring(ks: readonly Matrix[]): Matrix {
  const dim = 2 * ks.length;
  const cols: State[] = [0, 1].map((x) => Array.from({ length: dim }, (_, r) => ks[r >> 1][r & 1][x]));
  // Fill the other columns: each time, orthogonalize every unit vector against the columns so far and keep the longest remainder.
  while (cols.length < dim) {
    let best: State = [], bestNorm = -1;
    for (let i = 0; i < dim; i++) {
      let v: State = Array.from({ length: dim }, (_, r) => c(r === i ? 1 : 0));
      for (let pass = 0; pass < 2; pass++) for (const u of cols) { const k = inner(u, v); v = v.map((x, r) => sub(x, mul(k, u[r]))); }
      const len = Math.sqrt(norm2(v));
      if (len > bestNorm) { best = v; bestNorm = len; }
    }
    cols.push(best.map((x) => scale(x, 1 / bestNorm)));
  }
  return Array.from({ length: dim }, (_, r) => cols.map((col) => col[r]));
}

/** The Kraus operators in U's first two columns: A_k[y][x] = U[2k + y][x]. */
export const krausOf = (U: Matrix): Matrix[] =>
  Array.from({ length: U.length / 2 }, (_, k) => [0, 1].map((y) => [0, 1].map((x) => U[2 * k + y][x])));

/** V: a real rotation by alpha degrees in the workspace planes (0,1) and (2,3). Row j of V says how A'_j mixes the A_k. */
export function turn(n: number, alphaDeg: number): Matrix {
  const V = eye(n), co = clean(Math.cos(alphaDeg * RAD)), si = clean(Math.sin(alphaDeg * RAD));
  for (let i = 0; i + 1 < n; i += 2) {
    V[i][i] = c(co); V[i][i + 1] = c(si);
    V[i + 1][i] = c(-si); V[i + 1][i + 1] = c(co);
  }
  return V;
}

/** U' = (V (x) I) U: turn the workspace output. Same channel, new Kraus operators. */
export const turned = (U: Matrix, V: Matrix): Matrix => matMul(kron(V, I), U);

/** True when U^dagger U is the identity. */
export const isUnitary = (U: Matrix, eps = 1e-9): boolean => maxDiff(matMul(dagger(U), U), eye(U.length)) < eps;

/** Tr_G of a 2N by 2N matrix: drop the first factor. Entry (y, y') is sum_g M[2g + y][2g + y']. */
export const dropWorkspace = (M: Matrix): Matrix => {
  const n = M.length / 2;
  return [0, 1].map((y) => [0, 1].map((y2) => Array.from({ length: n }, (_, g) => M[2 * g + y][2 * g + y2]).reduce(add, c(0))));
};

/** The circuit as a map: put the workspace at 0, apply U, drop the workspace. Phi(m) = Tr_G[U (|0><0| (x) m) U^dagger]. m may be any matrix. */
export function circuit(U: Matrix, m: Matrix): Matrix {
  const wide = kron(unit(0, 0, U.length / 2), m);
  return dropWorkspace(matMul(matMul(U, wide), dagger(U)));
}

/** The Choi matrix of the circuit: run it on |0><0|, |0><1|, |1><0| and |1><1|. */
export const choiFromCircuit = (U: Matrix): Matrix => choiOfMap((m) => circuit(U, m));

// ---- Start states and shots

/** The six start states, at the ends of the axes. Each shot is measured in the basis of its start state. */
export const STARTS = [
  { name: '|0⟩', other: '|1⟩', basis: '0/1', theta: 0, phi: 0 },
  { name: '|1⟩', other: '|0⟩', basis: '0/1', theta: 180, phi: 0 },
  { name: '|+⟩', other: '|−⟩', basis: '+/−', theta: 90, phi: 0 },
  { name: '|−⟩', other: '|+⟩', basis: '+/−', theta: 90, phi: 180 },
  { name: '|+i⟩', other: '|−i⟩', basis: '+i/−i', theta: 90, phi: 90 },
  { name: '|−i⟩', other: '|+i⟩', basis: '+i/−i', theta: 90, phi: 270 },
] as const;

/** Start state i as amplitudes: cos(theta/2)|0> + e^{i phi} sin(theta/2)|1>. */
export const ket = (i: number): State => fromBloch(STARTS[i].theta * RAD, STARTS[i].phi * RAD).map((a) => c(clean(a.re), clean(a.im)));

/** The state orthogonal to (a, b): (-conj b, conj a). */
export const perp = (s: State): State => [c(-s[1].re, s[1].im), conj(s[0])];

/** |psi><psi| for start state i. */
export const rhoOf = (i: number): Matrix => outer(ket(i));

/**
 * Born rule for one shot of the circuit U. Start as psi with the workspace at 0, apply U, measure the workspace (result j),
 * then the qubit in {psi, psi-perp}. Chances are indexed 2j + 0 (gave psi) and 2j + 1 (gave psi-perp), and add to 1.
 */
export function outcomes(U: Matrix, i: number): number[] {
  const psi = ket(i), other = perp(psi), n = U.length / 2;
  const start: State = Array.from({ length: U.length }, (_, r) => (r < 2 ? psi[r] : c(0)));
  const out = matVec(U, start);
  const amp = (j: number, e: State) => [0, 1].map((y) => mul(conj(e[y]), out[2 * j + y])).reduce(add, c(0));
  return Array.from({ length: n }, (_, j) => [abs2(amp(j, psi)), abs2(amp(j, other))]).flat();
}

/** The chance a shot gives the start state, whatever the workspace says: the sum over j. */
export const keepFromOutcomes = (p: readonly number[]): number => snap(p.filter((_, k) => k % 2 === 0).reduce((t, x) => t + x, 0));

/** The same chance from the Choi matrix alone: <psi| Phi(|psi><psi|) |psi>, with Phi read off the four blocks. */
export function keepFromChoi(J: Matrix, i: number): number {
  const psi = ket(i), out = readChoi(J, outer(psi));
  return snap(inner(psi, matVec(out, psi)).re);
}

/** The same chance from Kraus operators: sum_k |<psi|A_k|psi>|^2. */
export function keepFromKraus(ks: readonly Matrix[], i: number): number {
  const psi = ket(i);
  return snap(ks.reduce((t, A) => t + abs2(inner(psi, matVec(A, psi))), 0));
}

/**
 * One batch. Shot s takes the outcome its own uniform draw us[s] (in [0, 1)) picks from the chances, so each shot follows the Born rule.
 * The draw picks from [gave psi for j = 0..N-1, gave psi-perp for j = 0..N-1] and the pick is mapped back to 2j + kind. So a shot gave
 * psi exactly when u is below the chance of psi, whatever the turn: turning the workspace moves shots between columns but never
 * changes which shots gave psi.
 */
export function shots(us: readonly number[], chances: readonly number[]): number[] {
  const n = chances.length / 2, ordered = [...chances.filter((_, k) => k % 2 === 0), ...chances.filter((_, k) => k % 2 === 1)];
  return us.map((u) => { const o = draw(ordered, () => u); return o < n ? 2 * o : 2 * (o - n) + 1; });
}

/** Counts per workspace result j: [gave psi, gave psi-perp]. */
export function tally(outs: readonly number[], n: number): [number, number][] {
  const t: [number, number][] = Array.from({ length: n }, () => [0, 0]);
  for (const o of outs) t[o >> 1][o & 1]++;
  return t;
}

/** Shots that gave the start state. */
export const keptCount = (t: readonly [number, number][]): number => t.reduce((s, [a]) => s + a, 0);

// ---- Words and numbers the tool shows

const MINUS = '−';

/** A real number to two decimals with a true minus sign, never "−0.00". */
export function num(x: number): string {
  const s = Math.abs(x).toFixed(2);
  return x < 0 && s !== '0.00' ? MINUS + s : s;
}

/** A complex entry to two decimals: "0.50", "−0.25", or "0.50 + 0.25i" when it is not real. */
export function cnum(z: C): string {
  if (Math.abs(z.im) < 5e-3) return num(clean(z.re));
  const im = Math.abs(z.im).toFixed(2);
  return Math.abs(z.re) < 5e-3 ? `${z.im < 0 ? MINUS : ''}${im}i` : `${num(z.re)} ${z.im < 0 ? MINUS : '+'} ${im}i`;
}

/** The noise strength as text: "0.20". */
export const strength = (p: number): string => p.toFixed(2);

/** How each channel is named and explained in the tool. */
export const CHANNELS: Record<Channel, { name: string; phrase: string; sym: string; slider: string; what: string }> = {
  bit: {
    name: 'Bit flip', phrase: 'a bit flip', sym: 'p', slider: 'Flip chance p',
    what: 'With chance p, an X gate hits the qubit. In the circuit, a workspace qubit marks whether the flip happened.',
  },
  phase: {
    name: 'Phase flip', phrase: 'a phase flip', sym: 'p', slider: 'Flip chance p',
    what: 'With chance p, a Z gate hits the qubit: the amplitude for 1 changes sign. In the circuit, a workspace qubit marks whether it happened.',
  },
  depol: {
    name: 'Depolarizing', phrase: 'depolarizing noise', sym: 'p', slider: 'Replace chance p',
    what: 'With chance p, the qubit is swapped for the fully mixed state I/2. It needs four Kraus operators, so the workspace is two qubits.',
  },
  damp: {
    name: 'Amplitude damping', phrase: 'amplitude damping', sym: 'γ', slider: 'Decay chance γ',
    what: 'With chance γ, the excited state 1 decays to 0. In the circuit, a workspace qubit marks whether a decay happened.',
  },
};

/** "a qubit" or "two qubits" for N workspace levels. */
export const workspaceName = (n: number): string => (n === 2 ? 'a qubit' : n === 4 ? 'two qubits' : `${n} levels`);

/** Whole degrees as text: "40°". */
export const degrees = (a: number): string => `${Math.round(a)}°`;

/** The slider's spoken value. */
export function valueText(ch: Channel, p: number, i: number): string {
  const s = STARTS[i], U = stinespring(kraus(ch, p));
  return `${strength(p)}. Started as ${s.name}, a shot gives ${s.name} with chance ${pct(keepFromOutcomes(outcomes(U, i)))}.`;
}

/** What the Kraus operators look like after the workspace turn, in words. */
export function turnText(n: number, a: number): string {
  if (a === 0) return 'The workspace is not turned: the Kraus operators are the standard ones.';
  const co = `cos ${degrees(a)}`, si = `sin ${degrees(a)}`;
  const rest = n > 2 ? ', and the same turn mixes A2 with A3' : '';
  return `After the turn, A'0 = ${co} A0 + ${si} A1 and A'1 = −${si} A0 + ${co} A1${rest}.`;
}

/**
 * The readout: the setup, the chance of the start state from the circuit and from the Choi blocks, what the turn did and did
 * not change, and the counts of one batch. `got` is the number of shots in the batch that gave the start state.
 */
export function describe(ch: Channel, p: number, i: number, alpha: number, got?: number, n = SHOTS): string {
  const s = STARTS[i], C = CHANNELS[ch], ks = kraus(ch, p), N = ks.length;
  const U = stinespring(ks), Ut = turned(U, turn(N, alpha)), J = choiFromCircuit(Ut);
  const chances = outcomes(Ut, i), keep = keepFromOutcomes(chances), fromChoi = keepFromChoi(J, i), rank = choiRank(J);
  const sameJ = maxDiff(J, choiFromKraus(ks)) < 1e-9, sameA = krausOf(Ut).every((A, k) => maxDiff(A, krausOf(U)[k]) < 1e-9);
  const head = `Started as ${s.name}, then ${C.phrase} with ${C.sym} = ${strength(p)}. The circuit adds a workspace of ${workspaceName(N)} that starts as 0, applies a unitary to workspace and qubit together, then drops the workspace.`;
  const odds = keep === 1 ? `Measured in the ${s.basis} basis, every shot gives ${s.name}.`
    : keep === 0 ? `Measured in the ${s.basis} basis, every shot gives ${s.other}.`
    : `Measured in the ${s.basis} basis, a shot gives ${s.name} with chance ${pct(keep)} and ${s.other} with chance ${pct(1 - keep)}.`;
  const agree = Math.abs(keep - fromChoi) < 1e-9
    ? `The Choi matrix, read block by block, gives the same chance.`
    : `The Choi matrix gives a different chance, ${pct(fromChoi)}.`;
  const turnPart = alpha === 0 ? turnText(N, alpha)
    : `The workspace is turned by ${degrees(alpha)}: the Kraus operators ${sameA ? 'stayed' : 'changed'}, and the Choi matrix ${sameJ ? 'did not change' : 'changed too'}. ${turnText(N, alpha)}`;
  const need = rank === null ? '' : ` The fewest workspace levels this channel needs is ${rank}, the rank of its Choi matrix.`;
  const tail = got === undefined ? '' : ` This batch of ${n} shots gave ${s.name} ${got} times. Each column groups the shots by the workspace result.`;
  return `${head} ${odds} ${agree} ${turnPart}${need}${tail}`;
}
