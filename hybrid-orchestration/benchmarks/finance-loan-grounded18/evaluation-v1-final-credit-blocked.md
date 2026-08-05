# Hybrid v1 Final Grounded-18 — Credit-blocked Run

วันที่รัน: 2026-08-05

- Flow: `LAB-hybrid-v1-grounded-consensus-thai`
- Flow ID: `cd488940-5fa4-4567-b5e8-43b26d5643ae`
- Raw artifact: `raw-v1-final-credit-blocked.jsonl`
- Requests attempted: 18/18
- Successful Final Answers: 0/18
- Failure: OpenRouter HTTP 402 `Insufficient credits` ที่ Paper Worker 3 ก่อน flow ประมวลผลคำถาม

## Evaluation status

รอบนี้ **invalidated / infrastructure-blocked** และห้ามใช้คำนวณหรือเปรียบเทียบ correctness กับ faithfulness เพราะไม่มี Final Answer จาก SUT แม้แต่ข้อเดียว ค่า 0 ที่เกิดจาก execution failure ไม่ได้เป็นหลักฐานว่า architecture ตอบผิด

ต้องเติม OpenRouter credits แล้วรันใหม่ด้วย session ใหม่และ raw output path ใหม่ ห้าม append หรือแทนที่ artifact นี้
