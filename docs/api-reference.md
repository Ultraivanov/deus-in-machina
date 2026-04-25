# DSR API Reference

> Complete API documentation for all DSR modules.

---

## Table of Contents

- [Core API](#core-api)
- [Figma Module](#figma-module)
- [Ruleset Module](#ruleset-module)
- [Logger Module](#logger-module)
- [Metrics Module](#metrics-module)
- [Telemetry Module](#telemetry-module)
- [Debug Module](#debug-module)
- [Health Module](#health-module)
- [Error Handling](#error-handling)
- [Performance](#performance)
- [Streaming](#streaming)

---

## Core API

### `validateUI(options)`

Validates code/UI against a ruleset.

```javascript
import { validateUI } from 'deus-in-machina';

const result = await validateUI({
  code: '/* CSS or code */',
  rules: {},
  rulesetName: 'strict'
});

// Returns:
// {
//   valid: boolean,
//   summary: { errors, warnings, infos },
//   errors: [],
//   warnings: [],
//   infos: [],
//   byCategory: {},
//   meta: {}
// }
```

**Parameters:**
- `code` (string): Code to validate
- `rules` (object): Custom rules
- `rulesetName` (string): Name of preset to use

**Returns:** `Promise<ValidationResult>`

---

## Figma Module

### `exportFromFigmaAPI(fileKey, apiKey, config)`

Export variables from Figma file.

```javascript
import { exportFromFigmaAPI } from 'deus-in-machina/figma';

const data = await exportFromFigmaAPI('ABC123', 'figma-api-key', {
  colorMode: 'hex'
});
```

**Parameters:**
- `fileKey` (string): Figma file key
- `apiKey` (string): Figma API token
- `config` (object): Export configuration
  - `colorMode`: 'hex' | 'rgba' | 'hsla'
  - `useDTCGKeys`: boolean

### `exportVariablesToDTCG(variables, collections, config)`

Convert Figma variables to DTCG format.

```javascript
import { exportVariablesToDTCG } from 'deus-in-machina/figma';

const tokens = exportVariablesToDTCG(
  data.meta.variables,
  data.meta.variableCollections,
  { colorMode: 'hex' }
);
```

### `normalizeColor(color, mode)`

Normalize Figma color to specified format.

```javascript
import { normalizeColor } from 'deus-in-machina/figma';

const hex = normalizeColor({ r: 1, g: 0, b: 0 }, 'hex');
// '#FF0000'
```

### `fetchVariablesOptimized(fileKey, apiKey, options)`

Optimized Figma API client with caching.

```javascript
import { fetchVariablesOptimized } from 'deus-in-machina/figma';

const data = await fetchVariablesOptimized('ABC123', 'token', {
  useCache: true,
  cacheTTL: 60000
});
```

---

## Ruleset Module

### `loadRuleset(name, customConfig)`

Load a ruleset by name.

```javascript
import { loadRuleset } from 'deus-in-machina/ruleset';

const ruleset = await loadRuleset('strict');
```

### `extendPreset(basePreset, overrides)`

Create custom ruleset from preset.

```javascript
import { extendPreset } from 'deus-in-machina/ruleset';

const custom = extendPreset('relaxed', {
  name: 'my-team',
  tokens: { severity: 'error' }
});
```

### Presets

Built-in presets:
- `'strict'` - Maximum enforcement
- `'relaxed'` - Balanced for development
- `'minimal'` - Only critical issues
- `'a11y'` - Accessibility-focused
- `'performance'` - Performance optimization

### Category Functions

```javascript
import {
  listCategories,
  getCategoryInfo,
  getRulesByCategory,
  getRule,
  listRuleIds
} from 'deus-in-machina/ruleset';

// List all categories
const categories = listCategories();
// ['tokens', 'spacing', 'patterns', 'layout', 'accessibility', 'performance']

// Get rules by category
const tokenRules = getRulesByCategory('tokens');
```

---

## Logger Module

### `log(level, message, context)`

Log a message at specified level.

```javascript
import { log, trace, debug, info, warn, error, fatal } from 'deus-in-machina/logger';

// Convenience methods
info('Operation started', { userId: '123' });
error('Failed', { error: err.message });
```

### `configureLogger(config)`

Configure global logger.

```javascript
import { configureLogger } from 'deus-in-machina/logger';

configureLogger({
  level: 'info',
  format: 'json', // 'json' | 'pretty' | 'minimal'
  includeTimestamp: true,
  includeCorrelationId: true
});
```

### `withCorrelation(fn, correlationId)`

Execute function with correlation ID.

```javascript
import { withCorrelation } from 'deus-in-machina/logger';

await withCorrelation(async () => {
  // All logs include correlation ID
  info('Processing');
});
```

---

## Metrics Module

### `createCounter(name, description, labels)`

Create a counter metric.

```javascript
import { createCounter } from 'deus-in-machina/metrics';

const counter = createCounter('requests_total', 'Total requests', ['method']);
counter.inc({ method: 'GET' });
```

### `createHistogram(name, description, buckets)`

Create a histogram metric.

```javascript
import { createHistogram } from 'deus-in-machina/metrics';

const histogram = createHistogram('duration_ms', 'Duration in ms');
histogram.observe(150);
```

### `createGauge(name, description)`

Create a gauge metric.

```javascript
import { createGauge } from 'deus-in-machina/metrics';

const gauge = createGauge('active_connections', 'Active connections');
gauge.set(42);
```

### `CoreMetrics`

Pre-defined metrics:

```javascript
import { CoreMetrics } from 'deus-in-machina/metrics';

CoreMetrics.exportsTotal.inc();
CoreMetrics.exportDuration.observe(250);
CoreMetrics.validationIssues.inc({ severity: 'error' });
```

---

## Telemetry Module

### `initTelemetry()`

Initialize telemetry (disabled by default).

```javascript
import { initTelemetry, enableTelemetry } from 'deus-in-machina/telemetry';

initTelemetry();
enableTelemetry();
```

### `recordEvent(eventName, properties)`

Record a telemetry event.

```javascript
import { recordEvent } from 'deus-in-machina/telemetry';

recordEvent('export.completed', {
  fileCount: 5,
  durationMs: 250
});
```

### Pre-built Recorders

```javascript
import {
  recordCommand,
  recordExport,
  recordValidation,
  recordError
} from 'deus-in-machina/telemetry';

recordCommand('export', { format: 'json' }, 1000, true);
recordExport({ fileCount: 5, success: true });
recordValidation({ ruleset: 'strict', issuesFound: 3 });
recordError('API_ERROR', 'Connection failed');
```

---

## Debug Module

### `enableDebug(options)`

Enable debug mode.

```javascript
import { enableDebug } from 'deus-in-machina/debug';

enableDebug({
  verbose: true,
  trace: true,
  perf: true
});
```

### `startSpan(name)` / `endSpan(id)`

Manual span tracing.

```javascript
import { startSpan, endSpan } from 'deus-in-machina/debug';

const spanId = startSpan('my-operation');
// ... work ...
endSpan(spanId);
```

### `withSpan(name, fn)`

Auto-traced function wrapper.

```javascript
import { withSpan } from 'deus-in-machina/debug';

const result = await withSpan('export', async () => {
  return await exportVariables();
});
```

### `perfMark(name)`

Record performance marker.

```javascript
import { perfMark } from 'deus-in-machina/debug';

perfMark('phase-1-complete');
```

---

## Health Module

### `checkHealth(options)`

Run all health checks.

```javascript
import { checkHealth } from 'deus-in-machina/health';

const report = await checkHealth({ timeoutMs: 5000 });
// { status, components, metrics }
```

### Probes

```javascript
import {
  livenessCheck,
  readinessCheck,
  startupCheck
} from 'deus-in-machina/health';

// Kubernetes probes
const live = livenessCheck();
const ready = await readinessCheck();
const started = startupCheck();
```

### `registerCheck(name, checkFn)`

Register custom health check.

```javascript
import { registerCheck } from 'deus-in-machina/health';

registerCheck('database', async () => {
  const connected = await db.ping();
  return {
    status: connected ? 'healthy' : 'unhealthy',
    message: connected ? 'Connected' : 'Failed'
  };
});
```

---

## Error Handling

### `makeError(code, message, context)`

Create standardized error.

```javascript
import { makeError, ErrorCodes } from 'deus-in-machina/errors';

const error = makeError(
  ErrorCodes.FIGMA_API_ERROR,
  'API request failed',
  { status: 500 }
);
```

### `withRetry(fn, options)`

Add retry logic to function.

```javascript
import { withRetry } from 'deus-in-machina/errors';

const reliableFetch = withRetry(fetchData, {
  maxRetries: 3,
  baseDelay: 1000
});
```

---

## Performance

### `benchmark(name, fn, options)`

Run benchmark.

```javascript
import { benchmark, printBenchmark } from 'deus-in-machina/perf';

const result = await benchmark('export', () => exportData(), {
  iterations: 10
});

printBenchmark(result);
```

### `profileMemory(name, fn)`

Profile memory usage.

```javascript
import { profileMemory, printMemoryProfile } from 'deus-in-machina/perf';

const { result, profile } = await profileMemory('export', async () => {
  return await exportVariables();
});

printMemoryProfile(profile);
```

### `createMemoryLimitEnforcer(limits)`

Enforce memory limits.

```javascript
import { createMemoryLimitEnforcer } from 'deus-in-machina/perf';

const enforcer = createMemoryLimitEnforcer({
  maxHeapBytes: 512 * 1024 * 1024
});

enforcer.start();
// ... operations ...
enforcer.stop();
```

---

## Streaming

### `streamProcessTokens(filePath, options)`

Stream process large token files.

```javascript
import { streamProcessTokens } from 'deus-in-machina/streaming';

const count = await streamProcessTokens('large-file.json', {
  chunkSize: 1000,
  onChunk: async (chunk, offset) => {
    await processBatch(chunk);
  }
});
```

### `streamExportToFile(variables, outputPath, options)`

Stream export to file.

```javascript
import { streamExportToFile } from 'deus-in-machina/streaming';

await streamExportToFile(largeVariables, 'output.json', {
  chunkSize: 500
});
```

---

## Type Definitions

### Severity
```typescript
type Severity = 'error' | 'warn' | 'info' | 'ignore';
```

### HealthStatus
```typescript
type HealthStatus = 'healthy' | 'degraded' | 'unhealthy';
```

### LogLevel
```typescript
type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';
```

---

_Last updated: 2026-04-26_
