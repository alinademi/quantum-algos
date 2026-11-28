import { X,Z,RX,RZ } from '../quantum.ts';
import { choice,ket,op,sequence,inverse,fullMatrix,matrixGap,row,type Lab } from './gate-lab.ts';
// Ising-anyon fusion qubit, common overall braid phase removed; all braids use one consistent handedness.
export const B1=op('Braid 1–2',RZ(Math.PI/2),0),B2=op('Braid 2–3',RX(Math.PI/2),0);
export const lab:Lab={
 controls:[choice('order','Braid word',['1 then 2','2 then 1','1–2–1','2–1–2','Undo both']),choice('start','Fusion state',[['0','0: first pair fuses to vacuum (1)'],['1','1: first pair fuses to ψ'],'+','+i'])],
 run:v=>{const ops=v.order==='1 then 2'?[B1,B2]:v.order==='2 then 1'?[B2,B1]:v.order==='1–2–1'?[B1,B2,B1]:v.order==='2–1–2'?[B2,B1,B2]:[B1,B2,...inverse([B1,B2])];const st=sequence(ket(v.start),ops,'These are ideal Ising-anyon braid matrices on a two-dimensional fusion space, not particle trajectories. Noise and protection against it are not simulated.');st.at(-1)!.rows=[row('Selected word matrix',fullMatrix(1,ops).map(r=>r.map(z=>z.re.toFixed(3)+(z.im>=0?'+':'')+z.im.toFixed(3)+'i').join(' ')).join('; ')),row(v.order==='Undo both'?'Inverse check matrix gap':v.order==='1–2–1'||v.order==='2–1–2'?'Braid relation gap':'Reverse-order matrix gap',matrixGap(fullMatrix(1,ops),fullMatrix(1,v.order==='1 then 2'?[B2,B1]:v.order==='2 then 1'?[B1,B2]:v.order==='1–2–1'?[B2,B1,B2]:v.order==='2–1–2'?[B1,B2,B1]:[])))];return st}
};
