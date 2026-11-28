import { choice, product, apply, cx, branch, gate, distribution, mixture, bits, stateStep,row,type Lab } from './gate-lab.ts';
import { probs } from '../quantum.ts';
export const lab:Lab={
 controls:[choice('a','Control start',['+','−','0','1']),choice('b','Target start',['0','1','+']),choice('reuse','Use q0 again?',['No','Yes'])],
 run:v=>{
  const reuse=v.reuse==='Yes',start='|'+v.a+'⟩ |'+v.b+'⟩'+(reuse?' |0⟩':''),s=product(v.a,v.b,...(reuse?['0']:[]));
  const bs=[0,1].flatMap(k=>{const b=branch(s,0,k);if(!b)return [];let out=b.state;
    if(k){out=apply(out,gate('X',1));if(reuse)out=apply(out,gate('X',2));}
    if(reuse)out=apply(out,gate('H',0));return [{p:b.p,state:out}];});
  let deferred=reuse?apply(apply(apply(s,cx(0,2)),cx(2,1)),gate('H',0)):apply(s,cx(0,1));
  const labels=bits(reuse?3:2),p=mixture(bs),q=probs(deferred);
  return [stateStep('Input','Same input for both procedures.',s),distribution('Measure, then classically control',reuse?'Record q0 in q2, flip q1 on 1, then H on q0.':'Measure q0 in Z, and flip q1 only on result 1.',labels,p),stateStep('Coherently controlled gate',reuse?'CNOT q0 into fresh q2, CNOT q2 into q1, then H on q0.':'Keep q0 unmeasured; apply CNOT.',deferred),distribution('Measure at the end','The joint classical distributions agree, but the premeasurement quantum states need not.',labels,q,[row('Maximum probability gap',Math.max(...p.map((x,i)=>Math.abs(x-q[i]))))])].map(step=>({...step,start}));
 }
};
