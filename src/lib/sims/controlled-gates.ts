import { P, X, Y, Z, scale } from '../quantum.ts';
import { choice, product, cx, gate, op, control, deg, sequence, fullMatrix, matrixGap, apply, probability, row, type Lab, type Op } from './gate-lab.ts';
export function implementation(name:string,theta:number,on:number):Op[]{
 const base=name==='CX'?[cx(0,1)]:name==='C(−X)'?[cx(0,1),gate('Z',0)]:name==='CZ'?[gate('H',1),cx(0,1),gate('H',1)]:name==='CY'?[gate('S†',1),cx(0,1),gate('S',1)]:[op('P(φ/2)',P(theta/2),0),op('P(φ/2)',P(theta/2),1),cx(0,1),op('P(−φ/2)',P(-theta/2),1),cx(0,1)];
 return on?[...base]:[gate('X',0),...base,gate('X',0)];
}
export const lab:Lab={
 controls:[choice('a','Control',['+','0','1']),choice('b','Target',['0','1','+','−']),choice('name','Controlled gate',['CX','CY','CZ','CP','C(−X)']),choice('angle','CP angle (degrees)',['90','45','180'],v=>v.name==='CP'),choice('on','Activate on',['1','0'])],
 run:v=>{const t=deg(v.angle),on=+v.on,u=({CX:X,CY:Y,CZ:Z,CP:P(t),'C(−X)':X.map(r=>r.map(z=>scale(z,-1)))})[v.name]!;const ops=implementation(v.name,t,on);const s=sequence(product(v.a,v.b),ops,'Decomposed controlled gate. The final row predicts the control odds if H is applied before measurement.');s.at(-1)!.rows=[row('Direct vs decomposition matrix gap',matrixGap(fullMatrix(2,ops),control(u,1,on))),row('Control P(1) if H then measurement',probability(apply(s.at(-1)!.state!,gate('H',0)),0))];return s;}
};
