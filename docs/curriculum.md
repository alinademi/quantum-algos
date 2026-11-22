# Curriculum draft

Source of truth for The Map. Regions say what a stop is. Lines say the order to learn in. A stop can sit on many lines, or none.

`Needs` lists stops to learn first. Open now: `superposition`. Everything else: coming soon.

## Foundations (`foundations`)

| id | Stop | Needs |
|---|---|---|
| qubit | Qubit | |
| superposition | Superposition | qubit |
| measurement | Measurement | superposition |
| bloch | Bloch sphere | superposition |
| phase | Phase | bloch |
| interference | Interference | phase |
| multi-qubit | Many qubits | qubit |
| entanglement | Entanglement | measurement, multi-qubit |
| no-cloning | No-cloning | superposition, measurement |
| mixed-states | Mixed states | measurement, entanglement |

## Gates and circuits (`circuits`)

| id | Stop | Needs |
|---|---|---|
| pauli | Pauli gates | bloch |
| hadamard | Hadamard | superposition |
| phase-gates | Phase gates | phase |
| rotations | Rotation gates | bloch |
| cnot | CNOT | multi-qubit, pauli |
| bell-states | Bell states | cnot, hadamard, entanglement |
| toffoli | Toffoli and SWAP | cnot |
| circuits | Reading a circuit | hadamard, cnot |
| universal | Universal gate sets | phase-gates, rotations, cnot |
| oracles | Oracles | circuits |

## Algorithms (`algorithms`)

| id | Stop | Needs |
|---|---|---|
| deutsch | Deutsch | oracles, interference |
| deutsch-jozsa | Deutsch-Jozsa | deutsch |
| bernstein-vazirani | Bernstein-Vazirani | deutsch-jozsa |
| simon | Simon | bernstein-vazirani |
| qft | Quantum Fourier transform | phase-gates, interference |
| phase-estimation | Phase estimation | qft |
| shor | Shor | phase-estimation |
| grover | Grover | oracles, interference |
| amplitude-amplification | Amplitude amplification | grover |
| quantum-counting | Quantum counting | grover, phase-estimation |
| hhl | HHL | phase-estimation |
| quantum-walks | Quantum walks | interference, circuits |
| simulation | Simulating physics | rotations, circuits |
| variational | Variational circuits | rotations, circuits |
| vqe | VQE | variational |
| qaoa | QAOA | variational |

15 algorithms plus 1 building block (variational circuits).

## Protocols and crypto (`protocols`)

| id | Stop | Needs |
|---|---|---|
| teleportation | Teleportation | bell-states, measurement |
| superdense | Superdense coding | bell-states |
| bb84 | BB84 | measurement, no-cloning |
| e91 | E91 | entanglement, bb84 |
| qkd | QKD in practice | bb84 |
| rsa | Why RSA is at risk | shor |
| post-quantum | Post-quantum crypto | rsa |

## Hardware and machines (`hardware`)

| id | Stop | Needs |
|---|---|---|
| decoherence | Decoherence | phase, measurement |
| superconducting | Superconducting qubits | decoherence |
| cryogenics | Dilution refrigerators | superconducting |
| trapped-ions | Trapped ions | decoherence |
| neutral-atoms | Neutral atoms | decoherence |
| photonic | Photonic qubits | decoherence |
| spin-qubits | Spin qubits | decoherence |
| error-correction | Error correction | decoherence, cnot |
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
| Circuit builder | pauli, hadamard, phase-gates, rotations, cnot, toffoli, circuits, universal |
| Road to Shor | interference, qft, phase-estimation, shor, rsa, post-quantum |
| Search | oracles, deutsch, deutsch-jozsa, bernstein-vazirani, simon, grover, amplitude-amplification, quantum-counting |
| Sending qubits | entanglement, bell-states, teleportation, superdense |
| Secret keys | no-cloning, bb84, e91, qkd, post-quantum |
| Build a machine | decoherence, superconducting, cryogenics, trapped-ions, neutral-atoms, photonic, spin-qubits, error-correction, surface-code, logical-qubits |
| Near term | variational, vqe, qaoa, nisq, advantage |
| Quantum at work | cloud, use-cases, hype, roadmaps, careers |

Off-line stops (in a region, on no line yet): mixed-states, hhl, quantum-walks, simulation.

## Words (A to Z)

Every stop title is a word. Extra words, each gets a page:

amplitude, ancilla, basis, Born rule, coherence time, controlled gate, eigenstate, fidelity, gate, Hamiltonian, Hilbert space, logical qubit, oracle, physical qubit, qubit register, tensor product, unitary.

## Open questions

- Does the owner's list of 11 algorithms match the 15 above?
- Industry stops need sources and a review before any copy is written.
