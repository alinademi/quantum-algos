import test from 'node:test';
import * as q from '../quantum.ts';
import * as g from './gate-lab.ts';
import { unitaryError } from './gates.ts';
import { family } from './two-qubit-gates.ts';

import { checkLabs,close,state,matrix,value } from './gate-lab-checks.ts';
const {run,last}=await checkLabs(['two-qubit-gates']);
test('two-qubit families: unitary, exchange phases, fSim limits, XX interaction, square-root SWAP and ECR',()=>{
 for(const n of ['iSWAP','√SWAP','RXX','RZZ','MS (XX convention)','fSim','ECR'])close(unitaryError(family(n,.31,.73)),0);
 state(q.matVec(family('iSWAP',0,0),q.basis(2,1)),[q.c(0),q.c(0),q.c(0,1),q.c(0)]);
 const root=family('√SWAP',0,0);matrix(q.matMul(root,root),g.SWAP);
 state(q.matVec(family('RXX',Math.PI/2,0),q.basis(2,0)),[q.c(Math.SQRT1_2),q.c(0),q.c(0),q.c(0,-Math.SQRT1_2)]);
 matrix(family('fSim',0,0),g.eye(4));state(q.matVec(family('fSim',0,.123),q.basis(2,3)),[q.c(0),q.c(0),q.c(0),q.expi(-.123)]);
 const ecr=family('ECR',0,0);matrix(q.matMul(ecr,ecr),g.eye(4));
 state(q.matVec(ecr,q.basis(2,0)),[q.c(0),q.c(0),q.c(Math.SQRT1_2),q.c(0,-Math.SQRT1_2)]);
});
test('MS convention equals XX and RZZ entangles ++',()=>{matrix(family('MS (XX convention)',.8,0),family('RXX',.8,0));const [a,b,c,d]=q.matVec(family('RZZ',Math.PI/2,0),g.product('+','+'));close(2*q.abs(q.sub(q.mul(a,d),q.mul(b,c))),1);});
test('ECR is echoed opposite ZX rotations with an X echo on q0',()=>{const zx=q.kron(q.Z,q.X);const rot=(t:number)=>g.eye(4).map((r,i)=>r.map((z,j)=>q.add(q.scale(z,Math.cos(t/2)),q.mul(q.c(0,-Math.sin(t/2)),zx[i][j]))));const ecr=q.matMul(rot(-Math.PI/4),q.matMul(q.kron(q.X,q.I),rot(Math.PI/4)));matrix(family('ECR',0,0),ecr);});

test('lab repeats √SWAP to exchange the states, or inverts it to restore them',()=>{state(last('two-qubit-gates',{name:'√SWAP',start:'01',second:'Same gate'}).state!,q.basis(2,2));state(last('two-qubit-gates',{name:'√SWAP',start:'01',second:'Inverse'}).state!,q.basis(2,1));});

test('lab distinguishes product and entangled outputs of the same interaction',()=>{const concurrence=(name:string,start:string)=>value(run('two-qubit-gates',{name,start,theta:'90'})[1],'Concurrence (0 product, 1 maximal)');close(concurrence('RZZ','++'),1);close(concurrence('RZZ','00'),0);close(concurrence('√SWAP','01'),1);close(concurrence('SWAP','01'),0);});

test('ECR matches the independent XI−YX expression; phase-only fSim can entangle',()=>{const a=q.kron(q.X,q.I),b=q.kron(q.Y,q.X);matrix(family('ECR',0,0),a.map((r,i)=>r.map((z,j)=>q.scale(q.sub(z,b[i][j]),Math.SQRT1_2))));const s=run('two-qubit-gates',{name:'fSim',start:'++',theta:'0',phi:'180'})[1];close(value(s,'Concurrence (0 product, 1 maximal)'),1);q.probs(s.state!).forEach(p=>close(p,.25));});

test('ECR leaves 00 product but entangles +0',()=>{for(const [start,k] of [['00',0],['+0',1]] as const)close(value(run('two-qubit-gates',{name:'ECR',start})[1],'Concurrence (0 product, 1 maximal)'),k);});
