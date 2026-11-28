import test from 'node:test';
import assert from 'node:assert/strict';
import * as q from '../quantum.ts';
import * as g from './gate-lab.ts';
import { unitaryError } from './gates.ts';
import { pauli, antiCount } from './pauli-strings.ts';
import { ladder } from './pauli-rotations.ts';
import { conjugate } from './clifford-group.ts';
import { presets } from './clifford-t.ts';
import { layers, recipes } from './circuit-cost.ts';
import { nativeH, nativeCX } from './native-gates.ts';
import { storage } from './classical-simulation.ts';
import { twoLevel } from './decomposition.ts';
import { cartan } from './two-qubit-synthesis.ts';
import { route } from './qubit-routing.ts';

import { checkLabs, close, state, matrix, phase, all, value } from './gate-lab-checks.ts';
const {labs,last}=await checkLabs(['circuit-cost', 'transpilation']);
test('circuit layers depend on occupied wires, with parallel disjoint gates',()=>{
 assert.deepEqual(layers(recipes['Parallel H and CNOT'],3),[1,1,2,2,3]);
 assert.deepEqual(layers(recipes['Serial chain'],3),[1,2,3,4]);
 assert.equal(value(last('transpilation'),'Native operations'),52); // 1 H=3, 7 CX=7 operations each
 assert.equal(value(last('transpilation',{opt:'No'}),'Native operations'),66);
});
