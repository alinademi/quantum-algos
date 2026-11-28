import test from 'node:test';
import assert from 'node:assert/strict';
import { lab } from './quantum-parallelism.ts';
import { defaults } from './gate-lab.ts';
import { probs } from '../quantum.ts';
test('one XOR query on uniform amplitudes returns exactly four input-output pairs at 1/4 each',()=>{
 const s=lab.run({...defaults(lab),f:'XOR',a:'+',b:'+'}).at(-1)!.state!;
 const p=probs(s);[0,3,5,6].forEach(i=>assert.ok(Math.abs(p[i]-.25)<1e-12));[1,2,4,7].forEach(i=>assert.ok(p[i]<1e-12));
});
