import { choice, bits, bstate, gate, cx, rotation, sequence, fullMatrix, matrixRows, type Lab } from './gate-lab.ts';
export const lab:Lab={
 controls:[choice('start','Input bits',bits(2)),choice('order','Circuit',['H then CNOT','CNOT then H','H then RZ then CNOT'])],
 run:v=>{const ops=v.order==='H then CNOT'?[gate('H'),cx(0,1)]:v.order==='CNOT then H'?[cx(0,1),gate('H')]:[gate('H'),rotation('Z',90),cx(0,1)];const s=sequence(bstate(v.start),ops,'This is the output before measuring.');s.at(-1)!.rows=matrixRows(fullMatrix(2,ops));return s}
};
