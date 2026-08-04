import fs from "node:fs";
import path from "node:path";

const sourcePath = process.argv[2] ?? "flows/LAB-1-4-withlocal-parallel-consensus-v5-thai.json";
const outputPath = process.argv[3] ?? "flows/LAB-1-4-withlocal-concurrent-consensus-v6-thai.json";

const flow = JSON.parse(fs.readFileSync(sourcePath, "utf8"));
const nodes = flow.data.nodes;
const workers = [1, 2, 3].map((number) =>
  nodes.find((node) => node.id === `Agent-ConsensusWorker${number}`),
);
const aggregator = nodes.find((node) => node.id === "ConsensusVoteAggregator-main");
const synthesizer = nodes.find((node) => node.id === "Agent-ycwYQ");

if (workers.some((worker) => !worker) || !aggregator || !synthesizer) {
  throw new Error("Required v5 nodes were not found");
}

flow.name = "LAB-1-4-withlocal-concurrent-consensus-v6-thai";
flow.description =
  "Three identical full-answer agents run concurrently, followed by claim-level consensus and final synthesis in Thai.";

const workerPrompt = `คุณคือ Independent Full-Answer Agent หนึ่งในสามตัวที่ทำงานพร้อมกัน

หน้าที่ของคุณคือแก้คำถามของผู้ใช้ให้จบครบถ้วนด้วยตัวเอง ไม่ใช่ลงคะแนน notify/do_not_notify และไม่ใช่ตรวจเฉพาะมุมใดมุมหนึ่ง

กติกา:
1. ใช้ MSSQL และ RAG tools แบบ read-only เพื่อค้นข้อเท็จจริงและนโยบายที่จำเป็น
2. ห้ามแก้ไขข้อมูล เพิ่มเอกสาร refresh cache ส่ง notification หรือทำ external action ทุกชนิด
3. แยกข้อมูลเป็น facts จาก tools, policy จาก RAG, assumptions ที่โจทย์กำหนด และ derived calculations
4. สมมติฐานที่โจทย์กำหนดให้ถือเป็น input ที่ใช้คำนวณได้ ไม่ต้องค้นหา field ยืนยันในฐานข้อมูล
5. หากโจทย์อ้างคำตอบข้ออื่นแต่ไม่มี context ให้ระบุ uncertainty อย่างชัดเจน และยังตอบส่วนที่คำนวณได้ ห้ามตีความ Q1 เป็นไตรมาสหรือชื่อคอลัมน์โดยไม่มีหลักฐาน
6. ตรวจหน่วย ชนิดข้อมูล วันที่ สูตร และผลรวมก่อนตอบ
7. ใช้ภาษาไทยเป็นหลัก
8. คืน JSON object เพียงหนึ่งก้อนโดยไม่มี Markdown และไม่มีข้อความก่อนหรือหลัง JSON ตาม schema นี้:
{
  "answer": "คำตอบฉบับเต็มที่ตอบคำถามผู้ใช้โดยตรง",
  "claims": [
    {"key": "stable_snake_case_key", "value": "ค่า string/number/bool/list/object", "evidence": ["หลักฐานตรวจสอบได้"]}
  ],
  "calculations": ["สูตรและการแทนค่าที่ตรวจซ้ำได้"],
  "uncertainties": ["สิ่งที่ยังยืนยันไม่ได้จริง ๆ"],
  "confidence": 0.0
}

ชื่อ claim key ต้องสื่อความหมายคงที่ เช่น eligible_case_ids, total_units, total_exposure, deadline, minimum_rma เพื่อให้เทียบกับคำตอบของ Agent อื่นได้`;

workers.forEach((worker, index) => {
  worker.data.node.display_name = `Concurrent Full-Answer Agent ${index + 1}`;
  worker.data.node.description = "Independent full-answer candidate using the same task, tools, and instructions.";
  worker.data.node.template.system_prompt.value = workerPrompt;
  worker.data.node.template.temperature.value = 0.1;
  if (worker.data.node.template.seed) {
    worker.data.node.template.seed.value = [101, 202, 303][index];
  }
  if (worker.data.node.template.add_current_date_tool) {
    worker.data.node.template.add_current_date_tool.value = false;
  }
});

const aggregatorCode = `import json
import re
from collections import defaultdict

from lfx.custom.custom_component.component import Component
from lfx.io import IntInput, MessageTextInput, Output
from lfx.schema.message import Message


class ConsensusVoteAggregator(Component):
    display_name = "Concurrent Answer Consensus"
    description = "Collect three full candidate answers and compare structured claims."
    icon = "git-merge"

    inputs = [
        MessageTextInput(name="original_request", display_name="Original Request", required=True),
        MessageTextInput(name="vote_1", display_name="Candidate Answer 1", required=True),
        MessageTextInput(name="vote_2", display_name="Candidate Answer 2", required=True),
        MessageTextInput(name="vote_3", display_name="Candidate Answer 3", required=True),
        IntInput(
            name="threshold",
            display_name="Required Matching Answers",
            value=2,
            required=True,
        ),
    ]

    outputs = [Output(display_name="Answer Consensus Report", name="result", type_=Message, method="aggregate")]

    @staticmethod
    def _text(value):
        if hasattr(value, "text"):
            return value.text or ""
        return str(value or "")

    @classmethod
    def _parse_candidate(cls, value, worker):
        text = cls._text(value).strip()
        decoder = json.JSONDecoder()
        objects = []
        for match in re.finditer(r"[\\{\\[]", text):
            try:
                parsed, _ = decoder.raw_decode(text[match.start():])
                objects.append(parsed)
            except json.JSONDecodeError:
                continue
        candidate = next(
            (item for item in reversed(objects) if isinstance(item, dict) and ("answer" in item or "claims" in item)),
            None,
        )
        if candidate is None:
            return {
                "worker": worker,
                "answer": text,
                "claims": [],
                "calculations": [],
                "uncertainties": ["candidate_not_valid_json"],
                "confidence": 0.0,
                "parse_error": True,
            }
        claims = candidate.get("claims") if isinstance(candidate.get("claims"), list) else []
        clean_claims = []
        for claim in claims:
            if isinstance(claim, dict) and claim.get("key"):
                clean_claims.append({
                    "key": str(claim["key"]),
                    "value": claim.get("value"),
                    "evidence": claim.get("evidence") if isinstance(claim.get("evidence"), list) else [],
                })
        return {
            "worker": worker,
            "answer": str(candidate.get("answer", "")),
            "claims": clean_claims,
            "calculations": candidate.get("calculations") if isinstance(candidate.get("calculations"), list) else [],
            "uncertainties": candidate.get("uncertainties") if isinstance(candidate.get("uncertainties"), list) else [],
            "confidence": candidate.get("confidence", 0.0),
            "parse_error": False,
        }

    @staticmethod
    def _canonical(value):
        return json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":"))

    def aggregate(self) -> Message:
        required = max(1, min(3, int(self.threshold)))
        candidates = [
            self._parse_candidate(self.vote_1, "agent_1"),
            self._parse_candidate(self.vote_2, "agent_2"),
            self._parse_candidate(self.vote_3, "agent_3"),
        ]

        grouped = defaultdict(lambda: defaultdict(list))
        for candidate in candidates:
            for claim in candidate["claims"]:
                grouped[claim["key"]][self._canonical(claim["value"])].append({
                    "worker": candidate["worker"],
                    "value": claim["value"],
                    "evidence": claim["evidence"],
                })

        agreed_claims = []
        disputed_claims = []
        for key, variants in sorted(grouped.items()):
            ranked = sorted(variants.values(), key=lambda items: (-len(items), self._canonical(items[0]["value"])))
            winner = ranked[0]
            record = {
                "key": key,
                "value": winner[0]["value"],
                "support": len(winner),
                "total_candidates": 3,
                "supporting_workers": [item["worker"] for item in winner],
                "evidence": [e for item in winner for e in item["evidence"]],
            }
            if len(winner) >= required:
                agreed_claims.append(record)
            else:
                disputed_claims.append({
                    "key": key,
                    "variants": [
                        {
                            "value": items[0]["value"],
                            "support": len(items),
                            "workers": [item["worker"] for item in items],
                            "evidence": [e for item in items for e in item["evidence"]],
                        }
                        for items in ranked
                    ],
                })

        parse_successes = sum(not candidate["parse_error"] for candidate in candidates)
        if agreed_claims and not disputed_claims and parse_successes == 3:
            status = "full_consensus"
        elif agreed_claims:
            status = "partial_consensus"
        else:
            status = "no_claim_consensus"

        report = {
            "orchestration": "concurrent_full_answer",
            "original_request": self._text(self.original_request),
            "required_matching_answers": required,
            "status": status,
            "parse_successes": parse_successes,
            "agreed_claims": agreed_claims,
            "disputed_claims": disputed_claims,
            "candidate_answers": candidates,
        }
        return Message(text=json.dumps(report, ensure_ascii=False, sort_keys=True))
`;

aggregator.data.node.display_name = "Concurrent Answer Consensus";
aggregator.data.node.description = "Collect three full candidate answers and compare structured claims.";
aggregator.data.node.template.code.value = aggregatorCode;
aggregator.data.node.template.threshold.value = 2;
for (const [field, label] of [
  ["vote_1", "Candidate Answer 1"],
  ["vote_2", "Candidate Answer 2"],
  ["vote_3", "Candidate Answer 3"],
  ["threshold", "Required Matching Answers"],
]) {
  if (aggregator.data.node.template[field]) {
    aggregator.data.node.template[field].display_name = label;
  }
}

synthesizer.data.node.display_name = "Final Answer Synthesizer";
synthesizer.data.node.description = "Synthesize one grounded final answer from concurrent candidate answers and claim consensus.";
synthesizer.data.node.template.system_prompt.value = `คุณคือ Final Answer Synthesizer

Input เป็น concurrent answer consensus report ที่มี original_request, candidate_answers, agreed_claims และ disputed_claims

หน้าที่:
1. ตอบ original_request ให้ครบถ้วนเป็นภาษาไทย โดยใช้ candidate answers และหลักฐานที่ให้มา
2. ใช้ agreed_claims ที่มี support ตั้งแต่ required_matching_answers เป็นแกนหลัก
3. สำหรับ disputed_claims ให้ตรวจ evidence และ calculations ของแต่ละ candidate แล้วเลือกค่าที่มีหลักฐานแข็งแรงกว่า ห้ามเลือกเพียงเพราะ confidence สูงกว่า
4. รักษาสมมติฐานที่ผู้ใช้กำหนด ห้ามเรียกร้องให้มี field ในฐานข้อมูลเมื่อโจทย์ระบุว่าเป็นสมมติฐาน
5. ตรวจชนิดข้อมูล หน่วย สูตร ผลรวม และวันที่ก่อนตอบ
6. หากยังตัดสิน claim สำคัญไม่ได้จริง ให้ตอบส่วนที่ยืนยันได้และระบุข้อไม่แน่นอนอย่างเจาะจง
7. ห้ามเรียก tools ห้ามทำ external action และห้ามพูดเรื่อง notify/do_not_notify/abstain
8. แสดงเฉพาะคำตอบสุดท้าย ไม่แสดง hidden reasoning, JSON report หรือรายละเอียด orchestration เว้นแต่ผู้ใช้ถาม
9. ห้ามกล่าวหาบุคคลหรืออนุมานเจตนาเมื่อหลักฐานมีเพียงข้อมูลขัดแย้งกัน`;
synthesizer.data.node.template.temperature.value = 0;
if (synthesizer.data.node.template.add_current_date_tool) {
  synthesizer.data.node.template.add_current_date_tool.value = false;
}

// Final synthesis must depend only on the three concurrent candidates and their evidence.
flow.data.edges = flow.data.edges.filter(
  (edge) => !(edge.target === "Agent-ycwYQ" && ["MCPTools-DfqZq", "MCP-A5mYz"].includes(edge.source)),
);

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(flow, null, 2)}\n`);
console.log(outputPath);
