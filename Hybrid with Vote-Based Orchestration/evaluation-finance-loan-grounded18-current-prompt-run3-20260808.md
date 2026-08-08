# Finance/Loan Grounded 18 — Current-prompt run 3

- SUT: `LAB-hybrid-vote-2of3-verified-thai`
- Flow file: `Hybrid with Vote-Based Orchestration/LAB-hybrid-vote-2of3-verified-thai.json`
- Flow ID: `5aa21611-7510-4e68-a8ab-5f72ec179550`
- Endpoint: `http://127.0.0.1:7860/api/v1/run/5aa21611-7510-4e68-a8ab-5f72ec179550`
- Question suite: `parallel-orchestration/benchmarks/finance-loan-grounded18/questions.txt`
- Scoring basis: Final Answer only

## All-run comparison

| Run | Verifier configuration | Correctness | Faithfulness | Valid Final Answers | Average latency |
|---|---|---:|---:|---:|---:|
| Run 1 | Before claim-by-claim fix | 66/90 | 71/90 | 16/18 | 30.82s |
| Run 2 | After claim-by-claim fix | **81/90** | **82/90** | **18/18** | **21.43s** |
| Run 3 | Same as Run 2 | 76/90 | 72/90 | **18/18** | 23.82s |
| Run 4 | Same as Run 2 | 78/90 | 75/90 | **18/18** | 22.65s |
| **Average, all 4 runs** | Mixed: Run 1 before fix; Runs 2–4 after fix | **75.25/90** | **75.00/90** | **70/72** | **24.68s** |

Run 1 and Runs 2–4 use the same flow file and question suite, but Run 1 predates the Verifier prompt fix. Therefore, use Runs 2–4—not all four runs together—when measuring non-determinism of the current prompt.

Run 4 recovered Q18 and kept Q3 free of unsupported risk interpretation. It nevertheless omitted required Q6 details, added unsupported NULL/N/A interpretations, treated `funded_amnt` as approval in Q11, invented incomplete-year coverage in Q14, and added dollar symbols in Q15 despite absent currency metadata. The flow remains available but the Verifier is not fully deterministic in claim filtering.

Raw responses: `raw-finance-loan-grounded18-current-prompt-run3-20260808.jsonl`

Machine-readable scores: `scores-finance-loan-grounded18-current-prompt-run3-20260808.json`
