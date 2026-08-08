# Finance/Loan Grounded 18 — Current-prompt run 2

- SUT: `LAB-hybrid-vote-2of3-verified-thai`
- Flow file: `Hybrid with Vote-Based Orchestration/LAB-hybrid-vote-2of3-verified-thai.json`
- Flow ID: `5aa21611-7510-4e68-a8ab-5f72ec179550`
- Endpoint: `http://127.0.0.1:7860/api/v1/run/5aa21611-7510-4e68-a8ab-5f72ec179550`
- Question suite: `parallel-orchestration/benchmarks/finance-loan-grounded18/questions.txt`
- Scoring basis: Final Answer only

## Comparison with run 2

| Metric | Run 2 | Run 3 | Change |
|---|---:|---:|---:|
| Correctness | 81/90 | **76/90** | **-5** |
| Faithfulness | 82/90 | **72/90** | **-10** |
| Valid Final Answers | 18/18 | **18/18** | 0 |
| Average latency | 21.43s | **23.82s** | **+2.39s** |

Run 3 retained correct numerical answers for most questions but regressed in unsupported claims. Q7 invented baht despite absent currency metadata. Q14 invented an explanation that 2019 covered only half a year. Q18 incorrectly abstained even though the yearly requested and funded evidence exists. Q3, Q10, Q11, Q13, and Q15 also contain unsupported interpretations.

Raw responses: `raw-finance-loan-grounded18-current-prompt-run2-20260808.jsonl`

Machine-readable scores: `scores-finance-loan-grounded18-current-prompt-run2-20260808.json`
