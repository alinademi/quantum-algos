// Core quantum math for every simulator on the site. One place, tested in quantum.test.ts.
// Conventions:
// - A state on n qubits is an array of 2^n complex amplitudes.
// - Basis index bits read left to right as qubit 0, 1, ..., n-1: index 0b10 on 2 qubits is |10>, qubit 0 is 1.
// - Probabilities follow the Born rule: p(i) = |amplitude_i|^2.

export type C = { re: number; im: number };
export type State = C[];
export type Matrix = C[][];

export const c = (re: number, im = 0): C => ({ re, im });
export const add = (a: C, b: C): C => c(a.re + b.re, a.im + b.im);
export const sub = (a: C, b: C): C => c(a.re - b.re, a.im - b.im);
export const mul = (a: C, b: C): C => c(a.re * b.re - a.im * b.im, a.re * b.im + a.im * b.re);
export const scale = (a: C, k: number): C => c(a.re * k, a.im * k);
export const conj = (a: C): C => c(a.re, -a.im);
export const abs2 = (a: C): number => a.re * a.re + a.im * a.im;
export const abs = (a: C): number => Math.sqrt(abs2(a));
export const arg = (a: C): number => Math.atan2(a.im, a.re);
/** e^{i theta} */
export const expi = (theta: number): C => c(Math.cos(theta), Math.sin(theta));

const S2 = Math.SQRT1_2;

// ---- States
export const basis = (n: number, index: number): State =>
  Array.from({ length: 2 ** n }, (_, i) => c(i === index ? 1 : 0));
export const ket0 = (): State => [c(1), c(0)];
export const ket1 = (): State => [c(0), c(1)];
export const plus = (): State => [c(S2), c(S2)];
export const minus = (): State => [c(S2), c(-S2)];
/** cos(theta/2)|0> + e^{i phi} sin(theta/2)|1>, the point (theta, phi) on the Bloch sphere. */
export const fromBloch = (theta: number, phi: number): State => [c(Math.cos(theta / 2)), scale(expi(phi), Math.sin(theta / 2))];

export const norm2 = (s: State): number => s.reduce((t, a) => t + abs2(a), 0);
export const normalize = (s: State): State => {
  const k = Math.sqrt(norm2(s));
  if (k === 0) throw new Error('zero vector');
  return s.map((a) => scale(a, 1 / k));
};
/** <a|b> */
export const inner = (a: State, b: State): C => a.reduce((t, x, i) => add(t, mul(conj(x), b[i])), c(0));
export const tensor = (a: State, b: State): State => a.flatMap((x) => b.map((y) => mul(x, y)));
export const probs = (s: State): number[] => s.map(abs2);

// ---- Gates (2x2 unless named otherwise)
export const I: Matrix = [[c(1), c(0)], [c(0), c(1)]];
export const X: Matrix = [[c(0), c(1)], [c(1), c(0)]];
export const Y: Matrix = [[c(0), c(0, -1)], [c(0, 1), c(0)]];
export const Z: Matrix = [[c(1), c(0)], [c(0), c(-1)]];
export const H: Matrix = [[c(S2), c(S2)], [c(S2), c(-S2)]];
export const S: Matrix = [[c(1), c(0)], [c(0), c(0, 1)]];
export const T: Matrix = [[c(1), c(0)], [c(0), expi(Math.PI / 4)]];
export const P = (phi: number): Matrix => [[c(1), c(0)], [c(0), expi(phi)]];
export const RX = (t: number): Matrix => [[c(Math.cos(t / 2)), c(0, -Math.sin(t / 2))], [c(0, -Math.sin(t / 2)), c(Math.cos(t / 2))]];
export const RY = (t: number): Matrix => [[c(Math.cos(t / 2)), c(-Math.sin(t / 2))], [c(Math.sin(t / 2)), c(Math.cos(t / 2))]];
export const RZ = (t: number): Matrix => [[expi(-t / 2), c(0)], [c(0), expi(t / 2)]];

export const matVec = (m: Matrix, s: State): State => m.map((row) => row.reduce((t, x, j) => add(t, mul(x, s[j])), c(0)));
export const matMul = (a: Matrix, b: Matrix): Matrix => a.map((row) => b[0].map((_, j) => row.reduce((t, x, k) => add(t, mul(x, b[k][j])), c(0))));
export const dagger = (m: Matrix): Matrix => m[0].map((_, j) => m.map((row) => conj(row[j])));
export const kron = (a: Matrix, b: Matrix): Matrix =>
  a.flatMap((ra) => b.map((rb) => ra.flatMap((x) => rb.map((y) => mul(x, y)))));

const bit = (i: number, q: number, n: number) => (i >> (n - 1 - q)) & 1;

/** Apply a 2x2 gate u to qubit q of an n-qubit state. */
export function apply1(s: State, u: Matrix, q: number, n = Math.log2(s.length)): State {
  const out = s.map(() => c(0));
  const m = 1 << (n - 1 - q);
  for (let i = 0; i < s.length; i++) {
    if (i & m) continue;
    const a = s[i], b = s[i | m];
    out[i] = add(mul(u[0][0], a), mul(u[0][1], b));
    out[i | m] = add(mul(u[1][0], a), mul(u[1][1], b));
  }
  return out;
}

/** Apply a 2x2 gate u to qubit t only where every control qubit is 1. */
export function controlled(s: State, u: Matrix, controls: number[], t: number, n = Math.log2(s.length)): State {
  const ones = (i: number) => controls.every((q) => bit(i, q, n) === 1);
  const full = apply1(s, u, t, n);
  return s.map((a, i) => (ones(i) ? full[i] : a));
}
export const cnot = (s: State, control: number, target: number, n?: number) => controlled(s, X, [control], target, n);

// ---- Measurement
/** Probability that qubit q reads 1. */
export const probOne = (s: State, q: number, n = Math.log2(s.length)) => s.reduce((t, a, i) => t + (bit(i, q, n) ? abs2(a) : 0), 0);

/** Measure qubit q: returns the result and the state after it (collapsed and renormalized). */
export function measureQubit(s: State, q: number, rand: () => number, n = Math.log2(s.length)): { result: 0 | 1; state: State } {
  const result = rand() < probOne(s, q, n) ? 1 : 0;
  return { result, state: normalize(s.map((a, i) => (bit(i, q, n) === result ? a : c(0)))) };
}

/** Draw one basis index from a probability list. */
export function draw(p: number[], rand: () => number): number {
  let r = rand();
  for (let i = 0; i < p.length; i++) { r -= p[i]; if (r < 0 && p[i] > 0) return i; }
  // Rounding left the chances a hair under 1: fall back to the last outcome that can happen, never a zero-chance one.
  for (let i = p.length - 1; i >= 0; i--) if (p[i] > 0) return i;
  throw new Error('draw: no outcome has a chance above 0');
}

/** Counts of each basis index over many shots. */
export const sample = (p: number[], shots: number, rand: () => number): number[] => {
  const counts = p.map(() => 0);
  for (let k = 0; k < shots; k++) counts[draw(p, rand)]++;
  return counts;
};

/** Small seeded random generator (mulberry32), so a page can replay the same shots. */
export function rng(seed = 1): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---- One qubit on the Bloch sphere
/** Bloch vector (x, y, z) of a one-qubit pure state. Global phase does not change it. */
export function bloch(s: State): [number, number, number] {
  const [a, b] = s;
  const ab = mul(conj(a), b);
  return [2 * ab.re, 2 * ab.im, abs2(a) - abs2(b)];
}

/** Label like "|01>" for basis index i on n qubits. */
export const label = (i: number, n: number) => '|' + i.toString(2).padStart(n, '0') + '⟩';
