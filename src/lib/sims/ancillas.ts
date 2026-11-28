import { c,add,abs2,conj,mul,type State,X } from '../quantum.ts';
import { choice,product,ccx,cx,gate,apply,sequence,control,op,fidelity,row,ket,type Lab } from './gate-lab.ts';
export const borrowedOps=[ccx(0,1,3),ccx(3,2,4),ccx(0,1,3),ccx(3,2,4)];
// Overlap of the reduced borrowed register with its original pure state.
// In the Bell case the borrowed register is q3 AND the untouched reference q5.
export function borrowedOverlap(s:State,helper:State,wires:number[]){
 const n=Math.log2(s.length),masks=wires.map(w=>1<<(n-w-1)),mask=masks.reduce((a,b)=>a|b,0);
 let overlap=0;
 for(let i=0;i<s.length;i++)if(!(i&mask)){
  let z=c(0);
  for(let j=0;j<helper.length;j++){
   const at=masks.reduce((k,m,l)=>k|((j&(1<<(wires.length-l-1)))?m:0),i);
   z=add(z,mul(conj(helper[j]),s[at]));
  }
  overlap+=abs2(z);
 }
 return overlap;
}
export const lab:Lab={
 controls:[choice('scratch','Borrowed q3 start',['0','1','+','+i','Bell pair with q5']),choice('data','First control q0',['+','0','1']),choice('b','Second control q1',['1','0','+']),choice('c','Third control q2',['1','0','+']),choice('target','Target q4',['0','1']),choice('mode','Protocol',['Compute and uncompute','Omit final operation'])],
 run:v=>{
  const bell=v.scratch==='Bell pair with q5',scratch=bell?'0':v.scratch;
  let start=product(v.data,v.b??'1',v.c??'1',scratch,v.target,...(bell?['0']:[]));
  if(bell)start=apply(apply(start,gate('H',3)),cx(3,5));
  const helper=bell?[c(Math.SQRT1_2),c(0),c(0),c(Math.SQRT1_2)]:ket(scratch);
  const target=apply(start,op('Ideal CCCX',control(X,3),0,1,2,4));
  const label='|'+v.data+'⟩|'+(v.b??'1')+'⟩|'+(v.c??'1')+'⟩, target |'+v.target+'⟩, borrowed q3 '+(bell?'in Bell pair with q5':'|'+scratch+'⟩');
  const steps=sequence(start,v.mode==='Compute and uncompute'?borrowedOps:borrowedOps.slice(0,3),v.mode==='Compute and uncompute'?'The triple-controlled flip is correct and the borrowed register is restored.':'The missing correction leaves the target dependent on the borrowed value or its correlations.',label);
  steps.forEach(step=>{step.rows=[...(step.rows??[]),row('Borrowed register overlap with original',borrowedOverlap(step.state!,helper,bell?[3,5]:[3])),row('Whole-state fidelity to ideal CCCX',fidelity(step.state!,target))]});
  return steps;
 }
};
