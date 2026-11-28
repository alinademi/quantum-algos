import { abs,sub,mul,matMul,dagger,scale } from '../quantum.ts';
import { choice,details,row,gate,cx,fullMatrix,matrixGap,matrixRows,product,sequence,type Lab } from './gate-lab.ts';
import { pauli } from './pauli-strings.ts';
export const strings=['I','X','Y','Z'].flatMap(a=>['I','X','Y','Z'].map(b=>a+b));
const ops=(name:string)=>name==='Bell preparation'?[gate('H'),cx(0,1)]:name==='CNOT'?[cx(0,1)]:[gate(name)];
export function conjugatedMatrix(name:string,p:string){const u=fullMatrix(2,ops(name));return matMul(u,matMul(pauli(p),dagger(u)));}
export function conjugate(name:string,p:string):string{
 const r=conjugatedMatrix(name,p);
 for(const s of strings)for(const sign of [1,-1])if(matrixGap(r,pauli(s).map(row=>row.map(x=>scale(x,sign))))<1e-9)return (sign===-1?'−':'')+s;
 return 'Not a signed Pauli string';
}
export const lab:Lab={
 controls:[choice('g','Conjugate by',['Bell preparation','H','S','CNOT','T']),choice('start','Start q0',['0','+']),choice('p','Pauli input',strings.filter(x=>x!=='II').sort((a,b)=>(a==='XI'?-1:b==='XI'?1:a.localeCompare(b))))],
 run:v=>{const steps=sequence(product(v.start??'0','0'),ops(v.g),v.g==='T'?'T is outside the Clifford group. Choose X or Y on q0 to see the failed Pauli mapping.':'A Clifford circuit may create entanglement.');const [a,b,c,d]=steps.at(-1)!.state!;steps.at(-1)!.rows=[row('Concurrence',2*abs(sub(mul(a,d),mul(b,c))))];return [...steps,details('Conjugation U P U†','Find the matching signed Pauli by multiplying the actual matrices.',[row('Input',v.p),row('Output',conjugate(v.g,v.p)),...matrixRows(conjugatedMatrix(v.g,v.p))]),details('Check every two-qubit Pauli','A Clifford maps every Pauli to a signed Pauli; T fails on X or Y.',strings.map(p=>row(p,conjugate(v.g,p))))]}
};
