import { X,P } from '../quantum.ts';
import { choice,bits,bstate,ccx,cx,swap,control,op,sequence,row,permutation,gate,inverse,type Lab,type Op } from './gate-lab.ts';
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
export const lab:Lab={
 controls:[choice('a','A (two bits)',bits(2)),choice('b','B (two bits)',bits(2)),choice('mode','Task',['Add with carry','Add with QFT','Compare A < B'])],
 run:v=>{const a=parseInt(v.a,2),b=parseInt(v.b,2),s=v.mode!=='Compare A < B'?sequence(bstate(v.a+'0'+v.b),v.mode==='Add with QFT'?fourierAddOps:addOps,'The rightmost three bits contain the exact sum; A is unchanged.'):sequence(bstate(v.a+v.b+'0'),compareOps,'Each mutually exclusive comparison condition flips the flag; both input registers are preserved.');s.at(-1)!.rows=[row('Classical check',v.mode!=='Compare A < B'?(a+b).toString(2).padStart(3,'0'):String(+(a<b)))];return s}
};
