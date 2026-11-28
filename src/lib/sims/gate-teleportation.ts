import { tensor,matVec,T } from '../quantum.ts';
import { choice,ket,gate,cx,apply,branch,stateStep,distribution,row,fidelity,type Lab } from './gate-lab.ts';
export const lab:Lab={
 controls:[choice('input','Data state',['+','0','1','+i','−']),choice('correct','Apply S correction?',['Yes','No'])],
 run:v=>{const target=matVec(T,ket(v.input)),magic=matVec(T,ket('+')),s=tensor(ket(v.input),magic),t=apply(s,cx(0,1)),out=[stateStep('Prepare magic state','q1 starts as T|+⟩. Its preparation is the resource.',s),stateStep('CNOT data → magic','Entangle before measuring q1.',t)];const bs=[0,1].map(k=>branch(t,1,k)!);out.push(distribution('Measure magic qubit','Both outcomes have probability one half.',['0','1'],bs.map(b=>b.p)));
 bs.forEach((b,k)=>{const corrected=k&&v.correct==='Yes'?apply(b.state,gate('S')):b.state;const data=[corrected[k],corrected[2+k]];out.push(stateStep('If result '+k,(k&&v.correct==='Yes')?'S corrects the T† branch up to global phase.':'No correction applied in this branch.',data,[row('Fidelity to T|ψ⟩',fidelity(target,data))]))});return out.map(step=>({...step,start:'|'+v.input+'⟩ and T|+⟩ magic state'}))}
};
