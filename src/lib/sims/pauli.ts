import { bloch } from '../quantum.ts';
import { choice, ket, kets, gate, sequence, row, type Lab } from './gate-lab.ts';
export const lab: Lab = {
  controls:[choice('start','Start state',kets),choice('axis','Pauli gate',['X','Y','Z'])],
  run:v=>sequence(ket(v.start),[gate(v.axis),gate(v.axis)],'Two equal Pauli gates cancel.').map(s=>({...s,rows:[...(s.rows??[]),...bloch(s.state!).map((x,i)=>row(['Bloch x','Bloch y','Bloch z'][i],x))]}))
};
