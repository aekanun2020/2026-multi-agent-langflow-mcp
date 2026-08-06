# 2026 Multi-Agent Langflow MCP

Repository นี้จัดตัวอย่างตาม **multi-agent orchestration pattern** เพื่อให้แต่ละ pattern มี flow, benchmark, ground truth, scripts และเอกสารของตัวเองโดยไม่ปะปนกัน

> **ผลเปรียบเทียบล่าสุด:** [Finance/Loan Grounded-18 — Flow Comparison](benchmarks/finance-loan-grounded18/FLOW_COMPARISON.md) — เปรียบเทียบเฉพาะ Flow ที่ทดสอบด้วยคำถาม 18 ข้อและ ground/rubric เดียวกัน พร้อมชื่อไฟล์ ตำแหน่งใน repo และ commit สำหรับตรวจสอบย้อนกลับ

Microsoft Learn แบ่ง orchestration หลักเป็น Sequential, Concurrent, Handoff, Group Chat และ Magentic ดู [Workflow orchestrations in Agent Framework](https://learn.microsoft.com/en-us/agent-framework/workflows/orchestrations/) และ [AI Agent Orchestration Patterns](https://learn.microsoft.com/en-us/azure/architecture/ai-ml/guide/ai-agent-design-patterns)

## Orchestration catalog

| Directory | Microsoft pattern | สถานะ | เนื้อหา |
|---|---|---|---|
| [`Multi-Agent with Concurrent Orchestration/`](Multi-Agent%20with%20Concurrent%20Orchestration/) | **Concurrent orchestration** | ล่าสุด: 2-of-3 Answer Vote | Worker 3 ตัวรับคำถามเดียวกันพร้อมกัน ใช้ MSSQL/RAG tools เหมือนกัน แล้วส่งคำตอบให้ Vote Agent ที่ไม่มี tool; ตอบเมื่อสาระสำคัญตรงกันอย่างน้อย 2 ใน 3 |
| [`parallel-orchestration/`](parallel-orchestration/) | **Concurrent orchestration** | ล่าสุด: v9 | Agents รับ task เดียวกันพร้อมกัน แล้วรวมผลแบบ semantic consensus หรือ deterministic claim voting |
| [`magentic-orchestration/`](magentic-orchestration/) | **Magentic orchestration** | ล่าสุด: v3 | Manager สร้าง task ledger, delegate งานให้ specialist subflows, ตรวจ progress, re-plan และผ่าน Resilient Final Guard |
| [`hybrid-orchestration/`](hybrid-orchestration/) | **Hybrid orchestration** | ล่าสุด: v1 | ผสม Concurrent Workers, Semantic Consensus, Evidence Verification และ Language-only Editing |

## รุ่นล่าสุดของแต่ละสาย

| สายพัฒนา | รุ่นล่าสุด | อะไรใหม่ที่สุด | ผล Grounded-18 ล่าสุด |
|---|---|---|---|
| **Concurrent — Answer-level Vote** | [`2-of-3 Vote`](Multi-Agent%20with%20Concurrent%20Orchestration/README.md) | Worker 3 ตัวใช้ tools ชุดเดียวกันและทำงานอิสระ; Vote Agent ไม่มี tool และเลือกเฉพาะสาระสำคัญที่ตรงกันอย่างน้อย 2 ใน 3 | Correctness **81.1%**, Faithfulness **87.8%**, Availability **100%**, เวลาเฉลี่ย **15.29s** |
| **Hybrid** | [`Hybrid v1`](hybrid-orchestration/docs/v1-grounded-consensus.md) | รวม 3 Parallel Workers, Semantic Consensus, Evidence Verifier ที่เห็นทั้ง raw answers/draft และ Language-only Faithfulness Editor; ไม่มี rigid JSON contract หรือ fail-closed Guard | Correctness **84.4%**, Faithfulness **96.7%**, Availability **100% first pass** |
| **Concurrent — Deterministic Claim line** | [`Canonical Claims v9`](parallel-orchestration/docs/flow-versions.md) | Workers ส่ง canonical claims แล้วใช้ deterministic 2-of-3 vote, LLM verbalizer และ Final Claim Guard | Full run เคยล้มจาก MCP; มี targeted artifacts แต่ยังไม่มี final aggregate ที่เทียบ v5 ได้ |
| **Magentic** | [`Resilient Final Guard v3`](magentic-orchestration/docs/v3-resilient-final-guard.md) | Manager ไม่ทำ specialist task เอง; ใช้ SQL/RAG/Verification subflows และ Guard ที่รักษา valid answer เมื่อ audit metadata ขาด | Correctness **51.1%**, Faithfulness **92.2%**, Availability **100%** |

ถ้าต้องการ Flow ที่สมดุลด้านความเร็วและคุณภาพ ให้เริ่มจาก **Concurrent 2-of-3 Answer Vote** ถ้าต้องการคะแนนคุณภาพสูงสุดในผลที่บันทึกไว้ให้ดู **Hybrid v1** ถ้าต้องการศึกษาการ vote claim แบบ deterministic ให้ดู **Concurrent v9** และถ้าต้องการ dynamic planning/delegation ให้ดู **Magentic v3**

ชื่อ directory `parallel-orchestration` ใช้ตามชื่อที่โครงการนี้เลือก ส่วนคำที่ Microsoft Learn ใช้ในเอกสารปัจจุบันคือ **Concurrent orchestration** ซึ่งหมายถึง pattern เดียวกันในบริบทนี้

Directory สำหรับ pattern อื่นจะเพิ่มที่ระดับเดียวกันในอนาคต เช่น:

```text
Multi-Agent with Concurrent Orchestration/  # Concurrent 2-of-3 answer vote
parallel-orchestration/     # Concurrent orchestration
hybrid-orchestration/       # Concurrent consensus + grounded verification
sequential-orchestration/   # Sequential pipeline
handoff-orchestration/      # Dynamic transfer of control
group-chat-orchestration/   # Shared collaborative conversation
magentic-orchestration/     # Manager-directed dynamic planning (latest: v3)
```

รายละเอียด flow, diagram, benchmark และวิธีใช้งานอยู่ที่ [Concurrent 2-of-3 README](Multi-Agent%20with%20Concurrent%20Orchestration/README.md), [Parallel README](parallel-orchestration/README.md), [Magentic README](magentic-orchestration/README.md) และ [Hybrid README](hybrid-orchestration/README.md)
