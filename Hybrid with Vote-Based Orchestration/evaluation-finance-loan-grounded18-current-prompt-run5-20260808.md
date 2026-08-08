# Finance/Loan Grounded 18 — Current-prompt run 5

- SUT: `LAB-hybrid-vote-2of3-verified-thai`
- Flow file: `Hybrid with Vote-Based Orchestration/LAB-hybrid-vote-2of3-verified-thai.json`
- Flow ID: `5aa21611-7510-4e68-a8ab-5f72ec179550`
- Endpoint: `http://127.0.0.1:7860/api/v1/run/5aa21611-7510-4e68-a8ab-5f72ec179550`
- Question suite: `parallel-orchestration/benchmarks/finance-loan-grounded18/questions.txt`
- Scoring basis: Final Answer only

## Five comparable runs

| Run | Correctness | Faithfulness | Valid Final Answers | Average latency |
|---|---:|---:|---:|---:|
| 1 | **81/90** | **82/90** | 18/18 | **21.43s** |
| 2 | 76/90 | 72/90 | 18/18 | 23.82s |
| 3 | 78/90 | 75/90 | 18/18 | 22.65s |
| 4 | 80/90 | 81/90 | 18/18 | 24.40s |
| 5 | 80/90 | 81/90 | 18/18 | 23.99s |
| **Average** | **79.00/90** | **78.20/90** | **90/90** | **23.26s** |

Run 5 matches Run 4's aggregate correctness and faithfulness, but the defects are not identical. Q3 and Q13 are clean in this run, while Q5 adds an unsupported DTI unit, Q6 omits counts, Q8 adds a borrower-level interpretation, Q10 omits per-group metrics, and Q11/Q14 still over-interpret `funded_amnt`.

Raw responses: `raw-finance-loan-grounded18-current-prompt-run5-20260808.jsonl`

Machine-readable scores: `scores-finance-loan-grounded18-current-prompt-run5-20260808.json`
