# Security Checklist

## Buildrail — Release Readiness

### 1) Secrets and Keys
- No secrets in repo or logs.
- Environment variables documented and rotated.
- `.env` and similar files in `.gitignore`.

### 2) MCP Server Surface
- Tool inputs are validated and sanitized.
- Unknown tool names return structured errors.
- File-first state writes are safe and bounded.

### 3) File System Access
- Repo scanning excludes `.git`, `node_modules`, `.assistant`, `.buildrail`.
- No arbitrary file read/write outside repo root.

### 4) Data Storage (SQLite)
- DB path is configurable via `BUILDRAIL_DB_PATH`.
- DB files are local-only and not exposed via UI.
- Backups are optional and encrypted if used.

### 5) Authentication (if added)
- Plan for auth tokens + user identity mapping.
- Verify user_id association on each tool call.

### 6) Logging and Telemetry
- Telemetry payloads exclude secrets.
- Error logs sampled and do not include PII.
- Logs are structured JSON only.

### 7) Dependency Risk
- Dependencies pinned.
- Audit performed before release.

### 8) Threat Scenarios
- Scope override requires explicit approval.
- Drift guard does not allow silent changes.
- Session limits enforced on server layer.

### 9) Privacy
- Document what data is stored (sessions, prompts, scope).
- Provide a deletion path (manual or automated).

### 10) Release Gate
- Checklist reviewed and signed off.
