# Langflow Parallel Consensus v5 vs PyClaw — Finance/Loan 18

ผลทดสอบใหม่แบบทีละข้อระหว่าง Langflow parallel vote-based consensus v5 กับ PyClaw โดยใช้คำถาม Finance/Loan 18 ข้อชุดเดียวกันและประเมินเฉพาะ final answer

## System under test

- SUT: [`../../flows/LAB-1-4-withlocal-parallel-consensus-v5-thai.json`](../../flows/LAB-1-4-withlocal-parallel-consensus-v5-thai.json)
- SUT SHA-256: `85320a708efbd5e4e5068f7567fd24b5ad6de7fa7439b71ff630ec4e36223c87`
- Runtime project: `NT`
- Runtime Flow ID: `8279ebb2-2592-4557-8b3e-963402aff62e`
- Runtime API: `http://127.0.0.1:7860/api/v1/run/8279ebb2-2592-4557-8b3e-963402aff62e`
- Comparator: [`aekanun2020/PyClaw`](https://github.com/aekanun2020/PyClaw)
- Model: `qwen/qwen3.5-35b-a3b` ผ่าน OpenRouter

นี่คือ **Parallel orchestration + deterministic vote-based consensus** ไม่ใช่ Hybrid orchestration การใช้ MSSQL และ RAG พร้อมกันหมายถึงมีสอง evidence sources ไม่ได้เปลี่ยน orchestration ให้เป็น Hybrid

## MCP endpoints

- MSSQL MCP จาก host: `http://127.0.0.1:9000/mcp`
- RAG MCP: `http://100.64.102.88:8000/mcp`
- Langflow server names: `local-mcp-mssql` และ `vpn-rag`

ทุก endpoint ลงท้ายด้วย `/mcp` ไม่มี API key หรือ credential ถูกบันทึกใน benchmark

## ผลรวม

| ระบบ | Correctness | Faithfulness | รวมสองมิติ |
|---|---:|---:|---:|
| Langflow v5 | **64/90 (71.1%)** | 56/90 (62.2%) | **120/180** |
| PyClaw | 56/90 (62.2%) | **63/90 (70.0%)** | 119/180 |

ผลรวมเกือบเสมอ แต่มี failure mode คนละแบบ:

- Langflow v5 ตอบได้บ่อยกว่าและชนะ correctness แต่ customer-service vote schema ปนในทุกคำตอบ, เพิ่ม claim ที่ RAG ไม่ยืนยัน และบางข้อไม่ reconcile worker conflicts
- PyClaw ควบคุม claim ได้ดีกว่าโดยรวม แต่มี context corruption ใน Q7, policy block ใน Q12 และไม่ emit final answer ใน Q17–Q18
- ทั้งสองระบบมี reasoning leakage

ผลรายข้อเต็มอยู่ใน [`evaluation-per-question.md`](evaluation-per-question.md) และคะแนน machine-readable อยู่ใน [`scores.json`](scores.json)

## ไฟล์

- [`questions.json`](questions.json) — frozen question manifest
- [`questions.txt`](questions.txt) — คำถามแบบอ่านง่าย เรียงง่ายไปยาก
- [`ground-truth.json`](ground-truth.json) — frozen MSSQL ground ที่มีอยู่ก่อนการ rerun
- [`sut-manifest.json`](sut-manifest.json) — SUT/runtime provenance
- [`raw/langflow-v5/`](raw/langflow-v5/) — raw final responses Q01–Q18
- [`raw/pyclaw/`](raw/pyclaw/) — raw responses และ tool events Q01–Q18

## Rubric

คะแนน 0–5 ต่อมิติต่อข้อ:

- Correctness: ตรวจเฉพาะ final answer ว่าตอบ business requirements และตรง ground หรือไม่
- Faithfulness: ตรวจว่า claim ใน final answer มี MSSQL/RAG evidence รองรับหรือไม่

การ abstain อาจมี faithfulness สูงแต่ correctness ต่ำได้ และคะแนน faithfulness ของคำตอบที่ไม่มี claim เช่น `[response blocked by policy]` ต้องอ่านร่วมกับ availability ไม่ควรตีความว่าเป็นระบบที่ใช้งานได้ดี

## Auxiliary experiment ที่ไม่ใช่ benchmark นี้

ผล `V5 Pure Python Agent vs PyClaw` ใต้ `cross-system-benchmarks/` เป็นคนละ experiment และไม่ใช่ Langflow SUT รอบนี้
