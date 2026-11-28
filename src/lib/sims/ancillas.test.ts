import test from 'node:test';
import * as q from '../quantum.ts';
import * as g from './gate-lab.ts';

import { checkLabs,state } from './gate-lab-checks.ts';
import {borrowedOps} from './ancillas.ts';
await checkLabs(['ancillas']);
test('borrowed operation acts as CCCX on all basis inputs and preserves external entanglement',()=>{for(let i=0;i<32;i++)state(g.runOps(q.basis(5,i),borrowedOps),q.basis(5,i>=28?i^1:i));const start=g.runOps(g.product('+','1','1','0','0','0'),[g.gate('H',3),g.cx(3,5)]);const ideal=g.op('CCCX',g.control(q.X,3),0,1,2,4);state(g.runOps(start,borrowedOps),g.apply(start,ideal));});
