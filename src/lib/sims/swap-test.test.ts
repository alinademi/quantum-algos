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

test('SWAP measurement estimates squared overlap, including negative sample fluctuations',()=>{const r=last('swap-test',{a:'0',theta:'90'});close(r.distribution!.p[0],.75);close(r.estimate!.values[0],1);close(r.estimate!.values[1],-1);});

test('helper odds match independent geometric formula for every selected Bloch direction',()=>{const v:Record<string,number[]>={'0':[0,0,1],'1':[0,0,-1],'+':[1,0,0],'+i':[0,1,0]};for(const [a,r] of Object.entries(v))for(const theta of [0,30,45,60,90,120,180])for(const phi of [0,45,90,180,270]){const t=theta*Math.PI/180,f=phi*Math.PI/180,dot=r[0]*Math.sin(t)*Math.cos(f)+r[1]*Math.sin(t)*Math.sin(f)+r[2]*Math.cos(t);close(last('swap-test',{a,theta:String(theta),phi:String(phi)}).distribution!.p[0],(3+dot)/4);}});
