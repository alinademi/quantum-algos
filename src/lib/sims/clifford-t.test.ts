import test from 'node:test';
import assert from 'node:assert/strict';
import * as q from '../quantum.ts';
import * as g from './gate-lab.ts';
import { conjugate } from './clifford-group.ts';
import { presets,mergedTCount } from './clifford-t.ts';

import { checkLabs,close,matrix,value } from './gate-lab-checks.ts';
const {last}=await checkLabs(['clifford-t']);
test('Clifford conjugation maps to signed Paulis; T does not preserve X or Y',()=>{
 assert.equal(conjugate('H','YI'),'−YI');assert.equal(conjugate('S','XI'),'YI');assert.equal(conjugate('CNOT','XI'),'XX');assert.equal(conjugate('CNOT','IZ'),'ZZ');
 assert.equal(conjugate('T','XI'),'Not a signed Pauli string');assert.equal(conjugate('T','ZI'),'ZI');
 for(const [key,s] of Object.entries({'T² = S':q.S,'T⁴ = Z':q.Z,'T⁸ = I':q.I,'T then T†':q.I}))matrix(g.fullMatrix(1,presets[key].map(x=>g.gate(x))),s);
});
test('adjacent T powers reduce to Clifford or at most one T',()=>{for(const recipe of ['T² = S','T⁴ = Z','T⁸ = I','T then T†'])assert.equal(mergedTCount(presets[recipe]),0);assert.equal(mergedTCount(presets['H T H']),1);});
test('T on plus leaves the six pure stabilizer states but T² returns to one',()=>{for(const [recipe,expected] of [['T','No'],['T² = S','Yes'],['T⁸ = I','Yes']])assert.equal(last('clifford-t',{recipe,start:'+'}).rows!.find(r=>r.label.startsWith('One of the six'))!.value,expected);assert.equal(last('clifford-t',{recipe:'T',start:'0'}).rows!.find(r=>r.label.startsWith('One of the six'))!.value,'Yes');const a=q.matVec(q.T,q.plus());q.bloch(a).forEach((n,i)=>close(n,i<2?Math.SQRT1_2:0));});
