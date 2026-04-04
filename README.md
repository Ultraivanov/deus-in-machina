# Buildrail

Deterministic execution layer for AI-assisted coding. It keeps projects **structured, scoped, and resumable** across sessions.

## Why
AI assistants are powerful but session-fragile. This product makes work predictable by storing context, scope, and progress in files and enforcing approval gates.

## What It Enables
- One task per session with explicit Change Plan approval.
- Clear “Done When” criteria and scope boundaries.
- Safe, resumable progress even after long breaks.
- Human- and assistant-friendly handoff.

## Architecture (MVP)
```
User ↔ AI Client (Codex / Claude / Cursor)
       ↕
     MCP Server (this product)
       ↕
Repo / .assistant state files
```

## Specs
- `ai-project-companion-spec.md`
- `mcp-tools-spec.md`
- `workflow-engine-spec.md`
- `state-model-spec.md`

## Repo Status
Private MVP v0.1

## MCP Server (Skeleton)

```
npm install
npm run dev
```

This starts a minimal MCP server over stdio with stub handlers for the MVP tools.

## Codex Integration Example

See `examples/codex-client.md` for a full, runnable tool-call sequence.

## Happy Path Demo

Runs a full loop: initialize → next_step → prompt → submit → validate → complete.

```
npm install
./node_modules/.bin/tsx scripts/happy-path-demo.ts
```

The demo writes file-first state into `.assistant/` (PHASES + SNAPSHOT).
