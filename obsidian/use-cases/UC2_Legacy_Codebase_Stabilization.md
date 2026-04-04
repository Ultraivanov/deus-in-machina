---
tags: [use-case, legacy, stabilization]
---

# UC2: Legacy Codebase Stabilization

## Scenario

You inherit a large, messy codebase with unclear architecture and a fragile release process. You want Codex to help you stabilize and document the system without disrupting production.

## Goals

- Build a reliable architectural snapshot.
- Triage and prioritize technical debt.
- Create a repeatable Codex workflow for maintenance.

## Preconditions

- Repo exists and builds at least once.
- You can run `start` and `/fi` in the repo.

## Inputs

- `init-project.sh`
- Project profile: `software`
- Access to build commands and test commands.

## Expected Outputs

- `.codex/ARCHITECTURE.md` updated with a realistic system map.
- `.codex/BACKLOG.md` with a prioritized stabilization plan.
- `.codex/SNAPSHOT.md` with current operational state.

## Steps

1. Copy and run `init-project.sh` with `software`.
2. Commit `.codex/` files in a documentation-only commit.
3. Launch Codex and run `start`.
4. Ask Codex to inventory entry points, services, and critical dependencies.
5. Ask Codex to identify top failure modes from logs, tests, or production incidents.
6. Capture the system map in `.codex/ARCHITECTURE.md`.
7. Create a stabilization backlog in `.codex/BACKLOG.md` with top 5 critical items.
8. Create a short operational snapshot in `.codex/SNAPSHOT.md`.
9. Select one stabilization task and implement it.
10. Run `/fi` to finalize the session.

## Recommended Backlog Structure

- Critical: immediate reliability risks.
- High: security and data correctness issues.
- Medium: refactors that reduce operational cost.
- Low: cleanup and dev experience tasks.

## Definition of Done

- Architecture document is understandable by a new engineer.
- Backlog has a clear prioritization and owners.
- At least one stabilization task completed.

## Risks and Mitigations

- Risk: Incomplete system map due to hidden services.
- Mitigation: Add a “known unknowns” section to `ARCHITECTURE.md`.

- Risk: Stabilization plan too broad.
- Mitigation: Limit each backlog item to a one‑session change.

## Variations

- For multi‑repo systems, create a single `ARCHITECTURE.md` with repo links.
