import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema
} from "@modelcontextprotocol/sdk/types.js";
import { createToolRouter } from "./tools.js";
import { InMemoryStore } from "./state.js";
import { WorkflowEngine } from "./engine.js";
import { initSqliteStore } from "./storage/index.js";
import type { SqliteStore } from "./storage/sqlite.js";
import { buildRepoIndex } from "./repo/indexer.js";
import { makeError, ensureErrorShape, logError } from "./errors.js";
import { setTelemetrySink } from "./telemetry.js";
import { startStripeServer } from "./stripe/server.js";

const server = new Server(
  {
    name: "buildrail",
    version: "0.1.0"
  },
  {
    capabilities: {
      tools: {},
      resources: {},
      prompts: {}
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

const resources = [
  {
    uri: "buildrail://risk/signals",
    name: "Risk signals catalog",
    mimeType: "application/json",
    description: "List of risk signals used in risk evaluation."
  },
  {
    uri: "buildrail://workflow/overview",
    name: "Workflow overview",
    mimeType: "application/json",
    description: "High-level overview of phases, blocks, tasks."
  }
];

const prompts = [
  {
    name: "change_plan",
    description: "Generate a change plan template for the current task."
  },
  {
    name: "scope_review",
    description: "Ask the user to review and approve the change scope."
  }
];

setTelemetrySink((event) => {
  // Default sink: stdout JSON
  console.log(JSON.stringify({ type: "telemetry", ...event }));
});

startStripeServer(sqliteStore);

try {
  const repoIndex = buildRepoIndex({ root: process.cwd() });
  engine.setRepoIndex(repoIndex);
} catch {
  // best-effort
}

engine.hydrateFromSqlite();

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools };
});

server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return { resources };
});

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const uri = request.params.uri;
  if (uri === "buildrail://risk/signals") {
    const payload = {
      signals: [
        "missing_allowlist",
        "wide_scope",
        "medium_scope",
        "core_files",
        "missing_dod",
        "missing_constraints",
        "risky_intent",
        "large_project_summary"
      ]
    };
    return {
      contents: [
        {
          uri,
          mimeType: "application/json",
          text: JSON.stringify(payload, null, 2)
        }
      ]
    };
  }
  if (uri === "buildrail://workflow/overview") {
    const payload = {
      phases: ["Foundation", "Build", "Validate", "Launch"],
      blocks: ["Setup", "Core flow", "Integration", "Release"],
      tasks: ["Define scope", "Implement change", "Validate scope", "Complete task"]
    };
    return {
      contents: [
        {
          uri,
          mimeType: "application/json",
          text: JSON.stringify(payload, null, 2)
        }
      ]
    };
  }
  return {
    contents: [
      {
        uri,
        mimeType: "application/json",
        text: JSON.stringify(makeError("RESOURCE_NOT_FOUND", "Resource not found.", false))
      }
    ]
  };
});

server.setRequestHandler(ListPromptsRequestSchema, async () => {
  return { prompts };
});

server.setRequestHandler(GetPromptRequestSchema, async (request) => {
  const name = request.params.name;
  if (name === "change_plan") {
    return {
      description: "Structured change plan for scope approval.",
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text:
              "Provide a change plan with fields: files_to_modify, files_to_create, files_not_touched, approach, risks."
          }
        }
      ]
    };
  }
  if (name === "scope_review") {
    return {
      description: "Ask the user to review and approve scope changes.",
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: "Review the changed files list and approve or reject the scope."
          }
        }
      ]
    };
  }
  return {
    description: "Prompt not found.",
    messages: [
      {
        role: "user",
        content: { type: "text", text: "Prompt not found." }
      }
    ]
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  let payload: unknown;
  try {
    const result = handleToolCall(name, (args ?? {}) as Record<string, unknown>);
    payload = result ?? makeError("INTERNAL_ERROR", "No response returned by tool handler.", true);
  } catch (err) {
    logError(err, { tool: name }, { sampleRate: 1 });
    payload = makeError("INTERNAL_ERROR", "Unhandled tool error.", true);
  }
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
