import { choice,details,row,distribution,type Lab } from './gate-lab.ts';
import { evolveGenerators,prep,format,type Signed } from './stabilizer-states.ts';
// Binary symplectic encoding. Solve for a product of commuting generators by XOR elimination.
const encoding=(p:string)=>[...p].flatMap(x=>[+(x==='X'||x==='Y'),+(x==='Z'||x==='Y')]);
const xor=(a:number[],b:number[])=>a.map((x,i)=>x^b[i]);
const table:Record<string,[string,number]>={XY:['Z',1],YZ:['X',1],ZX:['Y',1],YX:['Z',3],ZY:['X',3],XZ:['Y',3]};
export function expect(gens:Signed[],query:string):number{
 const n=gens.length;const rows=gens.map((g,i)=>({v:encoding(g.p),comb:Array.from({length:n},(_,j)=>+(i===j))}));let target=encoding(query),comb=Array(n).fill(0);
 for(let col=0,r=0;col<target.length&&r<n;col++){const k=rows.findIndex((x,i)=>i>=r&&x.v[col]);if(k<0)continue;[rows[r],rows[k]]=[rows[k],rows[r]];for(let j=r+1;j<n;j++)if(rows[j].v[col])rows[j]={v:xor(rows[j].v,rows[r].v),comb:xor(rows[j].comb,rows[r].comb)};if(target[col]){target=xor(target,rows[r].v);comb=xor(comb,rows[r].comb)}r++;}
 if(target.some(Boolean))return 0;
 const p=Array(query.length).fill('I');let phase=0;
 gens.forEach((g,i)=>{if(!comb[i])return;if(g.sign<0)phase+=2;[...g.p].forEach((q,j)=>{if(q==='I')return;if(p[j]==='I')p[j]=q;else if(p[j]===q)p[j]='I';else {const [letter,k]=table[p[j]+q];p[j]=letter;phase+=k;}})});
 if(p.join('')!==query||phase%2)throw Error('bad stabilizer product');return phase%4===0?1:-1;
}
export const lab:Lab={
 controls:[choice('n','Qubits',['8','16','32','64']),choice('state','Clifford preparation',['GHZ','Product plus','Signed example']),choice('query','Measure Pauli',['Z on first','X on first','Z on first two','All X'])],
 run:v=>{const n=+v.n,ops=prep(n,v.state),gens=evolveGenerators(n,ops);const query=v.query==='All X'?'X'.repeat(n):v.query==='Z on first two'?'ZZ'+'I'.repeat(n-2):(v.query==='X on first'?'X':'Z')+'I'.repeat(n-1);const e=expect(gens,query);return [details('Track generators, not amplitudes','Each gate conjugates the signed Pauli generators. The browser never allocates a state vector here.',[row('Qubits',n),row('Generator bits (x,z, before signs)',2*n*n),row('Dense amplitude count',(2n**BigInt(n)).toString()),...gens.slice(0,8).map((g,i)=>row('Generator '+i,format(g)))]),distribution('Pauli measurement','The exact expectation is 0 unless the signed Pauli is in the stabilizer group.', ['+1','−1'],[(1+e)/2,(1-e)/2],[row('Observable',query),row('Expectation',e)])]}
};
