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
| MVP-04-T1 | Persist scope validation outcome      | pending | Session records include scope_ok + unexpected_files and show in explain_changes |
| MVP-04-T2 | Enforce DoD pipeline + block progress | pending | complete_task checks validation status and updates task/block status |
| MVP-04-T3 | Scope override tool                   | pending | approve_scope_override tool exists and requires explicit approval |

> New tasks are added here as the block progresses via `init-task`.

---

## Active Task

| Field     | Value                      |
|-----------|----------------------------|
| Task ID   | MVP-04-T1                  |
| Title     | Persist scope validation outcome |
| Status    | pending                    |
| Done When | Session records include scope_ok + unexpected_files and show in explain_changes |

---

## Change Plans

> One entry per task. Written by agent before coding. Approved by user before execution.

---

## Refactor Backlog

> Spotted during this block. Do not touch until a dedicated refactor block.

- <!-- note -->

---

## Session Log

> One line per session. Written by agent on `/fi`.

| Date       | Task ID   | Status | Note |
|------------|-----------|--------|------|

---

_Last updated: 2026-04-04_
