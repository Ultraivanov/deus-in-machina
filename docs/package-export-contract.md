# Package Export Contract

This document records the package surface declared by `/Users/dmitryivanov/Documents/DSR-Design System Runtime/package.json` as of `2026-04-30`.

It is intentionally descriptive, not normative. The purpose is to show:
- what the package currently declares
- what file each declaration targets
- whether that target exists in the repository
- what must be repaired in `PS-02-T2`

## Canonical Entrypoints

| Surface | Declared Path | Target File | Status | Notes |
|---------|---------------|-------------|--------|-------|
| package root | `main` and `exports["."]` | `src/index.js` | broken | `/Users/dmitryivanov/Documents/DSR-Design System Runtime/src/index.js` does not exist; repository currently has `/Users/dmitryivanov/Documents/DSR-Design System Runtime/src/index.ts` |
| CLI | `bin.dsr` | `bin/dsr.js` | ok | `/Users/dmitryivanov/Documents/DSR-Design System Runtime/bin/dsr.js` exists |

## Declared Subpath Exports

| Export Key | Declared Target | Actual File Present | Status | Notes |
|------------|-----------------|---------------------|--------|-------|
| `.` | `./src/index.js` | no | broken | root package import cannot resolve from current repository state |
| `./config` | `./src/config.js` | yes | ok | declared target exists |
| `./errors` | `./src/errors.js` | yes | ok | declared target exists; repo also contains `/Users/dmitryivanov/Documents/DSR-Design System Runtime/src/errors.ts` |
| `./logger` | `./src/logger.js` | yes | ok | declared target exists |
| `./metrics` | `./src/metrics.js` | yes | ok | declared target exists |
| `./telemetry` | `./src/telemetry.js` | yes | ok | declared target exists; repo also contains `/Users/dmitryivanov/Documents/DSR-Design System Runtime/src/telemetry.ts` |
| `./debug` | `./src/debug.js` | yes | ok | declared target exists |
| `./health` | `./src/health.js` | yes | ok | declared target exists |
| `./ruleset` | `./src/ruleset/index.js` | yes | ok | declared target exists |
| `./figma` | `./src/figma/index.js` | yes | ok | declared target exists |
| `./streaming` | `./src/streaming.js` | yes | ok | declared target exists |
| `./perf` | `./src/perf.js` | yes | ok | declared target exists |

## Current Contract Summary

- The package root surface is inconsistent: `package.json` declares `src/index.js`, but only `src/index.ts` exists.
- All currently declared subpath exports resolve to files that exist in the repository.
- The CLI entrypoint resolves to an existing file and is not part of the missing-root-export regression.
- The repository contains a mixed `js`/`ts` source layout. That is not itself a contract violation, but it increases the chance of export drift when `package.json` points at files that are not generated into the published surface.

## Repair Target For `PS-02-T2`

`PS-02-T2` should repair the package surface so that:
- root package import resolves without module-not-found errors
- `main` and `exports["."]` point at a real shipped file
- declared exports stay aligned with actual files included by the package
