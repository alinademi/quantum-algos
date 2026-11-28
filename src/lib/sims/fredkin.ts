import { choice, bits, bstate, product, control, SWAP, op, cx, ccx, sequence, type Lab } from './gate-lab.ts';
export const fredkin=op('Controlled SWAP',control(SWAP),0,1,2);
export const lab:Lab={
 controls:[choice('control','Control',['1','0','+']),choice('targets','Targets',bits(2)),choice('method','Implementation',['Direct','Three controlled operations'])],
 run:v=>sequence(product(v.control,v.targets[0],v.targets[1]),v.method==='Direct'?[fredkin]:[cx(1,2),ccx(0,2,1),cx(1,2)],'The target pair swaps only on control 1; coherent branches are preserved.')
};
