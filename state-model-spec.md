# State Model Spec
## Project: Buildrail
### Version: MVP v0.1

---

## 1. Canonical State (File-First)

Source of truth is the repo under `.assistant/`:

```
.assistant/
  PHASES.md
  blocks/<ID>.md
  protocols/*
  commands/*
  SNAPSHOT.md
```

The server may maintain a DB mirror, but file state is canonical.

---

## 2. File Formats

### 2.1 `.assistant/PHASES.md`
Tracks phases and active block.

Required sections:
- Active Phase (phase, goal, dates)
- Active Block (block id, title, status, file path)
- Phase Map (block list + status)
- Blocked table

### 2.2 `.assistant/blocks/<ID>.md`
Tracks block goal, DoD, tasks, active task, change plans, refactor backlog, session log.

Required sections:
- Block Goal
- Definition of Done
- Tasks table (ID, title, status, Done When)
- Active Task
- Change Plans
- Refactor Backlog
- Session Log

### 2.3 `.assistant/SNAPSHOT.md`
Compact session summary:
- date
- summary
- key outcomes
- open items

---

## 3. Server State Model (DB Mirror)

### User
```ts
type User = {
  id: string
  email?: string
  name?: string
  status: "active" | "paused" | "disabled"
  created_at: string
  updated_at: string
}
```

### Subscription
```ts
type Subscription = {
  id: string
  user_id: string
  plan: "free" | "pro" | "enterprise"
  status: "trialing" | "active" | "past_due" | "canceled" | "paused"
  current_period_start?: string
  current_period_end?: string
  limits?: Record<string, unknown>
  created_at: string
  updated_at: string
}
```

### Project
```ts
type Project = {
  id: string
  user_id?: string
  name?: string
  summary: string
  repo_url?: string
  status: "active" | "paused" | "done"
  current_phase_id?: string
  current_block_id?: string
  current_task_id?: string
  created_at: string
  updated_at: string
}
```

### Phase
```ts
type Phase = {
  id: string
  project_id: string
  title: string
  goal: string
  order: number
  status: "not_started" | "in_progress" | "done" | "blocked"
}
```

### Block
```ts
type Block = {
  id: string
  phase_id: string
  title: string
  goal: string
  order: number
  status: "not_started" | "in_progress" | "done" | "blocked"
  file_path: string
}
```

### Task
```ts
type Task = {
  id: string
  block_id: string
  title: string
  user_value: string
  technical_goal: string
  definition_of_done: string[]
  constraints: string[]
  allowed_files?: string[]
  status: "not_started" | "ready" | "in_progress" | "review" | "done" | "blocked"
}
```

### Session
```ts
type Session = {
  id: string
  task_id: string
  assistant: "codex" | "claude_code" | "cursor" | "other"
  prompt_snapshot: string
  change_plan?: string
  result_summary?: string
  changed_files?: string[]
  status: "started" | "submitted" | "validated" | "rejected"
  created_at: string
}
```

---

## 4. Mapping Between Files and DB

- `PHASES.md` → Phase + Block status + active block pointer
- `blocks/<ID>.md` → Block goal/DoD + Task list + Change Plans
- `SNAPSHOT.md` → Session summary
- User + Subscription live in DB only (server-level enforcement).

DB is updated after file writes. If a write fails, DB must not advance.

---

## 5. ID Conventions

- Project: `proj_<n>`
- Phase: `phase_<n>`
- Block: `block_<n>` or domain IDs (`MVP-01`)
- Task: `task_<n>` or domain IDs (`MVP-01-T1`)
- Session: `sess_<n>`

---

## 6. Progress Model

Progress is derived from validated tasks:

- `phase_progress = done_tasks / total_tasks`
- `block_progress = done_tasks / total_tasks`
- `project_progress = done_blocks / total_blocks`

Confidence is a qualitative measure derived from:
- scope violations
- DoD failures
- blocked tasks

---

## 7. Integrity Rules

- Only one task may be `in_progress`.
- Block status cannot be `done` unless all tasks are `done`.
- Phase status cannot be `done` unless all blocks are `done`.
- Session must attach to a task.
- Change Plan required before task starts.

---

## 8. Persistence Strategy

MVP:
- Write `.assistant/` files on every state change.
- SQLite mirror for resumability + monetization state.

Post‑MVP:
- SQLite/Postgres mirror for analytics and resumability.
- File-first still canonical.
