import { Z, mul, expi } from '../quantum.ts';
import { choice,product,complex,deg,gate,op,cx,control,rotation,sequence,fullMatrix,matrixGap,row,type Lab,type Op } from './gate-lab.ts';
import { family } from './two-qubit-gates.ts';
// A toy CZ basis: RZ, SX, CZ. No device calibration or hardware availability is assumed.
export const nativeH=(w:number)=>[rotation('Z',90,w),gate('SX',w),rotation('Z',90,w)];
export const nativeCX=(a:number,b:number)=>[...nativeH(b),op('CZ',control(Z),a,b),...nativeH(b)];
export const ecrCX=()=>[gate('X',0),op('ECR',family('ECR',0,0),0,1),rotation('Z',90,0),gate('SX',1)];
import { u } from './single-qubit-unitary.ts';
export const nativeU=(theta:number,phi:number,lambda:number,w=0)=>[rotation('Z',lambda,w),gate('SX',w),rotation('Z',theta+180,w),gate('SX',w),rotation('Z',phi+180,w)];
export const lab:Lab={
 controls:[choice('basis','Example native basis',['CZ','ECR']),choice('gate','Target',['CNOT','General U','H','X']),choice('theta','U θ (degrees)',['90','0','45','180'],v=>v.gate==='General U'),choice('phi','U φ (degrees)',['45','0','90'],v=>v.gate==='General U'),choice('lambda','U λ (degrees)',['60','0','180'],v=>v.gate==='General U'),choice('a','q0',['+','0','1']),choice('b','q1',['0','1','+'])],
 run:v=>{const theta=+(v.theta??90),phi=+(v.phi??45),lambda=+(v.lambda??60),ops=v.gate==='General U'?nativeU(theta,phi,lambda):v.gate==='H'?nativeH(0):v.gate==='X'?(v.basis==='ECR'?[gate('X')]:[gate('SX'),gate('SX')]):v.basis==='ECR'?ecrCX():nativeCX(0,1);const target=v.gate==='General U'?op('U',u(deg(theta),deg(phi),deg(lambda)),0):v.gate==='CNOT'?cx(0,1):gate(v.gate);const phase=v.gate==='General U'?deg(90+(phi+lambda)/2):v.gate==='H'?Math.PI/4:v.gate==='CNOT'&&v.basis==='CZ'?Math.PI/2:0;const st=sequence(product(v.a,v.b),ops,'The target gate is expressed in the example '+(v.basis==='ECR'?'RZ, SX, X, ECR':'RZ, SX, CZ')+' basis.');st.at(-1)!.rows=[row('Native operations',ops.length),row('Phase applied to native matrix',complex(expi(phase))),row('Phase-adjusted max entry error',matrixGap(fullMatrix(2,[target]),fullMatrix(2,ops).map(r=>r.map(x=>mul(expi(phase),x)))))];return st}
};
