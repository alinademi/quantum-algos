import { choice, bits, bstate, product, ccx, cx, sequence, type Lab } from './gate-lab.ts';
export const lab:Lab={
 controls:[choice('mode','Gate',['Toffoli','SWAP via CNOTs']),choice('start','Input bits',['110',...bits(3).filter(x=>x!=='110')])],
 run:v=>sequence(bstate(v.start),v.mode==='Toffoli'?[ccx(0,1,2),ccx(0,1,2)]:[cx(0,1),cx(1,0),cx(0,1)],v.mode==='Toffoli'?'Toffoli applied twice returns the start.':'The first two bits have exchanged places.')
};
