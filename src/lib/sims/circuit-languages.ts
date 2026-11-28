import { choice,product,gate,cx,sequence,row,type Lab } from './gate-lab.ts';
export const code:Record<string,string>={'OpenQASM 3':'OPENQASM 3.0;\ninclude "stdgates.inc";\nqubit[2] q;\nbit[2] c;\nh q[0];\ncx q[0], q[1];\nc = measure q;',
'Qiskit (Python)':'from qiskit import QuantumCircuit\nqc = QuantumCircuit(2, 2)\nqc.h(0)\nqc.cx(0, 1)\nqc.measure([0, 1], [0, 1])',
'Cirq (Python)':'import cirq\na, b = cirq.LineQubit.range(2)\ncircuit = cirq.Circuit(cirq.H(a), cirq.CNOT(a,b), cirq.measure(a,b,key="m"))',
'Q#':'import Std.Intrinsic.*;\noperation Bell() : (Result, Result) {\n    use q = Qubit[2];\n    H(q[0]);\n    CNOT(q[0], q[1]);\n    let a = M(q[0]);\n    let b = M(q[1]);\n    ResetAll(q);\n    return (a, b);\n}'};
export const lab:Lab={
 controls:[choice('language','Language',Object.keys(code))],
 run:v=>{const steps=sequence(product('0','0'),[gate('H'),cx(0,1)],'The Bell circuit has the same state before measurement in every language.');steps[0].rows=[row('Code (illustrative, not executed here)',code[v.language])];return steps}
};
