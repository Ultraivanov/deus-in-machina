/**
 * DSR Metrics Module
 * Metrics collection with counters, histograms, and gauges
 */

/**
 * @typedef {Object} Counter
 * @property {string} name
 * @property {string} description
 * @property {string[]} [labels]
 * @property {() => void} inc - Increment by 1
 * @property {(n: number) => void} add - Increment by n
 * @property {() => number} get - Get current value
 * @property {() => void} reset - Reset to 0
 */

/**
 * @typedef {Object} Histogram
 * @property {string} name
 * @property {string} description
 * @property {number[]} buckets
 * @property {(value: number) => void} observe - Record a value
 * @property {() => {buckets: number[], sum: number, count: number}} get - Get snapshot
 * @property {() => void} reset - Reset all buckets
 */

/**
 * @typedef {Object} Gauge
 * @property {string} name
 * @property {string} description
 * @property {(value: number) => void} set - Set value
 * @property {() => number} get - Get current value
 * @property {() => void} inc - Increment by 1
 * @property {() => void} dec - Decrement by 1
 * @property {() => void} reset - Reset to 0
 */

export class MetricsRegistry {
  constructor() {
    /** @type {Map<string, Counter>} */
    this.counters = new Map();
    /** @type {Map<string, Histogram>} */
    this.histograms = new Map();
    /** @type {Map<string, Gauge>} */
    this.gauges = new Map();
  }

  /**
   * Create or get a counter
   * @param {string} name
   * @param {string} description
   * @param {string[]} [labels]
   * @returns {Counter}
   */
  counter(name, description, labels = []) {
    if (this.counters.has(name)) {
      return this.counters.get(name);
    }

    let value = 0;
    const labelValues = {};

    const counter = {
      name,
      description,
      labels,
      inc: (labelSet = {}) => {
        const key = JSON.stringify(labelSet);
        labelValues[key] = (labelValues[key] || 0) + 1;
        value++;
      },
      add: (n, labelSet = {}) => {
        const key = JSON.stringify(labelSet);
        labelValues[key] = (labelValues[key] || 0) + n;
        value += n;
      },
      get: (labelSet) => {
        if (labelSet === undefined) return value;
        const key = JSON.stringify(labelSet);
        return labelValues[key] || 0;
      },
      reset: () => {
        value = 0;
        Object.keys(labelValues).forEach(k => delete labelValues[k]);
      }
    };

    this.counters.set(name, counter);
    return counter;
  }

  /**
   * Create or get a histogram
   * @param {string} name
   * @param {string} description
   * @param {number[]} buckets
   * @returns {Histogram}
   */
  histogram(name, description, buckets = [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10]) {
    if (this.histograms.has(name)) {
      return this.histograms.get(name);
    }

    const bucketCounts = new Array(buckets.length).fill(0);
    let sum = 0;
    let count = 0;

    const histogram = {
      name,
      description,
      buckets,
      observe: (value) => {
        sum += value;
        count++;
        for (let i = 0; i < buckets.length; i++) {
          if (value <= buckets[i]) {
            bucketCounts[i]++;
          }
        }
      },
      get: () => ({
        buckets: buckets.map((b, i) => ({ le: b, count: bucketCounts[i] })),
        sum,
        count
      }),
      reset: () => {
        bucketCounts.fill(0);
        sum = 0;
        count = 0;
      }
    };

    this.histograms.set(name, histogram);
    return histogram;
  }

  /**
   * Create or get a gauge
   * @param {string} name
   * @param {string} description
   * @returns {Gauge}
   */
  gauge(name, description) {
    if (this.gauges.has(name)) {
      return this.gauges.get(name);
    }

    let value = 0;

    const gauge = {
      name,
      description,
      set: (v) => { value = v; },
      get: () => value,
      inc: () => { value++; },
      dec: () => { value--; },
      reset: () => { value = 0; }
    };

    this.gauges.set(name, gauge);
    return gauge;
  }

  /**
   * Get all metrics snapshot
   * @returns {Object}
   */
  snapshot() {
    return {
      counters: Object.fromEntries(
        Array.from(this.counters.entries()).map(([name, c]) => [name, c.get()])
      ),
      histograms: Object.fromEntries(
        Array.from(this.histograms.entries()).map(([name, h]) => [name, h.get()])
      ),
      gauges: Object.fromEntries(
        Array.from(this.gauges.entries()).map(([name, g]) => [name, g.get()])
      ),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Reset all metrics
   */
  resetAll() {
    this.counters.forEach(c => c.reset());
    this.histograms.forEach(h => h.reset());
    this.gauges.forEach(g => g.reset());
  }

  /**
   * Clear registry (remove all metrics)
   */
  clear() {
    this.counters.clear();
    this.histograms.clear();
    this.gauges.clear();
  }
}

// Global registry instance
const globalRegistry = new MetricsRegistry();

/**
 * Get global metrics registry
 * @returns {MetricsRegistry}
 */
export function getRegistry() {
  return globalRegistry;
}

/**
 * Create a counter
 * @param {string} name
 * @param {string} description
 * @param {string[]} [labels]
 * @returns {Counter}
 */
export function createCounter(name, description, labels) {
  return globalRegistry.counter(name, description, labels);
}

/**
 * Create a histogram
 * @param {string} name
 * @param {string} description
 * @param {number[]} [buckets]
 * @returns {Histogram}
 */
export function createHistogram(name, description, buckets) {
  return globalRegistry.histogram(name, description, buckets);
}

/**
 * Create a gauge
 * @param {string} name
 * @param {string} description
 * @returns {Gauge}
 */
export function createGauge(name, description) {
  return globalRegistry.gauge(name, description);
}

/**
 * Get all metrics snapshot
 * @returns {Object}
 */
export function getMetricsSnapshot() {
  return globalRegistry.snapshot();
}

/**
 * Reset all metrics
 */
export function resetAllMetrics() {
  globalRegistry.resetAll();
}

/**
 * Clear all metrics (remove definitions)
 */
export function clearMetrics() {
  globalRegistry.clear();
}

/**
 * Time a function execution and record to histogram
 * @param {Histogram} histogram
 * @param {Function} fn
 * @returns {any}
 */
export function timeIt(histogram, fn) {
  const start = performance.now();
  const result = fn();
  const duration = performance.now() - start;
  histogram.observe(duration);
  return result;
}

/**
 * Time an async function execution and record to histogram
 * @param {Histogram} histogram
 * @param {Function} fn
 * @returns {Promise<any>}
 */
export async function timeItAsync(histogram, fn) {
  const start = performance.now();
  const result = await fn();
  const duration = performance.now() - start;
  histogram.observe(duration);
  return result;
}

/**
 * Create timer metric (histogram with time buckets)
 * @param {string} name
 * @param {string} description
 * @param {number[]} [buckets] - in milliseconds
 * @returns {Histogram}
 */
export function createTimer(name, description, buckets = [1, 5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000]) {
  return globalRegistry.histogram(name, description, buckets);
}

/**
 * DSR Core Metrics
 */
export const CoreMetrics = {
  // Export operations
  exportsTotal: createCounter('dsr_exports_total', 'Total number of export operations'),
  exportDuration: createTimer('dsr_export_duration_ms', 'Export operation duration in milliseconds'),
  exportErrors: createCounter('dsr_export_errors_total', 'Total number of export errors'),

  // Import operations
  importsTotal: createCounter('dsr_imports_total', 'Total number of import operations'),
  importDuration: createTimer('dsr_import_duration_ms', 'Import operation duration in milliseconds'),
  importErrors: createCounter('dsr_import_errors_total', 'Total number of import errors'),

  // Validation
  validationsTotal: createCounter('dsr_validations_total', 'Total number of validation runs'),
  validationDuration: createTimer('dsr_validation_duration_ms', 'Validation duration in milliseconds'),
  validationIssues: createCounter('dsr_validation_issues_total', 'Total validation issues found', ['severity', 'type']),

  // Fix loop
  fixLoopsTotal: createCounter('dsr_fix_loops_total', 'Total number of fix loops executed'),
  fixLoopIterations: createHistogram('dsr_fix_loop_iterations', 'Number of iterations per fix loop', [1, 2, 3, 5, 10]),
  fixesApplied: createCounter('dsr_fixes_applied_total', 'Total number of fixes applied'),

  // API calls
  apiCallsTotal: createCounter('dsr_api_calls_total', 'Total API calls', ['endpoint']),
  apiCallDuration: createTimer('dsr_api_call_duration_ms', 'API call duration in milliseconds'),
  apiErrors: createCounter('dsr_api_errors_total', 'Total API errors', ['status_code']),

  // Cache
  cacheHits: createCounter('dsr_cache_hits_total', 'Total cache hits', ['cache_name']),
  cacheMisses: createCounter('dsr_cache_misses_total', 'Total cache misses', ['cache_name']),

  // Memory
  memoryUsage: createGauge('dsr_memory_usage_bytes', 'Current memory usage in bytes'),
  memoryLimit: createGauge('dsr_memory_limit_bytes', 'Memory limit in bytes'),

  // Active operations
  activeExports: createGauge('dsr_active_exports', 'Number of active exports'),
  activeImports: createGauge('dsr_active_imports', 'Number of active imports'),
  activeValidations: createGauge('dsr_active_validations', 'Number of active validations')
};

/**
 * Export metrics in Prometheus format
 * @returns {string}
 */
export function exportPrometheusMetrics() {
  const snapshot = globalRegistry.snapshot();
  const lines = [];

  // Counters
  for (const [name, value] of Object.entries(snapshot.counters)) {
    lines.push(`# HELP ${name} ${globalRegistry.counters.get(name)?.description || ''}`);
    lines.push(`# TYPE ${name} counter`);
    lines.push(`${name} ${value}`);
  }

  // Gauges
  for (const [name, value] of Object.entries(snapshot.gauges)) {
    lines.push(`# HELP ${name} ${globalRegistry.gauges.get(name)?.description || ''}`);
    lines.push(`# TYPE ${name} gauge`);
    lines.push(`${name} ${value}`);
  }

  // Histograms
  for (const [name, data] of Object.entries(snapshot.histograms)) {
    const hist = globalRegistry.histograms.get(name);
    lines.push(`# HELP ${name} ${hist?.description || ''}`);
    lines.push(`# TYPE ${name} histogram`);

    for (const bucket of data.buckets) {
      lines.push(`${name}_bucket{le="${bucket.le}"} ${bucket.count}`);
    }
    lines.push(`${name}_sum ${data.sum}`);
    lines.push(`${name}_count ${data.count}`);
  }

  return lines.join('\n');
}

export default {
  MetricsRegistry,
  getRegistry,
  createCounter,
  createHistogram,
  createGauge,
  createTimer,
  getMetricsSnapshot,
  resetAllMetrics,
  clearMetrics,
  timeIt,
  timeItAsync,
  CoreMetrics,
  exportPrometheusMetrics
};
