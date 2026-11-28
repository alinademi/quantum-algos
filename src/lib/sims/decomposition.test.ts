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
import { twoLevel,parameterBound } from './decomposition.ts';
import { cartan } from './two-qubit-synthesis.ts';
import { route } from './qubit-routing.ts';

import { checkLabs, close, state, matrix, phase, all, value } from './gate-lab-checks.ts';
const {labs,last}=await checkLabs(['decomposition']);
test('complex Givens decomposition reconstructs arbitrary example matrices with phases',()=>{
 for(let k=0;k<8;k++){const target=g.fullMatrix(2,[g.rotation('Y',23+k*15,0),g.rotation('X',71-k*8,1),g.cx(1,0),g.rotation('Z',17*k,0),g.cx(0,1)]);
  const dec=twoLevel(target);assert.ok(dec.length<=7);for(const f of dec)close(unitaryError(f.matrix),0);matrix(g.fullMatrix(2,dec),target);}
});
test('Givens factors are identity outside two basis states and parameter lower bound grows exponentially',()=>{const u=q.kron(q.H,q.H);for(const f of twoLevel(u).slice(1)){const changed=f.matrix.filter((r,i)=>r.some((z,j)=>q.abs(q.sub(z,q.c(+(i===j))))>1e-10));assert.equal(changed.length,2);}assert.equal(parameterBound(2),1);assert.ok(parameterBound(8)>4000);});
