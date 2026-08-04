# Flow Versions: v4–v7

เอกสารนี้อธิบายวิวัฒนาการของ Langflow จาก single-agent baseline ไปสู่ concurrent consensus และ domain specialization สำหรับสินเชื่อ

## สรุปเปรียบเทียบ

| Version | รูปแบบหลัก | Workers | วิธีรวมผล | Final component | เหมาะกับ |
|---|---|---:|---|---|---|
| v4 | Single Agent + MCP | 1 | ไม่มี voting | Agent เดิมตอบโดยตรง | baseline และงานทั่วไป |
| v5 | Specialist parallel voting | 3 | deterministic 2-of-3 decision vote | Consensus Executor | การตัดสินใจแบบ enum เช่น notify/do_not_notify |
| v6 | Concurrent full-answer consensus | 3 | deterministic 2-of-3 ต่อ structured claim | Final Answer Synthesizer | analytical QA และคำถาม business logic หลายขั้น |
| v7 | Concurrent financial/loan consensus | 3 | claim consensus แบบ v6 พร้อม loan contract | Final Financial Answer Synthesizer | financial analytics และ loan portfolio reasoning |
| v8 | Guarded financial verbalization | 3 | claim consensus + deterministic output guard | LLM wording-only + Final Claim Guard | grounded loan answers ที่ห้าม LLM เพิ่ม claim |

## v4 — Single-agent baseline

ชื่อเดิม: `LAB-1-4-withlocal`

โครงสร้างมี 5 nodes และ 4 edges:

```text
Chat Input → Agent → Chat Output
               ├─ MSSQL MCP Tools
               └─ RAG MCP Tools
```

Agent หนึ่งตัวรับคำถาม เลือกใช้ MSSQL/RAG และสร้างคำตอบสุดท้ายโดยตรง จุดประสงค์ของ v4 คือเป็น baseline ที่เรียบง่ายและรักษาพฤติกรรมของ flow ต้นฉบับไว้

ข้อดี:

- latency และ token cost ต่ำกว่าแบบสาม agents
- flow เข้าใจง่ายและแก้ไขง่าย
- เหมาะกับคำถามทั่วไปที่ตรวจสอบได้จาก tool call ไม่กี่ครั้ง

ข้อจำกัด:

- ไม่มี independent verification
- หาก Agent เลือก table, policy, สูตร หรือหน่วยผิด จะไม่มี worker อื่นช่วยคัดค้าน
- คำตอบอาจผันผวนตาม tool path และการตีความของ Agent ครั้งเดียว

ไฟล์ต้นทางเดิมอยู่นอก repo ที่ `/Users/grizzlymacbookpro/Downloads/LAB-1-4-withlocal.json`; v5 ถูกสร้างต่อจาก baseline นี้

## v5 — Specialist parallel vote-based consensus

ชื่อ: `LAB-1-4-withlocal-parallel-consensus-v5-thai`

```text
คำถาม
  ├─ Policy Worker ──┐
  ├─ Evidence Worker ├─ Deterministic Vote Aggregator → Consensus Executor → Chat Output
  └─ Risk Worker ────┘
```

Workers มีหน้าที่ต่างกัน:

1. Policy Worker ตรวจนโยบายและเงื่อนไข
2. Evidence Worker ตรวจข้อมูล MSSQL และคุณภาพหลักฐาน
3. Risk Worker ตรวจข้อมูลขาด ความขัดแย้ง และความเสี่ยง

แต่ละ worker คืน decision enum เช่น `notify`, `do_not_notify` หรือ `abstain` จากนั้น custom aggregator นับคะแนนแบบ deterministic และต้องได้เสียงตรงกันอย่างน้อย 2 ใน 3 จึงผ่าน threshold

จุดสำคัญของ `abstain`: worker งดลงคะแนนเมื่อหลักฐานไม่พอหรือ output ไม่เป็น schema ที่กำหนด เสียง abstain ไม่ควรถูกตีความว่าเห็นด้วยหรือไม่เห็นด้วยกับ business decision

ข้อดี:

- เหมาะกับ decision gate ที่มีชุดคำตอบจำกัด
- vote count และ threshold ตรวจสอบซ้ำได้
- แยก policy/evidence/risk อย่างชัดเจน

ข้อจำกัด:

- workers ไม่ได้ตอบโจทย์ฉบับเต็มเหมือนกัน จึงไม่ใช่ independent replication
- enum แบบ notification สูญเสียรายละเอียดของคำตอบเชิงตัวเลขและ business logic
- เสียงข้างมากอาจตรงกันที่ decision แต่ใช้เหตุผลหรือค่าคำนวณคนละชุด
- จึงเก็บ v5 เป็น legacy/reference สำหรับเปรียบเทียบ ไม่ใช่ flow หลักของ analytical QA

## v6 — Concurrent full-answer claim consensus

ชื่อ: `LAB-1-4-withlocal-concurrent-consensus-v6-thai`

แนวคิดอ้างอิง: [การแก้ปัญหาคำตอบที่ไม่คงเส้นคงวาของ Agent ด้วย Multi-Agent with Concurrent Orchestration](https://aekanunbigdata.medium.com/การแก้ปัญหาคำตอบที่ไม่คงเส้นคงวาของ-agent-ด้วย-multi-agent-with-concurrent-orchestration-bfe6e0b7a96f)

```text
คำถามเดียวกัน
  ├─ Full-Answer Agent 1 ─┐
  ├─ Full-Answer Agent 2 ─┼─ Claim Consensus → Final Answer Synthesizer → Chat Output
  └─ Full-Answer Agent 3 ─┘
```

v6 เปลี่ยนจาก specialist voting เป็น independent full-answer replication: Agent ทั้งสามได้รับคำถาม, tools และ instructions เหมือนกัน แต่สร้างคำตอบฉบับเต็มแยกจากกัน พร้อม `claims`, `calculations`, `evidence`, `uncertainties` และ `confidence`

ส่วนที่ตรงกับบทความคือ same-task concurrent workers และการรวมหลายผลลัพธ์เพื่อลดความผันผวน ส่วน claim schema, deterministic 2-of-3 threshold และ Final Synthesizer เป็นส่วนที่ v6 เพิ่มขึ้นในการนำแนวคิดมาทำงานจริงบน Langflow

Aggregator เปรียบเทียบ claim ด้วย stable key และ canonical value:

- ค่าที่ตรงกันอย่างน้อย 2 ใน 3 เป็น `agreed_claim`
- ค่าที่ไม่ถึง threshold เป็น `disputed_claim`
- Final Synthesizer ใช้ agreed claims เป็นแกน และตรวจ evidence/calculation เมื่อมีข้อขัดแย้ง

Final Synthesizer ไม่มี MCP/tool edge จึงไม่สามารถเปลี่ยนหลักฐานหรือทำ external action หลังการโหวตได้

ข้อดี:

- เหมาะกับคำถามวิเคราะห์ที่มีหลายตัวเลข สูตร และ business conditions
- ตรวจ consensus ในระดับข้อเท็จจริง ไม่ใช่แค่ decision label
- minority/disputed claims ยังคงอยู่ให้ final stage พิจารณา

ข้อจำกัด:

- ใช้เวลาและ token มากกว่า v4
- claim key ที่ workers ตั้งไม่คงที่อาจทำให้ค่าที่มีความหมายเดียวกันไม่ถูกจับคู่
- 2-of-3 consensus ลดความผันผวน แต่ไม่รับประกัน correctness หาก Agents ใช้หลักฐานหรือความเข้าใจผิดชุดเดียวกัน

ผล Hard-10 ล่าสุด: availability 100%, correctness 56%, faithfulness 72%

อ่านรายละเอียดเพิ่มเติมที่ [v6-concurrent-orchestration.md](v6-concurrent-orchestration.md)

## v7 — Financial and loan specialization

ชื่อ: `LAB-1-4-withlocal-concurrent-consensus-v7-financial-loan-thai`

v7 คง orchestration ของ v6 แต่เพิ่ม financial/loan analytical contract ให้ Agent ทั้งสามและ Final Synthesizer โดยเฉพาะ

ข้อมูลหลัก:

- Fact: `loans_fact`
- Dimensions: `application_type_dim`, `emp_length_dim`, `home_ownership_dim`, `issue_d_dim`, `loan_status_dim`
- Measures: requested/funded amount, interest rate, installment, annual income, joint income, DTI และ joint DTI

กติกาที่เพิ่ม:

- join dimension ผ่าน `*_id`
- แยก `loan_amnt` จาก `funded_amnt`
- แปลง `int_rate` จาก decimal เป็นเปอร์เซ็นต์เมื่อแสดงผล
- ระบุ population, filter, numerator, denominator, หน่วย และช่วงเวลา
- แยก Individual และ Joint App; ไม่แทน joint fields ที่เป็น NULL ด้วยศูนย์
- ตรวจและรายงาน NULL, DTI ติดลบ และ sentinel/outlier เช่น `999` ก่อน aggregate
- ไม่ใช้ installment รายการเดียวแทน total monthly debt ในสูตร DTI
- อ้างสูตรและช่วง DTI จาก RAG แต่ไม่ใช้ DTI เพียงตัวเดียวตัดสิน approve/deny
- แยก descriptive result, policy, assumptions, derived calculations และ underwriting limitation

ข้อดี:

- ลดความผิดพลาดเรื่องหน่วย เปอร์เซ็นต์ population และ DTI semantics
- claim keys ทางสินเชื่อคงที่ขึ้น ทำให้ consensus จับคู่ผลได้ดีขึ้น
- เหมาะกับ portfolio analysis, status comparison, exposure, pricing และ DTI policy interpretation

ข้อจำกัด:

- ไม่ใช่ credit-scoring model และไม่ควรใช้ตัดสินสินเชื่อจริงโดยไม่มี policy/model/feature ที่ครบถ้วน
- policy ใน RAG เป็นแนวทางทั่วไป ต้องไม่แทน underwriting policy ของสถาบันโดยอัตโนมัติ
- ยังต้อง benchmark ด้วย loan-specific ground truth ก่อนสรุปประสิทธิภาพเทียบ v6

อ่านรายละเอียดเพิ่มเติมที่ [v7-financial-loan.md](v7-financial-loan.md)

## v8 — Guarded wording-only verbalizer

ชื่อ: `LAB-1-4-withlocal-concurrent-consensus-v8-guarded-verbalizer-thai`

v8 แก้ failure ที่พบจาก Grounded-18 ซึ่ง Final Synthesizer ของ v7 เพิ่มสกุลเงิน เปลี่ยน metric และเปิดเผย reasoning หลัง consensus โดยยังคง Analysts และ claim voting เดิม แต่จำกัด LLM ขั้นสุดท้ายให้เสนอเพียงข้อความนำ ข้อความปิด และ label ภาษาไทย

Deterministic Final Claim Guard จะตรวจ schema และคำต้องห้าม ก่อนประกอบค่าจริงจาก `agreed_claims` ด้วยโค้ด หาก LLM ใช้ key นอก consensus หรือเพิ่มตัวเลข หน่วย สกุลเงิน policy หรือข้อความเชิงตัดสิน ระบบจะทิ้ง proposal และ fallback เป็น claim keys ที่ deterministic

ข้อดี:

- LLM แก้หรือปัดเศษค่าที่ผ่าน vote ไม่ได้
- reasoning ดิบจาก LLM ไม่มี edge ไป Chat Output
- ป้องกันการแต่ง USD/THB, approval, risk และ causality ใน final stage
- failure ของ verbalizer เปลี่ยนเป็น safe deterministic fallback

ข้อจำกัด:

- ความถูกต้องยังขึ้นกับ claims ที่ผ่าน consensus; guard ไม่สามารถแก้ correlated worker error
- คำตอบ fallback อ่านแข็งกว่า natural-language answer
- ต้อง benchmark Grounded-18 ใหม่ก่อนสรุป improvement เชิงตัวเลข

อ่านรายละเอียดเพิ่มเติมที่ [v8-guarded-verbalizer.md](v8-guarded-verbalizer.md)

## แนวทางเลือกใช้

- ใช้ v4 เมื่อต้องการ baseline ที่เร็วและคำถามไม่ซับซ้อน
- ใช้ v5 เมื่อ output เป็น decision enum ที่นิยามชัดและต้องมี deterministic quorum
- ใช้ v6 เมื่อแต่ละ worker ควรแก้โจทย์เต็มรูปแบบและต้องรวมข้อเท็จจริงหลายรายการ
- ใช้ v7 เมื่อโจทย์เป็น financial/loan และต้องควบคุมนิยามข้อมูล หน่วย DTI และข้อจำกัดทาง underwriting
- ใช้ v8 เมื่อโจทย์ financial/loan ต้องการให้ LLM เรียบเรียงภาษา แต่ห้ามเพิ่มหรือแก้ factual claims หลัง vote
