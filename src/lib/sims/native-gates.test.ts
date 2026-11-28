import test from 'node:test';
import * as q from '../quantum.ts';
import * as g from './gate-lab.ts';
import { nativeH, nativeCX,ecrCX } from './native-gates.ts';

import { checkLabs,matrix,phase } from './gate-lab-checks.ts';
await checkLabs(['native-gates']);
test('universality examples and native basis: exact global phase, including CX',()=>{
 matrix(phase(q.matMul(q.RY(Math.PI/2),q.RZ(Math.PI)),Math.PI/2),q.H);
 matrix(phase(g.fullMatrix(1,nativeH(0)),Math.PI/4),q.H);
 matrix(phase(g.fullMatrix(2,nativeCX(0,1)),Math.PI/2),g.control(q.X));
 matrix(g.fullMatrix(1,[g.gate('SX'),g.gate('SX')]),q.X);
});
test('ECR basis exactly implements CNOT',()=>matrix(g.fullMatrix(2,ecrCX()),g.control(q.X)));

test('X needs two SX in CZ example but is native in ECR example',async()=>{const {lab}=await import('./native-gates.ts');for(const [basis,n] of [['CZ',2],['ECR',1]] as const){const s=lab.run({basis,gate:'X',a:'0',b:'0'});if(s.length!==n+1||s.at(-1)!.state![2].re<.9999)throw Error('wrong X implementation');}});

test('arbitrary U uses two SX gates and three Z turns with the correct phase',async()=>{const {nativeU}=await import('./native-gates.ts');for(const t of [0,17,90,180])for(const p of [-40,0,55])for(const l of [0,76,180]){const [a,b,d]=[t,p,l].map(g.deg),expected=q.matMul(q.RZ(b),q.matMul(q.RY(a),q.RZ(d)));matrix(phase(g.fullMatrix(1,nativeU(t,p,l)),Math.PI/2),expected);}});
