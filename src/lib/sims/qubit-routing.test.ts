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
const {labs,last}=await checkLabs(['qubit-routing']);
test('routing restores all logical wires and only uses nearest-neighbor gates',()=>{
 for(let a=0;a<4;a++)for(let b=0;b<4;b++)if(a!==b){const ops=route(a,b);assert.ok(ops.every(o=>Math.abs(o.wires[0]-o.wires[1])===1));assert.equal(ops.length,2*(Math.abs(a-b)-1)+1);matrix(g.fullMatrix(4,ops),g.fullMatrix(4,[g.cx(a,b)]));}
});
