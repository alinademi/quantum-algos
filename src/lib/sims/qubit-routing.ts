import { choice,product,swap,cx,sequence,fullMatrix,matrixGap,row,type Op,type Lab } from './gate-lab.ts';
export function route(a:number,b:number):Op[]{
 const moves:Op[]=[];let at=a;while(Math.abs(at-b)>1){const next=at+Math.sign(b-at);moves.push(swap(at,next));at=next;}
 return [...moves,cx(at,b),...moves.slice().reverse()];
}
export const lab:Lab={
 controls:[choice('pair','Logical CNOT on a line 0–1–2–3',['0→3','3→0','0→2','1→2','2→0']),choice('start','q0 input',['1','+','0'])],
 run:v=>{const [a,b]=v.pair.split('→').map(Number),ops=route(a,b),s=sequence(product(v.start,'0','1','0'),ops,'The reverse SWAPs restore the original logical layout.');s.at(-1)!.rows=[row('SWAPs',ops.length-1),row('CNOTs if each SWAP costs 3',3*(ops.length-1)+1),row('Full matrix gap',matrixGap(fullMatrix(4,ops),fullMatrix(4,[cx(a,b)])))];return s}
};
