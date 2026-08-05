# v7 Finance/Loan Grounded-18 Evaluation

วันที่ทดสอบ: 2026-08-04

## SUT

- Flow: `LAB-1-4-withlocal-concurrent-consensus-v7-financial-loan-thai`
- Flow ID: `3d81bf10-f200-46db-96b1-20ce7d5b502f`
- Langflow: 1.7.3
- Questions: 18 (10 primary + 8 semantically complete paraphrases)
- Sessions: one new session per question
- Runtime overrides/tweaks: none
- External processing: OpenRouter, explicitly authorized by the user for this run

มี preliminary run Q1–Q2 ที่ถูกหยุดเพื่อเพิ่ม raw-output persistence; ผลรอบนั้นไม่ถูกนำมาคิดคะแนน ตารางนี้ใช้ clean recorded run ใน `raw-v7.jsonl` เท่านั้น

## Rubric

ตรวจเฉพาะข้อความที่ออกจาก Chat Output เทียบกับ SQL/numeric ground เดิม ไม่ใช้ worker answers, consensus rate, confidence หรือ hidden report ช่วยเพิ่มคะแนน

- Correctness 0–5: ตัวเลข, labels, grain, formula, operator และ business constraint
- Faithfulness 0–5: claims สำคัญมีหลักฐานรองรับ ไม่แต่ง metadata, currency, causality, policy หรือ metric ใหม่
- Timeout/execution failure: 0 ทั้งสองด้าน

## Results

| Q | Contract | Correctness | Faithfulness | Audit note |
|---:|---|---:|---:|---|
| 1 | portfolio totals | 4 | 3 | Count/averages ถูก แต่ totals สูญหลักท้ายจาก scientific notation |
| 2 | application mix | 5 | 4 | Counts, labels และ percentages ถูก; เพิ่ม filter/snapshot ที่ไม่จำเป็น |
| 3 | status mix | 5 | 3 | Distribution ถูก; เพิ่มคำอธิบายสถานะและข้อสันนิษฐานเรื่อง Default |
| 4 | year cohorts | 5 | 2 | Requested metrics ถูก แต่แต่ง USD, ความครบถ้วนปี 2019 และความหมายของ rate |
| 5 | home ownership | 5 | 2 | Requested table ถูกโดยรวม แต่แต่ง USD และ exclusion details ที่ ground ไม่รองรับ |
| 6 | employment extrema | 5 | 2 | Extrema และ metrics ถูก แต่แต่ง THB และเปลี่ยน DTI filtering semantics |
| 7 | DTI buckets | 2 | 2 | กรอง negative/sentinel เพิ่มจน counts/averages ต่างจาก raw-bucket ground และแต่ง USD |
| 8 | fixed income bands | 4 | 2 | Metrics ส่วนใหญ่ถูก แต่หนึ่ง count ต่าง 1, แต่ง USD และ causal-risk interpretation |
| 9 | funding gap by year | 5 | 3 | Numbers/formula/semantic warning ถูก แต่แต่ง THB |
| 10 | dual risk screen | 5 | 4 | Benchmarks, strict operator และ 5 segments ถูก; เพิ่ม explanatory factors ที่ไม่ได้วิเคราะห์ |
| 11 | portfolio totals paraphrase | 4 | 3 | ซ้ำ Q1: totals ถูกปัดจนหลักท้ายหาย และกล่าวถึง `$` โดยไม่มี metadata |
| 12 | application mix paraphrase | 5 | 4 | Counts/percentages ถูก; เพิ่ม filter/exclusion uncertainty |
| 13 | status mix paraphrase | 5 | 2 | Status distribution ถูก แต่สร้าง good/risky/bad grouping ที่ไม่มีใน ground |
| 14 | year cohorts paraphrase | 2 | 2 | ให้ funded total และ weighted rate แทน avg funded metric ตาม contract พร้อมแต่ง USD |
| 15 | home ownership paraphrase | 1 | 1 | เปลี่ยน avg funded/avg rate เป็น totals/weighted rates; total และ exclusions ไม่ตรง ground |
| 16 | employment extrema paraphrase | 5 | 2 | Highest/lowest averages ถูก แต่แต่ง THB และ NULL exclusion |
| 17 | DTI buckets paraphrase | 1 | 2 | ไม่รายงาน avg funded/avg rate ตาม contract และแก้ bucket counts ด้วย outlier filtering |
| 18 | funding gap paraphrase | 5 | 3 | Requested yearly values/formula ถูก แต่แต่ง THB |

## Aggregate scores

- Availability: 18/18 = **100%**
- Correctness: 73/90 = **81.1%**
- Faithfulness: 46/90 = **51.1%**
- Average latency: **56.70 seconds**
- Median latency: **55.64 seconds**
- Range: **35.22–88.69 seconds**

## Output-contract defect

Chat Output ทั้ง 18 ข้อเปิดเผย `Thinking Process` หรือข้อความก่อน `</think>` แม้ Final Synthesizer prompt กำหนดให้แสดงเฉพาะคำตอบสุดท้าย คิดเป็น reasoning leakage **18/18 = 100%**

เนื้อหาที่ leak ไม่ถูกใช้ช่วย correctness แต่ claims ที่ผู้ใช้มองเห็นและไม่มีหลักฐานส่งผลต่อ faithfulness ตาม rubric

## Main failure modes

1. SQL aggregate ถูก serialize เป็น scientific notation ทำให้ portfolio totals สูญหลักท้าย
2. Agent ใส่สกุลเงิน USD/THB ทั้งที่ source ไม่มี currency metadata
3. v7 data-quality rule กรอง DTI เพิ่มโดยไม่ได้รักษา raw-bucket semantics ของโจทย์/ground
4. paraphrase บางข้อทำให้ metric drift: average → total และ arithmetic average → weighted rate
5. Final Synthesizer เพิ่ม policy, causal/risk interpretation, snapshot semantics และ data-quality counts ที่หลักฐานไม่รองรับ
6. Reasoning leakage เกิดทุกข้อ

## Conclusion

v7 ตอบ numeric primary contracts ได้ดีและไม่มี execution failure แต่ faithfulness ต่ำจากการเพิ่ม claims และ metadata นอกหลักฐาน รวมถึงไม่รักษา metric contract เมื่อคำถามเป็น paraphrase จึงยังไม่ควรใช้ผล vote/consensus เป็นตัวแทน correctness โดยไม่ตรวจ Final Answer กับ ground
