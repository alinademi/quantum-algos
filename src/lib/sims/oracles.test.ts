import test from 'node:test';
import assert from 'node:assert/strict';
import * as q from '../quantum.ts';
import * as g from './gate-lab.ts';
import { bitOracle, phaseOracle, funcs, f, oracleOps } from './oracles.ts';

import { checkLabs, close, state, matrix } from './gate-lab-checks.ts';
const {run,last}=await checkLabs(['oracles', 'quantum-parallelism']);
const tables:Record<string,number[]>={zero:[0,0,0,0],one:[1,1,1,1],'copy x1':[0,1,0,1],'NOT x1':[1,0,1,0],AND:[0,0,0,1],XOR:[0,1,1,0]};
test('truth tables and elementary oracle circuits agree on every basis column',()=>{
 assert.deepEqual(funcs,Object.keys(tables));
 for(const [name,table] of Object.entries(tables)){
  const bit=bitOracle(name),phaseMap=phaseOracle(name);
  matrix(q.matMul(bit,bit),g.eye(8));
  matrix(g.fullMatrix(3,oracleOps(name,true)),bit);
  matrix(g.fullMatrix(2,oracleOps(name,false)),phaseMap);
  for(let x=0;x<4;x++){
   assert.equal(f(name,x),table[x]);
   for(let y=0;y<2;y++)state(q.matVec(bit,q.basis(3,2*x+y)),q.basis(3,2*x+(y^table[x])));
   state(q.matVec(phaseMap,q.basis(2,x)),q.basis(2,x).map(a=>q.scale(a,table[x]?-1:1)));
   state(q.matVec(bit,q.tensor(q.basis(2,x),q.minus())),q.tensor(q.matVec(phaseMap,q.basis(2,x)),q.minus()));
  }
  const p=q.probs(last('quantum-parallelism',{f:name}).state!);
  for(let i=0;i<8;i++)close(p[i],(i&1)===table[i>>1]?.25:0);
 }
});
test('AND lab builds Toffoli and CZ and reports phase kickback only relatively on superpositions',()=>{
 const bit=run('oracles',{f:'AND',input:'++',type:'Bit flip (target −)'});
 assert.equal(bit.at(-1)!.diagram!.ops[0].name,'Toffoli');
 const phase=last('oracles',{f:'AND',input:'++',type:'Phase flip'});
 assert.equal(phase.diagram!.ops[0].name,'CZ');
 state(phase.state!,[q.c(.5),q.c(.5),q.c(.5),q.c(-.5)]);
 assert.match(last('oracles',{f:'AND',input:'11',type:'Phase flip'}).note,/global phase/);
});
