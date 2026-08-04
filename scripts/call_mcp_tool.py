import asyncio
import json
import sys

from mcp import ClientSession
from mcp.client.streamable_http import streamable_http_client


async def main() -> None:
    url, tool_name, arguments_json = sys.argv[1], sys.argv[2], sys.argv[3]
    arguments = json.loads(arguments_json)
    async with streamable_http_client(url) as (read_stream, write_stream, _):
        async with ClientSession(read_stream, write_stream) as session:
            await session.initialize()
            result = await session.call_tool(tool_name, arguments)
            output = []
            for item in result.content:
                if getattr(item, "type", None) == "text":
                    output.append(item.text)
                else:
                    output.append(str(item))
            print(json.dumps({"is_error": result.isError, "content": output}, ensure_ascii=False))


if __name__ == "__main__":
    asyncio.run(main())
