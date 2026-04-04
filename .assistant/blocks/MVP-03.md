# Block: MVP-03 — File-first state I/O

> Detail file for this block. Created by `init-block MVP-03`.
> `PHASES.md` tracks block status only. All task detail lives here.

---

## Block Goal

Implement file-first state writes to `.assistant/` for core MCP flows.

## Definition of Done

Core tools write and read `.assistant/` files deterministically without crashing, and session summaries are recorded.

---

## Tasks

| ID        | Task                               | Status  | Done When                                      |
|-----------|------------------------------------|---------|-----------------------------------------------|
| MVP-03-T1 | Create state file writer helpers   | done    | Helpers write PHASES/blocks/SNAPSHOT safely   |
| MVP-03-T2 | Wire file writes into tool flows   | in-progress | initialize/start/complete update `.assistant/`|
| MVP-03-T3 | Add basic read/merge logic         | pending | engine reads current active block/task state  |

> New tasks are added here as the block progresses via `init-task`.

---

## Active Task

| Field     | Value                  |
|-----------|------------------------|
| Task ID   | MVP-03-T2              |
| Title     | Wire file writes into tool flows |
| Status    | in-progress            |
| Done When | initialize/start/complete update `.assistant/` |

---

## Change Plans

> One entry per task. Written by agent before coding. Approved by user before execution.

### MVP-03-T2 — Wire file writes into tool flows

**Files to modify:**
- `src/engine.ts` — write PHASES and SNAPSHOT during key transitions
- `src/tools.ts` — accept `repo_root` and pass to engine
- `src/state-files.ts` — add markdown builders for PHASES/SNAPSHOT

**Files to create:**
- none

**Files NOT touched:**
- everything else in scope

**Approach:**
Add file-first writes on initialize, session start, result submission, and task completion. Use helper builders and the passed repo root to write `.assistant/` files.

**Risks:**
Low. File I/O errors should not crash; failures should return error responses.

---

## Refactor Backlog

> Spotted during this block. Do not touch until a dedicated refactor block.

- <!-- note -->

---

## Session Log

> One line per session. Written by agent on `/fi`.

| Date       | Task ID   | Status      | Note |
|------------|-----------|-------------|------|
| 2026-04-04 | MVP-03-T1 | done        | Added file helpers for `.assistant/` writes |
| 2026-04-04 | MVP-03-T2 | in-progress | Wiring file-first writes into tool flow |

---

_Last updated: 2026-04-04_
