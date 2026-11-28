import { choice,product,swap,cx,sequence,fullMatrix,matrixGap,row,type Op,type Lab } from './gate-lab.ts';
export function route(a:number,b:number):Op[]{
 const moves:Op[]=[];let at=a;while(Math.abs(at-b)>1){const next=at+Math.sign(b-at);moves.push(swap(at,next));at=next;}
 return [...moves,cx(at,b),...moves.slice().reverse()];
}
// Each layout lists the logical qubit held at each physical site.
export const placements:Record<string,number[]>={'Straight [0,1,2,3]':[0,1,2,3],'Reordered [1,2,0,3]':[1,2,0,3]};
const physicalRoute=(a:number,b:number,sites:number[])=>route(sites.indexOf(a),sites.indexOf(b));
export function layoutTrace(a:number,b:number,placement:number[]=[0,1,2,3]){
 const sites=[...placement];
 return [{sites:[...sites],name:'Start',wires:[] as number[]},...physicalRoute(a,b,placement).map(o=>{
  const [u,v]=o.wires;
  if(o.name==='SWAP')[sites[u],sites[v]]=[sites[v],sites[u]];
  return {sites:[...sites],name:o.name,wires:o.wires};
 })];
}
export const lab:Lab={
 controls:[choice('pair','Logical CNOT',['0→3','3→0','0→2','1→2','2→0']),choice('layout','Initial placement',Object.keys(placements)),choice('start','Logical q0',['1','+','0']),choice('q1','Logical q1',['0','1']),choice('q2','Logical q2',['1','0']),choice('q3','Logical q3',['0','1'])],
 run:v=>{const [a,b]=v.pair.split('→').map(Number),sites=placements[v.layout]??placements['Straight [0,1,2,3]'],input=[v.start,v.q1??'0',v.q2??'1',v.q3??'0'],ops=physicalRoute(a,b,sites),s=sequence(product(...sites.map(q=>input[q])),ops,'The reverse SWAPs restore the original logical layout.');s.at(-1)!.rows=[row('SWAPs',ops.length-1),row('CNOTs if each SWAP costs 3',3*(ops.length-1)+1),row('Full matrix gap',matrixGap(fullMatrix(4,ops),fullMatrix(4,[cx(sites.indexOf(a),sites.indexOf(b))])))];return s}
};
