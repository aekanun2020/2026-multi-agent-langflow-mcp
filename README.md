# 2026 Multi-Agent Langflow MCP

Repository นี้จัดตัวอย่างตาม **multi-agent orchestration pattern** เพื่อให้แต่ละ pattern มี flow, benchmark, ground truth, scripts และเอกสารของตัวเองโดยไม่ปะปนกัน

Microsoft Learn แบ่ง orchestration หลักเป็น Sequential, Concurrent, Handoff, Group Chat และ Magentic ดู [Workflow orchestrations in Agent Framework](https://learn.microsoft.com/en-us/agent-framework/workflows/orchestrations/) และ [AI Agent Orchestration Patterns](https://learn.microsoft.com/en-us/azure/architecture/ai-ml/guide/ai-agent-design-patterns)

## Orchestration catalog

| Directory | Microsoft pattern | สถานะ | เนื้อหา |
|---|---|---|---|
| [`parallel-orchestration/`](parallel-orchestration/) | **Concurrent orchestration** | v5–v9 | Agents รับ task เดียวกันและทำงานอย่างอิสระพร้อมกัน จากนั้นรวมผลด้วย deterministic consensus/voting |
| [`magentic-orchestration/`](magentic-orchestration/) | **Magentic orchestration** | v1 | Manager สร้าง task ledger, delegate งานให้ specialists แบบ dynamic, ตรวจ progress และ re-plan |

ชื่อ directory `parallel-orchestration` ใช้ตามชื่อที่โครงการนี้เลือก ส่วนคำที่ Microsoft Learn ใช้ในเอกสารปัจจุบันคือ **Concurrent orchestration** ซึ่งหมายถึง pattern เดียวกันในบริบทนี้

Directory สำหรับ pattern อื่นจะเพิ่มที่ระดับเดียวกันในอนาคต เช่น:

```text
parallel-orchestration/     # Concurrent orchestration
sequential-orchestration/   # Sequential pipeline
handoff-orchestration/      # Dynamic transfer of control
group-chat-orchestration/   # Shared collaborative conversation
magentic-orchestration/     # Manager-directed dynamic planning (v1 available)
```

รายละเอียด flow, diagram, benchmark และวิธีใช้งานของชุดปัจจุบันอยู่ที่ [Parallel Orchestration README](parallel-orchestration/README.md)
