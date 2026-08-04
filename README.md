# 2026 Multi-Agent Langflow MCP

ตัวอย่าง Langflow 1.7.3 สำหรับงาน multi-agent แบบ parallel workers และ deterministic vote aggregation พร้อม benchmark ที่ใช้ MSSQL + RAG เป็น ground

ภาพรวมและความแตกต่างของ v4, v5, v6 และ v7 อยู่ที่ [docs/flow-versions.md](docs/flow-versions.md)

## โครงสร้าง

```text
flows/
  LAB-1-4-withlocal-parallel-consensus-v5-thai.json
  LAB-1-4-withlocal-concurrent-consensus-v6-thai.json
  LAB-1-4-withlocal-concurrent-consensus-v7-financial-loan-thai.json
benchmarks/customer-service-hard10/
  questions.txt
  ground-truth.md
  evaluation.md
scripts/
  build_v6_concurrent.mjs
  build_v7_financial_loan.mjs
  copy_flow_api_keys.py
  sync_flow_design.py
  run_langflow_hard10.py
  inspect_mcp_servers.py
  call_mcp_tool.py
```

## Flow v6: Concurrent Full-Answer Consensus

v6 เป็น flow หลักที่นำแนวคิดจากบทความ [การแก้ปัญหาคำตอบที่ไม่คงเส้นคงวาของ Agent ด้วย Multi-Agent with Concurrent Orchestration](https://aekanunbigdata.medium.com/การแก้ปัญหาคำตอบที่ไม่คงเส้นคงวาของ-agent-ด้วย-multi-agent-with-concurrent-orchestration-bfe6e0b7a96f) มาประยุกต์ใช้:

```text
คำถามเดียวกัน
  ├─ Concurrent Full-Answer Agent 1 ─┐
  ├─ Concurrent Full-Answer Agent 2 ─┼─ Concurrent Answer Consensus ─ Final Answer Synthesizer
  └─ Concurrent Full-Answer Agent 3 ─┘
```

- Agents ทั้งสามได้รับคำถาม, tools และ instructions เหมือนกัน
- แต่ละ Agent สร้างคำตอบฉบับเต็มพร้อม structured claims, calculations, evidence และ uncertainties
- Aggregator เปรียบเทียบค่าของ claims ไม่ได้นับ `notify/do_not_notify/abstain`
- Final Synthesizer ตอบจาก claims ที่ตรงกันอย่างน้อย 2 ใน 3 และพิจารณาหลักฐานเมื่อคำตอบต่างกัน
- Final Synthesizer ไม่มี MCP/tool edge และทำ external action ไม่ได้

ความสอดคล้องกับบทความอยู่ที่การส่ง task เดียวกันให้ Agents หลายตัวทำงานอย่างอิสระพร้อมกัน แล้วรวมหลายคำตอบเพื่อลดผลกระทบจาก non-determinism ส่วน structured claims, deterministic 2-of-3 threshold และ Final Synthesizer เป็นรายละเอียด implementation ที่เพิ่มใน v6

รายละเอียดอยู่ใน [docs/v6-concurrent-orchestration.md](docs/v6-concurrent-orchestration.md)

## Flow v5 (legacy vote-based)

Flow ประกอบด้วย worker อิสระ 3 ตัว:

1. Policy worker — ตรวจนโยบายและเงื่อนไขสิทธิ์
2. Evidence worker — ตรวจข้อมูล MSSQL และคุณภาพหลักฐาน
3. Risk worker — ตรวจความขัดแย้ง ข้อมูลขาด และความเสี่ยง

ผลจาก workers ถูกส่งเข้า deterministic vote aggregator ก่อนส่งให้ executor สรุปเป็นภาษาไทย

v5 เก็บไว้เพื่อเปรียบเทียบเท่านั้น เพราะ vote schema แบบ notification ไม่ตรงกับ analytical QA benchmark

ไฟล์ flow ไม่บันทึก API key ผู้ใช้ต้องตั้งค่า key หลัง import หรือผ่าน environment/secret ของ Langflow เอง

## MCP endpoints

ค่าที่ออกแบบไว้สำหรับ Langflow ใน Docker:

```text
MSSQL: http://host.docker.internal:9000/mcp
RAG:   http://host.docker.internal:8000/mcp
```

URL ต้องลงท้ายด้วย `/mcp`

เครื่องมือ benchmark ใช้ MCP แบบ read-only สำหรับค้นคว้าและสร้าง ground truth ไม่ควรเรียกเครื่องมือเพิ่ม/แก้ไขข้อมูลระหว่าง evaluation

## Hard-10 benchmark

ชุดทดสอบ customer service มี 10 ข้อ ครอบคลุม:

- return eligibility และ warranty route
- financial exposure และลำดับความสำคัญ
- SLA/RMA และ refund timeline
- data minimization ตาม PDPA
- ความขัดแย้งของข้อมูลและ business assumptions

ไฟล์ `questions.txt` ใช้ยิงเข้า flow ส่วน `ground-truth.md` มีคำตอบ เหตุผล SQL และ RAG grounds สำหรับตรวจซ้ำ

## Evaluation rule

Correctness ตรวจเฉพาะ **final answer จาก Chat Output** เทียบกับ ground truth เท่านั้น:

- ไม่นำคำตอบราย worker มาคิด
- ไม่นำ vote หรือ consensus rate มาช่วยเพิ่มคะแนน
- ไม่นำ hidden reasoning หรือข้อความก่อน final มาช่วยเพิ่มคะแนน
- timeout นับเป็น execution failure และเป็นศูนย์ในคะแนน end-to-end

Faithfulness ตรวจว่าข้อสรุปใน final answer มีหลักฐานจากโจทย์ MSSQL หรือ RAG รองรับ และไม่มีการแต่งค่าเพิ่ม

ผล clean SUT run ล่าสุด (ไม่มี prompt/parameter override):

- Availability: 10/10 = 100%
- Correctness: 22/50 = 44.0%
- Faithfulness: 34/50 = 68.0%

ดูรายละเอียดรายข้อใน [evaluation.md](benchmarks/customer-service-hard10/evaluation.md)

ผล v6 Concurrent Full-Answer ล่าสุด:

- Availability: 10/10 = 100%
- Correctness: 28/50 = 56.0%
- Faithfulness: 36/50 = 72.0%
- Correctness ดีขึ้นจาก v5 จำนวน 12 จุด แต่ latency เฉลี่ยเพิ่มจาก 43.2 เป็น 61.9 วินาที

ดู [evaluation-v6.md](benchmarks/customer-service-hard10/evaluation-v6.md)

## Flow v7: Financial & Loan specialization

v7 คง concurrent full-answer 3 agents และ deterministic 2-of-3 claim consensus ของ v6 แต่เพิ่ม data contract สำหรับ `loans_fact`, dimension joins, rate/percent normalization, DTI policy grounding และ data-quality guardrails สำหรับงานวิเคราะห์สินเชื่อ รายละเอียดอยู่ใน [docs/v7-financial-loan.md](docs/v7-financial-loan.md)

ผล Finance/Loan Grounded-18: availability 100%, correctness 81.1%, faithfulness 51.1% และพบ reasoning leakage 18/18 ข้อ ดู [evaluation-v7.md](benchmarks/finance-loan-grounded18/evaluation-v7.md)

ผล safe-mode รอบแรกถูก invalidated และเก็บเพื่อ audit ไว้ใน `evaluation-safe-mode-invalidated.md`

## Run benchmark

Langflow ต้องทำงานที่ `http://localhost:7860` และมี flow ID ตรงกับค่าที่ตั้งในสคริปต์:

```bash
python3 scripts/run_langflow_hard10.py benchmarks/customer-service-hard10/questions.txt
```

ระบุ flow อื่น เช่น v6 ผ่าน environment variable:

```bash
LANGFLOW_FLOW_ID=<flow-id> python3 scripts/run_langflow_hard10.py benchmarks/customer-service-hard10/questions.txt
```

สคริปต์สร้าง session ใหม่ต่อคำถามหนึ่งข้อเพื่อไม่ให้คำตอบก่อนหน้ารั่วข้ามข้อ และไม่ส่ง `tweaks` ใด ๆ ไปเปลี่ยน flow ดังนั้นคำตอบมาจาก SUT ที่ import อยู่ใน Langflow โดยตรง

> คำเตือน: runner เรียก flow เดิมแบบ end-to-end หาก Executor ของ flow มีสิทธิ์เรียกเครื่องมือที่เปลี่ยนแปลงข้อมูล ผู้ทดสอบต้องจัด MCP แบบ read-only หรือ test doubles ที่ชั้น environment โดยห้ามแก้ prompt/parameters ของ SUT ระหว่างการประเมิน

## Security

- ห้าม commit API keys, database passwords หรือ bearer tokens
- ตรวจ flow export ทุกครั้งก่อน commit เพราะ Langflow บาง configuration อาจ export secret ติดมาด้วย
- ชุดข้อมูลต้นทางอาจมี PII; ควรใช้เฉพาะใน environment ที่ได้รับอนุญาต
