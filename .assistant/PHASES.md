# PHASES — Project Progress State

> Single source of truth for phases and block status.
> Block details and tasks live in `.assistant/blocks/<ID>.md`.
> Updated at block open/close via `init-block` and `done`.

---

## Active Phase

| Field      | Value                      |
|------------|----------------------------|
| Phase      | Release                    |
| Goal       | Production launch          |
| Started    | 2026-04-04                 |
| Target     | Completed                  |

## Active Block

| Field      | Value                      |
|------------|----------------------------|
| Block ID   | R-04                       |
| Title      | Stripe billing integration |
| Status     | in-progress                |
| File       | `.assistant/blocks/R-04.md` |

---

## Phase Map

### Phase 1 — MVP
> Goal: working core loop, no polish

| ID     | Block                          | Status  |
|--------|--------------------------------|---------|
| MVP-01 | Product + MCP tool specs       | done    |
| MVP-02 | MCP server skeleton            | done    |
| MVP-03 | File-first state I/O           | done |
| MVP-04 | Scope + DoD validation pipeline| done |

### Phase 2 — Alpha
> Goal: internal testing, real users

| ID   | Block                          | Status  |
|------|--------------------------------|---------|
| A-01 | SQLite mirror + persistence    | done |
| A-02 | Repo awareness + allowed files | done |
| A-03 | Error handling + telemetry     | done |

### Phase 3 — Beta
> Goal: external testing, stability

| ID   | Block                          | Status  |
|------|--------------------------------|---------|
| B-01 | Client integration examples    | done |
| B-02 | Thin companion UI (optional)   | done |
| B-03 | Workflow graph templates       | done |

### Phase 4 — Release
> Goal: production launch

| ID   | Block                          | Status  |
|------|--------------------------------|---------|
| R-01 | Security + privacy review      | done |
| R-02 | Docs + onboarding              | done |
| R-03 | Packaging + hosted deployment  | done |
| R-04 | Stripe billing integration     | in-progress |

---

## Blocked

| ID | Block | Reason | Unblocked By |
|----|-------|--------|--------------|
|    |       |        |              |

---

_Last updated: 2026-04-05_
