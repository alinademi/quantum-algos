import test from 'node:test';
import assert from 'node:assert/strict';
import * as q from '../quantum.ts';
import * as g from './gate-lab.ts';
import { bitOracle, phaseOracle, funcs, f } from './oracles.ts';
import { landauer } from './reversible.ts';
import { addOps, compareGate, compareOps } from './quantum-arithmetic.ts';

import { checkLabs, close, state, matrix } from './gate-lab-checks.ts';
const {run,last}=await checkLabs(['mid-circuit', 'deferred-measurement']);
test('mid-circuit feed-forward and deferred measurement preserve correct joint statistics',()=>{
 assert.deepEqual(last('mid-circuit',{start:'1',act:'X on q1 if 1'}).distribution!.p,[0,0,1,0]);
 assert.deepEqual(last('mid-circuit',{start:'1',act:'Reset q0'}).distribution!.p,[0,1,0,0]);
 assert.equal(run('mid-circuit',{start:'1'}).filter(s=>s.title.startsWith('If measurement')).length,1);
 const steps=run('deferred-measurement');[.5,0,0,.5].forEach((p,i)=>{close(steps[1].distribution!.p[i],p);close(steps[3].distribution!.p[i],p);});
 assert.ok(q.abs(steps[2].state![0])>.7&&q.abs(steps[2].state![3])>.7);
});
