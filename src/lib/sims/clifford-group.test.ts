import test from 'node:test';
import assert from 'node:assert/strict';
import * as q from '../quantum.ts';
import * as g from './gate-lab.ts';
import { conjugate } from './clifford-group.ts';
import { presets } from './clifford-t.ts';

import { checkLabs,matrix } from './gate-lab-checks.ts';
await checkLabs(['clifford-group']);
test('Clifford conjugation maps to signed Paulis; T does not preserve X or Y',()=>{
 assert.equal(conjugate('H','YI'),'−YI');assert.equal(conjugate('S','XI'),'YI');assert.equal(conjugate('CNOT','XI'),'XX');assert.equal(conjugate('CNOT','IZ'),'ZZ');
 assert.equal(conjugate('T','XI'),'Not a signed Pauli string');assert.equal(conjugate('T','ZI'),'ZI');
 for(const [key,s] of Object.entries({'T² = S':q.S,'T⁴ = Z':q.Z,'T⁸ = I':q.I,'T then T†':q.I}))matrix(g.fullMatrix(1,presets[key].map(x=>g.gate(x))),s);
});

test('Bell preparation creates entanglement while preserving the signed Pauli group',async()=>{const {lab}=await import('./clifford-group.ts');const steps=lab.run({g:'Bell preparation',p:'ZI'});assert.equal(steps[2].rows![0].value,'1');for(const [i,a] of steps[2].state!.entries())assert.ok(q.abs(q.sub(a,q.c(i===0||i===3?Math.SQRT1_2:0)))<1e-9);assert.equal(conjugate('Bell preparation','ZI'),'XX');assert.equal(conjugate('Bell preparation','IZ'),'ZZ');});

test('conjugating XI by T produces the actual non-Pauli matrix, not just a label',async()=>{const {conjugatedMatrix}=await import('./clifford-group.ts');const x=q.kron(q.X,q.I),y=q.kron(q.Y,q.I);matrix(conjugatedMatrix('T','XI'),x.map((r,i)=>r.map((z,j)=>q.scale(q.add(z,y[i][j]),Math.SQRT1_2))));});
