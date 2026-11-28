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
const {run,last}=await checkLabs(['pauli', 'gates']);
test('unitary gates and Paulis: adjoint reverses, Y signs, and XY=iZ',()=>{
 for(const m of Object.values(g.G))close(unitaryError(m),0);
 close(unitaryError([[q.c(1),q.c(0)],[q.c(0),q.c(2)]]),3);
 state(g.apply(g.ket('0'),g.gate('Y')), [q.c(0),q.c(0,1)]);
 state(g.apply(g.ket('1'),g.gate('Y')), [q.c(0,-1),q.c(0)]);
 matrix(q.matMul(q.X,q.Y),phase(q.Z,Math.PI/2));
 for(const axis of ['X','Y','Z'])state(last('pauli',{start:'+i',axis}).state!,g.ket('+i'));
});
