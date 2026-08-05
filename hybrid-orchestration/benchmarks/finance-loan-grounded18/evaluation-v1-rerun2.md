# Hybrid v1 — Grounded-18 Rerun 2

วันที่ทดสอบ: 2026-08-05

- Flow: `LAB-hybrid-v1-grounded-consensus-thai`
- Flow ID: `cd488940-5fa4-4567-b5e8-43b26d5643ae`
- Raw artifact: `raw-v1-final-rerun2.jsonl`
- ให้คะแนนจาก Final Answer เท่านั้นด้วย frozen rubric เดิม
- สำเร็จ 18/18 ใน first pass ไม่มี targeted retry

## Aggregate

| Metric | Hybrid v1 previous | Hybrid v1 rerun2 | Change |
|---|---:|---:|---:|
| Availability first pass | 94.4% | **100.0%** | +5.6 points |
| Correctness | 78.9% recovered | **84.4%** | +5.5 points |
| Faithfulness | 93.3% recovered | **96.7%** | +3.4 points |

## ผลรายข้อ

| Q | Previous C/F | Rerun2 C/F | ผลเปลี่ยนแปลง |
|---:|---:|---:|---|
| 1 | 5/5 | 5/5 | เท่าเดิม; exact totals/averages |
| 2 | 5/5 | 5/5 | เท่าเดิม; high-precision percentages |
| 3 | 4/4 | 4/4 | เท่าเดิม; ยังเพิ่ม status grouping |
| 4 | 4/5 | 4/5 | เท่าเดิม |
| 5 | 4/5 | 5/5 | ดีขึ้น; precision ของ metrics ครบ |
| 6 | 4/5 | 4/5 | เท่าเดิม; ยังขาด counts |
| 7 | 3/4 | 4/5 | ดีขึ้น; ลำดับแนวโน้มถูกและไม่สร้าง claim เชิงเหตุผล |
| 8 | 3/5 | 3/5 | เท่าเดิม; ยังขาด observed min/max income |
| 9 | 4/5 | 5/5 | ดีขึ้น; funding ratio ปัดถูกเป็น 0.999996 |
| 10 | 3/4 | 5/5 | ดีขึ้นมาก; benchmark, counts และ canonical labels ครบ |
| 11 | 5/5 | 5/5 | เท่าเดิม |
| 12 | 4/5 | 4/5 | เท่าเดิม; percentages ปัดสองตำแหน่ง |
| 13 | 4/4 | 4/5 | ดีขึ้นด้าน faithfulness; ไม่มี problem grouping |
| 14 | 2/3 | 2/3 | เท่าเดิม; ใช้ funded total แทน expected average |
| 15 | 5/5 หลัง retry | 5/5 first pass | ดีขึ้นด้าน reliability |
| 16 | 5/5 | 5/5 | เท่าเดิม |
| 17 | 3/5 | 3/5 | เท่าเดิม; มีเฉพาะ bucket counts |
| 18 | 4/5 | 4/5 | เท่าเดิม; ratio ถูก truncate เป็น 99.9995% |

## สรุป

Rerun2 ยืนยันว่า Hybrid v1 ให้ทั้ง correctness และ faithfulness สูงกว่ารอบก่อนโดยไม่ต้อง retry ความแปรปรวนยังปรากฏในรายละเอียดของ Q3/Q7/Q10/Q13 และ precision บางข้อ แต่ไม่ทำให้ aggregate regression รอบนี้

งานถัดไปควรแก้ความหมายของคำว่า “ช่วงรายได้” ใน Q8, metric ambiguity ของ Q14 และกำหนด precision policy สำหรับ rates/ratios โดยไม่สร้าง rigid answer schema
