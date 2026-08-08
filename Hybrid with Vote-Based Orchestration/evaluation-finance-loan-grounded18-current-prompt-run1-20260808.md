# Finance/Loan Grounded 18 — Current-prompt run 1

- SUT: `LAB-hybrid-vote-2of3-verified-thai`
- Flow file: `Hybrid with Vote-Based Orchestration/LAB-hybrid-vote-2of3-verified-thai.json`
- Flow ID: `5aa21611-7510-4e68-a8ab-5f72ec179550`
- Endpoint: `http://127.0.0.1:7860/api/v1/run/5aa21611-7510-4e68-a8ab-5f72ec179550`
- Question suite: `parallel-orchestration/benchmarks/finance-loan-grounded18/questions.txt`
- Scoring basis: Final Answer only

## Result

| Metric | Before verifier fix | After verifier fix | Change |
|---|---:|---:|---:|
| Correctness | 66/90 | **81/90** | **+15** |
| Faithfulness | 71/90 | **82/90** | **+11** |
| Valid Final Answers | 16/18 | **18/18** | **+2** |
| Average latency | 30.82s | **21.43s** | **-9.39s** |

The revised Verifier successfully corrected Q3's previously wrong total, removed Q7's unsupported statistical-significance wording, and produced Final Answers for Q10 and Q16. It still misses some claims: Q11 retains rounded totals and an unsupported funding interpretation; Q13 adds an unsupported problem-debt grouping; Q14 uses the wrong aggregation and interprets `funded_amnt` too strongly.

Raw responses: `raw-finance-loan-grounded18-current-prompt-run1-20260808.jsonl`

Machine-readable scores: `scores-finance-loan-grounded18-current-prompt-run1-20260808.json`
