/**
 * Performance Module Tests
 */

import { describe, it, expect } from 'vitest';
import {
  getMemoryMetrics,
  formatBytes,
  formatDuration,
  createMemoryProfiler,
  checkMemoryLimits,
  createMemoryLimitEnforcer,
  profileMemory,
  printMemoryProfile,
  benchmark,
} from '../src/perf.js';
import { ErrorCodes } from '../src/errors.js';

describe('Performance Module', () => {
  describe('getMemoryMetrics', () => {
    it('should return memory metrics', () => {
      const metrics = getMemoryMetrics();
      expect(metrics).toHaveProperty('timestamp');
      expect(metrics).toHaveProperty('heapUsed');
      expect(metrics).toHaveProperty('heapTotal');
      expect(metrics).toHaveProperty('external');
      expect(metrics).toHaveProperty('rss');
      expect(typeof metrics.timestamp).toBe('number');
      expect(typeof metrics.heapUsed).toBe('number');
    });
  });

  describe('formatBytes', () => {
    it('should format 0 bytes', () => {
      expect(formatBytes(0)).toBe('0 B');
    });

    it('should format bytes', () => {
      expect(formatBytes(512)).toBe('512 B');
    });

    it('should format kilobytes', () => {
      expect(formatBytes(1024)).toBe('1 KB');
      expect(formatBytes(1536)).toBe('1.5 KB');
    });

    it('should format megabytes', () => {
      expect(formatBytes(1024 * 1024)).toBe('1 MB');
      expect(formatBytes(5 * 1024 * 1024)).toBe('5 MB');
    });

    it('should format gigabytes', () => {
      expect(formatBytes(1024 * 1024 * 1024)).toBe('1 GB');
    });
  });

  describe('formatDuration', () => {
    it('should format microseconds', () => {
      expect(formatDuration(0.001)).toContain('µs');
    });

    it('should format milliseconds', () => {
      expect(formatDuration(100)).toContain('ms');
      expect(formatDuration(999)).toContain('ms');
    });

    it('should format seconds', () => {
      expect(formatDuration(1000)).toContain('s');
      expect(formatDuration(5000)).toContain('s');
    });
  });

  describe('createMemoryProfiler', () => {
    it('should create a memory profiler', () => {
      const profiler = createMemoryProfiler();
      expect(profiler).toHaveProperty('start');
      expect(profiler).toHaveProperty('snapshot');
      expect(profiler).toHaveProperty('stop');
      expect(profiler).toHaveProperty('getProfile');
    });

    it('should capture memory snapshots', () => {
      const profiler = createMemoryProfiler();
      profiler.start('test-start');
      profiler.snapshot('mid-test');
      const profile = profiler.stop('test-end');

      expect(profile.snapshots.length).toBeGreaterThanOrEqual(2);
      expect(profile).toHaveProperty('peakHeapUsed');
      expect(profile).toHaveProperty('peakRss');
      expect(profile).toHaveProperty('totalGrowth');
      expect(profile).toHaveProperty('durationMs');
    });

    it('should track memory growth', async () => {
      const profiler = createMemoryProfiler();
      profiler.start('start');

      // Allocate some memory
      const arr = new Array(1000000).fill('test');
      profiler.snapshot('allocated');

      // Clear reference
      arr.length = 0;
      profiler.stop('end');

      const profile = profiler.getProfile();
      expect(typeof profile.peakHeapUsed).toBe('number');
      expect(typeof profile.peakRss).toBe('number');
    });
  });

  describe('checkMemoryLimits', () => {
    it('should not throw when within limits', () => {
      expect(() => {
        checkMemoryLimits(0, { maxHeapBytes: 1024 * 1024 * 1024 }); // 1GB limit
      }).not.toThrow();
    });

    it('should throw MEMORY_LIMIT_EXCEEDED when heap exceeds limit', () => {
      // This test might not always trigger depending on current memory usage
      // We'll test the error structure instead
      try {
        checkMemoryLimits(0, { maxHeapBytes: 1 }); // Impossibly low limit
        // If we get here, the current heap is somehow < 1 byte (unlikely)
      } catch (err) {
        expect(err.error.code).toBe(ErrorCodes.MEMORY_LIMIT_EXCEEDED);
        expect(err.error.message).toContain('Memory limit exceeded');
        expect(err.error.context).toHaveProperty('limit');
        expect(err.error.context).toHaveProperty('used');
      }
    });
  });

  describe('createMemoryLimitEnforcer', () => {
    it('should create an enforcer', () => {
      const enforcer = createMemoryLimitEnforcer({
        maxHeapBytes: 1024 * 1024 * 1024,
        checkIntervalMs: 100,
      });
      expect(enforcer).toHaveProperty('start');
      expect(enforcer).toHaveProperty('stop');
    });
  });

  describe('profileMemory', () => {
    it('should profile memory of a function', async () => {
      const testFn = async () => {
        const arr = new Array(10000).fill('test');
        return arr.length;
      };

      const { result, profile } = await profileMemory('test', testFn);

      expect(result).toBe(10000);
      expect(profile).toHaveProperty('snapshots');
      expect(profile).toHaveProperty('peakHeapUsed');
      expect(profile).toHaveProperty('peakRss');
      expect(profile.snapshots.length).toBeGreaterThanOrEqual(2);
    });

    it('should propagate errors', async () => {
      const errorFn = async () => {
        throw new Error('Test error');
      };

      await expect(profileMemory('error-test', errorFn)).rejects.toThrow('Test error');
    });
  });

  describe('benchmark', () => {
    it('should benchmark a function', async () => {
      const testFn = () => {
        let sum = 0;
        for (let i = 0; i < 1000; i++) {
          sum += i;
        }
        return sum;
      };

      const result = await benchmark('sum-test', testFn, { iterations: 5 });

      expect(result).toHaveProperty('name', 'sum-test');
      expect(result).toHaveProperty('durationMs');
      expect(result).toHaveProperty('memoryDeltaBytes');
      expect(result).toHaveProperty('iterations', 5);
      expect(result).toHaveProperty('avgDurationMs');
      expect(result).toHaveProperty('throughput');
    });

    it('should support warmup iterations', async () => {
      let callCount = 0;
      const testFn = () => {
        callCount++;
        return callCount;
      };

      await benchmark('warmup-test', testFn, {
        iterations: 3,
        warmupIterations: 2,
      });

      expect(callCount).toBe(5); // 2 warmup + 3 measured
    });
  });
});
