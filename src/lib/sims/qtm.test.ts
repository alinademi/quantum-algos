import test from 'node:test';
import * as q from '../quantum.ts';
import * as g from './gate-lab.ts';
import { unitaryError } from './gates.ts';
import { shift } from './qtm.ts';

import { checkLabs,close,state,matrix } from './gate-lab-checks.ts';
await checkLabs(['qtm']);
test('QTM toy shift wraps at boundaries and is a bijection; direction remains coherent',()=>{
 for(let i=0;i<8;i++)state(g.apply(q.basis(3,i),shift),q.basis(3,(i&4)|(((i&3)+(i&4?1:3))%4)));
 close(unitaryError(shift.matrix),0);
});

test('a localized head splits left and right, then develops a biased distribution by interference',async()=>{const {lab,headDistribution}=await import('./qtm.ts');const prob=(steps:string)=>headDistribution(lab.run({coin:'0',pos:'0',steps}).at(-1)!.state!);for(const [i,p] of [0,.5,0,.5].entries())close(prob('1')[i],p);for(const [i,p] of [.5,0,.5,0].entries())close(prob('2')[i],p);for(const [i,p] of [0,0,0,1].entries())close(prob('3')[i],p);});
