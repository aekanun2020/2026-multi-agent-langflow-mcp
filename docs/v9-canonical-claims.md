# v9 Canonical Finance Claims

v9 รักษา deterministic Final Claim Guard ของ v8 และแก้สาเหตุ upstream ที่ทำให้คำตอบไม่ครบ:

- canonical schema ต่อ 10 Finance/Loan intents
- composite list/object claims สำหรับตารางหลายแถว
- deterministic alias normalization ก่อน vote
- precision-safe aggregate SQL rules
- raw DTI bucket contract แยกจาก validated DTI policy analysis
- workers ใช้ temperature 0 และจำกัด max iterations

เป้าหมาย acceptance บน Grounded-18 คือ availability 100%, correctness อย่างน้อย 80%, faithfulness อย่างน้อย 85%, reasoning leakage 0 และ invented currency 0
