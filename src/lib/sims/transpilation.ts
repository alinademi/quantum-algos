import { choice,product,gate,cx,sequence,swap,fullMatrix,matrixGap,row,details,type Lab,type Op } from './gate-lab.ts';
import { nativeH,nativeCX } from './native-gates.ts';
import { layers } from './circuit-cost.ts';
import { mul,expi } from '../quantum.ts';
export const lab:Lab={
 controls:[choice('opt','Cancel adjacent pairs?',['Yes','No']),choice('start','Input q0',['0','1','+'])],
 run:v=>{
  const original=[gate('H'),cx(0,2),cx(1,2),cx(1,2)],logical=v.opt==='Yes'?original.slice(0,2):original;
  const routed=[gate('H'),swap(0,1),cx(1,2),swap(0,1),...logical.slice(2)];
  const expanded=routed.flatMap(o=>{const [a,b]=o.wires;return o.name==='SWAP'?[cx(a,b),cx(b,a),cx(a,b)]:[o]});
  const native=expanded.flatMap(o=>o.name==='H'?nativeH(o.wires[0]):nativeCX(o.wires[0],o.wires[1]));
  const cnots=expanded.filter(o=>o.name==='CNOT').length,phase=Math.PI/4+cnots*Math.PI/2;
  const schedule=layers(native,3),ref=fullMatrix(3,original);
  const describe=(ops:Op[])=>ops.map((o,i)=>row('Gate '+(i+1),o.name+' on q'+o.wires.join(', q')));
  const routedSteps=sequence(product(v.start,'0','0'),routed,'SWAPs restore the layout.');
  return [
    details('Logical circuit','Input program; distant wires may interact.',describe(original)),
    details('Optimize','Cancel identical adjacent CNOTs if requested.',describe(logical)),
    ...routedSteps,
    details('Translate','Expand SWAPs into CNOTs, then translate into the example RZ, SX, CZ basis.',describe(native)),
    details('Schedule and verify','Count ideal layers on disjoint wires. The global phase of the native decomposition is accounted for.',[
      row('Original logical gates',original.length),row('Routed gates',routed.length),row('CNOTs after SWAP decomposition',cnots),row('Native operations',native.length),row('Native depth',Math.max(...schedule)),row('Routed matrix gap',matrixGap(ref,fullMatrix(3,routed))),row('Native phase-adjusted matrix gap',matrixGap(ref,fullMatrix(3,native).map(r=>r.map(x=>mul(expi(phase),x)))))])
  ];
 }
};
