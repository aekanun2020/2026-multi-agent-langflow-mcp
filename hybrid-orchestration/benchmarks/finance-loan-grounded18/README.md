# Hybrid v1 — Finance/Loan Grounded-18 Artifacts

Canonical benchmark ใช้ไฟล์ต่อไปนี้โดยไม่ทำสำเนา เพื่อป้องกัน benchmark drift:

| Canonical input | Link |
|---|---|
| คำถามเต็ม Q1–Q18 | [`questions.txt`](../../../parallel-orchestration/benchmarks/finance-loan-grounded18/questions.txt) |
| Expected values และ business constraints | [`ground-truth.json`](../../../parallel-orchestration/benchmarks/finance-loan-grounded18/ground-truth.json) |
| Correctness/Faithfulness rubric | [`rubric.md`](../../../parallel-orchestration/benchmarks/finance-loan-grounded18/rubric.md) |
| Read-only ground SQL | [`ground-queries.sql`](../../../parallel-orchestration/benchmarks/finance-loan-grounded18/sql/ground-queries.sql) |

ไฟล์ใน directory นี้เป็น artifacts ของ Hybrid v1 เท่านั้น:

- `evaluation-v1-final.md`: ผล final และการเปรียบเทียบรายข้อ
- `scores-v1-final.json`: คะแนนแบบ machine-readable
- `raw-v1-final-rerun1.jsonl`: full first pass
- `raw-v1-final-q15-rerun.jsonl`: targeted retry ของ transient MCP failure
- [`evaluation-v1-rerun2.md`](evaluation-v1-rerun2.md), [`scores-v1-rerun2.json`](scores-v1-rerun2.json), [`raw-v1-final-rerun2.jsonl`](raw-v1-final-rerun2.jsonl): ผลล่าสุดที่สำเร็จ 18/18 ใน first pass
- ไฟล์ `pre-editor`, `smoke`, `targeted` และ `credit-blocked`: หลักฐานระหว่างพัฒนา ห้ามนำมาผสมเป็น final score
