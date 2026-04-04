# Phase Workflow Protocol

## Purpose

Define a deterministic, phase-based delivery workflow for Codex sessions.

## Rules

- Each session operates on a single block only.
- Confirm active phase and block before any work.
- Produce a Change Plan and wait for approval before editing code.
- Do not refactor outside the current block scope.
- A block is complete only when its Definition of Done is verified.

## Phases

- MVP
- Alpha
- Beta
- Release

## Block IDs

Use:

- `MVP-01`, `MVP-02`...
- `A-01`, `A-02`...
- `B-01`, `B-02`...
- `R-01`, `R-02`...

## State Location

Current phase state is stored in `.codex/PHASES.md`.
