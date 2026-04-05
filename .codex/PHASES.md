# PHASES — Project Progress State

> Single source of truth for phases and block status.
> Block details and tasks live in `.codex/blocks/<ID>.md`.
> Updated at block open/close via `init-block` and `done`.

---

## Active Phase

| Field      | Value                                   |
|------------|-----------------------------------------|
| Phase      | Foundation & Spec Lock                  |
| Goal       | Lock v3 architecture and data contracts |
| Started    | 2026-04-05                              |
| Target     | TBD                                     |

## Active Block

| Field      | Value                                    |
|------------|------------------------------------------|
| Block ID   | P3-03                                    |
| Title      | Learning from usage signals              |
| Status     | in-progress                              |
| File       | `.codex/blocks/P3-03.md`                 |

---

## Phase Map

### Phase 1 — Foundation & Spec Lock
> Goal: codify v3 models, rules, and contracts

| ID    | Block                                   | Status      |
|-------|-----------------------------------------|-------------|
| P1-01 | Token model + mapping rules             | done        |
| P1-02 | Pattern inference heuristics v1          | done        |
| P1-03 | Validation rules + severity model        | done        |
| P1-04 | Correction flow + fix instruction format | done        |
| P1-05 | Data contracts + examples                | done        |

### Phase 2 — MVP Runtime
> Goal: runnable pipeline with test vectors

| ID    | Block                                  | Status  |
|-------|----------------------------------------|---------|
| P2-01 | Extractor interface contract           | done        |
| P2-02 | Normalizer implementation stub         | done        |
| P2-03 | Pattern engine implementation stub     | done        |
| P2-04 | Validator implementation stub          | done        |
| P2-05 | CLI/runner for pipeline execution      | in-progress |

### Phase 3 — Moat Layer
> Goal: cross-project learning and pattern growth

| ID    | Block                              | Status  |
|-------|------------------------------------|---------|
| P3-01 | Pattern clustering across projects | in-progress |
| P3-02 | Pattern library auto-growth        | in-progress |
| P3-03 | Learning from usage signals        | in-progress |

---

## Blocked

| ID | Block | Reason | Unblocked By |
|----|-------|--------|--------------|
|    |       |        |              |

---

_Last updated: 2026-04-05_
