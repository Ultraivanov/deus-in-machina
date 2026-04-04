# Privacy Notes

## Buildrail — Data Handling Summary

### What is stored
- Project state in `.assistant/` (inside the user repo).
- Session metadata (prompt snapshots, summaries, scope results).
- Usage counters for subscription gating (sessions/projects).
- Telemetry events (tool calls).

### Where it is stored
- File-first state lives in the repo (`.assistant/`).
- SQLite mirror lives locally (`.buildrail/buildrail.db` by default).
- Telemetry is local stdout unless a sink is configured.

### What is NOT stored
- No external uploads by default.
- No remote analytics unless explicitly added.

### Retention
- File-first state persists until deleted from the repo.
- SQLite mirror persists until deleted by the user.
- Telemetry logs are ephemeral unless captured by host.

### Deletion
- Delete `.assistant/` to remove file-first state.
- Delete `.buildrail/` to remove local DB mirror.
- Remove log files or disable telemetry sink.

### Notes
- User identifiers should be pseudonymous in local setups.
- Any hosted deployment must add explicit privacy controls.
