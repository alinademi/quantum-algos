import test from 'node:test';
import assert from 'node:assert/strict';
import * as q from '../quantum.ts';
import * as g from './gate-lab.ts';
import { bitOracle, phaseOracle, funcs, f } from './oracles.ts';
import { landauer } from './reversible.ts';
import { addOps, compareGate, compareOps } from './quantum-arithmetic.ts';

import { checkLabs, close, state, matrix } from './gate-lab-checks.ts';
const {run,last}=await checkLabs(['quantum-arithmetic']);
test('arithmetic: all accumulator basis values and all comparator flags, including overflow',()=>{
 for(let a=0;a<4;a++)for(let b=0;b<8;b++)state(g.runOps(q.basis(5,8*a+b),addOps),q.basis(5,8*a+((a+b)%8)));
 for(let a=0;a<4;a++)for(let b=0;b<4;b++)for(let t=0;t<2;t++){const start=q.basis(5,8*a+2*b+t),expected=q.basis(5,8*a+2*b+(t^+(a<b)));state(g.apply(start,compareGate),expected);state(g.runOps(start,compareOps),expected);}
});
