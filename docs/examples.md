# DSR Advanced Examples

> Complex use cases and workflows for production usage.

---

## Table of Contents

- [Custom Ruleset](#custom-ruleset)
- [Batch Processing](#batch-processing)
- [CI/CD Integration](#cicd-integration)
- [Custom Validators](#custom-validators)
- [Observability Setup](#observability-setup)
- [Performance Optimization](#performance-optimization)

---

## Custom Ruleset

### Creating a Team Ruleset

Create a ruleset tailored to your team's requirements:

```javascript
import { extendPreset, normalizeRuleset } from 'deus-in-machina/ruleset';

// Extend relaxed preset with custom rules
const teamRuleset = extendPreset('relaxed', {
  name: 'acme-design-system',
  description: 'Acme Corp Design System Rules',
  tokens: {
    severity: 'error',
    requireSemantic: true
  },
  spacing: {
    severity: 'warn',
    enforceGrid: true,
    gridSize: 4  // 4pt grid instead of 8pt
  },
  patterns: {
    severity: 'warn',
    minConfidence: 0.75
  },
  layout: {
    severity: 'error',
    maxDepth: 8
  }
});

// Save to file for reuse
import { writeFileSync } from 'fs';
writeFileSync(
  './acme-ruleset.json',
  JSON.stringify(teamRuleset, null, 2)
);
```

### Loading Custom Ruleset

```javascript
import { loadRuleset } from 'deus-in-machina/ruleset';
import { readFileSync } from 'fs';

const customConfig = JSON.parse(
  readFileSync('./acme-ruleset.json', 'utf-8')
);

const ruleset = await loadRuleset('default', customConfig);
```

---

## Batch Processing

### Processing Multiple Files

```javascript
import { exportFromFigmaAPI, batchFetchVariables } from 'deus-in-machina/figma';
import { validateUI } from 'deus-in-machina';

const files = [
  { fileKey: 'ABC123', apiKey: process.env.FIGMA_API_KEY },
  { fileKey: 'DEF456', apiKey: process.env.FIGMA_API_KEY },
  { fileKey: 'GHI789', apiKey: process.env.FIGMA_API_KEY }
];

// Fetch all files with concurrency limit
const results = await batchFetchVariables(files, {
  concurrency: 2  // Max 2 concurrent requests
});

// Process each result
for (const result of results) {
  if (result.success) {
    console.log(`✓ ${result.fileKey}: ${result.data.length} variables`);
  } else {
    console.error(`✗ ${result.fileKey}: ${result.error}`);
  }
}
```

### Streaming Large Files

```javascript
import { streamProcessTokens, streamExportToFile } from 'deus-in-machina/streaming';

// Process large token file in chunks
await streamProcessTokens('large-tokens.json', {
  chunkSize: 1000,
  maxMemoryBytes: 100 * 1024 * 1024,  // 100MB limit
  onChunk: async (chunk, offset) => {
    console.log(`Processing chunk ${offset}-${offset + chunk.length}`);
    await validateChunk(chunk);
  }
});

// Export large dataset
await streamExportToFile(largeVariables, 'output.json', {
  chunkSize: 500
});
```

---

## CI/CD Integration

### GitHub Actions Workflow

```yaml
# .github/workflows/design-system.yml
name: Design System Check

on:
  push:
    paths:
      - 'tokens/**'
  pull_request:
    paths:
      - 'tokens/**'

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'

      - name: Install DSR
        run: npm install -g deus-in-machina

      - name: Validate Tokens
        run: |
          dsr validate \
            --input tokens/design-tokens.json \
            --ruleset strict

      - name: Check Figma Sync
        env:
          FIGMA_API_KEY: ${{ secrets.FIGMA_API_KEY }}
        run: |
          dsr export-variables \
            --file ${{ secrets.FIGMA_FILE_KEY }} \
            --out figma-tokens.json
          
          diff tokens/design-tokens.json figma-tokens.json || true
```

### Pre-commit Hook

```javascript
// .husky/pre-commit
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# Validate tokens before commit
npx dsr validate --input tokens/design-tokens.json --ruleset strict
if [ $? -ne 0 ]; then
  echo "Token validation failed. Please fix errors before committing."
  exit 1
fi
```

---

## Custom Validators

### Adding Custom Validation Rules

```javascript
import { validateUI } from 'deus-in-machina';

async function customValidate(tokens) {
  const baseResult = await validateUI({
    code: JSON.stringify(tokens),
    rulesetName: 'strict'
  });

  // Add custom checks
  const customIssues = [];

  // Check for naming conventions
  for (const [key, token] of Object.entries(tokens)) {
    if (!key.match(/^[a-z]+(-[a-z]+)*$/)) {
      customIssues.push({
        type: 'naming_convention',
        message: `Token "${key}" doesn't follow kebab-case naming`,
        severity: 'WARN'
      });
    }
  }

  return {
    ...baseResult,
    warnings: [...baseResult.warnings, ...customIssues],
    summary: {
      ...baseResult.summary,
      warnings: baseResult.summary.warnings + customIssues.length
    }
  };
}
```

---

## Observability Setup

### Production Logging

```javascript
import { configureLogger, createChildLogger } from 'deus-in-machina/logger';
import { writeFileSync } from 'fs';

// Configure structured logging
configureLogger({
  level: 'info',
  format: 'json',
  includeTimestamp: true,
  includeCorrelationId: true,
  output: (line) => {
    // Log to file
    writeFileSync('dsr.log', line + '\n', { flag: 'a' });
  }
});

// Create scoped logger
const exportLogger = createChildLogger({
  operation: 'export',
  service: 'token-pipeline'
});

exportLogger.info('Export started', { fileKey: 'ABC123' });
```

### Metrics Collection

```javascript
import { CoreMetrics, getMetricsSnapshot } from 'deus-in-machina/metrics';
import { exportPrometheusMetrics } from 'deus-in-machina/metrics';

// Track operations
CoreMetrics.exportsTotal.inc();
CoreMetrics.exportDuration.observe(250);

// Export for Prometheus
app.get('/metrics', (req, res) => {
  res.set('Content-Type', 'text/plain');
  res.send(exportPrometheusMetrics());
});
```

### Health Check Endpoint

```javascript
import { healthMiddleware, checkHealth } from 'deus-in-machina/health';
import express from 'express';

const app = express();

// Built-in health endpoints
app.use(healthMiddleware());

// GET /health       - Full health report
// GET /health/live  - Liveness probe
// GET /health/ready - Readiness probe

// Custom health check
app.get('/health/custom', async (req, res) => {
  const report = await checkHealth({ timeoutMs: 5000 });
  const statusCode = report.status === 'unhealthy' ? 503 : 200;
  res.status(statusCode).json(report);
});
```

---

## Performance Optimization

### Memory-Constrained Environments

```javascript
import { createMemoryLimitEnforcer } from 'deus-in-machina/perf';
import { streamProcessTokens } from 'deus-in-machina/streaming';

// Enforce memory limits
const enforcer = createMemoryLimitEnforcer({
  maxHeapBytes: 256 * 1024 * 1024,  // 256MB
  checkIntervalMs: 1000
});

enforcer.start();

try {
  // Process in small chunks
  await streamProcessTokens('large-file.json', {
    chunkSize: 100,  // Small chunks
    maxMemoryBytes: 50 * 1024 * 1024,  // 50MB per chunk
    onChunk: async (chunk) => {
      await processChunk(chunk);
    }
  });
} finally {
  enforcer.stop();
}
```

### Caching Strategy

```javascript
import {
  fetchVariablesOptimized,
  clearAPICache,
  getCacheStats
} from 'deus-in-machina/figma';

// Use cached API client
const data = await fetchVariablesOptimized(fileKey, apiKey, {
  useCache: true,
  cacheTTL: 300000  // 5 minutes
});

// Monitor cache
console.log('Cache stats:', getCacheStats());

// Clear cache when needed
clearAPICache();
```

### Profiling Operations

```javascript
import { profileFunction, profileMemory } from 'deus-in-machina/perf';

// Profile function execution
const { result, stats } = profileFunction(
  'export-operation',
  () => exportVariables(),
  10  // 10 iterations
);

console.log('Average time:', stats.avg, 'ms');

// Profile memory usage
const { result: r2, profile } = await profileMemory(
  'import-operation',
  async () => await importTokens()
);

console.log('Peak heap:', profile.peakHeapUsed);
```

---

## Complete Workflow Example

### Enterprise Token Pipeline

```javascript
#!/usr/bin/env node
/**
 * Enterprise Token Pipeline
 * Complete workflow for production environments
 */

import {
  exportFromFigmaAPI,
  exportVariablesToDTCG
} from 'deus-in-machina/figma';
import { validateUI } from 'deus-in-machina';
import { loadRuleset } from 'deus-in-machina/ruleset';
import { configureLogger, withCorrelation } from 'deus-in-machina/logger';
import { CoreMetrics } from 'deus-in-machina/metrics';
import { recordExport } from 'deus-in-machina/telemetry';
import { checkHealth } from 'deus-in-machina/health';
import { timeItAsync } from 'deus-in-machina/metrics';
import { withSpan } from 'deus-in-machina/debug';

// Configure observability
configureLogger({
  level: 'info',
  format: 'json'
});

async function runPipeline(fileKey, apiKey) {
  return withCorrelation(async () => {
    // Health check
    const health = await checkHealth();
    if (health.status === 'unhealthy') {
      throw new Error('System unhealthy, aborting');
    }

    // Export from Figma
    const exportResult = await withSpan('figma-export', async () => {
      return await timeItAsync(CoreMetrics.exportDuration, async () => {
        CoreMetrics.exportsTotal.inc();

        const data = await exportFromFigmaAPI(fileKey, apiKey, {
          colorMode: 'hex'
        });

        return exportVariablesToDTCG(
          data.meta.variables,
          data.meta.variableCollections
        );
      });
    });

    // Validate
    const validationResult = await withSpan('validate', async () => {
      return await timeItAsync(CoreMetrics.validationDuration, async () => {
        CoreMetrics.validationsTotal.inc();

        const ruleset = await loadRuleset('strict');
        const result = await validateUI({
          code: JSON.stringify(exportResult),
          rulesetName: 'strict'
        });

        CoreMetrics.validationIssues.add(
          result.summary.errors + result.summary.warnings,
          { severity: result.summary.errors > 0 ? 'error' : 'warn' }
        );

        return result;
      });
    });

    // Record telemetry
    recordExport({
      fileCount: 1,
      variableCount: Object.keys(exportResult).length,
      durationMs: performance.now(),
      format: 'dtcg',
      success: validationResult.valid
    });

    return {
      tokens: exportResult,
      validation: validationResult
    };
  });
}

// Run
const fileKey = process.env.FIGMA_FILE_KEY;
const apiKey = process.env.FIGMA_API_KEY;

runPipeline(fileKey, apiKey)
  .then(result => {
    console.log('Pipeline complete:', result.validation.summary);
  })
  .catch(err => {
    console.error('Pipeline failed:', err);
    process.exit(1);
  });
```

---

_Last updated: 2026-04-26_
