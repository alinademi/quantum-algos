import { kron,matMul,scale } from '../quantum.ts';
import { G,choice,product,sequence,op,row,matrixGap,matrixRows, fidelity, runOps, type Lab } from './gate-lab.ts';
export const pauli=(s:string)=>[...s].map(x=>G[x]).reduce(kron);
export const antiCount=(a:string,b:string)=>[...a].filter((x,i)=>x!=='I'&&b[i]!=='I'&&x!==b[i]).length;
export const lab:Lab={
 controls:[choice('a','String P',['XZI','XXI','XYZ','ZII','YYI','IZZ','ZZI','III']),choice('b','String Q',['ZXI','ZZI','ZII','XXI','YYI','III','XYI','XYZ'])],
 run:v=>{
  const p=pauli(v.a),q=pauli(v.b),start=product('+','0','1'),first=op(v.a,p,0,1,2),second=op(v.b,q,0,1,2),s=sequence(start,[first,second],'Q follows P, so the resulting matrix is QP. The alternative order may differ by an invisible global sign.');
  const count=antiCount(v.a,v.b),sign=count%2?-1:1;
  s.at(-1)!.rows=[row('Sites with local minus sign',[...v.a].map((x,i)=>x!=='I'&&v.b[i]!=='I'&&x!==v.b[i]?'q'+i:'').filter(Boolean).join(', ')||'None'),row('Anticommuting site count',count),row('Relation',sign===-1?'PQ = −QP':'PQ = QP'),row('PQ vs QP difference before phase correction',matrixGap(matMul(p,q),matMul(q,p))),row('Output overlap with reversed order',fidelity(s.at(-1)!.state!,runOps(start,[second,first]))),row('Matrix check',matrixGap(matMul(p,q),matMul(q,p).map(r=>r.map(z=>scale(z,sign))))),...matrixRows(matMul(p,q)).map(r=>({...r,label:'PQ '+r.label.toLowerCase()})),...matrixRows(matMul(q,p)).map(r=>({...r,label:'QP '+r.label.toLowerCase()}))];
  return s;
 }
};
