# Hosted Deployment Outline

## Overview
Buildrail MCP server runs over stdio. For hosted environments, wrap it with a process manager or adapter that exposes tool calls via HTTP or a queue.

## Minimal Steps
1. Build the server: `npm run build`
2. Start the server: `npm run start`
3. Provide required environment variables:
   - `BUILDRAIL_DB_PATH`
   - `BUILDRAIL_PLAN` (optional)

## Deployment Notes
- MCP stdio is not directly HTTP; a lightweight adapter is required.
- Prefer running in a single-tenant environment for early versions.
- Ensure log storage is private.

## Suggested Hosts
- Render (simple Node service)
- Fly.io (process manager + persistent volume)
- Self-hosted container
