If scope drifts, validation returns `needs_approval` and you can explicitly approve overrides.

## How do I reset a project?
Delete `.assistant/` and optionally `.buildrail/` to reset state.

## Is my data sent anywhere?
Not by default. Telemetry is local unless you configure a sink.

## Whose tokens are used?
By default, the user’s AI client pays for tokens (`client_keys`). Buildrail does not call an LLM.
If you add a server-side LLM proxy, switch to `BUILDRAIL_LLM_MODE=server_proxy` and use your own provider keys.
Free plans and non-active subscription states are blocked from server tokens by default.

## How do I change subscription limits?
Set `BUILDRAIL_PLAN` or manage your subscription records in SQLite.

## Does Buildrail work with Codex / Claude / Cursor?
Yes, via MCP tool calls. Examples are in `examples/`.

## Can I disable telemetry?
Yes. Remove the telemetry sink or override it with a no-op sink.
