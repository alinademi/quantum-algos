import test from 'node:test';
import assert from 'node:assert/strict';
import * as q from '../quantum.ts';
import * as g from './gate-lab.ts';
import { layers, recipes } from './circuit-cost.ts';

import { checkLabs,value } from './gate-lab-checks.ts';
const {labs,last}=await checkLabs(['circuit-cost', 'transpilation']);
test('circuit layers depend on occupied wires, with parallel disjoint gates',()=>{
 assert.deepEqual(layers(recipes['Parallel H and CNOT'],3),[1,1,2,2,3]);
 assert.deepEqual(layers(recipes['Serial chain'],3),[1,2,3,4]);
 assert.equal(value(last('transpilation'),'Native operations'),52); // 1 H=3, 7 CX=7 operations each
 assert.equal(value(last('transpilation',{opt:'No'}),'Native operations'),66);
});

test('placing interacting logical qubits next to each other avoids swaps and preserves their logical operation',()=>{
 const straight=last('transpilation',{placement:'q0 q1 q2'}),near=last('transpilation',{placement:'q0 q2 q1'});
 assert.equal(value(straight,'Inserted SWAPs'),2);
 assert.equal(value(near,'Inserted SWAPs'),0);
 assert.equal(value(near,'Native operations'),10);
 assert.equal(value(last('transpilation',{placement:'q0 q2 q1',opt:'No'}),'Native operations'),24);
});
