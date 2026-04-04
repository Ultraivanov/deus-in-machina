import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { tools, handleToolCall } from "./tools.js";

const server = new Server(
  {
    name: "buildrail",
    version: "0.1.0"
  },
  {
    capabilities: {
      tools: {}
    }
  }
);

server.setRequestHandler("tools/list", async () => {
  return { tools };
});

server.setRequestHandler("tools/call", async (request) => {
  const { name, arguments: args } = request.params;
  const result = handleToolCall(name, (args ?? {}) as Record<string, unknown>);

  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(result ?? { error: "INTERNAL_ERROR" })
      }
    ]
  };
});

const transport = new StdioServerTransport();
await server.connect(transport);
