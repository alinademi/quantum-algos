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
const {run,last}=await checkLabs(['circuit-identities']);
test('circuit identities agree on all basis columns',()=>{
 for(const name of ['HXH','Reverse CNOT','CZ symmetry','Cancel CNOTs']){const [a,b]=circuits(name);matrix(g.fullMatrix(2,a),g.fullMatrix(2,b));}
});
test('Z vs I agrees only on selected input, not as matrices',()=>{const [a,b]=circuits('Z vs I');state(g.runOps(g.product('0','0'),a),g.runOps(g.product('0','0'),b));close(g.matrixGap(g.fullMatrix(2,a),g.fullMatrix(2,b)),2);});
