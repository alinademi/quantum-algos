import { c, mul, matMul, dagger, scale, matVec, inner, type State } from '../quantum.ts';
import { choice,product,gate,cx,sequence,matrixGap,fullMatrix,op,apply,fidelity,row,type Op,type Lab } from './gate-lab.ts';
import { pauli } from './pauli-strings.ts';
export type Signed = { sign: number; p: string };
// Conjugate just the affected letters by the gate matrix. Cache this finite local truth table.
const cache=new Map<string,Signed>();
export function conjugate(s:Signed,o:Op):Signed{
 const local=o.wires.map(w=>s.p[w]).join(''),key=o.name+':'+local;
 let found=cache.get(key);
 if(!found){
  const m=matMul(o.matrix,matMul(pauli(local),dagger(o.matrix))),opts=o.wires.length===1?['I','X','Y','Z']:['I','X','Y','Z'].flatMap(x=>['I','X','Y','Z'].map(y=>x+y));
  for(const p of opts)for(const sign of [1,-1])if(matrixGap(m,pauli(p).map(r=>r.map(x=>scale(x,sign))))<1e-9)found={sign,p};
  if(!found)throw Error('not a Clifford conjugation');cache.set(key,found);
 }
 const letters=[...s.p];o.wires.forEach((w,j)=>letters[w]=found!.p[j]);return {sign:s.sign*found.sign,p:letters.join('')};
}
export const zeroGenerators=(n:number):Signed[]=>Array.from({length:n},(_,i)=>({sign:1,p:'I'.repeat(i)+'Z'+'I'.repeat(n-i-1)}));
export const evolveGenerators=(n:number,ops:Op[])=>ops.reduce((ss,o)=>ss.map(s=>conjugate(s,o)),zeroGenerators(n));
export const format=(s:Signed)=>(s.sign<0?'−':'+')+s.p;
export const prep=(n:number,mode:string):Op[]=>mode==='GHZ'?[gate('H'),...Array.from({length:n-1},(_,i)=>cx(i,i+1))]:mode==='Product plus'?Array.from({length:n},(_,i)=>gate('H',i)):[gate('X'),gate('H',1),gate('S',1)];
export const lab:Lab={
 controls:[choice('mode','State',['GHZ','Product plus','Signed example'])],
 run:v=>{const n=3,ops=prep(n,v.mode),s=sequence(product('0','0','0'),ops,'The generators uniquely specify this pure stabilizer state.');s.forEach((step,i)=>{const gen=evolveGenerators(n,ops.slice(0,i));step.rows=gen.map(g=>row(format(g),'Signed expectation: '+inner(step.state!,apply(step.state!,op(format(g),pauli(g.p).map(r=>r.map(x=>scale(x,g.sign))),0,1,2))).re.toFixed(6)))});return s}
};
