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

const main = async () => {
  const init = await call("tools/call", {
    name: "initialize_project",
    arguments: {
      idea: "Upgrade flow demo",
      repo_root: ".",
      user_id: "user_demo"
    }
  });
  const payload = unwrapText(init);
  console.log(JSON.stringify(payload, null, 2));
  server.kill();
  rl.close();
};

main().catch((error) => {
  console.error(error);
  server.kill();
  process.exit(1);
});
