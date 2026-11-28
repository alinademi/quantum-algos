import { choice,bits,bstate,ccx,sequence,details,row,type Lab } from './gate-lab.ts';
export const landauer=(t:number)=>1.380649e-23*t*Math.LN2;
export const lab:Lab={
 controls:[choice('input','a,b,target',bits(3)),choice('temp','Erasure temperature (K)',['300','77','4','1'])],
 run:v=>[details('Irreversible AND','Distinct input pairs can share the same output. A reset erasing one independent unbiased bit has the ideal Landauer lower bound.',[row('AND',+v.input[0]&+v.input[1]),row('kBT ln 2, joules',landauer(+v.temp).toExponential(4))]),...sequence(bstate(v.input),[ccx(0,1,2),ccx(0,1,2)],'The two original inputs were never erased.')]
};
