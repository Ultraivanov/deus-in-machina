# Protocol: init-task

Activated by `init-task` command.
Goal: take the next pending task from the active block file, write a Change Plan, wait for approval.

---

## Step 1 — Load Active Block

Read `.codex/blocks/<active-block-ID>.md` from the Active Block section of `PHASES.md`.

From the block file, identify:
- Active Task (current in-progress task, if any)
- Next pending task (first row with status `pending`)

If Active Task is `in-progress` — ask the user: is this task done, or continuing it?
- If done → run `done` protocol first, then return here
- If continuing → skip to Step 3 (Change Plan), resume the existing task

If no pending tasks remain in the task table → tell the user all tasks are done and suggest running `done` to close the block.

---

## Step 2 — Propose Next Task (if needed)

If the pending task list has fewer than 2 remaining tasks, propose 1-2 new tasks before starting.

New task rules:
- Must follow from block goal and remaining work
- Must be atomic — completable in one session
- Must have a verifiable Done When
- Propose as a short list, wait for `approve` before adding to block file

If the task list is sufficient, skip this step.

---

## Step 3 — Change Plan

For the active task, generate a Change Plan:

```
## Change Plan — <Task ID>: <Task Title>

**Files to modify:**
- `path/to/file` — reason

**Files to create:**
- `path/to/file` — reason

**Files NOT touched:**
- everything else in scope

**Approach:**
One paragraph. What the change does, how, and why this approach.

**Risks:**
Any side effects, dependencies, or things that could break.

Done When: <copied from task row>

Proceed? [yes / adjust / cancel]
```

Write zero code until user responds `yes`.

---

## Step 4 — On Approval

When user responds `yes`:

1. Update block file — set Active Task status to `in-progress`
2. Append Change Plan to block file under `## Change Plans`
3. Confirm: `✓ Task <ID> started. Proceeding with implementation.`
4. Write code

If task turns out larger than one session during implementation:
- Stop coding
- Propose splitting into subtasks: `<ID>-T1a`, `<ID>-T1b`
- Wait for `approve` before continuing

On `adjust`: revise plan, re-present.
On `cancel`: `init-task cancelled. No files written.` Stop.

---

## Constraints

- Never write code before Change Plan is approved
- Never start a task if another task is `in-progress` in the same block
- Never touch files outside the Change Plan scope
- If spotted refactor opportunity — log to block file `## Refactor Backlog`, do not touch
