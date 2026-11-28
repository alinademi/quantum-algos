import { bloch } from '../quantum.ts';
import { choice,ket,gate,sequence,row,type Lab } from './gate-lab.ts';
export const presets:Record<string,string[]>={'T':['T'],'T² = S':['T','T'],'T⁴ = Z':['T','T','T','T'],'T⁸ = I':Array(8).fill('T'),'H T H':['H','T','H'],'T then T†':['T','T†']};
export function mergedTCount(gs:string[]){let count=0,power=0;for(const g of [...gs,'end']){if(g==='T'||g==='T†')power+=g==='T'?1:-1;else {count+=Math.abs(power%2);power=0;}}return count;}
export const lab:Lab={
 controls:[choice('recipe','Circuit',Object.keys(presets)),choice('start','Input',['+','+i','0','1'])],
 run:v=>{const gs=presets[v.recipe],s=sequence(ket(v.start),gs.map(x=>gate(x)),'T changes a Clifford circuit into a potentially non-Clifford one; some repeated T sequences simplify.');s.forEach(step=>{const coords=bloch(step.state!);step.rows=[...(step.rows??[]),row('Bloch (x, y, z)',coords.map(x=>x.toFixed(3)).join(', ')),row('One of the six pure stabilizer states?',coords.some(x=>Math.abs(x)>1-1e-9)?'Yes':'No')];});s.at(-1)!.rows!.push(row('T symbols',gs.filter(x=>x==='T'||x==='T†').length),row('T count after adjacent merging',mergedTCount(gs)),row('Other gates',gs.filter(x=>x!=='T'&&x!=='T†').length));return s}
};
