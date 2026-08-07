# Finance/Loan Grounded-18 — Concurrent Vote 2-of-3 Non-determinism Rerun 4

## ยิงไปที่ไหน

- Flow file: `Multi-Agent with Concurrent Orchestration/LAB-concurrent-vote-2of3-retry-thai.json`
- Flow name: `LAB-concurrent-vote-2of3-retry-thai`
- Flow ID: `4e193ed2-8649-475d-8ecc-db05a23e9839`
- Runtime endpoint: `http://127.0.0.1:7860/api/v1/run/4e193ed2-8649-475d-8ecc-db05a23e9839`
- Questions: `parallel-orchestration/benchmarks/finance-loan-grounded18/questions.txt`
- Ground: `parallel-orchestration/benchmarks/finance-loan-grounded18/ground-truth.json`
- Scoring: Final Answer only

## ผลรวมห้ารอบ

| Run | Final Answer ใช้งานได้ | Correctness | Faithfulness | เวลาเฉลี่ย |
|---|---:|---:|---:|---:|
| รอบแรก | 18/18 | 73/90 | 79/90 | 15.29s |
| รอบซ้ำ 1 | 18/18 | 73/90 | 78/90 | 14.25s |
| รอบซ้ำ 2 | 17/18 | 69/90 | 74/90 | 15.36s |
| รอบซ้ำ 3 | 18/18 | 73/90 | 80/90 | 15.45s |
| **รอบซ้ำ 4** | **18/18** | **72/90** | **73/90** | **15.17s** |

## เทียบรายข้อกับรอบซ้ำ 3

| Q | Correctness ก่อน→ใหม่ | Faithfulness ก่อน→ใหม่ | การเปลี่ยนแปลง |
|---|---:|---:|---|
| Q1 | 4→4 | 4→4 | คงเดิม |
| Q2 | 5→5 | 5→5 | คงเดิม |
| Q3 | 5→5 | 5→4 | faithfulness ลด: เพิ่มการรวมสถานะเป็นกลุ่มมีความเสี่ยง/มีปัญหา |
| Q4 | 5→4 | 5→4 | แย่ลง: กลับมาเติมบาท |
| Q5 | 5→5 | 5→5 | คงเดิม |
| Q6 | 2→3 | 5→4 | correctness ดีขึ้นเพราะมี N/A ครบขึ้น แต่ยังขาดจำนวนและเติมบาท |
| Q7 | 4→4 | 3→4 | faithfulness ดีขึ้นเพราะแก้การเปรียบเทียบ NULL แต่ยังเติมบาท |
| Q8 | 5→4 | 5→3 | แย่ลง: เติมดอลลาร์และสรุปเกินความสัมพันธ์เชิงพรรณนา |
| Q9 | 5→5 | 5→5 | คงเดิม |
| Q10 | 3→3 | 5→4 | แย่ลง: ตัด N/A ออกจากคำตอบหลักเองและข้อมูลรายกลุ่มไม่ครบ |
| Q11 | 3→3 | 2→2 | คงเดิมในระดับคะแนน: ยังเติมบาทและตีความ approval |
| Q12 | 5→5 | 5→5 | คงเดิม |
| Q13 | 5→5 | 5→3 | faithfulness ลด: เพิ่มคำอธิบายสถานะที่ไม่มี ground |
| Q14 | 2→2 | 4→4 | คงเดิม |
| Q15 | 4→4 | 4→4 | คงเดิม |
| Q16 | 4→4 | 4→4 | คงเดิม |
| Q17 | 3→3 | 5→5 | คงเดิม |
| Q18 | 4→4 | 4→4 | คงเดิม |

## ประเมิน non-determinism หลังห้ารอบ

- Final Answer ใช้งานได้อยู่ในช่วง 17–18/18
- Correctness อยู่ในช่วง 69–73/90
- Faithfulness อยู่ในช่วง 73–80/90
- เวลาเฉลี่ยอยู่ในช่วง 14.25–15.45 วินาที
- รอบล่าสุดไม่มี output หาย แต่ faithfulness ต่ำที่สุดในห้ารอบ เพราะคำตอบเพิ่ม claim ที่ไม่มี ground หลายข้อ

Vote 2-of-3 จึงช่วยให้แกนคำตอบและคะแนน correctness รวมค่อนข้างนิ่ง แต่ไม่ได้ควบคุม claim รองให้คงที่ และไม่ได้ป้องกัน Workers สองตัวขึ้นไปเห็นพ้องกับการตีความหรือ metadata ที่ไม่มีหลักฐาน
