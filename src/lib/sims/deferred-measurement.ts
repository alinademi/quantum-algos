import { choice, product, apply, cx, branch, gate, distribution, mixture, probability, bits, stateStep,row,type Lab } from './gate-lab.ts';
import { probs,inner,type State } from '../quantum.ts';
export const lab:Lab={
 controls:[choice('a','Control start',['+','−','0','1']),choice('b','Target start',['0','1','+']),choice('reuse','Use q0 again?',['No','Yes'])],
 run:v=>{
  const reuse=v.reuse==='Yes',start='|'+v.a+'⟩ |'+v.b+'⟩'+(reuse?' |0⟩':''),s=product(v.a,v.b,...(reuse?['0']:[]));
  const bs=[0,1].flatMap(k=>{const b=branch(s,0,k);if(!b)return [];let out=b.state;
    if(k){out=apply(out,gate('X',1));if(reuse)out=apply(out,gate('X',2));}
    if(reuse)out=apply(out,gate('H',0));return [{p:b.p,state:out}];});
  let deferred=reuse?apply(apply(apply(s,cx(0,2)),cx(2,1)),gate('H',0)):apply(s,cx(0,1));
  const labels=bits(reuse?3:2),p=mixture(bs),q=probs(deferred);
  const witness=(state:State)=>inner(state,reuse?apply(apply(apply(state,gate('Z',0)),gate('X',1)),gate('X',2)):apply(apply(state,gate('X',0)),gate('X',1))).re;
  const omitted=reuse?apply(apply(s,cx(0,1)),gate('H',0)):undefined;
  const name=reuse?'ZXX':'XX',early=bs.reduce((sum,b)=>sum+b.p*witness(b.state),0),late=witness(deferred);
  return [stateStep('Input','Same input for both procedures.',s),distribution('Measure, then classically control',reuse?'Record q0 in q2, flip q1 on 1, then H on q0.':'Measure q0 in Z, and flip q1 only on result 1.',labels,p),stateStep('Coherently controlled gate',reuse?'CNOT q0 into fresh q2, CNOT q2 into q1, then H on q0.':'Keep q0 unmeasured; apply CNOT.',deferred),distribution('Measure at the end','The final Z-basis distributions agree. The displayed Pauli expectation is a different possible measurement before the final readout, and can distinguish the coherent state from the early mixture.',labels,q,[row('Maximum probability gap',Math.max(...p.map((x,i)=>Math.abs(x-q[i])))),row(name+' expectation after early measurement',early),row(name+' expectation before deferred measurement',late),...(omitted?[row('q0 P(0), early measurement',p.slice(0,4).reduce((a,b)=>a+b,0)),row('q0 P(0), retained helper',probability(deferred,0,0)),row('q0 P(0), omit helper (incorrect alternative)',probability(omitted,0,0))]:[])])].map(step=>({...step,start}));
 }
};
