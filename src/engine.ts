import { InMemoryStore, Project, Phase, Block, Task, Session } from "./state.js";
import {
  buildPhasesMarkdown,
  buildSnapshotMarkdown,
  readActiveBlock,
  readActiveTaskFromBlock,
  readBlockTasksFromFile,
  resolveBlockFilePath,
  writePhases,
  writeSnapshot
} from "./state-files.js";

export type InitProjectInput = {
  idea: string;
  repo_summary?: string;
  repo_url?: string;
  skill_level?: string;
  constraints?: string[];
  repo_root?: string;
};

export class WorkflowEngine {
  constructor(private store: InMemoryStore) {}

  initializeProject(input: InitProjectInput) {
    const project_id = this.store.nextId("proj");
    const phase_id = this.store.nextId("phase");
    const block_id = this.store.nextId("block");
    const task_id = this.store.nextId("task");

    const project: Project = {
      id: project_id,
      summary: input.idea,
      status: "active",
      current_phase_id: phase_id,
      current_block_id: block_id,
      current_task_id: task_id
    };

    const phase: Phase = {
      id: phase_id,
      project_id,
      title: "Foundation",
      goal: "Create the first runnable product shell",
      status: "in_progress"
    };

    const block: Block = {
      id: block_id,
      phase_id,
      title: "Core Flow",
      goal: "Ship the first visible user flow",
      status: "in_progress"
    };

    const task: Task = {
      id: task_id,
      block_id,
      title: "Define the first visible screen",
      user_value: "Gives the project a concrete starting point",
      technical_goal: "Create an initial page or entry point",
      definition_of_done: [
        "First screen renders",
        "Scope limited to allowed files"
      ],
      constraints: input.constraints ?? [],
      allowed_files: [],
      status: "ready"
    };

    this.store.projects.set(project_id, project);
    this.store.phases.set(phase_id, phase);
    this.store.blocks.set(block_id, block);
    this.store.tasks.set(task_id, task);

    if (input.repo_root) {
      const phasesMd = buildPhasesMarkdown({
        activePhase: {
          phase: "MVP",
          goal: phase.goal,
          started: new Date().toISOString().slice(0, 10),
          target: "TBD"
        },
        activeBlock: {
          id: block.id,
          title: block.title,
          status: block.status,
          file: `.assistant/blocks/${block.id}.md`
        }
      });
      writePhases(input.repo_root, phasesMd).catch(() => undefined);
    }

    return {
      project_id,
      project_summary: input.idea,
      state_path: ".assistant/",
      phases: [phase],
      current_step: {
        task_id,
        title: task.title,
        why_now: task.user_value
      }
    };
  }

  getProjectState(project_id: string) {
    const project = this.store.projects.get(project_id);
    if (!project) return null;

    const phase = project.current_phase_id ? this.store.phases.get(project.current_phase_id) : undefined;
    const block = project.current_block_id ? this.store.blocks.get(project.current_block_id) : undefined;
    const task = project.current_task_id ? this.store.tasks.get(project.current_task_id) : undefined;

    const repoRoot = process.cwd();
    const activeBlock = readActiveBlock(repoRoot);
    const currentBlock = activeBlock
      ? { id: activeBlock.id, title: activeBlock.title, status: activeBlock.status }
      : block;
    let currentTask: any = task;
    if (activeBlock) {
      const blockFilePath = resolveBlockFilePath(repoRoot, activeBlock.file, activeBlock.id);
      const activeTask = readActiveTaskFromBlock(repoRoot, blockFilePath);
      if (activeTask) {
        currentTask = {
          id: activeTask.id,
          title: activeTask.title,
          status: activeTask.status
        };
      }
    }

    return {
      project_id: project.id,
      project_status: project.status,
      state_path: ".assistant/",
      current_phase: phase,
      current_block: currentBlock,
      current_task: currentTask,
      progress: {
        mvp_progress_percent: 0,
        steps_completed: 0,
        blocked: false,
        confidence: "low"
      }
    };
  }

  getNextStep(project_id: string) {
    const project = this.store.projects.get(project_id);
    if (!project || !project.current_task_id) return null;
    const task = this.store.tasks.get(project.current_task_id);

    const repoRoot = process.cwd();
    const activeBlock = readActiveBlock(repoRoot);
    if (activeBlock) {
      const blockFilePath = resolveBlockFilePath(repoRoot, activeBlock.file, activeBlock.id);
      const activeTask = readActiveTaskFromBlock(repoRoot, blockFilePath);
      if (activeTask && activeTask.status === "in-progress") {
        return {
          task_id: activeTask.id,
          title: activeTask.title,
          user_explanation: "Continue the current task.",
          why_now: "This task is already in progress.",
          expected_result: activeTask.doneWhen,
          estimated_change_scope: []
        };
      }

      const tasks = readBlockTasksFromFile(repoRoot, blockFilePath);
      const next = tasks.find((t) => t.status === "pending" || t.status === "ready");
      if (next) {
        return {
          task_id: next.id,
          title: next.title,
          user_explanation: "Next pending task from the active block.",
          why_now: "This keeps the block moving sequentially.",
          expected_result: next.doneWhen,
          estimated_change_scope: []
        };
      }
    }

    if (!task) return null;

    return {
      task_id: task.id,
      title: task.title,
      user_explanation: task.user_value,
      why_now: task.user_value,
      expected_result: task.definition_of_done.join("; "),
      estimated_change_scope: task.allowed_files
    };
  }

  generateAgentPrompt(project_id: string, task_id: string, assistant: string) {
    const project = this.store.projects.get(project_id);
    const task = this.store.tasks.get(task_id);
    if (!project || !task) return null;

    return {
      task_id: task.id,
      assistant,
      prompt: `You are working on a bounded implementation task.\n\nTask: ${task.title}\nUser Value: ${task.user_value}\nTechnical Goal: ${task.technical_goal}\nDoD: ${task.definition_of_done.join(", ")}`,
      scope: {
        allowed_files: task.allowed_files,
        disallowed_actions: [
          "Do not refactor unrelated components",
          "Do not modify config files"
        ]
      },
      definition_of_done: task.definition_of_done,
      change_plan_template: {
        files_to_modify: [],
        files_to_create: [],
        files_not_touched: "everything else in scope",
        approach: "",
        risks: ""
      }
    };
  }

  startSession(project_id: string, task_id: string, assistant: string, prompt_snapshot: string, change_plan: Record<string, unknown>, repo_root?: string) {
    const project = this.store.projects.get(project_id);
    const task = this.store.tasks.get(task_id);
    if (!project || !task) return null;
    if (task.status !== "ready") return { error: "TASK_NOT_READY" };

    const session_id = this.store.nextId("sess");
    const session: Session = {
      id: session_id,
      task_id: task.id,
      assistant: assistant as Session["assistant"],
      prompt_snapshot,
      change_plan,
      status: "started"
    };

    task.status = "in_progress";
    this.store.sessions.set(session_id, session);

    if (repo_root) {
      const snapshot = buildSnapshotMarkdown(`Started task ${task.id}: ${task.title}`);
      writeSnapshot(repo_root, snapshot).catch(() => undefined);
    }

    return {
      session_id,
      task_id: task.id,
      status: "started",
      started_at: new Date().toISOString()
    };
  }

  submitAgentResult(session_id: string, summary: string, changed_files: string[], repo_root?: string) {
    const session = this.store.sessions.get(session_id);
    if (!session) return null;
    session.result_summary = summary;
    session.changed_files = changed_files;
    session.status = "submitted";

    if (repo_root) {
      const snapshot = buildSnapshotMarkdown(summary);
      writeSnapshot(repo_root, snapshot).catch(() => undefined);
    }

    return {
      session_id,
      status: "submitted",
      validation_status: "pending"
    };
  }

  validateScope(session_id: string, allowed_files: string[], changed_files: string[]) {
    const unexpected = changed_files.filter((f) => !allowed_files.includes(f));
    const session = this.store.sessions.get(session_id);
    if (session) {
      session.scope_ok = unexpected.length === 0;
      session.unexpected_files = unexpected;
    }
    if (unexpected.length > 0) {
      return {
        session_id,
        scope_ok: false,
        validation_status: "needs_approval",
        unexpected_files: unexpected,
        message: "The agent touched files outside the approved task scope."
      };
    }

    return {
      session_id,
      scope_ok: true,
      validation_status: "passed",
      unexpected_files: [],
      message: "All changed files are inside the approved task scope."
    };
  }

  explainChanges(session_id: string) {
    const session = this.store.sessions.get(session_id);
    if (!session) return null;
    const scopeNote =
      session.scope_ok === false
        ? `Scope drift detected: ${session.unexpected_files?.join(", ") ?? "unknown files"}`
        : session.scope_ok === true
          ? "Scope validated: all changes stayed within the approved files."
          : undefined;
    const summaryLines = [session.result_summary ?? "No summary provided."];
    if (scopeNote) summaryLines.push(scopeNote);
    return {
      plain_language_summary: summaryLines,
      why_it_matters: "This advances the project by one validated step.",
      user_safe_to_continue: true
    };
  }

  approveScopeOverride(session_id: string, approved_files: string[], reason?: string) {
    const session = this.store.sessions.get(session_id);
    if (!session) return null;
    session.scope_ok = true;
    session.unexpected_files = approved_files;
    return {
      session_id,
      scope_ok: true,
      approved_files,
      reason: reason ?? null,
      message: "Scope override approved. You may proceed to complete the task."
    };
  }

  completeTask(task_id: string, session_id: string, checks: Record<string, boolean>, repo_root?: string) {
    const task = this.store.tasks.get(task_id);
    const session = this.store.sessions.get(session_id);
    if (!task || !session) return null;

    if (session.scope_ok !== true) {
      task.status = "review";
      return {
        task_id: task.id,
        task_status: "review",
        session_status: session.status,
        missing_conditions: ["scope_validated"],
        message: "Task is not complete because scope validation has not passed."
      };
    }

    const missing = Object.entries(checks).filter(([, ok]) => !ok).map(([k]) => k);
    if (missing.length > 0) {
      task.status = "review";
      return {
        task_id: task.id,
        task_status: "review",
        session_status: session.status,
        missing_conditions: missing,
        message: "Task is not complete because Definition of Done is not fully met."
      };
    }

    task.status = "done";
    session.status = "validated";
    const block = this.store.blocks.get(task.block_id);
    if (block) {
      const blockTasks = Array.from(this.store.tasks.values()).filter(
        (entry) => entry.block_id === block.id
      );
      if (blockTasks.length > 0 && blockTasks.every((entry) => entry.status === "done")) {
        block.status = "done";
      } else if (block.status === "not_started") {
        block.status = "in_progress";
      }
    }

    if (repo_root) {
      const snapshot = buildSnapshotMarkdown(`Completed task ${task.id}: ${task.title}`);
      writeSnapshot(repo_root, snapshot).catch(() => undefined);
    }

    return {
      task_id: task.id,
      task_status: "done",
      session_status: session.status,
      next_task: null
    };
  }
}
