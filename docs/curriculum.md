# Curriculum draft

Source of truth for The Map. Regions say what a stop is. Lines say the order to learn in. A stop can sit on many lines.

`Needs` lists stops to learn first. A need on another line is a transfer. Open now: `superposition`. Everything else: coming soon.

## Foundations (`foundations`)

| id | Stop | Needs |
|---|---|---|
| qubit | Qubit | |
| superposition | Superposition | qubit |
| measurement | Measurement | superposition |
| bloch | Bloch sphere | superposition |
| phase | Phase | bloch |
| interference | Interference | phase |
| multi-qubit | Many qubits | superposition |
| entanglement | Entanglement | measurement, multi-qubit |
| bell-test | Bell test (CHSH) | entanglement |
| no-cloning | No-cloning | multi-qubit, measurement |
| mixed-states | Mixed states | measurement, entanglement |

## Gates and circuits (`circuits`)

| id | Stop | Needs |
|---|---|---|
| pauli | Pauli gates | bloch |
| hadamard | Hadamard | superposition |
| phase-gates | Phase gates | phase |
| rotations | Rotation gates | pauli |
| cnot | CNOT | multi-qubit, pauli |
| bell-states | Bell states | cnot, hadamard, entanglement |
| toffoli | Toffoli and SWAP | cnot |
| circuits | Reading a circuit | hadamard, cnot |
| universal | Universal gate sets | hadamard, phase-gates, rotations, cnot |
| oracles | Oracles | circuits, toffoli |
| phase-kickback | Phase kickback | hadamard, phase-gates, cnot |

## Algorithms (`algorithms`)

| id | Stop | Needs |
|---|---|---|
| deutsch | Deutsch | oracles, phase-kickback, interference |
| deutsch-jozsa | Deutsch-Jozsa | deutsch |
| bernstein-vazirani | Bernstein-Vazirani | deutsch-jozsa |
| simon | Simon | bernstein-vazirani |
| qft | Quantum Fourier transform | hadamard, phase-gates, cnot, interference |
| phase-estimation | Quantum phase estimation | qft, phase-kickback |
| shor | Shor | phase-estimation |
| grover | Grover | oracles, phase-kickback, interference |
| amplitude-amplification | Amplitude amplification | grover |
| quantum-counting | Quantum counting | grover, phase-estimation |
| hhl | HHL (linear systems) | phase-estimation, simulation |
| quantum-walks | Quantum walks | interference, circuits |
| simulation | Simulating physics | rotations, circuits |
| variational | Variational circuits | rotations, circuits |
| vqe | VQE | variational |
| qaoa | QAOA | variational |

12 algorithms plus 4 building blocks: QFT, phase estimation, amplitude amplification, variational circuits.

## Protocols and crypto (`protocols`)

| id | Stop | Needs |
|---|---|---|
| teleportation | Teleportation | bell-states, measurement |
| superdense | Superdense coding | bell-states |
| bb84 | BB84 | hadamard, measurement, no-cloning |
| e91 | E91 | bell-states, bell-test, bb84 |
| qkd | QKD in practice | bb84 |
| rsa | Why RSA and ECC are at risk | shor |
| post-quantum | Post-quantum crypto | rsa |

## Hardware and machines (`hardware`)

| id | Stop | Needs |
|---|---|---|
| decoherence | Decoherence | phase, mixed-states |
| superconducting | Superconducting qubits | decoherence |
| cryogenics | Dilution refrigerators | superconducting |
| trapped-ions | Trapped ions | decoherence |
| neutral-atoms | Neutral atoms | decoherence |
| photonic | Photonic qubits | decoherence |
| spin-qubits | Spin qubits | decoherence |
| annealing | Quantum annealing | decoherence |
| error-correction | Error correction | decoherence, cnot, no-cloning |
| surface-code | Surface code | error-correction |
| logical-qubits | Logical qubits | surface-code |
| nisq | NISQ era | decoherence, circuits |

## Industry and business (`industry`)

Every fact here needs a source before it ships.

| id | Stop | Needs |
|---|---|---|
| advantage | Quantum advantage | nisq |
| cloud | Real hardware in the cloud | circuits |
| use-cases | Where it may help | advantage, simulation |
| hype | Hype or real? | advantage |
| roadmaps | Roadmaps | logical-qubits |
| careers | Careers in quantum | use-cases |

## Lines

| Line | Stops in order |
|---|---|
| First steps | qubit, superposition, measurement, bloch, phase, interference, multi-qubit, entanglement |
| Circuit builder | pauli, hadamard, phase-gates, rotations, cnot, circuits, toffoli, universal |
| Oracle problems | oracles, phase-kickback, deutsch, deutsch-jozsa, bernstein-vazirani, simon |
| Search | oracles, phase-kickback, grover, amplitude-amplification, quantum-counting |
| Road to Shor | simon, qft, phase-estimation, shor, rsa, post-quantum |
| Quantum communication | entanglement, bell-states, teleportation, superdense |
| Secret keys | no-cloning, bb84, qkd, bell-test, e91 |
| Build a machine | mixed-states, decoherence, superconducting, cryogenics, trapped-ions, neutral-atoms, photonic, spin-qubits, annealing, error-correction, surface-code, logical-qubits |
| Near term | nisq, variational, vqe, qaoa, advantage |
| More algorithms | quantum-walks, simulation, hhl |
| Quantum at work | cloud, use-cases, hype, roadmaps, careers |

Off-line stops: none.

## Words (A to Z)

Most stop titles are also words. Stops that are not words: rsa, cloud, use-cases, hype, roadmaps, careers.

Extra words, each gets a page:

amplitude, ancilla, basis, Born rule, classical bit, Clifford gates, coherence time, collapse, controlled gate, density matrix, eigenstate, error rate, expectation value, fidelity, gate, Hamiltonian, Hilbert space, ket (bra-ket notation), observable, physical qubit, quantum register, shot, syndrome, tensor product, threshold, unitary.

## Open questions

- Does the owner's list of 11 algorithms match the 12 above?
- Industry stops need sources and a review before any copy is written.
