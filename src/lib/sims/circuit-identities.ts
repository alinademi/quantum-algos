import { Z, X, H } from '../quantum.ts';
import { choice, product, gate,cx,control,op,sequence,fullMatrix,matrixGap,row,type Lab,type Op } from './gate-lab.ts';
export function circuits(name:string):[Op[],Op[]]{
 if(name==='HXH')return [[gate('H'),gate('X'),gate('H')],[gate('Z')]];
 if(name==='Reverse CNOT')return [[gate('H',0),gate('H',1),cx(0,1),gate('H',0),gate('H',1)],[cx(1,0)]];
 if(name==='CZ symmetry')return [[op('CZ',control(Z),0,1)],[op('CZ',control(Z),1,0)]];
 return [[cx(0,1),cx(0,1)],[]];
}
export const lab:Lab={
 controls:[choice('identity','Identity',['HXH','Reverse CNOT','CZ symmetry','Cancel CNOTs']),choice('a','q0',['+i','0','1','+']),choice('b','q1',['0','1','+','−'])],
 run:v=>{const [a,b]=circuits(v.identity),s=sequence(product(v.a,v.b),a,'Left-hand circuit.');const t=sequence(product(v.a,v.b),b,'Right-hand circuit.');return [...s,...t.map(x=>({...x,title:'Right: '+x.title})),{title:'Compare all inputs',note:'The entire matrices agree, not only the selected input.',rows:[row('Maximum entry difference',matrixGap(fullMatrix(2,a),fullMatrix(2,b)))]}]}
};
