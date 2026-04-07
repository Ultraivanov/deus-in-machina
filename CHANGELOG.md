# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]
### Added
- Provider-agnostic design contracts in `src/design/contracts.ts`:
  `DesignProvider`, `DesignRequest`, `DesignArtifact`, and `ValidationResult`.
- Design generation architecture notes (canonical `DESIGN.md` + provider adapters)
  in `README_RU.md` and `.codex/ARCHITECTURE.md`.
- Scaffolding for design generation orchestration and provider stubs:
  `src/design/orchestrator.ts`, `src/design/providers/stitch.ts`,
  `src/design/providers/figma.ts`.

## [0.1.0] - 2026-04-05
### Added
- DSR v3 specification and project context in `.codex/`.
- Token normalization, pattern inference, validation, and correction flow specs.
- MCP toolchain definitions and data contracts.
