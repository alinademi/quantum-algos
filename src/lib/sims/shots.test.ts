import test from 'node:test';
import assert from 'node:assert/strict';
import * as q from '../quantum.ts';
import { stderr, shotStudy } from './shots.ts';

import { checkLabs,close } from './gate-lab-checks.ts';
await checkLabs(['shots']);
test('shot uncertainty follows the binomial standard error, including deterministic endpoints',()=>{
 close(stderr(.5,100),.05);close(stderr(.5,10000),.005);close(stderr(1,100),0);close(stderr(0,100),0);
 const counts=q.sample([0,1,0],100,()=>0.5);assert.deepEqual(counts,[0,100,0]);
});
test('seeded Born frequencies and RMS shrink with shot count',()=>{const p=.25;const n=20000;close(q.sample([1-p,p],n,q.rng(42))[1]/n,p,.015);const a=shotStudy(90,q.rng(921));for(const r of a){close(r.error/r.predicted,1,.35);assert.equal(r.fractions.length,64);close(r.fractions[0],r.ones/r.n);close(r.error,Math.sqrt(r.fractions.reduce((sum,f)=>sum+(f-r.p)**2,0)/64));}close(a[0].predicted/a[1].predicted,2);assert.ok(a[3].error<a[0].error/4);assert.ok(shotStudy(0,q.rng(1)).every(r=>r.ones===0));});
