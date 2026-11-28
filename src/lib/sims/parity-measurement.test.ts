import test from 'node:test';
import assert from 'node:assert/strict';
import * as q from '../quantum.ts';
import * as g from './gate-lab.ts';
import { bitOracle, phaseOracle, funcs, f } from './oracles.ts';
import { landauer } from './reversible.ts';
import { addOps, compareGate, compareOps } from './quantum-arithmetic.ts';

import { checkLabs, close, state, matrix } from './gate-lab-checks.ts';
const {run,last}=await checkLabs(['parity-measurement']);
test('parity measurement preserves coherence inside parity subspaces, including sign',()=>{
 const s=run('parity-measurement',{a:'−',b:'+'});close(s[2].distribution!.p[0],.5);close(s[2].distribution!.p[1],.5);
 const even=q.basis(3,0).map((x,i)=>q.c(i===0?Math.SQRT1_2:i===6?-Math.SQRT1_2:0));
 const odd=q.basis(3,0).map((x,i)=>q.c(i===3?Math.SQRT1_2:i===5?-Math.SQRT1_2:0));
 state(s[3].state!,even);state(s[4].state!,odd);
});
