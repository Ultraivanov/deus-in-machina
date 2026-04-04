If scope drifts, validation returns `needs_approval` and you can explicitly approve overrides.

## How do I reset a project?
Delete `.assistant/` and optionally `.buildrail/` to reset state.

## Is my data sent anywhere?
Not by default. Telemetry is local unless you configure a sink.

## How do I change subscription limits?
Set `BUILDRAIL_PLAN` or manage your subscription records in SQLite.

## Does Buildrail work with Codex / Claude / Cursor?
Yes, via MCP tool calls. Examples are in `examples/`.

## Can I disable telemetry?
Yes. Remove the telemetry sink or override it with a no-op sink.
