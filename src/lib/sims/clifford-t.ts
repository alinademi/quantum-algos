import { choice,ket,gate,sequence,row,type Lab } from './gate-lab.ts';
export const presets:Record<string,string[]>={'T² = S':['T','T'],'T⁴ = Z':['T','T','T','T'],'T⁸ = I':Array(8).fill('T'),'H T H':['H','T','H'],'T then T†':['T','T†']};
export const lab:Lab={
 controls:[choice('recipe','Circuit',Object.keys(presets)),choice('start','Input',['+','+i','0','1'])],
 run:v=>{const gs=presets[v.recipe],s=sequence(ket(v.start),gs.map(x=>gate(x)),'T changes a Clifford circuit into a potentially non-Clifford one; some repeated T sequences simplify.');s.at(-1)!.rows=[row('T count',gs.filter(x=>x==='T'||x==='T†').length),row('Other gates',gs.filter(x=>x!=='T'&&x!=='T†').length)];return s}
};
