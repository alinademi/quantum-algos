import { choice,product,gate,op,permutation,sequence,row,type Lab,type Op } from './gate-lab.ts';
// Finite cyclic head-position model (not a universal QTM): q0 coin, q1q2 position.
export const shift=op('Conditional head shift',permutation(8,i=>((i&4)|(((i&3)+(i&4?1:3))%4))),0,1,2);
export const lab:Lab={
 controls:[choice('pos','Initial head position',['0','1','2','3']),choice('coin','Internal direction',['+','0','1']),choice('steps','Number of steps',['1','2','3','4'])],
 run:v=>sequence(product(v.coin,...(+v.pos).toString(2).padStart(2,'0')),[...Array.from({length:+v.steps},()=>[gate('H'),shift]).flat()],'q0 is the internal coin; q1q2 are the head position on a four-site ring. Tape symbols are fixed in this toy model.')
};
