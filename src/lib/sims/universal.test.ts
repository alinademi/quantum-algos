import test from 'node:test';
import assert from 'node:assert/strict';
import * as q from '../quantum.ts';
import * as g from './gate-lab.ts';
import { checkLabs, close, state, matrix, phase } from './gate-lab-checks.ts';
const {run,last}=await checkLabs(['universal']);
test('each live decomposition matches the independent target with its stated phase',()=>{
 for(const target of ['Hadamard','CZ','Phase π/4']){
  const u=target==='Hadamard'?q.kron(q.H,q.I):target==='CZ'?g.control(q.Z):q.kron(q.T,q.I);
  const phi=target==='Hadamard'?Math.PI/2:target==='CZ'?0:Math.PI/8;
  for(const a of ['+','0','1','+i'])for(const b of ['0','1','+']){
   const step=last('universal',{target,a,b});state(step.state!.map(z=>q.mul(q.expi(phi),z)),q.matVec(u,g.product(a,b)));
   assert.equal(step.rows!.find(r=>r.label==='Global phase applied')!.value,phi===0?'1':phi===Math.PI/2?'exp(iπ/2)':'exp(iπ/8)');
  }
 }
});
