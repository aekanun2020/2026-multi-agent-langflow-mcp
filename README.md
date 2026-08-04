# 2026 Multi-Agent Langflow MCP

ตัวอย่าง Langflow 1.7.3 สำหรับงาน multi-agent แบบ parallel workers และ deterministic vote aggregation พร้อม benchmark ที่ใช้ MSSQL + RAG เป็น ground

## โครงสร้าง

```text
flows/
  LAB-1-4-withlocal-parallel-consensus-v5-thai.json
benchmarks/customer-service-hard10/
  questions.txt
  ground-truth.md
  evaluation.md
scripts/
  run_langflow_hard10.py
  inspect_mcp_servers.py
  call_mcp_tool.py
```

## Flow v5

Flow ประกอบด้วย worker อิสระ 3 ตัว:

1. Policy worker — ตรวจนโยบายและเงื่อนไขสิทธิ์
2. Evidence worker — ตรวจข้อมูล MSSQL และคุณภาพหลักฐาน
3. Risk worker — ตรวจความขัดแย้ง ข้อมูลขาด และความเสี่ยง

ผลจาก workers ถูกส่งเข้า deterministic vote aggregator ก่อนส่งให้ executor สรุปเป็นภาษาไทย

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

ผลการทดสอบ v5 รอบแรกด้านล่างถูก **invalidated** เพราะ runner รุ่นแรก override system prompt ของ Executor ด้วย safe-mode tweak จึงเก็บไว้เป็นประวัติเท่านั้น ไม่ใช่ clean SUT baseline:

- Availability: 9/10
- Correctness รวม timeout: 19/50 = 38.0%
- Correctness เฉพาะข้อที่ตอบ: 19/45 = 42.2%
- Faithfulness เฉพาะข้อที่ตอบ: 25/45 = 55.6%

ดูรายละเอียดรายข้อใน [evaluation.md](benchmarks/customer-service-hard10/evaluation.md)

## Run benchmark

Langflow ต้องทำงานที่ `http://localhost:7860` และมี flow ID ตรงกับค่าที่ตั้งในสคริปต์:

```bash
python3 scripts/run_langflow_hard10.py benchmarks/customer-service-hard10/questions.txt
```

สคริปต์สร้าง session ใหม่ต่อคำถามหนึ่งข้อเพื่อไม่ให้คำตอบก่อนหน้ารั่วข้ามข้อ และไม่ส่ง `tweaks` ใด ๆ ไปเปลี่ยน flow ดังนั้นคำตอบมาจาก SUT ที่ import อยู่ใน Langflow โดยตรง

> คำเตือน: runner เรียก flow เดิมแบบ end-to-end หาก Executor ของ flow มีสิทธิ์เรียกเครื่องมือที่เปลี่ยนแปลงข้อมูล ผู้ทดสอบต้องจัด MCP แบบ read-only หรือ test doubles ที่ชั้น environment โดยห้ามแก้ prompt/parameters ของ SUT ระหว่างการประเมิน

## Security

- ห้าม commit API keys, database passwords หรือ bearer tokens
- ตรวจ flow export ทุกครั้งก่อน commit เพราะ Langflow บาง configuration อาจ export secret ติดมาด้วย
- ชุดข้อมูลต้นทางอาจมี PII; ควรใช้เฉพาะใน environment ที่ได้รับอนุญาต
