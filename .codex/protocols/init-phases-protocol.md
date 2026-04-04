# Protocol: init-phases

Activated by the `init-phases` command.
Goal: analyze available project context, infer structure, generate a draft `PHASES.md`, present for approval.

---

## Step 1 — Context Scan

Read all available artifacts in this order. Do not ask the user for information that can be inferred from these files.

1. `.codex/SNAPSHOT.md` — current project state, recent decisions
2. `.codex/ARCHITECTURE.md` — technical stack, structure, constraints
3. `.codex/BACKLOG.md` — pending tasks, known unknowns
4. Chat history of the current session — stated goals, ideas, constraints

From this, extract:
- **Project type** — infer from stack and goals (e.g. SaaS web app, mobile app, content platform, internal tool, API service, content/course project)
- **Current maturity** — is this a blank slate, a prototype, or an existing product?
- **Core user flow** — what is the one thing this product must do?
- **Known constraints** — deadline, solo vs team, hard technical limits

If any of these four are completely absent from all sources, ask the user **one focused question** that resolves the most critical gap. Do not ask more than one question. Do not ask if you can infer a reasonable answer.

---

## Step 2 — Phase Structure Inference

Based on project type and maturity, determine which phases are relevant and what each phase's goal is.

Default phase sequence: **MVP → Alpha → Beta → Release**

Adjust as needed:
- Blank slate → all four phases
- Existing prototype → start from Alpha or Beta
- Content/course project → rename phases to match: Draft → Review → Polish → Publish
- Internal tool → MVP → Pilot → Stable
- API service → Core → Integration → Hardening → GA

For each phase, define:
- One-sentence goal
- 3–6 blocks that represent the work to be done
- A Definition of Done per block (specific and verifiable)

Block IDs follow the pattern: `MVP-01`, `A-01`, `B-01`, `R-01`
For non-standard phases, use abbreviated prefix: `DR-01`, `PL-01`, etc.

---

## Step 3 — Draft Generation

Generate a complete `PHASES.md` draft using the template from `.codex/PHASES.md` (if it exists) or the standard format below.

Fill in:
- Active Phase = first phase (or current phase if project is mid-flight)
- Active Block = first block of the active phase
- All phase tables with inferred blocks, statuses (`pending`), and Done When conditions
- Leave Blocked and Refactor Backlog sections empty

Do not invent blocks for the sake of completeness. 4 solid blocks per phase beats 8 vague ones.

---

## Step 4 — Present for Approval

Output the full draft `PHASES.md` in a code block, then append:

```
---
📋 Draft PHASES.md ready.

Review the phases and blocks above.
- Approve as-is → `approve`
- Request changes → describe what to adjust
- Cancel → `cancel`
```

Wait for user response. Do not write any files until `approve` is received.

---

## Step 5 — On Approval

When user responds `approve`:

1. Write the approved content to `.codex/PHASES.md`
2. Confirm with a single line: `✓ PHASES.md saved. Active block: <Block ID> — <Block title>.`
3. Ask: `Ready to start the first block?`

When user requests changes:
- Apply the requested edits to the draft
- Re-present the full updated draft
- Return to Step 4

When user responds `cancel`:
- Acknowledge with one line: `init-phases cancelled. No files written.`
- Stop

---

## Constraints

- Never write to `.codex/PHASES.md` before `approve`
- Never invent technical details not present in the context
- Never ask more than one clarifying question per cycle
- Keep Done When conditions verifiable — reject vague ones internally and write better ones
- If the project context is rich, go straight to Step 3 with zero questions
