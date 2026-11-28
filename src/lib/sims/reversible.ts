import { choice,bits,bstate,ccx,sequence,details,row,type Lab } from './gate-lab.ts';
import { fredkin } from './fredkin.ts';
export const landauer=(t:number)=>1.380649e-23*t*Math.LN2;
export const lab:Lab={
 controls:[choice('input','a,b,target',['110',...bits(3).filter(x=>x!=='110')]),choice('gate','Reversible gate',['Toffoli','Fredkin']),choice('temp','Erasure temperature (K)',['300','77','4','1'])],
 run:v=>{const o=v.gate==='Fredkin'?fredkin:ccx(0,1,2);return [details('Irreversible AND','Distinct input pairs can share the same output. A reset erasing one independent unbiased bit has the ideal Landauer lower bound.',[row('AND',+v.input[0]&+v.input[1]),row('kBT ln 2, joules',landauer(+v.temp).toExponential(4))]),...sequence(bstate(v.input),[o,o],v.gate==='Fredkin'?'The conditional exchange is reversed; all three input bits are recovered. With target 0, the first exchange writes AND into that bit.':'The two original inputs were never erased.')] }
};
