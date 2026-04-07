# Workflow Engine Spec
## Project: Buildrail — AI Project Companion for Structured Vibe Coding
### File: `workflow-engine-spec.md`
### Version: MVP v0.1

---

## 1. Purpose

Defines the deterministic execution engine that:
- controls progression through tasks
- enforces constraints
- calculates progress
- handles drift and validation
- restores state across sessions

This is the **core logic layer** of the product.

---

## 2. Core Responsibilities

The workflow engine must:

1. Maintain a valid project graph (Phase → Block → Task)
2. Ensure only valid transitions occur
3. Enforce single active task
4. Track session lifecycle
5. Validate completion (DoD)
6. Detect and handle drift
7. Calculate progress
8. Enable resumability

---

## 3. State Graph

### Task lifecycle
```text
not_started → ready → in_progress → review → done
                          ↘ blocked
```

### Session lifecycle
```text
started → submitted → validated
                  ↘ rejected
```

---

## 4. Core Invariants

1. Only one task can be `in_progress` at a time
2. A task must be `ready` before it can be executed
3. A session must belong to exactly one task
4. A task cannot be marked `done` without DoD validation
5. Progress cannot increase without validation
6. Drift must block automatic completion
7. Change Plan must be approved before code
8. File-first state under `.assistant/` is canonical

---

## 5. Task Activation Logic

### Rule
A task becomes `ready` only if:
- all previous tasks in the block are `done`
- no blocking dependency exists

### Activation algorithm
```ts
function activateNextTask(block):
  for task in block.tasks ordered:
    if task.status == "not_started":
      if all previous tasks are done:
        task.status = "ready"
        return task
```

---

## 6. Session Flow Logic

### Start session
```ts
if task.status == "ready" and change_plan_approved:
  task.status = "in_progress"
create session(status="started")
```

### Submit result
```ts
session.status = "submitted"
task.status = "review"
```

### Validate session
```ts
if scope_ok and DoD_met:
  session.status = "validated"
  task.status = "done"
else:
  session.status = "submitted"
  task.status = "review"
```

---

## 7. Scope Enforcement

### Allowed scope
Defined per task:
- allowed_files
- constraints

### Drift detection
```ts
unexpected_files = changed_files - allowed_files

if unexpected_files.length > 0:
  return "needs_approval"
```

### Handling drift
- block auto-completion
- require explicit approval
- flag to user

---

## 8. Definition of Done (DoD)

### Structure
```ts
type DoD = {
  id: string
  description: string
  check_type: "boolean" | "file_presence" | "manual"
}
```

### Validation
```ts
function validateDoD(task, checks):
  for condition in task.DoD:
    if checks[condition.id] != true:
      return false
return true
```

---

## 9. Progress Calculation

### Inputs
- total tasks
- completed tasks
- blocked tasks

### Formula
```ts
progress = (completed_tasks / total_tasks) * 100
```

### Rules
- only validated tasks count
- blocked tasks do not increase progress
- partial work does not count

---

## 10. Phase Progress

### Calculation
```ts
phase_progress = done_tasks_in_phase / total_tasks_in_phase
```

### Display logic
- show current phase
- show % completion
- show next milestone

---

## 11. Resume Logic

### On project resume
System must reconstruct:

```ts
return {
  current_phase,
  current_block,
  current_task,
  last_session_summary,
  next_step
}
```

---

## 12. File-First Persistence

On every state change, write to `.assistant/`:
- `PHASES.md`
- `blocks/<ID>.md`
- `SNAPSHOT.md`

If file write fails, do not advance state.
