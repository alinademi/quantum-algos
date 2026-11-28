import test from 'node:test';
import assert from 'node:assert/strict';
import * as q from '../quantum.ts';
import * as g from './gate-lab.ts';
import { bitOracle, phaseOracle, funcs, f } from './oracles.ts';
import { landauer } from './reversible.ts';
import { addOps, compareGate, compareOps } from './quantum-arithmetic.ts';

import { checkLabs, close, state, matrix } from './gate-lab-checks.ts';
const {run,last}=await checkLabs(['hadamard-test', 'swap-test']);
test('Hadamard test real and imaginary sign and SWAP test distinguish overlaps',()=>{
 for(const [part,p] of [['Real',.5],['Imaginary',1]] as const)close(last('hadamard-test',{state:'1',unitary:'P',angle:'90',part}).distribution!.p[0],p);
 close(last('hadamard-test',{state:'1',unitary:'Z',part:'Real'}).distribution!.p[0],0);
 close(last('swap-test',{a:'0',theta:'0'}).distribution!.p[0],1);
 close(last('swap-test',{a:'0',theta:'180'}).distribution!.p[0],.5);
 close(last('swap-test',{a:'0',theta:'90'}).distribution!.p[0],.75);
});
