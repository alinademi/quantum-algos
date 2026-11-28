import { choice,product,ccx,cx,gate,sequence,type Lab } from './gate-lab.ts';
export const lab:Lab={
 controls:[choice('a','Input A',['+','0','1']),choice('b','Input B',['+','0','1']),choice('clear','Uncompute scratch?',['Yes','No'])],
 run:v=>sequence(product(v.a,v.b,'0','0'),[ccx(0,1,2),cx(2,3),...(v.clear==='Yes'?[ccx(0,1,2)]:[])],v.clear==='Yes'?'q2 is 0 again; q3 keeps the Boolean AND coherently.':'q2 still holds the computed value, entangled with inputs in general.')
};
