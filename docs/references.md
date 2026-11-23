# References

Learn-more sources for every stop in `docs/curriculum.md`. One library, then a map from each stop to its sources, best first.

Rules:

- University level or better: textbooks, peer-reviewed papers, reviews, university lecture notes, standards. No blogs or news. Company pages only for their own products, typed `Company claim`.
- Never write a citation from memory. Authors, year, title and venue come from Crossref (DOI) or the arXiv API: run `python3 scripts/check-ref.py <doi or arXiv id>` and copy its output.
- `python3 scripts/check-ref.py docs/references.md` checks every row: each id must exist and its title and year must match the row. A real id for the wrong paper fails. Last full pass: 2026-11-23.
- When the free arXiv copy has another title than the journal version, the Note says `arXiv title: "..."`.
- Rows with no DOI or arXiv id say in the Note whether the URL was opened, and when.
- Level: Intro, University, Graduate, Research. Free: a legal free copy exists.

## Library

| key | Authors | Year | Title | Venue | Type | Level | Free | DOI | arXiv | URL | Note |
|---|---|---|---|---|---|---|---|---|---|---|---|
| aaronson-2004-collision | Aaronson and Shi | 2004 | Quantum lower bounds for the collision and the element distinctness problems | Journal of the ACM | Paper | Research | No | 10.1145/1008731.1008735 | - | - | - |
| aaronson-2004-stabilizer | Aaronson and Gottesman | 2004 | Improved simulation of stabilizer circuits | Physical Review A | Paper | Research | Yes | 10.1103/PhysRevA.70.052328 | arXiv:quant-ph/0406196 | - | - |
| aaronson-2005-npcomplete | Aaronson | 2005 | Guest Column: NP-complete problems and physical reality | ACM SIGACT News | Review | University | Yes | 10.1145/1052796.1052804 | arXiv:quant-ph/0502072 | - | - |
| aaronson-2005-postselection | Aaronson | 2005 | Quantum computing, postselection, and probabilistic polynomial-time | Proceedings of the Royal Society A: Mathematical, Physical and Engineering Sciences | Paper | Research | Yes | 10.1098/rspa.2005.1546 | arXiv:quant-ph/0412187 | - | - |
| aaronson-2005-spatial | Aaronson and Ambainis | 2005 | Quantum Search of Spatial Regions | Theory of Computing | Paper | Research | Yes | 10.4086/toc.2005.v001a004 | arXiv:quant-ph/0303041 | - | - |
| aaronson-2009-copyprotection | Aaronson | 2009 | Quantum Copy-Protection and Quantum Money | 2009 24th Annual IEEE Conference on Computational Complexity | Paper | Research | Yes | 10.1109/CCC.2009.42 | arXiv:1110.5353 | - | - |
| aaronson-2012-money | Aaronson and Christiano | 2012 | Quantum money from hidden subspaces | Proceedings of the forty-fourth annual ACM symposium on Theory of computing | Paper | Research | Yes | 10.1145/2213977.2213983 | arXiv:1203.4740 | - | - |
| aaronson-2013-linear | Aaronson and Arkhipov | 2013 | The Computational Complexity of Linear Optics | Theory of Computing | Paper | Research | Yes | 10.4086/toc.2013.v009a004 | arXiv:1011.3245 | - | - |
| aaronson-2014-structure | Aaronson and Ambainis | 2014 | The Need for Structure in Quantum Speedups | Theory of Computing | Paper | Research | Yes | 10.4086/toc.2014.v010a006 | arXiv:0911.0996 | - | - |
| aaronson-2015-fineprint | Aaronson | 2015 | Read the fine print | Nature Physics | Paper | University | No | 10.1038/nphys3272 | - | - | - |
| aaronson-2018-forrelation | Aaronson and Ambainis | 2018 | Forrelation: A Problem That Optimally Separates Quantum from Classical Computing | SIAM Journal on Computing | Paper | Research | Yes | 10.1137/15M1050902 | arXiv:1411.5729 | - | - |
| aaronson-2018-shadow | Aaronson | 2018 | Shadow tomography of quantum states | Proceedings of the 50th Annual ACM SIGACT Symposium on Theory of Computing | Paper | Research | Yes | 10.1145/3188745.3188802 | arXiv:1711.01053 | - | - |
| aaronson-2023-certified | Aaronson and Hung | 2023 | Certified Randomness from Quantum Supremacy | Proceedings of the 55th Annual ACM Symposium on Theory of Computing | Paper | Research | Yes | 10.1145/3564246.3585145 | arXiv:2303.01625 | - | - |
| aaronson-qcsd | Aaronson | 2013 | Quantum Computing since Democritus | Cambridge University Press | Textbook | University | No | 10.1017/CBO9780511979309 | - | - | - |
| aasi-2013-squeezed | Aasi et al. | 2013 | Enhanced sensitivity of the LIGO gravitational wave detector by using squeezed states of light | Nature Photonics | Paper | Research | Yes | 10.1038/nphoton.2013.177 | arXiv:1310.0383 | - | - |
| abbas-2024-optimization | Abbas et al. | 2024 | Challenges and opportunities in quantum optimization | Nature Reviews Physics | Review | Graduate | Yes | 10.1038/s42254-024-00770-9 | arXiv:2312.02279 | - | - |
| abhijith-2022-beginners | J. et al. | 2022 | Quantum Algorithm Implementations for Beginners | ACM Transactions on Quantum Computing | Review | University | Yes | 10.1145/3517340 | arXiv:1804.03719 | - | - |
| acin-2007-diqkd | Acín et al. | 2007 | Device-Independent Security of Quantum Cryptography against Collective Attacks | Physical Review Letters | Paper | Research | Yes | 10.1103/PhysRevLett.98.230501 | arXiv:quant-ph/0702152 | - | - |
| acin-2016-certified | Acín and Masanes | 2016 | Certified randomness in quantum physics | Nature | Review | Graduate | Yes | 10.1038/nature20119 | arXiv:1708.00265 | - | - |
| aer-docs | Qiskit | - | Qiskit Aer documentation | Official docs | Company claim | University | Yes | - | - | https://qiskit.github.io/qiskit-aer/ | URL not checked |
| aggarwal-2018-bitcoin | Aggarwal et al. | 2018 | Quantum Attacks on Bitcoin, and How to Protect Against Them | Ledger | Paper | Research | Yes | 10.5195/ledger.2018.127 | arXiv:1710.10377 | - | - |
| aharonov-1993-walks | Aharonov, Davidovich and Zagury | 1993 | Quantum random walks | Physical Review A | Paper | Research | No | 10.1103/PhysRevA.48.1687 | - | - | - |
| aharonov-2007-adiabatic | Aharonov et al. | 2007 | Adiabatic Quantum Computation is Equivalent to Standard Quantum Computation | SIAM Journal on Computing | Paper | Research | Yes | 10.1137/S0097539705447323 | arXiv:quant-ph/0405098 | - | - |
| aharonov-2008-jones | Aharonov, Jones and Landau | 2008 | A Polynomial Quantum Algorithm for Approximating the Jones Polynomial | Algorithmica | Paper | Research | Yes | 10.1007/s00453-008-9168-0 | arXiv:quant-ph/0511096 | - | - |
| aharonov-2008-threshold | Aharonov and Ben-Or | 2008 | Fault-Tolerant Quantum Computation with Constant Error Rate | SIAM Journal on Computing | Paper | Research | Yes | 10.1137/S0097539799359385 | arXiv:quant-ph/9611025 | - | - |
| aharonov-2016-coin | Aharonov et al. | 2016 | A Simpler Proof of the Existence of Quantum Weak Coin Flipping with Arbitrarily Small Bias | SIAM Journal on Computing | Paper | Research | Yes | 10.1137/14096387X | arXiv:1402.7166 | - | - |
| aharonov-2023-noisyrcs | Aharonov et al. | 2023 | A Polynomial-Time Classical Algorithm for Noisy Random Circuit Sampling | Proceedings of the 55th Annual ACM Symposium on Theory of Computing | Paper | Research | Yes | 10.1145/3564246.3585234 | arXiv:2211.03999 | - | - |
| alagic-2022-ir8413 | Alagic et al. | 2022 | Status report on the third round of the NIST Post-Quantum Cryptography Standardization process | National Institute of Standards and Technology (U.S.) | Standard | Graduate | Yes | 10.6028/NIST.IR.8413-upd1 | - | - | - |
| alagic-2025-ir8545 | Alagic et al. | 2025 | Status report on the fourth round of the NIST post-quantum cryptography standardization process | National Institute of Standards and Technology (U.S.) | Standard | Graduate | Yes | 10.6028/NIST.IR.8545 | - | - | - |
| alagic-2025-sp800227 | Alagic et al. | 2025 | Recommendations for key-encapsulation mechanisms | National Institute of Standards and Technology (U.S.) | Standard | Graduate | Yes | 10.6028/NIST.SP.800-227 | - | - | - |
| alagic-2026-ir8610 | Alagic et al. | 2026 | Status report on the second round of the additional digital signature schemes for the NIST post-quantum cryptography standardization process | National Institute of Standards and Technology (U.S.) | Standard | Graduate | Yes | 10.6028/NIST.IR.8610 | - | - | - |
| albash-2018-adiabatic | Albash and Lidar | 2018 | Adiabatic quantum computation | Reviews of Modern Physics | Review | Graduate | Yes | 10.1103/RevModPhys.90.015002 | arXiv:1611.04471 | - | - |
| alexander-2020-pulse | Alexander et al. | 2020 | Qiskit pulse: programming quantum computers through the cloud with pulses | Quantum Science and Technology | Paper | Research | Yes | 10.1088/2058-9565/aba404 | arXiv:2004.06755 | - | - |
| alexeev-2024-hpc | Alexeev et al. | 2024 | Quantum-centric supercomputing for materials science: A perspective on challenges and future directions | Future Generation Computer Systems | Review | Research | Yes | 10.1016/j.future.2024.04.060 | arXiv:2312.09733 | - | - |
| aliferis-2005-threshold | Aliferis, Gottesman and Preskill | 2005 | Quantum accuracy threshold for concatenated distance-3 codes | arXiv | Paper | Research | Yes | - | arXiv:quant-ph/0504218 | - | - |
| altman-2021-simulators | Altman et al. | 2021 | Quantum Simulators: Architectures and Opportunities | PRX Quantum | Review | Graduate | Yes | 10.1103/PRXQuantum.2.017003 | arXiv:1912.06938 | - | - |
| ambainis-2000-private | Ambainis et al. | None | Private quantum channels | Proceedings 41st Annual Symposium on Foundations of Computer Science | Paper | Research | No | 10.1109/SFCS.2000.892142 | - | - | - |
| ambainis-2002-adversary | Ambainis | 2002 | Quantum Lower Bounds by Quantum Arguments | Journal of Computer and System Sciences | Paper | Research | Yes | 10.1006/jcss.2002.1826 | arXiv:quant-ph/0002066 | - | - |
| ambainis-2002-dense | Ambainis et al. | 2002 | Dense quantum coding and quantum finite automata | Journal of the ACM | Paper | Research | Yes | 10.1145/581771.581773 | arXiv:quant-ph/9804043 | - | arXiv title: "Dense Quantum Coding and a Lower Bound for 1-way Quantum Automata" |
| ambainis-2007-distinctness | Ambainis | 2007 | Quantum Walk Algorithm for Element Distinctness | SIAM Journal on Computing | Paper | Research | Yes | 10.1137/S0097539705447311 | arXiv:quant-ph/0311001 | - | - |
| ambainis-2019-dp | Ambainis et al. | 2019 | Quantum Speedups for Exponential-Time Dynamic Programming Algorithms | Proceedings of the Thirtieth Annual ACM-SIAM Symposium on Discrete Algorithms | Paper | Research | Yes | 10.1137/1.9781611975482.107 | arXiv:1807.05209 | - | - |
| ambainis-2019-query | AMBAINIS | 2019 | UNDERSTANDING QUANTUM ALGORITHMS VIA QUERY COMPLEXITY | Proceedings of the International Congress of Mathematicians (ICM 2018) | Review | Graduate | Yes | 10.1142/9789813272880_0181 | arXiv:1712.06349 | - | - |
| amin-2018-boltzmann | Amin et al. | 2018 | Quantum Boltzmann Machine | Physical Review X | Paper | Research | Yes | 10.1103/PhysRevX.8.021050 | arXiv:1601.02036 | - | - |
| amiri-2016-signatures | Amiri et al. | 2016 | Secure quantum signatures using insecure quantum channels | Physical Review A | Paper | Research | Yes | 10.1103/PhysRevA.93.032325 | arXiv:1507.02975 | - | - |
| amy-2013-meet | Amy et al. | 2013 | A Meet-in-the-Middle Algorithm for Fast Synthesis of Depth-Optimal Quantum Circuits | IEEE Transactions on Computer-Aided Design of Integrated Circuits and Systems | Paper | Research | Yes | 10.1109/TCAD.2013.2244643 | arXiv:1206.0758 | - | - |
| anderson-2014-switching | Anderson, Duclos-Cianci and Poulin | 2014 | Fault-Tolerant Conversion between the Steane and Reed-Muller Quantum Codes | Physical Review Letters | Paper | Research | Yes | 10.1103/PhysRevLett.113.080501 | arXiv:1403.2734 | - | - |
| anshu-2021-learning | Anshu et al. | 2021 | Sample-efficient learning of interacting quantum systems | Nature Physics | Paper | Research | Yes | 10.1038/s41567-021-01232-0 | arXiv:2004.07266 | - | arXiv title: "Sample-efficient learning of quantum many-body systems" |
| arora-2009-complexity | Arora and Barak | 2009 | Computational Complexity | Cambridge University Press | Textbook | Graduate | No | 10.1017/CBO9780511804090 | - | - | - |
| arute-2019-supremacy | Arute et al. | 2019 | Quantum supremacy using a programmable superconducting processor | Nature | Paper | Research | No | 10.1038/s41586-019-1666-5 | - | - | - |
| asfaw-2022-education | Asfaw et al. | 2022 | Building a Quantum Engineering Undergraduate Program | IEEE Transactions on Education | Paper | Intro | No | 10.1109/TE.2022.3144943 | - | - | - |
| aspect-1982-bell | Aspect, Dalibard and Roger | 1982 | Experimental Test of Bell's Inequalities Using Time- Varying Analyzers | Physical Review Letters | Paper | Research | No | 10.1103/PhysRevLett.49.1804 | - | - | - |
| aspuruguzik-2005-energies | Aspuru-Guzik et al. | 2005 | Simulated Quantum Computation of Molecular Energies | Science | Paper | Research | Yes | 10.1126/science.1113479 | arXiv:quant-ph/0604193 | - | - |
| atia-2017-fastforward | Atia and Aharonov | 2017 | Fast-forwarding of Hamiltonians and exponentially precise measurements | Nature Communications | Paper | Research | Yes | 10.1038/s41467-017-01637-7 | arXiv:1610.09619 | - | - |
| audenaert-2007-chernoff | Audenaert et al. | 2007 | Discriminating States: The Quantum Chernoff Bound | Physical Review Letters | Paper | Research | Yes | 10.1103/PhysRevLett.98.160501 | arXiv:quant-ph/0610027 | - | - |
| awschalom-2021-interconnects | Awschalom et al. | 2021 | Development of Quantum Interconnects (QuICs) for Next-Generation Information Technologies | PRX Quantum | Review | Graduate | Yes | 10.1103/PRXQuantum.2.017002 | arXiv:1912.06642 | - | - |
| axler-2024-ladr | Axler | 2024 | Linear Algebra Done Right | Undergraduate Texts in Mathematics | Textbook | University | Yes | 10.1007/978-3-031-41026-0 | - | - | - |
| azuma-2023-repeaters | Azuma et al. | 2023 | Quantum repeaters: From quantum networks to the quantum internet | Reviews of Modern Physics | Review | Graduate | Yes | 10.1103/RevModPhys.95.045006 | arXiv:2212.10820 | - | - |
| azure-estimator-docs | Microsoft | - | Azure Quantum Resource Estimator | Official docs | Company claim | Graduate | Yes | - | - | https://learn.microsoft.com/azure/quantum/intro-to-resource-estimation | URL not checked |
| babbush-2018-spectra | Babbush et al. | 2018 | Encoding Electronic Spectra in Quantum Circuits with Linear T Complexity | Physical Review X | Paper | Research | Yes | 10.1103/PhysRevX.8.041015 | arXiv:1805.03662 | - | - |
| babbush-2021-focus | Babbush et al. | 2021 | Focus beyond Quadratic Speedups for Error-Corrected Quantum Advantage | PRX Quantum | Paper | Research | Yes | 10.1103/PRXQuantum.2.010103 | arXiv:2011.04149 | - | - |
| babbush-2023-oscillators | Babbush et al. | 2023 | Exponential Quantum Speedup in Simulating Coupled Classical Oscillators | Physical Review X | Paper | Research | Yes | 10.1103/PhysRevX.13.041041 | arXiv:2303.13012 | - | - |
| babbush-2026-grand | Babbush et al. | 2026 | Grand Challenge of Quantum Applications | PRX Quantum | Review | Graduate | Yes | 10.1103/6r9l-lynr | arXiv:2511.09124 | - | - |
| backes-2021-axions | Backes et al. | 2021 | A quantum enhanced search for dark matter axions | Nature | Paper | Research | Yes | 10.1038/s41586-021-03226-7 | arXiv:2008.01853 | - | - |
| bacon-2006-subsystem | Bacon | 2006 | Operator quantum error-correcting subsystems for self-correcting quantum memories | Physical Review A | Paper | Research | Yes | 10.1103/PhysRevA.73.012340 | arXiv:quant-ph/0506023 | - | - |
| bae-2015-discrimination | Bae and Kwek | 2015 | Quantum state discrimination and its applications | Journal of Physics A: Mathematical and Theoretical | Review | Graduate | Yes | 10.1088/1751-8113/48/8/083001 | arXiv:1707.02571 | - | - |
| barenco-1995-elementary | Barenco et al. | 1995 | Elementary gates for quantum computation | Physical Review A | Paper | Research | Yes | 10.1103/PhysRevA.52.3457 | arXiv:quant-ph/9503016 | - | - |
| barenco-1997-stabilization | Barenco et al. | 1997 | Stabilization of Quantum Computations by Symmetrization | SIAM Journal on Computing | Paper | Research | Yes | 10.1137/S0097539796302452 | arXiv:quant-ph/9604028 | - | - |
| barker-2025-cswp39 | Barker et al. | 2025 | Considerations for Achieving Crypto Agility: Strategies and Practices | National Institute of Standards and Technology | Standard | University | Yes | 10.6028/NIST.CSWP.39 | - | - | - |
| barnett-2009-discrimination | Barnett and Croke | 2009 | Quantum state discrimination | Advances in Optics and Photonics | Review | Graduate | Yes | 10.1364/AOP.1.000238 | arXiv:0810.1970 | - | - |
| barnum-1996-broadcast | Barnum et al. | 1996 | Noncommuting Mixed States Cannot Be Broadcast | Physical Review Letters | Paper | Research | Yes | 10.1103/PhysRevLett.76.2818 | arXiv:quant-ph/9511010 | - | - |
| barredo-2016-assembler | Barredo et al. | 2016 | An atom-by-atom assembler of defect-free arbitrary two-dimensional atomic arrays | Science | Paper | Research | No | 10.1126/science.aah3778 | - | - | - |
| barry-2020-nv | Barry et al. | 2020 | Sensitivity optimization for NV-diamond magnetometry | Reviews of Modern Physics | Review | Graduate | Yes | 10.1103/RevModPhys.92.015004 | arXiv:1903.08176 | - | - |
| barz-2012-blind | Barz et al. | 2012 | Demonstration of Blind Quantum Computing | Science | Paper | Research | Yes | 10.1126/science.1214707 | arXiv:1110.1381 | - | - |
| bassi-2013-collapse | Bassi et al. | 2013 | Models of wave-function collapse, underlying theories, and experimental tests | Reviews of Modern Physics | Review | Graduate | Yes | 10.1103/RevModPhys.85.471 | arXiv:1204.4325 | - | - |
| bauer-2020-chemistry | Bauer et al. | 2020 | Quantum Algorithms for Quantum Chemistry and Quantum Materials Science | Chemical Reviews | Review | Graduate | Yes | 10.1021/acs.chemrev.9b00829 | arXiv:2001.03685 | - | - |
| bauer-2023-hep | Bauer et al. | 2023 | Quantum Simulation for High-Energy Physics | PRX Quantum | Review | Graduate | Yes | 10.1103/PRXQuantum.4.027001 | arXiv:2204.03381 | - | - |
| baumgratz-2014-coherence | Baumgratz, Cramer and Plenio | 2014 | Quantifying Coherence | Physical Review Letters | Paper | Research | Yes | 10.1103/PhysRevLett.113.140401 | arXiv:1311.0275 | - | - |
| bausch-2024-alphaqubit | Bausch et al. | 2024 | Learning high-accuracy error decoding for quantum processors | Nature | Paper | Research | Yes | 10.1038/s41586-024-08148-8 | arXiv:2310.05900 | - | arXiv title: "Learning to Decode the Surface Code with a Recurrent, Transformer-Based Neural Network" |
| bayraktar-2023-cuquantum | Bayraktar et al. | 2023 | cuQuantum SDK: A High-Performance Library for Accelerating Quantum Science | arXiv | Paper | Research | Yes | - | arXiv:2308.01999 | - | - |
| beals-2001-polynomials | Beals et al. | 2001 | Quantum lower bounds by polynomials | Journal of the ACM | Paper | Research | Yes | 10.1145/502090.502097 | arXiv:quant-ph/9802049 | - | - |
| bell-1964-epr | Bell | 1964 | On the Einstein Podolsky Rosen paradox | Physics Physique Fizika | Paper | Research | No | 10.1103/PhysicsPhysiqueFizika.1.195 | - | - | - |
| benedetti-2019-generative | Benedetti et al. | 2019 | A generative modeling approach for benchmarking and training shallow quantum circuits | npj Quantum Information | Paper | Research | Yes | 10.1038/s41534-019-0157-8 | arXiv:1801.07686 | - | - |
| bennett-1973-reversibility | Bennett | 1973 | Logical Reversibility of Computation | IBM Journal of Research and Development | Paper | Research | No | 10.1147/rd.176.0525 | - | - | - |
| bennett-1988-privacy | Bennett, Brassard and Robert | 1988 | Privacy Amplification by Public Discussion | SIAM Journal on Computing | Paper | Research | No | 10.1137/0217014 | - | - | - |
| bennett-1992-b92 | Bennett | 1992 | Quantum cryptography using any two nonorthogonal states | Physical Review Letters | Paper | Research | No | 10.1103/PhysRevLett.68.3121 | - | - | - |
| bennett-1992-bbm92 | Bennett, Brassard and Mermin | 1992 | Quantum cryptography without Bell’s theorem | Physical Review Letters | Paper | Research | No | 10.1103/PhysRevLett.68.557 | - | - | - |
| bennett-1992-superdense | Bennett and Wiesner | 1992 | Communication via one- and two-particle operators on Einstein-Podolsky-Rosen states | Physical Review Letters | Paper | Research | No | 10.1103/PhysRevLett.69.2881 | - | - | - |
| bennett-1993-teleportation | Bennett et al. | 1993 | Teleporting an unknown quantum state via dual classical and Einstein-Podolsky-Rosen channels | Physical Review Letters | Paper | Research | No | 10.1103/PhysRevLett.70.1895 | - | - | - |
| bennett-1995-generalized | Bennett et al. | 1995 | Generalized privacy amplification | IEEE Transactions on Information Theory | Paper | Research | No | 10.1109/18.476316 | - | - | - |
| bennett-1996-concentrating | Bennett et al. | 1996 | Concentrating partial entanglement by local operations | Physical Review A | Paper | Research | Yes | 10.1103/PhysRevA.53.2046 | arXiv:quant-ph/9511030 | - | - |
| bennett-1996-mixed | Bennett et al. | 1996 | Mixed-state entanglement and quantum error correction | Physical Review A | Paper | Research | Yes | 10.1103/PhysRevA.54.3824 | arXiv:quant-ph/9604024 | - | - |
| bennett-1996-purification | Bennett et al. | 1996 | Purification of Noisy Entanglement and Faithful Teleportation via Noisy Channels | Physical Review Letters | Paper | Research | Yes | 10.1103/PhysRevLett.76.722 | arXiv:quant-ph/9511027 | - | - |
| bennett-1997-strengths | Bennett et al. | 1997 | Strengths and Weaknesses of Quantum Computing | SIAM Journal on Computing | Paper | Research | Yes | 10.1137/S0097539796300933 | arXiv:quant-ph/9701001 | - | - |
| bennett-2001-rsp | Bennett et al. | 2001 | Remote State Preparation | Physical Review Letters | Paper | Research | Yes | 10.1103/PhysRevLett.87.077902 | arXiv:quant-ph/0006044 | - | - |
| bennett-2002-ea | Bennett et al. | 2002 | Entanglement-assisted capacity of a quantum channel and the reverse Shannon theorem | IEEE Transactions on Information Theory | Paper | Research | Yes | 10.1109/TIT.2002.802612 | arXiv:quant-ph/0106052 | - | - |
| bennett-2014-bb84 | Bennett and Brassard | 2014 | Quantum cryptography: Public key distribution and coin tossing | Theoretical Computer Science | Paper | University | Yes | 10.1016/j.tcs.2014.05.025 | arXiv:2003.06557 | - | - |
| bergholm-2018-pennylane | Bergholm et al. | 2018 | PennyLane: Automatic differentiation of hybrid quantum-classical computations | arXiv | Paper | University | Yes | - | arXiv:1811.04968 | - | - |
| bernien-2013-heralded | Bernien et al. | 2013 | Heralded entanglement between solid-state qubits separated by three metres | Nature | Paper | Research | Yes | 10.1038/nature12016 | arXiv:1212.6136 | - | - |
| bernstein-1997-complexity | Bernstein and Vazirani | 1997 | Quantum Complexity Theory | SIAM Journal on Computing | Paper | Research | No | 10.1137/S0097539796300921 | - | - | - |
| bernstein-2017-pqc | Bernstein and Lange | 2017 | Post-quantum cryptography | Nature | Review | University | No | 10.1038/nature23461 | - | - | - |
| bernstein-2019-sphincs | Bernstein et al. | 2019 | The SPHINCS + Signature Framework | Proceedings of the 2019 ACM SIGSAC Conference on Computer and Communications Security | Paper | Research | No | 10.1145/3319535.3363229 | - | - | - |
| berry-2006-sparse | Berry et al. | 2006 | Efficient Quantum Algorithms for Simulating Sparse Hamiltonians | Communications in Mathematical Physics | Paper | Research | Yes | 10.1007/s00220-006-0150-x | arXiv:quant-ph/0508139 | - | - |
| berry-2014-ode | Berry | 2014 | High-order quantum algorithm for solving linear differential equations | Journal of Physics A: Mathematical and Theoretical | Paper | Research | Yes | 10.1088/1751-8113/47/10/105301 | arXiv:1010.2745 | - | - |
| berry-2015-taylor | Berry et al. | 2015 | Simulating Hamiltonian Dynamics with a Truncated Taylor Series | Physical Review Letters | Paper | Research | Yes | 10.1103/PhysRevLett.114.090502 | arXiv:1412.4687 | - | - |
| berry-2024-tda | Berry et al. | 2024 | Analyzing Prospects for Quantum Advantage in Topological Data Analysis | PRX Quantum | Paper | Research | Yes | 10.1103/PRXQuantum.5.010319 | arXiv:2209.13581 | - | - |
| berta-2010-memory | Berta et al. | 2010 | The uncertainty principle in the presence of quantum memory | Nature Physics | Paper | Research | Yes | 10.1038/nphys1734 | arXiv:0909.0950 | - | - |
| beullens-2022-rainbow | Beullens | 2022 | Breaking Rainbow Takes a Weekend on a Laptop | Lecture Notes in Computer Science | Paper | Research | No | 10.1007/978-3-031-15979-4_16 | - | - | - |
| beverland-2022-estimation | Beverland et al. | 2022 | Assessing requirements to scale to practical quantum advantage | arXiv | Paper | Research | Yes | - | arXiv:2211.07629 | - | - |
| bharti-2022-nisq | Bharti et al. | 2022 | Noisy intermediate-scale quantum algorithms | Reviews of Modern Physics | Review | Graduate | Yes | 10.1103/RevModPhys.94.015004 | arXiv:2101.08448 | - | - |
| bhatia-1997-matrix | Bhatia | 1997 | Matrix Analysis | Graduate Texts in Mathematics | Textbook | Graduate | No | 10.1007/978-1-4612-0653-8 | - | - | - |
| biamonte-2017-qml | Biamonte et al. | 2017 | Quantum machine learning | Nature | Review | Graduate | Yes | 10.1038/nature23474 | arXiv:1611.09347 | - | - |
| biasse-2015-classgroups | Biasse and Song | 2015 | Efficient quantum algorithms for computing class groups and solving the principal ideal problem in arbitrary degree number fields | Proceedings of the Twenty-Seventh Annual ACM-SIAM Symposium on Discrete Algorithms | Paper | Research | No | 10.1137/1.9781611974331.ch64 | - | - | - |
| bichsel-2020-silq | Bichsel et al. | 2020 | Silq: a high-level quantum language with safe uncomputation and intuitive semantics | Proceedings of the 41st ACM SIGPLAN Conference on Programming Language Design and Implementation | Paper | Research | No | 10.1145/3385412.3386007 | - | - | - |
| bindel-2019-hybrid | Bindel et al. | 2019 | Hybrid Key Encapsulation Mechanisms and Authenticated Key Exchange | Lecture Notes in Computer Science | Paper | Research | No | 10.1007/978-3-030-25510-7_12 | - | - | - |
| bipm-2019-si | BIPM | 2019 | The International System of Units (SI Brochure), 9th edition | Bureau International des Poids et Mesures | Standard | Intro | Yes | - | - | https://www.bipm.org/en/publications/si-brochure | URL not checked |
| blais-2004-cqed | Blais et al. | 2004 | Cavity quantum electrodynamics for superconducting electrical circuits: An architecture for quantum computation | Physical Review A | Paper | Research | Yes | 10.1103/PhysRevA.69.062320 | arXiv:cond-mat/0402216 | - | - |
| blais-2021-cqed | Blais et al. | 2021 | Circuit quantum electrodynamics | Reviews of Modern Physics | Review | Graduate | Yes | 10.1103/RevModPhys.93.025005 | arXiv:2005.12667 | - | - |
| blitzstein-2019-probability | Blitzstein and Hwang | 2019 | Introduction to Probability | Chapman and Hall/CRC | Textbook | University | No | 10.1201/9780429428357 | - | - | - |
| blumekohout-2017-gst | Blume-Kohout et al. | 2017 | Demonstration of qubit operations below a rigorous fault tolerance threshold with gate set tomography | Nature Communications | Paper | Research | Yes | 10.1038/ncomms14485 | arXiv:1605.07674 | - | - |
| bluvstein-2022-transport | Bluvstein et al. | 2022 | A quantum processor based on coherent transport of entangled atom arrays | Nature | Paper | Research | Yes | 10.1038/s41586-022-04592-6 | arXiv:2112.03923 | - | - |
| bluvstein-2023-logical | Bluvstein et al. | 2023 | Logical quantum processor based on reconfigurable atom arrays | Nature | Paper | Research | Yes | 10.1038/s41586-023-06927-3 | arXiv:2312.03982 | - | - |
| boixo-2018-supremacy | Boixo et al. | 2018 | Characterizing quantum supremacy in near-term devices | Nature Physics | Paper | Research | Yes | 10.1038/s41567-018-0124-x | arXiv:1608.00263 | - | - |
| bollinger-1996-spectroscopy | Bollinger et al. | 1996 | Optimal frequency measurements with maximally correlated states | Physical Review A | Paper | Research | No | 10.1103/PhysRevA.54.R4649 | - | - | - |
| bombin-2006-color | Bombin and Martin-Delgado | 2006 | Topological Quantum Distillation | Physical Review Letters | Paper | Research | Yes | 10.1103/PhysRevLett.97.180501 | arXiv:quant-ph/0605138 | - | - |
| bongs-2019-atomsensors | Bongs et al. | 2019 | Taking atom interferometric quantum sensors from the laboratory to real-world applications | Nature Reviews Physics | Review | University | No | 10.1038/s42254-019-0117-4 | - | - | - |
| bonillaataides-2021-xzzx | Bonilla Ataides et al. | 2021 | The XZZX surface code | Nature Communications | Paper | Research | Yes | 10.1038/s41467-021-22274-1 | arXiv:2009.07851 | - | - |
| bos-2018-kyber | Bos et al. | 2018 | CRYSTALS - Kyber: A CCA-Secure Module-Lattice-Based KEM | 2018 IEEE European Symposium on Security and Privacy (EuroS&P) | Paper | Research | No | 10.1109/EuroSP.2018.00032 | - | - | - |
| boto-2018-meg | Boto et al. | 2018 | Moving magnetoencephalography towards real-world applications with a wearable system | Nature | Paper | Research | No | 10.1038/nature26147 | - | - | - |
| bouchard-2020-hom | Bouchard et al. | 2020 | Two-photon interference: the Hong–Ou–Mandel effect | Reports on Progress in Physics | Review | University | Yes | 10.1088/1361-6633/abcd7a | arXiv:2006.09335 | - | - |
| bouland-2018-rcs | Bouland et al. | 2018 | On the complexity and verification of quantum random circuit sampling | Nature Physics | Paper | Research | Yes | 10.1038/s41567-018-0318-2 | arXiv:1803.04402 | - | arXiv title: "Quantum Supremacy and the Complexity of Random Circuit Sampling" |
| bouwmeester-1997-teleportation | Bouwmeester et al. | 1997 | Experimental quantum teleportation | Nature | Paper | Research | No | 10.1038/37539 | - | - | - |
| boykin-2000-basis | Boykin et al. | 2000 | A new universal and fault-tolerant quantum basis | Information Processing Letters | Paper | Research | Yes | 10.1016/S0020-0190(00)00084-3 | arXiv:quant-ph/9906054 | - | arXiv title: "On Universal and Fault-Tolerant Quantum Computing" |
| boykin-2003-encryption | Boykin and Roychowdhury | 2003 | Optimal encryption of quantum bits | Physical Review A | Paper | Research | Yes | 10.1103/PhysRevA.67.042317 | arXiv:quant-ph/0003059 | - | - |
| braginsky-1996-qnd | Braginsky and Khalili | 1996 | Quantum nondemolition measurements: the route from toys to tools | Reviews of Modern Physics | Review | Graduate | No | 10.1103/RevModPhys.68.1 | - | - | - |
| brakerski-2021-test | Brakerski et al. | 2021 | A Cryptographic Test of Quantumness and Certifiable Randomness from a Single Quantum Device | Journal of the ACM | Paper | Research | Yes | 10.1145/3441309 | arXiv:1804.00640 | - | - |
| braket-docs | Amazon Web Services | - | Amazon Braket documentation | Official docs | Company claim | Intro | Yes | - | - | https://docs.aws.amazon.com/braket/ | URL not checked |
| brandao-2013-thermo | Brandão et al. | 2013 | Resource Theory of Quantum States Out of Thermal Equilibrium | Physical Review Letters | Paper | Research | Yes | 10.1103/PhysRevLett.111.250404 | arXiv:1111.3882 | - | - |
| brandao-2015-reversible | Brandão and Gour | 2015 | Reversible Framework for Quantum Resource Theories | Physical Review Letters | Paper | Research | Yes | 10.1103/PhysRevLett.115.070503 | arXiv:1502.03149 | - | arXiv title: "The general structure of quantum resource theories" |
| brandao-2017-sdp | Brandao and Svore | 2017 | Quantum Speed-Ups for Solving Semidefinite Programs | 2017 IEEE 58th Annual Symposium on Foundations of Computer Science (FOCS) | Paper | Research | Yes | 10.1109/FOCS.2017.45 | arXiv:1609.05537 | - | arXiv title: "Quantum Speed-ups for Semidefinite Programming" |
| brassard-1993-cascade | Brassard and Salvail | None | Secret-Key Reconciliation by Public Discussion | Lecture Notes in Computer Science | Paper | Research | No | 10.1007/3-540-48285-7_35 | - | - | - |
| brassard-1998-collision | Brassard, HØyer and Tapp | 1998 | Quantum cryptanalysis of hash and claw-free functions | Lecture Notes in Computer Science | Paper | Research | Yes | 10.1007/BFb0054319 | arXiv:quant-ph/9705002 | - | arXiv title: "Quantum Algorithm for the Collision Problem" |
| brassard-1998-counting | Brassard, HØyer and Tapp | 1998 | Quantum counting | Lecture Notes in Computer Science | Paper | Research | Yes | 10.1007/BFb0055105 | arXiv:quant-ph/9805082 | - | - |
| brassard-2000-limitations | Brassard et al. | 2000 | Limitations on Practical Quantum Cryptography | Physical Review Letters | Paper | Research | No | 10.1103/PhysRevLett.85.1330 | - | - | - |
| brassard-2002-amplitude | Brassard et al. | 2002 | Quantum amplitude amplification and estimation | Contemporary Mathematics | Paper | Research | Yes | 10.1090/conm/305/05215 | arXiv:quant-ph/0005055 | - | - |
| brassard-2005-pseudo | Brassard, Broadbent and Tapp | 2005 | Quantum Pseudo-Telepathy | Foundations of Physics | Review | University | Yes | 10.1007/s10701-005-7353-4 | arXiv:quant-ph/0407221 | - | - |
| braunstein-1994-statistical | Braunstein and Caves | 1994 | Statistical distance and the geometry of quantum states | Physical Review Letters | Paper | Research | No | 10.1103/PhysRevLett.72.3439 | - | - | - |
| braunstein-2005-cv | Braunstein and van Loock | 2005 | Quantum information with continuous variables | Reviews of Modern Physics | Review | Graduate | Yes | 10.1103/RevModPhys.77.513 | arXiv:quant-ph/0410100 | - | - |
| braunstein-2012-sidechannel | Braunstein and Pirandola | 2012 | Side-Channel-Free Quantum Key Distribution | Physical Review Letters | Paper | Research | Yes | 10.1103/PhysRevLett.108.130502 | arXiv:1109.2330 | - | - |
| bravyi-1998-boundary | Bravyi and Kitaev | 1998 | Quantum codes on a lattice with boundary | arXiv | Paper | Research | Yes | - | arXiv:quant-ph/9811052 | - | - |
| bravyi-2002-fermionic | Bravyi and Kitaev | 2002 | Fermionic Quantum Computation | Annals of Physics | Paper | Research | Yes | 10.1006/aphy.2002.6254 | arXiv:quant-ph/0003137 | - | - |
| bravyi-2005-magic | Bravyi and Kitaev | 2005 | Universal quantum computation with ideal Clifford gates and noisy ancillas | Physical Review A | Paper | Research | Yes | 10.1103/PhysRevA.71.022316 | arXiv:quant-ph/0403025 | - | - |
| bravyi-2020-obstacles | Bravyi et al. | 2020 | Obstacles to Variational Quantum Optimization from Symmetry Protection | Physical Review Letters | Paper | Research | Yes | 10.1103/PhysRevLett.125.260505 | arXiv:1910.08980 | - | arXiv title: "Obstacles to State Preparation and Variational Optimization from Symmetry Protection" |
| bravyi-2021-readout | Bravyi et al. | 2021 | Mitigating measurement errors in multiqubit experiments | Physical Review A | Paper | Research | Yes | 10.1103/PhysRevA.103.042605 | arXiv:2006.14044 | - | - |
| bravyi-2022-future | Bravyi et al. | 2022 | The future of quantum computing with superconducting qubits | Journal of Applied Physics | Review | University | Yes | 10.1063/5.0082975 | arXiv:2209.06841 | - | - |
| bravyi-2024-gross | Bravyi et al. | 2024 | High-threshold and low-overhead fault-tolerant quantum memory | Nature | Paper | Research | Yes | 10.1038/s41586-024-07107-7 | arXiv:2308.07915 | - | - |
| bremner-2010-iqp | Bremner, Jozsa and Shepherd | 2010 | Classical simulation of commuting quantum computations implies collapse of the polynomial hierarchy | Proceedings of the Royal Society A: Mathematical, Physical and Engineering Sciences | Paper | Research | Yes | 10.1098/rspa.2010.0301 | arXiv:1005.1407 | - | - |
| breuckmann-2021-ldpc | Breuckmann and Eberhardt | 2021 | Quantum Low-Density Parity-Check Codes | PRX Quantum | Review | Graduate | Yes | 10.1103/PRXQuantum.2.040101 | arXiv:2103.06309 | - | - |
| breuer-2007-open | Breuer and Petruccione | 2007 | The Theory of Open Quantum Systems | Oxford University PressOxford | Textbook | Graduate | No | 10.1093/acprof:oso/9780199213900.001.0001 | - | - | - |
| briegel-1998-repeaters | Briegel et al. | 1998 | Quantum Repeaters: The Role of Imperfect Local Operations in Quantum Communication | Physical Review Letters | Paper | Research | Yes | 10.1103/PhysRevLett.81.5932 | arXiv:quant-ph/9803056 | - | arXiv title: "Quantum repeaters for communication" |
| briegel-2009-mbqc | Briegel et al. | 2009 | Measurement-based quantum computation | Nature Physics | Review | Graduate | Yes | 10.1038/nphys1157 | arXiv:0910.1116 | - | - |
| broadbent-2009-blind | Broadbent, Fitzsimons and Kashefi | 2009 | Universal Blind Quantum Computation | 2009 50th Annual IEEE Symposium on Foundations of Computer Science | Paper | Research | Yes | 10.1109/FOCS.2009.36 | arXiv:0807.4154 | - | - |
| broadbent-2015-beyond | Broadbent and Schaffner | 2015 | Quantum cryptography beyond quantum key distribution | Designs, Codes and Cryptography | Review | Graduate | Yes | 10.1007/s10623-015-0157-4 | arXiv:1510.06120 | - | - |
| broadbent-2019-uncloneable | Broadbent and Lord | 2019 | Uncloneable Quantum Encryption via Oracles | arXiv | Paper | Research | Yes | - | arXiv:1903.00130 | - | - |
| brod-2019-photonic | Brod et al. | 2019 | Photonic implementation of boson sampling: a review | Advanced Photonics | Review | Graduate | Yes | 10.1117/1.AP.1.3.034001 | - | - | - |
| brunner-2014-bell | Brunner et al. | 2014 | Bell nonlocality | Reviews of Modern Physics | Review | Graduate | Yes | 10.1103/RevModPhys.86.419 | arXiv:1303.2849 | - | - |
| bruss-1998-sixstate | Bruß | 1998 | Optimal Eavesdropping in Quantum Cryptography with Six States | Physical Review Letters | Paper | Research | Yes | 10.1103/PhysRevLett.81.3018 | arXiv:quant-ph/9805019 | - | - |
| bruzewicz-2019-ions | Bruzewicz et al. | 2019 | Trapped-ion quantum computing: Progress and challenges | Applied Physics Reviews | Review | Graduate | Yes | 10.1063/1.5088164 | arXiv:1904.04178 | - | - |
| budker-2007-magnetometry | Budker and Romalis | 2007 | Optical magnetometry | Nature Physics | Review | Graduate | Yes | 10.1038/nphys566 | arXiv:physics/0611246 | - | - |
| budroni-2022-contextuality | Budroni et al. | 2022 | Kochen-Specker contextuality | Reviews of Modern Physics | Review | Graduate | Yes | 10.1103/RevModPhys.94.045007 | arXiv:2102.13036 | - | - |
| buhrman-2001-fingerprinting | Buhrman et al. | 2001 | Quantum Fingerprinting | Physical Review Letters | Paper | Research | Yes | 10.1103/PhysRevLett.87.167902 | arXiv:quant-ph/0102001 | - | - |
| buhrman-2002-survey | Buhrman and de Wolf | 2002 | Complexity measures and decision tree complexity: a survey | Theoretical Computer Science | Review | Graduate | Yes | 10.1016/S0304-3975(01)00144-X | - | - | - |
| buhrman-2014-position | Buhrman et al. | 2014 | Position-Based Quantum Cryptography: Impossibility and Constructions | SIAM Journal on Computing | Paper | Research | Yes | 10.1137/130913687 | arXiv:1009.2490 | - | - |
| burkard-2023-spin | Burkard et al. | 2023 | Semiconductor spin qubits | Reviews of Modern Physics | Review | Graduate | Yes | 10.1103/RevModPhys.95.025003 | arXiv:2112.08863 | - | - |
| cai-2004-wiretap | Cai, Winter and Yeung | 2004 | Quantum privacy and quantum wiretap channels | Problems of Information Transmission | Paper | Research | No | 10.1007/s11122-005-0002-x | - | - | - |
| cai-2023-mitigation | Cai et al. | 2023 | Quantum error mitigation | Reviews of Modern Physics | Review | Graduate | Yes | 10.1103/RevModPhys.95.045005 | arXiv:2210.00921 | - | - |
| calderbank-1996-good | Calderbank and Shor | 1996 | Good quantum error-correcting codes exist | Physical Review A | Paper | Graduate | Yes | 10.1103/PhysRevA.54.1098 | arXiv:quant-ph/9512032 | - | - |
| calsamiglia-2001-bell | Calsamiglia and Lütkenhaus | 2001 | Maximum efficiency of a linear-optical Bell-state analyzer | Applied Physics B | Paper | Research | Yes | 10.1007/s003400000484 | arXiv:quant-ph/0007058 | - | - |
| campbell-2019-qdrift | Campbell | 2019 | Random Compiler for Fast Hamiltonian Simulation | Physical Review Letters | Paper | Research | Yes | 10.1103/PhysRevLett.123.070503 | arXiv:1811.08017 | - | - |
| castryck-2023-sidh | Castryck and Decru | 2023 | An Efficient Key Recovery Attack on SIDH | Lecture Notes in Computer Science | Paper | Research | No | 10.1007/978-3-031-30589-4_15 | - | - | - |
| caves-1981-interferometer | Caves | 1981 | Quantum-mechanical noise in an interferometer | Physical Review D | Paper | Research | No | 10.1103/PhysRevD.23.1693 | - | - | - |
| cerezo-2021-vqa | Cerezo et al. | 2021 | Variational quantum algorithms | Nature Reviews Physics | Review | Graduate | Yes | 10.1038/s42254-021-00348-9 | arXiv:2012.09265 | - | - |
| cerezo-2022-qml | Cerezo et al. | 2022 | Challenges and opportunities in quantum machine learning | Nature Computational Science | Review | Graduate | No | 10.1038/s43588-022-00311-3 | - | - | - |
| cerezo-2025-simulability | Cerezo et al. | 2025 | Does provable absence of barren plateaus imply classical simulability? | Nature Communications | Paper | Research | Yes | 10.1038/s41467-025-63099-6 | arXiv:2312.09121 | - | - |
| chailloux-2009-coin | Chailloux and Kerenidis | 2009 | Optimal Quantum Strong Coin Flipping | 2009 50th Annual IEEE Symposium on Foundations of Computer Science | Paper | Research | Yes | 10.1109/FOCS.2009.71 | arXiv:0904.1511 | - | - |
| chakrabarti-2021-threshold | Chakrabarti et al. | 2021 | A Threshold for Quantum Advantage in Derivative Pricing | Quantum | Paper | Research | Yes | 10.22331/q-2021-06-01-463 | arXiv:2012.03819 | - | - |
| chamberland-2020-heavyhex | Chamberland et al. | 2020 | Topological and Subsystem Codes on Low-Degree Graphs with Flag Qubits | Physical Review X | Paper | Research | Yes | 10.1103/PhysRevX.10.011022 | arXiv:1907.09528 | - | - |
| chao-2018-flag | Chao and Reichardt | 2018 | Quantum Error Correction with Only Two Extra Qubits | Physical Review Letters | Paper | Research | Yes | 10.1103/PhysRevLett.121.050502 | arXiv:1705.02329 | - | - |
| chen-2021-network | Chen et al. | 2021 | An integrated space-to-ground quantum communication network over 4,600 kilometres | Nature | Paper | Research | No | 10.1038/s41586-020-03093-8 | - | - | - |
| chen-2023-gibbs | Chen, Kastoryano and Gilyén | 2023 | An efficient and exact noncommutative quantum Gibbs sampler | arXiv | Paper | Research | Yes | - | arXiv:2311.09207 | - | - |
| chen-2023-nisq | Chen et al. | 2023 | The complexity of NISQ | Nature Communications | Paper | Research | Yes | 10.1038/s41467-023-41217-6 | arXiv:2210.07234 | - | - |
| chia-2022-dequantizing | Chia et al. | 2022 | Sampling-based Sublinear Low-rank Matrix Arithmetic Framework for Dequantizing Quantum Machine Learning | Journal of the ACM | Paper | Research | Yes | 10.1145/3549524 | arXiv:1910.06151 | - | - |
| childs-2003-exponential | Childs et al. | 2003 | Exponential algorithmic speedup by a quantum walk | Proceedings of the thirty-fifth annual ACM symposium on Theory of computing | Paper | Research | Yes | 10.1145/780542.780552 | arXiv:quant-ph/0209131 | - | - |
| childs-2004-spatial | Childs and Goldstone | 2004 | Spatial search by quantum walk | Physical Review A | Paper | Research | Yes | 10.1103/PhysRevA.70.022314 | arXiv:quant-ph/0306054 | - | - |
| childs-2009-universal | Childs | 2009 | Universal Computation by Quantum Walk | Physical Review Letters | Paper | Research | Yes | 10.1103/PhysRevLett.102.180501 | arXiv:0806.1972 | - | - |
| childs-2010-algebraic | Childs and van Dam | 2010 | Quantum algorithms for algebraic problems | Reviews of Modern Physics | Review | Graduate | Yes | 10.1103/RevModPhys.82.1 | arXiv:0812.0380 | - | - |
| childs-2012-lcu | Childs and Wiebe | 2012 | Hamiltonian simulation using linear combinations of unitary operations | Quantum Information and Computation | Paper | Research | Yes | 10.26421/QIC12.11-12-1 | arXiv:1202.5822 | - | - |
| childs-2013-isogenies | Childs, Jao and Soukharev | 2013 | Constructing elliptic curve isogenies in quantum subexponential time | Journal of Mathematical Cryptology | Paper | Research | Yes | 10.1515/jmc-2012-0016 | arXiv:1012.4019 | - | - |
| childs-2017-linear | Childs, Kothari and Somma | 2017 | Quantum Algorithm for Systems of Linear Equations with Exponentially Improved Dependence on Precision | SIAM Journal on Computing | Paper | Research | Yes | 10.1137/16M1087072 | arXiv:1511.02306 | - | - |
| childs-2021-trotter | Childs et al. | 2021 | Theory of Trotter Error with Commutator Scaling | Physical Review X | Paper | Research | Yes | 10.1103/PhysRevX.11.011020 | arXiv:1912.08854 | - | - |
| childs-notes | Childs | 2025 | Lecture Notes on Quantum Algorithms | University of Maryland | Lecture notes | Graduate | Yes | - | - | https://www.cs.umd.edu/~amchilds/qa/ | URL opened 2026-11-23 |
| chitambar-2014-locc | Chitambar et al. | 2014 | Everything You Always Wanted to Know About LOCC (But Were Afraid to Ask) | Communications in Mathematical Physics | Paper | Graduate | Yes | 10.1007/s00220-014-1953-9 | arXiv:1210.4583 | - | - |
| chitambar-2019-resource | Chitambar and Gour | 2019 | Quantum resource theories | Reviews of Modern Physics | Review | Graduate | Yes | 10.1103/RevModPhys.91.025001 | arXiv:1806.06107 | - | - |
| choi-1975-positive | Choi | 1975 | Completely positive linear maps on complex matrices | Linear Algebra and its Applications | Paper | Research | No | 10.1016/0024-3795(75)90075-0 | - | - | - |
| chong-2017-stack | Chong, Franklin and Martonosi | 2017 | Programming languages and compiler design for realistic quantum hardware | Nature | Review | University | No | 10.1038/nature23459 | - | - | - |
| chuang-1997-tomography | Chuang and Nielsen | 1997 | Prescription for experimental determination of the dynamics of a quantum black box | Journal of Modern Optics | Paper | Research | Yes | 10.1080/09500349708231894 | arXiv:quant-ph/9610001 | - | - |
| cirac-1995-ions | Cirac and Zoller | 1995 | Quantum Computations with Cold Trapped Ions | Physical Review Letters | Paper | Research | No | 10.1103/PhysRevLett.74.4091 | - | - | - |
| cirac-1999-distributed | Cirac et al. | 1999 | Distributed quantum computation over noisy channels | Physical Review A | Paper | Research | Yes | 10.1103/PhysRevA.59.4249 | arXiv:quant-ph/9803017 | - | - |
| cirelson-1980-bell | Cirel'son | 1980 | Quantum generalizations of Bell's inequality | Letters in Mathematical Physics | Paper | Research | No | 10.1007/BF00417500 | - | - | - |
| cirq-docs | Google Quantum AI | - | Cirq documentation | Official docs | Company claim | Intro | Yes | - | - | https://quantumai.google/cirq | URL not checked |
| clarke-2008-superconducting | Clarke and Wilhelm | 2008 | Superconducting quantum bits | Nature | Review | University | No | 10.1038/nature07128 | - | - | - |
| clauser-1969-chsh | Clauser et al. | 1969 | Proposed Experiment to Test Local Hidden-Variable Theories | Physical Review Letters | Paper | Research | No | 10.1103/PhysRevLett.23.880 | - | - | - |
| clerk-2010-noise | Clerk et al. | 2010 | Introduction to quantum noise, measurement, and amplification | Reviews of Modern Physics | Review | Graduate | Yes | 10.1103/RevModPhys.82.1155 | arXiv:0810.4729 | - | - |
| cleve-1998-revisited | Cleve et al. | 1998 | Quantum algorithms revisited | Proceedings of the Royal Society of London. Series A: Mathematical, Physical and Engineering Sciences | Paper | Research | Yes | 10.1098/rspa.1998.0164 | arXiv:quant-ph/9708016 | - | - |
| cleve-1999-sharing | Cleve, Gottesman and Lo | 1999 | How to Share a Quantum Secret | Physical Review Letters | Paper | Research | Yes | 10.1103/PhysRevLett.83.648 | arXiv:quant-ph/9901025 | - | - |
| coecke-2011-interacting | Coecke and Duncan | 2011 | Interacting quantum observables: categorical algebra and diagrammatics | New Journal of Physics | Paper | Research | Yes | 10.1088/1367-2630/13/4/043016 | arXiv:0906.4725 | - | - |
| coenen-2017-rri | Coenen and Grunwald | 2017 | Responsible research and innovation (RRI) in quantum technology | Ethics and Information Technology | Paper | University | No | 10.1007/s10676-017-9432-6 | - | - | - |
| coffman-2000-distributed | Coffman, Kundu and Wootters | 2000 | Distributed entanglement | Physical Review A | Paper | Research | Yes | 10.1103/PhysRevA.61.052306 | arXiv:quant-ph/9907047 | - | - |
| coles-2017-entropic | Coles et al. | 2017 | Entropic uncertainty relations and their applications | Reviews of Modern Physics | Review | Graduate | Yes | 10.1103/RevModPhys.89.015002 | arXiv:1511.04857 | - | - |
| cong-2019-qcnn | Cong, Choi and Lukin | 2019 | Quantum convolutional neural networks | Nature Physics | Paper | Research | Yes | 10.1038/s41567-019-0648-8 | arXiv:1810.03787 | - | - |
| cooley-1965-fft | Cooley and Tukey | 1965 | An algorithm for the machine calculation of complex Fourier series | Mathematics of Computation | Paper | Research | No | 10.1090/S0025-5718-1965-0178586-1 | - | - | - |
| cooper-2020-sp800208 | Cooper et al. | 2020 | Recommendation for Stateful Hash-Based Signature Schemes | National Institute of Standards and Technology | Standard | Graduate | Yes | 10.6028/NIST.SP.800-208 | - | - | - |
| coppersmith-2002-fourier | Coppersmith | 2002 | An approximate Fourier transform useful in quantum factoring | arXiv | Paper | Research | Yes | - | arXiv:quant-ph/0201067 | - | - |
| corcoles-2021-dynamic | Córcoles et al. | 2021 | Exploiting Dynamic Quantum Circuits in a Quantum Algorithm with Superconducting Qubits | Physical Review Letters | Paper | Research | Yes | 10.1103/PhysRevLett.127.100501 | arXiv:2102.01682 | - | - |
| costa-2022-optimal | Costa et al. | 2022 | Optimal Scaling Quantum Linear-Systems Solver via Discrete Adiabatic Theorem | PRX Quantum | Paper | Research | Yes | 10.1103/PRXQuantum.3.040303 | arXiv:2111.08152 | - | - |
| cover-2005-elements | Cover and Thomas | 2005 | Elements of Information Theory | Wiley | Textbook | University | No | 10.1002/047174882X | - | - | - |
| cowtan-2019-routing | Cowtan et al. | 2019 | On the qubit routing problem | arXiv | Paper | Research | Yes | - | arXiv:1902.08091 | - | - |
| cronin-2009-interferometry | Cronin, Schmiedmayer and Pritchard | 2009 | Optics and interferometry with atoms and molecules | Reviews of Modern Physics | Review | Graduate | Yes | 10.1103/RevModPhys.81.1051 | arXiv:0712.3703 | - | arXiv title: "Atom Interferometers" |
| cross-2017-openqasm | Cross et al. | 2017 | Open Quantum Assembly Language | arXiv | Paper | University | Yes | - | arXiv:1707.03429 | - | - |
| cross-2019-volume | Cross et al. | 2019 | Validating quantum computers using randomized model circuits | Physical Review A | Paper | Research | Yes | 10.1103/PhysRevA.100.032328 | arXiv:1811.12926 | - | - |
| cross-2022-openqasm | Cross et al. | 2022 | OpenQASM 3: A Broader and Deeper Quantum Assembly Language | ACM Transactions on Quantum Computing | Standard | University | Yes | 10.1145/3505636 | arXiv:2104.14722 | - | - |
| cuccaro-2004-adder | Cuccaro et al. | 2004 | A new quantum ripple-carry addition circuit | arXiv | Paper | Research | Yes | - | arXiv:quant-ph/0410184 | - | - |
| cudaq-docs | NVIDIA | - | CUDA-Q documentation | Official docs | Company claim | University | Yes | - | - | https://nvidia.github.io/cuda-quantum/ | URL not checked |
| cuquantum-docs | NVIDIA | - | cuQuantum SDK documentation | Official docs | Company claim | University | Yes | - | - | https://docs.nvidia.com/cuda/cuquantum/ | URL not checked |
| czarnik-2021-cdr | Czarnik et al. | 2021 | Error mitigation with Clifford quantum-circuit data | Quantum | Paper | Research | Yes | 10.22331/q-2021-11-26-592 | arXiv:2005.10189 | - | - |
| dahlberg-2019-linklayer | Dahlberg et al. | 2019 | A link layer protocol for quantum networks | Proceedings of the ACM Special Interest Group on Data Communication | Paper | Research | Yes | 10.1145/3341302.3342070 | arXiv:1903.09778 | - | - |
| daley-2022-practical | Daley et al. | 2022 | Practical quantum advantage in quantum simulation | Nature | Review | Graduate | No | 10.1038/s41586-022-04940-6 | - | - | - |
| dalzell-2023-survey | Dalzell et al. | 2025 | Quantum Algorithms | Cambridge University Press | Review | Graduate | Yes | 10.1017/9781009639651 | arXiv:2310.03011 | - | - |
| darpa-qbi | DARPA | - | Quantum Benchmarking Initiative | Program page | Company claim | Intro | Yes | - | - | https://www.darpa.mil/research/programs/quantum-benchmarking-initiative | URL not checked |
| dawson-2005-solovay | Dawson and Nielsen | 2006 | The Solovay-Kitaev algorithm | Quantum Information and Computation | Paper | Graduate | Yes | 10.26421/QIC6.1-6 | arXiv:quant-ph/0505030 | - | - |
| degen-2017-sensing | Degen, Reinhard and Cappellaro | 2017 | Quantum sensing | Reviews of Modern Physics | Review | Graduate | Yes | 10.1103/RevModPhys.89.035002 | arXiv:1611.02427 | - | - |
| demkowicz-2012-elusive | Demkowicz-Dobrzański, Kołodyński and Guţă | 2012 | The elusive Heisenberg limit in quantum-enhanced metrology | Nature Communications | Paper | Research | Yes | 10.1038/ncomms2067 | arXiv:1201.3940 | - | - |
| dennis-2002-memory | Dennis et al. | 2002 | Topological quantum memory | Journal of Mathematical Physics | Paper | Research | Yes | 10.1063/1.1499754 | arXiv:quant-ph/0110143 | - | - |
| deraedt-2019-simulator | De Raedt et al. | 2019 | Massively parallel quantum computer simulator, eleven years later | Computer Physics Communications | Paper | Research | No | 10.1016/j.cpc.2018.11.005 | - | - | - |
| deutsch-1985-universal | Deutsch | 1985 | Quantum theory, the Church–Turing principle and the universal quantum computer | Proceedings of the Royal Society of London. A. Mathematical and Physical Sciences | Paper | Research | No | 10.1098/rspa.1985.0070 | - | - | - |
| deutsch-1992-rapid | Deutsch and Jozsa | 1992 | Rapid solution of problems by quantum computation | Proceedings of the Royal Society of London. Series A: Mathematical and Physical Sciences | Paper | Research | No | 10.1098/rspa.1992.0167 | - | - | - |
| deutsch-1996-privacy | Deutsch et al. | 1996 | Quantum Privacy Amplification and the Security of Quantum Cryptography over Noisy Channels | Physical Review Letters | Paper | Research | Yes | 10.1103/PhysRevLett.77.2818 | arXiv:quant-ph/9604039 | - | - |
| devetak-2005-private | Devetak | 2005 | The Private Classical Capacity and Quantum Capacity of a Quantum Channel | IEEE Transactions on Information Theory | Paper | Research | Yes | 10.1109/TIT.2004.839515 | arXiv:quant-ph/0304127 | - | - |
| devitt-2013-qec | Devitt, Munro and Nemoto | 2013 | Quantum error correction for beginners | Reports on Progress in Physics | Review | University | Yes | 10.1088/0034-4885/76/7/076001 | arXiv:0905.2794 | - | - |
| devitt-2016-cloud | Devitt | 2016 | Performing quantum computing experiments in the cloud | Physical Review A | Paper | University | Yes | 10.1103/PhysRevA.94.032329 | arXiv:1605.05709 | - | - |
| dewolf-notes | de Wolf | 2019 | Quantum Computing: Lecture Notes | arXiv | Lecture notes | University | Yes | - | arXiv:1907.09415 | - | - |
| diffie-1976-directions | Diffie and Hellman | 1976 | New directions in cryptography | IEEE Transactions on Information Theory | Paper | University | No | 10.1109/TIT.1976.1055638 | - | - | - |
| ding-2023-shorter | Ding and Lin | 2023 | Even Shorter Quantum Circuit for Phase Estimation on Early Fault-Tolerant Quantum Computers with Applications to Ground-State Energy Estimation | PRX Quantum | Paper | Research | Yes | 10.1103/PRXQuantum.4.020331 | arXiv:2211.11973 | - | - |
| dirac-1939-notation | Dirac | 1939 | A new notation for quantum mechanics | Mathematical Proceedings of the Cambridge Philosophical Society | Paper | Research | No | 10.1017/S0305004100021162 | - | - | - |
| divincenzo-1995-twobit | DiVincenzo | 1995 | Two-bit gates are universal for quantum computation | Physical Review A | Paper | Research | Yes | 10.1103/PhysRevA.51.1015 | arXiv:cond-mat/9407022 | - | - |
| divincenzo-2000-physical | DiVincenzo | 2000 | The Physical Implementation of Quantum Computation | Fortschritte der Physik | Paper | University | Yes | 10.1002/1521-3978(200009)48:9/11<771::AID-PROP771>3.0.CO;2-E | arXiv:quant-ph/0002077 | - | - |
| dobsicek-2007-iterative | Dobšíček et al. | 2007 | Arbitrary accuracy iterative quantum phase estimation algorithm using a single ancillary qubit: A two-qubit benchmark | Physical Review A | Paper | Research | Yes | 10.1103/PhysRevA.76.030306 | arXiv:quant-ph/0610214 | - | arXiv title: "Arbitrary accuracy iterative phase estimation algorithm as a two qubit benchmark" |
| doherty-2013-nv | Doherty et al. | 2013 | The nitrogen-vacancy colour centre in diamond | Physics Reports | Review | Graduate | Yes | 10.1016/j.physrep.2013.02.001 | arXiv:1302.3288 | - | - |
| draper-2000-addition | Draper | 2000 | Addition on a Quantum Computer | arXiv | Paper | Research | Yes | - | arXiv:quant-ph/0008033 | - | - |
| duan-2001-dlcz | Duan et al. | 2001 | Long-distance quantum communication with atomic ensembles and linear optics | Nature | Paper | Research | Yes | 10.1038/35106500 | arXiv:quant-ph/0105105 | - | - |
| ducas-2018-dilithium | Ducas et al. | 2018 | CRYSTALS-Dilithium: A Lattice-Based Digital Signature Scheme | IACR Transactions on Cryptographic Hardware and Embedded Systems | Paper | Research | Yes | 10.46586/tches.v2018.i1.238-268 | - | - | - |
| duncan-2020-graph | Duncan et al. | 2020 | Graph-theoretic Simplification of Quantum Circuits with the ZX-calculus | Quantum | Paper | Research | Yes | 10.22331/q-2020-06-04-279 | arXiv:1902.03178 | - | - |
| dur-2000-three | Dür, Vidal and Cirac | 2000 | Three qubits can be entangled in two inequivalent ways | Physical Review A | Paper | Research | Yes | 10.1103/PhysRevA.62.062314 | arXiv:quant-ph/0005115 | - | - |
| durr-1996-minimum | Durr and Hoyer | 1996 | A Quantum Algorithm for Finding the Minimum | arXiv | Paper | Research | Yes | - | arXiv:quant-ph/9607014 | - | - |
| durr-2006-graph | Dürr et al. | 2006 | Quantum Query Complexity of Some Graph Problems | SIAM Journal on Computing | Paper | Research | Yes | 10.1137/050644719 | arXiv:quant-ph/0401091 | - | - |
| eastin-2009-transversal | Eastin and Knill | 2009 | Restrictions on Transversal Encoded Quantum Gate Sets | Physical Review Letters | Paper | Research | Yes | 10.1103/PhysRevLett.102.110502 | arXiv:0811.4262 | - | - |
| egger-2021-warmstart | Egger, Mareček and Woerner | 2021 | Warm-starting quantum optimization | Quantum | Paper | Research | Yes | 10.22331/q-2021-06-17-479 | arXiv:2009.10095 | - | - |
| einstein-1935-epr | Einstein, Podolsky and Rosen | 1935 | Can Quantum-Mechanical Description of Physical Reality Be Considered Complete? | Physical Review | Paper | Research | No | 10.1103/PhysRev.47.777 | - | - | - |
| eisaman-2011-photon | Eisaman et al. | 2011 | Invited Review Article: Single-photon sources and detectors | Review of Scientific Instruments | Review | Graduate | No | 10.1063/1.3610677 | - | - | - |
| eisert-2020-certification | Eisert et al. | 2020 | Quantum certification and benchmarking | Nature Reviews Physics | Review | Graduate | Yes | 10.1038/s42254-020-0186-4 | arXiv:1910.06343 | - | - |
| ekert-1991-e91 | Ekert | 1991 | Quantum cryptography based on Bell’s theorem | Physical Review Letters | Paper | Research | No | 10.1103/PhysRevLett.67.661 | - | - | - |
| elben-2022-toolbox | Elben et al. | 2022 | The randomized measurement toolbox | Nature Reviews Physics | Review | Graduate | Yes | 10.1038/s42254-022-00535-2 | arXiv:2203.11374 | - | - |
| elitzur-1993-bomb | Elitzur and Vaidman | 1993 | Quantum mechanical interaction-free measurements | Foundations of Physics | Paper | Research | Yes | 10.1007/BF00736012 | arXiv:hep-th/9305002 | - | - |
| escher-2011-noisy | Escher, de Matos Filho and Davidovich | 2011 | General framework for estimating the ultimate precision limit in noisy quantum-enhanced metrology | Nature Physics | Paper | Research | Yes | 10.1038/nphys1958 | arXiv:1201.1693 | - | - |
| etsi-2019-qkd014 | ETSI | 2019 | GS QKD 014 V1.1.1: Protocol and data format of REST-based key delivery API | ETSI Group Specification | Standard | Graduate | Yes | - | - | https://www.etsi.org/deliver/etsi_gs/QKD/001_099/014/01.01.01_60/gs_QKD014v010101p.pdf | URL not checked |
| ettinger-2004-hsp | Ettinger, Høyer and Knill | 2004 | The quantum query complexity of the hidden subgroup problem is polynomial | Information Processing Letters | Paper | Research | Yes | 10.1016/j.ipl.2004.01.024 | arXiv:quant-ph/0401083 | - | - |
| everett-1957-relative | Everett | 1957 | "Relative State" Formulation of Quantum Mechanics | Reviews of Modern Physics | Paper | Research | No | 10.1103/RevModPhys.29.454 | - | - | - |
| ezzell-2023-decoupling | Ezzell et al. | 2023 | Dynamical decoupling for superconducting qubits: A performance survey | Physical Review Applied | Paper | Research | Yes | 10.1103/PhysRevApplied.20.064027 | arXiv:2207.03670 | - | - |
| facchi-2008-zeno | Facchi and Pascazio | 2008 | Quantum Zeno dynamics: mathematical and physical aspects | Journal of Physics A: Mathematical and Theoretical | Review | Graduate | Yes | 10.1088/1751-8113/41/49/493001 | arXiv:0903.3297 | - | - |
| fancher-2021-rydberg | Fancher et al. | 2021 | Rydberg Atom Electric Field Sensors for Communications and Sensing | IEEE Transactions on Quantum Engineering | Review | Graduate | Yes | 10.1109/TQE.2021.3065227 | - | - | - |
| fano-1957-density | Fano | 1957 | Description of States in Quantum Mechanics by Density Matrix and Operator Techniques | Reviews of Modern Physics | Review | Graduate | No | 10.1103/RevModPhys.29.74 | - | - | - |
| farhi-1998-parity | Farhi et al. | 1998 | Limit on the Speed of Quantum Computation in Determining Parity | Physical Review Letters | Paper | Research | Yes | 10.1103/PhysRevLett.81.5442 | arXiv:quant-ph/9802045 | - | - |
| farhi-1998-trees | Farhi and Gutmann | 1998 | Quantum computation and decision trees | Physical Review A | Paper | Research | Yes | 10.1103/PhysRevA.58.915 | arXiv:quant-ph/9706062 | - | - |
| farhi-2000-adiabatic | Farhi et al. | 2000 | Quantum Computation by Adiabatic Evolution | arXiv | Paper | Research | Yes | - | arXiv:quant-ph/0001106 | - | - |
| farhi-2001-adiabatic | Farhi et al. | 2001 | A Quantum Adiabatic Evolution Algorithm Applied to Random Instances of an NP-Complete Problem | Science | Paper | Research | Yes | 10.1126/science.1057726 | arXiv:quant-ph/0104129 | - | - |
| farhi-2008-nand | Farhi, Goldstone and Gutmann | 2008 | A Quantum Algorithm for the Hamiltonian NAND Tree | Theory of Computing | Paper | Research | Yes | 10.4086/toc.2008.v004a008 | arXiv:quant-ph/0702144 | - | - |
| farhi-2014-qaoa | Farhi, Goldstone and Gutmann | 2014 | A Quantum Approximate Optimization Algorithm | arXiv | Paper | Research | Yes | - | arXiv:1411.4028 | - | - |
| farhi-2018-qnn | Farhi and Neven | 2018 | Classification with Quantum Neural Networks on Near Term Processors | arXiv | Paper | Research | Yes | - | arXiv:1802.06002 | - | - |
| feynman-1965-flp3 | Feynman, Leighton and Sands | 1965 | The Feynman Lectures on Physics, Vol. III: Quantum Mechanics | Free online edition, Caltech | Textbook | University | Yes | - | - | https://www.feynmanlectures.caltech.edu/ | URL not checked |
| feynman-1982-simulating | Feynman | 1982 | Simulating physics with computers | International Journal of Theoretical Physics | Paper | University | No | 10.1007/BF02650179 | - | - | - |
| fitzsimons-2017-blind | Fitzsimons and Kashefi | 2017 | Unconditionally verifiable blind quantum computation | Physical Review A | Paper | Research | Yes | 10.1103/PhysRevA.96.012303 | arXiv:1203.5217 | - | - |
| fitzsimons-2017-private | Fitzsimons | 2017 | Private quantum computation: an introduction to blind quantum computing and related protocols | npj Quantum Information | Review | Graduate | Yes | 10.1038/s41534-017-0025-3 | arXiv:1611.10107 | - | - |
| flammia-2011-fidelity | Flammia and Liu | 2011 | Direct Fidelity Estimation from Few Pauli Measurements | Physical Review Letters | Paper | Research | Yes | 10.1103/PhysRevLett.106.230501 | arXiv:1104.4695 | - | - |
| fowler-2012-surface | Fowler et al. | 2012 | Surface codes: Towards practical large-scale quantum computation | Physical Review A | Paper | Graduate | Yes | 10.1103/PhysRevA.86.032324 | arXiv:1208.0928 | - | - |
| fox-2020-industry | Fox, Zwickl and Lewandowski | 2020 | Preparing for the quantum revolution: What is the role of higher education? | Physical Review Physics Education Research | Paper | Intro | No | 10.1103/PhysRevPhysEducRes.16.020131 | - | - | - |
| foxen-2020-continuous | Foxen et al. | 2020 | Demonstrating a Continuous Set of Two-qubit Gates for Near-term Quantum Algorithms | Physical Review Letters | Paper | Research | Yes | 10.1103/PhysRevLett.125.120504 | arXiv:2001.08343 | - | - |
| fredkin-1982-conservative | Fredkin and Toffoli | 1982 | Conservative logic | International Journal of Theoretical Physics | Paper | Research | No | 10.1007/BF01857727 | - | - | - |
| freedman-2002-topological | Freedman et al. | 2002 | Topological quantum computation | Bulletin of the American Mathematical Society | Review | Graduate | Yes | 10.1090/S0273-0979-02-00964-3 | arXiv:quant-ph/0101025 | - | - |
| fuchs-1999-distinguishability | Fuchs and van de Graaf | 1999 | Cryptographic distinguishability measures for quantum-mechanical states | IEEE Transactions on Information Theory | Paper | Research | Yes | 10.1109/18.761271 | arXiv:quant-ph/9712042 | - | - |
| fuchs-2014-qbism | Fuchs, Mermin and Schack | 2014 | An introduction to QBism with an application to the locality of quantum mechanics | American Journal of Physics | Paper | University | Yes | 10.1119/1.4874855 | arXiv:1311.5253 | - | - |
| ganapathy-2023-squeezing | Ganapathy et al. | 2023 | Broadband Quantum Enhancement of the LIGO Detectors with Frequency-Dependent Squeezing | Physical Review X | Paper | Research | Yes | 10.1103/PhysRevX.13.041021 | - | - | - |
| gao-2025-zuchongzhi | Gao et al. | 2025 | Establishing a New Benchmark in Quantum Computational Advantage with 105-qubit Zuchongzhi 3.0 Processor | Physical Review Letters | Paper | Research | Yes | 10.1103/PhysRevLett.134.090601 | arXiv:2412.11924 | - | - |
| garcia-escartin-2011-equivalent | Garcia-Escartin and Chamorro-Posada | 2011 | Equivalent Quantum Circuits | arXiv | Paper | University | Yes | - | arXiv:1110.2998 | - | - |
| geiger-2020-inertial | Geiger et al. | 2020 | High-accuracy inertial measurements with cold-atom sensors | AVS Quantum Science | Review | Graduate | Yes | 10.1116/5.0009093 | arXiv:2003.12516 | - | - |
| gelfand-2001-trigonometry | Gelfand and Saul | 2001 | Trigonometry | Birkhäuser Boston | Textbook | Intro | No | 10.1007/978-1-4612-0149-6 | - | - | - |
| gentry-2008-trapdoors | Gentry, Peikert and Vaikuntanathan | 2008 | Trapdoors for hard lattices and new cryptographic constructions | Proceedings of the fortieth annual ACM symposium on Theory of computing | Paper | Research | No | 10.1145/1374376.1374407 | - | - | - |
| george-2024-cmos | George et al. | 2024 | 12-spin-qubit arrays fabricated on a 300 mm semiconductor manufacturing line | arXiv | Paper | Research | Yes | - | arXiv:2410.16583 | - | - |
| georgescu-2014-simulation | Georgescu, Ashhab and Nori | 2014 | Quantum simulation | Reviews of Modern Physics | Review | Graduate | Yes | 10.1103/RevModPhys.86.153 | arXiv:1308.6253 | - | - |
| gerlach-1922-richtungsquantelung | Gerlach and Stern | 1922 | Der experimentelle Nachweis der Richtungsquantelung im Magnetfeld | Zeitschrift für Physik | Paper | Research | No | 10.1007/BF01326983 | - | - | - |
| gharibian-2015-hamiltonian | Gharibian et al. | 2015 | Quantum Hamiltonian Complexity | Foundations and Trends® in Theoretical Computer Science | Review | Graduate | Yes | 10.1561/0400000066 | arXiv:1401.3916 | - | - |
| gharibian-2022-dequantizing | Gharibian and Le Gall | 2022 | Dequantizing the Quantum singular value transformation: hardness and applications to Quantum chemistry and the Quantum PCP conjecture | Proceedings of the 54th Annual ACM SIGACT Symposium on Theory of Computing | Paper | Research | Yes | 10.1145/3519935.3519991 | arXiv:2111.09079 | - | - |
| gheorghiu-2018-verification | Gheorghiu, Kapourniotis and Kashefi | 2018 | Verification of Quantum Computation: An Overview of Existing Approaches | Theory of Computing Systems | Review | Graduate | Yes | 10.1007/s00224-018-9872-3 | arXiv:1709.06984 | - | - |
| ghirardi-1980-superluminal | Ghirardi, Rimini and Weber | 1980 | A general argument against superluminal transmission through the quantum mechanical measurement process | Lettere al Nuovo Cimento | Paper | Research | No | 10.1007/BF02817189 | - | - | - |
| gidney-2021-rsa | Gidney and Ekerå | 2021 | How to factor 2048 bit RSA integers in 8 hours using 20 million noisy qubits | Quantum | Paper | Research | Yes | 10.22331/q-2021-04-15-433 | arXiv:1905.09749 | - | - |
| gidney-2021-stim | Gidney | 2021 | Stim: a fast stabilizer circuit simulator | Quantum | Paper | Research | Yes | 10.22331/q-2021-07-06-497 | arXiv:2103.02202 | - | - |
| gidney-2024-cultivation | Gidney, Shutty and Jones | 2024 | Magic state cultivation: growing T states as cheap as CNOT gates | arXiv | Paper | Research | Yes | - | arXiv:2409.17595 | - | - |
| gidney-2025-rsa | Gidney | 2025 | How to factor 2048 bit RSA integers with less than a million noisy qubits | arXiv | Paper | Research | Yes | - | arXiv:2505.15917 | - | - |
| gilliam-2021-gas | Gilliam, Woerner and Gonciulea | 2021 | Grover Adaptive Search for Constrained Polynomial Binary Optimization | Quantum | Paper | Research | Yes | 10.22331/q-2021-04-08-428 | arXiv:1912.04088 | - | - |
| gilyen-2019-gradient | Gilyén, Arunachalam and Wiebe | 2019 | Optimizing quantum optimization algorithms via faster quantum gradient computation | Proceedings of the Thirtieth Annual ACM-SIAM Symposium on Discrete Algorithms | Paper | Research | Yes | 10.1137/1.9781611975482.87 | arXiv:1711.00465 | - | - |
| gilyen-2019-qsvt | Gilyén et al. | 2019 | Quantum singular value transformation and beyond: exponential improvements for quantum matrix arithmetics | Proceedings of the 51st Annual ACM SIGACT Symposium on Theory of Computing | Paper | Research | Yes | 10.1145/3313276.3316366 | arXiv:1806.01838 | - | - |
| giovannetti-2004-enhanced | Giovannetti, Lloyd and Maccone | 2004 | Quantum-Enhanced Measurements: Beating the Standard Quantum Limit | Science | Review | University | Yes | 10.1126/science.1104149 | arXiv:quant-ph/0412078 | - | - |
| giovannetti-2006-metrology | Giovannetti, Lloyd and Maccone | 2006 | Quantum Metrology | Physical Review Letters | Paper | Research | Yes | 10.1103/PhysRevLett.96.010401 | arXiv:quant-ph/0509179 | - | - |
| giovannetti-2008-qram | Giovannetti, Lloyd and Maccone | 2008 | Quantum Random Access Memory | Physical Review Letters | Paper | Research | Yes | 10.1103/PhysRevLett.100.160501 | arXiv:0708.1879 | - | - |
| giovannetti-2011-metrology | Giovannetti, Lloyd and Maccone | 2011 | Advances in quantum metrology | Nature Photonics | Review | University | Yes | 10.1038/nphoton.2011.35 | arXiv:1102.2318 | - | - |
| gisin-2002-qkd | Gisin et al. | 2002 | Quantum cryptography | Reviews of Modern Physics | Review | University | Yes | 10.1103/RevModPhys.74.145 | arXiv:quant-ph/0101098 | - | - |
| gisin-2007-communication | Gisin and Thew | 2007 | Quantum communication | Nature Photonics | Review | University | Yes | 10.1038/nphoton.2007.22 | arXiv:quant-ph/0703255 | - | - |
| glaser-2015-control | Glaser et al. | 2015 | Training Schrödinger’s cat: quantum optimal control | The European Physical Journal D | Review | Graduate | Yes | 10.1140/epjd/e2015-60464-1 | arXiv:1508.00442 | - | - |
| google-2021-repetition | Google Quantum AI et al. | 2021 | Exponential suppression of bit or phase errors with cyclic error correction | Nature | Paper | Research | Yes | 10.1038/s41586-021-03588-y | arXiv:2102.06132 | - | arXiv title: "Exponential suppression of bit or phase flip errors with repetitive error correction" |
| google-2024-threshold | Google Quantum AI and Collaborators et al. | 2024 | Quantum error correction below the surface code threshold | Nature | Paper | Research | Yes | 10.1038/s41586-024-08449-y | arXiv:2408.13687 | - | - |
| google-2025-echoes | Google Quantum AI and Collaborators et al. | 2025 | Observation of constructive interference at the edge of quantum ergodicity | Nature | Paper | Research | Yes | 10.1038/s41586-025-09526-6 | arXiv:2506.10191 | - | arXiv title: "Constructive interference at the edge of quantum ergodic dynamics" |
| google-roadmap | Google Quantum AI | - | Roadmap | Company page | Company claim | Intro | Yes | - | - | https://quantumai.google/roadmap | URL not checked |
| goold-2016-thermo | Goold et al. | 2016 | The role of quantum information in thermodynamics—a topical review | Journal of Physics A: Mathematical and Theoretical | Review | Graduate | Yes | 10.1088/1751-8113/49/14/143001 | arXiv:1505.07835 | - | - |
| gottesman-1997-thesis | Gottesman | 1997 | Stabilizer Codes and Quantum Error Correction | arXiv | Paper | Graduate | Yes | - | arXiv:quant-ph/9705052 | - | - |
| gottesman-1998-heisenberg | Gottesman | 1998 | The Heisenberg Representation of Quantum Computers | arXiv | Paper | Research | Yes | - | arXiv:quant-ph/9807006 | - | - |
| gottesman-1999-gate | Gottesman and Chuang | 1999 | Demonstrating the viability of universal quantum computation using teleportation and single-qubit operations | Nature | Paper | Research | Yes | 10.1038/46503 | arXiv:quant-ph/9908010 | - | arXiv title: "Quantum Teleportation is a Universal Computational Primitive" |
| gottesman-2001-gkp | Gottesman, Kitaev and Preskill | 2001 | Encoding a qubit in an oscillator | Physical Review A | Paper | Research | Yes | 10.1103/PhysRevA.64.012310 | arXiv:quant-ph/0008040 | - | - |
| gottesman-2009-intro | Gottesman | 2009 | An Introduction to Quantum Error Correction and Fault-Tolerant Quantum Computation | arXiv | Lecture notes | Graduate | Yes | - | arXiv:0904.2557 | - | - |
| gottesman-2012-telescopes | Gottesman, Jennewein and Croke | 2012 | Longer-Baseline Telescopes Using Quantum Repeaters | Physical Review Letters | Paper | Research | Yes | 10.1103/PhysRevLett.109.070503 | arXiv:1107.2939 | - | - |
| gouzien-2021-factoring | Gouzien and Sangouard | 2021 | Factoring 2048-bit RSA Integers in 177 Days with 13 436 Qubits and a Multimode Memory | Physical Review Letters | Paper | Research | No | 10.1103/PhysRevLett.127.140503 | - | - | - |
| grangier-1986-anticorrelation | Grangier, Roger and Aspect | 1986 | Experimental Evidence for a Photon Anticorrelation Effect on a Beam Splitter: A New Light on Single-Photon Interferences | Europhysics Letters (EPL) | Paper | Research | No | 10.1209/0295-5075/1/4/004 | - | - | - |
| grangier-1998-qnd | Grangier, Levenson and Poizat | 1998 | Quantum non-demolition measurements in optics | Nature | Review | Graduate | No | 10.1038/25059 | - | - | - |
| grassl-2016-aes | Grassl et al. | 2016 | Applying Grover’s Algorithm to AES: Quantum Resource Estimates | Lecture Notes in Computer Science | Paper | Research | Yes | 10.1007/978-3-319-29360-8_3 | arXiv:1512.04965 | - | - |
| green-2013-quipper | Green et al. | 2013 | Quipper | Proceedings of the 34th ACM SIGPLAN Conference on Programming Language Design and Implementation | Paper | Research | Yes | 10.1145/2491956.2462177 | arXiv:1304.3390 | - | - |
| greenberger-1990-bell | Greenberger et al. | 1990 | Bell’s theorem without inequalities | American Journal of Physics | Paper | Research | No | 10.1119/1.16243 | - | - | - |
| greinert-2023-workforce | Greinert et al. | 2023 | Future quantum workforce: Competences, requirements, and forecasts | Physical Review Physics Education Research | Paper | Intro | No | 10.1103/PhysRevPhysEducRes.19.010137 | - | - | - |
| grimsley-2019-adapt | Grimsley et al. | 2019 | An adaptive variational algorithm for exact molecular simulations on a quantum computer | Nature Communications | Paper | Research | Yes | 10.1038/s41467-019-10988-2 | arXiv:1812.11173 | - | - |
| grosshans-2002-cvqkd | Grosshans and Grangier | 2002 | Continuous Variable Quantum Cryptography Using Coherent States | Physical Review Letters | Paper | Research | Yes | 10.1103/PhysRevLett.88.057902 | arXiv:quant-ph/0109084 | - | - |
| grover-1996-search | Grover | 1996 | A fast quantum mechanical algorithm for database search | Proceedings of the twenty-eighth annual ACM symposium on Theory of computing - STOC '96 | Paper | Research | Yes | 10.1145/237814.237866 | arXiv:quant-ph/9605043 | - | - |
| grover-2002-superpositions | Grover and Rudolph | 2002 | Creating superpositions that correspond to efficiently integrable probability distributions | arXiv | Paper | Research | Yes | - | arXiv:quant-ph/0208112 | - | - |
| guhne-2009-detection | Gühne and Tóth | 2009 | Entanglement detection | Physics Reports | Review | Graduate | Yes | 10.1016/j.physrep.2009.02.004 | arXiv:0811.2803 | - | - |
| guo-2019-distributed | Guo et al. | 2019 | Distributed quantum sensing in a continuous-variable entangled network | Nature Physics | Paper | Research | Yes | 10.1038/s41567-019-0743-x | arXiv:1905.09408 | - | - |
| haah-2017-tomography | Haah et al. | 2017 | Sample-optimal tomography of quantum states | IEEE Transactions on Information Theory | Paper | Research | Yes | 10.1109/TIT.2017.2719044 | arXiv:1508.01797 | - | - |
| hadfield-2019-ansatz | Hadfield et al. | 2019 | From the Quantum Approximate Optimization Algorithm to a Quantum Alternating Operator Ansatz | Algorithms | Paper | Research | Yes | 10.3390/a12020034 | arXiv:1709.03489 | - | - |
| hahn-1950-echo | Hahn | 1950 | Spin Echoes | Physical Review | Paper | Research | No | 10.1103/PhysRev.80.580 | - | - | - |
| hall-2015-lie | Hall | 2015 | Lie Groups, Lie Algebras, and Representations | Graduate Texts in Mathematics | Textbook | Graduate | No | 10.1007/978-3-319-13467-3 | - | - | - |
| hallgren-2007-pell | Hallgren | 2007 | Polynomial-time quantum algorithms for Pell's equation and the principal ideal problem | Journal of the ACM | Paper | Research | No | 10.1145/1206035.1206039 | - | - | - |
| hamilton-2017-gbs | Hamilton et al. | 2017 | Gaussian Boson Sampling | Physical Review Letters | Paper | Research | Yes | 10.1103/PhysRevLett.119.170501 | arXiv:1612.01199 | - | - |
| haner-2017-petabyte | Häner and Steiger | 2017 | 0.5 petabyte simulation of a 45-qubit quantum circuit | Proceedings of the International Conference for High Performance Computing, Networking, Storage and Analysis | Paper | Research | Yes | 10.1145/3126908.3126947 | arXiv:1704.01127 | - | - |
| hangleiter-2023-sampling | Hangleiter and Eisert | 2023 | Computational advantage of quantum random sampling | Reviews of Modern Physics | Review | Graduate | Yes | 10.1103/RevModPhys.95.035001 | arXiv:2206.04079 | - | - |
| hardy-2008-numbers | Hardy and Wright | 2008 | An Introduction To The Theory Of Numbers | Oxford University PressOxford | Textbook | University | No | 10.1093/oso/9780199219858.001.0001 | - | - | - |
| harrigan-2024-qualtran | Harrigan et al. | 2024 | Expressing and Analyzing Quantum Algorithms with Qualtran | arXiv | Paper | Research | Yes | - | arXiv:2409.04643 | - | - |
| harrow-2009-linear | Harrow, Hassidim and Lloyd | 2009 | Quantum Algorithm for Linear Systems of Equations | Physical Review Letters | Paper | Research | Yes | 10.1103/PhysRevLett.103.150502 | arXiv:0811.3171 | - | - |
| harrow-2017-supremacy | Harrow and Montanaro | 2017 | Quantum computational supremacy | Nature | Review | University | Yes | 10.1038/nature23458 | arXiv:1809.07442 | - | - |
| hashim-2021-compiling | Hashim et al. | 2021 | Randomized Compiling for Scalable Quantum Computing on a Noisy Superconducting Quantum Processor | Physical Review X | Paper | Research | Yes | 10.1103/PhysRevX.11.041039 | arXiv:2010.00215 | - | - |
| hastings-2009-superadditivity | Hastings | 2009 | Superadditivity of communication capacity using entangled inputs | Nature Physics | Paper | Research | Yes | 10.1038/nphys1224 | arXiv:0809.3972 | - | - |
| hastings-2021-floquet | Hastings and Haah | 2021 | Dynamically Generated Logical Qubits | Quantum | Paper | Research | Yes | 10.22331/q-2021-10-19-564 | arXiv:2107.02194 | - | - |
| hauke-2020-annealing | Hauke et al. | 2020 | Perspectives of quantum annealing: methods and implementations | Reports on Progress in Physics | Review | Graduate | No | 10.1088/1361-6633/ab85b8 | - | - | - |
| havlicek-2019-feature | Havlíček et al. | 2019 | Supervised learning with quantum-enhanced feature spaces | Nature | Paper | Research | Yes | 10.1038/s41586-019-0980-2 | arXiv:1804.11326 | - | - |
| hayashi-2017-qit | Hayashi | 2017 | Quantum Information Theory | Graduate Texts in Physics | Textbook | Graduate | No | 10.1007/978-3-662-49725-8 | - | - | - |
| heim-2020-languages | Heim et al. | 2020 | Quantum programming languages | Nature Reviews Physics | Review | University | No | 10.1038/s42254-020-00245-7 | - | - | - |
| helsen-2022-rb | Helsen et al. | 2022 | General Framework for Randomized Benchmarking | PRX Quantum | Paper | Graduate | Yes | 10.1103/PRXQuantum.3.020357 | arXiv:2010.07974 | - | - |
| henriet-2020-neutral | Henriet et al. | 2020 | Quantum computing with neutral atoms | Quantum | Review | University | Yes | 10.22331/q-2020-09-21-327 | arXiv:2006.12326 | - | - |
| hensen-2015-loophole | Hensen et al. | 2015 | Loophole-free Bell inequality violation using electron spins separated by 1.3 kilometres | Nature | Paper | Research | Yes | 10.1038/nature15759 | arXiv:1508.05949 | - | arXiv title: "Experimental loophole-free violation of a Bell inequality using entangled electron spins separated by 1.3 km" |
| herman-2023-finance | Herman et al. | 2023 | Quantum computing for finance | Nature Reviews Physics | Review | Graduate | No | 10.1038/s42254-023-00603-1 | - | - | - |
| herrero-2017-qrng | Herrero-Collantes and Garcia-Escartin | 2017 | Quantum random number generators | Reviews of Modern Physics | Review | Graduate | Yes | 10.1103/RevModPhys.89.015004 | arXiv:1604.03304 | - | - |
| heshami-2016-memories | Heshami et al. | 2016 | Quantum memories: emerging applications and recent advances | Journal of Modern Optics | Review | Graduate | Yes | 10.1080/09500340.2016.1148212 | arXiv:1511.04018 | - | - |
| hiai-1991-stein | Hiai and Petz | 1991 | The proper formula for relative entropy and its asymptotics in quantum probability | Communications in Mathematical Physics | Paper | Research | No | 10.1007/BF02100287 | - | - | - |
| higgott-2019-excited | Higgott, Wang and Brierley | 2019 | Variational Quantum Computation of Excited States | Quantum | Paper | Research | Yes | 10.22331/q-2019-07-01-156 | arXiv:1805.08138 | - | - |
| higgott-2022-pymatching | Higgott | 2022 | PyMatching: A Python Package for Decoding Quantum Codes with Minimum-Weight Perfect Matching | ACM Transactions on Quantum Computing | Paper | Research | Yes | 10.1145/3505637 | arXiv:2105.13082 | - | - |
| higgott-2023-blossom | Higgott and Gidney | 2023 | Sparse Blossom: correcting a million errors per core second with minimum-weight matching | arXiv | Paper | Research | Yes | - | arXiv:2303.15933 | - | - |
| higham-2008-functions | Higham | 2008 | Functions of Matrices | Society for Industrial and Applied Mathematics | Textbook | Graduate | No | 10.1137/1.9780898717778 | - | - | - |
| hillery-1999-sharing | Hillery, Bužek and Berthiaume | 1999 | Quantum secret sharing | Physical Review A | Paper | Research | Yes | 10.1103/PhysRevA.59.1829 | arXiv:quant-ph/9806063 | - | - |
| hirsch-2013-differential | Hirsch, Smale and Devaney | 2013 | Differential Equations, Dynamical Systems, and an Introduction to Chaos | Elsevier | Textbook | University | No | 10.1016/C2009-0-61160-0 | - | - | - |
| hoeffding-1963-inequalities | Hoeffding | 1963 | Probability Inequalities for Sums of Bounded Random Variables | Journal of the American Statistical Association | Paper | Research | No | 10.1080/01621459.1963.10500830 | - | - | - |
| hoefler-2023-disentangling | Hoefler, Häner and Troyer | 2023 | Disentangling Hype from Practicality: On Realistically Achieving Quantum Advantage | Communications of the ACM | Paper | University | Yes | 10.1145/3571725 | arXiv:2307.00523 | - | - |
| hoffstein-1998-ntru | Hoffstein, Pipher and Silverman | 1998 | NTRU: A ring-based public key cryptosystem | Lecture Notes in Computer Science | Paper | Research | No | 10.1007/BFb0054868 | - | - | - |
| holevo-1998-capacity | Holevo | 1998 | The capacity of the quantum channel with general signal states | IEEE Transactions on Information Theory | Paper | Research | Yes | 10.1109/18.651037 | arXiv:quant-ph/9611023 | - | - |
| hong-1987-hom | Hong, Ou and Mandel | 1987 | Measurement of subpicosecond time intervals between two photons by interference | Physical Review Letters | Paper | Research | No | 10.1103/PhysRevLett.59.2044 | - | - | - |
| horn-2012-matrix | Horn and Johnson | 2012 | Matrix Analysis | Cambridge University Press | Textbook | Graduate | No | 10.1017/CBO9781139020411 | - | - | - |
| horodecki-1996-separability | Horodecki, Horodecki and Horodecki | 1996 | Separability of mixed states: necessary and sufficient conditions | Physics Letters A | Paper | Research | Yes | 10.1016/S0375-9601(96)00706-2 | arXiv:quant-ph/9605038 | - | - |
| horodecki-1998-bound | Horodecki, Horodecki and Horodecki | 1998 | Mixed-State Entanglement and Distillation: Is there a “Bound” Entanglement in Nature? | Physical Review Letters | Paper | Research | Yes | 10.1103/PhysRevLett.80.5239 | arXiv:quant-ph/9801069 | - | - |
| horodecki-2005-partial | Horodecki, Oppenheim and Winter | 2005 | Partial quantum information | Nature | Paper | Research | Yes | 10.1038/nature03909 | arXiv:quant-ph/0505062 | - | arXiv title: "Quantum information can be negative" |
| horodecki-2009-entanglement | Horodecki et al. | 2009 | Quantum entanglement | Reviews of Modern Physics | Review | Graduate | Yes | 10.1103/RevModPhys.81.865 | arXiv:quant-ph/0702225 | - | - |
| horsman-2012-surgery | Horsman et al. | 2012 | Surface code quantum computing by lattice surgery | New Journal of Physics | Paper | Research | Yes | 10.1088/1367-2630/14/12/123011 | arXiv:1111.4022 | - | - |
| howard-2017-magic | Howard and Campbell | 2017 | Application of a Resource Theory for Magic States to Fault-Tolerant Quantum Computing | Physical Review Letters | Paper | Research | Yes | 10.1103/PhysRevLett.118.090501 | arXiv:1609.07488 | - | - |
| hoyer-2007-negative | Hoyer, Lee and Spalek | 2007 | Negative weights make adversaries stronger | Proceedings of the thirty-ninth annual ACM symposium on Theory of computing | Paper | Research | Yes | 10.1145/1250790.1250867 | arXiv:quant-ph/0611054 | - | - |
| huang-2019-assertions | Huang and Martonosi | 2019 | Statistical assertions for validating patterns and finding bugs in quantum programs | Proceedings of the 46th International Symposium on Computer Architecture | Paper | Research | Yes | 10.1145/3307650.3322213 | arXiv:1905.09721 | - | - |
| huang-2020-shadows | Huang, Kueng and Preskill | 2020 | Predicting many properties of a quantum system from very few measurements | Nature Physics | Paper | Research | Yes | 10.1038/s41567-020-0932-7 | arXiv:2002.08953 | - | - |
| huang-2021-bounds | Huang, Kueng and Preskill | 2021 | Information-Theoretic Bounds on Quantum Advantage in Machine Learning | Physical Review Letters | Paper | Research | Yes | 10.1103/PhysRevLett.126.190505 | arXiv:2101.02464 | - | - |
| huang-2022-experiments | Huang et al. | 2022 | Quantum advantage in learning from experiments | Science | Paper | Research | Yes | 10.1126/science.abn7293 | arXiv:2112.00778 | - | - |
| huang-2023-heisenberg | Huang et al. | 2023 | Learning Many-Body Hamiltonians with Heisenberg-Limited Scaling | Physical Review Letters | Paper | Research | Yes | 10.1103/PhysRevLett.130.200403 | arXiv:2210.03030 | - | - |
| huang-2026-vast | Huang et al. | 2026 | Vast World of Quantum Advantage | Physical Review X | Review | Graduate | Yes | 10.1103/tn89-g1xz | arXiv:2508.05720 | - | - |
| huggins-2021-virtual | Huggins et al. | 2021 | Virtual Distillation for Quantum Error Mitigation | Physical Review X | Paper | Research | Yes | 10.1103/PhysRevX.11.041036 | arXiv:2011.07064 | - | - |
| hwang-2003-decoy | Hwang | 2003 | Quantum Key Distribution with High Loss: Toward Global Secure Communication | Physical Review Letters | Paper | Research | Yes | 10.1103/PhysRevLett.91.057901 | arXiv:quant-ph/0211153 | - | - |
| ibm-roadmap | IBM | - | Quantum roadmap | Company page | Company claim | Intro | Yes | - | - | https://www.ibm.com/quantum/roadmap | URL not checked |
| iolius-2024-decoding | deMarti iOlius et al. | 2024 | Decoding algorithms for surface codes | Quantum | Review | Graduate | Yes | 10.22331/q-2024-10-10-1498 | arXiv:2307.14989 | - | - |
| isakov-2021-qsim | Isakov et al. | 2021 | Simulations of Quantum Circuits with Approximate Noise using qsim and Cirq | arXiv | Paper | Research | Yes | - | arXiv:2111.02396 | - | - |
| itano-1990-zeno | Itano et al. | 1990 | Quantum Zeno effect | Physical Review A | Paper | Research | No | 10.1103/PhysRevA.41.2295 | - | - | - |
| jaksch-2000-rydberg | Jaksch et al. | 2000 | Fast Quantum Gates for Neutral Atoms | Physical Review Letters | Paper | Research | Yes | 10.1103/PhysRevLett.85.2208 | arXiv:quant-ph/0004038 | - | - |
| james-2001-qubits | James et al. | 2001 | Measurement of qubits | Physical Review A | Paper | Research | Yes | 10.1103/PhysRevA.64.052312 | arXiv:quant-ph/0103121 | - | - |
| jaques-2020-grover | Jaques et al. | 2020 | Implementing Grover Oracles for Quantum Key Search on AES and LowMC | Lecture Notes in Computer Science | Paper | Research | Yes | 10.1007/978-3-030-45724-2_10 | arXiv:1910.01700 | - | - |
| jaques-2025-qram | Jaques and Rattew | 2025 | QRAM: A Survey and Critique | Quantum | Review | Graduate | Yes | 10.22331/q-2025-12-02-1922 | arXiv:2305.10310 | - | - |
| javadiabhari-2024-qiskit | Javadi-Abhari et al. | 2024 | Quantum computing with Qiskit | arXiv | Paper | University | Yes | - | arXiv:2405.08810 | - | - |
| johansson-2013-qutip | Johansson, Nation and Nori | 2013 | QuTiP 2: A Python framework for the dynamics of open quantum systems | Computer Physics Communications | Paper | Graduate | Yes | 10.1016/j.cpc.2012.11.019 | arXiv:1211.6518 | - | - |
| johnson-2011-annealing | Johnson et al. | 2011 | Quantum annealing with manufactured spins | Nature | Paper | Research | No | 10.1038/nature10012 | - | - | - |
| jordan-2005-gradient | Jordan | 2005 | Fast Quantum Algorithm for Numerical Gradient Estimation | Physical Review Letters | Paper | Research | Yes | 10.1103/PhysRevLett.95.050501 | arXiv:quant-ph/0405146 | - | - |
| jordan-2012-qft | Jordan, Lee and Preskill | 2012 | Quantum Algorithms for Quantum Field Theories | Science | Paper | Research | Yes | 10.1126/science.1217069 | arXiv:1111.3633 | - | - |
| jordan-2025-dqi | Jordan et al. | 2025 | Optimization by decoded quantum interferometry | Nature | Paper | Research | Yes | 10.1038/s41586-025-09527-5 | arXiv:2408.08292 | - | - |
| josephson-1962-tunnelling | Josephson | 1962 | Possible new effects in superconductive tunnelling | Physics Letters | Paper | Research | No | 10.1016/0031-9163(62)91369-0 | - | - | - |
| jozsa-2000-clock | Jozsa et al. | 2000 | Quantum Clock Synchronization Based on Shared Prior Entanglement | Physical Review Letters | Paper | Research | Yes | 10.1103/PhysRevLett.85.2010 | arXiv:quant-ph/0004105 | - | - |
| kadowaki-1998-annealing | Kadowaki and Nishimori | 1998 | Quantum annealing in the transverse Ising model | Physical Review E | Paper | Research | Yes | 10.1103/PhysRevE.58.5355 | arXiv:cond-mat/9804280 | - | - |
| kandala-2017-hardware | Kandala et al. | 2017 | Hardware-efficient variational quantum eigensolver for small molecules and quantum magnets | Nature | Paper | Research | Yes | 10.1038/nature23879 | arXiv:1704.05018 | - | - |
| kandala-2019-mitigation | Kandala et al. | 2019 | Error mitigation extends the computational reach of a noisy quantum processor | Nature | Paper | Research | Yes | 10.1038/s41586-019-1040-7 | arXiv:1805.04492 | - | arXiv title: "Extending the computational reach of a noisy superconducting quantum processor" |
| kaplan-2016-period | Kaplan et al. | 2016 | Breaking Symmetric Cryptosystems Using Quantum Period Finding | Lecture Notes in Computer Science | Paper | Research | Yes | 10.1007/978-3-662-53008-5_8 | arXiv:1602.05973 | - | - |
| kasevich-1991-interferometry | Kasevich and Chu | 1991 | Atomic interferometry using stimulated Raman transitions | Physical Review Letters | Paper | Research | No | 10.1103/PhysRevLett.67.181 | - | - | - |
| katabarwa-2024-early | Katabarwa et al. | 2024 | Early Fault-Tolerant Quantum Computing | PRX Quantum | Review | Graduate | Yes | 10.1103/PRXQuantum.5.020101 | arXiv:2311.14814 | - | - |
| katz-2020-crypto | Katz and Lindell | 2020 | Introduction to Modern Cryptography | Chapman and Hall/CRC | Textbook | University | No | 10.1201/9781351133036 | - | - | - |
| kavuri-2025-traceable | Kavuri et al. | 2025 | Traceable random numbers from a non-local quantum advantage | Nature | Paper | Research | No | 10.1038/s41586-025-09054-3 | - | - | - |
| kaye-laflamme-mosca | Kaye, Laflamme and Mosca | 2006 | An Introduction to Quantum Computing | Oxford University Press | Textbook | University | No | 10.1093/oso/9780198570004.001.0001 | - | - | - |
| kelly-2018-optimus | Kelly et al. | 2018 | Physical qubit calibration on a directed acyclic graph | arXiv | Paper | Research | Yes | - | arXiv:1803.03226 | - | - |
| kempe-2003-walks | Kempe | 2003 | Quantum random walks: An introductory overview | Contemporary Physics | Review | University | Yes | 10.1080/00107151031000110776 | arXiv:quant-ph/0303081 | - | - |
| kempe-2006-local | Kempe, Kitaev and Regev | 2006 | The Complexity of the Local Hamiltonian Problem | SIAM Journal on Computing | Paper | Research | Yes | 10.1137/S0097539704445226 | arXiv:quant-ph/0406180 | - | - |
| kent-2011-tagging | Kent, Munro and Spiller | 2011 | Quantum tagging: Authenticating location via quantum information and relativistic signaling constraints | Physical Review A | Paper | Research | Yes | 10.1103/PhysRevA.84.012326 | arXiv:1008.2147 | - | - |
| kerenidis-2016-recommendation | Kerenidis and Prakash | 2016 | Quantum Recommendation Systems | arXiv | Paper | Research | Yes | - | arXiv:1603.08675 | - | - |
| khabiboulline-2019-telescopes | Khabiboulline et al. | 2019 | Optical Interferometry with Quantum Networks | Physical Review Letters | Paper | Research | Yes | 10.1103/PhysRevLett.123.070504 | arXiv:1809.01659 | - | - |
| khaneja-2005-grape | Khaneja et al. | 2005 | Optimal control of coupled spin dynamics: design of NMR pulse sequences by gradient ascent algorithms | Journal of Magnetic Resonance | Paper | Research | No | 10.1016/j.jmr.2004.11.004 | - | - | - |
| kielpinski-2002-architecture | Kielpinski, Monroe and Wineland | 2002 | Architecture for a large-scale ion-trap quantum computer | Nature | Paper | Research | No | 10.1038/nature00784 | - | - | - |
| killoran-2019-strawberry | Killoran et al. | 2019 | Strawberry Fields: A Software Platform for Photonic Quantum Computing | Quantum | Paper | University | Yes | 10.22331/q-2019-03-11-129 | arXiv:1804.03159 | - | - |
| kim-2023-utility | Kim et al. | 2023 | Evidence for the utility of quantum computing before fault tolerance | Nature | Paper | Research | No | 10.1038/s41586-023-06096-3 | - | - | - |
| kimble-2008-internet | Kimble | 2008 | The quantum internet | Nature | Review | University | Yes | 10.1038/nature07127 | arXiv:0806.4195 | - | - |
| kimmel-2015-robust | Kimmel, Low and Yoder | 2015 | Robust calibration of a universal single-qubit gate set via robust phase estimation | Physical Review A | Paper | Research | Yes | 10.1103/PhysRevA.92.062315 | arXiv:1502.02677 | - | - |
| king-2025-beyond | King et al. | 2025 | Beyond-classical computation in quantum simulation | Science | Paper | Research | Yes | 10.1126/science.ado6285 | arXiv:2403.00910 | - | - |
| kitaev-1995-stabilizer | Kitaev | 1995 | Quantum measurements and the Abelian Stabilizer Problem | arXiv | Paper | Research | Yes | - | arXiv:quant-ph/9511026 | - | - |
| kitaev-1997-computations | Kitaev | 1997 | Quantum computations: algorithms and error correction | Russian Mathematical Surveys | Paper | Research | No | 10.1070/RM1997v052n06ABEH002155 | - | - | - |
| kitaev-2003-anyons | Kitaev | 2003 | Fault-tolerant quantum computation by anyons | Annals of Physics | Paper | Research | Yes | 10.1016/S0003-4916(02)00018-0 | arXiv:quant-ph/9707021 | - | - |
| kitagawa-1993-squeezed | Kitagawa and Ueda | 1993 | Squeezed spin states | Physical Review A | Paper | Research | No | 10.1103/PhysRevA.47.5138 | - | - | - |
| kivlichan-2020-trotter | Kivlichan et al. | 2020 | Improved Fault-Tolerant Quantum Simulation of Condensed-Phase Correlated Electrons via Trotterization | Quantum | Paper | Research | Yes | 10.22331/q-2020-07-16-296 | arXiv:1902.10673 | - | - |
| kjaergaard-2020-superconducting | Kjaergaard et al. | 2020 | Superconducting Qubits: Current State of Play | Annual Review of Condensed Matter Physics | Review | University | Yes | 10.1146/annurev-conmatphys-031119-050605 | arXiv:1905.13641 | - | - |
| kliesch-2021-certification | Kliesch and Roth | 2021 | Theory of Quantum System Certification | PRX Quantum | Review | Graduate | Yes | 10.1103/PRXQuantum.2.010201 | arXiv:2010.05925 | - | - |
| klitzing-1980-hall | Klitzing, Dorda and Pepper | 1980 | New Method for High-Accuracy Determination of the Fine-Structure Constant Based on Quantized Hall Resistance | Physical Review Letters | Paper | Research | No | 10.1103/PhysRevLett.45.494 | - | - | - |
| kliuchnikov-2013-approximation | Kliuchnikov, Maslov and Mosca | 2013 | Asymptotically Optimal Approximation of Single Qubit Unitaries by Clifford and T Circuits Using a Constant Number of Ancillary Qubits | Physical Review Letters | Paper | Research | Yes | 10.1103/PhysRevLett.110.190502 | arXiv:1212.0822 | - | - |
| knaut-2024-memory | Knaut et al. | 2024 | Entanglement of nanophotonic quantum memory nodes in a telecom network | Nature | Paper | Research | Yes | 10.1038/s41586-024-07252-z | arXiv:2310.01316 | - | - |
| knight-2019-uk | Knight and Walmsley | 2019 | UK national quantum technology programme | Quantum Science and Technology | Paper | Intro | No | 10.1088/2058-9565/ab4346 | - | - | - |
| knill-1997-theory | Knill and Laflamme | 1997 | Theory of quantum error-correcting codes | Physical Review A | Paper | Graduate | Yes | 10.1103/PhysRevA.55.900 | arXiv:quant-ph/9604034 | - | - |
| knill-1998-oneclean | Knill and Laflamme | 1998 | Power of One Bit of Quantum Information | Physical Review Letters | Paper | Research | Yes | 10.1103/PhysRevLett.81.5672 | arXiv:quant-ph/9802037 | - | - |
| knill-1998-resilient | Knill, Laflamme and Zurek | 1998 | Resilient Quantum Computation | Science | Paper | Research | No | 10.1126/science.279.5349.342 | - | - | - |
| knill-2001-linear | Knill, Laflamme and Milburn | 2001 | A scheme for efficient quantum computation with linear optics | Nature | Paper | Research | Yes | 10.1038/35051009 | arXiv:quant-ph/0006088 | - | arXiv title: "Efficient Linear Optics Quantum Computation" |
| knill-2008-rb | Knill et al. | 2008 | Randomized benchmarking of quantum gates | Physical Review A | Paper | Research | Yes | 10.1103/PhysRevA.77.012307 | arXiv:0707.0963 | - | - |
| koch-2007-transmon | Koch et al. | 2007 | Charge-insensitive qubit design derived from the Cooper pair box | Physical Review A | Paper | Graduate | Yes | 10.1103/PhysRevA.76.042319 | arXiv:cond-mat/0703002 | - | - |
| koch-2022-control | Koch et al. | 2022 | Quantum optimal control in quantum technologies. Strategic report on current status, visions and goals for research in Europe | EPJ Quantum Technology | Review | Graduate | Yes | 10.1140/epjqt/s40507-022-00138-x | arXiv:2205.12110 | - | - |
| kochen-1967-hidden | Kochen and Specker | 1967 | The Problem of Hidden Variables in Quantum Mechanics | Indiana University Mathematics Journal | Paper | Research | No | 10.1512/iumj.1968.17.17004 | - | - | - |
| kok-2007-loqc | Kok et al. | 2007 | Linear optical quantum computing with photonic qubits | Reviews of Modern Physics | Review | Graduate | Yes | 10.1103/RevModPhys.79.135 | arXiv:quant-ph/0512071 | - | arXiv title: "Review article: Linear optical quantum computing" |
| komar-2014-clocks | Kómár et al. | 2014 | A quantum network of clocks | Nature Physics | Paper | Research | Yes | 10.1038/nphys3000 | arXiv:1310.6045 | - | - |
| konig-2009-operational | Konig, Renner and Schaffner | 2009 | The Operational Meaning of Min- and Max-Entropy | IEEE Transactions on Information Theory | Paper | Research | Yes | 10.1109/TIT.2009.2025545 | arXiv:0807.1338 | - | - |
| kop-2023-responsible | Kop et al. | 2023 | Towards responsible quantum technology, safeguarding, engaging and advancing Quantum R&D | arXiv | Paper | University | Yes | - | arXiv:2303.16671 | - | - |
| kozlowski-2023-rfc9340 | Kozlowski et al. | 2023 | Architectural Principles for a Quantum Internet | RFC Editor | Standard | University | Yes | 10.17487/RFC9340 | - | - | - |
| krantz-2019-guide | Krantz et al. | 2019 | A quantum engineer's guide to superconducting qubits | Applied Physics Reviews | Review | Graduate | Yes | 10.1063/1.5089550 | arXiv:1904.06560 | - | - |
| kraus-2001-optimal | Kraus and Cirac | 2001 | Optimal creation of entanglement using a two-qubit gate | Physical Review A | Paper | Research | Yes | 10.1103/PhysRevA.63.062309 | arXiv:quant-ph/0011050 | - | - |
| krinner-2019-cryogenic | Krinner et al. | 2019 | Engineering cryogenic setups for 100-qubit scale superconducting circuit systems | EPJ Quantum Technology | Paper | University | Yes | 10.1140/epjqt/s40507-019-0072-0 | arXiv:1806.07862 | - | - |
| ksv-cqc | Kitaev, Shen and Vyalyi | 2002 | Classical and Quantum Computation | Graduate Studies in Mathematics | Textbook | Graduate | No | 10.1090/gsm/047 | - | - | - |
| kubica-2023-erasure | Kubica et al. | 2023 | Erasure Qubits: Overcoming the T1 Limit in Superconducting Circuits | Physical Review X | Paper | Research | Yes | 10.1103/PhysRevX.13.041022 | arXiv:2208.05461 | - | - |
| kumar-1990-conversion | Kumar | 1990 | Quantum frequency conversion | Optics Letters | Paper | Research | No | 10.1364/OL.15.001476 | - | - | - |
| kuperberg-2005-dihedral | Kuperberg | 2005 | A Subexponential-Time Quantum Algorithm for the Dihedral Hidden Subgroup Problem | SIAM Journal on Computing | Paper | Research | Yes | 10.1137/S0097539703436345 | arXiv:quant-ph/0302112 | - | - |
| kuwakado-2010-feistel | Kuwakado and Morii | 2010 | Quantum distinguisher between the 3-round Feistel cipher and the random permutation | 2010 IEEE International Symposium on Information Theory | Paper | Research | No | 10.1109/ISIT.2010.5513654 | - | - | - |
| kwiat-1995-interaction | Kwiat et al. | 1995 | Interaction-Free Measurement | Physical Review Letters | Paper | Research | No | 10.1103/PhysRevLett.74.4763 | - | - | - |
| kwiatkowski-2026-rfc10024 | Kwiatkowski et al. | 2026 | Post-Quantum Traditional (PQ/T) Hybrid Key Agreement Mechanisms for TLS 1.3 | RFC Editor | Standard | Graduate | Yes | 10.17487/RFC10024 | - | - | - |
| lacroix-2025-color | Lacroix et al. | 2025 | Scaling and logic in the colour code on a superconducting quantum processor | Nature | Paper | Research | Yes | 10.1038/s41586-025-09061-4 | arXiv:2412.14256 | - | - |
| laflamme-1996-perfect | Laflamme et al. | 1996 | Perfect Quantum Error Correcting Code | Physical Review Letters | Paper | Graduate | Yes | 10.1103/PhysRevLett.77.198 | arXiv:quant-ph/9602019 | - | - |
| landauer-1961-irreversibility | Landauer | 1961 | Irreversibility and Heat Generation in the Computing Process | IBM Journal of Research and Development | Paper | Research | No | 10.1147/rd.53.0183 | - | - | - |
| langer-2009-standardization | Länger and Lenhart | 2009 | Standardization of quantum key distribution and the ETSI standardization initiative ISG-QKD | New Journal of Physics | Paper | University | Yes | 10.1088/1367-2630/11/5/055051 | - | - | - |
| larocca-2025-barren | Larocca et al. | 2025 | Barren plateaus in variational quantum computing | Nature Reviews Physics | Review | Graduate | Yes | 10.1038/s42254-025-00813-9 | arXiv:2405.00781 | - | - |
| larose-2019-platforms | LaRose | 2019 | Overview and Comparison of Gate Level Quantum Software Platforms | Quantum | Review | University | Yes | 10.22331/q-2019-03-25-130 | arXiv:1807.02500 | - | - |
| larose-2022-mitiq | LaRose et al. | 2022 | Mitiq: A software package for error mitigation on noisy quantum computers | Quantum | Paper | Graduate | Yes | 10.22331/q-2022-08-11-774 | arXiv:2009.04417 | - | - |
| larose-2024-history | LaRose | 2024 | A brief history of quantum vs classical computational advantage | arXiv | Review | University | Yes | - | arXiv:2412.14703 | - | - |
| lauk-2020-transduction | Lauk et al. | 2020 | Perspectives on quantum transduction | Quantum Science and Technology | Review | Graduate | Yes | 10.1088/2058-9565/ab788a | arXiv:1910.04821 | - | - |
| lee-2021-thc | Lee et al. | 2021 | Even More Efficient Quantum Computations of Chemistry Through Tensor Hypercontraction | PRX Quantum | Paper | Research | Yes | 10.1103/PRXQuantum.2.030305 | arXiv:2011.03494 | - | - |
| lee-2023-evidence | Lee et al. | 2023 | Evaluating the evidence for exponential quantum advantage in ground-state quantum chemistry | Nature Communications | Paper | Research | Yes | 10.1038/s41467-023-37587-6 | arXiv:2208.02199 | - | arXiv title: "Is there evidence for exponential quantum advantage in quantum chemistry?" |
| legall-2014-triangle | Gall | 2014 | Improved Quantum Algorithm for Triangle Finding via Combinatorial Arguments | 2014 IEEE 55th Annual Symposium on Foundations of Computer Science | Paper | Research | Yes | 10.1109/FOCS.2014.31 | arXiv:1407.0085 | - | - |
| lehman-2015-mcs | Lehman, Leighton and Meyer | 2015 | Mathematics for Computer Science | MIT OpenCourseWare 6.042J | Textbook | University | Yes | - | - | https://ocw.mit.edu/courses/6-042j-mathematics-for-computer-science-spring-2015/ | URL opened 2026-11-23 |
| lemos-2014-undetected | Lemos et al. | 2014 | Quantum imaging with undetected photons | Nature | Paper | Research | Yes | 10.1038/nature13586 | arXiv:1401.4318 | - | - |
| li-2017-variational | Li and Benjamin | 2017 | Efficient Variational Quantum Simulator Incorporating Active Error Minimization | Physical Review X | Paper | Research | Yes | 10.1103/PhysRevX.7.021050 | arXiv:1611.09301 | - | - |
| li-2019-sabre | Li, Ding and Xie | 2019 | Tackling the Qubit Mapping Problem for NISQ-Era Quantum Devices | Proceedings of the Twenty-Fourth International Conference on Architectural Support for Programming Languages and Operating Systems | Paper | Research | Yes | 10.1145/3297858.3304023 | arXiv:1809.02573 | - | - |
| liao-2018-intercontinental | Liao et al. | 2018 | Satellite-Relayed Intercontinental Quantum Network | Physical Review Letters | Paper | Research | Yes | 10.1103/PhysRevLett.120.030501 | arXiv:1801.04418 | - | - |
| lidar-brun-qec | Lidar and Brun | 2013 | Quantum Error Correction | Cambridge University Press | Textbook | Graduate | No | 10.1017/CBO9781139034807 | - | - | - |
| lieb-1973-ssa | Lieb and Ruskai | 1973 | Proof of the strong subadditivity of quantum-mechanical entropy | Journal of Mathematical Physics | Paper | Research | No | 10.1063/1.1666274 | - | - | - |
| lin-2020-groundstate | Lin and Tong | 2020 | Near-optimal ground state preparation | Quantum | Paper | Research | Yes | 10.22331/q-2020-12-14-372 | arXiv:2002.12508 | - | - |
| lin-2022-heisenberg | Lin and Tong | 2022 | Heisenberg-Limited Ground-State Energy Estimation for Early Fault-Tolerant Quantum Computers | PRX Quantum | Paper | Research | Yes | 10.1103/PRXQuantum.3.010318 | arXiv:2102.11340 | - | - |
| lin-2022-notes | Lin | 2022 | Lecture Notes on Quantum Algorithms for Scientific Computation | arXiv | Lecture notes | Graduate | Yes | - | arXiv:2201.08309 | - | - |
| lindblad-1975-cp | Lindblad | 1975 | Completely positive maps and entropy inequalities | Communications in Mathematical Physics | Paper | Research | No | 10.1007/BF01609396 | - | - | - |
| lindblad-1976-generators | Lindblad | 1976 | On the generators of quantum dynamical semigroups | Communications in Mathematical Physics | Paper | Research | No | 10.1007/BF01608499 | - | - | - |
| linke-2017-architectures | Linke et al. | 2017 | Experimental comparison of two quantum computing architectures | Proceedings of the National Academy of Sciences | Paper | University | Yes | 10.1073/pnas.1618020114 | arXiv:1702.01852 | - | - |
| litinski-2019-game | Litinski | 2019 | A Game of Surface Codes: Large-Scale Quantum Computing with Lattice Surgery | Quantum | Paper | Graduate | Yes | 10.22331/q-2019-03-05-128 | arXiv:1808.02892 | - | - |
| litinski-2019-magic | Litinski | 2019 | Magic State Distillation: Not as Costly as You Think | Quantum | Paper | Research | Yes | 10.22331/q-2019-12-02-205 | arXiv:1905.06903 | - | - |
| liu-2021-nonlinear | Liu et al. | 2021 | Efficient quantum algorithm for dissipative nonlinear differential equations | Proceedings of the National Academy of Sciences | Paper | Research | Yes | 10.1073/pnas.2026805118 | arXiv:2011.03185 | - | - |
| liu-2021-rigorous | Liu, Arunachalam and Temme | 2021 | A rigorous and robust quantum speed-up in supervised machine learning | Nature Physics | Paper | Research | Yes | 10.1038/s41567-021-01287-z | arXiv:2010.02174 | - | - |
| liu-2023-twinfield | Liu et al. | 2023 | Experimental Twin-Field Quantum Key Distribution over 1000 km Fiber Distance | Physical Review Letters | Paper | Research | Yes | 10.1103/PhysRevLett.130.210801 | arXiv:2303.15795 | - | - |
| liu-2025-certified | Liu et al. | 2025 | Certified randomness using a trapped-ion quantum processor | Nature | Paper | Research | Yes | 10.1038/s41586-025-08737-1 | arXiv:2503.20498 | - | - |
| lloyd-1996-simulators | Lloyd | 1996 | Universal Quantum Simulators | Science | Paper | Research | No | 10.1126/science.273.5278.1073 | - | - | - |
| lloyd-1997-capacity | Lloyd | 1997 | Capacity of the noisy quantum channel | Physical Review A | Paper | Research | Yes | 10.1103/PhysRevA.55.1613 | arXiv:quant-ph/9604015 | - | - |
| lloyd-1999-cv | Lloyd and Braunstein | 1999 | Quantum Computation over Continuous Variables | Physical Review Letters | Paper | Research | Yes | 10.1103/PhysRevLett.82.1784 | arXiv:quant-ph/9810082 | - | - |
| lloyd-2008-illumination | Lloyd | 2008 | Enhanced Sensitivity of Photodetection via Quantum Illumination | Science | Paper | Research | Yes | 10.1126/science.1160627 | arXiv:0803.2022 | - | - |
| lloyd-2014-qpca | Lloyd, Mohseni and Rebentrost | 2014 | Quantum principal component analysis | Nature Physics | Paper | Research | Yes | 10.1038/nphys3029 | arXiv:1307.0401 | - | - |
| lloyd-2016-topological | Lloyd, Garnerone and Zanardi | 2016 | Quantum algorithms for topological and geometric analysis of data | Nature Communications | Paper | Research | Yes | 10.1038/ncomms10138 | arXiv:1408.3106 | - | - |
| lloyd-2018-qgan | Lloyd and Weedbrook | 2018 | Quantum Generative Adversarial Learning | Physical Review Letters | Paper | Research | Yes | 10.1103/PhysRevLett.121.040502 | arXiv:1804.09139 | - | - |
| lo-1997-commitment | Lo and Chau | 1997 | Is Quantum Bit Commitment Really Possible? | Physical Review Letters | Paper | Research | Yes | 10.1103/PhysRevLett.78.3410 | arXiv:quant-ph/9603004 | - | - |
| lo-1997-insecurity | Lo | 1997 | Insecurity of quantum secure computations | Physical Review A | Paper | Research | Yes | 10.1103/PhysRevA.56.1154 | arXiv:quant-ph/9611031 | - | - |
| lo-2000-rsp | Lo | 2000 | Classical-communication cost in distributed quantum-information processing: A generalization of quantum-communication complexity | Physical Review A | Paper | Research | Yes | 10.1103/PhysRevA.62.012313 | arXiv:quant-ph/9912009 | - | - |
| lo-2005-decoy | Lo, Ma and Chen | 2005 | Decoy State Quantum Key Distribution | Physical Review Letters | Paper | Research | Yes | 10.1103/PhysRevLett.94.230504 | arXiv:quant-ph/0411004 | - | - |
| lo-2012-mdi | Lo, Curty and Qi | 2012 | Measurement-Device-Independent Quantum Key Distribution | Physical Review Letters | Paper | Research | Yes | 10.1103/PhysRevLett.108.130503 | arXiv:1109.1473 | - | - |
| loss-1998-dots | Loss and DiVincenzo | 1998 | Quantum computation with quantum dots | Physical Review A | Paper | Research | Yes | 10.1103/PhysRevA.57.120 | arXiv:cond-mat/9701055 | - | - |
| low-2017-qsp | Low and Chuang | 2017 | Optimal Hamiltonian Simulation by Quantum Signal Processing | Physical Review Letters | Paper | Research | Yes | 10.1103/PhysRevLett.118.010501 | arXiv:1606.02685 | - | - |
| low-2019-qubitization | Low and Chuang | 2019 | Hamiltonian Simulation by Qubitization | Quantum | Paper | Research | Yes | 10.22331/q-2019-07-12-163 | arXiv:1610.06546 | - | - |
| lu-2022-micius | Lu et al. | 2022 | Micius quantum experiments in space | Reviews of Modern Physics | Review | Graduate | Yes | 10.1103/RevModPhys.94.035001 | arXiv:2208.10236 | - | - |
| lubinski-2023-benchmarks | Lubinski et al. | 2023 | Application-Oriented Performance Benchmarks for Quantum Computing | IEEE Transactions on Quantum Engineering | Paper | Research | Yes | 10.1109/TQE.2023.3253761 | arXiv:2110.03137 | - | - |
| lucamarini-2018-twinfield | Lucamarini et al. | 2018 | Overcoming the rate–distance limit of quantum key distribution without quantum repeaters | Nature | Paper | Research | Yes | 10.1038/s41586-018-0066-6 | arXiv:1811.06826 | - | - |
| lucas-2014-ising | Lucas | 2014 | Ising formulations of many NP problems | Frontiers in Physics | Paper | Graduate | Yes | 10.3389/fphy.2014.00005 | arXiv:1302.5843 | - | - |
| ludlow-2015-clocks | Ludlow et al. | 2015 | Optical atomic clocks | Reviews of Modern Physics | Review | Graduate | Yes | 10.1103/RevModPhys.87.637 | arXiv:1407.3493 | - | - |
| lutkenhaus-1999-bell | Lütkenhaus, Calsamiglia and Suominen | 1999 | Bell measurements for teleportation | Physical Review A | Paper | Research | Yes | 10.1103/PhysRevA.59.3295 | arXiv:quant-ph/9809063 | - | - |
| lvovsky-2009-memory | Lvovsky, Sanders and Tittel | 2009 | Optical quantum memory | Nature Photonics | Review | Graduate | Yes | 10.1038/nphoton.2009.231 | arXiv:1002.4659 | - | - |
| lydersen-2010-hacking | Lydersen et al. | 2010 | Hacking commercial quantum cryptography systems by tailored bright illumination | Nature Photonics | Paper | Research | Yes | 10.1038/nphoton.2010.214 | arXiv:1008.4593 | - | - |
| ma-2016-qrng | Ma et al. | 2016 | Quantum random number generation | npj Quantum Information | Review | University | Yes | 10.1038/npjqi.2016.21 | arXiv:1510.08957 | - | - |
| maassen-1988-uncertainty | Maassen and Uffink | 1988 | Generalized entropic uncertainty relations | Physical Review Letters | Paper | Research | No | 10.1103/PhysRevLett.60.1103 | - | - | - |
| mackay-2003-itila | MacKay | 2003 | Information Theory, Inference, and Learning Algorithms | Cambridge University Press, free PDF from the author | Textbook | University | Yes | - | - | http://www.inference.org.uk/mackay/itila/ | URL not checked |
| madsen-2022-borealis | Madsen et al. | 2022 | Quantum computational advantage with a programmable photonic processor | Nature | Paper | Research | Yes | 10.1038/s41586-022-04725-x | - | - | - |
| magesan-2011-rb | Magesan, Gambetta and Emerson | 2011 | Scalable and Robust Randomized Benchmarking of Quantum Processes | Physical Review Letters | Paper | Research | Yes | 10.1103/PhysRevLett.106.180504 | arXiv:1009.3639 | - | - |
| magniez-2007-triangle | Magniez, Santha and Szegedy | 2007 | Quantum Algorithms for the Triangle Problem | SIAM Journal on Computing | Paper | Research | Yes | 10.1137/050643684 | arXiv:quant-ph/0310134 | - | - |
| magniez-2011-search | Magniez et al. | 2011 | Search via Quantum Walk | SIAM Journal on Computing | Paper | Research | Yes | 10.1137/090745854 | arXiv:quant-ph/0608026 | - | - |
| mahadev-2018-verification | Mahadev | 2018 | Classical Verification of Quantum Computations | 2018 IEEE 59th Annual Symposium on Foundations of Computer Science (FOCS) | Paper | Research | Yes | 10.1109/FOCS.2018.00033 | arXiv:1804.01082 | - | - |
| main-2025-distributed | Main et al. | 2025 | Distributed quantum computing across an optical network link | Nature | Paper | Research | Yes | 10.1038/s41586-024-08404-x | arXiv:2407.00835 | - | - |
| manetsch-2024-tweezer | Manetsch et al. | 2024 | A tweezer array with 6100 highly coherent atomic qubits | arXiv | Paper | Research | Yes | - | arXiv:2403.12021 | - | - |
| manucharyan-2009-fluxonium | Manucharyan et al. | 2009 | Fluxonium: Single Cooper-Pair Circuit Free of Charge Offsets | Science | Paper | Research | Yes | 10.1126/science.1175552 | arXiv:0906.0831 | - | - |
| markov-2008-tensor | Markov and Shi | 2008 | Simulating Quantum Computation by Contracting Tensor Networks | SIAM Journal on Computing | Paper | Research | Yes | 10.1137/050644756 | arXiv:quant-ph/0511069 | - | - |
| martinez-2016-gauge | Martinez et al. | 2016 | Real-time dynamics of lattice gauge theories with a few-qubit quantum computer | Nature | Paper | Research | Yes | 10.1038/nature18318 | arXiv:1605.04570 | - | - |
| martinis-1985-quantization | Martinis, Devoret and Clarke | 1985 | Energy-Level Quantization in the Zero-Voltage State of a Current-Biased Josephson Junction | Physical Review Letters | Paper | Research | No | 10.1103/PhysRevLett.55.1543 | - | - | - |
| martyn-2021-grand | Martyn et al. | 2021 | Grand Unification of Quantum Algorithms | PRX Quantum | Review | Graduate | Yes | 10.1103/PRXQuantum.2.040203 | arXiv:2105.02859 | - | - |
| maslov-2016-toffoli | Maslov | 2016 | Advantages of using relative-phase Toffoli gates with an application to multiple control Toffoli optimization | Physical Review A | Paper | Research | Yes | 10.1103/PhysRevA.93.022311 | arXiv:1508.03273 | - | - |
| massimo-2025-rfc9881 | Massimo et al. | 2025 | Internet X.509 Public Key Infrastructure -- Algorithm Identifiers for the Module-Lattice-Based Digital Signature Algorithm (ML-DSA) | RFC Editor | Standard | Graduate | Yes | 10.17487/RFC9881 | - | - | - |
| mattle-1996-dense | Mattle et al. | 1996 | Dense Coding in Experimental Quantum Communication | Physical Review Letters | Paper | Research | No | 10.1103/PhysRevLett.76.4656 | - | - | - |
| maudlin-1995-measurement | Maudlin | 1995 | Three measurement problems | Topoi | Paper | University | No | 10.1007/BF00763473 | - | - | - |
| mayers-1997-commitment | Mayers | 1997 | Unconditionally Secure Quantum Bit Commitment is Impossible | Physical Review Letters | Paper | Research | Yes | 10.1103/PhysRevLett.78.3414 | arXiv:quant-ph/9605044 | - | - |
| mayers-2003-selftesting | Mayers and Yao | 2003 | Self testing quantum apparatus | arXiv | Paper | Research | Yes | - | arXiv:quant-ph/0307205 | - | - |
| mcardle-2019-imaginary | McArdle et al. | 2019 | Variational ansatz-based quantum simulation of imaginary time evolution | npj Quantum Information | Paper | Research | Yes | 10.1038/s41534-019-0187-2 | arXiv:1804.03023 | - | - |
| mcardle-2020-chemistry | McArdle et al. | 2020 | Quantum computational chemistry | Reviews of Modern Physics | Review | Graduate | Yes | 10.1103/RevModPhys.92.015003 | arXiv:1808.10402 | - | - |
| mccaskey-2021-mlir | McCaskey and Nguyen | 2021 | A MLIR Dialect for Quantum Assembly Languages | arXiv | Paper | Research | Yes | - | arXiv:2101.11365 | - | - |
| mcclean-2016-theory | McClean et al. | 2016 | The theory of variational hybrid quantum-classical algorithms | New Journal of Physics | Paper | Research | Yes | 10.1088/1367-2630/18/2/023023 | arXiv:1509.04279 | - | - |
| mcclean-2017-hierarchy | McClean et al. | 2017 | Hybrid quantum-classical hierarchy for mitigation of decoherence and determination of excited states | Physical Review A | Paper | Research | Yes | 10.1103/PhysRevA.95.042308 | arXiv:1603.05681 | - | - |
| mcclean-2018-barren | McClean et al. | 2018 | Barren plateaus in quantum neural network training landscapes | Nature Communications | Paper | Research | Yes | 10.1038/s41467-018-07090-4 | arXiv:1803.11173 | - | - |
| mceliece-1978-code | McEliece | 1978 | A Public-Key Cryptosystem Based On Algebraic Coding Theory | JPL DSN Progress Report 42-44 | Paper | Research | Yes | - | - | https://ipnpr.jpl.nasa.gov/progress_report2/42-44/44N.PDF | URL not checked |
| mcewen-2021-cosmic | McEwen et al. | 2021 | Resolving catastrophic error bursts from cosmic rays in large arrays of superconducting qubits | Nature Physics | Paper | Research | Yes | 10.1038/s41567-021-01432-8 | arXiv:2104.05219 | - | - |
| mckay-2023-layer | McKay et al. | 2023 | Benchmarking Quantum Processor Performance at Scale | arXiv | Paper | Research | Yes | - | arXiv:2311.05933 | - | - |
| mehic-2020-qkd | Mehic et al. | 2020 | Quantum Key Distribution | ACM Computing Surveys | Review | Graduate | No | 10.1145/3402192 | - | - | - |
| mermin-1981-mysteries | Mermin | 1981 | Bringing home the atomic world: Quantum mysteries for anybody | American Journal of Physics | Paper | University | No | 10.1119/1.12594 | - | - | - |
| mermin-1993-hidden | Mermin | 1993 | Hidden variables and the two theorems of John Bell | Reviews of Modern Physics | Review | Graduate | Yes | 10.1103/RevModPhys.65.803 | arXiv:1802.10119 | - | - |
| mermin-2002-cbits | Mermin | 2002 | From Cbits to Qbits: Teaching computer scientists quantum mechanics | American Journal of Physics | Paper | Intro | Yes | 10.1119/1.1522741 | arXiv:quant-ph/0207118 | - | - |
| mermin-qcs | Mermin | 2007 | Quantum Computer Science | Cambridge University Press | Textbook | Intro | No | 10.1017/CBO9780511813870 | - | - | - |
| mi-2021-scrambling | Mi et al. | 2021 | Information scrambling in quantum circuits | Science | Paper | Research | Yes | 10.1126/science.abg5029 | arXiv:2101.08870 | - | arXiv title: "Information Scrambling in Computationally Complex Quantum Circuits" |
| miao-2023-leakage | Miao et al. | 2023 | Overcoming leakage in quantum error correction | Nature Physics | Paper | Research | Yes | 10.1038/s41567-023-02226-w | arXiv:2211.04728 | - | - |
| microsoft-2025-parity | Microsoft Azure Quantum et al. | 2025 | Interferometric single-shot parity measurement in InAs–Al hybrid devices | Nature | Paper | Research | Yes | 10.1038/s41586-024-08445-2 | arXiv:2401.09549 | - | - |
| mirrahimi-2014-cat | Mirrahimi et al. | 2014 | Dynamically protected cat-qubits: a new paradigm for universal quantum computation | New Journal of Physics | Paper | Research | Yes | 10.1088/1367-2630/16/4/045014 | arXiv:1312.2017 | - | - |
| misra-1977-zeno | Misra and Sudarshan | 1977 | The Zeno’s paradox in quantum theory | Journal of Mathematical Physics | Paper | Research | No | 10.1063/1.523304 | - | - | - |
| mitarai-2018-learning | Mitarai et al. | 2018 | Quantum circuit learning | Physical Review A | Paper | Research | Yes | 10.1103/PhysRevA.98.032309 | arXiv:1803.00745 | - | - |
| mitarai-2021-cutting | Mitarai and Fujii | 2021 | Constructing a virtual two-qubit gate by sampling single-qubit operations | New Journal of Physics | Paper | Research | Yes | 10.1088/1367-2630/abd7bc | arXiv:1909.07534 | - | - |
| modi-2012-discord | Modi et al. | 2012 | The classical-quantum boundary for correlations: Discord and related measures | Reviews of Modern Physics | Review | Graduate | Yes | 10.1103/RevModPhys.84.1655 | arXiv:1112.6238 | - | - |
| moehring-2007-entanglement | Moehring et al. | 2007 | Entanglement of single-atom quantum bits at a distance | Nature | Paper | Research | No | 10.1038/nature06118 | - | - | - |
| monroe-2014-modular | Monroe et al. | 2014 | Large-scale modular quantum-computer architecture with atomic memory and photonic interconnects | Physical Review A | Paper | Research | Yes | 10.1103/PhysRevA.89.022317 | arXiv:1208.0391 | - | - |
| montanaro-2015-montecarlo | Montanaro | 2015 | Quantum speedup of Monte Carlo methods | Proceedings of the Royal Society A: Mathematical, Physical and Engineering Sciences | Paper | Research | Yes | 10.1098/rspa.2015.0301 | arXiv:1504.06987 | - | - |
| montanaro-2016-overview | Montanaro | 2016 | Quantum algorithms: an overview | npj Quantum Information | Review | University | Yes | 10.1038/npjqi.2015.23 | arXiv:1511.04206 | - | - |
| montanaro-2018-backtracking | Montanaro | 2018 | Quantum walk speedup of backtracking algorithms | Theory of Computing | Paper | Research | Yes | 10.4086/toc.2018.v014a015 | arXiv:1509.02374 | - | - |
| montanaro-2020-branchbound | Montanaro | 2020 | Quantum speedup of branch-and-bound algorithms | Physical Review Research | Paper | Research | Yes | 10.1103/PhysRevResearch.2.013056 | arXiv:1906.10375 | - | - |
| moody-2026-ir8547 | Regenscheid | 2026 | Transition to Post-Quantum Cryptography Standards | National Institute of Standards and Technology | Standard | University | Yes | 10.6028/NIST.IR.8547 | - | - | - |
| moore-2008-symmetric | Moore, Russell and Schulman | 2008 | The Symmetric Group Defies Strong Fourier Sampling | SIAM Journal on Computing | Paper | Research | Yes | 10.1137/050644896 | arXiv:quant-ph/0501056 | - | - |
| moreau-2019-imaging | Moreau et al. | 2019 | Imaging with quantum states of light | Nature Reviews Physics | Review | University | No | 10.1038/s42254-019-0056-0 | - | - | - |
| morimae-2014-dqc1 | Morimae, Fujii and Fitzsimons | 2014 | Hardness of Classically Simulating the One-Clean-Qubit Model | Physical Review Letters | Paper | Research | Yes | 10.1103/PhysRevLett.112.130502 | arXiv:1312.2496 | - | - |
| morvan-2024-rcs | Morvan et al. | 2024 | Phase transitions in random circuit sampling | Nature | Paper | Research | Yes | 10.1038/s41586-024-07998-6 | arXiv:2304.11119 | - | - |
| mosca-2018-ready | Mosca | 2018 | Cybersecurity in an Era with Quantum Computers: Will We Be Ready? | IEEE Security & Privacy | Paper | Intro | No | 10.1109/MSP.2018.3761723 | - | - | - |
| motta-2019-qite | Motta et al. | 2019 | Determining eigenstates and thermal states on a quantum computer using quantum imaginary time evolution | Nature Physics | Paper | Research | Yes | 10.1038/s41567-019-0704-4 | arXiv:1901.07653 | - | - |
| motta-2024-subspace | Motta et al. | 2024 | Subspace methods for electronic structure simulations on quantum computers | Electronic Structure | Review | Graduate | Yes | 10.1088/2516-1075/ad3592 | arXiv:2312.00178 | - | - |
| mottonen-2005-transformation | Mottonen et al. | 2005 | Transformation of quantum states using uniformly controlled rotations | Quantum Information and Computation | Paper | Research | Yes | 10.26421/QIC5.6-5 | arXiv:quant-ph/0407010 | - | - |
| motzoi-2009-drag | Motzoi et al. | 2009 | Simple Pulses for Elimination of Leakage in Weakly Nonlinear Qubits | Physical Review Letters | Paper | Research | Yes | 10.1103/PhysRevLett.103.110501 | arXiv:0901.0534 | - | - |
| muller-2019-tls | Müller, Cole and Lisenfeld | 2019 | Towards understanding two-level-systems in amorphous solids: insights from quantum circuits | Reports on Progress in Physics | Review | Graduate | Yes | 10.1088/1361-6633/ab3a7e | arXiv:1705.01108 | - | - |
| murta-2020-conference | Murta et al. | 2020 | Quantum Conference Key Agreement: A Review | Advanced Quantum Technologies | Review | Graduate | Yes | 10.1002/qute.202000025 | arXiv:2003.10186 | - | - |
| nadlinger-2022-diqkd | Nadlinger et al. | 2022 | Experimental quantum key distribution certified by Bell's theorem | Nature | Paper | Research | Yes | 10.1038/s41586-022-04941-5 | arXiv:2109.14600 | - | - |
| nakanishi-2019-ssvqe | Nakanishi, Mitarai and Fujii | 2019 | Subspace-search variational quantum eigensolver for excited states | Physical Review Research | Paper | Research | Yes | 10.1103/PhysRevResearch.1.033062 | arXiv:1810.09434 | - | - |
| nam-2018-optimization | Nam et al. | 2018 | Automated optimization of large quantum circuits with continuous parameters | npj Quantum Information | Paper | Research | Yes | 10.1038/s41534-018-0072-4 | arXiv:1710.07345 | - | - |
| nation-2021-readout | Nation et al. | 2021 | Scalable Mitigation of Measurement Errors on Quantum Computers | PRX Quantum | Paper | Research | Yes | 10.1103/PRXQuantum.2.040326 | arXiv:2108.12518 | - | - |
| nayak-1999-rac | Nayak | None | Optimal lower bounds for quantum automata and random access codes | 40th Annual Symposium on Foundations of Computer Science (Cat. No.99CB37039) | Paper | Research | Yes | 10.1109/SFFCS.1999.814608 | arXiv:quant-ph/9904093 | - | - |
| nayak-2008-anyons | Nayak et al. | 2008 | Non-Abelian anyons and topological quantum computation | Reviews of Modern Physics | Review | Graduate | Yes | 10.1103/RevModPhys.80.1083 | arXiv:0707.1889 | - | - |
| needham-1997-visual | Needham | 1997 | Visual Complex Analysis | Oxford University PressOxford | Textbook | University | No | 10.1093/oso/9780198534471.001.0001 | - | - | - |
| nielsen-1999-transformations | Nielsen | 1999 | Conditions for a Class of Entanglement Transformations | Physical Review Letters | Paper | Research | Yes | 10.1103/PhysRevLett.83.436 | arXiv:quant-ph/9811053 | - | - |
| nielsen-2004-ssa | Nielsen and Petz | 2004 | A simple proof of the strong subadditivity inequality | arXiv | Paper | Graduate | Yes | - | arXiv:quant-ph/0408130 | - | - |
| nielsen-2021-gst | Nielsen et al. | 2021 | Gate Set Tomography | Quantum | Review | Graduate | Yes | 10.22331/q-2021-10-05-557 | arXiv:2009.07301 | - | - |
| nielsen-chuang | Nielsen and Chuang | 2012 | Quantum Computation and Quantum Information | Cambridge University Press | Textbook | University | No | 10.1017/CBO9780511976667 | - | - | - |
| nist-2024-fips203 | National Institute of Standards and Technology (US) | 2024 | Module-lattice-based key-encapsulation mechanism standard | National Institute of Standards and Technology (U.S.) | Standard | Graduate | Yes | 10.6028/NIST.FIPS.203 | - | - | - |
| nist-2024-fips204 | National Institute of Standards and Technology (US) | 2024 | Module-lattice-based digital signature standard | National Institute of Standards and Technology (U.S.) | Standard | Graduate | Yes | 10.6028/NIST.FIPS.204 | - | - | - |
| nist-2024-fips205 | National Institute of Standards and Technology (US) | 2024 | Stateless hash-based digital signature standard | National Institute of Standards and Technology (U.S.) | Standard | Graduate | Yes | 10.6028/NIST.FIPS.205 | - | - | - |
| nocedal-2006-optimization | Nocedal and Wright | 2006 | Numerical Optimization | Springer Series in Operations Research and Financial Engineering | Textbook | Graduate | No | 10.1007/978-0-387-40065-5 | - | - | - |
| norris-1997-markov | Norris | 1997 | Markov Chains | Cambridge University Press | Textbook | University | No | 10.1017/CBO9780511810633 | - | - | - |
| obrien-2007-optical | O'Brien | 2007 | Optical Quantum Computing | Science | Review | University | Yes | 10.1126/science.1142892 | arXiv:0803.1554 | - | - |
| obrien-2009-photonic | O'Brien, Furusawa and Vučković | 2009 | Photonic quantum technologies | Nature Photonics | Review | University | Yes | 10.1038/nphoton.2009.229 | arXiv:1003.3928 | - | - |
| ocean-docs | D-Wave | - | Ocean SDK documentation | Official docs | Company claim | University | Yes | - | - | https://docs.dwavequantum.com | URL not checked |
| ofek-2016-breakeven | Ofek et al. | 2016 | Extending the lifetime of a quantum bit with error correction in superconducting circuits | Nature | Paper | Research | Yes | 10.1038/nature18949 | arXiv:1602.04768 | - | arXiv title: "Demonstrating Quantum Error Correction that Extends the Lifetime of Quantum Information" |
| ollivier-2001-discord | Ollivier and Zurek | 2001 | Quantum Discord: A Measure of the Quantumness of Correlations | Physical Review Letters | Paper | Research | Yes | 10.1103/PhysRevLett.88.017901 | arXiv:quant-ph/0105072 | - | arXiv title: "Introducing Quantum Discord" |
| orus-2014-tensor | Orús | 2014 | A practical introduction to tensor networks: Matrix product states and projected entangled pair states | Annals of Physics | Review | Graduate | Yes | 10.1016/j.aop.2014.06.013 | arXiv:1306.2164 | - | - |
| osborne-2006-monogamy | Osborne and Verstraete | 2006 | General Monogamy Inequality for Bipartite Qubit Entanglement | Physical Review Letters | Paper | Research | Yes | 10.1103/PhysRevLett.96.220503 | arXiv:quant-ph/0502176 | - | - |
| paetznick-2024-logical | Paetznick et al. | 2024 | Demonstration of logical qubits and repeated error correction with better-than-physical error rates | arXiv | Paper | Research | Yes | - | arXiv:2404.02280 | - | - |
| paladino-2014-noise | Paladino et al. | 2014 | 1 / f noise: Implications for solid-state quantum information | Reviews of Modern Physics | Review | Graduate | Yes | 10.1103/RevModPhys.86.361 | arXiv:1304.7925 | - | - |
| pan-1998-swapping | Pan et al. | 1998 | Experimental Entanglement Swapping: Entangling Photons That Never Interacted | Physical Review Letters | Paper | Research | No | 10.1103/PhysRevLett.80.3891 | - | - | - |
| pan-2000-ghz | Pan et al. | 2000 | Experimental test of quantum nonlocality in three-photon Greenberger–Horne–Zeilinger entanglement | Nature | Paper | Research | No | 10.1038/35000514 | - | - | - |
| pan-2022-sycamore | Pan, Chen and Zhang | 2022 | Solving the Sampling Problem of the Sycamore Quantum Circuits | Physical Review Letters | Paper | Research | Yes | 10.1103/PhysRevLett.129.090502 | arXiv:2111.03011 | - | - |
| pant-2019-routing | Pant et al. | 2019 | Routing entanglement in the quantum internet | npj Quantum Information | Paper | Research | Yes | 10.1038/s41534-019-0139-x | arXiv:1708.07142 | - | - |
| panteleev-2022-ldpc | Panteleev and Kalachev | 2022 | Asymptotically good Quantum and locally testable classical LDPC codes | Proceedings of the 54th Annual ACM SIGACT Symposium on Theory of Computing | Paper | Research | Yes | 10.1145/3519935.3520017 | arXiv:2111.03654 | - | - |
| pati-2000-deleting | Kumar Pati and Braunstein | 2000 | Impossibility of deleting an unknown quantum state | Nature | Paper | Research | Yes | 10.1038/35004532 | arXiv:quant-ph/9911090 | - | - |
| pati-2000-rsp | Pati | 2000 | Minimum classical bit for remote preparation and measurement of a qubit | Physical Review A | Paper | Research | No | 10.1103/PhysRevA.63.014302 | - | - | - |
| pednault-2019-sycamore | Pednault et al. | 2019 | Leveraging Secondary Storage to Simulate Deep 54-qubit Sycamore Circuits | arXiv | Paper | Research | Yes | - | arXiv:1910.09534 | - | - |
| peev-2009-secoqc | Peev et al. | 2009 | The SECOQC quantum key distribution network in Vienna | New Journal of Physics | Paper | Research | Yes | 10.1088/1367-2630/11/7/075001 | - | - | - |
| peikert-2016-decade | Peikert | 2016 | A Decade of Lattice Cryptography | Foundations and Trends® in Theoretical Computer Science | Review | Graduate | No | 10.1561/0400000074 | - | - | - |
| peng-2020-cutting | Peng et al. | 2020 | Simulating Large Quantum Circuits on a Small Quantum Computer | Physical Review Letters | Paper | Research | Yes | 10.1103/PhysRevLett.125.150504 | arXiv:1904.00102 | - | - |
| pennylane-docs | Xanadu | - | PennyLane documentation | Official docs | Company claim | Intro | Yes | - | - | https://docs.pennylane.ai | URL not checked |
| peres-1996-separability | Peres | 1996 | Separability Criterion for Density Matrices | Physical Review Letters | Paper | Research | Yes | 10.1103/PhysRevLett.77.1413 | arXiv:quant-ph/9604005 | - | - |
| peres-2004-relativity | Peres and Terno | 2004 | Quantum information and relativity theory | Reviews of Modern Physics | Review | Graduate | Yes | 10.1103/RevModPhys.76.93 | arXiv:quant-ph/0212023 | - | - |
| peruzzo-2014-vqe | Peruzzo et al. | 2014 | A variational eigenvalue solver on a photonic quantum processor | Nature Communications | Paper | Research | Yes | 10.1038/ncomms5213 | arXiv:1304.3061 | - | - |
| peters-1999-gravity | Peters, Chung and Chu | 1999 | Measurement of gravitational acceleration by dropping atoms | Nature | Paper | Research | No | 10.1038/23655 | - | - | - |
| pezze-2018-metrology | Pezzè et al. | 2018 | Quantum metrology with nonclassical states of atomic ensembles | Reviews of Modern Physics | Review | Graduate | Yes | 10.1103/RevModPhys.90.035005 | arXiv:1609.01609 | - | - |
| pilatte-2024-unconditional | Pilatte | 2024 | Unconditional correctness of recent quantum algorithms for factoring and computing discrete logarithms | arXiv | Paper | Research | Yes | - | arXiv:2404.16450 | - | - |
| pino-2021-qccd | Pino et al. | 2021 | Demonstration of the trapped-ion quantum CCD computer architecture | Nature | Paper | Research | Yes | 10.1038/s41586-021-03318-4 | arXiv:2003.01293 | - | - |
| pirandola-2017-limits | Pirandola et al. | 2017 | Fundamental limits of repeaterless quantum communications | Nature Communications | Paper | Research | Yes | 10.1038/ncomms15043 | arXiv:1510.08863 | - | - |
| pirandola-2020-advances | Pirandola et al. | 2020 | Advances in quantum cryptography | Advances in Optics and Photonics | Review | Graduate | Yes | 10.1364/AOP.361502 | arXiv:1906.01645 | - | - |
| pironio-2010-random | Pironio et al. | 2010 | Random numbers certified by Bell’s theorem | Nature | Paper | Research | Yes | 10.1038/nature09008 | arXiv:0911.3427 | - | - |
| pittman-1995-ghost | Pittman et al. | 1995 | Optical imaging by means of two-photon quantum entanglement | Physical Review A | Paper | Research | No | 10.1103/PhysRevA.52.R3429 | - | - | - |
| plenio-2005-measures | Plenio and Virmani | 2005 | An introduction to entanglement measures | arXiv | Review | Graduate | Yes | - | arXiv:quant-ph/0504163 | - | - |
| pompili-2021-multinode | Pompili et al. | 2021 | Realization of a multinode quantum network of remote solid-state qubits | Science | Paper | Research | Yes | 10.1126/science.abg1919 | arXiv:2102.04471 | - | - |
| pompili-2022-stack | Pompili et al. | 2022 | Experimental demonstration of entanglement delivery using a quantum network stack | npj Quantum Information | Paper | Research | Yes | 10.1038/s41534-022-00631-2 | arXiv:2111.11332 | - | - |
| portmann-2022-security | Portmann and Renner | 2022 | Security in quantum cryptography | Reviews of Modern Physics | Review | Graduate | Yes | 10.1103/RevModPhys.94.025008 | arXiv:2102.00021 | - | - |
| poulin-2005-subsystem | Poulin | 2005 | Stabilizer Formalism for Operator Quantum Error Correction | Physical Review Letters | Paper | Research | Yes | 10.1103/PhysRevLett.95.230504 | arXiv:quant-ph/0508131 | - | - |
| poyatos-1997-tomography | Poyatos, Cirac and Zoller | 1997 | Complete Characterization of a Quantum Process: The Two-Bit Quantum Gate | Physical Review Letters | Paper | Research | Yes | 10.1103/PhysRevLett.78.390 | arXiv:quant-ph/9611013 | - | - |
| preskill-2012-crossroads | Preskill | 2012 | Quantum computing and the entanglement frontier | arXiv | Paper | University | Yes | - | arXiv:1203.5813 | - | - |
| preskill-2016-shannon | Preskill | 2016 | Quantum Shannon Theory | arXiv | Lecture notes | Graduate | Yes | - | arXiv:1604.07450 | - | - |
| preskill-2021-forty | Preskill | 2021 | Quantum computing 40 years later | arXiv | Review | Intro | Yes | - | arXiv:2106.10522 | - | - |
| preskill-nisq | Preskill | 2018 | Quantum Computing in the NISQ era and beyond | Quantum | Paper | University | Yes | 10.22331/q-2018-08-06-79 | arXiv:1801.00862 | - | - |
| preskill-ph219 | Preskill | - | Lecture notes for Ph219/CS219: Quantum Information and Computation | Caltech | Lecture notes | Graduate | Yes | - | - | http://theory.caltech.edu/~preskill/ph219/ | URL not checked |
| preskill-ph229-notes | Preskill | 1998 | Lecture notes for Physics 229: Quantum Information and Computation | Caltech | Lecture notes | Graduate | Yes | - | - | http://theory.caltech.edu/~preskill/ph229/ | URL not checked |
| primaatmaja-2023-diqkd | Primaatmaja et al. | 2023 | Security of device-independent quantum key distribution protocols: a review | Quantum | Review | Graduate | Yes | 10.22331/q-2023-03-02-932 | arXiv:2206.04960 | - | - |
| proctor-2018-networked | Proctor, Knott and Dunningham | 2018 | Multiparameter Estimation in Networked Quantum Sensors | Physical Review Letters | Paper | Research | Yes | 10.1103/PhysRevLett.120.080501 | arXiv:1702.04271 | - | arXiv title: "Networked quantum sensing" |
| proctor-2024-benchmarking | Proctor et al. | 2024 | Benchmarking quantum computers | arXiv | Review | Research | Yes | - | arXiv:2407.08828 | - | - |
| psiquantum-2025-platform | PsiQuantum team et al. | 2025 | A manufacturable platform for photonic quantum computing | Nature | Paper | Research | Yes | 10.1038/s41586-025-08820-7 | arXiv:2404.17570 | - | - |
| putterman-2025-ocelot | Putterman et al. | 2025 | Hardware-efficient quantum error correction via concatenated bosonic qubits | Nature | Paper | Research | Yes | 10.1038/s41586-025-08642-7 | arXiv:2409.13025 | - | - |
| puzzuoli-2023-dynamics | Puzzuoli et al. | 2023 | Qiskit Dynamics: A Python package for simulating the time dynamics of quantum systems | Journal of Open Source Software | Paper | Graduate | Yes | 10.21105/joss.05853 | - | - | - |
| qdk-docs | Microsoft | - | Azure Quantum and Quantum Development Kit documentation | Official docs | Company claim | Intro | Yes | - | - | https://learn.microsoft.com/azure/quantum/ | URL not checked |
| qir-spec | QIR Alliance | - | Quantum Intermediate Representation specification | GitHub | Standard | Research | Yes | - | - | https://github.com/qir-alliance/qir-spec | URL not checked |
| qiskit-docs | IBM Quantum | - | Qiskit documentation | Official docs | Company claim | Intro | Yes | - | - | https://quantum.cloud.ibm.com/docs | URL not checked |
| quek-2024-limits | Quek et al. | 2024 | Exponentially tighter bounds on limitations of quantum error mitigation | Nature Physics | Paper | Research | Yes | 10.1038/s41567-024-02536-7 | arXiv:2210.11505 | - | - |
| quetschlich-2023-mqtbench | Quetschlich, Burgholzer and Wille | 2023 | MQT Bench: Benchmarking Software and Design Automation Tools for Quantum Computing | Quantum | Paper | Research | Yes | 10.22331/q-2023-07-20-1062 | arXiv:2204.13719 | - | - |
| ragavan-2024-space | Ragavan and Vaikuntanathan | 2024 | Space-Efficient and Noise-Robust Quantum Factoring | Lecture Notes in Computer Science | Paper | Research | Yes | 10.1007/978-3-031-68391-6_4 | arXiv:2310.00899 | - | - |
| ramsey-1950-molecular | Ramsey | 1950 | A Molecular Beam Resonance Method with Separated Oscillating Fields | Physical Review | Paper | Research | No | 10.1103/PhysRev.78.695 | - | - | - |
| raussendorf-2001-oneway | Raussendorf and Briegel | 2001 | A One-Way Quantum Computer | Physical Review Letters | Paper | Research | Yes | 10.1103/PhysRevLett.86.5188 | arXiv:quant-ph/0010033 | - | arXiv title: "Quantum computing via measurements only" |
| raussendorf-2003-cluster | Raussendorf, Browne and Briegel | 2003 | Measurement-based quantum computation on cluster states | Physical Review A | Paper | Research | Yes | 10.1103/PhysRevA.68.022312 | arXiv:quant-ph/0301052 | - | - |
| raymer-2019-nqi | Raymer and Monroe | 2019 | The US National Quantum Initiative | Quantum Science and Technology | Paper | Intro | No | 10.1088/2058-9565/ab0441 | - | - | - |
| raz-2022-ph | Raz and Tal | 2022 | Oracle Separation of BQP and PH | Journal of the ACM | Paper | Research | No | 10.1145/3530258 | - | - | - |
| rebentrost-2018-finance | Rebentrost, Gupt and Bromley | 2018 | Quantum computational finance: Monte Carlo pricing of financial derivatives | Physical Review A | Paper | Research | Yes | 10.1103/PhysRevA.98.022321 | arXiv:1805.00109 | - | - |
| regev-2009-lwe | Regev | 2009 | On lattices, learning with errors, random linear codes, and cryptography | Journal of the ACM | Paper | Research | No | 10.1145/1568318.1568324 | - | - | - |
| regev-2025-factoring | Regev | 2025 | An Efficient Quantum Factoring Algorithm | Journal of the ACM | Paper | Research | Yes | 10.1145/3708471 | arXiv:2308.06572 | - | - |
| reichardt-2011-reflections | Reichardt | 2011 | Reflections for quantum query algorithms | Proceedings of the Twenty-Second Annual ACM-SIAM Symposium on Discrete Algorithms | Paper | Research | Yes | 10.1137/1.9781611973082.44 | arXiv:1005.1601 | - | - |
| reichardt-2024-logical | Reichardt et al. | 2024 | Fault-tolerant quantum computation with a neutral atom processor | arXiv | Paper | Research | Yes | - | arXiv:2411.11822 | - | - |
| reiher-2017-femoco | Reiher et al. | 2017 | Elucidating reaction mechanisms on quantum computers | Proceedings of the National Academy of Sciences | Paper | Research | Yes | 10.1073/pnas.1619152114 | arXiv:1605.03590 | - | - |
| reilly-2015-interface | Reilly | 2015 | Engineering the quantum-classical interface of solid-state qubits | npj Quantum Information | Paper | University | Yes | 10.1038/npjqi.2015.11 | - | - | - |
| renner-2008-security | RENNER | 2008 | SECURITY OF QUANTUM KEY DISTRIBUTION | International Journal of Quantum Information | Paper | Research | Yes | 10.1142/S0219749908003256 | arXiv:quant-ph/0512258 | - | - |
| riedel-2017-flagship | Riedel et al. | 2017 | The European quantum technologies flagship programme | Quantum Science and Technology | Paper | Intro | No | 10.1088/2058-9565/aa6aca | - | - | - |
| rieffel-2000-intro | Rieffel and Polak | 2000 | An introduction to quantum computing for non-physicists | ACM Computing Surveys | Review | Intro | Yes | 10.1145/367701.367709 | arXiv:quant-ph/9809016 | - | - |
| ringbauer-2022-qudit | Ringbauer et al. | 2022 | A universal qudit quantum processor with trapped ions | Nature Physics | Paper | Research | Yes | 10.1038/s41567-022-01658-0 | arXiv:2109.06903 | - | - |
| robertson-1929-uncertainty | Robertson | 1929 | The Uncertainty Principle | Physical Review | Paper | Research | No | 10.1103/PhysRev.34.163 | - | - | - |
| robledomoreno-2025-chemistry | Robledo-Moreno et al. | 2025 | Chemistry beyond the scale of exact diagonalization on a quantum-centric supercomputer | Science Advances | Paper | Research | Yes | 10.1126/sciadv.adu9991 | arXiv:2405.05068 | - | - |
| roetteler-2010-boolean | Rötteler | 2010 | Quantum algorithms for highly non-linear Boolean functions | Proceedings of the Twenty-First Annual ACM-SIAM Symposium on Discrete Algorithms | Paper | Research | Yes | 10.1137/1.9781611973075.37 | arXiv:0811.3208 | - | - |
| roetteler-2017-ecc | Roetteler et al. | 2017 | Quantum Resource Estimates for Computing Elliptic Curve Discrete Logarithms | Lecture Notes in Computer Science | Paper | Research | Yes | 10.1007/978-3-319-70697-9_9 | arXiv:1706.06752 | - | - |
| roffe-2019-guide | Roffe | 2019 | Quantum error correction: an introductory guide | Contemporary Physics | Review | University | Yes | 10.1080/00107514.2019.1667078 | arXiv:1907.11157 | - | - |
| romero-2018-ucc | Romero et al. | 2018 | Strategies for quantum computing molecular energies using the unitary coupled cluster ansatz | Quantum Science and Technology | Paper | Research | Yes | 10.1088/2058-9565/aad3e4 | arXiv:1701.02691 | - | - |
| ross-2014-synthesis | Ross and Selinger | 2014 | Optimal ancilla-free Clifford+T approximation of z-rotations | arXiv | Paper | Research | Yes | - | arXiv:1403.2975 | - | - |
| saffman-2010-rydberg | Saffman, Walker and Mølmer | 2010 | Quantum information with Rydberg atoms | Reviews of Modern Physics | Review | Graduate | Yes | 10.1103/RevModPhys.82.2313 | arXiv:0909.4777 | - | - |
| safronova-2018-newphysics | Safronova et al. | 2018 | Search for new physics with atoms and molecules | Reviews of Modern Physics | Review | Graduate | Yes | 10.1103/RevModPhys.90.025008 | arXiv:1710.01833 | - | - |
| sakurai-2020-modern | Sakurai and Napolitano | 2020 | Modern Quantum Mechanics | Cambridge University Press | Textbook | Graduate | No | 10.1017/9781108587280 | - | - | - |
| santha-2008-walks | Santha | None | Quantum Walk Based Search Algorithms | Lecture Notes in Computer Science | Review | Graduate | Yes | 10.1007/978-3-540-79228-4_3 | arXiv:0808.0059 | - | - |
| sarovar-2020-crosstalk | Sarovar et al. | 2020 | Detecting crosstalk errors in quantum information processors | Quantum | Paper | Research | Yes | 10.22331/q-2020-09-11-321 | arXiv:1908.09855 | - | - |
| scarani-2005-cloning | Scarani et al. | 2005 | Quantum cloning | Reviews of Modern Physics | Review | Graduate | Yes | 10.1103/RevModPhys.77.1225 | arXiv:quant-ph/0511088 | - | - |
| scarani-2009-qkd | Scarani et al. | 2009 | The security of practical quantum key distribution | Reviews of Modern Physics | Review | Graduate | Yes | 10.1103/RevModPhys.81.1301 | arXiv:0802.4155 | - | - |
| schirhagl-2014-nv | Schirhagl et al. | 2014 | Nitrogen-Vacancy Centers in Diamond: Nanoscale Sensors for Physics and Biology | Annual Review of Physical Chemistry | Review | University | No | 10.1146/annurev-physchem-040513-103659 | - | - | - |
| schlosshauer-2005-decoherence | Schlosshauer | 2005 | Decoherence, the measurement problem, and interpretations of quantum mechanics | Reviews of Modern Physics | Review | Graduate | Yes | 10.1103/RevModPhys.76.1267 | arXiv:quant-ph/0312059 | - | - |
| schlosshauer-2019-decoherence | Schlosshauer | 2019 | Quantum decoherence | Physics Reports | Review | University | Yes | 10.1016/j.physrep.2019.10.001 | arXiv:1911.06282 | - | - |
| schuld-2019-gradients | Schuld et al. | 2019 | Evaluating analytic gradients on quantum hardware | Physical Review A | Paper | Research | Yes | 10.1103/PhysRevA.99.032331 | arXiv:1811.11184 | - | - |
| schuld-2019-hilbert | Schuld and Killoran | 2019 | Quantum Machine Learning in Feature Hilbert Spaces | Physical Review Letters | Paper | Research | Yes | 10.1103/PhysRevLett.122.040504 | arXiv:1803.07128 | - | - |
| schuld-2021-mlbook | Schuld and Petruccione | 2021 | Machine Learning with Quantum Computers | Quantum Science and Technology | Textbook | Graduate | No | 10.1007/978-3-030-83098-4 | - | - | - |
| schumacher-1995-coding | Schumacher | 1995 | Quantum coding | Physical Review A | Paper | Research | No | 10.1103/PhysRevA.51.2738 | - | - | - |
| schumacher-1997-classical | Schumacher and Westmoreland | 1997 | Sending classical information via noisy quantum channels | Physical Review A | Paper | Research | No | 10.1103/PhysRevA.56.131 | - | - | - |
| schumacher-2010-processes | Schumacher and Westmoreland | 2010 | Quantum Processes Systems, and Information | Cambridge University Press | Textbook | University | No | 10.1017/CBO9780511814006 | - | - | - |
| scully-1991-complementarity | Scully, Englert and Walther | 1991 | Quantum optical tests of complementarity | Nature | Paper | Research | No | 10.1038/351111a0 | - | - | - |
| sedlacek-2012-microwave | Sedlacek et al. | 2012 | Microwave electrometry with Rydberg atoms in a vapour cell using bright atomic resonances | Nature Physics | Paper | Research | Yes | 10.1038/nphys2423 | arXiv:1205.4461 | - | arXiv title: "Quantum Assisted Electrometry using Bright Atomic Resonances" |
| seeley-2012-bk | Seeley, Richard and Love | 2012 | The Bravyi-Kitaev transformation for quantum computation of electronic structure | The Journal of Chemical Physics | Paper | Graduate | Yes | 10.1063/1.4768229 | arXiv:1208.5986 | - | - |
| shannon-1948-communication | Shannon | 1948 | A Mathematical Theory of Communication | Bell System Technical Journal | Paper | University | No | 10.1002/j.1538-7305.1948.tb01338.x | - | - | - |
| shannon-1949-secrecy | Shannon | 1949 | Communication Theory of Secrecy Systems* | Bell System Technical Journal | Paper | University | No | 10.1002/j.1538-7305.1949.tb00928.x | - | - | - |
| shapiro-2020-illumination | Shapiro | 2020 | The Quantum Illumination Story | IEEE Aerospace and Electronic Systems Magazine | Review | University | Yes | 10.1109/MAES.2019.2957870 | arXiv:1910.12277 | - | - |
| shende-2006-synthesis | Shende, Bullock and Markov | 2006 | Synthesis of quantum-logic circuits | IEEE Transactions on Computer-Aided Design of Integrated Circuits and Systems | Paper | Research | Yes | 10.1109/TCAD.2005.855930 | arXiv:quant-ph/0406176 | - | - |
| shepherd-2009-iqp | Shepherd and Bremner | 2009 | Temporally unstructured quantum computation | Proceedings of the Royal Society A: Mathematical, Physical and Engineering Sciences | Paper | Research | Yes | 10.1098/rspa.2008.0443 | arXiv:0809.0847 | - | arXiv title: "Instantaneous Quantum Computation" |
| shor-1995-scheme | Shor | 1995 | Scheme for reducing decoherence in quantum computer memory | Physical Review A | Paper | Graduate | No | 10.1103/PhysRevA.52.R2493 | - | - | - |
| shor-1997-factoring | Shor | 1997 | Polynomial-Time Algorithms for Prime Factorization and Discrete Logarithms on a Quantum Computer | SIAM Journal on Computing | Paper | Research | Yes | 10.1137/S0097539795293172 | arXiv:quant-ph/9508027 | - | - |
| shor-2000-simple | Shor and Preskill | 2000 | Simple Proof of Security of the BB84 Quantum Key Distribution Protocol | Physical Review Letters | Paper | Research | Yes | 10.1103/PhysRevLett.85.441 | arXiv:quant-ph/0003004 | - | - |
| shor-2008-jones | Shor and Jordan | 2008 | Estimating Jones polynomials is a complete problem for one clean qubit | Quantum Information and Computation | Paper | Research | Yes | 10.26421/QIC8.8-9-1 | arXiv:0707.2831 | - | - |
| shoup-2008-number | Shoup | 2008 | A Computational Introduction to Number Theory and Algebra | Cambridge University Press | Textbook | University | No | 10.1017/CBO9780511814549 | - | - | - |
| sikeridis-2020-tls | Sikeridis, Kampanakis and Devetsikiotis | 2020 | Post-Quantum Authentication in TLS 1.3: A Performance Study | Proceedings 2020 Network and Distributed System Security Symposium | Paper | Research | Yes | 10.14722/ndss.2020.24203 | - | - | - |
| simon-1997-power | Simon | 1997 | On the Power of Quantum Computation | SIAM Journal on Computing | Paper | Research | No | 10.1137/S0097539796298637 | - | - | - |
| sivak-2023-breakeven | Sivak et al. | 2023 | Real-time quantum error correction beyond break-even | Nature | Paper | Research | Yes | 10.1038/s41586-023-05782-6 | arXiv:2211.09116 | - | - |
| sivarajah-2020-tket | Sivarajah et al. | 2020 | t\|ket⟩: a retargetable compiler for NISQ devices | Quantum Science and Technology | Paper | Research | Yes | 10.1088/2058-9565/ab8e92 | arXiv:2003.10611 | - | - |
| skoric-2023-parallel | Skoric et al. | 2023 | Parallel window decoding enables scalable fault tolerant quantum computation | Nature Communications | Paper | Research | Yes | 10.1038/s41467-023-42482-1 | arXiv:2209.08552 | - | - |
| slussarenko-2019-photonic | Slussarenko and Pryde | 2019 | Photonic quantum information processing: A concise review | Applied Physics Reviews | Review | University | Yes | 10.1063/1.5115814 | arXiv:1907.06331 | - | - |
| smith-2008-superactivation | Smith and Yard | 2008 | Quantum Communication with Zero-Capacity Channels | Science | Paper | Research | Yes | 10.1126/science.1162242 | arXiv:0807.4935 | - | - |
| smith-2016-quil | Smith, Curtis and Zeng | 2016 | A Practical Quantum Instruction Set Architecture | arXiv | Paper | University | Yes | - | arXiv:1608.03355 | - | - |
| somma-2008-annealing | Somma et al. | 2008 | Quantum Simulations of Classical Annealing Processes | Physical Review Letters | Paper | Research | Yes | 10.1103/PhysRevLett.101.130504 | arXiv:0804.1571 | - | - |
| somoroff-2023-coherence | Somoroff et al. | 2023 | Millisecond Coherence in a Superconducting Qubit | Physical Review Letters | Paper | Research | Yes | 10.1103/PhysRevLett.130.267001 | arXiv:2103.08578 | - | - |
| sorensen-1999-ions | Sørensen and Mølmer | 1999 | Quantum Computation with Ions in Thermal Motion | Physical Review Letters | Paper | Research | Yes | 10.1103/PhysRevLett.82.1971 | arXiv:quant-ph/9810039 | - | - |
| steane-1996-codes | Steane | 1996 | Error Correcting Codes in Quantum Theory | Physical Review Letters | Paper | Graduate | No | 10.1103/PhysRevLett.77.793 | - | - | - |
| steane-1996-multiple | Steane | 1996 | Multiple-particle interference and quantum error correction | Proceedings of the Royal Society of London. Series A: Mathematical, Physical and Engineering Sciences | Paper | Research | Yes | 10.1098/rspa.1996.0136 | arXiv:quant-ph/9601029 | - | - |
| stebila-2026-rfc9954 | Stebila, Fluhrer and Gueron | 2026 | Hybrid Key Exchange in TLS 1.3 | RFC Editor | Standard | Graduate | Yes | 10.17487/RFC9954 | - | - | - |
| stilckfranca-2021-noisy | Stilck França and García-Patrón | 2021 | Limitations of optimization algorithms on noisy quantum devices | Nature Physics | Paper | Research | Yes | 10.1038/s41567-021-01356-3 | arXiv:2009.05532 | - | - |
| strang-2010-linalg | Strang | 2010 | 18.06 Linear Algebra, Spring 2010 | MIT OpenCourseWare | Course | University | Yes | - | - | https://ocw.mit.edu/courses/18-06-linear-algebra-spring-2010/ | URL opened 2026-11-23 |
| strang-2016-calculus | Strang and Herman | 2016 | Calculus, Volumes 1 to 3 | OpenStax, Rice University | Textbook | Intro | Yes | - | - | https://openstax.org/details/books/calculus-volume-1 | URL not checked |
| stray-2022-gravity | Stray et al. | 2022 | Quantum sensing for gravity cartography | Nature | Paper | Research | Yes | 10.1038/s41586-021-04315-3 | - | - | - |
| streltsov-2017-coherence | Streltsov, Adesso and Plenio | 2017 | Colloquium : Quantum coherence as a resource | Reviews of Modern Physics | Review | Graduate | Yes | 10.1103/RevModPhys.89.041003 | arXiv:1609.02439 | - | - |
| supic-2020-selftesting | Šupić and Bowles | 2020 | Self-testing of quantum systems: a review | Quantum | Review | Graduate | Yes | 10.22331/q-2020-09-30-337 | arXiv:1904.10042 | - | - |
| suzuki-1991-fractal | Suzuki | 1991 | General theory of fractal path integrals with applications to many-body theories and statistical physics | Journal of Mathematical Physics | Paper | Research | No | 10.1063/1.529425 | - | - | - |
| svore-2018-qsharp | Svore et al. | 2018 | Q# | Proceedings of the Real World Domain Specific Languages Workshop 2018 | Paper | University | Yes | 10.1145/3183895.3183901 | arXiv:1803.00652 | - | - |
| szegedy-2004-markov | Szegedy | None | Quantum Speed-Up of Markov Chain Based Algorithms | 45th Annual IEEE Symposium on Foundations of Computer Science | Paper | Research | Yes | 10.1109/FOCS.2004.53 | arXiv:quant-ph/0401053 | - | arXiv title: "Spectra of Quantized Walks and a $\sqrt{δε}$ rule" |
| takagi-2022-limits | Takagi et al. | 2022 | Fundamental limits of quantum error mitigation | npj Quantum Information | Paper | Research | Yes | 10.1038/s41534-022-00618-z | arXiv:2109.04457 | - | - |
| takeoka-2014-tradeoff | Takeoka, Guha and Wilde | 2014 | Fundamental rate-loss tradeoff for optical quantum key distribution | Nature Communications | Paper | Research | Yes | 10.1038/ncomms6235 | - | - | - |
| tan-2008-illumination | Tan et al. | 2008 | Quantum Illumination with Gaussian States | Physical Review Letters | Paper | Research | Yes | 10.1103/PhysRevLett.101.253601 | arXiv:0810.0534 | - | - |
| tang-2019-recommendation | Tang | 2019 | A quantum-inspired classical algorithm for recommendation systems | Proceedings of the 51st Annual ACM SIGACT Symposium on Theory of Computing | Paper | Research | Yes | 10.1145/3313276.3316310 | arXiv:1807.04271 | - | - |
| tang-2022-dequantizing | Tang | 2022 | Dequantizing algorithms to understand quantum advantage in machine learning | Nature Reviews Physics | Review | Graduate | No | 10.1038/s42254-022-00511-w | - | - | - |
| temme-2011-metropolis | Temme et al. | 2011 | Quantum Metropolis sampling | Nature | Paper | Research | Yes | 10.1038/nature09770 | arXiv:0911.3635 | - | - |
| temme-2017-mitigation | Temme, Bravyi and Gambetta | 2017 | Error Mitigation for Short-Depth Quantum Circuits | Physical Review Letters | Paper | Research | Yes | 10.1103/PhysRevLett.119.180509 | arXiv:1612.02058 | - | - |
| terhal-2015-qec | Terhal | 2015 | Quantum error correction for quantum memories | Reviews of Modern Physics | Review | Graduate | Yes | 10.1103/RevModPhys.87.307 | arXiv:1302.3428 | - | - |
| tilly-2022-vqe | Tilly et al. | 2022 | The Variational Quantum Eigensolver: A review of methods and best practices | Physics Reports | Review | Graduate | Yes | 10.1016/j.physrep.2022.08.003 | arXiv:2111.05176 | - | - |
| tindall-2024-kicked | Tindall et al. | 2024 | Efficient Tensor Network Simulation of IBM’s Eagle Kicked Ising Experiment | PRX Quantum | Paper | Research | Yes | 10.1103/PRXQuantum.5.010308 | arXiv:2306.14887 | - | - |
| tindall-2025-dynamics | Tindall et al. | 2025 | Dynamics of disordered quantum systems with two- and three-dimensional tensor networks | arXiv | Paper | Research | Yes | - | arXiv:2503.05693 | - | - |
| toffoli-1980-reversible | Toffoli | 1980 | Reversible computing | Lecture Notes in Computer Science | Paper | Research | No | 10.1007/3-540-10003-2_104 | - | - | - |
| tomamichel-2012-tight | Tomamichel et al. | 2012 | Tight finite-key analysis for quantum cryptography | Nature Communications | Paper | Research | Yes | 10.1038/ncomms1631 | arXiv:1103.4130 | - | - |
| tomamichel-2016-finite | Tomamichel | 2016 | Quantum Information Processing with Finite Resources | SpringerBriefs in Mathematical Physics | Textbook | Graduate | Yes | 10.1007/978-3-319-21891-5 | arXiv:1504.00233 | - | - |
| tomesh-2022-supermarq | Tomesh et al. | 2022 | SupermarQ: A Scalable Quantum Benchmark Suite | 2022 IEEE International Symposium on High-Performance Computer Architecture (HPCA) | Paper | Research | Yes | 10.1109/HPCA53966.2022.00050 | arXiv:2202.11045 | - | - |
| tonomura-1989-buildup | Tonomura et al. | 1989 | Demonstration of single-electron buildup of an interference pattern | American Journal of Physics | Paper | Research | No | 10.1119/1.16104 | - | - | - |
| tse-2019-squeezing | Tse et al. | 2019 | Quantum-Enhanced Advanced LIGO Detectors in the Era of Gravitational-Wave Astronomy | Physical Review Letters | Paper | Research | No | 10.1103/PhysRevLett.123.231107 | - | - | - |
| turan-2018-sp80090b | Turan et al. | 2018 | Recommendation for the entropy sources used for random bit generation | National Institute of Standards and Technology | Standard | Graduate | Yes | 10.6028/NIST.SP.800-90B | - | - | - |
| uhlmann-1977-relative | Uhlmann | 1977 | Relative entropy and the Wigner-Yanase-Dyson-Lieb concavity in an interpolation theory | Communications in Mathematical Physics | Paper | Research | No | 10.1007/BF01609834 | - | - | - |
| uola-2020-steering | Uola et al. | 2020 | Quantum steering | Reviews of Modern Physics | Review | Graduate | Yes | 10.1103/RevModPhys.92.015001 | arXiv:1903.06663 | - | - |
| ursin-2007-144km | Ursin et al. | 2007 | Entanglement-based quantum communication over 144 km | Nature Physics | Paper | Research | Yes | 10.1038/nphys629 | arXiv:quant-ph/0607182 | - | arXiv title: "Free-Space distribution of entanglement and single photons over 144 km" |
| vanapeldoorn-2020-sdp | van Apeldoorn et al. | 2020 | Quantum SDP-Solvers: Better upper and lower bounds | Quantum | Paper | Research | Yes | 10.22331/q-2020-02-14-230 | arXiv:1705.01843 | - | - |
| vandam-2006-shift | van Dam, Hallgren and Ip | 2006 | Quantum Algorithms for Some Hidden Shift Problems | SIAM Journal on Computing | Paper | Research | Yes | 10.1137/S009753970343141X | arXiv:quant-ph/0211140 | - | - |
| vandenberg-2023-pec | van den Berg et al. | 2023 | Probabilistic error cancellation with sparse Pauli–Lindblad models on noisy quantum processors | Nature Physics | Paper | Research | Yes | 10.1038/s41567-023-02042-2 | arXiv:2201.09866 | - | - |
| vandersypen-2001-shor | Vandersypen et al. | 2001 | Experimental realization of Shor's quantum factoring algorithm using nuclear magnetic resonance | Nature | Paper | Research | Yes | 10.1038/414883a | arXiv:quant-ph/0112176 | - | - |
| vandersypen-2005-nmr | Vandersypen and Chuang | 2005 | NMR techniques for quantum control and computation | Reviews of Modern Physics | Review | Graduate | Yes | 10.1103/RevModPhys.76.1037 | arXiv:quant-ph/0404064 | - | - |
| vandewetering-2020-zx | van de Wetering | 2020 | ZX-calculus for the working quantum computer scientist | arXiv | Review | Graduate | Yes | - | arXiv:2012.13966 | - | - |
| vanmeter-2014-networking | Van Meter | 2014 | Quantum Networking | Wiley | Textbook | Graduate | No | 10.1002/9781118648919 | - | - | - |
| vatan-2004-optimal | Vatan and Williams | 2004 | Optimal quantum circuits for general two-qubit gates | Physical Review A | Paper | Research | Yes | 10.1103/PhysRevA.69.032315 | arXiv:quant-ph/0308006 | - | - |
| vedral-1996-arithmetic | Vedral, Barenco and Ekert | 1996 | Quantum networks for elementary arithmetic operations | Physical Review A | Paper | Research | Yes | 10.1103/PhysRevA.54.147 | arXiv:quant-ph/9511018 | - | - |
| veitch-2014-magic | Veitch et al. | 2014 | The resource theory of stabilizer quantum computation | New Journal of Physics | Paper | Research | Yes | 10.1088/1367-2630/16/1/013009 | arXiv:1307.7171 | - | - |
| vidal-2003-simulation | Vidal | 2003 | Efficient Classical Simulation of Slightly Entangled Quantum Computations | Physical Review Letters | Paper | Research | Yes | 10.1103/PhysRevLett.91.147902 | arXiv:quant-ph/0301063 | - | - |
| vidal-2004-universal | Vidal and Dawson | 2004 | Universal quantum circuit for two-qubit transformations with three controlled-NOT gates | Physical Review A | Paper | Research | Yes | 10.1103/PhysRevA.69.010301 | arXiv:quant-ph/0307177 | - | - |
| viola-1999-decoupling | Viola, Knill and Lloyd | 1999 | Dynamical Decoupling of Open Quantum Systems | Physical Review Letters | Paper | Research | Yes | 10.1103/PhysRevLett.82.2417 | arXiv:quant-ph/9809071 | - | - |
| wack-2021-clops | Wack et al. | 2021 | Quality, Speed, and Scale: three key attributes to measure the performance of near-term quantum computers | arXiv | Paper | Research | Yes | - | arXiv:2110.14108 | - | - |
| wallman-2016-twirling | Wallman and Emerson | 2016 | Noise tailoring for scalable quantum computation via randomized compiling | Physical Review A | Paper | Research | Yes | 10.1103/PhysRevA.94.052325 | arXiv:1512.01098 | - | - |
| walter-2017-readout | Walter et al. | 2017 | Rapid High-Fidelity Single-Shot Dispersive Readout of Superconducting Qubits | Physical Review Applied | Paper | Research | Yes | 10.1103/PhysRevApplied.7.054020 | arXiv:1701.06933 | - | - |
| wang-2005-decoy | Wang | 2005 | Beating the Photon-Number-Splitting Attack in Practical Quantum Cryptography | Physical Review Letters | Paper | Research | Yes | 10.1103/PhysRevLett.94.230503 | arXiv:quant-ph/0410075 | - | arXiv title: "Beating the PNS attack in practical quantum cryptography" |
| wang-2020-qudits | Wang et al. | 2020 | Qudits and High-Dimensional Quantum Computing | Frontiers in Physics | Review | University | Yes | 10.3389/fphy.2020.589504 | arXiv:2008.00959 | - | - |
| wasserman-2004-statistics | Wasserman | 2004 | All of Statistics | Springer Texts in Statistics | Textbook | University | No | 10.1007/978-0-387-21736-9 | - | - | - |
| watrous-2009-complexity | Watrous | 2009 | Quantum Computational Complexity | Encyclopedia of Complexity and Systems Science | Review | Graduate | Yes | 10.1007/978-0-387-30440-3_428 | arXiv:0804.3401 | - | - |
| watrous-2025-understanding | Watrous | 2025 | Understanding Quantum Information and Computation | arXiv | Lecture notes | Intro | Yes | - | arXiv:2507.11536 | - | - |
| watrous-tqi | Watrous | 2018 | The Theory of Quantum Information | Cambridge University Press | Textbook | Graduate | Yes | 10.1017/9781316848142 | - | https://cs.uwaterloo.ca/~watrous/TQI/ | - |
| wecker-2015-correlated | Wecker et al. | 2015 | Solving strongly correlated electron models on a quantum computer | Physical Review A | Paper | Research | Yes | 10.1103/PhysRevA.92.062318 | arXiv:1506.05135 | - | - |
| weedbrook-2012-gaussian | Weedbrook et al. | 2012 | Gaussian quantum information | Reviews of Modern Physics | Review | Graduate | Yes | 10.1103/RevModPhys.84.621 | arXiv:1110.3234 | - | - |
| wegman-1981-hash | Wegman and Carter | 1981 | New hash functions and their use in authentication and set equality | Journal of Computer and System Sciences | Paper | Research | No | 10.1016/0022-0000(81)90033-7 | - | - | - |
| wehner-2008-noisy | Wehner, Schaffner and Terhal | 2008 | Cryptography from Noisy Storage | Physical Review Letters | Paper | Research | Yes | 10.1103/PhysRevLett.100.220502 | arXiv:0711.2895 | - | - |
| wehner-2018-internet | Wehner, Elkouss and Hanson | 2018 | Quantum internet: A vision for the road ahead | Science | Review | University | No | 10.1126/science.aam9288 | - | - | - |
| whitfield-2011-simulation | Whitfield, Biamonte and Aspuru-Guzik | 2011 | Simulation of electronic structure Hamiltonians using quantum computers | Molecular Physics | Paper | Research | Yes | 10.1080/00268976.2011.552441 | arXiv:1001.3855 | - | - |
| wiesner-1983-conjugate | Wiesner | 1983 | Conjugate coding | ACM SIGACT News | Paper | Research | No | 10.1145/1008908.1008920 | - | - | - |
| wilde-qit | Wilde | 2016 | Quantum Information Theory | Cambridge University Press | Textbook | Graduate | Yes | 10.1017/9781316809976 | arXiv:1106.1445 | - | arXiv title: "From Classical to Quantum Shannon Theory" |
| wineland-2013-nobel | Wineland | 2013 | Nobel Lecture: Superposition, entanglement, and raising Schrödinger’s cat | Reviews of Modern Physics | Paper | University | No | 10.1103/RevModPhys.85.1103 | - | - | - |
| wiseman-2007-steering | Wiseman, Jones and Doherty | 2007 | Steering, Entanglement, Nonlocality, and the Einstein-Podolsky-Rosen Paradox | Physical Review Letters | Paper | Research | Yes | 10.1103/PhysRevLett.98.140402 | arXiv:quant-ph/0612147 | - | arXiv title: "Steering, Entanglement, Nonlocality, and the EPR Paradox" |
| wocjan-2008-sampling | Wocjan and Abeyesinghe | 2008 | Speedup via quantum sampling | Physical Review A | Paper | Research | Yes | 10.1103/PhysRevA.78.042336 | arXiv:0804.4259 | - | - |
| wootters-1982-cloned | Wootters and Zurek | 1982 | A single quantum cannot be cloned | Nature | Paper | Research | No | 10.1038/299802a0 | - | - | - |
| wootters-1998-formation | Wootters | 1998 | Entanglement of Formation of an Arbitrary State of Two Qubits | Physical Review Letters | Paper | Research | Yes | 10.1103/PhysRevLett.80.2245 | arXiv:quant-ph/9709029 | - | - |
| wu-2021-zuchongzhi | Wu et al. | 2021 | Strong Quantum Computational Advantage Using a Superconducting Quantum Processor | Physical Review Letters | Paper | Research | Yes | 10.1103/PhysRevLett.127.180501 | arXiv:2106.14734 | - | - |
| wu-2022-erasure | Wu et al. | 2022 | Erasure conversion for fault-tolerant quantum computing in alkaline earth Rydberg atom arrays | Nature Communications | Paper | Research | Yes | 10.1038/s41467-022-32094-6 | arXiv:2201.03540 | - | - |
| xu-2020-realistic | Xu et al. | 2020 | Secure quantum key distribution with realistic devices | Reviews of Modern Physics | Review | Graduate | Yes | 10.1103/RevModPhys.92.025002 | arXiv:1903.09051 | - | - |
| yamakawa-2024-verifiable | Yamakawa and Zhandry | 2024 | Verifiable Quantum Advantage without Structure | Journal of the ACM | Paper | Research | Yes | 10.1145/3658665 | arXiv:2204.02063 | - | - |
| yanofsky-2008-qccs | Yanofsky and Mannucci | 2008 | Quantum Computing for Computer Scientists | Cambridge University Press | Textbook | Intro | No | 10.1017/CBO9780511813887 | - | - | - |
| yao-1993-circuit | Chi-Chih Yao | None | Quantum circuit complexity | Proceedings of 1993 IEEE 34th Annual Foundations of Computer Science | Paper | Research | No | 10.1109/SFCS.1993.366852 | - | - | - |
| yin-2017-satellite | Yin et al. | 2017 | Satellite-based entanglement distribution over 1200 kilometers | Science | Paper | Research | Yes | 10.1126/science.aan3211 | arXiv:1707.01339 | - | - |
| yoder-2025-gross | Yoder et al. | 2025 | Tour de gross: A modular quantum computer based on bivariate bicycle codes | arXiv | Paper | Research | Yes | - | arXiv:2506.03094 | - | - |
| zalka-1999-optimal | Zalka | 1999 | Grover’s quantum searching algorithm is optimal | Physical Review A | Paper | Research | Yes | 10.1103/PhysRevA.60.2746 | arXiv:quant-ph/9711070 | - | - |
| zhandry-2019-lightning | Zhandry | 2019 | Quantum Lightning Never Strikes the Same State Twice | Lecture Notes in Computer Science | Paper | Research | Yes | 10.1007/978-3-030-17659-4_14 | arXiv:1711.02276 | - | - |
| zhang-2012-bqpcomplete | Zhang | 2012 | BQP-Complete Problems | Handbook of Natural Computing | Review | Graduate | No | 10.1007/978-3-540-92910-9_46 | - | - | - |
| zhang-2021-distributed | Zhang and Zhuang | 2021 | Distributed quantum sensing | Quantum Science and Technology | Review | Graduate | Yes | 10.1088/2058-9565/abd4c3 | arXiv:2010.14744 | - | - |
| zhao-2020-software | Zhao | 2020 | Quantum Software Engineering: Landscapes and Horizons | arXiv | Review | Research | Yes | - | arXiv:2007.07047 | - | - |
| zhong-2020-photons | Zhong et al. | 2020 | Quantum computational advantage using photons | Science | Paper | Research | Yes | 10.1126/science.abe8770 | arXiv:2012.01625 | - | - |
| zhou-2000-methodology | Zhou, Leung and Chuang | 2000 | Methodology for quantum logic gate construction | Physical Review A | Paper | Research | Yes | 10.1103/PhysRevA.62.052316 | arXiv:quant-ph/0002039 | - | - |
| zukowski-1993-swapping | Żukowski et al. | 1993 | ‘‘Event-ready-detectors’’ Bell experiment via entanglement swapping | Physical Review Letters | Paper | Research | No | 10.1103/PhysRevLett.71.4287 | - | - | - |
| zurek-2003-decoherence | Zurek | 2003 | Decoherence, einselection, and the quantum origins of the classical | Reviews of Modern Physics | Review | Graduate | Yes | 10.1103/RevModPhys.75.715 | arXiv:quant-ph/0105127 | - | - |
| zwerver-2022-manufacturing | Zwerver et al. | 2022 | Qubits made by advanced semiconductor manufacturing | Nature Electronics | Paper | Research | Yes | 10.1038/s41928-022-00727-9 | arXiv:2101.12650 | - | - |

## Stop mapping

| stop | Learn more |
|---|---|
| binary | mermin-qcs, dewolf-notes |
| powers-and-logs | strang-2016-calculus, lehman-2015-mcs |
| probability | blitzstein-2019-probability, lehman-2015-mcs, nielsen-chuang |
| stochastic-matrices | watrous-2025-understanding, norris-1997-markov |
| trigonometry | gelfand-2001-trigonometry, strang-2016-calculus |
| complex-numbers | yanofsky-2008-qccs, needham-1997-visual |
| euler-formula | needham-1997-visual, yanofsky-2008-qccs |
| roots-of-unity | needham-1997-visual, dewolf-notes, nielsen-chuang |
| vectors | strang-2010-linalg, yanofsky-2008-qccs |
| vector-spaces | axler-2024-ladr, yanofsky-2008-qccs, nielsen-chuang |
| dirac-notation | mermin-qcs, nielsen-chuang, dirac-1939-notation |
| inner-product | axler-2024-ladr, nielsen-chuang, yanofsky-2008-qccs |
| outer-product | nielsen-chuang, dewolf-notes |
| matrices | strang-2010-linalg, yanofsky-2008-qccs |
| linear-maps | axler-2024-ladr, strang-2010-linalg, nielsen-chuang |
| conjugate-transpose | nielsen-chuang, yanofsky-2008-qccs, horn-2012-matrix |
| eigen | strang-2010-linalg, axler-2024-ladr, nielsen-chuang |
| unitary-matrices | nielsen-chuang, yanofsky-2008-qccs, horn-2012-matrix |
| hermitian-matrices | nielsen-chuang, axler-2024-ladr, horn-2012-matrix |
| projectors | nielsen-chuang, axler-2024-ladr |
| spectral-theorem | axler-2024-ladr, nielsen-chuang, horn-2012-matrix |
| matrix-functions | nielsen-chuang, higham-2008-functions |
| commutators | nielsen-chuang, sakurai-2020-modern |
| trace | nielsen-chuang, axler-2024-ladr |
| tensor-product | nielsen-chuang, watrous-2025-understanding, yanofsky-2008-qccs |
| positive-matrices | nielsen-chuang, watrous-tqi, horn-2012-matrix |
| svd-polar | axler-2024-ladr, nielsen-chuang, horn-2012-matrix |
| matrix-norms | watrous-tqi, bhatia-1997-matrix, nielsen-chuang |
| spherical-coordinates | strang-2016-calculus, nielsen-chuang |
| su2 | sakurai-2020-modern, nielsen-chuang, hall-2015-lie |
| modular-arithmetic | shoup-2008-number, lehman-2015-mcs, nielsen-chuang |
| groups | nielsen-chuang, shoup-2008-number |
| gf2 | dewolf-notes, shoup-2008-number, aaronson-2004-stabilizer |
| continued-fractions | nielsen-chuang, hardy-2008-numbers, shor-1997-factoring |
| discrete-fourier | dewolf-notes, nielsen-chuang, cooley-1965-fft |
| big-o | lehman-2015-mcs, nielsen-chuang, arora-2009-complexity |
| derivatives | strang-2016-calculus, schuld-2019-gradients |
| calculus-odes | strang-2010-linalg, hirsch-2013-differential |
| numerical-optimization | nocedal-2006-optimization, cerezo-2021-vqa |
| statistics | wasserman-2004-statistics, hoeffding-1963-inequalities |
| probabilistic-bits | watrous-2025-understanding, aaronson-qcsd |
| double-slit | feynman-1965-flp3, tonomura-1989-buildup, scully-1991-complementarity |
| qubit | mermin-2002-cbits, mermin-qcs, watrous-2025-understanding |
| superposition | mermin-qcs, watrous-2025-understanding, dewolf-notes |
| measurement | mermin-qcs, watrous-2025-understanding, dewolf-notes |
| quantum-random | ma-2016-qrng, herrero-2017-qrng |
| polarization | rieffel-2000-intro, feynman-1965-flp3 |
| stern-gerlach | feynman-1965-flp3, sakurai-2020-modern, gerlach-1922-richtungsquantelung |
| bloch | nielsen-chuang, watrous-2025-understanding, preskill-ph219 |
| phase | watrous-2025-understanding, nielsen-chuang |
| interference | feynman-1965-flp3, aaronson-qcsd, dewolf-notes |
| bases | nielsen-chuang, dewolf-notes |
| mach-zehnder | schumacher-2010-processes, grangier-1986-anticorrelation |
| bomb-tester | elitzur-1993-bomb, kwiat-1995-interaction |
| quantum-zeno | misra-1977-zeno, itano-1990-zeno, facchi-2008-zeno |
| multi-qubit | mermin-qcs, watrous-2025-understanding, nielsen-chuang |
| partial-measurement | watrous-2025-understanding, mermin-qcs, nielsen-chuang |
| entanglement | watrous-2025-understanding, nielsen-chuang, horodecki-2009-entanglement |
| epr | einstein-1935-epr, mermin-1981-mysteries, bell-1964-epr |
| bell-test | watrous-2025-understanding, clauser-1969-chsh, brunner-2014-bell |
| ghz-w | dur-2000-three, greenberger-1990-bell |
| ghz-paradox | brassard-2005-pseudo, greenberger-1990-bell, pan-2000-ghz |
| contextuality | mermin-1993-hidden, budroni-2022-contextuality, kochen-1967-hidden |
| no-signaling | preskill-ph219, ghirardi-1980-superluminal, peres-2004-relativity |
| no-cloning | watrous-2025-understanding, wootters-1982-cloned, scarani-2005-cloning |
| state-discrimination | barnett-2009-discrimination, watrous-tqi, bae-2015-discrimination |
| postulates | nielsen-chuang, preskill-ph219 |
| observables | nielsen-chuang, sakurai-2020-modern, preskill-ph219 |
| expectation-values | nielsen-chuang, sakurai-2020-modern |
| uncertainty | nielsen-chuang, robertson-1929-uncertainty, coles-2017-entropic |
| time-evolution | nielsen-chuang, sakurai-2020-modern, preskill-ph219 |
| pictures | sakurai-2020-modern, gottesman-1998-heisenberg |
| mixed-states | nielsen-chuang, watrous-2025-understanding, preskill-ph219 |
| density-matrix | watrous-2025-understanding, nielsen-chuang, fano-1957-density |
| noise-channels | nielsen-chuang, preskill-ph219, wilde-qit |
| decoherence | schlosshauer-2019-decoherence, zurek-2003-decoherence, nielsen-chuang |
| qudits | wang-2020-qudits, ringbauer-2022-qudit |
| measurement-problem | schlosshauer-2005-decoherence, maudlin-1995-measurement, bassi-2013-collapse |
| interpretations | schlosshauer-2005-decoherence, everett-1957-relative, fuchs-2014-qbism |
| partial-trace | nielsen-chuang, watrous-2025-understanding, preskill-ph219 |
| schmidt | nielsen-chuang, preskill-ph219, watrous-tqi |
| purification | nielsen-chuang, watrous-2025-understanding, preskill-ph219 |
| entanglement-entropy | nielsen-chuang, preskill-2016-shannon, bennett-1996-concentrating |
| separability | guhne-2009-detection, peres-1996-separability, horodecki-1996-separability |
| monogamy | coffman-2000-distributed, osborne-2006-monogamy, horodecki-2009-entanglement |
| locc | nielsen-chuang, chitambar-2014-locc, nielsen-1999-transformations |
| povm | nielsen-chuang, watrous-2025-understanding, preskill-ph219 |
| channels | nielsen-chuang, watrous-2025-understanding, wilde-qit |
| channel-representations | watrous-2025-understanding, watrous-tqi, choi-1975-positive |
| distance-measures | nielsen-chuang, watrous-tqi, fuchs-1999-distinguishability |
| tomography | nielsen-chuang, james-2001-qubits, haah-2017-tomography |
| classical-gates | nielsen-chuang, arora-2009-complexity |
| gates | mermin-qcs, watrous-2025-understanding, nielsen-chuang |
| pauli | watrous-2025-understanding, nielsen-chuang |
| hadamard | mermin-qcs, watrous-2025-understanding, nielsen-chuang |
| phase-gates | watrous-2025-understanding, nielsen-chuang |
| rotations | nielsen-chuang, barenco-1995-elementary |
| single-qubit-unitary | nielsen-chuang, barenco-1995-elementary |
| shots | blitzstein-2019-probability, wasserman-2004-statistics, hoeffding-1963-inequalities |
| cnot | mermin-qcs, watrous-2025-understanding, nielsen-chuang |
| circuits | watrous-2025-understanding, nielsen-chuang, mermin-qcs |
| bell-states | watrous-2025-understanding, nielsen-chuang |
| controlled-gates | nielsen-chuang, barenco-1995-elementary |
| toffoli | nielsen-chuang, toffoli-1980-reversible, barenco-1995-elementary |
| fredkin | fredkin-1982-conservative, nielsen-chuang |
| multi-controlled | nielsen-chuang, barenco-1995-elementary, maslov-2016-toffoli |
| two-qubit-gates | krantz-2019-guide, sorensen-1999-ions, foxen-2020-continuous |
| circuit-identities | nielsen-chuang, garcia-escartin-2011-equivalent |
| phase-kickback | kaye-laflamme-mosca, cleve-1998-revisited |
| mid-circuit | nielsen-chuang, corcoles-2021-dynamic |
| deferred-measurement | nielsen-chuang |
| parity-measurement | devitt-2013-qec, nielsen-chuang |
| hadamard-test | lin-2022-notes, aharonov-2008-jones, cleve-1998-revisited |
| swap-test | buhrman-2001-fingerprinting, barenco-1997-stabilization |
| reversible | nielsen-chuang, bennett-1973-reversibility, landauer-1961-irreversibility |
| oracles | mermin-qcs, dewolf-notes, nielsen-chuang |
| quantum-parallelism | nielsen-chuang, dewolf-notes |
| ancillas | nielsen-chuang, barenco-1995-elementary |
| uncomputation | watrous-2025-understanding, bennett-1973-reversibility |
| quantum-arithmetic | vedral-1996-arithmetic, cuccaro-2004-adder, draper-2000-addition |
| universal | nielsen-chuang, barenco-1995-elementary, divincenzo-1995-twobit |
| pauli-strings | nielsen-chuang, gottesman-1997-thesis, preskill-ph219 |
| pauli-rotations | nielsen-chuang, whitfield-2011-simulation |
| clifford-group | nielsen-chuang, gottesman-1998-heisenberg, aaronson-2004-stabilizer |
| clifford-t | nielsen-chuang, boykin-2000-basis, kliuchnikov-2013-approximation |
| circuit-cost | watrous-2025-understanding, amy-2013-meet |
| native-gates | krantz-2019-guide, bruzewicz-2019-ions |
| transpilation | javadiabhari-2024-qiskit, sivarajah-2020-tket, li-2019-sabre |
| circuit-languages | cross-2022-openqasm, javadiabhari-2024-qiskit |
| classical-simulation | aaronson-2004-stabilizer, markov-2008-tensor, vidal-2003-simulation |
| decomposition | nielsen-chuang, barenco-1995-elementary, shende-2006-synthesis |
| two-qubit-synthesis | vatan-2004-optimal, vidal-2004-universal, kraus-2001-optimal |
| qubit-routing | li-2019-sabre, cowtan-2019-routing |
| stabilizer-states | nielsen-chuang, gottesman-1997-thesis, aaronson-2004-stabilizer |
| gottesman-knill | nielsen-chuang, gottesman-1998-heisenberg, aaronson-2004-stabilizer |
| solovay-kitaev | dawson-2005-solovay, nielsen-chuang, kitaev-1997-computations |
| gate-teleportation | gottesman-1999-gate, zhou-2000-methodology, bravyi-2005-magic |
| zx-calculus | vandewetering-2020-zx, coecke-2011-interacting, duncan-2020-graph |
| qtm | deutsch-1985-universal, bernstein-1997-complexity, yao-1993-circuit |
| mbqc | briegel-2009-mbqc, raussendorf-2001-oneway, raussendorf-2003-cluster |
| adiabatic | albash-2018-adiabatic, farhi-2000-adiabatic, aharonov-2007-adiabatic |
| topological-model | nayak-2008-anyons, kitaev-2003-anyons, preskill-ph219 |
| cv-model | braunstein-2005-cv, lloyd-1999-cv, weedbrook-2012-gaussian |
| deutsch | dewolf-notes, deutsch-1985-universal, cleve-1998-revisited |
| deutsch-jozsa | dewolf-notes, deutsch-1992-rapid, cleve-1998-revisited |
| bernstein-vazirani | dewolf-notes, mermin-qcs, bernstein-1997-complexity |
| simon | dewolf-notes, simon-1997-power, childs-notes |
| hidden-shift | childs-2010-algebraic, vandam-2006-shift, roetteler-2010-boolean |
| qft | dewolf-notes, nielsen-chuang, coppersmith-2002-fourier |
| phase-estimation | nielsen-chuang, cleve-1998-revisited, kitaev-1995-stabilizer |
| iterative-qpe | kitaev-1995-stabilizer, dobsicek-2007-iterative, kimmel-2015-robust |
| order-finding | nielsen-chuang, dewolf-notes, shor-1997-factoring |
| shor | dewolf-notes, shor-1997-factoring, nielsen-chuang |
| discrete-log | shor-1997-factoring, childs-notes, roetteler-2017-ecc |
| abelian-hsp | childs-2010-algebraic, childs-notes, kitaev-1995-stabilizer |
| non-abelian-hsp | childs-2010-algebraic, ettinger-2004-hsp, moore-2008-symmetric |
| kuperberg | kuperberg-2005-dihedral, childs-notes, childs-2013-isogenies |
| pell-number-fields | hallgren-2007-pell, childs-notes, biasse-2015-classgroups |
| regev-factoring | regev-2025-factoring, pilatte-2024-unconditional, ragavan-2024-space |
| grover | dewolf-notes, nielsen-chuang, grover-1996-search |
| amplitude-amplification | brassard-2002-amplitude, dewolf-notes |
| quantum-counting | nielsen-chuang, brassard-1998-counting |
| amplitude-estimation | brassard-2002-amplitude, montanaro-2015-montecarlo |
| minimum-finding | durr-1996-minimum, gilliam-2021-gas |
| collision-finding | childs-notes, brassard-1998-collision, aaronson-2004-collision |
| backtracking | montanaro-2018-backtracking, montanaro-2020-branchbound, ambainis-2019-dp |
| quantum-walks | kempe-2003-walks, dewolf-notes, aharonov-1993-walks |
| ctqw | childs-notes, farhi-1998-trees, kempe-2003-walks |
| spatial-search | childs-notes, childs-2004-spatial, aaronson-2005-spatial |
| glued-trees | childs-2003-exponential, childs-notes |
| szegedy-walk | santha-2008-walks, szegedy-2004-markov, magniez-2011-search |
| element-distinctness | ambainis-2007-distinctness, santha-2008-walks |
| triangle-finding | magniez-2007-triangle, legall-2014-triangle, santha-2008-walks |
| nand-tree | childs-notes, farhi-2008-nand, reichardt-2011-reflections |
| graph-queries | durr-2006-graph, montanaro-2016-overview |
| simulation | nielsen-chuang, lloyd-1996-simulators, feynman-1982-simulating |
| analog-simulation | georgescu-2014-simulation, altman-2021-simulators, daley-2022-practical |
| trotter | childs-notes, childs-2021-trotter, suzuki-1991-fractal |
| qdrift | campbell-2019-qdrift, dalzell-2023-survey |
| lcu | dewolf-notes, childs-2012-lcu, berry-2015-taylor |
| block-encoding | lin-2022-notes, gilyen-2019-qsvt, dewolf-notes |
| qsp | martyn-2021-grand, low-2017-qsp, childs-notes |
| qubitization | low-2019-qubitization, martyn-2021-grand, babbush-2018-spectra |
| qsvt | martyn-2021-grand, gilyen-2019-qsvt, lin-2022-notes |
| fermion-mapping | mcardle-2020-chemistry, seeley-2012-bk, bravyi-2002-fermionic |
| electronic-structure | mcardle-2020-chemistry, aspuruguzik-2005-energies, bauer-2020-chemistry |
| ground-state-prep | lin-2020-groundstate, lee-2023-evidence |
| early-ft-qpe | katabarwa-2024-early, lin-2022-heisenberg, ding-2023-shorter |
| femoco | reiher-2017-femoco, lee-2021-thc |
| condensed-matter | dalzell-2023-survey, wecker-2015-correlated, kivlichan-2020-trotter |
| lattice-gauge | bauer-2023-hep, jordan-2012-qft, martinez-2016-gauge |
| gibbs-sampling | temme-2011-metropolis, chen-2023-gibbs |
| hamiltonian-learning | anshu-2021-learning, huang-2023-heisenberg |
| hhl | dewolf-notes, harrow-2009-linear, aaronson-2015-fineprint |
| linear-solvers | lin-2022-notes, childs-2017-linear, costa-2022-optimal |
| differential-equations | berry-2014-ode, liu-2021-nonlinear, babbush-2023-oscillators |
| gradient-estimation | jordan-2005-gradient, gilyen-2019-gradient |
| adiabatic-optimization | albash-2018-adiabatic, childs-notes, farhi-2001-adiabatic |
| qaoa | farhi-2014-qaoa, abbas-2024-optimization |
| qaoa-variants | hadfield-2019-ansatz, egger-2021-warmstart, bravyi-2020-obstacles |
| dqi | jordan-2025-dqi |
| sdp-solvers | brandao-2017-sdp, vanapeldoorn-2020-sdp |
| variational | cerezo-2021-vqa, bharti-2022-nisq, peruzzo-2014-vqe |
| ansatz | bharti-2022-nisq, kandala-2017-hardware, romero-2018-ucc |
| parameter-shift | schuld-2019-gradients, mitarai-2018-learning |
| vqe | tilly-2022-vqe, peruzzo-2014-vqe, mcclean-2016-theory |
| adapt-vqe | grimsley-2019-adapt, tilly-2022-vqe |
| vqd | higgott-2019-excited, nakanishi-2019-ssvqe |
| imaginary-time | motta-2019-qite, mcardle-2019-imaginary |
| subspace-methods | motta-2024-subspace, mcclean-2017-hierarchy, robledomoreno-2025-chemistry |
| barren-plateaus | larocca-2025-barren, mcclean-2018-barren, cerezo-2025-simulability |
| data-encoding | schuld-2021-mlbook, havlicek-2019-feature |
| quantum-kernels | schuld-2019-hilbert, havlicek-2019-feature, liu-2021-rigorous |
| qnn | farhi-2018-qnn, cong-2019-qcnn, schuld-2021-mlbook |
| quantum-generative | benedetti-2019-generative, amin-2018-boltzmann, lloyd-2018-qgan |
| qpca | lloyd-2014-qpca, biamonte-2017-qml |
| recommendation | kerenidis-2016-recommendation, tang-2019-recommendation |
| tda | lloyd-2016-topological, berry-2024-tda |
| classical-shadows | huang-2020-shadows, elben-2022-toolbox, aaronson-2018-shadow |
| quantum-data-advantage | huang-2021-bounds, huang-2022-experiments |
| mc-speedup | montanaro-2015-montecarlo, dalzell-2023-survey |
| option-pricing | herman-2023-finance, rebentrost-2018-finance, chakrabarti-2021-threshold |
| markov-speedup | montanaro-2016-overview, somma-2008-annealing, wocjan-2008-sampling |
| rcs | hangleiter-2023-sampling, arute-2019-supremacy, morvan-2024-rcs |
| xeb | boixo-2018-supremacy, arute-2019-supremacy |
| boson-sampling | aaronson-2013-linear, brod-2019-photonic |
| gbs | hamilton-2017-gbs, zhong-2020-photons, madsen-2022-borealis |
| iqp | bremner-2010-iqp, shepherd-2009-iqp |
| otoc-echoes | mi-2021-scrambling, google-2025-echoes |
| simon-attacks | kaplan-2016-period, kuwakado-2010-feistel |
| state-prep | shende-2006-synthesis, mottonen-2005-transformation, grover-2002-superpositions |
| qram | jaques-2025-qram, giovannetti-2008-qram |
| jones-polynomial | aharonov-2008-jones, childs-notes, freedman-2002-topological |
| complexity-basics | aaronson-qcsd, arora-2009-complexity |
| speedup-types | montanaro-2016-overview, dalzell-2023-survey |
| extended-church-turing | aaronson-qcsd, bernstein-1997-complexity |
| limits | aaronson-qcsd, aaronson-2005-npcomplete, bennett-1997-strengths |
| query-model | dewolf-notes, ambainis-2019-query, buhrman-2002-survey |
| bqp | dewolf-notes, watrous-2009-complexity, bernstein-1997-complexity |
| bqp-vs-np | aaronson-2005-npcomplete, bennett-1997-strengths, nielsen-chuang |
| bbbv | nielsen-chuang, bennett-1997-strengths, zalka-1999-optimal |
| polynomial-method | dewolf-notes, beals-2001-polynomials, farhi-1998-parity |
| adversary-method | dewolf-notes, ambainis-2002-adversary, hoyer-2007-negative |
| speedup-needs-structure | aaronson-2014-structure, beals-2001-polynomials |
| oracle-separations | raz-2022-ph, simon-1997-power, bernstein-1997-complexity |
| forrelation | aaronson-2018-forrelation, raz-2022-ph |
| model-equivalence | aharonov-2007-adiabatic, raussendorf-2001-oneway, childs-2009-universal |
| bqp-complete | zhang-2012-bqpcomplete, aharonov-2008-jones |
| dqc1 | knill-1998-oneclean, shor-2008-jones, morimae-2014-dqc1 |
| qma | dewolf-notes, gharibian-2015-hamiltonian, ksv-cqc |
| local-hamiltonian | gharibian-2015-hamiltonian, kempe-2006-local, gharibian-2022-dequantizing |
| postbqp | aaronson-2005-postselection, bremner-2010-iqp |
| supremacy-arguments | hangleiter-2023-sampling, harrow-2017-supremacy, bouland-2018-rcs |
| proofs-of-quantumness | brakerski-2021-test, yamakawa-2024-verifiable |
| verification | gheorghiu-2018-verification, mahadev-2018-verification, fitzsimons-2017-blind |
| dequantization | tang-2022-dequantizing, tang-2019-recommendation, chia-2022-dequantizing |
| noise-limits | stilckfranca-2021-noisy, aharonov-2023-noisyrcs, chen-2023-nisq |
| no-fast-forwarding | berry-2006-sparse, atia-2017-fastforward |
| fine-print | aaronson-2015-fineprint, babbush-2021-focus, hoefler-2023-disentangling |
| proving-advantage | babbush-2026-grand, huang-2026-vast, hoefler-2023-disentangling |
| no-go-theorems | scarani-2005-cloning, barnum-1996-broadcast, pati-2000-deleting |
| hypothesis-testing | hayashi-2017-qit, audenaert-2007-chernoff, hiai-1991-stein |
| shannon-entropy | cover-2005-elements, preskill-2016-shannon, shannon-1948-communication |
| von-neumann-entropy | nielsen-chuang, preskill-2016-shannon, wilde-qit |
| entropy-family | wilde-qit, preskill-2016-shannon, horodecki-2005-partial |
| strong-subadditivity | nielsen-chuang, nielsen-2004-ssa, lieb-1973-ssa |
| data-processing | wilde-qit, lindblad-1975-cp, uhlmann-1977-relative |
| one-shot-entropies | tomamichel-2016-finite, konig-2009-operational, renner-2008-security |
| entropic-uncertainty | coles-2017-entropic, berta-2010-memory, maassen-1988-uncertainty |
| open-systems | breuer-2007-open, preskill-ph219, lindblad-1976-generators |
| holevo-bound | nielsen-chuang, dewolf-notes, wilde-qit |
| random-access-codes | dewolf-notes, ambainis-2002-dense, nayak-1999-rac |
| schumacher | nielsen-chuang, schumacher-1995-coding, preskill-2016-shannon |
| classical-capacity | wilde-qit, holevo-1998-capacity, schumacher-1997-classical |
| quantum-capacity | wilde-qit, devetak-2005-private, lloyd-1997-capacity |
| ea-capacity | wilde-qit, bennett-2002-ea, watrous-tqi |
| private-capacity | wilde-qit, devetak-2005-private, cai-2004-wiretap |
| superactivation | smith-2008-superactivation, hastings-2009-superadditivity, wilde-qit |
| entanglement-measures | plenio-2005-measures, horodecki-2009-entanglement, wootters-1998-formation |
| entanglement-distillation | horodecki-2009-entanglement, bennett-1996-purification, deutsch-1996-privacy |
| bound-entanglement | horodecki-2009-entanglement, horodecki-1998-bound |
| tsirelson | dewolf-notes, brunner-2014-bell, cirelson-1980-bell |
| steering | uola-2020-steering, wiseman-2007-steering |
| self-testing | supic-2020-selftesting, mayers-2003-selftesting |
| discord | modi-2012-discord, ollivier-2001-discord |
| resource-theories | chitambar-2019-resource, brandao-2015-reversible |
| coherence-resource | streltsov-2017-coherence, baumgratz-2014-coherence |
| magic | bravyi-2005-magic, veitch-2014-magic, howard-2017-magic |
| quantum-thermo | goold-2016-thermo, landauer-1961-irreversibility, brandao-2013-thermo |
| process-tomography | nielsen-chuang, chuang-1997-tomography, poyatos-1997-tomography |
| gate-set-tomography | nielsen-2021-gst, blumekohout-2017-gst |
| randomized-benchmarking | magesan-2011-rb, knill-2008-rb, helsen-2022-rb |
| certification | kliesch-2021-certification, eisert-2020-certification, flammia-2011-fidelity |
| crypto-basics | katz-2020-crypto, shannon-1949-secrecy, diffie-1976-directions |
| teleportation | dewolf-notes, bennett-1993-teleportation, bouwmeester-1997-teleportation |
| superdense | mermin-qcs, bennett-1992-superdense, mattle-1996-dense |
| entanglement-swapping | zukowski-1993-swapping, pan-1998-swapping, azuma-2023-repeaters |
| remote-state-prep | bennett-2001-rsp, pati-2000-rsp, lo-2000-rsp |
| quantum-one-time-pad | dewolf-notes, ambainis-2000-private, boykin-2003-encryption |
| bb84 | dewolf-notes, bennett-2014-bb84, scarani-2009-qkd |
| intercept-resend | gisin-2002-qkd, bennett-2014-bb84 |
| b92 | bennett-1992-b92, gisin-2002-qkd |
| six-state | bruss-1998-sixstate, scarani-2009-qkd |
| e91 | ekert-1991-e91, gisin-2002-qkd, pirandola-2020-advances |
| bbm92 | bennett-1992-bbm92, pirandola-2020-advances |
| info-reconciliation | pirandola-2020-advances, brassard-1993-cascade, nielsen-chuang |
| privacy-amplification | pirandola-2020-advances, bennett-1995-generalized, bennett-1988-privacy |
| authentication | wegman-1981-hash, portmann-2022-security, katz-2020-crypto |
| qkd | pirandola-2020-advances, scarani-2009-qkd, gisin-2002-qkd |
| qkd-hacking | xu-2020-realistic, lydersen-2010-hacking, brassard-2000-limitations |
| decoy-states | lo-2005-decoy, hwang-2003-decoy, wang-2005-decoy |
| mdi-qkd | lo-2012-mdi, braunstein-2012-sidechannel, xu-2020-realistic |
| twin-field | lucamarini-2018-twinfield, liu-2023-twinfield, pirandola-2020-advances |
| di-qkd | primaatmaja-2023-diqkd, acin-2007-diqkd, nadlinger-2022-diqkd |
| cv-qkd | pirandola-2020-advances, grosshans-2002-cvqkd, weedbrook-2012-gaussian |
| qkd-security-proofs | portmann-2022-security, shor-2000-simple, tomamichel-2012-tight |
| qkd-standards | langer-2009-standardization, etsi-2019-qkd014 |
| qkd-vs-pqc | pirandola-2020-advances, bernstein-2017-pqc |
| conference-key | murta-2020-conference |
| secret-sharing | hillery-1999-sharing, cleve-1999-sharing |
| quantum-money | broadbent-2015-beyond, wiesner-1983-conjugate, aaronson-2012-money |
| unclonable-crypto | aaronson-2009-copyprotection, zhandry-2019-lightning, broadbent-2019-uncloneable |
| bit-commitment | dewolf-notes, mayers-1997-commitment, lo-1997-commitment |
| coin-flipping | broadbent-2015-beyond, chailloux-2009-coin, aharonov-2016-coin |
| oblivious-transfer | broadbent-2015-beyond, lo-1997-insecurity, wehner-2008-noisy |
| position-verification | buhrman-2014-position, kent-2011-tagging, broadbent-2015-beyond |
| digital-signatures | pirandola-2020-advances, amiri-2016-signatures |
| blind-qc | fitzsimons-2017-private, broadbent-2009-blind, barz-2012-blind |
| fingerprinting | dewolf-notes, buhrman-2001-fingerprinting |
| rsa | bernstein-2017-pqc, shor-1997-factoring, roetteler-2017-ecc |
| q-day | gidney-2021-rsa, gouzien-2021-factoring, roetteler-2017-ecc |
| hndl | mosca-2018-ready, moody-2026-ir8547 |
| grover-symmetric | jaques-2020-grover, grassl-2016-aes, moody-2026-ir8547 |
| post-quantum | bernstein-2017-pqc, alagic-2022-ir8413, moody-2026-ir8547 |
| lattice-crypto | peikert-2016-decade, regev-2009-lwe, nist-2024-fips203 |
| ml-kem | nist-2024-fips203, bos-2018-kyber, alagic-2025-sp800227 |
| ml-dsa | nist-2024-fips204, ducas-2018-dilithium, massimo-2025-rfc9881 |
| fn-dsa | alagic-2022-ir8413, gentry-2008-trapdoors, hoffstein-1998-ntru |
| hash-signatures | nist-2024-fips205, cooper-2020-sp800208, bernstein-2019-sphincs |
| code-crypto | alagic-2025-ir8545, mceliece-1978-code, bernstein-2017-pqc |
| other-pqc | castryck-2023-sidh, beullens-2022-rainbow, alagic-2026-ir8610 |
| hybrid-crypto | stebila-2026-rfc9954, alagic-2025-sp800227, bindel-2019-hybrid |
| crypto-agility | barker-2025-cswp39, moody-2026-ir8547 |
| pqc-migration | moody-2026-ir8547, mosca-2018-ready, barker-2025-cswp39 |
| crypto-coins | aggarwal-2018-bitcoin, roetteler-2017-ecc |
| pqc-in-tls | kwiatkowski-2026-rfc10024, massimo-2025-rfc9881, sikeridis-2020-tls |
| flying-qubits | gisin-2007-communication, obrien-2009-photonic, kok-2007-loqc |
| fiber-loss | gisin-2007-communication, gisin-2002-qkd, wootters-1982-cloned |
| repeaterless-bound | pirandola-2017-limits, takeoka-2014-tradeoff, pirandola-2020-advances |
| hom | bouchard-2020-hom, hong-1987-hom |
| bell-measurement | calsamiglia-2001-bell, lutkenhaus-1999-bell, kok-2007-loqc |
| heralded-entanglement | bernien-2013-heralded, moehring-2007-entanglement, hensen-2015-loophole |
| entanglement-distribution | gisin-2007-communication, ursin-2007-144km, yin-2017-satellite |
| satellites | lu-2022-micius, yin-2017-satellite, liao-2018-intercontinental |
| trusted-nodes | chen-2021-network, peev-2009-secoqc, mehic-2020-qkd |
| quantum-memories | lvovsky-2009-memory, heshami-2016-memories |
| frequency-conversion | lauk-2020-transduction, kumar-1990-conversion |
| repeaters | azuma-2023-repeaters, briegel-1998-repeaters, duan-2001-dlcz |
| quantum-internet | wehner-2018-internet, kimble-2008-internet, kozlowski-2023-rfc9340 |
| network-stack | kozlowski-2023-rfc9340, dahlberg-2019-linklayer, pompili-2022-stack |
| entanglement-routing | pant-2019-routing, vanmeter-2014-networking |
| network-milestones | wehner-2018-internet, pompili-2021-multinode, knaut-2024-memory |
| distributed-qc | main-2025-distributed, cirac-1999-distributed, gottesman-1999-gate |
| clock-sync | komar-2014-clocks, jozsa-2000-clock |
| quantum-telescopes | gottesman-2012-telescopes, khabiboulline-2019-telescopes |
| distributed-sensing | zhang-2021-distributed, guo-2019-distributed, proctor-2018-networked |
| quantum-sensing | giovannetti-2004-enhanced, degen-2017-sensing |
| shot-noise-limit | giovannetti-2004-enhanced, giovannetti-2011-metrology, degen-2017-sensing |
| ramsey | degen-2017-sensing, ramsey-1950-molecular |
| dynamical-decoupling | degen-2017-sensing, viola-1999-decoupling, hahn-1950-echo |
| heisenberg-limit | giovannetti-2006-metrology, giovannetti-2011-metrology, bollinger-1996-spectroscopy |
| fisher-information | pezze-2018-metrology, braunstein-1994-statistical |
| noise-in-metrology | escher-2011-noisy, demkowicz-2012-elusive, pezze-2018-metrology |
| squeezing | pezze-2018-metrology, caves-1981-interferometer, kitagawa-1993-squeezed |
| ligo | tse-2019-squeezing, ganapathy-2023-squeezing, aasi-2013-squeezed |
| atomic-clocks | bipm-2019-si, ludlow-2015-clocks |
| atom-interferometry | cronin-2009-interferometry, kasevich-1991-interferometry |
| gravimeters | bongs-2019-atomsensors, peters-1999-gravity, stray-2022-gravity |
| inertial-navigation | geiger-2020-inertial, bongs-2019-atomsensors |
| magnetometers | budker-2007-magnetometry, boto-2018-meg, degen-2017-sensing |
| nv-centers | barry-2020-nv, schirhagl-2014-nv, doherty-2013-nv |
| rydberg-sensors | fancher-2021-rydberg, sedlacek-2012-microwave |
| quantum-imaging | moreau-2019-imaging, lemos-2014-undetected, pittman-1995-ghost |
| quantum-illumination | shapiro-2020-illumination, lloyd-2008-illumination, tan-2008-illumination |
| qnd-measurement | clerk-2010-noise, braginsky-1996-qnd, grangier-1998-qnd |
| quantum-standards | bipm-2019-si, klitzing-1980-hall, josephson-1962-tunnelling |
| new-physics-sensing | safronova-2018-newphysics, backes-2021-axions |
| randomness-extraction | ma-2016-qrng, turan-2018-sp80090b, herrero-2017-qrng |
| di-randomness | acin-2016-certified, pironio-2010-random, kavuri-2025-traceable |
| certified-randomness | aaronson-2023-certified, liu-2025-certified |
| divincenzo | divincenzo-2000-physical, nielsen-chuang |
| t1-t2 | krantz-2019-guide, kjaergaard-2020-superconducting |
| noise-sources | muller-2019-tls, paladino-2014-noise, sarovar-2020-crosstalk |
| leakage | miao-2023-leakage, krantz-2019-guide |
| qubit-control | krantz-2019-guide, bruzewicz-2019-ions |
| readout | blais-2021-cqed, walter-2017-readout, bruzewicz-2019-ions |
| connectivity | linke-2017-architectures, chamberland-2020-heavyhex, bluvstein-2022-transport |
| calibration | krantz-2019-guide, motzoi-2009-drag, kelly-2018-optimus |
| superconducting | kjaergaard-2020-superconducting, krantz-2019-guide, clarke-2008-superconducting |
| josephson-junction | krantz-2019-guide, clarke-2008-superconducting, martinis-1985-quantization |
| transmon | koch-2007-transmon, krantz-2019-guide |
| fluxonium | manucharyan-2009-fluxonium, somoroff-2023-coherence |
| circuit-qed | blais-2021-cqed, blais-2004-cqed |
| cryogenics | krinner-2019-cryogenic, kjaergaard-2020-superconducting |
| control-electronics | reilly-2015-interface, krinner-2019-cryogenic |
| trapped-ions | bruzewicz-2019-ions, cirac-1995-ions |
| qccd | kielpinski-2002-architecture, pino-2021-qccd |
| neutral-atoms | henriet-2020-neutral, saffman-2010-rydberg |
| rydberg | saffman-2010-rydberg, jaksch-2000-rydberg |
| atom-arrays | bluvstein-2022-transport, barredo-2016-assembler, manetsch-2024-tweezer |
| photonic | slussarenko-2019-photonic, obrien-2007-optical |
| photon-hardware | eisaman-2011-photon, slussarenko-2019-photonic, psiquantum-2025-platform |
| linear-optics | kok-2007-loqc, knill-2001-linear |
| spin-qubits | burkard-2023-spin, loss-1998-dots |
| silicon-fab | zwerver-2022-manufacturing, george-2024-cmos |
| anyons | nayak-2008-anyons, kitaev-2003-anyons |
| topological | nayak-2008-anyons, microsoft-2025-parity |
| cat-qubits | mirrahimi-2014-cat, putterman-2025-ocelot |
| annealing | hauke-2020-annealing, kadowaki-1998-annealing, johnson-2011-annealing |
| nmr | vandersypen-2005-nmr, vandersypen-2001-shor, nielsen-chuang |
| modality-compare | kjaergaard-2020-superconducting, bruzewicz-2019-ions, henriet-2020-neutral |
| quantum-volume | cross-2019-volume |
| system-metrics | proctor-2024-benchmarking, wack-2021-clops, mckay-2023-layer |
| scaling | bravyi-2022-future, reilly-2015-interface |
| modularity | monroe-2014-modular, awschalom-2021-interconnects, main-2025-distributed |
| nisq | preskill-nisq, bharti-2022-nisq |
| error-mitigation | cai-2023-mitigation, temme-2017-mitigation, kim-2023-utility |
| classical-codes | mackay-2003-itila, nielsen-chuang |
| error-correction | roffe-2019-guide, nielsen-chuang, terhal-2015-qec |
| physical-vs-logical | roffe-2019-guide, fowler-2012-surface, terhal-2015-qec |
| repetition-code | roffe-2019-guide, nielsen-chuang, google-2021-repetition |
| syndrome | roffe-2019-guide, nielsen-chuang, terhal-2015-qec |
| code-distance | devitt-2013-qec, gottesman-1997-thesis, terhal-2015-qec |
| error-discretization | nielsen-chuang, knill-1997-theory, preskill-ph229-notes |
| shor-code | nielsen-chuang, shor-1995-scheme |
| steane-code | nielsen-chuang, steane-1996-codes |
| stabilizers | gottesman-1997-thesis, nielsen-chuang, gottesman-2009-intro |
| five-qubit-code | gottesman-1997-thesis, laflamme-1996-perfect, bennett-1996-mixed |
| css-codes | nielsen-chuang, calderbank-1996-good, steane-1996-multiple |
| subsystem-codes | bacon-2006-subsystem, poulin-2005-subsystem |
| surface-code | fowler-2012-surface, bravyi-1998-boundary, dennis-2002-memory |
| toric-code | kitaev-2003-anyons, dennis-2002-memory |
| repeated-rounds | dennis-2002-memory, fowler-2012-surface, gidney-2021-stim |
| decoders | iolius-2024-decoding, higgott-2023-blossom, bausch-2024-alphaqubit |
| real-time-decoding | google-2024-threshold, skoric-2023-parallel |
| threshold | fowler-2012-surface, google-2024-threshold, aharonov-2008-threshold |
| concatenated-codes | knill-1998-resilient, aliferis-2005-threshold, gottesman-2009-intro |
| fault-tolerance | gottesman-2009-intro, chao-2018-flag, lidar-brun-qec |
| transversal-gates | eastin-2009-transversal, anderson-2014-switching |
| lattice-surgery | litinski-2019-game, horsman-2012-surgery |
| magic-states | bravyi-2005-magic, litinski-2019-magic, gidney-2024-cultivation |
| color-codes | bombin-2006-color, lacroix-2025-color |
| qldpc | breuckmann-2021-ldpc, bravyi-2024-gross, panteleev-2022-ldpc |
| floquet-codes | hastings-2021-floquet |
| biased-noise | bonillaataides-2021-xzzx, putterman-2025-ocelot |
| erasure | wu-2022-erasure, kubica-2023-erasure |
| bosonic-codes | gottesman-2001-gkp, ofek-2016-breakeven, sivak-2023-breakeven |
| correlated-errors | mcewen-2021-cosmic, terhal-2015-qec |
| logical-qubits | google-2024-threshold, bluvstein-2023-logical, paetznick-2024-logical |
| resource-estimation | gidney-2021-rsa, beverland-2022-estimation, gidney-2025-rsa |
| ftqc-architecture | litinski-2019-game, beverland-2022-estimation, yoder-2025-gross |
| error-suppression | viola-1999-decoupling, ezzell-2023-decoupling, motzoi-2009-drag |
| zne | temme-2017-mitigation, li-2017-variational, kandala-2019-mitigation |
| pec | temme-2017-mitigation, vandenberg-2023-pec, cai-2023-mitigation |
| readout-mitigation | bravyi-2021-readout, nation-2021-readout |
| twirling | wallman-2016-twirling, hashim-2021-compiling, cai-2023-mitigation |
| mitigation-zoo | cai-2023-mitigation, huggins-2021-virtual, czarnik-2021-cdr |
| mitigation-limits | takagi-2022-limits, quek-2024-limits, cai-2023-mitigation |
| ft-algorithm-demos | bluvstein-2023-logical, paetznick-2024-logical, reichardt-2024-logical |
| software-stack | chong-2017-stack, javadiabhari-2024-qiskit |
| hello-quantum | abhijith-2022-beginners, qiskit-docs, cirq-docs |
| qiskit | javadiabhari-2024-qiskit, qiskit-docs |
| cirq | cirq-docs, isakov-2021-qsim |
| pennylane | bergholm-2018-pennylane, pennylane-docs |
| qsharp | svore-2018-qsharp, qdk-docs |
| cuda-q | cudaq-docs |
| braket | braket-docs |
| tket | sivarajah-2020-tket |
| sdk-zoo | larose-2019-platforms, smith-2016-quil, killoran-2019-strawberry |
| quantum-languages | heim-2020-languages, bichsel-2020-silq, green-2013-quipper |
| openqasm | cross-2022-openqasm, cross-2017-openqasm |
| qir | qir-spec, mccaskey-2021-mlir |
| simulators | deraedt-2019-simulator, haner-2017-petabyte |
| statevector-sim | deraedt-2019-simulator, haner-2017-petabyte, aer-docs |
| density-matrix-sim | johansson-2013-qutip, aer-docs, nielsen-chuang |
| stabilizer-sim | aaronson-2004-stabilizer, gidney-2021-stim |
| tensor-network-sim | orus-2014-tensor, markov-2008-tensor, tindall-2024-kicked |
| gpu-sim | bayraktar-2023-cuquantum, isakov-2021-qsim, cuquantum-docs |
| open-systems-sim | johansson-2013-qutip, puzzuoli-2023-dynamics |
| gate-synthesis | dawson-2005-solovay, ross-2014-synthesis, vatan-2004-optimal |
| circuit-optimization | nam-2018-optimization, sivarajah-2020-tket |
| pulse-control | alexander-2020-pulse, krantz-2019-guide |
| optimal-control | glaser-2015-control, koch-2022-control, khaneja-2005-grape |
| circuit-cutting | peng-2020-cutting, mitarai-2021-cutting |
| hybrid-loops | cerezo-2021-vqa, bharti-2022-nisq, qiskit-docs |
| qubo | lucas-2014-ising, ocean-docs |
| run-on-hardware | qiskit-docs, braket-docs |
| mitigation-tools | larose-2022-mitiq, qiskit-docs |
| qec-tools | gidney-2021-stim, higgott-2022-pymatching, higgott-2023-blossom |
| resource-estimators | beverland-2022-estimation, harrigan-2024-qualtran, azure-estimator-docs |
| benchmark-tools | lubinski-2023-benchmarks, tomesh-2022-supermarq, quetschlich-2023-mqtbench |
| debugging | huang-2019-assertions, zhao-2020-software |
| hybrid-hpc | alexeev-2024-hpc |
| history | preskill-2021-forty, feynman-1982-simulating, shor-1997-factoring |
| nobel-prizes | wineland-2013-nobel, aspect-1982-bell, martinis-1985-quantization |
| who-builds | kjaergaard-2020-superconducting, bruzewicz-2019-ions, henriet-2020-neutral |
| cloud | devitt-2016-cloud, braket-docs, qdk-docs |
| roadmaps | ibm-roadmap, google-roadmap, darpa-qbi |
| advantage | harrow-2017-supremacy, preskill-2012-crossroads, preskill-nisq |
| sycamore-2019 | arute-2019-supremacy, pednault-2019-sycamore, pan-2022-sycamore |
| ustc-advantage | zhong-2020-photons, wu-2021-zuchongzhi, gao-2025-zuchongzhi |
| utility-2023 | kim-2023-utility, tindall-2024-kicked |
| willow-2024 | google-2024-threshold, morvan-2024-rcs |
| annealing-claims | king-2025-beyond, tindall-2025-dynamics |
| verifiable-advantage | liu-2025-certified, google-2025-echoes |
| classical-pushback | larose-2024-history, pan-2022-sycamore, tindall-2024-kicked |
| use-cases | hoefler-2023-disentangling, dalzell-2023-survey |
| speedup-check | babbush-2021-focus, hoefler-2023-disentangling |
| chemistry-materials | bauer-2020-chemistry, reiher-2017-femoco, lee-2023-evidence |
| optimization-logistics | abbas-2024-optimization, hoefler-2023-disentangling |
| finance | herman-2023-finance, chakrabarti-2021-threshold |
| quantum-ml | biamonte-2017-qml, cerezo-2022-qml, tang-2019-recommendation |
| hype | aaronson-2015-fineprint, hoefler-2023-disentangling, larose-2024-history |
| investment | - |
| national-programs | raymer-2019-nqi, riedel-2017-flagship, knight-2019-uk |
| geopolitics | mosca-2018-ready, raymer-2019-nqi |
| supply-chain | krinner-2019-cryogenic, bravyi-2022-future |
| responsible-quantum | kop-2023-responsible, coenen-2017-rri |
| careers | fox-2020-industry, greinert-2023-workforce, asfaw-2022-education |
| skills | asfaw-2022-education, greinert-2023-workforce, dewolf-notes |
