# Magentic v2 Smoke Tests

ทดสอบกับ Langflow 1.7.3 ในโปรเจกต์ `NT` วันที่ 2026-08-05 หลัง import subflows และ Main flow

## Imported flow IDs

- SQL Specialist: `9c5b2d4b-4a48-44dd-855a-010183382e65`
- RAG Specialist: `02249380-50b6-42c2-9c93-94975bf297fb`
- Verification Specialist: `927b7571-b037-4bda-8584-bdb90931ffd3`
- Main Manager: `a2026d54-dda8-4eef-a3e8-876e0f94d674`

## Specialist isolation

ทั้งสาม subflows คืน Typed Result ที่มี `task_id`, `specialist`, `status`, `claims`, `evidence`, `errors`:

- SQL: `SELECT COUNT_BIG(*) FROM loans_fact` ได้ `1,432,440`
- RAG: ค้นนิยาม DTI และอ้างถึง `dti-calculation-guide.md`
- Verification: query ซ้ำและยืนยันจำนวน `1,432,440`

## Main end-to-end

คำถามทดสอบ:

> DTI หมายถึงอะไรตามเอกสารนโยบาย และใน loans_fact มีสินเชื่อทั้งหมดกี่รายการ ต้องมอบหมาย RAG Specialist และ SQL Specialist แยกกัน แล้วให้ Verification Specialist ตรวจทุก claim ก่อนตอบ

ผล: `status=complete`, ได้คำตอบว่า DTI คือ Debt-to-Income Ratio และมีสินเชื่อ `1,432,440` รายการ พร้อม execution trace:

1. `rag_001` → `rag` → `complete`
2. `sql_001` → `sql` → `complete`
3. `verify_001` → `verification` → `complete`

Manager ไม่มี MCP edge และไม่ได้ query/calculate เอง ส่วน deterministic final guard ยืนยันว่า task ledger เป็น typed arrays, ไม่มี placeholder, มี claims และมี Verification step ที่สำเร็จก่อนยอมให้ `status=complete`
