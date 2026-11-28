import test from 'node:test';
import assert from 'node:assert/strict';
import * as q from '../quantum.ts';
import * as g from './gate-lab.ts';
import { bitOracle, phaseOracle, funcs, f } from './oracles.ts';
import { landauer } from './reversible.ts';
import { addOps, compareGate, compareOps } from './quantum-arithmetic.ts';

import { checkLabs, close, state, matrix } from './gate-lab-checks.ts';
const { run, last } = await checkLabs(['phase-kickback', 'mid-circuit', 'deferred-measurement', 'parity-measurement', 'hadamard-test', 'swap-test', 'reversible', 'oracles', 'quantum-parallelism', 'ancillas', 'uncomputation', 'quantum-arithmetic']);

test('mid-circuit feed-forward and deferred measurement preserve correct joint statistics',()=>{
 assert.deepEqual(last('mid-circuit',{start:'1',act:'X on q1 if 1'}).distribution!.p,[0,0,1,0]);
 assert.deepEqual(last('mid-circuit',{start:'1',act:'Reset q0'}).distribution!.p,[0,1,0,0]);
 assert.equal(run('mid-circuit',{start:'1'}).filter(s=>s.title.startsWith('If measurement')).length,1);
 const steps=run('deferred-measurement');[.5,0,0,.5].forEach((p,i)=>{close(steps[1].distribution!.p[i],p);close(steps[3].distribution!.p[i],p);});
 assert.ok(q.abs(steps[2].state![0])>.7&&q.abs(steps[2].state![3])>.7);
});
test('parity measurement preserves coherence inside parity subspaces, including sign',()=>{
 const s=run('parity-measurement',{a:'−',b:'+'});close(s[2].distribution!.p[0],.5);close(s[2].distribution!.p[1],.5);
 const even=q.basis(3,0).map((x,i)=>q.c(i===0?Math.SQRT1_2:i===6?-Math.SQRT1_2:0));
 const odd=q.basis(3,0).map((x,i)=>q.c(i===3?Math.SQRT1_2:i===5?-Math.SQRT1_2:0));
 state(s[3].state!,even);state(s[4].state!,odd);
});
test('Hadamard test real and imaginary sign and SWAP test distinguish overlaps',()=>{
 for(const [part,p] of [['Real',.5],['Imaginary',1]] as const)close(last('hadamard-test',{state:'1',unitary:'P',angle:'90',part}).distribution!.p[0],p);
 close(last('hadamard-test',{state:'1',unitary:'Z',part:'Real'}).distribution!.p[0],0);
 close(last('swap-test',{a:'0',theta:'0'}).distribution!.p[0],1);
 close(last('swap-test',{a:'0',theta:'180'}).distribution!.p[0],.5);
 close(last('swap-test',{a:'0',theta:'90'}).distribution!.p[0],.75);
});
test('Landauer bound uses exact SI Boltzmann constant and scales linearly with temperature',()=>{
 close(landauer(300)/1e-21,2.870978885,1e-7);close(landauer(4)/landauer(1),4);
});
test('oracles: clean bit encoding, involution, and phase kickback for every function and input',()=>{
 for(const name of funcs){const bit=bitOracle(name),phaseMap=phaseOracle(name);matrix(q.matMul(bit,bit),g.eye(8));
  for(let x=0;x<4;x++){for(let y=0;y<2;y++)state(q.matVec(bit,q.basis(3,2*x+y)),q.basis(3,2*x+(y^f(name,x))));
   state(q.matVec(bit,q.tensor(q.basis(2,x),q.minus())),q.tensor(q.matVec(phaseMap,q.basis(2,x)),q.minus()));}
  const p=q.probs(last('quantum-parallelism',{f:name}).state!);for(let i=0;i<8;i++)close(p[i],(i&1)===f(name,i>>1)?.25:0);
 }
});
test('arithmetic: all accumulator basis values and all comparator flags, including overflow',()=>{
 for(let a=0;a<4;a++)for(let b=0;b<8;b++)state(g.runOps(q.basis(5,8*a+b),addOps),q.basis(5,8*a+((a+b)%8)));
 for(let a=0;a<4;a++)for(let b=0;b<4;b++)for(let t=0;t<2;t++){const start=q.basis(5,8*a+2*b+t),expected=q.basis(5,8*a+2*b+(t^+(a<b)));state(g.apply(start,compareGate),expected);state(g.runOps(start,compareOps),expected);}
});
