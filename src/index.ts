import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createToolRouter } from "./tools.js";
import { InMemoryStore } from "./state.js";
import { WorkflowEngine } from "./engine.js";
import { initSqliteStore } from "./storage/index.js";
import type { SqliteStore } from "./storage/sqlite.js";
import { buildRepoIndex } from "./repo/indexer.js";
import { makeError, ensureErrorShape } from "./errors.js";

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

const memoryStore = new InMemoryStore();
let sqliteStore: SqliteStore | undefined;
try {
  sqliteStore = initSqliteStore().store;
} catch {
  sqliteStore = undefined;
}
const engine = new WorkflowEngine(memoryStore, sqliteStore);
const { tools, handleToolCall } = createToolRouter(engine, sqliteStore);

try {
  const repoIndex = buildRepoIndex({ root: process.cwd() });
  engine.setRepoIndex(repoIndex);
} catch {
  // best-effort
}

engine.hydrateFromSqlite();

server.setRequestHandler("tools/list", async () => {
  return { tools };
});

server.setRequestHandler("tools/call", async (request) => {
  const { name, arguments: args } = request.params;
  const result = handleToolCall(name, (args ?? {}) as Record<string, unknown>);
  const payload = result ?? makeError("INTERNAL_ERROR", "No response returned by tool handler.", true);
  const safePayload =
    payload && typeof payload === "object" ? payload : ensureErrorShape(payload);

  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(safePayload)
      }
    ]
  };
});

const transport = new StdioServerTransport();
await server.connect(transport);
