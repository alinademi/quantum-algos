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
const {run,last}=await checkLabs(['controlled-gates']);
test('controlled decompositions match independent block matrices for both control values',()=>{
 for(const [name,m] of Object.entries({CX:q.X,CY:q.Y,CZ:q.Z,CP:q.P(.731)}))for(const on of [0,1]){
  const expected=g.eye(4);for(let i=0;i<2;i++)for(let j=0;j<2;j++)expected[2*on+i][2*on+j]=m[i][j];
  matrix(g.fullMatrix(2,implementation(name,.731,on)),expected);
 }
});
