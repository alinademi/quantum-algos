import { fromBloch,tensor } from '../quantum.ts';
import { choice, ket, angles, deg, control, SWAP, op, gate, sequence, distribution, probability,fidelity,row,type Lab } from './gate-lab.ts';
export const lab:Lab={
 controls:[choice('a','First pure state',['0','1','+','+i']),choice('theta','Second polar angle (degrees)',['90',...angles.filter(x=>x!=='90')]),choice('phi','Second azimuth (degrees)',['0','45','90','180'])],
 run:v=>{const a=ket(v.a),b=fromBloch(deg(v.theta),deg(v.phi)),s=sequence(tensor(ket('0'),tensor(a,b)),[gate('H'),op('Controlled SWAP',control(SWAP),0,1,2),gate('H')],'Measure q0 only. Its expectation equals the squared overlap of the two pure states.');const p=probability(s.at(-1)!.state!,0);s.push({...distribution('Measure only helper q0','Every shot starts from a fresh pair of states and a fresh helper.',['0','1'],[1-p,p],[row('2 P(helper=0) − 1',1-2*p),row('Squared overlap',fidelity(a,b))]),start:'|0⟩ |'+v.a+'⟩ and second state at θ='+v.theta+'°, φ='+v.phi+'°'});return s}
};
