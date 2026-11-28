import { choice,product,gate,cx,sequence,swap,fullMatrix,matrixGap,row,details,type Lab,type Op } from './gate-lab.ts';
import { nativeH,nativeCX } from './native-gates.ts';
import { layers } from './circuit-cost.ts';
import { mul,expi } from '../quantum.ts';
export const lab:Lab={
 controls:[choice('opt','Cancel adjacent pairs?',['Yes','No']),choice('start','Input q0',['0','1','+']),choice('placement','Initial placement',['q0 q1 q2','q0 q2 q1'])],
 run:v=>{
  const original=[gate('H'),cx(0,2),cx(1,2),cx(1,2)],logical=v.opt==='Yes'?original.slice(0,2):original;
  // Map logical wires to physical sites. Each remote gate restores this placement.
  const placement=v.placement==='q0 q2 q1'?[0,2,1]:[0,1,2];
  const place=(o:Op):Op=>({...o,wires:o.wires.map(w=>placement[w])});
  const placed=logical.map(place);
  const routed=placed.flatMap(o=>{
   if(o.wires.length===1||Math.abs(o.wires[0]-o.wires[1])===1)return [o];
   const [a,b]=o.wires;return [swap(a,1),cx(1,b),swap(a,1)];
  });
  const expanded=routed.flatMap(o=>{const [a,b]=o.wires;return o.name==='SWAP'?[cx(a,b),cx(b,a),cx(a,b)]:[o]});
  const native=expanded.flatMap(o=>o.name==='H'?nativeH(o.wires[0]):nativeCX(o.wires[0],o.wires[1]));
  const cnots=expanded.filter(o=>o.name==='CNOT').length,phase=Math.PI/4+cnots*Math.PI/2;
  const schedule=layers(native,3),ref=fullMatrix(3,original.map(place));
  const describe=(ops:Op[])=>ops.map((o,i)=>row('Gate '+(i+1),o.name+' on '+o.wires.join(', ')));
  const initial=['0','0','0']; initial[placement[0]]=v.start;
  const sites=placement.map((_,site)=>placement.indexOf(site));
  const initialMap=sites.map((q,site)=>'site '+site+' holds logical q'+q).join('; ');
  const routedSteps=sequence(product(...initial),routed,routed.at(-1)?.name==='SWAP'?'SWAPs restore the chosen layout.':'Routing is complete in the chosen layout.','physical sites |'+initial.join('⟩ |')+'⟩; '+initialMap);
  routedSteps.forEach((step,i)=>{
   const o=routed[i-1];
   if(o?.name==='SWAP'){const [a,b]=o.wires;[sites[a],sites[b]]=[sites[b],sites[a]];}
   if(o)step.title=o.name+' on '+o.wires.map(w=>'site '+w).join(', ');
   step.note+=' Diagram labels q0, q1, q2 denote physical sites here, not logical qubits.';
   step.rows=[...(step.rows??[]),...sites.map((q,site)=>row('Site '+site+' currently holds','Logical q'+q))];
  });
  return [
    details('Logical circuit','Input program; distant wires may interact.',describe(original)),
    details('Optimize','Cancel identical adjacent CNOTs if requested.',[row('Canceled logical gates',original.length-logical.length),...describe(logical)]),
    details('Place logical qubits','Choose the initial map to physical sites before inserting any routing gates.',placement.map((site,q)=>row('Logical q'+q,'Site '+site))),
    ...routedSteps,
    details('Translate','The listed wire numbers now denote physical sites. Expand SWAPs into CNOTs, then translate into the example RZ, SX, CZ basis.',describe(native)),
    details('Schedule and verify','Count ideal layers on disjoint wires. The global phase of the native decomposition is accounted for.',[
      row('Original logical gates',original.length),row('Inserted SWAPs',routed.filter(o=>o.name==='SWAP').length),row('Routed gates',routed.length),row('CNOTs after SWAP decomposition',cnots),row('Native operations',native.length),row('Native depth',Math.max(...schedule)),row('Routed matrix gap',matrixGap(ref,fullMatrix(3,routed))),row('Native phase-adjusted matrix gap',matrixGap(ref,fullMatrix(3,native).map(r=>r.map(x=>mul(expi(phase),x)))))])
  ];
 }
};
