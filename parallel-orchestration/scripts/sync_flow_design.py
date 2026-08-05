import json
import sys
import urllib.request


base_url, flow_id, design_path = sys.argv[1:4]


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


target = request_json(f"/api/v1/flows/{flow_id}")
with open(design_path, encoding="utf-8") as handle:
    design = json.load(handle)

target_keys = {}
for node in target["data"]["nodes"]:
    value = (
        node.get("data", {})
        .get("node", {})
        .get("template", {})
        .get("api_key", {})
        .get("value", "")
    )
    if value:
        target_keys[node["id"]] = value

for node in design["data"]["nodes"]:
    api_key = node.get("data", {}).get("node", {}).get("template", {}).get("api_key")
    if api_key is not None and node["id"] in target_keys:
        api_key["value"] = target_keys[node["id"]]

updated = request_json(
    f"/api/v1/flows/{flow_id}",
    method="PATCH",
    payload={
        "name": design.get("name"),
        "description": design.get("description"),
        "data": design["data"],
    },
)
print(
    json.dumps(
        {
            "id": updated["id"],
            "name": updated["name"],
            "nodes": len(updated["data"]["nodes"]),
            "edges": len(updated["data"]["edges"]),
            "preserved_secret_nodes": sorted(target_keys),
        },
        ensure_ascii=False,
    )
)
