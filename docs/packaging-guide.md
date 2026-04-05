# Packaging Guide

## Buildrail — Build & Run

### Build
```bash
npm run build
```

### Run
```bash
npm run start
```

### Output
- Compiled output is written to `dist/`.

### Environment
- `BUILDRAIL_DB_PATH` — optional SQLite path (default: `.buildrail/buildrail.db`).
- `BUILDRAIL_PLAN` — optional plan override (`free` or `pro`).
- `BUILDRAIL_LLM_MODE` — `client_keys` (default) or `server_proxy` (requires provider integration; free plans are blocked).
- `BUILDRAIL_UPGRADE_URL` — optional direct checkout link to surface in upgrade-required errors.
