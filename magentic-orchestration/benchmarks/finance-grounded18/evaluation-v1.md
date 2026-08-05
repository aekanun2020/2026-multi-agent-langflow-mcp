# Magentic v1 — Finance/Loan Grounded-18 Evaluation

วันที่ทดสอบ: 2026-08-05

## SUT and method

- Flow: `LAB-magentic-v1-finance-research-thai`
- Flow ID: `4d5c6b59-027d-467e-b2ec-720d84bf7dcb`
- Questions and ground: ชุดเดียวกับ `parallel-orchestration/benchmarks/finance-loan-grounded18/`
- Sessions: one new session per question
- Runtime overrides/tweaks: none
- Scoring source: ใช้เฉพาะ Final Answer หลัง `Deterministic Magentic Output Guard`
- Frozen rubric: `parallel-orchestration/benchmarks/finance-loan-grounded18/rubric.md`
- Raw immutable artifact: `raw-v1.jsonl`

## Per-question scores

| Q | Correctness | Faithfulness | Final result |
|---:|---:|---:|---|
| 1 | 0 | 5 | Guard ปฏิเสธ invalid Manager output; ไม่มี factual claim หลุดออกมา |
| 2 | 0 | 5 | Guard ปฏิเสธ invalid Manager output |
| 3 | 0 | 3 | ตอบ blocked จาก tool failure แต่เพิ่มตัวอย่าง `loans_table` ที่ไม่มี ground |
| 4 | 0 | 0 | HTTP 500: MCP tool-list timeout |
| 5 | 0 | 5 | Guard ปฏิเสธ invalid Manager output |
| 6 | 0 | 0 | HTTP 500: MCP connection/tool-list failure |
| 7 | 0 | 5 | Guard ปฏิเสธ invalid Manager output |
| 8 | 0 | 5 | Guard ปฏิเสธ invalid Manager output |
| 9 | 0 | 5 | Guard ปฏิเสธ invalid Manager output |
| 10 | 0 | 5 | Guard ปฏิเสธ invalid Manager output |
| 11 | 0 | 5 | Guard ปฏิเสธ invalid Manager output |
| 12 | 0 | 5 | Guard ปฏิเสธ invalid Manager output |
| 13 | 0 | 5 | Guard ปฏิเสธ invalid Manager output |
| 14 | 0 | 5 | Guard ปฏิเสธ invalid Manager output |
| 15 | 0 | 5 | Guard ปฏิเสธ invalid Manager output |
| 16 | 0 | 5 | Guard ปฏิเสธ invalid Manager output |
| 17 | 0 | 5 | Guard ปฏิเสธ invalid Manager output |
| 18 | 0 | 5 | ตอบ blocked พร้อม tool error และไม่มี factual claim |

การให้ Faithfulness = 5 กับ Guard rejection ใช้หลักเดียวกับ v8: ไม่มี unsupported factual claim เข้าสู่ Final Answer จึง faithful แม้ไม่มีประโยชน์ด้าน correctness ส่วน HTTP/execution failure ที่ไม่มี Final Answer ได้ 0 ตาม frozen rubric

## Aggregate

- Transport availability: 16/18 = **88.9%**
- Successful task completion: 0/18 = **0.0%**
- Correctness: 0/90 = **0.0%**
- Faithfulness: 78/90 = **86.7%**
- Guard rejection: 14/18 = **77.8%**
- Blocked tool response: 2/18 = **11.1%**
- HTTP error: 2/18 = **11.1%**
- Average latency: **19.44 seconds**
- Median latency: **15.87 seconds**
- Range: **2.77–83.24 seconds**
- Final-answer reasoning leakage: **0/18**
- Invented currency: **0/18**

## Comparison with full Grounded-18 runs

| Metric | Parallel v7 | Parallel v8 | Magentic v1 | v1 vs v8 |
|---|---:|---:|---:|---:|
| Transport availability | 100.0% | 88.9% | 88.9% | 0.0 points |
| Task completion | not separately recorded | not separately recorded | 0.0% | — |
| Correctness | 81.1% | 37.8% | 0.0% | **-37.8 points** |
| Faithfulness | 51.1% | 85.6% | 86.7% | **+1.1 points** |
| Reasoning leakage | 100.0% | 0.0% | 0.0% | unchanged |
| Average latency | 56.70s | 83.12s | 19.44s | -63.68s แต่จบเร็วเพราะ fail/blocked |

ผล v9 ที่มีอยู่เป็น targeted subset และ full-18 run เดิมเสียจาก infrastructure จึงไม่นำมาวางเป็นคะแนน full-suite ในตารางเดียวกัน

## Diagnosis

Magentic v1 **แย่กว่า Parallel v7/v8 อย่างชัดเจนด้าน usefulness และ correctness** แม้ Guard จะรักษา faithfulness ได้ สาเหตุหลักมีสองชั้น:

1. Manager เรียก Agent-as-tool แล้ว 14/18 รอบไม่คืน root JSON ตาม final contract จึงถูก Guard ปิดแบบ fail-closed
2. Nested specialist tool path มี MCP discovery/runtime defect ได้แก่ timeout, connection failure และ `unexpected keyword argument 'skip_db_update'`

นอกจากนี้ Grounded-18 ส่วนใหญ่เป็น deterministic aggregate ที่มี solution path ชัดเจน จึงไม่ใช่ workload ที่แสดงข้อดีของ Magentic ได้เต็มที่ อย่างไรก็ตาม pattern mismatch ไม่ใช่ข้อแก้ตัวสำหรับคะแนนศูนย์: implementation ต้องส่ง task ไป specialist, รับ evidence และคืน contract ให้สำเร็จก่อน

## Recommendation

ยังไม่ควรใช้ Magentic v1 เป็น SUT สำหรับ Finance/Loan production หรือเปรียบเทียบคุณภาพคำตอบ จนกว่าจะ:

1. แยก specialist execution ออกจาก Langflow Agent-as-tool ที่เกิด nested MCP defect
2. ทำ durable typed ledger component แทนการฝาก ledger ไว้ใน Manager prompt เพียงอย่างเดียว
3. บังคับ structured Manager output ก่อนเข้า Guard
4. เพิ่ม retry/circuit breaker สำหรับ MCP discovery แต่ไม่ retry query ที่อาจมี side effect
5. ผ่าน smoke test ที่ต้องมี SQL evidence, RAG evidence และ verification อย่างน้อยหนึ่งรอบ ก่อน rerun 18 ข้อ

