/**
 * DSR Error Handling Module
 * Standardized error codes, messages, and logging for all DSR components
 */

/**
 * @typedef {Object} ErrorPayload
 * @property {Object} error
 * @property {string} error.code - Error code (e.g., 'FIGMA_API_ERROR')
 * @property {string} error.message - Human-readable message
 * @property {boolean} error.retryable - Whether the operation can be retried
 * @property {boolean} [error.upgrade_required] - Whether upgrade is needed
 * @property {Object} [error.context] - Additional context
 */

/**
 * Error codes by module
 */
export const ErrorCodes = {
  // General errors
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  NOT_IMPLEMENTED: 'NOT_IMPLEMENTED',
  CONFIGURATION_ERROR: 'CONFIGURATION_ERROR',

  // Figma API errors
  FIGMA_API_ERROR: 'FIGMA_API_ERROR',
  FIGMA_AUTH_ERROR: 'FIGMA_AUTH_ERROR',
  FIGMA_RATE_LIMIT: 'FIGMA_RATE_LIMIT',
  FIGMA_NOT_FOUND: 'FIGMA_NOT_FOUND',
  FIGMA_TIMEOUT: 'FIGMA_TIMEOUT',

  // Variable sync errors
  VARIABLE_EXPORT_ERROR: 'VARIABLE_EXPORT_ERROR',
  VARIABLE_IMPORT_ERROR: 'VARIABLE_IMPORT_ERROR',
  INVALID_COLOR_FORMAT: 'INVALID_COLOR_FORMAT',
  INVALID_TOKEN_FORMAT: 'INVALID_TOKEN_FORMAT',
  ALIAS_RESOLUTION_ERROR: 'ALIAS_RESOLUTION_ERROR',

  // Validation errors
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  RULESET_LOAD_ERROR: 'RULESET_LOAD_ERROR',
  RULESET_INVALID: 'RULESET_INVALID',

  // Pipeline errors
  NORMALIZATION_ERROR: 'NORMALIZATION_ERROR',
  PATTERN_INFERENCE_ERROR: 'PATTERN_INFERENCE_ERROR',
  FIX_LOOP_ERROR: 'FIX_LOOP_ERROR',

  // File/IO errors
  FILE_NOT_FOUND: 'FILE_NOT_FOUND',
  FILE_READ_ERROR: 'FILE_READ_ERROR',
  FILE_WRITE_ERROR: 'FILE_WRITE_ERROR',
  JSON_PARSE_ERROR: 'JSON_PARSE_ERROR',
};

/**
 * Default error messages by code
 */
export const ErrorMessages = {
  [ErrorCodes.INTERNAL_ERROR]: 'An internal error occurred',
  [ErrorCodes.INVALID_INPUT]: 'Invalid input provided',
  [ErrorCodes.NOT_IMPLEMENTED]: 'Feature not yet implemented',
  [ErrorCodes.CONFIGURATION_ERROR]: 'Configuration error',

  [ErrorCodes.FIGMA_API_ERROR]: 'Figma API request failed',
  [ErrorCodes.FIGMA_AUTH_ERROR]: 'Figma authentication failed. Check your API token',
  [ErrorCodes.FIGMA_RATE_LIMIT]: 'Figma API rate limit exceeded. Please retry later',
  [ErrorCodes.FIGMA_NOT_FOUND]: 'Figma file or resource not found',
  [ErrorCodes.FIGMA_TIMEOUT]: 'Figma API request timed out',

  [ErrorCodes.VARIABLE_EXPORT_ERROR]: 'Failed to export variables',
  [ErrorCodes.VARIABLE_IMPORT_ERROR]: 'Failed to import variables',
  [ErrorCodes.INVALID_COLOR_FORMAT]: 'Invalid color format',
  [ErrorCodes.INVALID_TOKEN_FORMAT]: 'Invalid token format',
  [ErrorCodes.ALIAS_RESOLUTION_ERROR]: 'Failed to resolve variable alias',

  [ErrorCodes.VALIDATION_ERROR]: 'Validation failed',
  [ErrorCodes.RULESET_LOAD_ERROR]: 'Failed to load ruleset',
  [ErrorCodes.RULESET_INVALID]: 'Invalid ruleset configuration',

  [ErrorCodes.NORMALIZATION_ERROR]: 'Token normalization failed',
  [ErrorCodes.PATTERN_INFERENCE_ERROR]: 'Pattern inference failed',
  [ErrorCodes.FIX_LOOP_ERROR]: 'Fix loop execution failed',

  [ErrorCodes.FILE_NOT_FOUND]: 'File not found',
  [ErrorCodes.FILE_READ_ERROR]: 'Failed to read file',
  [ErrorCodes.FILE_WRITE_ERROR]: 'Failed to write file',
  [ErrorCodes.JSON_PARSE_ERROR]: 'Failed to parse JSON',
};

/**
 * Determine if an error code is retryable
 * @param {string} code
 * @returns {boolean}
 */
export function isRetryable(code) {
  const retryableCodes = [
    ErrorCodes.FIGMA_API_ERROR,
    ErrorCodes.FIGMA_RATE_LIMIT,
    ErrorCodes.FIGMA_TIMEOUT,
    ErrorCodes.INTERNAL_ERROR,
  ];
  return retryableCodes.includes(code);
}

/**
 * Create a standardized error payload
 * @param {string} code - Error code from ErrorCodes
 * @param {string} [message] - Custom message (defaults to ErrorMessages[code])
 * @param {Object} [context] - Additional context
 * @param {boolean} [upgradeRequired] - Whether upgrade is needed
 * @returns {ErrorPayload}
 */
export function makeError(code, message, context = null, upgradeRequired = false) {
  return {
    error: {
      code,
      message: message || ErrorMessages[code] || 'Unknown error',
      retryable: isRetryable(code),
      upgrade_required: upgradeRequired,
      context,
    },
  };
}

/**
 * Ensure a value conforms to ErrorPayload shape
 * @param {unknown} value
 * @returns {ErrorPayload}
 */
export function ensureErrorShape(value) {
  if (value && typeof value === 'object' && 'error' in value) {
    const error = value.error;
    if (error && typeof error.code === 'string') {
      return value;
    }
  }

  // Convert Error instances
  if (value instanceof Error) {
    return makeError(
      ErrorCodes.INTERNAL_ERROR,
      value.message,
      { stack: value.stack, name: value.name }
    );
  }

  return makeError(ErrorCodes.INTERNAL_ERROR, 'Unexpected error shape', { value });
}

/**
 * Sampling helper for error logging
 * @param {number} rate
 * @returns {boolean}
 */
function shouldSample(rate) {
  if (rate >= 1) return true;
  if (rate <= 0) return false;
  return Math.random() <= rate;
}

/**
 * Log error with structured output
 * @param {unknown} err - Error to log
 * @param {Record<string, unknown>} context - Context data
 * @param {Object} [options] - Options
 * @param {number} [options.sampleRate=1] - Sampling rate (0-1)
 * @param {Function} [options.sink] - Custom log sink
 */
export function logError(err, context = {}, options = {}) {
  const rate = options.sampleRate ?? 1;
  if (!shouldSample(rate)) return;

  const sink = options.sink || ((payload) => {
    console.error(JSON.stringify(payload, null, 2));
  });

  const errorPayload = err instanceof Error
    ? { name: err.name, message: err.message, stack: err.stack }
    : { message: String(err) };

  sink({
    type: 'error',
    timestamp: new Date().toISOString(),
    error: errorPayload,
    context,
  });
}

/**
 * Wrap async function with error handling
 * @param {Function} fn - Async function to wrap
 * @param {string} code - Error code to use on failure
 * @param {string} [contextMessage] - Context for error message
 * @returns {Function} Wrapped function
 */
export function withErrorHandling(fn, code, contextMessage = '') {
  return async function(...args) {
    try {
      return await fn.apply(this, args);
    } catch (err) {
      const message = contextMessage
        ? `${contextMessage}: ${err.message}`
        : err.message;
      logError(err, { args, code });
      throw makeError(code, message, { originalError: err.message });
    }
  };
}

/**
 * Retry wrapper with exponential backoff
 * @param {Function} fn - Async function to retry
 * @param {Object} [options] - Retry options
 * @param {number} [options.maxRetries=3] - Maximum retry attempts
 * @param {number} [options.baseDelay=1000] - Base delay in ms
 * @param {number} [options.maxDelay=30000] - Maximum delay in ms
 * @returns {Function} Wrapped function with retry logic
 */
export function withRetry(fn, options = {}) {
  const { maxRetries = 3, baseDelay = 1000, maxDelay = 30000 } = options;

  return async function(...args) {
    let lastError;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn.apply(this, args);
      } catch (err) {
        lastError = err;

        // Don't retry if not retryable
        const errorPayload = ensureErrorShape(err);
        if (!errorPayload.error.retryable) {
          throw err;
        }

        // Don't retry on last attempt
        if (attempt === maxRetries) {
          break;
        }

        // Calculate delay with exponential backoff and jitter
        const delay = Math.min(
          baseDelay * Math.pow(2, attempt) + Math.random() * 1000,
          maxDelay
        );

        logError(err, {
          attempt: attempt + 1,
          maxRetries,
          delay,
          args,
        });

        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError;
  };
}

/**
 * Validate input against schema
 * @param {any} input - Input to validate
 * @param {Function} validator - Validation function (returns true/false or throws)
 * @param {string} [context] - Context for error message
 * @returns {boolean} True if valid
 * @throws {ErrorPayload} If validation fails
 */
export function validateInput(input, validator, context = '') {
  try {
    const result = validator(input);
    if (result === false) {
      throw makeError(
        ErrorCodes.INVALID_INPUT,
        context ? `Invalid input: ${context}` : 'Invalid input'
      );
    }
    return true;
  } catch (err) {
    if (err.error?.code) throw err; // Already formatted
    throw makeError(
      ErrorCodes.INVALID_INPUT,
      context ? `Invalid input (${context}): ${err.message}` : `Invalid input: ${err.message}`,
      { originalError: err.message }
    );
  }
}

export default {
  ErrorCodes,
  ErrorMessages,
  isRetryable,
  makeError,
  ensureErrorShape,
  logError,
  withErrorHandling,
  withRetry,
  validateInput,
};
