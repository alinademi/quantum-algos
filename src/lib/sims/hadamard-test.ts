import { X,Z,P,inner,matVec } from '../quantum.ts';
import { choice, product, ket, gate, op, control, deg, sequence, distribution, probability, row,type Lab } from './gate-lab.ts';
export const lab:Lab={
 controls:[choice('state','Data state',['+','+i','0','1','−']),choice('unitary','U',['P','X','Z']),choice('angle','P angle (degrees)',['90','45','180','0']),choice('part','Estimate',['Real','Imaginary'])],
 run:v=>{const u=v.unitary==='P'?P(deg(v.angle)):v.unitary==='X'?X:Z;const exp=inner(ket(v.state),matVec(u,ket(v.state)));const ops=[gate('H'),op('Controlled U',control(u),0,1),...(v.part==='Imaginary'?[gate('S†')]:[]),gate('H')];const s=sequence(product('0',v.state),ops,'Read only the helper q0. +1 for 0 and −1 for 1.');const z=1-2*probability(s.at(-1)!.state!,0);s.push({...distribution('Measure only helper q0','Each shot estimates one binary value: 0 is +1 and 1 is −1.', ['0','1'],[(1+z)/2,(1-z)/2],[row('Helper expectation',z),row('Direct inner product component',v.part==='Real'?exp.re:exp.im)]),start:'|0⟩ |'+v.state+'⟩'});return s}
};
