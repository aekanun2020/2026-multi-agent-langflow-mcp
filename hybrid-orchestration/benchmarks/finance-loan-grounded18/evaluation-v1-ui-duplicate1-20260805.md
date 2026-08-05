# Hybrid v1 UI Duplicate (1) — Grounded-18

วันที่ทดสอบ: 2026-08-05

- Flow: `LAB-hybrid-v1-grounded-consensus-thai-ui-upload-20260805 (1)`
- Flow ID: `d05b8974-53bd-4726-ba56-ca27e9e6d033`
- Raw artifact: `raw-v1-ui-duplicate1-20260805.jsonl`
- ใช้ Final Answer จาก Chat Output เท่านั้น เทียบ canonical `ground-truth.json` ด้วย frozen `rubric.md`
- สำเร็จ 18/18 ใน first pass ไม่มี retry

## Aggregate

| Metric | Hybrid v1 rerun2 | UI Duplicate (1) | Change |
|---|---:|---:|---:|
| Availability first pass | 100.0% | **100.0%** | เท่าเดิม |
| Correctness | 84.4% | **81.1%** | -3.3 points |
| Faithfulness | 96.7% | **94.4%** | -2.3 points |
| Total elapsed | 562.61s | **457.36s** | เร็วขึ้น 105.25s |

## ผลรายข้อ

| Q | Rerun2 C/F | Duplicate C/F | เทียบรุ่นก่อน | เหตุผล |
|---:|---:|---:|---|---|
| 1 | 5/5 | 5/5 | เท่าเดิม | totals และ averages exact; ไม่เติมสกุลเงิน |
| 2 | 5/5 | 4/5 | แย่ลง | counts ถูก แต่เปอร์เซ็นต์เหลือเพียงสองตำแหน่ง |
| 3 | 4/4 | 4/4 | เท่าเดิม | ครบ 7 labels แต่ปัดเปอร์เซ็นต์และเพิ่ม status grouping |
| 4 | 4/5 | 4/5 | เท่าเดิม | count/average ครบ มี minor rounding |
| 5 | 5/5 | 5/5 | เท่าเดิม | ครบทุก home_ownership รวมกลุ่ม NONE |
| 6 | 4/5 | 4/5 | เท่าเดิม | extrema ถูก แต่ขาด counts ที่โจทย์ขอ |
| 7 | 4/5 | 3/3 | แย่ลง | core buckets ถูก แต่ rates หยาบ, กล่าว 43% ผิด และใช้คำว่า “อย่างมีนัยสำคัญ” โดยไม่มี statistical test |
| 8 | 3/5 | 3/5 | เท่าเดิม | counts/averages ถูก แต่ขาด observed income min/max |
| 9 | 5/5 | 5/5 | เท่าเดิม | totals, gap และ ratio ถูกครบ |
| 10 | 5/5 | 5/5 | เท่าเดิม | benchmarks และ 5 canonical segments ครบตาม strict `>` |
| 11 | 5/5 | 5/5 | เท่าเดิม | exact totals/averages |
| 12 | 4/5 | 4/5 | เท่าเดิม | mix ถูกแต่ปัดเปอร์เซ็นต์สองตำแหน่ง |
| 13 | 4/5 | 4/5 | เท่าเดิม | ครบทุก status มี minor rounding |
| 14 | 2/3 | 2/3 | เท่าเดิม | ใช้ funded total แทน expected average |
| 15 | 5/5 | 5/5 | เท่าเดิม | ครบทุก label และให้ทั้ง total/average |
| 16 | 5/5 | 3/5 | แย่ลง | ไม่แสดง N/A และเรียก 1 year ว่าต่ำสุดโดยไม่ระบุว่าเป็นกรณีตัด N/A |
| 17 | 3/5 | 3/5 | เท่าเดิม | bucket boundaries/counts ถูก แต่ไม่มี averages |
| 18 | 4/5 | 5/5 | ดีขึ้น | ratio ปี 2016 ถูกเป็น 99.9996% |

## สรุป

การ duplicate รักษา availability และ configuration ได้ครบ แต่ไม่ได้ทำให้ output deterministic: architecture/model/key เหมือนเดิมยังให้รายละเอียดต่างจาก rerun2 ได้ Correctness และ Faithfulness จึงลดลงเล็กน้อย จุด regression หลักอยู่ที่การเติม claim เสริมของ Q7 และการตีความเงื่อนไข N/A ของ Q16 ไม่ใช่ปัญหาการเชื่อมต่อหรือ execution failure
