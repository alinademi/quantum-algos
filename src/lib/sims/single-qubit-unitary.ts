import { c, expi, mul, scale, matMul, RZ, RY, type Matrix } from '../quantum.ts';
import { choice, kets, ket, deg, angles, rotation, sequence, matrixGap, matrixRows, complex, row, type Lab } from './gate-lab.ts';
export function u(theta:number,phi:number,lambda:number):Matrix{
  return [[c(Math.cos(theta/2)),scale(expi(lambda),-Math.sin(theta/2))],[scale(expi(phi),Math.sin(theta/2)),scale(expi(phi+lambda),Math.cos(theta/2))]];
}
export const euler = (theta:number,phi:number,lambda:number) => matMul(RZ(phi),matMul(RY(theta),RZ(lambda)));
export const lab: Lab = {
  controls:[choice('start','Start state',kets),choice('preset','Target preset',['Custom angles','Hadamard','X','Z']),choice('theta','θ (degrees)',['90',...angles.filter(x=>x!=='90')],v=>v.preset==='Custom angles'),choice('phi','φ (degrees)',['45',...angles.filter(x=>x!=='45')],v=>v.preset==='Custom angles'),choice('lambda','λ (degrees)',angles,v=>v.preset==='Custom angles')],
  run:v=>{const presets:Record<string,[string,string,string]>={Hadamard:['90','0','180'],X:['180','0','180'],Z:['0','0','180']};const [theta,phi,lambda]=presets[v.preset]??[v.theta,v.phi,v.lambda];const a=deg(theta),b=deg(phi),d=deg(lambda);const s=sequence(ket(v.start),[rotation('Z',lambda),rotation('Y',theta),rotation('Z',phi)],'Read rightmost matrix first: the Euler form equals U up to global phase.');s.at(-1)!.rows?.push(...matrixRows(u(a,b,d)).map(r=>({...r,label:'U '+r.label.toLowerCase()})),...matrixRows(euler(a,b,d)).map(r=>({...r,label:'Euler '+r.label.toLowerCase()})),row('Global phase relating U and Euler',complex(expi((b+d)/2))),row('Difference before phase correction',matrixGap(u(a,b,d),euler(a,b,d))),row('U vs phase-adjusted Euler (max entry error)',matrixGap(u(a,b,d),euler(a,b,d).map(r=>r.map(x=>mul(expi((b+d)/2),x))))));return s;}
};
