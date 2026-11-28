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
import { cartan,generalOps,canonicalCX } from './two-qubit-synthesis.ts';
import { route } from './qubit-routing.ts';

import { checkLabs, close, state, matrix, phase, all, value } from './gate-lab-checks.ts';
const {labs,last}=await checkLabs(['two-qubit-synthesis']);
test('two-qubit Cartan canonical SWAP and ZZ match exact decompositions',()=>{
 matrix(cartan(Math.PI/4,Math.PI/4,Math.PI/4),phase(g.SWAP,-Math.PI/4));
 matrix(cartan(0,0,.23),g.fullMatrix(2,[g.cx(0,1),g.rotation('Z',.46*180/Math.PI,1),g.cx(0,1)]));
});
test('general three-CNOT form matches independent commuting Pauli exponentials',()=>{const r=q.rng(239);for(let i=0;i<40;i++){const a=r()*3-1.5,b=r()*3-1.5,c=r()*3-1.5;const ops=generalOps(a,b,c);assert.equal(ops.filter(o=>o.name==='CNOT').length,3);matrix(phase(g.fullMatrix(2,ops),-Math.PI/4),cartan(a,b,c));}});
test('canonical CNOT and local tensor target on arbitrary product inputs',()=>{matrix(canonicalCX(),g.control(q.X));for(const a of g.kets)for(const b of g.kets){state(last('two-qubit-synthesis',{family:'Local only (0 CNOTs)',start:a,b}).state!,q.tensor(q.matVec(q.H,g.ket(a)),q.matVec(q.T,g.ket(b))));}});
