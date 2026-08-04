import json
import sys
import urllib.request


base_url, design_path, folder_id = sys.argv[1:4]
with open(design_path, encoding="utf-8") as handle:
    design = json.load(handle)

payload = {
    key: design[key]
    for key in ("name", "description", "data", "is_component", "endpoint_name", "tags")
    if key in design
}
payload["folder_id"] = folder_id

request = urllib.request.Request(
    f"{base_url.rstrip('/')}/api/v1/flows/",
    data=json.dumps(payload).encode("utf-8"),
    method="POST",
    headers={"Content-Type": "application/json"},
)
with urllib.request.urlopen(request, timeout=60) as response:
    created = json.load(response)

print(json.dumps({
    "id": created["id"],
    "name": created["name"],
    "folder_id": created.get("folder_id"),
    "nodes": len(created["data"]["nodes"]),
    "edges": len(created["data"]["edges"]),
}, ensure_ascii=False))
