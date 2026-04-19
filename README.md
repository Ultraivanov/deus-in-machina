# Deus In Machina (DIM)

Design System Runtime (DSR) — enforcement + structure + runtime for design systems. The focus is on **token normalization**, **pattern inference**, and **UI validation** with a fix loop.

## Overview
- Not a design generator.
- Not a design tool.
- A runtime that enforces structure and consistency across design system usage.

## Core Capabilities
- Token normalization: raw Figma data → semantic tokens.
- Pattern inference: detect reusable UI structures.
- Validation engine: lint UI against rules.
- Correction loop: generate fix instructions and re-validate.

## Pipeline
Figma → Extractor → Normalizer → Pattern Engine → Rules → Validator → Fix Loop

## MCP Toolchain
- `extract_figma_context`
- `normalize_tokens`
- `build_landing_spec`
- `generate_ui`
- `validate_ui`
- `fix_ui`
- `loop_until_valid`

## Repo Layout
- `dsr_spec_v3.md` — source specification
- `.codex/` — project state and protocols
- `README_RU.md` — Russian README
- `CHANGELOG.md` — project history

## Getting Started

1. **[Quick Start Guide](docs/quick-start.md)** — 5-minute setup and first validation
2. **[Ruleset Configuration](docs/ruleset-guide.md)** — Customize validation rules
3. **[Example Project](examples/pilot-project/)** — Working integration example
4. Read `dsr_spec_v3.md` for technical specification
5. Use `.codex/PHASES.md` to see active work

## CLI (v0)
```bash
npm install
node bin/dsr.js --help
```

Examples:
```bash
node bin/dsr.js extract --file AbCdEf123 --out context.json
node bin/dsr.js normalize --input context.json --out normalized.json
```

Note: the public CLI currently exposes the command surface, but the reproducible
Alpha verification flow runs through the fixture scripts below.

## Reproducible Alpha Fixture Run
Run the end-to-end pipeline on the committed real-export fixture and compare the
generated outputs against checked-in snapshots.

```bash
npm install
node scripts/run-e2e-pipeline.js
node scripts/compare-e2e-pipeline.js
```

Generated artifacts are written to:
- `examples/fixtures/pipeline-run/context.json`
- `examples/fixtures/pipeline-run/normalized.json`
- `examples/fixtures/pipeline-run/patterns.json`
- `examples/fixtures/pipeline-run/validation.json`
- `examples/fixtures/pipeline-run/fix-loop.json`

Expected snapshots are stored in:
- `examples/fixtures/pipeline-expected/context.json`
- `examples/fixtures/pipeline-expected/normalized.json`
- `examples/fixtures/pipeline-expected/patterns.json`
- `examples/fixtures/pipeline-expected/validation.json`
- `examples/fixtures/pipeline-expected/fix-loop.json`

The fixture source for this run is:
- `examples/fixtures/figma-export/section-form.input.json`
- `examples/fixtures/figma-export/section-form.code.txt`

Expected result:
- `run-e2e-pipeline.js` writes five JSON artifacts into `pipeline-run`
- `compare-e2e-pipeline.js` returns `"pass": true`

## Status
Active development. Phase 5 (Alpha Pilot) in progress.

## License
MIT. See `LICENSE`.
