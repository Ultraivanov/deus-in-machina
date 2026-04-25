# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0] - 2026-04-26

### Added

#### Core Runtime
- Token normalization engine with DTCG format support
- Pattern inference engine for UI structure detection
- Validation engine with ruleset-based linting
- Fix loop with automated corrections

#### Figma Integration
- Bidirectional Figma Variables sync (export/import)
- Figma REST API client with retry logic
- Color normalization (hex, rgba, hsla)
- Alias resolution for variable references
- Multi-mode support (light/dark themes)

#### Ruleset System
- Configurable rule packs with 6 categories
- 5 built-in presets: strict, relaxed, minimal, a11y, performance
- Custom rule pack creation with `extendPreset()`
- Severity levels: error, warn, info, ignore

#### Observability
- Structured logging with 6 levels (trace..fatal)
- Metrics collection (counters, histograms, gauges)
- Opt-in telemetry with privacy controls
- Debug/trace modes with spans and profiling
- Health checks with Kubernetes-style probes

#### Performance
- API caching with TTL and request deduplication
- Batch fetching with concurrency control
- Streaming for large file processing
- Memory profiling and limits

#### Error Handling
- Centralized error system with error codes
- Retry logic with exponential backoff
- Structured error payloads
- Recovery path documentation

#### CLI
- Full CLI with 10+ commands
- Export/import/sync for Figma variables
- Validation with multiple rulesets
- Performance benchmarks
- Health status reporting

#### Documentation
- Performance guide
- Error handling guide
- Rule packs guide
- Observability guide

#### Testing
- 233 tests across 9 test suites
- 100% test coverage for core modules
- Integration tests for Figma sync
- Performance benchmarks

### Changed

### Deprecated

### Removed

### Fixed

### Security
