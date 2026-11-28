import test from 'node:test';
import assert from 'node:assert/strict';
import * as q from '../quantum.ts';
import * as g from './gate-lab.ts';
import { B1, B2 } from './topological-model.ts';

import { checkLabs,matrix,phase,value } from './gate-lab-checks.ts';
const {run,last}=await checkLabs(['topological-model']);
test('Ising braid relation holds and order matters',()=>{
 matrix(g.fullMatrix(1,[B1,B2,B1]),g.fullMatrix(1,[B2,B1,B2]));
 assert.ok(g.matrixGap(g.fullMatrix(1,[B1,B2]),g.fullMatrix(1,[B2,B1]))>.1);
});
test('Ising R and F matrices agree with braid generators up to common phase',()=>{const R=[[q.expi(-Math.PI/8),q.c(0)],[q.c(0),q.expi(3*Math.PI/8)]];matrix(phase(B1.matrix,Math.PI/8),R);matrix(phase(B2.matrix,Math.PI/8),q.matMul(q.H,q.matMul(R,q.H)));});
test('Ising braids generate exactly the 24 single-qubit Cliffords modulo phase',()=>{
 const group=[q.I];const equivalent=(a:q.Matrix,b:q.Matrix)=>q.abs(q.inner(a.flat(),b.flat()))>2-1e-10;
 for(let i=0;i<group.length;i++){
  for(const generator of [B1.matrix,B2.matrix]){
   const next=q.matMul(generator,group[i]);
   if(!group.some(u=>equivalent(u,next)))group.push(next);
  }
  assert.ok(group.length<=24);
 }
 assert.equal(group.length,24);
 for(const u of group)for(const p of [q.X,q.Y,q.Z]){
  const conjugated=q.matMul(u,q.matMul(p,q.dagger(u)));
  assert.ok([q.X,q.Y,q.Z].some(x=>equivalent(x,conjugated)));
 }
});
test('braid lab classifies the selected word and identifies the Hadamard',()=>{for(const order of ['1 then 2','2 then 1','1–2–1','2–1–2','Undo both']){const rows=last('topological-model',{order}).rows!;assert.equal(rows.find(r=>r.label.startsWith('Clifford check'))!.value,'Yes');assert.equal(rows.find(r=>r.label.startsWith('Equals H'))!.value,order==='1–2–1'||order==='2–1–2'?'Yes':'No');}matrix(g.fullMatrix(1,[B1,B2,B1]),phase(q.H,-Math.PI/2));});
