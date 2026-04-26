# Release Smoke Matrix

This matrix defines the minimum post-release smoke checks for DSR package usability
and core runtime behavior.

## Scope

The matrix covers:
- package entrypoint resolution
- CLI help rendering
- validator fixture vectors
- fix-loop fixture vectors
- end-to-end pipeline execution
- end-to-end pipeline snapshot comparison

## Checks

| ID | Purpose | Expected Result | Current Known Status |
|----|---------|-----------------|----------------------|
| `package-entrypoint-import` | Verify root package entrypoint resolves | exit code `0` | failing |
| `cli-help` | Verify CLI binary is callable | exit code `0` | passing |
| `validator-vectors` | Verify validator fixtures still pass | exit code `0` | failing |
| `loop-vectors` | Verify fix-loop fixtures still pass | exit code `0` | failing |
| `pipeline-run` | Verify end-to-end runner completes | exit code `0` and writes artifacts | passing with regression |
| `pipeline-compare` | Verify pipeline artifacts match expected snapshots | exit code `0` | failing |

## Why These Checks Exist

- `package-entrypoint-import` catches packaging/export regressions that unit tests do not cover.
- `cli-help` verifies the released binary remains callable after release packaging changes.
- `validator-vectors` and `loop-vectors` guard fixture runners that were broken by async API changes.
- `pipeline-run` verifies the happy path script still executes.
- `pipeline-compare` catches false-positive pipeline runs where unresolved async results serialize to empty JSON objects.

## Confirmed Regressions Captured By This Matrix

1. `package.json` exports `./src/index.js`, but the repository currently ships [`src/index.ts`](/Users/dmitryivanov/Documents/DSR-Design System Runtime/src/index.ts) instead of [`src/index.js`](/Users/dmitryivanov/Documents/DSR-Design System Runtime/src/index.js).
2. [`scripts/run-validator-vectors.js`](/Users/dmitryivanov/Documents/DSR-Design System Runtime/scripts/run-validator-vectors.js) still calls `validateUI()` synchronously.
3. [`scripts/run-loop-vectors.js`](/Users/dmitryivanov/Documents/DSR-Design System Runtime/scripts/run-loop-vectors.js) still calls `runFixLoop()` synchronously.
4. [`scripts/run-e2e-pipeline.js`](/Users/dmitryivanov/Documents/DSR-Design System Runtime/scripts/run-e2e-pipeline.js) exits successfully while writing invalid `validation.json` and `fix-loop.json` artifacts unless async results are awaited.

## Next Block Interface

`PS-01-T2` should treat [`docs/release-smoke-matrix.json`](/Users/dmitryivanov/Documents/DSR-Design System Runtime/docs/release-smoke-matrix.json) as the executable manifest for a smoke runner and should report:
- per-check command
- exit code
- pass/fail status
- stderr/stdout excerpts when a check fails
