import Database from "better-sqlite3";
import type { Database as DatabaseType } from "better-sqlite3";
import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { Project, Phase, Block, Task, Session } from "../state.js";

export type UserStatus = "active" | "paused" | "disabled";
export type SubscriptionPlan = "free" | "pro" | "enterprise";
export type SubscriptionStatus = "trialing" | "active" | "past_due" | "canceled" | "paused";

export type UserRecord = {
  id: string;
  email?: string;
  name?: string;
  status: UserStatus;
  created_at: string;
  updated_at: string;
};

export type SubscriptionRecord = {
  id: string;
  user_id: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  current_period_start?: string;
  current_period_end?: string;
  limits?: Record<string, unknown>;
  sessions_used?: number;
  project_count?: number;
  created_at: string;
  updated_at: string;
};

export type ProjectRecord = Project & {
  user_id?: string;
  name?: string;
  repo_url?: string;
  created_at: string;
  updated_at: string;
};

export type PhaseRecord = Phase & {
  order_index: number;
  created_at: string;
  updated_at: string;
};

export type BlockRecord = Block & {
  order_index: number;
  file_path?: string;
  created_at: string;
  updated_at: string;
};

export type TaskRecord = Task & {
  order_index: number;
  created_at: string;
  updated_at: string;
};

export type SessionRecord = Session & {
  created_at: string;
  updated_at: string;
};

const toJson = (value: unknown) => JSON.stringify(value ?? null);
const fromJson = <T>(value: string | null | undefined, fallback: T): T => {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
};

const toNumber = (value: unknown, fallback: number) => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "" && Number.isFinite(Number(value))) {
    return Number(value);
  }
  return fallback;
};

const getUsageFromLimits = (limits: Record<string, unknown> | null | undefined) => ({
  sessions_used: toNumber(limits?.sessions_used, 0),
  project_count: toNumber(limits?.project_count, 0)
});

const getStripeFromLimits = (limits: Record<string, unknown> | null | undefined) => ({
  stripe_customer_id: typeof limits?.stripe_customer_id === "string" ? (limits.stripe_customer_id as string) : undefined,
  stripe_subscription_id: typeof limits?.stripe_subscription_id === "string" ? (limits.stripe_subscription_id as string) : undefined
});

const normalizeSnapshotStatus = (
  status: SubscriptionStatus
): "active" | "past_due" | "canceled" | "paused" => (status === "trialing" ? "active" : status);

const mergeUsageIntoLimits = (
  limits: Record<string, unknown> | null | undefined,
  usage: { sessions_used: number; project_count: number }
) => ({
  ...(limits ?? {}),
  sessions_used: usage.sessions_used,
  project_count: usage.project_count
});

const nowIso = () => new Date().toISOString();

const getSchemaPath = () => {
  const filename = fileURLToPath(import.meta.url);
  return path.join(path.dirname(filename), "schema.sql");
};

export const openSqlite = (dbPath: string) => {
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const db = new Database(dbPath);
  db.pragma("foreign_keys = ON");
  return db;
};

export const applySchema = (db: DatabaseType, schemaSql?: string) => {
  const sql = schemaSql ?? fs.readFileSync(getSchemaPath(), "utf-8");
  db.exec(sql);
};

export class SqliteStore {
  constructor(private db: DatabaseType) {}

  init() {
    applySchema(this.db);
  }

  createUser(input: Omit<UserRecord, "created_at" | "updated_at"> & Partial<Pick<UserRecord, "created_at" | "updated_at">>) {
    const created_at = input.created_at ?? nowIso();
    const updated_at = input.updated_at ?? created_at;
    const stmt = this.db.prepare(
      `INSERT INTO user (id, email, name, status, created_at, updated_at)
       VALUES (@id, @email, @name, @status, @created_at, @updated_at)`
    );
    stmt.run({
      id: input.id,
      email: input.email ?? null,
      name: input.name ?? null,
      status: input.status,
      created_at,
      updated_at
    });
    return { ...input, created_at, updated_at } as UserRecord;
  }

  getUser(id: string): UserRecord | null {
    const row = this.db.prepare(`SELECT * FROM user WHERE id = ?`).get(id) as UserRecord | undefined;
    return row ?? null;
  }

  updateUser(input: Partial<UserRecord> & { id: string }) {
    const updated_at = input.updated_at ?? nowIso();
    this.db.prepare(
      `UPDATE user SET email = @email, name = @name, status = @status, updated_at = @updated_at WHERE id = @id`
    ).run({
      id: input.id,
      email: input.email ?? null,
      name: input.name ?? null,
      status: input.status ?? "active",
      updated_at
    });
    return this.getUser(input.id);
  }

  deleteUser(id: string) {
    this.db.prepare(`DELETE FROM user WHERE id = ?`).run(id);
  }

  createSubscription(input: Omit<SubscriptionRecord, "created_at" | "updated_at"> & Partial<Pick<SubscriptionRecord, "created_at" | "updated_at">>) {
    const created_at = input.created_at ?? nowIso();
    const updated_at = input.updated_at ?? created_at;
    this.db.prepare(
      `INSERT INTO subscription (id, user_id, plan, status, current_period_start, current_period_end, limits_json, created_at, updated_at)
       VALUES (@id, @user_id, @plan, @status, @current_period_start, @current_period_end, @limits_json, @created_at, @updated_at)`
    ).run({
      id: input.id,
      user_id: input.user_id,
      plan: input.plan,
      status: input.status,
      current_period_start: input.current_period_start ?? null,
      current_period_end: input.current_period_end ?? null,
      limits_json: toJson(input.limits ?? null),
      created_at,
      updated_at
    });
    return { ...input, created_at, updated_at } as SubscriptionRecord;
  }

  getSubscription(id: string): SubscriptionRecord | null {
    const row = this.db.prepare(`SELECT * FROM subscription WHERE id = ?`).get(id) as
      | Record<string, unknown>
      | undefined;
    if (!row) return null;
    const limits = fromJson<Record<string, unknown> | null>(row.limits_json as string | null, null);
    const usage = getUsageFromLimits(limits);
    return {
      id: row.id as string,
      user_id: row.user_id as string,
      plan: row.plan as SubscriptionPlan,
      status: row.status as SubscriptionStatus,
      current_period_start: (row.current_period_start as string | null) ?? undefined,
      current_period_end: (row.current_period_end as string | null) ?? undefined,
      limits,
      sessions_used: usage.sessions_used,
      project_count: usage.project_count,
      created_at: row.created_at as string,
      updated_at: row.updated_at as string
    } as SubscriptionRecord;
  }

  getSubscriptionByUserId(user_id: string): SubscriptionRecord | null {
    const row = this.db
      .prepare(`SELECT * FROM subscription WHERE user_id = ? ORDER BY created_at DESC LIMIT 1`)
      .get(user_id) as Record<string, unknown> | undefined;
    if (!row) return null;
    const limits = fromJson<Record<string, unknown> | null>(row.limits_json as string | null, null);
    const usage = getUsageFromLimits(limits);
    return {
      id: row.id as string,
      user_id: row.user_id as string,
      plan: row.plan as SubscriptionPlan,
      status: row.status as SubscriptionStatus,
      current_period_start: (row.current_period_start as string | null) ?? undefined,
      current_period_end: (row.current_period_end as string | null) ?? undefined,
      limits,
      sessions_used: usage.sessions_used,
      project_count: usage.project_count,
      created_at: row.created_at as string,
      updated_at: row.updated_at as string
    } as SubscriptionRecord;
  }

  updateSubscription(input: Partial<SubscriptionRecord> & { id: string }) {
    const updated_at = input.updated_at ?? nowIso();
    this.db.prepare(
      `UPDATE subscription
       SET plan = @plan,
           status = @status,
           current_period_start = @current_period_start,
           current_period_end = @current_period_end,
           limits_json = @limits_json,
           updated_at = @updated_at
       WHERE id = @id`
    ).run({
      id: input.id,
      plan: input.plan ?? "free",
      status: input.status ?? "active",
      current_period_start: input.current_period_start ?? null,
      current_period_end: input.current_period_end ?? null,
      limits_json: toJson(input.limits ?? null),
      updated_at
    });
    return this.getSubscription(input.id);
  }

  deleteSubscription(id: string) {
    this.db.prepare(`DELETE FROM subscription WHERE id = ?`).run(id);
  }

  ensureUser(id: string) {
    const existing = this.getUser(id);
    if (existing) return existing;
    return this.createUser({
      id,
      status: "active"
    });
  }

  ensureSubscription(user_id: string, plan: SubscriptionPlan = "free") {
    this.ensureUser(user_id);
    const existing = this.getSubscriptionByUserId(user_id);
    if (existing) return existing;
    const now = nowIso();
    return this.createSubscription({
      id: `sub_${randomUUID()}`,
      user_id,
      plan,
      status: "active",
      limits: mergeUsageIntoLimits(null, { sessions_used: 0, project_count: 0 }),
      created_at: now,
      updated_at: now
    });
  }

  getSubscriptionSnapshot(user_id: string): {
    user_id: string;
    plan: "free" | "pro";
    status: "active" | "past_due" | "canceled" | "paused";
    sessions_used: number;
    project_count: number;
  } {
    const subscription = this.ensureSubscription(user_id);
    const usage = getUsageFromLimits(subscription.limits);
    return {
      user_id: subscription.user_id,
      plan: subscription.plan === "pro" ? "pro" : "free",
      status: normalizeSnapshotStatus(subscription.status),
      sessions_used: usage.sessions_used,
      project_count: usage.project_count
    };
  }

  incrementProjectCount(user_id: string, amount = 1) {
    const subscription = this.ensureSubscription(user_id);
    const usage = getUsageFromLimits(subscription.limits);
    const next = {
      sessions_used: usage.sessions_used,
      project_count: usage.project_count + amount
    };
    return this.updateSubscription({
      id: subscription.id,
      plan: subscription.plan,
      status: subscription.status,
      current_period_start: subscription.current_period_start,
      current_period_end: subscription.current_period_end,
      limits: mergeUsageIntoLimits(subscription.limits, next)
    });
  }

  incrementSessionsUsed(user_id: string, amount = 1) {
    const subscription = this.ensureSubscription(user_id);
    const usage = getUsageFromLimits(subscription.limits);
    const next = {
      sessions_used: usage.sessions_used + amount,
      project_count: usage.project_count
    };
    return this.updateSubscription({
      id: subscription.id,
      plan: subscription.plan,
      status: subscription.status,
      current_period_start: subscription.current_period_start,
      current_period_end: subscription.current_period_end,
      limits: mergeUsageIntoLimits(subscription.limits, next)
    });
  }

  getStripeMetadata(user_id: string) {
    const subscription = this.ensureSubscription(user_id);
    const stripeMeta = getStripeFromLimits(subscription.limits);
    return stripeMeta;
  }

  updateStripeMetadata(user_id: string, data: { stripe_customer_id?: string; stripe_subscription_id?: string }) {
    const subscription = this.ensureSubscription(user_id);
    const limits = {
      ...(subscription.limits ?? {}),
      ...(data.stripe_customer_id ? { stripe_customer_id: data.stripe_customer_id } : {}),
      ...(data.stripe_subscription_id ? { stripe_subscription_id: data.stripe_subscription_id } : {})
    };
    return this.updateSubscription({
      id: subscription.id,
      plan: subscription.plan,
      status: subscription.status,
      current_period_start: subscription.current_period_start,
      current_period_end: subscription.current_period_end,
      limits
    });
  }

  updateSubscriptionFromStripe(user_id: string, data: { plan?: SubscriptionPlan; status?: SubscriptionStatus }) {
    const subscription = this.ensureSubscription(user_id);
    return this.updateSubscription({
      id: subscription.id,
      plan: data.plan ?? subscription.plan,
      status: data.status ?? subscription.status,
      current_period_start: subscription.current_period_start,
      current_period_end: subscription.current_period_end,
      limits: subscription.limits
    });
  }

  createProject(input: Omit<ProjectRecord, "created_at" | "updated_at"> & Partial<Pick<ProjectRecord, "created_at" | "updated_at">>) {
    const created_at = input.created_at ?? nowIso();
    const updated_at = input.updated_at ?? created_at;
    this.db.prepare(
      `INSERT INTO project (id, user_id, name, summary, repo_url, status, current_phase_id, current_block_id, current_task_id, created_at, updated_at)
       VALUES (@id, @user_id, @name, @summary, @repo_url, @status, @current_phase_id, @current_block_id, @current_task_id, @created_at, @updated_at)`
    ).run({
      id: input.id,
      user_id: input.user_id ?? null,
      name: input.name ?? null,
      summary: input.summary,
      repo_url: input.repo_url ?? null,
      status: input.status,
      current_phase_id: input.current_phase_id ?? null,
      current_block_id: input.current_block_id ?? null,
      current_task_id: input.current_task_id ?? null,
      created_at,
      updated_at
    });
    return { ...input, created_at, updated_at } as ProjectRecord;
  }

  getProject(id: string): ProjectRecord | null {
    const row = this.db.prepare(`SELECT * FROM project WHERE id = ?`).get(id) as ProjectRecord | undefined;
    return row ?? null;
  }

  getLatestProject(): ProjectRecord | null {
    const row = this.db
      .prepare(`SELECT * FROM project ORDER BY updated_at DESC, created_at DESC LIMIT 1`)
      .get() as ProjectRecord | undefined;
    return row ?? null;
  }

  updateProject(input: Partial<ProjectRecord> & { id: string }) {
    const updated_at = input.updated_at ?? nowIso();
    this.db.prepare(
      `UPDATE project
       SET user_id = @user_id,
           name = @name,
           summary = @summary,
           repo_url = @repo_url,
           status = @status,
           current_phase_id = @current_phase_id,
           current_block_id = @current_block_id,
           current_task_id = @current_task_id,
           updated_at = @updated_at
       WHERE id = @id`
    ).run({
      id: input.id,
      user_id: input.user_id ?? null,
      name: input.name ?? null,
      summary: input.summary ?? "",
      repo_url: input.repo_url ?? null,
      status: input.status ?? "active",
      current_phase_id: input.current_phase_id ?? null,
      current_block_id: input.current_block_id ?? null,
      current_task_id: input.current_task_id ?? null,
      updated_at
    });
    return this.getProject(input.id);
  }

  deleteProject(id: string) {
    this.db.prepare(`DELETE FROM project WHERE id = ?`).run(id);
  }

  createPhase(input: Omit<PhaseRecord, "created_at" | "updated_at"> & Partial<Pick<PhaseRecord, "created_at" | "updated_at">>) {
    const created_at = input.created_at ?? nowIso();
    const updated_at = input.updated_at ?? created_at;
    this.db.prepare(
      `INSERT INTO phase (id, project_id, title, goal, order_index, status, created_at, updated_at)
       VALUES (@id, @project_id, @title, @goal, @order_index, @status, @created_at, @updated_at)`
    ).run({
      id: input.id,
      project_id: input.project_id,
      title: input.title,
      goal: input.goal,
      order_index: input.order_index ?? 0,
      status: input.status,
      created_at,
      updated_at
    });
    return { ...input, created_at, updated_at } as PhaseRecord;
  }

  getPhase(id: string): PhaseRecord | null {
    const row = this.db.prepare(`SELECT * FROM phase WHERE id = ?`).get(id) as PhaseRecord | undefined;
    return row ?? null;
  }

  listPhasesByProjectId(project_id: string): PhaseRecord[] {
    return this.db
      .prepare(`SELECT * FROM phase WHERE project_id = ? ORDER BY order_index ASC, created_at ASC`)
      .all(project_id) as PhaseRecord[];
  }

  updatePhase(input: Partial<PhaseRecord> & { id: string }) {
    const updated_at = input.updated_at ?? nowIso();
    this.db.prepare(
      `UPDATE phase
       SET title = @title, goal = @goal, order_index = @order_index, status = @status, updated_at = @updated_at
       WHERE id = @id`
    ).run({
      id: input.id,
      title: input.title ?? "",
      goal: input.goal ?? "",
      order_index: input.order_index ?? 0,
      status: input.status ?? "not_started",
      updated_at
    });
    return this.getPhase(input.id);
  }

  deletePhase(id: string) {
    this.db.prepare(`DELETE FROM phase WHERE id = ?`).run(id);
  }

  createBlock(input: Omit<BlockRecord, "created_at" | "updated_at"> & Partial<Pick<BlockRecord, "created_at" | "updated_at">>) {
    const created_at = input.created_at ?? nowIso();
    const updated_at = input.updated_at ?? created_at;
    this.db.prepare(
      `INSERT INTO block (id, phase_id, title, goal, order_index, status, file_path, created_at, updated_at)
       VALUES (@id, @phase_id, @title, @goal, @order_index, @status, @file_path, @created_at, @updated_at)`
    ).run({
      id: input.id,
      phase_id: input.phase_id,
      title: input.title,
      goal: input.goal,
      order_index: input.order_index ?? 0,
      status: input.status,
      file_path: input.file_path ?? null,
      created_at,
      updated_at
    });
    return { ...input, created_at, updated_at } as BlockRecord;
  }

  getBlock(id: string): BlockRecord | null {
    const row = this.db.prepare(`SELECT * FROM block WHERE id = ?`).get(id) as BlockRecord | undefined;
    return row ?? null;
  }

  listBlocksByPhaseId(phase_id: string): BlockRecord[] {
    return this.db
      .prepare(`SELECT * FROM block WHERE phase_id = ? ORDER BY order_index ASC, created_at ASC`)
      .all(phase_id) as BlockRecord[];
  }

  updateBlock(input: Partial<BlockRecord> & { id: string }) {
    const updated_at = input.updated_at ?? nowIso();
    this.db.prepare(
      `UPDATE block
       SET title = @title,
           goal = @goal,
           order_index = @order_index,
           status = @status,
           file_path = @file_path,
           updated_at = @updated_at
       WHERE id = @id`
    ).run({
      id: input.id,
      title: input.title ?? "",
      goal: input.goal ?? "",
      order_index: input.order_index ?? 0,
      status: input.status ?? "not_started",
      file_path: input.file_path ?? null,
      updated_at
    });
    return this.getBlock(input.id);
  }

  deleteBlock(id: string) {
    this.db.prepare(`DELETE FROM block WHERE id = ?`).run(id);
  }

  createTask(input: Omit<TaskRecord, "created_at" | "updated_at"> & Partial<Pick<TaskRecord, "created_at" | "updated_at">>) {
    const created_at = input.created_at ?? nowIso();
    const updated_at = input.updated_at ?? created_at;
    this.db.prepare(
      `INSERT INTO task (id, block_id, title, user_value, technical_goal, definition_of_done_json, constraints_json, allowed_files_json, order_index, status, created_at, updated_at)
       VALUES (@id, @block_id, @title, @user_value, @technical_goal, @definition_of_done_json, @constraints_json, @allowed_files_json, @order_index, @status, @created_at, @updated_at)`
    ).run({
      id: input.id,
      block_id: input.block_id,
      title: input.title,
      user_value: input.user_value,
      technical_goal: input.technical_goal,
      definition_of_done_json: toJson(input.definition_of_done ?? []),
      constraints_json: toJson(input.constraints ?? []),
      allowed_files_json: toJson(input.allowed_files ?? []),
      order_index: input.order_index ?? 0,
      status: input.status,
      created_at,
      updated_at
    });
    return { ...input, created_at, updated_at } as TaskRecord;
  }

  getTask(id: string): TaskRecord | null {
    const row = this.db.prepare(`SELECT * FROM task WHERE id = ?`).get(id) as
      | Record<string, unknown>
      | undefined;
    if (!row) return null;
    return {
      id: row.id as string,
      block_id: row.block_id as string,
      title: row.title as string,
      user_value: row.user_value as string,
      technical_goal: row.technical_goal as string,
      definition_of_done: fromJson(row.definition_of_done_json as string, []),
      constraints: fromJson(row.constraints_json as string, []),
      allowed_files: fromJson(row.allowed_files_json as string, []),
      order_index: Number(row.order_index ?? 0),
      status: row.status as Task["status"],
      created_at: row.created_at as string,
      updated_at: row.updated_at as string
    };
  }

  listTasksByBlockId(block_id: string): TaskRecord[] {
    const rows = this.db
      .prepare(`SELECT * FROM task WHERE block_id = ? ORDER BY order_index ASC, created_at ASC`)
      .all(block_id) as Array<Record<string, unknown>>;
    return rows.map((row) => ({
      id: row.id as string,
      block_id: row.block_id as string,
      title: row.title as string,
      user_value: row.user_value as string,
      technical_goal: row.technical_goal as string,
      definition_of_done: fromJson(row.definition_of_done_json as string, []),
      constraints: fromJson(row.constraints_json as string, []),
      allowed_files: fromJson(row.allowed_files_json as string, []),
      order_index: Number(row.order_index ?? 0),
      status: row.status as Task["status"],
      created_at: row.created_at as string,
      updated_at: row.updated_at as string
    }));
  }

  updateTask(input: Partial<TaskRecord> & { id: string }) {
    const updated_at = input.updated_at ?? nowIso();
    this.db.prepare(
      `UPDATE task
       SET title = @title,
           user_value = @user_value,
           technical_goal = @technical_goal,
           definition_of_done_json = @definition_of_done_json,
           constraints_json = @constraints_json,
           allowed_files_json = @allowed_files_json,
           order_index = @order_index,
           status = @status,
           updated_at = @updated_at
       WHERE id = @id`
    ).run({
      id: input.id,
      title: input.title ?? "",
      user_value: input.user_value ?? "",
      technical_goal: input.technical_goal ?? "",
      definition_of_done_json: toJson(input.definition_of_done ?? []),
      constraints_json: toJson(input.constraints ?? []),
      allowed_files_json: toJson(input.allowed_files ?? []),
      order_index: input.order_index ?? 0,
      status: input.status ?? "not_started",
      updated_at
    });
    return this.getTask(input.id);
  }

  deleteTask(id: string) {
    this.db.prepare(`DELETE FROM task WHERE id = ?`).run(id);
  }

  createSession(input: Omit<SessionRecord, "created_at" | "updated_at"> & Partial<Pick<SessionRecord, "created_at" | "updated_at">>) {
    const created_at = input.created_at ?? nowIso();
    const updated_at = input.updated_at ?? created_at;
    this.db.prepare(
      `INSERT INTO session (id, task_id, assistant, prompt_snapshot, change_plan_json, result_summary, changed_files_json, scope_ok, unexpected_files_json, status, created_at, updated_at)
       VALUES (@id, @task_id, @assistant, @prompt_snapshot, @change_plan_json, @result_summary, @changed_files_json, @scope_ok, @unexpected_files_json, @status, @created_at, @updated_at)`
    ).run({
      id: input.id,
      task_id: input.task_id,
      assistant: input.assistant,
      prompt_snapshot: input.prompt_snapshot,
      change_plan_json: toJson(input.change_plan ?? null),
      result_summary: input.result_summary ?? null,
      changed_files_json: toJson(input.changed_files ?? null),
      scope_ok: typeof input.scope_ok === "boolean" ? (input.scope_ok ? 1 : 0) : null,
      unexpected_files_json: toJson(input.unexpected_files ?? null),
      status: input.status,
      created_at,
      updated_at
    });
    return { ...input, created_at, updated_at } as SessionRecord;
  }

  getSession(id: string): SessionRecord | null {
    const row = this.db.prepare(`SELECT * FROM session WHERE id = ?`).get(id) as
      | Record<string, unknown>
      | undefined;
    if (!row) return null;
    const change_plan = fromJson<Record<string, unknown> | null>(row.change_plan_json as string, null);
    const changed_files = fromJson<string[] | null>(row.changed_files_json as string, null);
    const unexpected_files = fromJson<string[] | null>(row.unexpected_files_json as string, null);
    const result_summary = typeof row.result_summary === "string" ? row.result_summary : undefined;
    return {
      id: row.id as string,
      task_id: row.task_id as string,
      assistant: row.assistant as Session["assistant"],
      prompt_snapshot: row.prompt_snapshot as string,
      change_plan: change_plan ?? undefined,
      result_summary,
      changed_files: changed_files ?? undefined,
      scope_ok:
        row.scope_ok === null || row.scope_ok === undefined ? undefined : (row.scope_ok as number) === 1,
      unexpected_files: unexpected_files ?? undefined,
      status: row.status as Session["status"],
      created_at: row.created_at as string,
      updated_at: row.updated_at as string
    };
  }

  listSessionsByTaskId(task_id: string): SessionRecord[] {
    const rows = this.db
      .prepare(`SELECT * FROM session WHERE task_id = ? ORDER BY created_at ASC`)
      .all(task_id) as Array<Record<string, unknown>>;
    return rows.map((row) => ({
      id: row.id as string,
      task_id: row.task_id as string,
      assistant: row.assistant as Session["assistant"],
      prompt_snapshot: row.prompt_snapshot as string,
      change_plan: fromJson<Record<string, unknown> | null>(row.change_plan_json as string, null) ?? undefined,
      result_summary: typeof row.result_summary === "string" ? row.result_summary : undefined,
      changed_files: fromJson<string[] | null>(row.changed_files_json as string, null) ?? undefined,
      scope_ok:
        row.scope_ok === null || row.scope_ok === undefined ? undefined : (row.scope_ok as number) === 1,
      unexpected_files: fromJson<string[] | null>(row.unexpected_files_json as string, null) ?? undefined,
      status: row.status as Session["status"],
      created_at: row.created_at as string,
      updated_at: row.updated_at as string
    }));
  }

  updateSession(input: Partial<SessionRecord> & { id: string }) {
    const updated_at = input.updated_at ?? nowIso();
    this.db.prepare(
      `UPDATE session
       SET prompt_snapshot = @prompt_snapshot,
           change_plan_json = @change_plan_json,
           result_summary = @result_summary,
           changed_files_json = @changed_files_json,
           scope_ok = @scope_ok,
           unexpected_files_json = @unexpected_files_json,
           status = @status,
           updated_at = @updated_at
       WHERE id = @id`
    ).run({
      id: input.id,
      prompt_snapshot: input.prompt_snapshot ?? "",
      change_plan_json: toJson(input.change_plan ?? null),
      result_summary: input.result_summary ?? null,
      changed_files_json: toJson(input.changed_files ?? null),
      scope_ok: typeof input.scope_ok === "boolean" ? (input.scope_ok ? 1 : 0) : null,
      unexpected_files_json: toJson(input.unexpected_files ?? null),
      status: input.status ?? "started",
      updated_at
    });
    return this.getSession(input.id);
  }

  deleteSession(id: string) {
    this.db.prepare(`DELETE FROM session WHERE id = ?`).run(id);
  }
}
