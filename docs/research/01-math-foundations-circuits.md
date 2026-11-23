# Research 01: Math, Foundations, Gates and circuits

Slice: every stop a full A to Z site could have in three regions. 140 stops: Math 36 (new region), Foundations 51, Gates and circuits 53. All 22 existing stops in this slice keep their ids. `decoherence` is an existing id from Hardware; it is listed here as decoherence physics (see note under Foundations).

How to read:

- **Needs**: ids to learn first. Ids may live in other regions (`teleportation`, `simulation`, `annealing`). For existing stops, `+id` marks a need I suggest adding; the rest is the current draft.
- **Level**: Beginner, Intermediate, Advanced. A stop never needs a stop with a higher level.
- **Sources**, short names:
  - N&C: Nielsen and Chuang, *Quantum Computation and Quantum Information*, 10th anniv. ed. Section, box, exercise or appendix number.
  - Watrous U1 to U4: John Watrous, *Understanding Quantum Information and Computation* (IBM Quantum Learning courses; book at arXiv:2507.11536). U1 Basics of quantum information, U2 Fundamentals of quantum algorithms, U3 General formulation of quantum information. Lesson name follows.
  - Qiskit TB: Qiskit Textbook (legacy, github.com/Qiskit/textbook). Chapter.section, e.g. 1.4 Single qubit gates, 2.4 More circuit identities.
  - MS Katas: Microsoft Quantum Katas. Lowercase names are in github.com/microsoft/qsharp `katas/content`; CamelCase names are in the archived github.com/microsoft/QuantumKatas.
  - Preskill: Ph219 lecture notes, chapter.
  - de Wolf: *Quantum Computing: Lecture Notes*, arXiv:1907.09415 (v5).
  - Aaronson: *Introduction to Quantum Information Science* notes (scottaaronson.com/qclec.pdf), lecture number.
  - FLP III: Feynman Lectures on Physics, Vol. III. S&N: Sakurai and Napolitano, *Modern Quantum Mechanics*. SEP: Stanford Encyclopedia of Philosophy. MIT 18.06: Strang, Linear Algebra, MIT OpenCourseWare.

## Math toolkit (`math`, new region)

| id | Stop | Needs | Level | Scope | Sources |
|---|---|---|---|---|---|
| binary | Bits and binary | | Beginner | Count in base 2, read bit strings, and use XOR and the dot product mod 2. | Qiskit TB 1.2 |
| powers-and-logs | Powers and logs | binary | Beginner | See why n bits give 2^n patterns, and use log base 2 to undo that. | Qiskit TB 1.5; Khan Academy, Logarithms |
| probability | Probability | | Beginner | Use outcomes, odds that sum to 1, independence, conditional odds, averages and spread. | N&C App. 1; Watrous U1 Single systems |
| stochastic-matrices | Random processes as matrices | probability, matrices | Intermediate | Write coin flips and random steps as probability vectors and stochastic matrices, the classical twin of quantum states. | Watrous U1 Single systems; N&C 8.1 |
| trigonometry | Angles and trig | | Beginner | Use radians, the unit circle, sine, cosine and half-angle forms. | Khan Academy, Trigonometry |
| complex-numbers | Complex numbers | | Beginner | Add, multiply and conjugate complex numbers and find their size (modulus). | MS Katas complex_arithmetic; Khan Academy, Complex numbers |
| euler-formula | Polar form and Euler's formula | complex-numbers, trigonometry | Intermediate | Write a complex number as size and angle, r e^{iθ}, and see why multiplying adds angles. | MS Katas complex_arithmetic |
| roots-of-unity | Roots of unity | euler-formula | Intermediate | Place the N points e^{2πik/N} on the circle and show they sum to zero, the core of Fourier sums. | de Wolf ch. 4; N&C 5.1 |
| vectors | Vectors | | Beginner | Write a list of numbers as a column, add and scale vectors, and find their length. | MS Katas linear_algebra; MIT 18.06 |
| vector-spaces | Vector spaces and bases | vectors, complex-numbers | Intermediate | Use linear combinations, span, linear independence, basis and dimension over the complex numbers. | N&C 2.1.1; de Wolf App. A |
| dirac-notation | Bra-ket notation | vectors, complex-numbers | Beginner | Read and write kets like \|0⟩, \|+⟩ and \|ψ⟩, and bras as their conjugate rows. | N&C 2.1; Qiskit TB App. Linear algebra |
| inner-product | Inner product | dirac-notation, vector-spaces | Intermediate | Compute ⟨a\|b⟩, norms and orthogonality, build orthonormal bases, and meet Cauchy-Schwarz. | N&C 2.1.4; Watrous U1 Quantum circuits |
| outer-product | Outer product and completeness | inner-product, matrices | Intermediate | Build matrices as \|a⟩⟨b\|, and write the identity as a sum over any orthonormal basis. | N&C 2.1.4; MS Katas linear_algebra |
| matrices | Matrices | vectors | Beginner | Multiply a matrix by a vector and by another matrix, and use identity, transpose and inverse. | MS Katas linear_algebra; MIT 18.06 |
| linear-maps | Linear maps and change of basis | matrices, vector-spaces | Intermediate | See a matrix as a map, and rewrite vectors and matrices in a new basis. | N&C 2.1.2; MIT 18.06 |
| conjugate-transpose | Conjugate transpose (dagger) | matrices, complex-numbers | Intermediate | Flip and conjugate a matrix to get its adjoint A†, and use (AB)† = B†A†. | N&C 2.1.6; MS Katas linear_algebra |
| eigen | Eigenvalues and eigenvectors | matrices, complex-numbers | Intermediate | Find the vectors a matrix only scales, and the scale factors, starting with 2 by 2 cases. | N&C 2.1.5; MS Katas linear_algebra; MIT 18.06 |
| unitary-matrices | Unitary matrices | conjugate-transpose, inner-product | Intermediate | Show that U†U = I keeps lengths and angles, so every unitary can be undone. | N&C 2.1.6; Watrous U1 Single systems |
| hermitian-matrices | Hermitian matrices | conjugate-transpose, eigen | Intermediate | Show that H = H† has real eigenvalues and orthogonal eigenvectors. | N&C 2.1.6 |
| projectors | Projectors | outer-product, hermitian-matrices | Intermediate | Use P = P² = P† to keep only the part of a vector that lies in a subspace. | N&C 2.1.6; Watrous U1 Quantum circuits |
| spectral-theorem | Spectral decomposition | eigen, unitary-matrices, projectors | Intermediate | Write a normal matrix as eigenvalues times projectors, and diagonalize it with a unitary. | N&C 2.1.6 (Thm 2.1); de Wolf App. A |
| matrix-functions | Functions of matrices | spectral-theorem, euler-formula | Intermediate | Apply a function through the eigenvalues, mainly e^{-iHt}, and show e^{iθX} = cos θ I + i sin θ X. | N&C 2.1.8, Ex. 2.35 |
| commutators | Commutators | matrices, eigen | Intermediate | Compute [A,B] and {A,B}, learn the Pauli rules, and see when two matrices share eigenvectors. | N&C 2.1.9 |
| trace | Trace | matrices | Intermediate | Sum the diagonal, use tr(AB) = tr(BA), and see that the trace does not depend on the basis. | N&C 2.1.8; de Wolf App. A |
| tensor-product | Tensor product | vectors, matrices, dirac-notation | Intermediate | Combine vectors and matrices with the Kronecker product, and see the size double with each qubit. | N&C 2.1.7; MS Katas linear_algebra; Watrous U1 Multiple systems |
| positive-matrices | Positive semidefinite matrices | hermitian-matrices | Intermediate | Spot Hermitian matrices with no negative eigenvalues, the kind density matrices and measurement parts must be. | N&C 2.1.6; Watrous U3 Density matrices |
| svd-polar | Singular value and polar decomposition | spectral-theorem, positive-matrices | Advanced | Factor any matrix as U Σ V†, the tool behind the Schmidt decomposition. | N&C 2.1.10; de Wolf App. A |
| matrix-norms | Matrix norms | svd-polar, trace | Advanced | Measure the size of a matrix with the operator and trace norms, used for gate error and closeness of states. | N&C 9.2; Watrous, *Theory of Quantum Information* (2018) ch. 1 |
| spherical-coordinates | Spherical coordinates | trigonometry | Intermediate | Place a point on a sphere with two angles, the map behind the Bloch sphere. | N&C 1.2 (eq. 1.4) |
| su2 | SU(2) and 3D rotations | unitary-matrices, matrix-functions, bloch | Advanced | See why each one-qubit unitary turns the Bloch sphere, and why a 360 degree turn gives a minus sign. | S&N 3.3; N&C 4.2 |
| modular-arithmetic | Modular arithmetic and gcd | | Intermediate | Work mod N, find gcds with Euclid's algorithm, and find the order (period) of a number mod N. | N&C App. 4; de Wolf ch. 5 |
| groups | Groups | matrices, modular-arithmetic | Intermediate | Use closure, identity, inverses, cyclic groups and subgroups, with Pauli and mod N examples. | N&C App. 2; de Wolf ch. 6 |
| gf2 | Linear algebra mod 2 | binary, matrices | Intermediate | Solve linear equations over bits with XOR, as needed for Simon's problem and stabilizer tables. | de Wolf ch. 3; Aaronson and Gottesman 2004 (PRA 70, 052328) |
| continued-fractions | Continued fractions | modular-arithmetic | Advanced | Turn a measured fraction into the best nearby small fraction, the last classical step of Shor. | N&C App. 4; de Wolf ch. 5 |
| discrete-fourier | Discrete Fourier transform | roots-of-unity, unitary-matrices | Intermediate | Turn a list into its frequencies with the DFT matrix, see that it is unitary, and meet the FFT. | de Wolf ch. 4; N&C 5.1 |
| big-o | Big-O and cost | powers-and-logs | Intermediate | Compare how cost grows with input size, and tell polynomial from exponential growth. | N&C 3.2.1; de Wolf App. B |

## Foundations (`foundations`)

Note: `decoherence` is in Hardware today. The slice asked for decoherence physics here. I suggest moving the id to Foundations (physics: leaking information to the surroundings) and letting Hardware keep T1, T2 and machine numbers under their own ids. Pick one home before merge so the id is not doubled.

| id | Stop | Needs | Level | Scope | Sources |
|---|---|---|---|---|---|
| probabilistic-bits | Bits and coins | probability, binary | Beginner | Describe a random bit with a probability vector, the classical picture that a qubit extends. | Watrous U1 Single systems |
| double-slit | Double slit | | Beginner | Watch single particles land one dot at a time and build stripes that vanish when the path is recorded. | FLP III ch. 1; Tonomura et al. 1989 (Am. J. Phys. 57, 117) |
| qubit | Qubit | | Beginner | Meet the qubit as a two-level system with states \|0⟩ and \|1⟩, and compare it with a bit. | N&C 1.2; Watrous U1 Single systems; MS Katas qubit |
| superposition | Superposition | qubit | Beginner | Write a state as a\|0⟩ + b\|1⟩ with amplitudes that can be negative or complex, which is not a mix. | N&C 1.2; Qiskit TB 1.3; de Wolf 1.2 |
| measurement | Measurement | superposition, +probability | Beginner | Get one outcome with odds \|amplitude\|² (Born rule), and see the state jump to that outcome. | N&C 2.2.3; de Wolf 1.2; MS Katas single_qubit_measurements |
| quantum-random | Quantum coin flips | measurement | Beginner | Make true random bits by measuring \|+⟩, and compare them with pseudo-random numbers. | MS Katas random_numbers; Herrero-Collantes and Garcia-Escartin 2017 (RMP 89, 015004) |
| polarization | Photon polarization | qubit | Beginner | Use polarizing filters to see measurement in a basis, including the three-filter surprise. | FLP III 11-4; Berkeley CS191 notes |
| stern-gerlach | Stern-Gerlach | qubit | Beginner | Send atoms through magnets to see spin give only two results, and later results depend on earlier ones. | S&N 1.1; FLP III ch. 5 to 6 |
| bloch | Bloch sphere | superposition | Beginner | Draw any one-qubit pure state as a point on a sphere with two angles. | N&C 1.2; Qiskit TB 1.3; Aaronson Lec 7 |
| phase | Phase | bloch | Beginner | Tell global phase (no effect) from relative phase (changes results in other bases). | N&C 2.2.7; Qiskit TB 1.4 |
| interference | Interference | phase | Beginner | See amplitudes add or cancel, so two ways to reach an outcome can wipe it out. | FLP III ch. 1; de Wolf 1.2 |
| bases | Measuring in other bases | measurement, bloch | Intermediate | Measure in the X, Y or any basis, and see that results depend on the basis you pick. | N&C 1.3.3; MS Katas single_qubit_measurements |
| mach-zehnder | Mach-Zehnder interferometer | interference | Intermediate | Send one photon through two beam splitters and see it always leave by one port, until a path is marked. | Schumacher and Westmoreland ch. 2; Wikipedia "Mach-Zehnder interferometer" |
| bomb-tester | Elitzur-Vaidman bomb tester | mach-zehnder, measurement | Intermediate | Find a working bomb without setting it off: an interaction-free measurement. | Elitzur and Vaidman 1993 (Found. Phys. 23, 987); Aaronson Lec 4; Kwiat et al. 1995 (PRL 74, 4763) |
| quantum-zeno | Quantum Zeno effect | measurement, bloch | Intermediate | Freeze a slowly turning qubit by measuring it often. | Misra and Sudarshan 1977 (J. Math. Phys. 18, 756); Itano et al. 1990 (PRA 41, 2295); Aaronson Lec 4 |
| multi-qubit | Many qubits | superposition | Beginner | Write states of n qubits with 2^n amplitudes, and learn the bit order (endianness) rules. | N&C 1.2.1; MS Katas multi_qubit_systems; Watrous U1 Multiple systems |
| partial-measurement | Measuring part of a system | multi-qubit, measurement | Intermediate | Measure one qubit of many and work out the odds and the state left behind. | Watrous U1 Multiple systems; MS Katas multi_qubit_measurements |
| entanglement | Entanglement | measurement, multi-qubit | Beginner | Find states that cannot be split into one state per qubit, and see their linked results. | N&C 2.2.8; Watrous U1 Multiple systems; Qiskit TB 2.2 |
| epr | EPR paradox | entanglement | Intermediate | Follow the 1935 argument that quantum theory is incomplete, and the idea of hidden variables. | Einstein, Podolsky, Rosen 1935 (Phys. Rev. 47, 777); SEP "The Einstein-Podolsky-Rosen Argument" |
| bell-test | Bell test (CHSH) | entanglement, +epr, +probability | Intermediate | Play the CHSH game: classical players win at most 75%, entangled ones about 85% (Tsirelson bound). | N&C 2.6; Watrous U1 Entanglement in action; MS Katas CHSHGame |
| ghz-w | GHZ and W states | entanglement | Intermediate | Meet two kinds of three-qubit entanglement that local actions cannot turn into each other. | Dür, Vidal, Cirac 2000 (PRA 62, 062314); Greenberger et al. 1990 (Am. J. Phys. 58, 1131) |
| ghz-paradox | GHZ game | bell-test, ghz-w | Intermediate | Use three entangled qubits to win a game every time that classical players must sometimes lose. | Mermin 1990 (Physics Today 43(6), 9); MS Katas GHZGame |
| contextuality | Contextuality and the magic square | bell-test, observables | Advanced | See why results cannot all be fixed in advance even without distance (Kochen-Specker), with the Mermin-Peres square. | Kochen and Specker 1967 (J. Math. Mech. 17, 59); Mermin 1990 (PRL 65, 3373); MS Katas MagicSquareGame |
| no-signaling | No faster-than-light messages | entanglement, mixed-states | Intermediate | Show that measuring one half of an entangled pair cannot send a message to the other half. | Preskill ch. 4; Wikipedia "No-communication theorem" |
| no-cloning | No-cloning | multi-qubit, measurement | Intermediate | Prove that no machine can copy an unknown quantum state, and see what that rules out. | Wootters and Zurek 1982 (Nature 299, 802); N&C Box 12.1; Watrous U1 Quantum circuits |
| state-discrimination | Telling states apart | bases, inner-product | Intermediate | Show non-orthogonal states cannot be told apart perfectly, and find the best guess (Helstrom). | N&C 2.2.4; Watrous U3 General measurements |
| postulates | Postulates of quantum mechanics | measurement, multi-qubit, unitary-matrices, inner-product, tensor-product | Intermediate | State the four rules: states are unit vectors, change is unitary, measurement follows Born, systems join by tensor product. | N&C 2.2; Preskill ch. 2 |
| observables | Observables | postulates, hermitian-matrices | Intermediate | Tie a measurable quantity to a Hermitian matrix whose eigenvalues are the possible results. | N&C 2.2.5; Preskill ch. 2 |
| expectation-values | Expectation values | observables, probability | Intermediate | Compute the average result ⟨ψ\|A\|ψ⟩ and see how repeated runs estimate it. | N&C 2.2.5; IBM Quantum docs, Estimator primitive |
| uncertainty | Uncertainty principle | observables, commutators, expectation-values | Intermediate | Show that observables that do not commute cannot both have sharp values (Robertson bound). | N&C Box 2.4; SEP "The Uncertainty Principle" |
| time-evolution | Time evolution and Hamiltonians | postulates, matrix-functions | Intermediate | Use the Schrödinger equation and U = e^{-iHt}, and watch a spin precess around the Bloch sphere. | N&C 2.2.2; Aaronson Lec 24 |
| pictures | Schrödinger and Heisenberg pictures | time-evolution, observables | Advanced | Move the change from states to observables and see that both give the same predictions. | S&N 2.2; Gottesman 1998 (quant-ph/9807006) |
| mixed-states | Mixed states | measurement, entanglement | Intermediate | Tell a mix (plain odds over states) from a superposition, and see that different mixes can look the same. | N&C 2.4.1; Aaronson Lec 6 |
| density-matrix | Density matrices | mixed-states, outer-product, trace, positive-matrices | Intermediate | Describe pure and mixed states with ρ, and see one qubit fill the Bloch ball. | N&C 2.4; Watrous U3 Density matrices |
| noise-channels | Common noise channels | density-matrix, bloch | Intermediate | See bit flip, phase flip, depolarizing, amplitude damping and dephasing shrink or squash the Bloch ball. | N&C 8.3; Qiskit Aer docs, noise models |
| decoherence | Decoherence (existing id, now in Hardware) | phase, mixed-states, +entanglement | Intermediate | See a qubit leak information into its surroundings so its superposition turns into a mix. | Zurek 2003 (RMP 75, 715); Schlosshauer 2019 (Phys. Rep. 831, 1); N&C 8.3 |
| qudits | Qudits | superposition, vector-spaces | Intermediate | Extend qubits to d-level systems (qutrits and up) and see what changes. | Wang et al. 2020 (Front. Phys. 8, 589504); Watrous U1 Single systems |
| measurement-problem | The measurement problem | measurement, decoherence | Intermediate | Context only: why the rules do not say when "collapse" happens, and what decoherence does and does not solve. | SEP "Measurement in Quantum Theory"; Schlosshauer 2019 |
| interpretations | Interpretations | measurement-problem, bell-test | Intermediate | Context only: compare Copenhagen, many worlds, pilot wave, QBism and collapse models, and what each says happens. | SEP entries on each; Aaronson Lec 12 |
| partial-trace | Partial trace | density-matrix, tensor-product | Advanced | Get the state of one part of a system, and see that half of a Bell pair looks fully mixed. | N&C 2.4.3; Watrous U3 Density matrices |
| schmidt | Schmidt decomposition | partial-trace, svd-polar | Advanced | Write any two-part pure state as one short sum, and read its entanglement from the Schmidt coefficients. | N&C 2.5; Preskill ch. 2 |
| purification | Purification | schmidt | Advanced | Show every mixed state is part of a larger pure state, and that all such purifications differ by a unitary. | N&C 2.5; Watrous U3 Purifications and fidelity; Preskill ch. 2 |
| entanglement-entropy | Entanglement entropy | schmidt, powers-and-logs | Advanced | Measure how entangled a pure state is with the von Neumann entropy of one part. | N&C 11.3; Preskill ch. 10 |
| separability | Testing for entanglement | density-matrix, partial-trace | Advanced | Decide if a mixed state is entangled with the partial transpose (PPT) test and entanglement witnesses. | Peres 1996 (PRL 77, 1413); Horodecki et al. 2009 (RMP 81, 865) |
| monogamy | Monogamy of entanglement | bell-test, schmidt | Advanced | See that a qubit fully entangled with one partner cannot be entangled with a third. | Coffman, Kundu, Wootters 2000 (PRA 61, 052306); Horodecki et al. 2009 (RMP 81, 865) |
| locc | Entanglement as a resource (LOCC) | schmidt, entanglement-entropy | Advanced | Learn what local actions plus classical messages can and cannot do to entanglement, and count it in ebits. | N&C 12.5; Chitambar et al. 2014 (Commun. Math. Phys. 328, 303) |
| povm | General measurements (POVMs) | state-discrimination, positive-matrices, projectors | Advanced | Describe any measurement with positive parts that sum to I, and build it from a projective one on a larger system (Naimark). | N&C 2.2.6; Watrous U3 General measurements |
| channels | Quantum channels | noise-channels, partial-trace | Advanced | Describe any physical change of state as a completely positive, trace-preserving map with Kraus operators. | N&C 8.2; Watrous U3 Quantum channels; Preskill ch. 3 |
| channel-representations | Stinespring and Choi | channels, purification | Advanced | Show each channel is a unitary on a larger system, and store a channel as one matrix (Choi). | Watrous U3 Quantum channels; Preskill ch. 3 |
| distance-measures | Trace distance and fidelity | density-matrix, matrix-norms, purification | Advanced | Measure how close two states are, and how well one measurement could tell them apart. | N&C 9.2; Watrous U3 Purifications and fidelity |
| tomography | State tomography | density-matrix, bases, expectation-values, shots | Advanced | Rebuild an unknown state from many measurements in several bases. | N&C 8.4.2; Watrous U3 General measurements |

## Gates and circuits (`circuits`)

| id | Stop | Needs | Level | Scope | Sources |
|---|---|---|---|---|---|
| classical-gates | Classical logic gates | binary | Beginner | Build NOT, AND, OR, XOR and NAND circuits, and see that NAND alone is universal. | Qiskit TB 1.2; N&C 3.1.2 |
| gates | What a quantum gate is | superposition | Beginner | See a gate as a reversible action on qubits, written as a unitary matrix. | N&C 1.3.1; MS Katas single_qubit_gates |
| pauli | Pauli gates | bloch, +gates | Beginner | Use X, Y and Z as half turns of the Bloch sphere; X is the quantum NOT. | N&C 1.3.1, 2.1.3; MS Katas single_qubit_gates |
| hadamard | Hadamard | superposition, +gates | Beginner | Use H to turn \|0⟩ into \|+⟩ and back, the gate that swaps the Z and X bases. | N&C 1.3.1; Qiskit TB 1.4 |
| phase-gates | Phase gates | phase | Beginner | Use Z, S, T and P(φ) to change relative phase without changing the 0 and 1 odds. | N&C 4.2; Qiskit TB 1.4 |
| rotations | Rotation gates | pauli | Intermediate | Turn the Bloch vector by any angle about the x, y or z axis with RX, RY and RZ. | N&C 4.2; Qiskit TB 1.4 |
| single-qubit-unitary | Any one-qubit gate | rotations, phase-gates, unitary-matrices | Intermediate | Write any one-qubit gate as three rotations (Euler form) or as U(θ,φ,λ), up to a global phase. | N&C 4.2 (Thm 4.1); Qiskit TB 1.4 |
| shots | Shots and counts | measurement, probability | Beginner | Run a circuit many times, read the histogram, and see the error shrink like 1/√shots. | IBM Quantum docs, Sampler primitive; N&C App. 1 |
| cnot | CNOT | multi-qubit, pauli | Beginner | Flip a target qubit only when the control is 1, and make entanglement from superposition. | N&C 1.3.2; MS Katas multi_qubit_gates |
| circuits | Reading a circuit | hadamard, cnot | Beginner | Read wires, gates and meters left to right, and match a small circuit to its matrix. | N&C 1.3.4, 4.6; Watrous U1 Quantum circuits |
| bell-states | Bell states | cnot, hadamard, entanglement | Beginner | Make the four Bell states with H and CNOT, and measure in the Bell basis by running it backwards. | N&C 1.3.6; Qiskit TB 2.2 |
| controlled-gates | Controlled gates | cnot, phase-gates, rotations | Intermediate | Build controlled-U gates such as CZ, CY and controlled phase, also controlled on 0, from CNOTs and one-qubit gates. | N&C 4.3; Qiskit TB 2.4 |
| toffoli | Toffoli and SWAP | cnot | Intermediate | Swap two qubits with three CNOTs, and use Toffoli (CCNOT) as a reversible AND. | N&C 1.3.4, 4.3; Qiskit TB 2.4 |
| fredkin | Fredkin (controlled SWAP) | toffoli | Intermediate | Swap two qubits only when a control is 1, a reversible gate that keeps the number of 1s. | N&C 3.2.5; Fredkin and Toffoli 1982 (Int. J. Theor. Phys. 21, 219) |
| multi-controlled | Multi-controlled gates | toffoli, controlled-gates | Intermediate | Build gates with many controls, with or without spare qubits, and count what they cost. | Barenco et al. 1995 (PRA 52, 3457); N&C 4.3 |
| two-qubit-gates | Two-qubit gate families | controlled-gates, toffoli | Intermediate | Meet iSWAP, √SWAP, XX and ZZ (Ising), Mølmer-Sørensen, fSim and ECR, the gates real chips use. | Krantz et al. 2019 (Appl. Phys. Rev. 6, 021318); Sørensen and Mølmer 1999 (PRL 82, 1971) |
| circuit-identities | Circuit identities | circuits, controlled-gates | Intermediate | Use rules like HXH = Z, a CNOT flipped by Hadamards, and CZ symmetry to simplify circuits. | N&C Ex. 4.13, 4.20; Qiskit TB 2.4 |
| phase-kickback | Phase kickback | hadamard, phase-gates, cnot | Intermediate | See a controlled gate put a phase on its control qubit, the trick behind most algorithms. | Qiskit TB 2.3; Cleve et al. 1998 (Proc. R. Soc. A 454, 339) |
| mid-circuit | Mid-circuit measurement and feed-forward | circuits, measurement | Intermediate | Measure, reset and pick later gates from results while the circuit runs (dynamic circuits). | N&C 4.4; Córcoles et al. 2021 (PRL 127, 100501); IBM Quantum docs, classical feedforward |
| deferred-measurement | Deferred measurement | mid-circuit, controlled-gates | Intermediate | Move every measurement to the end by swapping classical control for quantum control. | N&C 4.4 |
| parity-measurement | Parity measurements | cnot, partial-measurement | Intermediate | Learn if two qubits agree (ZZ) without learning either one, using a helper qubit. | MS Katas JointMeasurements; N&C 10.1.1 |
| hadamard-test | Hadamard test | controlled-gates, phase-kickback, expectation-values | Intermediate | Estimate ⟨ψ\|U\|ψ⟩ by controlling U from one helper qubit and measuring it. | Cleve et al. 1998 (Proc. R. Soc. A 454, 339); Wikipedia "Hadamard test" |
| swap-test | SWAP test | fredkin, hadamard, inner-product | Intermediate | Estimate how alike two states are, \|⟨a\|b⟩\|², with one controlled SWAP. | Buhrman et al. 2001 (PRL 87, 167902) |
| reversible | Reversible computing | classical-gates, toffoli | Intermediate | See that erasing bits costs energy (Landauer), and that any computation can run reversibly with Toffoli or Fredkin. | Landauer 1961 (IBM J. Res. Dev. 5, 183); Bennett 1973 (IBM J. Res. Dev. 17, 525); N&C 3.2.5 |
| oracles | Oracles | circuits, toffoli, +reversible | Intermediate | Write a function as a reversible gate, as a bit-flip or a phase-flip oracle. | MS Katas oracles, marking_oracles; N&C 1.4.1 |
| quantum-parallelism | Quantum parallelism | oracles, multi-qubit | Intermediate | Run f on all inputs at once in superposition, and see why you still read out only one answer. | N&C 1.4.2; de Wolf 2.4 |
| ancillas | Ancilla qubits | circuits | Intermediate | Use extra helper qubits, clean or dirty, and give them back in their start state. | N&C 4.3; Watrous U2 Quantum algorithmic foundations |
| uncomputation | Uncomputation | reversible, ancillas, interference | Intermediate | Compute, copy the answer, then run backwards to clear junk that would spoil interference. | Bennett 1973; Watrous U2 Quantum algorithmic foundations |
| quantum-arithmetic | Quantum arithmetic | uncomputation, toffoli | Advanced | Build adders and comparators from reversible gates (ripple-carry, Cuccaro, QFT-based). | Vedral, Barenco, Ekert 1996 (PRA 54, 147); Cuccaro et al. 2004 (quant-ph/0410184); MS Katas RippleCarryAdder |
| universal | Universal gate sets | hadamard, phase-gates, rotations, cnot | Intermediate | See that one-qubit gates plus CNOT build any gate, and a small fixed set gets as close as you like. | N&C 4.5; Qiskit TB 2.5; Aaronson Lec 16 |
| pauli-strings | Pauli strings | pauli, tensor-product, commutators | Intermediate | Write many-qubit operators as products like X⊗Z⊗I, and check if two of them commute. | N&C 10.5.1; Preskill ch. 7 |
| pauli-rotations | Exponentials of Pauli strings | pauli-strings, rotations, cnot, matrix-functions | Intermediate | Build e^{-iθP} for any Pauli string with a ladder of CNOTs and one RZ. | N&C 4.7.3; Whitfield, Biamonte, Aspuru-Guzik 2011 (Mol. Phys. 109, 735) |
| clifford-group | Clifford gates | pauli-strings, hadamard, phase-gates, cnot | Intermediate | Meet H, S and CNOT, the gates that map Pauli strings to Pauli strings. | N&C 10.5.2; Gottesman 1998 (quant-ph/9807006) |
| clifford-t | Clifford+T | clifford-group, universal | Intermediate | Add T to the Clifford gates for a universal set, and count T gates as the main cost. | N&C 4.5.3; Boykin et al. 1999 (quant-ph/9906054) |
| circuit-cost | Depth, width and gate count | circuits, big-o | Intermediate | Measure a circuit by qubits (width), layers (depth), and counts of CNOT and T gates. | Watrous U2 Quantum algorithmic foundations; IBM Quantum docs, Transpile |
| native-gates | Native gates | universal, two-qubit-gates | Intermediate | See that each chip runs a small basis set (such as RZ, SX and ECR or CZ) and everything else is built from it. | IBM Quantum docs, native gates; Krantz et al. 2019 |
| transpilation | Compiling and transpiling | native-gates, circuit-identities | Intermediate | Follow a circuit to what runs: translate to native gates, place qubits, route, optimize, schedule. | IBM Quantum docs, Transpile; Qiskit transpiler docs |
| circuit-languages | Circuits as code | circuits | Intermediate | Write circuits in OpenQASM, Qiskit, Cirq or Q#, and read them back as diagrams. | Cross et al. 2022 (OpenQASM 3, ACM Trans. Quantum Comput. 3, 12); MS Katas getting_started |
| classical-simulation | Simulating circuits classically | circuits, multi-qubit, powers-and-logs, tensor-product | Intermediate | See why a state vector needs 2^n numbers, and how stabilizers and tensor networks help in some cases. | Markov and Shi 2008 (SIAM J. Comput. 38, 963); Aaronson and Gottesman 2004 (PRA 70, 052328) |
| state-preparation | State preparation | rotations, multi-controlled | Advanced | Load any chosen state into qubits, and see why most states need exponentially many gates. | Möttönen et al. 2005 (QIC 5, 467); Shende, Bullock, Markov 2006 (IEEE TCAD 25, 1000); MS Katas preparing_states |
| decomposition | Breaking down any gate | universal, single-qubit-unitary, multi-controlled | Advanced | Split any unitary into two-level gates, then CNOTs and one-qubit gates, and see most need exponentially many. | N&C 4.5.1 to 4.5.4; Shende, Bullock, Markov 2006 |
| two-qubit-synthesis | Two-qubit synthesis (KAK) | decomposition, two-qubit-gates | Advanced | Show any two-qubit gate needs at most three CNOTs plus one-qubit gates. | Vatan and Williams 2004 (PRA 69, 032315); Vidal and Dawson 2004 (PRA 69, 010301) |
| qubit-routing | Qubit mapping and routing | transpilation, circuit-cost, toffoli | Advanced | Place qubits on a chip's map and add SWAPs when a gate needs qubits that are not neighbors. | Li, Ding, Xie 2019 (SABRE, arXiv:1809.02573); IBM Quantum docs, Transpile |
| stabilizer-states | Stabilizer states | clifford-group, eigen | Advanced | Describe a state by the Pauli strings that leave it unchanged: n short rules instead of 2^n amplitudes. | N&C 10.5.1; Aaronson and Gottesman 2004 |
| gottesman-knill | Gottesman-Knill theorem | stabilizer-states, classical-simulation, gf2 | Advanced | Show that circuits of only Clifford gates and Pauli measurements are easy to simulate on a normal computer. | N&C 10.5.4; Gottesman 1998; Aaronson and Gottesman 2004 |
| solovay-kitaev | Solovay-Kitaev theorem | clifford-t, matrix-norms | Advanced | Show any one-qubit gate can be reached to error ε with only polylog(1/ε) gates from a fixed set. | N&C App. 3; Dawson and Nielsen 2006 (QIC 6, 81) |
| gate-teleportation | Gate teleportation | clifford-group, teleportation | Advanced | Apply a hard gate like T by teleporting through a prepared (magic) state. | Gottesman and Chuang 1999 (Nature 402, 390); Bravyi and Kitaev 2005 (PRA 71, 022316) |
| zx-calculus | ZX-calculus | circuit-identities, clifford-group | Advanced | Draw circuits as spider diagrams and simplify them with a few rewrite rules. | Coecke and Duncan 2011 (New J. Phys. 13, 043016); van de Wetering 2020 (arXiv:2012.13966) |
| qtm | Quantum Turing machines | universal, big-o | Advanced | Context: the first model of a quantum computer, and why it has the same power as circuits. | Deutsch 1985 (Proc. R. Soc. A 400, 97); Bernstein and Vazirani 1997 (SIAM J. Comput. 26, 1411); Yao 1993 (FOCS) |
| mbqc | Measurement-based computing | stabilizer-states, mid-circuit | Advanced | Compute by making a large entangled cluster state, then only measuring single qubits with feed-forward. | Raussendorf and Briegel 2001 (PRL 86, 5188); Briegel et al. 2009 (Nat. Phys. 5, 19) |
| adiabatic | Adiabatic quantum computing | time-evolution, universal | Advanced | Solve a problem by slowly changing a Hamiltonian so the system stays in its lowest state; as powerful as circuits. | Farhi et al. 2000 (quant-ph/0001106); Aharonov et al. 2007 (SIAM J. Comput. 37, 166); Albash and Lidar 2018 (RMP 90, 015002) |
| topological-model | Topological quantum computing | universal, groups | Advanced | Store qubits in anyons and do gates by braiding them, so small noise cannot change the result. | Kitaev 2003 (Ann. Phys. 303, 2); Nayak et al. 2008 (RMP 80, 1083); Preskill ch. 9 |
| cv-model | Continuous-variable computing | universal, qudits, uncertainty | Advanced | Compute with modes of light that hold continuous values instead of qubits. | Lloyd and Braunstein 1999 (PRL 82, 1784); Braunstein and van Loock 2005 (RMP 77, 513) |

## Suggested learning lines

New lines unless marked.

- **Math warm-up**: binary, powers-and-logs, probability, trigonometry, complex-numbers, euler-formula, vectors, matrices, dirac-notation.
- **Linear algebra for qubits**: vector-spaces, inner-product, outer-product, conjugate-transpose, eigen, unitary-matrices, hermitian-matrices, projectors, spectral-theorem, matrix-functions, commutators, trace, tensor-product.
- **Math for algorithms**: big-o, gf2, modular-arithmetic, groups, roots-of-unity, discrete-fourier, continued-fractions.
- **First steps** (existing, extended): qubit, superposition, measurement, quantum-random, bloch, phase, interference, bases, multi-qubit, entanglement.
- **Famous experiments** (good Kid line): double-slit, polarization, stern-gerlach, mach-zehnder, bomb-tester, quantum-zeno.
- **Rules of the game**: postulates, observables, expectation-values, uncertainty, time-evolution, pictures.
- **Spooky action**: entanglement, epr, bell-test, ghz-w, ghz-paradox, contextuality, no-signaling, no-cloning.
- **Real-world states** (noise and open systems): mixed-states, density-matrix, noise-channels, decoherence, partial-trace, channels, distance-measures, tomography.
- **Entanglement theory**: partial-trace, schmidt, purification, entanglement-entropy, separability, monogamy, locc.
- **Circuit builder** (existing, extended): gates, pauli, hadamard, phase-gates, rotations, shots, cnot, circuits, controlled-gates, toffoli, circuit-identities, universal.
- **Circuit tricks**: phase-kickback, parity-measurement, hadamard-test, swap-test, mid-circuit, deferred-measurement.
- **Classical inside quantum**: classical-gates, reversible, toffoli, fredkin, ancillas, uncomputation, oracles, quantum-arithmetic.
- **Clifford and beyond**: pauli-strings, clifford-group, stabilizer-states, gottesman-knill, clifford-t, solovay-kitaev, gate-teleportation.
- **From circuit to chip**: single-qubit-unitary, decomposition, two-qubit-gates, two-qubit-synthesis, native-gates, circuit-cost, transpilation, qubit-routing.
- **Other ways to compute**: qtm, mbqc, adiabatic, topological-model, cv-model.
- **Context**: measurement-problem, interpretations.

## Checked and left out

- **Wave mechanics in space** (particle in a box, hydrogen atom, position and momentum wavefunctions): physics course material; qubit courses (N&C, Watrous, Katas) skip it. Mention only in Hardware stops if needed.
- **Calculus and differential equations** beyond e^{x}: only the matrix exponential is needed, covered by `matrix-functions`.
- **Infinite-dimensional Hilbert spaces, functional analysis, measure theory**: not used in standard QC courses. `cv-model` names the idea only.
- **Lie algebra theory beyond SU(2), representation theory, angular momentum addition**: research or physics level; `su2` covers what gates need.
- **Quantum Shannon theory** (Holevo bound, capacities, quantum entropy inequalities): belongs to a Protocols or Information slice; only `entanglement-entropy` kept here.
- **Complexity classes** (BQP, QMA, query lower bounds): Algorithms or Complexity slice. Only `big-o` and `qtm` kept as bridges.
- **Error correction and fault tolerance** (stabilizer codes, transversal gates, magic state distillation, threshold): Hardware slice. `stabilizer-states`, `parity-measurement` and `gate-teleportation` kept as bridges.
- **Teleportation, entanglement swapping, superdense coding**: Protocols region (existing stops).
- **Other niche models** (DQC1 one clean qubit, IQP, boson sampling, matchgates, quantum walk as a universal model): complexity and advantage topics, not core models taught first. Quantum walks already sit in Algorithms.
- **Rabi oscillations, pulses, T1 and T2 numbers**: Hardware slice; `time-evolution` covers the physics idea.
- **Weak measurement, quantum Darwinism, details of collapse models**: research or philosophy; `measurement-problem` and `interpretations` give context only.
- **Quantum logic (Birkhoff-von Neumann lattices) and category theory beyond ZX**: not in standard courses.
- **SDK how-tos** (Qiskit, Cirq, Q# APIs): change fast; `circuit-languages` teaches the idea, tool pages can link out.

## Notes on sources

- Cross-checked against: Microsoft Katas folder lists (both repos, read on GitHub), Qiskit Textbook chapter files (GitHub), IBM Quantum Learning course outlines and Watrous's book (via search), N&C table of contents (via search snippets), Preskill Ph219 course page, de Wolf arXiv listing, Aaronson's lecture list, Shor's MIT 8.370 notes list and Berkeley CS191 syllabi (via search).
- The proxy blocked direct reads of arxiv.org, wikipedia.org, caltech.edu, cambridge.org, cwi.nl and quantum.cloud.ibm.com. Some section, box and exercise numbers (mainly N&C, de Wolf chapters, Aaronson lecture numbers, FLP sections) are from memory plus search snippets. Spot-check each one before it ships.
