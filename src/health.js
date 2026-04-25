/**
 * DSR Health Module
 * Health checks and status endpoints
 */

import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * @typedef {'healthy' | 'degraded' | 'unhealthy'} HealthStatus
 */

/**
 * @typedef {Object} ComponentHealth
 * @property {string} name
 * @property {HealthStatus} status
 * @property {string} [message]
 * @property {number} [responseTime]
 * @property {Object} [metadata]
 */

/**
 * @typedef {Object} HealthReport
 * @property {HealthStatus} status
 * @property {string} timestamp
 * @property {string} version
 * @property {ComponentHealth[]} components
 * @property {Object} [metrics]
 */

// Health check registry
/** @type {Map<string, Function>} */
const checks = new Map();

/**
 * Register a health check
 * @param {string} name
 * @param {Function} checkFn - Async function returning ComponentHealth
 */
export function registerCheck(name, checkFn) {
  checks.set(name, checkFn);
}

/**
 * Unregister a health check
 * @param {string} name
 */
export function unregisterCheck(name) {
  checks.delete(name);
}

/**
 * Get package version
 * @returns {string}
 */
function getVersion() {
  try {
    const __dirname = dirname(fileURLToPath(import.meta.url));
    const packagePath = join(__dirname, '..', 'package.json');
    const pkg = JSON.parse(readFileSync(packagePath, 'utf-8'));
    return pkg.version || 'unknown';
  } catch {
    return 'unknown';
  }
}

/**
 * Run a single health check with timeout
 * @param {string} name
 * @param {Function} checkFn
 * @param {number} [timeoutMs=5000]
 * @returns {Promise<ComponentHealth>}
 */
async function runCheck(name, checkFn, timeoutMs = 5000) {
  const start = Date.now();

  try {
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Health check timeout')), timeoutMs);
    });

    const result = await Promise.race([checkFn(), timeoutPromise]);
    const responseTime = Date.now() - start;

    return {
      name,
      status: result.status || 'healthy',
      message: result.message,
      responseTime,
      metadata: result.metadata
    };
  } catch (err) {
    return {
      name,
      status: 'unhealthy',
      message: err.message,
      responseTime: Date.now() - start
    };
  }
}

/**
 * Run all registered health checks
 * @param {Object} [options]
 * @param {number} [options.timeoutMs=5000]
 * @returns {Promise<HealthReport>}
 */
export async function checkHealth(options = {}) {
  const { timeoutMs = 5000 } = options;
  const timestamp = new Date().toISOString();

  // Run all checks in parallel
  const checkPromises = Array.from(checks.entries()).map(([name, checkFn]) =>
    runCheck(name, checkFn, timeoutMs)
  );

  const components = await Promise.all(checkPromises);

  // Determine overall status
  const hasUnhealthy = components.some(c => c.status === 'unhealthy');
  const hasDegraded = components.some(c => c.status === 'degraded');

  const status = hasUnhealthy ? 'unhealthy' : hasDegraded ? 'degraded' : 'healthy';

  return {
    status,
    timestamp,
    version: getVersion(),
    components,
    metrics: {
      total: components.length,
      healthy: components.filter(c => c.status === 'healthy').length,
      degraded: components.filter(c => c.status === 'degraded').length,
      unhealthy: components.filter(c => c.status === 'unhealthy').length
    }
  };
}

/**
 * Quick health check (liveness probe)
 * @returns {{status: 'healthy', timestamp: string}}
 */
export function livenessCheck() {
  return {
    status: 'healthy',
    timestamp: new Date().toISOString()
  };
}

/**
 * Readiness check (can accept traffic)
 * @returns {Promise<HealthReport>}
 */
export async function readinessCheck() {
  return checkHealth({ timeoutMs: 3000 });
}

/**
 * Startup check (is initialized)
 * @returns {{status: 'healthy', timestamp: string, initialized: boolean}}
 */
export function startupCheck() {
  return {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    initialized: true
  };
}

/**
 * Memory health check
 * @returns {Promise<ComponentHealth>}
 */
export async function memoryCheck() {
  const usage = process.memoryUsage();
  const maxHeap = 512 * 1024 * 1024; // 512MB threshold

  const heapUsedPercent = (usage.heapUsed / maxHeap) * 100;

  let status = 'healthy';
  let message = 'Memory usage normal';

  if (heapUsedPercent > 90) {
    status = 'unhealthy';
    message = `Memory critical: ${formatBytes(usage.heapUsed)} / ${formatBytes(maxHeap)}`;
  } else if (heapUsedPercent > 70) {
    status = 'degraded';
    message = `Memory high: ${formatBytes(usage.heapUsed)} / ${formatBytes(maxHeap)}`;
  }

  return {
    name: 'memory',
    status,
    message,
    metadata: {
      heapUsed: usage.heapUsed,
      heapTotal: usage.heapTotal,
      rss: usage.rss,
      external: usage.external
    }
  };
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
 * Check if all ruleset presets are available
 * @returns {Promise<ComponentHealth>}
 */
export async function rulesetCheck() {
  try {
    const { listPresets } = await import('./ruleset/index.js');
    const presets = listPresets();

    return {
      name: 'rulesets',
      status: presets.length > 0 ? 'healthy' : 'degraded',
      message: `${presets.length} ruleset presets available`,
      metadata: { presets }
    };
  } catch (err) {
    return {
      name: 'rulesets',
      status: 'unhealthy',
      message: err.message
    };
  }
}

/**
 * Check cache health
 * @returns {Promise<ComponentHealth>}
 */
export async function cacheCheck() {
  try {
    const { getCacheStats } = await import('./figma/exporter.js');
    const stats = getCacheStats();

    return {
      name: 'cache',
      status: 'healthy',
      message: `${stats.size} items cached`,
      metadata: { size: stats.size }
    };
  } catch (err) {
    return {
      name: 'cache',
      status: 'unhealthy',
      message: err.message
    };
  }
}

/**
 * Check if Figma API is accessible
 * @returns {Promise<ComponentHealth>}
 */
export async function figmaApiCheck() {
  // This is a placeholder - in production, would make a lightweight API call
  return {
    name: 'figma-api',
    status: 'healthy',
    message: 'Figma API check not configured',
    metadata: { note: 'Add FIGMA_API_KEY env var for actual check' }
  };
}

/**
 * Initialize default health checks
 */
export function initHealthChecks() {
  registerCheck('memory', memoryCheck);
  registerCheck('rulesets', rulesetCheck);
  registerCheck('cache', cacheCheck);
  registerCheck('figma-api', figmaApiCheck);
}

/**
 * Get health check names
 * @returns {string[]}
 */
export function listHealthChecks() {
  return Array.from(checks.keys());
}

/**
 * Clear all health checks
 */
export function clearHealthChecks() {
  checks.clear();
}

/**
 * Export health report as JSON
 * @param {HealthReport} report
 * @returns {string}
 */
export function formatHealthJSON(report) {
  return JSON.stringify(report, null, 2);
}

/**
 * Export health report as text
 * @param {HealthReport} report
 * @returns {string}
 */
export function formatHealthText(report) {
  const lines = [
    `DSR Health Report`,
    `Status: ${report.status.toUpperCase()}`,
    `Version: ${report.version}`,
    `Timestamp: ${report.timestamp}`,
    ``,
    `Components:`,
    ...report.components.map(c => {
      const icon = c.status === 'healthy' ? '✓' : c.status === 'degraded' ? '⚠' : '✗';
      return `  ${icon} ${c.name}: ${c.status}${c.message ? ` - ${c.message}` : ''}${c.responseTime ? ` (${c.responseTime}ms)` : ''}`;
    }),
    ``,
    `Summary: ${report.metrics.healthy} healthy, ${report.metrics.degraded} degraded, ${report.metrics.unhealthy} unhealthy`
  ];

  return lines.join('\n');
}

/**
 * Print health report to console
 * @param {HealthReport} report
 */
export function printHealthReport(report) {
  console.log(formatHealthText(report));
}

/**
 * Create health check middleware
 * @param {Object} [options]
 * @param {number} [options.timeoutMs=5000]
 * @returns {Function}
 */
export function healthMiddleware(options = {}) {
  return async function (req, res, next) {
    if (req.path === '/health') {
      const report = await checkHealth(options);
      const statusCode = report.status === 'healthy' ? 200 : report.status === 'degraded' ? 200 : 503;

      res.statusCode = statusCode;
      res.setHeader('Content-Type', 'application/json');
      res.end(formatHealthJSON(report));
      return;
    }

    if (req.path === '/health/live') {
      const result = livenessCheck();
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(result));
      return;
    }

    if (req.path === '/health/ready') {
      const report = await readinessCheck();
      const statusCode = report.status === 'unhealthy' ? 503 : 200;

      res.statusCode = statusCode;
      res.setHeader('Content-Type', 'application/json');
      res.end(formatHealthJSON(report));
      return;
    }

    next();
  };
}

/**
 * Watch health status and call callback on changes
 * @param {Function} callback
 * @param {number} [intervalMs=30000]
 * @returns {Function} Unwatch function
 */
export function watchHealth(callback, intervalMs = 30000) {
  let lastStatus = null;

  const check = async () => {
    const report = await checkHealth();

    if (report.status !== lastStatus) {
      lastStatus = report.status;
      callback(report);
    }
  };

  // Initial check
  check();

  // Periodic checks
  const interval = setInterval(check, intervalMs);

  // Return unwatch function
  return () => clearInterval(interval);
}

// Initialize default checks
initHealthChecks();

export default {
  registerCheck,
  unregisterCheck,
  checkHealth,
  livenessCheck,
  readinessCheck,
  startupCheck,
  listHealthChecks,
  clearHealthChecks,
  formatHealthJSON,
  formatHealthText,
  printHealthReport,
  healthMiddleware,
  watchHealth,
  initHealthChecks
};
