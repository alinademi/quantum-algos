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
const {run,last}=await checkLabs(['toffoli']);
test('Toffoli and Fredkin reproduce truth tables on all eight inputs',()=>{
 for(let i=0;i<8;i++){
  state(g.apply(q.basis(3,i),g.ccx(0,1,2)),q.basis(3,i>=6?i^1:i));
  const j=i<4?i:4+((i&1)<<1)+((i&2)>>1);
  state(g.apply(q.basis(3,i),fredkin),q.basis(3,j));
  state(g.runOps(q.basis(3,i),[g.cx(1,2),g.ccx(0,2,1),g.cx(1,2)]),q.basis(3,j));
 }
});
test('three CNOTs swap two wires for every input',()=>{matrix(g.fullMatrix(3,[g.cx(0,1),g.cx(1,0),g.cx(0,1)]),q.kron(g.SWAP,q.I));});
