import test from 'node:test';
import assert from 'node:assert/strict';
import * as q from '../quantum.ts';

import { checkLabs,close,state,value } from './gate-lab-checks.ts';
const {run,last}=await checkLabs(['mid-circuit', 'deferred-measurement']);
test('mid-circuit feed-forward and deferred measurement preserve correct joint statistics',()=>{
 assert.deepEqual(last('mid-circuit',{start:'1',act:'X on q1 if 1'}).distribution!.p,[0,0,1,0]);
 assert.deepEqual(last('mid-circuit',{start:'1',act:'Reset q0'}).distribution!.p,[0,1,0,0]);
 assert.equal(run('mid-circuit',{start:'1'}).filter(s=>s.title.startsWith('If measurement')).length,1);
 const steps=run('deferred-measurement');[.5,0,0,.5].forEach((p,i)=>{close(steps[1].distribution!.p[i],p);close(steps[3].distribution!.p[i],p);});
 assert.ok(q.abs(steps[2].state![0])>.7&&q.abs(steps[2].state![3])>.7);
});
test('reusing the measured wire: record and final bits match',()=>{const steps=run('deferred-measurement',{reuse:'Yes'});const expected=[.25,0,0,.25,.25,0,0,.25];for(const i of [1,3])steps[i].distribution!.p.forEach((x,j)=>close(x,expected[j]));});

test('the deferred circuit preserves a Pauli coherence witness absent from the early mixture',()=>{for(const reuse of ['No','Yes']){const s=last('deferred-measurement',{a:'+',b:'0',reuse}),name=reuse==='Yes'?'ZXX':'XX';close(value(s,'Maximum probability gap'),0);close(value(s,name+' expectation after early measurement'),0);close(value(s,name+' expectation before deferred measurement'),1);}});
