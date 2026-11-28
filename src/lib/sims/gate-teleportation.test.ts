import test from 'node:test';
import assert from 'node:assert/strict';

import { checkLabs,close,state,value } from './gate-lab-checks.ts';
const {run,last}=await checkLabs(['gate-teleportation', 'mbqc']);
test('magic-state injection and one-way measurement: corrected branches attain target fidelity; omission can fail',()=>{
 for(const input of ['0','1','+','−','+i'])for(const id of ['gate-teleportation','mbqc']){
  const out=run(id,{input});for(const step of out.slice(-2))close(Number(step.rows!.at(-1)!.value),1);
 }
 assert.ok(Number(last('gate-teleportation',{input:'+',correct:'No'}).rows![0].value)<.99);
 assert.ok(Number(last('mbqc',{input:'0',correct:'No',angle:'0'}).rows![0].value)> .99); // X|+> = |+>
 assert.ok(Number(last('mbqc',{input:'+',correct:'No',angle:'0'}).rows![0].value)<.01);
});

test('uncorrected branches equal T and T dagger up to their known global phases',async()=>{const q=await import('../quantum.ts');const g=await import('./gate-lab.ts');for(const input of ['0','1','+','−','+i']){const s=run('gate-teleportation',{input,correct:'No'});const a=g.ket(input);state(s.at(-2)!.state!,q.matVec(q.T,a));state(s.at(-1)!.state!,q.matVec(q.dagger(q.T),a).map(z=>q.mul(q.expi(Math.PI/4),z)));}});
