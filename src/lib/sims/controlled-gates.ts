import { P, X, Y, Z, scale } from '../quantum.ts';
import { choice, product, cx, gate, op, control, deg, sequence, fullMatrix, matrixGap, matrixRows, apply, probability, rotation, row, type Lab, type Op } from './gate-lab.ts';
import { u as singleU } from './single-qubit-unitary.ts';
// For U=e^{i gamma} RZ(phi) RY(theta) RZ(lambda). B and A appear in time order.
const phaseGate=(t:number,w:number)=>op('P('+ +(t*180/Math.PI).toFixed(9)+'°)',P(t),w);
export function controlledEuler(theta:number,phi:number,lambda:number,gamma:number,on:number,controlWire=0,targetWire=1):Op[]{
 const rz=(a:number)=>rotation('Z',+(a*180/Math.PI).toFixed(12),targetWire);
 const ry=(a:number)=>rotation('Y',+(a*180/Math.PI).toFixed(12),targetWire);
 const base=[rz((lambda-phi)/2),cx(controlWire,targetWire),rz(-(phi+lambda)/2),ry(-theta/2),cx(controlWire,targetWire),ry(theta/2),rz(phi),phaseGate(gamma,controlWire)];
 return on?base:[gate('X',controlWire),...base,gate('X',controlWire)];
}
export function implementation(name:string,theta:number,on:number,phi=0,lambda=0):Op[]{
 if(name==='C(U)')return controlledEuler(theta,phi,lambda,(phi+lambda)/2,on);
 const base=name==='CX'?[cx(0,1)]:name==='C(−X)'?[cx(0,1),gate('Z',0)]:name==='CZ'?[gate('H',1),cx(0,1),gate('H',1)]:name==='CY'?[gate('S†',1),cx(0,1),gate('S',1)]:[phaseGate(theta/2,0),phaseGate(theta/2,1),cx(0,1),phaseGate(-theta/2,1),cx(0,1)];
 return on?[...base]:[gate('X',0),...base,gate('X',0)];
}
export const lab:Lab={
 controls:[choice('a','Control',['+','0','1']),choice('b','Target',['0','1','+','−']),choice('name','Controlled gate',['CX','CY','CZ','CP','C(−X)','C(U)']),choice('angle','CP angle or U theta (degrees)',['90','45','180','0'],v=>v.name==='CP'||v.name==='C(U)'),choice('phi','U phi (degrees)',['45','0','90'],v=>v.name==='C(U)'),choice('lambda','U lambda (degrees)',['60','0','180'],v=>v.name==='C(U)'),choice('on','Activate on',['1','0'])],
 run:v=>{const t=deg(v.angle),phi=deg(v.phi),lambda=deg(v.lambda),on=+v.on,u=({CX:X,CY:Y,CZ:Z,CP:P(t),'C(−X)':X.map(r=>r.map(z=>scale(z,-1))),'C(U)':singleU(t,phi,lambda)})[v.name]!;const ops=implementation(v.name,t,on,phi,lambda);const s=sequence(product(v.a,v.b),ops,'Decomposed controlled gate. The final row predicts the control odds if H is applied before measurement.');s.at(-1)!.rows=[row('Direct vs decomposition matrix gap',matrixGap(fullMatrix(2,ops),control(u,1,on))),...matrixRows(control(u,1,on)).map(r=>({...r,label:'Direct '+r.label.toLowerCase()})),...matrixRows(fullMatrix(2,ops)).map(r=>({...r,label:'Built '+r.label.toLowerCase()})),row('Control P(1) if H then measurement',probability(apply(s.at(-1)!.state!,gate('H',0)),0))];return s;}
};
