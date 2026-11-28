import { choice, sequence, product, gate, op, type Lab, row } from './gate-lab.ts';
import { funcs, bitOracle, f } from './oracles.ts';
export const lab:Lab={
 controls:[choice('f','Function',funcs),choice('a','Prepare input q0',['+','0','1']),choice('b','Prepare input q1',['+','0','1'])],
 run:v=>{const s=sequence(product(v.a,v.b,'0'),[op('Bit oracle',bitOracle(v.f),0,1,2)],'One standard-basis measurement returns just one input-output pair.');s.at(-1)!.rows=['00','01','10','11'].map((x,i)=>row('f('+x+')',f(v.f,i)));return s}
};
