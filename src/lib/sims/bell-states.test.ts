import test from 'node:test';
import * as q from '../quantum.ts';
import * as g from './gate-lab.ts';

import { checkLabs,close,state,value } from './gate-lab-checks.ts';
const {last}=await checkLabs(['bell-states']);
test('the four Bell labels produce the four orthonormal Bell states and decode',()=>{
 const states=g.bits(2).map(s=>{
  const a=+s[0],b=+s[1],expected=q.basis(2,b).map((x,i)=>q.add(q.scale(x,Math.SQRT1_2),q.c(i===3-b?(a?-1:1)*Math.SQRT1_2:0)));
  const st=last('bell-states',{start:s,decode:'Prepare only'}).state!;state(st,expected);
  state(last('bell-states',{start:s}).state!,g.bstate(s));return st;
 });
 states.forEach((a,i)=>states.forEach((b,j)=>close(q.abs(q.inner(a,b)),+(i===j))));
});

test('Bell correlations depend on basis: Z agreement depends on b, X on a',()=>{for(const start of g.bits(2))for(const basis of ['Z','X']){const s=last('bell-states',{start,decode:'Prepare only',basis});close(value(s,'P(agree)'),+(start[basis==='Z'?1:0]==='0'));const p=q.probs(s.state!);close(p[0]+p[1],.5);close(p[0]+p[2],.5);}});
