import fs from "node:fs";

const sourcePath = process.argv[2] ?? "flows/LAB-1-4-withlocal-concurrent-consensus-v7-financial-loan-thai.json";
const outputPath = process.argv[3] ?? "flows/LAB-1-4-withlocal-concurrent-consensus-v8-guarded-verbalizer-thai.json";
const flow = JSON.parse(fs.readFileSync(sourcePath, "utf8"));
const nodes = flow.data.nodes;
const consensus = nodes.find((node) => node.id === "ConsensusVoteAggregator-main");
const verbalizer = nodes.find((node) => node.id === "Agent-ycwYQ");
const chatOutput = nodes.find((node) => node.id === "ChatOutput-BDIVy");
if (!consensus || !verbalizer || !chatOutput) throw new Error("Required v7 nodes not found");

flow.name = "LAB-1-4-withlocal-concurrent-consensus-v8-guarded-verbalizer-thai";
flow.description = "Financial/loan concurrent consensus with an LLM wording-only stage and deterministic claim guard.";

verbalizer.data.node.display_name = "Thai Wording-Only Verbalizer";
verbalizer.data.node.description = "Propose Thai labels and non-factual framing; claim values remain locked by code.";
verbalizer.data.node.template.system_prompt.value = `คุณคือ Thai Wording-Only Verbalizer

Input เป็น consensus report ที่มี original_request และ agreed_claims

คุณไม่มีสิทธิ์สร้างคำตอบเชิงข้อเท็จจริงเอง หน้าที่มีเพียงเสนอถ้อยคำภาษาไทยสำหรับหัวข้อและ label ของ claim เท่านั้น โดยค่าจริงจะถูกประกอบภายหลังด้วย deterministic code

กติกา:
1. ใช้เฉพาะ key ที่มีอยู่จริงใน agreed_claims ห้ามใช้ disputed_claims หรือ candidate_answers
2. ห้ามใส่ตัวเลข เปอร์เซ็นต์ สูตร วันที่ จำนวนเงิน หน่วย สกุลเงิน threshold policy การอนุมัติ/ปฏิเสธ ความเสี่ยง causality หรือข้อสรุปใหม่ใน intro, labels หรือ closing
3. ห้ามแก้ แปลง ปัดเศษ คำนวณ หรือคัดลอก value
4. ห้ามเรียก tools และห้ามแสดง reasoning
5. คืน JSON object เพียงหนึ่งก้อน ไม่มี Markdown และไม่มีข้อความก่อนหรือหลัง:
{
  "intro": "ข้อความนำที่ไม่กล่าวข้อเท็จจริง เช่น ผลจากข้อมูลที่ตรวจสอบได้มีดังนี้",
  "labels": {"exact_claim_key": "ชื่อรายการภาษาไทยที่เป็นกลาง"},
  "closing": "ข้อความปิดที่ไม่เพิ่มข้อสรุป หรือเว้นว่าง"
}`;
verbalizer.data.node.template.temperature.value = 0;

const guardCode = `import json
import re

from lfx.custom.custom_component.component import Component
from lfx.io import MessageTextInput, Output
from lfx.schema.message import Message


class FinalClaimGuard(Component):
    display_name = "Deterministic Final Claim Guard"
    description = "Render locked consensus values and reject factual additions from the LLM verbalizer."
    icon = "shield-check"

    inputs = [
        MessageTextInput(name="consensus_report", display_name="Consensus Report", required=True),
        MessageTextInput(name="verbalizer_output", display_name="Wording Proposal", required=True),
    ]
    outputs = [Output(display_name="Guarded Final Answer", name="result", type_=Message, method="guard")]

    @staticmethod
    def _text(value):
        return value.text if hasattr(value, "text") else str(value or "")

    @staticmethod
    def _last_object(text):
        decoder = json.JSONDecoder()
        found = []
        for match in re.finditer(r"\\{", text):
            try:
                value, _ = decoder.raw_decode(text[match.start():])
                if isinstance(value, dict):
                    found.append(value)
            except json.JSONDecodeError:
                pass
        return found[-1] if found else None

    @staticmethod
    def _safe_wording(text):
        text = str(text or "").strip()
        if re.search(r"[0-9๐-๙%$€£¥฿]", text):
            return False
        forbidden = (
            "อนุมัติ", "ปฏิเสธ", "สกุลเงิน", "ดอลลาร์", "บาท", "ยูโร",
            "ความเสี่ยง", "ปลอดภัย", "ดีมาก", "ยอมรับได้", "สูงเกินไป",
            "ทำให้", "ส่งผล", "สาเหตุ", "แนวโน้ม", "คาดการณ์", "ควร",
        )
        lowered = text.lower()
        return not any(term in lowered for term in forbidden)

    @staticmethod
    def _render_value(value):
        if isinstance(value, str):
            return value
        return json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":"))

    def guard(self) -> Message:
        report = json.loads(self._text(self.consensus_report))
        claims = report.get("agreed_claims") if isinstance(report.get("agreed_claims"), list) else []
        locked = {str(item["key"]): item for item in claims if isinstance(item, dict) and item.get("key")}
        proposal = self._last_object(self._text(self.verbalizer_output)) or {}
        labels = proposal.get("labels") if isinstance(proposal.get("labels"), dict) else {}

        valid = bool(locked)
        valid = valid and set(labels).issubset(set(locked))
        valid = valid and self._safe_wording(proposal.get("intro", ""))
        valid = valid and self._safe_wording(proposal.get("closing", ""))
        valid = valid and all(self._safe_wording(label) for label in labels.values())

        intro = str(proposal.get("intro", "")).strip() if valid else "ผลจาก claims ที่ผ่าน consensus"
        closing = str(proposal.get("closing", "")).strip() if valid else ""
        lines = [intro] if intro else []
        for key, claim in locked.items():
            label = str(labels.get(key, key)).strip() if valid else key
            unit = claim.get("unit")
            suffix = f" {unit}" if unit not in (None, "", "null") else ""
            lines.append(f"- {label}: {self._render_value(claim.get('value'))}{suffix}")
        if closing:
            lines.append(closing)
        if not locked:
            lines = ["ยังไม่มี claim ที่ได้รับเสียงสนับสนุนถึงเกณฑ์ จึงไม่สร้างคำตอบเชิงข้อเท็จจริง"]
        return Message(text="\\n".join(lines))
`;

const guard = structuredClone(consensus);
guard.id = "FinalClaimGuard-main";
guard.position = { x: 1700, y: 470 };
guard.data.id = "FinalClaimGuard-main";
guard.data.type = "FinalClaimGuard";
guard.data.node.display_name = "Deterministic Final Claim Guard";
guard.data.node.description = "Render locked values and reject factual additions from the verbalizer.";
guard.data.node.icon = "shield-check";
guard.data.node.field_order = ["consensus_report", "verbalizer_output"];
guard.data.node.metadata = { ...guard.data.node.metadata, code_hash: "final-claim-guard-v1", module: "custom_components.finalclaimguard" };
guard.data.node.outputs = [{ ...guard.data.node.outputs[0], display_name: "Guarded Final Answer", method: "guard" }];
const inputTemplate = (name, displayName) => ({
  ...structuredClone(consensus.data.node.template.original_request),
  name,
  display_name: displayName,
  value: "",
});
guard.data.node.template = {
  _type: "Component",
  code: { ...structuredClone(consensus.data.node.template.code), value: guardCode },
  consensus_report: inputTemplate("consensus_report", "Consensus Report"),
  verbalizer_output: inputTemplate("verbalizer_output", "Wording Proposal"),
};
nodes.push(guard);

verbalizer.position = { x: 1250, y: 300 };
chatOutput.position = { x: 2150, y: 470 };

const oldFinalEdge = flow.data.edges.find((edge) => edge.source === "Agent-ycwYQ" && edge.target === "ChatOutput-BDIVy");
const consensusToVerbalizer = flow.data.edges.find((edge) => edge.source === "ConsensusVoteAggregator-main" && edge.target === "Agent-ycwYQ");
if (!oldFinalEdge || !consensusToVerbalizer) throw new Error("Required v7 edges not found");
flow.data.edges = flow.data.edges.filter((edge) => edge !== oldFinalEdge);

const replaceHandle = (handle, replacements) => {
  let result = handle;
  for (const [from, to] of replacements) result = result.replaceAll(from, to);
  return result;
};
const makeEdge = (base, source, target, sourceField, targetField, sourceType) => ({
  ...structuredClone(base),
  id: `reactflow__edge-${source}${sourceField}-${target}${targetField}`,
  source,
  target,
  sourceHandle: replaceHandle(base.sourceHandle, [[base.source, source], ["response", sourceField], ["Agent", sourceType]]),
  targetHandle: replaceHandle(base.targetHandle, [[base.target, target], ["input_value", targetField]]),
  data: {
    sourceHandle: {
      ...structuredClone(base.data.sourceHandle),
      dataType: sourceType,
      id: source,
      name: sourceField,
      output_types: ["Message"],
    },
    targetHandle: {
      ...structuredClone(base.data.targetHandle),
      fieldName: targetField,
      id: target,
      inputTypes: ["Message"],
      type: target === "ChatOutput-BDIVy" ? "other" : "str",
    },
  },
});

flow.data.edges.push(
  makeEdge(consensusToVerbalizer, "ConsensusVoteAggregator-main", "FinalClaimGuard-main", "result", "consensus_report", "ConsensusVoteAggregator"),
  makeEdge(oldFinalEdge, "Agent-ycwYQ", "FinalClaimGuard-main", "response", "verbalizer_output", "Agent"),
  makeEdge(oldFinalEdge, "FinalClaimGuard-main", "ChatOutput-BDIVy", "result", "input_value", "FinalClaimGuard"),
);

fs.writeFileSync(outputPath, `${JSON.stringify(flow, null, 2)}\n`);
console.log(outputPath);
