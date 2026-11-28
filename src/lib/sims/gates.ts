import { dagger, matMul, norm2, type Matrix } from '../quantum.ts';
import { G, choice, kets, ket, gate, sequence, inverse, matrixGap, eye, fidelity, row, type Lab } from './gate-lab.ts';
export const unitaryError = (u: Matrix) => matrixGap(matMul(dagger(u),u),eye(u.length));
export const lab: Lab = {
  controls:[choice('start','Start state',['+','−',...kets.filter(x=>x!=='+'&&x!=='−')]),choice('gate','Gate',['H','X','S','T','Y','Z'])],
  run:v=>{const g=gate(v.gate);const steps=sequence(ket(v.start),[g,...inverse([g])],'Applying the adjoint returns the entire state.');steps.forEach(step=>{step.rows=[...(step.rows??[]),row('Total probability',norm2(step.state!))]});steps[1].rows!.push(row('Unitary check error',unitaryError(G[v.gate])));steps[2].rows!.push(row('Fidelity to initial state',fidelity(steps[0].state!,steps[2].state!)));return steps}
};
