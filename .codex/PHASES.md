# PHASES — Project Progress State

> Single source of truth for phases and block status.
> Block details and tasks live in `.codex/blocks/<ID>.md`.
> Updated at block open/close via `init-block` and `done`.

---

## Active Phase

| Field      | Value                      |
|------------|----------------------------|
| Phase      | <!-- e.g. MVP -->          |
| Goal       | <!-- one sentence -->      |
| Started    | <!-- YYYY-MM-DD -->        |
| Target     | <!-- YYYY-MM-DD or TBD --> |

## Active Block

| Field      | Value                      |
|------------|----------------------------|
| Block ID   | <!-- e.g. MVP-01 -->       |
| Title      | <!-- e.g. Auth flow -->    |
| Status     | <!-- pending / in-progress / done / blocked --> |
| File       | `.codex/blocks/MVP-01.md` |

---

## Phase Map

### Phase 1 — MVP
> Goal: working core loop, no polish

| ID     | Block             | Status  |
|--------|-------------------|---------|
| MVP-01 | Project scaffold  | pending |
| MVP-02 | Data model        | pending |
| MVP-03 | Core API          | pending |
| MVP-04 | Minimal UI        | pending |

### Phase 2 — Alpha
> Goal: internal testing, real users

| ID   | Block            | Status  |
|------|------------------|---------|
| A-01 | Auth             | pending |
| A-02 | Error handling   | pending |
| A-03 | Basic analytics  | pending |

### Phase 3 — Beta
> Goal: external testing, stability

| ID   | Block            | Status  |
|------|------------------|---------|
| B-01 | Performance pass | pending |
| B-02 | Security review  | pending |
| B-03 | Onboarding flow  | pending |

### Phase 4 — Release
> Goal: production launch

| ID   | Block               | Status  |
|------|---------------------|---------|
| R-01 | Prod infrastructure | pending |
| R-02 | Docs                | pending |
| R-03 | Launch checklist    | pending |

---

## Blocked

| ID | Block | Reason | Unblocked By |
|----|-------|--------|--------------|
|    |       |        |              |

---

_Last updated: <!-- YYYY-MM-DD -->_
