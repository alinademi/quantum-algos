import test from 'node:test';
import assert from 'node:assert/strict';
import * as q from '../quantum.ts';
import * as g from './gate-lab.ts';
import { circuits } from './circuit-identities.ts';

import { checkLabs,close,state,matrix } from './gate-lab-checks.ts';
const {last}=await checkLabs(['circuit-identities']);
test('circuit identities agree on all basis columns',()=>{
 for(const name of ['HXH','Reverse CNOT','CZ symmetry','Cancel CNOTs']){const [a,b]=circuits(name);matrix(g.fullMatrix(2,a),g.fullMatrix(2,b));}
});
test('Z vs I agrees only on selected input, not as matrices',()=>{const [a,b]=circuits('Z vs I');state(g.runOps(g.product('0','0'),a),g.runOps(g.product('0','0'),b));close(g.matrixGap(g.fullMatrix(2,a),g.fullMatrix(2,b)),2);});

test('the comparison exposes both complete operator matrices',()=>{const s=last('circuit-identities',{identity:'Z vs I'});const left=s.rows!.filter(r=>r.label.startsWith('Left ')),right=s.rows!.filter(r=>r.label.startsWith('Right '));assert.deepEqual(left.map(r=>r.value),g.matrixRows(q.kron(q.Z,q.I)).map(r=>r.value));assert.deepEqual(right.map(r=>r.value),g.matrixRows(g.eye(4)).map(r=>r.value));});

test('one selected input agrees but another exposes the counterexample',()=>{const rows=(a:string)=>last('circuit-identities',{identity:'Z vs I',a,b:'0'}).rows!;for(const [a,overlap] of [['0',1],['+',0]] as const){close(Number(rows(a).find(r=>r.label==='Selected input: squared state overlap')!.value),overlap);close(Number(rows(a).find(r=>r.label==='Counterexample difference')!.value),2);}});
