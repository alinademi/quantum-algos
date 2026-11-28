import { H,X,Z,RZ,RY,expi,mul } from '../quantum.ts';
import { choice,product,gate,cx,rotation,sequence,fullMatrix,matrixGap,row,op,control,type Lab,type Op } from './gate-lab.ts';
export const lab:Lab={
 controls:[choice('target','Build gate',['Hadamard','CZ','Phase π/4']),choice('a','q0',['+','0','1','+i']),choice('b','q1',['0','1','+'])],
 run:v=>{let ops:Op[],target:Op,phase=0;if(v.target==='Hadamard'){ops=[rotation('Z',180),rotation('Y',90)];target=gate('H');phase=Math.PI/2;}else if(v.target==='CZ'){ops=[gate('H',1),cx(0,1),gate('H',1)];target=op('CZ',control(Z),0,1);}else {ops=[rotation('Z',45)];target=gate('T');phase=Math.PI/8;}

 const st=sequence(product(v.a,v.b),ops,v.target==='CZ'?'H on the target before and after CNOT produces CZ.':v.target==='Hadamard'?'Two rotations produce H up to phase.':'RZ(45°) produces T up to global phase.');st.at(-1)!.rows=[row('Global-phase adjusted matrix error',matrixGap(fullMatrix(2,[target]),fullMatrix(2,ops).map(r=>r.map(x=>mul(expi(phase),x)))))];return st}
};
