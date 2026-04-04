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
| MVP-03-T2 | Wire file writes into tool flows   | done    | initialize/start/complete update `.assistant/`|
| MVP-03-T3 | Add basic read/merge logic         | done    | engine reads current active block/task state  |
| MVP-03-T4 | SQLite storage layer               | done    | CRUD works for project/phase/block/task/session + user/subscription |
| MVP-03-T5 | End-to-end happy path demo         | pending | initialize → next_step → prompt → submit → validate → complete |
| MVP-03-T6 | Monetization middleware            | pending | tool gating + limits enforced at server layer |

> New tasks are added here as the block progresses via `init-task`.

---

## Active Task

| Field     | Value                  |
|-----------|------------------------|
| Task ID   | MVP-03-T5              |
| Title     | End-to-end happy path demo |
| Status    | pending                |
| Done When | initialize → next_step → prompt → submit → validate → complete |

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

### MVP-03-T3 — Add basic read/merge logic

**Files to modify:**
- `src/state-files.ts` — add read helpers + minimal parsers
- `src/engine.ts` — read `.assistant/` for active block/task

**Files to create:**
- none

**Files NOT touched:**
- everything else in scope

**Approach:**
Add minimal read helpers and markdown parsing for Active Block/Active Task/Tasks table. Use these for `getProjectState` and `getNextStep`, with fallback to in-memory state.

**Risks:**
Moderate. Markdown parsing can be brittle; keep it limited to the known templates.

---

### MVP-03-T4 — SQLite storage layer

**Files to modify:**
- `package.json` — add SQLite dependency + types
- `src/state.ts` — add User + Subscription types
- `state-model-spec.md` — add User/Subscription schema + SQLite mirror

**Files to create:**
- `src/storage/schema.sql` — SQLite schema for core tables
- `src/storage/sqlite.ts` — CRUD helpers for project/phase/block/task/session + user/subscription

**Files NOT touched:**
- `src/engine.ts`, `src/tools.ts`, `src/state-files.ts` (no wiring yet)

**Approach:**
Add a minimal SQLite schema and a storage helper class that can create/read/update/delete the core entities. Keep it independent from the in-memory store so wiring can happen later.

**Risks:**
Low. Schema and CRUD are isolated; runtime integration happens in a later task.

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
| 2026-04-04 | MVP-03-T2 | done        | Wrote PHASES/SNAPSHOT on key transitions |
| 2026-04-04 | MVP-03-T3 | done        | Read Active Block/Task from `.assistant/` |
| 2026-04-04 | MVP-03-T4 | done        | Added SQLite schema + CRUD for core entities |

---

_Last updated: 2026-04-04_
