# Release Smoke Triage

This document records the baseline smoke-run failures for the released DSR codebase
and maps them to the next repair blocks.

## Baseline

- Baseline report: [`docs/release-smoke-results.baseline.json`](/Users/dmitryivanov/Documents/DSR-Design System Runtime/docs/release-smoke-results.baseline.json)
- Smoke manifest: [`docs/release-smoke-matrix.json`](/Users/dmitryivanov/Documents/DSR-Design System Runtime/docs/release-smoke-matrix.json)
- Smoke runner: [`scripts/run-release-smoke.js`](/Users/dmitryivanov/Documents/DSR-Design System Runtime/scripts/run-release-smoke.js)

Summary from baseline run:
- total checks: `6`
- passing: `2`
- failing: `4`
- suspicious pass-with-regression: `1`

## Failing Checks

### `package-entrypoint-import`

- Status: failing
- Symptom: import of `./src/index.js` fails with module-not-found
- Root cause: [`package.json`](/Users/dmitryivanov/Documents/DSR-Design System Runtime/package.json) exports `./src/index.js`, but the repository currently ships [`src/index.ts`](/Users/dmitryivanov/Documents/DSR-Design System Runtime/src/index.ts)
- Repair block: `PS-02`

### `validator-vectors`

- Status: failing
- Symptom: validator vector runner returns `pass=false` for all vectors
- Root cause: [`scripts/run-validator-vectors.js`](/Users/dmitryivanov/Documents/DSR-Design System Runtime/scripts/run-validator-vectors.js) still treats async `validateUI()` as a synchronous result
- Repair block: `PS-03`

### `loop-vectors`

- Status: failing
- Symptom: fix-loop vector runner returns `pass=false` for all vectors
- Root cause: [`scripts/run-loop-vectors.js`](/Users/dmitryivanov/Documents/DSR-Design System Runtime/scripts/run-loop-vectors.js) still treats async `runFixLoop()` as a synchronous result
- Repair block: `PS-03`

### `pipeline-compare`

- Status: failing
- Symptom: comparison fails for `validation.json` and `fix-loop.json`
- Root cause: upstream pipeline writes invalid artifacts after unresolved async validator/fix-loop calls
- Repair block: `PS-03`

## Suspicious Passing Check

### `pipeline-run`

- Status: passes exit-code check, but still regressed
- Symptom: script exits `0` and writes artifacts, but `validation.json` and `fix-loop.json` are not trustworthy until async handling is fixed
- Repair block: `PS-03`

## Passing Check

### `cli-help`

- Status: passing
- Notes: keep as a continuing smoke gate; no repair action needed

## Recommended Repair Sequence

1. `PS-02`: fix package entrypoint and export surface so the package can be imported reliably.
2. `PS-03`: refactor async smoke paths and runner scripts, then re-run release smoke until vector and pipeline checks pass.
3. `PS-04`: sync README, release docs, and regression checklist with the repaired package surface and smoke outcomes.
