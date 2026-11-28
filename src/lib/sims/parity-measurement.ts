import { inner } from '../quantum.ts';
import { choice, product, apply,cx, branch, gate, sequence,stateStep, distribution,row,type Lab } from './gate-lab.ts';
const xx=(s:NonNullable<ReturnType<typeof branch>>['state'])=>inner(s,apply(apply(s,gate('X',0)),gate('X',1))).re;
export const lab:Lab={
 controls:[choice('a','Data q0',['+','0','1','−']),choice('b','Data q1',['+','0','1','−'])],
 run:v=>{
  const s=product(v.a,v.b,'0'),steps=sequence(s,[cx(0,2),cx(1,2)],'The helper records XOR, not either data value.'),t=steps.at(-1)!.state!,branches=[0,1].map(i=>branch(t,2,i));
  const read=distribution('Measure helper','0 means even parity; 1 means odd. Measuring both data bits separately would give the same parity odds.', ['Even (+1)','Odd (−1)'],branches.map(b=>b?.p??0));
  return [...steps,read,...branches.flatMap((b,i)=>b?[stateStep('Conditional state: '+(i?'odd':'even'),'The data may retain coherence inside the chosen parity subspace. XX is a separate possible measurement; it would be zero if the individual Z values had both been recorded.',b.state,[row('Branch probability',b.p),row('XX expectation, measure parity only',xx(b.state)),row('XX expectation, measure both Z values',[0,1].reduce((sum,z)=>{const fine=branch(b.state,0,z);return sum+(fine?fine.p*xx(fine.state):0)},0))])]:[])].map(step=>({...step,start:'|'+v.a+'⟩ |'+v.b+'⟩ |0⟩'}));
 }
};
