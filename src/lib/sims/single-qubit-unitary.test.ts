import test from 'node:test';
import assert from 'node:assert/strict';
import * as q from '../quantum.ts';
import * as g from './gate-lab.ts';
import { boolean, viaNand } from './classical-gates.ts';
import { unitaryError } from './gates.ts';
import { u, euler } from './single-qubit-unitary.ts';
import { stderr } from './shots.ts';
import { implementation } from './controlled-gates.ts';
import { noScratch } from './multi-controlled.ts';
import { fredkin } from './fredkin.ts';
import { family } from './two-qubit-gates.ts';
import { circuits } from './circuit-identities.ts';

import { checkLabs, close, state, matrix, phase } from './gate-lab-checks.ts';
const {run,last}=await checkLabs(['single-qubit-unitary']);
test('Euler decomposition matches general U including phase',()=>{
 for(const t of [0,.71,Math.PI])for(const p of [-2,0,.8])for(const l of [-.9,0,1.7]){
  matrix(u(t,p,l),phase(euler(t,p,l),(p+l)/2));close(unitaryError(u(t,p,l)),0);
 }
});
