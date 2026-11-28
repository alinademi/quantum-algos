import { choice, product, apply, cx, branch, gate, distribution, mixture, bits, stateStep,row,type Lab } from './gate-lab.ts';
import { probs } from '../quantum.ts';
export const lab:Lab={
 controls:[choice('a','Control start',['+','−','0','1']),choice('b','Target start',['0','1','+'])],
 run:v=>{const s=product(v.a,v.b);const bs=[0,1].flatMap(k=>{const b=branch(s,0,k);return b?[{p:b.p,state:k?apply(b.state,gate('X',1)):b.state}]:[]});const deferred=apply(s,cx(0,1));const p=mixture(bs);return [stateStep('Input','Same input for both procedures.',s),distribution('Measure, then classically control','Measure q0 in Z, and flip q1 only on result 1. Average over results.',bits(2),p),stateStep('Coherently controlled gate','Keep q0 unmeasured; apply CNOT.',deferred),distribution('Measure both at the end','The joint classical distributions agree, but the premeasurement quantum states need not.',bits(2),probs(deferred),[row('Maximum probability gap',Math.max(...p.map((x,i)=>Math.abs(x-probs(deferred)[i]))))])]}
};
