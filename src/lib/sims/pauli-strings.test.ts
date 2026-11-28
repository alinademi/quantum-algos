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
const {labs,last}=await checkLabs(['pauli-strings']);
test('Pauli strings are orthogonal, and commute according to anticommuting site parity',()=>{
 for(const a of all(2,['I','X','Y','Z']))for(const b of all(2,['I','X','Y','Z'])){
  const ab=q.matMul(pauli(a),pauli(b)),ba=q.matMul(pauli(b),pauli(a));
  matrix(ab,phase(ba,antiCount(a,b)*Math.PI));
  close(ab.reduce((s,r,i)=>s+r[i].re,0),a===b?4:0);
 }
});
