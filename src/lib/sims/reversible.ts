import { choice,bits,bstate,ccx,sequence,details,row,type Lab } from './gate-lab.ts';
import { fredkin } from './fredkin.ts';
export const landauer=(t:number)=>1.380649e-23*t*Math.LN2;
export const lab:Lab={
 controls:[choice('input','a,b,target',['110',...bits(3).filter(x=>x!=='110')]),choice('gate','Reversible gate',['Toffoli','Fredkin']),choice('temp','Erasure temperature (K)',['300','77','4','1'])],
 run:v=>{const o=v.gate==='Fredkin'?fredkin:ccx(0,1,2),steps=sequence(bstate(v.input),[o,o],v.gate==='Fredkin'?'The conditional exchange is reversed; all three inputs return.':'Both controls return unchanged.');const [a,b,t]=[...v.input].map(Number),out=steps[1].state!.findIndex(z=>z.re*z.re+z.im*z.im>.99).toString(2).padStart(3,'0');steps[1].rows=[...(steps[1].rows??[]),row('Output bits',out),row('Third bit logic',v.gate==='Toffoli'?(t?'NAND(a,b)':'AND(a,b)'):!t?'AND(a,b)':!b?'NOT a':'Conditional swap')];return [details('Irreversible AND','Distinct input pairs can share the same output. A reset erasing one independent unbiased bit has the ideal Landauer lower bound.',[row('AND',+v.input[0]&+v.input[1]),row('kBT ln 2, joules',landauer(+v.temp).toExponential(4))]),...steps] }
};
