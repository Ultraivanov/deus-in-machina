export type ProjectStatus = "active" | "paused" | "done";
export type NodeStatus = "not_started" | "ready" | "in_progress" | "review" | "done" | "blocked";
export type SessionStatus = "started" | "submitted" | "validated" | "rejected";
export type AssistantType = "codex" | "claude_code" | "cursor" | "other";
export type UserStatus = "active" | "paused" | "disabled";
export type SubscriptionPlan = "free" | "pro" | "enterprise";
export type SubscriptionStatus = "trialing" | "active" | "past_due" | "canceled" | "paused";

export type Project = {
  id: string;
  summary: string;
  status: ProjectStatus;
  current_phase_id?: string;
  current_block_id?: string;
  current_task_id?: string;
};

export type Phase = {
  id: string;
  project_id: string;
  title: string;
  goal: string;
  status: NodeStatus;
};

export type Block = {
  id: string;
  phase_id: string;
  title: string;
  goal: string;
  status: NodeStatus;
};

export type Task = {
  id: string;
  block_id: string;
  title: string;
  user_value: string;
  technical_goal: string;
  definition_of_done: string[];
  constraints: string[];
  allowed_files: string[];
  status: NodeStatus;
};

export type Session = {
  id: string;
  task_id: string;
  assistant: AssistantType;
  prompt_snapshot: string;
  change_plan?: Record<string, unknown>;
  result_summary?: string;
  changed_files?: string[];
  scope_ok?: boolean;
  unexpected_files?: string[];
  status: SessionStatus;
};

export type User = {
  id: string;
  email?: string;
  name?: string;
  status: UserStatus;
};

export type Subscription = {
  id: string;
  user_id: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  current_period_start?: string;
  current_period_end?: string;
  limits?: Record<string, unknown>;
};

export class InMemoryStore {
  projects = new Map<string, Project>();
  phases = new Map<string, Phase>();
  blocks = new Map<string, Block>();
  tasks = new Map<string, Task>();
  sessions = new Map<string, Session>();

  nextId(prefix: string): string {
    const id = `${prefix}_${Math.floor(Math.random() * 1e9)}`;
    return id;
  }
}
