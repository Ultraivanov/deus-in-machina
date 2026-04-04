# Phase Workflow Protocol

Rules for all levels of AI-assisted development.
Applies to every session, every task, every block, every phase.

---

## Hierarchy

```
Phase
  └── Block        (.codex/PHASES.md)
        └── Task   (.codex/blocks/<ID>.md)
              └── Session
```

Each level has its own init command, approval gate, and done condition.

---

## Level 1 — Phase

**Init:** `init-phases`
**Done:** all blocks in phase are `done`
**State:** `PHASES.md` — phase goal, block list, block statuses

Rules:
- Only one phase is active at a time
- Phases are sequential: MVP → Alpha → Beta → Release
- Phase structure can be adapted to project type at `init-phases` time
- No code is written at the phase level

---

## Level 2 — Block

**Init:** `init-block <ID>`
**Done:** `done` command after all tasks complete and block DoD verified
**State:** `PHASES.md` (status) + `.codex/blocks/<ID>.md` (detail)

Rules:
- Only one block is `in-progress` at a time
- Block is not opened without a file in `.codex/blocks/`
- Block file is created by `init-block`, never manually
- First 2-3 tasks are planned at block open. More added via `init-task` as work progresses
- Block DoD is defined at init time, not after

---

## Level 3 — Task

**Init:** `init-task`
**Done:** `done` command after Done When condition is verified
**State:** `.codex/blocks/<ID>.md` — task list, active task, change plans, session log

Rules:
- One task per session
- Task must be atomic — designed to complete in one session
- If task turns out larger mid-session: stop, split, re-approve
- Change Plan is required before any code is written
- Change Plan is approved by user before execution
- Done When is verified before declaring task complete
- Refactor opportunities are logged to block file, never executed in a feature task

---

## Level 4 — Session

**Start:** `start`
**End:** `/fi`
**State:** `.codex/SNAPSHOT.md` (session summary) + block file (task status, session log)

Rules:
- `start` loads: `PHASES.md` → active block file → active task → Done When
- Context is fully deterministic — nothing is inferred or pulled from memory
- `pause` suspends task mid-session: status stays `in-progress`, session log updated
- `/fi` always updates block file session log and writes `SNAPSHOT.md`
- Agent never carries assumptions between sessions — everything comes from files

---

## Command Reference

| Command           | Level   | What it does                                              |
|-------------------|---------|-----------------------------------------------------------|
| `init-phases`     | Phase   | Analyze context, generate `PHASES.md`, approve            |
| `init-block <ID>` | Block   | Analyze block, propose tasks, create block file, approve  |
| `init-task`       | Task    | Take next task, write Change Plan, approve                |
| `start`           | Session | Load active task context from files                       |
| `done`            | Task/Block | Close task or block, advance state                    |
| `pause`           | Session | Suspend task, save state, end session                     |
| `/fi`             | Session | Finalize session, update block file, write SNAPSHOT       |

---

## Approval Gates

Every level has an explicit approval gate. Nothing is written until the user approves.

| Gate              | Trigger         | User response |
|-------------------|-----------------|---------------|
| Phase structure   | `init-phases`   | `approve`     |
| Block + task list | `init-block`    | `approve`     |
| Change Plan       | `init-task`     | `yes`         |
| Task split        | mid-session     | `approve`     |

---

## What Lives Where

| Information                  | File                          |
|------------------------------|-------------------------------|
| Phase list, block statuses   | `.codex/PHASES.md`            |
| Block goal, task list, DoD   | `.codex/blocks/<ID>.md`       |
| Change plans                 | `.codex/blocks/<ID>.md`       |
| Session log                  | `.codex/blocks/<ID>.md`       |
| Refactor backlog             | `.codex/blocks/<ID>.md`       |
| Current project snapshot     | `.codex/SNAPSHOT.md`          |
| Architecture decisions       | `.codex/ARCHITECTURE.md`      |
| Pending ideas, known unknowns| `.codex/BACKLOG.md`           |
