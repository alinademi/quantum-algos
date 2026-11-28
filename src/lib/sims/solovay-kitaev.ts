import { c, add, mul, conj, abs, sub, scale, expi, type Matrix } from '../quantum.ts';


// Stable phase-insensitive Frobenius distance. Align the global phase before
// subtracting, rather than subtracting two nearly equal squared norms.
export function distance(a: Matrix, b: Matrix): number {
  const af = a.flat(), bf = b.flat();
  const overlap = af.reduce((s,x,i) => add(s,mul(conj(x),bf[i])),c(0));
  const phase = abs(overlap) ? scale(conj(overlap),1/abs(overlap)) : c(1);
  return Math.hypot(...af.map((x,i)=>abs(sub(x,mul(phase,bf[i])))));
}

type Rotor = [number,number,number,number]; // w I - i (x X + y Y + z Z)
type Node = { q: Rotor; parent: number; gate: number; length: number };
const roots: Rotor[] = [[0,Math.SQRT1_2,0,Math.SQRT1_2],[Math.cos(Math.PI/8),0,0,Math.sin(Math.PI/8)],[Math.cos(Math.PI/8),0,0,-Math.sin(Math.PI/8)]];
const names = ['H','T','T†'];
const nodes: Node[] = [{q:[1,0,0,0],parent:-1,gate:-1,length:0}];
const seen = new Set(['1000000000,0,0,0']);
let head=0;
function multiply([a,b,c,d]:Rotor,[w,x,y,z]:Rotor):Rotor {
  return [a*w-b*x-c*y-d*z,a*x+b*w+c*z-d*y,a*y-b*z+c*w+d*x,a*z+b*y-c*x+d*w];
}
// q and -q denote the same gate up to global phase. Round only for the
// deduplication key; distance and subsequent products retain full precision.
function canonical(q:Rotor): string {
  const k=q.map(x=>Math.round(x*1e9));
  const sign=(k.find(x=>x!==0)??1)<0?-1:1;
  return k.map(x=>sign*x).join(',');
}
function extend(limit:number) {
  while(head<nodes.length&&nodes[head].length<limit){
    const n=nodes[head];
    for(let g=0;g<roots.length;g++){
      const q=multiply(roots[g],n.q), key=canonical(q);
      if(seen.has(key))continue;
      seen.add(key);nodes.push({q,parent:head,gate:g,length:n.length+1});
    }
    head++;
  }
}
function rotor(target:Matrix):Rotor {
  const det=sub(mul(target[0][0],target[1][1]),mul(target[0][1],target[1][0]));
  const lift=expi(-Math.atan2(det.im,det.re)/2);
  const a=mul(lift,target[0][0]),b=mul(lift,target[0][1]);
  return [a.re,-b.im,-b.re,-a.im];
}
function rotorDistance(a:Rotor,b:Rotor):number {
  const dot=a[0]*b[0]+a[1]*b[1]+a[2]*b[2]+a[3]*b[3];
  const s=dot<0?-1:1;
  return Math.SQRT2*Math.hypot(a[0]-s*b[0],a[1]-s*b[1],a[2]-s*b[2],a[3]-s*b[3]);
}
export const budgets=[4,8,12,16,20,24,28];
export function search(target:Matrix,limit:number){
  if(!Number.isInteger(limit)||limit<0||limit>28) throw new Error('Search budget must be an integer from 0 to 28.');
  extend(limit);
  const targetQ=rotor(target);
  let index=0,error=rotorDistance(nodes[0].q,targetQ);
  for(let i=1;i<nodes.length&&nodes[i].length<=limit;i++){
    const e=rotorDistance(nodes[i].q,targetQ);
    if(e<error-1e-12){index=i;error=e;}
  }
  const word:string[]=[];
  for(let at=index;nodes[at].parent>=0;at=nodes[at].parent)word.unshift(names[nodes[at].gate]);
  return {word,error};
}
export function convergence(target:Matrix,limit=28) {
  return budgets.filter(n=>n<=limit).map(length=>({length,...search(target,length)}));
}
