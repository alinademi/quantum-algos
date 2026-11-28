import test from 'node:test';
import assert from 'node:assert/strict';
import * as q from '../quantum.ts';
import * as g from './gate-lab.ts';
import { gaussian,quadratureShots } from './cv-model.ts';

import { checkLabs,close,matrix } from './gate-lab-checks.ts';
const {run,last}=await checkLabs(['cv-model']);
test('Gaussian rotations preserve covariance determinant and Heisenberg bound; displacement does not change variance',()=>{
 for(const r of [0,.3,.7,1])for(const t of [0,.7,Math.PI/2,2.1]){
  const a=gaussian(r,t,2),b=gaussian(r,t,0);
  const O=[[q.c(Math.cos(t)),q.c(-Math.sin(t))],[q.c(Math.sin(t)),q.c(Math.cos(t))]];
  const V=[[q.c(Math.exp(-2*r)/2),q.c(0)],[q.c(0),q.c(Math.exp(2*r)/2)]];
  matrix([[q.c(a.vx),q.c(a.cov)],[q.c(a.cov),q.c(a.vp)]],q.matMul(q.matMul(O,V),q.dagger(O)));
  close(a.vx*a.vp-a.cov*a.cov,.25);close(a.vx,b.vx);close(a.vp,b.vp);close(a.cov,b.cov);
  assert.ok(a.vx*a.vp>=.25-1e-9);close(Math.hypot(a.x,a.p),2);
 }
 const a=gaussian(.7,0,0);close(a.vx,Math.exp(-1.4)/2);close(a.vp,Math.exp(1.4)/2);
});
test('seeded separate quadrature measurements recover predicted Gaussian moments',()=>{const s=gaussian(.7,.5,1),a=quadratureShots(s.x,s.vx,12000,q.rng(55));const mean=a.reduce((x,y)=>x+y,0)/a.length,variance=a.reduce((x,y)=>x+(y-mean)**2,0)/a.length;close(mean,s.x,.04);close(variance,s.vx,.06);});
