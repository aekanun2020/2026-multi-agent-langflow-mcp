import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const concurrentPath = path.join(root, "Multi-Agent with Concurrent Orchestration", "LAB-concurrent-vote-2of3-retry-thai.json");
const hybridPath = path.join(root, "hybrid-orchestration", "flows", "LAB-hybrid-v1-grounded-consensus-thai-ui-upload-20260805.json");
const outputPath = path.join(here, "LAB-hybrid-vote-2of3-verified-thai.json");

const flow = JSON.parse(fs.readFileSync(concurrentPath, "utf8"));
const hybrid = JSON.parse(fs.readFileSync(hybridPath, "utf8"));
const clone = (value) => structuredClone(value);
const findNode = (graph, id) => graph.data.nodes.find((node) => node.id === id);
const encoded = (value) => JSON.stringify(value).replaceAll('"', "œ");

flow.id = "c7e8a6f4-9cf6-4ba1-bc34-741a1194dc61";
flow.name = "LAB-hybrid-vote-2of3-verified-thai";
flow.description = "Three concurrent workers, tool-free 2-of-3 voting with retry on vote failure, evidence verification after PASS, and language-only final editing.";
delete flow.endpoint_name;

const copiedIds = [
  "MCPTools-SQL-Verifier",
  "MCP-RAG-Verifier",
  "DraftReviewBundle-main",
  "Agent-EvidenceVerifier",
  "FinalEditBundle-main",
  "Agent-FaithfulnessEditor",
];

for (const id of copiedIds) {
  const node = clone(findNode(hybrid, id));
  node.data.id = node.id;
  flow.data.nodes.push(node);
}

const verifier = findNode(flow, "Agent-EvidenceVerifier");
verifier.data.node.display_name = "Evidence Verifier — 4 Rules";
verifier.data.node.description = "Verify the voted answer against MSSQL/RAG evidence; keep, correct, remove, or state that a core claim cannot be verified.";
verifier.data.node.template.system_prompt.value = `คุณคือ Evidence Verifier ทำงานหลังจากคำตอบผ่าน Vote 2-of-3 แล้ว

คุณมี MSSQL MCP และ RAG MCP สำหรับตรวจคำถามเดิมและคำตอบที่ผ่าน vote

ยึดกติกา 4 ข้อนี้เท่านั้น:
1. มีหลักฐานตรง: คง claim ไว้
2. หลักฐานขัดแย้ง: แก้ claim ให้ตรงกับหลักฐาน
3. ไม่มีหลักฐาน: ตัด claim รองออก; ถ้าเป็น claim หลักที่จำเป็นต่อการตอบ ให้ระบุอย่างตรงไปตรงมาว่า "จากข้อมูลที่เครื่องมือส่งกลับมา ยังไม่สามารถยืนยันคำตอบในส่วนนี้ได้"
4. ห้ามเติมคำตอบจากความรู้ของตนเอง

วิธีปฏิบัติก่อนส่งคำตอบ:
- ไล่ตรวจทุก claim ในคำตอบที่ผ่าน vote ทีละรายการ ห้ามตรวจเพียงบาง claim
- ตรวจทั้งข้อความ ตัวเลข ผลรวม สูตร หน่วย label ขอบเขตประชากร และ business condition กับหลักฐานจาก tool
- หากคำตอบมีผลรวมและองค์ประกอบย่อย ต้องตรวจว่าผลรวมสอดคล้องกับองค์ประกอบและหลักฐาน ห้ามปล่อยตัวเลขที่ขัดกับหลักฐานไว้
- เมื่อหลักฐานชัดเจนและขัดกับ claim ต้องแทนที่ claim ด้วยค่าหรือข้อความที่ตรงกับหลักฐาน แล้วส่งคำตอบฉบับแก้ไขต่อทันที โดยไม่ retry และไม่จำเป็นต้องประกาศว่าแก้ไขแล้ว
- หากหลักฐานกำกวม หรือแหล่งหลักฐานขัดแย้งกัน ห้ามเลือกคำตอบเอง ให้ระบุเฉพาะส่วนที่ยังยืนยันไม่ได้
- ก่อนส่งออก ให้ทบทวนอีกครั้งว่าทุก claim ที่เหลืออยู่มีหลักฐานรองรับ และสิ่งที่ผู้ใช้ถามได้รับคำตอบครบเท่าที่หลักฐานรองรับ

ข้อกำหนดเพิ่มเติม:
- ถ้า tool result ไม่มี currency metadata ห้ามระบุ บาท ดอลลาร์ หรือสกุลเงินใด
- ห้ามตีความ funded_amnt, funding_ratio หรือ loan_status เป็น approval decision ถ้าหลักฐานไม่ได้กำหนด
- รักษาตัวเลข สูตร หน่วย label ขอบเขตประชากร และ business condition ตามหลักฐาน
- ไม่ส่งกลับไป retry เพียงเพราะหลักฐานไม่มีข้อมูล; ให้แก้ ตัด หรือระบุว่ายืนยันไม่ได้ตามกติกาข้างต้น
- ตอบเป็นภาษาไทยและส่งเฉพาะคำตอบฉบับที่ตรวจแล้ว`;
verifier.data.node.template.temperature.value = 0;
verifier.data.node.template.seed.value = 11;

const editor = findNode(flow, "Agent-FaithfulnessEditor");
editor.data.node.display_name = "Language-only Final Editor";
editor.data.node.description = "Improve Thai readability without adding, calculating, correcting, or removing factual claims from the verified answer.";
editor.data.node.template.system_prompt.value = `คุณคือ Language-only Final Editor

หน้าที่คือเรียบเรียงคำตอบที่ Evidence Verifier ตรวจแล้วให้อ่านง่ายเป็นภาษาไทย โดยรักษาความหมาย ตัวเลข สูตร หน่วย label ขอบเขต และข้อความที่ระบุว่ายืนยันไม่ได้ไว้ครบถ้วน

- ห้ามเรียก tool
- ห้ามค้นข้อมูล
- ห้ามเพิ่ม claim ใหม่
- ห้ามคำนวณใหม่
- ห้ามแก้ข้อเท็จจริงด้วยความรู้ของตนเอง
- ห้ามเติมสกุลเงินที่คำตอบตรวจแล้วไม่ได้ระบุ
- ส่งเฉพาะ Final Answer`;
editor.data.node.template.temperature.value = 0;
editor.data.node.template.seed.value = 17;
if (editor.data.node.template.tools) editor.data.node.template.tools.value = [];

const positions = {
  "VoteRetryRouter-main": {x: 1500, y: 470},
  "StripPassMarker-main": {x: 1760, y: 350},
  "DraftReviewBundle-main": {x: 2020, y: 470},
  "MCPTools-SQL-Verifier": {x: 2300, y: 80},
  "MCP-RAG-Verifier": {x: 2300, y: 850},
  "Agent-EvidenceVerifier": {x: 2380, y: 470},
  "FinalEditBundle-main": {x: 2740, y: 470},
  "Agent-FaithfulnessEditor": {x: 3100, y: 470},
  "ChatOutput-BDIVy": {x: 3460, y: 470},
};
for (const [id, position] of Object.entries(positions)) findNode(flow, id).position = position;

const makeEdge = (sourceId, targetId, sourceName, sourceType, sourceOutputTypes, targetField, targetTypes, targetType) => {
  const sourceHandle = {dataType: sourceType, id: sourceId, name: sourceName, output_types: sourceOutputTypes};
  const targetHandle = {fieldName: targetField, id: targetId, inputTypes: targetTypes, type: targetType};
  return {
    animated: false,
    className: "",
    data: {sourceHandle, targetHandle},
    id: `reactflow__edge-${sourceId}${sourceName}-${targetId}${targetField}`,
    selected: false,
    source: sourceId,
    sourceHandle: encoded(sourceHandle),
    target: targetId,
    targetHandle: encoded(targetHandle),
  };
};

flow.data.edges = flow.data.edges.filter((edge) =>
  !(edge.source === "StripPassMarker-main" && edge.target === "ChatOutput-BDIVy")
);

flow.data.edges.push(
  makeEdge("ChatInput-uc7rV", "DraftReviewBundle-main", "message", "ChatInput", ["Message"], "original_request", ["Message"], "str"),
  makeEdge("StripPassMarker-main", "DraftReviewBundle-main", "result", "StripPassMarker", ["Message"], "draft_answer", ["Message"], "str"),
  makeEdge("DraftReviewBundle-main", "Agent-EvidenceVerifier", "result", "DraftReviewBundle", ["Message"], "input_value", ["Message"], "str"),
  makeEdge("MCPTools-SQL-Verifier", "Agent-EvidenceVerifier", "component_as_tool", "MCPTools", ["Tool"], "tools", ["Tool"], "other"),
  makeEdge("MCP-RAG-Verifier", "Agent-EvidenceVerifier", "component_as_tool", "MCP", ["Tool"], "tools", ["Tool"], "other"),
  makeEdge("ChatInput-uc7rV", "FinalEditBundle-main", "message", "ChatInput", ["Message"], "original_request", ["Message"], "str"),
  makeEdge("Agent-EvidenceVerifier", "FinalEditBundle-main", "response", "Agent", ["Message"], "draft_answer", ["Message"], "str"),
  makeEdge("FinalEditBundle-main", "Agent-FaithfulnessEditor", "result", "DraftReviewBundle", ["Message"], "input_value", ["Message"], "str"),
  makeEdge("Agent-FaithfulnessEditor", "ChatOutput-BDIVy", "response", "Agent", ["Message"], "input_value", ["Data", "DataFrame", "Message"], "other"),
);

for (const node of flow.data.nodes) node.data.id = node.id;

fs.writeFileSync(outputPath, JSON.stringify(flow, null, 2) + "\n");
console.log(`Wrote ${outputPath}`);
