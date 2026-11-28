import { c, expi, scale, kron, abs,mul,sub, X,Y,Z, dagger, type Matrix } from '../quantum.ts';
import { choice, bits, bstate, product, op, phaseRotation, sequence, inverse, SWAP, deg, eye, row, type Lab } from './gate-lab.ts';
export function family(name:string,t:number,p:number):Matrix {
 if(name==='iSWAP')return [[c(1),c(0),c(0),c(0)],[c(0),c(0),c(0,1),c(0)],[c(0),c(0,1),c(0),c(0)],[c(0),c(0),c(0),c(1)]];
 if(name==='√SWAP')return eye(4).map((r,i)=>r.map((x,j)=>({re:(x.re+SWAP[i][j].re)/2,im:(x.re-SWAP[i][j].re)/2})));
 if(name==='fSim')return [[c(1),c(0),c(0),c(0)],[c(0),c(Math.cos(t)),c(0,-Math.sin(t)),c(0)],[c(0),c(0,-Math.sin(t)),c(Math.cos(t)),c(0)],[c(0),c(0),c(0),expi(-p)]];
 if(name==='ECR')return [[c(0),c(0),c(1),c(0,1)],[c(0),c(0),c(0,1),c(1)],[c(1),c(0,-1),c(0),c(0)],[c(0,-1),c(1),c(0),c(0)]].map(r=>r.map(x=>scale(x,Math.SQRT1_2)));
 return phaseRotation(kron(name==='RZZ'?Z:X,name==='RZZ'?Z:X),t/2);
}
export const lab:Lab={
 controls:[choice('name','Gate family',['iSWAP','√SWAP','RXX','RZZ','MS (XX convention)','fSim','ECR']),choice('start','Start state',['01','++','00','10','11']),choice('theta','θ (degrees, for rotations and fSim)',['90','45','180','0'],v=>['RXX','RZZ','MS (XX convention)','fSim'].includes(v.name)),choice('phi','φ (degrees, fSim only)',['45','0','90','180'],v=>v.name==='fSim')],
 run:v=>{const g=op(v.name,family(v.name,deg(v.theta),deg(v.phi)),0,1);return sequence(v.start==='++'?product('+','+'):bstate(v.start),[g,...inverse([g])],'The exact adjoint restores the input; hardware errors are not simulated.').map(s=>{const [a,b,c,d]=s.state!;return {...s,rows:[...(s.rows??[]),row('Concurrence (0 product, 1 maximal)',2*abs(sub(mul(a,d),mul(b,c))))]};})}
};
