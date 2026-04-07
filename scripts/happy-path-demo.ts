import path from "node:path";
import { fileURLToPath } from "node:url";
import { InMemoryStore } from "../src/state.js";
import { WorkflowEngine } from "../src/engine.js";

const heading = (title: string) => {
  console.log(`\n=== ${title} ===`);
};

const print = (label: string, value: unknown) => {
  console.log(`${label}:`);
  console.log(JSON.stringify(value, null, 2));
};

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const engine = new WorkflowEngine(new InMemoryStore());

heading("Initialize Project");
const init = engine.initializeProject({
  idea: "Buildrail happy path demo",
  repo_root: repoRoot
});
print("initialize_project", init);

const projectId = init.project_id;
const taskId = init.current_step?.task_id;
if (!projectId || !taskId) {
  throw new Error("Initialization failed to produce a project/task.");
}

heading("Get Next Step");
const next = engine.getNextStep(projectId);
if (!next) {
  throw new Error("No next step returned.");
}
print("get_next_step", next);

heading("Generate Agent Prompt");
const prompt = engine.generateAgentPrompt(projectId, next.task_id, "codex");
if (!prompt) {
  throw new Error("No agent prompt returned.");
}
print("generate_agent_prompt", prompt);

heading("Start Session");
const changePlan = {
  files_to_modify: [],
  files_to_create: ["scripts/happy-path-demo.ts"],
  files_not_touched: "everything else in scope",
  approach: "Run the end-to-end happy path demo.",
  risks: "None"
};
const start = engine.startSession(projectId, next.task_id, "codex", prompt.prompt, changePlan, repoRoot);
if (!start || "error" in start) {
  throw new Error(`Failed to start session: ${JSON.stringify(start)}`);
}
print("start_session", start);

heading("Submit Agent Result");
const submit = engine.submitAgentResult(
  start.session_id,
  "Simulated agent changes for happy path demo.",
  ["scripts/happy-path-demo.ts"],
  repoRoot
);
print("submit_agent_result", submit);

heading("Validate Scope");
const scope = engine.validateScope(
  start.session_id,
  ["scripts/happy-path-demo.ts"],
  ["scripts/happy-path-demo.ts"]
);
print("validate_scope", scope);

heading("Complete Task");
const complete = engine.completeTask(
  next.task_id,
  start.session_id,
  {
    "First screen renders": true,
    "Scope limited to allowed files": true
  },
  repoRoot
);
print("complete_task", complete);

heading("Explain Changes");
const explain = engine.explainChanges(start.session_id);
print("explain_changes", explain);

heading("Done");
console.log("Happy path demo complete.");
