import test from 'node:test';
import assert from 'node:assert/strict';
import * as q from '../quantum.ts';

import { checkLabs,state,value } from './gate-lab-checks.ts';
import {code} from './circuit-languages.ts';
const {labs,last}=await checkLabs(['circuit-languages']);
test('circuit languages are illustrative descriptions of the same Bell circuit',()=>{
 for(const opt of labs['circuit-languages'].controls[0].options)state(last('circuit-languages',{language:opt.value}).state!,[q.c(Math.SQRT1_2),q.c(0),q.c(0),q.c(Math.SQRT1_2)]);
});
test('examples actually differ in syntax and show the measurement explicitly',()=>{assert.equal(new Set(Object.values(code)).size,4);assert.match(code['OpenQASM 3'],/c = measure q/);assert.match(code['Cirq (Python)'],/cirq.measure/);assert.match(code['Qiskit (Python)'],/qc.measure/);assert.match(code['Q#'],/M\(q\[0\]\)/);});
