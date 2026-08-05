import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..", "..");
const sourcePath = path.join(root, "parallel-orchestration", "flows", "paper-exact", "LAB-concurrent-v4-paper-exact-thai.json");
const outputDir = path.join(root, "hybrid-orchestration", "flows");
const outputPath = path.join(outputDir, "LAB-hybrid-v1-grounded-consensus-thai.json");
const flow = JSON.parse(fs.readFileSync(sourcePath, "utf8"));
const clone = (value) => structuredClone(value);
const findNode = (id) => flow.data.nodes.find((item) => item.id === id);
const encoded = (value) => JSON.stringify(value).replaceAll('"', "œ");

flow.name = "LAB-hybrid-v1-grounded-consensus-thai";
flow.description = "Hybrid of semantic concurrent consensus and evidence verification: no JSON output contract, key parser, or fail-closed guard.";
// Distribution files must not carry the source flow identity. Langflow assigns
// a fresh ID/endpoint on every UI upload, allowing the same JSON to be imported repeatedly.
delete flow.id;
delete flow.endpoint_name;

const chatInput = findNode("ChatInput-uc7rV");
const chatOutput = findNode("ChatOutput-BDIVy");
const mssql = findNode("MCPTools-DfqZq");
const rag = findNode("MCP-A5mYz");
const consensus = findNode("Agent-ycwYQ");
const collector = findNode("ConsensusVoteAggregator-main");

const configureAgentBudget = (agent) => {
  if (agent.data.node.template.max_tokens) agent.data.node.template.max_tokens.value = 8192;
  if (agent.data.node.template.max_output_tokens) agent.data.node.template.max_output_tokens.value = 8192;
};

const workerIds = ["Agent-ConsensusWorker1", "Agent-ConsensusWorker2", "Agent-ConsensusWorker3"];
for (const workerId of workerIds) {
  const worker = findNode(workerId);
  configureAgentBudget(worker);
  worker.data.node.template.system_prompt.value += `

ข้อกำหนดความแม่นยำของหลักฐาน:
- คำตอบที่มี count, total, average หรือ rate ต้อง query MSSQL จริง ห้ามอนุมานจากความเห็นของ Agent อื่น
- count และ total ต้องรักษาค่า exact ห้ามปัด หากผลแสดง scientific notation ให้ query ซ้ำด้วย CONVERT(varchar(40), CAST(expression AS decimal(38,2)))
- ห้ามเติมสกุลเงินหรือ metadata ที่ไม่ปรากฏในหลักฐาน`;
}
const toolPairs = workerIds.map((workerId, index) => {
  const sql = index === 0 ? mssql : clone(mssql);
  const docs = index === 0 ? rag : clone(rag);
  sql.id = `MCPTools-SQL-Worker${index + 1}`;
  docs.id = `MCP-RAG-Worker${index + 1}`;
  sql.data.node.display_name = `MSSQL MCP — Worker ${index + 1}`;
  docs.data.node.display_name = `RAG MCP — Worker ${index + 1}`;
  sql.position = {x: -350, y: 20 + index * 330};
  docs.position = {x: -350, y: 165 + index * 330};
  return {workerId, sql, docs};
});
mssql.id = toolPairs[0].sql.id;
rag.id = toolPairs[0].docs.id;
flow.data.nodes.push(...toolPairs.slice(1).flatMap(({sql, docs}) => [sql, docs]));

const verifierSql = clone(mssql);
const verifierRag = clone(rag);
verifierSql.id = "MCPTools-SQL-Verifier";
verifierRag.id = "MCP-RAG-Verifier";
verifierSql.data.node.display_name = "MSSQL MCP — Verifier";
verifierRag.data.node.display_name = "RAG MCP — Verifier";
verifierSql.position = {x: 1800, y: 120};
verifierRag.position = {x: 1800, y: 820};
flow.data.nodes.push(verifierSql, verifierRag);

chatOutput.position = {x: 2250, y: 470};

const bundleCode = `from lfx.custom.custom_component.component import Component
from lfx.io import MessageTextInput, Output
from lfx.schema.message import Message


class DraftReviewBundle(Component):
    display_name = "Draft Review Bundle"
    description = "Transport the original request and semantic consensus draft without parsing or judging either text."
    icon = "messages-square"

    inputs = [
        MessageTextInput(name="original_request", display_name="Original Request", required=True),
        MessageTextInput(name="draft_answer", display_name="Consensus Draft", required=True),
        MessageTextInput(name="raw_answers", display_name="Raw Worker Answers", required=False),
    ]
    outputs = [Output(display_name="Review Bundle", name="result", type_=Message, method="collect")]

    @staticmethod
    def _text(value):
        return value.text if hasattr(value, "text") else str(value or "")

    def collect(self) -> Message:
        return Message(
            text=(
                "ORIGINAL REQUEST:\\n" + self._text(self.original_request)
                + "\\n\\n===== SEMANTIC CONSENSUS DRAFT =====\\n\\n"
                + self._text(self.draft_answer)
                + "\\n\\n===== RAW WORKER ANSWERS =====\\n\\n"
                + self._text(self.raw_answers)
            )
        )
`;

const reviewBundle = clone(collector);
reviewBundle.id = "DraftReviewBundle-main";
reviewBundle.position = {x: 1550, y: 470};
reviewBundle.data.type = "DraftReviewBundle";
reviewBundle.data.node.type = "DraftReviewBundle";
reviewBundle.data.node.display_name = "Draft Review Bundle";
reviewBundle.data.node.description = "Transport original request and draft without parsing, validation, or rejection.";
const old = reviewBundle.data.node.template;
const originalRequest = clone(old.original_request);
const draftAnswer = clone(old.candidate_1);
draftAnswer.name = "draft_answer";
draftAnswer.display_name = "Consensus Draft";
const rawAnswers = clone(old.candidate_2);
rawAnswers.name = "raw_answers";
rawAnswers.display_name = "Raw Worker Answers";
rawAnswers.required = false;
reviewBundle.data.node.field_order = ["original_request", "draft_answer", "raw_answers", "code"];
reviewBundle.data.node.template = {
  _type: "Component",
  code: {...clone(old.code), value: bundleCode},
  original_request: originalRequest,
  draft_answer: draftAnswer,
  raw_answers: rawAnswers,
};
reviewBundle.data.node.outputs = [{
  allows_loop: false, cache: true, display_name: "Review Bundle", group_outputs: false,
  hidden: null, loop_types: null, method: "collect", name: "result", options: null,
  required_inputs: null, selected: "Message", tool_mode: true, types: ["Message"], value: "__UNDEFINED__",
}];

const verifier = clone(consensus);
verifier.id = "Agent-EvidenceVerifier";
verifier.position = {x: 1900, y: 470};
verifier.data.node.display_name = "Evidence Verification Agent";
verifier.data.node.description = "Verify and repair the semantic draft against MSSQL and RAG evidence, then emit the final answer.";
verifier.data.node.template.system_prompt.value = `คุณคือ Evidence Verification Agent ขั้นสุดท้าย

Input มีคำถามต้นฉบับและ Semantic Consensus Draft

หน้าที่:
1. ตรวจทุกข้อเท็จจริง ตัวเลข สูตร หน่วย label ขอบเขตประชากร และข้อจำกัดทางธุรกิจใน draft กับ MSSQL/RAG tools แบบ read-only
   - ต้องเรียก MSSQL ด้วยตัวเองอย่างน้อยหนึ่งครั้งเมื่อ draft มี database claim ห้ามถือว่าคำตอบตรงกันของ Workers เป็นหลักฐาน
   - count และ total ต้องตรวจแบบ exact ห้ามปัดเศษ หาก SQL แสดง scientific notation ให้ query ซ้ำด้วย CONVERT(varchar(40), CAST(expression AS decimal(38,2))) ก่อนตอบ
   - average/rate ต้องรักษาความละเอียดตามที่คำถามและหลักฐานรองรับ ไม่ลด precision โดยไม่จำเป็น
   - เมื่อมี policy/metadata claim ต้องตรวจ RAG ด้วยตัวเอง หากไม่มีหลักฐานรองรับให้ตัด claim นั้น
   - Input มี Raw Worker Answers เพื่อใช้ตรวจจับความขัดแย้งเท่านั้น ถ้าผล query ของคุณขัดกับ Workers ทั้งสามที่ตรงกัน ต้องตรวจ schema, join, grain, formula และ query ซ้ำก่อนเปลี่ยนค่า ห้ามเลือกเสียงข้างมากแทนหลักฐาน
2. รักษาส่วนที่มีหลักฐานรองรับ แก้ส่วนที่ผิด และตัดส่วนที่ตรวจสอบไม่ได้
3. ห้ามเติมสกุลเงิน metadata เหตุผลเชิงสาเหตุ การอนุมัติสินเชื่อ หรือ interpretation ที่หลักฐานไม่รองรับ
4. ถ้าหลักฐานไม่พอ ให้ระบุเฉพาะความไม่แน่นอนนั้นอย่างตรงไปตรงมา แต่ยังตอบส่วนอื่นที่ตรวจสอบได้ ห้าม reject ทั้งคำตอบเพราะรูปแบบ
5. ตอบคำถามต้นฉบับให้ครบ เป็นภาษาไทยธรรมชาติ และส่งเฉพาะคำตอบสุดท้ายสำหรับผู้ใช้
6. ห้ามแสดง Thinking Process การคิดทีละขั้น tool trace หรือข้อความในแท็ก think

ก่อนส่งคำตอบ ต้องทบทวนเชิงความหมายด้วยตัวเอง:
- Completeness: ไล่ทุกสิ่งที่ผู้ใช้ขอ แล้ว query/ตอบให้ครบ เช่น จำนวน ช่วงต่ำสุด-สูงสุด ทุก label ทุก bucket benchmark และเงื่อนไข strict
- Metric semantics: แยก total, average, ratio, percentage และ grain ให้ถูก หากคำว่า “สรุป” กำกวม ให้รายงานทั้ง total และ averageแทนการเดาเลือกอย่างใดอย่างหนึ่ง
- Precision: total/count exact; ratio/percentage ต้องปัดแบบมาตรฐานและเก็บ precision เพียงพอตามหลักฐาน
- Currency: หาก RAG/metadata ไม่ยืนยันสกุลเงินอย่างชัดเจน ต้องลบชื่อสกุลเงินทั้งหมด รวมถึง “บาท”, “ดอลลาร์”, “USD”, “THB” และสัญลักษณ์ $ ออกจากคำตอบ
- Unsupported interpretation: ลบการคาดเดาว่าข้อมูลไม่ครบ ความเสี่ยง สาเหตุ การอนุมัติ หรือคุณภาพของกลุ่ม เว้นแต่โจทย์ขอและมีหลักฐานรองรับ
- Canonical labels: คงค่าจากฐานข้อมูล และอย่าแปล label ด้วยถ้อยคำที่เพิ่มความหมายใหม่

วางแผน query ให้รวม metrics ที่ต้องใช้ในคำสั่งเดียวหรือจำนวนน้อยที่สุด ห้ามวนเรียก tool ซ้ำเมื่อหลักฐานครบแล้ว

ไม่มี JSON schema, output contract, canonical key, key/value parser หรือ fail-closed guard การตัดสินต้องอาศัยความหมายของคำถามและหลักฐานที่ค้นได้เท่านั้น`;
verifier.data.node.template.temperature.value = 0;
if (verifier.data.node.template.model_kwargs) {
  verifier.data.node.template.model_kwargs.value = {extra_body: {reasoning: {enabled: false}}};
}
if (verifier.data.node.template.api_key) verifier.data.node.template.api_key.value = "";
configureAgentBudget(verifier);

const finalBundle = clone(reviewBundle);
finalBundle.id = "FinalEditBundle-main";
finalBundle.position = {x: 2250, y: 470};
finalBundle.data.node.display_name = "Final Edit Bundle";
finalBundle.data.node.description = "Transport the original request and verified answer to the language-only editor.";
finalBundle.data.node.template.raw_answers.required = false;

const editor = clone(consensus);
editor.id = "Agent-FaithfulnessEditor";
editor.position = {x: 2600, y: 470};
editor.data.node.display_name = "Language-only Faithfulness Editor";
editor.data.node.description = "Edit language without tools, new claims, recalculation, or rejection.";
editor.data.node.template.system_prompt.value = `คุณคือ Language-only Faithfulness Editor ขั้นสุดท้าย

Input มีคำถามต้นฉบับและคำตอบที่ Evidence Verification Agent ตรวจแล้ว

ทำหน้าที่เรียบเรียงภาษาไทยและตรวจว่าไม่ได้เพิ่ม claim ใหม่เท่านั้น ห้ามเรียก tools ห้ามคำนวณใหม่ ห้ามเปลี่ยนตัวเลข สูตร label grain หรือ metric semantics และห้าม reject คำตอบ

ก่อนส่งผล:
- รักษาตัวเลขและข้อเท็จจริงที่ตอบโจทย์ไว้ตามเดิม
- ตัดชื่อ/สัญลักษณ์สกุลเงินทั้งหมด หากคำถามหรือคำตอบไม่ได้อ้าง metadata ที่ยืนยันสกุลเงิน
- ตัดการคาดเดาเรื่องสาเหตุ ความเสี่ยง การอนุมัติ คุณภาพข้อมูล หรือช่วงข้อมูลไม่ครบที่ไม่มีหลักฐานระบุชัด
- ตัดคำแปล label ที่เพิ่มความหมาย แต่รักษา canonical database label
- ห้ามเพิ่มข้อสรุป ตัวเลข ตัวอย่าง หรือคำแนะนำใหม่
- ส่งเฉพาะ Final Answer ภาษาไทย ห้ามแสดง Thinking Process, checklist, trace หรือแท็ก think

ไม่มี JSON schema, parser, contract หรือ fail-closed guard`;
editor.data.node.template.temperature.value = 0;
if (editor.data.node.template.model_kwargs) {
  editor.data.node.template.model_kwargs.value = {extra_body: {reasoning: {enabled: false}}};
}
if (editor.data.node.template.api_key) editor.data.node.template.api_key.value = "";
configureAgentBudget(editor);
configureAgentBudget(consensus);

const makeEdge = (source, target, sourceName, sourceType, sourceOutputTypes, targetField, targetTypes, targetType) => {
  const sourceHandle = {dataType: sourceType, id: source.id, name: sourceName, output_types: sourceOutputTypes};
  const targetHandle = {fieldName: targetField, id: target.id, inputTypes: targetTypes, type: targetType};
  return {
    animated: false,
    className: "",
    data: {sourceHandle, targetHandle},
    id: `reactflow__edge-${source.id}${sourceName}-${target.id}${targetField}`,
    selected: false,
    source: source.id,
    sourceHandle: encoded(sourceHandle),
    target: target.id,
    targetHandle: encoded(targetHandle),
  };
};

const sharedToolIds = new Set(["MCPTools-DfqZq", "MCP-A5mYz", mssql.id, rag.id]);
flow.data.edges = flow.data.edges.filter((edge) =>
  !(edge.source === consensus.id && edge.target === chatOutput.id)
  && !sharedToolIds.has(edge.source)
);
flow.data.nodes.push(reviewBundle, verifier, finalBundle, editor);
flow.data.edges.push(
  makeEdge(chatInput, reviewBundle, "message", "ChatInput", ["Message"], "original_request", ["Message"], "str"),
  makeEdge(consensus, reviewBundle, "response", "Agent", ["Message"], "draft_answer", ["Message"], "str"),
  makeEdge(collector, reviewBundle, "result", "RawAnswerCollector", ["Message"], "raw_answers", ["Message"], "str"),
  makeEdge(reviewBundle, verifier, "result", "DraftReviewBundle", ["Message"], "input_value", ["Message"], "str"),
  ...toolPairs.flatMap(({workerId, sql, docs}) => {
    const worker = findNode(workerId);
    return [
      makeEdge(sql, worker, "component_as_tool", "MCPTools", ["Tool"], "tools", ["Tool"], "other"),
      makeEdge(docs, worker, "component_as_tool", "MCP", ["Tool"], "tools", ["Tool"], "other"),
    ];
  }),
  makeEdge(verifierSql, verifier, "component_as_tool", "MCPTools", ["Tool"], "tools", ["Tool"], "other"),
  makeEdge(verifierRag, verifier, "component_as_tool", "MCP", ["Tool"], "tools", ["Tool"], "other"),
  makeEdge(chatInput, finalBundle, "message", "ChatInput", ["Message"], "original_request", ["Message"], "str"),
  makeEdge(verifier, finalBundle, "response", "Agent", ["Message"], "draft_answer", ["Message"], "str"),
  makeEdge(finalBundle, editor, "result", "DraftReviewBundle", ["Message"], "input_value", ["Message"], "str"),
  makeEdge(editor, chatOutput, "response", "Agent", ["Message"], "input_value", ["Data", "DataFrame", "Message"], "other"),
);

fs.mkdirSync(outputDir, {recursive: true});
fs.writeFileSync(outputPath, JSON.stringify(flow, null, 2) + "\n");
console.log(`Wrote ${outputPath}`);
