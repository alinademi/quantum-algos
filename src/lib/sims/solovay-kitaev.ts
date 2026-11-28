import { c, add,mul,conj,abs,matMul,RZ,RY,type Matrix } from '../quantum.ts';
import { choice,deg,eye,G,gate,sequence,ket,row,type Lab } from './gate-lab.ts';
// Phase-insensitive Frobenius distance of two 2×2 unitaries.
export const distance=(a:Matrix,b:Matrix)=>Math.sqrt(Math.max(0,4-2*abs(a.flat().reduce((s,x,i)=>add(s,mul(conj(x),b.flat()[i])),c(0)))));
export function search(target:Matrix,limit:number){
 let best={word:[] as string[],error:distance(eye(2),target)};
 function visit(m:Matrix,word:string[]){const e=distance(m,target);if(e<best.error)best={word:[...word],error:e};if(word.length===limit)return;for(const x of ['H','T','T†']){if((x==='H'&&word.at(-1)==='H')||(x==='T'&&word.at(-1)==='T†')||(x==='T†'&&word.at(-1)==='T'))continue;visit(matMul(G[x],m),[...word,x])}}
 visit(eye(2),[]);return best;
}
export const lab:Lab={
 controls:[choice('axis','Target rotation',['Z','Y']),choice('angle','Target angle (degrees)',['30','60','17','100']),choice('limit','Search up to gates',['4','6','8','10'])],
 run:v=>{const target=(v.axis==='Z'?RZ:RY)(deg(v.angle)),best=search(target,+v.limit),s=sequence(ket('+'),best.word.map(x=>gate(x)),'This is bounded word search, not the Solovay–Kitaev recursive algorithm.');s.at(-1)!.rows=[row('Best word',best.word.join(' ')||'Identity'),row('Best phase-insensitive Frobenius error',best.error),row('Gate budget',v.limit)];return s}
};
