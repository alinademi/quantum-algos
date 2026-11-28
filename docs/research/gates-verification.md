# Gates and circuits: verification

Checked 2026-11-27. The new stops use the convention that q0 is the leftmost bit; all angles shown as degrees in the tools are converted to radians for matrix calculations.

## Scientific checks

| Claim type | Source | Check |
|---|---|---|
| Definitions and constructions | [de Wolf, Quantum Computing: Lecture Notes](https://homepages.cwi.nl/~rdewolf/qcnotes.pdf), chapters 1, 2, 16 and 20 | Gate order, reversibility, basis-state permutations, SWAP test, signed Pauli stabilizers, measurement-controlled Clifford circuits. |
| Universality theorem | [Barenco et al.](https://arxiv.org/abs/quant-ph/9503016) | Arbitrary single-qubit operations plus CNOT suffice. A finite alphabet instead provides approximation. |
| Two-qubit gate definitions | [IBM ECRGate](https://quantum.cloud.ibm.com/docs/en/api/qiskit/qiskit.circuit.library.ECRGate) | Matrix reordered from the IBM wire convention to q0-first. ECR, iSWAP, square-root SWAP and fSim checked for unitarity and action on basis states. |
| Two-qubit synthesis theorem | [Vidal and Dawson](https://arxiv.org/abs/quant-ph/0307177) | Three CNOT gates suffice with arbitrary local unitaries; selected examples implement their matrices, with phase accounted for. |
| Stabilizer simulation theorem | [Aaronson and Gottesman](https://arxiv.org/abs/quant-ph/0406196) | Signed Pauli measurement expectations agree with dense simulation for every Pauli on the selected small preparations. |
| Approximation theorem | [Dawson and Nielsen](https://arxiv.org/abs/quant-ph/0505030) | Finite inverse-closed dense alphabet and approximation guarantees; the lab explicitly uses bounded search instead of claiming to run the recursive algorithm. |
| Adiabatic equivalence theorem | [Aharonov et al.](https://arxiv.org/abs/quant-ph/0405098) | Polynomial equivalence under appropriate model assumptions. The lab tests numerical convergence, not speedup. |
| Measurement-based universality theorem | [Raussendorf, Browne and Briegel](https://arxiv.org/abs/quant-ph/0301052) | Cluster-state model; the two-node example verifies both byproduct branches. |
| Continuous-variable universality | [Lloyd and Braunstein](https://arxiv.org/abs/quant-ph/9810082) | Distinguish Gaussian examples from universal gate sets with non-Gaussian resources. |
| ZX definitions and rewrites | [van de Wetering](https://arxiv.org/abs/2012.13966) | One-input one-output fusion and color changes checked as exact matrices, not arbitrary diagram rearrangements. |

The per-stop reading list remains in [references.md](../references.md). The matrix identities, outcome probabilities, reversible truth tables, and branch calculations are derived from the stated definitions and checked by the local regression tests. This is not a new exhaustive re-audit of every external link.

## Lab boundaries

Ideal unitary operations and explicitly modeled projective measurements; no calibrated hardware or noise. The compiler and KAK lessons give small exact examples, not general-purpose optimizers. The QTM demonstration is a finite quantum walk with fixed tape symbols. The adiabatic example is a one-qubit integration. The CV example computes Gaussian moments rather than simulating unbounded Fock space. The language examples are illustrative source listings, not executions of external SDKs.

Tests cover every offered setting, plus independent basis-action, full-matrix, conservation, signed-Pauli, branch, and convergence checks.
