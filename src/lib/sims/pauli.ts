import { bloch } from '../quantum.ts';
import { choice, ket, kets, gate, sequence, row, type Lab } from './gate-lab.ts';
export const lab: Lab = {
  controls:[choice('start','Start state',kets),choice('axis','Pauli gate',['X','Y','Z']),choice('follow','Second operation',['Repeat Pauli','Hadamard'])],
  run:v=>sequence(ket(v.start),[gate(v.axis),gate(v.follow==='Hadamard'?'H':v.axis)],v.follow==='Hadamard'?'H converts relative phase into measurement odds.':'Two equal Pauli gates cancel.').map(s=>({...s,rows:[...(s.rows??[]),...bloch(s.state!).map((x,i)=>row(['Bloch x','Bloch y','Bloch z'][i],x))]}))
};
