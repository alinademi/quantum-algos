import { fromBloch } from '../quantum.ts';
import { choice, angles, deg, stateStep, row, type Lab } from './gate-lab.ts';
export const stderr=(p:number,n:number)=>Math.sqrt(p*(1-p)/n);
export const lab: Lab = {
  controls:[choice('angle','Preparation angle (degrees)',['90',...angles.filter(x=>x!=='90')])],
  run:v=>{const t=deg(v.angle),p=Math.sin(t/2)**2;return [stateStep('Prepared copies','Choose the number of shots and run repeatedly. The predicted standard error is for the observed fraction of ones.',fromBloch(t,0),[row('Probability of 1',p),...[100,1000,10000].map(n=>row('Standard error at '+n+' shots',stderr(p,n)))])]}
};
