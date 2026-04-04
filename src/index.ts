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
  const payload =
    result ??
    ({
      error: {
        code: "INTERNAL_ERROR",
        message: "No response returned by tool handler.",
        retryable: true
      }
    } as const);

  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(payload)
      }
    ]
  };
});

const transport = new StdioServerTransport();
await server.connect(transport);
