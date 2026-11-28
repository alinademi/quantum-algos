import test from 'node:test';
import assert from 'node:assert/strict';
import * as q from '../quantum.ts';
import { storage,mpsSlots } from './classical-simulation.ts';

import { checkLabs,state } from './gate-lab-checks.ts';
const {last}=await checkLabs(['classical-simulation']);
test('dense storage is exact integer arithmetic; 30 qubits needs 16 GiB',()=>assert.equal(storage(30),16n*1024n**3n));
test('open-boundary MPS slot count and example amplitudes',()=>{for(const n of [10,20,30,40,50]){assert.equal(mpsSlots(n,'Product'),2*n);assert.equal(mpsSlots(n,'GHZ'),4+8*(n-2)+4);}state(last('classical-simulation',{shape:'Product'}).state!,Array(16).fill(q.c(.25)));state(last('classical-simulation',{shape:'GHZ'}).state!,Array.from({length:16},(_,i)=>q.c(i===0||i===15?Math.SQRT1_2:0)));});
