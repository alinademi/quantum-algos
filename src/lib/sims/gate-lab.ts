// Shared controls and state-vector readouts for the circuit-region labs.
// Each stop supplies its own experiment. All operations use qubit 0 as the leftmost bit.
import { c, abs, abs2, add, mul, scale, conj, sub, expi, basis, fromBloch, tensor, matVec, matMul, dagger, probs, label, X, Y, Z, I, H, S, T, P, RX, RY, RZ, type C, type State, type Matrix } from '../quantum.ts';

export type Values = Record<string, string>;
export type Control = { key: string; label: string; options: { value: string; label: string }[]; active?: (v: Values) => boolean };
export type Row = { label: string; value: string };
export type Diagram = { n: number; ops: { name: string; wires: number[] }[]; current: number; measureWires?: number[] };
export type Step = { start?: string; diagram?: Diagram; title: string; note: string; state?: State; distribution?: { labels: string[]; p: number[] }; rows?: Row[]; estimate?: { label: string; values: number[] } };
export type Lab = { controls: Control[]; run: (v: Values) => Step[] };
export type Op = { name: string; wires: number[]; matrix: Matrix };
export const choice = (key: string, label: string, options: readonly (string | [string, string])[], active?: Control['active']): Control => ({
  key, label, active, options: options.map(o => typeof o === 'string' ? { value: o, label: o } : { value: o[0], label: o[1] }),
});
export const defaults = (lab: Lab): Values => Object.fromEntries(lab.controls.map(x => [x.key, x.options[0].value]));
export const deg = (x: string | number) => Number(x) * Math.PI / 180;
export const angles = ['0', '30', '45', '60', '90', '120', '180', '270', '360'];
// Finite-angle examples: hide roundoff-scale probabilities in the display, never in the sampler.
export const displayProbability=(p:number)=>p<1e-24?0:Math.min(1,p);
export const num = (x: number) => Math.abs(x) < 1e-12 ? '0' : Number(x.toPrecision(6)).toString();
export function complex(a: C): string {
  if (Math.abs(a.im) < 1e-12) return num(a.re);
  if (Math.abs(a.re) < 1e-12) return num(a.im) + 'i';
  return num(a.re) + (a.im < 0 ? ' − ' : ' + ') + num(Math.abs(a.im)) + 'i';
}
export const row = (label: string, value: string | number): Row => ({ label, value: typeof value === 'number' ? (Number.isSafeInteger(value)?String(value):num(value)) : value });
export const details = (title: string, note: string, rows: Row[]): Step => ({ title, note, rows });
export const stateStep = (title: string, note: string, state: State, rows?: Row[]): Step => ({ title, note, state, rows });
const names = new WeakMap<State,string>();
const named = (state:State, name:string):State => { names.set(state,name);return state; };
export const ket = (name: string): State => named(ketVector(name),'|'+name+'⟩');
const ketVector = (name: string): State => {
  if (name === '0' || name === '1') return basis(1, +name);
  if (name === '+') return fromBloch(Math.PI / 2, 0);
  if (name === '−') return fromBloch(Math.PI / 2, Math.PI);
  if (name === '+i') return fromBloch(Math.PI / 2, Math.PI / 2);
  if (name === '−i') return fromBloch(Math.PI / 2, -Math.PI / 2);
  throw Error('unknown ket: ' + name);
};
export const kets = ['0', '1', '+', '−', '+i', '−i'];
export const product = (...kets: string[]) => named(kets.map(ket).reduce(tensor),kets.map(k=>'|'+k+'⟩').join(' '));
export const bits = (n: number) => Array.from({ length: 2 ** n }, (_, i) => i.toString(2).padStart(n, '0'));
export const bstate = (s: string) => named(basis(s.length, parseInt(s, 2)),'|'+s+'⟩');
export function describeState(s:State):string {
 const known=names.get(s);if(known)return known;
 const a=s.flatMap((z,i)=>abs2(z)>1e-20?[complex(z)+' '+label(i,Math.log2(s.length))]:[]);
 return a.length<=4?a.join(' + '):'the displayed '+Math.log2(s.length)+'-qubit input state';
}
export const eye = (n: number): Matrix => Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => c(+(i === j))));
export const permutation = (n: number, map: (x: number) => number): Matrix => {
  const targets = Array.from({ length: n }, (_, j) => map(j));
  if (targets.some(x => !Number.isInteger(x) || x < 0 || x >= n) || new Set(targets).size !== n) throw Error('not a permutation');
  return eye(n).map((r, i) => r.map((_, j) => c(+(targets[j] === i))));
};
export const control = (u: Matrix, count = 1, on = 2 ** count - 1): Matrix => {
  const d = u.length, out = eye(d * 2 ** count);
  for (let i = 0; i < d; i++) for (let j = 0; j < d; j++) out[on * d + i][on * d + j] = u[i][j];
  return out;
};
export const SWAP = permutation(4, x => ((x & 1) << 1) | (x >> 1));
export const op = (name: string, matrix: Matrix, ...wires: number[]): Op => ({ name, matrix, wires });
export const cx = (a: number, b: number) => op('CNOT', control(X), a, b);
export const ccx = (a: number, b: number, t: number) => op('Toffoli', control(X, 2), a, b, t);
export const swap = (a: number, b: number) => op('SWAP', SWAP, a, b);
export const G: Record<string, Matrix> = { I, X, Y, Z, H, S, T, 'S†': dagger(S), 'T†': dagger(T), SX: matMul(H, matMul(S, H)) };
export const gate = (name: string, wire = 0) => op(name, G[name], wire);
export const rotation = (axis: string, degrees: string | number, wire = 0) => op('R' + axis + '(' + degrees + '°)', ({ X: RX, Y: RY, Z: RZ })[axis]!(deg(degrees)), wire);
export function apply(state: State, o: Op): State {
  const n = Math.log2(state.length), k = o.wires.length, d = 2 ** k;
  if (!Number.isInteger(n) || new Set(o.wires).size !== k || o.wires.some(w => !Number.isInteger(w) || w < 0 || w >= n) || o.matrix.length !== d || o.matrix.some(r => r.length !== d)) throw Error('invalid gate wires or matrix');
  const masks = o.wires.map(w => 2 ** (n - w - 1));
  const mask = masks.reduce((a, b) => a | b, 0);
  const offset = (i: number) => masks.reduce((v, m, j) => v | (i & (1 << (k - j - 1)) ? m : 0), 0);
  const result = state.map(() => c(0));
  for (let i = 0; i < state.length; i++) {
    if (i & mask) continue;
    const out = matVec(o.matrix, Array.from({ length: d }, (_, j) => state[i | offset(j)]));
    out.forEach((a, j) => { result[i | offset(j)] = a; });
  }
  return result;
}
export const runOps = (s: State, ops: Op[]) => ops.reduce(apply, s);
export const inverse = (ops: Op[]): Op[] => [...ops].reverse().map(o => ({ ...o, name: o.name + '†', matrix: dagger(o.matrix) }));
export const sequence = (start: State, ops: Op[], endNote = '', startLabel = describeState(start), measureWires?: number[]): Step[] => {
  let s = start;
  const diagram = (current: number): Diagram => ({ n: Math.log2(start.length), ops: ops.map(({name,wires}) => ({name,wires})), current, measureWires });
  return [{...stateStep('Start state', 'Started as '+startLabel+'. Qubit 0 is on the left.', s), start:startLabel, diagram: diagram(-1)}, ...ops.map((o, i) => {
    s = apply(s, o);
    return {...stateStep(o.name + ' on ' + o.wires.map(w => 'q' + w).join(', '), 'Started as '+startLabel+', after '+o.name+': '+(i === ops.length - 1 && endNote ? endNote : 'the state below is before measurement.'), s, o.matrix.length <= 4 ? matrixRows(o.matrix) : undefined), start:startLabel, diagram: diagram(i)};
  })];
};
export const matrixRows = (m: Matrix): Row[] => m.map((r, i) => row('Matrix row ' + i, r.map(complex).join('  ')));
export const probability = (s: State, wire: number, value = 1): number => {
  const mask = 1 << (Math.log2(s.length) - wire - 1);
  return s.reduce((v, a, i) => v + (+!!(i & mask) === value ? abs2(a) : 0), 0);
};
export function branch(s: State, wire: number, outcome: number): { p: number; state: State } | null {
  const mask = 1 << (Math.log2(s.length) - wire - 1);
  const kept = s.map((a, i) => +!!(i & mask) === outcome ? a : c(0));
  const p = kept.reduce((v, a) => v + abs2(a), 0);
  // Treat roundoff-only branches in these finite-angle demonstrations as zero.
  return p < 1e-24 ? null : { p, state: kept.map(a => scale(a, 1 / Math.sqrt(p))) };
}
export function mixture(branches: { p: number; state: State }[]): number[] {
  const out = branches[0].state.map(() => 0);
  for (const b of branches) probs(b.state).forEach((p, i) => { out[i] += b.p * p; });
  return out;
}
export const distribution = (title: string, note: string, labels: string[], p: number[], rows?: Row[]): Step => ({ title, note, distribution: { labels, p }, rows });
export const densityRows = (s: State): Row[] => matrixRows(s.map(a => s.map(b => mul(a, conj(b)))));
export const phaseRotation = (p: Matrix, theta: number): Matrix => p.map((r, i) => r.map((x, j) => add(c(i === j ? Math.cos(theta) : 0), mul(c(0, -Math.sin(theta)), x))));
export const fidelity = (a: State, b: State): number => abs2(a.reduce((t, x, i) => add(t, mul(conj(x), b[i])), c(0)));
export const matrixGap = (a: Matrix, b: Matrix): number => Math.max(...a.flatMap((r, i) => r.map((v, j) => abs(sub(v, b[i][j])))));
export const fullMatrix = (n: number, ops: Op[]): Matrix => eye(2 ** n).map((_, j) => runOps(basis(n, j), ops)).reduce((m: Matrix, col, j) => {
  col.forEach((x, i) => { m[i][j] = x; }); return m;
}, eye(2 ** n));
export const maxColumnGap = (a: Matrix, b: Matrix) => matrixGap(a, b);
export const stateDistribution = (s: State) => ({ labels: s.map((_, i) => label(i, Math.log2(s.length))), p: probs(s) });

// Empirical mean and ideal standard error of an observable recorded per shot.
export function estimateShots(p:number[], counts:number[], values:number[]){
 const n=counts.reduce((a,b)=>a+b,0);
 const exact=p.reduce((a,b,i)=>a+b*values[i],0);
 const variance=p.reduce((a,b,i)=>a+b*(values[i]-exact)**2,0);
 return {sample:counts.reduce((a,b,i)=>a+b*values[i],0)/n,exact,standardError:Math.sqrt(variance/n)};
}
