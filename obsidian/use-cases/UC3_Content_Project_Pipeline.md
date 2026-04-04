---
tags: [use-case, content]
---

# UC3: Content Project Pipeline

## Scenario

You are writing a course, a book, or a research report and want a stable Codex workflow that maintains context across long writing sessions.

## Goals

- Separate content memory from software workflows.
- Track outline, milestones, and editorial tasks.
- Maintain a consistent snapshot of the draft state.

## Preconditions

- Project may contain mostly markdown or docs.
- You can install Codex files in the project root.

## Inputs

- `init-project.sh`
- Project profile: `content`

## Expected Outputs

- `.codex/content/ARCHITECTURE.md` as content architecture.
- `.codex/content/BACKLOG.md` as editorial backlog.
- `.codex/content/SNAPSHOT.md` as writing state.

## Steps

1. Run `./init-project.sh` and select `content`.
2. Commit the `.codex/content/` files.
3. Launch Codex and run `start`.
4. Ask Codex to outline the content structure in `ARCHITECTURE.md`.
5. Ask Codex to list top editorial tasks in `BACKLOG.md`.
6. Ask Codex to summarize current draft progress in `SNAPSHOT.md`.
7. Write or revise one major section.
8. Update backlog with new tasks or blockers.
9. Run `/fi` to finalize the session.

## Content Architecture Example

- Audience and learning outcomes.
- Chapter or module hierarchy.
- Style guide and voice rules.
- Reference sources and citation rules.

## Definition of Done

- Content outline is stable and explicit.
- Editorial backlog exists with next 5 tasks.
- Snapshot reflects the latest draft status.

## Risks and Mitigations

- Risk: Draft summary becomes too long.
- Mitigation: Limit `SNAPSHOT.md` to one page maximum.

- Risk: Backlog ignores editorial feedback.
- Mitigation: Add a dedicated “Feedback” section in `BACKLOG.md`.

## Variations

- Use a separate “Research” subfolder and link it from `ARCHITECTURE.md`.
