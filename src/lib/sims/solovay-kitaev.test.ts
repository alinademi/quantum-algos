import test from 'node:test';
import assert from 'node:assert/strict';
import { distance,search,convergence } from './solovay-kitaev.ts';
import { fullMatrix,gate } from './gate-lab.ts';
import { RZ,RY,T,I } from '../quantum.ts';
test('dedupe chooses shortest exact ties and improves non-Clifford targets',()=>{
 assert.equal(search(I,28).word.length,0);assert.deepEqual(search(T,28).word,['T']);
 for(const r of [RY,RZ])for(const angle of [30,60,17,100]){
  const target=r(angle*Math.PI/180),v=convergence(target);
  assert.ok(v.at(-1)!.error<v[0].error/2, 'real improvement');
  for(const x of v){
   assert.ok(x.word.length<=x.length);
   assert.ok(Math.abs(distance(fullMatrix(1,x.word.map(n=>gate(n))),target)-x.error)<1e-9);
  }
 }
});
