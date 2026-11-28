import test from 'node:test';
import * as q from '../quantum.ts';
import * as g from './gate-lab.ts';

import { checkLabs,state,close,value } from './gate-lab-checks.ts';
import {borrowedOps} from './ancillas.ts';
const {last}=await checkLabs(['ancillas']);
test('borrowed operation acts as CCCX on all basis inputs and preserves external entanglement',()=>{for(let i=0;i<32;i++)state(g.runOps(q.basis(5,i),borrowedOps),q.basis(5,i>=28?i^1:i));const start=g.runOps(g.product('+','1','1','0','0','0'),[g.gate('H',3),g.cx(3,5)]);const ideal=g.op('CCCX',g.control(q.X,3),0,1,2,4);state(g.runOps(start,borrowedOps),g.apply(start,ideal));});

test('the Bell-paired dirty helper and its reference are restored only by the complete protocol',()=>{const complete=last('ancillas',{scratch:'Bell pair with q5',mode:'Compute and uncompute',data:'1',target:'0'}),incomplete=last('ancillas',{scratch:'Bell pair with q5',mode:'Omit final operation',data:'1',target:'0'});close(value(complete,'Borrowed register overlap with original'),1);close(value(complete,'Whole-state fidelity to ideal CCCX'),1);close(value(incomplete,'Borrowed register overlap with original'),.5);close(value(incomplete,'Whole-state fidelity to ideal CCCX'),.25);});

test('any zero control prevents a target flip, including a dirty Bell helper',()=>{for(const [data,b,c] of [['0','1','1'],['1','0','1'],['1','1','0']]){const s=last('ancillas',{data,b,c,target:'0',scratch:'Bell pair with q5'});close(g.probability(s.state!,4),0);close(value(s,'Borrowed register overlap with original'),1);}});
