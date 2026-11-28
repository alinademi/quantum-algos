import { X,P,inner,matVec,abs } from '../quantum.ts';
import { choice,product,ket,op,gate,control,deg,sequence,probability,row,type Lab } from './gate-lab.ts';
export const lab:Lab={
 controls:[choice('mode','Controlled gate',['X','P']),choice('eigen','Target state',['−','+','0','1']),choice('angle','P angle (degrees)',['90','45','180','0'],v=>v.mode==='P')],
 run:v=>{
  const u=v.mode==='X'?X:P(deg(v.angle)),target=ket(v.eigen),overlap=inner(target,matVec(u,target));
  const eigen=Math.abs(abs(overlap)-1)<1e-12,phi=Math.atan2(overlap.im,overlap.re);
  const steps=sequence(product('+',v.eigen),[op('Controlled '+v.mode,control(u),0,1),gate('H')],eigen?'H converts the kicked-back relative phase into measurement odds.':'The target is not an eigenstate: the control alone is mixed after the controlled gate.');
  steps[1].rows?.push(row('Target eigenstate?',eigen?'Yes':'No'),row('Control before H',eigen?'(|0⟩ + exp(iφ)|1⟩)/√2; φ = '+(phi*180/Math.PI).toFixed(0)+'°':'Mixed; no single control ket'));
  steps[2].rows?.push(row('Target eigenstate?',eigen?'Yes':'No'),row(eigen?'p(control = 1) = sin²(φ/2)':'p(control = 1) = (1 − Re⟨u|U|u⟩)/2',probability(steps[2].state!,0)));
  return steps;
 }
};
