# SNAPSHOT — Design System Runtime (DSR)

## Summary
DSR is a runtime layer that enforces and structures design systems rather than generating designs. It consumes Figma-derived data, normalizes tokens, infers reusable UI patterns, validates compliance (linting), and drives a correction loop.

## Status
- Phase 4 complete (I-01 through I-06 done).
- Phase 5 in progress: A-03 block complete — Ruleset tuning + configuration.
- End-to-end runtime now includes normalizer, pattern engine, validator, fix loop with fixtures, and configurable rulesets (default/strict/relaxed profiles).

## Current Spec (v3)
Focus areas:
- Token Normalization Engine: strict semantic token mapping from raw Figma variables/styles.
- Pattern Inference Engine: detect reusable UI structures via heuristics and future clustering.
- Validation Engine (UI linting): enforce token use, spacing grid, component integrity, layout constraints, and pattern compliance.

## Conventions
- Semantic token naming: `category.role[.scale][.state]` (lowercase, dot-separated).
- State suffixes: `default`, `hover`, `disabled`, `focus`, `active` (extendable).

## Core Outputs
- `tokens` map (semantic token -> value)
- `patterns` list (name, confidence, structure)
- `validation` report (valid, errors, severity)

## Non-Goals
- Not a design generator.
- Not a design tool.

## Risks / Unknowns
- Figma naming diversity may complicate normalization heuristics.
- Defining sufficient validation rules without over-restricting design work.
- Pattern inference accuracy and false positives in varied layouts.

_Last updated: 2026-04-19_
