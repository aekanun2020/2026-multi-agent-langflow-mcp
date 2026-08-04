# Langflow v5 Thai — Hard-10 Evaluation

วันที่ทดสอบ: 2026-08-04  
Flow ID: `8279ebb2-2592-4557-8b3e-963402aff62e`  
Flow: `LAB-1-4-withlocal-parallel-consensus-v5-thai`

## วิธีทดสอบ

- ยิงคำถาม 10 ข้อผ่าน `/api/v1/run/{flow_id}`
- แต่ละข้อใช้ session ใหม่ ป้องกันคำตอบก่อนหน้ารั่วเข้าข้อถัดไป
- เปิด Benchmark Safe Mode ที่ Executor: สรุป consensus เท่านั้น ห้ามเรียก tool หรือทำ external action
- เทียบกับ `mcp_customer_service_hard10_ground_truth.md`
- คะแนนต่อมิติ 0–5
  - Correctness: ตรวจเฉพาะคำตอบสุดท้ายจาก Chat Output เทียบ ground truth; ไม่นำคำตอบ worker, vote หรือข้อความ reasoning มาช่วยเพิ่มคะแนน
  - Faithfulness: ข้อสรุปมีหลักฐานจากโจทย์/MSSQL/RAG รองรับและไม่แต่งข้อมูล

## ผลรวม

- Availability: **9/10 = 90%** (Q2 timeout ที่ 240 วินาที)
- Correctness แบบ end-to-end รวม timeout เป็นศูนย์: **19/50 = 38.0%**
- Correctness เฉพาะข้อที่มีคำตอบ: **19/45 = 42.2%**
- Faithfulness เฉพาะข้อที่มีคำตอบ: **25/45 = 55.6%**
- Consensus ผ่าน threshold: Q1, Q3, Q4, Q9
- Consensus เป็น `needs_review`: Q5, Q6, Q7, Q8, Q10

| ข้อ | สถานะ | Correctness | Faithfulness | ผลตรวจย่อ |
|---|---:|---:|---:|---|
| Q1 | สำเร็จ | 5/5 | 4/5 | ตรง `[2,3,9]`, 3 เคส, 4 หน่วย, 17,180 บาท; แต่ใช้ `ai_decision=None` เป็นหลักฐาน “ยังไม่ใช้สิทธิ์” ซึ่งไม่ใช่เงื่อนไขซอฟต์แวร์โดยตรง |
| Q2 | Timeout | 0/5 | N/A | ไม่มีคำตอบภายใน 240 วินาที |
| Q3 | สำเร็จ | 5/5 | 4/5 | ตรง 38 วัน, หมดสิทธิ์คืน, ตกกระแทกไม่อยู่ใน warranty; แต่ตีความ `do_not_notify` เป็น “ไม่ติดต่อกลับ/ปฏิเสธเคลม” เกินความหมายของ vote label |
| Q4 | สำเร็จ | 4/5 | 5/5 | เคส 8 เข้า warranty inspection ถูกต้อง; เคส 1 ตัด warranty ถูก แต่ยังบอกให้ตรวจยืนยันแทนการสรุป route ว่าปฏิเสธทั้ง return และ warranty |
| Q5 | สำเร็จ | 0/5 | 2/5 | แปล “ผ่าน Q1” เป็น “อยู่ในไตรมาส 1” ทำให้ไม่สร้างคิว ทั้งที่คำตอบคือ 3→9→2 |
| Q6 | สำเร็จ | 0/5 | 1/5 | Final answer ปฏิเสธทั้งหมดและสรุปยอดจ่ายเพิ่มเป็นศูนย์ จึงไม่ตรง ground truth; แม้ reasoning ก่อน final จะเคยคำนวณบางค่าได้ถูก แต่ไม่นำมาคิดคะแนน; final ยังสร้างราคาเคส 2 เป็น 945 บาทจากการหารจำนวนหน่วยผิด |
| Q7 | สำเร็จ | 3/5 | 3/5 | deadline และ 14 เคสถูก แต่ไม่ตอบ RMA=3 เพราะตีความ Q1 ผิด |
| Q8 | สำเร็จ | 2/5 | 4/5 | ดึงกรอบ 3–5, 1–3, 7–14 วันได้ แต่ไม่ยอมใช้สมมติฐานวิธีชำระที่โจทย์กำหนด จึงไม่ตอบรายเคส |
| Q9 | สำเร็จ | 0/5 | 0/5 | เลือกอันดับหนึ่งผิดเป็นเคส 1, สร้าง elapsed_days=733 และใส่ข้อความ damage ลง exposure; ground truth ต้องเป็นเคส 3, 2 วัน, 8,900 บาท |
| Q10 | สำเร็จ | 0/5 | 2/5 | ไม่คำนวณ `[2,3,8,9]`, 72,180 บาท, 36.09%, 127,820 บาท เพราะตีความ Q1 เป็นฟิลด์ฐานข้อมูล |

## Failure modes

1. **Cross-question reference failure** — คำว่า `ผ่าน Q1` ถูกตีความเป็น quarter 1 แทนผล eligibility จากข้อ 1 ใน Q5–Q7 และ Q10
2. **Assumption rejection** — Q8 ระบุวิธีชำระและสถานการณ์เป็นสมมติฐานในโจทย์ แต่ workers กลับเรียกร้องให้มีคอลัมน์จริงในฐานข้อมูล
3. **Schema/value confusion** — Q9 สลับค่าระหว่าง elapsed, exposure และ damage description
4. **Unit-price error** — Q6 เอาราคาต่อหน่วย 1,890 บาทไปหาร quantity=2 กลายเป็น 945 บาท
5. **Vote-label semantic mismatch** — `notify/do_not_notify` ไม่เหมาะกับงาน analytical QA ทำให้คำตอบแปล vote เป็นการแจ้งหรือไม่แจ้งลูกค้า แทนถูก/ผิด
6. **Hidden reasoning leakage** — final answers มีข้อความภาษาอังกฤษและแท็ก `</think>` ก่อนคำตอบภาษาไทย
7. **Latency instability** — Q2 timeout; ข้อที่สำเร็จใช้ประมาณ 21–60 วินาที

## ข้อสรุป

Flow ทำได้ดีเมื่อโจทย์ standalone และมีตัวเลข/นโยบายตรงไปตรงมา (Q1, Q3) แต่ยังไม่พร้อมใช้เป็น evaluator สำหรับชุดคำถามต่อเนื่อง เพราะ vote schema ออกแบบเป็น `notify/do_not_notify` และ workers ไม่ได้รับ state/definition ของ Q1 ใน session ใหม่ ผลคะแนนที่ต่ำจึงเกิดจากทั้ง orchestration และ benchmark dependency ไม่ใช่ความสามารถค้น MSSQL/RAG เพียงอย่างเดียว

ก่อน rerun ควรทำคำถามทุกข้อให้ standalone โดยแทน `ผ่าน Q1` ด้วยกติกา eligibility เต็มประโยค และเปลี่ยน vote schema เป็น `correct / incorrect / abstain` พร้อมบังคับ JSON output หลังตัด `<think>` ออก
