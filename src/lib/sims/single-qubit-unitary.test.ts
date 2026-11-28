import test from 'node:test';
import { unitaryError } from './gates.ts';
import { u, euler } from './single-qubit-unitary.ts';

import { checkLabs,close,matrix,phase } from './gate-lab-checks.ts';
const {last}=await checkLabs(['single-qubit-unitary']);
test('Euler decomposition matches general U including phase',()=>{
 for(const t of [0,.71,Math.PI])for(const p of [-2,0,.8])for(const l of [-.9,0,1.7]){
  matrix(u(t,p,l),phase(euler(t,p,l),(p+l)/2));close(unitaryError(u(t,p,l)),0);
 }
});

test('lab distinguishes equality up to phase from entrywise equality',()=>{const rows=last('single-qubit-unitary',{theta:'0',phi:'90',lambda:'90'}).rows!;close(Number(rows.find(r=>r.label==='Difference before phase correction')!.value),Math.SQRT2,1e-5);close(Number(rows.find(r=>r.label==='U vs phase-adjusted Euler (max entry error)')!.value),0);});
