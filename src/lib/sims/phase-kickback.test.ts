import test from 'node:test';
import assert from 'node:assert/strict';
import * as q from '../quantum.ts';
import * as g from './gate-lab.ts';
import { bitOracle, phaseOracle, funcs, f } from './oracles.ts';
import { landauer } from './reversible.ts';
import { addOps, compareGate, compareOps } from './quantum-arithmetic.ts';

import { checkLabs, close, state, matrix } from './gate-lab-checks.ts';
const {run,last}=await checkLabs(['phase-kickback']);
test('phase kickback: eigenvalue −1 gives helper 1, eigenvalue +1 gives 0',()=>{
 close(g.probability(last('phase-kickback',{eigen:'−'}).state!,0),1);
 close(g.probability(last('phase-kickback',{eigen:'+'}).state!,0),0);
 close(g.probability(last('phase-kickback',{mode:'P',eigen:'1',angle:'90'}).state!,0),.5);
});
