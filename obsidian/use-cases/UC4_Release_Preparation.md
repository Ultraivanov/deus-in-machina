---
tags: [use-case, release]
---

# UC4: Release Preparation

## Scenario

You need to ship a release and want Codex to coordinate release notes, checks, and risk review with a deterministic workflow.

## Goals

- Ensure all critical checks are executed.
- Capture a release snapshot and decisions.
- Document risks and mitigations.

## Preconditions

- Release scope defined.
- Tests and build commands available.

## Inputs

- Current release branch.
- Test checklist and deploy procedure.

## Expected Outputs

- Updated `.codex/SNAPSHOT.md` with release state.
- Backlog updated with post‑release tasks.
- Release notes recorded in a separate note (optional).

## Steps

1. Run `start` in Codex.
2. Ask Codex to summarize release scope in `SNAPSHOT.md`.
3. Run full test suite and record results in `SNAPSHOT.md`.
4. Ask Codex to list known risks and mitigations in `ARCHITECTURE.md` or a release note.
5. Execute release checklist.
6. Update `BACKLOG.md` with follow‑ups.
7. Run `/fi`.

## Release Checklist (Example)

- Build passes in CI.
- Critical regression tests pass.
- Deployment plan confirmed.
- Rollback plan documented.
- Monitoring dashboards verified.

## Definition of Done

- Release is deployed and verified.
- Snapshot contains scope, checks, and outcomes.
- Follow‑up tasks are in backlog.

## Risks and Mitigations

- Risk: Hidden breaking changes.
- Mitigation: Require a minimal regression suite and a rollback plan.

- Risk: Incomplete release notes.
- Mitigation: Include a final summary section in `SNAPSHOT.md`.
