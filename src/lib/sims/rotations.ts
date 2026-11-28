import { bloch } from '../quantum.ts';
import { choice, kets, ket, angles, rotation, sequence, row, type Lab } from './gate-lab.ts';
export const lab: Lab = {
  controls:[choice('start','Start state',kets),choice('axis','Axis',['X','Y','Z']),choice('angle','Angle (degrees)',['90','30','45','60','120','180','270','360','720','0'])],
  run:v=>sequence(ket(v.start),[rotation(v.axis,v.angle),rotation(v.axis,-Number(v.angle))],'The inverse turn returns the state.').map(s=>({...s,rows:[...(s.rows??[]),...bloch(s.state!).map((x,i)=>row(['Bloch x','Bloch y','Bloch z'][i],x))]}))
};
