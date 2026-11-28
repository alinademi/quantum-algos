import test from 'node:test';
import assert from 'node:assert/strict';
import { layers, recipes } from './circuit-cost.ts';

import { checkLabs,value } from './gate-lab-checks.ts';
const {last}=await checkLabs(['circuit-cost', 'transpilation']);
test('circuit layers depend on occupied wires, with parallel disjoint gates',()=>{
 assert.deepEqual(layers(recipes['Parallel H and CNOT'],3),[1,1,2,2,3]);
 assert.deepEqual(layers(recipes['Serial chain'],3),[1,2,3,4]);
 assert.equal(value(last('transpilation'),'Native operations'),52); // 1 H=3, 7 CX=7 operations each
 assert.equal(value(last('transpilation',{opt:'No'}),'Native operations'),66);
});
test('serial schedule changes actual layers, not circuit depth or gate count',()=>{const r='Parallel H and CNOT';const parallel=last('circuit-cost',{recipe:r,mode:'Parallel on disjoint wires'}),serial=last('circuit-cost',{recipe:r,mode:'One gate at a time'});assert.equal(value(parallel,'Depth'),3);assert.equal(value(serial,'Depth'),3);assert.equal(value(parallel,'Layers in this schedule'),3);assert.equal(value(serial,'Layers in this schedule'),5);assert.equal(value(serial,'Gate count'),5);});
