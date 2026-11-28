import { dagger, matMul, norm2, type Matrix } from '../quantum.ts';
import { G, choice, kets, ket, gate, sequence, inverse, matrixGap, eye, row, type Lab } from './gate-lab.ts';
export const unitaryError = (u: Matrix) => matrixGap(matMul(dagger(u),u),eye(u.length));
export const lab: Lab = {
  controls:[choice('start','Start state',kets),choice('gate','Gate',['X','H','S','T','Y','Z'])],
  run:v=>{const g=gate(v.gate);const steps=sequence(ket(v.start),[g,...inverse([g])],'Applying the adjoint returns the entire state.');steps[1].rows?.push(row('Squared norm',norm2(steps[1].state!)),row('Unitary check error',unitaryError(G[v.gate])));return steps}
};
