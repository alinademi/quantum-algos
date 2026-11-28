import { choice, details, row, type Lab } from './gate-lab.ts';
export const boolean = (name: string, a: number, b: number): number => {
  if (name === 'NOT') return a ^ 1;
  if (name === 'AND') return a & b;
  if (name === 'OR') return a | b;
  if (name === 'XOR') return a ^ b;
  if (name === 'NAND') return 1 ^ (a & b);
  throw Error('unknown Boolean gate');
};
export function nandTrace(name: string, a: number, b: number) {
  const trace: { a: number; b: number; out: number }[] = [];
  const n = (x: number, y: number) => { const out=boolean('NAND',x,y);trace.push({a:x,b:y,out});return out; };
  const evaluate=()=>{
  if (name === 'NOT') return n(a, a);
  if (name === 'AND') { const t=n(a,b);return n(t,t); }
  if (name === 'OR') return n(n(a,a), n(b,b));
  if (name === 'XOR') { const t = n(a,b); return n(n(a,t), n(b,t)); }
  return n(a,b);
  };
  return {out:evaluate(),trace};
}
export const viaNand=(name:string,a:number,b:number)=>nandTrace(name,a,b).out;
export const lab: Lab = {
  controls: [choice('gate','Logic gate',['NOT','AND','OR','XOR','NAND']), choice('a','Input A',['0','1']), choice('b','Input B (unused for NOT)',['0','1'])],
  run: ({gate,a,b}) => [
    details('Truth table','The output for each possible input; the selected inputs are shown below.', ['00','01','10','11'].map(s=>row(s,boolean(gate,+s[0],+s[1])))),
    details('Selected inputs','Each gate gives one deterministic classical bit.',[row('A',a),row('B',b),row(gate,boolean(gate,+a,+b))]),
    details('NAND only','The same result, calculated using only NAND gates in order.',[...nandTrace(gate,+a,+b).trace.map((t,i)=>row('Gate '+(i+1),'NAND('+t.a+', '+t.b+') = '+t.out)),row('Output',viaNand(gate,+a,+b))])
  ],
};
