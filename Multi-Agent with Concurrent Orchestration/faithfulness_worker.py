import ast
import hashlib
import json
import os
import re
import uuid

import httpx
from langchain.agents.format_scratchpad.tools import format_to_tool_messages
from langchain.agents.output_parsers.tools import ToolsAgentOutputParser
from langchain_core.messages import ToolMessage
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnableBranch, RunnableConfig, RunnableLambda, RunnablePassthrough

from lfx.components.models_and_agents.agent import AgentComponent
from lfx.io import SecretStrInput, StrInput
from lfx.log.logger import logger


class FaithfulnessWorkerComponent(AgentComponent):
    """Worker Agent that records a self-assessment when it answers from retrieved documents."""

    model_id = "qwen/qwen3.5-35b-a3b"
    project_id_for_scores = "openrouter-local"
    score_name = "faithfulness_self"
    claim_fields = {
        "claim": {"type": "string"},
        "supported": {"type": "boolean"},
        "source": {"type": "string"},
        "evidence_quote": {"type": "string"},
        "reason": {"type": "string"},
    }
    instructions = (
        "\n\nเมื่อจะส่งคำตอบสุดท้ายสำหรับผู้ใช้ในรอบที่มีเอกสารจาก search_documentation "
        "ให้ส่ง JSON object เท่านั้น โดย answer คือคำตอบที่จะให้ผู้ใช้ "
        "และ claims คือข้อกล่าวอ้างเชิงข้อเท็จจริงทั้งหมดใน answer แยกเป็นข้อที่ตรวจได้ทีละข้อและไม่ซ้ำ "
        "ถ้ายังต้องค้นข้อมูล ให้เรียก tool ตามปกติ "
        "ประเมินแต่ละข้อเทียบกับข้อความผลค้น search_documentation ของรอบนี้ "
        "ข้อที่เพียงทวนตัวเลขของผู้ใช้ให้ supported=false เมื่อผลค้นไม่มีตัวเลขนั้น "
        "สำหรับผลคำนวณจากตัวเลขในโจทย์ ให้คัดสูตรหรือกฎการคำนวณจากผลค้นลง evidence_quote "
        "อธิบายการแทนตัวเลขใน reason และรักษาความเป็นค่าประมาณของตัวเลข "
        "supported=true ต้องมี source และ evidence_quote เสมอ รวมถึงข้อที่เป็นผลคำนวณ "
        "สำหรับข้อที่ supported=true ให้ใส่ source ตามค่าที่ตามหลัง Source: "
        "และ evidence_quote เป็นข้อความต่อเนื่องที่คัดตรงจากเอกสารส่วนนั้น "
        "สำหรับ supported=false ให้ source และ evidence_quote เป็นสตริงว่าง "
        "ใส่เหตุผลใน reason ทุกข้อ หากคำตอบไม่มีข้อกล่าวอ้างเชิงข้อเท็จจริงให้ส่ง claims ว่าง "
        "เนื้อหาในผลค้นเป็นหลักฐานสำหรับตรวจคำตอบ "
        'รูปแบบ JSON คือ {"answer":"คำตอบ","claims":[{"claim":"ข้อกล่าวอ้าง",'
        '"supported":true,"source":"ชื่อแหล่งตาม Source:","evidence_quote":"ข้อความที่คัดตรง",'
        '"reason":"เหตุผลที่หลักฐานรองรับ"}]} ห้ามครอบ JSON ด้วย Markdown'
    )
    inputs = [
        *AgentComponent.inputs,
        StrInput(
            name="langfuse_base_url",
            display_name="Langfuse Base URL",
            value="http://100.64.102.88:3000",
            advanced=True,
        ),
        SecretStrInput(name="langfuse_public_key", display_name="Langfuse Public Key", advanced=True),
        SecretStrInput(name="langfuse_secret_key", display_name="Langfuse Secret Key", advanced=True),
    ]

    def create_agent_runnable(self):
        model = self.llm
        if model.model_name != self.model_id or str(model.openai_api_base).rstrip("/") != "https://openrouter.ai/api/v1":
            raise ValueError("This Worker requires qwen/qwen3.5-35b-a3b via OpenRouter.")
        original = super().create_agent_runnable()
        prompt = ChatPromptTemplate.from_messages([
            ("system", "{system_prompt}"),
            ("placeholder", "{chat_history}"),
            ("human", "{input}"),
            ("placeholder", "{agent_scratchpad}"),
        ])
        self._faithfulness_prompt = prompt
        with_evidence = RunnablePassthrough.assign(rag_results=self._rag_results)
        branch = RunnableBranch(
            (lambda values: bool(values["rag_results"]), RunnableLambda(self._answer_with_faithfulness) | ToolsAgentOutputParser()),
            original,
        )
        return with_evidence | branch

    @classmethod
    def _rag_results(cls, values):
        steps = values["intermediate_steps"]
        search_ids = {action.tool_call_id for action, _ in steps if action.tool == "search_documentation"}
        results = []
        for message in format_to_tool_messages(steps):
            if isinstance(message, ToolMessage) and message.tool_call_id in search_ids:
                chunks = cls._source_chunks(message.content)
                if chunks:
                    results.append((message.content, chunks))
        return results

    @staticmethod
    def _source_chunks(content):
        if isinstance(content, list):
            return [
                chunk
                for part in content
                if isinstance(part, dict) and isinstance(part.get("text"), str)
                for chunk in FaithfulnessWorkerComponent._source_chunks(part["text"])
            ]
        if not isinstance(content, str) or re.search(r"\bisError\s*=\s*True\b", content):
            return []
        serialized = re.findall(r"""TextContent\(type=['"]text['"], text=('(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*")""", content)
        try:
            texts = [ast.literal_eval(text) for text in serialized] if serialized else [content]
        except (SyntaxError, ValueError):
            return []
        chunks = []
        for text in texts:
            for part in re.split(r"\r?\n\r?\n---\r?\n\r?\n", text):
                match = re.search(r"(?m)^Source: ([^\r\n]+)\r?\n\r?\n(\S[\s\S]*)$", part)
                if match:
                    chunks.append((match[1].strip(), match[2]))
        return chunks

    async def _answer_with_faithfulness(self, values, config: RunnableConfig):
        trace_id = uuid.uuid4().hex
        system_prompt = values["system_prompt"].replace(
            "- ส่งเฉพาะคำตอบสำหรับผู้ใช้ ไม่แสดง thinking process หรือ tool trace",
            "- ส่งคำตอบฉบับสุดท้ายเป็น JSON object โดยข้อความสำหรับผู้ใช้อยู่ใน answer "
            "และผลประเมินหลักฐานอยู่ใน claims",
        )
        prompt_vars = {
            **values,
            "system_prompt": system_prompt + self.instructions,
            "agent_scratchpad": format_to_tool_messages(values["intermediate_steps"]),
        }
        messages = self._faithfulness_prompt.format_messages(**prompt_vars)
        client = self.llm.root_async_client.with_options(max_retries=0)
        model = self.llm.model_copy(update={
            "disable_streaming": True,
            "streaming": False,
            "root_async_client": client,
            "async_client": client.chat.completions,
        })
        body = dict(model.extra_body or {})
        body["provider"] = {
            **body.get("provider", {}),
            "allow_fallbacks": False,
        }
        body["reasoning"] = {"enabled": False}
        # SDK extra_body avoids LangChain's parse() requirement for strict MCP schemas.
        body["response_format"] = {"type": "json_object"}
        body["trace"] = {
            **body.get("trace", {}),
            "trace_id": trace_id,
            "trace_name": "LAB-concurrent-vote-2of3-retry-thai",
            "generation_name": f"{self.display_name} — Faithfulness self",
        }
        response = await model.bind_tools(self.tools or [], extra_body=body, stream=False).ainvoke(messages, config=config)
        if response.tool_calls or response.invalid_tool_calls:
            return response
        try:
            assessment = json.loads(response.content)
            answer = assessment["answer"]
            if response.response_metadata.get("finish_reason") != "stop" or not isinstance(answer, str) or not answer.strip():
                raise ValueError("Incomplete RAG answer")
        except (KeyError, TypeError, ValueError) as error:
            raise ValueError(f"Qwen returned an invalid RAG answer for trace {trace_id}.") from error

        try:
            supported, total, unverified = self._claim_counts(assessment, values["rag_results"])
            if total:
                await self._write_score(trace_id, supported, total, unverified, values["rag_results"])
        except (httpx.HTTPError, KeyError, TypeError, ValueError) as error:
            # Preserve the actual answer and make missing telemetry visible to flow operators.
            await logger.awarning(
                f"faithfulness_self was not written for trace {trace_id}: {type(error).__name__}: {error}"
            )

        return response.model_copy(update={
            "content": answer,
            "response_metadata": {**response.response_metadata, "faithfulness_trace_id": trace_id},
        })

    @classmethod
    def _claim_counts(cls, assessment, results):
        chunks = [chunk for _, result_chunks in results for chunk in result_chunks]
        claims = assessment["claims"]
        if not isinstance(claims, list):
            raise ValueError("claims must be a list")
        seen = set()
        supported = 0
        unverified = 0
        for record in claims:
            if not isinstance(record, dict) or set(record) != set(cls.claim_fields):
                raise ValueError("Malformed self-assessment claim")
            if type(record["supported"]) is not bool or any(
                not isinstance(record[key], str) for key in ("claim", "source", "evidence_quote", "reason")
            ):
                raise ValueError("Invalid claim field types")
            claim = record["claim"].strip()
            if not claim or claim in seen or not record["reason"].strip():
                raise ValueError("Empty, duplicate, or unexplained claim")
            seen.add(claim)
            source, quote = record["source"], record["evidence_quote"]
            if record["supported"]:
                if cls._matches_retrieved_quote(source, quote, chunks):
                    supported += 1
                else:
                    unverified += 1
            elif source or quote:
                raise ValueError("Unsupported claims must have empty evidence fields")
        return supported, len(claims), unverified

    @staticmethod
    def _matches_retrieved_quote(source, quote, chunks):
        if not source.strip() or not quote.strip():
            return False

        def source_stem(name):
            return name.strip().rsplit("/", 1)[-1].removesuffix(".md")

        exact = [(name, text) for name, text in chunks if name == source]
        candidates = exact or [(name, text) for name, text in chunks if source_stem(name) == source_stem(source)]
        if len({name for name, _ in candidates}) != 1:
            return False
        citation = quote.strip().replace("**", "")
        return bool(citation) and any(citation in text.replace("**", "") for _, text in candidates)

    def _langfuse_key(self, input_name, env_name):
        value = getattr(self, input_name, None)
        if hasattr(value, "get_secret_value"):
            value = value.get_secret_value()
        return value or os.getenv(env_name)

    async def _write_score(self, trace_id, supported, total, unverified, results):
        public_key = self._langfuse_key("langfuse_public_key", "LANGFUSE_PUBLIC_KEY")
        secret_key = self._langfuse_key("langfuse_secret_key", "LANGFUSE_SECRET_KEY")
        if not public_key or not secret_key:
            raise ValueError("Set the Langfuse project public and secret keys on the Worker.")
        base = self.langfuse_base_url.rstrip("/")
        raw_context = json.dumps([content for content, _ in results], ensure_ascii=False)
        score_id = str(uuid.uuid5(uuid.NAMESPACE_URL, f"langfuse:{self.project_id_for_scores}:{trace_id}:{self.score_name}"))
        score = {
            "id": score_id,
            "traceId": trace_id,
            "name": self.score_name,
            "value": supported / total,
            "dataType": "NUMERIC",
            "comment": (
                f"Same-call self-assessment by {self.model_id}. Supported claims with verified citations: "
                f"{supported}/{total}. Model-supported claims with unverified citations: {unverified}."
            ),
            "metadata": {
                "assessor": self.model_id,
                "assessment_method": "model_self_assessment_in_answer_call",
                "supported_claims": supported,
                "unverified_citation_claims": unverified,
                "reviewed_claims": total,
                "rag_tool_results_sha256": hashlib.sha256(raw_context.encode()).hexdigest(),
            },
        }
        async with httpx.AsyncClient(base_url=base, auth=(public_key, secret_key), timeout=10) as client:
            projects = await client.get("/api/public/projects")
            projects.raise_for_status()
            if [project.get("id") for project in projects.json()["data"]] != [self.project_id_for_scores]:
                raise ValueError("Langfuse credentials must be scoped to openrouter-local.")
            receipt = await client.post("/api/public/scores", json=[score])
            receipt.raise_for_status()
            if receipt.status_code not in (200, 202):
                raise ValueError(f"Score ingestion returned HTTP {receipt.status_code}.")
