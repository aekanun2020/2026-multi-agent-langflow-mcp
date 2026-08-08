# Hybrid Vote + Verifier vs Concurrent Vote 2-of-3

การเปรียบเทียบนี้ใช้คำถาม Finance/Loan Grounded-18 ชุดเดียวกัน ให้คะแนนจาก Final Answer เท่านั้น และใช้ผลทดสอบ 5 รอบต่อ Flow

| Metric | Concurrent Vote 2-of-3 | Hybrid Vote + Verifier | Difference |
|---|---:|---:|---:|
| Correctness เฉลี่ย | 72.00/90 | **79.00/90** | **Hybrid +7.00** |
| Faithfulness เฉลี่ย | 76.80/90 | **78.20/90** | **Hybrid +1.40** |
| Final Answer availability | 89/90 | **90/90** | **Hybrid +1 answer** |
| เวลาเฉลี่ย | **15.10s** | 23.26s | Hybrid ช้ากว่า 8.16s |
| ช่วง Correctness | **69–73** | 76–81 | Hybrid คะแนนสูงกว่า แต่ช่วงกว้างกว่า 1 คะแนน |
| SD Correctness | **1.55** | 1.79 | Concurrent แกว่งน้อยกว่าเล็กน้อย |
| ช่วง Faithfulness | **73–80** | 72–82 | Hybrid มีทั้งค่าต่ำสุดต่ำกว่าและค่าสูงสุดสูงกว่า |
| SD Faithfulness | **2.79** | 3.97 | Concurrent แกว่งน้อยกว่า |

## Interpretation

- Hybrid เพิ่ม Evidence Verifier หลัง Vote จึงแก้ข้อผิดพลาดบางประเภทและยกระดับคะแนนเฉลี่ย โดยเฉพาะ correctness
- Hybrid ตอบครบ 18/18 ทุกหนึ่งในห้ารอบ ขณะที่ Concurrent Vote หายหนึ่ง Final Answer ในหนึ่งรอบ
- Hybrid ไม่ได้ลด non-determinism ของคะแนนเมื่อเทียบกับ Concurrent Vote เพราะ Verifier เป็น LLM ที่เรียก MSSQL/RAG เพิ่มอีกชั้น จึงเพิ่มจุดที่ผลลัพธ์อาจแปรผัน
- Concurrent Vote เร็วกว่าประมาณ 8.16 วินาทีต่อคำถาม หรือ Hybrid ใช้เวลามากกว่าประมาณ 54%
- หากเป้าหมายคือคะแนนเฉลี่ยและ availability ให้เลือก Hybrid หากเป้าหมายคือ latency และความแกว่งต่ำกว่า ให้เลือก Concurrent Vote

## Flows

- Concurrent Vote: `Multi-Agent with Concurrent Orchestration/LAB-concurrent-vote-2of3-retry-thai.json`
- Hybrid Vote + Verifier: `Hybrid with Vote-Based Orchestration/LAB-hybrid-vote-2of3-verified-thai.json`
