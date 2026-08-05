# Magentic v2 — Finance/Loan Grounded-18 Evaluation

วันที่ทดสอบ: 2026-08-05

## SUT และวิธีประเมิน

- Flow: `LAB-magentic-v2-subflow-specialists-thai`
- Flow ID: `a2026d54-dda8-4eef-a3e8-876e0f94d674`
- Questions, ground และ frozen rubric: ชุดเดียวกับ Parallel Grounded-18
- หนึ่ง session ใหม่ต่อคำถาม; timeout 240 วินาที; ไม่มี runtime override
- ให้คะแนนจาก `answer` ใน Final Answer เท่านั้น ไม่ใช้ specialist output, ledger หรือ execution trace เพิ่ม correctness
- Raw immutable artifact: `raw-v2.jsonl`

## ผลรายข้อ

| Q | Correctness | Faithfulness | เทียบ v1 revised | Audit note |
|---:|---:|---:|---|---|
| 1 | 5 | 5 | ดีขึ้น | count, totals และ averages ครบ; ไม่ระบุสกุลเงินเฉพาะ |
| 2 | 5 | 5 | ดีขึ้น | count/percentage ครบ หลัง SQL task แรก blocked แล้ว re-plan สำเร็จ |
| 3 | 5 | 5 | ดีขึ้น | ครบ 7 statuses และไม่ตีความเป็น approval |
| 4 | 4 | 4 | ดีขึ้น | ตัวเลขครบแต่เติม `$` โดยไม่มี currency metadata |
| 5 | 0 | 5 | เท่าเดิมด้าน correctness | Final guard ปฏิเสธ contract |
| 6 | 2 | 3 | ดีขึ้นบางส่วน | สูงสุดและต่ำสุดเมื่อไม่รวม N/A ถูก แต่ตัด N/A ออกจาก lowest overall และขาด counts |
| 7 | 0 | 5 | เท่าเดิมด้าน correctness | Final guard ปฏิเสธ contract |
| 8 | 3 | 4 | ดีขึ้น | band metrics หลักถูก แต่ขาด min/max income และเติม `$` |
| 9 | 0 | 5 | เท่าเดิมด้าน correctness | Final guard ปฏิเสธ contract |
| 10 | 3 | 5 | ดีขึ้น | benchmarks และ 5 กลุ่มถูก แต่ไม่รายงาน loan_count ต่อกลุ่ม |
| 11 | 4 | 4 | ดีขึ้น | totals/averages ถูก แต่สมมติหน่วยบาท |
| 12 | 5 | 5 | ดีขึ้น | percentages ทั้งสองกลุ่มถูก |
| 13 | 5 | 5 | ดีขึ้น | ทุก status พร้อม count/percentage ถูก |
| 14 | 0 | 5 | เท่าเดิมด้าน correctness | Final guard ปฏิเสธ contract |
| 15 | 0 | 5 | เท่าเดิมด้าน correctness | Final guard ปฏิเสธ contract |
| 16 | 5 | 5 | ดีขึ้น | extrema `10+ years` และ `N/A` ถูก หลัง re-plan |
| 17 | 0 | 5 | เท่าเดิมด้าน correctness | Final guard ปฏิเสธ contract |
| 18 | 0 | 2 | เท่าเดิมด้าน correctness/แย่ลง faithfulness | map ภาษาธุรกิจไป `budget_allocation` ผิด แทน `loan_amnt`/`funded_amnt` |

## Aggregate

- Availability: **18/18 = 100%**
- Task completion: **11/18 = 61.1%**
- Correctness: **46/90 = 51.1%**
- Faithfulness: **82/90 = 91.1%**
- Average latency: **62.18s**; median **48.41s**; range **29.01–149.15s**
- Guard rejection: **6/18 = 33.3%**
- Reasoning leakage: **0/18**
- Invented currency: **3/18 = 16.7%** (`Q4`, `Q8`, `Q11`)

## เทียบกับ Magentic v1 revised

| Metric | v1 revised | v2 | Change |
|---|---:|---:|---:|
| Availability | 100.0% | 100.0% | 0.0 |
| Task completion | 0.0% | 61.1% | +61.1 points |
| Correctness | 0.0% | 51.1% | +51.1 points |
| Faithfulness | 91.1% | 91.1% | 0.0 points |
| Average latency | 15.58s | 62.18s | +46.60s |
| Guard rejection | 38.9% | 33.3% | -5.6 points |

v2 แก้ execution path หลักสำเร็จ: Manager มอบหมายงานไป subflows, รับ Typed Result, re-plan และเรียก Verification ได้จริง จึงเพิ่ม correctness และ task completion อย่างมากโดยรักษา faithfulness รวมไว้เท่าเดิม แต่ยังไม่พร้อมเป็นเวอร์ชันสุดท้าย เพราะ Final Manager JSON ไม่เสถียรในคำถามตารางยาว, semantic mapping ของคำ paraphrase ยังผิดได้ และ final composition ยังเพิ่ม currency ที่ verified result ไม่ได้อนุญาต
