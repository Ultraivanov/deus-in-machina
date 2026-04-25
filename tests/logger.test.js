/**
 * Logger Module Tests
 * Tests for structured logging with levels, contexts, and correlation IDs
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
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
} from '../src/logger.js';

describe('Logger', () => {
  beforeEach(() => {
    resetLoggerConfig();
    clearCorrelationId();
    vi.restoreAllMocks();
  });

  describe('Constants', () => {
    it('should have correct log levels', () => {
      expect(LOG_LEVELS).toEqual(['trace', 'debug', 'info', 'warn', 'error', 'fatal']);
    });

    it('should have correct level values', () => {
      expect(LEVEL_VALUES.trace).toBe(0);
      expect(LEVEL_VALUES.debug).toBe(1);
      expect(LEVEL_VALUES.info).toBe(2);
      expect(LEVEL_VALUES.warn).toBe(3);
      expect(LEVEL_VALUES.error).toBe(4);
      expect(LEVEL_VALUES.fatal).toBe(5);
    });
  });

  describe('shouldLog', () => {
    it('should return true for equal levels', () => {
      expect(shouldLog('info', 'info')).toBe(true);
    });

    it('should return true for higher severity', () => {
      expect(shouldLog('error', 'info')).toBe(true);
      expect(shouldLog('warn', 'debug')).toBe(true);
    });

    it('should return false for lower severity', () => {
      expect(shouldLog('debug', 'info')).toBe(false);
      expect(shouldLog('info', 'error')).toBe(false);
    });
  });

  describe('Log levels', () => {
    it('should log at trace level when configured', () => {
      configureLogger({ level: 'trace', format: 'minimal' });
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      trace('test message');

      expect(consoleSpy).toHaveBeenCalledWith('[trace] test message');
    });

    it('should not log debug when level is info', () => {
      configureLogger({ level: 'info' });
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      debug('test message');

      expect(consoleSpy).not.toHaveBeenCalled();
    });

    it('should log error to stderr', () => {
      configureLogger({ level: 'info', format: 'minimal' });
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      error('error message');

      expect(errorSpy).toHaveBeenCalledWith('[error] error message');
    });

    it('should log warn to stderr', () => {
      configureLogger({ level: 'info', format: 'minimal' });
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      warn('warn message');

      expect(warnSpy).toHaveBeenCalledWith('[warn] warn message');
    });

    it('should log fatal to stderr', () => {
      configureLogger({ level: 'info', format: 'minimal' });
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      fatal('fatal message');

      expect(errorSpy).toHaveBeenCalledWith('[fatal] fatal message');
    });

    it('should log info to stdout', () => {
      configureLogger({ level: 'info', format: 'minimal' });
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      info('info message');

      expect(logSpy).toHaveBeenCalledWith('[info] info message');
    });
  });

  describe('Context', () => {
    it('should include context in log output', () => {
      configureLogger({ level: 'info', format: 'json' });
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      info('message', { userId: '123', action: 'login' });

      const output = JSON.parse(logSpy.mock.calls[0][0]);
      expect(output.message).toBe('message');
      expect(output.context).toEqual({ userId: '123', action: 'login' });
    });
  });

  describe('Correlation ID', () => {
    it('should generate correlation ID', () => {
      const id = startNewCorrelation();
      expect(id).toBeDefined();
      expect(typeof id).toBe('string');
      expect(id.length).toBeGreaterThan(10);
    });

    it('should set and get correlation ID', () => {
      setCorrelationId('test-id-123');
      expect(getCorrelationId()).toBe('test-id-123');
    });

    it('should clear correlation ID', () => {
      setCorrelationId('test-id');
      clearCorrelationId();
      expect(getCorrelationId()).toBeUndefined();
    });

    it('should include correlation ID in logs when enabled', () => {
      configureLogger({ level: 'info', format: 'json', includeCorrelationId: true });
      startNewCorrelation();
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      info('test');

      const output = JSON.parse(logSpy.mock.calls[0][0]);
      expect(output.correlationId).toBeDefined();
    });

    it('should not include correlation ID when disabled', () => {
      configureLogger({ level: 'info', format: 'json', includeCorrelationId: false });
      startNewCorrelation();
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      info('test');

      const output = JSON.parse(logSpy.mock.calls[0][0]);
      expect(output.correlationId).toBeUndefined();
    });
  });

  describe('withCorrelation', () => {
    it('should set correlation ID for function execution', async () => {
      const result = await withCorrelation(async () => {
        return getCorrelationId();
      });

      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    it('should restore previous correlation ID after execution', async () => {
      setCorrelationId('previous-id');

      await withCorrelation(async () => {
        // Inside function has new ID
        expect(getCorrelationId()).not.toBe('previous-id');
      });

      // After function, previous ID restored
      expect(getCorrelationId()).toBe('previous-id');
    });

    it('should use provided correlation ID', async () => {
      const result = await withCorrelation(async () => {
        return getCorrelationId();
      }, 'custom-id-123');

      expect(result).toBe('custom-id-123');
    });
  });

  describe('Child logger', () => {
    it('should create child logger with bound context', () => {
      configureLogger({ level: 'info', format: 'json' });
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const child = createChildLogger({ service: 'auth', version: '1.0' });
      child.info('message', { userId: '123' });

      const output = JSON.parse(logSpy.mock.calls[0][0]);
      expect(output.context).toEqual({
        service: 'auth',
        version: '1.0',
        userId: '123'
      });
    });
  });

  describe('Configuration', () => {
    it('should update configuration', () => {
      configureLogger({ level: 'debug', format: 'pretty' });
      const config = getLoggerConfig();

      expect(config.level).toBe('debug');
      expect(config.format).toBe('pretty');
    });

    it('should reset to defaults', () => {
      configureLogger({ level: 'debug', format: 'pretty' });
      resetLoggerConfig();
      const config = getLoggerConfig();

      expect(config.level).toBe('info');
      expect(config.format).toBe('json');
    });

    it('should preserve other config values when updating', () => {
      configureLogger({ level: 'debug' });
      const config = getLoggerConfig();

      expect(config.format).toBe('json'); // Default preserved
      expect(config.level).toBe('debug'); // Changed
    });
  });

  describe('Formats', () => {
    it('should output JSON format', () => {
      configureLogger({ level: 'info', format: 'json' });
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      info('test message', { key: 'value' });

      const output = logSpy.mock.calls[0][0];
      const parsed = JSON.parse(output);
      expect(parsed.message).toBe('test message');
      expect(parsed.context).toEqual({ key: 'value' });
      expect(parsed.timestamp).toBeDefined();
    });

    it('should output minimal format', () => {
      configureLogger({ level: 'info', format: 'minimal' });
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      info('test message');

      expect(logSpy).toHaveBeenCalledWith('[info] test message');
    });

    it('should include timestamp when enabled', () => {
      configureLogger({ level: 'info', format: 'json', includeTimestamp: true });
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      info('test');

      const output = JSON.parse(logSpy.mock.calls[0][0]);
      expect(output.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });

    it('should not include timestamp when disabled', () => {
      configureLogger({ level: 'info', format: 'json', includeTimestamp: false });
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      info('test');

      const output = JSON.parse(logSpy.mock.calls[0][0]);
      expect(output.timestamp).toBeUndefined();
    });
  });

  describe('Custom output', () => {
    it('should use custom output function', () => {
      const customOutput = vi.fn();
      configureLogger({ level: 'info', format: 'json', output: customOutput });

      info('custom test');

      expect(customOutput).toHaveBeenCalled();
      const output = JSON.parse(customOutput.mock.calls[0][0]);
      expect(output.message).toBe('custom test');
    });
  });
});
