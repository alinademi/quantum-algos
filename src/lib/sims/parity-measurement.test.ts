import test from 'node:test';
import * as q from '../quantum.ts';

import { checkLabs,close,state,value } from './gate-lab-checks.ts';
const {run}=await checkLabs(['parity-measurement']);
test('parity measurement preserves coherence inside parity subspaces, including sign',()=>{
 const s=run('parity-measurement',{a:'−',b:'+'});close(s[3].distribution!.p[0],.5);close(s[3].distribution!.p[1],.5);
 const even=q.basis(3,0).map((x,i)=>q.c(i===0?Math.SQRT1_2:i===6?-Math.SQRT1_2:0));
 const odd=q.basis(3,0).map((x,i)=>q.c(i===3?Math.SQRT1_2:i===5?-Math.SQRT1_2:0));
 state(s[4].state!,even);state(s[5].state!,odd);
});

test('the two methods have equal parity odds but individual bit records destroy the XX correlation',()=>{const s=run('parity-measurement',{a:'+',b:'+'});for(const step of s.slice(-2)){close(value(step,'XX expectation, measure parity only'),1);close(value(step,'XX expectation, measure both Z values'),0);}});
