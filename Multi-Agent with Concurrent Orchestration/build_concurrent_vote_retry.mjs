import fs from "node:fs";
import path from "node:path";
import {execFileSync} from "node:child_process";
import {fileURLToPath} from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const sourcePath = path.join(root, "hybrid-orchestration", "flows", "LAB-hybrid-v1-grounded-consensus-thai-ui-upload-20260805.json");
const outputPath = path.join(here, "LAB-concurrent-vote-2of3-retry-thai.json");
const flow = JSON.parse(fs.readFileSync(sourcePath, "utf8"));
const clone = (value) => structuredClone(value);
const findNode = (id) => flow.data.nodes.find((node) => node.id === id);
const encoded = (value) => JSON.stringify(value).replaceAll('"', "œ");

flow.id = "7aad34a7-9a25-451a-9e23-2732dc9ab7be";
flow.name = "LAB-concurrent-vote-2of3-retry-thai";
flow.description = "Three concurrent workers with identical MSSQL/RAG tools; a tool-free Vote Agent returns an answer when at least two of three answers have the same essential meaning, otherwise all workers retry the original question.";
delete flow.endpoint_name;

const chatInput = findNode("ChatInput-uc7rV");
const chatOutput = findNode("ChatOutput-BDIVy");
const collector = findNode("ConsensusVoteAggregator-main");
const voteAgent = findNode("Agent-ycwYQ");
const workerIds = ["Agent-ConsensusWorker1", "Agent-ConsensusWorker2", "Agent-ConsensusWorker3"];

const keepIds = new Set([
  chatInput.id,
  chatOutput.id,
  collector.id,
  voteAgent.id,
  ...workerIds,
  "MCPTools-SQL-Worker1", "MCP-RAG-Worker1",
  "MCPTools-SQL-Worker2", "MCP-RAG-Worker2",
  "MCPTools-SQL-Worker3", "MCP-RAG-Worker3",
]);
flow.data.nodes = flow.data.nodes.filter((node) => keepIds.has(node.id));
flow.data.edges = flow.data.edges.filter((edge) => keepIds.has(edge.source) && keepIds.has(edge.target));

for (const workerId of workerIds) {
  const worker = findNode(workerId);
  worker.data.node.display_name = workerId.replace("Agent-ConsensusWorker", "Worker Agent ");
  worker.data.node.description = "Answer the same user question independently using the same MSSQL and RAG tools as the other workers.";
  worker.data.node.template.system_prompt.value = `คุณคือ Worker Agent ที่ทำงานอิสระ

รับคำถามของผู้ใช้แล้วค้นคว้าและตอบให้ครบถ้วนด้วย MSSQL MCP และ RAG MCP ที่เชื่อมต่ออยู่
- ต้องใช้หลักฐานจริงเมื่อคำถามต้องการข้อมูลจากฐานข้อมูลหรือเอกสาร
- รักษาตัวเลข สูตร หน่วย label ขอบเขตประชากร และเงื่อนไขทางธุรกิจให้ถูกต้อง
- ห้ามดูหรืออ้างคำตอบของ Worker Agent ตัวอื่น
- ตอบเป็นภาษาไทยเป็นหลัก
- ส่งเฉพาะคำตอบสำหรับผู้ใช้ ไม่แสดง thinking process หรือ tool trace`;
  worker.data.node.template.temperature.value = 0.2;
}

collector.data.node.display_name = "Collect 3 Worker Answers";
collector.data.node.description = "Send the original question and all three worker answers to the Vote Agent without judging or changing them.";

voteAgent.data.node.display_name = "Vote Agent — 2 of 3";
voteAgent.data.node.description = "Tool-free agent: answer only when at least two of three worker answers have the same essential meaning; otherwise request a retry.";
voteAgent.data.node.template.system_prompt.value = `คุณคือ Vote Agent ตัวสุดท้าย และไม่มี tool ใด ๆ

Input มีคำถามเดิมและคำตอบจาก Worker Agent 3 ตัว

หน้าที่เดียวของคุณ:
1. ตรวจว่ามีคำตอบจาก Worker อย่างน้อย 2 ใน 3 ตัวที่มีสาระสำคัญเหมือนกันหรือไม่
2. พิจารณาสาระสำคัญของคำตอบ ไม่ตัดสินจากการใช้คำหรือรูปประโยคเหมือนกัน
3. หากมีอย่างน้อย 2 ใน 3 ที่มีสาระสำคัญเหมือนกัน ให้บรรทัดแรกเป็น PASS แล้วเรียบเรียงเฉพาะสาระสำคัญที่ตรงกันเป็นคำตอบภาษาไทย
4. หากไม่มีคำตอบที่มีสาระสำคัญเหมือนกันอย่างน้อย 2 ใน 3 ให้ตอบคำเดียวว่า RETRY
5. ห้ามใช้ความรู้ของคุณตอบโจทย์เอง ห้ามเพิ่มข้อเท็จจริงใหม่ และห้ามเรียก tool

รูปแบบเมื่อผ่าน:
PASS
<คำตอบสุดท้ายจากสาระสำคัญที่ตรงกันอย่างน้อย 2 ใน 3>

รูปแบบเมื่อไม่ผ่าน:
RETRY`;
voteAgent.data.node.template.temperature.value = 0;
if (voteAgent.data.node.template.tools) voteAgent.data.node.template.tools.value = [];

const routerCode = `from lfx.custom.custom_component.component import Component
from lfx.io import MessageTextInput, Output
from lfx.schema.message import Message


class VoteRetryRouter(Component):
    display_name = "Pass or Retry"
    description = "PASS goes to Chat Output; RETRY sends the original question back to all workers."
    icon = "repeat-2"

    inputs = [
        MessageTextInput(name="vote_result", display_name="Vote Result", required=True),
        MessageTextInput(name="original_question", display_name="Original Question", required=True),
    ]
    outputs = [
        Output(display_name="Pass", name="pass_result", method="pass_response", group_outputs=True),
        Output(display_name="Retry", name="retry_result", method="retry_response", group_outputs=True),
    ]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.__iteration_updated = False

    def _pre_run_setup(self):
        self.__iteration_updated = False

    @staticmethod
    def _text(value):
        return value.text if hasattr(value, "text") else str(value or "")

    def _passed(self):
        return self._text(self.vote_result).lstrip().startswith("PASS")

    def _route(self, stopped_output):
        if not self.__iteration_updated:
            self.update_ctx({f"{self._id}_iteration": self.ctx.get(f"{self._id}_iteration", 0) + 1})
            self.__iteration_updated = True
            self.stop(stopped_output)
            self.graph.exclude_branch_conditionally(self._id, output_name=stopped_output)

    def pass_response(self) -> Message:
        if self._passed():
            self._route("retry_result")
            text = self._text(self.vote_result).lstrip()
            answer = text[4:].lstrip("\\n: ")
            return Message(text=answer)
        self._route("pass_result")
        return Message(text="")

    def retry_response(self) -> Message:
        if not self._passed():
            self._route("pass_result")
            return Message(text=self._text(self.original_question))
        self._route("retry_result")
        return Message(text="")
`;

const router = clone(collector);
router.id = "VoteRetryRouter-main";
router.position = {x: 1500, y: 470};
router.data.id = router.id;
router.data.type = "VoteRetryRouter";
router.data.node.type = "VoteRetryRouter";
router.data.node.display_name = "Pass or Retry";
router.data.node.description = "PASS goes to Chat Output; RETRY sends the original question back to all three workers.";
const oldTemplate = router.data.node.template;
const voteResult = clone(oldTemplate.candidate_1);
voteResult.name = "vote_result";
voteResult.display_name = "Vote Result";
const originalQuestion = clone(oldTemplate.original_request);
originalQuestion.name = "original_question";
originalQuestion.display_name = "Original Question";
router.data.node.field_order = ["vote_result", "original_question", "code"];
router.data.node.template = {
  _type: "Component",
  code: {...clone(oldTemplate.code), value: routerCode},
  vote_result: voteResult,
  original_question: originalQuestion,
};
router.data.node.outputs = [
  {allows_loop: false, cache: true, display_name: "Pass", group_outputs: true, hidden: null, loop_types: null, method: "pass_response", name: "pass_result", options: null, required_inputs: null, selected: "Message", tool_mode: true, types: ["Message"], value: "__UNDEFINED__"},
  {allows_loop: true, cache: true, display_name: "Retry", group_outputs: true, hidden: null, loop_types: ["Message"], method: "retry_response", name: "retry_result", options: null, required_inputs: null, selected: "Message", tool_mode: true, types: ["Message"], value: "__UNDEFINED__"},
];
flow.data.nodes.push(router);

// Use Langflow 1.7.3's built-in cycle-aware If-Else component. Its runtime
// manages conditional branch exclusion correctly when the False edge loops.
const componentCatalog = JSON.parse(execFileSync(
  "curl",
  ["--compressed", "-sS", "http://localhost:7860/api/v1/all"],
  {encoding: "utf8", maxBuffer: 32 * 1024 * 1024},
));
const conditionalDefinition = clone(componentCatalog.flow_controls.ConditionalRouter);
router.data.type = "ConditionalRouter";
router.data.node = conditionalDefinition;
router.data.node.display_name = "Pass or Retry";
router.data.node.description = "PASS goes to Chat Output; RETRY sends the original question back to all workers.";
router.data.node.template.operator.value = "starts with";
router.data.node.template.match_text.value = "PASS";
router.data.node.template.case_sensitive.value = true;
router.data.node.template.max_iterations.value = 1000;
router.data.node.template.default_route.value = "false_result";

const seedCode = `from lfx.custom.custom_component.component import Component
from lfx.io import MessageTextInput, Output
from lfx.schema.data import Data
from lfx.schema.dataframe import DataFrame


class RetryQuestionSeed(Component):
    display_name = "Prepare Original Question"
    description = "Prepare the original question for the built-in Langflow loop."
    icon = "list-start"

    inputs = [MessageTextInput(name="original_question", display_name="Original Question", required=True)]
    outputs = [Output(display_name="Retry Queue", name="result", type_=DataFrame, method="build_queue")]

    @staticmethod
    def _text(value):
        return value.text if hasattr(value, "text") else str(value or "")

    def build_queue(self) -> DataFrame:
        question = self._text(self.original_question)
        return DataFrame([Data(text=question) for _ in range(1000)])
`;

const questionSeed = clone(collector);
questionSeed.id = "RetryQuestionSeed-main";
questionSeed.position = {x: -880, y: 470};
questionSeed.data.id = questionSeed.id;
questionSeed.data.type = "RetryQuestionSeed";
questionSeed.data.node.type = "RetryQuestionSeed";
questionSeed.data.node.display_name = "Prepare Original Question";
questionSeed.data.node.description = "Prepare the original question for the built-in Langflow loop.";
const seedOldTemplate = questionSeed.data.node.template;
const seedOriginalQuestion = clone(seedOldTemplate.original_request);
seedOriginalQuestion.name = "original_question";
seedOriginalQuestion.display_name = "Original Question";
questionSeed.data.node.field_order = ["original_question", "code"];
questionSeed.data.node.template = {
  _type: "Component",
  code: {...clone(seedOldTemplate.code), value: seedCode},
  original_question: seedOriginalQuestion,
};
questionSeed.data.node.outputs = [
  {allows_loop: false, cache: true, display_name: "Retry Queue", group_outputs: false, hidden: null, loop_types: null, method: "build_queue", name: "result", options: null, required_inputs: null, selected: "DataFrame", tool_mode: true, types: ["DataFrame"], value: "__UNDEFINED__"},
];
flow.data.nodes.push(questionSeed);

const questionLoop = clone(collector);
questionLoop.id = "LoopComponent-retry";
questionLoop.position = {x: -650, y: 470};
questionLoop.data.id = questionLoop.id;
questionLoop.data.type = "LoopComponent";
questionLoop.data.node = clone(componentCatalog.flow_controls.LoopComponent);
questionLoop.data.node.type = "LoopComponent";
questionLoop.data.node.display_name = "Retry Original Question";
questionLoop.data.node.description = "Emit the original question once, then emit it again only when the vote result is RETRY.";
flow.data.nodes.push(questionLoop);

const dataToMessageCode = `from lfx.custom.custom_component.component import Component
from lfx.io import DataInput, Output
from lfx.schema.message import Message


class RetryQuestionMessage(Component):
    display_name = "Question for Workers"
    description = "Convert the loop item back to the original user question."
    icon = "message-square"

    inputs = [DataInput(name="item", display_name="Loop Item", required=True)]
    outputs = [Output(display_name="Question", name="result", type_=Message, method="to_message")]

    def to_message(self) -> Message:
        text = getattr(self.item, "text", "")
        return Message(text=str(text or ""))
`;

const questionMessage = clone(collector);
questionMessage.id = "RetryQuestionMessage-main";
questionMessage.position = {x: -420, y: 470};
questionMessage.data.id = questionMessage.id;
questionMessage.data.type = "RetryQuestionMessage";
questionMessage.data.node.type = "RetryQuestionMessage";
questionMessage.data.node.display_name = "Question for Workers";
questionMessage.data.node.description = "Convert each built-in Loop item to the original user question for all workers.";
const messageOldTemplate = questionMessage.data.node.template;
const loopItem = clone(messageOldTemplate.original_request);
loopItem.name = "item";
loopItem.display_name = "Loop Item";
loopItem.input_types = ["Data"];
loopItem.type = "other";
questionMessage.data.node.field_order = ["item", "code"];
questionMessage.data.node.template = {
  _type: "Component",
  code: {...clone(messageOldTemplate.code), value: dataToMessageCode},
  item: loopItem,
};
questionMessage.data.node.outputs = [
  {allows_loop: false, cache: true, display_name: "Question", group_outputs: false, hidden: null, loop_types: null, method: "to_message", name: "result", options: null, required_inputs: null, selected: "Message", tool_mode: true, types: ["Message"], value: "__UNDEFINED__"},
];
flow.data.nodes.push(questionMessage);

const stripCode = `from lfx.custom.custom_component.component import Component
from lfx.io import MessageTextInput, Output
from lfx.schema.message import Message


class StripPassMarker(Component):
    display_name = "Remove PASS Marker"
    description = "Remove the routing marker before displaying the approved answer."
    icon = "eraser"

    inputs = [MessageTextInput(name="approved_answer", display_name="Approved Answer", required=True)]
    outputs = [Output(display_name="Final Answer", name="result", type_=Message, method="clean")]

    @staticmethod
    def _text(value):
        return value.text if hasattr(value, "text") else str(value or "")

    def clean(self) -> Message:
        text = self._text(self.approved_answer).lstrip()
        if text.startswith("PASS"):
            text = text[4:].lstrip("\\n: ")
        return Message(text=text)
`;

const stripMarker = clone(collector);
stripMarker.id = "StripPassMarker-main";
stripMarker.position = {x: 1760, y: 350};
stripMarker.data.id = stripMarker.id;
stripMarker.data.type = "StripPassMarker";
stripMarker.data.node.type = "StripPassMarker";
stripMarker.data.node.display_name = "Remove PASS Marker";
stripMarker.data.node.description = "Remove only the PASS routing marker before Chat Output.";
const stripOldTemplate = stripMarker.data.node.template;
const approvedAnswer = clone(stripOldTemplate.candidate_1);
approvedAnswer.name = "approved_answer";
approvedAnswer.display_name = "Approved Answer";
stripMarker.data.node.field_order = ["approved_answer", "code"];
stripMarker.data.node.template = {
  _type: "Component",
  code: {...clone(stripOldTemplate.code), value: stripCode},
  approved_answer: approvedAnswer,
};
stripMarker.data.node.outputs = [
  {allows_loop: false, cache: true, display_name: "Final Answer", group_outputs: false, hidden: null, loop_types: null, method: "clean", name: "result", options: null, required_inputs: null, selected: "Message", tool_mode: true, types: ["Message"], value: "__UNDEFINED__"},
];
flow.data.nodes.push(stripMarker);

chatInput.position = {x: -1100, y: 470};
collector.position = {x: 750, y: 470};
voteAgent.position = {x: 1100, y: 470};
chatOutput.position = {x: 1850, y: 350};

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

flow.data.edges = flow.data.edges.filter((edge) =>
  !(edge.source === voteAgent.id && edge.target === chatOutput.id)
  && !(edge.source === chatInput.id && workerIds.includes(edge.target))
);
flow.data.edges.push(
  makeEdge(chatInput, questionSeed, "message", "ChatInput", ["Message"], "original_question", ["Message"], "str"),
  makeEdge(questionSeed, questionLoop, "result", "RetryQuestionSeed", ["DataFrame"], "data", ["DataFrame"], "other"),
  makeEdge(questionLoop, questionMessage, "item", "LoopComponent", ["Data"], "item", ["Data"], "other"),
  ...workerIds.map((workerId) => makeEdge(questionMessage, findNode(workerId), "result", "RetryQuestionMessage", ["Message"], "input_value", ["Message"], "str")),
  makeEdge(voteAgent, router, "response", "Agent", ["Message"], "input_text", ["Message"], "str"),
  makeEdge(voteAgent, router, "response", "Agent", ["Message"], "true_case_message", ["Message"], "str"),
  makeEdge(chatInput, router, "message", "ChatInput", ["Message"], "false_case_message", ["Message"], "str"),
  makeEdge(router, stripMarker, "true_result", "ConditionalRouter", ["Message"], "approved_answer", ["Message"], "str"),
  makeEdge(stripMarker, chatOutput, "result", "StripPassMarker", ["Message"], "input_value", ["Data", "DataFrame", "Message"], "other"),
);

const retrySourceHandle = {dataType: "ConditionalRouter", id: router.id, name: "false_result", output_types: ["Message"]};
// A loop-back target is not a normal input handle. Langflow 1.7.3 validates it
// against both the Loop output type (Data) and the declared loop type (Message).
const retryTargetHandle = {dataType: "LoopComponent", id: questionLoop.id, name: "item", output_types: ["Data", "Message"]};
flow.data.edges.push({
  animated: false,
  className: "",
  data: {sourceHandle: retrySourceHandle, targetHandle: retryTargetHandle},
  id: `xy-edge__${router.id}${encoded(retrySourceHandle)}-${questionLoop.id}${encoded(retryTargetHandle)}`,
  selected: false,
  source: router.id,
  sourceHandle: encoded(retrySourceHandle),
  target: questionLoop.id,
  targetHandle: encoded(retryTargetHandle),
});

for (const node of flow.data.nodes) node.data.id = node.id;

fs.writeFileSync(outputPath, JSON.stringify(flow, null, 2) + "\n");
console.log(`Wrote ${outputPath}`);
