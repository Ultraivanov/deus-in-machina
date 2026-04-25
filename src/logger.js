/**
 * DSR Logger Module
 * Structured logging with levels, contexts, and correlation IDs
 */

import { randomUUID } from 'node:crypto';

/**
 * Log levels in order of severity (lowest to highest)
 * @typedef {'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal'} LogLevel
 */
export const LOG_LEVELS = ['trace', 'debug', 'info', 'warn', 'error', 'fatal'];

/**
 * Numeric level values for comparison
 * @type {Record<LogLevel, number>}
 */
export const LEVEL_VALUES = {
  trace: 0,
  debug: 1,
  info: 2,
  warn: 3,
  error: 4,
  fatal: 5
};

/**
 * Default log format
 * @typedef {'json' | 'pretty' | 'minimal'} LogFormat
 */

/**
 * Logger configuration
 * @typedef {Object} LoggerConfig
 * @property {LogLevel} level - Minimum log level
 * @property {LogFormat} format - Output format
 * @property {boolean} includeTimestamp - Include timestamp
 * @property {boolean} includeCorrelationId - Include correlation ID
 * @property {Function} [output] - Custom output function (default: console)
 */

/** @type {LoggerConfig} */
const DEFAULT_CONFIG = {
  level: 'info',
  format: 'json',
  includeTimestamp: true,
  includeCorrelationId: true,
  output: null
};

/** @type {LoggerConfig} */
let globalConfig = { ...DEFAULT_CONFIG };

/**
 * Correlation ID management
 */
class CorrelationManager {
  constructor() {
    this.store = new Map();
  }

  /**
   * Generate new correlation ID
   * @returns {string}
   */
  generate() {
    return randomUUID();
  }

  /**
   * Set correlation ID for current context
   * @param {string} id
   */
  set(id) {
    this.store.set('current', id);
  }

  /**
   * Get current correlation ID
   * @returns {string | undefined}
   */
  get() {
    return this.store.get('current');
  }

  /**
   * Clear current correlation ID
   */
  clear() {
    this.store.delete('current');
  }
}

const correlationManager = new CorrelationManager();

/**
 * Check if level should be logged
 * @param {LogLevel} level
 * @param {LogLevel} minLevel
 * @returns {boolean}
 */
export function shouldLog(level, minLevel) {
  return LEVEL_VALUES[level] >= LEVEL_VALUES[minLevel];
}

/**
 * Format log entry
 * @param {LogEntry} entry
 * @param {LogFormat} format
 * @returns {string}
 */
function formatLogEntry(entry, format) {
  switch (format) {
    case 'json':
      return JSON.stringify(entry);
    case 'pretty':
      return formatPretty(entry);
    case 'minimal':
      return formatMinimal(entry);
    default:
      return JSON.stringify(entry);
  }
}

/**
 * Pretty format for human readability
 * @param {LogEntry} entry
 * @returns {string}
 */
function formatPretty(entry) {
  const parts = [];

  if (entry.timestamp) {
    const time = new Date(entry.timestamp).toISOString().split('T')[1].slice(0, -1);
    parts.push(`[${time}]`);
  }

  parts.push(entry.level.toUpperCase().padEnd(5));

  if (entry.correlationId) {
    parts.push(`[${entry.correlationId.slice(0, 8)}]`);
  }

  parts.push(entry.message);

  if (entry.context && Object.keys(entry.context).length > 0) {
    parts.push('\n  ' + JSON.stringify(entry.context));
  }

  return parts.join(' ');
}

/**
 * Minimal format
 * @param {LogEntry} entry
 * @returns {string}
 */
function formatMinimal(entry) {
  return `[${entry.level}] ${entry.message}`;
}

/**
 * Create a log entry
 * @param {LogLevel} level
 * @param {string} message
 * @param {Object} [context]
 * @param {string} [correlationId]
 * @returns {LogEntry}
 */
function createLogEntry(level, message, context = {}, correlationId) {
  const entry = {
    level,
    message,
    context
  };

  if (globalConfig.includeTimestamp) {
    entry.timestamp = new Date().toISOString();
  }

  if (globalConfig.includeCorrelationId) {
    entry.correlationId = correlationId || correlationManager.get();
  }

  return entry;
}

/**
 * Write log entry
 * @param {LogEntry} entry
 */
function writeLog(entry) {
  const formatted = formatLogEntry(entry, globalConfig.format);

  if (globalConfig.output) {
    globalConfig.output(formatted);
  } else if (entry.level === 'error' || entry.level === 'fatal') {
    console.error(formatted);
  } else if (entry.level === 'warn') {
    console.warn(formatted);
  } else {
    console.log(formatted);
  }
}

/**
 * Log a message
 * @param {LogLevel} level
 * @param {string} message
 * @param {Object} [context]
 */
export function log(level, message, context) {
  if (!shouldLog(level, globalConfig.level)) {
    return;
  }

  const entry = createLogEntry(level, message, context);
  writeLog(entry);
}

/**
 * Convenience methods for each level
 */
export const trace = (message, context) => log('trace', message, context);
export const debug = (message, context) => log('debug', message, context);
export const info = (message, context) => log('info', message, context);
export const warn = (message, context) => log('warn', message, context);
export const error = (message, context) => log('error', message, context);
export const fatal = (message, context) => log('fatal', message, context);

/**
 * Configure global logger
 * @param {Partial<LoggerConfig>} config
 */
export function configureLogger(config) {
  globalConfig = { ...globalConfig, ...config };
}

/**
 * Get current logger configuration
 * @returns {LoggerConfig}
 */
export function getLoggerConfig() {
  return { ...globalConfig };
}

/**
 * Reset to default configuration
 */
export function resetLoggerConfig() {
  globalConfig = { ...DEFAULT_CONFIG };
  correlationManager.clear();
}

/**
 * Create child logger with bound context
 * @param {Object} boundContext
 * @returns {Logger}
 */
export function createChildLogger(boundContext = {}) {
  return {
    trace: (message, context) => log('trace', message, { ...boundContext, ...context }),
    debug: (message, context) => log('debug', message, { ...boundContext, ...context }),
    info: (message, context) => log('info', message, { ...boundContext, ...context }),
    warn: (message, context) => log('warn', message, { ...boundContext, ...context }),
    error: (message, context) => log('error', message, { ...boundContext, ...context }),
    fatal: (message, context) => log('fatal', message, { ...boundContext, ...context }),
  };
}

/**
 * Set correlation ID for current operation
 * @param {string} id
 */
export function setCorrelationId(id) {
  correlationManager.set(id);
}

/**
 * Get current correlation ID
 * @returns {string | undefined}
 */
export function getCorrelationId() {
  return correlationManager.get();
}

/**
 * Clear correlation ID
 */
export function clearCorrelationId() {
  correlationManager.clear();
}

/**
 * Generate and set new correlation ID
 * @returns {string}
 */
export function startNewCorrelation() {
  const id = correlationManager.generate();
  correlationManager.set(id);
  return id;
}

/**
 * Execute function with correlation ID
 * @param {Function} fn
 * @param {string} [correlationId]
 * @returns {Promise<any>}
 */
export async function withCorrelation(fn, correlationId) {
  const id = correlationId || correlationManager.generate();
  const previousId = correlationManager.get();

  correlationManager.set(id);

  try {
    return await fn();
  } finally {
    if (previousId) {
      correlationManager.set(previousId);
    } else {
      correlationManager.clear();
    }
  }
}

/**
 * @typedef {Object} LogEntry
 * @property {LogLevel} level
 * @property {string} message
 * @property {string} [timestamp]
 * @property {string} [correlationId]
 * @property {Object} [context]
 */

/**
 * @typedef {Object} Logger
 * @property {Function} trace
 * @property {Function} debug
 * @property {Function} info
 * @property {Function} warn
 * @property {Function} error
 * @property {Function} fatal
 */

export default {
  LOG_LEVELS,
  LEVEL_VALUES,
  log,
  trace,
  debug,
  info,
  warn,
  error,
  fatal,
  configureLogger,
  getLoggerConfig,
  resetLoggerConfig,
  createChildLogger,
  shouldLog,
  setCorrelationId,
  getCorrelationId,
  clearCorrelationId,
  startNewCorrelation,
  withCorrelation
};
