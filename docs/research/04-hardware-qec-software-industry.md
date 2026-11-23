# Research 04: hardware, error correction, software, industry

Slice: `hardware`, new `qec`, new `software`, `industry`. Checked November 2026.

Counts: hardware 49, qec 43, software 37, industry 29. Total 158. Existing ids kept.

Notes for the editor:

- Move `error-correction`, `surface-code` and `logical-qubits` from `hardware` to `qec`.
- Keep `cloud` in `industry` (who sells access). New `run-on-hardware` in `software` covers how to use it.
- Some words in the A to Z list now have stops: fidelity (`fidelity`), threshold (`threshold`), syndrome (`syndrome`), Clifford gates (`clifford`), coherence time (`t1-t2`), physical qubit (`physical-vs-logical`).
- Company claims below are what the source says. Claims still in dispute are marked so.

## Hardware and machines (`hardware`)

| id | Stop | Needs | Level | Scope | Sources |
|---|---|---|---|---|---|
| divincenzo | What makes a good qubit | qubit, measurement, universal | Beginner | The DiVincenzo checklist every qubit type must pass: make, start, keep, compute, read. | DiVincenzo, Fortschr. Phys. 48, 771 (2000); Nielsen and Chuang ch. 7 |
| decoherence | Decoherence | phase, mixed-states | Beginner | How contact with the outside world turns a quantum state into a plain classical mix. | Nielsen and Chuang ch. 8; Preskill, Quantum 2, 79 (2018) |
| t1-t2 | Coherence times T1 and T2 | decoherence, bloch | Beginner | Energy loss (T1) and phase loss (T2), and how Ramsey and echo runs measure them. | Krantz et al., Appl. Phys. Rev. 6, 021318 (2019); Kjaergaard et al., Annu. Rev. CMP 11, 369 (2020) |
| noise-channels | Noise channels | decoherence, pauli | Intermediate | Bit flip, phase flip, depolarizing and amplitude damping as Kraus maps, the language QEC uses. | Nielsen and Chuang ch. 8 |
| noise-sources | Where noise comes from | t1-t2 | Intermediate | Real causes by platform: defects in materials, flux and charge noise, laser and motion noise, crosstalk. | Muller et al., Rep. Prog. Phys. 82, 124501 (2019); Paladino et al., RMP 86, 361 (2014); Sarovar et al., Quantum 4, 321 (2020) |
| leakage | Leakage | noise-sources, transmon | Advanced | When a qubit slips into a third level outside 0 and 1, and why simple error models miss it. | Krantz et al. (2019); Google Quantum AI, Nat. Phys. (2023) on leakage removal |
| qubit-control | Driving a qubit | rotations, t1-t2 | Intermediate | Microwave or laser pulses turn the qubit on the Bloch sphere; Rabi oscillations, pulse shape, timing. | Krantz et al. (2019); Bruzewicz et al., Appl. Phys. Rev. 6, 021314 (2019) |
| readout | Reading out qubits | measurement, qubit-control | Intermediate | Dispersive readout with amplifiers for chips, glowing (fluorescence) for ions and atoms, and readout error. | Blais et al., RMP 93, 025005 (2021); Walter et al., PR Applied 7, 054020 (2017); Bruzewicz et al. (2019) |
| native-gates | Native gates and couplers | cnot, universal, qubit-control | Intermediate | What each machine really does (CZ, iSWAP, cross-resonance, Molmer-Sorensen, Rydberg CZ) and how CNOT is built from it. | Krantz et al. (2019); Molmer and Sorensen, PRL 82, 1835 (1999); Jaksch et al., PRL 85, 2208 (2000) |
| connectivity | Qubit connectivity | native-gates, toffoli | Beginner | Which qubits can talk: grid, heavy-hex, all-to-all ions, moving atoms, and the SWAP cost of poor links. | Chamberland et al., PRX 10, 011022 (2020); Bluvstein et al., Nature 604, 451 (2022) |
| calibration | Calibration and drift | qubit-control, t1-t2 | Intermediate | Tuning frequencies and pulse shapes (for example DRAG), then tuning again as qubits drift; often automated. | Kelly et al., arXiv:1803.03226 (2018); Motzoi et al., PRL 103, 110501 (2009) |
| mid-circuit | Mid-circuit measurement and feed-forward | readout, circuits | Intermediate | Measure some qubits mid-run, reset them, and branch on the result; needed for QEC and teleportation. | Corcoles et al., PRL 127, 100501 (2021); Pino et al., Nature 592, 209 (2021) |
| superconducting | Superconducting qubits | decoherence | Beginner | Qubits made from small chip circuits that act like artificial atoms near absolute zero. | Kjaergaard et al. (2020); Krantz et al. (2019) |
| josephson-junction | Josephson junction | superconducting | Intermediate | The lossless nonlinear part that makes circuit energy levels uneven; basis of the 2025 Nobel Prize. | Nobel Prize in Physics 2025, nobelprize.org; Krantz et al. (2019) |
| transmon | Transmon | josephson-junction | Intermediate | The workhorse superconducting qubit, made less sensitive to charge noise. | Koch et al., PRA 76, 042319 (2007); Kjaergaard et al. (2020) |
| fluxonium | Fluxonium | transmon | Advanced | A low-frequency circuit qubit with very long coherence, traded for harder control. | Manucharyan et al., Science 326, 113 (2009); Somoroff et al., PRL 130, 267001 (2023) |
| circuit-qed | Circuit QED | transmon, readout | Advanced | Qubits coupled to microwave resonators: the toolkit for readout, couplers and bosonic qubits. | Blais et al., RMP 93, 025005 (2021) |
| cryogenics | Dilution refrigerators | superconducting | Beginner | How fridges reach about 10 millikelvin, why they need helium-3, and the heat budget of wires. | Krinner et al., EPJ Quantum Technol. 6, 2 (2019); Kjaergaard et al. (2020) |
| control-electronics | Control electronics and wiring | qubit-control, cryogenics | Intermediate | Signal sources, FPGAs, cables and cold CMOS chips, and why one cable per qubit cannot reach a million. | Reilly, npj Quantum Inf. 1, 15011 (2015); Krinner et al. (2019) |
| trapped-ions | Trapped ions | decoherence | Beginner | Charged atoms held by electric fields and driven by lasers; long coherence and all-to-all links. | Bruzewicz et al. (2019); Cirac and Zoller, PRL 74, 4091 (1995) |
| qccd | Moving ions on a chip (QCCD) | trapped-ions, native-gates | Advanced | Shuttle ions between zones to grow past one ion chain; used in Quantinuum H-series and Helios. | Kielpinski, Monroe, Wineland, Nature 417, 709 (2002); Pino et al. (2021); Quantinuum Helios docs |
| neutral-atoms | Neutral atoms | decoherence | Beginner | Atoms held in laser tweezers, thousands at a time, made to interact through Rydberg states. | Henriet et al., Quantum 4, 327 (2020); Saffman, Walker, Molmer, RMP 82, 2313 (2010) |
| rydberg | Rydberg blockade gates | neutral-atoms, native-gates | Intermediate | One excited atom blocks its neighbor from exciting, which gives a fast two-qubit gate. | Jaksch et al. (2000); Saffman et al. (2010) |
| atom-arrays | Tweezer arrays and moving atoms | neutral-atoms, connectivity | Intermediate | Sorting atoms into full arrays, moving them mid-circuit, atom loss and reloading. | Bluvstein et al., Nature 604, 451 (2022); Manetsch et al., arXiv:2403.12021 (6100 atoms) |
| photonic | Photonic qubits | decoherence | Beginner | Qubits carried by light: room temperature and easy to send, but hard to make interact and easy to lose. | Slussarenko and Pryde, Appl. Phys. Rev. 6, 041303 (2019) |
| photon-hardware | Photon sources and detectors | photonic | Intermediate | Making single or squeezed photons on demand, catching them with superconducting detectors, and fighting loss. | Slussarenko and Pryde (2019); PsiQuantum, Nature (2025) Omega chipset |
| linear-optics | Linear optical computing | photonic, interference | Advanced | Beam splitters, Hong-Ou-Mandel bunching, and the KLM proof that measurement can stand in for photon-photon contact. | Knill, Laflamme, Milburn, Nature 409, 46 (2001) |
| mbqc | Measurement-based computing | entanglement, measurement, cnot | Advanced | Compute by measuring a big entangled cluster state; photonic fusion designs build on it. Could also sit in `circuits`. | Raussendorf and Briegel, PRL 86, 5188 (2001); Bartolucci et al., Nat. Commun. 14, 912 (2023) |
| continuous-variable | Continuous-variable computing | photonic | Advanced | Using light-field amplitudes (qumodes, squeezed states) instead of two-level qubits. | Braunstein and van Loock, RMP 77, 513 (2005); Xanadu Aurora, Nature (2025) |
| spin-qubits | Spin qubits | decoherence | Beginner | Single electron or nuclear spins in silicon dots or donors, close to normal chip making. | Burkard et al., RMP 95, 025003 (2023); Loss and DiVincenzo, PRA 57, 120 (1998) |
| silicon-fab | Qubits from chip factories | spin-qubits, scaling | Intermediate | Making qubits on 300 mm CMOS lines, with yield and device-to-device spread as the hard parts. | Intel Tunnel Falls release (June 2023); George et al., arXiv:2410.16583 (2024) |
| nv-centers | NV centers and color centers | spin-qubits | Intermediate | Defects in diamond and other crystals with spins read by light; strong for networks and sensing, small as computers. | Doherty et al., Phys. Rep. 528, 1 (2013); Hensen et al., Nature 526, 682 (2015) |
| anyons | Anyons and braiding | entanglement, phase | Advanced | 2D quasiparticles whose swaps act as gates, so the information lives in global shape (topology). | Nayak et al., RMP 80, 1083 (2008); Kitaev, Ann. Phys. 303, 2 (2003) |
| topological | Topological qubits and Majoranas | anyons, superconducting | Advanced | The Majorana route, Microsoft Majorana 1 (Feb 2025), and why most physicists are not yet convinced. | Microsoft Quantum, Nature 638, 651 (2025); Science News (Feb 2025); Nayak et al. (2008) |
| cat-qubits | Cat and bosonic qubits | circuit-qed | Advanced | A qubit stored in many photons of a cavity; cat states almost never bit-flip (Alice & Bob, AWS Ocelot). | Mirrahimi et al., NJP 16, 045014 (2014); AWS and Caltech, Nature (Feb 2025) Ocelot |
| annealing | Quantum annealing | decoherence | Beginner | Let a spin system settle into a low-energy answer to an optimization problem; D-Wave's approach. | Kadowaki and Nishimori, PRE 58, 5355 (1998); Johnson et al., Nature 473, 194 (2011); Hauke et al., Rep. Prog. Phys. 83, 054401 (2020) |
| adiabatic | Adiabatic quantum computing | annealing, simulation | Advanced | The slow-change theorem behind annealing, the energy gap problem, and its match with the circuit model. | Farhi et al., arXiv:quant-ph/0001106 (2000); Albash and Lidar, RMP 90, 015002 (2018) |
| nmr | NMR quantum computing | qubit-control | Intermediate | Spins in liquid molecules ran the first small algorithms, including factoring 15 in 2001, but cannot scale. | Vandersypen et al., Nature 414, 883 (2001); Nielsen and Chuang ch. 7 |
| analog-simulators | Analog quantum simulators | simulation, neutral-atoms | Intermediate | Using atoms or ions as a tunable model of another quantum system, with no gates. | Georgescu, Ashhab, Nori, RMP 86, 153 (2014); Daley et al., Nature 607, 667 (2022) |
| modality-compare | Comparing qubit types | superconducting, trapped-ions, neutral-atoms, photonic, spin-qubits | Beginner | Side by side: gate speed, coherence, fidelity, links, temperature and how far each can grow. | Kjaergaard et al. (2020); Bruzewicz et al. (2019); Henriet et al. (2020) |
| fidelity | Fidelity and error rates | mixed-states, universal | Intermediate | State fidelity, gate fidelity and error per gate, and why 99.9 percent is still not enough at scale. | Nielsen and Chuang ch. 9; Eisert et al., Nat. Rev. Phys. 2, 382 (2020) |
| tomography | Tomography | fidelity, measurement | Advanced | Rebuild a state, a process or a full gate set from many measurements, and why the cost explodes. | Nielsen and Chuang ch. 8; Blume-Kohout et al., Nat. Commun. 8, 14485 (2017); Nielsen et al., Quantum 5, 557 (2021) |
| randomized-benchmarking | Randomized benchmarking | fidelity, clifford | Intermediate | Random Clifford sequences give an average error per gate that ignores setup and readout errors. | Knill et al., PRA 77, 012307 (2008); Magesan et al., PRL 106, 180504 (2011); Erhard et al., Nat. Commun. 10, 5347 (2019) |
| xeb | Cross-entropy benchmarking | fidelity, circuits | Advanced | Score random circuits by how often the device hits the likely outputs; the metric behind sampling claims. | Boixo et al., Nat. Phys. 14, 595 (2018); Arute et al., Nature 574, 505 (2019) |
| quantum-volume | Quantum volume | randomized-benchmarking, connectivity | Intermediate | One number for the largest square random circuit a machine runs well, and what it hides. | Cross et al., PRA 100, 032328 (2019) |
| system-metrics | Speed and scale metrics | quantum-volume | Advanced | CLOPS for speed, layer fidelity and EPLG for big chips, algorithmic qubits, and why no single number wins. | Wack et al., arXiv:2110.14108 (2021); McKay et al., arXiv:2311.05933 (2023); Proctor et al., arXiv:2407.08828 (2024) |
| scaling | Scaling up | control-electronics, connectivity | Intermediate | What breaks going from 100 to a million qubits: wiring, heat, yield, size, calibration time. | Bravyi et al., J. Appl. Phys. 132, 160902 (2022); Reilly (2015) |
| modularity | Modular machines and links | scaling, teleportation | Advanced | Linking chips or traps with couplers or photons; Oxford ran a two-module distributed algorithm in 2025. | Monroe et al., PRA 89, 022317 (2014); Awschalom et al., PRX Quantum 2, 017002 (2021); Main et al., Nature 638, 383 (2025) |
| nisq | NISQ era | decoherence, circuits | Beginner | Today's noisy machines, from about 50 to a few hundred qubits, without full error correction. | Preskill, Quantum 2, 79 (2018) |

## Error correction and fault tolerance (`qec`, new)

| id | Stop | Needs | Level | Scope | Sources |
|---|---|---|---|---|---|
| classical-codes | Classical error correction | | Beginner | Parity bits, repetition and Hamming codes, and distance: the classical ideas QEC borrows. | MacKay, Information Theory, Inference and Learning Algorithms (2003) ch. 1; Nielsen and Chuang ch. 10 |
| error-correction | Error correction: the big idea | decoherence, cnot, no-cloning, classical-codes | Beginner | Copying is banned and looking breaks the state, yet we can still protect a qubit by spreading it over many. Moved from `hardware`. | Nielsen and Chuang ch. 10; Terhal, RMP 87, 307 (2015) |
| physical-vs-logical | Physical vs logical qubits | error-correction | Beginner | One reliable logical qubit is built from many noisy physical ones; that overhead is the price. | Terhal (2015); Fowler et al., PRA 86, 032324 (2012) |
| repetition-code | Repetition codes | error-correction, hadamard | Beginner | The 3-qubit bit-flip code and its phase-flip twin, each fixing only one kind of error. | Nielsen and Chuang 10.1; Google Quantum AI, Nature 595, 383 (2021) |
| syndrome | Syndrome measurement | repetition-code, measurement | Beginner | Ancilla qubits measure parity checks that reveal the error but not the data. | Nielsen and Chuang 10.1; Terhal (2015) |
| code-distance | Code distance and [[n,k,d]] | repetition-code | Intermediate | How many errors a code can spot or fix, and how to read the n, k, d labels. | Gottesman, arXiv:quant-ph/9705052 (1997); Terhal (2015) |
| error-discretization | Errors become Paulis | syndrome, noise-channels | Intermediate | Measuring the syndrome snaps any small error onto X, Y or Z; Knill-Laflamme says when recovery works. | Knill and Laflamme, PRA 55, 900 (1997); Nielsen and Chuang 10.2 |
| shor-code | Shor code | repetition-code, error-discretization | Intermediate | Nine qubits that fix any single error: the first quantum code (1995). | Shor, PRA 52, R2493 (1995) |
| steane-code | Steane code | shor-code, classical-codes | Intermediate | Seven qubits built from the classical Hamming code. | Steane, PRL 77, 793 (1996) |
| clifford | Clifford gates and Gottesman-Knill | pauli, hadamard, phase-gates, cnot | Intermediate | Gates that map Paulis to Paulis; circuits of only these are easy to simulate on a normal computer. | Gottesman, arXiv:quant-ph/9807006 (1998); Aaronson and Gottesman, PRA 70, 052328 (2004) |
| stabilizers | Stabilizer formalism | clifford, syndrome, shor-code | Intermediate | Describe a code by the Pauli checks that leave it unchanged, not by long state vectors. | Gottesman thesis, arXiv:quant-ph/9705052 (1997); Nielsen and Chuang 10.5 |
| five-qubit-code | Five-qubit code | stabilizers | Advanced | The smallest code that fixes any single-qubit error. | Laflamme et al., PRL 77, 198 (1996); Bennett et al., PRA 54, 3824 (1996) |
| css-codes | CSS codes | stabilizers, steane-code | Advanced | Build a quantum code from two classical codes, one for X errors and one for Z errors. | Calderbank and Shor, PRA 54, 1098 (1996); Steane, Proc. R. Soc. A 452, 2551 (1996) |
| subsystem-codes | Subsystem codes (Bacon-Shor) | stabilizers | Advanced | Codes with extra gauge qubits that allow simpler, smaller checks. | Bacon, PRA 73, 012340 (2006); Poulin, PRL 95, 230504 (2005) |
| surface-code | Surface code | syndrome, code-distance | Intermediate | A 2D grid of data and check qubits with only neighbor links and a high threshold; the leading plan. Moved from `hardware`. Stabilizers deepen it. | Fowler et al., PRA 86, 032324 (2012); Bravyi and Kitaev, arXiv:quant-ph/9811052 (1998) |
| toric-code | Toric code | surface-code, stabilizers, anyons | Advanced | Kitaev's code on a donut shape where errors show up as anyon pairs; parent of the surface code. | Kitaev, Ann. Phys. 303, 2 (2003); Dennis et al., J. Math. Phys. 43, 4452 (2002) |
| repeated-rounds | Repeated rounds and detectors | surface-code, readout | Advanced | The checks can be wrong too, so they repeat and are decoded in space and time together. | Dennis et al. (2002); Gidney, Quantum 5, 497 (2021) |
| decoders | Decoders | repeated-rounds | Advanced | Turning syndromes into fixes: matching (MWPM), union-find, belief propagation plus OSD, and neural decoders like AlphaQubit. | Higgott and Gidney, arXiv:2303.15933 (2023); Delfosse and Nickerson, Quantum 5, 595 (2021); Bausch et al., Nature (2024) |
| real-time-decoding | Real-time decoding | decoders, control-electronics | Advanced | The decoder must keep pace with about a million rounds per second, or a backlog builds up. | Google Quantum AI, Nature 638, 920 (2025); Terhal (2015) |
| threshold | Threshold | surface-code, code-distance | Intermediate | Below a certain physical error rate, a bigger code gives fewer logical errors; above it, more. | Aharonov and Ben-Or, STOC (1997); Fowler et al. (2012); Google Quantum AI, Nature 638, 920 (2025) |
| concatenated-codes | Concatenated codes | steane-code, threshold | Advanced | Codes inside codes, and how this gave the first proofs of the threshold theorem. | Knill, Laflamme, Zurek, Science 279, 342 (1998); Aliferis, Gottesman, Preskill, QIC 6, 97 (2006) |
| fault-tolerance | Fault-tolerant circuits | stabilizers, syndrome | Advanced | Design every step so one fault never spreads into an error the code cannot fix; cat and flag ancillas. | Gottesman, arXiv:0904.2557 (2009); Chao and Reichardt, PRL 121, 050502 (2018) |
| transversal-gates | Transversal gates and Eastin-Knill | fault-tolerance, css-codes | Advanced | Gates done qubit by qubit are safe, but no code gets a full universal set this way; code switching helps. | Eastin and Knill, PRL 102, 110502 (2009); Anderson et al., PRL 113, 080501 (2014) |
| lattice-surgery | Lattice surgery | surface-code | Advanced | Logical gates by merging and splitting surface code patches; replaced older defect braiding. | Horsman et al., NJP 14, 123011 (2012); Litinski, Quantum 3, 128 (2019) |
| magic-states | Magic states and distillation | transversal-gates, universal | Advanced | The T gate comes from injected magic states, cleaned by distillation or the newer cultivation. | Bravyi and Kitaev, PRA 71, 022316 (2005); Gidney, Shutty, Jones, arXiv:2409.17595 (2024) |
| color-codes | Color codes | surface-code, transversal-gates | Advanced | 2D codes with easy Clifford gates; Google showed error drop from distance 3 to 5 in 2025. | Bombin and Martin-Delgado, PRL 97, 180501 (2006); Google Quantum AI, Nature 645, 614 (2025) |
| qldpc | qLDPC codes | css-codes, connectivity | Advanced | Sparse-check codes that store many logical qubits per physical qubit but need longer links (IBM gross code). | Breuckmann and Eberhardt, PRX Quantum 2, 040101 (2021); Bravyi et al., Nature 627, 778 (2024); Panteleev and Kalachev, STOC (2022) |
| floquet-codes | Floquet codes | stabilizers, repeated-rounds | Advanced | Codes whose checks change each round (honeycomb code), built only from two-qubit measurements. | Hastings and Haah, Quantum 5, 564 (2021) |
| biased-noise | Biased noise and tailored codes | surface-code, cat-qubits | Advanced | When one error type dominates, codes like XZZX, or a plain repetition code on cat qubits, cost far less. | Bonilla Ataides et al., Nat. Commun. 12, 2172 (2021); AWS and Caltech, Nature (2025) Ocelot |
| erasure | Erasure qubits | code-distance, leakage | Advanced | Turn errors into flagged losses at known places, which codes fix about twice as well. | Wu et al., Nat. Commun. 13, 4657 (2022); Kubica et al., PRX 13, 041022 (2023) |
| bosonic-codes | Bosonic codes | cat-qubits, stabilizers | Advanced | Encode in one oscillator (cat, binomial, GKP); the first codes to beat break-even. | Gottesman, Kitaev, Preskill, PRA 64, 012310 (2001); Ofek et al., Nature 536, 441 (2016); Sivak et al., Nature 616, 50 (2023) |
| correlated-errors | Correlated errors and cosmic rays | noise-sources, threshold | Advanced | Bursts that hit many qubits at once break the "errors are independent" rule codes rely on. | McEwen et al., Nat. Phys. 18, 107 (2022); Terhal (2015) |
| logical-qubits | Logical qubits in practice | surface-code, threshold | Intermediate | Real demos: Google below threshold (2024), Harvard and QuEra 48 logical qubits (2023), Microsoft with Quantinuum and Atom (2024). Moved from `hardware`. | Google Quantum AI, Nature 638, 920 (2025); Bluvstein et al., Nature 626, 58 (2024); Microsoft Azure Quantum blog (Apr and Nov 2024) |
| resource-estimation | Resource estimation | magic-states, lattice-surgery, shor | Advanced | Counting logical qubits, T gates and run time for a real task; RSA-2048 estimates fell from 20 million to under 1 million noisy qubits. | Gidney and Ekera, Quantum 5, 433 (2021); Gidney, arXiv:2505.15917 (2025); Beverland et al., arXiv:2211.07629 (2022) |
| ftqc-architecture | Fault-tolerant architecture | lattice-surgery, magic-states, real-time-decoding | Advanced | How the whole machine fits: logical layout, magic state factories, decoders and the control loop. | Litinski (2019); IBM Research blog "path to Starling" (2025); Beverland et al. (2022) |
| error-suppression | Error suppression | t1-t2, qubit-control | Intermediate | Stop errors before they happen with dynamical decoupling, echoes and better pulse shapes. | Viola, Knill, Lloyd, PRL 82, 2417 (1999); Motzoi et al. (2009) |
| error-mitigation | Error mitigation vs correction | nisq, noise-channels | Intermediate | Fix the average answer afterwards by running more; it does not protect the qubits like QEC does. | Cai et al., RMP 95, 045005 (2023); Kim et al., Nature 618, 500 (2023) |
| zne | Zero-noise extrapolation | error-mitigation | Intermediate | Run at boosted noise, then draw the line back to zero noise. | Temme, Bravyi, Gambetta, PRL 119, 180509 (2017); Li and Benjamin, PRX 7, 021050 (2017); Kandala et al., Nature 567, 491 (2019) |
| pec | Probabilistic error cancellation | error-mitigation, noise-channels | Advanced | Learn the noise, then cancel it on average with random signed corrections. | Temme et al. (2017); van den Berg et al., Nat. Phys. 19, 1116 (2023) |
| readout-mitigation | Readout error mitigation | readout, error-mitigation | Intermediate | Measure how often 0 reads as 1, then undo it in the counts. | Bravyi et al., PRA 103, 042605 (2021); Nation et al., PRX Quantum 2, 040326 (2021) |
| twirling | Pauli twirling and randomized compiling | pauli, noise-channels | Advanced | Randomize gates so messy coherent errors turn into simple Pauli noise. | Wallman and Emerson, PRA 94, 052325 (2016) |
| mitigation-zoo | More mitigation methods | error-mitigation | Advanced | Symmetry checks, post-selection, virtual distillation and Clifford data regression. | Cai et al. (2023); Huggins et al., PRX 11, 041036 (2021); Czarnik et al., Quantum 5, 592 (2021) |
| mitigation-limits | Limits of mitigation | pec, zne | Advanced | Cost grows exponentially with size and noise, so mitigation is a bridge, not the end goal. | Takagi et al., npj Quantum Inf. 8, 114 (2022); Quek et al., Nat. Phys. (2024); Cai et al. (2023) |

## Software and tools (`software`, new)

| id | Stop | Needs | Level | Scope | Sources |
|---|---|---|---|---|---|
| software-stack | The quantum software stack | circuits | Beginner | Layers from app to algorithm, circuit, compiler, pulses and chip, and where each tool sits. | Javadi-Abhari et al., arXiv:2405.08810 (2024); Qiskit docs |
| hello-quantum | Your first quantum program | bell-states, software-stack | Beginner | Write a Bell circuit in an SDK, run it on a simulator, read the counts. | Qiskit docs; Cirq docs |
| shots | Shots and counts | measurement | Beginner | Each run gives one bitstring; many shots make a histogram; error shrinks as one over the square root of shots. | Nielsen and Chuang 2.2; Qiskit primitives docs |
| qiskit | Qiskit | hello-quantum | Intermediate | IBM's open-source SDK: circuits, transpiler, primitives, runtime; v2.0 removed pulse control. | Javadi-Abhari et al. (2024); Qiskit SDK 2.0 release notes |
| cirq | Cirq | hello-quantum | Intermediate | Google's Python SDK for near-term circuits with device-aware layers, paired with the qsim simulator. | Cirq docs, quantumai.google/cirq |
| pennylane | PennyLane | hello-quantum, variational | Intermediate | Xanadu's library for differentiable circuits and quantum machine learning across many backends. | Bergholm et al., arXiv:1811.04968 (2018); PennyLane docs |
| qsharp | Q# and the Microsoft QDK | hello-quantum | Intermediate | Microsoft's quantum language and kit, with a resource estimator and Azure Quantum access. | Microsoft Learn, Azure Quantum docs; Svore et al., RWDSL (2018) |
| cuda-q | CUDA-Q | hello-quantum | Intermediate | NVIDIA's open platform for hybrid programs on GPUs, simulators and QPUs. | NVIDIA CUDA-Q docs; NVIDIA NVQLink release (2025) |
| braket | Amazon Braket SDK | hello-quantum, cloud | Intermediate | One Python SDK to reach several vendors' machines and simulators on AWS. | Amazon Braket docs |
| tket | tket | compilers | Intermediate | Quantinuum's platform-neutral compiler and SDK (pytket). | Sivarajah et al., QST 6, 014003 (2021) |
| sdk-zoo | Other SDKs and how to choose | hello-quantum | Beginner | pyQuil, Ocean, Strawberry Fields, Qrisp, Classiq and others, and how to pick by goal and hardware. | Smith et al., arXiv:1608.03355 (2016); Killoran et al., Quantum 3, 129 (2019); D-Wave Ocean docs |
| quantum-languages | Quantum programming languages | software-stack | Intermediate | Beyond Python libraries: Q#, Silq, Quipper, Guppy; types, uncomputation and safety. | Bichsel et al., PLDI (2020); Green et al., PLDI (2013) |
| openqasm | OpenQASM | circuits | Intermediate | The text format for circuits; version 3 adds classical control, timing and pulse hooks. | Cross et al., arXiv:1707.03429 (2017); Cross et al., ACM TQC 3, 12 (2022) |
| qir | QIR and compiler IRs | openqasm, compilers | Advanced | LLVM- and MLIR-based middle formats that let many languages target many machines. | QIR Alliance spec, qir-alliance.org; McCaskey and Nguyen, arXiv:2101.11365 (2021) |
| simulators | Classical simulators | multi-qubit | Beginner | Why memory doubles with each qubit, so normal computers stop near 50 qubits for exact simulation. | De Raedt et al., Comput. Phys. Commun. 237, 47 (2019); Nielsen and Chuang ch. 4 |
| statevector-sim | Statevector simulation | simulators | Intermediate | Store all 2 to the n amplitudes and apply gates as matrix steps; exact but hungry for memory. | De Raedt et al. (2019); Qiskit Aer docs |
| density-matrix-sim | Noisy simulation | statevector-sim, noise-channels | Intermediate | Density matrices or random trajectories with noise models to act like real hardware. | Qiskit Aer noise docs; Johansson, Nation, Nori, CPC 184, 1234 (2013) |
| stabilizer-sim | Stabilizer simulation | clifford, simulators | Intermediate | Clifford circuits on thousands of qubits in seconds (Stim), the engine of most QEC studies. | Aaronson and Gottesman (2004); Gidney, Quantum 5, 497 (2021) |
| tensor-network-sim | Tensor network simulation | simulators, entanglement | Advanced | Compress low-entanglement states (MPS and more); the tool that keeps challenging advantage claims. | Vidal, PRL 91, 147902 (2003); Markov and Shi, SIAM J. Comput. 38, 963 (2008); Tindall et al., PRX Quantum 5, 010308 (2024) |
| gpu-sim | GPU and HPC simulation | statevector-sim | Intermediate | Speeding simulators with GPUs and clusters (cuQuantum, qsim). | NVIDIA cuQuantum docs; qsim docs, quantumai.google |
| open-systems-sim | Pulse and open-system simulation | density-matrix-sim, pulse-control | Advanced | Simulate the physics under the gates: Hamiltonians, pulses, decay (QuTiP, Qiskit Dynamics). | Johansson et al. (2013); Qiskit Dynamics docs |
| compilers | Compilation and transpilation | universal, circuits, native-gates | Intermediate | Turn an ideal circuit into one the device can run: decompose, map, route, optimize, schedule. | Javadi-Abhari et al. (2024); Sivarajah et al. (2021) |
| gate-synthesis | Gate synthesis | universal, rotations | Advanced | Break any unitary into native gates: KAK for two qubits, Solovay-Kitaev and exact Clifford+T methods. | Dawson and Nielsen, QIC 6, 81 (2006); Ross and Selinger, QIC 16, 901 (2016); Vatan and Williams, PRA 69, 032315 (2004) |
| qubit-routing | Qubit mapping and routing | connectivity, compilers | Intermediate | Place qubits on the chip and add SWAPs so every gate acts on neighbors (for example SABRE). | Li, Ding, Xie, ASPLOS (2019); Cowtan et al., TQC (2019) |
| circuit-optimization | Circuit optimization | compilers | Intermediate | Cancel, merge and reorder gates to cut depth and the count of two-qubit gates. | Nam et al., npj Quantum Inf. 4, 23 (2018) |
| pulse-control | Pulse-level control | qubit-control, compilers | Advanced | Program the analog pulses under gates (OpenPulse); IBM replaced Qiskit Pulse with fractional gates in 2025. | Alexander et al., QST 5, 044006 (2020); Qiskit SDK 2.0 release notes |
| optimal-control | Optimal control | pulse-control | Advanced | Numerically design pulses for faster, cleaner gates (GRAPE, CRAB). | Khaneja et al., J. Magn. Reson. 172, 296 (2005); Glaser et al., EPJ D 69, 279 (2015) |
| circuit-cutting | Circuit cutting | compilers, simulators | Advanced | Split a big circuit into small pieces, run them apart, then stitch results at a sampling cost. | Peng et al., PRL 125, 150504 (2020); Mitarai and Fujii, NJP 23, 023021 (2021) |
| hybrid-loops | Hybrid loops and primitives | variational, shots | Intermediate | A classical optimizer calls the QPU for samples or expectation values (Sampler, Estimator) in sessions. | Qiskit Runtime primitives docs; Cerezo et al., Nat. Rev. Phys. 3, 625 (2021) |
| qubo | Programming an annealer | annealing | Intermediate | Write a problem as QUBO or Ising, embed it on the chip graph, sample answers. | Lucas, Front. Phys. 2, 5 (2014); D-Wave Ocean docs |
| run-on-hardware | Running on real hardware | hello-quantum, cloud, fidelity | Beginner | Accounts, backends, queues, reading calibration data, picking good qubits, and cost. | IBM Quantum docs; Amazon Braket docs |
| mitigation-tools | Mitigation in software | error-mitigation | Intermediate | Using Mitiq or Qiskit Runtime options to apply ZNE, PEC and readout fixes. | LaRose et al., Quantum 6, 774 (2022); Qiskit Runtime docs |
| qec-tools | QEC software | stabilizer-sim, decoders | Advanced | Build, simulate and decode codes with Stim, Sinter and PyMatching. | Gidney (2021); Higgott and Gidney (2023) |
| resource-estimators | Resource estimators | resource-estimation | Advanced | Tools that turn an algorithm into qubit and time counts (Azure Quantum Resource Estimator, Qualtran). | Beverland et al. (2022); Harrigan et al., arXiv:2409.04643 (2024) |
| benchmark-tools | Benchmark suites | quantum-volume, compilers | Intermediate | Shared test sets for devices and compilers (QED-C suite, SupermarQ, MQT Bench, Benchpress). | Lubinski et al., IEEE TQE 4 (2023); Tomesh et al., HPCA (2022); Quetschlich et al., Quantum 7, 1062 (2023) |
| debugging | Testing and debugging | hello-quantum, simulators | Intermediate | You cannot peek mid-run, so test with simulators, statistical checks and assertions. | Huang and Martonosi, ISCA (2019); Zhao, arXiv:2007.07047 (2020) |
| hybrid-hpc | Quantum plus supercomputers | hybrid-loops, cloud | Advanced | QPUs as accelerators next to CPUs and GPUs, with schedulers and fast links (NVQLink). | Alexeev et al., Future Gener. Comput. Syst. 160, 666 (2024); NVIDIA NVQLink release (2025) |

## Industry and business (`industry`)

| id | Stop | Needs | Level | Scope | Sources |
|---|---|---|---|---|---|
| history | A short history | qubit | Beginner | From Feynman's 1981 idea and Shor's 1994 algorithm to first chips, cloud access and error correction. | Feynman, Int. J. Theor. Phys. 21, 467 (1982); Preskill, arXiv:2106.10522 (2021); arXiv:2412.14703 (2024) |
| nobel-prizes | Nobel prizes behind the field | history | Beginner | 2012 (Haroche, Wineland), 2022 (Aspect, Clauser, Zeilinger), 2025 (Clarke, Devoret, Martinis) and what each enabled. | nobelprize.org (2012, 2022, 2025) |
| who-builds | Who builds quantum computers | modality-compare | Beginner | Main builders by qubit type, from big tech to startups and national labs. See fact table. | Company sites; McKinsey Quantum Technology Monitor (2025) |
| cloud | Real hardware in the cloud | circuits | Beginner | IBM put a chip online on 4 May 2016; AWS, Microsoft and others now resell many vendors' machines. | IBM newsroom (4 May 2016); Amazon Braket docs; Azure Quantum docs |
| roadmaps | Roadmaps | logical-qubits | Intermediate | What IBM, Google, Quantinuum, IonQ, QuEra, Pasqal and PsiQuantum promise and by when, how often dates slip, and who checks (DARPA QBI). | IBM roadmap (June 2025); Google Quantum AI roadmap; DARPA QBI Stage B (Nov 2025) |
| advantage | Quantum advantage | nisq | Beginner | What "supremacy", "advantage" and "utility" mean, and why a useful, checked speedup is the real goal. | Preskill, arXiv:1203.5813 (2012); Harrow and Montanaro, Nature 549, 203 (2017) |
| rcs | Random circuit sampling | advantage, xeb | Intermediate | The test task behind Google and USTC claims: hard to fake, but no use of its own. | Boixo et al. (2018); Aaronson and Chen, CCC (2017) |
| boson-sampling | Boson sampling | advantage, photonic | Intermediate | Sampling photons through a random optical network; the task behind Jiuzhang and Borealis. | Aaronson and Arkhipov, STOC (2011); Hamilton et al., PRL 119, 170501 (2017); Madsen et al., Nature 606, 75 (2022) |
| sycamore-2019 | Google 2019 and the pushback | rcs | Intermediate | 53 qubits, about 200 s vs a claimed 10,000 years; IBM said 2.5 days, later tensor methods closed more of the gap. | Arute et al., Nature 574, 505 (2019); IBM Quantum blog (Oct 2019); Pan and Zhang, PRL 129, 090502 (2022) |
| ustc-advantage | China's Jiuzhang and Zuchongzhi | boson-sampling, rcs | Intermediate | USTC claims with photons (Jiuzhang, 2020) and superconducting chips (Zuchongzhi, 105 qubits in 2025). | Zhong et al., Science 370, 1460 (2020); Wu et al., PRL 127, 180501 (2021); Gao et al., PRL 134, 090601 (2025) |
| utility-2023 | IBM utility test and replies | advantage, error-mitigation | Advanced | 127-qubit Eagle with error mitigation (2023), then fast classical replies with tensor networks. | Kim et al., Nature 618, 500 (2023); Tindall et al., PRX Quantum 5, 010308 (2024) |
| willow-2024 | Google Willow 2024 | threshold, rcs | Intermediate | 105 qubits; surface code errors fall as the code grows; an RCS run Google puts at 5 minutes vs 10^25 years. | Google Quantum AI, Nature 638, 920 (2025); Google blog "Meet Willow" (9 Dec 2024) |
| annealing-claims | Annealing advantage claims | annealing, advantage | Advanced | D-Wave's 2025 Science paper on spin-glass dynamics and the tensor-network replies that followed. Still debated. | King et al., Science (2025), arXiv:2403.00910; Tindall et al., arXiv:2503.05693 (2025); HPCwire (13 Mar 2025) |
| verifiable-advantage | Checkable advantage | rcs, advantage | Advanced | Making speedups checkable: certified randomness on Quantinuum H2 (Mar 2025) and Google Quantum Echoes (Oct 2025). | Liu et al., Nature 640, 343 (2025); Google Research blog "A verifiable quantum advantage" (Oct 2025) |
| classical-pushback | Classical computers strike back | tensor-network-sim, sycamore-2019 | Advanced | Each claim invites better classical methods, so the quantum-classical line keeps moving. | Pan and Zhang (2022); Tindall et al. (2024); "A brief history of quantum vs classical computational advantage", arXiv:2412.14703 (2024) |
| use-cases | Where it may help | advantage, simulation | Beginner | Map of candidate areas with an honest status for each: proven speedup, plausible, or unclear. | Dalzell et al., arXiv:2310.03011 (2023); Hoefler, Haner, Troyer, CACM 66(5), 82 (2023) |
| speedup-check | Is the speedup big enough? | use-cases, grover, shor | Intermediate | Error-corrected gates are slow, so quadratic speedups rarely pay off; bigger speedups may. | Hoefler et al., CACM 66(5), 82 (2023); Babbush et al., PRX Quantum 2, 010103 (2021) |
| chemistry-materials | Chemistry and materials | use-cases, phase-estimation, vqe | Intermediate | The strongest case (catalysts like FeMoco, batteries, magnets) but likely needs fault tolerance; general exponential advantage not shown. | Reiher et al., PNAS 114, 7555 (2017); Lee et al., Nat. Commun. 14, 1952 (2023); Bauer et al., Chem. Rev. 120, 12685 (2020) |
| optimization-logistics | Optimization and logistics | use-cases, qaoa, annealing | Intermediate | Routing, scheduling and portfolios with QAOA or annealing; no proven practical advantage yet. | Abbas et al., Nat. Rev. Phys. 6, 718 (2024); Hoefler et al. (2023) |
| finance | Finance | use-cases, amplitude-amplification | Intermediate | Faster Monte Carlo pricing and risk; one estimate needs about 7,500 logical qubits. | Chakrabarti et al., Quantum 5, 463 (2021); Herman et al., Nat. Rev. Phys. 5, 450 (2023) |
| quantum-ml | Quantum machine learning | use-cases, variational | Intermediate | Promise and problems: loading data, barren plateaus, and classical "dequantized" rivals. | Biamonte et al., Nature 549, 195 (2017); Tang, STOC (2019); Cerezo et al., Nat. Comput. Sci. 2, 567 (2022) |
| hype | Hype or real? | advantage, use-cases | Beginner | How to read a headline: what ran, compared with what, checked by whom, useful for what. | Hoefler et al. (2023); arXiv:2412.14703 (2024); Science News on Majorana 1 (Feb 2025) |
| investment | Money and markets | who-builds | Beginner | Startup funding, revenue and stock listings, and why money is not proof of progress. | McKinsey Quantum Technology Monitor (2025, 2026); Quantinuum S-1, SEC (May 2026) |
| national-programs | National programs | history | Beginner | US NQI Act (2018), EU Quantum Flagship (2018), UK strategy (2023), India mission (2023), DARPA QBI, UN year 2025. | Pub. L. 115-368 (2018); UK National Quantum Strategy (Mar 2023); OECD overview of national quantum strategies |
| geopolitics | Race, security and export rules | national-programs, rsa | Intermediate | Why states treat quantum as strategic: crypto risk, export controls (US rule of 6 Sep 2024), supply chains. | BIS interim final rule, Fed. Reg. 2024-19633 (6 Sep 2024); OECD overview |
| supply-chain | Supply chain | cryogenics, who-builds | Intermediate | Fridges, helium-3, lasers, control electronics and fabs that every builder depends on. | War on the Rocks, "The supply chain chokepoints in quantum" (Oct 2025); Krinner et al. (2019) |
| responsible-quantum | Responsible quantum | hype, geopolitics | Intermediate | Principles for fair access, privacy, security and accountability in the field. | WEF Quantum Computing Governance Principles (19 Jan 2022) |
| careers | Careers in quantum | use-cases | Beginner | Job types (hardware, software, QEC, applications, business) and who hires. | Fox, Zwickl, Lewandowski, PRPER 16, 020131 (2020); McKinsey Monitor (2025) |
| skills | Skills to learn | careers | Beginner | Which math, physics, coding and lab skills each role wants, and free ways to learn them. | Fox et al. (2020); Hughes et al., IEEE Trans. Educ. 65, 592 (2022) |

### Industry fact table

Facts the industry stops will use. Each has a source. Company figures are the company's own unless a paper is named.

| Fact | Source |
|---|---|
| Superconducting builders include IBM, Google, Rigetti, IQM, OQC, Fujitsu with RIKEN, and USTC (Zuchongzhi). | IBM roadmap (2025); Google Willow blog (2024); company sites; RIKEN release (23 Apr 2025); PRL 134, 090601 (2025) |
| Fujitsu and RIKEN showed a 256-qubit machine in April 2025 and target 1,000 qubits in 2026. | Fujitsu press release (22 Apr 2025); RIKEN news (23 Apr 2025) |
| Cat qubits: AWS Ocelot (5 cat qubits, repetition code) in Nature, Feb 2025; Alice & Bob also builds cat qubits. | Nature (26 Feb 2025) via Caltech IQIM news; alice-bob.com |
| Trapped ions: Quantinuum Helios, 98 qubits of barium-137, launched 5 Nov 2025; earlier H2 had 56 qubits. | Quantinuum Helios docs; arXiv:2511.05465; HPCwire (5 Nov 2025) |
| Trapped ions: IonQ bought Oxford Ionics (about 1.075 billion USD), closed 17 Sep 2025; target 2 million physical qubits by 2030. | IonQ 8-K filings, SEC (2025); IonQ roadmap blog |
| Neutral atoms: QuEra (with Harvard), Atom Computing (with Microsoft), Pasqal, Infleqtion. | Bluvstein et al., Nature 626, 58 (2024); Microsoft Azure Quantum blog (19 Nov 2024); company roadmaps |
| Photonic: PsiQuantum (Omega chipset, Feb 2025, made at GlobalFoundries), Xanadu (Borealis 2022, Aurora Jan 2025: 12 qubits, 35 chips), USTC (Jiuzhang). | psiquantum.com/omega; Xanadu press release (22 Jan 2025); Madsen et al., Nature 606, 75 (2022) |
| Silicon spin: Intel Tunnel Falls, 12 qubits, released June 2023; Diraq is in DARPA QBI Stage B. | Intel newsroom (June 2023); DARPA QBI Stage B page |
| Topological: Microsoft Majorana 1, Feb 2025. Disputed: many physicists say a topological qubit is not yet shown. | Microsoft Quantum, Nature 638, 651 (2025); Science News (Feb 2025) |
| Annealing: D-Wave (Advantage2); its 2025 beyond-classical claim is contested. | King et al., Science (2025); HPCwire (13 Mar 2025) |
| Google 2019: 53-qubit Sycamore, about 200 s vs claimed 10,000 years. IBM: 2.5 days on Summit. | Arute et al., Nature 574, 505 (2019); IBM Quantum blog "On quantum supremacy" (Oct 2019) |
| Jiuzhang 2020: Gaussian boson sampling, up to 76 photons detected, about 200 s vs an estimated 2.5 billion years. | Zhong et al., Science 370, 1460 (2020) |
| Borealis 2022: 36 microseconds per sample vs an estimated 9,000 years on Fugaku. | Madsen et al., Nature 606, 75 (2022) |
| Zuchongzhi 3.0 (2025): 105 qubits; RCS on 83 qubits, 32 cycles. | Gao et al., PRL 134, 090601 (2025) |
| IBM 2023: 127-qubit Eagle "utility" run; classical tensor-network replies in 2024. | Kim et al., Nature 618, 500 (2023); Tindall et al., PRX Quantum 5, 010308 (2024) |
| Harvard and QuEra 2023: 48 logical qubits on up to 280 atoms. | Bluvstein et al., Nature 626, 58 (2024) |
| Microsoft and Quantinuum, Apr 2024: 4 logical qubits from 30 physical, about 800x lower error (announced before peer review). | Microsoft blog (3 Apr 2024); IEEE Spectrum (2024) |
| Microsoft and Atom Computing, Nov 2024: 24 entangled logical qubits. | Microsoft Azure Quantum blog (19 Nov 2024) |
| Google Willow, Dec 2024: 105 qubits, distance-7 surface code below threshold; RCS in under 5 minutes vs 10^25 years (Google's estimate on Frontier). | Google Quantum AI, Nature 638, 920 (2025); Google blog (9 Dec 2024) |
| Certified randomness, Mar 2025: 71,313 bits of entropy from Quantinuum H2 (56 qubits), checked by supercomputers. | Liu et al., Nature 640, 343 (2025) |
| Google Quantum Echoes, Oct 2025: OTOC task, Google claims 13,000x over best classical method; independent checks pending. | Google Research blog (22 Oct 2025); Nature (Oct 2025) |
| 2025 Nobel Prize in Physics: Clarke, Devoret, Martinis, for quantum tunnelling and energy levels in an electric circuit. | nobelprize.org press release (7 Oct 2025) |
| IBM roadmap: Starling by 2029 (200 logical qubits, 100 million gates); Blue Jay later (2,000 logical qubits). | IBM newsroom (10 Jun 2025); IBM roadmap PDF |
| Google roadmap: 6 milestones; 1 (2019) and 2 (2023) done; Willow is a step toward 3 (a long-lived logical qubit). | Google Quantum AI roadmap; Google Willow blog (2024) |
| Quantinuum roadmap: Sol (2027), Apollo, fault tolerant, by 2029. | Quantinuum S-1, SEC (2026); HPCwire (Nov 2025) |
| QuEra 2024 roadmap said 100 logical qubits in 2026; 2026 sources show later dates. Pasqal 2025 roadmap: 100 logical qubits by 2029. | Tom's Hardware (2024); company roadmaps; arXiv:2604.04761 (2026) |
| DARPA QBI tests if a useful machine is possible by 2033; 11 companies entered Stage B in Nov 2025. | darpa.mil QBI Stage B page; Nextgov (Nov 2025) |
| RSA-2048 estimate: 20 million noisy qubits, about 8 hours (2019); under 1 million noisy qubits, under a week (2025). | Gidney and Ekera, Quantum 5, 433 (2021); Gidney, arXiv:2505.15917 (2025) |
| McKinsey: startup investment 2.0 billion USD in 2024, then 12.6 billion USD in 2025; quantum computing revenue passed 1 billion USD in 2025. | McKinsey Quantum Technology Monitor 2025 and 2026 |
| Quantinuum filed in May 2026 and listed on Nasdaq (ticker QNT) in June 2026; reviews disagree on June 4 or 5, so check the date against the SEC filing. | Quantinuum S-1 and S-1/A, SEC (May 2026) |
| US National Quantum Initiative Act signed 21 Dec 2018. | Pub. L. 115-368, govinfo.gov; AIP FYI |
| EU Quantum Flagship: about 1 billion EUR over 10 years from 2018. | OECD overview of national quantum strategies; National Academies, Quantum Computing: Progress and Prospects (2019) |
| UK: 2.5 billion GBP over 2024 to 2034, strategy published Mar 2023. | gov.uk National Quantum Strategy |
| India National Quantum Mission approved 2023 (sources give 689 to 750 million USD). | OECD overview; MIT Quantum Index Report |
| UN made 2025 the International Year of Quantum (resolution 78/287, 7 Jun 2024). | UN Digital Library record 4052700 |
| US export controls on quantum items took effect 6 Sep 2024. | BIS press release; Fed. Reg. 2024-19633 |
| IBM put the first quantum computer on the cloud on 4 May 2016. | IBM newsroom (4 May 2016) |

## Suggested learning lines

- Build a machine (revised): divincenzo, decoherence, t1-t2, superconducting, cryogenics, trapped-ions, neutral-atoms, photonic, spin-qubits, annealing, modality-compare, nisq.
- Inside a chip: superconducting, josephson-junction, transmon, circuit-qed, qubit-control, readout, calibration, control-electronics, cryogenics.
- Odd qubits: cat-qubits, nv-centers, anyons, topological, continuous-variable, mbqc, nmr, analog-simulators.
- Noise: decoherence, t1-t2, noise-channels, noise-sources, leakage, correlated-errors.
- Grading a machine: fidelity, randomized-benchmarking, tomography, xeb, quantum-volume, system-metrics, benchmark-tools.
- First codes: classical-codes, error-correction, repetition-code, syndrome, shor-code, steane-code, physical-vs-logical.
- Stabilizer codes: clifford, stabilizers, code-distance, css-codes, five-qubit-code, surface-code, toric-code.
- Road to fault tolerance: repeated-rounds, decoders, real-time-decoding, threshold, logical-qubits, fault-tolerance, transversal-gates, lattice-surgery, magic-states, resource-estimation, ftqc-architecture.
- New codes: color-codes, qldpc, floquet-codes, biased-noise, erasure, bosonic-codes.
- Mitigate, not correct: error-suppression, error-mitigation, readout-mitigation, zne, pec, twirling, mitigation-zoo, mitigation-limits.
- First code: software-stack, hello-quantum, shots, qiskit, run-on-hardware, hybrid-loops.
- Inside the compiler: openqasm, compilers, gate-synthesis, qubit-routing, circuit-optimization, pulse-control, qir.
- Simulate it: simulators, statevector-sim, density-matrix-sim, stabilizer-sim, tensor-network-sim, gpu-sim.
- The advantage story: advantage, rcs, boson-sampling, sycamore-2019, ustc-advantage, utility-2023, willow-2024, annealing-claims, verifiable-advantage, classical-pushback.
- Quantum at work (revised): history, who-builds, cloud, use-cases, speedup-check, chemistry-materials, optimization-logistics, finance, quantum-ml, hype, roadmaps, investment, careers, skills.
- Quantum and the world: national-programs, geopolitics, supply-chain, responsible-quantum, nobel-prizes.

## Checked and left out

- Quantum sensing and metrology: a sister field, not computing. Could be a later region.
- Network hardware (repeaters, quantum memories, Micius satellite) and entanglement distillation: fit `protocols` better.
- Q-Day timelines and moving to post-quantum crypto: covered by `rsa` and `post-quantum`. `resource-estimation` links to them.
- Rare qubit types (electrons on solid neon or helium, molecular spins, 0-pi qubits): early research; one line in `modality-compare` is enough.
- Single-shot QEC, self-correcting memories, 4D toric code, GKP lattice math: too deep for a stop; mention inside `qldpc`, `toric-code`, `bosonic-codes`.
- Classical shadows, block encoding, quantum signal processing: belong to the algorithms slice.
- One stop per company: dates fast. Use `who-builds` plus the fact table.
- Market size forecasts to 2035: they change a lot between editions (McKinsey 2025 vs 2026), so only use dated actuals.
- Cloud prices and queue times: change too often to teach.
- Standards bodies (IEEE, ISO/IEC): little stable content for learners yet; a line in `system-metrics` is enough.
- SPAC listing dates of IonQ, Rigetti, D-Wave: not checked here, so left out of the fact table.
