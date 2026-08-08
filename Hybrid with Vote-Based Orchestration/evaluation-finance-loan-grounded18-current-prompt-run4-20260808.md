# Finance/Loan Grounded 18 — Current-prompt run 4

- SUT: `LAB-hybrid-vote-2of3-verified-thai`
- Flow file: `Hybrid with Vote-Based Orchestration/LAB-hybrid-vote-2of3-verified-thai.json`
- Flow ID: `5aa21611-7510-4e68-a8ab-5f72ec179550`
- Endpoint: `http://127.0.0.1:7860/api/v1/run/5aa21611-7510-4e68-a8ab-5f72ec179550`
- Question suite: `parallel-orchestration/benchmarks/finance-loan-grounded18/questions.txt`
- Scoring basis: Final Answer only

## All-run comparison

| Run | Verifier configuration | Correctness | Faithfulness | Valid Final Answers | Average latency |
|---|---|---:|---:|---:|---:|
| Run 1 | Current prompt | **81/90** | **82/90** | **18/18** | **21.43s** |
| Run 2 | Current prompt | 76/90 | 72/90 | **18/18** | 23.82s |
| Run 3 | Current prompt | 78/90 | 75/90 | **18/18** | 22.65s |
| Run 4 | Current prompt | 80/90 | 81/90 | **18/18** | 24.40s |
| **Average, all 4 runs** | Same current prompt | **78.75/90** | **77.50/90** | **72/72** | **23.08s** |

Run 4 recovered close to Run 1 and answered Q10 completely. It still omitted Q6 counts, interpreted `funded_amnt` as approval/disbursement in Q11, allowed a wrong total and unsupported grouping in Q13, and used the wrong aggregation in Q14. Across all four comparable runs, availability is stable but correctness ranges from 76–81 and faithfulness from 72–82.

Raw responses: `raw-finance-loan-grounded18-current-prompt-run4-20260808.jsonl`

Machine-readable scores: `scores-finance-loan-grounded18-current-prompt-run4-20260808.json`
