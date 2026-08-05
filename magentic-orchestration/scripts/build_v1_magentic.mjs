import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const sourcePath = process.argv[2] ?? path.resolve(
  scriptDir,
  "../../parallel-orchestration/flows/LAB-1-4-withlocal-concurrent-consensus-v9-canonical-claims-thai.json",
);
const outputPath = process.argv[3] ?? path.resolve(
  scriptDir,
  "../flows/LAB-magentic-v1-finance-research-thai.json",
);

const flow = JSON.parse(fs.readFileSync(sourcePath, "utf8"));
const nodeById = (id) => flow.data.nodes.find((node) => node.id === id);
const edgeBy = (source, target) => flow.data.edges.find(
  (edge) => edge.source === source && edge.target === target,
);
const clone = (value) => JSON.parse(JSON.stringify(value));

const chatInput = nodeById("ChatInput-uc7rV");
const chatOutput = nodeById("ChatOutput-BDIVy");
const mssql = nodeById("MCPTools-DfqZq");
const rag = nodeById("MCP-A5mYz");
const specialists = [1, 2, 3].map((number) => nodeById(`Agent-ConsensusWorker${number}`));
const manager = nodeById("Agent-ycwYQ");
const outputGuard = clone(nodeById("FinalClaimGuard-main"));

if ([chatInput, chatOutput, mssql, rag, manager, outputGuard, ...specialists].some((node) => !node)) {
  throw new Error("Required source nodes were not found in the v9 flow");
}

const setAgent = (node, displayName, description, prompt, position) => {
  node.data.node.display_name = displayName;
  node.data.node.description = description;
  node.data.node.template.agent_description.value = description;
  node.data.node.template.system_prompt.value = prompt;
  node.data.node.template.input_value.value = "";
  node.data.node.template.temperature.value = 0.1;
  node.position = position;
};

const enableAgentAsTool = (node) => {
  node.data.node.tool_mode = true;
  node.data.node.selected_output = "component_as_tool";
  node.data.node.outputs = [{
    allows_loop: false,
    cache: true,
    display_name: "Toolset",
    group_outputs: false,
    hidden: null,
    loop_types: null,
    method: "to_toolkit",
    name: "component_as_tool",
    options: null,
    required_inputs: null,
    selected: "Tool",
    tool_mode: true,
    types: ["Tool"],
    value: "__UNDEFINED__",
  }];
};

flow.name = "LAB-magentic-v1-finance-research-thai";
flow.description = "Magentic manager dynamically plans, delegates to finance specialists, tracks a task ledger, verifies progress, and replans before answering in Thai.";

setAgent(
  specialists[0],
  "SQL Data Specialist",
  "ตรวจ schema และตอบงานข้อมูล MSSQL แบบ read-only พร้อม SQL evidence ที่ทำซ้ำได้",
  `คุณคือ SQL Data Specialist ที่ Magentic Manager เรียกใช้เป็นเครื่องมือ

หน้าที่:
- วิเคราะห์ schema และ query MSSQL แบบ read-only เพื่อหาข้อเท็จจริงที่ Manager ร้องขอ
- ใช้ COUNT_BIG และ DECIMAL precision ที่เหมาะสมสำหรับ aggregate
- ระบุ population, filters, grain, numerator, denominator, unit และช่วงเวลา
- ตรวจ NULL, duplicate, sentinel และ outlier เมื่อเกี่ยวข้อง
- ห้าม INSERT, UPDATE, DELETE, DDL หรือ external action ทุกชนิด
- ห้ามตอบนอกขอบเขต subtask และห้ามสร้าง policy เอง

ตอบภาษาไทยเป็น JSON เท่านั้น:
{"subtask":"...","status":"complete|partial|blocked","findings":[{"claim":"...","value":null,"unit":null,"evidence":"SQL/query result"}],"queries":["..."],"data_quality":[],"open_questions":[]}`,
  { x: 80, y: 160 },
);

setAgent(
  specialists[1],
  "RAG Policy Specialist",
  "ค้น policy และนิยามจาก RAG แบบ read-only พร้อม source evidence และข้อจำกัด",
  `คุณคือ RAG Policy Specialist ที่ Magentic Manager เรียกใช้เป็นเครื่องมือ

หน้าที่:
- ค้นนิยาม business rule, policy, threshold และข้อจำกัดจาก RAG ตาม subtask
- แยก policy fact ออกจากคำแนะนำและสมมติฐาน
- อ้าง source/document/chunk ที่ tool ส่งกลับเมื่อมี
- ถ้าไม่พบหลักฐานให้ status=blocked หรือ partial ห้ามเดา
- ใช้เครื่องมือแบบ read-only เท่านั้น ห้ามเพิ่มเอกสารหรือ external action

ตอบภาษาไทยเป็น JSON เท่านั้น:
{"subtask":"...","status":"complete|partial|blocked","policy_findings":[{"claim":"...","evidence":"source/chunk"}],"conflicts":[],"open_questions":[]}`,
  { x: 80, y: 520 },
);

setAgent(
  specialists[2],
  "Evidence Verification Specialist",
  "ตรวจความสอดคล้องของ SQL, RAG, สูตร หน่วย และ claims พร้อมชี้สิ่งที่ต้องค้นเพิ่ม",
  `คุณคือ Evidence Verification Specialist ที่ Magentic Manager เรียกใช้เป็นเครื่องมือ

รับ candidate findings หรือประเด็นที่ต้องตรวจ แล้วทำ independent verification โดยใช้ MSSQL และ RAG แบบ read-only

ตรวจอย่างน้อย:
- claim ตอบโจทย์จริงหรือไม่ และ population/grain ตรงกันหรือไม่
- ตัวเลข สูตร denominator หน่วย เปอร์เซ็นต์ และช่วงเวลาถูกต้องหรือไม่
- policy มีหลักฐาน RAG หรือเป็นเพียง assumption
- มี claim ใดขัดกัน ขาด evidence หรือควรส่งกลับไป re-plan
- ห้ามแก้ข้อมูลหรือทำ external action

ตอบภาษาไทยเป็น JSON เท่านั้น:
{"subtask":"...","status":"verified|needs_rework|blocked","verified_claims":[],"rejected_claims":[],"missing_evidence":[],"recommended_next_tasks":[]}`,
  { x: 80, y: 880 },
);
specialists.forEach(enableAgentAsTool);

setAgent(
  manager,
  "Magentic Manager",
  "สร้างและปรับ task ledger เลือก specialist แบบ dynamic ประเมิน progress และ re-plan จนได้คำตอบที่มีหลักฐาน",
  `คุณคือ Magentic Manager สำหรับงานวิเคราะห์ Finance/Loan แบบ open-ended

คุณไม่ได้ทำ parallel vote และห้ามเรียก specialist ทุกตัวโดยอัตโนมัติ จงเลือกผู้เชี่ยวชาญตาม task ledger และสถานะจริงของงาน

วงรอบการทำงานภายใน:
1. สร้าง TASK LEDGER เริ่มต้น: objective, known_facts, assumptions, unknowns, tasks, acceptance_criteria
2. เลือก task ที่ยังไม่เสร็จและ specialist ที่เหมาะที่สุด แล้วเรียก tool พร้อม subtask ที่เจาะจง
3. หลังทุกผลลัพธ์ ให้อัปเดต ledger: evidence, completed_tasks, blocked_tasks, remaining_tasks
4. ประเมิน progress เทียบ acceptance criteria ห้ามถือว่า tool call สำเร็จเท่ากับ goal สำเร็จ
5. ถ้าหลักฐานขัดกันหรือ progress หยุด ให้ re-plan, แยก task ใหม่ หรือเรียก Verification Specialist
6. จบเมื่อ acceptance criteria ครบ หรือเมื่อยืนยันอย่างมีหลักฐานว่า blocked

ข้อควบคุม:
- ใช้ specialist tools เท่านั้นและเป็น read-only ห้าม external action
- ห้ามสร้างตัวเลข, policy, source หรือผล tool ที่ไม่มีจริง
- แยก SQL facts, RAG policy, user assumptions และ derived calculations
- จำกัดไม่เกิน 10 specialist calls; ถ้ายังไม่จบให้ตอบ partial พร้อม blocker
- ก่อน final ต้องเรียก Evidence Verification Specialist อย่างน้อยหนึ่งครั้งเมื่อคำตอบมีตัวเลขหรือ policy
- ตอบภาษาไทยเป็นหลัก

Final output ต้องเป็น JSON object เดียว ไม่มี Markdown:
{
  "status":"complete|partial|blocked",
  "answer":"คำตอบสุดท้ายที่ตอบผู้ใช้โดยตรง",
  "task_ledger":{
    "objective":"...",
    "acceptance_criteria":[],
    "completed_tasks":[],
    "blocked_tasks":[],
    "remaining_tasks":[],
    "replans":[]
  },
  "claims":[{"claim":"...","value":null,"unit":null,"evidence":[]}],
  "execution_trace":[{"step":1,"specialist":"...","purpose":"...","result":"..."}],
  "uncertainties":[]
}`,
  { x: 860, y: 500 },
);
manager.data.node.template.max_iterations.value = 14;
outputGuard.id = "MagenticOutputGuard-main";
outputGuard.data.id = "MagenticOutputGuard-main";
outputGuard.data.type = "MagenticOutputGuard";
outputGuard.data.node.display_name = "Deterministic Magentic Output Guard";
outputGuard.data.node.description = "Extract and validate only the final Magentic JSON object without adding claims.";
outputGuard.data.node.template.code.value = `import json
import re

from lfx.custom.custom_component.component import Component
from lfx.io import MessageTextInput, Output
from lfx.schema.message import Message


class MagenticOutputGuard(Component):
    display_name = "Deterministic Magentic Output Guard"
    description = "Extract and validate only the final Magentic JSON object without adding claims."
    icon = "shield-check"

    inputs = [MessageTextInput(name="manager_output", display_name="Manager Output", required=True)]
    outputs = [Output(display_name="Validated Final JSON", name="result", type_=Message, method="guard")]

    @staticmethod
    def _text(value):
        return value.text if hasattr(value, "text") else str(value or "")

    @staticmethod
    def _objects(text):
        decoder = json.JSONDecoder()
        found = []
        for match in re.finditer(r"\\{", text):
            try:
                value, _ = decoder.raw_decode(text[match.start():])
                if isinstance(value, dict):
                    found.append(value)
            except json.JSONDecodeError:
                pass
        return found

    def guard(self) -> Message:
        required = {"status", "answer", "task_ledger", "claims", "execution_trace", "uncertainties"}
        payload = next(
            (item for item in reversed(self._objects(self._text(self.manager_output))) if required.issubset(item)),
            None,
        )
        if not isinstance(payload, dict) or not required.issubset(payload):
            payload = {
                "status": "blocked",
                "answer": "Manager ไม่ได้คืน final JSON ตาม contract จึงปฏิเสธ output เพื่อป้องกัน claim ที่ตรวจสอบไม่ได้",
                "task_ledger": {
                    "objective": "ไม่สามารถอ่าน objective จาก output ที่ผิด contract",
                    "acceptance_criteria": [],
                    "completed_tasks": [],
                    "blocked_tasks": ["invalid_manager_output"],
                    "remaining_tasks": [],
                    "replans": [],
                },
                "claims": [],
                "execution_trace": [],
                "uncertainties": ["raw manager output ถูก deterministic guard ปฏิเสธ"],
            }
        if payload.get("status") not in {"complete", "partial", "blocked"}:
            payload["status"] = "blocked"
        for key in ("claims", "execution_trace", "uncertainties"):
            if not isinstance(payload.get(key), list):
                payload[key] = []
        return Message(text=json.dumps(payload, ensure_ascii=False, sort_keys=True))
`;
const managerOutputInput = clone(outputGuard.data.node.template.verbalizer_output);
managerOutputInput.name = "manager_output";
managerOutputInput.display_name = "Manager Output";
outputGuard.data.node.template = {
  _type: "Component",
  code: outputGuard.data.node.template.code,
  manager_output: managerOutputInput,
};
outputGuard.data.node.outputs[0].display_name = "Validated Final JSON";
outputGuard.data.node.outputs[0].name = "result";
outputGuard.data.node.outputs[0].method = "guard";
outputGuard.position = { x: 1250, y: 500 };
chatInput.position = { x: 480, y: 520 };
chatOutput.position = { x: 1620, y: 520 };
mssql.position = { x: -360, y: 260 };
rag.position = { x: -360, y: 700 };

const chatToWorker = edgeBy("ChatInput-uc7rV", "Agent-ConsensusWorker1");
const mssqlToWorker1 = edgeBy("MCPTools-DfqZq", "Agent-ConsensusWorker1");
const ragToWorker1 = edgeBy("MCP-A5mYz", "Agent-ConsensusWorker1");
const workerToAggregator = edgeBy("Agent-ConsensusWorker1", "ConsensusVoteAggregator-main");
const managerToGuard = edgeBy("Agent-ycwYQ", "FinalClaimGuard-main");
const guardToOutput = edgeBy("FinalClaimGuard-main", "ChatOutput-BDIVy");

if ([chatToWorker, mssqlToWorker1, ragToWorker1, workerToAggregator, managerToGuard, guardToOutput].some((edge) => !edge)) {
  throw new Error("Required source edges were not found in the v9 flow");
}

const replaceId = (handle, oldId, newId) => handle.replaceAll(oldId, newId);
const decodeHandle = (handle) => JSON.parse(handle.replaceAll("œ", '"'));
const encodeHandle = (handle) => JSON.stringify(handle).replaceAll('"', "œ");
const makeEdge = (template, id, source, target, sourceHandle, targetHandle) => ({
  ...clone(template),
  id,
  source,
  target,
  sourceHandle,
  targetHandle,
  data: {
    sourceHandle: decodeHandle(sourceHandle),
    targetHandle: decodeHandle(targetHandle),
  },
});

const edges = [];
edges.push(makeEdge(
  chatToWorker,
  "edge-chat-manager",
  chatInput.id,
  manager.id,
  chatToWorker.sourceHandle,
  replaceId(chatToWorker.targetHandle, specialists[0].id, manager.id),
));

const connectMcp = (mcpNode, specialist, template, suffix) => edges.push(makeEdge(
  template,
  `edge-${suffix}-${specialist.id}`,
  mcpNode.id,
  specialist.id,
  template.sourceHandle,
  replaceId(template.targetHandle, specialists[0].id, specialist.id),
));
connectMcp(mssql, specialists[0], mssqlToWorker1, "mssql");
connectMcp(rag, specialists[1], ragToWorker1, "rag");
connectMcp(mssql, specialists[2], mssqlToWorker1, "mssql");
connectMcp(rag, specialists[2], ragToWorker1, "rag");

for (const specialist of specialists) {
  const specialistToolHandle = encodeHandle({
    dataType: "Agent",
    id: specialist.id,
    name: "component_as_tool",
    output_types: ["Tool"],
  });
  edges.push(makeEdge(
    workerToAggregator,
    `edge-tool-${specialist.id}-manager`,
    specialist.id,
    manager.id,
    specialistToolHandle,
    replaceId(mssqlToWorker1.targetHandle, specialists[0].id, manager.id),
  ));
}

const managerToGuardHandle = replaceId(managerToGuard.targetHandle, "FinalClaimGuard-main", outputGuard.id)
  .replaceAll("verbalizer_output", "manager_output");
edges.push(makeEdge(
  managerToGuard,
  "edge-manager-guard",
  manager.id,
  outputGuard.id,
  managerToGuard.sourceHandle,
  managerToGuardHandle,
));
const guardSourceHandle = replaceId(guardToOutput.sourceHandle, "FinalClaimGuard-main", outputGuard.id)
  .replaceAll("FinalClaimGuard", "MagenticOutputGuard");
edges.push(makeEdge(
  guardToOutput,
  "edge-guard-output",
  outputGuard.id,
  chatOutput.id,
  guardSourceHandle,
  guardToOutput.targetHandle,
));

flow.data.nodes = [chatInput, chatOutput, mssql, rag, ...specialists, manager, outputGuard];
flow.data.edges = edges;
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(flow, null, 2)}\n`);
console.log(`Wrote ${outputPath}`);
