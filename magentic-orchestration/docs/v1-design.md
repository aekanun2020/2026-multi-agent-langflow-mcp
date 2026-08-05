# v1 design notes

## Pattern contract

v1 ต้องมีพฤติกรรมต่อไปนี้จึงถือเป็น Magentic implementation:

1. Manager สร้าง task ledger จาก objective ที่ยังไม่มี solution path ตายตัว
2. Manager เลือก specialist และลำดับการเรียกตามสถานะ ledger
3. ผลจาก specialist เปลี่ยน remaining tasks และอาจทำให้เกิด re-plan
4. Manager ตรวจ goal/acceptance criteria หลังแต่ละรอบ
5. Final output เปิดเผย ledger, execution trace, evidence และ blockers

การมีหลาย Agents เพียงอย่างเดียวไม่เพียงพอ และการเรียก Agents ทุกตัวพร้อมกันแล้ว vote ยังคงเป็น Concurrent orchestration

## Langflow mapping

- `Magentic Manager`: Agent component ที่รับ user objective และเรียก specialist Agents ใน tool mode
- `SQL Data Specialist`: เข้าถึง `local-mcp-mssql`
- `RAG Policy Specialist`: เข้าถึง `vpn-rag`
- `Evidence Verification Specialist`: เข้าถึง MCP ทั้งสองชุดเพื่อตรวจอิสระ
- Manager ไม่มี direct MCP edge จึงต้อง delegate และ trace ได้ว่า specialist ใดทำงาน
- `Deterministic Magentic Output Guard`: เลือก JSON object สุดท้าย ตรวจ required fields และปฏิเสธ output ที่ผิด contract โดยไม่เพิ่ม factual claim

## Known limitation

Task ledger อยู่ใน Manager context และถูกเปิดเผยใน final JSON แต่ยังไม่มี durable checkpoint component ระหว่าง tool calls หาก process ล้มกลางทางต้องเริ่ม run ใหม่ v2 ควรเพิ่ม persisted ledger, resume semantics และ human approval ก่อน action tools
