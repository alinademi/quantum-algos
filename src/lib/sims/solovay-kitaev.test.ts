import test from 'node:test';
import assert from 'node:assert/strict';
import { distance,search,convergence } from './solovay-kitaev.ts';
import { fullMatrix,gate } from './gate-lab.ts';
import { RZ,RY,T,I,H,dagger,abs,inner,matMul,type Matrix } from '../quantum.ts';
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
test('phase-normalized BFS agrees with independent exhaustive matrices to length 11',()=>{
 const targets=[RY,RZ].flatMap(r=>[30,60,17,100].map(a=>r(a*Math.PI/180))),best=targets.map(()=>({error:Infinity,length:0}));
 const alphabet=[H,T,dagger(T)];
 function walk(u:Matrix,length:number){
  for(const [i,target] of targets.entries()){
   // Trace-overlap distance computed directly on full matrices.
   const error=Math.sqrt(Math.max(0,4-2*abs(inner(u.flat(),target.flat()))));
   if(error<best[i].error-1e-12||Math.abs(error-best[i].error)<1e-12&&length<best[i].length)best[i]={error,length};
  }
  if(length<11)for(const g of alphabet)walk(matMul(g,u),length+1);
 }
 walk(I,0);
 for(const [i,target] of targets.entries()){const actual=search(target,11);assert.ok(Math.abs(actual.error-best[i].error)<1e-9);assert.equal(actual.word.length,best[i].length);}
});
