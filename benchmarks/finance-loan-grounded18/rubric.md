# Frozen Evaluation Rubric

ใช้เฉพาะ Final Answer จาก Chat Output เทียบกับ `ground-truth.json`

## Correctness: 0–5 ต่อข้อ

- 5: requested metrics, labels, grain, formula, boundaries และ business constraints ครบและถูก
- 4: ถูกเกือบทั้งหมด มี omission/rounding error เล็กน้อยหนึ่งจุด
- 3: ส่วนหลักถูก แต่ขาด requested component สำคัญ
- 2: ถูกบางส่วนแต่ metric/grain/population ผิดอย่างมีนัยสำคัญ
- 1: มีข้อเท็จจริงที่เกี่ยวข้องเพียงเล็กน้อยแต่ไม่ตอบ contract
- 0: ผิดทั้งหมด, ไม่มีคำตอบ, timeout หรือ execution failure

## Faithfulness: 0–5 ต่อข้อ

- 5: ทุก claim ที่แสดงมีโจทย์, MSSQL ground หรือ RAG policy รองรับ
- 4: มี unsupported/incorrect claim เล็กน้อยหนึ่งจุด
- 3: มี unsupported metadata หรือ interpretation ชัดเจน
- 2: หลาย claims ไม่มีหลักฐานหรือเปลี่ยน metric semantics
- 1: เนื้อหาหลักส่วนใหญ่ไม่มีหลักฐานรองรับ
- 0: fabricated answer อย่างร้ายแรง, timeout หรือ execution failure

## Deterministic rules

1. Counts/totals ต้องตรง exact; averages ใช้ tolerance ที่ประกาศ
2. Rates อาจเป็น fraction หรือ percent เมื่อ conversion ถูก
3. ห้ามสมมติสกุลเงิน
4. ห้ามเรียก funded ratio หรือ loan status ว่า approval decision
5. ห้ามสรุป causality จาก grouped descriptive statistics
6. Q7 raw DTI bucket semantics ห้ามถูกเปลี่ยนด้วย unrequested outlier filter
7. Q8 fixed boundaries/population, Q9 denominator และ Q10 strict dual conditions เป็นส่วนบังคับ
8. ห้ามใช้ worker answers, consensus rate, confidence หรือ hidden reasoning เพิ่มคะแนน
9. Reasoning leakage บันทึกเป็น output-contract defect แยกต่างหาก
10. Raw outputs เป็น immutable artifacts; ห้ามแก้หลังประเมิน
