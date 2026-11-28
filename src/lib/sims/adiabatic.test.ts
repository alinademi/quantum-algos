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
import { evolution,path } from './adiabatic.ts';
import { B1, B2 } from './topological-model.ts';
import { gaussian } from './cv-model.ts';

import { checkLabs, close, state, matrix, phase, all, value } from './gate-lab-checks.ts';
const {run,last}=await checkLabs(['adiabatic']);
test('adiabatic midpoint evolution maintains norm, converges under step refinement and follows the gapped ground state at long time',()=>{
 for(const t of [1,5,20,50,100]){
  const a=evolution(t,1000).at(-1)!.psi,b=evolution(t,2000).at(-1)!.psi;
  assert.ok(g.fidelity(a,b)>1-1e-5);close(q.norm2(a),1);
 }
 assert.ok(q.probs(evolution(100).at(-1)!.psi)[0]>.99);
 assert.ok(q.probs(evolution(1).at(-1)!.psi)[0]<.8);
});
test('gap minimum and non-monotonic finite-time following',()=>{const p=path(5);close(Math.min(...p.map(s=>s.gap)),Math.SQRT2);assert.ok(p.at(-1)!.ground>.9999);assert.ok(Math.min(...p.map(s=>s.ground))<.97);assert.ok(path(20).at(-1)!.ground<p.at(-1)!.ground);});
