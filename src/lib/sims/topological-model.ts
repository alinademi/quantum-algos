import { X,Z,RX,RZ } from '../quantum.ts';
import { choice,ket,op,sequence,inverse,fullMatrix,matrixGap,row,type Lab } from './gate-lab.ts';
// Ising-anyon fusion qubit, common overall braid phase removed; all braids use one consistent handedness.
export const B1=op('Braid 1–2',RZ(Math.PI/2),0),B2=op('Braid 2–3',RX(Math.PI/2),0);
export const lab:Lab={
 controls:[choice('order','Braid word',['1 then 2','2 then 1','1–2–1','2–1–2','Undo both']),choice('start','Fusion state',['0','1','+','+i'])],
 run:v=>{const ops=v.order==='1 then 2'?[B1,B2]:v.order==='2 then 1'?[B2,B1]:v.order==='1–2–1'?[B1,B2,B1]:v.order==='2–1–2'?[B2,B1,B2]:[B1,B2,...inverse([B1,B2])];const st=sequence(ket(v.start),ops,'These are ideal Ising-anyon braid matrices on a two-dimensional fusion space, not particle trajectories.');st.at(-1)!.rows=[row('Braid relation gap',matrixGap(fullMatrix(1,[B1,B2,B1]),fullMatrix(1,[B2,B1,B2]))),row('Reverse-order matrix gap',matrixGap(fullMatrix(1,[B1,B2]),fullMatrix(1,[B2,B1])))];return st}
};
