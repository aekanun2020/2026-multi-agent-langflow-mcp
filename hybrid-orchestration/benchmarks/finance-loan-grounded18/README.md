# Hybrid v1 — Finance/Loan Grounded-18 Artifacts

Canonical questions, ground truth และ frozen rubric ใช้จาก [`parallel-orchestration/benchmarks/finance-loan-grounded18/`](../../../parallel-orchestration/benchmarks/finance-loan-grounded18/) โดยไม่ทำสำเนา เพื่อป้องกัน benchmark drift

ไฟล์ใน directory นี้เป็น artifacts ของ Hybrid v1 เท่านั้น:

- `evaluation-v1-final.md`: ผล final และการเปรียบเทียบรายข้อ
- `scores-v1-final.json`: คะแนนแบบ machine-readable
- `raw-v1-final-rerun1.jsonl`: full first pass
- `raw-v1-final-q15-rerun.jsonl`: targeted retry ของ transient MCP failure
- ไฟล์ `pre-editor`, `smoke`, `targeted` และ `credit-blocked`: หลักฐานระหว่างพัฒนา ห้ามนำมาผสมเป็น final score
