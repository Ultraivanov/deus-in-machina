import { WorkflowEngine } from "./engine.js";
import { applyMonetization } from "./monetization/enforce.js";
import type { SqliteStore } from "./storage/sqlite.js";
import { makeError } from "./errors.js";
import { track } from "./telemetry.js";
import { loadTemplate } from "./templates/loader.js";

const monetizationContextSchema = {
  user_id: { type: "string" },
  subscription: {
    type: "object",
    properties: {
      user_id: { type: "string" },
      plan: { type: "string", enum: ["free", "pro"] },
      status: { type: "string", enum: ["active", "past_due", "canceled", "paused"] },
      sessions_used: { type: "number" },
      project_count: { type: "number" }
    },
    required: []
  }
};

export const tools = [
  {
    name: "initialize_project",
    description: "Create a new project and initial phase/block/task structure.",
    inputSchema: {
      type: "object",
      properties: {
        ...monetizationContextSchema,
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
      properties: { ...monetizationContextSchema, project_id: { type: "string" } },
      required: ["project_id"]
    }
  },
  {
    name: "get_next_step",
    description: "Return the next recommended task and explanation.",
    inputSchema: {
      type: "object",
      properties: { ...monetizationContextSchema, project_id: { type: "string" } },
      required: ["project_id"]
    }
  },
  {
    name: "generate_agent_prompt",
    description: "Generate a bounded agent prompt for a task.",
    inputSchema: {
      type: "object",
      properties: {
        ...monetizationContextSchema,
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
        ...monetizationContextSchema,
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
        ...monetizationContextSchema,
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
        ...monetizationContextSchema,
        session_id: { type: "string" },
        allowed_files: { type: "array", items: { type: "string" } },
        changed_files: { type: "array", items: { type: "string" } }
      },
      required: ["session_id", "changed_files"]
    }
  },
  {
    name: "explain_changes",
    description: "Explain what changed in plain language.",
    inputSchema: {
      type: "object",
      properties: { ...monetizationContextSchema, session_id: { type: "string" } },
      required: ["session_id"]
    }
  },
  {
    name: "complete_task",
    description: "Mark task complete after DoD checks.",
    inputSchema: {
      type: "object",
      properties: {
        ...monetizationContextSchema,
        task_id: { type: "string" },
        session_id: { type: "string" },
        definition_of_done_checks: { type: "object" },
        repo_root: { type: "string" }
      },
      required: ["task_id", "session_id", "definition_of_done_checks"]
    }
  },
  {
    name: "approve_scope_override",
    description: "Explicitly approve out-of-scope files for a session.",
    inputSchema: {
      type: "object",
      properties: {
        ...monetizationContextSchema,
        session_id: { type: "string" },
        approved_files: { type: "array", items: { type: "string" } },
        reason: { type: "string" }
      },
      required: ["session_id", "approved_files"]
    }
  },
  {
    name: "get_workflow_template",
    description: "Return a workflow template by name.",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string" }
      },
      required: ["name"]
    }
  }
];

export const createToolRouter = (engine: WorkflowEngine, sqliteStore?: SqliteStore) => {
  const loadSubscription = sqliteStore
    ? (args: Record<string, unknown>) => {
        const userId =
          (typeof args.user_id === "string" && args.user_id) ||
          (typeof (args.subscription as Record<string, unknown>)?.user_id === "string" &&
            (args.subscription as Record<string, unknown>).user_id) ||
          "anon";
        return sqliteStore.getSubscriptionSnapshot(userId);
      }
    : undefined;

  const handleToolCall = (name: string, args: Record<string, unknown>) => {
    return applyMonetization(
      name,
      args,
      () => {
      const basePayload = {
        tool: name,
        user_id: args.user_id ?? (args.subscription as any)?.user_id ?? "anon"
      };
      switch (name) {
        case "initialize_project":
          track("initialize_project", basePayload);
          return engine.initializeProject(args as any);
        case "get_project_state":
          track("get_project_state", { ...basePayload, project_id: args.project_id });
          return engine.getProjectState(args.project_id as string);
        case "get_next_step":
          track("get_next_step", { ...basePayload, project_id: args.project_id });
          return engine.getNextStep(args.project_id as string);
        case "generate_agent_prompt":
          track("generate_agent_prompt", { ...basePayload, task_id: args.task_id });
          return engine.generateAgentPrompt(
            args.project_id as string,
            args.task_id as string,
            args.assistant as string
          );
        case "start_session":
          if (!args.change_plan_approved) {
            return makeError("CHANGE_PLAN_NOT_APPROVED", "Change Plan approval is required.", false);
          }
          track("start_session", { ...basePayload, task_id: args.task_id });
          return engine.startSession(
            args.project_id as string,
            args.task_id as string,
            args.assistant as string,
            args.prompt_snapshot as string,
            (args.change_plan as Record<string, unknown>) ?? {},
            args.repo_root as string | undefined,
            args.user_id as string | undefined
          );
        case "submit_agent_result":
          track("submit_agent_result", { ...basePayload, session_id: args.session_id });
          return engine.submitAgentResult(
            args.session_id as string,
            args.summary as string,
            (args.changed_files as string[]) ?? [],
            args.repo_root as string | undefined
          );
        case "validate_scope":
          track("validate_scope", { ...basePayload, session_id: args.session_id });
          return engine.validateScope(
            args.session_id as string,
            (args.allowed_files as string[]) ?? [],
            (args.changed_files as string[]) ?? []
          );
        case "explain_changes":
          track("explain_changes", { ...basePayload, session_id: args.session_id });
          return engine.explainChanges(args.session_id as string);
        case "complete_task":
          track("complete_task", { ...basePayload, task_id: args.task_id });
          return engine.completeTask(
            args.task_id as string,
            args.session_id as string,
            (args.definition_of_done_checks as Record<string, boolean>) ?? {},
            args.repo_root as string | undefined
          );
        case "approve_scope_override":
          track("approve_scope_override", { ...basePayload, session_id: args.session_id });
          return engine.approveScopeOverride(
            args.session_id as string,
            (args.approved_files as string[]) ?? [],
            args.reason as string | undefined
          );
        case "get_workflow_template": {
          track("get_workflow_template", { ...basePayload, name: args.name });
          const template = loadTemplate(args.name as string);
          if (!template) {
            return makeError("TEMPLATE_NOT_FOUND", "Template not found.", false);
          }
          return { template };
        }
        default:
          return makeError("UNKNOWN_TOOL", `Unknown tool: ${name}`, false);
      }
      },
      { loadSubscription }
    );
  };

  return { tools, handleToolCall };
};
