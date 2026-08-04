# Langflow v5 Thai — Clean SUT Hard-10 Evaluation

วันที่ทดสอบ: 2026-08-04  
Flow ID: `8279ebb2-2592-4557-8b3e-963402aff62e`  
Flow: `LAB-1-4-withlocal-parallel-consensus-v5-thai`

## สถานะ

ผลนี้เป็น **clean SUT run**: runner ไม่ส่ง `tweaks` ไม่ override `system_prompt` และไม่เปลี่ยน parameter ของ component ใน flow

## วิธีทดสอบและเกณฑ์

- ยิง 10 คำถามผ่าน `/api/v1/run/{flow_id}`
- ใช้ session ใหม่ต่อคำถามเพื่อไม่ให้ context รั่วข้ามข้อ
- Correctness ตรวจเฉพาะ **Final Answer หลัง `</think>` จาก Chat Output** เทียบ ground truth
- ไม่นำ worker answers, vote, consensus rate หรือข้อความ reasoning ก่อน final มาช่วยเพิ่มคะแนน
- Faithfulness ตรวจเฉพาะ Final Answer ว่าข้อกล่าวอ้างมีหลักฐานจากโจทย์ MSSQL หรือ RAG รองรับและไม่แต่งค่า
- คะแนนต่อมิติ 0–5; timeout นับ correctness เป็น 0 ในคะแนน end-to-end

## ผลรวม

- Availability: **10/10 = 100%**
- Correctness: **22/50 = 44.0%**
- Faithfulness: **34/50 = 68.0%**
- เวลาเฉลี่ย: **43.2 วินาที/ข้อ**
- เร็วสุด: Q8 = 26.02 วินาที
- ช้าที่สุด: Q2 = 81.29 วินาที

| ข้อ | เวลา | Correctness | Faithfulness | การประเมิน Final Answer |
|---|---:|---:|---:|---|
| Q1 | 65.99s | 5/5 | 5/5 | ตรงครบ: `[2,3,9]`, 3 เคส, 4 หน่วย, exposure 17,180 บาท |
| Q2 | 81.29s | 4/5 | 4/5 | case `[1,5,8]`, วันเกิน 31/7/12 และ exposure 220,900 ถูก แต่ final ระบุกรอบ software เป็น 7 วัน ทั้งที่ ground คือ 3 วัน แม้ไม่กระทบรายชื่อรอบนี้ |
| Q3 | 31.50s | 4/5 | 3/5 | 38 วัน, หมดสิทธิ์คืน และตกกระแทกไม่อยู่ใน warranty ถูก แต่กล่าวหาว่าลูกค้า “ให้ข้อมูลเท็จ” ทั้งที่หลักฐานยืนยันได้เพียงข้อมูลสองช่องขัดแย้งกัน |
| Q4 | 34.26s | 3/5 | 4/5 | เคส 8 เข้า warranty inspection ถูก แต่เคส 1 สรุปเพียง “อาจปฏิเสธ warranty/ต้องตรวจยืนยัน” แทน route สุดท้ายว่าปฏิเสธทั้ง return และ warranty ตามกติกาโจทย์ |
| Q5 | 37.34s | 0/5 | 3/5 | ไม่ตอบลำดับ `3→9→2`; ตีความ “ผ่าน Q1” เป็นคอลัมน์ฐานข้อมูล ข้อมูล severe aggregate ที่รายงานมีแหล่งรองรับแต่ไม่ตอบคำถาม |
| Q6 | 29.49s | 0/5 | 3/5 | ไม่ตัดสินผ่าน/ไม่ผ่านและไม่คำนวณ 1,610/2,100/1,499 ตามสมมติฐานโจทย์ โดยเข้าใจ Q1 ผิดและปฏิเสธราคาทดแทนที่โจทย์กำหนดให้ |
| Q7 | 50.48s | 3/5 | 4/5 | deadline และ 14 เคสถูก แต่ไม่ตอบ RMA ขั้นต่ำ 3 รายการ |
| Q8 | 26.02s | 1/5 | 4/5 | final กล่าวถึงกรอบ 3–5 วันเพียงบางส่วน แต่ไม่ map เคส 2/3/9 กับ 1–3, 7–14 และ no-refund timeline ตามสมมติฐานโจทย์ |
| Q9 | 35.45s | 2/5 | 1/5 | ระบุ PII 3 ฟิลด์ถูก แต่เลือกตัวอย่างเคส 5 แทนเคส 3 พร้อมสร้าง `elapsed_days=695` และใส่ `รุนแรง` ใน exposure |
| Q10 | 39.72s | 0/5 | 3/5 | ไม่คำนวณ `[2,3,8,9]`, 72,180 บาท, 36.09%, 127,820 บาท เพราะตีความ Q1 เป็นฟิลด์และปฏิเสธ business assumptions ที่โจทย์กำหนด |

## Correct final-answer findings

- Q1 แก้โจทย์ eligibility และ exposure ได้ครบ
- Q2 คืนผลลัพธ์หลักครบ แม้มีข้อความ policy ผิดหนึ่งจุด
- Q3 คืนผลลัพธ์หลักครบ แต่เพิ่มข้อกล่าวหาที่หลักฐานไม่รองรับ
- Q7 คำนวณ deadline และจำนวนเคสได้ แต่ขาด RMA count

## Failure modes

1. **Cross-question dependency** — Q5, Q6, Q7 และ Q10 ใช้คำว่า “ผ่าน Q1” แต่แต่ละข้อรันด้วย session ใหม่ ทำให้ flow ตีความเป็น quarter/column แทน eligibility set `[2,3,9]`
2. **Rejecting stated assumptions** — Q6 และ Q8 ปฏิเสธค่าที่โจทย์กำหนดเป็น counterfactual เพราะหา field จริงในฐานข้อมูลไม่พบ
3. **Vote schema mismatch** — `notify/do_not_notify/abstain` ออกแบบสำหรับ notification decision ไม่ใช่ analytical correctness ทำให้ Executor เน้นว่าจะส่ง notification หรือไม่ แทนตอบ business question
4. **Unsafe fabrication** — Q9 สร้าง elapsed และ exposure ที่ผิดชนิดอย่างชัดเจน
5. **Unsupported intent attribution** — Q3 เปลี่ยน data inconsistency เป็นข้อกล่าวหาว่าลูกค้าให้ข้อมูลเท็จ
6. **Reasoning leakage** — Chat Output ยังมีข้อความภาษาอังกฤษและ `</think>` ก่อน Final Answer ภาษาไทย

## ข้อจำกัดของ benchmark

Q5–Q7 และ Q10 ไม่ standalone เพราะอ้างผล Q1 ขณะที่ harness แยก session ทุกข้อ คะแนนจึงสะท้อนทั้งข้อจำกัดของ flow และข้อบกพร่องการออกแบบโจทย์ รอบถัดไปควรแทนคำว่า “ผ่าน Q1” ด้วยนิยาม eligibility เต็มประโยค แต่ต้องเก็บชุดเดิมไว้เพื่อเปรียบเทียบ regression

## Historical result

ผลรอบที่เคย override Executor prompt ถูกเก็บแยกไว้ใน `evaluation-safe-mode-invalidated.md` และห้ามนำมาใช้เป็น clean SUT baseline
