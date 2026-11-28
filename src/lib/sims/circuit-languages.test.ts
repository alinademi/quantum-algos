import test from 'node:test';
import assert from 'node:assert/strict';
import * as q from '../quantum.ts';

import { checkLabs,state,value } from './gate-lab-checks.ts';
import {code} from './circuit-languages.ts';
const {labs,last}=await checkLabs(['circuit-languages']);
test('circuit languages are illustrative descriptions of the same Bell circuit',()=>{
 for(const opt of labs['circuit-languages'].controls[0].options)state(last('circuit-languages',{language:opt.value}).state!,[q.c(Math.SQRT1_2),q.c(0),q.c(0),q.c(Math.SQRT1_2)]);
});
test('examples actually differ in syntax and show the measurement explicitly',()=>{assert.equal(new Set(Object.values(code)).size,4);assert.match(code['OpenQASM 3'],/c = measure q/);assert.match(code['Cirq (Python)'],/cirq.measure/);assert.match(code['Qiskit (Python)'],/qc.measure/);assert.match(code['Q#'],/M\(q\[0\]\)/);});

test('alternate circuits expose noncommuting order and bit-order differences in every language',()=>{for(const opt of labs['circuit-languages'].controls[0].options){const language=opt.value;state(last('circuit-languages',{language,program:'CNOT before H'}).state!,[q.c(Math.SQRT1_2),q.c(0),q.c(Math.SQRT1_2),q.c(0)]);const r=last('circuit-languages',{language,program:'X on q0'});state(r.state!,q.basis(2,2));assert.equal(r.rows![1].value,'01');}});


test('literal edited programs parse in each language and produce the same asymmetric state',async()=>{
 const {compileStatements,parseStatements}=await import('./circuit-languages.ts');
 const cases:Record<string,string>={'OpenQASM 3':'x q[1];\ncx q[1], q[0];\nz q[0];','Qiskit (Python)':'qc.x(1)\nqc.cx(1, 0)\nqc.z(0)','Cirq (Python)':'cirq.X(b)\ncirq.CNOT(b, a)\ncirq.Z(a)','Q#':'X(q[1]);\nCNOT(q[1], q[0]);\nZ(q[0]);'};
 for(const [language,source] of Object.entries(cases)){const r=compileStatements(language,source);state(r.state!,[q.c(0),q.c(0),q.c(0),q.c(-1)]);assert.deepEqual(r.ops.map(o=>o.wires),[[1],[1,0],[0]]);assert.throws(()=>parseStatements(language,'not a gate'));assert.equal(compileStatements(language,'').ops.length,0);}
 assert.throws(()=>parseStatements('OpenQASM 3','cx q[0], q[0];'));
 assert.throws(()=>parseStatements('OpenQASM 3','xq[0];'));
 assert.throws(()=>parseStatements('Qiskit (Python)','q c.x(0)'));
 assert.throws(()=>parseStatements('Qiskit (Python)','qc.x(2)'));
 assert.throws(()=>parseStatements('Q#',Array(13).fill('H(q[0]);').join('\n')));
});
