import test from 'node:test';
import assert from 'node:assert/strict';
import * as q from '../quantum.ts';
import * as g from './gate-lab.ts';
import { bitOracle, phaseOracle, funcs, f } from './oracles.ts';
import { landauer } from './reversible.ts';
import { addOps, compareGate, compareOps } from './quantum-arithmetic.ts';

import { checkLabs, close, state, matrix } from './gate-lab-checks.ts';
const {run,last}=await checkLabs(['reversible']);
test('Landauer bound uses exact SI Boltzmann constant and scales linearly with temperature',()=>{
 close(landauer(300)/1e-21,2.870978885,1e-7);close(landauer(4)/landauer(1),4);
});
test('Toffoli lab preserves both inputs and flips target only for 11',()=>{for(const input of g.bits(3)){const first=run('reversible',{input})[2].state!;const i=parseInt(input,2);state(first,q.basis(3,i>=6?i^1:i));}});
