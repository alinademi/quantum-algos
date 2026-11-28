import { abs, mul, sub } from '../quantum.ts';
import { row, choice, kets, product, cx, sequence, type Lab } from './gate-lab.ts';
export const lab: Lab = {
 controls:[choice('a','Control q0',['+','0','1','−','+i','−i']),choice('b','Target q1',['0','1','+','−'])],
 run:v=>sequence(product(v.a,v.b),[cx(0,1),cx(0,1)],'CNOT is its own inverse.').map(step=>{const [a,b,c,d]=step.state!;const concurrence=2*abs(sub(mul(a,d),mul(b,c)));return {...step,rows:[...(step.rows??[]),row('Entangled?',concurrence>1e-10?'Yes':'No'),row('Concurrence (0 product, 1 maximal)',concurrence)]};})
};
