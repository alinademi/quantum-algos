import test from 'node:test';
import * as q from '../quantum.ts';
import * as g from './gate-lab.ts';

import { checkLabs,state,matrix,phase } from './gate-lab-checks.ts';
await checkLabs(['rotations']);
test('rotations have spinor 2π sign and 4π period; positive Y acts toward +X',()=>{
 for(const a of ['X','Y','Z'])matrix(g.rotation(a,360).matrix,phase(q.I,Math.PI));
 state(g.apply(g.ket('0'),g.rotation('Y',90)),q.plus());
 state(g.apply(g.ket('0'),g.rotation('X',90)),[q.c(Math.SQRT1_2),q.c(0,-Math.SQRT1_2)]);
});
test('half turns equal -i Pauli and 720 degrees is exactly identity',()=>{for(const a of ['X','Y','Z']){matrix(g.rotation(a,180).matrix,phase(g.G[a],-Math.PI/2));matrix(g.rotation(a,720).matrix,q.I);}});
