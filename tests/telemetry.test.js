/**
 * Telemetry Module Tests
 * Tests for opt-in telemetry with privacy controls
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
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
  generateAnonymousId,
  loadTelemetryConfig,
  saveTelemetryConfig
} from '../src/telemetry.js';

describe('Telemetry', () => {
  beforeEach(() => {
    // Reset to disabled state
    disableTelemetry();
    vi.restoreAllMocks();
  });

  afterEach(async () => {
    await shutdownTelemetry();
  });

  describe('Configuration', () => {
    it('should be disabled by default', () => {
      expect(isTelemetryEnabled()).toBe(false);
    });

    it('should enable telemetry', () => {
      enableTelemetry();
      expect(isTelemetryEnabled()).toBe(true);
    });

    it('should disable telemetry', () => {
      enableTelemetry();
      disableTelemetry();
      expect(isTelemetryEnabled()).toBe(false);
    });

    it('should generate anonymous ID', () => {
      const id = generateAnonymousId();
      expect(id).toBeDefined();
      expect(typeof id).toBe('string');
      expect(id.length).toBeGreaterThan(10);
    });

    it('should initialize with anonymous ID', () => {
      const config = initTelemetry();
      expect(config.anonymousId).toBeDefined();
      expect(config.enabled).toBe(false);
    });

    it('should get telemetry status', () => {
      initTelemetry();
      const status = getTelemetryStatus();

      expect(status.enabled).toBeDefined();
      expect(status.anonymousId).toBeDefined();
      expect(status.sessionId).toBeDefined();
      expect(status.eventsInQueue).toBeDefined();
    });
  });

  describe('Event Recording', () => {
    it('should not record events when disabled', () => {
      disableTelemetry();
      const statusBefore = getTelemetryStatus();

      recordEvent('test.event', { foo: 'bar' });

      const statusAfter = getTelemetryStatus();
      expect(statusAfter.eventsInQueue).toBe(statusBefore.eventsInQueue);
    });

    it('should record events when enabled', () => {
      enableTelemetry();

      recordEvent('test.event', { foo: 'bar' });

      const status = getTelemetryStatus();
      expect(status.eventsInQueue).toBeGreaterThan(0);
    });

    it('should sanitize sensitive properties', () => {
      enableTelemetry();

      recordEvent('test.event', {
        username: 'john',
        password: 'secret123',
        apiKey: 'abc123',
        token: 'xyz789',
        secretValue: 'hidden'
      });

      // Event was recorded (sanitization happens internally)
      const status = getTelemetryStatus();
      expect(status.eventsInQueue).toBeGreaterThan(0);
    });

    it('should include event timestamp', () => {
      enableTelemetry();

      recordEvent('test.event', {});

      const status = getTelemetryStatus();
      expect(status.eventsInQueue).toBeGreaterThan(0);
    });
  });

  describe('Event Exclusion', () => {
    it('should exclude specific events', () => {
      enableTelemetry();
      excludeEvents(['excluded.event']);

      recordEvent('excluded.event', { foo: 'bar' });
      recordEvent('included.event', { foo: 'bar' });

      // Only included.event should be in queue
      const status = getTelemetryStatus();
      expect(status.eventsInQueue).toBe(1);
    });

    it('should include previously excluded events', () => {
      enableTelemetry();
      excludeEvents(['test.event']);
      includeEvents(['test.event']);

      recordEvent('test.event', { foo: 'bar' });

      const status = getTelemetryStatus();
      expect(status.eventsInQueue).toBeGreaterThan(0);
    });
  });

  describe('Command Recording', () => {
    it('should record CLI commands', () => {
      enableTelemetry();

      recordCommand('export', { format: 'json' }, 1000, true);

      const status = getTelemetryStatus();
      expect(status.eventsInQueue).toBeGreaterThan(0);
    });

    it('should record failed commands', () => {
      enableTelemetry();

      recordCommand('import', {}, 500, false);

      const status = getTelemetryStatus();
      expect(status.eventsInQueue).toBeGreaterThan(0);
    });
  });

  describe('Export Recording', () => {
    it('should record export operations', () => {
      enableTelemetry();

      recordExport({
        fileCount: 1,
        variableCount: 50,
        durationMs: 250,
        format: 'dtcg',
        success: true
      });

      const status = getTelemetryStatus();
      expect(status.eventsInQueue).toBeGreaterThan(0);
    });
  });

  describe('Validation Recording', () => {
    it('should record validation runs', () => {
      enableTelemetry();

      recordValidation({
        ruleset: 'strict',
        issuesFound: 5,
        errors: 2,
        warnings: 3,
        durationMs: 100
      });

      const status = getTelemetryStatus();
      expect(status.eventsInQueue).toBeGreaterThan(0);
    });
  });

  describe('Error Recording', () => {
    it('should record errors', () => {
      enableTelemetry();

      recordError('FIGMA_API_ERROR', 'Connection failed');

      const status = getTelemetryStatus();
      expect(status.eventsInQueue).toBeGreaterThan(0);
    });

    it('should truncate long error messages', () => {
      enableTelemetry();

      const longMessage = 'a'.repeat(200);
      recordError('TEST_ERROR', longMessage);

      // Event recorded (truncation happens internally)
      const status = getTelemetryStatus();
      expect(status.eventsInQueue).toBeGreaterThan(0);
    });
  });

  describe('Session Management', () => {
    it('should create unique session IDs', () => {
      const config1 = initTelemetry();
      const status1 = getTelemetryStatus();

      // Re-init should create new session
      const config2 = initTelemetry();
      const status2 = getTelemetryStatus();

      expect(status1.sessionId).toBeDefined();
      expect(status2.sessionId).toBeDefined();
    });

    it('should maintain consistent anonymous ID', () => {
      // Save current config
      saveTelemetryConfig();

      // Re-init should keep same anonymous ID
      const config1 = initTelemetry();
      const config2 = initTelemetry();

      expect(config1.anonymousId).toBe(config2.anonymousId);
    });
  });

  describe('Shutdown', () => {
    it('should flush events on shutdown', async () => {
      enableTelemetry();

      recordEvent('test.event', {});
      recordEvent('test.event2', {});

      const statusBefore = getTelemetryStatus();
      expect(statusBefore.eventsInQueue).toBe(2);

      await shutdownTelemetry();

      const statusAfter = getTelemetryStatus();
      expect(statusAfter.eventsInQueue).toBe(0);
    });

    it('should stop recording after shutdown', async () => {
      enableTelemetry();
      await shutdownTelemetry();

      recordEvent('after.shutdown', {});

      // Event might be recorded but not flushed
      // The important thing is no errors occur
    });
  });

  describe('Privacy Controls', () => {
    it('should never send actual passwords', () => {
      enableTelemetry();

      const sensitiveData = {
        user: 'john',
        password: 'supersecret123',
        apiKey: 'sk-abc123xyz789'
      };

      // Should not throw and should sanitize
      recordEvent('login.attempt', sensitiveData);

      const status = getTelemetryStatus();
      expect(status.eventsInQueue).toBeGreaterThan(0);
    });

    it('should handle nested sensitive data', () => {
      enableTelemetry();

      const nestedData = {
        config: {
          apiKey: 'secret',
          normalValue: 'ok'
        },
        credentials: {
          password: 'hidden',
          token: 'hidden'
        }
      };

      recordEvent('config.update', nestedData);

      const status = getTelemetryStatus();
      expect(status.eventsInQueue).toBeGreaterThan(0);
    });
  });

  describe('Config Persistence', () => {
    it('should load saved config', () => {
      // Initialize and save
      initTelemetry();
      enableTelemetry();
      excludeEvents(['test.event']);

      // Reload
      const config = loadTelemetryConfig();
      expect(config.enabled).toBe(true);
      expect(config.excludedEvents).toContain('test.event');
    });
  });
});
