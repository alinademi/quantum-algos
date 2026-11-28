import test from 'node:test';

import { checkLabs,close,state } from './gate-lab-checks.ts';
const {last}=await checkLabs(['hadamard-test', 'swap-test']);
test('Hadamard test real and imaginary sign and SWAP test distinguish overlaps',()=>{
 for(const [part,p] of [['Real',.5],['Imaginary',1]] as const)close(last('hadamard-test',{state:'1',unitary:'P',angle:'90',part}).distribution!.p[0],p);
 close(last('hadamard-test',{state:'1',unitary:'Z',part:'Real'}).distribution!.p[0],0);
 close(last('swap-test',{a:'0',theta:'0'}).distribution!.p[0],1);
 close(last('swap-test',{a:'0',theta:'180'}).distribution!.p[0],.5);
 close(last('swap-test',{a:'0',theta:'90'}).distribution!.p[0],.75);
});

test('Hadamard estimator uses the real and imaginary expectation with the correct sign',()=>{const r=last('hadamard-test',{state:'+',unitary:'P',angle:'90',part:'Imaginary'});close(r.distribution!.p[0],.75);close(r.estimate!.values[0],1);close(r.estimate!.values[1],-1);});
