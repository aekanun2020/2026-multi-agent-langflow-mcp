import hashlib
import json
import sys
import urllib.request


base_url, source_flow_id, target_flow_id = sys.argv[1:4]


def request_json(path, method="GET", payload=None):
    body = None if payload is None else json.dumps(payload).encode("utf-8")
    request = urllib.request.Request(
        f"{base_url.rstrip('/')}{path}",
        data=body,
        method=method,
        headers={"Content-Type": "application/json"},
    )
    with urllib.request.urlopen(request, timeout=60) as response:
        return json.load(response)


source = request_json(f"/api/v1/flows/{source_flow_id}")
target = request_json(f"/api/v1/flows/{target_flow_id}")

source_keys = {}
for node in source["data"]["nodes"]:
    value = (
        node.get("data", {})
        .get("node", {})
        .get("template", {})
        .get("api_key", {})
        .get("value", "")
    )
    if value:
        source_keys[node["id"]] = value

copied = []
for node in target["data"]["nodes"]:
    api_key = node.get("data", {}).get("node", {}).get("template", {}).get("api_key")
    if api_key is not None and node["id"] in source_keys:
        api_key["value"] = source_keys[node["id"]]
        copied.append(node["id"])

if not copied:
    raise RuntimeError("No matching API key fields were copied")

updated = request_json(
    f"/api/v1/flows/{target_flow_id}",
    method="PATCH",
    payload={"data": target["data"]},
)

fingerprints = []
for node in updated["data"]["nodes"]:
    value = (
        node.get("data", {})
        .get("node", {})
        .get("template", {})
        .get("api_key", {})
        .get("value", "")
    )
    if value:
        fingerprints.append(
            {
                "node": node["id"],
                "length": len(value),
                "sha256_prefix": hashlib.sha256(value.encode()).hexdigest()[:12],
            }
        )

print(json.dumps({"copied": copied, "fingerprints": fingerprints}, ensure_ascii=False))
