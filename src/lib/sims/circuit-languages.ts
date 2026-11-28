import { choice,product,gate,cx,sequence,row,type Lab,type Op } from './gate-lab.ts';
export const code:Record<string,string>={'OpenQASM 3':'OPENQASM 3.0;\ninclude "stdgates.inc";\nqubit[2] q;\nbit[2] c;\nh q[0];\ncx q[0], q[1];\nc = measure q;',
'Qiskit (Python)':'from qiskit import QuantumCircuit\nqc = QuantumCircuit(2, 2)\nqc.h(0)\nqc.cx(0, 1)\nqc.measure([0, 1], [0, 1])',
'Cirq (Python)':'import cirq\na, b = cirq.LineQubit.range(2)\ncircuit = cirq.Circuit(cirq.H(a), cirq.CNOT(a,b), cirq.measure(a,b,key="m"))',
'Q#':'import Std.Intrinsic.*;\noperation Bell() : (Result, Result) {\n    use q = Qubit[2];\n    H(q[0]);\n    CNOT(q[0], q[1]);\n    let a = M(q[0]);\n    let b = M(q[1]);\n    ResetAll(q);\n    return (a, b);\n}'};
export function programOps(name:string):Op[]{
 return name==='Bell pair'?[gate('H'),cx(0,1)]:name==='CNOT before H'?[cx(0,1),gate('H')]:[gate('X',name==='X on q0'?0:1)];
}
export function renderCode(language:string,ops:Op[]):string{
 const format=(o:Op)=>{
  const [a,b]=o.wires, name=o.name.toLowerCase();
  if(language==='OpenQASM 3')return (b===undefined?name+' q['+a+']':'cx q['+a+'], q['+b+']')+';';
  if(language==='Qiskit (Python)')return 'qc.'+(b===undefined?name+'('+a+')':'cx('+a+', '+b+')');
  if(language==='Cirq (Python)')return b===undefined?'cirq.'+o.name+'('+['a','b'][a]+')':'cirq.CNOT('+['a','b'][a]+', '+['a','b'][b]+')';
  return '    '+o.name+'(q['+a+']'+(b===undefined?'':', q['+b+']')+');';
 };
 const lines=ops.map(format);
 if(language==='OpenQASM 3')return code[language].replace('h q[0];\ncx q[0], q[1];',lines.join('\n'));
 if(language==='Qiskit (Python)')return code[language].replace('qc.h(0)\nqc.cx(0, 1)',lines.join('\n'));
 if(language==='Cirq (Python)')return code[language].replace('cirq.H(a), cirq.CNOT(a,b)',lines.join(', '));
 return code[language].replace('operation Bell()', 'operation Example()').replace('    H(q[0]);\n    CNOT(q[0], q[1]);',lines.join('\n'));
}
export const lab:Lab={
 controls:[choice('language','Language',Object.keys(code)),choice('program','Circuit',['Bell pair','CNOT before H','X on q0','X on q1'])],
 run:v=>{const steps=sequence(product('0','0'),programOps(v.program),'The selected gates have the same mathematical meaning in each language. q0 is displayed first here.');steps[0].rows=[row('Code (illustrative, not executed here)',renderCode(v.language,programOps(v.program)))];if(v.program.startsWith('X on'))steps.at(-1)!.rows=[row('Lab q0-first result',v.program==='X on q0'?'10':'01'),row('Qiskit classical bit string',v.program==='X on q0'?'01':'10')];return steps}
};
