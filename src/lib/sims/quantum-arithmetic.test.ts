import test from 'node:test';
import * as q from '../quantum.ts';
import * as g from './gate-lab.ts';
import { addOps, compareGate, compareOps, qftOps, fourierAddOps } from './quantum-arithmetic.ts';

import { checkLabs,close,state } from './gate-lab-checks.ts';
await checkLabs(['quantum-arithmetic']);
test('arithmetic: all accumulator basis values and all comparator flags, including overflow',()=>{
 for(let a=0;a<4;a++)for(let b=0;b<8;b++)state(g.runOps(q.basis(5,8*a+b),addOps),q.basis(5,8*a+((a+b)%8)));
 for(let a=0;a<4;a++)for(let b=0;b<4;b++)for(let t=0;t<2;t++){const start=q.basis(5,8*a+2*b+t),expected=q.basis(5,8*a+2*b+(t^+(a<b)));state(g.apply(start,compareGate),expected);state(g.runOps(start,compareOps),expected);}
});
test('QFT phases implement exact modular addition on every basis input',()=>{for(let a=0;a<4;a++)for(let b=0;b<8;b++){const start=q.basis(5,8*a+b);const expected=q.basis(5,8*a+((a+b)%8));const transformed=g.runOps(start,qftOps);for(let y=0;y<8;y++)close(q.abs(q.sub(transformed[8*a+y],q.scale(q.expi(2*Math.PI*b*y/8),1/Math.sqrt(8)))),0);state(g.runOps(start,fourierAddOps),expected);}});
