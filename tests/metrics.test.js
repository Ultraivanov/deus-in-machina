/**
 * Metrics Module Tests
 * Tests for counters, histograms, gauges, and core metrics
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  MetricsRegistry,
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
} from '../src/metrics.js';

describe('Metrics', () => {
  beforeEach(() => {
    clearMetrics();
  });

  describe('MetricsRegistry', () => {
    it('should create a new registry', () => {
      const registry = new MetricsRegistry();
      expect(registry).toBeDefined();
    });

    it('should return existing counter on duplicate creation', () => {
      const registry = new MetricsRegistry();
      const c1 = registry.counter('test', 'test counter');
      const c2 = registry.counter('test', 'test counter');
      expect(c1).toBe(c2);
    });
  });

  describe('Counter', () => {
    it('should create a counter', () => {
      const counter = createCounter('test', 'test counter');
      expect(counter.name).toBe('test');
      expect(counter.description).toBe('test counter');
    });

    it('should increment by 1', () => {
      const counter = createCounter('test', 'test');
      counter.inc();
      expect(counter.get()).toBe(1);
    });

    it('should increment multiple times', () => {
      const counter = createCounter('test', 'test');
      counter.inc();
      counter.inc();
      counter.inc();
      expect(counter.get()).toBe(3);
    });

    it('should add specific value', () => {
      const counter = createCounter('test', 'test');
      counter.add(5);
      expect(counter.get()).toBe(5);
    });

    it('should add multiple values', () => {
      const counter = createCounter('test', 'test');
      counter.add(3);
      counter.add(7);
      expect(counter.get()).toBe(10);
    });

    it('should reset to 0', () => {
      const counter = createCounter('test', 'test');
      counter.inc();
      counter.inc();
      counter.reset();
      expect(counter.get()).toBe(0);
    });

    it('should support labeled counters', () => {
      const counter = createCounter('test', 'test', ['method']);
      counter.inc({ method: 'GET' });
      counter.inc({ method: 'GET' });
      counter.inc({ method: 'POST' });

      expect(counter.get({ method: 'GET' })).toBe(2);
      expect(counter.get({ method: 'POST' })).toBe(1);
      expect(counter.get()).toBe(3);
    });
  });

  describe('Histogram', () => {
    it('should create a histogram', () => {
      const histogram = createHistogram('test', 'test histogram');
      expect(histogram.name).toBe('test');
      expect(histogram.description).toBe('test histogram');
      expect(histogram.buckets).toBeDefined();
    });

    it('should observe values', () => {
      const histogram = createHistogram('test', 'test', [1, 10, 100]);
      histogram.observe(5);
      histogram.observe(15);
      histogram.observe(50);

      const data = histogram.get();
      expect(data.count).toBe(3);
      expect(data.sum).toBe(70);
    });

    it('should bucket values correctly', () => {
      const histogram = createHistogram('test', 'test', [1, 10, 100]);
      histogram.observe(0.5); // bucket 0
      histogram.observe(5);   // bucket 1
      histogram.observe(50);  // bucket 2
      histogram.observe(200); // overflow

      const data = histogram.get();
      expect(data.buckets[0].count).toBe(1); // le=1
      expect(data.buckets[1].count).toBe(2); // le=10
      expect(data.buckets[2].count).toBe(3); // le=100
    });

    it('should reset all buckets', () => {
      const histogram = createHistogram('test', 'test', [1, 10, 100]);
      histogram.observe(5);
      histogram.reset();

      const data = histogram.get();
      expect(data.count).toBe(0);
      expect(data.sum).toBe(0);
      expect(data.buckets.every(b => b.count === 0)).toBe(true);
    });
  });

  describe('Gauge', () => {
    it('should create a gauge', () => {
      const gauge = createGauge('test', 'test gauge');
      expect(gauge.name).toBe('test');
      expect(gauge.description).toBe('test gauge');
    });

    it('should set value', () => {
      const gauge = createGauge('test', 'test');
      gauge.set(42);
      expect(gauge.get()).toBe(42);
    });

    it('should increment', () => {
      const gauge = createGauge('test', 'test');
      gauge.set(10);
      gauge.inc();
      expect(gauge.get()).toBe(11);
    });

    it('should decrement', () => {
      const gauge = createGauge('test', 'test');
      gauge.set(10);
      gauge.dec();
      expect(gauge.get()).toBe(9);
    });

    it('should reset to 0', () => {
      const gauge = createGauge('test', 'test');
      gauge.set(100);
      gauge.reset();
      expect(gauge.get()).toBe(0);
    });
  });

  describe('Timer', () => {
    it('should create a timer with ms buckets', () => {
      const timer = createTimer('test', 'test timer');
      expect(timer.name).toBe('test');
      expect(timer.buckets).toContain(1000); // 1 second
    });

    it('should observe durations', () => {
      const timer = createTimer('test', 'test');
      timer.observe(50);
      timer.observe(150);

      const data = timer.get();
      expect(data.count).toBe(2);
      expect(data.sum).toBe(200);
    });
  });

  describe('timeIt', () => {
    it('should time sync function', () => {
      const timer = createTimer('test', 'test');

      const result = timeIt(timer, () => {
        // Simulate work
        for (let i = 0; i < 1000000; i++) {} // eslint-disable-line
        return 'done';
      });

      expect(result).toBe('done');
      const data = timer.get();
      expect(data.count).toBe(1);
      expect(data.sum).toBeGreaterThan(0);
    });

    it('should time async function', async () => {
      const timer = createTimer('test', 'test');

      const result = await timeItAsync(timer, async () => {
        await new Promise(r => setTimeout(r, 10));
        return 'async done';
      });

      expect(result).toBe('async done');
      const data = timer.get();
      expect(data.count).toBe(1);
      expect(data.sum).toBeGreaterThanOrEqual(10);
    });
  });

  describe('Snapshot', () => {
    it('should return snapshot of all metrics', () => {
      const counter = createCounter('counter1', 'test');
      const gauge = createGauge('gauge1', 'test');
      const histogram = createHistogram('hist1', 'test');

      counter.inc();
      gauge.set(42);
      histogram.observe(5);

      const snapshot = getMetricsSnapshot();

      expect(snapshot.counters.counter1).toBe(1);
      expect(snapshot.gauges.gauge1).toBe(42);
      expect(snapshot.histograms.hist1.count).toBe(1);
      expect(snapshot.timestamp).toBeDefined();
    });
  });

  describe('Reset and Clear', () => {
    it('should reset all metrics', () => {
      const counter = createCounter('c', 'test');
      const gauge = createGauge('g', 'test');
      const histogram = createHistogram('h', 'test');

      counter.inc();
      gauge.set(100);
      histogram.observe(50);

      resetAllMetrics();

      expect(counter.get()).toBe(0);
      expect(gauge.get()).toBe(0);
      expect(histogram.get().count).toBe(0);
    });

    it('should clear all metrics', () => {
      createCounter('c', 'test');
      createGauge('g', 'test');
      createHistogram('h', 'test');

      clearMetrics();

      const snapshot = getMetricsSnapshot();
      expect(Object.keys(snapshot.counters)).toHaveLength(0);
      expect(Object.keys(snapshot.gauges)).toHaveLength(0);
      expect(Object.keys(snapshot.histograms)).toHaveLength(0);
    });
  });

  describe('CoreMetrics', () => {
    it('should have export metrics', () => {
      expect(CoreMetrics.exportsTotal).toBeDefined();
      expect(CoreMetrics.exportDuration).toBeDefined();
      expect(CoreMetrics.exportErrors).toBeDefined();
    });

    it('should have import metrics', () => {
      expect(CoreMetrics.importsTotal).toBeDefined();
      expect(CoreMetrics.importDuration).toBeDefined();
      expect(CoreMetrics.importErrors).toBeDefined();
    });

    it('should have validation metrics', () => {
      expect(CoreMetrics.validationsTotal).toBeDefined();
      expect(CoreMetrics.validationDuration).toBeDefined();
      expect(CoreMetrics.validationIssues).toBeDefined();
    });

    it('should have fix loop metrics', () => {
      expect(CoreMetrics.fixLoopsTotal).toBeDefined();
      expect(CoreMetrics.fixLoopIterations).toBeDefined();
      expect(CoreMetrics.fixesApplied).toBeDefined();
    });

    it('should have API metrics', () => {
      expect(CoreMetrics.apiCallsTotal).toBeDefined();
      expect(CoreMetrics.apiCallDuration).toBeDefined();
      expect(CoreMetrics.apiErrors).toBeDefined();
    });

    it('should have cache metrics', () => {
      expect(CoreMetrics.cacheHits).toBeDefined();
      expect(CoreMetrics.cacheMisses).toBeDefined();
    });

    it('should have memory metrics', () => {
      expect(CoreMetrics.memoryUsage).toBeDefined();
      expect(CoreMetrics.memoryLimit).toBeDefined();
    });

    it('should track export operations', () => {
      clearMetrics(); // Clear before using CoreMetrics

      // Recreate CoreMetrics after clear
      const exportsTotal = createCounter('dsr_exports_total', 'Total number of export operations');
      const exportDuration = createTimer('dsr_export_duration_ms', 'Export operation duration in milliseconds');

      exportsTotal.inc();
      exportDuration.observe(150);

      const snapshot = getMetricsSnapshot();
      expect(snapshot.counters.dsr_exports_total).toBe(1);
      expect(snapshot.histograms['dsr_export_duration_ms'].count).toBe(1);
    });

    it('should track validation issues with labels', () => {
      CoreMetrics.validationIssues.inc({ severity: 'error', type: 'token' });
      CoreMetrics.validationIssues.inc({ severity: 'error', type: 'token' });
      CoreMetrics.validationIssues.inc({ severity: 'warn', type: 'spacing' });

      expect(CoreMetrics.validationIssues.get({ severity: 'error', type: 'token' })).toBe(2);
      expect(CoreMetrics.validationIssues.get({ severity: 'warn', type: 'spacing' })).toBe(1);
    });
  });

  describe('Prometheus Export', () => {
    it('should export counters in Prometheus format', () => {
      const counter = createCounter('test_counter', 'Test counter');
      counter.inc();

      const output = exportPrometheusMetrics();
      expect(output).toContain('# HELP test_counter Test counter');
      expect(output).toContain('# TYPE test_counter counter');
      expect(output).toContain('test_counter 1');
    });

    it('should export gauges in Prometheus format', () => {
      const gauge = createGauge('test_gauge', 'Test gauge');
      gauge.set(42);

      const output = exportPrometheusMetrics();
      expect(output).toContain('# HELP test_gauge Test gauge');
      expect(output).toContain('# TYPE test_gauge gauge');
      expect(output).toContain('test_gauge 42');
    });

    it('should export histograms in Prometheus format', () => {
      const histogram = createHistogram('test_hist', 'Test histogram', [1, 10, 100]);
      histogram.observe(5);

      const output = exportPrometheusMetrics();
      expect(output).toContain('# HELP test_hist Test histogram');
      expect(output).toContain('# TYPE test_hist histogram');
      expect(output).toContain('test_hist_bucket{le="1"} 0');
      expect(output).toContain('test_hist_bucket{le="10"} 1');
      expect(output).toContain('test_hist_sum 5');
      expect(output).toContain('test_hist_count 1');
    });
  });
});
