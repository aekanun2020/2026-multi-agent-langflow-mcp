import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "../..");
const sourcePath = path.join(
  repoRoot,
  "parallel-orchestration/flows/LAB-1-4-withlocal-concurrent-consensus-v9-canonical-claims-thai.json",
);
const v1Path = path.join(
  repoRoot,
  "magentic-orchestration/flows/LAB-magentic-v1-finance-research-thai.json",
);
const outputDir = path.join(repoRoot, "magentic-orchestration/flows/v2");

const source = JSON.parse(fs.readFileSync(sourcePath, "utf8"));
const v1 = JSON.parse(fs.readFileSync(v1Path, "utf8"));
const clone = (value) => JSON.parse(JSON.stringify(value));
const nodeById = (flow, id) => flow.data.nodes.find((node) => node.id === id);
const edgeBy = (flow, sourceId, targetId) => flow.data.edges.find(
  (edge) => edge.source === sourceId && edge.target === targetId,
);
const decodeHandle = (handle) => JSON.parse(handle.replaceAll("œ", '"'));
const encodeHandle = (handle) => JSON.stringify(handle).replaceAll('"', "œ");
const replaceId = (handle, oldId, newId) => handle.replaceAll(oldId, newId);
const makeEdge = (template, id, sourceId, targetId, sourceHandle, targetHandle) => ({
  ...clone(template),
  id,
  source: sourceId,
  target: targetId,
  sourceHandle,
  targetHandle,
  data: {
    sourceHandle: decodeHandle(sourceHandle),
    targetHandle: decodeHandle(targetHandle),
  },
});

const chatInputTemplate = nodeById(source, "ChatInput-uc7rV");
const chatOutputTemplate = nodeById(source, "ChatOutput-BDIVy");
const mssqlTemplate = nodeById(source, "MCPTools-DfqZq");
const ragTemplate = nodeById(source, "MCP-A5mYz");
const guardTemplate = nodeById(source, "FinalClaimGuard-main");
const chatToAgentTemplate = edgeBy(source, "ChatInput-uc7rV", "Agent-ConsensusWorker1");
const mssqlToAgentTemplate = edgeBy(source, "MCPTools-DfqZq", "Agent-ConsensusWorker1");
const ragToAgentTemplate = edgeBy(source, "MCP-A5mYz", "Agent-ConsensusWorker1");
const agentToGuardTemplate = edgeBy(source, "Agent-ycwYQ", "FinalClaimGuard-main");
const guardToOutputTemplate = edgeBy(source, "FinalClaimGuard-main", "ChatOutput-BDIVy");

if ([
  chatInputTemplate,
  chatOutputTemplate,
  mssqlTemplate,
  ragTemplate,
  guardTemplate,
  chatToAgentTemplate,
  mssqlToAgentTemplate,
  ragToAgentTemplate,
  agentToGuardTemplate,
  guardToOutputTemplate,
].some((item) => !item)) {
  throw new Error("Required v9 templates were not found");
}

const specialistGuardCode = `import json
import re

from lfx.custom.custom_component.component import Component
from lfx.io import MessageTextInput, Output
from lfx.schema.message import Message


class TypedSpecialistResultGuard(Component):
    display_name = "Typed Specialist Result Guard"
    description = "Validate a specialist result contract without adding claims."
    icon = "shield-check"

    inputs = [MessageTextInput(name="specialist_output", display_name="Specialist Output", required=True)]
    outputs = [Output(display_name="Typed Result", name="result", type_=Message, method="guard")]

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
        required = {"task_id", "specialist", "status", "claims", "evidence", "errors"}
        payload = next(
            (item for item in reversed(self._objects(self._text(self.specialist_output))) if required.issubset(item)),
            None,
        )
        if not isinstance(payload, dict):
            payload = {
                "task_id": "unknown",
                "specialist": "unknown",
                "status": "blocked",
                "claims": [],
                "evidence": [],
                "errors": ["invalid_specialist_output"],
            }
        if payload.get("status") not in {"complete", "partial", "blocked"}:
            payload["status"] = "blocked"
        for key in ("claims", "evidence", "errors"):
            if not isinstance(payload.get(key), list):
                payload[key] = []
        if payload["status"] == "complete" and not payload["evidence"]:
            payload["status"] = "blocked"
            payload["claims"] = []
            payload["errors"].append("complete_without_evidence")
        return Message(text=json.dumps(payload, ensure_ascii=False, sort_keys=True))
`;

const configureAgent = (agent, displayName, prompt, position) => {
  agent.data.node.display_name = displayName;
  agent.data.node.description = `Execute only delegated ${displayName} tasks and return typed evidence.`;
  agent.data.node.template.agent_description.value = agent.data.node.description;
  agent.data.node.template.system_prompt.value = prompt;
  agent.data.node.template.input_value.value = "";
  agent.data.node.template.temperature.value = 0.0;
  agent.data.node.template.max_iterations.value = 10;
  agent.data.node.tool_mode = false;
  agent.data.node.selected_output = null;
  agent.position = position;
};

const buildGuard = (id, position) => {
  const guard = clone(guardTemplate);
  guard.id = id;
  guard.data.id = guard.id;
  guard.data.type = "TypedSpecialistResultGuard";
  guard.data.node.display_name = "Typed Specialist Result Guard";
  guard.data.node.description = "Validate specialist JSON and fail closed without evidence.";
  guard.data.node.template.code.value = specialistGuardCode;
  const input = clone(guard.data.node.template.verbalizer_output);
  input.name = "specialist_output";
  input.display_name = "Specialist Output";
  guard.data.node.template = {_type: "Component", code: guard.data.node.template.code, specialist_output: input};
  guard.data.node.outputs[0].display_name = "Typed Result";
  guard.data.node.outputs[0].name = "result";
  guard.data.node.outputs[0].method = "guard";
  guard.position = position;
  return guard;
};

const commonContract = `
รับ task จาก Magentic Manager และทำเฉพาะ task นั้น ห้ามวางแผนแทน Manager
ใช้ tools แบบ read-only เท่านั้น ห้าม external action
ห้ามสร้าง table, column, policy, value หรือ evidence ที่ tool ไม่ได้คืน
ถ้าทำไม่ได้ให้ status=blocked และระบุ error จริง ห้ามเสนอ SQL สมมติ
ตอบ JSON object เดียว ไม่มี Markdown:
{
  "task_id":"ค่าจาก input หรือ unknown",
  "specialist":"sql|rag|verification",
  "status":"complete|partial|blocked",
  "claims":[{"key":"...","value":null,"unit":null,"population":"...","evidence_ids":[]}],
  "evidence":[{"id":"E1","source":"mssql|rag","detail":"tool/query/source result"}],
  "errors":[]
}`;

const specialistDefinitions = [
  {
    key: "sql",
    name: "LAB-magentic-v2-sql-specialist-thai",
    endpoint: "magentic_v2_sql_specialist",
    agentId: "Agent-ConsensusWorker1",
    display: "SQL Specialist",
    prompt: `คุณคือ SQL Specialist ผู้ปฏิบัติงานให้ Magentic Manager
ตรวจ schema ก่อน query และใช้ MSSQL เป็นหลักฐานเดียวสำหรับ factual database claims
สำหรับ Finance/Loan ใช้ loans_fact และ dimension IDs ตาม schema จริงจาก tool
aggregate ต้องระบุ population, filters, grain, formula, unit และ precision
COUNT/SUM ต้อง exact และ int_rate ต้องแปลง fraction เป็น percent อย่างถูกต้อง
${commonContract}`,
    mssql: true,
    rag: false,
  },
  {
    key: "rag",
    name: "LAB-magentic-v2-rag-specialist-thai",
    endpoint: "magentic_v2_rag_specialist",
    agentId: "Agent-ConsensusWorker2",
    display: "RAG Policy Specialist",
    prompt: `คุณคือ RAG Policy Specialist ผู้ปฏิบัติงานให้ Magentic Manager
ค้น policy, definition, threshold และข้อจำกัดจาก RAG เท่านั้น
ทุก policy claim ต้องมี source/chunk evidence ถ้าไม่พบให้ blocked ห้ามใช้ความรู้ทั่วไปแทน
แยก policy จาก recommendation และห้าม query MSSQL
${commonContract}`,
    mssql: false,
    rag: true,
  },
  {
    key: "verification",
    name: "LAB-magentic-v2-verification-specialist-thai",
    endpoint: "magentic_v2_verification_specialist",
    agentId: "Agent-ConsensusWorker3",
    display: "Verification Specialist",
    prompt: `คุณคือ Verification Specialist ผู้ตรวจผลของ SQL/RAG Specialists
รับ candidate claims และ evidence จาก Manager แล้วตรวจซ้ำกับ MSSQL/RAG ตามความจำเป็น
ตรวจ metric, value, unit, population, grain, formula, boundary และ evidence linkage
ห้ามสร้างคำตอบใหม่แทน candidate; rejected claim ต้องไม่อยู่ใน claims ที่คืน
specialist field ต้องเป็น verification
${commonContract}`,
    mssql: true,
    rag: true,
  },
];

const buildSpecialistFlow = (definition) => {
  const flow = clone(source);
  const chatInput = clone(chatInputTemplate);
  const chatOutput = clone(chatOutputTemplate);
  const mssql = clone(mssqlTemplate);
  const rag = clone(ragTemplate);
  const agent = clone(nodeById(source, definition.agentId));
  const guard = buildGuard(`TypedSpecialistResultGuard-${definition.key}`, {x: 1000, y: 360});
  const originalMssqlId = mssql.id;
  const originalRagId = rag.id;
  mssql.id = `MCPTools-${definition.key}-mssql`;
  mssql.data.id = mssql.id;
  rag.id = `MCPTools-${definition.key}-rag`;
  rag.data.id = rag.id;
  configureAgent(agent, definition.display, definition.prompt, {x: 560, y: 360});
  chatInput.position = {x: 80, y: 360};
  chatOutput.position = {x: 1360, y: 360};
  mssql.position = {x: 80, y: 80};
  rag.position = {x: 80, y: 700};

  const nodes = [chatInput, agent, guard, chatOutput];
  if (definition.mssql) nodes.push(mssql);
  if (definition.rag) nodes.push(rag);

  const chatTarget = replaceId(chatToAgentTemplate.targetHandle, "Agent-ConsensusWorker1", agent.id);
  const agentSource = encodeHandle({dataType: "Agent", id: agent.id, name: "response", output_types: ["Message"]});
  const guardTarget = encodeHandle({
    fieldName: "specialist_output",
    id: guard.id,
    inputTypes: ["Message"],
    type: "str",
  });
  const guardSource = encodeHandle({
    dataType: "TypedSpecialistResultGuard",
    id: guard.id,
    name: "result",
    output_types: ["Message"],
  });
  const edges = [
    makeEdge(chatToAgentTemplate, "edge-task-agent", chatInput.id, agent.id, chatToAgentTemplate.sourceHandle, chatTarget),
    makeEdge(agentToGuardTemplate, "edge-agent-guard", agent.id, guard.id, agentSource, guardTarget),
    makeEdge(guardToOutputTemplate, "edge-guard-output", guard.id, chatOutput.id, guardSource, guardToOutputTemplate.targetHandle),
  ];
  if (definition.mssql) {
    edges.push(makeEdge(
      mssqlToAgentTemplate,
      "edge-mssql-agent",
      mssql.id,
      agent.id,
      replaceId(mssqlToAgentTemplate.sourceHandle, originalMssqlId, mssql.id),
      replaceId(mssqlToAgentTemplate.targetHandle, "Agent-ConsensusWorker1", agent.id),
    ));
  }
  if (definition.rag) {
    edges.push(makeEdge(
      ragToAgentTemplate,
      "edge-rag-agent",
      rag.id,
      agent.id,
      replaceId(ragToAgentTemplate.sourceHandle, originalRagId, rag.id),
      replaceId(ragToAgentTemplate.targetHandle, "Agent-ConsensusWorker1", agent.id),
    ));
  }
  flow.name = definition.name;
  flow.description = `${definition.display} subflow for Magentic v2 with typed deterministic result guard.`;
  flow.endpoint_name = definition.endpoint;
  flow.data.nodes = nodes;
  flow.data.edges = edges;
  return flow;
};

const gatewayCode = (className, displayName, endpoint, flowId, methodName) => `import json
import urllib.request
import uuid

from lfx.custom.custom_component.component import Component
from lfx.io import MessageTextInput, Output
from lfx.schema.message import Message


class ${className}(Component):
    display_name = "${displayName}"
    description = "Delegate a typed task to ${endpoint}; this component does not execute the task itself."
    icon = "workflow"

    inputs = [MessageTextInput(name="task", display_name="Delegated Task", required=True, tool_mode=True)]
    outputs = [Output(display_name="Specialist Result", name="result", type_=Message, method="${methodName}", tool_mode=True)]

    def ${methodName}(self) -> Message:
        task_text = self.task.text if hasattr(self.task, "text") else str(self.task or "")
        body = json.dumps({
            "input_value": task_text,
            "input_type": "chat",
            "output_type": "chat",
            "session_id": "magentic-v2-${endpoint}-" + uuid.uuid4().hex[:12],
        }, ensure_ascii=False).encode("utf-8")
        request = urllib.request.Request(
            "http://127.0.0.1:7860/api/v1/run/${flowId}",
            data=body,
            method="POST",
            headers={"Content-Type": "application/json"},
        )
        try:
            with urllib.request.urlopen(request, timeout=240) as response:
                payload = json.load(response)
            text = payload["outputs"][0]["outputs"][0]["results"]["message"]["text"]
            return Message(text=text)
        except Exception as exc:
            return Message(text=json.dumps({
                "task_id": "unknown",
                "specialist": "${endpoint}",
                "status": "blocked",
                "claims": [],
                "evidence": [],
                "errors": [type(exc).__name__ + ": " + str(exc)],
            }, ensure_ascii=False))
`;

const mainOutputGuardCode = `import json
import re

from lfx.custom.custom_component.component import Component
from lfx.io import MessageTextInput, Output
from lfx.schema.message import Message


class MagenticV2OutputGuard(Component):
    display_name = "Deterministic Magentic v2 Output Guard"
    description = "Validate the Manager contract and fail closed without creating or changing claims."
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

    @staticmethod
    def _valid(payload):
        required = {"status", "answer", "task_ledger", "claims", "execution_trace", "uncertainties"}
        if not isinstance(payload, dict) or not required.issubset(payload):
            return False
        if payload.get("status") not in {"complete", "partial", "blocked"}:
            return False
        if not isinstance(payload.get("answer"), str) or not payload["answer"].strip():
            return False
        if payload["answer"] == "คำตอบจาก verified claims" or "|" in payload["status"]:
            return False
        ledger = payload.get("task_ledger")
        if not isinstance(ledger, dict) or ledger.get("objective") in {None, "", "..."}:
            return False
        for key in ("acceptance_criteria", "completed_tasks", "blocked_tasks", "remaining_tasks", "replans"):
            if not isinstance(ledger.get(key), list):
                return False
        for key in ("claims", "execution_trace", "uncertainties"):
            if not isinstance(payload.get(key), list):
                return False
        allowed_specialists = {"sql", "rag", "verification"}
        allowed_results = {"complete", "partial", "blocked"}
        for item in payload["execution_trace"]:
            if not isinstance(item, dict):
                return False
            if item.get("specialist") not in allowed_specialists or item.get("result") not in allowed_results:
                return False
            if item.get("task_id") in {None, "", "...", "unknown"}:
                return False
        if payload["status"] == "complete":
            if not payload["claims"]:
                return False
            if not any(
                item.get("specialist") == "verification" and item.get("result") == "complete"
                for item in payload["execution_trace"]
            ):
                return False
        return True

    def guard(self) -> Message:
        payload = next(
            (item for item in reversed(self._objects(self._text(self.manager_output))) if self._valid(item)),
            None,
        )
        if payload is None:
            payload = {
                "status": "blocked",
                "answer": "Manager ไม่ได้คืน final JSON ที่ผ่าน contract จึงปฏิเสธ output โดยไม่สร้าง claim เพิ่ม",
                "task_ledger": {
                    "objective": "manager_output_contract_validation",
                    "acceptance_criteria": [],
                    "completed_tasks": [],
                    "blocked_tasks": ["invalid_manager_output"],
                    "remaining_tasks": [],
                    "replans": [],
                },
                "claims": [],
                "execution_trace": [],
                "uncertainties": ["Manager output ไม่เป็น JSON contract หรือมี placeholder"],
            }
        return Message(text=json.dumps(payload, ensure_ascii=False, sort_keys=True))
`;

const buildGateway = (template, {id, className, displayName, endpoint, flowId, methodName, x, y}) => {
  const node = clone(template);
  node.id = id;
  node.data.id = id;
  node.data.type = className;
  node.data.node.display_name = displayName;
  node.data.node.description = `Delegate to ${endpoint} without executing specialist work in Manager.`;
  node.data.node.tool_mode = true;
  node.data.node.selected_output = "component_as_tool";
  node.data.node.template.code.value = gatewayCode(className, displayName, endpoint, flowId, methodName);
  const task = clone(node.data.node.template.verbalizer_output);
  task.name = "task";
  task.display_name = "Delegated Task";
  task.tool_mode = true;
  node.data.node.template = {_type: "Component", code: node.data.node.template.code, task};
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
  node.position = {x, y};
  return node;
};

const buildMainFlow = () => {
  const flow = clone(v1);
  const chatInput = nodeById(flow, "ChatInput-uc7rV");
  const chatOutput = nodeById(flow, "ChatOutput-BDIVy");
  const manager = nodeById(flow, "Agent-ycwYQ");
  const outputGuard = nodeById(flow, "MagenticOutputGuard-main");
  const gateways = [
    buildGateway(guardTemplate, {
      id: "SubflowGateway-SQL", className: "SQLSpecialistGateway", displayName: "Delegate to SQL Specialist",
      endpoint: "magentic_v2_sql_specialist", flowId: "9c5b2d4b-4a48-44dd-855a-010183382e65",
      methodName: "run_sql_specialist", x: 120, y: 160,
    }),
    buildGateway(guardTemplate, {
      id: "SubflowGateway-RAG", className: "RAGSpecialistGateway", displayName: "Delegate to RAG Specialist",
      endpoint: "magentic_v2_rag_specialist", flowId: "02249380-50b6-42c2-9c93-94975bf297fb",
      methodName: "run_rag_specialist", x: 120, y: 520,
    }),
    buildGateway(guardTemplate, {
      id: "SubflowGateway-Verification", className: "VerificationSpecialistGateway", displayName: "Delegate to Verification Specialist",
      endpoint: "magentic_v2_verification_specialist", flowId: "927b7571-b037-4bda-8584-bdb90931ffd3",
      methodName: "run_verification_specialist", x: 120, y: 880,
    }),
  ];

  manager.data.node.template.system_prompt.value = `คุณคือ Magentic Manager ผู้บริหารงานเท่านั้น ห้ามทำ specialist task เอง

หน้าที่ที่อนุญาต:
1. สร้าง typed task ledger จาก objective
2. แตกงานและเลือก SQL, RAG หรือ Verification Specialist
3. ใช้เครื่องมือชื่อ run_sql_specialist, run_rag_specialist และ run_verification_specialist เท่านั้น
4. ทุกครั้งที่เรียก tool ค่า task ต้องเป็น JSON object ที่ serialize เป็น string และมี task_id, objective, required_claims, inputs, acceptance_criteria ห้ามส่ง SQL หรือข้อความลอย ๆ เป็น task
5. parse typed specialist result ทุกครั้งแล้วอัปเดต ledger โดยคง task_id เดิม
6. ถ้าผล blocked/conflict ให้ re-plan หรือมอบหมายใหม่
7. ก่อนตอบข้อที่มี factual claims ต้องส่ง candidate claims พร้อม evidence ทั้งหมดให้ Verification Specialist
8. สร้าง final answer จาก claims ที่ Verification Specialist คืน status=complete เท่านั้น

ข้อห้าม:
- ห้าม query MSSQL, ค้น RAG, เขียน SQL หรือคำนวณ business metric เอง
- ห้ามเติม table/column/value/policy ที่ specialist ไม่ได้คืน
- ห้ามเปลี่ยน claim value, unit, population หรือ evidence
- ผล tool ที่ status=blocked ไม่มีสิทธิ์ใช้สร้าง factual answer
- จำกัดไม่เกิน 10 delegated calls

ข้อกำหนดคำตอบสุดท้าย:
- ต้องคืน JSON object เดียวเท่านั้น ห้ามมี Markdown ข้อความเกริ่น หรือข้อความตามหลัง
- root fields ต้องมี status, answer, task_ledger, claims, execution_trace, uncertainties
- status ต้องเป็นค่าเดียวจาก complete, partial, blocked
- task_ledger ต้องมี objective, acceptance_criteria, completed_tasks, blocked_tasks, remaining_tasks, replans
- acceptance_criteria, completed_tasks, blocked_tasks, remaining_tasks, replans ต้องเป็น JSON array เสมอ แม้มีเพียงหนึ่งรายการ
- execution_trace แต่ละรายการต้องมี step, specialist, task_id, result โดย specialist เป็นค่าเดียวจาก sql, rag, verification และ result เป็นค่าเดียวจาก complete, partial, blocked
- ห้ามใช้ placeholder, เครื่องหมายจุดสามจุด, unknown หรือข้อความที่มีตัวเลือกคั่นด้วยเครื่องหมาย |
- หาก status=complete ต้องมี claims อย่างน้อยหนึ่งรายการ และ execution_trace ต้องมี verification ที่ result=complete
- ก่อนจบให้ตรวจ syntax ด้วยตนเองว่า parse เป็น JSON ได้จริง`;
  manager.data.node.template.temperature.value = 0.0;
  manager.data.node.template.max_iterations.value = 16;
  outputGuard.data.node.template.code.value = mainOutputGuardCode;
  outputGuard.data.node.type = "MagenticV2OutputGuard";
  outputGuard.data.type = "MagenticV2OutputGuard";
  manager.position = {x: 850, y: 520};
  chatInput.position = {x: 480, y: 520};
  outputGuard.position = {x: 1240, y: 520};
  chatOutput.position = {x: 1600, y: 520};

  const chatToManager = v1.data.edges.find((edge) => edge.source === chatInput.id && edge.target === manager.id);
  const managerToGuard = v1.data.edges.find((edge) => edge.source === manager.id && edge.target === outputGuard.id);
  const guardToOutput = v1.data.edges.find((edge) => edge.source === outputGuard.id && edge.target === chatOutput.id);
  if ([chatToManager, managerToGuard, guardToOutput].some((edge) => !edge)) {
    throw new Error("Required v1 Manager edges were not found");
  }
  const managerToolsHandle = encodeHandle({
    fieldName: "tools", id: manager.id, inputTypes: ["Tool"], type: "other",
  });
  const toolEdges = gateways.map((gateway) => makeEdge(
    managerToGuard,
    `edge-${gateway.id}-manager`,
    gateway.id,
    manager.id,
    encodeHandle({dataType: gateway.data.type, id: gateway.id, name: "component_as_tool", output_types: ["Tool"]}),
    managerToolsHandle,
  ));

  flow.name = "LAB-magentic-v2-subflow-specialists-thai";
  flow.description = "Magentic Manager delegates typed tasks to independent SQL, RAG, and Verification subflows; Manager has no MCP access.";
  flow.endpoint_name = "magentic_v2_manager";
  flow.data.nodes = [chatInput, chatOutput, manager, outputGuard, ...gateways];
  flow.data.edges = [chatToManager, ...toolEdges, managerToGuard, guardToOutput];
  return flow;
};

fs.mkdirSync(outputDir, {recursive: true});
for (const definition of specialistDefinitions) {
  const outputPath = path.join(outputDir, `${definition.name}.json`);
  fs.writeFileSync(outputPath, `${JSON.stringify(buildSpecialistFlow(definition), null, 2)}\n`);
  console.log(`Wrote ${outputPath}`);
}
const mainPath = path.join(outputDir, "LAB-magentic-v2-subflow-specialists-thai.json");
fs.writeFileSync(mainPath, `${JSON.stringify(buildMainFlow(), null, 2)}\n`);
console.log(`Wrote ${mainPath}`);
