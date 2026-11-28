import { choice,product,sequence,phaseRotation,gate,cx,rotation,inverse,fullMatrix,deg,matrixGap,row,type Op,type Lab } from './gate-lab.ts';
import { pauli } from './pauli-strings.ts';
export function ladder(p:string,theta:number):Op[]{
 const active=[...p].flatMap((x,i)=>x==='I'?[]:[i]);
 if(!active.length)throw Error('choose nonidentity string');
 const before=[...p].flatMap((x,i)=>x==='X'?[gate('H',i)]:x==='Y'?[gate('S†',i),gate('H',i)]:[]);
 const target=active.at(-1)!;
 const parity=active.slice(0,-1).map(i=>cx(i,target));
 return [...before,...parity,rotation('Z',2*theta*180/Math.PI,target),...inverse(parity),...inverse(before)];
}
export const lab:Lab={
 controls:[choice('p','Pauli string',['XYZ','ZZZ','XIX','YZI','IZX','ZII']),choice('theta','θ in exp(−iθP), degrees',['45','30','90','180','0'])],
 run:v=>{const t=deg(v.theta),ops=ladder(v.p,t),s=sequence(product('+','0','1'),ops,'Each basis change and parity computation is undone.');s.at(-1)!.rows=[row('Full matrix vs exp(−iθP)',matrixGap(fullMatrix(3,ops),phaseRotation(pauli(v.p),t)))];return s}
};
