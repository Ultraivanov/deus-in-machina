# Dependency Audit

## Buildrail — MVP Dependencies

### Runtime dependencies
- `@modelcontextprotocol/sdk`
- `zod`
- `better-sqlite3`

### Dev dependencies
- `typescript`
- `tsx`
- `@types/better-sqlite3`

---

## Risks and Notes
- `better-sqlite3` is native; ensure target environments support it.
- MCP SDK versions should be pinned before release.

---

## Release Checklist
1. Run `npm audit` and record results.
2. Verify native module build compatibility.
3. Re-check SDK changelog for breaking changes.
