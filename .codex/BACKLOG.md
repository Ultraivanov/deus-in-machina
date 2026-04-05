# BACKLOG — DSR v3

## MVP Scope (v3)
- Token Normalization Engine (raw -> normalized -> semantic)
- Pattern Inference Engine (heuristics v1)
- Validation Engine (UI linting)
- Correction Engine (fix loop)
- End-to-end pipeline and data contracts

## Proposed Phases / Blocks

### Phase 1 — Foundation & Spec Lock
- P1-01 Token model + mapping rules
- P1-02 Pattern inference heuristics v1
- P1-03 Validation rules + severity model
- P1-04 Correction flow + fix instruction format
- P1-05 Data contracts (JSON schemas) + examples

### Phase 2 — MVP Runtime
- P2-01 Extractor interface (Figma tree input contract)
- P2-02 Normalizer implementation stub + test vectors
- P2-03 Pattern engine implementation stub + test vectors
- P2-04 Validator implementation stub + test vectors
- P2-05 CLI/runner for pipeline execution

### Phase 3 — Moat Layer (Future)
- P3-01 Pattern clustering across projects
- P3-02 Pattern library auto-growth
- P3-03 Learning from usage signals

## Open Questions
- What exact Figma export format is used as input (REST export, plugin dump, other)?
- What is the minimum viable schema for extractor output?
- Do we need a versioned token namespace (e.g. `dsr.v1`)?
- How strict should validation be by default (block vs warn)?

_Last updated: 2026-04-05_
