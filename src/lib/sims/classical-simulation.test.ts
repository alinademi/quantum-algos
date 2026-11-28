import test from 'node:test';
import assert from 'node:assert/strict';
import * as q from '../quantum.ts';
import { storage,mpsSlots } from './classical-simulation.ts';

import { checkLabs,state } from './gate-lab-checks.ts';
const {last}=await checkLabs(['classical-simulation']);
test('dense storage is exact integer arithmetic; 30 qubits needs 16 GiB',()=>assert.equal(storage(30),16n*1024n**3n));
test('open-boundary MPS slot count and example amplitudes',()=>{for(const n of [10,20,30,40,50]){assert.equal(mpsSlots(n,'Product'),2*n);assert.equal(mpsSlots(n,'GHZ'),4+8*(n-2)+4);}state(last('classical-simulation',{shape:'Product'}).state!,Array(16).fill(q.c(.25)));state(last('classical-simulation',{shape:'GHZ'}).state!,Array.from({length:16},(_,i)=>q.c(i===0||i===15?Math.SQRT1_2:0)));});

test('crossed Bell pairs have exponential middle cut rank in fixed order; T product has dimension one',async()=>{const {memory,bondDimension}=await import('./classical-simulation.ts');assert.equal(bondDimension(10,5,'Crossed Bell pairs'),32);assert.equal(mpsSlots(4,'Crossed Bell pairs'),40);assert.equal(memory(50,'T product').bond,1);assert.equal(memory(50,'T product').stabilizer,false);state(last('classical-simulation',{shape:'Crossed Bell pairs'}).state!,Array.from({length:16},(_,i)=>q.c([0,5,10,15].includes(i)?.5:0)));});
