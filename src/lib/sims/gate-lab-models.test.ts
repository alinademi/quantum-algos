import test from 'node:test';
import assert from 'node:assert/strict';
import * as q from '../quantum.ts';
import * as g from './gate-lab.ts';
import { unitaryError } from './gates.ts';
import { pauli } from './pauli-strings.ts';
import { evolveGenerators, prep } from './stabilizer-states.ts';
import { expect } from './gottesman-knill.ts';
import { search } from './solovay-kitaev.ts';
import { shift } from './qtm.ts';
import { evolution } from './adiabatic.ts';
import { B1, B2 } from './topological-model.ts';
import { gaussian } from './cv-model.ts';

import { checkLabs, close, state, matrix, phase, all, value } from './gate-lab-checks.ts';
const { run, last } = await checkLabs(['stabilizer-states', 'gottesman-knill', 'solovay-kitaev', 'gate-teleportation', 'zx-calculus', 'qtm', 'mbqc', 'adiabatic', 'topological-model', 'cv-model']);

test('signed stabilizer generators and GF(2) expectation solver agree with dense simulation',()=>{
 for(let n=2;n<=4;n++)for(const mode of ['GHZ','Product plus','Signed example']){
  const ops=prep(n,mode),s=g.runOps(q.basis(n,0),ops),gens=evolveGenerators(n,ops);
  for(const gen of gens)close(gen.sign*q.inner(s,q.matVec(pauli(gen.p),s)).re,1);
  for(const query of all(n,['I','X','Y','Z']))close(expect(gens,query),q.inner(s,q.matVec(pauli(query),s)).re);
 }
 assert.equal(expect(evolveGenerators(2,prep(2,'Signed example')),'ZI'),-1);
});
test('bounded approximation search is phase insensitive and monotonic in budget',()=>{
 assert.equal(search(q.I,0).error,0);close(search(q.T,1).error,0);const target=q.RY(.71);let prev=Infinity;
 for(let k=0;k<=8;k+=2){const result=search(target,k);assert.ok(result.error<=prev);assert.ok(result.word.length<=k);prev=result.error;}
});
test('magic-state injection and one-way measurement: corrected branches attain target fidelity; omission can fail',()=>{
 for(const input of ['0','1','+','−','+i'])for(const id of ['gate-teleportation','mbqc']){
  const out=run(id,{input});for(const step of out.slice(-2))close(Number(step.rows!.at(-1)!.value),1);
 }
 assert.ok(Number(last('gate-teleportation',{input:'+',correct:'No'}).rows![0].value)<.99);
 assert.ok(Number(last('mbqc',{input:'0',correct:'No',angle:'0'}).rows![0].value)> .99); // X|+> = |+>
 assert.ok(Number(last('mbqc',{input:'+',correct:'No',angle:'0'}).rows![0].value)<.01);
});
test('ZX color change and fusion preserve full matrices (all control settings checked above)',()=>{
 matrix(q.matMul(q.P(.3),q.P(.7)),q.P(1));matrix(q.matMul(q.H,q.matMul(q.P(Math.PI),q.H)),q.X);
});
test('QTM toy shift wraps at boundaries and is a bijection; direction remains coherent',()=>{
 for(let i=0;i<8;i++)state(g.apply(q.basis(3,i),shift),q.basis(3,(i&4)|(((i&3)+(i&4?1:3))%4)));
 close(unitaryError(shift.matrix),0);
});
test('adiabatic midpoint evolution maintains norm, converges under step refinement and follows the gapped ground state at long time',()=>{
 for(const t of [1,5,20,50,100]){
  const a=evolution(t,1000).at(-1)!.psi,b=evolution(t,2000).at(-1)!.psi;
  assert.ok(g.fidelity(a,b)>1-1e-5);close(q.norm2(a),1);
 }
 assert.ok(q.probs(evolution(100).at(-1)!.psi)[0]>.99);
 assert.ok(q.probs(evolution(1).at(-1)!.psi)[0]<.8);
});
test('Ising braid relation holds and order matters',()=>{
 matrix(g.fullMatrix(1,[B1,B2,B1]),g.fullMatrix(1,[B2,B1,B2]));
 assert.ok(g.matrixGap(g.fullMatrix(1,[B1,B2]),g.fullMatrix(1,[B2,B1]))>.1);
});
test('Gaussian rotations preserve covariance determinant and Heisenberg bound; displacement does not change variance',()=>{
 for(const r of [0,.3,.7,1])for(const t of [0,.7,Math.PI/2,2.1]){
  const a=gaussian(r,t,2),b=gaussian(r,t,0);
  close(a.vx*a.vp-a.cov*a.cov,.25);close(a.vx,b.vx);close(a.vp,b.vp);close(a.cov,b.cov);
  assert.ok(a.vx*a.vp>=.25-1e-9);close(Math.hypot(a.x,a.p),2);
 }
 const a=gaussian(.7,0,0);close(a.vx,Math.exp(-1.4)/2);close(a.vp,Math.exp(1.4)/2);
});
