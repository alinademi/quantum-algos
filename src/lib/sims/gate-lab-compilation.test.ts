import test from 'node:test';
import assert from 'node:assert/strict';
import * as q from '../quantum.ts';
import * as g from './gate-lab.ts';
import { unitaryError } from './gates.ts';
import { pauli, antiCount } from './pauli-strings.ts';
import { ladder } from './pauli-rotations.ts';
import { conjugate } from './clifford-group.ts';
import { presets } from './clifford-t.ts';
import { layers, recipes } from './circuit-cost.ts';
import { nativeH, nativeCX } from './native-gates.ts';
import { storage } from './classical-simulation.ts';
import { twoLevel } from './decomposition.ts';
import { cartan } from './two-qubit-synthesis.ts';
import { route } from './qubit-routing.ts';

import { checkLabs, close, state, matrix, phase, all, value } from './gate-lab-checks.ts';
const { labs, last } = await checkLabs(['universal', 'pauli-strings', 'pauli-rotations', 'clifford-group', 'clifford-t', 'circuit-cost', 'native-gates', 'transpilation', 'circuit-languages', 'classical-simulation', 'decomposition', 'two-qubit-synthesis', 'qubit-routing']);

test('universality examples and native basis: exact global phase, including CX',()=>{
 matrix(phase(q.matMul(q.RY(Math.PI/2),q.RZ(Math.PI)),Math.PI/2),q.H);
 matrix(phase(g.fullMatrix(1,nativeH(0)),Math.PI/4),q.H);
 matrix(phase(g.fullMatrix(2,nativeCX(0,1)),Math.PI/2),g.control(q.X));
 matrix(g.fullMatrix(1,[g.gate('SX'),g.gate('SX')]),q.X);
});
test('Pauli strings are orthogonal, and commute according to anticommuting site parity',()=>{
 for(const a of all(2,['I','X','Y','Z']))for(const b of all(2,['I','X','Y','Z'])){
  const ab=q.matMul(pauli(a),pauli(b)),ba=q.matMul(pauli(b),pauli(a));
  matrix(ab,phase(ba,antiCount(a,b)*Math.PI));
  close(ab.reduce((s,r,i)=>s+r[i].re,0),a===b?4:0);
 }
});
test('Pauli rotation: basis-change parity ladder equals the Pauli exponential for every nontrivial three-wire string',()=>{
 for(const p of all(3,['I','X','Y','Z']).filter(x=>x!=='III')){
  const t=.37;matrix(g.fullMatrix(3,ladder(p,t)),g.phaseRotation(pauli(p),t));
  assert.equal(ladder(p,t).filter(o=>o.name.startsWith('CNOT')).length,2*([...p].filter(x=>x!=='I').length-1));
 }
});
test('Clifford conjugation preserves Pauli signs; T does not preserve X or Y',()=>{
 assert.equal(conjugate('H','YI'),'−YI');assert.equal(conjugate('S','XI'),'YI');assert.equal(conjugate('CNOT','XI'),'XX');assert.equal(conjugate('CNOT','IZ'),'ZZ');
 assert.equal(conjugate('T','XI'),'Not a signed Pauli string');assert.equal(conjugate('T','ZI'),'ZI');
 for(const [key,s] of Object.entries({'T² = S':q.S,'T⁴ = Z':q.Z,'T⁸ = I':q.I,'T then T†':q.I}))matrix(g.fullMatrix(1,presets[key].map(x=>g.gate(x))),s);
});
test('circuit layers depend on occupied wires, with parallel disjoint gates',()=>{
 assert.deepEqual(layers(recipes['Parallel H and CNOT'],3),[1,1,2,2,3]);
 assert.deepEqual(layers(recipes['Serial chain'],3),[1,2,3,4]);
 assert.equal(value(last('transpilation'),'Native operations'),52); // 1 H=3, 7 CX=7 operations each
 assert.equal(value(last('transpilation',{opt:'No'}),'Native operations'),66);
});
test('circuit languages are illustrative descriptions of the same Bell circuit',()=>{
 for(const opt of labs['circuit-languages'].controls[0].options)state(last('circuit-languages',{language:opt.value}).state!,[q.c(Math.SQRT1_2),q.c(0),q.c(0),q.c(Math.SQRT1_2)]);
});
test('dense storage is exact integer arithmetic; 30 qubits needs 16 GiB',()=>assert.equal(storage(30),16n*1024n**3n));
test('complex Givens decomposition reconstructs arbitrary example matrices with phases',()=>{
 for(let k=0;k<8;k++){const target=g.fullMatrix(2,[g.rotation('Y',23+k*15,0),g.rotation('X',71-k*8,1),g.cx(1,0),g.rotation('Z',17*k,0),g.cx(0,1)]);
  const dec=twoLevel(target);assert.ok(dec.length<=7);for(const f of dec)close(unitaryError(f.matrix),0);matrix(g.fullMatrix(2,dec),target);}
});
test('two-qubit Cartan canonical SWAP and ZZ match exact decompositions',()=>{
 matrix(cartan(Math.PI/4,Math.PI/4,Math.PI/4),phase(g.SWAP,-Math.PI/4));
 matrix(cartan(0,0,.23),g.fullMatrix(2,[g.cx(0,1),g.rotation('Z',.46*180/Math.PI,1),g.cx(0,1)]));
});
test('routing restores all logical wires and only uses nearest-neighbor gates',()=>{
 for(let a=0;a<4;a++)for(let b=0;b<4;b++)if(a!==b){const ops=route(a,b);assert.ok(ops.every(o=>Math.abs(o.wires[0]-o.wires[1])===1));assert.equal(ops.length,2*(Math.abs(a-b)-1)+1);matrix(g.fullMatrix(4,ops),g.fullMatrix(4,[g.cx(a,b)]));}
});
