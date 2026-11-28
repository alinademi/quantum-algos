import { c,matMul,dagger,scale,type Matrix } from '../quantum.ts';
import { choice,details,row,gate,cx,fullMatrix,matrixGap,type Lab } from './gate-lab.ts';
import { pauli } from './pauli-strings.ts';
export const strings=['I','X','Y','Z'].flatMap(a=>['I','X','Y','Z'].map(b=>a+b));
export function conjugate(name:string,p:string):string{
 const u=fullMatrix(2,name==='CNOT'?[cx(0,1)]:[gate(name)]),r=matMul(u,matMul(pauli(p),dagger(u)));
 for(const s of strings)for(const sign of [1,-1])if(matrixGap(r,pauli(s).map(row=>row.map(x=>scale(x,sign))))<1e-9)return (sign===-1?'−':'')+s;
 return 'Not a signed Pauli string';
}
export const lab:Lab={
 controls:[choice('g','Conjugate by',['H','S','CNOT','T']),choice('p','Pauli input',strings.filter(x=>x!=='II').sort((a,b)=>(a==='XI'?-1:b==='XI'?1:a.localeCompare(b))))],
 run:v=>[details('Conjugation U P U†','Find the matching signed Pauli by multiplying the actual matrices.',[row('Input',v.p),row('Output',conjugate(v.g,v.p))]),details('Check every two-qubit Pauli','A Clifford maps every Pauli to a signed Pauli; T fails on X or Y.',strings.map(p=>row(p,conjugate(v.g,p))))]
};
