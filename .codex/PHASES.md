# PHASES — Project Progress State

> Single source of truth for phase and block status.
> Updated at the start and finish of every session via `start` / `/fi` protocols.

---

## Active Phase

| Field        | Value                        |
|--------------|------------------------------|
| Phase        | <!-- e.g. MVP -->            |
| Phase goal   | <!-- one sentence -->        |
| Started      | <!-- YYYY-MM-DD -->          |
| Target       | <!-- YYYY-MM-DD or TBD -->   |

---

## Active Block

| Field        | Value                        |
|--------------|------------------------------|
| Block ID     | <!-- e.g. MVP-03 -->         |
| Block title  | <!-- e.g. Auth flow -->      |
| Status       | <!-- pending / in-progress / done / blocked --> |
| Started      | <!-- YYYY-MM-DD -->          |
| Done when    | <!-- definition of done, copied from block spec --> |

---

## Phase Map

### Phase 1 — MVP
> Goal: working core loop, no polish

| ID     | Block                  | Status  | Done When                        |
|--------|------------------------|---------|----------------------------------|
| MVP-01 | Project scaffold       | pending | repo runs locally                |
| MVP-02 | Data model             | pending | schema migrated, tests pass      |
| MVP-03 | Core API               | pending | endpoints return correct data    |
| MVP-04 | Minimal UI             | pending | user can complete main flow      |

### Phase 2 — Alpha
> Goal: internal testing, real users

| ID     | Block                  | Status  | Done When                        |
|--------|------------------------|---------|----------------------------------|
| A-01   | Auth                   | pending | login/logout works end-to-end    |
| A-02   | Error handling         | pending | no unhandled exceptions in logs  |
| A-03   | Basic analytics        | pending | events tracked in dashboard      |

### Phase 3 — Beta
> Goal: external testing, stability

| ID     | Block                  | Status  | Done When                        |
|--------|------------------------|---------|----------------------------------|
| B-01   | Performance pass       | pending | p95 < 500ms under load           |
| B-02   | Security review        | pending | no critical findings             |
| B-03   | Onboarding flow        | pending | 3 external users complete signup |

### Phase 4 — Release
> Goal: production launch

| ID     | Block                  | Status  | Done When                        |
|--------|------------------------|---------|----------------------------------|
| R-01   | Prod infrastructure    | pending | deployed, monitored              |
| R-02   | Docs                   | pending | README + API docs published      |
| R-03   | Launch checklist       | pending | all items checked off            |

---

## Blocked / Deferred

> Items that cannot proceed. Reason required.

| ID | Block | Reason | Unblocked By |
|----|-------|--------|--------------|
|    |       |        |              |

---

## Refactor Backlog

> Spotted during feature sessions. Do not touch until a dedicated refactor block.

- <!-- example: extract auth logic from UserController → AuthService -->

---

_Last updated: <!-- YYYY-MM-DD session ID -->_
