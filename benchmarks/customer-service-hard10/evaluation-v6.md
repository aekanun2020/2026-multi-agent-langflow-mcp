# Langflow v6 Concurrent — Hard-10 Evaluation

วันที่ทดสอบ: 2026-08-04  
Flow ID: `9ad2bdfd-01b1-4cd1-9f3c-494df86182ae`  
Flow: `LAB-1-4-withlocal-concurrent-consensus-v6-thai`

## วิธีประเมิน

- Clean SUT run ไม่มี `tweaks` หรือ prompt override
- แต่ละข้อใช้ session ใหม่
- Correctness และ Faithfulness ตรวจเฉพาะ Final Answer หลัง `</think>`
- ไม่นำ candidate answers, agreed claims, confidence หรือ reasoning ก่อน final มาช่วยเพิ่มคะแนน
- เทียบกับ `ground-truth.md` ด้วย rubric 0–5 ต่อข้อ

## ผลรวม

- Availability: **10/10 = 100%**
- Correctness: **28/50 = 56.0%**
- Faithfulness: **36/50 = 72.0%**
- เวลาเฉลี่ย: **61.9 วินาที/ข้อ**
- เร็วสุด: Q9 = 41.28 วินาที
- ช้าที่สุด: Q5 = 96.08 วินาที

## เปรียบเทียบ v5 กับ v6

| Metric | v5 | v6 | เปลี่ยนแปลง |
|---|---:|---:|---:|
| Availability | 100% | 100% | เท่าเดิม |
| Correctness | 44.0% | 56.0% | **+12.0 จุด** |
| Faithfulness | 68.0% | 72.0% | **+4.0 จุด** |
| Avg latency | 43.2s | 61.9s | **+18.7s / ช้าลง 43.3%** |

| ข้อ | เวลา | Correctness | Faithfulness | การประเมิน Final Answer |
|---|---:|---:|---:|---|
| Q1 | 68.01s | 5/5 | 4/5 | ตรง `[2,3,9]`, 3 เคส, 4 หน่วย, 17,180 บาทครบ แต่ยังใช้ `final_decision IS NULL` เป็นตัวแทน “ยังไม่ใช้สิทธิ์” โดยไม่มี contract รองรับโดยตรง |
| Q2 | 84.18s | 5/5 | 5/5 | ตรง `[1,5,8]`, เกิน 31/7/12 วัน และ exposure 220,900 บาท |
| Q3 | 47.06s | 4/5 | 5/5 | 38 วัน, หมดสิทธิ์คืน และตกกระแทกไม่คุ้มครองถูกต้อง; หักเล็กน้อยเพราะสรุปท้ายว่า “เหลือ 38 วัน” แทน “ผ่านไป 38 วัน” |
| Q4 | 66.63s | 4/5 | 5/5 | เคส 8 เข้า warranty inspection ถูก; เคส 1 ตัด warranty ถูกแต่ยังคง inspection route แทนสรุปปฏิเสธ return และ warranty ตาม ground truth |
| Q5 | 96.08s | 0/5 | 3/5 | ไม่ตอบคิว `3→9→2`; ตีความ “ผ่าน Q1” เป็น field/quarter และรายงาน severe cases ทั้งหมด พร้อมเปิดเผยชื่อที่ไม่จำเป็น |
| Q6 | 47.40s | 0/5 | 2/5 | ไม่คำนวณ 1,610/2,100/1,499 เพราะอ้างว่าไม่มีราคาเดิม ทั้งที่อยู่ใน MSSQL และสร้างตัวอย่าง baseline 3,500 บาทขึ้นเอง |
| Q7 | 48.26s | 3/5 | 4/5 | deadline และ 14 เคสถูก แต่ไม่ตอบ RMA=3 เพราะไม่รู้ผล Q1 ใน session นี้ |
| Q8 | 70.11s | 4/5 | 4/5 | map 3–5, 1–3, 7–14 และ no-refund ได้ครบ แต่กล่าวว่า PromptPay เริ่ม “หลังตรวจสอบเสร็จ” ซึ่งเป็นลำดับที่เอกสารไม่ได้ยืนยัน |
| Q9 | 41.28s | 2/5 | 1/5 | PII หลักสามฟิลด์ถูก แต่เลือก case 5 แทน case 3 และสร้าง elapsed_days=695 จากวันปัจจุบันแทนกติกา benchmark |
| Q10 | 49.53s | 1/5 | 3/5 | คำนวณองค์ประกอบ case 8 ได้ถูก แต่ละทิ้งผู้ผ่าน Q1 `[2,3,9]`; คำตอบจึงเป็น 55,000/27.5%/145,000 แทน 72,180/36.09%/127,820 |

## สิ่งที่ v6 ดีขึ้น

1. Agents สร้าง full candidate answers และ Q1/Q2 ได้ exact agreement
2. Q3 เลือกหลักฐาน policy ที่เจาะจงกว่าและไม่กล่าวหาว่าลูกค้าให้ข้อมูลเท็จ
3. Q8 รักษา business assumptions และเลือกหลักฐานบัตรเครดิต 7–14 วันได้ แม้มีเพียงหนึ่ง Agent ค้นพบข้อความตรง
4. Final Synthesizer พิจารณาคุณภาพ evidence แทนนับ notification votes

## ข้อบกพร่องที่ยังเหลือ

1. **Benchmark dependency:** Q5–Q7 และ Q10 อ้าง Q1 แต่ harness ใช้ session ใหม่
2. **Retrieval inconsistency:** Q4 มี Agent หนึ่งตัวไม่พบข้อมูล; Q6 ไม่มี Agent ใดดึงราคาเดิมที่มีอยู่ใน MSSQL
3. **Claim-key fragmentation:** ค่าเดียวกันถูกใช้คนละ key จน Aggregator จัดเป็น disputed แม้สาระตรงกัน
4. **PII over-retrieval:** Q5 ส่งชื่อลูกค้าเข้า Final Answer ทั้งที่โจทย์ไม่ต้องการ
5. **Reasoning leakage:** ทุกคำตอบยังมี reasoning ภาษาอังกฤษและ `</think>` ก่อน Final Answer
6. **Latency cost:** concurrent answer generation และ synthesis ทำให้ช้ากว่า v5 เฉลี่ย 18.7 วินาที

## ข้อเสนอรอบถัดไป

- สร้าง Hard-10 รุ่น standalone โดยใส่นิยาม eligibility แทนคำว่า “ผ่าน Q1”
- เพิ่ม deterministic sanitizer ตัดทุกอย่างก่อน `</think>`
- กำหนด canonical claim keys ต่อ benchmark เช่น `eligible_case_ids`, `total_exposure`, `minimum_rma`
- เพิ่ม retrieval contract ว่า facts ที่ต้องใช้ต้องมี SQL/RAG evidence ก่อน candidate ส่งคำตอบ
- จำกัด fields ที่ query ตาม data minimization เพื่อไม่ดึง PII ที่ไม่เกี่ยวข้อง
