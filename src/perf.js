/**
 * DSR Performance Measurement Module
 * Benchmarking, profiling, and performance monitoring utilities
 */

import { logError, makeError, ErrorCodes } from './errors.js';

/**
 * @typedef {Object} BenchmarkResult
 * @property {string} name - Benchmark name
 * @property {number} durationMs - Execution time in milliseconds
 * @property {number} memoryDeltaBytes - Memory change in bytes
 * @property {number} iterations - Number of iterations
 * @property {number} avgDurationMs - Average duration per iteration
 * @property {number} minDurationMs - Minimum duration
 * @property {number} maxDurationMs - Maximum duration
 * @property {number} throughput - Operations per second
 */

/**
 * @typedef {Object} PerformanceMetrics
 * @property {number} timestamp
 * @property {number} heapUsed
 * @property {number} heapTotal
 * @property {number} external
 * @property {number} rss
 */

/**
 * Get current memory usage
 * @returns {PerformanceMetrics}
 */
export function getMemoryMetrics() {
  const usage = process.memoryUsage();
  return {
    timestamp: Date.now(),
    heapUsed: usage.heapUsed,
    heapTotal: usage.heapTotal,
    external: usage.external,
    rss: usage.rss,
  };
}

/**
 * Format bytes to human-readable string
 * @param {number} bytes
 * @returns {string}
 */
export function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Format milliseconds to human-readable string
 * @param {number} ms
 * @returns {string}
 */
export function formatDuration(ms) {
  if (ms < 1) return `${(ms * 1000).toFixed(2)} µs`;
  if (ms < 1000) return `${ms.toFixed(2)} ms`;
  return `${(ms / 1000).toFixed(2)} s`;
}

/**
 * Run a benchmark
 * @param {string} name - Benchmark name
 * @param {Function} fn - Function to benchmark
 * @param {Object} [options] - Benchmark options
 * @param {number} [options.iterations=1] - Number of iterations
 * @param {number} [options.warmupIterations=0] - Warmup iterations (not counted)
 * @param {Function} [options.setup] - Setup function before each iteration
 * @param {Function} [options.teardown] - Teardown function after each iteration
 * @returns {Promise<BenchmarkResult>}
 */
export async function benchmark(name, fn, options = {}) {
  const {
    iterations = 1,
    warmupIterations = 0,
    setup,
    teardown,
  } = options;

  const durations = [];
  let memoryBefore = getMemoryMetrics();

  // Warmup
  for (let i = 0; i < warmupIterations; i++) {
    if (setup) await setup(i);
    await fn();
    if (teardown) await teardown(i);
  }

  // Force GC if available (Node.js with --expose-gc)
  if (global.gc) {
    global.gc();
    memoryBefore = getMemoryMetrics();
  }

  // Benchmark iterations
  for (let i = 0; i < iterations; i++) {
    if (setup) await setup(i);

    const start = performance.now();
    await fn();
    const duration = performance.now() - start;
    durations.push(duration);

    if (teardown) await teardown(i);
  }

  const memoryAfter = getMemoryMetrics();
  const memoryDelta = memoryAfter.heapUsed - memoryBefore.heapUsed;

  const totalDuration = durations.reduce((a, b) => a + b, 0);
  const avgDuration = totalDuration / iterations;
  const minDuration = Math.min(...durations);
  const maxDuration = Math.max(...durations);
  const throughput = 1000 / avgDuration; // ops per second

  const result = {
    name,
    durationMs: totalDuration,
    memoryDeltaBytes: memoryDelta,
    iterations,
    avgDurationMs: avgDuration,
    minDurationMs: minDuration,
    maxDurationMs: maxDuration,
    throughput,
  };

  return result;
}

/**
 * Profile an async function execution
 * @param {string} name - Profile name
 * @param {Function} fn - Function to profile
 * @param {...any} args - Arguments to pass to function
 * @returns {Promise<{result: any, profile: BenchmarkResult}>}
 */
export async function profile(name, fn, ...args) {
  const startMemory = getMemoryMetrics();
  const startTime = performance.now();

  let result;
  let error;

  try {
    result = await fn(...args);
  } catch (err) {
    error = err;
  }

  const endTime = performance.now();
  const endMemory = getMemoryMetrics();

  const profile = {
    name,
    durationMs: endTime - startTime,
    memoryDeltaBytes: endMemory.heapUsed - startMemory.heapUsed,
    iterations: 1,
    avgDurationMs: endTime - startTime,
    minDurationMs: endTime - startTime,
    maxDurationMs: endTime - startTime,
    throughput: 1000 / (endTime - startTime),
  };

  if (error) {
    throw error;
  }

  return { result, profile };
}

/**
 * Create a performance monitor for continuous monitoring
 * @param {Object} [options] - Monitor options
 * @param {number} [options.intervalMs=5000] - Sampling interval
 * @param {Function} [options.onSample] - Callback for each sample
 * @returns {{start: Function, stop: Function, getSamples: Function}}
 */
export function createMonitor(options = {}) {
  const {
    intervalMs = 5000,
    onSample,
  } = options;

  const samples = [];
  let intervalId = null;
  let isRunning = false;

  function sample() {
    const metrics = getMemoryMetrics();
    const sample = {
      ...metrics,
      cpuUsage: process.cpuUsage(),
    };

    samples.push(sample);

    // Keep only last 100 samples
    if (samples.length > 100) {
      samples.shift();
    }

    if (onSample) {
      onSample(sample);
    }
  }

  function start() {
    if (isRunning) return;
    isRunning = true;
    sample(); // Initial sample
    intervalId = setInterval(sample, intervalMs);
  }

  function stop() {
    if (!isRunning) return;
    isRunning = false;
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
  }

  function getSamples() {
    return [...samples];
  }

  return { start, stop, getSamples };
}

/**
 * Performance budget checker
 * @param {BenchmarkResult} result
 * @param {Object} budgets
 * @param {number} [budgets.maxDurationMs]
 * @param {number} [budgets.maxMemoryBytes]
 * @param {number} [budgets.minThroughput]
 * @returns {{passed: boolean, violations: string[]}}
 */
export function checkBudget(result, budgets) {
  const violations = [];

  if (budgets.maxDurationMs && result.avgDurationMs > budgets.maxDurationMs) {
    violations.push(
      `Duration ${formatDuration(result.avgDurationMs)} exceeds budget ${formatDuration(budgets.maxDurationMs)}`
    );
  }

  if (budgets.maxMemoryBytes && result.memoryDeltaBytes > budgets.maxMemoryBytes) {
    violations.push(
      `Memory ${formatBytes(result.memoryDeltaBytes)} exceeds budget ${formatBytes(budgets.maxMemoryBytes)}`
    );
  }

  if (budgets.minThroughput && result.throughput < budgets.minThroughput) {
    violations.push(
      `Throughput ${result.throughput.toFixed(2)} ops/s below budget ${budgets.minThroughput} ops/s`
    );
  }

  return {
    passed: violations.length === 0,
    violations,
  };
}

/**
 * Print benchmark results
 * @param {BenchmarkResult} result
 * @param {Object} [options]
 * @param {boolean} [options.verbose=false]
 */
export function printBenchmark(result, options = {}) {
  const { verbose = false } = options;

  console.log(`\n📊 Benchmark: ${result.name}`);
  console.log(`   Duration: ${formatDuration(result.durationMs)} (avg: ${formatDuration(result.avgDurationMs)})`);
  console.log(`   Memory: ${formatBytes(result.memoryDeltaBytes)}`);
  console.log(`   Throughput: ${result.throughput.toFixed(2)} ops/s`);
  console.log(`   Iterations: ${result.iterations}`);

  if (verbose) {
    console.log(`   Min: ${formatDuration(result.minDurationMs)}`);
    console.log(`   Max: ${formatDuration(result.maxDurationMs)}`);
  }
}

/**
 * Compare two benchmark results
 * @param {BenchmarkResult} baseline
 * @param {BenchmarkResult} current
 * @returns {{regression: boolean, improvements: string[], regressions: string[]}}
 */
export function compareBenchmarks(baseline, current) {
  const improvements = [];
  const regressions = [];

  // Duration comparison (lower is better)
  const durationChange = ((current.avgDurationMs - baseline.avgDurationMs) / baseline.avgDurationMs) * 100;
  if (durationChange < -10) {
    improvements.push(`Duration improved by ${Math.abs(durationChange).toFixed(1)}%`);
  } else if (durationChange > 10) {
    regressions.push(`Duration regressed by ${durationChange.toFixed(1)}%`);
  }

  // Memory comparison (lower is better)
  const memoryChange = ((current.memoryDeltaBytes - baseline.memoryDeltaBytes) / baseline.memoryDeltaBytes) * 100;
  if (memoryChange < -10) {
    improvements.push(`Memory improved by ${Math.abs(memoryChange).toFixed(1)}%`);
  } else if (memoryChange > 10) {
    regressions.push(`Memory regressed by ${memoryChange.toFixed(1)}%`);
  }

  // Throughput comparison (higher is better)
  const throughputChange = ((current.throughput - baseline.throughput) / baseline.throughput) * 100;
  if (throughputChange > 10) {
    improvements.push(`Throughput improved by ${throughputChange.toFixed(1)}%`);
  } else if (throughputChange < -10) {
    regressions.push(`Throughput regressed by ${Math.abs(throughputChange).toFixed(1)}%`);
  }

  return {
    regression: regressions.length > 0,
    improvements,
    regressions,
  };
}

/**
 * Create a performance logger that writes to file
 * @param {string} logPath
 * @returns {{log: Function, close: Function}}
 */
export function createPerfLogger(logPath) {
  const fs = require('fs');
  const entries = [];

  function log(entry) {
    entries.push({
      timestamp: new Date().toISOString(),
      ...entry,
    });
  }

  function close() {
    fs.writeFileSync(logPath, JSON.stringify(entries, null, 2));
  }

  return { log, close };
}

export default {
  getMemoryMetrics,
  formatBytes,
  formatDuration,
  benchmark,
  profile,
  createMonitor,
  checkBudget,
  printBenchmark,
  compareBenchmarks,
  createPerfLogger,
};
