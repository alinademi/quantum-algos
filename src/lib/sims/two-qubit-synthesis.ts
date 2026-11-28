import { c, X,Y,Z, kron,matMul,expi,mul } from '../quantum.ts';
import { choice,product,op,phaseRotation,sequence,gate,cx,rotation,SWAP,control,fullMatrix,matrixGap,row,type Lab,type Op } from './gate-lab.ts';
export const cartan=(a:number,b:number,d:number)=>matMul(phaseRotation(kron(X,X),a),matMul(phaseRotation(kron(Y,Y),b),phaseRotation(kron(Z,Z),d)));
export const lab:Lab={
 controls:[choice('family','Canonical example',['SWAP (3 CNOTs)','ZZ rotation (2 CNOTs)','CNOT (1 CNOT)','Local only (0 CNOTs)']),choice('start','Start q0',['0','1','+','+i']),choice('b','Start q1',['1','0','+'])],
 run:v=>{const sw=v.family.startsWith('SWAP'),zz=v.family.startsWith('ZZ'),cxcase=v.family.startsWith('CNOT');let ops:Op[],target:Op,phase=0;if(sw){ops=[cx(0,1),cx(1,0),cx(0,1)];target=op('SWAP canonical',cartan(Math.PI/4,Math.PI/4,Math.PI/4),0,1);phase=-Math.PI/4;}else if(zz){ops=[cx(0,1),rotation('Z',60,1),cx(0,1)];target=op('ZZ canonical',cartan(0,0,Math.PI/6),0,1);}else if(cxcase){ops=[cx(0,1)];target=cx(0,1);}else{ops=[gate('H'),gate('T',1)];target=op('H tensor T',fullMatrix(2,ops),0,1);}
 const s=sequence(product(v.start,v.b),ops,'This is the exact circuit for a selected family, not an arbitrary-unitary KAK solver.');s.at(-1)!.rows=[row('CNOT count',ops.filter(x=>x.name==='CNOT').length),row('Phase-adjusted matrix gap',matrixGap(fullMatrix(2,[target]),fullMatrix(2,ops).map(r=>r.map(x=>mul(expi(phase),x)))))];return s}
};
