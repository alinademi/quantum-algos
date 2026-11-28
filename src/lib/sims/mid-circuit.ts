import { choice, product, gate, cx, apply, branch, stateStep, distribution, mixture, bits, row, type Lab } from './gate-lab.ts';
export const lab:Lab={
 controls:[choice('start','q0 start',['+','0','1','−']),choice('act','After measuring q0',['X on q1 if 1','Reset q0','Do nothing'])],
 run:v=>{const s=apply(product(v.start,'0'),cx(0,1));const out=[stateStep('Prepare and entangle','Start q0 as selected, q1 as 0, then CNOT.',s)];const bs=[0,1].flatMap(k=>{const b=branch(s,0,k);if(!b)return [];out.push(stateStep('If measurement is '+k,'This is the conditional normalized state.',b.state,[row('Branch probability',b.p)]));return [{p:b.p,state:k===1&&v.act!=='Do nothing'?apply(b.state,gate('X',v.act==='Reset q0'?0:1)):b.state}]});out.push(distribution('After feed-forward','The result below averages over possible classical outcomes. Measurement was not undone.',bits(2),mixture(bs)));return out.map(step=>({...step,start:'|'+v.start+'⟩ |0⟩'}))}
};
