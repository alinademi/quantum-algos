import { choice,product,ccx,sequence, type Lab } from './gate-lab.ts';
export const borrowedOps=[ccx(0,1,3),ccx(3,2,4),ccx(0,1,3),ccx(3,2,4)];
export const lab:Lab={
 controls:[choice('scratch','Borrowed q3 start',['0','1','+','+i']),choice('data','First control q0',['+','0','1']),choice('target','Target q4',['0','1']),choice('mode','Protocol',['Compute and uncompute','Omit final operation'])],
 run:v=>sequence(product(v.data,'1','1',v.scratch,v.target),v.mode==='Compute and uncompute'?borrowedOps:borrowedOps.slice(0,3),v.mode==='Compute and uncompute'?'The three controls flip q4 only on 111, and q3 is exactly restored.':'The last correction is missing: the target may depend on the borrowed value.')
};
