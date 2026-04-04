# Protocol: init-block

Activated by `init-block <ID>` command.
Goal: analyze the target block, propose first 2-3 tasks, create block file, wait for approval.

---

## Step 1 — Load Context

Read in this order:
1. `PHASES.md` — confirm block ID exists and status is `pending`
2. `.codex/ARCHITECTURE.md` — technical constraints
3. `.codex/SNAPSHOT.md` — current project state
4. Any existing code relevant to this block

If block status is not `pending`, ask the user to confirm they want to re-open it.

---

## Step 2 — Analyze Block

From context, determine:
- What this block needs to deliver (block goal)
- What the Definition of Done is for the block as a whole
- What the first 2-3 tasks are

**Task design rules:**
- Each task must be completable in one session
- Each task must have a verifiable Done When condition
- Tasks are ordered by dependency — no task assumes work from a later task
- If the block is complex, plan only the first 2-3 tasks now. More will be added via `init-task` as the block progresses
- Task IDs follow the pattern: `<Block-ID>-T1`, `<Block-ID>-T2`, etc.

If context is insufficient to define even the first task, ask one focused question.

---

## Step 3 — Draft Block File

Generate a complete block file using `.codex/blocks/BLOCK-TEMPLATE.md` as the base.

Fill in:
- Block goal
- Definition of Done for the block
- First 2-3 tasks with IDs, titles, statuses (`pending`), and Done When conditions
- Active Task = first task
- Leave Change Plans, Refactor Backlog, and Session Log empty

---

## Step 4 — Present for Approval

Output the full draft block file in a code block, then append:

```
---
📋 Draft block file ready: <Block ID> — <Block Title>

Tasks proposed:
- <ID>: <title> → <done when>
- <ID>: <title> → <done when>
- <ID>: <title> → <done when>

Approve to create `.codex/blocks/<ID>.md` and open this block.
→ `approve` / describe changes / `cancel`
```

Wait for user response. Write nothing until `approve`.

---

## Step 5 — On Approval

When user responds `approve`:

1. Write block file to `.codex/blocks/<ID>.md`
2. Update `PHASES.md` — set block status to `in-progress`, update Active Block section
3. Confirm: `✓ Block <ID> open. Active task: <T1-ID> — <T1-title>.`
4. Ask: `Ready to start the first task? Run init-task.`

On changes: apply edits, re-present, return to Step 4.
On `cancel`: `init-block cancelled. No files written.` Stop.

---

## Constraints

- Never write files before `approve`
- Never plan more than 3 tasks upfront — the rest emerge via `init-task`
- Task Done When must be verifiable — rewrite vague ones internally
- Never open a block if another block is `in-progress` — ask user to resolve first
