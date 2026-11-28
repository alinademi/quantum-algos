import test from 'node:test';
import assert from 'node:assert/strict';
import * as q from '../quantum.ts';
import * as g from './gate-lab.ts';
import { evolution,path,avoidedPath,adiabaticScale } from './adiabatic.ts';

import { checkLabs,close,state } from './gate-lab-checks.ts';
await checkLabs(['adiabatic']);
test('adiabatic midpoint evolution maintains norm, converges under step refinement and follows the gapped ground state at long time',()=>{
 for(const t of [1,5,20,50,100]){
  const a=evolution(t,1000).at(-1)!.psi,b=evolution(t,2000).at(-1)!.psi;
  assert.ok(g.fidelity(a,b)>1-1e-5);close(q.norm2(a),1);
 }
 assert.ok(q.probs(evolution(100).at(-1)!.psi)[0]>.99);
 assert.ok(q.probs(evolution(1).at(-1)!.psi)[0]<.8);
});
test('gap minimum and non-monotonic finite-time following',()=>{const p=path(5);close(Math.min(...p.map(s=>s.gap)),Math.SQRT2);assert.ok(p.at(-1)!.ground>.9999);assert.ok(Math.min(...p.map(s=>s.ground))<.97);assert.ok(path(20).at(-1)!.ground<p.at(-1)!.ground);});
test('adjustable avoided crossing has an exact ground start and inverse-square time scale',()=>{
 for(const [gap,t] of [[1,12.5],[.5,49],[.25,192]]){
  const p=avoidedPath(t,gap),fine=avoidedPath(t,gap,16000);
  close(Math.min(...p.map(x=>x.gap)),gap);
  const initial=p[0].psi,r=Math.hypot(1,gap/2),h=q.Z.map((row,i)=>row.map((z,j)=>q.add(q.scale(z,-1),q.scale(q.X[i][j],-gap/2))));
  state(q.matVec(h,initial),initial.map(v=>q.scale(v,-r)));
  assert.ok(Math.abs(p.at(-1)!.ground-fine.at(-1)!.ground)<1e-5);
  assert.ok(p.at(-1)!.ground>.985);
 }
 close(adiabaticScale(.25)/adiabaticScale(.5),4);
 assert.ok(avoidedPath(12.5,.25).at(-1)!.ground<.8);
});
