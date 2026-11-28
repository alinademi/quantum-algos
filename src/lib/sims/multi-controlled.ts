import { X, P } from '../quantum.ts';
import { choice, product, op, control, ccx, cx, gate, inverse, sequence, row, type Lab, type Op } from './gate-lab.ts';
// Exact no-scratch construction via the parity expansion of AND:
// 2^(m-1) AND(bits) = sum of (-1)^(|S|-1) XOR(bits in S), over nonempty subsets.
export function noScratch(controls:number[],target:number):Op[]{
 const wires=[...controls,target],m=wires.length,ops:Op[]=[gate('H',target)];
 for(let mask=1;mask<2**m;mask++){
  const active=wires.filter((_,i)=>mask&(1<<i)),last=active.at(-1)!;
  const parity=active.slice(0,-1).map(w=>cx(w,last));
  const angle=(active.length%2?1:-1)*Math.PI/2**(m-1);
  ops.push(...parity,op('P('+angle/Math.PI+'π)',P(angle),last),...inverse(parity));
 }
 return [...ops,gate('H',target)];
}
export const lab:Lab={
 controls:[choice('count','Number of controls',['3','2','4']),choice('mode','Implementation',['Clean scratch','No scratch (phase ladder)','Direct gate']),choice('pattern','Control preparation',['All 1','First 0','First +']),choice('target','Target',['0','1'])],
 run:v=>{const n=+v.count,a=Array(n).fill('1');if(v.pattern!=='All 1')a[0]=v.pattern==='First 0'?'0':'+';const direct=op('Multi-controlled X',control(X,n),...Array.from({length:n+1},(_,i)=>i));if(v.mode==='Direct gate')return sequence(product(...a,v.target),[direct],'This is an abstract gate, not a native-gate cost.');if(v.mode==='No scratch (phase ladder)'){const ops=noScratch(Array.from({length:n},(_,i)=>i),n),s=sequence(product(...a,v.target),ops,'The subset parity phases implement a multi-controlled Z, conjugated by H on the target. No extra wires are used.');s.at(-1)!.rows=[row('Scratch qubits',0),row('CNOT count',ops.filter(o=>o.name.startsWith('CNOT')).length),row('Phase gates',2**(n+1)-1)];return s;}const start=product(...a,v.target,...Array(n-2).fill('0'));const compute=n>2?[ccx(0,1,n+1),...Array.from({length:n-3},(_,i)=>ccx(n+1+i,2+i,n+2+i))]:[];const use=n===2?ccx(0,1,2):ccx(2*n-2,n-1,n);const ops=[...compute,use,...compute.slice().reverse()];const s=sequence(start,ops,'Every scratch wire returns to 0.');s.at(-1)!.rows=[row('Clean scratch qubits',n-2),row('Toffoli count',2*n-3)];return s}
};
