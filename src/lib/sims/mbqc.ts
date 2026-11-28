import { Z, tensor, matVec,H,RZ,type State } from '../quantum.ts';
import { choice,ket,deg,op,control,apply,rotation,gate,branch,stateStep,distribution,row,fidelity,type Lab } from './gate-lab.ts';
// One-bit teleportation from an arbitrary input into an adjacent |+> site.
export function edge(input:State,angle:number){
 const s=tensor(input,ket('+')),ent=apply(s,op('CZ',control(Z),0,1)),read=apply(apply(ent,op('RZ(-angle)',RZ(-angle),0)),gate('H'));
 const branches=[0,1].map(k=>{const b=branch(read,0,k)!;return {p:b.p,output:b.state.slice(2*k,2*k+2)};});
 return {s,ent,read,branches};
}
export function chain(input:State,a:number,b:number,adaptive:boolean){
 const target=matVec(H,matVec(RZ(-b),matVec(H,matVec(RZ(-a),input))));
 return edge(input,a).branches.flatMap((first,m)=>{const angle=adaptive&&m?-b:b;return edge(first.output,angle).branches.map((second,k)=>{
  const extra=m&&!adaptive&&Math.abs(Math.abs(Math.sin(b))-1)<1e-12?1:0,frameK=k^extra;
  let corrected=second.output;if(frameK)corrected=apply(corrected,gate('X'));if(m)corrected=apply(corrected,gate('Z'));
  return {m,k,frameK,angle,p:first.p*second.p,raw:second.output,logical:corrected,fidelity:fidelity(corrected,target)};
 });});
}
export const lab:Lab={
 controls:[choice('input','Input',['+','0','1','+i','−']),choice('angle','First measurement angle (degrees)',['45','0','90','180']),choice('correct','Interpret Pauli correction',['Yes','No']),choice('mode','Cluster',['One edge','Two edges']),choice('beta','Second intended angle (degrees)',['45','90','0','180'],v=>v.mode==='Two edges'),choice('adapt','Adapt second angle?',['Yes','No'],v=>v.mode==='Two edges')],
 run:v=>{const a=deg(v.angle),input=ket(v.input),start='|'+v.input+'⟩ and '+(v.mode==='Two edges'?'two |+⟩ cluster helpers':'one |+⟩ cluster helper');
 if(v.mode==='Two edges'){const bs=chain(input,a,deg(v.beta),v.adapt==='Yes');return [{...distribution('Two measurements','Four outcome pairs, each with probability 1/4.',bs.map(b=>String(b.m)+b.k),bs.map(b=>b.p)),start},...bs.map(b=>({...stateStep('Results '+b.m+', '+b.k,'Second angle '+Math.round(b.angle*180/Math.PI)+'°. Pauli frame X^'+b.frameK+' Z^'+b.m+'. '+(v.adapt==='No'?'At Clifford angles 0°, 90° or 180°, a wrong sign can be absorbed into the Pauli frame. At 90° with first outcome 1, flip the X-frame bit.':''),v.correct==='Yes'?b.logical:b.raw,[row('Fidelity after interpreting Pauli frame',b.fidelity)]),start}))];}
 const {s,ent,read,branches}=edge(input,a),out=[stateStep('Start','Input on q0, |+⟩ on q1.',s),stateStep('Entangled edge','CZ builds the two-site cluster resource.',ent),stateStep('Rotate measurement basis','RZ(−α), H, then standard measurement on q0.',read),distribution('Measure q0','Result m is a random bit.',['0','1'],branches.map(b=>b.p))];branches.forEach((b,k)=>{let output=b.output;if(k&&v.correct==='Yes')output=apply(output,gate('X'));const target=matVec(H,matVec(RZ(-a),input));out.push(stateStep('If result '+k,'q1 carries H RZ(−α)|ψ⟩ up to an X byproduct and global phase.',output,[row('Fidelity to corrected target',fidelity(output,target))]))});return out.map(x=>({...x,start}));}
};
