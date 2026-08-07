# Hybrid Vote 2-of-3 + Evidence Verification — Grounded-18 Run 1

## ยิงไปที่ไหน

- Flow file: `Hybrid with Vote-Based Orchestration/LAB-hybrid-vote-2of3-verified-thai.json`
- Flow name: `LAB-hybrid-vote-2of3-verified-thai`
- Flow ID: `5aa21611-7510-4e68-a8ab-5f72ec179550`
- Runtime endpoint: `http://127.0.0.1:7860/api/v1/run/5aa21611-7510-4e68-a8ab-5f72ec179550`
- Questions: `parallel-orchestration/benchmarks/finance-loan-grounded18/questions.txt`
- Ground: `parallel-orchestration/benchmarks/finance-loan-grounded18/ground-truth.json`
- Scoring: Final Answer only

## Summary

| Metric | Hybrid Vote-Based run 1 | Concurrent Vote ค่าเฉลี่ย 5 รอบ |
|---|---:|---:|
| Final Answer | 16/18 | 17.8/18 |
| Correctness | 66/90 | 72/90 |
| Faithfulness | 71/90 | 76.8/90 |
| Average latency | 30.82s | 15.10s |

Hybrid Vote-Based รอบแรกยังไม่ดีกว่า Concurrent Vote เดิม แม้ Evidence Verifier ลดการเติมสกุลเงินได้หลายข้อ แต่เพิ่มขั้นตอนและมี Final Answer หาย 2 ข้อ

## Per-question scores

| Q | Correctness | Faithfulness | Main finding |
|---|---:|---:|---|
| Q1 | 4 | 4 | ตัวเลขหลักถูก แต่ totals ถูกปัด |
| Q2 | 5 | 5 | จำนวนและสัดส่วนถูก |
| Q3 | 4 | 4 | status rows ถูก แต่ยอดรวมผิด 100 รายการ |
| Q4 | 5 | 5 | ครบและไม่เติมสกุลเงิน |
| Q5 | 5 | 5 | ครบทุก label และ metrics |
| Q6 | 2 | 5 | ขาด counts และรายละเอียด N/A |
| Q7 | 3 | 4 | ขาดค่าของ bucket ระหว่างกลางและอ้างนัยสำคัญโดยไม่มี test |
| Q8 | 5 | 5 | ครบทุก income band |
| Q9 | 5 | 5 | totals/gap/ratio ถูกและไม่เรียก approval rate |
| Q10 | 0 | 0 | ไม่มี Final Answer |
| Q11 | 3 | 3 | ไม่เติม currency แต่ตีความ funded amount และปัด gap ผิด |
| Q12 | 5 | 5 | สัดส่วนถูก |
| Q13 | 5 | 3 | ตัวเลขถูก แต่เพิ่ม status interpretation |
| Q14 | 2 | 3 | ใช้ funded totals แทน mapped averages และตีความว่าเงินปล่อยจริง |
| Q15 | 5 | 5 | ครบและไม่เติมสกุลเงิน |
| Q16 | 0 | 0 | ไม่มี Final Answer |
| Q17 | 3 | 5 | counts ถูก แต่ mapped metrics ไม่ครบ |
| Q18 | 5 | 5 | คำนวณถูกและไม่เติมสกุลเงิน |

## สิ่งที่ Verifier ช่วยได้

- Q4, Q8, Q9, Q15 และ Q18 ไม่เติมสกุลเงิน
- Q9 รักษาข้อจำกัดว่า funding ratio ไม่ใช่ approval rate
- Q8 และ Q15 ให้ตัวเลขครบและตรง ground

## สิ่งที่ Verifier ยังแก้ไม่ได้

- Q3 ปล่อยยอดรวมผิด ทั้งที่ status rows รวมได้ค่าที่ถูก
- Q6/Q7 ยังปล่อยคำตอบที่ขาด requested fields
- Q11 ยังปล่อย funded-amnt interpretation และ gap ที่ปัดผิด
- Q13/Q14 ยังปล่อย semantic interpretation ที่เกิน ground
- Q10 และ Q16 ไม่มี Final Answer

## คำตัดสิน

Architecture ทำงานตามเส้นทางที่ออกแบบและ Verifier ลด unsupported currency ได้จริง แต่ run แรกยังไม่บรรลุเป้าหมายด้านคุณภาพโดยรวมเมื่อเทียบกับ Concurrent Vote baseline เนื่องจาก availability ลดลง ความครบของคำตอบยังไม่ดีขึ้น และเวลาเฉลี่ยเพิ่มประมาณสองเท่า ต้องยิงซ้ำหลายรอบก่อนประเมิน non-determinism และต้องวิเคราะห์สาเหตุ output ว่างแยกจากคะแนนเนื้อหา
