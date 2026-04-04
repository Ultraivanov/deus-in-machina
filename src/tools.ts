import { WorkflowEngine } from "./engine.js";
import { InMemoryStore } from "./state.js";

export const store = new InMemoryStore();
export const engine = new WorkflowEngine(store);

export const tools = [
  {
    name: "initialize_project",
    description: "Create a new project and initial phase/block/task structure.",
    inputSchema: {
      type: "object",
      properties: {
        idea: { type: "string" },
        repo_summary: { type: "string" },
        repo_url: { type: "string" },
        skill_level: { type: "string" },
        constraints: { type: "array", items: { type: "string" } },
        repo_root: { type: "string" }
      },
      required: ["idea"]
    }
  },
  {
    name: "get_project_state",
    description: "Return current workflow state.",
    inputSchema: {
      type: "object",
      properties: { project_id: { type: "string" } },
      required: ["project_id"]
    }
  },
  {
    name: "get_next_step",
    description: "Return the next recommended task and explanation.",
    inputSchema: {
      type: "object",
      properties: { project_id: { type: "string" } },
      required: ["project_id"]
    }
  },
  {
    name: "generate_agent_prompt",
    description: "Generate a bounded agent prompt for a task.",
    inputSchema: {
      type: "object",
      properties: {
        project_id: { type: "string" },
        task_id: { type: "string" },
        assistant: { type: "string" }
      },
      required: ["project_id", "task_id", "assistant"]
    }
  },
  {
    name: "start_session",
    description: "Create a session after Change Plan approval.",
    inputSchema: {
      type: "object",
      properties: {
        project_id: { type: "string" },
        task_id: { type: "string" },
        assistant: { type: "string" },
        prompt_snapshot: { type: "string" },
        change_plan: { type: "object" },
        change_plan_approved: { type: "boolean" },
        repo_root: { type: "string" }
      },
      required: ["project_id", "task_id", "assistant", "prompt_snapshot", "change_plan", "change_plan_approved"]
    }
  },
  {
    name: "submit_agent_result",
    description: "Submit summary and changed files.",
    inputSchema: {
      type: "object",
      properties: {
        session_id: { type: "string" },
        summary: { type: "string" },
        changed_files: { type: "array", items: { type: "string" } },
        repo_root: { type: "string" }
      },
      required: ["session_id", "summary", "changed_files"]
    }
  },
  {
    name: "validate_scope",
    description: "Validate changed files against allowed scope.",
    inputSchema: {
      type: "object",
      properties: {
        session_id: { type: "string" },
        allowed_files: { type: "array", items: { type: "string" } },
        changed_files: { type: "array", items: { type: "string" } }
      },
      required: ["session_id", "allowed_files", "changed_files"]
    }
  },
  {
    name: "explain_changes",
    description: "Explain what changed in plain language.",
    inputSchema: {
      type: "object",
      properties: { session_id: { type: "string" } },
      required: ["session_id"]
    }
  },
  {
    name: "complete_task",
    description: "Mark task complete after DoD checks.",
    inputSchema: {
      type: "object",
      properties: {
        task_id: { type: "string" },
        session_id: { type: "string" },
        definition_of_done_checks: { type: "object" },
        repo_root: { type: "string" }
      },
      required: ["task_id", "session_id", "definition_of_done_checks"]
    }
  }
];

export function handleToolCall(name: string, args: Record<string, unknown>) {
  switch (name) {
    case "initialize_project":
      return engine.initializeProject(args as any);
    case "get_project_state":
      return engine.getProjectState(args.project_id as string);
    case "get_next_step":
      return engine.getNextStep(args.project_id as string);
    case "generate_agent_prompt":
      return engine.generateAgentPrompt(
        args.project_id as string,
        args.task_id as string,
        args.assistant as string
      );
    case "start_session":
      if (!args.change_plan_approved) return { error: "CHANGE_PLAN_NOT_APPROVED" };
      return engine.startSession(
        args.project_id as string,
        args.task_id as string,
        args.assistant as string,
        args.prompt_snapshot as string,
        (args.change_plan as Record<string, unknown>) ?? {},
        args.repo_root as string | undefined
      );
    case "submit_agent_result":
      return engine.submitAgentResult(
        args.session_id as string,
        args.summary as string,
        (args.changed_files as string[]) ?? [],
        args.repo_root as string | undefined
      );
    case "validate_scope":
      return engine.validateScope(
        args.session_id as string,
        (args.allowed_files as string[]) ?? [],
        (args.changed_files as string[]) ?? []
      );
    case "explain_changes":
      return engine.explainChanges(args.session_id as string);
    case "complete_task":
      return engine.completeTask(
        args.task_id as string,
        args.session_id as string,
        (args.definition_of_done_checks as Record<string, boolean>) ?? {},
        args.repo_root as string | undefined
      );
    default:
      return { error: "UNKNOWN_TOOL" };
  }
}
