import { choice, bits, bstate, gate, cx, sequence, type Lab } from './gate-lab.ts';
export const lab:Lab={
 controls:[choice('start','Bell label (input bits)',bits(2)),choice('decode','Circuit',['Prepare and decode','Prepare only'])],
 run:v=>sequence(bstate(v.start),[gate('H'),cx(0,1),...(v.decode==='Prepare and decode'?[cx(0,1),gate('H')]:[])],v.decode==='Prepare and decode'?'The inverse maps the Bell state back to its original label.':'The Bell state is ready.')
};
