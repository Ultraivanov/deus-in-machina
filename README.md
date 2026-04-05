# Buildrail

Deterministic execution layer for AI-assisted coding. It keeps projects **structured, scoped, and resumable** across sessions.

## Quickstart

1. Install dependencies:
   ```bash
   npm install
   ```
2. Run the MCP server:
   ```bash
   npm run dev
   ```
3. Follow an example flow:
   - `examples/codex-client.md`
   - `examples/claude-cursor-client.md`

## Release Summary

- File-first state with `.assistant/` as the source of truth.
- MCP tool surface with change-plan gating and scope validation.
- SQLite mirror, subscription usage counters, and hydration on startup.
- Risk-aware prompt generation with upgrade triggers for high-risk steps.
- Workflow templates, client examples, and a thin companion UI.
- Security, privacy, onboarding, and release docs included.

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

## Token Ownership & LLM Mode
- **Default (client_keys):** the user’s AI client (Codex / Claude / Cursor) pays for tokens. Buildrail does not call an LLM.
- **Optional (server_proxy):** the server pays for tokens if you add an LLM proxy layer. This requires your own provider keys and is not enabled in the skeleton. Free plans and non-active subscription states are blocked from server tokens by default.

Configure via environment:
- `BUILDRAIL_LLM_MODE=client_keys` (default)
- `BUILDRAIL_LLM_MODE=server_proxy` (requires provider integration and a paid plan)
- `BUILDRAIL_UPGRADE_URL=https://your.app/upgrade` (optional direct checkout link surfaced in errors)

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
4. `get_risk_profile` (optional, for UI-only risk display)
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

## Security

Release checklist: `docs/security-checklist.md`.

## Privacy

Notes: `docs/privacy-notes.md`.

## Dependency Audit

Report: `docs/dependency-audit.md`.

## Onboarding

Checklist: `docs/onboarding-checklist.md`.

## FAQ

Answers: `docs/faq.md`.

## Packaging

Guide: `docs/packaging-guide.md`.

## Hosted Deployment

Outline: `docs/hosted-deployment.md`.

## Release

Checklist: `docs/release-checklist.md`.

## Stripe

Integration guide: `docs/stripe-integration.md`.

### Stripe setup (test mode)
1. Create a Stripe account and enable Test Mode.
2. Set environment variables:
   - `STRIPE_SECRET_KEY`
   - `STRIPE_WEBHOOK_SECRET`
   - `STRIPE_PRICE_ID`
3. Run the MCP server and Stripe endpoints will be available on `BUILDRAIL_STRIPE_PORT`.

See `examples/claude-cursor-client.md` for the same full happy-path sequence.

## Happy Path Demo

Runs a full loop: initialize → next_step → prompt → submit → validate → complete.

```
npm install
node scripts/mcp-happy-path-demo.mjs
```

The demo writes file-first state into `.assistant/` (PHASES + SNAPSHOT).

## High-Risk (Free Plan) Demo

Shows how risk signals and soft paywalls appear on free.

```
node scripts/mcp-high-risk-free-demo.mjs
```

## MCP Resources & Prompts

List resources:
```json
{ "method": "resources/list", "params": {} }
```

Read a resource:
```json
{ "method": "resources/read", "params": { "uri": "buildrail://risk/signals" } }
```

List prompts:
```json
{ "method": "prompts/list", "params": {} }
```

Get a prompt:
```json
{ "method": "prompts/get", "params": { "name": "change_plan" } }
```

## Free vs Pro (Summary)

| Capability | Free | Pro |
| --- | --- | --- |
| Project limit | 1 | Unlimited |
| Sessions / month | 40 | 400 |
| Drift guard | No | Yes |
| Scope preview | No | Yes |
| Smart next step | No | Yes |
| Advanced explanations | No | Yes |
| Workflow graph | No | Yes |
