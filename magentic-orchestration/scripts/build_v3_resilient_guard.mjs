import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..", "..");
const sourcePath = path.join(root, "magentic-orchestration", "flows", "v2", "LAB-magentic-v2-subflow-specialists-thai.json");
const outputDir = path.join(root, "magentic-orchestration", "flows", "v3");
const outputPath = path.join(outputDir, "LAB-magentic-v3-resilient-final-guard-thai.json");
const flow = JSON.parse(fs.readFileSync(sourcePath, "utf8"));

const node = (id) => {
  const found = flow.data.nodes.find((item) => item.id === id);
  if (!found) throw new Error(`Missing node ${id}`);
  return found;
};

const guardCode = `import json
import re

from lfx.custom.custom_component.component import Component
from lfx.io import MessageTextInput, Output
from lfx.schema.message import Message


class MagenticV3ResilientFinalGuard(Component):
    display_name = "Resilient Claim-Integrity Final Guard"
    description = "Fail closed on unsupported claims, but repair missing audit metadata deterministically."
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
    def _blocked(reason):
        return {
            "status": "blocked",
            "answer": "Final Guard ปฏิเสธคำตอบเพราะ claim integrity ไม่ผ่าน",
            "task_ledger": {
                "objective": "final_claim_integrity_validation",
                "acceptance_criteria": [],
                "completed_tasks": [],
                "blocked_tasks": [reason],
                "remaining_tasks": [],
                "replans": [],
            },
            "claims": [],
            "execution_trace": [],
            "uncertainties": [reason],
            "audit_warnings": [],
        }

    @staticmethod
    def _claim_valid(claim):
        if not isinstance(claim, dict):
            return False
        if claim.get("key") in {None, "", "...", "unknown"}:
            return False
        if "value" not in claim:
            return False
        evidence_ids = claim.get("evidence_ids")
        return isinstance(evidence_ids, list) and bool(evidence_ids) and all(
            isinstance(item, str) and item.strip() and item not in {"...", "unknown"}
            for item in evidence_ids
        )

    @staticmethod
    def _currency_authorized(answer, claims):
        answer_lower = answer.lower()
        token_map = {
            "$": {"usd", "$", "us dollar", "dollar"},
            "usd": {"usd", "$", "us dollar", "dollar"},
            "dollar": {"usd", "$", "us dollar", "dollar"},
            "บาท": {"thb", "บาท", "thai baht"},
            "฿": {"thb", "บาท", "thai baht", "฿"},
            "thb": {"thb", "บาท", "thai baht", "฿"},
            "eur": {"eur", "euro", "€"},
            "€": {"eur", "euro", "€"},
            "gbp": {"gbp", "pound sterling", "£"},
            "£": {"gbp", "pound sterling", "£"},
            "jpy": {"jpy", "yen", "¥"},
            "¥": {"jpy", "yen", "¥"},
        }
        units = {str(claim.get("unit") or "").strip().lower() for claim in claims}
        for token, allowed_units in token_map.items():
            if token in answer_lower and not units.intersection(allowed_units):
                return False
        return True

    @staticmethod
    def _repair_ledger(payload, warnings):
        ledger = payload.get("task_ledger")
        if not isinstance(ledger, dict):
            ledger = {}
            warnings.append("defaulted_missing_task_ledger")
        objective = ledger.get("objective")
        if not isinstance(objective, str) or not objective.strip() or objective in {"...", "unknown"}:
            ledger["objective"] = "objective_not_supplied_by_manager"
            warnings.append("defaulted_missing_objective")
        for key in ("acceptance_criteria", "completed_tasks", "blocked_tasks", "remaining_tasks", "replans"):
            if not isinstance(ledger.get(key), list):
                ledger[key] = []
                warnings.append("defaulted_" + key)
        payload["task_ledger"] = ledger

    def guard(self) -> Message:
        candidates = self._objects(self._text(self.manager_output))
        payload = next((item for item in reversed(candidates) if "answer" in item and "claims" in item), None)
        if not isinstance(payload, dict):
            return Message(text=json.dumps(self._blocked("missing_answer_or_claims_json"), ensure_ascii=False, sort_keys=True))

        warnings = []
        answer = payload.get("answer")
        if isinstance(answer, (dict, list)):
            answer = json.dumps(answer, ensure_ascii=False, sort_keys=True)
            payload["answer"] = answer
            warnings.append("serialized_structured_answer")
        claims = payload.get("claims")
        if not isinstance(answer, str) or not answer.strip() or answer in {"...", "คำตอบจาก verified claims"}:
            return Message(text=json.dumps(self._blocked("invalid_answer"), ensure_ascii=False, sort_keys=True))
        if not isinstance(claims, list) or not claims or not all(self._claim_valid(item) for item in claims):
            return Message(text=json.dumps(self._blocked("invalid_or_unlinked_claims"), ensure_ascii=False, sort_keys=True))
        if not self._currency_authorized(answer, claims):
            return Message(text=json.dumps(self._blocked("unauthorized_currency_in_answer"), ensure_ascii=False, sort_keys=True))

        self._repair_ledger(payload, warnings)
        trace = payload.get("execution_trace")
        if not isinstance(trace, list):
            trace = []
            warnings.append("defaulted_missing_execution_trace")
        payload["execution_trace"] = trace
        uncertainties = payload.get("uncertainties")
        if not isinstance(uncertainties, list):
            uncertainties = []
            warnings.append("defaulted_missing_uncertainties")
        payload["uncertainties"] = uncertainties

        verification_complete = any(
            isinstance(item, dict)
            and item.get("specialist") == "verification"
            and item.get("result") == "complete"
            for item in trace
        )
        status = payload.get("status")
        if status not in {"complete", "partial", "blocked"}:
            status = "partial"
            warnings.append("defaulted_invalid_status_to_partial")
        if status == "complete" and not verification_complete:
            status = "partial"
            warnings.append("verification_trace_missing_or_incomplete")
        payload["status"] = status
        payload["audit_warnings"] = sorted(set(warnings))
        return Message(text=json.dumps(payload, ensure_ascii=False, sort_keys=True))
`;

flow.name = "LAB-magentic-v3-resilient-final-guard-thai";
flow.description = "Magentic v3: claim-strict but schema-tolerant final guard; v2 specialist subflows are reused.";
flow.endpoint_name = "magentic_v3_resilient_final_guard";

const manager = node("Agent-ycwYQ");
manager.data.node.template.system_prompt.value += `

Magentic v3 Final Contract:
- Critical: answer และ claims ต้องมีจริง; ทุก claim ต้องมี key, value และ evidence_ids ที่ไม่ว่าง
- ห้ามเพิ่ม $, บาท, ฿ หรือสกุลเงินอื่น เว้นแต่ claim ที่ Verification คืนระบุหน่วยนั้นอย่างชัดเจน
- Audit fields ได้แก่ task_ledger, execution_trace, uncertainties และ status ควรส่งให้ครบ แต่ Final Guard สามารถเติม default พร้อม audit_warnings ได้
- หาก execution_trace ไม่มี verification complete ผลจะถูกลดจาก complete เป็น partial โดยไม่ทิ้ง verified claims ที่มี evidence linkage
- ห้ามสร้าง claim ใหม่ระหว่าง final composition`;

const guard = node("MagenticOutputGuard-main");
guard.data.type = "MagenticV3ResilientFinalGuard";
guard.data.node.type = "MagenticV3ResilientFinalGuard";
guard.data.node.display_name = "Resilient Claim-Integrity Final Guard";
guard.data.node.description = "Strict on claim integrity; tolerant and self-repairing for audit metadata.";
guard.data.node.template.code.value = guardCode;

fs.mkdirSync(outputDir, {recursive: true});
fs.writeFileSync(outputPath, JSON.stringify(flow, null, 2) + "\n");
console.log(`Wrote ${outputPath}`);
