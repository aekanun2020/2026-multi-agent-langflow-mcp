# 2026 Multi-Agent Langflow MCP

Repository นี้จัดตัวอย่างตาม **multi-agent orchestration pattern และสายการทดลอง** เพื่อให้แต่ละสายมี Flow, benchmark, ground truth, scripts และเอกสารที่ตรวจสอบย้อนกลับได้ โดยสอง directory ที่เป็น Concurrent แยกกันเพราะศึกษาคนละแนวทาง: answer-level vote กับ claim-level voting

> **ผลเปรียบเทียบล่าสุด:** [Finance/Loan Grounded-18 — Flow Comparison](benchmarks/finance-loan-grounded18/FLOW_COMPARISON.md) — เปรียบเทียบเฉพาะ Flow ที่ทดสอบด้วยคำถาม 18 ข้อและ ground/rubric เดียวกัน พร้อมชื่อไฟล์ ตำแหน่งใน repo และ commit สำหรับตรวจสอบย้อนกลับ

Microsoft Learn แบ่ง orchestration หลักเป็น Sequential, Concurrent, Handoff, Group Chat และ Magentic ดู [Workflow orchestrations in Agent Framework](https://learn.microsoft.com/en-us/agent-framework/workflows/orchestrations/) และ [AI Agent Orchestration Patterns](https://learn.microsoft.com/en-us/azure/architecture/ai-ml/guide/ai-agent-design-patterns)

## Orchestration catalog

| Directory | Microsoft pattern | สถานะ | เนื้อหา |
|---|---|---|---|
| [`Multi-Agent with Concurrent Orchestration/`](Multi-Agent%20with%20Concurrent%20Orchestration/) | **Concurrent orchestration** | [`LAB-concurrent-vote-2of3-retry-thai.json`](Multi-Agent%20with%20Concurrent%20Orchestration/LAB-concurrent-vote-2of3-retry-thai.json) | Worker 3 ตัวรับคำถามเดียวกันพร้อมกัน ใช้ MSSQL/RAG tools เหมือนกัน แล้วส่งคำตอบให้ Vote Agent ที่ไม่มี tool; ตอบเมื่อสาระสำคัญตรงกันอย่างน้อย 2 ใน 3 |
| [`parallel-orchestration/`](parallel-orchestration/) | **Concurrent orchestration** | ล่าสุด: [`v9`](parallel-orchestration/flows/LAB-1-4-withlocal-concurrent-consensus-v9-canonical-claims-thai.json) | Agents รับ task เดียวกันพร้อมกัน แล้วรวมผลแบบ semantic consensus หรือ deterministic claim voting ระดับ claim |
| [`magentic-orchestration/`](magentic-orchestration/) | **Magentic orchestration** | ล่าสุด: v3 | Manager สร้าง task ledger, delegate งานให้ specialist subflows, ตรวจ progress, re-plan และผ่าน Resilient Final Guard |
| [`hybrid-orchestration/`](hybrid-orchestration/) | **Hybrid orchestration** | ล่าสุด: v1 | ผสม Concurrent Workers, Semantic Consensus, Evidence Verification และ Language-only Editing |
| [`Hybrid with Vote-Based Orchestration/`](Hybrid%20with%20Vote-Based%20Orchestration/) | **Hybrid orchestration** | [`LAB-hybrid-vote-2of3-verified-thai.json`](Hybrid%20with%20Vote-Based%20Orchestration/LAB-hybrid-vote-2of3-verified-thai.json) | Concurrent Workers → tool-free Vote 2-of-3 → Evidence Verifier ตามกติกา 4 ข้อ → Language-only Final Editor |

## รุ่นล่าสุดของแต่ละสาย

| สายพัฒนา | รุ่นล่าสุด | อะไรใหม่ที่สุด | ผล Grounded-18 ล่าสุด |
|---|---|---|---|
| **Concurrent — Answer-level Vote** | [`2-of-3 Vote`](Multi-Agent%20with%20Concurrent%20Orchestration/README.md) | Worker 3 ตัวใช้ tools ชุดเดียวกันและทำงานอิสระ; Vote Agent ไม่มี tool และเลือกเฉพาะสาระสำคัญที่ตรงกันอย่างน้อย 2 ใน 3 | Correctness **81.1%**, Faithfulness **87.8%**, Availability **100%**, เวลาเฉลี่ย **15.29s** |
| **Hybrid** | [`Hybrid v1`](hybrid-orchestration/docs/v1-grounded-consensus.md) | รวม 3 Parallel Workers, Semantic Consensus, Evidence Verifier ที่เห็นทั้ง raw answers/draft และ Language-only Faithfulness Editor; ไม่มี rigid JSON contract หรือ fail-closed Guard | Correctness **84.4%**, Faithfulness **96.7%**, Availability **100% first pass** |
| **Hybrid — Vote-Based + Verification** | [`Hybrid Vote 2-of-3 Verified`](Hybrid%20with%20Vote-Based%20Orchestration/README.md) | Vote ไม่ผ่านจึง retry Workers; Vote ผ่านแล้ว Verifier คง/แก้/ตัด/ระบุว่ายืนยัน claim ไม่ได้ จากนั้น Editor เรียบเรียงภาษาเท่านั้น | สร้างและ smoke test ผ่านแล้ว; ยังไม่ได้ยิง Grounded-18 เต็มชุด |
| **Concurrent — Deterministic Claim line** | [`Canonical Claims v9`](parallel-orchestration/docs/flow-versions.md) | Workers ส่ง canonical claims แล้วใช้ deterministic 2-of-3 vote, LLM verbalizer และ Final Claim Guard | Full run เคยล้มจาก MCP; มี targeted artifacts แต่ยังไม่มี final aggregate ที่เทียบ v5 ได้ |
| **Magentic** | [`Resilient Final Guard v3`](magentic-orchestration/docs/v3-resilient-final-guard.md) | Manager ไม่ทำ specialist task เอง; ใช้ SQL/RAG/Verification subflows และ Guard ที่รักษา valid answer เมื่อ audit metadata ขาด | Correctness **51.1%**, Faithfulness **92.2%**, Availability **100%** |

ถ้าต้องการ Flow ที่สมดุลด้านความเร็วและคุณภาพ ให้เริ่มจาก **Concurrent 2-of-3 Answer Vote** ถ้าต้องการคะแนนคุณภาพสูงสุดในผลที่บันทึกไว้ให้ดู **Hybrid v1** ถ้าต้องการศึกษาการ vote claim แบบ deterministic ให้ดู **Concurrent v9** และถ้าต้องการ dynamic planning/delegation ให้ดู **Magentic v3**

ชื่อ directory `parallel-orchestration` ใช้ตามชื่อเดิมของโครงการ ส่วนคำที่ Microsoft Learn ใช้คือ **Concurrent orchestration** ดังนั้น `parallel-orchestration/` และ `Multi-Agent with Concurrent Orchestration/` จัดอยู่ใน pattern เดียวกัน แต่ต่างกันที่หน่วยลงคะแนน:

- `Multi-Agent with Concurrent Orchestration/` ลงคะแนนจากสาระสำคัญของคำตอบทั้งฉบับแบบ 2 ใน 3
- `parallel-orchestration/` สายล่าสุดลงคะแนนจาก canonical claim แต่ละรายการ

## โครงสร้างปัจจุบันและสายที่วางแผนไว้

```text
Multi-Agent with Concurrent Orchestration/  # มีแล้ว: Concurrent 2-of-3 answer vote
parallel-orchestration/                     # มีแล้ว: Concurrent claim/consensus experiments
hybrid-orchestration/                       # มีแล้ว: Concurrent + verification + editing
Hybrid with Vote-Based Orchestration/       # มีแล้ว: 2-of-3 vote + verification + editing
magentic-orchestration/                     # มีแล้ว: Manager-directed planning/delegation
sequential-orchestration/                   # วางแผน: Sequential pipeline
handoff-orchestration/                      # วางแผน: Dynamic transfer of control
group-chat-orchestration/                   # วางแผน: Shared collaborative conversation
```

รายละเอียด Flow, diagram, benchmark และวิธีใช้งานอยู่ที่ [Concurrent 2-of-3 README](Multi-Agent%20with%20Concurrent%20Orchestration/README.md), [Hybrid Vote-Based README](Hybrid%20with%20Vote-Based%20Orchestration/README.md), [Parallel README](parallel-orchestration/README.md), [Magentic README](magentic-orchestration/README.md) และ [Hybrid README](hybrid-orchestration/README.md) ส่วนผลเปรียบเทียบข้ามสายให้อ้างอิง [ตาราง Grounded-18 กลาง](benchmarks/finance-loan-grounded18/FLOW_COMPARISON.md) เพื่อหลีกเลี่ยงการนำคะแนนจากคนละชุดคำถามมาเทียบกัน
