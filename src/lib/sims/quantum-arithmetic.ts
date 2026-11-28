import { X,P,probs } from '../quantum.ts';
import { choice,bits,bstate,product,probability,ccx,cx,swap,control,op,sequence,row,permutation,gate,inverse,type Lab,type Op } from './gate-lab.ts';
// |a1 a0 0 b1 b0>: add a into the three-bit accumulator, preserving a.
export const addOps=[op('Carry into high bit',control(X,3),1,3,4,2),ccx(1,4,3),cx(1,4),ccx(0,3,2),cx(0,3)];
// QFT convention F|b> = sum_y exp(2πiby/8)|y>/sqrt(8).
const cp=(a:number,b:number,t:number)=>op('CP('+Math.round(t*180/Math.PI)+'°)',control(P(t)),a,b);
export const qftOps=[gate('H',2),cp(3,2,Math.PI/2),cp(4,2,Math.PI/4),gate('H',3),cp(4,3,Math.PI/2),gate('H',4),swap(2,4)];
const phases=[0,1].flatMap(a=>[2,3,4].flatMap(b=>{
 const turn=(2**(1-a)*2**(4-b))%8;
 return turn?[cp(a,b,Math.PI*turn/4)]:[];
}));
export const fourierAddOps=[...qftOps,...phases,...inverse(qftOps)];
export const compareGate=op('XOR less-than flag',permutation(32,i=>i^(((i>>3)<((i>>1)&3))?1:0)),0,1,2,3,4);
// A < B iff high bits are 0,1, or their high bits agree and low bits are 0,1.
const onPattern=(wires:number[],pattern:string,target:number):Op[]=>{
 const opens=wires.flatMap((w,i)=>pattern[i]==='0'?[gate('X',w)]:[]);
 return [...opens,op('Controlled X ('+pattern+')',control(X,wires.length),...wires,target),...inverse(opens)];
};
export const compareOps=[...onPattern([0,2],'01',4),...onPattern([0,2,1,3],'0001',4),...onPattern([0,2,1,3],'1101',4)];
// Cuccaro ripple carry: |a1 a0 b1 b0 cin cout>, cin is restored, cout XORs carry.
const maj=(c:number,b:number,a:number)=>[cx(a,b),cx(a,c),ccx(c,b,a)];
const uma=(c:number,b:number,a:number)=>[ccx(c,b,a),cx(a,c),cx(c,b)];
export const cuccaroOps=[...maj(4,3,1),...maj(1,2,0),cx(0,5),...uma(1,2,0),...uma(4,3,1)];
export const lab:Lab={
 controls:[choice('a','A (two bits)',['11','00','01','10','+1','0+']),choice('b','B (two bits)',['01','00','10','11']),choice('mode','Task',['Add with Cuccaro','Add with carry','Add with QFT','Compare A < B'])],
 run:v=>{
 const b=parseInt(v.b,2),cuccaro=v.mode==='Add with Cuccaro',compare=v.mode==='Compare A < B',start=product(...(cuccaro?v.a+v.b+'00':compare?v.a+v.b+'0':v.a+'0'+v.b));
 const s=sequence(start,cuccaro?cuccaroOps:compare?compareOps:v.mode==='Add with QFT'?fourierAddOps:addOps,cuccaro?'Read sum q5 q2 q3 (carry-out then two sum bits); q0 q1 preserve A and q4 returns to 0.':compare?'The flag is q4; both inputs are preserved.':'The rightmost three bits contain the sum; A is unchanged.');
 const state=s.at(-1)!.state!,n=Math.log2(state.length),wires=cuccaro?[5,2,3]:compare?[4]:[2,3,4],actual=Array(2**wires.length).fill(0),expected=actual.slice();
 probs(state).forEach((p,i)=>{const result=wires.reduce((j,w)=>2*j+((i>>(n-1-w))&1),0);actual[result]+=p;});
 probs(product(...v.a)).forEach((p,a)=>{expected[compare?+(a<b):a+b]+=p;});
 const bitsOf=(i:number)=>i.toString(2).padStart(wires.length,'0');
 s.at(-1)!.rows=[row('Read result wires',wires.map(w=>'q'+w).join(' ')),...actual.flatMap((p,i)=>p>1e-12||expected[i]>1e-12?[row('P(result '+bitsOf(i)+')',p),row('Arithmetic prediction '+bitsOf(i),expected[i])]:[]),row('Output probability gap',Math.max(...actual.map((p,i)=>Math.abs(p-expected[i])))),...(cuccaro?[row('Helper q4 P(0)',probability(state,4,0))]:[])];
 return s;
 }
};
