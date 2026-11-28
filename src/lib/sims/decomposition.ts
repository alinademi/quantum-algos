import { c, abs2, conj, scale, matMul, dagger, type Matrix } from '../quantum.ts';
import { choice, product, rotation, cx, gate, eye, op, sequence, fullMatrix, matrixGap, row, type Lab, type Op } from './gate-lab.ts';
// Complex Givens QR: eliminate every entry below the diagonal by mixing two rows.
export function twoLevel(u:Matrix):Op[]{
 let m=u.map(r=>r.slice());const gs:Op[]=[];const n=u.length;
 for(let j=0;j<n;j++)for(let i=n-1;i>j;i--){const a=m[i-1][j],b=m[i][j];if(abs2(b)<1e-24)continue;const r=Math.sqrt(abs2(a)+abs2(b)),g=eye(n);
  g[i-1][i-1]=scale(conj(a),1/r);g[i-1][i]=scale(conj(b),1/r);g[i][i-1]=scale(b,-1/r);g[i][i]=scale(a,1/r);
  m=matMul(g,m);gs.push(op('Two-level '+(i-1)+' ↔ '+i,g,0,1));
 }
 const diagonal=m.map((r,i)=>r.map((a,j)=>i===j?a:c(0)));
 return [op('Diagonal phases',diagonal,0,1),...gs.reverse().map(g=>({...g,matrix:dagger(g.matrix)}))];
}
export const lab:Lab={
 controls:[choice('example','Target unitary',['H, CNOT, RZ','Rotations and CNOT','SWAP']),choice('a','Start q0',['0','1','+','+i']),choice('b','Start q1',['0','1','+'])],
 run:v=>{const ops=v.example==='SWAP'?[cx(0,1),cx(1,0),cx(0,1)]:v.example==='H, CNOT, RZ'?[gate('H'),cx(0,1),rotation('Z',45,1)]:[rotation('Y',60),rotation('X',90,1),cx(0,1),rotation('Z',30)];const u=fullMatrix(2,ops),dec=twoLevel(u),s=sequence(product(v.a,v.b),dec,'The row eliminations are inverted to reconstruct the target unitary.');s.at(-1)!.rows=[row('Two-level factors',dec.length-1),row('Reconstruction error (all entries)',matrixGap(u,fullMatrix(2,dec)))];return s}
};
