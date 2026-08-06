# Finance/Loan Grounded 18 — Concurrent Vote 2-of-3

## SUT

- Flow: `LAB-concurrent-vote-2of3-retry-thai`
- Flow ID: `4e193ed2-8649-475d-8ecc-db05a23e9839`
- Runtime endpoint: `http://127.0.0.1:7860/api/v1/run/4e193ed2-8649-475d-8ecc-db05a23e9839`
- Scoring: Final Answer only
- Questions: `parallel-orchestration/benchmarks/finance-loan-grounded18/questions.txt`
- Ground: `parallel-orchestration/benchmarks/finance-loan-grounded18/ground-truth.json`

## Summary

| Metric | Result |
|---|---:|
| Successful answers | 18/18 |
| Runtime errors | 0 |
| Correctness | 73/90 (4.06/5) |
| Faithfulness | 79/90 (4.39/5) |

## Per-question scores

| Q | Correctness | Faithfulness | Main finding |
|---|---:|---:|---|
| Q1 | 4 | 4 | Count/averages correct; totals rounded |
| Q2 | 5 | 5 | Counts and portfolio shares correct |
| Q3 | 5 | 5 | Complete status distribution |
| Q4 | 5 | 5 | Complete and correct year cohorts |
| Q5 | 4 | 5 | Complete labels; rate scale not clarified |
| Q6 | 2 | 5 | Missing N/A minimum and group counts |
| Q7 | 4 | 4 | Correct buckets; invented currency |
| Q8 | 5 | 4 | Correct bands; conclusion slightly overstates association |
| Q9 | 5 | 5 | Correct gap/ratio and business constraint |
| Q10 | 3 | 5 | Correct qualifying labels; per-segment metrics omitted |
| Q11 | 3 | 2 | Rounded totals, invented currency and approval interpretation |
| Q12 | 5 | 5 | Correct application shares |
| Q13 | 5 | 3 | Correct distribution; unsupported status explanations |
| Q14 | 2 | 4 | Uses funded totals instead of mapped cohort average |
| Q15 | 5 | 5 | All ownership groups and metrics correct |
| Q16 | 4 | 4 | Correct extrema; invented currency |
| Q17 | 3 | 5 | Correct counts but incomplete mapped metrics |
| Q18 | 4 | 4 | Correct calculations; invented currency |

## Main defects

1. Currency was invented in Q7, Q11, Q14, Q16 and Q18 despite absent currency metadata.
2. Q6 omitted required business outputs: the overall minimum `N/A` and group counts.
3. Q10 returned the qualifying labels but omitted each segment's measured values.
4. Q14 changed the requested/mapped metric from average funded amount to total funded amount.
5. Q11 interpreted `funded_amnt` as approval/release and rounded the exact portfolio totals.

The raw artifact contains a duplicated Q5/Q6 pair from an overlapping runner that was stopped. Scoring uses the first complete Q1–Q18 sequence only.
