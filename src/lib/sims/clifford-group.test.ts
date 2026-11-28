import test from 'node:test';
import assert from 'node:assert/strict';
import * as q from '../quantum.ts';
import * as g from './gate-lab.ts';
import { conjugate } from './clifford-group.ts';
import { presets } from './clifford-t.ts';

import { checkLabs,matrix } from './gate-lab-checks.ts';
await checkLabs(['clifford-group']);
test('Clifford conjugation maps to signed Paulis; T does not preserve X or Y',()=>{
 assert.equal(conjugate('H','YI'),'−YI');assert.equal(conjugate('S','XI'),'YI');assert.equal(conjugate('CNOT','XI'),'XX');assert.equal(conjugate('CNOT','IZ'),'ZZ');
 assert.equal(conjugate('T','XI'),'Not a signed Pauli string');assert.equal(conjugate('T','ZI'),'ZI');
 for(const [key,s] of Object.entries({'T² = S':q.S,'T⁴ = Z':q.Z,'T⁸ = I':q.I,'T then T†':q.I}))matrix(g.fullMatrix(1,presets[key].map(x=>g.gate(x))),s);
});
