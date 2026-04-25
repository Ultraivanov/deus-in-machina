/**
 * Health Module Tests
 * Tests for health checks and status endpoints
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  registerCheck,
  unregisterCheck,
  checkHealth,
  livenessCheck,
  readinessCheck,
  startupCheck,
  memoryCheck,
  listHealthChecks,
  clearHealthChecks,
  formatHealthJSON,
  formatHealthText,
  initHealthChecks,
  watchHealth
} from '../src/health.js';

describe('Health', () => {
  beforeEach(() => {
    clearHealthChecks();
    initHealthChecks();
    vi.restoreAllMocks();
  });

  describe('Basic checks', () => {
    it('should return liveness status', () => {
      const result = livenessCheck();
      expect(result.status).toBe('healthy');
      expect(result.timestamp).toBeDefined();
    });

    it('should return startup status', () => {
      const result = startupCheck();
      expect(result.status).toBe('healthy');
      expect(result.initialized).toBe(true);
    });

    it('should run readiness check', async () => {
      const report = await readinessCheck();
      expect(report.status).toBeDefined();
      expect(report.components).toBeDefined();
      expect(report.timestamp).toBeDefined();
    });
  });

  describe('Health checks registry', () => {
    it('should register a health check', () => {
      const customCheck = vi.fn().mockResolvedValue({
        status: 'healthy',
        message: 'OK'
      });

      registerCheck('custom', customCheck);
      expect(listHealthChecks()).toContain('custom');
    });

    it('should unregister a health check', () => {
      registerCheck('temp', async () => ({ status: 'healthy' }));
      expect(listHealthChecks()).toContain('temp');

      unregisterCheck('temp');
      expect(listHealthChecks()).not.toContain('temp');
    });

    it('should list registered checks', () => {
      const checks = listHealthChecks();
      expect(checks.length).toBeGreaterThan(0);
      expect(checks).toContain('memory');
      expect(checks).toContain('rulesets');
    });
  });

  describe('Check health', () => {
    it('should run all health checks', async () => {
      const report = await checkHealth();

      expect(report.status).toBeDefined();
      expect(report.timestamp).toBeDefined();
      expect(report.version).toBeDefined();
      expect(Array.isArray(report.components)).toBe(true);
      expect(report.metrics).toBeDefined();
    });

    it('should include component results', async () => {
      const report = await checkHealth();

      expect(report.components.length).toBeGreaterThan(0);
      report.components.forEach(component => {
        expect(component.name).toBeDefined();
        expect(component.status).toBeDefined();
      });
    });

    it('should calculate overall status as healthy when all ok', async () => {
      // Clear and register only healthy checks
      clearHealthChecks();
      registerCheck('test1', async () => ({ status: 'healthy' }));
      registerCheck('test2', async () => ({ status: 'healthy' }));

      const report = await checkHealth();
      expect(report.status).toBe('healthy');
    });

    it('should report degraded if any component is degraded', async () => {
      clearHealthChecks();
      registerCheck('healthy', async () => ({ status: 'healthy' }));
      registerCheck('degraded', async () => ({ status: 'degraded' }));

      const report = await checkHealth();
      expect(report.status).toBe('degraded');
    });

    it('should report unhealthy if any component is unhealthy', async () => {
      clearHealthChecks();
      registerCheck('healthy', async () => ({ status: 'healthy' }));
      registerCheck('unhealthy', async () => ({ status: 'unhealthy' }));

      const report = await checkHealth();
      expect(report.status).toBe('unhealthy');
    });

    it('should calculate metrics', async () => {
      clearHealthChecks();
      registerCheck('h1', async () => ({ status: 'healthy' }));
      registerCheck('h2', async () => ({ status: 'healthy' }));
      registerCheck('d1', async () => ({ status: 'degraded' }));

      const report = await checkHealth();
      expect(report.metrics.total).toBe(3);
      expect(report.metrics.healthy).toBe(2);
      expect(report.metrics.degraded).toBe(1);
      expect(report.metrics.unhealthy).toBe(0);
    });

    it('should handle check timeouts', async () => {
      clearHealthChecks();
      registerCheck('slow', async () => {
        await new Promise(r => setTimeout(r, 10000));
        return { status: 'healthy' };
      });

      const report = await checkHealth({ timeoutMs: 100 });
      const slowComponent = report.components.find(c => c.name === 'slow');

      expect(slowComponent.status).toBe('unhealthy');
      expect(slowComponent.message).toContain('timeout');
    });

    it('should handle check errors', async () => {
      clearHealthChecks();
      registerCheck('failing', async () => {
        throw new Error('Check failed');
      });

      const report = await checkHealth();
      const failingComponent = report.components.find(c => c.name === 'failing');

      expect(failingComponent.status).toBe('unhealthy');
      expect(failingComponent.message).toBe('Check failed');
    });
  });

  describe('Memory check', () => {
    it('should return memory status', async () => {
      const result = await memoryCheck();

      expect(result.name).toBe('memory');
      expect(result.status).toBeDefined();
      expect(result.metadata).toBeDefined();
      expect(result.metadata.heapUsed).toBeDefined();
      expect(result.metadata.heapTotal).toBeDefined();
    });
  });

  describe('Formatters', () => {
    it('should format as JSON', async () => {
      const report = await checkHealth();
      const json = formatHealthJSON(report);

      expect(() => JSON.parse(json)).not.toThrow();
      const parsed = JSON.parse(json);
      expect(parsed.status).toBe(report.status);
    });

    it('should format as text', async () => {
      const report = await checkHealth();
      const text = formatHealthText(report);

      expect(text).toContain('DSR Health Report');
      expect(text).toContain(report.status);
      expect(text).toContain(report.version);
    });

    it('should show healthy icon in text format', async () => {
      clearHealthChecks();
      registerCheck('test', async () => ({ status: 'healthy' }));

      const report = await checkHealth();
      const text = formatHealthText(report);

      expect(text).toContain('✓');
    });

    it('should show unhealthy icon in text format', async () => {
      clearHealthChecks();
      registerCheck('test', async () => ({ status: 'unhealthy' }));

      const report = await checkHealth();
      const text = formatHealthText(report);

      expect(text).toContain('✗');
    });
  });

  describe('Watch health', () => {
    it('should call callback when status changes', async () => {
      const callback = vi.fn();
      clearHealthChecks();

      // First check: healthy
      registerCheck('test', async () => ({ status: 'healthy' }));

      const unwatch = watchHealth(callback, 100);

      // Wait for initial check
      await new Promise(r => setTimeout(r, 50));

      expect(callback).toHaveBeenCalled();

      unwatch();
    });

    it('should not call callback if status unchanged', async () => {
      const callback = vi.fn();
      clearHealthChecks();
      registerCheck('test', async () => ({ status: 'healthy' }));

      const unwatch = watchHealth(callback, 50);

      // Wait for initial check
      await new Promise(r => setTimeout(r, 60));

      // Should be called once for initial check
      const callCount = callback.mock.calls.length;

      // Wait another interval
      await new Promise(r => setTimeout(r, 60));

      // Should not be called again since status didn't change
      expect(callback.mock.calls.length).toBe(callCount);

      unwatch();
    });

    it('should return unwatch function', () => {
      const unwatch = watchHealth(() => {}, 1000);
      expect(typeof unwatch).toBe('function');
      unwatch(); // Should not throw
    });
  });

  describe('Response time tracking', () => {
    it('should include response time in component health', async () => {
      clearHealthChecks();
      registerCheck('timed', async () => {
        await new Promise(r => setTimeout(r, 50));
        return { status: 'healthy' };
      });

      const report = await checkHealth();
      const timed = report.components.find(c => c.name === 'timed');

      expect(timed.responseTime).toBeGreaterThanOrEqual(50);
    });
  });

  describe('Default checks', () => {
    it('should include memory check by default', () => {
      const checks = listHealthChecks();
      expect(checks).toContain('memory');
    });

    it('should include ruleset check by default', () => {
      const checks = listHealthChecks();
      expect(checks).toContain('rulesets');
    });

    it('should include cache check by default', () => {
      const checks = listHealthChecks();
      expect(checks).toContain('cache');
    });

    it('should include figma-api check by default', () => {
      const checks = listHealthChecks();
      expect(checks).toContain('figma-api');
    });
  });
});
