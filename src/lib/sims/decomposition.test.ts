import test from 'node:test';
import assert from 'node:assert/strict';
import * as q from '../quantum.ts';
import * as g from './gate-lab.ts';
import { unitaryError } from './gates.ts';
import { twoLevel,parameterBound } from './decomposition.ts';

import { checkLabs,close,matrix } from './gate-lab-checks.ts';
await checkLabs(['decomposition']);
test('complex Givens decomposition reconstructs arbitrary example matrices with phases',()=>{
 for(let k=0;k<8;k++){const target=g.fullMatrix(2,[g.rotation('Y',23+k*15,0),g.rotation('X',71-k*8,1),g.cx(1,0),g.rotation('Z',17*k,0),g.cx(0,1)]);
  const dec=twoLevel(target);assert.ok(dec.length<=7);for(const f of dec)close(unitaryError(f.matrix),0);matrix(g.fullMatrix(2,dec),target);}
});
test('Givens factors are identity outside two basis states and parameter lower bound grows exponentially',()=>{const u=q.kron(q.H,q.H);for(const f of twoLevel(u).slice(1)){const changed=f.matrix.filter((r,i)=>r.some((z,j)=>q.abs(q.sub(z,q.c(+(i===j))))>1e-10));assert.equal(changed.length,2);}assert.equal(parameterBound(2),1);assert.ok(parameterBound(8)>4000);});

test('elementary synthesis reconstructs full complex matrices using only one-wire gates and CNOTs',async()=>{const {elementary}=await import('./decomposition.ts');for(let k=0;k<10;k++){const u=g.fullMatrix(2,[g.rotation('Y',31+k*17),g.rotation('X',17+k*11,1),g.cx(1,0),g.rotation('Z',77-k*9),g.rotation('Y',43,1),g.cx(0,1)]);const ops=elementary(twoLevel(u));assert.ok(ops.every(o=>o.wires.length===1||o.name.startsWith('CNOT')));matrix(g.fullMatrix(2,ops),u);}matrix(g.fullMatrix(2,elementary(twoLevel(g.SWAP))),g.SWAP);});

test('displayed exact bound and constructive counts retain precision and omit identity gates',async()=>{const {elementary,lab}=await import('./decomposition.ts');const ops=elementary(twoLevel(g.SWAP));assert.ok(ops.every(o=>g.matrixGap(o.matrix,g.eye(o.matrix.length))>1e-12));matrix(g.fullMatrix(2,ops),g.SWAP);const s=lab.run({example:'SWAP',mode:'Elementary gates',a:'0',b:'1'}).at(-1)!;assert.equal(s.rows!.find(r=>r.label==='Generic exact gate lower bound, 12 qubits')!.value,'1118481');assert.equal(s.rows!.find(r=>r.label==='Given target CNOT count')!.value,'3');assert.equal(+s.rows!.find(r=>r.label==='Constructive elementary gate count')!.value,ops.length);});
