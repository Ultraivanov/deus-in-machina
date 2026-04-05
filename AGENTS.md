# Codex Entry

This file is the primary entry point for Codex sessions.

## Quick Start

1. Run `./init-project.sh` in the host project.
2. Launch Codex in that project.
3. In chat, execute:

- `start`
- `/fi` when done

## State Files

Codex reads and updates the shared project context:

- `.codex/SNAPSHOT.md`
- `.codex/BACKLOG.md`
- `.codex/ARCHITECTURE.md`

For content projects, the files live under `.codex/content/`.
