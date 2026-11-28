import test from 'node:test';
import * as q from '../quantum.ts';
import * as g from './gate-lab.ts';
import { bitOracle, phaseOracle, funcs, f } from './oracles.ts';

import { checkLabs, close, state, matrix } from './gate-lab-checks.ts';
const {last}=await checkLabs(['oracles', 'quantum-parallelism']);
test('oracles: clean bit encoding, involution, and phase kickback for every function and input',()=>{
 for(const name of funcs){const bit=bitOracle(name),phaseMap=phaseOracle(name);matrix(q.matMul(bit,bit),g.eye(8));
  for(let x=0;x<4;x++){for(let y=0;y<2;y++)state(q.matVec(bit,q.basis(3,2*x+y)),q.basis(3,2*x+(y^f(name,x))));
   state(q.matVec(bit,q.tensor(q.basis(2,x),q.minus())),q.tensor(q.matVec(phaseMap,q.basis(2,x)),q.minus()));}
  const p=q.probs(last('quantum-parallelism',{f:name}).state!);for(let i=0;i<8;i++)close(p[i],(i&1)===f(name,i>>1)?.25:0);
 }
});
