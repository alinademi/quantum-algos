import test from 'node:test';
import * as q from '../quantum.ts';
import { pauli, antiCount } from './pauli-strings.ts';

import { checkLabs,close,matrix,phase,all } from './gate-lab-checks.ts';
await checkLabs(['pauli-strings']);
test('Pauli strings are orthogonal, and commute according to anticommuting site parity',()=>{
 for(const a of all(2,['I','X','Y','Z']))for(const b of all(2,['I','X','Y','Z'])){
  const ab=q.matMul(pauli(a),pauli(b)),ba=q.matMul(pauli(b),pauli(a));
  matrix(ab,phase(ba,antiCount(a,b)*Math.PI));
  close(ab.reduce((s,r,i)=>s+r[i].re,0),a===b?4:0);
 }
});
