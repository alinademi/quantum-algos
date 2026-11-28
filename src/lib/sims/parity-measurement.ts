import { choice, product, apply,cx, branch, stateStep, distribution,row,type Lab } from './gate-lab.ts';
export const lab:Lab={
 controls:[choice('a','Data q0',['+','0','1','−']),choice('b','Data q1',['+','0','1','−'])],
 run:v=>{const s=product(v.a,v.b,'0'),t=apply(apply(s,cx(0,2)),cx(1,2));const branches=[0,1].map(i=>branch(t,2,i));return [stateStep('Start','q2 is the parity helper in 0.',s),stateStep('Two CNOTs','Helper records XOR of data bits without resolving which bit is which.',t),distribution('Measure helper','0 means even parity; 1 means odd.', ['Even (+1)','Odd (−1)'],branches.map(b=>b?.p??0)),...branches.flatMap((b,i)=>b?[stateStep('Conditional data: '+(i?'odd':'even'),'Only the parity is known, so coherence within this parity subspace remains.',b.state,[row('Probability',b.p)])]:[])].map(step=>({...step,start:'|'+v.a+'⟩ |'+v.b+'⟩ |0⟩'}))}
};
