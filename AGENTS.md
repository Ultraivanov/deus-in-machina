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

This project follows a structured phase workflow.
Full rules are in `.codex/protocols/phase-workflow.md`.
Phase state is tracked in `.codex/PHASES.md`.

**On every session start:**
Load `PHASES.md` as part of the `start` protocol.
Confirm the active phase and block with the user before doing anything else.

**Hard constraints:**
- One block per session. Never start a second block in the same session.
- Always output a Change Plan and wait for approval before writing code.
- Never refactor code outside the current block scope. Log it, don't touch it.
- A block is done only when its Definition of Done condition is verified — not when code is written.

**Phase sequence:** MVP → Alpha → Beta → Release
Block IDs follow the pattern: `MVP-01`, `A-01`, `B-01`, `R-01`

Current state is always in `.codex/PHASES.md`.

---

## Commands

| Command        | What it does                                                                 |
|----------------|------------------------------------------------------------------------------|
| `start`        | Cold start protocol — loads shared context, checks session state             |
| `/fi`          | Finish protocol — security checks, git diff, session finalization            |
| `init-phases`  | Analyzes project context, generates `PHASES.md` draft, waits for approval   |
| `done`         | Marks active block complete, advances to next block                          |
| `block <ID>`   | Switches active block explicitly (e.g. `block MVP-03`)                       |
| `pause`        | Suspends current block mid-session, saves state                              |

---

### init-phases

Activated when user writes `init-phases` in chat.

The agent:
1. Reads all available context — `SNAPSHOT.md`, `ARCHITECTURE.md`, `BACKLOG.md`, session history
2. Infers project type, maturity, and core user flow
3. Generates a full `PHASES.md` draft with phases, blocks, and Definition of Done per block
4. Presents the draft for approval — writes nothing until user responds `approve`

Full protocol: `.codex/protocols/init-phases-protocol.md`

**Never run `init-phases` mid-project without reviewing the existing `PHASES.md` first.**
If `PHASES.md` already exists, ask the user whether to overwrite or extend.
