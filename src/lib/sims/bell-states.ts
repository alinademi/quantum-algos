import { choice, bits, bstate, gate, cx, sequence, row, type Lab } from './gate-lab.ts';
export const lab:Lab={
 controls:[choice('start','Bell label (input bits)',bits(2)),choice('decode','Circuit',['Prepare and decode','Prepare only'])],
 run:v=>{const s=sequence(bstate(v.start),[gate('H'),cx(0,1),...(v.decode==='Prepare and decode'?[cx(0,1),gate('H')]:[])],v.decode==='Prepare and decode'?'The inverse maps the Bell state back to its original label.':'Measure in Z to see the correlated or anticorrelated pair.');const name=(v.start[1]==='0'?'Φ':'Ψ')+(v.start[0]==='0'?'+':'−'),a='0'+v.start[1],b='1'+(1-Number(v.start[1]));s[2].note='Started as |'+v.start+'⟩: H then CNOT gives '+name+' = (|'+a+'⟩ '+(v.start[0]==='0'?'+':'−')+' |'+b+'⟩)/√2.';s[2].rows?.push(row('Bell state',name));return s;}
};
