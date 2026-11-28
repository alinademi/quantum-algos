import test from 'node:test';
import assert from 'node:assert/strict';
import * as q from '../quantum.ts';
import * as g from './gate-lab.ts';
import { noScratch } from './multi-controlled.ts';

import { checkLabs,state,matrix,phase } from './gate-lab-checks.ts';
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

test('cost comparison counts both real circuits for the selected number of controls',()=>{for(const k of [2,3,4]){const rows=run('multi-controlled',{count:String(k)})[0].rows!,get=(label:string)=>Number(rows.find(r=>r.label===label)!.value),m=k+1;assert.equal(get('Shown phase ladder: CNOTs'),(m-2)*2**m+2);assert.equal(get('Shown phase ladder: phase gates'),2**m-1);assert.equal(get('Clean ladder: CNOTs at 6 per Toffoli'),6*(2*k-3));}});

test('phase ladder includes the two local H gates in addition to phase and CNOT gates',()=>{const steps=run('multi-controlled',{count:'4',mode:'No scratch (phase ladder)'});const rows=steps.at(-1)!.rows!,get=(k:string)=>Number(rows.find(r=>r.label===k)!.value);assert.equal(steps.length-1,get('CNOT count')+get('Phase gates')+get('Hadamards'));assert.equal(get('Hadamards'),2);});
