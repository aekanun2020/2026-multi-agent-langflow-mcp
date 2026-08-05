# Magentic v3: Resilient Final Guard

v3 ใช้ SQL, RAG และ Verification subflows ชุดเดียวกับ v2 แต่เปลี่ยน Final Guard จาก schema-strict เป็น **claim-strict, schema-tolerant**

```mermaid
flowchart TD
    M["Manager Output"] --> J{"มี JSON ที่มี answer + claims?"}
    J -->|"ไม่มี"| B["Blocked: ไม่มี factual output"]
    J -->|"มี"| C{"ทุก claim มี key/value/evidence_ids?"}
    C -->|"ไม่ครบ"| B
    C -->|"ครบ"| U{"มี currency ที่ไม่ได้รับอนุญาต?"}
    U -->|"มี"| B
    U -->|"ไม่มี"| A["เติม default เฉพาะ audit metadata"]
    A --> V{"มี verification complete ใน trace?"}
    V -->|"มี"| O["Complete"]
    V -->|"ไม่มี"| P["Partial + audit warning"]
```

## Critical fields

- `answer`
- `claims`
- แต่ละ claim ต้องมี `key`, `value`, `evidence_ids` ที่ไม่ว่าง
- สกุลเงินในคำตอบ (`$`, `USD`, `บาท`, `THB`, `EUR`, `GBP`, `JPY` และสัญลักษณ์หลัก) ต้องได้รับอนุญาตจากหน่วยใน claim

ขาดหรือผิดแล้ว reject เพราะกระทบ claim integrity

## Repairable audit fields

- `task_ledger`
- `execution_trace`
- `uncertainties`
- `status`
- `answer` ที่เป็น object/array จะแปลงเป็น JSON string โดยไม่เปลี่ยนค่าภายใน

ขาดแล้ว Guard เติม deterministic default และบันทึกใน `audit_warnings` โดยไม่สร้างหรือแก้ factual claim หากไม่มี verification trace จะลดสถานะเป็น `partial`
