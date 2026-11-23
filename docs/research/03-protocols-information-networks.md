# Research 03: protocols, information, networks

Slice: Protocols and crypto (`protocols`), plus two new regions: Quantum information (`information`) and Networks and sensing (`networks`).

How to read:

- Existing ids are kept: `teleportation`, `superdense`, `bb84`, `e91`, `qkd`, `rsa`, `post-quantum`.
- Needs may point to other regions (`entanglement`, `bell-states`, `no-cloning`, `mixed-states`, `shor`, `grover`, `decoherence`, `photonic` and so on).
- Proposed Needs changes to existing stops: `bb84` adds `crypto-basics`; `qkd` adds `privacy-amplification`; `rsa` adds `crypto-basics`.
- Protocols are not algorithms. Nothing here goes in `algorithms`.
- N&C = Nielsen and Chuang, "Quantum Computation and Quantum Information". Wilde = "Quantum Information Theory" (2nd ed.). Preskill = Ph219 lecture notes.
- Dated standards facts were checked in November 2026 through web search of NIST, NCSC, ETSI, BSI and ANSSI pages. csrc.nist.gov and wikipedia.org could not be fetched directly from this session, so recheck those rows on csrc.nist.gov before copy ships.

## Protocols and crypto (`protocols`)

| id | Stop | Needs | Level | Scope | Sources |
|---|---|---|---|---|---|
| crypto-basics | Crypto basics: keys, one-time pad, public keys | | Beginner | What a key is, why the one-time pad is perfect but hard to share, and how public-key crypto solved sharing. | Shannon, BSTJ 28 (1949); Katz and Lindell, "Intro to Modern Cryptography" |
| teleportation | Teleportation | bell-states, measurement | Beginner | Move an unknown qubit state using one Bell pair and two classical bits; nothing travels faster than light. | Bennett et al., PRL 70, 1895 (1993); Bouwmeester et al., Nature 390, 575 (1997); N&C 1.3.7 |
| superdense | Superdense coding | bell-states | Beginner | Send two classical bits by sending one qubit, if a Bell pair was shared first. | Bennett and Wiesner, PRL 69, 2881 (1992); N&C 2.3 |
| entanglement-swapping | Entanglement swapping | teleportation | Intermediate | Entangle two qubits that never met by doing a Bell measurement on their partners. | Zukowski et al., PRL 71, 4287 (1993); Pan et al., PRL 80, 3891 (1998) |
| gate-teleportation | Gate teleportation | teleportation, universal | Advanced | Apply a gate by teleporting through a prepared state; the key move in distributed and fault-tolerant computing. | Gottesman and Chuang, Nature 402, 390 (1999); Main et al., Nature (2025) |
| remote-state-prep | Remote state preparation | teleportation | Advanced | Prepare a known state far away with fewer classical bits than teleportation needs. | Bennett et al., PRL 87, 077902 (2001) |
| quantum-one-time-pad | Quantum one-time pad | pauli, mixed-states, crypto-basics | Intermediate | Hide any qubit perfectly with two random key bits by applying random Pauli gates. | Ambainis, Mosca, Tapp, de Wolf, FOCS 2000 |
| bb84 | BB84 | hadamard, measurement, no-cloning, crypto-basics | Beginner | Grow a shared secret key with qubits in two bases, so any spy leaves errors. | Bennett and Brassard, Proc. IEEE ICCSSP (1984); Scarani et al., RMP 81, 1301 (2009) |
| intercept-resend | Catching a spy: error rate (QBER) | bb84 | Beginner | A naive measure-and-resend spy causes about 25% errors in the sifted key; error rate is the alarm. | Bennett and Brassard (1984); Gisin et al., RMP 74, 145 (2002) |
| b92 | B92 | bb84 | Intermediate | A simpler key protocol that uses only two non-orthogonal states. | Bennett, PRL 68, 3121 (1992) |
| six-state | Six-state protocol | bb84, bloch | Intermediate | Use three bases instead of two, which tolerates more noise at a lower sifting rate. | Bruss, PRL 81, 3018 (1998) |
| e91 | E91 | bell-states, bell-test, bb84 | Intermediate | Key from shared Bell pairs, with a CHSH test to check for a spy. | Ekert, PRL 67, 661 (1991) |
| bbm92 | BBM92: entangled BB84 | e91 | Intermediate | BB84 run on Bell pairs; the form most entanglement-based links actually use. | Bennett, Brassard, Mermin, PRL 68, 557 (1992) |
| info-reconciliation | Information reconciliation | intercept-resend | Intermediate | Fix the errors between two raw keys over a public channel (Cascade, LDPC codes) while leaking little. | Brassard and Salvail, Eurocrypt 1993; Pirandola et al., Adv. Opt. Photon. 12, 1012 (2020) |
| privacy-amplification | Privacy amplification | info-reconciliation | Intermediate | Shrink the key with hashing so the spy's partial knowledge drops to almost nothing. | Bennett, Brassard, Crepeau, Maurer, IEEE TIT 41, 1915 (1995); Renner, PhD thesis (2005) |
| authentication | Why QKD still needs authentication | crypto-basics, bb84 | Intermediate | QKD needs an authenticated classical channel, so it needs a short pre-shared key or classical signatures. | Wegman and Carter, JCSS 22 (1981); NCSC QKD white paper |
| qkd | QKD in practice | bb84, privacy-amplification | Intermediate | Real systems: weak laser pulses, detectors, key rate versus distance, and the full key pipeline. | Gisin et al., RMP 74, 145 (2002); Scarani et al., RMP 81 (2009); Pirandola et al. (2020) |
| qkd-hacking | Quantum hacking and side channels | qkd | Intermediate | Real devices leak: photon-number splitting, detector blinding, Trojan horse and timing attacks. | Brassard et al., PRL 85, 1330 (2000); Lydersen et al., Nat. Photon. 4, 686 (2010); Gisin et al., PRA 73, 022320 (2006) |
| decoy-states | Decoy states | qkd-hacking | Intermediate | Mix in pulses of random strength to expose photon-number-splitting attacks on weak lasers. | Hwang, PRL 91, 057901 (2003); Lo, Ma, Chen, PRL 94, 230504 (2005); Wang, PRL 94, 230503 (2005) |
| mdi-qkd | Measurement-device-independent QKD | decoy-states, entanglement-swapping, bell-measurement | Advanced | Let an untrusted middle station do the measuring, which removes all detector attacks. | Lo, Curty, Qi, PRL 108, 130503 (2012); Braunstein and Pirandola, PRL 108, 130502 (2012) |
| twin-field | Twin-field QKD | mdi-qkd, repeaterless-bound, interference | Advanced | Single-photon interference in the middle beats the repeaterless rate limit; shown over 1002 km of fiber. | Lucamarini et al., Nature 557, 400 (2018); Liu et al., PRL 130, 210801 (2023) |
| di-qkd | Device-independent QKD | e91, qkd-hacking, self-testing | Advanced | Security from a Bell violation alone, with no trust in the boxes; first lab demos in 2022. | Acin et al., PRL 98, 230501 (2007); Nadlinger et al., Nature 607, 682 (2022); Zhang et al., Nature 607, 687 (2022) |
| cv-qkd | Continuous-variable QKD | qkd, noise-models | Advanced | Encode keys in the amplitude and phase of light and read them with telecom-style coherent detectors. | Grosshans and Grangier, PRL 88, 057902 (2002); Pirandola et al. (2020) |
| qkd-security-proofs | QKD security proofs | privacy-amplification, one-shot-entropies, entropic-uncertainty | Advanced | How "secure" is proven: Shor-Preskill, GLLP for real sources, composable and finite-key security. | Shor and Preskill, PRL 85, 441 (2000); Tomamichel et al., Nat. Commun. 3, 634 (2012); Portmann and Renner, RMP 94, 025008 (2022) |
| qkd-standards | QKD standards and certification | qkd | Intermediate | Who writes the rules: ETSI QKD specs (key delivery API GS QKD 014, 2019), ITU-T Y.3800 (2019), ISO/IEC 23837 (2023). | ETSI GS QKD 014 v1.1.1 (2019); ITU-T Y.3800 (2019); ISO/IEC 23837-1 and -2 (2023) |
| qkd-vs-pqc | QKD or PQC? What agencies say | qkd, post-quantum | Intermediate | NSA, NCSC, BSI and ANSSI prefer post-quantum crypto and see QKD as niche; why, and the counter-arguments. | NSA, QKD statement (2020); NCSC QKD white paper; ANSSI, BSI, NLNCSA, Sweden position paper (Jan 2024) |
| conference-key | Conference key agreement | ghz, e91 | Advanced | Give one shared key to many parties at once using GHZ states. | Murta et al., Adv. Quantum Technol. 3, 2000025 (2020) |
| secret-sharing | Quantum secret sharing | ghz, crypto-basics | Advanced | Split a secret, classical or quantum, so only enough parties together can rebuild it. | Hillery, Buzek, Berthiaume, PRA 59, 1829 (1999); Cleve, Gottesman, Lo, PRL 83, 648 (1999) |
| quantum-money | Quantum money | no-cloning, bb84 | Intermediate | Wiesner's bank notes that cannot be copied, and why public-key quantum money is much harder. | Wiesner, SIGACT News 15, 78 (1983); Aaronson and Christiano, STOC 2012; Molina, Vidick, Watrous, TQC 2012 |
| unclonable-crypto | Unclonable cryptography | quantum-money | Advanced | Copy protection, unclonable encryption and quantum lightning: crypto that only no-cloning makes possible. | Aaronson, CCC 2009; Zhandry, Eurocrypt 2019; Broadbent and Lord, TQC 2020 |
| bit-commitment | Bit commitment and why it fails | schmidt, crypto-basics | Advanced | Unconditionally secure quantum bit commitment is impossible; the purification attack shows why. | Mayers, PRL 78, 3414 (1997); Lo and Chau, PRL 78, 3410 (1997) |
| coin-flipping | Quantum coin flipping | bit-commitment | Advanced | Weak coin flipping can have bias as small as you like; strong coin flipping has Kitaev's 1/sqrt(2) cheating limit. | Kitaev, QIP 2003 talk; Mochon, arXiv:0711.4114 (2007); Chailloux and Kerenidis, FOCS 2009 |
| oblivious-transfer | Oblivious transfer and noisy storage | bit-commitment | Advanced | Two-party secure computation fails in general, but works if the cheater's quantum memory is small or noisy. | Lo, PRA 56, 1154 (1997); Damgard et al., FOCS 2005; Wehner, Schaffner, Terhal, PRL 100, 220502 (2008) |
| position-verification | Position-based quantum crypto | teleportation, no-cloning | Advanced | Prove where you are with light-speed timing; general schemes fall to attackers who share entanglement. | Kent, Munro, Spiller, PRA 84, 012326 (2011); Buhrman et al., CRYPTO 2011 |
| digital-signatures | Quantum digital signatures | no-cloning, state-discrimination | Advanced | Sign messages with quantum states for security without math assumptions; one-time use. | Gottesman and Chuang, quant-ph/0105032 (2001); Amiri et al., PRA 93, 032325 (2016) |
| blind-qc | Blind (delegated) quantum computing | teleportation, universal, quantum-one-time-pad | Advanced | Run a program on a remote quantum server that learns nothing about input, program or output. | Broadbent, Fitzsimons, Kashefi, FOCS 2009; Barz et al., Science 335, 303 (2012); Fitzsimons, npj QI 3, 23 (2017) |
| verifiable-qc | Verifying a quantum computer's answer | blind-qc | Advanced | How a weak client checks a quantum server, including Mahadev's fully classical verification. | Fitzsimons and Kashefi, PRA 96, 012303 (2017); Mahadev, FOCS 2018; Gheorghiu et al., Theory Comput. Syst. (2019) |
| fingerprinting | Quantum fingerprinting | multi-qubit, interference | Advanced | Compare two big files by sending exponentially shorter quantum fingerprints; a taste of communication complexity. | Buhrman, Cleve, Watrous, de Wolf, PRL 87, 167902 (2001) |
| rsa | Why RSA and ECC are at risk | shor, crypto-basics | Intermediate | Shor's algorithm factors and takes discrete logs, which breaks RSA, Diffie-Hellman and elliptic curves. | Shor, SIAM J. Comput. 26, 1484 (1997); Roetteler et al., Asiacrypt 2017 |
| q-day | Q-Day: how big a machine breaks RSA? | rsa, logical-qubits | Intermediate | Resource estimates over time: 20 million noisy qubits (2019) to under one million (2025) for RSA-2048. | Gidney and Ekera, Quantum 5, 433 (2021); Gidney, arXiv:2505.15917 (2025); Google et al., arXiv:2603.28846 (2026, ECC) |
| hndl | Harvest now, decrypt later | rsa | Beginner | Data recorded today can be read once a big machine exists; Mosca's x + y > z says when to worry. | Mosca, IEEE Security and Privacy 16(5) (2018); NCSC PQC migration guidance |
| grover-symmetric | Grover and symmetric crypto | grover, crypto-basics | Intermediate | Grover gives only a square-root speedup on AES and hashes, so symmetric crypto needs at most bigger keys. | Grassl et al., PQCrypto 2016; Jaques et al., Eurocrypt 2020; NIST IR 8547 (2026) |
| simon-attacks | Quantum attacks on symmetric modes | simon, grover-symmetric | Advanced | Simon's algorithm breaks some MAC and cipher modes if the attacker can query them in superposition. | Kaplan et al., CRYPTO 2016 |
| post-quantum | Post-quantum crypto | rsa | Intermediate | Classical algorithms built on problems quantum computers are not known to solve: lattices, codes, hashes. | Bernstein and Lange, Nature 549, 188 (2017); NIST PQC project |
| lattice-crypto | Lattice crypto (LWE) | post-quantum | Intermediate | Learning with errors: hide a secret under small noise; the math behind ML-KEM, ML-DSA and FN-DSA. | Regev, STOC 2005; NIST FIPS 203 and 204 (2024) |
| ml-kem | ML-KEM (FIPS 203) | lattice-crypto | Intermediate | NIST's main post-quantum key exchange, from CRYSTALS-Kyber, published 13 August 2024. | NIST FIPS 203 (Aug 2024); NIST IR 8547 (2026) |
| ml-dsa | ML-DSA (FIPS 204) | lattice-crypto | Intermediate | NIST's main post-quantum signature, from CRYSTALS-Dilithium, published 13 August 2024. | NIST FIPS 204 (Aug 2024) |
| fn-dsa | FN-DSA (draft FIPS 206) | lattice-crypto | Advanced | Falcon-based signatures with small size but tricky floating-point math; still a draft in late 2026. | NIST FIPS 206 talk (2025); NIST pqc-forum "FIPS 206 status update" |
| hash-signatures | Hash-based signatures | post-quantum | Intermediate | Signatures from hash functions only: stateless SLH-DSA (FIPS 205, 2024) and stateful LMS and XMSS. | NIST FIPS 205 (Aug 2024); NIST SP 800-208 (2020); Lamport (1979) |
| code-crypto | Code-based crypto (McEliece, HQC) | post-quantum | Intermediate | Hide a message as a noisy codeword; NIST picked HQC as backup KEM on 11 March 2025, final standard expected 2027. | McEliece, DSN Report 42-44 (1978); NIST news, HQC selection (Mar 2025) |
| other-pqc | Other families and broken candidates | post-quantum | Advanced | Multivariate and isogeny schemes, the SIKE and Rainbow breaks of 2022, and NIST's extra signature round. | Castryck and Decru, Eurocrypt 2023; Beullens, CRYPTO 2022; NIST news, 3rd-round signature on-ramp (May 2026) |
| hybrid-crypto | Hybrid key exchange | ml-kem | Intermediate | Pair classical and post-quantum (for example X25519MLKEM768 in TLS 1.3) so both must break; over half of human traffic at Cloudflare used it by late 2025. | Cloudflare blog, "State of the post-quantum Internet in 2025"; Apple PQ3 (2024); Signal PQXDH (2023) |
| crypto-agility | Crypto agility and inventory | crypto-basics | Beginner | Know where your crypto is and build systems that can swap algorithms fast. | NIST CSWP 39 (Dec 2025); NIST NCCoE SP 1800-38 |
| pqc-migration | Migration timelines | hndl, crypto-agility, post-quantum | Beginner | Official deadlines: NIST deprecates RSA and ECC after 2030, disallows after 2035; NCSC 2028, 2031, 2035; EU 2026, 2030, 2035. | NIST IR 8547 (final, Oct 2026); NCSC PQC migration timelines; EU PQC roadmap (Jun 2025) |
| crypto-coins | Blockchains and the quantum threat | rsa, hash-signatures | Intermediate | Why exposed public keys on Bitcoin and Ethereum are at risk, and what fixes are proposed. | Aggarwal et al., Ledger 3 (2018); Google et al., arXiv:2603.28846 (2026) |

## Quantum information (`information`)

New region. The math of what qubits can hold, send and share.

| id | Stop | Needs | Level | Scope | Sources |
|---|---|---|---|---|---|
| partial-trace | Partial trace and reduced states | mixed-states, entanglement | Intermediate | How to describe one part of an entangled system: it looks mixed even if the whole is pure. | N&C 2.4.3; Preskill ch. 2 |
| schmidt | Schmidt decomposition and purification | partial-trace | Intermediate | Any pure two-part state has a simple Schmidt form, and any mixed state is part of a bigger pure one. | N&C 2.5; Preskill ch. 2 |
| povm | Generalized measurements (POVMs) | measurement, mixed-states | Intermediate | Measurements beyond projections, with more outcomes than dimensions. | N&C 2.2.6; Preskill ch. 3 |
| no-go-theorems | No-signalling, no-deleting, no-broadcasting | no-cloning, partial-trace | Intermediate | The family of "you cannot" rules around no-cloning, and why entanglement cannot send messages. | Barnum et al., PRL 76, 2818 (1996); Pati and Braunstein, Nature 404, 164 (2000) |
| trace-distance | Trace distance | mixed-states | Intermediate | How far apart two states are, measured by the best chance to tell them apart in one shot. | N&C 9.2.1; Wilde ch. 9 |
| fidelity | Fidelity | mixed-states | Intermediate | How close two states are, the number every experiment reports. | Uhlmann, Rep. Math. Phys. 9, 273 (1976); Jozsa, J. Mod. Opt. 41, 2315 (1994); N&C 9.2.2 |
| state-discrimination | Telling states apart | povm, trace-distance | Intermediate | Best guess (Helstrom) and never-wrong-but-sometimes-unsure (unambiguous) state discrimination. | Helstrom, "Quantum Detection and Estimation Theory" (1976); Barnett and Croke, Adv. Opt. Photon. 1, 238 (2009) |
| hypothesis-testing | Quantum hypothesis testing | state-discrimination, entropy-family | Advanced | With many copies, errors drop at rates set by relative entropy (Stein) and the Chernoff bound. | Hiai and Petz, CMP 143, 99 (1991); Audenaert et al., PRL 98, 160501 (2007) |
| shannon-entropy | Shannon entropy: what a bit measures | measurement | Beginner | Entropy as surprise and as the shortest possible code; the classical base for everything here. | Shannon, BSTJ 27 (1948); Cover and Thomas, "Elements of Information Theory" |
| von-neumann-entropy | Von Neumann entropy | shannon-entropy, mixed-states | Intermediate | Entropy of a quantum state from its eigenvalues; zero for pure states, also measures entanglement. | von Neumann (1932); N&C 11.3; Preskill ch. 10 |
| entropy-family | Relative, conditional and mutual information | von-neumann-entropy, partial-trace | Advanced | The entropy toolkit, including quantum conditional entropy that can go negative. | Wilde ch. 11; Horodecki, Oppenheim, Winter, Nature 436, 673 (2005) |
| strong-subadditivity | Strong subadditivity | entropy-family | Advanced | The key entropy inequality behind most quantum Shannon theory proofs. | Lieb and Ruskai, J. Math. Phys. 14, 1938 (1973); N&C 11.4 |
| data-processing | Data processing inequality | entropy-family, quantum-channels | Advanced | Processing can never increase information or distinguishability. | Lindblad, CMP 40, 147 (1975); Uhlmann, CMP 54, 21 (1977); Wilde |
| one-shot-entropies | Min- and max-entropy | entropy-family | Advanced | Entropies for a single use, not the long run; they set finite key lengths and random bit yields. | Renner, PhD thesis (2005); Tomamichel, "Quantum Information Processing with Finite Resources" (2016) |
| entropic-uncertainty | Entropic uncertainty relations | von-neumann-entropy, measurement | Advanced | Uncertainty stated with entropy, with and without a quantum memory; a core tool in QKD proofs. | Maassen and Uffink, PRL 60, 1103 (1988); Berta et al., Nat. Phys. 6, 659 (2010); Coles et al., RMP 89, 015002 (2017) |
| quantum-channels | Quantum channels | mixed-states, partial-trace | Intermediate | Any physical process on a state as a CPTP map written with Kraus operators. | N&C 8.2; Preskill ch. 3; Wilde ch. 4 |
| noise-models | Noise models | quantum-channels, bloch | Intermediate | Bit flip, phase flip, depolarizing, amplitude damping, dephasing and erasure, seen on the Bloch sphere. | N&C 8.3; Preskill ch. 3 |
| stinespring-choi | Stinespring dilation and Choi states | quantum-channels, schmidt | Advanced | Every channel is a unitary on a bigger system, and every channel matches one state. | Stinespring, Proc. AMS 6, 211 (1955); Choi, Lin. Alg. Appl. 10, 285 (1975); Watrous, "Theory of Quantum Information" (2018) |
| open-systems | Open systems and the Lindblad equation | quantum-channels, decoherence | Advanced | Continuous-time noise: the master equation behind T1 and T2. | Lindblad, CMP 48, 119 (1976); Gorini, Kossakowski, Sudarshan, J. Math. Phys. 17, 821 (1976) |
| holevo-bound | Holevo bound | von-neumann-entropy, povm | Intermediate | n qubits can carry at most n classical bits, even though a state needs many numbers to describe. | Holevo, Probl. Peredachi Inf. 9, 3 (1973); N&C 12.1 |
| random-access-codes | Quantum random access codes | holevo-bound | Advanced | Pack several bits into one qubit so any one can be read with good odds, and the Nayak limit. | Ambainis, Nayak, Ta-Shma, Vazirani, STOC 1999; Nayak, FOCS 1999 |
| schumacher | Schumacher compression | von-neumann-entropy | Advanced | Quantum data compresses down to its von Neumann entropy in qubits. | Schumacher, PRA 51, 2738 (1995); N&C 12.2 |
| classical-capacity | Classical capacity (HSW) | holevo-bound, quantum-channels | Advanced | How many bits per use a noisy quantum channel can carry. | Holevo, IEEE TIT 44, 269 (1998); Schumacher and Westmoreland, PRA 56, 131 (1997) |
| quantum-capacity | Quantum capacity | entropy-family, quantum-channels | Advanced | How many qubits per use survive a channel, given by coherent information (LSD theorem). | Lloyd, PRA 55, 1613 (1997); Devetak, IEEE TIT 51, 44 (2005); Wilde ch. 24 |
| ea-capacity | Entanglement-assisted capacity | quantum-capacity, superdense | Advanced | Free shared entanglement raises classical capacity and gives a simple formula. | Bennett, Shor, Smolin, Thapliyal, IEEE TIT 48, 2637 (2002) |
| private-capacity | Private and secret-key capacity | quantum-capacity | Advanced | The best rate of secret bits a channel allows; the theory under QKD rate limits. | Devetak, IEEE TIT 51, 44 (2005); Cai, Winter, Yeung, Probl. Inf. Transm. 40 (2004) |
| superactivation | Superadditivity and superactivation | quantum-capacity, private-capacity | Advanced | Two channels with zero quantum capacity can carry qubits together; capacities do not simply add. | Smith and Yard, Science 321, 1812 (2008); Hastings, Nat. Phys. 5, 255 (2009) |
| locc | LOCC | teleportation, partial-trace | Intermediate | What distant labs can do with local operations and phone calls, and which state changes are possible. | Nielsen, PRL 83, 436 (1999); Chitambar et al., CMP 328, 303 (2014) |
| separability | Separable or entangled? | partial-trace, mixed-states | Intermediate | Tests for entanglement: the PPT (Peres-Horodecki) test and entanglement witnesses. | Peres, PRL 77, 1413 (1996); Horodecki et al., PLA 223, 1 (1996); Guhne and Toth, Phys. Rep. 474, 1 (2009) |
| entanglement-measures | Entanglement measures | schmidt, von-neumann-entropy, separability | Advanced | Ways to put a number on entanglement: entropy of entanglement, concurrence, negativity, distillable, squashed. | Wootters, PRL 80, 2245 (1998); Vidal and Werner, PRA 65, 032314 (2002); Plenio and Virmani, QIC 7, 1 (2007) |
| entanglement-distillation | Entanglement distillation | locc, fidelity | Advanced | Turn many noisy Bell pairs into fewer good ones; a key part of quantum repeaters. | Bennett et al., PRL 76, 722 (1996); Deutsch et al., PRL 77, 2818 (1996) |
| bound-entanglement | Bound entanglement | separability, entanglement-distillation | Advanced | Entangled states from which no pure Bell pair can ever be distilled. | Horodecki et al., PRL 80, 5239 (1998); Horodecki et al., RMP 81, 865 (2009) |
| monogamy | Monogamy of entanglement | entanglement-measures | Intermediate | If A is fully entangled with B, A cannot be entangled with C; the root of QKD security. | Coffman, Kundu, Wootters, PRA 61, 052306 (2000); Osborne and Verstraete, PRL 96, 220503 (2006) |
| multipartite | Entanglement of many parties | entanglement, separability | Intermediate | Three qubits can be entangled in two different ways (GHZ and W) that cannot turn into each other. | Dur, Vidal, Cirac, PRA 62, 062314 (2000) |
| ghz | GHZ states and the GHZ paradox | bell-test, multipartite | Intermediate | Three-qubit GHZ states beat local realism in one shot, not just on average. | Greenberger et al., Am. J. Phys. 58, 1131 (1990); Mermin, PRL 65, 1838 (1990); Pan et al., Nature 403, 515 (2000) |
| tsirelson | Tsirelson bound and PR boxes | bell-test | Intermediate | Quantum CHSH tops out at 2 sqrt(2); why nature is not even more nonlocal is still asked. | Cirel'son, Lett. Math. Phys. 4, 93 (1980); Popescu and Rohrlich, Found. Phys. 24, 379 (1994); Brunner et al., RMP 86, 419 (2014) |
| steering | EPR steering | bell-test, separability | Advanced | A form of nonlocality between entanglement and Bell violation: one side steers the other's state. | Wiseman, Jones, Doherty, PRL 98, 140402 (2007); Uola et al., RMP 92, 015001 (2020) |
| contextuality | Contextuality | bell-test | Advanced | Results cannot be fixed in advance even for one system (Kochen-Specker, Peres-Mermin square). | Kochen and Specker, J. Math. Mech. 17, 59 (1967); Budroni et al., RMP 94, 045007 (2022); Howard et al., Nature 510, 351 (2014) |
| self-testing | Self-testing | tsirelson | Advanced | A maximal Bell violation proves which state and measurements were used, with no trust in devices. | Mayers and Yao, QIC 4, 273 (2004); Supic and Bowles, Quantum 4, 337 (2020) |
| discord | Quantum discord | entropy-family, separability | Advanced | Quantum-flavored correlations that can exist even without entanglement. | Ollivier and Zurek, PRL 88, 017901 (2001); Modi et al., RMP 84, 1655 (2012) |
| resource-theories | Resource theories | locc, entanglement-measures | Advanced | One framework for "what is free and what is costly": entanglement, coherence, magic, heat. | Chitambar and Gour, RMP 91, 025001 (2019) |
| coherence-resource | Coherence as a resource | resource-theories | Advanced | Measure superposition itself as fuel for quantum tasks. | Baumgratz, Cramer, Plenio, PRL 113, 140401 (2014); Streltsov, Adesso, Plenio, RMP 89, 041003 (2017) |
| magic | Magic (non-stabilizerness) | resource-theories, universal | Advanced | Clifford circuits are easy to simulate; "magic" T-type states are the resource that makes computing hard. | Bravyi and Kitaev, PRA 71, 022316 (2005); Veitch et al., NJP 16, 013009 (2014) |
| quantum-thermo | Quantum thermodynamics | resource-theories, von-neumann-entropy | Advanced | Information has a heat cost (Landauer), and quantum rules change the laws for small engines. | Landauer, IBM J. Res. Dev. 5, 183 (1961); Brandao et al., PRL 111, 250404 (2013); Goold et al., J. Phys. A 49, 143001 (2016) |
| state-tomography | State tomography | measurement, mixed-states, pauli | Intermediate | Rebuild a state from many measurements in different bases. | James et al., PRA 64, 052312 (2001); N&C 8.4.2 |
| process-tomography | Process tomography | state-tomography, quantum-channels | Advanced | Rebuild a whole gate or channel by feeding in known states. | Chuang and Nielsen, J. Mod. Opt. 44, 2455 (1997); Poyatos, Cirac, Zoller, PRL 78, 390 (1997) |
| gate-set-tomography | Gate set tomography | process-tomography | Advanced | Self-consistent tomography that does not trust its own state prep or measurement. | Blume-Kohout et al., Nat. Commun. 8, 14485 (2017); Nielsen et al., Quantum 5, 557 (2021) |
| randomized-benchmarking | Randomized benchmarking | fidelity, noise-models | Intermediate | Average gate error from random gate sequences, robust to state prep and measurement errors. | Knill et al., PRA 77, 012307 (2008); Magesan, Gambetta, Emerson, PRL 106, 180504 (2011) |
| classical-shadows | Classical shadows | state-tomography | Advanced | Predict many properties from few random measurements, without full tomography. | Aaronson, STOC 2018; Huang, Kueng, Preskill, Nat. Phys. 16, 1050 (2020) |
| certification | Certifying quantum devices | fidelity, state-tomography | Advanced | Direct fidelity estimation, witnesses and benchmarks to check a device does what it claims. | Flammia and Liu, PRL 106, 230501 (2011); Eisert et al., Nat. Rev. Phys. 2, 382 (2020) |

## Networks and sensing (`networks`)

New region. Rows run: network parts, networks, sensing, randomness.

| id | Stop | Needs | Level | Scope | Sources |
|---|---|---|---|---|---|
| flying-qubits | Photons as flying qubits | qubit, photonic | Beginner | Why photons carry qubits between places, and the codes used: polarization, time-bin, frequency. | Gisin and Thew, Nat. Photon. 1, 165 (2007); Kok et al., RMP 79, 135 (2007) |
| fiber-loss | Loss: why light fades | flying-qubits, no-cloning | Beginner | Fiber loses photons with every kilometer, and no-cloning forbids a quantum amplifier. | Gisin et al., RMP 74, 145 (2002); Liu et al., PRL 130, 210801 (2023) |
| repeaterless-bound | The repeaterless bound | fiber-loss | Intermediate | Without repeaters, secret key rate falls with fiber transmission (about 1.44 bits times transmissivity at high loss). | Pirandola et al., Nat. Commun. 8, 15043 (2017); Takeoka, Guha, Wilde, Nat. Commun. 5, 5235 (2014) |
| photon-sources | Single-photon and pair sources | flying-qubits | Intermediate | Making one photon at a time or entangled pairs: SPDC crystals, quantum dots, atoms. | Eisaman et al., Rev. Sci. Instrum. 82, 071101 (2011); Senellart, Solomon, White, Nat. Nanotech. 12, 1026 (2017) |
| photon-detectors | Single-photon detectors | flying-qubits | Intermediate | Avalanche diodes and superconducting nanowires: efficiency, dark counts, dead time. | Hadfield, Nat. Photon. 3, 696 (2009); Eisaman et al. (2011) |
| hom | Hong-Ou-Mandel effect | interference, flying-qubits | Intermediate | Two identical photons on a beam splitter always leave together; the test for identical photons. | Hong, Ou, Mandel, PRL 59, 2044 (1987) |
| bell-measurement | Bell measurement with photons | hom, bell-states | Intermediate | Linear optics can only tell apart 2 of the 4 Bell states, so success is at most 50%. | Calsamiglia and Lutkenhaus, Appl. Phys. B 72, 67 (2001) |
| heralded-entanglement | Heralded entanglement | bell-measurement, entanglement-swapping | Advanced | Entangle two distant matter qubits and get a signal saying when it worked. | Moehring et al., Nature 449, 68 (2007); Bernien et al., Nature 497, 86 (2013); Hensen et al., Nature 526, 682 (2015) |
| entanglement-distribution | Entanglement distribution | bell-states, fiber-loss | Intermediate | Sending halves of Bell pairs through fiber, open air and space. | Ursin et al., Nat. Phys. 3, 481 (2007); Yin et al., Science 356, 1140 (2017) |
| satellites | Quantum satellites | entanglement-distribution, qkd | Intermediate | Micius (launched 2016) sent entangled photons to stations 1200 km apart; Jinan-1 made a 12,900 km key in 2025. | Yin et al., Science 356, 1140 (2017); Liao et al., PRL 120, 030501 (2018); Jinan-1, Nature (Mar 2025) |
| trusted-nodes | Trusted-node QKD networks | qkd | Intermediate | Today's long QKD networks chain short links through relay stations that must be trusted. | Peev et al., NJP 11, 075001 (2009); Chen et al., Nature 589, 214 (2021); NSA QKD statement (2020) |
| quantum-memories | Quantum memories | flying-qubits, decoherence | Intermediate | Store a photon's qubit and release it on demand; judged by efficiency, time, fidelity and modes. | Lvovsky, Sanders, Tittel, Nat. Photon. 3, 706 (2009); Heshami et al., J. Mod. Opt. 63, 2005 (2016) |
| frequency-conversion | Frequency conversion and transduction | flying-qubits, superconducting | Advanced | Shift photons to telecom colors, and convert microwave qubits from superconducting chips to light. | Kumar, Opt. Lett. 15, 1476 (1990); Lauk et al., Quantum Sci. Technol. 5, 020501 (2020) |
| repeaters | Quantum repeaters | entanglement-swapping, entanglement-distillation, quantum-memories, repeaterless-bound | Advanced | Beat loss by chaining swaps and distillation; three generations, up to all-photonic designs. | Briegel et al., PRL 81, 5932 (1998); Duan et al., Nature 414, 413 (2001); Azuma et al., RMP 95, 045006 (2023) |
| quantum-internet | Stages of the quantum internet | entanglement-distribution, teleportation, quantum-memories | Beginner | Six stages from trusted-repeater networks to quantum computing networks, and what each unlocks. | Wehner, Elkouss, Hanson, Science 362, eaam9288 (2018); Kimble, Nature 453, 1023 (2008) |
| network-stack | Quantum network stack | quantum-internet, heralded-entanglement | Advanced | Layers and protocols for quantum networks, like the internet's TCP/IP stack. | Dahlberg et al., SIGCOMM 2019; Pompili et al., npj QI 8, 121 (2022); IETF RFC 9340 (2023) |
| entanglement-routing | Entanglement routing | network-stack, repeaters | Advanced | Choosing paths and swap order to deliver Bell pairs across a mesh network. | Pant et al., npj QI 5, 25 (2019); Van Meter, "Quantum Networking" (2014) |
| network-milestones | Network milestones | trusted-nodes, heralded-entanglement | Beginner | Key firsts: DARPA network (2003), Delft three-node network (2021), Boston 35 km memory link (2024). | Elliott et al., quant-ph/0503058 (2005); Pompili et al., Science 372, 259 (2021); Knaut et al., Nature 629, 573 (2024) |
| distributed-qc | Distributed quantum computing | gate-teleportation, heralded-entanglement | Advanced | Link small quantum processors into one bigger machine with teleported gates. | Cirac et al., PRA 59, 4249 (1999); Main et al., Nature (Feb 2025) |
| clock-sync | Quantum clock networks | entanglement-distribution, atomic-clocks | Advanced | Use shared entanglement to sync and combine distant clocks. | Jozsa et al., PRL 85, 2010 (2000); Komar et al., Nat. Phys. 10, 582 (2014) |
| quantum-telescopes | Entangled telescopes | entanglement-distribution, quantum-memories | Advanced | Join far-apart telescopes with shared entanglement for sharper images. | Gottesman, Jennewein, Croke, PRL 109, 070503 (2012); Khabiboulline et al., PRL 123, 070504 (2019) |
| distributed-sensing | Distributed quantum sensing | entanglement-distribution, heisenberg-limit | Advanced | Entangle sensors at many sites to measure a shared signal better. | Zhang and Zhuang, Quantum Sci. Technol. 6, 043001 (2021); Guo et al., Nat. Phys. 16, 281 (2020) |
| quantum-sensing | What is quantum sensing | superposition, measurement | Beginner | Using fragile quantum states as super-sensitive probes; the three types of quantum sensor. | Degen, Reinhard, Cappellaro, RMP 89, 035002 (2017) |
| interaction-free | Interaction-free measurement | interference, measurement | Beginner | The Elitzur-Vaidman bomb test: learn something is there without a photon touching it. | Elitzur and Vaidman, Found. Phys. 23, 987 (1993); Kwiat et al., PRL 74, 4763 (1995) |
| shot-noise-limit | Standard quantum limit (shot noise) | measurement, quantum-sensing | Beginner | With N independent probes, error shrinks like 1 over square root of N. | Giovannetti, Lloyd, Maccone, Science 306, 1330 (2004); Nat. Photon. 5, 222 (2011) |
| ramsey | Ramsey interferometry | phase, interference, quantum-sensing | Intermediate | Two pulses with a wait between turn a tiny energy shift into a phase you can read. | Ramsey, Phys. Rev. 78, 695 (1950); Degen et al. (2017) |
| dynamical-decoupling | Spin echo and dynamical decoupling | ramsey, decoherence | Intermediate | Flip the qubit at set times to cancel slow noise and tune into AC signals. | Hahn, Phys. Rev. 80, 580 (1950); Viola, Knill, Lloyd, PRL 82, 2417 (1999) |
| heisenberg-limit | Heisenberg limit | shot-noise-limit, ghz | Intermediate | Entangled probes (GHZ, NOON) can reach error 1 over N, the ultimate scaling. | Bollinger et al., PRA 54, R4649 (1996); Giovannetti, Lloyd, Maccone, PRL 96, 010401 (2006) |
| fisher-information | Quantum Fisher information | heisenberg-limit, fidelity | Advanced | The number that sets the best possible precision (quantum Cramer-Rao bound). | Braunstein and Caves, PRL 72, 3439 (1994); Pezze et al., RMP 90, 035005 (2018) |
| noise-in-metrology | Noise and the limits of quantum gain | fisher-information, noise-models | Advanced | With realistic noise, entanglement gives a constant factor gain, not full Heisenberg scaling. | Escher et al., Nat. Phys. 7, 406 (2011); Demkowicz-Dobrzanski et al., Nat. Commun. 3, 1063 (2012) |
| squeezing | Squeezed light and spin squeezing | shot-noise-limit | Intermediate | Push noise out of the quantity you measure and into one you ignore. | Caves, Phys. Rev. D 23, 1693 (1981); Kitagawa and Ueda, PRA 47, 5138 (1993) |
| ligo | Squeezing in LIGO | squeezing | Intermediate | LIGO has used squeezed light in its runs since 2019, and frequency-dependent squeezing since 2023. | LIGO, Nat. Photon. 7, 613 (2013); Tse et al., PRL 123, 231107 (2019); Ganapathy et al., PRX 13, 041021 (2023) |
| atomic-clocks | Atomic clocks | ramsey | Beginner | The second is set by cesium; optical clocks are now better, can sense height, and may redefine the second (decision planned for 2030). | Ludlow et al., RMP 87, 637 (2015); BIPM SI Brochure (2019); BIPM FAQ on redefinition of the second |
| atom-interferometry | Atom interferometry | interference, quantum-sensing | Intermediate | Split an atom's wave and rejoin it to measure gravity, rotation and acceleration. | Kasevich and Chu, PRL 67, 181 (1991); Cronin, Schmiedmayer, Pritchard, RMP 81, 1051 (2009) |
| gravimeters | Quantum gravimeters and gradiometers | atom-interferometry | Intermediate | Atom-based gravity sensors that find things underground. | Peters, Chung, Chu, Nature 400, 849 (1999); Stray et al., Nature 602, 590 (2022) |
| inertial-navigation | Quantum navigation | atom-interferometry | Intermediate | Cold-atom accelerometers and gyroscopes for navigation without GPS; first flight trials in 2024 and 2025. | Geiger et al., AVS Quantum Sci. 2, 024702 (2020); Boeing flight test report (Mar 2025); UKRI flight trial news (2025) |
| magnetometers | Quantum magnetometers | ramsey | Intermediate | SQUIDs and optically pumped atom sensors that read tiny magnetic fields, such as from the brain. | Budker and Romalis, Nat. Phys. 3, 227 (2007); Boto et al., Nature 555, 657 (2018) |
| nv-centers | NV centers in diamond | magnetometers, spin-qubits | Intermediate | A defect in diamond that senses fields at room temperature, down to the nanoscale, read with light. | Doherty et al., Phys. Rep. 528, 1 (2013); Schirhagl et al., Annu. Rev. Phys. Chem. 65, 83 (2014); Barry et al., RMP 92, 015004 (2020) |
| rydberg-sensors | Rydberg atom radio sensors | quantum-sensing, neutral-atoms | Advanced | Giant excited atoms in a glass cell act as calibrated antennas for electric fields and radio. | Sedlacek et al., Nat. Phys. 8, 819 (2012); Fancher et al., IEEE TQE 2 (2021) |
| quantum-imaging | Quantum imaging | entanglement, shot-noise-limit | Advanced | Ghost imaging, sub-shot-noise images, and imaging with photons that never hit the camera. | Pittman et al., PRA 52, R3429 (1995); Lemos et al., Nature 512, 409 (2014); Moreau et al., Nat. Rev. Phys. 1, 367 (2019) |
| quantum-illumination | Quantum illumination and "quantum radar" | entanglement, noise-models | Advanced | Entanglement helps spot a faint target in loud noise, but gains are small and radar claims are mostly hype. | Lloyd, Science 321, 1463 (2008); Tan et al., PRL 101, 253601 (2008); Barzanjeh et al., Sci. Adv. 6, eabb0451 (2020) |
| qnd-measurement | Back-action and QND measurement | measurement, quantum-sensing | Advanced | Every measurement kicks the system; quantum non-demolition designs dodge the kick for one quantity. | Braginsky and Khalili, RMP 68, 1 (1996); Grangier, Levenson, Poizat, Nature 396, 537 (1998) |
| quantum-standards | Quantum standards and the 2019 SI | quantum-sensing | Intermediate | The volt and ohm now come from the Josephson and quantum Hall effects, tied to fixed constants since 2019. | BIPM SI Brochure, 9th ed. (2019); von Klitzing et al., PRL 45, 494 (1980) |
| new-physics-sensing | Hunting new physics with sensors | squeezing, atomic-clocks | Advanced | Clocks, squeezed cavities and atom sensors search for dark matter and tiny symmetry breaks. | Safronova et al., RMP 90, 025008 (2018); Backes et al., Nature 590, 238 (2021) |
| qrng | Quantum random number generators | superposition, measurement | Beginner | Turn quantum outcomes (photon paths, vacuum noise, phase noise) into true random bits. | Herrero-Collantes and Garcia-Escartin, RMP 89, 015004 (2017); Ma et al., npj QI 2, 16021 (2016) |
| randomness-extraction | Extracting and testing randomness | qrng, shannon-entropy | Intermediate | Raw bits are biased; extractors and entropy tests (NIST SP 800-90B) make and check good output. | NIST SP 800-90B (2018); Ma et al. (2016) |
| di-randomness | Device-independent randomness | qrng, bell-test, randomness-extraction | Advanced | A Bell violation proves bits are random even from untrusted boxes; NIST's CURBy beacon does this live. | Pironio et al., Nature 464, 1021 (2010); Bierhorst et al., Nature 556, 223 (2018); NIST CURBy, Nature (Jun 2025) |
| certified-randomness | Certified randomness from a quantum computer | di-randomness, advantage | Advanced | Random circuit sampling on a remote quantum computer gives randomness a classical check can certify. | Aaronson and Hung, STOC 2023; Liu et al., Nature 640, 343 (2025) |

## Suggested learning lines

- **Quantum communication** (extend): entanglement, bell-states, teleportation, superdense, entanglement-swapping, gate-teleportation.
- **Secret keys** (extend): crypto-basics, no-cloning, bb84, intercept-resend, info-reconciliation, privacy-amplification, authentication, qkd, bell-test, e91, bbm92.
- **QKD frontier**: qkd, qkd-hacking, decoy-states, mdi-qkd, twin-field, di-qkd, cv-qkd, qkd-security-proofs, qkd-standards, qkd-vs-pqc.
- **Road to Shor** (extend tail): ... shor, rsa, q-day, hndl, post-quantum.
- **Quantum-safe migration**: crypto-basics, rsa, hndl, grover-symmetric, post-quantum, lattice-crypto, ml-kem, ml-dsa, hash-signatures, code-crypto, hybrid-crypto, crypto-agility, pqc-migration.
- **Crypto beyond keys**: quantum-money, bit-commitment, coin-flipping, oblivious-transfer, position-verification, digital-signatures, blind-qc, verifiable-qc.
- **Measuring information**: shannon-entropy, von-neumann-entropy, trace-distance, fidelity, holevo-bound, entropy-family, data-processing.
- **Noise and channels**: mixed-states, partial-trace, quantum-channels, noise-models, stinespring-choi, open-systems, quantum-capacity.
- **Entanglement theory**: partial-trace, schmidt, locc, separability, entanglement-measures, entanglement-distillation, monogamy, bound-entanglement, resource-theories.
- **Beyond Bell**: bell-test, tsirelson, ghz, steering, contextuality, self-testing.
- **Checking a quantum computer**: state-tomography, process-tomography, randomized-benchmarking, gate-set-tomography, classical-shadows, certification.
- **Build a quantum internet**: flying-qubits, fiber-loss, repeaterless-bound, entanglement-distribution, satellites, trusted-nodes, quantum-memories, entanglement-swapping, entanglement-distillation, repeaters, quantum-internet, network-stack, distributed-qc.
- **Quantum sensors**: quantum-sensing, ramsey, shot-noise-limit, heisenberg-limit, squeezing, ligo, atomic-clocks, atom-interferometry, gravimeters, magnetometers, nv-centers.
- **True randomness**: qrng, randomness-extraction, di-randomness, certified-randomness.

## Checked and left out

- **Quantum secure direct communication (QSDC):** niche, security debated, overlaps QKD.
- **High-dimensional QKD:** a variant, not a new idea; one line in `qkd` or `six-state`.
- **Kak three-stage protocol:** no standard security proof; niche.
- **Quantum voting, auctions, Byzantine agreement, anonymous transmission, leader election:** research niche; at most a line in "Crypto beyond keys".
- **Quantum zero-knowledge, QROM and post-quantum security proofs:** crypto theory, too deep for this site.
- **Quantum PUFs:** early research, no settled standard.
- **Mosca's x + y > z as its own stop:** folded into `hndl`.
- **Isogeny crypto as its own stop:** SIKE was broken in 2022; covered in `other-pqc`.
- **Quantum de Finetti and postselection technique:** proof tools; folded into `qkd-security-proofs`.
- **Knill-Laflamme conditions, stabilizer codes:** belong to `error-correction` in Hardware.
- **Uncertainty principle (basic form):** belongs in Foundations; only the entropic form is here.
- **Gleason's theorem, quantum logic:** foundations of physics, not needed for the site.
- **Area laws, many-body entanglement entropy:** belongs with `simulation`.
- **Weak measurement and weak values:** debated meaning; low value for learners.
- **Relativistic geodesy as its own stop:** folded into `atomic-clocks`.
- **All-photonic repeaters as their own stop:** folded into `repeaters`.
- **Josephson parametric amplifiers:** belong to Hardware.
- **Quantum lidar or radar as products, quantum sensing markets:** hype risk; honest limits live in `quantum-illumination`, products go to Industry.
- **Quantum biology, quantum consciousness:** out of scope, weak evidence.

Overlap to check when merging: `ghz`, `open-systems`, `randomized-benchmarking`, `magic`, `gate-teleportation` and `photon-detectors` may also show up in Foundations or Hardware lists.
