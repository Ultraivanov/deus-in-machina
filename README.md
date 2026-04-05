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
1. Read `dsr_spec_v3.md`.
2. Use `.codex/PHASES.md` to see active work.
3. Follow block files under `.codex/blocks/`.

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

## Status
Active development. Phase 4 (Implementation & Pilot) in progress.

## License
MIT. See `LICENSE`.
