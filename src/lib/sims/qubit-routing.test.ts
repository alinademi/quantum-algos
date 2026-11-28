import test from 'node:test';
import assert from 'node:assert/strict';
import * as q from '../quantum.ts';
import * as g from './gate-lab.ts';
import { route, layoutTrace, placements } from './qubit-routing.ts';

import { checkLabs,state,matrix,all,value } from './gate-lab-checks.ts';
const {last}=await checkLabs(['qubit-routing']);
test('routing restores all logical wires and only uses nearest-neighbor gates',()=>{
 for(let a=0;a<4;a++)for(let b=0;b<4;b++)if(a!==b){const ops=route(a,b);assert.ok(ops.every(o=>Math.abs(o.wires[0]-o.wires[1])===1));assert.equal(ops.length,2*(Math.abs(a-b)-1)+1);matrix(g.fullMatrix(4,ops),g.fullMatrix(4,[g.cx(a,b)]));}
});
test('physical mapping tracks each logical wire and places CNOT endpoints correctly',()=>{for(let a=0;a<4;a++)for(let b=0;b<4;b++)if(a!==b){const r=layoutTrace(a,b);assert.deepEqual(r[0].sites,[0,1,2,3]);assert.deepEqual(r.at(-1)!.sites,[0,1,2,3]);for(const step of r){assert.deepEqual([...step.sites].sort(),[0,1,2,3]);if(step.name==='CNOT')assert.deepEqual(step.wires.map(w=>step.sites[w]),[a,b]);}}});
test('placement makes logical 0→3 adjacent and all routes restore the chosen layout',()=>{for(const sites of Object.values(placements))for(let a=0;a<4;a++)for(let b=0;b<4;b++)if(a!==b){const trace=layoutTrace(a,b,sites);assert.deepEqual(trace[0].sites,sites);assert.deepEqual(trace.at(-1)!.sites,sites);assert.deepEqual(trace.find(x=>x.name==='CNOT')!.wires.map(w=>trace.find(x=>x.name==='CNOT')!.sites[w]),[a,b]);assert.equal(trace.filter(x=>x.name==='SWAP').length,2*(Math.abs(sites.indexOf(a)-sites.indexOf(b))-1));}const v={pair:'0→3',start:'1',q1:'0',q2:'1',q3:'0',layout:'Reordered [1,2,0,3]'};const result=last('qubit-routing',v);assert.equal(value(result,'SWAPs'),0);state(result.state!,q.basis(4,7));assert.equal(value(last('qubit-routing',{...v,layout:'Straight [0,1,2,3]'}),'SWAPs'),4);});
