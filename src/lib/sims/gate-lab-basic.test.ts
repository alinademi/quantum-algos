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
const { run, last } = await checkLabs(['classical-gates', 'gates', 'pauli', 'phase-gates', 'rotations', 'single-qubit-unitary', 'shots', 'cnot', 'circuits', 'bell-states', 'controlled-gates', 'toffoli', 'fredkin', 'multi-controlled', 'two-qubit-gates', 'circuit-identities']);

test('wire ordering: controls on nonadjacent and reversed wires match classical XOR, including relative phases',()=>{
 for(let n=2;n<=5;n++)for(let a=0;a<n;a++)for(let b=0;b<n;b++)if(a!==b)for(let i=0;i<2**n;i++){
  const target=i&(1<<(n-1-a))?i^(1<<(n-1-b)):i;
  state(g.apply(q.basis(n,i),g.cx(a,b)),q.basis(n,target));
 }
 const input=g.product('+i','−','1');
 state(g.apply(input,g.gate('Y',1)),q.apply1(input,q.Y,1));
 assert.throws(()=>g.apply(input,g.op('bad',q.X,3)));
 assert.throws(()=>g.apply(input,g.cx(0,0)));
 assert.throws(()=>g.permutation(4,()=>0));
});
test('classical truth tables and NAND universality',()=>{
 const tables:Record<string,number[]>={NOT:[1,1,0,0],AND:[0,0,0,1],OR:[0,1,1,1],XOR:[0,1,1,0],NAND:[1,1,1,0]};
 for(const [name,expected] of Object.entries(tables))for(let i=0;i<4;i++){assert.equal(boolean(name,i>>1,i&1),expected[i]);assert.equal(viaNand(name,i>>1,i&1),expected[i]);}
});
test('unitary gates and Paulis: adjoint reverses, Y signs, and XY=iZ',()=>{
 for(const m of Object.values(g.G))close(unitaryError(m),0);
 close(unitaryError([[q.c(1),q.c(0)],[q.c(0),q.c(2)]]),3);
 state(g.apply(g.ket('0'),g.gate('Y')), [q.c(0),q.c(0,1)]);
 state(g.apply(g.ket('1'),g.gate('Y')), [q.c(0,-1),q.c(0)]);
 matrix(q.matMul(q.X,q.Y),phase(q.Z,Math.PI/2));
 for(const axis of ['X','Y','Z'])state(last('pauli',{start:'+i',axis}).state!,g.ket('+i'));
});
test('phase gates produce sin squared half-angle interference',()=>{
 for(const phi of g.angles)close(q.probs(last('phase-gates',{gate:'P',phi,start:'+'}).state!)[1],Math.sin(g.deg(phi)/2)**2);
});
test('rotations have spinor 2π sign and 4π period; positive Y acts toward +X',()=>{
 for(const a of ['X','Y','Z'])matrix(g.rotation(a,360).matrix,phase(q.I,Math.PI));
 state(g.apply(g.ket('0'),g.rotation('Y',90)),q.plus());
 state(g.apply(g.ket('0'),g.rotation('X',90)),[q.c(Math.SQRT1_2),q.c(0,-Math.SQRT1_2)]);
});
test('Euler decomposition matches general U including phase',()=>{
 for(const t of [0,.71,Math.PI])for(const p of [-2,0,.8])for(const l of [-.9,0,1.7]){
  matrix(u(t,p,l),phase(euler(t,p,l),(p+l)/2));close(unitaryError(u(t,p,l)),0);
 }
});
test('shot uncertainty follows the binomial standard error, including deterministic endpoints',()=>{
 close(stderr(.5,100),.05);close(stderr(.5,10000),.005);close(stderr(1,100),0);close(stderr(0,100),0);
 const counts=q.sample([0,1,0],100,()=>0.5);assert.deepEqual(counts,[0,100,0]);
});
test('CNOT creates a Bell pair and the order of a circuit matters',()=>{
 const bell=[q.c(Math.SQRT1_2),q.c(0),q.c(0),q.c(Math.SQRT1_2)];
 state(run('cnot')[1].state!,bell);state(last('circuits').state!,bell);
 state(last('circuits',{order:'CNOT then H'}).state!,g.product('+','0'));
});
test('the four Bell labels produce the four orthonormal Bell states and decode',()=>{
 const states=g.bits(2).map(s=>{
  const a=+s[0],b=+s[1],expected=q.basis(2,b).map((x,i)=>q.add(q.scale(x,Math.SQRT1_2),q.c(i===3-b?(a?-1:1)*Math.SQRT1_2:0)));
  const st=last('bell-states',{start:s,decode:'Prepare only'}).state!;state(st,expected);
  state(last('bell-states',{start:s}).state!,g.bstate(s));return st;
 });
 states.forEach((a,i)=>states.forEach((b,j)=>close(q.abs(q.inner(a,b)),+(i===j))));
});
test('controlled decompositions match independent block matrices for both control values',()=>{
 for(const [name,m] of Object.entries({CX:q.X,CY:q.Y,CZ:q.Z,CP:q.P(.731)}))for(const on of [0,1]){
  const expected=g.eye(4);for(let i=0;i<2;i++)for(let j=0;j<2;j++)expected[2*on+i][2*on+j]=m[i][j];
  matrix(g.fullMatrix(2,implementation(name,.731,on)),expected);
 }
});
test('Toffoli and Fredkin reproduce truth tables on all eight inputs',()=>{
 for(let i=0;i<8;i++){
  state(g.apply(q.basis(3,i),g.ccx(0,1,2)),q.basis(3,i>=6?i^1:i));
  const j=i<4?i:4+((i&1)<<1)+((i&2)>>1);
  state(g.apply(q.basis(3,i),fredkin),q.basis(3,j));
  state(g.runOps(q.basis(3,i),[g.cx(1,2),g.ccx(0,2,1),g.cx(1,2)]),q.basis(3,j));
 }
});
test('multi-controlled scratch ladder acts correctly on definite and coherent controls and cleans scratch',()=>{
 for(const count of ['2','3','4'])for(const pattern of ['All 1','First 0','First +'])for(const target of ['0','1']){
  const direct=last('multi-controlled',{count,pattern,target,mode:'Direct gate'}).state!;
  const decomposed=last('multi-controlled',{count,pattern,target,mode:'Clean scratch'}).state!;
  state(decomposed,q.tensor(direct,q.basis(+count-2,0)));
  state(last('multi-controlled',{count,pattern,target,mode:'No scratch (phase ladder)'}).state!,direct);
 }
});
test('no-scratch multi-controlled X is exact on every basis input',()=>{
 for(let n=2;n<=4;n++)matrix(g.fullMatrix(n+1,noScratch(Array.from({length:n},(_,i)=>i),n)),g.control(q.X,n));
});
test('two-qubit families: unitary, exchange phases, fSim limits, XX interaction, square-root SWAP and ECR',()=>{
 for(const n of ['iSWAP','√SWAP','RXX','RZZ','MS (XX convention)','fSim','ECR'])close(unitaryError(family(n,.31,.73)),0);
 state(q.matVec(family('iSWAP',0,0),q.basis(2,1)),[q.c(0),q.c(0),q.c(0,1),q.c(0)]);
 const root=family('√SWAP',0,0);matrix(q.matMul(root,root),g.SWAP);
 state(q.matVec(family('RXX',Math.PI/2,0),q.basis(2,0)),[q.c(Math.SQRT1_2),q.c(0),q.c(0),q.c(0,-Math.SQRT1_2)]);
 matrix(family('fSim',0,0),g.eye(4));state(q.matVec(family('fSim',0,.123),q.basis(2,3)),[q.c(0),q.c(0),q.c(0),q.expi(-.123)]);
 const ecr=family('ECR',0,0);matrix(q.matMul(ecr,ecr),g.eye(4));
 state(q.matVec(ecr,q.basis(2,0)),[q.c(0),q.c(0),q.c(Math.SQRT1_2),q.c(0,-Math.SQRT1_2)]);
});
test('circuit identities agree on all basis columns',()=>{
 for(const name of ['HXH','Reverse CNOT','CZ symmetry','Cancel CNOTs']){const [a,b]=circuits(name);matrix(g.fullMatrix(2,a),g.fullMatrix(2,b));}
});
