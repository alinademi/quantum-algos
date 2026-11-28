import test from 'node:test';
import assert from 'node:assert/strict';
import * as q from '../quantum.ts';
import * as g from './gate-lab.ts';
export const close=(a:number,b:number,eps=1e-9)=>assert.ok(Math.abs(a-b)<eps, `${a} != ${b}`);
export const state=(a:q.State,b:q.State)=>{assert.equal(a.length,b.length);a.forEach((x,i)=>close(q.abs(q.sub(x,b[i])),0));};
export const matrix=(a:q.Matrix,b:q.Matrix)=>{assert.equal(a.length,b.length);a.forEach((r,i)=>state(r,b[i]));};
export const phase=(m:q.Matrix,t:number)=>m.map(r=>r.map(a=>q.mul(q.expi(t),a)));
export const all=(n:number,alphabet:string[])=>Array.from({length:alphabet.length**n},(_,i)=>Array.from({length:n},(_,j)=>alphabet[Math.floor(i/alphabet.length**(n-1-j))%alphabet.length]).join(''));
export const value=(s:g.Step,k:string)=>Number(s.rows!.find(r=>r.label===k)!.value);

function* combinations(controls:g.Control[],i=0,v:g.Values={}):Generator<g.Values>{
 if(i===controls.length){yield {...v};return;}
 const c=controls[i];for(const o of c.options){v[c.key]=o.value;yield* combinations(controls,i+1,v);}
}
// Every legal setting, not just defaults, is checked for normalized states and valid
// probability distributions. Matrix equality readouts are checked over all settings.
export async function checkLabs(ids:string[]){
 const labs: Record<string,g.Lab> = {};
 for(const id of ids)labs[id]=(await import('./'+id+'.ts')).lab;
 const run=(id:string,v:g.Values={})=>labs[id].run({...g.defaults(labs[id]),...v});
 const last=(id:string,v:g.Values={})=>run(id,v).at(-1)!;
 for(const id of ids)test(id+': every control combination yields finite normalized states and valid outcomes',()=>{
 for(const v of combinations(labs[id].controls)){
  const steps=run(id,v);assert.ok(steps.length);
  for(const s of steps){
   if(s.diagram){assert.ok(s.diagram.current>=-1&&s.diagram.current<s.diagram.ops.length);assert.ok(s.diagram.ops.every(o=>o.wires.every(w=>w>=0&&w<s.diagram!.n)));}
   if(s.state){assert.ok(s.state.every(a=>Number.isFinite(a.re)&&Number.isFinite(a.im)));close(q.norm2(s.state),1,1e-8);}
   if(s.distribution){const {labels,p}=s.distribution;assert.equal(labels.length,p.length);assert.ok(p.every(x=>Number.isFinite(x)&&x>=-1e-10&&x<=1+1e-10));close(p.reduce((a,b)=>a+b,0),1,1e-8);}
   for(const r of s.rows??[]){
    assert.doesNotMatch(r.value,/^(?:NaN|[-+]?Infinity)$/);
    if(/(?:unitary check error|matrix gap|matrix error|matrix entry gap|matrix entry difference|matrix check|entry error|probability gap|reconstruction error|full matrix vs)/i.test(r.label)&&!r.label.startsWith('Reverse-order'))close(Number(r.value),0,1e-8);
   }
  }
 }
});
 return {labs,run,last};
}
