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
const {run,last}=await checkLabs(['classical-gates']);
test('classical truth tables and NAND universality',()=>{
 const tables:Record<string,number[]>={NOT:[1,1,0,0],AND:[0,0,0,1],OR:[0,1,1,1],XOR:[0,1,1,0],NAND:[1,1,1,0]};
 for(const [name,expected] of Object.entries(tables))for(let i=0;i<4;i++){assert.equal(boolean(name,i>>1,i&1),expected[i]);assert.equal(viaNand(name,i>>1,i&1),expected[i]);}
});
