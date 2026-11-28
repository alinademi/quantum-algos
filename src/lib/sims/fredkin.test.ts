import test from 'node:test';
import assert from 'node:assert/strict';
import * as q from '../quantum.ts';
import * as g from './gate-lab.ts';
import { fredkin } from './fredkin.ts';

import { checkLabs,state } from './gate-lab-checks.ts';
const {run,last}=await checkLabs(['fredkin']);
test('Toffoli and Fredkin reproduce truth tables on all eight inputs',()=>{
 for(let i=0;i<8;i++){
  state(g.apply(q.basis(3,i),g.ccx(0,1,2)),q.basis(3,i>=6?i^1:i));
  const j=i<4?i:4+((i&1)<<1)+((i&2)>>1);
  state(g.apply(q.basis(3,i),fredkin),q.basis(3,j));
  state(g.runOps(q.basis(3,i),[g.cx(1,2),g.ccx(0,2,1),g.cx(1,2)]),q.basis(3,j));
 }
});
