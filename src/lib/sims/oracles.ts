import { c } from '../quantum.ts';
import { Z } from '../quantum.ts';
import { choice, product, permutation, eye, op, sequence, row, gate, cx, ccx, control, fullMatrix, matrixGap, type Op, type Lab } from './gate-lab.ts';
export const funcs=['zero','one','copy x1','NOT x1','AND','XOR'];
export const f=(name:string,x:number):number=>name==='zero'?0:name==='one'?1:name==='copy x1'?(x&1):name==='NOT x1'?(1^(x&1)):name==='AND'?(+(x===3)):((x>>1)^(x&1));
export const bitOracle=(name:string,n=2)=>permutation(2**(n+1),i=>(i&~1)|((i&1)^f(name,i>>1)));
export const phaseOracle=(name:string,n=2)=>eye(2**n).map((r,i)=>r.map(x=>c(x.re*(f(name,i)?-1:1))));
export function oracleOps(name:string,bit:boolean):Op[]{
 if(bit){
  if(name==='zero')return [];
  if(name==='one')return [gate('X',2)];
  if(name==='copy x1')return [cx(1,2)];
  if(name==='NOT x1')return [gate('X',2),cx(1,2)];
  if(name==='AND')return [ccx(0,1,2)];
  return [cx(0,2),cx(1,2)];
 }
 if(name==='zero')return [];
 // The constant −I is a global phase; use XZXZ to verify exact matrix equality.
 if(name==='one')return [gate('Z'),gate('X'),gate('Z'),gate('X')];
 if(name==='copy x1')return [gate('Z',1)];
 if(name==='NOT x1')return [gate('X',1),gate('Z',1),gate('X',1)];
 if(name==='AND')return [op('CZ',control(Z),0,1)];
 return [gate('Z',0),gate('Z',1)];
}
export const lab:Lab={
 controls:[choice('f','Boolean function',['AND',...funcs.filter(name=>name!=='AND')]),choice('input','Input',['++','00','01','10','11']),choice('type','Oracle',['Bit flip (target 0)','Bit flip (target −)','Phase flip'])],
 run:v=>{
  const bit=v.type!=='Phase flip',kickback=bit&&v.type.includes('−'),phase=!bit||kickback;
  const ops=oracleOps(v.f,bit),start=product(...v.input,...(bit?[kickback?'−':'0']:[]));
  const definite=!v.input.includes('+'),value=definite?f(v.f,parseInt(v.input,2)):null;
  const note=phase?(v.f==='zero'?'The phase is unchanged.':v.f==='one'?'All amplitudes gain the same minus sign, an unobservable global phase.':definite?'f(x) = '+value+'; the factor '+(value?'−1':'+1')+' is a global phase on this definite input.':'The marked inputs gain a minus sign relative to unmarked inputs. A later interference gate and measurement can reveal that difference.'):'The elementary gates XOR the function into the target, preserving the input.';
  const s=sequence(start,ops,note),last=s.at(-1)!;
  if(!ops.length)last.note='Started as '+last.start+'. The zero function is the identity: no gate is required and all amplitudes are unchanged.';
  last.rows=[...(last.rows??[]),row('Elementary gates',ops.length),...['00','01','10','11'].map((x,i)=>row('f('+x+') (classical truth table)',f(v.f,i))),row('Matrix gap to direct oracle',matrixGap(fullMatrix(bit?3:2,ops),bit?bitOracle(v.f):phaseOracle(v.f)))];
  return s;
 }
};
