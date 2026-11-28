import { tensor,matVec,T } from '../quantum.ts';
import { choice,ket,gate,cx,apply,branch,sequence,stateStep,distribution,row,fidelity,type Lab } from './gate-lab.ts';
export const lab:Lab={
 controls:[choice('input','Data state',['+','0','1','+i','−']),choice('correct','Apply S correction?',['Yes','No'])],
 run:v=>{const target=matVec(T,ket(v.input)),magic=matVec(T,ket('+')),s=tensor(ket(v.input),magic),t=apply(s,cx(0,1)),out=sequence(s,[cx(0,1)],'Control the magic qubit with the data before measuring q1. For some inputs this creates entanglement.','|'+v.input+'⟩ and T|+⟩ magic state');const bs=[0,1].map(k=>branch(t,1,k)!);out.push(distribution('Measure magic qubit','Both outcomes have probability one half.',['0','1'],bs.map(b=>b.p)));
 bs.forEach((b,k)=>{const corrected=k&&v.correct==='Yes'?apply(b.state,gate('S')):b.state;const data=[corrected[k],corrected[2+k]];out.push(stateStep('If result '+k,(k&&v.correct==='Yes')?'Result 1 (probability 1/2): S corrects the T† branch up to global phase.':k?'Result 1 (probability 1/2): no correction, so T† up to global phase.':'Result 0 (probability 1/2): the data already has T applied.',data,[row('Fidelity to T|ψ⟩',fidelity(target,data))]))});return out.map(step=>({...step,start:'|'+v.input+'⟩ and T|+⟩ magic state'}))}
};
