# Concurrent v4 Paper Exact — Finance/Loan Grounded-18

วันที่ทดสอบ: 2026-08-05

## Protocol

- SUT: `LAB-concurrent-v4-paper-exact-thai`
- Flow ID: `ec0c57d5-fca9-4f86-b9a8-8b50207691c0`
- Baseline: `LAB-magentic-v3-resilient-final-guard-thai`
- ใช้คำถาม, ground และ frozen rubric ชุด Grounded-18 เดิม
- ให้คะแนนจาก Final Answer เท่านั้น ไม่ใช้คำตอบหรือหลักฐานภายในของ Workers เพิ่มคะแนน
- แยก session ต่อข้อและไม่มี runtime override
- Raw artifact: `raw-v4-paper-exact.jsonl`
- Q15 เป็น HTTP 500 จาก MCP stream ของ Worker 3 จึงนับ correctness/faithfulness เป็น 0 ตาม rubric

## เปรียบเทียบรายข้อ

| Q | v3 C/F | v4 C/F | ดีขึ้นหรือแย่ลง | เหตุผลหลัก |
|---:|---:|---:|---|---|
| 1 | 0/5 | 3/5 | ดีขึ้น | v4 ตอบ count และ averages ถูก แต่ totals ถูกปัดจนไม่ exact |
| 2 | 4/5 | 4/5 | เท่าเดิม | counts ถูก แต่ percentages ปัดเหลือสองตำแหน่ง |
| 3 | 4/5 | 4/4 | แย่ลงด้าน faithfulness | แจกแจงครบ แต่เพิ่มการจัดกลุ่มสถานะว่าเสี่ยง/มีปัญหา |
| 4 | 4/5 | 4/3 | แย่ลง | metrics หลักถูก แต่เติม “บาท” และคาดเดาว่าปี 2019 ข้อมูลไม่ครบ |
| 5 | 4/5 | 4/3 | แย่ลงด้าน faithfulness | ทุก label/metric อยู่ครบ แต่ตีความกลุ่ม NONE ว่าเสี่ยงกว่า |
| 6 | 4/5 | 3/3 | แย่ลง | extrema ถูก แต่ไม่รายงาน counts และเติมสกุลเงิน |
| 7 | 0/5 | 5/4 | ดีขึ้นมาก แต่ faithfulness ลด | v3 reject; v4 ตอบครบทุก bucket แต่เติม `$` |
| 8 | 3/5 | 3/3 | แย่ลงด้าน faithfulness | ยังขาด min/max income และเพิ่ม `$`/interpretation |
| 9 | 5/5 | 5/4 | แย่ลงด้าน faithfulness | ตัวเลขและสูตรครบ แต่เติม “บาท” |
| 10 | 3/5 | 3/4 | แย่ลงด้าน faithfulness | กลุ่มและ benchmarks ถูก แต่ขาด counts และเพิ่มภาษาความเสี่ยง |
| 11 | 0/5 | 3/2 | ผสม | v4 ตอบได้แทน reject แต่ totals ไม่ exact พร้อม currency และ approval claim |
| 12 | 4/5 | 4/5 | เท่าเดิม | percentages ถูกปัดเหมือน v3 |
| 13 | 0/5 | 3/3 | ผสม | v4 แจกแจงครบ แต่พิมพ์ total ผิด 100 และเพิ่ม risk grouping |
| 14 | 2/3 | 2/2 | แย่ลงด้าน faithfulness | ทั้งคู่ใช้ funded total แทน average; v4 เพิ่ม currency/speculation |
| 15 | 2/3 | 0/0 | แย่ลงมาก | execution failure จาก MCP stream |
| 16 | 4/4 | 5/4 | ดีขึ้นด้าน correctness | labels และ extrema ถูกครบ แต่เติม currency |
| 17 | 3/3 | 3/3 | เท่าเดิม | มีเฉพาะ bucket counts และเพิ่ม risk interpretation |
| 18 | 0/5 | 5/4 | ดีขึ้นมาก แต่ faithfulness ลด | v3 reject; v4 ตัวเลขครบ แต่เติม currency |

## Aggregate

| Metric | Magentic v3 | Concurrent v4 | Change |
|---|---:|---:|---:|
| Availability | 100.0% | 94.4% | -5.6 points |
| Correctness | 51.1% | 70.0% | +18.9 points |
| Faithfulness | 92.2% | 67.8% | -24.4 points |

## ข้อสรุป

v4 ดีขึ้นด้าน correctness เพราะ Semantic Consensus Agent ไม่ปฏิเสธคำตอบเพียงเพราะ schema/key ไม่ครบ จึงกู้ Q1, Q7, Q11, Q13 และ Q18 ที่ v3 Guard เคยปฏิเสธได้ แต่การเอา Guard/contract ออกไม่ได้ทำให้ข้อเท็จจริงปลอดภัยขึ้นโดยอัตโนมัติ: โมเดลเติมสกุลเงินและ interpretation ใหม่หลายข้อ ทำให้ faithfulness ลดลงชัดเจน นอกจากนี้ parallel Workers ที่ใช้ MCP พร้อมกันยังพบ transient stream failure ใน Q15 หนึ่งข้อ

ดังนั้นผลนี้สนับสนุนแนวคิดใน paper ว่า semantic consensus ช่วยลดการเสียคำตอบจาก rigid validation แต่ยังไม่พิสูจน์ว่าช่วยลด hallucination หรือเพิ่ม faithfulness ทุกกรณี
