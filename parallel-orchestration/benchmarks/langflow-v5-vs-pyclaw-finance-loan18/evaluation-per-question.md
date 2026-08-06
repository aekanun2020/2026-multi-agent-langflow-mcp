# Evaluation per question

คะแนนเรียงเป็น Correctness/Faithfulness และประเมิน final answer เท่านั้น

| ข้อ | Langflow | PyClaw | ผล | ข้อค้นพบหลัก |
|---|---:|---:|---|---|
| Q1 | 4/5 | 4/5 | เสมอ | ตัวเลขหลักถูกแต่ totals ถูกปัด; Langflow มี customer-service vote ปน |
| Q2 | 4/3 | 5/5 | PyClaw | Langflow เพิ่มนิยาม Individual/Joint ที่ RAG ไม่ยืนยัน |
| Q3 | 4/3 | 5/5 | PyClaw | Langflow เรียก Default count ต่ำว่า data-quality anomaly โดยไม่มี ground |
| Q4 | 3/2 | 2/1 | Langflow | ทั้งคู่ขาด counts และเพิ่มสกุลเงิน; PyClaw เพิ่ม USD |
| Q5 | 3/4 | 3/3 | Langflow | ทั้งคู่ขาด counts; PyClaw อ้างว่าไม่มี RAG policy โดยไม่ได้เรียก RAG |
| Q6 | 4/3 | 4/3 | เสมอ | Extrema ถูก; Langflow overclaim ความหมาย N/A, PyClaw เพิ่ม USD และเรียก 1 year ว่าอายุงานต่ำสุด |
| Q7 | 2/2 | 0/1 | Langflow | PyClaw context corruption ไปตอบเรื่อง `sec_10`/`sec_30`; Langflow ขาด counts และกล่าวผิดว่าไม่มี sentinel |
| Q8 | 5/4 | 5/4 | เสมอ | Metrics ครบและไม่มี causal claim; PyClaw เรียก observed maximum ว่าอาจเป็น outlier |
| Q9 | 4/4 | 3/2 | Langflow | PyClaw เพิ่มบาทและถ้อยคำคล้าย approval interpretation |
| Q10 | 4/3 | 3/2 | Langflow | PyClaw ฟันธง dti_joint ว่าเหมาะสมทั้งที่ RAG ไม่ยืนยันและเพิ่ม USD |
| Q11 | 3/3 | 3/2 | Langflow | ทั้งคู่เลือก policy threshold เอง; PyClaw ยกระดับ conditional 45% เป็น hard policy |
| Q12 | 3/2 | 0/5* | Langflow | PyClaw คืน `[response blocked by policy]`; Langflow ตอบได้แต่ overclaim นิยาม installment และเพิ่ม USD |
| Q13 | 4/3 | 5/5 | PyClaw | SQL ถูกทั้งคู่; PyClaw ซื่อตรงว่า RAG ไม่มีเอกสาร causal/descriptive โดยตรง |
| Q14 | 5/5 | 5/5 | เสมอ | MORTGAGE ถูกต้องและไม่เรียก “ลูกค้าดี”; PyClaw เร็วกว่า |
| Q15 | 5/3 | 4/5 | PyClaw | Langflow เพิ่ม speculation เรื่อง NULL; PyClaw ควบคุม claim ดีกว่าแต่ปัดปี 2019 ผิด 0.01 |
| Q16 | 2/2 | 2/4 | PyClaw | Langflow เลือก DTI <=43 และเพิ่ม USD; PyClaw ขอ threshold ชัดเจนแต่ไม่คำนวณ metrics |
| Q17 | 4/4 | 3/2 | Langflow | Langflow ตอบครบแต่ใช้ <=36; PyClaw ใช้ <36 ถูกกว่าแต่ emit reasoning อังกฤษแทน final และเพิ่ม USD |
| Q18 | 1/1 | 0/4* | Langflow | Langflow มีรายงานแต่ incomplete/ขัดแย้งและเพิ่ม USD; PyClaw ไม่ emit final answer |

`*` Faithfulness สูงแบบ vacuous เพราะไม่มี substantive final claims ต้องอ่านร่วมกับ correctness/availability

## Failure patterns

### Langflow v5

- Final executor ถูกล็อกกับ Customer Service Operations ทำให้ `notify`, `do_not_notify`, `needs_review` ปนในโจทย์ finance ทุกข้อ
- Workers ให้ evidence ที่ดีหลายข้อ แต่ final executor เพิ่ม claim ใหม่หรือไม่ reconcile ความขัดแย้ง
- Currency hallucination, RAG-confirmation overclaim และ policy-threshold selection เป็นปัญหาซ้ำ

### PyClaw

- Specialist routing และ evidence-source separation ดีกว่าในหลายข้อ
- Final synthesis เพิ่ม currency/policy claims บางข้อ
- Q7 เกิด context corruption จาก citation-grounding feedback
- Q12 ถูก policy block โดยไม่เกี่ยวกับความเสี่ยงของคำถาม
- Q17–Q18 รวบรวม evidence ได้แต่ไม่ emit final answer ที่สมบูรณ์
