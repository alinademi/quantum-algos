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
const {run,last}=await checkLabs(['cnot', 'circuits']);
test('CNOT creates a Bell pair and the order of a circuit matters',()=>{
 const bell=[q.c(Math.SQRT1_2),q.c(0),q.c(0),q.c(Math.SQRT1_2)];
 state(run('cnot')[1].state!,bell);state(last('circuits').state!,bell);
 state(last('circuits',{order:'CNOT then H'}).state!,g.product('+','0'));
});
test('CNOT entangles +0 but not ++',()=>{for(const [b,expected] of [['0',1],['+',0]] as const)close(Number(run('cnot',{a:'+',b})[1].rows!.find(r=>r.label.startsWith('Concurrence'))!.value),expected);});
