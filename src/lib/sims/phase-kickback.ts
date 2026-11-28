import { X, P } from '../quantum.ts';
import { choice, product, op, gate, control, deg, sequence, type Lab } from './gate-lab.ts';
export const lab:Lab={
 controls:[choice('mode','Controlled gate',['X','P']),choice('eigen','Target (choose eigenstate for the gate)',['−','+','0','1']),choice('angle','P angle (degrees)',['90','45','180','0'],v=>v.mode==='P')],
 run:v=>sequence(product('+',v.eigen),[op('Controlled '+v.mode,control(v.mode==='X'?X:P(deg(v.angle))),0,1),gate('H')],'When the target is an eigenstate its eigenvalue becomes relative phase on the control; otherwise entanglement may remain.')
};
