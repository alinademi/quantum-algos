import { c,expi,scale,add,H,P,X,matMul,type Matrix } from '../quantum.ts';
import { choice,deg,gate,op,sequence,ket,fullMatrix,matrixGap,row,product,control,type Lab } from './gate-lab.ts';
// Independently define the X-basis projectors, not H P H.
export const red=(t:number):Matrix=>[[c(.5),c(.5)],[c(.5),c(.5)]].map((r,i)=>r.map((v,j)=>add(v,scale(expi(t),i===j?.5:-.5))));
export const greenCopy:Matrix=[[c(1),c(0)],[c(0),c(0)],[c(0),c(0)],[c(0),c(1)]];
// X spider |+><++| + |-><--|. Input indices are connector bit then target bit.
export const redMerge:Matrix=Array.from({length:2},(_,i)=>Array.from({length:4},(_,j)=>c((1+(-1)**(i+(j>>1)+(j&1)))/(2*Math.SQRT2))));
export function spiderCX():Matrix{return Array.from({length:4},(_,output)=>Array.from({length:4},(_,input)=>{
 let sum=c(0);
 for(let link=0;link<2;link++)sum=add(sum,scale(redMerge[output&1][2*link+(input&1)],greenCopy[2*(output>>1)+link][input>>1].re));
 return scale(sum,Math.SQRT2);
}));}
export const lab:Lab={
 controls:[choice('rule','Rewrite',['Green fusion','Red fusion','H changes color','CNOT as spiders','Fuse through CNOT']),choice('a','Phase α (degrees)',['45','90','180','0']),choice('b','Phase β (degrees)',['90','45','180','0']),choice('start','Input',['+','0','1','+i'])],
 run:v=>{if(v.rule==='Fuse through CNOT'){const {left,right,gap}=controlFusion(deg(v.a),deg(v.b)),start=product(v.start,'0');return [...sequence(start,left),...sequence(start,right).map(s=>({...s,title:'Rewrite: '+s.title})),{title:'Equality check',start:'|'+v.start+'⟩ |0⟩',note:'Two Z phases on the control fuse through the CNOT Z spider.',rows:[row('Matrix gap',gap)]}];}if(v.rule==='CNOT as spiders'){const s=sequence(product(v.start,'0'),[op('Normalized Z-copy / X-merge',spiderCX(),0,1)],'The multi-leg spider contraction gives CNOT after scalar normalization.');s.at(-1)!.rows?.push(row('Matrix gap to independent CNOT',matrixGap(spiderCX(),control(X))));return s;}
 const a=deg(v.a),b=deg(v.b),green=(t:number)=>op('Z spider '+Math.round(t/Math.PI*180)+'°',P(t),0),r=(t:number)=>op('X spider '+Math.round(t/Math.PI*180)+'°',red(t),0);const l=v.rule==='Green fusion'?[green(a),green(b)]:v.rule==='Red fusion'?[r(a),r(b)]:[gate('H'),green(a),gate('H')];const right=v.rule==='Green fusion'?[green(a+b)]:v.rule==='Red fusion'?[r(a+b)]:[r(a)];return [...sequence(ket(v.start),l),...sequence(ket(v.start),right).map(s=>({...s,title:'Rewrite: '+s.title})),{title:'Equality check',start:'|'+v.start+'⟩',note:'For these one-input one-output spiders the matrices agree exactly up to numerical rounding.',rows:[row('Maximum matrix entry gap',matrixGap(fullMatrix(1,l),fullMatrix(1,right)))]}]}
};

// Phase labels on a Z spider commute through its control branch.
export function controlFusion(a:number,b:number){
 const cx=op('CNOT',spiderCX(),0,1);
 const name=(t:number)=>'Z spider '+Math.round(t*180/Math.PI)+'°';
 const left=[op(name(a),P(a),0),cx,op(name(b),P(b),0)];
 const right=[cx,op(name(a+b),P(a+b),0)];
 return {left,right,gap:matrixGap(fullMatrix(2,left),fullMatrix(2,right))};
}
