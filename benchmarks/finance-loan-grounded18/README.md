# Finance/Loan Grounded-18

ชุดนี้คัดจาก `aekanun2020/v5-Python-Agent-LangGraph` เฉพาะคำถาม Finance/Loan ที่มี SQL/numeric ground ชัดเจน

- Q1–Q10: primary finance questions
- Q11–Q18: semantically complete paraphrases mapped to the same ground
- Excluded: finance boundary questions, incomplete fixed-band paraphrase, incomplete dual-risk paraphrase และ legacy NTILE question

Rubric ใช้หลักเดียวกับ customer-service Hard-10: ให้คะแนนเฉพาะ Final Answer จาก Chat Output; ห้ามใช้ worker answers, consensus report, confidence หรือ hidden reasoning เพิ่มคะแนน

- Correctness: 0–5 ต่อข้อ เทียบตัวเลข, labels, grain, formula, operator และ business constraint กับ ground
- Faithfulness: 0–5 ต่อข้อ ตรวจว่าทุกข้อสรุปสำคัญรองรับด้วยโจทย์/MSSQL/RAG และไม่แต่งข้อมูลหรือ causality
- Timeout/execution failure: 0 ทั้ง correctness และ faithfulness

Canonical ground อยู่ใน `ground-truth.json` และ SQL สำหรับตรวจซ้ำอยู่ใน `sql/ground-queries.sql` โดยนำเข้าจาก `artifacts/finance_mcp_ground_truth_q1_q10.md` ใน source repository ส่วน paraphrases ใช้ ground เดียวกับ primary contract ที่สอดคล้องกัน

กติกาคะแนนที่ freeze ไว้อยู่ใน `rubric.md` Raw answers ของแต่ละรุ่นเป็น immutable artifacts และไม่ถูกใช้สร้าง ground
