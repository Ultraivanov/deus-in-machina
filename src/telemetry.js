/**
 * DSR Telemetry Module
 * Opt-in telemetry with privacy controls
 */

import { randomUUID } from 'node:crypto';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';
import { info, warn } from './logger.js';

/**
 * @typedef {Object} TelemetryConfig
 * @property {boolean} enabled - Whether telemetry is enabled
 * @property {string} [endpoint] - Telemetry endpoint URL
 * @property {string} [anonymousId] - Anonymous user identifier
 * @property {string[]} [excludedEvents] - Events to exclude
 * @property {boolean} [includeMetrics] - Whether to include metrics
 */

/**
 * @typedef {Object} TelemetryEvent
 * @property {string} event - Event name
 * @property {string} timestamp - ISO timestamp
 * @property {string} anonymousId - Anonymous user ID
 * @property {string} [sessionId] - Session identifier
 * @property {Object} [properties] - Event properties
 * @property {Object} [context] - System context
 */

// DSR config directory
const DSR_DIR = join(homedir(), '.dsr');
const TELEMETRY_CONFIG_FILE = join(DSR_DIR, 'telemetry.json');

// Default configuration
const DEFAULT_CONFIG = {
  enabled: false,  // Opt-in by default
  endpoint: 'https://telemetry.dsr.dev/v1/events',
  anonymousId: null,
  excludedEvents: [],
  includeMetrics: true
};

/** @type {TelemetryConfig} */
let config = { ...DEFAULT_CONFIG };

// Session tracking
let sessionId = null;
let eventQueue = [];
let flushInterval = null;
const QUEUE_SIZE_LIMIT = 100;
const FLUSH_INTERVAL_MS = 30000; // 30 seconds

/**
 * Ensure DSR directory exists
 */
function ensureDir() {
  if (!existsSync(DSR_DIR)) {
    mkdirSync(DSR_DIR, { recursive: true });
  }
}

/**
 * Load telemetry configuration
 */
export function loadTelemetryConfig() {
  try {
    ensureDir();
    if (existsSync(TELEMETRY_CONFIG_FILE)) {
      const content = readFileSync(TELEMETRY_CONFIG_FILE, 'utf-8');
      const saved = JSON.parse(content);
      config = { ...DEFAULT_CONFIG, ...saved };
    }
  } catch (err) {
    warn('Failed to load telemetry config', { error: err.message });
    config = { ...DEFAULT_CONFIG };
  }
  return config;
}

/**
 * Save telemetry configuration
 */
export function saveTelemetryConfig() {
  try {
    ensureDir();
    writeFileSync(TELEMETRY_CONFIG_FILE, JSON.stringify(config, null, 2));
  } catch (err) {
    warn('Failed to save telemetry config', { error: err.message });
  }
}

/**
 * Generate anonymous ID
 * @returns {string}
 */
export function generateAnonymousId() {
  return randomUUID();
}

/**
 * Initialize telemetry
 * Must be called before using telemetry
 */
export function initTelemetry() {
  loadTelemetryConfig();

  if (!config.anonymousId) {
    config.anonymousId = generateAnonymousId();
    saveTelemetryConfig();
  }

  sessionId = randomUUID();

  if (config.enabled) {
    startFlushInterval();
  }

  info('Telemetry initialized', {
    enabled: config.enabled,
    anonymousId: config.anonymousId,
    sessionId
  });

  return config;
}

/**
 * Check if telemetry is enabled
 * @returns {boolean}
 */
export function isTelemetryEnabled() {
  return config.enabled;
}

/**
 * Enable telemetry
 */
export function enableTelemetry() {
  config.enabled = true;
  saveTelemetryConfig();
  startFlushInterval();
  info('Telemetry enabled');
}

/**
 * Disable telemetry
 */
export function disableTelemetry() {
  config.enabled = false;
  saveTelemetryConfig();
  stopFlushInterval();
  // Flush remaining events
  flushEvents();
  info('Telemetry disabled');
}

/**
 * Get telemetry status
 * @returns {{enabled: boolean, anonymousId: string, eventsInQueue: number}}
 */
export function getTelemetryStatus() {
  return {
    enabled: config.enabled,
    anonymousId: config.anonymousId,
    sessionId,
    eventsInQueue: eventQueue.length,
    endpoint: config.endpoint,
    includeMetrics: config.includeMetrics
  };
}

/**
 * Record a telemetry event
 * @param {string} eventName
 * @param {Object} [properties]
 * @param {Object} [context]
 */
export function recordEvent(eventName, properties = {}, context = {}) {
  if (!config.enabled) {
    return;
  }

  if (config.excludedEvents.includes(eventName)) {
    return;
  }

  const event = {
    event: eventName,
    timestamp: new Date().toISOString(),
    anonymousId: config.anonymousId,
    sessionId,
    properties: sanitizeProperties(properties),
    context: {
      version: process.env.DSR_VERSION || 'unknown',
      nodeVersion: process.version,
      platform: process.platform,
      ...sanitizeProperties(context)
    }
  };

  eventQueue.push(event);

  // Flush if queue is full
  if (eventQueue.length >= QUEUE_SIZE_LIMIT) {
    flushEvents();
  }
}

/**
 * Sanitize properties to remove sensitive data
 * @param {Object} properties
 * @returns {Object}
 */
function sanitizeProperties(properties) {
  if (!properties || typeof properties !== 'object') {
    return {};
  }

  const sensitiveKeys = ['password', 'token', 'secret', 'key', 'apiKey', 'auth'];
  const sanitized = {};

  for (const [key, value] of Object.entries(properties)) {
    // Skip sensitive keys
    if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeProperties(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Start flush interval
 */
function startFlushInterval() {
  if (flushInterval) {
    return;
  }

  flushInterval = setInterval(() => {
    if (eventQueue.length > 0) {
      flushEvents();
    }
  }, FLUSH_INTERVAL_MS);
}

/**
 * Stop flush interval
 */
function stopFlushInterval() {
  if (flushInterval) {
    clearInterval(flushInterval);
    flushInterval = null;
  }
}

/**
 * Flush events to endpoint
 */
async function flushEvents() {
  if (eventQueue.length === 0) {
    return;
  }

  const eventsToSend = [...eventQueue];
  eventQueue = [];

  try {
    // In production, this would send to the telemetry endpoint
    // For now, we log to debug
    info('Telemetry batch', {
      eventCount: eventsToSend.length,
      endpoint: config.endpoint
    });

    // Simulate sending
    if (config.endpoint && config.endpoint !== 'console') {
      await sendToEndpoint(eventsToSend);
    }
  } catch (err) {
    // Put events back in queue
    eventQueue = [...eventsToSend, ...eventQueue].slice(0, QUEUE_SIZE_LIMIT);
    warn('Failed to flush telemetry events', { error: err.message });
  }
}

/**
 * Send events to endpoint
 * @param {TelemetryEvent[]} events
 */
async function sendToEndpoint(events) {
  try {
    const response = await fetch(config.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-DSR-Anonymous-ID': config.anonymousId
      },
      body: JSON.stringify({ events })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
  } catch (err) {
    // Don't throw - telemetry failures shouldn't break the app
    warn('Telemetry endpoint error', { error: err.message });
  }
}

/**
 * Record CLI command execution
 * @param {string} command
 * @param {Object} [flags]
 * @param {number} [durationMs]
 * @param {boolean} [success]
 */
export function recordCommand(command, flags = {}, durationMs, success = true) {
  recordEvent('cli.command', {
    command,
    flags: Object.keys(flags),
    durationMs,
    success
  });
}

/**
 * Record export operation
 * @param {Object} details
 */
export function recordExport(details) {
  recordEvent('dsr.export', {
    fileCount: details.fileCount,
    variableCount: details.variableCount,
    durationMs: details.durationMs,
    format: details.format,
    success: details.success
  });
}

/**
 * Record validation run
 * @param {Object} details
 */
export function recordValidation(details) {
  recordEvent('dsr.validation', {
    ruleset: details.ruleset,
    issuesFound: details.issuesFound,
    errors: details.errors,
    warnings: details.warnings,
    durationMs: details.durationMs
  });
}

/**
 * Record error
 * @param {string} errorCode
 * @param {string} [message]
 */
export function recordError(errorCode, message) {
  recordEvent('dsr.error', {
    errorCode,
    message: message?.slice(0, 100) // Truncate long messages
  });
}

/**
 * Shutdown telemetry
 * Flushes remaining events
 */
export async function shutdownTelemetry() {
  stopFlushInterval();
  await flushEvents();
  info('Telemetry shutdown complete');
}

/**
 * Exclude specific events from telemetry
 * @param {string[]} eventNames
 */
export function excludeEvents(eventNames) {
  config.excludedEvents = [...new Set([...config.excludedEvents, ...eventNames])];
  saveTelemetryConfig();
}

/**
 * Include previously excluded events
 * @param {string[]} eventNames
 */
export function includeEvents(eventNames) {
  config.excludedEvents = config.excludedEvents.filter(e => !eventNames.includes(e));
  saveTelemetryConfig();
}

export default {
  initTelemetry,
  isTelemetryEnabled,
  enableTelemetry,
  disableTelemetry,
  getTelemetryStatus,
  recordEvent,
  recordCommand,
  recordExport,
  recordValidation,
  recordError,
  shutdownTelemetry,
  excludeEvents,
  includeEvents,
  generateAnonymousId
};
