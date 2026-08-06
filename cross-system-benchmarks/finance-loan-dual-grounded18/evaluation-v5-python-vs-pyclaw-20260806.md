# V5 Pure Python vs PyClaw — Finance/Loan Dual-Grounded 18

วันที่ทดสอบ: 2026-08-06  
โมเดลทั้งคู่: `qwen/qwen3.5-35b-a3b` ผ่าน OpenRouter  
โจทย์: 18 ข้อชุดเดียวกัน เรียงง่ายไปยาก โดย correctness ตรวจเฉพาะ final answer ตามที่กำหนด

## ผลรวม

| ระบบ | Correctness | Faithfulness | Abstain | เวลาเฉลี่ย |
|---|---:|---:|---:|---:|
| V5 Pure Python (`89228c2`) | 55/90 (61.1%) | **86/90 (95.6%)** | 7/18 | 74.8 วินาที |
| PyClaw (`d821bb3`) | **67/90 (74.4%)** | 69/90 (76.7%) | 0/18 | **25.4 วินาที** |

ข้อสรุป: **PyClaw ชนะด้าน correctness และ coverage; V5 ชนะด้าน faithfulness เพราะยอม abstain เมื่อหลักฐานไม่ครบ** แต่คะแนน faithfulness สูงของ V5 ไม่ได้แปลว่าตอบโจทย์ได้ครบ—7 ข้อจบด้วยการปฏิเสธตอบ

## รายข้อ

| ข้อ | V5 C/F | PyClaw C/F | ผล | วิเคราะห์ย่อ |
|---|---:|---:|---|---|
| Q1 | 5/3 | 2/1 | V5 | PyClaw ปัด total ผิดและอ้าง THB จากเอกสาร metadata ทั่วไปที่ไม่ใช่ metadata ของชุด loan |
| Q2 | 3/5 | 4/5 | PyClaw | PyClaw ตรวจ NULL ของ joint fields และแจ้งว่า RAG ไม่มีนิยาม |
| Q3 | 4/4 | 3/4 | V5 | PyClaw พิมพ์ denominator ผิดเป็น 1,432,540 |
| Q4 | 4/4 | 4/4 | เสมอ | ตัวเลขถูกทั้งคู่ แต่ RAG ไม่มีหลักฐานยืนยัน storage semantics |
| Q5 | 5/5 | 5/5 | เสมอ | ครบทุก label รวม NONE และไม่ตัดสินคุณภาพ |
| Q6 | 4/5 | 4/4 | V5 | PyClaw เพิ่มข้อสรุปแนวโน้มที่หลักฐานไม่รองรับ |
| Q7 | 5/5 | 4/3 | V5 | PyClaw เพิ่มคำว่า “บาท” โดยไม่มี ground |
| Q8 | 5/5 | 5/5 | เสมอ | exact และไม่อ้าง causality |
| Q9 | 5/5 | 2/5 | V5 | PyClaw ให้ SQL แต่ไม่คืนตัวเลขที่ถาม |
| Q10 | 1/5 | 4/2 | trade-off | V5 abstain; PyClaw ตอบครบกว่าแต่เดาความเหมาะสมจากชื่อ field และเพิ่มสกุลเงิน |
| Q11 | 1/5 | 2/3 | trade-off | V5 abstain; PyClaw ขาดค่าเฉลี่ยสองแบบและ denominators |
| Q12 | 2/5 | 4/5 | PyClaw | PyClaw แสดงขอบเขตข้อมูลและปฏิเสธการใช้ installment แทนอย่างระมัดระวัง |
| Q13 | 5/5 | 5/5 | เสมอ | benchmark และ 5 กลุ่มถูกครบ |
| Q14 | 1/5 | 5/5 | PyClaw | PyClaw คืน MORTGAGE เพียงกลุ่มเดียวและไม่เรียก “ลูกค้าดี” |
| Q15 | 2/5 | 5/5 | PyClaw | V5 ตอบ distribution ทั้งพอร์ต ไม่ได้ตอบผู้ชนะรายปี |
| Q16 | 1/5 | 4/3 | PyClaw | PyClaw คำนวณ segment ได้ แต่เพิ่ม `$` และยกระดับ guideline เป็น policy |
| Q17 | 1/5 | 1/1 | V5 | PyClaw เปลี่ยน policy-filtered DTI เป็น Fully Paid ซึ่งผิด business logic; V5 abstain |
| Q18 | 1/5 | 4/4 | PyClaw | PyClaw ทำ monitoring summary ได้เกือบครบ; มี sentinel 114/119 ไม่สอดคล้องและบางตารางย่อด้วย `...` |

`C/F` = correctness / faithfulness คะแนนเต็มอย่างละ 5

## สิ่งที่ architecture ทำให้ต่างกัน

- V5 มี typed finance contracts ที่แม่นและเร็วมากเมื่อโจทย์ตรง contract (Q1–Q9, Q13) แต่ runtime รองรับ MCP เดียวคือ MSSQL จึงตรวจ RAG ไม่ได้ และ abstain ในโจทย์ open-ended หลายข้อ
- PyClaw ใช้ specialist สองสายและเรียกทั้ง MSSQL/RAG ได้ใน 14/18 ข้อ จึงครอบคลุมโจทย์ยากกว่า แต่ manager/synthesis ยังเพิ่ม claim ใหม่ เช่น currency, policy interpretation และ causal-style explanation
- PyClaw มีข้อความ reasoning ก่อน final answer (`</think>` หรือ synthesis narration) ครบ 18/18 ข้อ เป็น defect ด้าน output hygiene แม้ไม่นำ reasoning มาคิด correctness

## ไฟล์หลักฐาน

- คำถามหลัก: `manifest.json` และ `questions.txt`
- adapter manifest สำหรับ V5 โดยไม่แก้ runtime: `v5-runtime-manifest.json`
- raw V5: `raw-v5-python-20260806.json`
- raw PyClaw: `raw-pyclaw-20260806.json`
- คะแนน machine-readable: `scores-v5-python-vs-pyclaw-20260806.json`

หมายเหตุ: `raw-langflow-v5-20260806.jsonl` เป็น auxiliary run ที่ยิง Langflow v5 เพราะความกำกวมของชื่อในช่วงแรก และ **ไม่ถูกนำมาคิดคะแนนนี้**
