import test from 'node:test';
import * as q from '../quantum.ts';
import * as g from './gate-lab.ts';
import { unitaryError } from './gates.ts';

import { checkLabs, close, state, matrix, phase } from './gate-lab-checks.ts';
const {run,last}=await checkLabs(['pauli']);
test('unitary gates and Paulis: adjoint reverses, Y signs, and XY=iZ',()=>{
 for(const m of Object.values(g.G))close(unitaryError(m),0);
 close(unitaryError([[q.c(1),q.c(0)],[q.c(0),q.c(2)]]),3);
 state(g.apply(g.ket('0'),g.gate('Y')), [q.c(0),q.c(0,1)]);
 state(g.apply(g.ket('1'),g.gate('Y')), [q.c(0,-1),q.c(0)]);
 matrix(q.matMul(q.X,q.Y),phase(q.Z,Math.PI/2));
 for(const axis of ['X','Y','Z'])state(last('pauli',{start:'+i',axis}).state!,g.ket('+i'));
});
test('Bloch half-turns independently reverse the two perpendicular coordinates',()=>{for(const [i,k] of ['X','Y','Z'].entries()){const v=q.fromBloch(.8,.4),before=q.bloch(v),after=q.bloch(g.apply(v,g.gate(k)));after.forEach((x,j)=>close(x,before[j]*(i===j?1:-1)));}});
test('Z preserves 0/1 probabilities but H reveals its relative phase',()=>{const ss=run('pauli',{start:'+',axis:'Z',follow:'Hadamard'});q.probs(ss[0].state!).forEach((x,i)=>close(x,q.probs(ss[1].state!)[i]));state(ss[2].state!,q.basis(1,1));state(q.matVec(q.H,q.plus()),q.basis(1,0));});
