# Init Phases Protocol

## Trigger

User writes `init-phases` in chat.

## Steps

1. Read existing context: `SNAPSHOT.md`, `ARCHITECTURE.md`, `BACKLOG.md`, session history.
2. Determine project type, maturity, core user flow, and delivery risks.
3. Draft a full `PHASES.md` with phases, blocks, and Definition of Done per block.
4. Present the draft and request approval.
5. Only on explicit `approve` write or overwrite `.codex/PHASES.md`.

## Safety

- If `.codex/PHASES.md` exists, ask whether to overwrite or extend.
- Do not run mid-project without reviewing existing phase state.
