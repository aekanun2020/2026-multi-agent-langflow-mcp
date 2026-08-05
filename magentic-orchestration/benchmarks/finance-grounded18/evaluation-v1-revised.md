# Magentic v1 Revised — Finance/Loan Grounded-18 Evaluation

วันที่ทดสอบ: 2026-08-05

## SUT and method

- Flow: `LAB-magentic-v1-finance-research-thai-revised`
- Flow ID: `30dfa364-de51-4b19-b6a5-bbd830147752`
- Questions, ground และ frozen rubric: ชุดเดียวกับ v1 เดิมและ Parallel Grounded-18
- Sessions: one new session per question
- Runtime overrides/tweaks: none
- Scoring source: Final Answer หลัง deterministic Output Guard เท่านั้น
- Raw immutable artifact: `raw-v1-revised.jsonl`

## Per-question scores

| Q | Correctness | Faithfulness | Final result |
|---:|---:|---:|---|
| 1 | 0 | 5 | Structured blocked; specialist tool ใช้งานไม่ได้ |
| 2 | 0 | 5 | Guard ปฏิเสธ invalid Manager output |
| 3 | 0 | 5 | Guard ปฏิเสธ invalid Manager output |
| 4 | 0 | 5 | Blocked พร้อม `skip_db_update` error |
| 5 | 0 | 3 | Partial และเสนอ `loans` table/SQL ที่ไม่มี ground |
| 6 | 0 | 3 | Blocked แต่เสนอ `loan_table`, `LIMIT 1` และ schema สมมติ |
| 7 | 0 | 5 | Guard ปฏิเสธ invalid Manager output |
| 8 | 0 | 4 | Blocked; มี placeholder/schema assumptions แต่ไม่มีค่าจริง |
| 9 | 0 | 5 | Guard ปฏิเสธ invalid Manager output |
| 10 | 0 | 5 | Structured blocked; ไม่ปล่อย factual claim |
| 11 | 0 | 5 | Structured blocked; ไม่ปล่อย factual claim |
| 12 | 0 | 5 | Structured blocked; ไม่ปล่อย factual claim |
| 13 | 0 | 5 | Guard ปฏิเสธ invalid Manager output |
| 14 | 0 | 5 | Structured blocked; ไม่ปล่อย factual claim |
| 15 | 0 | 5 | Guard ปฏิเสธ invalid Manager output |
| 16 | 0 | 5 | Guard ปฏิเสธ invalid Manager output |
| 17 | 0 | 4 | Blocked แต่เสนอชื่อ field สมมติและขอข้อมูลที่ระบบควรค้นเอง |
| 18 | 0 | 3 | Blocked และเปลี่ยน requested/funded semantics เป็น requested/allocated |

Faithfulness ให้คะแนนสูงแก่คำตอบที่ fail closed และไม่มี unsupported factual claim ตามหลักเดียวกับ v8/v1 เดิม คะแนนนี้ไม่ใช่ task success

## Aggregate

- Transport availability: 18/18 = **100.0%**
- Successful task completion: 0/18 = **0.0%**
- Correctness: 0/90 = **0.0%**
- Faithfulness: 82/90 = **91.1%**
- Guard rejection: 7/18 = **38.9%**
- Structured blocked response: 10/18 = **55.6%**
- Partial response: 1/18 = **5.6%**
- HTTP error: 0/18 = **0.0%**
- Average latency: **15.58 seconds**
- Median latency: **14.00 seconds**
- Range: **8.57–51.72 seconds**
- Final-answer reasoning leakage: **0/18**
- Invented currency: **0/18**

## Revised versus original Magentic v1

| Metric | Original v1 | Revised | Change |
|---|---:|---:|---:|
| Transport availability | 88.9% | 100.0% | **+11.1 points** |
| Task completion | 0.0% | 0.0% | unchanged |
| Correctness | 0.0% | 0.0% | unchanged |
| Faithfulness | 86.7% | 91.1% | **+4.4 points** |
| Guard rejection | 77.8% | 38.9% | **-38.9 points** |
| Structured blocked response | 11.1% | 55.6% | **+44.5 points** |
| HTTP error | 11.1% | 0.0% | **-11.1 points** |
| Average latency | 19.44s | 15.58s | **-3.86s** |

## Verdict

Revised **ดีขึ้นด้าน availability, output-contract handling และการรายงาน blocker** แต่ยังไม่ดีขึ้นด้าน business result: ไม่มีข้อใดได้ MSSQL/RAG evidence และไม่มี requested metric ใดถูกตอบ

Root defect ยังอยู่ที่ Agent-as-tool runtime path ของ Langflow 1.7.3:

```text
send_message_noop() got an unexpected keyword argument 'skip_db_update'
```

ดังนั้น Revised เป็น **safer and cleaner failure**, ไม่ใช่ successful Magentic orchestration การแก้ขั้นต่อไปต้องเปลี่ยน execution architecture ของ specialist calls ไม่ใช่ปรับ Manager prompt หรือ Output Guard เพิ่ม

