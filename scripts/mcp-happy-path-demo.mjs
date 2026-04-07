import { spawn } from "node:child_process";
import readline from "node:readline";

const server = spawn("node", ["dist/index.js"], {
  cwd: process.cwd(),
  stdio: ["pipe", "pipe", "inherit"]
});

const rl = readline.createInterface({ input: server.stdout });
const pending = new Map();
let nextId = 1;

const readJson = (line) => {
  try {
    return JSON.parse(line);
  } catch {
    return null;
  }
};

rl.on("line", (line) => {
  const payload = readJson(line);
  if (!payload) return;
  if (payload.type === "telemetry") return;
  const id = payload.id;
  if (!id) return;
  const resolver = pending.get(id);
  if (!resolver) return;
  pending.delete(id);
  resolver(payload);
});

const call = (method, params) =>
  new Promise((resolve) => {
    const id = nextId++;
    pending.set(id, resolve);
    const message = JSON.stringify({ jsonrpc: "2.0", id, method, params });
    server.stdin.write(`${message}\n`);
  });

const unwrapText = (response) => {
  const result = response.result;
  if (!result?.content?.[0]?.text) return null;
  try {
    return JSON.parse(result.content[0].text);
  } catch {
    return result.content[0].text;
  }
};

const logStep = (title, value) => {
  console.log(`\n=== ${title} ===`);
  console.log(JSON.stringify(value, null, 2));
};

const main = async () => {
  const list = await call("tools/list", {});
  logStep("tools/list", list.result);

  const init = await call("tools/call", {
    name: "initialize_project",
    arguments: {
      idea: "Buildrail MCP happy-path demo",
      repo_root: ".",
      user_id: "user_demo"
    }
  });
  const initPayload = unwrapText(init);
  logStep("initialize_project", initPayload);

  const projectId = initPayload?.project_id;
  const taskId = initPayload?.current_step?.task_id;
  if (!projectId || !taskId) throw new Error("Missing project_id/task_id from initialize_project.");

  const next = await call("tools/call", {
    name: "get_next_step",
    arguments: {
      project_id: projectId,
      user_id: "user_demo"
    }
  });
  const nextPayload = unwrapText(next);
  logStep("get_next_step", nextPayload);

  const prompt = await call("tools/call", {
    name: "generate_agent_prompt",
    arguments: {
      project_id: projectId,
      task_id: taskId,
      assistant: "codex",
      user_id: "user_demo"
    }
  });
  const promptPayload = unwrapText(prompt);
  logStep("generate_agent_prompt", promptPayload);

  const promptSnapshot = promptPayload?.prompt ?? "Demo prompt";
  const start = await call("tools/call", {
    name: "start_session",
    arguments: {
      project_id: projectId,
      task_id: taskId,
      assistant: "codex",
      prompt_snapshot: promptSnapshot,
      change_plan: {
        files_to_modify: [],
        files_to_create: ["scripts/mcp-happy-path-demo.mjs"],
        files_not_touched: "everything else in scope",
        approach: "Run the MCP happy path demo.",
        risks: "Low"
      },
      change_plan_approved: true,
      user_id: "user_demo"
    }
  });
  const startPayload = unwrapText(start);
  logStep("start_session", startPayload);

  const sessionId = startPayload?.session_id;
  if (!sessionId) throw new Error("Missing session_id from start_session.");

  const submit = await call("tools/call", {
    name: "submit_agent_result",
    arguments: {
      session_id: sessionId,
      summary: "Simulated MCP happy-path changes.",
      changed_files: ["scripts/mcp-happy-path-demo.mjs"],
      user_id: "user_demo"
    }
  });
  logStep("submit_agent_result", unwrapText(submit));

  const scope = await call("tools/call", {
    name: "validate_scope",
    arguments: {
      session_id: sessionId,
      changed_files: ["scripts/mcp-happy-path-demo.mjs"],
      project_id: projectId,
      task_id: taskId,
      user_id: "user_demo"
    }
  });
  const scopePayload = unwrapText(scope);
  logStep("validate_scope", scopePayload);

  if (scopePayload?.validation_status === "needs_approval") {
    const approve = await call("tools/call", {
      name: "approve_scope_override",
      arguments: {
        session_id: sessionId,
        approved_files: ["scripts/mcp-happy-path-demo.mjs"],
        reason: "Demo: approve high-risk or missing allowlist scope.",
        user_id: "user_demo"
      }
    });
    logStep("approve_scope_override", unwrapText(approve));
  }

  const explain = await call("tools/call", {
    name: "explain_changes",
    arguments: {
      session_id: sessionId,
      project_id: projectId,
      task_id: taskId,
      user_id: "user_demo"
    }
  });
  logStep("explain_changes", unwrapText(explain));

  const complete = await call("tools/call", {
    name: "complete_task",
    arguments: {
      task_id: taskId,
      session_id: sessionId,
      definition_of_done_checks: {
        "First screen renders": true,
        "Scope limited to allowed files": true
      },
      user_id: "user_demo"
    }
  });
  logStep("complete_task", unwrapText(complete));

  server.kill();
  rl.close();
};

main().catch((error) => {
  console.error(error);
  server.kill();
  process.exit(1);
});
