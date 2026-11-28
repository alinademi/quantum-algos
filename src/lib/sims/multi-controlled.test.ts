import test from 'node:test';
import assert from 'node:assert/strict';
import * as q from '../quantum.ts';
import * as g from './gate-lab.ts';
import { boolean, viaNand } from './classical-gates.ts';
import { unitaryError } from './gates.ts';
import { u, euler } from './single-qubit-unitary.ts';
import { stderr } from './shots.ts';
import { implementation } from './controlled-gates.ts';
import { noScratch } from './multi-controlled.ts';
import { fredkin } from './fredkin.ts';
import { family } from './two-qubit-gates.ts';
import { circuits } from './circuit-identities.ts';

import { checkLabs, close, state, matrix, phase } from './gate-lab-checks.ts';
const {run,last}=await checkLabs(['multi-controlled']);
test('multi-controlled scratch ladder acts correctly on definite and coherent controls and cleans scratch',()=>{
 for(const count of ['2','3','4'])for(const pattern of ['All 1','First 0','First +'])for(const target of ['0','1']){
  const direct=last('multi-controlled',{count,pattern,target,mode:'Direct gate'}).state!;
  const decomposed=last('multi-controlled',{count,pattern,target,mode:'Clean scratch'}).state!;
  state(decomposed,q.tensor(direct,q.basis(+count-2,0)));
  state(last('multi-controlled',{count,pattern,target,mode:'No scratch (phase ladder)'}).state!,direct);
 }
});
test('no-scratch multi-controlled X is exact on every basis input',()=>{
 for(let n=2;n<=4;n++)matrix(g.fullMatrix(n+1,noScratch(Array.from({length:n},(_,i)=>i),n)),g.control(q.X,n));
});
test('ladder cost is 2k-3 Toffolis and no-scratch parity has 2^(k+1)-1 phases',()=>{for(const k of [2,3,4]){const rows=last('multi-controlled',{count:String(k)}).rows!;assert.equal(Number(rows.find(r=>r.label==='Toffoli count')!.value),2*k-3);assert.equal(Number(rows.find(r=>r.label.startsWith('CNOTs'))!.value),6*(2*k-3));}});
