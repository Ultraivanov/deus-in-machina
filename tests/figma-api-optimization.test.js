/**
 * Figma API Optimization Tests
 * Tests for caching, deduplication, and batch requests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  fetchVariablesOptimized,
  batchFetchVariables,
  getCacheStats,
  clearAPICache,
  exportFromFigmaAPIOptimized,
} from '../src/figma/exporter.js';

describe('Figma API Optimization', () => {
  beforeEach(() => {
    clearAPICache();
    vi.restoreAllMocks();
  });

  describe('APICache', () => {
    it('should cache and retrieve data', async () => {
      // First call - hits API
      const mockFetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          meta: { variables: [], variableCollections: [] },
        }),
      });
      global.fetch = mockFetch;

      const result1 = await fetchVariablesOptimized('file123', 'token', {
        useCache: true,
        cacheTTL: 60000,
      });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(result1.__cached).toBeUndefined();

      // Second call - hits cache
      const result2 = await fetchVariablesOptimized('file123', 'token', {
        useCache: true,
        cacheTTL: 60000,
      });

      // Should not call fetch again
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(result2.__cached).toBe(true);
    });

    it('should respect cache TTL', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          meta: { variables: [], variableCollections: [] },
        }),
      });
      global.fetch = mockFetch;

      // First call with 10ms TTL
      await fetchVariablesOptimized('file123', 'token', {
        useCache: true,
        cacheTTL: 10,
      });

      expect(mockFetch).toHaveBeenCalledTimes(1);

      // Wait for TTL to expire
      await new Promise(r => setTimeout(r, 20));

      // Second call - cache should be expired, hits API again
      const result = await fetchVariablesOptimized('file123', 'token', {
        useCache: true,
        cacheTTL: 10,
      });

      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should allow cache bypass', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          meta: { variables: [], variableCollections: [] },
        }),
      });
      global.fetch = mockFetch;

      // First call
      await fetchVariablesOptimized('file123', 'token', { useCache: false });
      expect(mockFetch).toHaveBeenCalledTimes(1);

      // Second call with cache disabled
      await fetchVariablesOptimized('file123', 'token', { useCache: false });
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should provide cache stats', () => {
      const stats = getCacheStats();
      expect(stats).toHaveProperty('size');
      expect(stats).toHaveProperty('keys');
      expect(Array.isArray(stats.keys)).toBe(true);
    });

    it('should clear cache', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          meta: { variables: [], variableCollections: [] },
        }),
      });
      global.fetch = mockFetch;

      // Populate cache
      await fetchVariablesOptimized('file123', 'token', { useCache: true });
      expect(getCacheStats().size).toBe(1);

      // Clear cache
      clearAPICache();
      expect(getCacheStats().size).toBe(0);
    });
  });

  describe('Request Deduplication', () => {
    it('should dedupe concurrent requests', async () => {
      let callCount = 0;
      const mockFetch = vi.fn().mockImplementation(async () => {
        callCount++;
        // Simulate slow API call
        await new Promise(r => setTimeout(r, 50));
        return {
          ok: true,
          json: async () => ({
            meta: { variables: [], variableCollections: [] },
          }),
        };
      });
      global.fetch = mockFetch;

      // Start multiple concurrent requests
      const promises = [
        fetchVariablesOptimized('file123', 'token', { dedupe: true }),
        fetchVariablesOptimized('file123', 'token', { dedupe: true }),
        fetchVariablesOptimized('file123', 'token', { dedupe: true }),
      ];

      const results = await Promise.all(promises);

      // Only one actual API call should be made
      expect(callCount).toBe(1);
      expect(results).toHaveLength(3);
    });

    it('should allow disabling deduplication', async () => {
      let callCount = 0;
      const mockFetch = vi.fn().mockImplementation(async () => {
        callCount++;
        return {
          ok: true,
          json: async () => ({
            meta: { variables: [], variableCollections: [] },
          }),
        };
      });
      global.fetch = mockFetch;

      // Two requests without dedupe AND without cache
      await fetchVariablesOptimized('file123', 'token', { dedupe: false, useCache: false });
      await fetchVariablesOptimized('file123', 'token', { dedupe: false, useCache: false });

      expect(callCount).toBe(2);
    });
  });

  describe('Batch Fetching', () => {
    it('should fetch multiple files with concurrency limit', async () => {
      const fetchOrder = [];
      const mockFetch = vi.fn().mockImplementation(async () => {
        const file = `file${fetchOrder.length}`;
        fetchOrder.push(file);
        await new Promise(r => setTimeout(r, 10));
        return {
          ok: true,
          json: async () => ({
            meta: { variables: [], variableCollections: [] },
          }),
        };
      });
      global.fetch = mockFetch;

      const requests = [
        { fileKey: 'file1', apiKey: 'token1' },
        { fileKey: 'file2', apiKey: 'token2' },
        { fileKey: 'file3', apiKey: 'token3' },
      ];

      const results = await batchFetchVariables(requests, { concurrency: 2 });

      expect(results).toHaveLength(3);
      expect(results.every(r => r.success)).toBe(true);
    });

    it('should handle partial failures in batch', async () => {
      const mockFetch = vi.fn().mockImplementation(async (url) => {
        if (url.includes('file2')) {
          return {
            ok: false,
            status: 404,
            statusText: 'Not Found',
          };
        }
        return {
          ok: true,
          json: async () => ({
            meta: { variables: [], variableCollections: [] },
          }),
        };
      });
      global.fetch = mockFetch;

      const requests = [
        { fileKey: 'file1', apiKey: 'token' },
        { fileKey: 'file2', apiKey: 'token' },
        { fileKey: 'file3', apiKey: 'token' },
      ];

      const results = await batchFetchVariables(requests, { concurrency: 3 });

      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(false);
      expect(results[2].success).toBe(true);
    });
  });

  describe('Optimized Export', () => {
    it('should export with caching', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          meta: {
            variables: [{
              id: 'var-1',
              name: 'color/red',
              variableCollectionId: 'col-1',
              resolvedType: 'COLOR',
              valuesByMode: { 'mode-1': { r: 1, g: 0, b: 0 } },
            }],
            variableCollections: [{
              id: 'col-1',
              name: 'Colors',
              defaultModeId: 'mode-1',
              modes: [{ modeId: 'mode-1', name: 'Default' }],
            }],
          },
        }),
      });
      global.fetch = mockFetch;

      const result1 = await exportFromFigmaAPIOptimized(
        'file123',
        'token',
        { colorMode: 'hex', useDTCGKeys: true },
        { useCache: true }
      );

      expect(result1).toHaveProperty('Colors');
      expect(mockFetch).toHaveBeenCalledTimes(1);

      // Second call should use cache
      const result2 = await exportFromFigmaAPIOptimized(
        'file123',
        'token',
        { colorMode: 'hex', useDTCGKeys: true },
        { useCache: true }
      );

      expect(mockFetch).toHaveBeenCalledTimes(1); // No additional calls
      expect(result2).toEqual(result1);
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });
      global.fetch = mockFetch;

      await expect(
        fetchVariablesOptimized('file123', 'token', { useCache: false })
      ).rejects.toThrow('HTTP 500');
    });

    it('should handle network errors', async () => {
      const mockFetch = vi.fn().mockRejectedValue(new Error('Network error'));
      global.fetch = mockFetch;

      await expect(
        fetchVariablesOptimized('file123', 'token', { useCache: false })
      ).rejects.toThrow('Network error');
    });
  });
});
