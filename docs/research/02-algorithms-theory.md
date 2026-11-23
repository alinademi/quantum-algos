# Research 02: Algorithms and theory

Every stop a full A to Z site could cover in two regions: Algorithms (`algorithms`) and a new region, Complexity and theory (`theory`). The 16 existing algorithm stops keep their ids. Needs may point to other regions (`oracles`, `phase-kickback`, `nisq`, `logical-qubits`, and so on).

Kinds:

- **Algorithm**: a procedure that solves a stated problem.
- **Building block**: a subroutine other algorithms call (QFT, phase estimation, amplitude amplification, block encoding).
- **Concept**: an idea, a limit or a cost check, not a procedure.

Protocols (teleportation, QKD, certified randomness, blind computing) are left to the protocols researcher.

How this was built: cross-checked against the Quantum Algorithm Zoo's sections (Algebraic and number theoretic, Oracular, Approximation and simulation, Optimization, numerics and machine learning), Nielsen and Chuang, de Wolf's and Childs' lecture notes, Montanaro 2016, Dalzell et al. 2023 and Bharti et al. 2022. Recent items (2023 to 2025) were checked by web search. **Caveat:** the network proxy blocked quantumalgorithmzoo.org and arxiv.org, so Zoo entry names come from memory and search snippets. Check them before shipping.

Source keys: **N&C** = Nielsen and Chuang, *Quantum Computation and Quantum Information* (2010). **de Wolf LN** = de Wolf, *Quantum Computing: Lecture Notes* (arXiv 1907.09415). **Childs QA** = Childs, *Lecture Notes on Quantum Algorithms* (UMD). **Zoo** = Jordan, Quantum Algorithm Zoo (entry name). **Dalzell 2023** = Dalzell et al., *Quantum algorithms: a survey of applications and end-to-end complexities* (arXiv 2310.03011, CUP 2025). **Montanaro 2016** = *Quantum algorithms: an overview*, npj QI 2, 15023. **Bharti 2022** = *Noisy intermediate-scale quantum algorithms*, RMP 94, 015004.

## Algorithms (`algorithms`)

Groups in this region, in table order:

- **Oracle problems**: deutsch, deutsch-jozsa, bernstein-vazirani, simon, hidden-shift
- **Fourier and hidden subgroups**: qft, phase-estimation, iterative-qpe, quantum-arithmetic, order-finding, shor, discrete-log, abelian-hsp, non-abelian-hsp, kuperberg, pell-number-fields, regev-factoring
- **Search and amplitude amplification**: grover, amplitude-amplification, quantum-counting, amplitude-estimation, minimum-finding, collision-finding, backtracking
- **Quantum walks**: quantum-walks, ctqw, spatial-search, glued-trees, szegedy-walk, element-distinctness, triangle-finding, nand-tree, graph-queries
- **Hamiltonian simulation**: simulation, analog-simulation, trotter, qdrift, lcu, block-encoding, qsp, qubitization, qsvt
- **Chemistry, materials, physics**: fermion-mapping, electronic-structure, ground-state-prep, early-ft-qpe, femoco, condensed-matter, lattice-gauge, gibbs-sampling, hamiltonian-learning
- **Linear algebra and numerics**: hhl, linear-solvers, differential-equations, gradient-estimation
- **Optimization**: adiabatic-optimization, qaoa, qaoa-variants, dqi, sdp-solvers
- **Variational and near-term**: variational, ansatz, parameter-shift, vqe, adapt-vqe, vqd, imaginary-time, subspace-methods, barren-plateaus, error-mitigation
- **Quantum machine learning**: data-encoding, quantum-kernels, qnn, quantum-generative, qpca, recommendation, tda, classical-shadows, quantum-data-advantage
- **Monte Carlo and finance**: mc-speedup, option-pricing, markov-speedup
- **Sampling and advantage tests**: rcs, xeb, boson-sampling, gbs, iqp, otoc-echoes
- **Cryptanalysis**: grover-crypto, simon-attacks, shor-resources (plus shor, discrete-log, collision-finding, regev-factoring above)
- **Toolbox**: swap-test, hadamard-test, state-prep, qram
- **Approximation**: jones-polynomial

| id | Stop | Kind | Needs | Level | Scope | Sources |
|---|---|---|---|---|---|---|
| deutsch | Deutsch | Algorithm | oracles, phase-kickback, interference | Beginner | Tell if a one-bit function is constant or balanced with one query instead of two. | Deutsch 1985; N&C 1.4; de Wolf LN (circuit model) |
| deutsch-jozsa | Deutsch-Jozsa | Algorithm | deutsch | Beginner | Same test for n-bit functions: one query, where a sure classical answer needs 2^(n-1)+1. | Deutsch, Jozsa 1992; N&C 1.4; Zoo: Deutsch-Jozsa |
| bernstein-vazirani | Bernstein-Vazirani | Algorithm | deutsch-jozsa | Beginner | Find a hidden bit string s in f(x) = s.x with one query; a first taste of Fourier sampling. | Bernstein, Vazirani 1997; Zoo: Bernstein-Vazirani |
| simon | Simon | Algorithm | bernstein-vazirani | Intermediate | Find a hidden XOR period with about n queries where classical needs about 2^(n/2); the seed of Shor. | Simon 1997; de Wolf LN (Simon); Childs QA |
| hidden-shift | Hidden shift | Algorithm | bernstein-vazirani, qft | Advanced | Find how far a function was shifted (bent functions, Legendre symbol) with few queries; links to isogeny crypto. | van Dam, Hallgren, Ip 2003; Roetteler 2010; Zoo: Hidden Shift |
| qft | Quantum Fourier transform | Building block | hadamard, phase-gates, cnot, interference | Intermediate | Fourier transform on amplitudes with about n^2 gates; turns a hidden period into peaks you can measure. | Coppersmith 1994; N&C 5.1; de Wolf LN (Fourier) |
| phase-estimation | Quantum phase estimation | Building block | qft, phase-kickback | Intermediate | Read out the eigenvalue phase of a unitary to t bits; the core of Shor, chemistry and HHL. | Kitaev 1995; Cleve et al. 1998; N&C 5.2 |
| iterative-qpe | Kitaev and iterative phase estimation | Building block | phase-estimation | Advanced | Learn the phase one bit at a time with a single ancilla and classical feedback. | Kitaev 1995; Dobsicek et al. 2007; Kimmel, Low, Yoder 2015 |
| quantum-arithmetic | Quantum arithmetic | Building block | toffoli, oracles | Intermediate | Reversible adders, modular multiply and modular exponentiation; the costly part of Shor. | Vedral, Barenco, Ekert 1996; Cuccaro et al. 2004; Beauregard 2003 |
| order-finding | Order finding | Building block | phase-estimation, quantum-arithmetic | Intermediate | Find the period r of a^x mod N with phase estimation, then continued fractions. | Shor 1997; N&C 5.3 |
| shor | Shor | Algorithm | order-finding | Intermediate | Factor N in polynomial time by reducing factoring to order finding. | Shor 1997; N&C 5.3; Zoo: Factoring |
| discrete-log | Discrete logarithm | Algorithm | shor | Intermediate | Shor's second algorithm: solve g^x = h, which breaks Diffie-Hellman and elliptic curve crypto. | Shor 1997; N&C 5.4; Roetteler et al. 2017 |
| abelian-hsp | Abelian hidden subgroup problem | Algorithm | simon, discrete-log | Advanced | One frame for Simon, Shor and discrete log (and Kitaev's abelian stabilizer): Fourier sampling finds a hidden subgroup. | Kitaev 1995; N&C 5.4; Childs, van Dam 2010 |
| non-abelian-hsp | Non-abelian hidden subgroup problem | Concept | abelian-hsp | Advanced | Why the trick stalls for non-abelian groups: few queries suffice, but no fast algorithm is known; links to graph isomorphism and lattices. | Ettinger, Hoyer, Knill 2004; Moore, Russell, Schulman 2005; Childs, van Dam 2010 |
| kuperberg | Kuperberg's dihedral sieve | Algorithm | non-abelian-hsp | Advanced | Subexponential-time algorithm for the dihedral hidden subgroup; used against isogeny-based crypto. | Kuperberg 2005; Regev 2004; Childs, Jao, Soukharev 2014 |
| pell-number-fields | Pell's equation and number fields | Algorithm | abelian-hsp | Advanced | Hallgren's algorithms for Pell's equation, principal ideals, class and unit groups, using periods over the reals. | Hallgren 2007; Biasse, Song 2016; Zoo: Pell's Equation |
| regev-factoring | Regev's factoring | Algorithm | shor | Advanced | 2023 multidimensional take on Shor: smaller circuits, run about sqrt(n) times, then lattice reduction. | Regev 2023 (JACM 2025); Pilatte 2024 |
| grover | Grover | Algorithm | oracles, phase-kickback, interference | Beginner | Find a marked item among N in about sqrt(N) queries by repeated reflections. | Grover 1996; N&C 6.1; Zoo: Searching |
| amplitude-amplification | Amplitude amplification | Building block | grover | Intermediate | Grover's trick as a tool: lift any algorithm's success chance from p to near 1 in about 1/sqrt(p) rounds. | Brassard, Hoyer, Mosca, Tapp 2002; Zoo: Searching |
| quantum-counting | Quantum counting | Algorithm | grover, phase-estimation | Intermediate | Estimate how many items are marked by running phase estimation on the Grover step. | Brassard, Hoyer, Tapp 1998; N&C 6.3 |
| amplitude-estimation | Amplitude estimation | Building block | amplitude-amplification, phase-estimation | Intermediate | Estimate a success chance to error e with about 1/e queries instead of 1/e^2 samples. | Brassard, Hoyer, Mosca, Tapp 2002; Montanaro 2015 |
| minimum-finding | Minimum finding | Algorithm | grover | Intermediate | Find the smallest value in a list in about sqrt(N) queries (Durr-Hoyer, Grover adaptive search). | Durr, Hoyer 1996; Gilliam et al. 2021 |
| collision-finding | Collision finding | Algorithm | grover | Intermediate | Find two inputs with the same output in about N^(1/3) queries (BHT), with a matching lower bound. | Brassard, Hoyer, Tapp 1998; Aaronson, Shi 2004; Zoo: Collision Finding and Element Distinctness |
| backtracking | Backtracking and tree search | Algorithm | quantum-walks, phase-estimation | Advanced | Near-quadratic speedup for backtracking, branch and bound, and some exponential dynamic programs. | Montanaro 2018; Montanaro 2020; Ambainis et al. 2019 |
| quantum-walks | Quantum walks | Building block | interference, circuits | Intermediate | A walker in superposition spreads in time t, not sqrt(t); coined walks on lines and graphs. | Aharonov, Davidovich, Zagury 1993; Kempe 2003; de Wolf LN (walks) |
| ctqw | Continuous-time quantum walks | Building block | quantum-walks, simulation | Intermediate | A walk driven by a graph's adjacency matrix used as a Hamiltonian; base for spatial search and glued trees. | Farhi, Gutmann 1998; Childs QA (walks) |
| spatial-search | Spatial search | Algorithm | ctqw, grover | Advanced | Grover-style search on grids and graphs with a walk; full sqrt(N) speedup in high dimensions. | Aaronson, Ambainis 2003; Childs, Goldstone 2004 |
| glued-trees | Glued trees | Algorithm | ctqw | Advanced | A walk crosses two glued binary trees exponentially faster than any classical algorithm can. | Childs et al. 2003; Zoo: Welded Tree |
| szegedy-walk | Szegedy walks and walk search | Building block | quantum-walks, phase-estimation | Advanced | Quantize any Markov chain; find marked states in about the square root of the classical hitting time (MNRS). | Szegedy 2004; Magniez, Nayak, Roland, Santha 2011 |
| element-distinctness | Element distinctness | Algorithm | szegedy-walk, collision-finding | Advanced | Decide if any two of N items are equal in about N^(2/3) queries with a walk on the Johnson graph. | Ambainis 2007; Zoo: Collision Finding and Element Distinctness |
| triangle-finding | Triangle finding | Algorithm | element-distinctness | Advanced | Find a triangle in a graph faster than Grover alone, using walks and learning graphs. | Magniez, Santha, Szegedy 2007; Le Gall 2014 |
| nand-tree | Formula evaluation (NAND trees) | Algorithm | ctqw | Advanced | Evaluate game trees and Boolean formulas in about sqrt(N) by scattering a walk off the tree. | Farhi, Goldstone, Gutmann 2008; Reichardt 2011; Zoo: Formula Evaluation |
| graph-queries | Graph problems by query | Algorithm | minimum-finding | Intermediate | Speedups for connectivity, spanning trees and shortest paths when the graph is an oracle. | Durr et al. 2006; Zoo: Graph Properties in the Adjacency Matrix Model |
| simulation | Simulating physics | Algorithm | rotations, circuits | Intermediate | Feynman's idea made real: run e^(-iHt) for a local Hamiltonian H with a polynomial number of gates. | Feynman 1982; Lloyd 1996; N&C 4.7 |
| analog-simulation | Analog quantum simulators | Concept | simulation | Intermediate | Build a lab system whose own physics copies the model you study, with no gates. | Georgescu, Ashhab, Nori 2014; Daley et al. 2022 |
| trotter | Product formulas (Trotter-Suzuki) | Building block | simulation | Intermediate | Split H into easy parts and alternate them; error shrinks with smaller steps and higher order. | Suzuki 1991; Childs et al. 2021 (Trotter error) |
| qdrift | Randomized simulation (qDRIFT) | Building block | trotter | Advanced | Pick Hamiltonian terms at random by weight; cost depends on total weight, not on term count. | Campbell 2019 |
| lcu | Linear combination of unitaries | Building block | simulation, amplitude-amplification | Advanced | Apply a weighted sum of unitaries with PREPARE and SELECT circuits; with oblivious amplitude amplification, gives Taylor-series simulation. | Childs, Wiebe 2012; Berry et al. 2015 |
| block-encoding | Block encoding | Building block | lcu | Advanced | Store a non-unitary matrix as the top-left block of a bigger unitary; the common input for modern algorithms. | Gilyen et al. 2019; Lin 2022 (lecture notes) |
| qsp | Quantum signal processing | Building block | rotations, phase-kickback | Advanced | Interleave one-qubit rotations to apply almost any polynomial to a hidden angle. | Low, Chuang 2017; Martyn et al. 2021 |
| qubitization | Qubitization | Building block | block-encoding, qsp | Advanced | Turn a block encoding into a walk whose phases hold the eigenvalues; optimal Hamiltonian simulation. | Low, Chuang 2019; Babbush et al. 2018 |
| qsvt | Quantum singular value transformation | Building block | qubitization | Advanced | Apply polynomials to the singular values of a block-encoded matrix; one frame for search, simulation and linear systems. | Gilyen, Su, Low, Wiebe 2019; Martyn et al. 2021 |
| fermion-mapping | Fermion-to-qubit mappings | Building block | pauli, multi-qubit | Intermediate | Write electrons as qubits (Jordan-Wigner, Bravyi-Kitaev) so molecules become sums of Pauli strings. | Jordan, Wigner 1928; Bravyi, Kitaev 2002; McArdle et al. 2020 |
| electronic-structure | Molecular ground-state energy | Algorithm | fermion-mapping, phase-estimation, simulation | Advanced | Find a molecule's lowest energy with phase estimation; the flagship chemistry task. | Aspuru-Guzik et al. 2005; McArdle et al. 2020; Dalzell 2023 (chemistry) |
| ground-state-prep | Ground-state preparation | Building block | phase-estimation, adiabatic-optimization | Advanced | Get a start state with good overlap (adiabatic paths, filtering); without overlap, phase estimation fails. | Lin, Tong 2020; Lee et al. 2023 |
| early-ft-qpe | Early fault-tolerant phase estimation | Building block | iterative-qpe | Advanced | Energy estimates with short circuits and one ancilla, using many runs and classical signal processing. | Lin, Tong 2022; Ding, Lin 2023 |
| femoco | Resource estimates for chemistry (FeMoco) | Concept | electronic-structure, logical-qubits | Advanced | How many logical qubits, T gates and days a useful molecule like FeMoco needs, and how fast that number fell. | Reiher et al. 2017; Lee et al. 2021 |
| condensed-matter | Spin and Hubbard models | Algorithm | trotter, fermion-mapping | Advanced | Simulate magnets and the Fermi-Hubbard model, statics and dynamics; a likely first useful target. | Wecker et al. 2015; Kivlichan et al. 2020; Dalzell 2023 (condensed matter) |
| lattice-gauge | Particle physics and lattice gauge theory | Algorithm | trotter | Advanced | Simulate quantum field theories (scattering, Schwinger model) in real time, where classical Monte Carlo fails. | Jordan, Lee, Preskill 2012; Martinez et al. 2016; Bauer et al. 2023 |
| gibbs-sampling | Thermal state preparation | Algorithm | simulation, phase-estimation, mixed-states | Advanced | Prepare Gibbs states at a given temperature (quantum Metropolis, newer exact samplers). | Temme et al. 2011; Chen, Kastoryano, Gilyen 2023 |
| hamiltonian-learning | Hamiltonian learning | Algorithm | simulation, measurement | Advanced | Recover an unknown Hamiltonian's terms from its dynamics, up to the Heisenberg limit. | Anshu et al. 2021; Huang, Tong, Fang, Su 2023 |
| hhl | HHL (linear systems) | Algorithm | phase-estimation, simulation | Advanced | Prepare a state proportional to A^-1 b in time polylog in size, for sparse, well-conditioned A, with big caveats. | Harrow, Hassidim, Lloyd 2009; Aaronson 2015; de Wolf LN (HHL) |
| linear-solvers | Modern linear solvers | Algorithm | hhl, qsvt | Advanced | HHL successors with near-optimal cost in condition number and precision (CKS, adiabatic, QSVT). | Childs, Kothari, Somma 2017; Costa et al. 2022 |
| differential-equations | Differential equations | Algorithm | hhl, simulation | Advanced | Solve linear and some nonlinear ODEs and PDEs by turning them into linear systems or simulation. | Berry 2014; Liu et al. 2021; Babbush et al. 2023 (oscillators) |
| gradient-estimation | Gradient estimation | Building block | qft, phase-kickback | Advanced | Jordan's trick: get a d-dimensional gradient from about one query with phase kickback and a Fourier transform. | Jordan 2005; Gilyen, Arunachalam, Wiebe 2019; Zoo: Gradients, Structured Search, and Learning Polynomials |
| adiabatic-optimization | Adiabatic optimization | Algorithm | simulation | Intermediate | Slowly morph an easy Hamiltonian into one whose ground state is the answer; the energy gap sets the speed. | Farhi et al. 2001; Albash, Lidar 2018; Childs QA (adiabatic) |
| qaoa | QAOA | Algorithm | variational | Intermediate | Alternate problem and mixer layers with tuned angles to find good cuts and assignments. | Farhi, Goldstone, Gutmann 2014; Abbas et al. 2024 |
| qaoa-variants | QAOA variants | Algorithm | qaoa | Advanced | Alternating operator ansatz, warm starts, recursive and multi-angle QAOA, and what is known about performance. | Hadfield et al. 2019; Bravyi et al. 2020; Egger et al. 2021 |
| dqi | Decoded quantum interferometry | Algorithm | qft, error-correction | Advanced | Use the Fourier transform to turn optimization into decoding; superpolynomial speedup for some polynomial-fit problems. | Jordan et al. 2025 (Nature) |
| sdp-solvers | LP and SDP solvers | Algorithm | gibbs-sampling, amplitude-estimation | Advanced | Speedups for linear and semidefinite programs and zero-sum games in some size regimes. | Brandao, Svore 2017; van Apeldoorn et al. 2020 |
| variational | Variational circuits | Building block | rotations, circuits | Intermediate | Circuits with tunable angles, run on a quantum chip and tuned by a classical optimizer. | Peruzzo et al. 2014; Cerezo et al. 2021; Bharti 2022 |
| ansatz | Ansatz design | Building block | variational | Intermediate | Choose the circuit shape: hardware-efficient, chemistry-inspired (UCC) or problem-inspired. | Kandala et al. 2017; Bharti 2022 |
| parameter-shift | Parameter-shift gradients | Building block | variational | Intermediate | Get exact gradients of a circuit by running it at shifted angles. | Mitarai et al. 2018; Schuld et al. 2019 |
| vqe | VQE | Algorithm | variational | Intermediate | Minimize energy with a variational circuit to estimate a ground-state energy. | Peruzzo et al. 2014; Tilly et al. 2022 |
| adapt-vqe | ADAPT-VQE | Algorithm | vqe, ansatz | Advanced | Grow the ansatz one operator at a time, picked by gradient size. | Grimsley et al. 2019 |
| vqd | Excited states (VQD, SSVQE) | Algorithm | vqe | Advanced | Find excited states by penalizing overlap with lower ones or by weighted subspaces. | Higgott, Wang, Brierley 2019; Nakanishi, Mitarai, Fujii 2019 |
| imaginary-time | Imaginary-time evolution | Algorithm | vqe, trotter | Advanced | Cool a state toward the ground state by simulating e^(-tH), with QITE or variational versions. | Motta et al. 2020; McArdle et al. 2019 |
| subspace-methods | Quantum subspace methods | Algorithm | vqe | Advanced | Build or sample a small subspace on the chip, then diagonalize classically (QSE, Krylov, SQD). | McClean et al. 2017; Robledo-Moreno et al. 2025 |
| barren-plateaus | Barren plateaus | Concept | variational, parameter-shift | Advanced | Why gradients vanish in many deep random circuits, and why curing it may make a model classically simulable. | McClean et al. 2018; Larocca et al. 2025; Cerezo et al. 2025 |
| error-mitigation | Error mitigation | Building block | nisq, decoherence | Intermediate | Cut noise bias without full error correction (zero-noise extrapolation, error cancellation), at a sampling cost. | Temme, Bravyi, Gambetta 2017; Cai et al. 2023; Kim et al. 2023 |
| data-encoding | Data encoding and feature maps | Building block | rotations, state-prep | Intermediate | Put classical data into a circuit (basis, angle, amplitude encoding), and why loading cost matters. | Schuld, Petruccione 2021; Havlicek et al. 2019 |
| quantum-kernels | Quantum kernel methods | Algorithm | data-encoding, swap-test | Advanced | Use a circuit as a feature map and measured overlaps as a kernel for a classical SVM. | Havlicek et al. 2019; Schuld, Killoran 2019; Liu, Arunachalam, Temme 2021 |
| qnn | Quantum neural networks | Algorithm | variational, data-encoding, parameter-shift | Advanced | Train parameterized circuits as classifiers, including quantum convolutional networks. | Farhi, Neven 2018; Cong, Choi, Lukin 2019 |
| quantum-generative | Quantum generative models | Algorithm | variational, measurement | Advanced | Learn and sample from distributions with Born machines, quantum GANs and Boltzmann machines. | Benedetti et al. 2019; Amin et al. 2018 |
| qpca | Quantum PCA | Algorithm | phase-estimation, mixed-states | Advanced | Find top eigenvectors of a density matrix by exponentiating copies of it. | Lloyd, Mohseni, Rebentrost 2014 |
| recommendation | Quantum recommendation systems | Algorithm | qram, phase-estimation | Advanced | Sample good recommendations from a low-rank matrix; famous for being dequantized. | Kerenidis, Prakash 2017; Tang 2019 |
| tda | Topological data analysis | Algorithm | phase-estimation | Advanced | Estimate Betti numbers (holes in data) with phase estimation on a combinatorial Laplacian. | Lloyd, Garnerone, Zanardi 2016; Berry et al. 2024 |
| classical-shadows | Classical shadows | Building block | measurement, mixed-states | Advanced | Measure in random bases and predict many properties of a state from few runs. | Huang, Kueng, Preskill 2020; Aaronson 2018 |
| quantum-data-advantage | Learning from quantum data | Concept | classical-shadows, entanglement | Advanced | Proven exponential savings in samples when learning from quantum states with a quantum memory. | Huang, Kueng, Preskill 2021; Huang et al. 2022 (Science) |
| mc-speedup | Monte Carlo speedup | Algorithm | amplitude-estimation | Advanced | Estimate averages to error e with about 1/e samples, not 1/e^2. Not the classical "quantum Monte Carlo" of physics. | Montanaro 2015; Dalzell 2023 (finance) |
| option-pricing | Option pricing and risk | Algorithm | mc-speedup, state-prep | Advanced | Price derivatives and estimate risk with amplitude estimation; resource estimates show a long road. | Rebentrost, Gupt, Bromley 2018; Stamatopoulos et al. 2020; Chakrabarti et al. 2021 |
| markov-speedup | Faster Markov chains | Algorithm | szegedy-walk | Advanced | Quadratic speedups for mixing, simulated annealing and counting, via quantum walks. | Somma et al. 2008; Wocjan, Abeyesinghe 2008; Montanaro 2015 |
| rcs | Random circuit sampling | Algorithm | circuits, nisq | Intermediate | Sample outputs of random circuits; the task behind Sycamore (2019) and Willow (2024). | Boixo et al. 2018; Arute et al. 2019; Morvan et al. 2024 |
| xeb | Cross-entropy benchmarking | Concept | rcs | Intermediate | Score samples by how often they hit likely outputs; how RCS claims are checked. | Boixo et al. 2018; Arute et al. 2019 |
| boson-sampling | Boson sampling | Algorithm | interference, photonic | Intermediate | Send photons through a random network of beam splitters; output odds are matrix permanents, hard to compute. | Aaronson, Arkhipov 2011; Brod et al. 2019 |
| gbs | Gaussian boson sampling | Algorithm | boson-sampling | Advanced | Squeezed light instead of single photons; Jiuzhang (2020) and Borealis (2022) claims, graph uses. | Hamilton et al. 2017; Zhong et al. 2020; Madsen et al. 2022 |
| iqp | IQP circuits | Algorithm | hadamard, phase-gates | Advanced | Commuting circuits (H, diagonal gates, H) whose samples are hard to fake unless the polynomial hierarchy collapses. | Shepherd, Bremner 2009; Bremner, Jozsa, Shepherd 2011 |
| otoc-echoes | Quantum echoes (OTOC) | Algorithm | rcs, simulation | Advanced | Run forward, nudge one qubit, run backward, measure the echo; Google's 2025 claim of verifiable advantage. | Mi et al. 2021; Google Quantum AI 2025 (Nature) |
| grover-crypto | Grover against symmetric keys | Algorithm | grover | Intermediate | Key search on AES in about 2^(k/2) steps; why longer keys are enough and why depth limits bite. | Grassl et al. 2016; Jaques et al. 2020 |
| simon-attacks | Period-finding attacks on symmetric crypto | Algorithm | simon | Advanced | Simon's algorithm breaks Even-Mansour and some MAC modes if the attacker can query in superposition. | Kuwakado, Morii 2012; Kaplan et al. 2016 |
| shor-resources | How big a machine breaks RSA | Concept | shor, logical-qubits | Intermediate | Estimates for RSA-2048 fell from about 20 million noisy qubits (2019) to under one million (2025). | Gidney, Ekera 2019; Gidney 2025 |
| swap-test | Swap test | Building block | toffoli, hadamard, measurement | Intermediate | Estimate how alike two states are with one controlled-SWAP and one ancilla. | Buhrman, Cleve, Watrous, de Wolf 2001 |
| hadamard-test | Hadamard test | Building block | phase-kickback | Intermediate | Estimate the expectation value of a unitary U (real or imaginary part) with one controlled-U. | Cleve et al. 1998; Aharonov, Jones, Landau 2009 |
| state-prep | State preparation | Building block | rotations, cnot | Intermediate | Load a given vector into amplitudes; general states cost exponentially many gates, structured ones less. | Grover, Rudolph 2002; Shende, Bullock, Markov 2006 |
| qram | QRAM and data loading | Building block | state-prep, oracles | Advanced | Query classical data in superposition; why big, fast QRAM is hard, and how that sinks many claimed speedups. | Giovannetti, Lloyd, Maccone 2008; Jaques, Rattew 2023 |
| jones-polynomial | Jones polynomial | Algorithm | hadamard-test | Advanced | Approximate a knot invariant; a natural BQP-complete problem. | Freedman et al. 2003; Aharonov, Jones, Landau 2009; Zoo: Knot Invariants |

## Complexity and theory (`theory`)

New region. Mostly Concepts: what quantum computers can and cannot do, and how we know.

| id | Stop | Kind | Needs | Level | Scope | Sources |
|---|---|---|---|---|---|---|
| complexity-basics | Complexity classes 101 | Concept | | Beginner | P, NP, BPP and PSPACE: sorting problems by how cost grows with input size. | Arora, Barak 2009; Aaronson 2013 (QCSD); Complexity Zoo |
| speedup-types | Kinds of speedup | Concept | complexity-basics | Beginner | Exponential, polynomial, quadratic or none, and query speedups versus time speedups. | Montanaro 2016; Dalzell 2023 |
| extended-church-turing | Extended Church-Turing thesis | Concept | complexity-basics, multi-qubit | Beginner | The claim that any physical computer is at most polynomially faster than a probabilistic Turing machine, and why quantum challenges it. | Bernstein, Vazirani 1997; Aaronson 2013 (QCSD) |
| limits | What quantum computers cannot do | Concept | speedup-types, measurement | Beginner | No magic parallelism: no known fast way for NP-complete problems, unstructured search only gets a square root, n qubits give at most n bits out. | Aaronson 2008 (Sci. Am.); Bennett et al. 1997 |
| query-model | Query complexity | Concept | oracles, complexity-basics | Intermediate | Count oracle calls instead of time; where most proven quantum speedups live. | Ambainis 2018 (ICM); de Wolf LN (query lower bounds) |
| bqp | BQP | Concept | complexity-basics, universal, measurement | Intermediate | Problems a quantum computer solves in polynomial time with bounded error; contains BPP, inside PP and PSPACE. | Bernstein, Vazirani 1997; Adleman, DeMarrais, Huang 1997; Watrous 2008 |
| bqp-vs-np | BQP and NP | Concept | bqp, grover | Intermediate | Why quantum computers are not expected to solve NP-complete problems fast; Grover gives only a square root. | Bennett et al. 1997; Aaronson 2008; N&C 6.4 |
| bbbv | Search lower bound (BBBV) | Concept | query-model, grover | Intermediate | Proof that no quantum algorithm searches N items in fewer than about sqrt(N) queries, so Grover is optimal. | Bennett et al. 1997; Zalka 1999; N&C 6.6 |
| polynomial-method | Polynomial method | Concept | bbbv | Advanced | Lower bounds from the degree of polynomials that match acceptance odds; parity needs n/2 queries. | Beals et al. 2001; Farhi et al. 1998 (parity) |
| adversary-method | Adversary method | Concept | bbbv | Advanced | Lower bounds from how hard inputs are to tell apart; the negative-weight version is tight and matches span programs. | Ambainis 2002; Hoyer, Lee, Spalek 2007; Reichardt 2011 |
| speedup-needs-structure | Speedups need structure | Concept | polynomial-method, simon | Advanced | For total functions quantum is at most polynomially faster; exponential gaps need a promise or structure. | Beals et al. 2001; Aaronson, Ambainis 2014 |
| oracle-separations | Oracle separations | Concept | query-model, simon, bqp | Advanced | Oracle worlds where BQP beats BPP, NP and even the polynomial hierarchy (recursive Fourier sampling, Simon, Raz-Tal). | Bernstein, Vazirani 1997; Simon 1997; Raz, Tal 2019 |
| forrelation | Forrelation | Concept | oracle-separations, bernstein-vazirani | Advanced | Is one function correlated with the Fourier transform of another? 1 quantum query versus about sqrt(N) classical. | Aaronson, Ambainis 2015; Raz, Tal 2019 |
| classical-simulation | Classical simulation of quantum circuits | Concept | multi-qubit, entanglement, circuits | Intermediate | State vectors, tensor networks and Feynman paths; cost grows with qubits, depth and entanglement, which sets the bar for advantage. | Vidal 2003; Markov, Shi 2008; Pan, Chen, Zhang 2022 |
| gottesman-knill | Gottesman-Knill theorem | Concept | classical-simulation, universal | Intermediate | Clifford circuits are easy to simulate classically, even with entanglement; T gates (magic) add the power. | Gottesman 1998; Aaronson, Gottesman 2004; N&C 10.5 |
| model-equivalence | Models of quantum computing | Concept | bqp, adiabatic-optimization, quantum-walks | Intermediate | Circuit, adiabatic, measurement-based, topological and walk models all have the same power (BQP). | Raussendorf, Briegel 2001; Aharonov et al. 2007; Childs 2009 |
| bqp-complete | BQP-complete problems | Concept | bqp, simulation | Advanced | The hardest problems for quantum computers: simulating local Hamiltonians, approximating the Jones polynomial. | Freedman et al. 2003; Aharonov, Jones, Landau 2009 |
| dqc1 | One clean qubit (DQC1) | Concept | bqp-complete, mixed-states, hadamard-test | Advanced | The power of one pure qubit plus fully mixed ones; it estimates normalized traces, which looks hard classically. | Knill, Laflamme 1998; Shor, Jordan 2008 |
| qma | QMA | Concept | bqp | Advanced | Quantum NP: problems where a quantum proof can be checked by a quantum computer. | Kitaev, Shen, Vyalyi 2002; Watrous 2008; de Wolf LN (QMA) |
| local-hamiltonian | Local Hamiltonian problem | Concept | qma, simulation | Advanced | Ground-state energy is QMA-complete in general, so even quantum computers need a good start state (guided version is BQP-complete). | Kitaev, Shen, Vyalyi 2002; Kempe, Kitaev, Regev 2006; Gharibian, Le Gall 2022 |
| postbqp | PostBQP and sampling hardness | Concept | bqp, measurement | Advanced | With postselection, quantum equals PP; so exact classical sampling of quantum circuits would collapse the polynomial hierarchy. | Aaronson 2005; Bremner, Jozsa, Shepherd 2011 |
| supremacy-arguments | Why sampling is hard classically | Concept | postbqp, rcs, boson-sampling, extended-church-turing | Advanced | The chain of evidence (worst case, average case, anticoncentration) behind supremacy claims, and how classical spoofers fight back. | Harrow, Montanaro 2017; Bouland et al. 2019; Hangleiter, Eisert 2023 |
| proofs-of-quantumness | Proofs of quantumness | Concept | supremacy-arguments, shor | Advanced | Tests a classical verifier can check, built from trapdoor claw-free functions or random oracles. | Brakerski et al. 2018; Yamakawa, Zhandry 2022 |
| verification | Verifying quantum computations | Concept | proofs-of-quantumness, qma | Advanced | How a classical user can check a quantum computer's answer, with interactive proofs and cryptography. | Mahadev 2018; Gheorghiu, Kapourniotis, Kashefi 2019 |
| dequantization | Dequantization | Concept | recommendation, classical-simulation | Advanced | Classical sampling tricks that match many QML speedups once both sides get the same fast data access. | Tang 2019; Chia et al. 2022 |
| threshold-theorem | Threshold theorem | Concept | error-correction, bqp | Advanced | Below a constant error rate per gate, arbitrarily long quantum computations work with polylog overhead. | Aharonov, Ben-Or 1997; Knill, Laflamme, Zurek 1998; Aliferis, Gottesman, Preskill 2006 |
| noise-limits | Limits of noisy computers | Concept | threshold-theorem, classical-simulation, nisq | Advanced | Without error correction, noise makes deep circuits classically easy (noisy RCS, noisy optimization bounds). | Stilck Franca, Garcia-Patron 2021; Chen et al. 2022 (NISQ class); Aharonov et al. 2023 |
| no-fast-forwarding | No fast-forwarding | Concept | simulation, bbbv | Advanced | Simulating time t needs about t steps in general; only special systems can be fast-forwarded. | Berry et al. 2007; Atia, Aharonov 2017 |
| fine-print | Reading the fine print | Concept | hhl, state-prep, speedup-types | Intermediate | End-to-end costs: data loading, reading answers, constant factors and slow logical gates can erase speedups, quadratic ones most of all. | Aaronson 2015; Babbush et al. 2021; Hoefler, Haner, Troyer 2023 |

## Suggested learning lines

Existing lines are kept and extended. The old "More algorithms" line splits into Walks, Simulate nature and Linear algebra.

- **Oracle problems**: oracles, phase-kickback, deutsch, deutsch-jozsa, bernstein-vazirani, simon, hidden-shift
- **Road to Shor**: simon, qft, phase-estimation, quantum-arithmetic, order-finding, shor, discrete-log, rsa, post-quantum
- **Hidden structure**: simon, shor, discrete-log, abelian-hsp, non-abelian-hsp, kuperberg, pell-number-fields, regev-factoring
- **Search**: oracles, phase-kickback, grover, amplitude-amplification, quantum-counting, amplitude-estimation, minimum-finding, collision-finding, graph-queries, bbbv
- **Walks**: quantum-walks, ctqw, spatial-search, glued-trees, nand-tree, szegedy-walk, element-distinctness, triangle-finding, markov-speedup
- **Simulate nature**: simulation, analog-simulation, trotter, qdrift, lcu, block-encoding, qsp, qubitization, qsvt, no-fast-forwarding
- **Chemistry and materials**: fermion-mapping, vqe, electronic-structure, ground-state-prep, iterative-qpe, early-ft-qpe, femoco, condensed-matter, lattice-gauge, gibbs-sampling
- **Linear algebra**: state-prep, qram, block-encoding, hhl, linear-solvers, differential-equations, fine-print, dequantization
- **Near term**: nisq, variational, ansatz, parameter-shift, vqe, vqd, adapt-vqe, subspace-methods, imaginary-time, qaoa, qaoa-variants, barren-plateaus, error-mitigation
- **Quantum ML**: data-encoding, swap-test, quantum-kernels, qnn, quantum-generative, qpca, recommendation, dequantization, tda, classical-shadows, quantum-data-advantage, hamiltonian-learning
- **Optimization**: adiabatic-optimization, qaoa, minimum-finding, backtracking, gradient-estimation, sdp-solvers, dqi
- **Money and Monte Carlo**: amplitude-estimation, mc-speedup, option-pricing, markov-speedup
- **Codebreaking**: grover-crypto, collision-finding, shor, discrete-log, simon-attacks, regev-factoring, shor-resources, rsa, post-quantum
- **Proving advantage**: complexity-basics, extended-church-turing, bqp, rcs, xeb, boson-sampling, gbs, iqp, postbqp, supremacy-arguments, otoc-echoes, proofs-of-quantumness, verification
- **Limits**: speedup-types, limits, bbbv, bqp-vs-np, speedup-needs-structure, no-fast-forwarding, fine-print, dequantization, noise-limits
- **Query complexity**: query-model, bbbv, polynomial-method, adversary-method, oracle-separations, forrelation
- **Complexity classes**: complexity-basics, bqp, bqp-vs-np, qma, local-hamiltonian, bqp-complete, hadamard-test, jones-polynomial, dqc1, postbqp, classical-simulation, gottesman-knill, model-equivalence, threshold-theorem

## Counts

- Algorithms region: 96 stops = 58 algorithms, 31 building blocks, 7 concepts.
- Theory region: 29 stops, all concepts.
- Total: 125 stops (16 existing, 109 new). Every stop sits on at least one line.
- Change to an existing stop: `quantum-walks` moves from algorithm to building block, since it is a tool that search and element distinctness use. The draft's "12 algorithms plus 4 building blocks" becomes 11 plus 5.
- Changed needs: `shor` now needs `order-finding` (which needs `phase-estimation` and `quantum-arithmetic`).

## Checked and left out

- **Gauss sums, zeta functions, weight enumerators, three-manifold invariants, string rewriting** (Zoo): too niche; no teaching value at this level.
- **Matrix product verification, matrix rank, group commutativity, group isomorphism, counterfeit coins, junta testing, pattern matching, subset sum** (Zoo, oracular): narrow query results. Use them as extra examples inside search and walk stops.
- **Ordered search**: only a constant-factor speedup. Mention it inside `bbbv`.
- **Fixed-point and oblivious amplitude amplification**: folded into `qsp` and `lcu`.
- **Sparse-matrix, interaction-picture and open-system (Lindblad) simulation**: advanced variants. Fold them into `qubitization` and `simulation`.
- **VQLS, quantum natural gradient, quantum reservoir computing, QSVM via HHL**: minor variants. Fold them into `variational`, `hhl` and `quantum-kernels`.
- **Quantum speedups for SAT (Schoning plus Grover) and dynamic programming (TSP)**: folded into `minimum-finding` and `backtracking`.
- **Isogeny attacks**: folded into `hidden-shift` and `kuperberg`.
- **Lattice attacks (Chen 2024)**: the claimed fast quantum algorithm for LWE had a bug and was withdrawn. No known quantum speedup beyond generic ones. Cover this in `limits` and in the protocols region's `post-quantum`.
- **Quantum PCP, NLTS, MIP* = RE, QIP = PSPACE, QSZK, BQL**: research level. Maybe later as a blog post.
- **Communication complexity, fingerprinting, Holevo bound, certified randomness, blind computing, pseudorandom states**: protocols region. Certified randomness (Quantinuum 2025) builds on `rcs` and `proofs-of-quantumness`.
- **Uncomputation, Solovay-Kitaev, Clifford+T synthesis, measurement-based computing**: circuits or hardware region. `quantum-arithmetic` and `model-equivalence` point to them.
- **Quantum annealing machines and error-correction decoders**: hardware region (`annealing`, `error-correction`).
- **Quantum sensing and metrology**: a separate field, not in this curriculum.
- **"Quantum Monte Carlo" (physics)**: a classical method with a clashing name. Note it in `mc-speedup`.
- **Protein folding, drug design, logistics claims**: industry `use-cases`. No specific algorithm behind them.
- **D-Wave 2025 annealing advantage claim**: still disputed by classical rebuttals. Better as an `advantage` or `hype` case study in industry.
