import test from 'node:test';
import assert from 'node:assert/strict';
import { lab } from './quantum-parallelism.ts';
import { defaults } from './gate-lab.ts';
import { probs } from '../quantum.ts';
test('one XOR query on uniform amplitudes returns exactly four input-output pairs at 1/4 each',()=>{
 const s=lab.run({...defaults(lab),f:'XOR',a:'+',b:'+'}).at(-1)!.state!;
 const p=probs(s);[0,3,5,6].forEach(i=>assert.ok(Math.abs(p[i]-.25)<1e-12));[1,2,4,7].forEach(i=>assert.ok(p[i]<1e-12));
});

test('every function gives four 1/4 pairs matching an independent truth table',()=>{const tables:Record<string,number[]>={zero:[0,0,0,0],one:[1,1,1,1],'copy x1':[0,1,0,1],'NOT x1':[1,0,1,0],AND:[0,0,0,1],XOR:[0,1,1,0]};for(const [f,table] of Object.entries(tables)){const step=lab.run({...defaults(lab),f}).at(-1)!;probs(step.state!).forEach((p,i)=>assert.ok(Math.abs(p-((i&1)===table[i>>1]?.25:0))<1e-12));assert.ok(step.rows!.every(r=>r.label.includes('computed classically')));}});
