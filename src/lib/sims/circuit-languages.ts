import { choice,product,gate,cx,sequence,row,type Lab,type Op } from './gate-lab.ts';
export const code:Record<string,string>={'OpenQASM 3':'OPENQASM 3.0;\ninclude "stdgates.inc";\nqubit[2] q;\nbit[2] c;\nh q[0];\ncx q[0], q[1];\nc = measure q;',
'Qiskit (Python)':'from qiskit import QuantumCircuit\nqc = QuantumCircuit(2, 2)\nqc.h(0)\nqc.cx(0, 1)\nqc.measure([0, 1], [0, 1])',
'Cirq (Python)':'import cirq\na, b = cirq.LineQubit.range(2)\ncircuit = cirq.Circuit(cirq.H(a), cirq.CNOT(a,b), cirq.measure(a,b,key="m"))',
'Q#':'import Std.Intrinsic.*;\noperation Bell() : (Result, Result) {\n    use q = Qubit[2];\n    H(q[0]);\n    CNOT(q[0], q[1]);\n    let a = M(q[0]);\n    let b = M(q[1]);\n    ResetAll(q);\n    return (a, b);\n}'};
export function programOps(name:string):Op[]{
 return name==='Bell pair'?[gate('H'),cx(0,1)]:name==='CNOT before H'?[cx(0,1),gate('H')]:[gate('X',name==='X on q0'?0:1)];
}
// Parse only gate statements on these two wires. No user code is executed.
export function gateStatement(language:string,o:Op):string {
 const [a,b]=o.wires, name=o.name.toLowerCase();
 if(language==='OpenQASM 3')return (b===undefined?name+' q['+a+']':'cx q['+a+'], q['+b+']')+';';
 if(language==='Qiskit (Python)')return 'qc.'+(b===undefined?name+'('+a+')':'cx('+a+', '+b+')');
 if(language==='Cirq (Python)')return b===undefined?'cirq.'+o.name+'('+['a','b'][a]+')':'cirq.CNOT('+['a','b'][a]+', '+['a','b'][b]+')';
 return o.name+'(q['+a+']'+(b===undefined?'':', q['+b+']')+');';
}
export function parseStatements(language:string,source:string):Op[]{
 const lines=source.split(/\r?\n/).map((line,i)=>({line:line.trim(),number:i+1})).filter(x=>x.line);
 if(lines.length>12)throw Error('Use at most 12 gate statements.');
 return lines.map(({line,number})=>{
  let m:RegExpMatchArray|null, n:RegExpMatchArray|null;
  if(language==='OpenQASM 3'){
   m=line.match(/^([hxz])\s+q\[\s*([01])\s*\]\s*;$/);n=line.match(/^cx\s+q\[\s*([01])\s*\]\s*,\s*q\[\s*([01])\s*\]\s*;$/);
  }else if(language==='Qiskit (Python)'){
   m=line.match(/^qc\.([hxz])\(\s*([01])\s*\)$/);n=line.match(/^qc\.cx\(\s*([01])\s*,\s*([01])\s*\)$/);
  }else if(language==='Cirq (Python)'){
   m=line.match(/^cirq\.([HXZ])\(\s*([ab])\s*\),?$/);n=line.match(/^cirq\.CNOT\(\s*([ab])\s*,\s*([ab])\s*\),?$/);
  }else{
   m=line.match(/^([HXZ])\(\s*q\[\s*([01])\s*\]\s*\)\s*;$/);n=line.match(/^CNOT\(\s*q\[\s*([01])\s*\]\s*,\s*q\[\s*([01])\s*\]\s*\)\s*;$/);
  }
  const wire=(w:string)=>w==='a'?0:w==='b'?1:+w;
  if(m)return gate(m[1].toUpperCase(),wire(m[2]));
  if(n&&n[1]!==n[2])return cx(wire(n[1]),wire(n[2]));
  throw Error('Line '+number+': use H, X, Z or CNOT on distinct supported wires, in the selected syntax.');
 });
}
export function renderCode(language:string,ops:Op[]):string{
 const lines=ops.map(o=>gateStatement(language,o));
 if(language==='OpenQASM 3')return code[language].replace('h q[0];\ncx q[0], q[1];',lines.join('\n'));
 if(language==='Qiskit (Python)')return code[language].replace('qc.h(0)\nqc.cx(0, 1)',lines.join('\n'));
 if(language==='Cirq (Python)')return code[language].replace('cirq.H(a), cirq.CNOT(a,b), ',lines.length?lines.join(', ')+', ':'');
 return code[language].replace('operation Bell()', 'operation Example()').replace('    H(q[0]);\n    CNOT(q[0], q[1]);',lines.map(line=>'    '+line).join('\n'));
}
export function compileStatements(language:string,source:string){
 const ops=parseStatements(language,source);
 return {ops,code:renderCode(language,ops),state:sequence(product('0','0'),ops).at(-1)!.state!};
}
export const lab:Lab={
 controls:[choice('language','Language',Object.keys(code)),choice('program','Circuit',['Bell pair','CNOT before H','X on q0','X on q1'])],
 run:v=>{const steps=sequence(product('0','0'),programOps(v.program),'The selected gates have the same mathematical meaning in each language. q0 is displayed first here.');steps[0].rows=[row('Code (illustrative, not executed here)',renderCode(v.language,programOps(v.program)))];if(v.program.startsWith('X on'))steps.at(-1)!.rows=[row('Lab q0-first result',v.program==='X on q0'?'10':'01'),row('Qiskit classical bit string',v.program==='X on q0'?'01':'10')];return steps}
};
