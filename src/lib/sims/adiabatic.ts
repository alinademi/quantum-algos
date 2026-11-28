import { c,X,Z,add,scale,matVec,fromBloch,inner,abs2,type State,type Matrix } from '../quantum.ts';
import { choice,stateStep,row,phaseRotation,type Lab } from './gate-lab.ts';
// H(s) = −(1−s)X − sZ; ħ = 1. Midpoint products of exact constant-H evolutions.
export function evolution(time:number,steps=1000){
 let psi=fromBloch(Math.PI/2,0);const snapshots=[{s:0,psi}];
 for(let j=0;j<steps;j++){const s=(j+.5)/steps,x=1-s,z=s,r=Math.hypot(x,z),p=X.map((row,i)=>row.map((v,k)=>scale(add(scale(v,x),scale(Z[i][k],z)),1/r)));psi=matVec(phaseRotation(p,-r*time/steps),psi);if((j+1)%(steps/10)===0)snapshots.push({s:(j+1)/steps,psi})}
 return snapshots;
}
export const path=(time:number)=>evolution(time).map(({s,psi})=>({s,psi,gap:2*Math.hypot(1-s,s),ground:abs2(inner(fromBloch(Math.atan2(1-s,s),0),psi))}));
export const lab:Lab={
 controls:[choice('time','Total evolution time (ħ = 1)',['1','5','20','50','100'])],
 run:v=>path(+v.time).map(({s,psi,gap,ground})=>({...stateStep('s = '+s.toFixed(1),'Instantaneous ground state points along ((1−s),0,s). Midpoint integration (1000 steps).',psi,[row('Energy gap',gap),row('Ground-state probability',ground),row('Minimum gap',Math.SQRT2),row('Rough adiabatic time scale',Math.SQRT2/2)]),start:'|+⟩'}))
};

// H(s) = (2s−1) Z − g X. The minimum gap is 2g.
// Exact ground eigenstates point along (g, 0, 1−2s).
export const avoidedGround=(s:number,gap:number)=>fromBloch(Math.atan2(gap/2,1-2*s),0);
export function avoidedPath(time:number,gap:number,steps=Math.max(2000,Math.ceil(time*40/10)*10)){
 const g=gap/2;let psi=avoidedGround(0,gap);
 const result=[{s:0,psi,gap:2*Math.hypot(g,1),ground:1}];
 for(let j=0;j<steps;j++){
  const s=(j+.5)/steps,z=2*s-1,r=Math.hypot(g,z);
  const p=Z.map((row,i)=>row.map((v,k)=>scale(add(scale(v,z),scale(X[i][k],-g)),1/r)));
  psi=matVec(phaseRotation(p,r*time/steps),psi);
  if((j+1)%(steps/10)===0){
   const s=(j+1)/steps;
   result.push({s,psi,gap:2*Math.hypot(g,2*s-1),ground:abs2(inner(avoidedGround(s,gap),psi))});
  }
 }
 return result;
}
export const adiabaticScale=(gap:number)=>2/gap**2;
