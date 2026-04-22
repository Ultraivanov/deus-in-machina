/**
 * DSR Streaming Module
 * Large file handling with chunked processing and backpressure
 */

import { createReadStream, createWriteStream } from 'node:fs';
import { Transform, pipeline } from 'node:stream';
import { promisify } from 'node:util';
import { ErrorCodes, makeError } from './errors.js';
import { checkMemoryLimits } from './perf.js';

const pipelineAsync = promisify(pipeline);

/**
 * Chunk processor for large JSON files
 * @param {Object} options
 * @param {number} [options.chunkSize=1000] - Items per chunk
 * @param {number} [options.maxMemoryBytes=100*1024*1024] - 100MB default
 * @param {Function} options.processChunk - Process each chunk
 * @returns {Transform}
 */
export function createChunkProcessor(options) {
  const {
    chunkSize = 1000,
    maxMemoryBytes = 100 * 1024 * 1024,
    processChunk,
  } = options;

  let buffer = [];
  let processedCount = 0;

  return new Transform({
    objectMode: true,

    transform(item, encoding, callback) {
      try {
        // Check memory limits
        checkMemoryLimits(0, { maxHeapBytes: maxMemoryBytes }, 'chunk-processor');

        buffer.push(item);

        if (buffer.length >= chunkSize) {
          const chunk = buffer;
          buffer = [];

          Promise.resolve(processChunk(chunk, processedCount))
            .then(() => {
              processedCount += chunk.length;
              callback();
            })
            .catch(callback);
        } else {
          callback();
        }
      } catch (err) {
        callback(err);
      }
    },

    flush(callback) {
      if (buffer.length > 0) {
        Promise.resolve(processChunk(buffer, processedCount))
          .then(() => callback())
          .catch(callback);
      } else {
        callback();
      }
    },
  });
}

/**
 * Stream large tokens file for processing
 * @param {string} filePath
 * @param {Object} options
 * @returns {Promise<number>} - Count of processed items
 */
export async function streamProcessTokens(filePath, options) {
  const {
    onChunk,
    chunkSize = 1000,
    maxMemoryBytes = 100 * 1024 * 1024,
  } = options;

  const processor = createChunkProcessor({
    chunkSize,
    maxMemoryBytes,
    processChunk: onChunk,
  });

  let itemCount = 0;
  const parser = new Transform({
    objectMode: true,
    transform(chunk, encoding, callback) {
      try {
        const items = parseTokenChunk(chunk);
        items.forEach(item => {
          this.push(item);
          itemCount++;
        });
        callback();
      } catch (err) {
        callback(err);
      }
    },
  });

  await pipelineAsync(
    createReadStream(filePath, { encoding: 'utf8' }),
    parser,
    processor
  );

  return itemCount;
}

/**
 * Parse a chunk of token data
 * @param {Buffer|string} chunk
 * @returns {Array}
 */
function parseTokenChunk(chunk) {
  try {
    const data = JSON.parse(chunk);
    return Array.isArray(data) ? data : [data];
  } catch {
    // Return empty for invalid chunks
    return [];
  }
}

/**
 * Stream export large variable sets to file
 * @param {Array} variables
 * @param {string} outputPath
 * @param {Object} options
 */
export async function streamExportToFile(variables, outputPath, options = {}) {
  const { chunkSize = 1000 } = options;

  const outputStream = createWriteStream(outputPath);
  let firstChunk = true;

  outputStream.write('{\n');

  const processor = createChunkProcessor({
    chunkSize,
    processChunk: (chunk, offset) => {
      return new Promise((resolve, reject) => {
        const json = JSON.stringify(chunk, null, 2);
        const prefix = firstChunk ? '' : ',\n';
        firstChunk = false;

        outputStream.write(prefix + json.slice(1, -1), (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
    },
  });

  // Feed variables to processor
  for (const variable of variables) {
    processor.write(variable);
  }
  processor.end();

  await new Promise((resolve, reject) => {
    processor.on('finish', () => {
      outputStream.write('\n}\n', () => {
        outputStream.end(resolve);
      });
    });
    processor.on('error', reject);
  });
}

/**
 * Create throttled stream to control throughput
 * @param {number} itemsPerSecond
 * @returns {Transform}
 */
export function createThrottle(itemsPerSecond) {
  const interval = 1000 / itemsPerSecond;
  let lastTime = 0;

  return new Transform({
    objectMode: true,

    transform(item, encoding, callback) {
      const now = Date.now();
      const elapsed = now - lastTime;

      if (elapsed < interval) {
        setTimeout(() => {
          lastTime = Date.now();
          callback(null, item);
        }, interval - elapsed);
      } else {
        lastTime = now;
        callback(null, item);
      }
    },
  });
}

/**
 * Monitor stream progress
 * @param {Object} options
 * @param {Function} options.onProgress
 * @returns {Transform}
 */
export function createProgressMonitor(options) {
  const { onProgress, total } = options;
  let processed = 0;

  return new Transform({
    objectMode: true,

    transform(item, encoding, callback) {
      processed++;

      if (onProgress && processed % 100 === 0) {
        onProgress({
          processed,
          total,
          percent: total ? Math.round((processed / total) * 100) : null,
        });
      }

      callback(null, item);
    },
  });
}

export default {
  createChunkProcessor,
  streamProcessTokens,
  streamExportToFile,
  createThrottle,
  createProgressMonitor,
};
