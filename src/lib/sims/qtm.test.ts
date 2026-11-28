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
const {run,last}=await checkLabs(['qtm']);
test('QTM toy shift wraps at boundaries and is a bijection; direction remains coherent',()=>{
 for(let i=0;i<8;i++)state(g.apply(q.basis(3,i),shift),q.basis(3,(i&4)|(((i&3)+(i&4?1:3))%4)));
 close(unitaryError(shift.matrix),0);
});
