import test from 'node:test';
import assert from 'node:assert/strict';
import { sequence,product,ket,gate,describeState,stateDistribution } from './gate-lab.ts';
test('every circuit step retains the selected explicit start and has a unique number',()=>{
 const steps=sequence(product('+','0'),[gate('X'),gate('X')]);
 assert.equal(steps[0].start,'|+⟩ |0⟩');
 assert.equal(steps[2].start,steps[0].start);
 assert.notEqual(steps[1].title,steps[2].title);
 assert.match(steps[1].note,/Started as \|\+⟩ \|0⟩/);
 assert.equal(describeState(ket('−i')),'|−i⟩');
 const d=stateDistribution(steps[1].state!);
 assert.ok(Math.abs(d.p.reduce((a,b)=>a+b,0)-1)<1e-12);
});
