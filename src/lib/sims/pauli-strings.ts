import { kron,matMul,scale } from '../quantum.ts';
import { G,choice,product,sequence,op,row,matrixGap,eye, type Lab } from './gate-lab.ts';
export const pauli=(s:string)=>[...s].map(x=>G[x]).reduce(kron);
export const antiCount=(a:string,b:string)=>[...a].filter((x,i)=>x!=='I'&&b[i]!=='I'&&x!==b[i]).length;
export const lab:Lab={
 controls:[choice('a','String P',['XZ','XX','XY','ZI','YY','IZ','ZZ']),choice('b','String Q',['ZX','ZI','ZZ','XX','YY','II','XY'])],
 run:v=>{
  const p=pauli(v.a),q=pauli(v.b),s=sequence(product('+','0'),[op(v.a,p,0,1),op(v.b,q,0,1)],'Q follows P on the selected state.');
  const count=antiCount(v.a,v.b),sign=count%2?-1:1;
  s.at(-1)!.rows=[row('Anticommuting site count',count),row('Relation',sign===-1?'PQ = −QP':'PQ = QP'),row('Matrix check',matrixGap(matMul(p,q),matMul(q,p).map(r=>r.map(z=>scale(z,sign)))))];
  return s;
 }
};
