import { c } from '../quantum.ts';
import { choice, product, permutation, eye, op, sequence, row, type Lab } from './gate-lab.ts';
export const funcs=['zero','one','identity','NOT','AND','XOR'];
export const f=(name:string,x:number):number=>name==='zero'?0:name==='one'?1:name==='identity'?(x&1):name==='NOT'?(1^(x&1)):name==='AND'?(+(x===3)):((x>>1)^(x&1));
export const bitOracle=(name:string,n=2)=>permutation(2**(n+1),i=>(i&~1)|((i&1)^f(name,i>>1)));
export const phaseOracle=(name:string,n=2)=>eye(2**n).map((r,i)=>r.map(x=>c(x.re*(f(name,i)?-1:1))));
export const lab:Lab={
 controls:[choice('f','Boolean function',funcs),choice('input','Input',['++','00','01','10','11']),choice('type','Oracle',['Bit flip (target 0)','Bit flip (target −)','Phase flip'])],
 run:v=>{const input=[...v.input];const bit=v.type!=='Phase flip';return sequence(product(...input,...(bit?[v.type.includes('−')?'−':'0']:[])),[op(v.type,bit?bitOracle(v.f):phaseOracle(v.f),...Array.from({length:bit?3:2},(_,i)=>i))],'The oracle is reversible; with |−⟩ as target the bit oracle gives the phase oracle on the input.')}
};
