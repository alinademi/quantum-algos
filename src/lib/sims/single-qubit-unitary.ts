import { c, expi, mul, scale, matMul, RZ, RY, type Matrix } from '../quantum.ts';
import { choice, kets, ket, deg, angles, rotation, sequence, matrixGap, row, type Lab } from './gate-lab.ts';
export function u(theta:number,phi:number,lambda:number):Matrix{
  return [[c(Math.cos(theta/2)),scale(expi(lambda),-Math.sin(theta/2))],[scale(expi(phi),Math.sin(theta/2)),scale(expi(phi+lambda),Math.cos(theta/2))]];
}
export const euler = (theta:number,phi:number,lambda:number) => matMul(RZ(phi),matMul(RY(theta),RZ(lambda)));
export const lab: Lab = {
  controls:[choice('start','Start state',kets),choice('theta','θ (degrees)',['90',...angles.filter(x=>x!=='90')]),choice('phi','φ (degrees)',['45',...angles.filter(x=>x!=='45')]),choice('lambda','λ (degrees)',angles)],
  run:v=>{const a=deg(v.theta),b=deg(v.phi),d=deg(v.lambda);const s=sequence(ket(v.start),[rotation('Z',v.lambda),rotation('Y',v.theta),rotation('Z',v.phi)],'Read rightmost matrix first: the Euler form equals U up to global phase.');s.at(-1)!.rows?.push(row('U vs phase-adjusted Euler (max entry error)',matrixGap(u(a,b,d),euler(a,b,d).map(r=>r.map(x=>mul(expi((b+d)/2),x))))));return s;}
};
