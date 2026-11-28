import test from 'node:test';
import assert from 'node:assert/strict';
import * as q from '../quantum.ts';
import * as g from './gate-lab.ts';
import { unitaryError } from './gates.ts';
import { pauli } from './pauli-strings.ts';
import { evolveGenerators, prep } from './stabilizer-states.ts';
import { expect } from './gottesman-knill.ts';
import { search } from './solovay-kitaev.ts';
import { shift } from './qtm.ts';
import { evolution } from './adiabatic.ts';
import { B1, B2 } from './topological-model.ts';
import { gaussian } from './cv-model.ts';

import { checkLabs, close, state, matrix, phase, all, value } from './gate-lab-checks.ts';
const {run,last}=await checkLabs(['topological-model']);
test('Ising braid relation holds and order matters',()=>{
 matrix(g.fullMatrix(1,[B1,B2,B1]),g.fullMatrix(1,[B2,B1,B2]));
 assert.ok(g.matrixGap(g.fullMatrix(1,[B1,B2]),g.fullMatrix(1,[B2,B1]))>.1);
});
test('Ising R and F matrices agree with braid generators up to common phase',()=>{const R=[[q.expi(-Math.PI/8),q.c(0)],[q.c(0),q.expi(3*Math.PI/8)]];matrix(phase(B1.matrix,Math.PI/8),R);matrix(phase(B2.matrix,Math.PI/8),q.matMul(q.H,q.matMul(R,q.H)));});
