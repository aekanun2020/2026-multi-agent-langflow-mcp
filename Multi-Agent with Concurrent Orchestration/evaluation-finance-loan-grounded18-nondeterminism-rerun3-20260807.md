# Finance/Loan Grounded-18 — Concurrent Vote 2-of-3 Non-determinism Rerun 3

## ยิงไปที่ไหน

- Flow file: `Multi-Agent with Concurrent Orchestration/LAB-concurrent-vote-2of3-retry-thai.json`
- Flow name: `LAB-concurrent-vote-2of3-retry-thai`
- Flow ID: `4e193ed2-8649-475d-8ecc-db05a23e9839`
- Runtime endpoint: `http://127.0.0.1:7860/api/v1/run/4e193ed2-8649-475d-8ecc-db05a23e9839`
- Questions: `parallel-orchestration/benchmarks/finance-loan-grounded18/questions.txt`
- Ground: `parallel-orchestration/benchmarks/finance-loan-grounded18/ground-truth.json`
- Scoring: Final Answer only

## ผลรวมสี่รอบ

| Run | Final Answer ใช้งานได้ | Correctness | Faithfulness | เวลาเฉลี่ย |
|---|---:|---:|---:|---:|
| รอบแรก 2026-08-06 | 18/18 | 73/90 | 79/90 | 15.29s |
| รอบซ้ำ 1 | 18/18 | 73/90 | 78/90 | 14.25s |
| รอบซ้ำ 2 | 17/18 | 69/90 | 74/90 | 15.36s |
| **รอบซ้ำ 3** | **18/18** | **73/90** | **80/90** | **15.45s** |

Q3 ซึ่งไม่มี Final Answer ในรอบซ้ำ 2 กลับมาตอบได้ถูกต้องในรอบซ้ำ 3 จึงชี้ว่า missing output ครั้งก่อนเป็นความแปรปรวน ไม่ใช่ failure ที่เกิดกับ Q3 ทุกครั้ง

## เทียบรายข้อกับรอบซ้ำ 2

| Q | Correctness ก่อน→ใหม่ | Faithfulness ก่อน→ใหม่ | การเปลี่ยนแปลง |
|---|---:|---:|---|
| Q1 | 4→4 | 4→4 | คงเดิม |
| Q2 | 5→5 | 5→5 | คงเดิม |
| Q3 | 0→5 | 0→5 | ดีขึ้นมาก: Final Answer กลับมาและถูกต้อง |
| Q4 | 5→5 | 5→5 | คงเดิม |
| Q5 | 5→5 | 5→5 | คงเดิม |
| Q6 | 2→2 | 4→5 | ยังขาด N/A และจำนวน แต่ไม่เติมสกุลเงิน |
| Q7 | 5→4 | 5→3 | แย่ลง: เติมบาทและมีการเปรียบเทียบอัตราของ NULL ผิดหนึ่งจุด |
| Q8 | 5→5 | 5→5 | คงเดิม |
| Q9 | 5→5 | 5→5 | คงเดิม |
| Q10 | 4→3 | 5→5 | แย่ลง: กลับมาขาด benchmark และค่าราย segment |
| Q11 | 3→3 | 3→2 | แย่ลง: เพิ่มการตีความเป็น approval |
| Q12 | 5→5 | 5→5 | คงเดิม |
| Q13 | 4→5 | 2→5 | ดีขึ้น: ตัดยอดรวมช่วงที่ผิดและคำอธิบายเกิน ground ออก |
| Q14 | 2→2 | 4→4 | คงเดิม |
| Q15 | 4→4 | 4→4 | คงเดิม |
| Q16 | 4→4 | 4→4 | คงเดิม |
| Q17 | 3→3 | 5→5 | คงเดิม |
| Q18 | 4→4 | 4→4 | คงเดิม |

## ประเมิน non-determinism หลังสี่รอบ

- Final Answer ใช้งานได้อยู่ในช่วง 17–18/18
- Correctness อยู่ในช่วง 69–73/90
- Faithfulness อยู่ในช่วง 74–80/90
- เวลาเฉลี่ยอยู่ในช่วง 14.25–15.45 วินาที
- รอบล่าสุดฟื้นกลับมาดีที่สุดด้าน faithfulness แต่ Q7, Q10 และ Q11 กลับแย่ลงเมื่อเทียบกับรอบก่อน

จึงสรุปได้ว่า Vote 2-of-3 ทำให้ผลรวมส่วนใหญ่กลับมาอยู่ในระดับใกล้เคียงกัน แต่ไม่ทำให้ระบบ deterministic: ความครบของคำตอบ สกุลเงิน การตีความ และแม้แต่การมี Final Answer ยังเปลี่ยนได้ระหว่างการยิงคำถามชุดเดียวกัน
