# Codex Entry

This file is the primary entry point for Codex sessions.

## Quick Start

1. Run `./init-project.sh` in the host project.
2. Launch Codex in that project.
3. In chat, execute:

- `start`
- `/fi` when done

## State Files

Codex reads and updates the shared project context:

- `.codex/SNAPSHOT.md`
- `.codex/BACKLOG.md`
- `.codex/ARCHITECTURE.md`

For content projects, the files live under `.codex/content/`.

## Phase-Based Development

This project uses a four-level development hierarchy: Phase → Block → Task → Session.

Full rules: `.codex/protocols/phase-workflow.md`
Phase state: `.codex/PHASES.md`
Block detail: `.codex/blocks/<ID>.md`

**On every session start:**
Run `start`. It loads `PHASES.md` → active block file → active task → Done When.
Context is fully deterministic. Nothing is inferred. Everything comes from files.

**Hard constraints:**
- One task per session. Never start a second task in the same session.
- Always output a Change Plan and wait for `yes` before writing any code.
- Never refactor outside the current task scope. Log it to block file, don't touch it.
- A task is done only when its Done When condition is verified — not when code is written.
- A block is done only when all tasks are done and block DoD is verified.

**Phase sequence:** MVP → Alpha → Beta → Release
(Adjusted automatically by `init-phases` based on project type.)

---

## Commands

| Command           | Level   | What it does                                              |
|-------------------|---------|-----------------------------------------------------------|
| `start`           | Session | Load active task context from files, cold start protocol  |
| `/fi`             | Session | Finalize session, update block file, write SNAPSHOT       |
| `init-phases`     | Phase   | Analyze context, generate `PHASES.md`, approve            |
| `init-block <ID>` | Block   | Analyze block, propose tasks, create block file, approve  |
| `init-task`       | Task    | Take next task, write Change Plan, approve                |
| `done`            | Task/Block | Close task or block, advance state                    |
| `pause`           | Session | Suspend task mid-session, save state                      |

### init-phases
Reads all context, infers project type, generates `PHASES.md` draft.
Writes nothing until user responds `approve`.
Protocol: `.codex/protocols/init-phases-protocol.md`
If `PHASES.md` already exists — ask user whether to overwrite or extend.

### init-block
Reads block definition from `PHASES.md` and project context.
Proposes first 2-3 tasks with Done When conditions.
Creates `.codex/blocks/<ID>.md` and updates `PHASES.md`.
Writes nothing until user responds `approve`.
Protocol: `.codex/protocols/init-block-protocol.md`

### init-task
Reads active block file, takes next pending task.
Writes Change Plan, waits for `yes`, then writes code.
If task is too large mid-session — stops, proposes split, re-approves.
Protocol: `.codex/protocols/init-task-protocol.md`
