import { choice,details,row,product,gate,cx,sequence,type Lab } from './gate-lab.ts';
export const storage=(n:number)=>16n*2n**BigInt(n);
// Open-boundary matrix-product states; count rectangular tensor slots, including zeros.
export const shapes=['Product','GHZ','Crossed Bell pairs','T product'];
export function bondDimension(n:number,k:number,shape:string){
 if(k===0||k===n||shape==='Product'||shape==='T product')return 1;
 return shape==='GHZ'?2:2**Math.min(k,n-k);
}
export const mpsSlots=(n:number,shape:string)=>Array.from({length:n},(_,k)=>2*bondDimension(n,k,shape)*bondDimension(n,k+1,shape)).reduce((a,b)=>a+b,0);
export const demonstration=(shape:string)=>sequence(product('0','0','0','0'),
 shape==='GHZ'?[gate('H'),cx(0,1),cx(1,2),cx(2,3)]:shape==='Crossed Bell pairs'?[gate('H'),gate('H',1),cx(0,2),cx(1,3)]:Array.from({length:4},(_,i)=>shape==='T product'?[gate('H',i),gate('T',i)]:[gate('H',i)]).flat(),
 'The four-qubit example uses the same state pattern; memory is calculated for the selected qubit count.');
export function memory(n:number,shape:string){return {dense:storage(n),mps:16n*BigInt(mpsSlots(n,shape)),bond:bondDimension(n,Math.floor(n/2),shape),stabilizer:shape!=='T product'};}

export const lab:Lab={
 controls:[choice('n','Number of qubits',['10','20','30','40','50']),choice('shape','Example on four qubits',shapes)],
 run:v=>{const n=+v.n;const m=memory(n,v.shape);return [details('Dense storage','Assuming two 64-bit floats per complex amplitude. This is a calculated memory cost, not a measured machine limit.',[row('Complex amplitudes',(2n**BigInt(n)).toString()),row('Memory',storage(n).toString()+' bytes ('+(n>=40?Number(storage(n))/2**50+' PiB':n>=30?Number(storage(n))/2**30+' GiB':Number(storage(n))/2**20+' MiB')+')'),row('If a stabilizer state: generator entries',m.stabilizer?2*n*n+' binary positions + '+n+' signs (n generators)':'Not a stabilizer state'),row(v.shape+' MPS bond dimension',m.bond),row(v.shape+' MPS complex slots (including zeros)',mpsSlots(n,v.shape))]),...demonstration(v.shape)]}
};
