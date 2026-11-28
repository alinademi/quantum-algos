import test from 'node:test';
import assert from 'node:assert/strict';
import * as q from '../quantum.ts';
import * as g from './gate-lab.ts';

import { checkLabs,value } from './gate-lab-checks.ts';
const {labs,last}=await checkLabs(['transpilation']);

test('placing interacting logical qubits next to each other avoids swaps and preserves their logical operation',()=>{
 const straight=last('transpilation',{placement:'q0 q1 q2'}),near=last('transpilation',{placement:'q0 q2 q1'});
 assert.equal(value(straight,'Inserted SWAPs'),2);
 assert.equal(value(near,'Inserted SWAPs'),0);
 assert.equal(value(near,'Native operations'),10);
 assert.equal(value(last('transpilation',{placement:'q0 q2 q1',opt:'No'}),'Native operations'),24);
});

test('routed lab identifies physical sites and tracks each SWAP without changing the logical output',()=>{
 for(const placement of ['q0 q1 q2','q0 q2 q1']){
  const steps=labs.transpilation.run({...g.defaults(labs.transpilation),placement,start:'0'});
  const routed=steps.filter(s=>s.state);
  const near=placement==='q0 q2 q1';
  const expected=q.basis(3,0).map((_,i)=>q.c(i===0||i===(near?6:5)?Math.SQRT1_2:0));
  const actual=routed.at(-1)!.state!;
  actual.forEach((a,i)=>assert.ok(q.abs(q.sub(a,expected[i]))<1e-10));
  assert.match(routed[0].note,/physical sites/);
  const firstCX=routed.find(s=>s.title.startsWith('CNOT'))!;
  assert.equal(firstCX.title,near?'CNOT on site 0, site 1':'CNOT on site 1, site 2');
  assert.equal(firstCX.rows!.find(r=>r.label==='Site 1 currently holds')!.value,near?'Logical q2':'Logical q0');
 }
});
