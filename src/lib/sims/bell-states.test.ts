import test from 'node:test';
import assert from 'node:assert/strict';
import * as q from '../quantum.ts';
import * as g from './gate-lab.ts';
import { boolean, viaNand } from './classical-gates.ts';
import { unitaryError } from './gates.ts';
import { u, euler } from './single-qubit-unitary.ts';
import { stderr } from './shots.ts';
import { implementation } from './controlled-gates.ts';
import { noScratch } from './multi-controlled.ts';
import { fredkin } from './fredkin.ts';
import { family } from './two-qubit-gates.ts';
import { circuits } from './circuit-identities.ts';

import { checkLabs, close, state, matrix, phase } from './gate-lab-checks.ts';
const {run,last}=await checkLabs(['bell-states']);
test('the four Bell labels produce the four orthonormal Bell states and decode',()=>{
 const states=g.bits(2).map(s=>{
  const a=+s[0],b=+s[1],expected=q.basis(2,b).map((x,i)=>q.add(q.scale(x,Math.SQRT1_2),q.c(i===3-b?(a?-1:1)*Math.SQRT1_2:0)));
  const st=last('bell-states',{start:s,decode:'Prepare only'}).state!;state(st,expected);
  state(last('bell-states',{start:s}).state!,g.bstate(s));return st;
 });
 states.forEach((a,i)=>states.forEach((b,j)=>close(q.abs(q.inner(a,b)),+(i===j))));
});
