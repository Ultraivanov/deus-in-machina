---
tags: [use-case, backlog]
---

# UC5: Ongoing Backlog Grooming

## Scenario

You run Codex sessions weekly and want a predictable cadence for reviewing tasks, pruning low‑value items, and keeping the backlog actionable.

## Goals

- Keep backlog small and current.
- Ensure each item is ready for execution in a single session.
- Maintain a short snapshot that reflects current priorities.

## Preconditions

- `.codex/BACKLOG.md` exists.
- Team agrees on priority tiers.

## Inputs

- Current `BACKLOG.md`.
- Recent changes or incidents.

## Expected Outputs

- Backlog trimmed and reprioritized.
- Snapshot updated with the week’s focus.
- Clear list of next 3–5 actions.

## Steps

1. Run `start`.
2. Ask Codex to list the top 10 backlog items by impact.
3. Remove or archive low‑value items.
4. Split any item that cannot be completed in one session.
5. Update priorities (Critical, High, Medium, Low).
6. Update `SNAPSHOT.md` with the next week’s focus.
7. Run `/fi`.

## Backlog Hygiene Rules

- Each item should fit in one session.
- Each item must have a clear acceptance line.
- No more than 5 Critical items at a time.

## Definition of Done

- Backlog has no stale or vague entries.
- Top priorities are clearly stated.
- Snapshot matches the new priorities.

## Risks and Mitigations

- Risk: Backlog grows faster than it’s groomed.
- Mitigation: Reserve a fixed weekly session for grooming.

- Risk: Over‑prioritization of urgent work.
- Mitigation: Keep at least one Medium task scheduled each week.
