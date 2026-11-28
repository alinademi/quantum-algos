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
