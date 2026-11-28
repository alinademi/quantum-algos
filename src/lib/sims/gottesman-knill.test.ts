import test from 'node:test';
import assert from 'node:assert/strict';
import { expect,lab } from './gottesman-knill.ts';
import { evolveGenerators,prep } from './stabilizer-states.ts';
import { defaults,runOps,product } from './gate-lab.ts';
import { pauli } from './pauli-strings.ts';
import { inner,matVec } from '../quantum.ts';
test('signed expectations and the lab agree for all three cases',()=>{
 const gens=evolveGenerators(2,prep(2,'Signed example'));
 assert.equal(expect(gens,'ZI'),-1); assert.equal(expect(gens,'II'),1);assert.equal(expect(gens,'XI'),0);
 for(const mode of ['GHZ','Product plus','Signed example']){
  const s=runOps(product('0','0','0'),prep(3,mode)),g=evolveGenerators(3,prep(3,mode));
  for(const a of 'IXYZ')for(const b of 'IXYZ')for(const c of 'IXYZ'){
    const p=a+b+c;assert.ok(Math.abs(expect(g,p)-inner(s,matVec(pauli(p),s)).re)<1e-10);
  }
 }
 const d=lab.run({...defaults(lab),state:'Signed example',query:'Z on first'}).at(-1)!.distribution!;
 assert.deepEqual(d.p,[0,1]);
});
