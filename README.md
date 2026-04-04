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

## Integration

### Run the server

```
npm install
npm run dev
```

### Example flows

Codex:
See `examples/codex-client.md` for a full, runnable tool-call sequence.

Claude / Cursor:
See `examples/claude-cursor-client.md` for the same full happy-path sequence.

### Happy-path tool order

1. `initialize_project`
2. `get_next_step`
3. `generate_agent_prompt`
4. `start_session`
5. `submit_agent_result`
6. `validate_scope`
7. `explain_changes`
8. `complete_task`

## Workflow Templates

Templates live in `templates/` as JSON (phases → blocks → tasks).
Examples:
- `templates/saas-landing.json`
- `templates/auth-dashboard.json`

See `examples/claude-cursor-client.md` for the same full happy-path sequence.

## Happy Path Demo

Runs a full loop: initialize → next_step → prompt → submit → validate → complete.

```
npm install
./node_modules/.bin/tsx scripts/happy-path-demo.ts
```

The demo writes file-first state into `.assistant/` (PHASES + SNAPSHOT).
