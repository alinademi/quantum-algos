import test from 'node:test';
import assert from 'node:assert/strict';
import * as q from '../quantum.ts';
import { probability } from './gate-lab.ts';
import { checkLabs,close,state,value } from './gate-lab-checks.ts';
const {run,last}=await checkLabs(['phase-kickback']);
test('X eigenstates acquire opposite phases; basis targets become entangled',()=>{
 for(const [target,expected] of [['−',1],['+',0],['0',.5],['1',.5]] as const){
  const steps=run('phase-kickback',{eigen:target});
  close(probability(steps[2].state!,0),expected);
  assert.equal(steps[1].rows!.find(r=>r.label==='Target eigenstate?')!.value,target==='−'||target==='+'?'Yes':'No');
 }
});
test('P kickback gives sin squared half-angle odds for every angle, with target |1⟩ intact',()=>{
 for(const angle of ['0','45','90','180']){
  const phi=+angle*Math.PI/180,steps=run('phase-kickback',{mode:'P',eigen:'1',angle});
  state(steps[1].state!,q.tensor([q.c(Math.SQRT1_2),q.scale(q.expi(phi),Math.SQRT1_2)],q.ket1()));
  close(probability(steps[2].state!,0),Math.sin(phi/2)**2);
  close(value(steps[2],'p(control = 1) = sin²(φ/2)'),Math.sin(phi/2)**2,1e-6);
  close(probability(last('phase-kickback',{mode:'P',eigen:'0',angle}).state!,0),0);
 }
});
