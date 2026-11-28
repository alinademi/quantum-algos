import { H,P,matMul } from '../quantum.ts';
import { choice,deg,gate,op,sequence,ket,fullMatrix,matrixGap,row,type Lab,type Op } from './gate-lab.ts';
export const lab:Lab={
 controls:[choice('rule','Rewrite',['Green fusion','Red fusion','H changes color']),choice('a','Phase α (degrees)',['45','90','180','0']),choice('b','Phase β (degrees)',['90','45','180','0']),choice('start','Input',['+','0','1','+i'])],
 run:v=>{const a=deg(v.a),b=deg(v.b),green=(t:number)=>op('Green spider '+Math.round(t/Math.PI*180)+'°',P(t),0),red=(t:number)=>op('Red spider '+Math.round(t/Math.PI*180)+'°',matMul(H,matMul(P(t),H)),0);const l=v.rule==='Green fusion'?[green(a),green(b)]:v.rule==='Red fusion'?[red(a),red(b)]:[gate('H'),green(a),gate('H')];const r=v.rule==='Green fusion'?[green(a+b)]:v.rule==='Red fusion'?[red(a+b)]:[red(a)];return [...sequence(ket(v.start),l),...sequence(ket(v.start),r).map(s=>({...s,title:'Rewrite: '+s.title})),{title:'Equality check',note:'For these one-input one-output spiders the matrices agree exactly up to numerical rounding.',rows:[row('Maximum matrix entry gap',matrixGap(fullMatrix(1,l),fullMatrix(1,r)))]}]}
};
