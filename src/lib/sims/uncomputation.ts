import { Z, probs } from '../quantum.ts';
import { choice,product,ccx,cx,gate,sequence,op,control,runOps,distribution,row,type Lab } from './gate-lab.ts';
export const interferenceOps=(clear:boolean)=>[ccx(0,1,2),cx(2,3),...(clear?[ccx(0,1,2)]:[]),op('CZ',control(Z),0,1),gate('H',0),gate('H',1)];
export function interference(clear:boolean){const state=runOps(product('+','+','0','−'),interferenceOps(clear));const p=[0,0,0,0];probs(state).forEach((x,i)=>p[i>>2]+=x);return p;}
export const lab:Lab={
 controls:[choice('clear','Uncompute scratch?',['Yes','No'])],
 run:v=>{const clear=v.clear==='Yes',start='|+⟩ |+⟩ |0⟩ |−⟩',s=sequence(product('+','+','0','−'),interferenceOps(clear),clear?'The scratch is clear; the data interfere to give 00.':'The scratch stores which input was 11, spoiling interference.');return [...s,{...distribution('Measure data only',clear?'Cleanup restores interference.':'The retained record spoils interference.',['00','01','10','11'],interference(clear),[row('Probability of 00',interference(clear)[0])]),start}];}
};
