# Finance/Loan Grounded-18 — Flow Comparison

ตารางนี้กรองเฉพาะ Flow/run ที่ได้ทั้ง **Correctness ≥ 70/90** และ **Faithfulness ≥ 70/90** จากคำถาม Finance/Loan Grounded-18 ชุดเดียวกัน, canonical ground เดียวกัน และ rubric ที่ให้คะแนนเฉพาะ Final Answer

Remote repository: [`aekanun2020/2026-multi-agent-langflow-mcp`](https://github.com/aekanun2020/2026-multi-agent-langflow-mcp)

| Flow/run | Correctness | Faithfulness | สำเร็จ | เวลาเฉลี่ย | Flow file และ directory | Result commit |
|---|---:|---:|---:|---:|---|---|
| **Concurrent Vote 2-of-3 ล่าสุด** | **73/90** | **79/90** | **18/18** | **15.29s** | [`Multi-Agent with Concurrent Orchestration/LAB-concurrent-vote-2of3-retry-thai.json`](../../Multi-Agent%20with%20Concurrent%20Orchestration/LAB-concurrent-vote-2of3-retry-thai.json) | [`3ac4151`](https://github.com/aekanun2020/2026-multi-agent-langflow-mcp/commit/3ac4151a903e93a59724ace762bef4a568473c82) |
| Hybrid UI initial | 73/90 | 85/90 | 18/18 | 25.41s | [`hybrid-orchestration/flows/LAB-hybrid-v1-grounded-consensus-thai-ui-upload-20260805.json`](../../hybrid-orchestration/flows/LAB-hybrid-v1-grounded-consensus-thai-ui-upload-20260805.json) | [`1d90867`](https://github.com/aekanun2020/2026-multi-agent-langflow-mcp/commit/1d9086737b55e68504c0cd75e8c60a419fa99119) |
| Hybrid consistency rerun 2 | 78/90 | 74/90 | 18/18 | 50.68s | [`hybrid-orchestration/flows/LAB-hybrid-v1-grounded-consensus-thai-ui-upload-20260805.json`](../../hybrid-orchestration/flows/LAB-hybrid-v1-grounded-consensus-thai-ui-upload-20260805.json) | [`d7a2eeb`](https://github.com/aekanun2020/2026-multi-agent-langflow-mcp/commit/d7a2eeb5fbb47347c0fc3585f9a88b5a320a4d84) |
| Hybrid v1 rerun 2 | 76/90 | 87/90 | 18/18 | 31.26s | ไฟล์เดิม `hybrid-orchestration/flows/LAB-hybrid-v1-grounded-consensus-thai.json` ซึ่งถูก rename เป็น [`LAB-hybrid-v1-grounded-consensus-thai-ui-upload-20260805.json`](../../hybrid-orchestration/flows/LAB-hybrid-v1-grounded-consensus-thai-ui-upload-20260805.json) | [`44189e3`](https://github.com/aekanun2020/2026-multi-agent-langflow-mcp/commit/44189e32c01a0e07084e46044c9e5c7d8e984aaf) |

> **หมายเหตุเรื่องชื่อไฟล์ Hybrid:** `LAB-hybrid-v1-grounded-consensus-thai.json` ถูก rename และเตรียมสำหรับ UI upload จนเป็น `LAB-hybrid-v1-grounded-consensus-thai-ui-upload-20260805.json` การแก้ดังกล่าวไม่เปลี่ยน architecture หรือ business logic แต่ไฟล์ไม่เหมือนกันแบบ byte-for-byte เพราะ Flow identity/metadata และ internal node IDs เปลี่ยนไป ดูรายละเอียดและลำดับชื่อได้ที่ [Hybrid README — ประวัติชื่อ Flow file](../../hybrid-orchestration/README.md#ประวัติชื่อ-flow-file)

## สรุป

- Concurrent Vote 2-of-3 เร็วที่สุดในกลุ่มที่ผ่านเกณฑ์ทั้งสองด้าน
- Hybrid v1 rerun 2 มี Correctness + Faithfulness รวมสูงที่สุด
- Hybrid UI initial และ Hybrid consistency rerun 2 ใช้ Flow file เดียวกัน แต่เป็นคนละรอบทดสอบ
- คะแนนของแต่ละแถวอ้างอิง Final Answer เท่านั้น ไม่ได้นำคำตอบของ Worker ทุกตัวมาคิดคะแนน

## Canonical benchmark

- Questions: [`parallel-orchestration/benchmarks/finance-loan-grounded18/questions.txt`](../../parallel-orchestration/benchmarks/finance-loan-grounded18/questions.txt)
- Ground truth: [`parallel-orchestration/benchmarks/finance-loan-grounded18/ground-truth.json`](../../parallel-orchestration/benchmarks/finance-loan-grounded18/ground-truth.json)
- Rubric: [`parallel-orchestration/benchmarks/finance-loan-grounded18/rubric.md`](../../parallel-orchestration/benchmarks/finance-loan-grounded18/rubric.md)
