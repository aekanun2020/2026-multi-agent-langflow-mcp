# Comparison on the Same Finance/Loan Grounded-18 Suite

เปรียบเทียบเฉพาะ full run ที่ใช้คำถาม `finance-loan-grounded18-v1` ทั้ง 18 ข้อ, canonical ground เดียวกัน และให้คะแนนจาก Final Answer เท่านั้น ไม่รวม targeted subset หรือชุดคำถามอื่น

## Aggregate comparison

Remote repo ของตารางทั้งหมดคือ [`aekanun2020/2026-multi-agent-langflow-mcp`](https://github.com/aekanun2020/2026-multi-agent-langflow-mcp)

| Flow/run (flow file; remote repo; result commit) | Availability | Correctness | Faithfulness | Avg latency |
|---|---:|---:|---:|---:|
| **Concurrent Vote 2-of-3 current** (`Multi-Agent with Concurrent Orchestration/LAB-concurrent-vote-2of3-retry-thai.json`; `2026-multi-agent-langflow-mcp`; **pending commit below**) | **18/18** | **73/90 (81.1%)** | **79/90 (87.8%)** | **15.29s** |
| Parallel v4 paper-exact (`parallel-orchestration/flows/paper-exact/LAB-concurrent-v4-paper-exact-thai.json`; `2026-multi-agent-langflow-mcp`; [`82f4cc2`](https://github.com/aekanun2020/2026-multi-agent-langflow-mcp/commit/82f4cc214307f18b385ef36ab56be8411539ba3e)) | 17/18 | 63/90 (70.0%) | 61/90 (67.8%) | 17.55s |
| Parallel v7 (`parallel-orchestration/flows/LAB-1-4-withlocal-concurrent-consensus-v7-financial-loan-thai.json`; `2026-multi-agent-langflow-mcp`; [`1364280`](https://github.com/aekanun2020/2026-multi-agent-langflow-mcp/commit/1364280038ae9aecc2b463c7691ffc9386d461b9)) | 18/18 | 73/90 (81.1%) | 46/90 (51.1%) | 56.70s |
| Parallel v8 (`parallel-orchestration/flows/LAB-1-4-withlocal-concurrent-consensus-v8-guarded-verbalizer-thai.json`; `2026-multi-agent-langflow-mcp`; [`1364280`](https://github.com/aekanun2020/2026-multi-agent-langflow-mcp/commit/1364280038ae9aecc2b463c7691ffc9386d461b9)) | 16/18 | 34/90 (37.8%) | 77/90 (85.6%) | 83.12s |
| Hybrid v1 UI initial (`hybrid-orchestration/flows/LAB-hybrid-v1-grounded-consensus-thai-ui-upload-20260805.json`; `2026-multi-agent-langflow-mcp`; [`1d90867`](https://github.com/aekanun2020/2026-multi-agent-langflow-mcp/commit/1d9086737b55e68504c0cd75e8c60a419fa99119)) | 18/18 | 73/90 (81.1%) | 85/90 (94.4%) | 25.41s |
| Hybrid v1 rerun 2 (`hybrid-orchestration/flows/LAB-hybrid-v1-grounded-consensus-thai-ui-upload-20260805.json`; `2026-multi-agent-langflow-mcp`; [`44189e3`](https://github.com/aekanun2020/2026-multi-agent-langflow-mcp/commit/44189e32c01a0e07084e46044c9e5c7d8e984aaf)) | 18/18 | 76/90 (84.4%) | 87/90 (96.7%) | 31.26s |
| Magentic v2 (`magentic-orchestration/flows/v2/LAB-magentic-v2-subflow-specialists-thai.json`; `2026-multi-agent-langflow-mcp`; [`957bfde`](https://github.com/aekanun2020/2026-multi-agent-langflow-mcp/commit/957bfde45004344875e984ce495540daefa16da3)) | 18/18 | 46/90 (51.1%) | 82/90 (91.1%) | 62.18s |
| Magentic v3 (`magentic-orchestration/flows/v3/LAB-magentic-v3-resilient-final-guard-thai.json`; `2026-multi-agent-langflow-mcp`; [`e7bad2d`](https://github.com/aekanun2020/2026-multi-agent-langflow-mcp/commit/e7bad2dd8fbe87f0d618ac5c8e198a88952fc043)) | 18/18 | 46/90 (51.1%) | 83/90 (92.2%) | 63.62s |

## Where the current flow is better

### Compared with Parallel v4 paper-exact

- Correctness: +10 points
- Faithfulness: +18 points
- Availability: +1 completed answer
- Latency: 2.26 seconds faster on average

The 2-of-3 final vote keeps the useful overlapping answer instead of depending on a single paper-exact output path that previously lost one answer and added more unsupported claims.

### Compared with Parallel v7

- Same correctness: 73/90
- Faithfulness: +33 points
- Latency: 41.41 seconds faster, about 3.7 times as fast

The current flow no longer exposes every worker's reasoning in the final answer. The Vote Agent emits only the substance supported by at least two workers.

### Compared with Parallel v8

- Correctness: +39 points
- Faithfulness: +2 points
- Availability: +2 completed answers
- Latency: 67.83 seconds faster, about 5.4 times as fast

Parallel v8 was highly conservative and often withheld useful claims. The current flow answers all 18 questions while retaining slightly higher faithfulness.

### Compared with Magentic v2/v3

- Correctness: +27 points over both
- Latency: approximately 47–48 seconds faster, about 4.1 times as fast
- Faithfulness is lower by 3–4 points

The fixed concurrent topology fits these deterministic Finance/Loan aggregates better than manager-driven task planning. It avoids manager/specialist orchestration overhead and returns substantially more complete numeric answers.

## Where the current flow is not better

- Hybrid v1 rerun 2 remains better on answer quality: correctness 76 vs 73 and faithfulness 87 vs 79. The current flow is about twice as fast.
- Hybrid v1 UI initial run has the same correctness and higher faithfulness: 85 vs 79. The current flow is 10.12 seconds faster.
- Magentic v2/v3 have slightly higher faithfulness, but much lower correctness and much higher latency.

## Per-question strengths of the current flow

Relative to Parallel v7, the largest practical improvements are Q7, Q15, Q16, Q17 and Q18: the current flow returns usable grounded values instead of low-correctness or reasoning-heavy final answers.

Relative to Parallel v8, the current flow improves completeness especially on Q3, Q5, Q7, Q8, Q9, Q13, Q15, Q16 and Q17, where v8 either abstained, timed out or returned only a small subset of the required business output.

Relative to Hybrid, the advantage is mainly execution cost and final-answer discipline, not universal correctness. Current weaknesses remain Q6, Q10, Q11, Q14 and Q17.

## Conclusion

The current Concurrent Vote 2-of-3 flow is the strongest **speed–availability–quality balance** in the recorded full-suite runs: 18/18 answers, 81.1% correctness, 87.8% faithfulness and 15.29-second average latency. It is not the absolute quality winner because the best Hybrid run scores higher on both correctness and faithfulness.
