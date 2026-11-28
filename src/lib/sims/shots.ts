import { fromBloch, sample } from '../quantum.ts';
import { choice, angles, deg, stateStep, row, type Lab } from './gate-lab.ts';
export const stderr=(p:number,n:number)=>Math.sqrt(p*(1-p)/n);
export const lab: Lab = {
  controls:[choice('angle','RY angle from |0⟩ (degrees)',['90',...angles.filter(x=>x!=='90')])],
  run:v=>{const t=deg(v.angle),p=Math.sin(t/2)**2;return [stateStep('Prepared copies','Each shot: start at |0⟩, RY(θ), measure. The predicted standard error is for the fraction of ones.',fromBloch(t,0),[row('Probability of 1',p),...[100,1000,10000].map(n=>row('Standard error at '+n+' shots',stderr(p,n)))])]}
};

export const shotSizes=[100,400,1600,6400];
export function shotStudy(angle:number,rand:()=>number,batches=64){
 const p=Math.sin(deg(angle)/2)**2;
 return shotSizes.map(n=>{
  const counts=Array.from({length:batches},()=>sample([1-p,p],n,rand)[1]);
  return {n,p,ones:counts[0],error:Math.sqrt(counts.reduce((sum,k)=>sum+(k/n-p)**2,0)/batches),predicted:stderr(p,n),batches};
 });
}
