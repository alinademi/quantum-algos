import { c, abs2, conj, scale, matMul, dagger, mul, sub, expi, P, abs, type Matrix } from '../quantum.ts';
import { choice, bits, product, rotation, cx, gate, eye, op, sequence, fullMatrix, matrixGap, row, inverse, type Lab, type Op } from './gate-lab.ts';
// Complex Givens QR: eliminate every entry below the diagonal by mixing two rows.
export function twoLevel(u:Matrix):Op[]{
 let m=u.map(r=>r.slice());const gs:Op[]=[];const n=u.length;
 for(let j=0;j<n;j++)for(let i=n-1;i>j;i--){const a=m[i-1][j],b=m[i][j];if(abs2(b)<1e-24)continue;const r=Math.sqrt(abs2(a)+abs2(b)),g=eye(n);
  g[i-1][i-1]=scale(conj(a),1/r);g[i-1][i]=scale(conj(b),1/r);g[i][i-1]=scale(b,-1/r);g[i][i]=scale(a,1/r);
  m=matMul(g,m);gs.push(op('Two-level |'+(i-1).toString(2).padStart(Math.log2(n),'0')+'⟩ ↔ |'+i.toString(2).padStart(Math.log2(n),'0')+'⟩',g,0,1));
 }
 const diagonal=m.map((r,i)=>r.map((a,j)=>i===j?a:c(0)));
 return [op('Diagonal phases',diagonal,0,1),...gs.reverse().map(g=>({...g,matrix:dagger(g.matrix)}))];
}
import { controlledEuler, implementation } from './controlled-gates.ts';
const phase=(a:{re:number;im:number})=>Math.atan2(a.im,a.re);
// Only the 4x4 lab uses this elementary decomposition.
export function elementary(factors:Op[]):Op[]{
 const d=factors[0].matrix.map((r,i)=>phase(r[i])), g=d[0];
 const p=(t:number,w:number)=>op('P('+ +(t*180/Math.PI).toFixed(8)+'°)',P(t),w);
 const result=[p(g,0),gate('X'),p(g,0),gate('X'),p(d[2]-g,0),p(d[1]-g,1),...implementation('CP',d[3]-d[2]-d[1]+g,1)];
 for(const f of factors.slice(1)){
  const m=f.matrix,changed=m.map((r,i)=>r.some((z,j)=>abs(sub(z,c(+(i===j))))>1e-12)?i:-1).filter(i=>i>=0);
  if(changed.length===0)continue;
  if(changed.length!==2)throw Error('expected a two-level factor');
  const [a,b]=changed,u=changed.map(i=>changed.map(j=>m[i][j]));
  const gamma=phase(sub(mul(u[0][0],u[1][1]),mul(u[0][1],u[1][0])))/2;
  const v=u.map(r=>r.map(z=>mul(expi(-gamma),z))), alpha=phase(v[0][0]), beta=phase(v[1][0]);
  const theta=2*Math.atan2(abs(v[1][0]),abs(v[0][0])),diff=a^b;
  const map:Op[]=[...(a&2?[gate('X',0)]:[]),...(a&1?[gate('X',1)]:[]),...(diff===3?[cx(0,1)]:[])];
  const target=diff===1?1:0;
  result.push(...map,...controlledEuler(theta,beta-alpha,-beta-alpha,gamma,0,1-target,target),...inverse(map));
 }
 return result;
}
export const parameterBound=(n:number)=>(4**n-1)/15;
export const lab:Lab={
 controls:[choice('example','Target unitary',['H, CNOT, RZ','Rotations and CNOT','SWAP']),choice('mode','Factor size',['Elementary gates','Two-level factors']),choice('a','Start q0',['0','1','+','+i']),choice('b','Start q1',['0','1','+'])],
 run:v=>{const ops=v.example==='SWAP'?[cx(0,1),cx(1,0),cx(0,1)]:v.example==='H, CNOT, RZ'?[gate('H'),cx(0,1),rotation('Z',45,1)]:[rotation('Y',60),rotation('X',90,1),cx(0,1),rotation('Z',30)];const u=fullMatrix(2,ops),dec=twoLevel(u),small=elementary(dec),chosen=v.mode==='Elementary gates'?small:dec,s=sequence(product(v.a,v.b),chosen,'The target is reconstructed from the selected factorization.');s.at(-1)!.rows=[row('Two-level factors',dec.length-1),row('Elementary gate count',small.length),...([2,4,8,12].map(n=>row('Generic exact gate lower bound, '+n+' qubits',Math.ceil(parameterBound(n))))),row('Reconstruction error (all entries)',matrixGap(u,fullMatrix(2,chosen)))];return s}
};
