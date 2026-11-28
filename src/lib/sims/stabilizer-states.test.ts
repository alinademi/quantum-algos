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
const {run,last}=await checkLabs(['stabilizer-states']);
test('signed stabilizer generators and GF(2) expectation solver agree with dense simulation',()=>{
 for(let n=2;n<=4;n++)for(const mode of ['GHZ','Product plus','Signed example']){
  const ops=prep(n,mode),s=g.runOps(q.basis(n,0),ops),gens=evolveGenerators(n,ops);
  for(const gen of gens)close(gen.sign*q.inner(s,q.matVec(pauli(gen.p),s)).re,1);
  for(const query of all(n,['I','X','Y','Z']))close(expect(gens,query),q.inner(s,q.matVec(pauli(query),s)).re);
 }
 assert.equal(expect(evolveGenerators(2,prep(2,'Signed example')),'ZI'),-1);
});
