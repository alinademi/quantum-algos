import { Z, abs, sub } from '../quantum.ts';
import { choice, product, gate,cx,control,op,sequence,fullMatrix,matrixGap,matrixRows,fidelity,apply,probability,row,type Lab,type Op } from './gate-lab.ts';
export function circuits(name:string):[Op[],Op[]]{
 if(name==='Z vs I')return [[gate('Z')],[]];
 if(name==='HXH')return [[gate('H'),gate('X'),gate('H')],[gate('Z')]];
 if(name==='Reverse CNOT')return [[gate('H',0),gate('H',1),cx(0,1),gate('H',0),gate('H',1)],[cx(1,0)]];
 if(name==='CZ symmetry')return [[op('CZ',control(Z),0,1)],[op('CZ',control(Z),1,0)]];
 return [[cx(0,1),cx(0,1)],[]];
}
export const lab:Lab={
 controls:[choice('identity','Identity',['HXH','Reverse CNOT','CZ symmetry','Cancel CNOTs','Z vs I']),choice('a','q0',['0','+','1','+i']),choice('b','q1',['0','1','+','−'])],
 run:v=>{const [a,b]=circuits(v.identity),s=sequence(product(v.a,v.b),a,'Left-hand circuit.');const t=sequence(product(v.a,v.b),b,'Right-hand circuit.'),l=s.at(-1)!.state!,r=t.at(-1)!.state!;return [...s,...t.map(x=>({...x,title:'Right: '+x.title})),{title:'Compare all inputs',note:v.identity==='Z vs I'?'Z and I agree exactly on |0⟩ and only up to a global phase on |1⟩. On |+⟩, H then measurement distinguishes them.':'The entire matrices agree, not only the selected input.',rows:[row('Left gate count',a.length),row('Right gate count',b.length),row('Selected input: squared state overlap',fidelity(l,r)),row('Selected input: max amplitude difference',Math.max(...l.map((z,i)=>abs(sub(z,r[i]))))),row('Left P(q0=1) after H',probability(apply(l,gate('H')),0)),row('Right P(q0=1) after H',probability(apply(r,gate('H')),0)),row(v.identity==='Z vs I'?'Counterexample difference':'Maximum entry difference',matrixGap(fullMatrix(2,a),fullMatrix(2,b))),...matrixRows(fullMatrix(2,a)).map(r=>({...r,label:'Left '+r.label})),...matrixRows(fullMatrix(2,b)).map(r=>({...r,label:'Right '+r.label}))]}]}
};
