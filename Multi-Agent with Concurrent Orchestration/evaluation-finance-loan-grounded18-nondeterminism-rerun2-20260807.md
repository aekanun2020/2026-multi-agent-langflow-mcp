# Finance/Loan Grounded-18 — Concurrent Vote 2-of-3 Non-determinism Rerun 2

## ยิงไปที่ไหน

- Flow file: `Multi-Agent with Concurrent Orchestration/LAB-concurrent-vote-2of3-retry-thai.json`
- Flow name: `LAB-concurrent-vote-2of3-retry-thai`
- Flow ID: `4e193ed2-8649-475d-8ecc-db05a23e9839`
- Runtime endpoint: `http://127.0.0.1:7860/api/v1/run/4e193ed2-8649-475d-8ecc-db05a23e9839`
- Questions: `parallel-orchestration/benchmarks/finance-loan-grounded18/questions.txt`
- Ground: `parallel-orchestration/benchmarks/finance-loan-grounded18/ground-truth.json`
- Scoring: Final Answer only

## ผลรวมสามรอบ

| Run | Final Answer ใช้งานได้ | Correctness | Faithfulness | เวลาเฉลี่ย |
|---|---:|---:|---:|---:|
| รอบแรก 2026-08-06 | 18/18 | 73/90 | 79/90 | 15.29s |
| รอบซ้ำ 1 | 18/18 | 73/90 | 78/90 | 14.25s |
| **รอบซ้ำ 2** | **17/18** | **69/90** | **74/90** | **15.36s** |

Q3 ของรอบซ้ำ 2 ได้ HTTP response แต่ `outputs` ว่าง จึงไม่มี Final Answer และได้ 0/5 ทั้ง correctness และ faithfulness ตาม rubric หากตัด Q3 ออก ผลรวมของอีก 17 ข้อคือ correctness 69/85 และ faithfulness 74/85 แสดงว่าคะแนนรวมที่ลดลงรอบนี้เกิดจาก missing Final Answer เป็นหลัก

## เทียบรายข้อกับรอบซ้ำ 1

| Q | Correctness ก่อน→ใหม่ | Faithfulness ก่อน→ใหม่ | การเปลี่ยนแปลง |
|---|---:|---:|---|
| Q1 | 4→4 | 4→4 | คงเดิม |
| Q2 | 5→5 | 5→5 | คงเดิม |
| Q3 | 5→0 | 5→0 | แย่ลงมาก: ไม่มี Final Answer |
| Q4 | 4→5 | 4→5 | ดีขึ้น: ไม่เติมสกุลเงิน |
| Q5 | 4→5 | 4→5 | ดีขึ้น: ไม่เติมสกุลเงินและอธิบาย rate scale |
| Q6 | 3→2 | 4→4 | correctness แย่ลง: N/A ขาด int_rate/DTI และทุกกลุ่มยังขาดจำนวน |
| Q7 | 5→5 | 5→5 | คงเดิม |
| Q8 | 5→5 | 5→5 | คงเดิม |
| Q9 | 5→5 | 5→5 | คงเดิม |
| Q10 | 3→4 | 5→5 | correctness ดีขึ้น: มีค่าราย segment แต่ยังขาดจำนวน |
| Q11 | 3→3 | 3→3 | คงเดิม |
| Q12 | 5→5 | 5→5 | คงเดิม |
| Q13 | 5→4 | 3→2 | แย่ลง: เพิ่มยอดรวมช่วงที่ผิดและคำอธิบายที่ไม่มี ground |
| Q14 | 2→2 | 4→4 | คงเดิม |
| Q15 | 4→4 | 4→4 | คงเดิม |
| Q16 | 4→4 | 4→4 | คงเดิม |
| Q17 | 3→3 | 5→5 | คงเดิม |
| Q18 | 4→4 | 4→4 | คงเดิม |

## ประเมิน non-determinism หลังสามรอบ

1. **ความสำเร็จไม่คงที่:** สองรอบแรกมี Final Answer 18/18 แต่รอบที่สามเหลือ 17/18
2. **Correctness รวมแกว่ง 69–73/90:** ช่วงต่างกัน 4 คะแนน
3. **Faithfulness รวมแกว่ง 74–79/90:** ช่วงต่างกัน 5 คะแนน
4. **เวลาเฉลี่ยแกว่ง 14.25–15.36 วินาที:** ช่วงต่างกัน 1.11 วินาที
5. **Vote 2-of-3 ไม่รับประกัน output:** Q3 แสดงว่า Flow สามารถจบ HTTP request โดยไม่มี Final Answer ได้
6. **Vote 2-of-3 ไม่รับประกันรายละเอียดรอง:** สกุลเงิน ความครบของ fields และข้อความตีความยังเปลี่ยนระหว่างรอบ

ข้อสรุปคือ Flow ทำให้คำตอบหลักส่วนใหญ่ค่อนข้างเสถียร แต่ยังถือว่า non-deterministic ทั้งระดับ runtime output และระดับ claim เมื่อพิจารณาจากการยิงซ้ำสามรอบ
