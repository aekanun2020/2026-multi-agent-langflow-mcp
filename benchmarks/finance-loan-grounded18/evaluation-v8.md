# v8 Finance/Loan Grounded-18 Evaluation

วันที่ทดสอบ: 2026-08-04

## SUT

- Flow: `LAB-1-4-withlocal-concurrent-consensus-v8-guarded-verbalizer-thai`
- Flow ID: `c0bb787d-fbd5-41a9-acbf-e0932611d315`
- Questions: Grounded-18 ชุดเดียวกับ v7
- Sessions: one new session per question
- Runtime overrides/tweaks: none

ก่อน clean run มี graph-build failure และ smoke test เพื่อแก้ edge metadata หลักฐานเก็บแยกไว้และไม่นำมาคิดคะแนน Clean run ใช้ `raw-v8.jsonl` เท่านั้น

## Results

| Q | Correctness | Faithfulness | Audit note |
|---:|---:|---:|---|
| 1 | 2 | 4 | มี count และ totals แต่ totals เสียหลักท้ายและ averages ไม่ผ่าน consensus |
| 2 | 5 | 5 | Application counts/percentages ครบและไม่เพิ่ม claim |
| 3 | 1 | 5 | ปลอดภัยแต่เหลือเพียง total count ไม่มี status distribution |
| 4 | 3 | 5 | Counts/average funded ถูก แต่ average interest claims ไม่ผ่าน consensus |
| 5 | 0 | 5 | ไม่มี agreed claim; fail closed |
| 6 | 1 | 5 | เหลือเพียง interest-rate claims ไม่ตอบ funded extrema |
| 7 | 0 | 0 | Timeout 240 seconds |
| 8 | 0 | 0 | Timeout 240 seconds |
| 9 | 0 | 5 | มีเฉพาะ yearly counts ซึ่งไม่ใช่ requested gap/ratio |
| 10 | 3 | 5 | ระบุกลุ่ม/จำนวน/charged-off rates ได้ แต่ขาด benchmarks และ average interest |
| 11 | 4 | 4 | Averages/count ถูก แต่ totals เสียหลักท้าย |
| 12 | 5 | 5 | Application mix ครบและ grounded |
| 13 | 2 | 5 | รายงานเพียง 3 จาก 7 statuses และไม่มี percentages |
| 14 | 2 | 5 | Average rates ถูก แต่ส่ง funded totals แทน average funded |
| 15 | 0 | 5 | ไม่มี agreed claim; fail closed |
| 16 | 0 | 5 | ไม่มี agreed claim; fail closed |
| 17 | 1 | 4 | ไม่มี bucket distribution; valid-DTI count ใช้ semantics คนละแบบกับ raw ground |
| 18 | 5 | 5 | Yearly totals, gaps และ allocation ratios ครบ โดยไม่มี invented currency |

## Aggregate scores

- Availability: 16/18 = **88.9%**
- Correctness: 34/90 = **37.8%**
- Faithfulness: 77/90 = **85.6%**
- Average latency: **83.12 seconds** (รวม timeout)
- Median latency: **74.31 seconds**
- Range: **33.62–240.00 seconds**
- Reasoning leakage: **0/18**
- Invented currency tokens: **0/18**

## v7 versus v8

| Metric | v7 | v8 | Change |
|---|---:|---:|---:|
| Availability | 100% | 88.9% | -11.1 points |
| Correctness | 81.1% | 37.8% | -43.3 points |
| Faithfulness | 51.1% | 85.6% | +34.5 points |
| Reasoning leakage | 100% | 0% | eliminated |
| Average latency | 56.70s | 83.12s | +26.42s |

## Interpretation

Final Claim Guard ทำสิ่งที่ออกแบบไว้สำเร็จ: ไม่ปล่อย reasoning ดิบ ไม่เพิ่ม currency และไม่อนุญาตให้ LLM แก้ locked values แต่การย้าย authority ไปยัง `agreed_claims` อย่างเคร่งครัดเผยให้เห็นว่า workers ใช้ claim keys ไม่คงที่ ทำให้ข้อเท็จจริงจำนวนมากไม่ผ่าน quorum แม้ candidate answers อาจมีข้อมูลอยู่

v8 จึง **ปลอดภัยและ faithful กว่า แต่ตอบไม่ครบและ correct น้อยกว่าอย่างมาก** ขั้นต่อไปควรแก้ upstream ด้วย schema/contract ของ claim keys ต่อ intent ไม่ควรผ่อน guard หรือให้ Final LLM ดึงค่าจาก candidate answers เอง
