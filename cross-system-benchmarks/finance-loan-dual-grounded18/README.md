# Finance/Loan Dual-Grounded 18

Benchmark นี้ใช้คำถาม finance/loan 18 ข้อ เรียงจากง่ายไปยาก ทุกข้อมี business logic และออกแบบให้ตรวจตัวเลขจาก MSSQL พร้อมตรวจนิยาม/นโยบายจาก RAG

## เริ่มอ่านจากไฟล์ใด

1. [`questions.txt`](questions.txt) — คำถามแบบอ่านง่าย
2. [`manifest.json`](manifest.json) — ชุดคำถามและแหล่ง ground แบบ machine-readable
3. [`evaluation-v5-python-vs-pyclaw-20260806.md`](evaluation-v5-python-vs-pyclaw-20260806.md) — ผลวิเคราะห์ V5 Pure Python เทียบ PyClaw
4. [`scores-v5-python-vs-pyclaw-20260806.json`](scores-v5-python-vs-pyclaw-20260806.json) — คะแนนรายข้อ

## Raw evidence

- [`raw-v5-python-20260806.json`](raw-v5-python-20260806.json) — V5 Pure Python Agent commit `89228c2`
- [`raw-pyclaw-20260806.json`](raw-pyclaw-20260806.json) — PyClaw commit `d821bb3`
- [`raw-langflow-v5-20260806.jsonl`](raw-langflow-v5-20260806.jsonl) — auxiliary run เท่านั้น ไม่ใช่ V5 Pure Python และไม่รวมในคะแนนหลัก

V5 ถูกทดสอบโดยไม่แก้ architecture และใช้ MSSQL MCP endpoint เดียวตาม runtime เดิม ส่วน PyClaw ใช้ MSSQL และ RAG MCP ตามความสามารถของระบบ ความต่างด้าน dual-source coverage จึงเป็นผลของ architecture จริง ไม่ใช่การปรับระบบระหว่างสอบ
