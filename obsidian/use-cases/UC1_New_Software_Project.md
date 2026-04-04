---
tags: [use-case, software, onboarding]
---

# UC1: New Software Project (Greenfield)

## Scenario

You are starting a new application or service and want Codex to operate with a consistent, deterministic project state from day one.

## Goals

- Establish a repeatable Codex workflow.
- Keep state files separate from product code.
- Ensure each session starts with the same context.

## Preconditions

- Node.js 18+ and Python 3.x installed.
- A clean repo with no `.codex/` directory yet.

## Inputs

- `init-project.sh`
- Project profile: `software`

## Expected Outputs

- `.codex/SNAPSHOT.md`
- `.codex/BACKLOG.md`
- `.codex/ARCHITECTURE.md`
- `.codex/.framework-config`

## Steps

1. Copy `init-project.sh` into the repo root.
2. Run `./init-project.sh` and select `software`.
3. Commit the generated `.codex/` files.
4. Launch Codex in the repo root.
5. In chat, run `start`.
6. Ask Codex to generate or confirm architecture notes in `.codex/ARCHITECTURE.md`.
7. Ask Codex to draft an initial backlog in `.codex/BACKLOG.md`.
8. Ask Codex to summarize project context in `.codex/SNAPSHOT.md`.
9. Work on the first feature branch.
10. In chat, run `/fi`.

## Session Artifacts

- `ARCHITECTURE.md` contains the system overview and key decisions.
- `BACKLOG.md` contains near‑term tasks and priorities.
- `SNAPSHOT.md` contains the up‑to‑date project snapshot.

## Definition of Done

- The `.codex/` files exist and are committed.
- The first Codex session ends with `/fi`.
- The project has a minimal backlog and architecture notes.

## Risks and Mitigations

- Risk: Architecture notes become stale.
- Mitigation: Update `ARCHITECTURE.md` at the end of each major feature.

- Risk: Backlog is too large or vague.
- Mitigation: Keep backlog items small and with a clear acceptance line.

## Variations

- If you prefer content workflow, use profile `content` and store state in `.codex/content/`.
