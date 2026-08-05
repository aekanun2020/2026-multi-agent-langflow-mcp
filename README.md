# 2026 Multi-Agent Langflow MCP

Repository นี้จัดตัวอย่างตาม **multi-agent orchestration pattern** เพื่อให้แต่ละ pattern มี flow, benchmark, ground truth, scripts และเอกสารของตัวเองโดยไม่ปะปนกัน

Microsoft Learn แบ่ง orchestration หลักเป็น Sequential, Concurrent, Handoff, Group Chat และ Magentic ดู [Workflow orchestrations in Agent Framework](https://learn.microsoft.com/en-us/agent-framework/workflows/orchestrations/) และ [AI Agent Orchestration Patterns](https://learn.microsoft.com/en-us/azure/architecture/ai-ml/guide/ai-agent-design-patterns)

## Orchestration catalog

| Directory | Microsoft pattern | สถานะ | เนื้อหา |
|---|---|---|---|
| [`parallel-orchestration/`](parallel-orchestration/) | **Concurrent orchestration** | ล่าสุด: Hybrid v5 / Deterministic v9 | Agents รับ task เดียวกันพร้อมกัน แล้วรวมผลแบบ semantic consensus หรือ deterministic claim voting |
| [`magentic-orchestration/`](magentic-orchestration/) | **Magentic orchestration** | ล่าสุด: v3 | Manager สร้าง task ledger, delegate งานให้ specialist subflows, ตรวจ progress, re-plan และผ่าน Resilient Final Guard |

## รุ่นล่าสุดของแต่ละสาย

| สายพัฒนา | รุ่นล่าสุด | อะไรใหม่ที่สุด | ผล Grounded-18 ล่าสุด |
|---|---|---|---|
| **Concurrent — Semantic/Paper line** | [`Hybrid v5`](parallel-orchestration/docs/v5-hybrid-grounded.md) | รวม 3 Parallel Workers, Semantic Consensus, Evidence Verifier ที่เห็นทั้ง raw answers/draft และ Language-only Faithfulness Editor; ไม่มี rigid JSON contract หรือ fail-closed Guard | Correctness **78.9%**, Faithfulness **93.3%**, Availability **100% หลัง retry** |
| **Concurrent — Deterministic Claim line** | [`Canonical Claims v9`](parallel-orchestration/docs/flow-versions.md) | Workers ส่ง canonical claims แล้วใช้ deterministic 2-of-3 vote, LLM verbalizer และ Final Claim Guard | Full run เคยล้มจาก MCP; มี targeted artifacts แต่ยังไม่มี final aggregate ที่เทียบ v5 ได้ |
| **Magentic** | [`Resilient Final Guard v3`](magentic-orchestration/docs/v3-resilient-final-guard.md) | Manager ไม่ทำ specialist task เอง; ใช้ SQL/RAG/Verification subflows และ Guard ที่รักษา valid answer เมื่อ audit metadata ขาด | Correctness **51.1%**, Faithfulness **92.2%**, Availability **100%** |

ถ้าต้องการ flow ที่ผล benchmark ปัจจุบันดีที่สุด ให้เริ่มจาก **Concurrent Hybrid v5** ถ้าต้องการศึกษาการ vote claim แบบ deterministic ให้ดู **Concurrent v9** และถ้าต้องการ dynamic planning/delegation ให้ดู **Magentic v3**

ชื่อ directory `parallel-orchestration` ใช้ตามชื่อที่โครงการนี้เลือก ส่วนคำที่ Microsoft Learn ใช้ในเอกสารปัจจุบันคือ **Concurrent orchestration** ซึ่งหมายถึง pattern เดียวกันในบริบทนี้

Directory สำหรับ pattern อื่นจะเพิ่มที่ระดับเดียวกันในอนาคต เช่น:

```text
parallel-orchestration/     # Concurrent orchestration
sequential-orchestration/   # Sequential pipeline
handoff-orchestration/      # Dynamic transfer of control
group-chat-orchestration/   # Shared collaborative conversation
magentic-orchestration/     # Manager-directed dynamic planning (latest: v3)
```

รายละเอียด flow, diagram, benchmark และวิธีใช้งานอยู่ที่ [Parallel Orchestration README](parallel-orchestration/README.md) และ [Magentic Orchestration README](magentic-orchestration/README.md)
