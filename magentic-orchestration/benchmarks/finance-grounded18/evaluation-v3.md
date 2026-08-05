# Magentic v3 — Finance/Loan Grounded-18 Evaluation

วันที่ทดสอบ: 2026-08-05

## Protocol

- Flow: `LAB-magentic-v3-resilient-final-guard-thai`
- Flow ID: `8eaf7f25-fee0-4b77-be4d-ae4f9d2414bf`
- Grounded-18, ground และ frozen rubric ชุดเดียวกับ v2
- ให้ correctness และ faithfulness จาก Final Answer เท่านั้น
- หนึ่ง session ใหม่ต่อข้อ, timeout 240 วินาที, ไม่มี runtime override
- Raw immutable artifact: `raw-v3.jsonl`

## v3 เทียบ v2 รายข้อ

| Q | v2 C/F | v3 C/F | ผล | เหตุผลหลัก |
|---:|---:|---:|---|---|
| 1 | 5/5 | 0/5 | แย่ลง | ไม่มี parseable critical JSON |
| 2 | 5/5 | 4/5 | แย่ลง | ปัดร้อยละเหลือ 2 ตำแหน่ง เกิน tolerance ของ ground |
| 3 | 5/5 | 4/5 | แย่ลงเล็กน้อย | counts ครบแต่ percentages ถูกปัด |
| 4 | 4/4 | 4/5 | ดีขึ้นด้าน faithfulness | เลิกเติม `$`; metrics ยังปัดเศษ |
| 5 | 0/5 | 4/5 | ดีขึ้นมาก | จาก guard rejection เป็นครบ 5 home labels รวม `NONE=5` |
| 6 | 2/3 | 4/5 | ดีขึ้น | แยก lowest overall `N/A` และ excluding N/A `1 year` ถูก; ยังขาด counts |
| 7 | 0/5 | 0/5 | เท่าเดิม | v3 จับ unauthorized currency แล้ว fail closed |
| 8 | 3/4 | 3/5 | ดีขึ้นด้าน faithfulness | ไม่มี invented currency แต่ยังขาด min/max income |
| 9 | 0/5 | 5/5 | ดีขึ้นมาก | structured answer ถูก serialize; yearly totals/gap/ratio ครบ |
| 10 | 3/5 | 3/5 | เท่าเดิม | benchmarks/กลุ่มถูก แต่ขาดรายละเอียดต่อ segment |
| 11 | 4/4 | 0/5 | แย่ลง | ไม่มี parseable critical JSON |
| 12 | 5/5 | 4/5 | แย่ลงเล็กน้อย | percentages ถูกแต่ปัดเหลือ 2 ตำแหน่ง |
| 13 | 5/5 | 0/5 | แย่ลง | ไม่มี parseable critical JSON |
| 14 | 0/5 | 2/3 | ผสม | ตอบได้แทน reject แต่ใช้ funded total แทน average |
| 15 | 0/5 | 2/3 | ผสม | ตอบได้แทน reject แต่ใช้ funded total แทน average |
| 16 | 5/5 | 4/4 | แย่ลงเล็กน้อย | labels ถูก แต่ค่าสูงสุดไม่ตรง funded average ground |
| 17 | 0/5 | 3/3 | ผสม | bucket counts ถูก แต่ขาด averages และเรียก loan rows ว่า “คน” |
| 18 | 0/2 | 0/5 | ปลอดภัยขึ้น แต่ correctness เท่าเดิม | reject unlinked claims แทน semantic mapping ผิด |

## Aggregate

| Metric | v2 | v3 | Change |
|---|---:|---:|---:|
| Availability | 100.0% | 100.0% | 0.0 |
| Task completion | 61.1% | 72.2% | +11.1 points |
| Correctness | 51.1% | 51.1% | 0.0 points |
| Faithfulness | 91.1% | 92.2% | +1.1 points |
| Guard rejection | 33.3% | 27.8% | -5.5 points |
| Invented currency | 16.7% | 0.0% | eliminated |
| Average latency | 62.18s | 63.62s | +1.44s |

สรุป: v3 ทำเป้าหมายของ Guard สำเร็จเฉพาะบางส่วน—ลด schema rejection, กู้ structured answer ใน Q9 และกำจัด invented currency แต่ **aggregate correctness ไม่ดีขึ้น** เพราะ gains ถูกหักล้างด้วย regressions ใน Q1, Q11, Q13 และการปัดเศษ Q2/Q3/Q12 ปัญหาถัดไปอยู่ที่ Manager final emission และ metric contract ของ specialist ไม่ใช่การผ่อน Guard เพิ่ม
