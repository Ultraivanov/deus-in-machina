/**
 * DSR Debug Module
 * Debug/trace modes with verbose logging, tracing, and performance markers
 */

import { performance } from 'node:perf_hooks';
import { trace, debug, info } from './logger.js';
import { getMetricsSnapshot } from './metrics.js';

/**
 * @typedef {Object} DebugConfig
 * @property {boolean} enabled - Whether debug mode is enabled
 * @property {boolean} verbose - Enable verbose logging
 * @property {boolean} trace - Enable function tracing
 * @property {boolean} perf - Enable performance markers
 * @property {string[]} [filters] - Filters for trace output
 */

/** @type {DebugConfig} */
const config = {
  enabled: false,
  verbose: false,
  trace: false,
  perf: false,
  filters: []
};

// Active spans for tracing
/** @type {Map<string, {name: string, start: number, parent?: string}>} */
const activeSpans = new Map();
// Completed spans
/** @type {Array<{name: string, duration: number, start: number, end: number}>} */
const spanHistory = [];
const MAX_HISTORY = 1000;

/**
 * Enable debug mode
 * @param {Partial<DebugConfig>} [options]
 */
export function enableDebug(options = {}) {
  config.enabled = true;
  config.verbose = options.verbose ?? true;
  config.trace = options.trace ?? false;
  config.perf = options.perf ?? false;
  config.filters = options.filters ?? [];

  info('Debug mode enabled', { config });
}

/**
 * Disable debug mode
 */
export function disableDebug() {
  config.enabled = false;
  config.verbose = false;
  config.trace = false;
  config.perf = false;

  info('Debug mode disabled');
}

/**
 * Check if debug mode is enabled
 * @returns {boolean}
 */
export function isDebugEnabled() {
  return config.enabled;
}

/**
 * Check if verbose logging is enabled
 * @returns {boolean}
 */
export function isVerbose() {
  return config.enabled && config.verbose;
}

/**
 * Check if tracing is enabled
 * @returns {boolean}
 */
export function isTracing() {
  return config.enabled && config.trace;
}

/**
 * Check if performance markers are enabled
 * @returns {boolean}
 */
export function isPerfEnabled() {
  return config.enabled && config.perf;
}

/**
 * Log verbose message (only when verbose mode enabled)
 * @param {string} message
 * @param {Object} [context]
 */
export function verbose(message, context = {}) {
  if (isVerbose()) {
    debug(message, context);
  }
}

/**
 * Start a trace span
 * @param {string} name - Span name
 * @param {Object} [context] - Additional context
 * @returns {string} Span ID
 */
export function startSpan(name, context = {}) {
  if (!isTracing()) {
    return null;
  }

  // Check filters
  if (config.filters.length > 0 && !config.filters.some(f => name.includes(f))) {
    return null;
  }

  const id = `span-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const start = performance.now();

  // Find parent span (last active)
  let parent = null;
  if (activeSpans.size > 0) {
    const lastEntry = Array.from(activeSpans.entries()).pop();
    parent = lastEntry ? lastEntry[0] : null;
  }

  activeSpans.set(id, {
    name,
    start,
    parent,
    context
  });

  trace(`→ ${name}`, { spanId: id, parent, ...context });

  return id;
}

/**
 * End a trace span
 * @param {string} id - Span ID from startSpan
 * @param {Object} [context] - Additional context to log
 */
export function endSpan(id, context = {}) {
  if (!id || !isTracing()) {
    return;
  }

  const span = activeSpans.get(id);
  if (!span) {
    return;
  }

  const end = performance.now();
  const duration = end - span.start;

  activeSpans.delete(id);

  // Add to history
  spanHistory.push({
    name: span.name,
    duration,
    start: span.start,
    end
  });

  // Trim history
  if (spanHistory.length > MAX_HISTORY) {
    spanHistory.shift();
  }

  trace(`← ${span.name}`, {
    spanId: id,
    duration: `${duration.toFixed(2)}ms`,
    ...context
  });
}

/**
 * Execute function with automatic span tracing
 * @param {string} name
 * @param {Function} fn
 * @returns {any}
 */
export function withSpan(name, fn) {
  if (!isTracing()) {
    return fn();
  }

  const spanId = startSpan(name);
  try {
    const result = fn();
    endSpan(spanId, { success: true });
    return result;
  } catch (err) {
    endSpan(spanId, { success: false, error: err.message });
    throw err;
  }
}

/**
 * Execute async function with automatic span tracing
 * @param {string} name
 * @param {Function} fn
 * @returns {Promise<any>}
 */
export async function withSpanAsync(name, fn) {
  if (!isTracing()) {
    return fn();
  }

  const spanId = startSpan(name);
  try {
    const result = await fn();
    endSpan(spanId, { success: true });
    return result;
  } catch (err) {
    endSpan(spanId, { success: false, error: err.message });
    throw err;
  }
}

/**
 * Mark a performance point
 * @param {string} name
 * @param {Object} [context]
 */
export function perfMark(name, context = {}) {
  if (!isPerfEnabled()) {
    return;
  }

  const timestamp = performance.now();
  const memory = process.memoryUsage();

  trace(`⏱ ${name}`, {
    timestamp,
    memory: {
      heapUsed: formatBytes(memory.heapUsed),
      heapTotal: formatBytes(memory.heapTotal),
      rss: formatBytes(memory.rss)
    },
    ...context
  });
}

/**
 * Format bytes to human readable
 * @param {number} bytes
 * @returns {string}
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Get current debug state
 * @returns {{config: DebugConfig, activeSpans: number, spanHistory: number}}
 */
export function getDebugState() {
  return {
    config: { ...config },
    activeSpans: activeSpans.size,
    spanHistory: spanHistory.length
  };
}

/**
 * Get span history
 * @param {Object} [options]
 * @param {number} [options.limit=100]
 * @param {string} [options.name] - Filter by name
 * @returns {Array}
 */
export function getSpanHistory(options = {}) {
  const { limit = 100, name } = options;

  let results = [...spanHistory];

  if (name) {
    results = results.filter(s => s.name.includes(name));
  }

  return results.slice(-limit);
}

/**
 * Clear span history
 */
export function clearSpanHistory() {
  spanHistory.length = 0;
  activeSpans.clear();
}

/**
 * Print debug report
 */
export function printDebugReport() {
  if (!config.enabled) {
    info('Debug mode is disabled');
    return;
  }

  const state = getDebugState();
  const metrics = getMetricsSnapshot();

  info('=== DSR Debug Report ===', {
    debug: state,
    metrics: {
      counters: Object.keys(metrics.counters).length,
      histograms: Object.keys(metrics.histograms).length,
      gauges: Object.keys(metrics.gauges).length
    }
  });

  // Show recent spans
  if (spanHistory.length > 0) {
    const recent = getSpanHistory({ limit: 10 });
    info('Recent spans:', {
      spans: recent.map(s => ({
        name: s.name,
        duration: `${s.duration.toFixed(2)}ms`
      }))
    });
  }

  // Show active spans
  if (activeSpans.size > 0) {
    info('Active spans:', {
      count: activeSpans.size,
      spans: Array.from(activeSpans.entries()).map(([id, span]) => ({
        id: id.slice(0, 20),
        name: span.name,
        running: `${(performance.now() - span.start).toFixed(2)}ms`
      }))
    });
  }
}

/**
 * Wrap a function with tracing
 * @param {Function} fn
 * @param {string} [name] - Optional override name
 * @returns {Function} Wrapped function
 */
export function traceFn(fn, name) {
  const fnName = name || fn.name || 'anonymous';

  return function (...args) {
    const spanId = startSpan(fnName, { args: args.length });

    try {
      const result = fn.apply(this, args);

      // Handle promises
      if (result && typeof result.then === 'function') {
        return result
          .then(value => {
            endSpan(spanId, { success: true });
            return value;
          })
          .catch(err => {
            endSpan(spanId, { success: false, error: err.message });
            throw err;
          });
      }

      endSpan(spanId, { success: true });
      return result;
    } catch (err) {
      endSpan(spanId, { success: false, error: err.message });
      throw err;
    }
  };
}

/**
 * Profile a function's execution
 * @param {string} name
 * @param {Function} fn
 * @param {number} [iterations=1]
 * @returns {{result: any, stats: Object}}
 */
export function profileFunction(name, fn, iterations = 1) {
  const times = [];
  let result;

  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    result = fn();
    times.push(performance.now() - start);
  }

  const stats = {
    name,
    iterations,
    total: times.reduce((a, b) => a + b, 0),
    min: Math.min(...times),
    max: Math.max(...times),
    avg: times.reduce((a, b) => a + b, 0) / times.length
  };

  info(`Profile: ${name}`, stats);

  return { result, stats };
}

/**
 * Debug middleware for CLI commands
 * @param {string} command
 * @param {Function} handler
 * @returns {Function}
 */
export function debugMiddleware(command, handler) {
  return async function (flags) {
    const spanId = startSpan(`cli.${command}`, { flags: Object.keys(flags) });
    const startMemory = process.memoryUsage();

    try {
      perfMark(`cli.${command}.start`);

      const result = await handler(flags);

      perfMark(`cli.${command}.end`, {
        memoryDelta: {
          heapUsed: formatBytes(process.memoryUsage().heapUsed - startMemory.heapUsed)
        }
      });

      endSpan(spanId, { success: true });

      return result;
    } catch (err) {
      endSpan(spanId, { success: false, error: err.message });
      throw err;
    }
  };
}

export default {
  enableDebug,
  disableDebug,
  isDebugEnabled,
  isVerbose,
  isTracing,
  isPerfEnabled,
  verbose,
  startSpan,
  endSpan,
  withSpan,
  withSpanAsync,
  perfMark,
  getDebugState,
  getSpanHistory,
  clearSpanHistory,
  printDebugReport,
  traceFn,
  profileFunction,
  debugMiddleware
};
