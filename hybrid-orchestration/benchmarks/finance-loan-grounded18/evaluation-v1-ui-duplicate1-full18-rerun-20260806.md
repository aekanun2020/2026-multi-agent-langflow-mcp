# Hybrid v1 UI Duplicate (1) — Full Grounded-18 Rerun

วันที่ทดสอบและประเมิน: 2026-08-06

- Flow: `LAB-hybrid-v1-grounded-consensus-thai-ui-upload-20260805 (1)`
- Flow ID: `d05b8974-53bd-4726-ba56-ca27e9e6d033`
- ใช้เฉพาะ Final Answer ของแต่ละข้อในการให้คะแนน
- คะแนน 0–5 ต่อ metric ต่อข้อ
- Q1–Q17 สำเร็จรอบแรก; Q18 สำเร็จหลัง retry เพราะ MSSQL MCP tool คืน HTTP 500 ในรอบแรก

## Aggregate

| Metric | Result |
|---|---:|
| First-pass availability | 17/18 (94.4%) |
| Eventual availability | 18/18 (100.0%) |
| Correctness | 75/90 (83.3%) |
| Faithfulness | 73/90 (81.1%) |

## รายข้อ

| Q | C | F | เหตุผลหลัก |
|---:|---:|---:|---|
| 1 | 5 | 5 | totals/averages exact และไม่สร้างสกุลเงิน |
| 2 | 4 | 4 | counts ถูก; เปอร์เซ็นต์ปัดหยาบและนิยามบางส่วนอนุมานจาก schema |
| 3 | 4 | 5 | ครบทุก status แต่เปอร์เซ็นต์ปัดสองตำแหน่ง |
| 4 | 4 | 4 | ตัวเลขถูกแบบปัดเศษ แต่ claim เรื่อง fraction ไม่เห็นหลักฐาน RAG รองรับ |
| 5 | 5 | 5 | ครบทุก label/metric และไม่ตัดกลุ่มเล็ก |
| 6 | 5 | 4 | extrema/count/average ถูก; ตีความ N/A ว่า missing เกินหลักฐานตรง |
| 7 | 4 | 3 | buckets ถูก แต่ rates หยาบและใช้คำว่า “มีนัยสำคัญ” โดยไม่ทดสอบ |
| 8 | 5 | 5 | ครบทั้ง count, min/max และ averages; ไม่อ้างเหตุผลเชิงสาเหตุ |
| 9 | 4 | 4 | totals/gap ถูก แต่ ratio ปี 2016 ปัดผิดและกลับเรียกว่า exact |
| 10 | 5 | 3 | metrics ถูก; ความเหมาะสมของ dti_joint อนุมานจาก schema ไม่ใช่ RAG |
| 11 | 2 | 3 | denominator 1,429,542 ขัดกับ excluded 1,703 และไม่แจกแจงค่า zero ที่ถูกตัด |
| 12 | 4 | 3 | ข้อสรุปปฏิเสธถูกทิศทาง แต่ยกนิยาม installment ให้ RAG เกินหลักฐาน |
| 13 | 5 | 5 | benchmark และ 5 กลุ่ม strict > ถูกครบ; ไม่อ้าง causality |
| 14 | 5 | 5 | MORTGAGE เป็นผลเดียวที่ผ่านและ benchmark ถูกครบ |
| 15 | 5 | 5 | winner รายปีและค่าประกอบครบ; ไม่อ้าง causality |
| 16 | 3 | 3 | เลือก DTI <=42 หลังยอมรับว่าไม่มี policy เฉพาะ และ exclusion waterfall ยังไม่ครบจากพอร์ตทั้งหมด |
| 17 | 4 | 4 | ตัวเลขดีและอธิบาย population shift ถูก แต่ใช้ <=36 ขณะที่ข้อความ RAG คือ <36 |
| 18 | 2 | 3 | ขาด averages และ RAG chunk; DTI raw/policy buckets กับผลรวมมีข้อขัดแย้งสำคัญ |

## จุดบกพร่องสำคัญ

1. Q11 ระบุ policy denominator `1,429,542` แต่บอกว่าตัดเพียง `1,703`; สองจำนวนนี้ reconcile กันไม่ได้ เพราะ `1,432,440 - 1,429,542 = 2,898`.
2. Q18 ขาด requested/funded averages และไม่มี source/chunk สำหรับ policy claim ตามที่โจทย์บังคับ.
3. Q18 policy buckets รวมจำนวนไม่ตรง valid population และมีช่องว่างของ boundary ระหว่างช่วง 36–42 กับ 43–50.
4. Q7, Q10 และ Q12 มี claim เชิงความหมายที่ก้าวเกินหลักฐาน แม้ตัวเลขหลักจะถูกต้อง.

คะแนนนี้ไม่รวมคำตอบของ worker ภายใน ใช้เฉพาะ final answer ตามเกณฑ์ของผู้ทดสอบเท่านั้น
