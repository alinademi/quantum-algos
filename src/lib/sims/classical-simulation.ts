import { choice,details,row,product,gate,cx,sequence,type Lab } from './gate-lab.ts';
export const storage=(n:number)=>16n*2n**BigInt(n);
// Open-boundary matrix-product states; count rectangular tensor slots, including zeros.
export const mpsSlots=(n:number,shape:string)=>shape==='Product'?2*n:8*n-8;
export const lab:Lab={
 controls:[choice('n','Number of qubits',['10','20','30','40','50']),choice('shape','Example on four qubits',['Product','GHZ'])],
 run:v=>{const n=+v.n;const ops=v.shape==='Product'?[gate('H'),gate('H',1),gate('H',2),gate('H',3)]:[gate('H'),cx(0,1),cx(1,2),cx(2,3)];return [details('Dense storage','Assuming two 64-bit floats per complex amplitude. This is a calculated memory cost, not a measured machine limit.',[row('Complex amplitudes',(2n**BigInt(n)).toString()),row('Memory',storage(n).toString()+' bytes ('+(n>=40?Number(storage(n))/2**50+' PiB':n>=30?Number(storage(n))/2**30+' GiB':Number(storage(n))/2**20+' MiB')+')'),row('If a stabilizer state: generator entries',2*n*n+' binary positions + '+n+' signs (n generators)'),row(v.shape+' MPS bond dimension',v.shape==='Product'?1:2),row(v.shape+' MPS complex slots (including zeros)',mpsSlots(n,v.shape))]),...sequence(product('0','0','0','0'),ops,v.shape==='Product'?'This product state is described by four single-qubit states.':'This GHZ state has only two nonzero amplitudes; it also has a compact stabilizer and MPS description.')]}
};
