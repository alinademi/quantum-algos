import test from 'node:test';
import assert from 'node:assert/strict';
import * as q from '../quantum.ts';
import * as g from './gate-lab.ts';
import { circuits } from './circuit-identities.ts';

import { checkLabs,state } from './gate-lab-checks.ts';
const {run,last}=await checkLabs(['cnot', 'circuits']);
test('CNOT creates a Bell pair and the order of a circuit matters',()=>{
 const bell=[q.c(Math.SQRT1_2),q.c(0),q.c(0),q.c(Math.SQRT1_2)];
 state(run('cnot')[1].state!,bell);state(last('circuits').state!,bell);
 state(last('circuits',{order:'CNOT then H'}).state!,g.product('+','0'));
});
test('whole circuit readout uses independent product in reverse order',()=>{const target=q.matMul(g.control(q.X),q.kron(q.H,q.I));const rows=last('circuits').rows!.filter(r=>r.label.startsWith('Whole circuit'));assert.deepEqual(rows.map(r=>r.value),g.matrixRows(target).map(r=>r.value));});
