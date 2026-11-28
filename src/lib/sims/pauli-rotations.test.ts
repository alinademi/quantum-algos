import test from 'node:test';
import assert from 'node:assert/strict';
import * as g from './gate-lab.ts';
import { pauli } from './pauli-strings.ts';
import { ladder } from './pauli-rotations.ts';

import * as q from '../quantum.ts';
import { checkLabs,matrix,all,state,close,value } from './gate-lab-checks.ts';
const {last}=await checkLabs(['pauli-rotations']);
test('Pauli rotation: basis-change parity ladder equals the Pauli exponential for every nontrivial three-wire string',()=>{
 for(const p of all(3,['I','X','Y','Z']).filter(x=>x!=='III')){
  const t=.37;matrix(g.fullMatrix(3,ladder(p,t)),g.phaseRotation(pauli(p),t));
  assert.equal(ladder(p,t).filter(o=>o.name.startsWith('CNOT')).length,2*([...p].filter(x=>x!=='I').length-1));
 }
});

test('ZZZ at π/4 entangles three plus states, not three independent rotations',()=>{
 const s=last('pauli-rotations',{p:'ZZZ',theta:'45',start:'+++'});
 const plus=q.tensor(q.plus(),q.tensor(q.plus(),q.plus())),minus=q.tensor(q.minus(),q.tensor(q.minus(),q.minus()));
 state(s.state!,plus.map((a,i)=>q.add(q.scale(a,Math.SQRT1_2),q.mul(q.c(0,-Math.SQRT1_2),minus[i]))));
 for(let i=0;i<3;i++)close(value(s,'Purity of q'+i),.5);
 assert.equal(s.rows!.find(r=>r.label.startsWith('Entangled?'))!.value,'Yes');
 const eigen=last('pauli-rotations',{p:'ZZZ',theta:'45',start:'000'});
 for(let i=0;i<3;i++)close(value(eigen,'Purity of q'+i),1);
});
