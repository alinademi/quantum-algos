import test from 'node:test';
import assert from 'node:assert/strict';
import { boolean, viaNand } from './classical-gates.ts';

import { checkLabs } from './gate-lab-checks.ts';
const {run}=await checkLabs(['classical-gates']);
test('classical truth tables and NAND universality',()=>{
 const tables:Record<string,number[]>={NOT:[1,1,0,0],AND:[0,0,0,1],OR:[0,1,1,1],XOR:[0,1,1,0],NAND:[1,1,1,0]};
 for(const [name,expected] of Object.entries(tables))for(let i=0;i<4;i++){assert.equal(boolean(name,i>>1,i&1),expected[i]);assert.equal(viaNand(name,i>>1,i&1),expected[i]);}
});

test('a unary NOT truth table has two rows and no unused input',()=>{const steps=run('classical-gates',{gate:'NOT',a:'1',b:'1'});assert.deepEqual(steps[0].rows!.map(r=>[r.label,r.value]),[['0','1'],['1','0']]);assert.deepEqual(steps[1].rows!.map(r=>r.label),['A','NOT']);});
