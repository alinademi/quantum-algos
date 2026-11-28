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
