# v7 Financial & Loan Concurrent Consensus

v7 ต่อยอด concurrent full-answer orchestration ของ v6 โดยเพิ่ม analytical contract สำหรับข้อมูลสินเชื่อใน MSSQL และนโยบาย DTI จาก RAG

## Loan data model

- Fact: `loans_fact` (1,432,440 rows ณ วันที่สำรวจ)
- Dimensions: `application_type_dim`, `emp_length_dim`, `home_ownership_dim`, `issue_d_dim`, `loan_status_dim`
- Measures: requested/funded amount, interest rate, installment, annual income, joint income, DTI และ joint DTI

## Guardrails

- SQL/RAG read-only
- Interest rate decimal-to-percent normalization
- Explicit population, numerator, denominator, units and period
- DTI data-quality exclusion for NULL, negative values and sentinel/outliers such as 999
- Separate Individual and Joint App semantics
- No automatic approval/denial or causal claims from a single field
- Three independent full answers followed by deterministic 2-of-3 claim consensus

## DTI policy grounding

RAG source: `dti-calculation-guide.md`

Formula: monthly debt obligations / gross monthly income × 100. General guidance bands are <36%, 36–42%, 43–50%, and >50%; these are guidance, not an automatic underwriting decision.
