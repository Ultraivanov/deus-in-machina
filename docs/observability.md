# DSR Observability Guide

> Comprehensive guide for monitoring, debugging, and observing DSR in production.

---

## Table of Contents

- [Overview](#overview)
- [Logging](#logging)
- [Metrics](#metrics)
- [Telemetry](#telemetry)
- [Debug & Trace](#debug--trace)
- [Health Checks](#health-checks)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

---

## Overview

DSR provides comprehensive observability through five integrated systems:

```
┌─────────────────────────────────────────────────────────────┐
│                    DSR Observability                        │
├──────────────┬──────────────┬──────────────┬──────────────┤
│   Logging    │   Metrics    │  Telemetry   │   Health     │
│              │              │              │   Checks     │
│  • Levels    │  • Counters  │  • Events    │  • Probes    │
│  • Context   │  • Histograms│  • Privacy │  • Registry  │
│  • Corr ID   │  • Gauges    │  • Opt-in    │  • Watch     │
└──────────────┴──────────────┴──────────────┴──────────────┘
                        ↓
                 Debug & Trace
              (Development overlay)
```

---

## Logging

### Quick Start

```javascript
import { info, warn, error, setCorrelationId } from './src/logger.js';

// Set correlation ID for request tracing
setCorrelationId('req-123-abc');

// Log messages
info('Export started', { fileKey: 'ABC123' });
warn('Deprecated API used', { api: 'old-endpoint' });
error('Export failed', { error: err.message, code: 'FIGMA_API_ERROR' });
```

### Log Levels

| Level | Use For | Output |
|-------|---------|--------|
| `trace` | Detailed debugging | stdout |
| `debug` | Development info | stdout |
| `info` | Normal operations | stdout |
| `warn` | Warnings, deprecations | stderr |
| `error` | Errors, failures | stderr |
| `fatal` | Critical errors | stderr |

### Configuration

```javascript
import { configureLogger, LOG_LEVELS } from './src/logger.js';

// Set minimum level
configureLogger({ level: 'info' });

// Change format
configureLogger({ format: 'pretty' }); // 'json' | 'pretty' | 'minimal'

// Disable timestamps
configureLogger({ includeTimestamp: false });

// Disable correlation IDs
configureLogger({ includeCorrelationId: false });

// Custom output (e.g., to file)
import { createWriteStream } from 'fs';
const logFile = createWriteStream('dsr.log', { flags: 'a' });
configureLogger({ output: (line) => logFile.write(line + '\n') });
```

### Structured Logging

```javascript
import { createChildLogger } from './src/logger.js';

// Create child logger with bound context
const exportLogger = createChildLogger({
  operation: 'export',
  fileKey: 'ABC123'
});

// All logs include the bound context
exportLogger.info('Fetching variables');
exportLogger.info('Transforming to DTCG');
// Output includes: { operation: 'export', fileKey: 'ABC123' }
```

### Async Tracing

```javascript
import { withCorrelation } from './src/logger.js';

// Auto-generate and cleanup correlation ID
await withCorrelation(async () => {
  info('Processing request');
  await exportVariables(fileKey);
  info('Request complete');
});
```

---

## Metrics

### Quick Start

```javascript
import {
  createCounter,
  createHistogram,
  createGauge,
  getMetricsSnapshot,
  exportPrometheusMetrics
} from './src/metrics.js';

// Create metrics
const requests = createCounter('http_requests_total', 'Total HTTP requests');
const duration = createHistogram('request_duration_ms', 'Request duration');
const active = createGauge('active_connections', 'Active connections');

// Use metrics
requests.inc();
duration.observe(150);
active.set(42);

// Get snapshot
const snapshot = getMetricsSnapshot();

// Export for Prometheus
const prometheus = exportPrometheusMetrics();
```

### Core Metrics

DSR includes pre-defined metrics for all operations:

```javascript
import { CoreMetrics } from './src/metrics.js';

// Track operations
CoreMetrics.exportsTotal.inc();
CoreMetrics.exportDuration.observe(250);

// Track with labels
CoreMetrics.validationIssues.inc({ severity: 'error', type: 'token' });
CoreMetrics.apiCallsTotal.inc({ endpoint: 'get-variables' });

// Update gauges
CoreMetrics.activeExports.set(3);
CoreMetrics.memoryUsage.set(process.memoryUsage().heapUsed);
```

| Metric | Type | Description |
|--------|------|-------------|
| `dsr_exports_total` | Counter | Total export operations |
| `dsr_export_duration_ms` | Histogram | Export duration |
| `dsr_validations_total` | Counter | Validation runs |
| `dsr_validation_issues_total` | Counter | Issues by severity/type |
| `dsr_api_calls_total` | Counter | API calls by endpoint |
| `dsr_cache_hits_total` | Counter | Cache hits by name |
| `dsr_memory_usage_bytes` | Gauge | Current memory usage |
| `dsr_active_exports` | Gauge | Active export operations |

### Timing Functions

```javascript
import { timeIt, timeItAsync, createTimer } from './src/metrics.js';

// Create timer
const timer = createTimer('operation_duration_ms');

// Time sync function
timeIt(timer, () => {
  return heavyComputation();
});

// Time async function
await timeItAsync(timer, async () => {
  return await fetchData();
});
```

### Prometheus Integration

```javascript
import { exportPrometheusMetrics } from './src/metrics.js';

// HTTP endpoint for Prometheus scraping
app.get('/metrics', (req, res) => {
  res.set('Content-Type', 'text/plain');
  res.send(exportPrometheusMetrics());
});
```

---

## Telemetry

### Quick Start

```javascript
import {
  initTelemetry,
  enableTelemetry,
  recordCommand,
  recordExport,
  shutdownTelemetry
} from './src/telemetry.js';

// Initialize (disabled by default)
initTelemetry();

// Enable telemetry
enableTelemetry();

// Record events
recordCommand('export', { format: 'json' }, 1000, true);
recordExport({
  fileCount: 1,
  variableCount: 50,
  durationMs: 250,
  success: true
});

// Shutdown flushes remaining events
await shutdownTelemetry();
```

### Privacy Controls

```javascript
import { excludeEvents, includeEvents } from './src/telemetry.js';

// Exclude sensitive events
excludeEvents(['user.login', 'password.change']);

// Re-enable if needed
includeEvents(['user.login']);

// Check status
const status = getTelemetryStatus();
// {
//   enabled: true,
//   anonymousId: 'uuid...',
//   sessionId: 'uuid...',
//   eventsInQueue: 3,
//   excludedEvents: ['password.change']
// }
```

### Automatic Data Sanitization

Telemetry automatically redacts sensitive data:

```javascript
// This data will be automatically sanitized
recordEvent('api.request', {
  endpoint: '/export',
  password: 'supersecret',     // → [REDACTED]
  apiKey: 'sk-abc123',         // → [REDACTED]
  token: 'Bearer xyz789',      // → [REDACTED]
  normalData: 'preserved'      // Kept as-is
});
```

### Configuration File

Telemetry config is stored in `~/.dsr/telemetry.json`:

```json
{
  "enabled": true,
  "anonymousId": "550e8400-e29b-41d4-a716-446655440000",
  "endpoint": "https://telemetry.dsr.dev/v1/events",
  "excludedEvents": [],
  "includeMetrics": true
}
```

---

## Debug & Trace

### Quick Start

```javascript
import {
  enableDebug,
  startSpan,
  endSpan,
  withSpan,
  perfMark
} from './src/debug.js';

// Enable debug mode
enableDebug({
  verbose: true,  // Detailed logging
  trace: true,    // Function tracing
  perf: true      // Performance markers
});

// Manual span tracing
const spanId = startSpan('export-operation');
// ... work ...
endSpan(spanId);

// Or use wrapper
await withSpan('export', async () => {
  await exportVariables(fileKey);
});

// Performance marker
perfMark('phase-1-complete');
```

### Debug Modes

| Mode | What It Does |
|------|-------------|
| `verbose` | Logs all debug messages |
| `trace` | Records function entry/exit |
| `perf` | Records performance markers |

### Span Filtering

```javascript
enableDebug({
  trace: true,
  filters: ['api', 'export']  // Only trace these
});

startSpan('api.request');   // Traced ✓
startSpan('export.start');  // Traced ✓
startSpan('db.query');      // Ignored ✗
```

### Span History

```javascript
import { getSpanHistory, clearSpanHistory } from './src/debug.js';

// Get recent spans
const spans = getSpanHistory({ limit: 10 });

// Filter by name
const apiSpans = getSpanHistory({ name: 'api' });

// Clear history
clearSpanHistory();
```

### Function Profiling

```javascript
import { profileFunction, traceFn } from './src/debug.js';

// Profile a function
const { result, stats } = profileFunction('myFn', () => {
  return computeExpensive();
}, 100); // 100 iterations

// Stats: { iterations, total, min, max, avg }

// Auto-trace any function
const tracedFn = traceFn(myFunction);
const result = tracedFn(args);
```

### Debug State

```javascript
import { getDebugState, printDebugReport } from './src/debug.js';

// Get current state
const state = getDebugState();
// {
//   config: { enabled, verbose, trace, perf },
//   activeSpans: 3,
//   spanHistory: 150
// }

// Print full report
printDebugReport();
```

---

## Health Checks

### Quick Start

```javascript
import {
  checkHealth,
  livenessCheck,
  readinessCheck,
  printHealthReport
} from './src/health.js';

// Simple liveness probe (is process running?)
const live = livenessCheck();
// { status: 'healthy', timestamp: '...' }

// Readiness probe (is service ready?)
const ready = await readinessCheck();
// Full report with all components

// Full health check
const health = await checkHealth();
printHealthReport(health);
```

### Health Status

| Status | Meaning | HTTP Code |
|--------|---------|-----------|
| `healthy` | All good | 200 |
| `degraded` | Working with issues | 200 |
| `unhealthy` | Critical problems | 503 |

### Kubernetes Probes

```javascript
import { livenessCheck, readinessCheck, startupCheck } from './src/health.js';

// livenessProbe: Restart if failing
app.get('/health/live', (req, res) => {
  const result = livenessCheck();
  res.status(200).json(result);
});

// readinessProbe: Remove from load balancer
app.get('/health/ready', async (req, res) => {
  const report = await readinessCheck();
  const code = report.status === 'unhealthy' ? 503 : 200;
  res.status(code).json(report);
});

// startupProbe: Wait for initialization
app.get('/health/startup', (req, res) => {
  const result = startupCheck();
  res.status(200).json(result);
});
```

### Custom Health Checks

```javascript
import { registerCheck } from './src/health.js';

// Register custom check
registerCheck('database', async () => {
  const connected = await db.ping();

  return {
    status: connected ? 'healthy' : 'unhealthy',
    message: connected ? 'Connected' : 'Connection failed',
    metadata: { latency: await db.measureLatency() }
  };
});

// Check with timeout
const health = await checkHealth({ timeoutMs: 5000 });
```

### Health Watch

```javascript
import { watchHealth } from './src/health.js';

// Watch for status changes
const unwatch = watchHealth((report) => {
  console.log(`Health changed to: ${report.status}`);
  // Alert on-call if unhealthy
}, 30000); // Check every 30s

// Stop watching
unwatch();
```

### Middleware

```javascript
import { healthMiddleware } from './src/health.js';

// Express/Connect middleware
app.use(healthMiddleware());

// Provides:
// GET /health       - Full health report
// GET /health/live  - Liveness probe
// GET /health/ready - Readiness probe
```

### Built-in Checks

| Check | What It Validates |
|-------|-------------------|
| `memory` | Memory usage below threshold |
| `rulesets` | Ruleset presets available |
| `cache` | Cache operational |
| `figma-api` | Figma API accessible |

---

## Best Practices

### Production Setup

```javascript
// At application startup
import { initTelemetry, configureLogger } from './src/logger.js';
import { initHealthChecks } from './src/health.js';

// 1. Configure logging
configureLogger({
  level: 'info',
  format: 'json',
  includeTimestamp: true,
  includeCorrelationId: true
});

// 2. Initialize telemetry (opt-in)
initTelemetry();
// User must explicitly call enableTelemetry()

// 3. Initialize health checks
initHealthChecks();

// 4. Set up error handlers
process.on('unhandledRejection', (err) => {
  error('Unhandled rejection', { error: err.message });
  recordError('UNHANDLED_REJECTION', err.message);
});
```

### Development Setup

```javascript
import { enableDebug } from './src/debug.js';

// Enable all debug features during development
enableDebug({
  verbose: true,
  trace: true,
  perf: true
});

// Use withSpan for complex operations
await withSpan('full-export', async () => {
  await exportVariables();
  await validateOutput();
  await importToFigma();
});
```

### Error Handling

```javascript
import { error } from './src/logger.js';
import { recordError } from './src/telemetry.js';
import { CoreMetrics } from './src/metrics.js';

try {
  await riskyOperation();
} catch (err) {
  // Log with context
  error('Operation failed', {
    operation: 'export',
    error: err.message,
    code: err.code
  });

  // Record for telemetry
  recordError(err.code || 'UNKNOWN', err.message);

  // Increment error counter
  CoreMetrics.exportErrors.inc();

  throw err;
}
```

### Performance Monitoring

```javascript
import { timeItAsync, CoreMetrics } from './src/metrics.js';
import { perfMark } from './src/debug.js';
import { recordExport } from './src/telemetry.js';

// Automatic timing
const result = await timeItAsync(CoreMetrics.exportDuration, async () => {
  perfMark('export.start');

  const data = await fetchFromFigma();
  perfMark('export.fetch-complete');

  const transformed = transformToDTCG(data);
  perfMark('export.transform-complete');

  return transformed;
});

// Record telemetry
recordExport({
  fileCount: result.files.length,
  durationMs: performance.now() - start,
  success: true
});
```

### Memory Monitoring

```javascript
import { CoreMetrics } from './src/metrics.js';

// Update memory gauge periodically
setInterval(() => {
  const usage = process.memoryUsage();
  CoreMetrics.memoryUsage.set(usage.heapUsed);
  CoreMetrics.memoryLimit.set(usage.heapTotal);
}, 5000);
```

---

## Troubleshooting

### No Logs Appearing

```javascript
// Check log level
import { getLoggerConfig } from './src/logger.js';
console.log(getLoggerConfig());
// Ensure level is not set too high

// Reset to defaults
import { resetLoggerConfig } from './src/logger.js';
resetLoggerConfig();
```

### Telemetry Not Sending

```javascript
import { getTelemetryStatus } from './src/telemetry.js';

const status = getTelemetryStatus();
console.log(status);
// Check:
// - enabled: true
// - eventsInQueue > 0

// Force enable
enableTelemetry();

// Flush manually
await shutdownTelemetry();
```

### Spans Not Tracing

```javascript
import { isTracing, getDebugState } from './src/debug.js';

console.log('Tracing enabled:', isTracing());
console.log('Debug state:', getDebugState());

// Enable tracing
enableDebug({ trace: true });
```

### Health Check Failures

```javascript
import { checkHealth } from './src/health.js';

const report = await checkHealth();
console.log(JSON.stringify(report, null, 2));

// Check individual components
report.components.forEach(c => {
  if (c.status !== 'healthy') {
    console.error(`${c.name}: ${c.message}`);
  }
});
```

### Metrics Not Exporting

```javascript
import { getMetricsSnapshot } from './src/metrics.js';

const snapshot = getMetricsSnapshot();
console.log('Counters:', Object.keys(snapshot.counters));
console.log('Histograms:', Object.keys(snapshot.histograms));

// Ensure CoreMetrics are initialized
import { CoreMetrics } from './src/metrics.js';
CoreMetrics.exportsTotal.inc(); // Should not throw
```

---

## Quick Reference

### Common Patterns

```javascript
// Full observability setup
import { info, withCorrelation } from './src/logger.js';
import { CoreMetrics, timeItAsync } from './src/metrics.js';
import { recordCommand } from './src/telemetry.js';
import { withSpan, perfMark } from './src/debug.js';

export async function runCommand(command, args) {
  return withCorrelation(async () => {
    info('Command started', { command, args });

    return await withSpan(`cmd.${command}`, async () => {
      perfMark('cmd.start');

      const result = await timeItAsync(
        CoreMetrics[`${command}Duration`] || CoreMetrics.exportsTotal,
        async () => {
          // ... command logic ...
        }
      );

      perfMark('cmd.end');

      recordCommand(command, args, Date.now() - start, true);

      return result;
    });
  });
}
```

### Environment Variables

| Variable | Purpose |
|----------|---------|
| `DSR_LOG_LEVEL` | Set log level (trace..fatal) |
| `DSR_LOG_FORMAT` | json, pretty, minimal |
| `DSR_TELEMETRY` | Enable/disable telemetry |
| `DSR_DEBUG` | Enable debug mode |

---

_Last updated: 2026-04-26_
