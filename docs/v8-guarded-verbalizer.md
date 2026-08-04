# v8 Guarded Verbalizer

v8 แยกการตัดสินข้อเท็จจริงออกจากการเรียบเรียงภาษาอย่างเด็ดขาด:

1. Loan Analysts สร้าง structured claims
2. deterministic aggregator เลือกเฉพาะ claims ที่ผ่านเสียง 2 ใน 3
3. LLM เสนอเพียงข้อความนำ ข้อความปิด และ label ภาษาไทย โดยห้ามใส่ตัวเลข หน่วย สกุลเงิน policy หรือข้อสรุป
4. deterministic Final Claim Guard ตรวจ proposal และประกอบค่าจริงจาก agreed claims เท่านั้น
5. หาก proposal ผิด schema, ใช้ key นอก consensus หรือมี factual token ต้องห้าม ระบบ fallback เป็น deterministic labels

LLM จึงไม่สามารถแก้ value, ปัดเศษ, เปลี่ยน metric หรือเพิ่มสกุลเงินในคำตอบสุดท้ายได้ แม้ output ของ LLM จะมี reasoning leakage เพราะ guard อ่านเฉพาะ JSON proposal ที่ผ่าน validation และไม่ส่งข้อความดิบของ LLM ไป Chat Output
