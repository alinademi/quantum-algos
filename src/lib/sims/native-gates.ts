import { H, Z, mul, expi } from '../quantum.ts';
import { choice,product,gate,op,cx,control,rotation,sequence,fullMatrix,matrixGap,row,type Lab,type Op } from './gate-lab.ts';
import { family } from './two-qubit-gates.ts';
// A toy CZ basis: RZ, SX, CZ. No device calibration or hardware availability is assumed.
export const nativeH=(w:number)=>[rotation('Z',90,w),gate('SX',w),rotation('Z',90,w)];
export const nativeCX=(a:number,b:number)=>[...nativeH(b),op('CZ',control(Z),a,b),...nativeH(b)];
export const ecrCX=()=>[gate('X',0),op('ECR',family('ECR',0,0),0,1),rotation('Z',90,0),gate('SX',1)];
export const lab:Lab={
 controls:[choice('basis','Example native basis',['CZ','ECR']),choice('gate','Target',['H','X','CNOT']),choice('a','q0',['+','0','1']),choice('b','q1',['0','1','+'])],
 run:v=>{const ops=v.gate==='H'?nativeH(0):v.gate==='X'?[gate('SX'),gate('SX')]:v.basis==='ECR'?ecrCX():nativeCX(0,1);const target=v.gate==='CNOT'?cx(0,1):gate(v.gate);const phase=v.gate==='H'?Math.PI/4:v.gate==='CNOT'&&v.basis==='CZ'?Math.PI/2:0;const st=sequence(product(v.a,v.b),ops,'The target gate is expressed in the example RZ, SX, X, '+v.basis+' basis.');st.at(-1)!.rows=[row('Native operations',ops.length),row('Phase-adjusted max entry error',matrixGap(fullMatrix(2,[target]),fullMatrix(2,ops).map(r=>r.map(x=>mul(expi(phase),x)))))];return st}
};
