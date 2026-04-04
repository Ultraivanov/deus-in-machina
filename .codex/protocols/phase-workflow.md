# Phase Workflow Protocol

Enforced rules for all phase-based development sessions.
These rules apply to every session, every block, every change.

---

## Rule 1 — One Block Per Session

The agent works on **exactly one block** per session.

- Block is taken from `PHASES.md → Active Block`.
- The agent does not start the next block without an explicit `done` command from the user.
- If a session ends before the block is complete, block status stays `in-progress`. The next session resumes it — does not restart.
- The agent never says "while I'm at it…" and touches adjacent code.

**Allowed commands to advance:**
- `done` — mark block complete, pick next block
- `block <ID>` — switch to a specific block explicitly
- `pause` — suspend current block, update status to `in-progress`, end session

---

## Rule 2 — Change Contract Before Code

Before writing any code, the agent **must output a change plan** and wait for approval.

Change plan format:

```
## Change Plan — <Block ID>

**Files to modify:**
- path/to/file.ts — reason

**Files to create:**
- path/to/new.ts — reason

**Files NOT touched:**
- everything else

**Approach:**
One paragraph. What the change does, how, and why this approach.

**Risks:**
Any side effects, dependencies, or things that could break.

Proceed? [yes / adjust / cancel]
```

The agent writes **zero code** until the user responds `yes` or a revised plan is approved.

---

## Rule 3 — Definition of Done

Every block has an explicit, pre-defined exit condition written in `PHASES.md`.

- Done When is set **before** the session starts, not after.
- The agent checks the Done When condition before declaring a block complete.
- If Done When is missing, the agent asks the user to define it before starting work.
- Done When must be verifiable: a passing test, a working URL, a specific user action — not "looks good."

Examples of valid Done When:
- ✅ `npm test` passes with no failures
- ✅ user can log in and see dashboard
- ✅ API returns 200 for all documented endpoints

Examples of invalid Done When:
- ❌ code is written
- ❌ looks correct
- ❌ should work

---

## Rule 4 — No Refactoring in Feature Sessions

If the agent notices code that should be refactored during a feature block:

1. It logs the item to `PHASES.md → Refactor Backlog` with a one-line note.
2. It continues with the feature block unchanged.
3. It does **not** refactor, rename, reorganize, or "clean up" anything outside the current block scope.

Refactoring is only allowed in a block explicitly typed as `refactor` in `PHASES.md`.

---

## Session Checklist

### On `start`

- [ ] Load `PHASES.md`
- [ ] Confirm Active Phase and Active Block with user
- [ ] Read Done When for the active block
- [ ] If Done When is missing — ask before proceeding

### On `done`

- [ ] Verify Done When conditions are met
- [ ] Update block status to `done` in `PHASES.md`
- [ ] Set next block as Active Block (or ask user which one)
- [ ] Append any refactor notes to Refactor Backlog

### On `/fi`

- [ ] Save current block status
- [ ] Note any in-progress items
- [ ] Write session summary to `SNAPSHOT.md`
