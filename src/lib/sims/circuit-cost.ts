import { choice,details,row,gate,cx,type Lab,type Op } from './gate-lab.ts';
export const recipes:Record<string,Op[]>={'Parallel H and CNOT':[gate('H',0),gate('H',1),cx(0,2),gate('T',1),cx(1,2)],'Serial chain':[gate('H'),cx(0,1),cx(1,2),gate('T',2)],'SWAP and phase':[cx(0,1),cx(1,0),cx(0,1),gate('T',2),gate('T†',2)]};
export function layers(ops:Op[],n:number):number[]{
 const used=Array(n).fill(0);return ops.map(o=>{const l=1+Math.max(...o.wires.map(w=>used[w]));o.wires.forEach(w=>used[w]=l);return l;});
}
export const lab:Lab={
 controls:[choice('recipe','Circuit',Object.keys(recipes)),choice('mode','Schedule',['Parallel on disjoint wires','One gate at a time'])],
 run:v=>{const ops=recipes[v.recipe],ls=v.mode==='One gate at a time'?ops.map((_,i)=>i+1):layers(ops,3);return [details('Gate schedule','One gate occupies all of its wires in a layer.',ops.map((g,i)=>row(g.name+' on '+g.wires.join(','),'Layer '+ls[i]))),details('Resources','This is ideal logical depth, not physical time.',[row('Width',3),row('Depth',Math.max(...layers(ops,3))),row('Layers in this schedule',Math.max(...ls)),row('Gate count',ops.length),row('CNOT count',ops.filter(x=>x.name==='CNOT').length),row('T or T† count',ops.filter(x=>x.name==='T'||x.name==='T†').length),row('Layers containing T or T† in this schedule',new Set(ls.filter((_,i)=>ops[i].name==='T'||ops[i].name==='T†')).size)])]}
};
