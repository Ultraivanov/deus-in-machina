# Workflow Engine Spec
## Project: Buildrail
### Version: MVP v0.1

---

## 1. Purpose

The workflow engine enforces deterministic progress for AI-assisted coding. It is the source of truth for:
- what step is next
- what the agent is allowed to do
- whether a task is complete
- how progress advances

It must be strict, predictable, and auditable.

---

## 2. Core Principles (Enforced)

1. **One task per session**
2. **Change Plan approval before code**
3. **No scope expansion without approval**
4. **Progress only after DoD validation**
5. **File-first state is canonical** (`.assistant/`)

---

## 3. Engine Responsibilities

- Generate phases/blocks/tasks from a project idea
- Select the next actionable task
- Assemble bounded prompts and scope
- Validate changed files against allowed scope
- Validate Definition of Done (DoD)
- Advance task/block/phase status
- Write updates to `.assistant/` state files

---

## 4. State Inputs

The engine reads from:
- `.assistant/PHASES.md`
- `.assistant/blocks/<ID>.md`
- `.assistant/SNAPSHOT.md`
- Server DB mirror (optional)

The file system is canonical. DB is a cache/mirror.

---

## 5. State Machine

### Task transitions
```
not_started → ready → in_progress → review → done
                          ↘ blocked
```

### Block transitions
```
not_started → in_progress → review → done
                          ↘ blocked
```

### Phase transitions
```
not_started → in_progress → done
                       ↘ blocked
```

### Session transitions
```
started → submitted → validated
                  ↘ rejected
```

---

## 6. Task Selection Logic

### `get_next_step`
1. Load Active Block from `.assistant/PHASES.md`.
2. Load block file `.assistant/blocks/<ID>.md`.
3. If Active Task is `in_progress`, return it.
4. Else return first task with status `pending`/`ready`.
5. If none remain, recommend `done` for block.

---

## 7. Change Plan Gate

### `start_session`
The engine must reject if:
- task is not `ready`
- another task is `in_progress`
- `change_plan_approved` is not true

On success:
- mark task as `in_progress`
- write Change Plan under `Change Plans` in block file

---

## 8. Scope Validation

### `validate_scope`
- Compare `changed_files` to task’s allowed files
- If unexpected files exist → `needs_approval`
- If scope is clean → `passed`
- Scope failure prevents auto-completion

---

## 9. DoD Validation

### `complete_task`
- Accept client-submitted DoD checks
- If any check fails → task stays `review`
- If all checks pass → task moves to `done`
- Update block and phase status if all tasks/blocks complete

---

## 10. Block Completion

### `done`
- Only allowed when all tasks in block are `done`
- Updates block status to `done`
- Select next block as active (or ask user)
- Write summary into `.assistant/SNAPSHOT.md`

---

## 11. Progress Calculation

Progress is **validated** work only:
- % tasks done in current phase
- % blocks done overall
- Confidence derived from scope validation and DoD pass rates

---

## 12. Concurrency Rules

- Exactly one task may be `in_progress` at any time
- Sessions must attach to a task
- `init-block` must reject if another block is `in_progress`

---

## 13. Error Conditions

- `TASK_NOT_READY` if task not ready for work
- `STATE_CONFLICT` if another task is in progress
- `SCOPE_VIOLATION` on unexpected files without approval
- `DOD_NOT_MET` when DoD checks fail

---

## 14. File Writes

The engine must update:
- `.assistant/PHASES.md` (phase/block status)
- `.assistant/blocks/<ID>.md` (task list, Change Plans, Session Log)
- `.assistant/SNAPSHOT.md` (session summary)

All writes should be atomic. If any write fails, reject the operation.
