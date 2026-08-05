# Magentic v3 Smoke Tests

วันที่ทดสอบ: 2026-08-05  
Flow ID: `8eaf7f25-fee0-4b77-be4d-ae4f9d2414bf`

## Q5 regression

ใช้คำถาม `home_ownership` ที่ v2 Grounded-18 เคยถูก Final Guard ปฏิเสธ ผลรอบยืนยันของ v3:

- `status=complete`
- คืนครบ 5 labels รวม `NONE` ที่มีเพียง 5 รายการ
- มี SQL และ Verification complete ใน execution trace
- ไม่มีสกุลเงินใน Final Answer
- claims ทุกตัวมี `evidence_ids`

ระหว่าง smoke test รอบแรกพบว่า Manager เพิ่ม `USD` และ currency detector เดิมตรวจเพียง `$`, `บาท`, `฿` จึงขยาย detector ให้ครอบคลุม `USD`, `THB`, `EUR`, `GBP`, `JPY` และชื่อ/สัญลักษณ์หลักก่อนถือว่าทดสอบผ่าน

## Missing-audit-key test

จงใจสั่งให้ Manager ส่งเฉพาะ `answer` และ `claims` โดยละ `status`, `task_ledger`, `execution_trace` และ `uncertainties`

ผลลัพธ์:

- Guard รักษาคำตอบ `loan_count = 1,432,440` และ claim ที่มี `evidence_ids=["E1"]`
- เติม task ledger และ audit arrays ด้วย deterministic defaults
- เพิ่ม `audit_warnings` ระบุทุก field ที่เติม
- ลด `status` เป็น `partial` เพราะ final payload ไม่มี Verification trace
- ไม่ reject และไม่สร้าง factual claim ใหม่

ผลนี้ยืนยันว่า v3 ผ่อนปรนเฉพาะ audit schema แต่ยังรักษา claim-integrity boundary
