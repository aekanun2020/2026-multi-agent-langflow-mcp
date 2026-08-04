# v6 Concurrent Full-Answer Orchestration

v6 นำแนวคิดจากบทความ [การแก้ปัญหาคำตอบที่ไม่คงเส้นคงวาของ Agent ด้วย Multi-Agent with Concurrent Orchestration](https://aekanunbigdata.medium.com/การแก้ปัญหาคำตอบที่ไม่คงเส้นคงวาของ-agent-ด้วย-multi-agent-with-concurrent-orchestration-bfe6e0b7a96f) มาประยุกต์ใช้ โดยส่งคำถามเดียวกันให้ Agents หลายตัวทำงานอย่างอิสระพร้อมกัน แล้วรวมคำตอบเพื่อลดผลกระทบจาก non-determinism

v6 ไม่ได้อ้างว่าเหมือน implementation ในบทความทุกประการ: flow นี้เพิ่ม structured claims, deterministic 2-of-3 claim threshold และ Final Answer Synthesizer เป็นกลไกเฉพาะของ Langflow implementation นี้

## Objective

ลดความไม่คงเส้นคงวาของคำตอบด้วยการให้ Agents หลายตัวแก้โจทย์เดียวกันอย่างอิสระและพร้อมกัน แล้วรวมผลระดับ claim ก่อนสร้าง Final Answer

## Topology

```text
Chat Input
  ├── Full-Answer Agent 1 ─┐
  ├── Full-Answer Agent 2 ─┼── Claim Consensus ── Final Answer Synthesizer ── Chat Output
  └── Full-Answer Agent 3 ─┘
          ▲         ▲
          │         │
       MSSQL MCP  RAG MCP
```

## Candidate contract

Agent ทุกตัวใช้ contract เดียวกัน:

```json
{
  "answer": "คำตอบฉบับเต็ม",
  "claims": [
    {
      "key": "total_exposure",
      "value": 17180,
      "evidence": ["quantity × purchase_price ของ case 2, 3, 9"]
    }
  ],
  "calculations": ["3780 + 8900 + 4500 = 17180"],
  "uncertainties": [],
  "confidence": 0.95
}
```

## Consensus logic

Aggregator ทำงานแบบ deterministic:

1. Parse candidate JSON ทั้งสาม โดยรองรับข้อความที่มี JSON ปะปน
2. Group claims ด้วย `key`
3. Canonicalize `value` เป็น JSON เพื่อเทียบชนิดและค่า
4. ค่าเดียวกันอย่างน้อย 2 ใน 3 ถูกจัดเป็น `agreed_claims`
5. Claim ที่ไม่ถึง threshold ถูกส่งเป็น `disputed_claims` พร้อม variants, evidence และ supporting workers
6. Candidate ที่ parse ไม่ได้ยังถูกส่งต่อพร้อม `parse_error` โดยไม่ปลอมเป็น vote

สถานะมีสามแบบ:

- `full_consensus`
- `partial_consensus`
- `no_claim_consensus`

สถานะเหล่านี้อธิบายความสอดคล้องของคำตอบ ไม่ใช่ business decision

## Final synthesis

Final Synthesizer:

- ใช้ agreed claims เป็นแกน
- พิจารณา evidence/calculations ของ disputed claims
- รักษา assumptions ที่ระบุในโจทย์
- ตอบส่วนที่ยืนยันได้แม้บาง claim ยังไม่แน่นอน
- ไม่มี tools และห้าม external action
- ไม่ใช้ notification vote schema

## Independence

Agents ทั้งสามใช้ prompt และ tools เหมือนกัน แต่ใช้ seed 101, 202 และ 303 เพื่อสร้าง independent candidate paths โดยตั้ง temperature 0.1 เพื่อลดความผันผวนโดยยังให้เกิดความหลากหลายพอสำหรับ consensus

## Langflow deployment

- Flow name: `LAB-1-4-withlocal-concurrent-consensus-v6-thai`
- Project: `NT`
- Langflow 1.7.3 flow ID ใน test container: `9ad2bdfd-01b1-4cd1-9f3c-494df86182ae`
- Nodes: 9
- Edges: 15

API keys ไม่อยู่ใน exported JSON การ sync design เข้า container ใช้ `sync_flow_design.py` ซึ่งรักษา secret เดิมใน target flow โดยไม่เขียนลงไฟล์

## Smoke test

Q1 ผ่าน end-to-end:

- Agents ทั้งสามให้ `eligible_case_ids = [2,3,9]`
- Agents ทั้งสามให้ `total_units = 4`
- Claims อย่างน้อยสองตัวให้ `total_cases = 3` และ `total_exposure = 17180`
- Final Answer ตรง ground truth หลักทั้งหมด

ข้อจำกัดที่ยังพบ: โมเดลยังปล่อยข้อความ reasoning และ `</think>` ก่อน Final Answer แม้ synthesizer prompt สั่งไม่ให้แสดง จึงควรเพิ่ม deterministic output sanitizer ในรุ่นถัดไปหากต้องการ clean presentation
