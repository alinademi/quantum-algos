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
import {red,spiderCX,greenCopy} from './zx-calculus.ts';
const {run,last}=await checkLabs(['zx-calculus']);
test('ZX color change and fusion preserve full matrices (all control settings checked above)',()=>{
 matrix(q.matMul(q.P(.3),q.P(.7)),q.P(1));matrix(q.matMul(q.H,q.matMul(q.P(Math.PI),q.H)),q.X);
});
test('red projectors independently equal H P H; multi-leg contraction is CNOT',()=>{for(const a of [0,.73,Math.PI])matrix(red(a),q.matMul(q.H,q.matMul(q.P(a),q.H)));matrix(spiderCX(),g.control(q.X));for(let i=0;i<2;i++)state(q.matVec(greenCopy,q.basis(1,i)),q.basis(2,3*i));});
