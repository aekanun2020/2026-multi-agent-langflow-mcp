# Finance/Loan Grounded-18 — Concurrent Vote 2-of-3 Non-determinism Rerun

## ยิงไปที่ไหน

- Flow file: `Multi-Agent with Concurrent Orchestration/LAB-concurrent-vote-2of3-retry-thai.json`
- Flow name: `LAB-concurrent-vote-2of3-retry-thai`
- Flow ID: `4e193ed2-8649-475d-8ecc-db05a23e9839`
- Runtime endpoint: `http://127.0.0.1:7860/api/v1/run/4e193ed2-8649-475d-8ecc-db05a23e9839`
- Questions: `parallel-orchestration/benchmarks/finance-loan-grounded18/questions.txt`
- Ground: `parallel-orchestration/benchmarks/finance-loan-grounded18/ground-truth.json`
- Rubric: Final Answer only; 0–5 correctness and 0–5 faithfulness per question
- Previous run: `evaluation-finance-loan-grounded18-20260806.md`

## ผลรวมเทียบกับรอบก่อน

| Metric | รอบก่อน 2026-08-06 | รอบซ้ำ 2026-08-07 | ผลต่าง |
|---|---:|---:|---:|
| Successful answers | 18/18 | 18/18 | คงเดิม |
| Runtime errors | 0 | 0 | คงเดิม |
| Correctness | 73/90 | 73/90 | 0 |
| Faithfulness | 79/90 | 78/90 | -1 |
| Average latency | 15.29s | 14.25s | -1.04s |

คะแนนรวม correctness คงเดิม แต่ไม่ได้หมายความว่าคำตอบเหมือนเดิม: Q4 และ Q15 ลดลง ขณะที่ Q6 และ Q7 เพิ่มขึ้น จึงหักล้างกันพอดี ส่วน faithfulness ลดลงสุทธิ 1 คะแนน

## เปรียบเทียบรายข้อ

| Q | Correctness ก่อน→ใหม่ | Faithfulness ก่อน→ใหม่ | ประเมินการเปลี่ยนแปลง |
|---|---:|---:|---|
| Q1 | 4→4 | 4→4 | คงเดิม: ตัวเลขหลักถูก แต่ totals ยังถูกปัด |
| Q2 | 5→5 | 5→5 | คงเดิม |
| Q3 | 5→5 | 5→5 | คงเดิม |
| Q4 | 5→4 | 5→4 | แย่ลง: รอบใหม่เติมหน่วยบาทที่ ground ไม่มี |
| Q5 | 4→4 | 5→4 | faithfulness แย่ลง: รอบใหม่เติมสกุลดอลลาร์ |
| Q6 | 2→3 | 5→4 | correctness ดีขึ้นเพราะตอบ N/A และ 1 year ครบขึ้น แต่ยังไม่มีจำนวนรายการ; faithfulness ลดเพราะเติมบาท |
| Q7 | 4→5 | 4→5 | ดีขึ้น: รอบใหม่รายงานครบและไม่เติมสกุลเงิน |
| Q8 | 5→5 | 4→5 | faithfulness ดีขึ้น: ข้อสรุปเป็นแนวโน้มเชิงพรรณนาและไม่กล่าวเกินหลักฐาน |
| Q9 | 5→5 | 5→5 | คงเดิม |
| Q10 | 3→3 | 5→5 | คงเดิม: labels และ benchmark ถูก แต่ยังขาดค่าราย segment |
| Q11 | 3→3 | 2→3 | faithfulness ดีขึ้นเล็กน้อยเพราะไม่เพิ่มส่วนต่างผิด แต่ยังเติมบาทและตีความ funded amount |
| Q12 | 5→5 | 5→5 | คงเดิม |
| Q13 | 5→5 | 3→3 | คงเดิม: ตัวเลขถูก แต่ยังอธิบายสถานะเกิน ground |
| Q14 | 2→2 | 4→4 | คงเดิม: ใช้ funded totals แทน mapped cohort averages และเติมบาท |
| Q15 | 5→4 | 5→4 | แย่ลง: รอบใหม่เติมสกุลดอลลาร์ |
| Q16 | 4→4 | 4→4 | คงเดิม: extrema ถูก แต่เติมบาท |
| Q17 | 3→3 | 5→5 | คงเดิม: bucket counts ถูก แต่ไม่ครบ mapped metrics |
| Q18 | 4→4 | 4→4 | คงเดิม: calculations ถูก แต่เติมบาท |

## ระดับความเป็น non-deterministic

- Correctness เท่าเดิม 14/18 ข้อ (77.8%); เปลี่ยน 4/18 ข้อ
- Faithfulness เท่าเดิม 11/18 ข้อ (61.1%); เปลี่ยน 7/18 ข้อ
- คู่คะแนน correctness/faithfulness เหมือนเดิมทั้งคู่ 11/18 ข้อ (61.1%)
- ความสำเร็จของระบบคงที่ 18/18 และคะแนนรวม correctness คงที่ แต่รายละเอียดคำตอบและคะแนนรายข้อยังแปรปรวนชัดเจน
- แหล่งความแปรปรวนหลักคือการเติมสกุลเงินที่ไม่มี metadata, ความครบของ requested fields และการเพิ่มคำอธิบายเกิน ground

ดังนั้น Flow นี้ลดความเสี่ยงที่คำตอบหลักจะหลุดมากจนระบบล้มเหลวได้ดี แต่ **ยังไม่ deterministic ในระดับ claim และความครบของคำตอบ** การที่ Vote Agent รับเมื่อ 2 ใน 3 มีสาระสำคัญตรงกัน ไม่ได้บังคับให้รายละเอียดรอง หน่วย และคำอธิบายของ Final Answer เหมือนเดิมทุกครั้ง
