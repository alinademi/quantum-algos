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
const {labs,last}=await checkLabs(['pauli-rotations']);
test('Pauli rotation: basis-change parity ladder equals the Pauli exponential for every nontrivial three-wire string',()=>{
 for(const p of all(3,['I','X','Y','Z']).filter(x=>x!=='III')){
  const t=.37;matrix(g.fullMatrix(3,ladder(p,t)),g.phaseRotation(pauli(p),t));
  assert.equal(ladder(p,t).filter(o=>o.name.startsWith('CNOT')).length,2*([...p].filter(x=>x!=='I').length-1));
 }
});
