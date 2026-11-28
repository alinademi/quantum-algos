import { choice, kets, product, cx, sequence, type Lab } from './gate-lab.ts';
export const lab: Lab = {
 controls:[choice('a','Control q0',['+','0','1','−','+i','−i']),choice('b','Target q1',['0','1','+','−'])],
 run:v=>sequence(product(v.a,v.b),[cx(0,1),cx(0,1)],'CNOT is its own inverse.')
};
