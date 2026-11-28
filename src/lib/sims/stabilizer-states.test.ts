import test from 'node:test';
import assert from 'node:assert/strict';
import * as q from '../quantum.ts';
import * as g from './gate-lab.ts';
import { pauli } from './pauli-strings.ts';
import { evolveGenerators, prep } from './stabilizer-states.ts';
import { expect } from './gottesman-knill.ts';

import { checkLabs,close,state,all,value } from './gate-lab-checks.ts';
const {last}=await checkLabs(['stabilizer-states']);
test('signed stabilizer generators and GF(2) expectation solver agree with dense simulation',()=>{
 for(let n=2;n<=4;n++)for(const mode of ['GHZ','Product plus','Signed example']){
  const ops=prep(n,mode),s=g.runOps(q.basis(n,0),ops),gens=evolveGenerators(n,ops);
  for(const gen of gens)close(gen.sign*q.inner(s,q.matVec(pauli(gen.p),s)).re,1);
  for(const query of all(n,['I','X','Y','Z']))close(expect(gens,query),q.inner(s,q.matVec(pauli(query),s)).re);
 }
 assert.equal(expect(evolveGenerators(2,prep(2,'Signed example')),'ZI'),-1);
});
test('generator count grows linearly while dense amplitudes double',()=>{for(let n=2;n<=6;n++){const s=last('stabilizer-states',{n:String(n)});assert.equal(s.state!.length,2**n);assert.equal(value(s,'Independent generators'),n);assert.equal(value(s,'Dense amplitudes'),2**n);for(const row of s.rows!.slice(0,n))assert.equal(row.value,'Signed expectation: 1.000000');}});

test('50-qubit GHZ is tracked by 50 exact generators without a dense vector',()=>{const r=last('stabilizer-states',{n:'50',mode:'GHZ'});assert.equal(r.state,undefined);assert.equal(r.rows!.length,52);assert.equal(r.rows![0].label,'+'+'X'.repeat(50));for(let i=1;i<50;i++)assert.equal(r.rows![i].label,'+'+'I'.repeat(i-1)+'ZZ'+'I'.repeat(49-i));assert.equal(r.rows!.at(-1)!.value,'1125899906842624');});
