# DSR Performance Guide

> Comprehensive guide to performance characteristics, limits, and best practices.

---

## Overview

DSR is designed for production workloads with predictable performance. This guide covers:
- Performance budgets and limits
- Benchmarking and profiling
- Memory management
- API optimization
- Best practices

---

## Performance Budgets

### Core Operations

| Operation | Target | Max | Notes |
|-----------|--------|-----|-------|
| Export 10 variables | 50ms | 100ms | Small files |
| Export 100 variables | 200ms | 500ms | Medium files |
| Export 1,000 variables | 800ms | 2000ms | Large files |
| Normalize tokens | 50ms | 100ms | Per 100 tokens |
| Validate UI | 20ms | 50ms | Per component |
| Fix loop (1 iter) | 100ms | 200ms | Single pass |
| Fix loop (full) | 400ms | 500ms | Multiple iterations |

### Memory Limits

| Context | Budget | Notes |
|---------|--------|-------|
| Standard operation | 512MB | Default limit |
| Large file processing | 2GB | Streaming mode |
| Export cache | 100MB | In-memory API cache |
| Per-chunk processing | 100MB | Chunked processing |

---

## Benchmarking

### Running Benchmarks

```bash
# Run all benchmarks
node tests/perf.benchmark.js

# Results saved to benchmark-results.json
```

### Using Benchmark API

```javascript
import { benchmark, printBenchmark } from './src/perf.js';

const result = await benchmark('my-operation', async () => {
  // Your operation here
  await exportFromFigmaAPI(fileKey, apiKey);
}, {
  iterations: 10,
  warmupIterations: 2,
});

printBenchmark(result);
```

### Performance Budget Checking

```javascript
import { benchmark, checkBudget } from './src/perf.js';

const result = await benchmark('export', () => exportData());

const budget = checkBudget(result, {
  maxDurationMs: 500,
  maxMemoryBytes: 10 * 1024 * 1024, // 10MB
  minThroughput: 2, // 2 ops/s
});

if (!budget.passed) {
  console.warn('Budget violations:', budget.violations);
}
```

---

## Memory Profiling

### Profiling a Function

```javascript
import { profileMemory, printMemoryProfile } from './src/perf.js';

const { result, profile } = await profileMemory('export', async () => {
  return await exportVariablesToDTCG(variables, collections);
});

printMemoryProfile(profile);
// Output:
// 📊 Memory Profile
//    Duration: 245.32 ms
//    Peak Heap: 45.23 MB
//    Peak RSS: 78.12 MB
//    Growth: +12.45 MB
```

### Memory Profiling with Snapshots

```javascript
import { createMemoryProfiler } from './src/perf.js';

const profiler = createMemoryProfiler();
profiler.start('init');

// Phase 1: Load data
const data = await loadData();
profiler.snapshot('loaded');

// Phase 2: Process
const result = processData(data);
profiler.snapshot('processed');

// Phase 3: Export
await exportResult(result);
const profile = profiler.stop('complete');
```

### Memory Limit Enforcement

```javascript
import { createMemoryLimitEnforcer } from './src/perf.js';

const enforcer = createMemoryLimitEnforcer({
  maxHeapBytes: 512 * 1024 * 1024, // 512MB
  maxRssBytes: 1 * 1024 * 1024 * 1024, // 1GB
  checkIntervalMs: 1000,
});

enforcer.start();

// Your memory-intensive operation
await processLargeFile();

enforcer.stop();
```

---

## API Optimization

### Caching

```javascript
import { exportFromFigmaAPIOptimized, clearAPICache } from './src/figma/exporter.js';

// Cached export (1 minute TTL by default)
const tokens = await exportFromFigmaAPIOptimized(
  fileKey,
  apiKey,
  { colorMode: 'hex' },
  { useCache: true, cacheTTL: 60000 }
);

// Second call returns cached result (instant)
const tokens2 = await exportFromFigmaAPIOptimized(fileKey, apiKey, config);

// Clear cache if needed
clearAPICache();
```

### Request Deduplication

Concurrent identical requests are automatically deduplicated:

```javascript
// These two concurrent calls result in ONE API request
const [result1, result2] = await Promise.all([
  fetchVariablesOptimized(fileKey, apiKey),
  fetchVariablesOptimized(fileKey, apiKey),
]);
```

### Batch Processing

```javascript
import { batchFetchVariables } from './src/figma/exporter.js';

const files = [
  { fileKey: 'file1', apiKey: 'token1' },
  { fileKey: 'file2', apiKey: 'token2' },
  { fileKey: 'file3', apiKey: 'token3' },
];

const results = await batchFetchVariables(files, {
  concurrency: 3, // Max 3 concurrent requests
});
```

### Retry Configuration

```javascript
import { withRetry } from './src/errors.js';

const reliableFetch = withRetry(fetchData, {
  maxRetries: 3,
  baseDelay: 1000,    // Start with 1s
  maxDelay: 30000,    // Max 30s between retries
});
```

---

## Large File Handling

### Streaming Processing

```javascript
import { streamProcessTokens } from './src/streaming.js';

const count = await streamProcessTokens('large-tokens.json', {
  chunkSize: 1000,
  maxMemoryBytes: 100 * 1024 * 1024, // 100MB
  onChunk: async (chunk, offset) => {
    // Process 1000 items at a time
    await processBatch(chunk);
    console.log(`Processed ${offset + chunk.length} items`);
  },
});
```

### Streaming Export

```javascript
import { streamExportToFile } from './src/streaming.js';

// Export without loading all into memory
await streamExportToFile(largeVariables, 'output.json', {
  chunkSize: 500,
});
```

### Throttling

```javascript
import { createThrottle, createProgressMonitor } from './src/streaming.js';
import { pipeline } from 'node:stream';

await pipeline(
  sourceStream,
  createThrottle(100), // 100 items/second max
  createProgressMonitor({
    onProgress: ({ processed, percent }) => {
      console.log(`${percent}% complete (${processed} items)`);
    },
  }),
  destinationStream
);
```

---

## Best Practices

### For Small Projects (< 100 variables)

```javascript
// Standard export is fine
const tokens = await exportFromFigmaAPI(fileKey, apiKey, config);
```

### For Medium Projects (100-1000 variables)

```javascript
// Use caching
const tokens = await exportFromFigmaAPIOptimized(fileKey, apiKey, config, {
  useCache: true,
  cacheTTL: 300000, // 5 minutes
});
```

### For Large Projects (> 1000 variables)

```javascript
import { profileMemory, createMemoryLimitEnforcer } from './src/perf.js';

// Monitor memory
const enforcer = createMemoryLimitEnforcer({ maxHeapBytes: 1024 * 1024 * 1024 });
enforcer.start();

// Profile the operation
const { result, profile } = await profileMemory('large-export', async () => {
  return await exportFromFigmaAPIOptimized(fileKey, apiKey, config);
});

enforcer.stop();

if (profile.peakHeapUsed > 500 * 1024 * 1024) {
  console.warn('Consider using streaming mode for large exports');
}
```

### For Multiple Files

```javascript
// Use batch fetching with concurrency limit
const results = await batchFetchVariables(
  files.map(f => ({ fileKey: f.key, apiKey: f.token })),
  { concurrency: 3 }
);
```

### Memory-Constrained Environments

```javascript
// Reduce chunk sizes
await streamProcessTokens(file, {
  chunkSize: 100,      // Smaller chunks
  maxMemoryBytes: 50 * 1024 * 1024, // 50MB limit
});
```

---

## Monitoring

### Continuous Monitoring

```javascript
import { createMonitor } from './src/perf.js';

const monitor = createMonitor({
  intervalMs: 5000, // Sample every 5 seconds
  onSample: (metrics) => {
    if (metrics.heapUsed > 500 * 1024 * 1024) {
      console.warn('High memory usage:', formatBytes(metrics.heapUsed));
    }
  },
});

monitor.start();
// ... your code ...
monitor.stop();
```

### Performance Logging

```javascript
import { createPerfLogger } from './src/perf.js';

const logger = createPerfLogger('perf-log.json');

logger.log({
  operation: 'export',
  fileKey: 'ABC123',
  duration: 245,
  memory: 45 * 1024 * 1024,
});

logger.close();
```

---

## Troubleshooting

### Slow Exports

**Symptoms:** Export takes longer than budget

**Solutions:**
1. Enable caching: `useCache: true`
2. Check network latency: `ping api.figma.com`
3. Reduce export scope: fewer collections/modes
4. Use batch fetching for multiple files

### High Memory Usage

**Symptoms:** Process exceeds memory budget

**Solutions:**
1. Use streaming mode for large files
2. Reduce chunk sizes
3. Clear caches periodically: `clearAPICache()`
4. Process files sequentially instead of parallel

### Rate Limiting

**Symptoms:** `FIGMA_RATE_LIMIT` errors

**Solutions:**
1. Reduce concurrency in batch operations
2. Increase cache TTL to reduce API calls
3. Use request deduplication (enabled by default)
4. Add exponential backoff retry

### Cache Issues

**Symptoms:** Stale data or high memory usage

**Solutions:**
1. Clear cache: `clearAPICache()`
2. Reduce TTL: `cacheTTL: 10000` (10 seconds)
3. Disable cache: `useCache: false`
4. Check cache stats: `getCacheStats()`

---

## Configuration Reference

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `FIGMA_API_KEY` | - | Required for Figma API access |
| `DSR_CACHE_TTL` | 60000 | Default cache TTL in ms |
| `DSR_MAX_MEMORY` | 536870912 | Max heap bytes (512MB) |
| `DSR_LOG_LEVEL` | 'info' | Log verbosity |

### Recommended Settings by Scale

**Small (< 100 vars):**
```javascript
{
  chunkSize: 100,
  cacheTTL: 60000,
  maxMemory: 128 * 1024 * 1024,
}
```

**Medium (100-1000 vars):**
```javascript
{
  chunkSize: 500,
  cacheTTL: 300000,
  maxMemory: 512 * 1024 * 1024,
}
```

**Large (> 1000 vars):**
```javascript
{
  chunkSize: 1000,
  cacheTTL: 600000,
  maxMemory: 2048 * 1024 * 1024,
  useStreaming: true,
}
```

---

_Last updated: 2026-04-22_
