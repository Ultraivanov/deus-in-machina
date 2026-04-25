/**
 * Debug Module Tests
 * Tests for debug/trace modes with verbose logging and performance markers
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
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
  profileFunction,
  traceFn
} from '../src/debug.js';

describe('Debug', () => {
  beforeEach(() => {
    disableDebug();
    clearSpanHistory();
    vi.restoreAllMocks();
  });

  describe('Configuration', () => {
    it('should be disabled by default', () => {
      expect(isDebugEnabled()).toBe(false);
    });

    it('should enable debug mode', () => {
      enableDebug();
      expect(isDebugEnabled()).toBe(true);
    });

    it('should disable debug mode', () => {
      enableDebug();
      disableDebug();
      expect(isDebugEnabled()).toBe(false);
    });

    it('should enable with verbose by default', () => {
      enableDebug();
      expect(isVerbose()).toBe(true);
    });

    it('should enable with custom options', () => {
      enableDebug({
        verbose: false,
        trace: true,
        perf: true
      });

      expect(isVerbose()).toBe(false);
      expect(isTracing()).toBe(true);
      expect(isPerfEnabled()).toBe(true);
    });
  });

  describe('Verbose logging', () => {
    it('should not log when verbose disabled', () => {
      enableDebug({ verbose: false });
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      verbose('test message');

      expect(logSpy).not.toHaveBeenCalled();
    });

    it('should not log when debug disabled', () => {
      disableDebug();
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      verbose('test message');

      expect(logSpy).not.toHaveBeenCalled();
    });
  });

  describe('Span tracing', () => {
    it('should not create span when tracing disabled', () => {
      enableDebug({ trace: false });
      const id = startSpan('test');
      expect(id).toBeNull();
    });

    it('should create span when tracing enabled', () => {
      enableDebug({ trace: true });
      const id = startSpan('test');
      expect(id).toBeDefined();
      expect(typeof id).toBe('string');
    });

    it('should end span', () => {
      enableDebug({ trace: true });
      const id = startSpan('test');

      expect(() => endSpan(id)).not.toThrow();
    });

    it('should not end span with invalid id', () => {
      enableDebug({ trace: true });

      expect(() => endSpan('invalid-id')).not.toThrow();
    });

    it('should handle nested spans', () => {
      enableDebug({ trace: true });

      const parentId = startSpan('parent');
      const childId = startSpan('child');
      const grandchildId = startSpan('grandchild');

      expect(parentId).toBeDefined();
      expect(childId).toBeDefined();
      expect(grandchildId).toBeDefined();

      endSpan(grandchildId);
      endSpan(childId);
      endSpan(parentId);

      const history = getSpanHistory();
      expect(history.length).toBe(3);
    });
  });

  describe('Span filters', () => {
    it('should filter spans by name', () => {
      enableDebug({ trace: true, filters: ['api'] });

      const apiSpan = startSpan('api.call');
      const otherSpan = startSpan('other.call');

      expect(apiSpan).toBeDefined();
      expect(otherSpan).toBeNull();
    });
  });

  describe('withSpan', () => {
    it('should execute function when tracing disabled', () => {
      disableDebug();

      const result = withSpan('test', () => 'success');

      expect(result).toBe('success');
    });

    it('should trace sync function', () => {
      enableDebug({ trace: true });

      const result = withSpan('test', () => 'success');

      expect(result).toBe('success');
    });

    it('should trace async function', async () => {
      enableDebug({ trace: true });

      const result = await withSpanAsync('test', async () => {
        await new Promise(r => setTimeout(r, 10));
        return 'async-success';
      });

      expect(result).toBe('async-success');
    });

    it('should handle errors in traced function', () => {
      enableDebug({ trace: true });

      expect(() => {
        withSpan('test', () => {
          throw new Error('test error');
        });
      }).toThrow('test error');
    });

    it('should handle async errors', async () => {
      enableDebug({ trace: true });

      await expect(withSpanAsync('test', async () => {
        throw new Error('async error');
      })).rejects.toThrow('async error');
    });
  });

  describe('Span history', () => {
    it('should track span history', () => {
      enableDebug({ trace: true });

      const id = startSpan('test');
      endSpan(id);

      const history = getSpanHistory();
      expect(history.length).toBe(1);
      expect(history[0].name).toBe('test');
    });

    it('should limit history size', () => {
      enableDebug({ trace: true });

      for (let i = 0; i < 10; i++) {
        const id = startSpan(`test-${i}`);
        endSpan(id);
      }

      const history = getSpanHistory({ limit: 5 });
      expect(history.length).toBe(5);
    });

    it('should filter history by name', () => {
      enableDebug({ trace: true });

      const id1 = startSpan('api.call');
      endSpan(id1);

      const id2 = startSpan('db.query');
      endSpan(id2);

      const apiHistory = getSpanHistory({ name: 'api' });
      expect(apiHistory.length).toBe(1);
      expect(apiHistory[0].name).toBe('api.call');
    });

    it('should clear history', () => {
      enableDebug({ trace: true });

      const id = startSpan('test');
      endSpan(id);

      clearSpanHistory();

      const history = getSpanHistory();
      expect(history.length).toBe(0);
    });
  });

  describe('Performance markers', () => {
    it('should not mark when perf disabled', () => {
      enableDebug({ perf: false });
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      perfMark('test');

      expect(logSpy).not.toHaveBeenCalled();
    });

    it('should mark when perf enabled', () => {
      enableDebug({ perf: true, verbose: true });

      // perfMark should not throw when enabled
      expect(() => perfMark('test')).not.toThrow();
    });

    it('should mark when debug disabled', () => {
      disableDebug();
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      perfMark('test');

      expect(logSpy).not.toHaveBeenCalled();
    });
  });

  describe('Debug state', () => {
    it('should return current state', () => {
      enableDebug({ trace: true, verbose: false, perf: true });

      const state = getDebugState();

      expect(state.config.enabled).toBe(true);
      expect(state.config.trace).toBe(true);
      expect(state.config.verbose).toBe(false);
      expect(state.config.perf).toBe(true);
    });

    it('should track active spans', () => {
      enableDebug({ trace: true });

      const id = startSpan('active');

      const state = getDebugState();
      expect(state.activeSpans).toBe(1);

      endSpan(id);
    });

    it('should track history size', () => {
      enableDebug({ trace: true });

      const id = startSpan('test');
      endSpan(id);

      const state = getDebugState();
      expect(state.spanHistory).toBe(1);
    });
  });

  describe('Profile function', () => {
    it('should profile sync function', () => {
      enableDebug({ verbose: true });

      const { result, stats } = profileFunction('test', () => 'done', 5);

      expect(result).toBe('done');
      expect(stats.iterations).toBe(5);
      expect(stats.total).toBeGreaterThan(0);
      expect(stats.min).toBeGreaterThanOrEqual(0);
      expect(stats.max).toBeGreaterThanOrEqual(stats.min);
      expect(stats.avg).toBeGreaterThanOrEqual(stats.min);
      expect(stats.avg).toBeLessThanOrEqual(stats.max);
    });
  });

  describe('traceFn wrapper', () => {
    it('should wrap sync function', () => {
      enableDebug({ trace: true });

      const wrapped = traceFn(function testFn() {
        return 'wrapped-result';
      });

      const result = wrapped();
      expect(result).toBe('wrapped-result');
    });

    it('should wrap async function', async () => {
      enableDebug({ trace: true });

      const wrapped = traceFn(async function asyncTest() {
        await new Promise(r => setTimeout(r, 10));
        return 'async-result';
      });

      const result = await wrapped();
      expect(result).toBe('async-result');
    });

    it('should handle errors in wrapped function', () => {
      enableDebug({ trace: true });

      const wrapped = traceFn(function errorFn() {
        throw new Error('wrapped error');
      });

      expect(() => wrapped()).toThrow('wrapped error');
    });

    it('should use custom name', () => {
      enableDebug({ trace: true });

      const wrapped = traceFn(function original() {
        return 'result';
      }, 'custom-name');

      wrapped();

      const history = getSpanHistory();
      expect(history[0].name).toBe('custom-name');
    });

    it('should use anonymous name for unnamed functions', () => {
      enableDebug({ trace: true });

      const wrapped = traceFn(() => 'result');
      wrapped();

      const history = getSpanHistory();
      expect(history[0].name).toBe('anonymous');
    });
  });
});
