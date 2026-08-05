import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..", "..");
const sourcePath = path.join(root, "parallel-orchestration", "flows", "LAB-1-4-withlocal-concurrent-consensus-v6-thai.json");
const outputDir = path.join(root, "parallel-orchestration", "flows", "paper-exact");
const outputPath = path.join(outputDir, "LAB-concurrent-v4-paper-exact-thai.json");
const flow = JSON.parse(fs.readFileSync(sourcePath, "utf8"));
const clone = (value) => structuredClone(value);
const node = (id) => {
  const found = flow.data.nodes.find((item) => item.id === id);
  if (!found) throw new Error(`Missing node ${id}`);
  return found;
};

const workers = [1, 2, 3].map((number) => node(`Agent-ConsensusWorker${number}`));
const collector = node("ConsensusVoteAggregator-main");
const consensus = node("Agent-ycwYQ");

flow.name = "LAB-concurrent-v4-paper-exact-thai";
flow.description = "Paper-exact concurrent orchestration: three natural-language workers followed by semantic LLM consensus; no JSON contract, parser, verifier, vote code, or guard.";
flow.endpoint_name = "concurrent_v4_paper_exact";

const workerPrompt = `คุณคือ Independent Worker หนึ่งในสามตัวที่ทำงานพร้อมกัน

ตอบคำถามของผู้ใช้ให้ดีที่สุดด้วยตัวคุณเองโดยใช้ MSSQL และ RAG tools แบบ read-only ตามความจำเป็น

แนวทาง:
- วิเคราะห์และตอบคำถามให้ครบ
- ตรวจข้อมูล สูตร หน่วย ขอบเขต และข้อจำกัดทางธุรกิจจากหลักฐานที่ค้นได้
- หากหลักฐานไม่พอ ให้บอกอย่างตรงไปตรงมา
- ใช้ภาษาไทยเป็นหลัก
- ตอบเป็นภาษาธรรมชาติในรูปแบบที่เหมาะกับคำถาม
- ส่งเฉพาะคำตอบสำหรับผู้ใช้ ห้ามแสดง Thinking Process การคิดทีละขั้น หรือข้อความในแท็ก think

ไม่มี schema หรือรูปแบบบังคับ ไม่ต้องคืน JSON ไม่ต้องสร้าง key/value/claims/evidence_ids และไม่ต้องลงคะแนนกับ Worker อื่น`;

workers.forEach((worker, index) => {
  worker.data.node.display_name = `Paper Worker ${index + 1}`;
  worker.data.node.description = "Independent natural-language answer using the same question and tools.";
  worker.data.node.template.system_prompt.value = workerPrompt;
  worker.data.node.template.temperature.value = 0.1;
  if (worker.data.node.template.seed) worker.data.node.template.seed.value = [101, 202, 303][index];
  if (worker.data.node.template.add_current_date_tool) worker.data.node.template.add_current_date_tool.value = false;
});

const collectorCode = `from lfx.custom.custom_component.component import Component
from lfx.io import MessageTextInput, Output
from lfx.schema.message import Message


class RawAnswerCollector(Component):
    display_name = "Raw Answer Collector"
    description = "Transport the original request and three raw natural-language answers without parsing or judging them."
    icon = "messages-square"

    inputs = [
        MessageTextInput(name="original_request", display_name="Original Request", required=True),
        MessageTextInput(name="candidate_1", display_name="Worker Answer 1", required=True),
        MessageTextInput(name="candidate_2", display_name="Worker Answer 2", required=True),
        MessageTextInput(name="candidate_3", display_name="Worker Answer 3", required=True),
    ]
    outputs = [Output(display_name="Raw Answer Bundle", name="result", type_=Message, method="collect")]

    @staticmethod
    def _text(value):
        return value.text if hasattr(value, "text") else str(value or "")

    def collect(self) -> Message:
        sections = [
            "ORIGINAL REQUEST:\\n" + self._text(self.original_request),
            "WORKER 1 ANSWER:\\n" + self._text(self.candidate_1),
            "WORKER 2 ANSWER:\\n" + self._text(self.candidate_2),
            "WORKER 3 ANSWER:\\n" + self._text(self.candidate_3),
        ]
        return Message(text="\\n\\n===== NEXT RAW SECTION =====\\n\\n".join(sections))
`;

const oldTemplate = collector.data.node.template;
const renamedInput = (source, name, displayName) => {
  const item = clone(oldTemplate[source]);
  item.name = name;
  item.display_name = displayName;
  return item;
};
collector.data.type = "RawAnswerCollector";
collector.data.node.type = "RawAnswerCollector";
collector.data.node.display_name = "Raw Answer Collector";
collector.data.node.description = "Concatenate raw natural-language answers without parsing, voting, or validation.";
collector.data.node.field_order = ["original_request", "candidate_1", "candidate_2", "candidate_3", "code"];
collector.data.node.template = {
  _type: "Component",
  code: {...clone(oldTemplate.code), value: collectorCode},
  original_request: clone(oldTemplate.original_request),
  candidate_1: renamedInput("vote_1", "candidate_1", "Worker Answer 1"),
  candidate_2: renamedInput("vote_2", "candidate_2", "Worker Answer 2"),
  candidate_3: renamedInput("vote_3", "candidate_3", "Worker Answer 3"),
};
collector.data.node.outputs = [{
  allows_loop: false, cache: true, display_name: "Raw Answer Bundle", group_outputs: false,
  hidden: null, loop_types: null, method: "collect", name: "result", options: null,
  required_inputs: null, selected: "Message", tool_mode: true, types: ["Message"], value: "__UNDEFINED__",
}];

consensus.data.node.display_name = "Semantic Consensus Agent";
consensus.data.node.description = "Read the original request and all three raw answers, then produce the final natural-language answer.";
consensus.data.node.template.system_prompt.value = `คุณคือ Semantic Consensus Agent ขั้นสุดท้าย

Input มีคำถามต้นฉบับและคำตอบภาษาธรรมชาติดิบจาก Workers สามตัว

หน้าที่:
1. อ่านคำตอบทั้งสามโดยพิจารณาความหมายทั้งหมด ไม่ parse JSON และไม่ตัดสินจาก key/value
2. หาส่วนที่เห็นสอดคล้องกันในเชิงความหมาย
3. เมื่อคำตอบขัดแย้ง ให้พิจารณาหลักฐาน การคำนวณ เหตุผล และความสอดคล้องกับคำถาม ไม่เลือกเพราะรูปแบบหรือความมั่นใจที่ Worker กล่าวเอง
4. สร้างคำตอบสุดท้ายที่ตอบคำถามต้นฉบับโดยตรง เป็นภาษาไทยเป็นหลัก
5. ถ้ายังตัดสินข้อสำคัญไม่ได้ ให้ระบุความไม่แน่นอนอย่างตรงไปตรงมา
6. ห้ามเรียก tools หรือดำเนินการภายนอก เพราะหน้าที่คืออ่านและสรุปคำตอบที่ได้รับเท่านั้น

ไม่มี schema หรือรูปแบบบังคับ ตอบเป็นภาษาธรรมชาติ ส่งออกเฉพาะคำตอบสุดท้ายสำหรับผู้ใช้ ห้ามแสดง Thinking Process การคิดทีละขั้น ข้อความในแท็ก think คะแนนโหวต contract ledger trace หรือกระบวนการภายใน`;
consensus.data.node.template.temperature.value = 0;
if (consensus.data.node.template.model_kwargs) {
  consensus.data.node.template.model_kwargs.value = {extra_body: {reasoning: {enabled: false}}};
}
if (consensus.data.node.template.add_current_date_tool) consensus.data.node.template.add_current_date_tool.value = false;

flow.data.edges.forEach((edge) => {
  if (edge.target === collector.id) {
    edge.targetHandle = edge.targetHandle.replaceAll("vote_1", "candidate_1").replaceAll("vote_2", "candidate_2").replaceAll("vote_3", "candidate_3");
    const field = edge.data?.targetHandle?.fieldName;
    if (field === "vote_1") edge.data.targetHandle.fieldName = "candidate_1";
    if (field === "vote_2") edge.data.targetHandle.fieldName = "candidate_2";
    if (field === "vote_3") edge.data.targetHandle.fieldName = "candidate_3";
    edge.id = edge.id.replaceAll("vote_1", "candidate_1").replaceAll("vote_2", "candidate_2").replaceAll("vote_3", "candidate_3");
  }
  if (edge.source === collector.id) {
    edge.data.sourceHandle.dataType = "RawAnswerCollector";
    edge.sourceHandle = edge.sourceHandle.replace("dataTypeœ:œConsensusVoteAggregatorœ", "dataTypeœ:œRawAnswerCollectorœ");
  }
});

fs.mkdirSync(outputDir, {recursive: true});
fs.writeFileSync(outputPath, JSON.stringify(flow, null, 2) + "\n");
console.log(`Wrote ${outputPath}`);
