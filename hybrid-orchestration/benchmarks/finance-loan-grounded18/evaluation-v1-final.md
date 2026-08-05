# Hybrid v1 Final — Finance/Loan Grounded-18

วันที่ทดสอบ: 2026-08-05

## Protocol

- Flow: `LAB-hybrid-v1-grounded-consensus-thai`
- Flow ID: `cd488940-5fa4-4567-b5e8-43b26d5643ae`
- ใช้ Grounded-18 และ frozen rubric เดิม
- ให้คะแนนจาก Final Answer เท่านั้น
- Raw first pass: `raw-v1-final-rerun1.jsonl`
- Q15 first pass ล้มจาก transient MCP stream; targeted retry แยกไว้ที่ `raw-v1-final-q15-rerun.jsonl`
- รายงานทั้ง first-pass และ recovered score ไม่ซ่อน retry

## Aggregate

| Metric | Magentic v3 | Concurrent v4 | Hybrid v1 first pass | Hybrid v1 recovered |
|---|---:|---:|---:|---:|
| Availability | 100.0% | 94.4% | 94.4% | **100.0%** |
| Correctness | 51.1% | 70.0% | 73.3% | **78.9%** |
| Faithfulness | 92.2% | 67.8% | 87.8% | **93.3%** |

Recovered score ใช้ Q15 targeted retry แทน transient execution failure เพียงข้อเดียว คำตอบอื่นทั้งหมดมาจาก full first pass เดิม

## เปรียบเทียบรายข้อ

| Q | Magentic v3 C/F | Concurrent v4 C/F | Hybrid v1 C/F | ผล Hybrid v1 |
|---:|---:|---:|---:|---|
| 1 | 0/5 | 3/5 | 5/5 | ดีขึ้นมาก: exact totals/averages และไม่มี currency |
| 2 | 4/5 | 4/5 | 5/5 | ดีขึ้น: percentages มี precision ผ่าน tolerance |
| 3 | 4/5 | 4/4 | 4/4 | เท่า v4; ยังมี risk grouping เพิ่มเติม |
| 4 | 4/5 | 4/3 | 4/5 | กู้ faithfulness: ไม่มี currency/speculation |
| 5 | 4/5 | 4/3 | 4/5 | กู้ faithfulness: ไม่มี risk claim |
| 6 | 4/5 | 3/3 | 4/5 | ดีขึ้น แต่ยังขาด counts |
| 7 | 0/5 | 5/4 | 3/4 | ดีกว่า v3 แต่แย่กว่า v4: rates หยาบและลำดับเชิงพรรณนาผิด |
| 8 | 3/5 | 3/3 | 3/5 | correctness เท่าเดิม; faithfulness ดีขึ้น ไม่มี currency/risk claim |
| 9 | 5/5 | 5/4 | 4/5 | faithfulness ดีขึ้น แต่ ratio ถูก truncate |
| 10 | 3/5 | 3/4 | 3/4 | เท่า v4; benchmark ถูกแต่ขาด counts/แปล labels |
| 11 | 0/5 | 3/2 | 5/5 | ดีขึ้นมาก: exact และตัด approval claim |
| 12 | 4/5 | 4/5 | 4/5 | เท่าเดิม |
| 13 | 0/5 | 3/3 | 4/4 | ดีขึ้น แต่ยังจัดกลุ่มสถานะว่าเป็นปัญหา |
| 14 | 2/3 | 2/2 | 2/3 | correctness ไม่ดีขึ้น; ยังใช้ total แทน average |
| 15 | 2/3 | 0/0 | 5/5 | ดีขึ้นหลัง targeted retry; first pass เป็น MCP failure |
| 16 | 4/4 | 5/4 | 5/5 | ดีขึ้นด้าน faithfulness ไม่มี currency |
| 17 | 3/3 | 3/3 | 3/5 | correctness เท่าเดิม; faithfulness ดีขึ้น |
| 18 | 0/5 | 5/4 | 4/5 | ดีกว่า v3 และ faithfulness ดีกว่า v4; ratio truncate |

## ข้อสรุป

Hybrid v1 recovered เป็นรุ่นแรกในชุดนี้ที่ชนะ baseline ที่ดีที่สุดของทั้งสองมิติพร้อมกัน: correctness สูงกว่า Concurrent v4 และ faithfulness สูงกว่า Magentic v3 ผลมาจากการแยก semantic consensus, evidence verification และ language-only editing ออกจากกัน พร้อมให้ Verifier เห็น raw answers เพื่อ re-check เมื่อ query ของตนขัดกับ consensus

จุดที่ควรแก้ต่อคือ Q7 precision/order, Q8 observed min/max, Q10 counts/canonical labels, Q14 metric ambiguity และความเสถียรของ MCP stream
