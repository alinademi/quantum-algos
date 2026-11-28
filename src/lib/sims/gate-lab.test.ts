import test from 'node:test';
import assert from 'node:assert/strict';
import { sequence,product,ket,gate,describeState,stateDistribution,choice,defaults } from './gate-lab.ts';
test('every circuit step retains the selected explicit start and carries its gate index',()=>{
 const steps=sequence(product('+','0'),[gate('X'),gate('X')]);
 assert.equal(steps[0].start,'|+⟩ |0⟩');
 assert.equal(steps[2].start,steps[0].start);
 assert.equal(steps[1].title,steps[2].title);
 assert.equal(steps[1].diagram?.current,0);
 assert.equal(steps[2].diagram?.current,1);
 assert.match(steps[1].note,/Started as \|\+⟩ \|0⟩/);
 assert.equal(describeState(ket('−i')),'|−i⟩');
 const d=stateDistribution(steps[1].state!);
 assert.ok(Math.abs(d.p.reduce((a,b)=>a+b,0)-1)<1e-12);
});

test('conditional controls keep their default value and declare when relevant',()=>{const c=choice('angle','Angle',['90','0'],v=>v.mode==='P');assert.equal(c.active?.({mode:'X'}),false);assert.equal(c.active?.({mode:'P'}),true);assert.equal(defaults({controls:[c],run:()=>[]}).angle,'90');});
