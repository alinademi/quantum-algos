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

test('three-wire example has two minus signs for XZI and ZXI, one for XZI and ZZI',async()=>{const {lab}=await import('./pauli-strings.ts');const p=q.kron(q.X,q.kron(q.Z,q.I));matrix(pauli('XZI'),p);for(const [b,k] of [['ZXI',2],['ZZI',1]] as const){const step=lab.run({a:'XZI',b}).at(-1)!;close(Number(step.rows!.find(r=>r.label==='Anticommuting site count')!.value),k);}});

test('odd sign count changes exact matrices, not the standalone measurement state',async()=>{const {lab}=await import('./pauli-strings.ts');const s=lab.run({a:'XZI',b:'ZZI'}).at(-1)!;close(Number(s.rows!.find(r=>r.label==='PQ vs QP difference before phase correction')!.value),2);close(Number(s.rows!.find(r=>r.label==='Output overlap with reversed order')!.value),1);});
