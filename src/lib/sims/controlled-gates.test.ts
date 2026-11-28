import test from 'node:test';
import assert from 'node:assert/strict';
import * as q from '../quantum.ts';
import * as g from './gate-lab.ts';
import { implementation } from './controlled-gates.ts';

import { checkLabs,close,matrix,phase } from './gate-lab-checks.ts';
const {run,last}=await checkLabs(['controlled-gates']);
test('controlled decompositions match independent block matrices for both control values',()=>{
 for(const [name,m] of Object.entries({CX:q.X,CY:q.Y,CZ:q.Z,CP:q.P(.731)}))for(const on of [0,1]){
  const expected=g.eye(4);for(let i=0;i<2;i++)for(let j=0;j<2;j++)expected[2*on+i][2*on+j]=m[i][j];
  matrix(g.fullMatrix(2,implementation(name,.731,on)),expected);
 }
});

test('controlled minus X differs observably from CX despite their target global phase',()=>{for(const on of [0,1]){const expected=g.eye(4);for(let i=0;i<2;i++)for(let j=0;j<2;j++)expected[2*on+i][2*on+j]=q.scale(q.X[i][j],-1);matrix(g.fullMatrix(2,implementation('C(−X)',0,on)),expected);for(const [name,p] of [['CX',0],['C(−X)',1]] as const){const s=last('controlled-gates',{name,a:'+',b:'+',on:String(on)});close(Number(s.rows!.find(r=>r.label==='Control P(1) if H then measurement')!.value),p);}}});
