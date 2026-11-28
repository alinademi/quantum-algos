import { X } from '../quantum.ts';
import { choice,bits,bstate,ccx,cx,control,op,sequence,row,permutation,gate,inverse,type Lab,type Op } from './gate-lab.ts';
// |a1 a0 0 b1 b0>: add a into the three-bit accumulator, preserving a.
export const addOps=[op('Carry into high bit',control(X,3),1,3,4,2),ccx(1,4,3),cx(1,4),ccx(0,3,2),cx(0,3)];
export const compareGate=op('XOR less-than flag',permutation(32,i=>i^(((i>>3)<((i>>1)&3))?1:0)),0,1,2,3,4);
// A < B iff high bits are 0,1, or their high bits agree and low bits are 0,1.
const onPattern=(wires:number[],pattern:string,target:number):Op[]=>{
 const opens=wires.flatMap((w,i)=>pattern[i]==='0'?[gate('X',w)]:[]);
 return [...opens,op('Controlled X ('+pattern+')',control(X,wires.length),...wires,target),...inverse(opens)];
};
export const compareOps=[...onPattern([0,2],'01',4),...onPattern([0,2,1,3],'0001',4),...onPattern([0,2,1,3],'1101',4)];
export const lab:Lab={
 controls:[choice('a','A (two bits)',bits(2)),choice('b','B (two bits)',bits(2)),choice('mode','Task',['Add with carry','Compare A < B'])],
 run:v=>{const a=parseInt(v.a,2),b=parseInt(v.b,2),s=v.mode==='Add with carry'?sequence(bstate(v.a+'0'+v.b),addOps,'The rightmost three bits contain the exact sum; A is unchanged.'):sequence(bstate(v.a+v.b+'0'),compareOps,'Each mutually exclusive comparison condition flips the flag; both input registers are preserved.');s.at(-1)!.rows=[row('Classical check',v.mode==='Add with carry'?(a+b).toString(2).padStart(3,'0'):String(+(a<b)))];return s}
};
