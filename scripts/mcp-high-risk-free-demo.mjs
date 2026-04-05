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
  const init = await call("tools/call", {
    name: "initialize_project",
    arguments: {
      idea: "High-risk free demo",
      repo_root: ".",
      user_id: "user_demo"
    }
  });
  const initPayload = unwrapText(init);
  logStep("initialize_project", initPayload);

  const projectId = initPayload?.project_id;
  const taskId = initPayload?.current_step?.task_id;
  if (!projectId || !taskId) throw new Error("Missing project_id/task_id from initialize_project.");

  const prompt = await call("tools/call", {
    name: "generate_agent_prompt",
    arguments: {
      project_id: projectId,
      task_id: taskId,
      assistant: "codex",
      user_id: "user_demo"
    }
  });
  logStep("generate_agent_prompt", unwrapText(prompt));

  const scope = await call("tools/call", {
    name: "validate_scope",
    arguments: {
      session_id: "sess_demo",
      changed_files: ["src/engine.ts"],
      project_id: projectId,
      task_id: taskId,
      user_id: "user_demo"
    }
  });
  logStep("validate_scope", unwrapText(scope));

  server.kill();
  rl.close();
};

main().catch((error) => {
  console.error(error);
  server.kill();
  process.exit(1);
});
