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
import { nativeH, nativeCX,ecrCX } from './native-gates.ts';
import { storage } from './classical-simulation.ts';
import { twoLevel } from './decomposition.ts';
import { cartan } from './two-qubit-synthesis.ts';
import { route } from './qubit-routing.ts';

import { checkLabs, close, state, matrix, phase, all, value } from './gate-lab-checks.ts';
const {labs,last}=await checkLabs(['native-gates']);
test('universality examples and native basis: exact global phase, including CX',()=>{
 matrix(phase(q.matMul(q.RY(Math.PI/2),q.RZ(Math.PI)),Math.PI/2),q.H);
 matrix(phase(g.fullMatrix(1,nativeH(0)),Math.PI/4),q.H);
 matrix(phase(g.fullMatrix(2,nativeCX(0,1)),Math.PI/2),g.control(q.X));
 matrix(g.fullMatrix(1,[g.gate('SX'),g.gate('SX')]),q.X);
});
test('ECR basis exactly implements CNOT',()=>matrix(g.fullMatrix(2,ecrCX()),g.control(q.X)));
