import test from 'node:test';
import assert from 'node:assert/strict';
import * as q from '../quantum.ts';
import * as g from './gate-lab.ts';
import { unitaryError } from './gates.ts';
import { pauli } from './pauli-strings.ts';
import { evolveGenerators, prep } from './stabilizer-states.ts';
import { expect } from './gottesman-knill.ts';
import { search } from './solovay-kitaev.ts';
import { shift } from './qtm.ts';
import { evolution } from './adiabatic.ts';
import { B1, B2 } from './topological-model.ts';
import { gaussian } from './cv-model.ts';

import { checkLabs, close, state, matrix, phase, all, value } from './gate-lab-checks.ts';
import {chain} from './mbqc.ts';
const {run,last}=await checkLabs(['gate-teleportation', 'mbqc']);
test('magic-state injection and one-way measurement: corrected branches attain target fidelity; omission can fail',()=>{
 for(const input of ['0','1','+','−','+i'])for(const id of ['gate-teleportation','mbqc']){
  const out=run(id,{input});for(const step of out.slice(-2))close(Number(step.rows!.at(-1)!.value),1);
 }
 assert.ok(Number(last('gate-teleportation',{input:'+',correct:'No'}).rows![0].value)<.99);
 assert.ok(Number(last('mbqc',{input:'0',correct:'No',angle:'0'}).rows![0].value)> .99); // X|+> = |+>
 assert.ok(Number(last('mbqc',{input:'+',correct:'No',angle:'0'}).rows![0].value)<.01);
});
test('adaptive angle sign yields target in all branches; omission can fail',()=>{for(const input of g.kets)for(const a of [.37,.91]){const bs=chain(g.ket(input),a,.77,true);for(const b of bs){close(b.p,.25);close(b.fidelity,1);close(b.angle,b.m?-.77:.77);}}assert.ok(chain(g.ket('0'),.3,.77,false).some(b=>b.fidelity<.9));});
