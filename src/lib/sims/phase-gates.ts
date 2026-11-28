import { P } from '../quantum.ts';
import { choice, ket, kets, gate, op, deg, angles, sequence, type Lab } from './gate-lab.ts';
export const lab: Lab = {
  controls:[choice('start','Start state',['+','−','+i','0','1','−i']),choice('gate','Phase gate',['Z','S','T','P']),choice('phi','Angle for P (degrees)',angles)],
  run:v=>sequence(ket(v.start),[v.gate==='P'?op('P('+v.phi+'°)',P(deg(v.phi)),0):gate(v.gate),gate('H')],'H converts relative phase into different standard-basis odds.')
};
