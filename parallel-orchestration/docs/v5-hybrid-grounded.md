# Concurrent v5: Hybrid Grounded Consensus

v5 รวมจุดแข็งของ v4 paper-exact semantic consensus กับแนวคิด Verification Specialist ของ Magentic v3 โดยไม่ใช้ rigid JSON contract หรือ Final Guard แบบ fail-closed

```mermaid
flowchart LR
    Q["User Question"] --> W1["Worker 1"]
    Q --> W2["Worker 2"]
    Q --> W3["Worker 3"]
    W1 --> C["Raw Answer Collector"]
    W2 --> C
    W3 --> C
    Q --> C
    C --> S["Semantic Consensus Draft"]
    Q --> B["Draft Review Bundle"]
    S --> B
    B --> V["Evidence Verification Agent"]
    SQL["MSSQL MCP"] --> V
    RAG["RAG MCP"] --> V
    V --> E["Language-only Faithfulness Editor"]
    E --> O["Final Answer"]
```

`Raw Answer Collector` และ `Draft Review Bundle` เป็น transport เท่านั้น ไม่ parse, score, validate หรือ reject เนื้อหา

Evidence Verification Agent ตรวจความหมายของ draft กับหลักฐานผ่าน tools แล้วแก้หรือตัด claim ที่ไม่รองรับ โดยยังตอบส่วนที่ตรวจสอบได้ จึงต่างจาก v3 Guard ที่อาจปฏิเสธทั้งคำตอบเมื่อ schema/key ไม่ครบ

Verifier เห็นทั้ง consensus draft และ raw answers ถ้า query ของตนขัดกับ Workers ทั้งสามที่ตรงกัน จะตรวจ schema/grain/formula ซ้ำก่อนแก้ค่า ส่วน Language-only Faithfulness Editor ไม่มี tools และห้ามคำนวณหรือเพิ่ม claim ทำหน้าที่รักษาข้อเท็จจริงและตัด unsupported interpretation จากภาษาสุดท้ายเท่านั้น

เป้าหมายเชิงทดลองคือรักษา correctness gain ของ v4 พร้อมกู้ faithfulness ที่เสียจาก invented currency, unsupported interpretation และ semantic mapping ที่ผิด

## Langflow และสถานะการทดสอบ

- Flow: `LAB-concurrent-v5-hybrid-grounded-consensus-thai`
- Flow ID: `cd488940-5fa4-4567-b5e8-43b26d5643ae`
- Project: `NT`
- แยก MSSQL/RAG MCP คนละคู่สำหรับ Worker 1–3 และ Verifier เพื่อลด shared-session collision
- จำกัด output ของ Agent แต่ละตัวไว้ที่ 8,192 tokens

Q1 smoke test ผ่านด้วย exact totals/averages และไม่สร้างสกุลเงิน ส่วน Q4 smoke test หลังเพิ่ม Language-only Faithfulness Editor ผ่านทั้ง requested metrics และไม่มี currency/speculation

Grounded-18 รอบก่อนเพิ่ม Final Editor ได้ผลโดยประมาณ correctness 80.0% และ faithfulness 86.7% เมื่อเลือก targeted rerun ล่าสุดแทนข้อที่แก้แล้ว ตัวเลขนี้ใช้สำหรับวินิจฉัย architecture เท่านั้น ไม่ใช่คะแนน final v5 ที่ frozen อย่างเป็นทางการ

การทดสอบ final architecture ที่ Q8/Q10/Q11 หยุดด้วย OpenRouter HTTP 402 (`Insufficient credits`) จึงยังห้ามสรุปคะแนนรวมของ final v5 ต้องรัน Grounded-18 ใหม่ทั้ง 18 ข้อเมื่อมีเครดิต และเก็บ raw artifact ชุดใหม่โดยไม่ผสมกับรอบก่อนแก้ architecture
