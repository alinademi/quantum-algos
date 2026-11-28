import { choice,product,cx,ccx,sequence,gate,probability,row,type Lab } from './gate-lab.ts';
export const lab:Lab={
 controls:[choice('scratch','Scratch start',['0','1','+','+i']),choice('data','Control',['+','0','1']),choice('mode','Protocol',['Compute and uncompute','Omit uncompute'])],
 run:v=>{const ops=[cx(0,1),...(v.mode==='Compute and uncompute'?[cx(0,1)]:[])];return sequence(product(v.data,v.scratch),ops,v.mode==='Compute and uncompute'?'The full joint state returns, including the unknown scratch state.':'The scratch may be correlated with the data; it cannot be assumed clean.')}
};
