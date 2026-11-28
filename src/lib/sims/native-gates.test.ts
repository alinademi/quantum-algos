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
