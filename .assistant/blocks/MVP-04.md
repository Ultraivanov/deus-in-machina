# Block: MVP-04 — Scope + DoD validation pipeline

> Detail file for this block. Created by `init-block MVP-04`.
> `PHASES.md` tracks block status only. All task detail lives here.

---

## Block Goal

Make scope validation and DoD completion deterministic, enforceable, and visible across sessions.

## Definition of Done

Scope validation and DoD checks persist in state, block/phase progress updates correctly, and scope overrides require explicit approval.

---

## Tasks

| ID        | Task                                  | Status  | Done When |
|-----------|---------------------------------------|---------|----------|
| MVP-04-T1 | Persist scope validation outcome      | done    | Session records include scope_ok + unexpected_files and show in explain_changes |
| MVP-04-T2 | Enforce DoD pipeline + block progress | done    | complete_task checks validation status and updates task/block status |
| MVP-04-T3 | Scope override tool                   | pending | approve_scope_override tool exists and requires explicit approval |

> New tasks are added here as the block progresses via `init-task`.

---

## Active Task

| Field     | Value                      |
|-----------|----------------------------|
| Task ID   | MVP-04-T3                  |
| Title     | Scope override tool |
| Status    | pending                    |
| Done When | approve_scope_override tool exists and requires explicit approval |

---

## Change Plans

> One entry per task. Written by agent before coding. Approved by user before execution.

### MVP-04-T1 — Persist scope validation outcome

**Files to modify:**
- `src/state.ts` — add scope fields to Session
- `src/engine.ts` — persist scope validation + show in explain_changes
- `src/storage/schema.sql` — add scope columns for session
- `src/storage/sqlite.ts` — read/write scope fields

**Files to create:**
- none

**Files NOT touched:**
- `src/tools.ts`, `src/index.ts`

**Approach:**
Store scope validation results on the session record and surface them in explanations. Mirror fields in SQLite for persistence.

**Risks:**
Low. Session-level data only.

---

### MVP-04-T2 — Enforce DoD pipeline + block progress

**Files to modify:**
- `src/engine.ts` — block completion if scope validation failed; update block status when all tasks are done

**Files to create:**
- none

**Files NOT touched:**
- `src/tools.ts`, `src/index.ts`, `src/storage/*`

**Approach:**
Require `scope_ok === true` before completing a task. After DoD passes, update the parent block to `done` when all tasks are completed.

**Risks:**
Medium. Must avoid completing tasks when scope validation is missing.

---

## Refactor Backlog

> Spotted during this block. Do not touch until a dedicated refactor block.

- <!-- note -->

---

## Session Log

> One line per session. Written by agent on `/fi`.

| Date       | Task ID   | Status | Note |
|------------|-----------|--------|------|
| 2026-04-04 | MVP-04-T1 | done   | Stored scope validation in session + surfaced in explain_changes |
| 2026-04-04 | MVP-04-T2 | done   | Enforced scope validation and updated block completion logic |

---

_Last updated: 2026-04-04_
