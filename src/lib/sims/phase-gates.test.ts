import test from 'node:test';
import assert from 'node:assert/strict';
import * as q from '../quantum.ts';
import * as g from './gate-lab.ts';

import { checkLabs,close,state,phase } from './gate-lab-checks.ts';
const {run,last}=await checkLabs(['phase-gates']);
test('phase gates produce sin squared half-angle interference',()=>{
 for(const phi of g.angles)close(q.probs(last('phase-gates',{gate:'P',phi,start:'+'}).state!)[1],Math.sin(g.deg(phi)/2)**2);
});
test('Z, S and T preserve computational probabilities',()=>{for(const k of ['Z','S','T'])for(const start of g.kets){const steps=run('phase-gates',{gate:k,start});q.probs(steps[1].state!).forEach((x,i)=>close(x,q.probs(g.ket(start))[i]));}});
