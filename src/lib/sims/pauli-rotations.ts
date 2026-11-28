import { abs2, add, conj, mul, c, type State } from '../quantum.ts';
import { choice,product,sequence,phaseRotation,gate,cx,rotation,inverse,fullMatrix,deg,matrixGap,row,type Op,type Lab } from './gate-lab.ts';
import { pauli } from './pauli-strings.ts';
export function ladder(p:string,theta:number):Op[]{
 const active=[...p].flatMap((x,i)=>x==='I'?[]:[i]);
 if(!active.length)throw Error('choose nonidentity string');
 const before=[...p].flatMap((x,i)=>x==='X'?[gate('H',i)]:x==='Y'?[gate('S†',i),gate('H',i)]:[]);
 const target=active.at(-1)!;
 const parity=active.slice(0,-1).map(i=>cx(i,target));
 return [...before,...parity,rotation('Z',+(2*theta*180/Math.PI).toFixed(9),target),...parity.slice().reverse(),...[...p].flatMap((x,i)=>x==='X'?[gate('H',i)]:x==='Y'?[gate('H',i),gate('S',i)]:[])];
}
// Purity of a one-qubit marginal for an n-qubit pure state.
export function wirePurity(s:State,wire:number){
 const mask=1<<(Math.log2(s.length)-1-wire);
 let p0=0,p1=0,off=c(0);
 for(let i=0;i<s.length;i++)if(!(i&mask)){
  p0+=abs2(s[i]);p1+=abs2(s[i|mask]);
  off=add(off,mul(s[i],conj(s[i|mask])));
 }
 return p0*p0+p1*p1+2*abs2(off);
}
export const lab:Lab={
 controls:[choice('p','Pauli string',['ZZZ','XYZ','XIX','YZI','IZX','ZII']),choice('start','Start state',['+++','+01','000','111','+0+']),choice('theta','θ in exp(−iθP), degrees',['45','30','90','180','0'])],
 run:v=>{const t=deg(v.theta),ops=ladder(v.p,t),s=sequence(product(...v.start),ops,'Each basis change and parity computation is undone.');s.forEach(step=>{const purities=[0,1,2].map(i=>wirePurity(step.state!,i));step.rows=[...(step.rows??[]),...purities.map((p,i)=>row('Purity of q'+i,p)),row('Entangled? (pure joint state)',purities.some(p=>p<1-1e-9)?'Yes':'No')];});s.at(-1)!.rows!.push(row('Full matrix vs exp(−iθP)',matrixGap(fullMatrix(3,ops),phaseRotation(pauli(v.p),t))));return s}
};
