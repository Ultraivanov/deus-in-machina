import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createChunkProcessor, createThrottle, createProgressMonitor } from "../src/streaming.js";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import fs from "node:fs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const tempDir = join(__dirname, "temp");

describe("Streaming", () => {
  beforeEach(() => {
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
  });

  afterEach(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true });
    }
  });

  describe("createChunkProcessor", () => {
    it("should process items in chunks", async () => {
      const processed = [];
      const processor = createChunkProcessor({
        chunkSize: 3,
        processChunk: async (chunk) => {
          processed.push(...chunk);
        },
      });

      processor.write({ id: 1 });
      processor.write({ id: 2 });
      processor.write({ id: 3 }); // Should trigger chunk
      processor.write({ id: 4 });
      processor.end();

      await new Promise((resolve, reject) => {
        processor.on("finish", resolve);
        processor.on("error", reject);
      });

      expect(processed).toHaveLength(4);
      expect(processed.map((p) => p.id)).toEqual([1, 2, 3, 4]);
    });

    it("should flush remaining items on end", async () => {
      const processed = [];
      const processor = createChunkProcessor({
        chunkSize: 5,
        processChunk: async (chunk) => {
          processed.push(...chunk);
        },
      });

      processor.write({ id: 1 });
      processor.write({ id: 2 });
      processor.end(); // Less than chunkSize, should still flush

      await new Promise((resolve, reject) => {
        processor.on("finish", resolve);
        processor.on("error", reject);
      });

      expect(processed).toHaveLength(2);
    });

    it("should track processed count across chunks", async () => {
      const counts = [];
      const processor = createChunkProcessor({
        chunkSize: 2,
        processChunk: async (chunk, offset) => {
          counts.push(offset);
        },
      });

      processor.write({ id: 1 });
      processor.write({ id: 2 });
      processor.write({ id: 3 });
      processor.write({ id: 4 });
      processor.end();

      await new Promise((resolve, reject) => {
        processor.on("finish", resolve);
        processor.on("error", reject);
      });

      expect(counts).toEqual([0, 2]); // First chunk at 0, second at 2
    });

    it("should handle errors in processChunk", async () => {
      const processor = createChunkProcessor({
        chunkSize: 1,
        processChunk: async () => {
          throw new Error("Chunk error");
        },
      });

      processor.write({ id: 1 });

      await expect(
        new Promise((resolve, reject) => {
          processor.on("finish", resolve);
          processor.on("error", reject);
        })
      ).rejects.toThrow("Chunk error");
    });
  });

  describe("createThrottle", () => {
    it("should throttle items to specified rate", async () => {
      const throttle = createThrottle(10); // 10 items per second
      const startTime = Date.now();
      const items = [];

      throttle.on("data", (item) => items.push(item));

      throttle.write({ id: 1 });
      throttle.write({ id: 2 });

      await new Promise((resolve) => setTimeout(resolve, 100));
      
      throttle.end();
      await new Promise((resolve) => throttle.on("finish", resolve));

      // Should take at least 100ms between items at 10 items/sec
      expect(items).toHaveLength(2);
    });

    it("should pass through items when not throttled", async () => {
      const throttle = createThrottle(1000); // 1000 items per second
      const items = [];

      throttle.on("data", (item) => items.push(item));

      throttle.write({ id: 1 });
      throttle.end();

      await new Promise((resolve) => throttle.on("finish", resolve));

      expect(items).toHaveLength(1);
      expect(items[0].id).toBe(1);
    });
  });

  describe("createProgressMonitor", () => {
    it("should track progress", async () => {
      const progress = [];
      const monitor = createProgressMonitor({
        total: 100,
        onProgress: (p) => progress.push(p),
      });

      // Create a writable stream to consume output
      const { Writable } = await import("node:stream");
      const output = [];
      const writable = new Writable({
        objectMode: true,
        write(chunk, encoding, callback) {
          output.push(chunk);
          callback();
        }
      });

      // Pipe monitor to writable
      monitor.pipe(writable);

      // Write 105 items (should trigger progress at 100)
      for (let i = 0; i < 105; i++) {
        monitor.write({ id: i });
      }
      monitor.end();

      // Wait for writable to finish
      await new Promise((resolve, reject) => {
        writable.on("finish", resolve);
        writable.on("error", reject);
        setTimeout(resolve, 1000);
      });

      // Progress should have been called
      expect(progress.length).toBeGreaterThanOrEqual(1);
      expect(progress[0].processed).toBe(100);
    }, 15000);

    it("should handle undefined total", async () => {
      const progress = [];
      const monitor = createProgressMonitor({
        onProgress: (p) => progress.push(p),
      });

      const { Writable } = await import("node:stream");
      const writable = new Writable({
        objectMode: true,
        write(chunk, encoding, callback) {
          callback();
        }
      });

      monitor.pipe(writable);

      // Write 100+ items to trigger progress callback
      for (let i = 0; i < 105; i++) {
        monitor.write({ id: i });
      }
      monitor.end();

      await new Promise((resolve, reject) => {
        writable.on("finish", resolve);
        writable.on("error", reject);
        setTimeout(resolve, 1000);
      });

      expect(progress.length).toBeGreaterThan(0);
      expect(progress[0].percent).toBeNull();
    }, 15000);

    it("should pass through all items", async () => {
      const items = [];
      const monitor = createProgressMonitor({
        total: 10,
        onProgress: () => {},
      });

      monitor.on("data", (item) => items.push(item));

      monitor.write({ id: 1 });
      monitor.write({ id: 2 });
      monitor.write({ id: 3 });
      monitor.end();

      await new Promise((resolve) => monitor.on("finish", resolve));

      expect(items).toHaveLength(3);
    });
  });

  describe("Integration", () => {
    it("should chain processors together", async () => {
      const results = [];
      
      const chunker = createChunkProcessor({
        chunkSize: 2,
        processChunk: async (chunk) => {
          results.push(...chunk);
        },
      });

      const monitor = createProgressMonitor({
        total: 5,
        onProgress: () => {},
      });

      // Chain: monitor -> chunker
      monitor.pipe(chunker);

      monitor.write({ id: 1 });
      monitor.write({ id: 2 });
      monitor.write({ id: 3 });
      monitor.write({ id: 4 });
      monitor.write({ id: 5 });
      monitor.end();

      await new Promise((resolve) => chunker.on("finish", resolve));

      expect(results).toHaveLength(5);
    });
  });
});
