# Deus In Machina (DIM) — Design System Runtime

[![npm version](https://img.shields.io/npm/v/deus-in-machina.svg)](https://www.npmjs.com/package/deus-in-machina)
[![Node.js >= 18](https://img.shields.io/badge/node-%3E%3D%2018-brightgreen.svg)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

**Design System Runtime (DSR)** — A runtime layer that enforces structure and consistency across design systems. Bridge the gap between Figma designs and code implementation with automated token normalization, pattern detection, and validation.

## What is DSR?

DSR is not a design generator. It's a runtime that:

- **Normalizes** raw Figma data into semantic DTCG-compliant tokens
- **Detects** reusable UI patterns across your designs
- **Validates** implementation against design system rules
- **Corrects** issues with automated fix suggestions

Think of it as a linter + compiler for your design system.

## Key Features

🎨 **Bidirectional Figma Sync**
- Export Figma Variables to DTCG JSON
- Import DTCG tokens back to Figma
- Color normalization (hex, rgba, hsla)
- Multi-mode support (light/dark themes)

🧩 **Pattern Inference**
- Detect reusable UI structures
- Identify component patterns
- Suggest semantic improvements

✅ **Validation Engine**
- 6 rule categories (tokens, spacing, patterns, layout, a11y, performance)
- 5 built-in presets (strict, relaxed, minimal, a11y, performance)
- Custom rule pack creation

⚡ **Performance**
- API response caching with TTL
- Request deduplication
- Batch operations with concurrency control
- Streaming for large files

📊 **Observability**
- Structured logging (6 levels)
- Metrics collection
- Opt-in telemetry
- Health checks (K8s probes)

## Quick Start

### Installation

```bash
npm install -g deus-in-machina
```

### Export Figma Variables

```bash
export FIGMA_API_KEY=your_token_here

dsr export-variables \
  --file AbCdEf123 \
  --out tokens.json \
  --color-mode hex
```

### Validate Tokens

```bash
dsr validate \
  --input tokens.json \
  --ruleset strict
```

### Import Back to Figma

```bash
dsr import-variables \
  --file AbCdEf123 \
  --input tokens.json \
  --collection "Design Tokens"
```

## Documentation

| Guide | Description |
|-------|-------------|
| [Installation](docs/installation.md) | Setup and configuration |
| [Quick Start](docs/quick-start.md) | 5-minute tutorial |
| [Rule Packs](docs/rule-packs.md) | Validation rules and presets |
| [Performance](docs/performance.md) | Optimization and monitoring |
| [Observability](docs/observability.md) | Logging, metrics, telemetry |
| [Error Handling](docs/error-handling.md) | Troubleshooting guide |

## API Usage

### Programmatic API

```javascript
import { exportFromFigmaAPI, exportVariablesToDTCG } from 'deus-in-machina/figma';
import { validateUI } from 'deus-in-machina';
import { loadRuleset } from 'deus-in-machina/ruleset';

// Export from Figma
const data = await exportFromFigmaAPI(fileKey, apiKey);
const tokens = exportVariablesToDTCG(
  data.meta.variables,
  data.meta.variableCollections
);

// Validate
const ruleset = await loadRuleset('strict');
const result = await validateUI({
  code: JSON.stringify(tokens),
  rulesetName: 'strict'
});

console.log(result.summary);
// { errors: 0, warnings: 2, infos: 5 }
```

### Using Presets

```javascript
import { loadRuleset, extendPreset } from 'deus-in-machina/ruleset';

// Use built-in preset
const strict = await loadRuleset('strict');

// Create custom ruleset
const custom = extendPreset('relaxed', {
  name: 'my-team',
  tokens: { severity: 'error' }
});
```

## CLI Reference

```bash
dsr <command> [options]

Commands:
  export-variables   Export Figma Variables to JSON
  import-variables   Import JSON to Figma Variables
  sync-variables     Bidirectional sync
  validate           Validate tokens against rules
  health             Check system health
  benchmark          Run performance benchmarks

Options:
  --help             Show help
  --version          Show version
  --verbose          Enable verbose output
```

## Architecture

```
Figma → Extractor → Normalizer → Pattern Engine → Rules → Validator → Fix Loop
                           ↓
                    DTCG Tokens
                           ↓
                    Code Implementation
```

### Core Modules

| Module | Purpose |
|--------|---------|
| `src/figma/` | Figma API integration |
| `src/ruleset/` | Validation rules and presets |
| `src/validator.js` | UI linting engine |
| `src/patterns.js` | Pattern detection |
| `src/fix-loop.js` | Automated corrections |
| `src/perf.js` | Performance utilities |
| `src/logger.js` | Structured logging |
| `src/metrics.js` | Metrics collection |
| `src/telemetry.js` | Usage analytics |
| `src/health.js` | Health checks |

## Development

### Setup

```bash
git clone https://github.com/Ultraivanov/deus-in-machina.git
cd deus-in-machina
npm install
npm test
```

### Running Tests

```bash
# All tests
npm test

# Watch mode
npm run test:watch

# Specific file
npm test -- tests/figma-sync.test.js
```

### Building

```bash
npm run build
```

### Version Management

```bash
# Bump version
npm run version:bump minor

# Get current version
npm run version:get
```

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Roadmap

- [x] Token normalization
- [x] Pattern inference
- [x] Validation engine
- [x] Figma bidirectional sync
- [x] Performance optimization
- [x] Observability suite
- [ ] GitHub Actions marketplace integration
- [ ] VS Code extension
- [ ] Web UI dashboard

## Stats

- **233 tests** across 9 test suites
- **60+ source files**
- **15 completed blocks** (Phase 4-6 + R-01)
- **6 documentation guides**

## Status

**Phase 7 — Release** (in progress)

- ✅ R-01: Release packaging
- ⏳ R-02: Public docs + examples
- ⏳ R-03: Support + maintenance plan

See `.codex/PHASES.md` for full project status.

## Support

- 📖 [Documentation](docs/)
- 🐛 [Issues](https://github.com/Ultraivanov/deus-in-machina/issues)
- 💬 [Discussions](https://github.com/Ultraivanov/deus-in-machina/discussions)

## License

MIT © Dmitry Ivanov. See [LICENSE](LICENSE) for details.

---

**[⬆ Back to top](#deus-in-machina-dim--design-system-runtime)**
