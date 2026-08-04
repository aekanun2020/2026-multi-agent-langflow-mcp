import json
import sys
import time
import urllib.request
import uuid


FLOW_ID = "8279ebb2-2592-4557-8b3e-963402aff62e"
URL = f"http://127.0.0.1:7860/api/v1/run/{FLOW_ID}"


def load_questions(path):
    questions = []
    with open(path, encoding="utf-8") as handle:
        for line in handle:
            line = line.strip()
            if line.startswith("Q") and ":" in line:
                label, question = line.split(":", 1)
                if label[1:].isdigit():
                    questions.append((label, question.strip()))
    return questions


def extract_text(payload):
    try:
        return payload["outputs"][0]["outputs"][0]["results"]["message"]["text"]
    except (KeyError, IndexError, TypeError):
        return json.dumps(payload, ensure_ascii=False)


questions = load_questions(sys.argv[1])
if len(sys.argv) > 2:
    questions = questions[: int(sys.argv[2])]

for label, question in questions:
    session_id = f"hard10-{label.lower()}-{uuid.uuid4().hex[:8]}"
    body = json.dumps(
        {
            "input_value": question,
            "input_type": "chat",
            "output_type": "chat",
            "session_id": session_id,
            "tweaks": {
                "Agent-ycwYQ": {
                    "system_prompt": (
                        "BENCHMARK SAFE MODE: สรุป consensus report เป็นภาษาไทยเท่านั้น "
                        "ห้ามเรียก tool หรือดำเนินการภายนอกทุกชนิด ไม่ว่าผล consensus จะเป็นอะไร"
                    ),
                    "max_iterations": 1,
                    "add_current_date_tool": False,
                }
            },
        },
        ensure_ascii=False,
    ).encode("utf-8")
    request = urllib.request.Request(
        URL, data=body, headers={"Content-Type": "application/json"}
    )
    started = time.monotonic()
    try:
        with urllib.request.urlopen(request, timeout=240) as response:
            raw = response.read()
            status = response.status
            content_type = response.headers.get("Content-Type", "")
        if not raw:
            raise RuntimeError(f"empty HTTP response: status={status}, content_type={content_type}")
        try:
            payload = json.loads(raw)
        except json.JSONDecodeError as exc:
            preview = raw.decode("utf-8", errors="replace")[:500]
            raise RuntimeError(
                f"non-JSON HTTP response: status={status}, content_type={content_type}, body={preview!r}"
            ) from exc
        text = extract_text(payload)
        result = {
            "question": label,
            "elapsed_seconds": round(time.monotonic() - started, 2),
            "answer": text,
        }
    except Exception as exc:
        result = {
            "question": label,
            "elapsed_seconds": round(time.monotonic() - started, 2),
            "error": f"{type(exc).__name__}: {exc}",
        }
    print(json.dumps(result, ensure_ascii=False), flush=True)
