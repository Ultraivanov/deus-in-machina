# PHASES — Project Progress State

> Single source of truth for phases and block status.
> Block details and tasks live in `.codex/blocks/<ID>.md`.
> Updated at block open/close via `init-block` and `done`.

---

## Active Phase

| Field      | Value                                   |
|------------|-----------------------------------------|
| Phase      | Phase 4 — Implementation & Pilot        |
| Goal       | Build runnable MVP and validate on real inputs |
| Started    | 2026-04-05                              |
| Target     | TBD                                     |

## Active Block

| Field      | Value                                    |
|------------|------------------------------------------|
| Block ID   | I-06                                     |
| Title      | Fix loop + pipeline integration          |
| Status     | in-progress                              |
| File       | `.codex/blocks/I-06.md`                  |

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
| P2-05 | CLI/runner for pipeline execution      | done        |

### Phase 3 — Moat Layer
> Goal: cross-project learning and pattern growth

| ID    | Block                              | Status  |
|-------|------------------------------------|---------|
| P3-01 | Pattern clustering across projects | done        |
| P3-02 | Pattern library auto-growth        | done        |
| P3-03 | Learning from usage signals        | done        |

---

## Blocked

| ID | Block | Reason | Unblocked By |
|----|-------|--------|--------------|
|    |       |        |              |

## Phase 4 — Implementation & Pilot
> Goal: runnable MVP and real-world validation

| ID    | Block                                | Status      |
|-------|--------------------------------------|-------------|
| I-01  | Runtime scaffold + CLI skeleton      | done        |
| I-02  | Extractor adapter (Figma input)      | done        |
| I-03  | Normalizer implementation            | done        |
| I-04  | Pattern engine implementation        | done        |
| I-05  | Validator implementation             | done        |
| I-06  | Fix loop + pipeline integration      | in-progress |

---

## Project Status

Phase 4 started (implementation).

---

_Last updated: 2026-04-05_
