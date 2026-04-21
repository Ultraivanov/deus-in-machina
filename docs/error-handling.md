# DSR Error Handling Guide

> Comprehensive guide to error codes, recovery procedures, and troubleshooting in DSR.

---

## Overview

DSR uses a standardized error handling system with:
- **Structured error payloads** — JSON format with code, message, context
- **Error codes** — Machine-readable identifiers for programmatic handling
- **Retry logic** — Automatic retry for transient failures
- **Graceful degradation** — Partial failures don't crash the pipeline

---

## Error Payload Structure

```json
{
  "error": {
    "code": "FIGMA_API_ERROR",
    "message": "Human-readable description",
    "retryable": true,
    "upgrade_required": false,
    "context": {
      "fileKey": "abc123",
      "status": 500
    }
  }
}
```

### Fields

| Field | Type | Description |
|-------|------|-------------|
| `code` | string | Machine-readable error code |
| `message` | string | Human-readable description |
| `retryable` | boolean | Whether the operation can be retried |
| `upgrade_required` | boolean | Whether upgrade is needed |
| `context` | object | Additional context for debugging |

---

## Error Codes Reference

### General Errors

| Code | Message | Retryable | Recovery |
|------|---------|-----------|----------|
| `INTERNAL_ERROR` | An internal error occurred | Yes | Check logs, report issue |
| `INVALID_INPUT` | Invalid input provided | No | Fix input parameters |
| `NOT_IMPLEMENTED` | Feature not yet implemented | No | Use alternative approach |
| `CONFIGURATION_ERROR` | Configuration error | No | Check config file |

### Figma API Errors

| Code | Message | HTTP Status | Recovery |
|------|---------|-------------|----------|
| `FIGMA_API_ERROR` | Figma API request failed | 500+ | Retry (automatic) |
| `FIGMA_AUTH_ERROR` | Figma authentication failed | 401, 403 | Check `FIGMA_API_KEY` env var |
| `FIGMA_RATE_LIMIT` | Rate limit exceeded | 429 | Wait and retry |
| `FIGMA_NOT_FOUND` | File or resource not found | 404 | Check file key |
| `FIGMA_TIMEOUT` | Request timed out | — | Retry with longer timeout |

### Variable Sync Errors

| Code | Message | Recovery |
|------|---------|----------|
| `VARIABLE_EXPORT_ERROR` | Failed to export variables | Check Figma file, retry |
| `VARIABLE_IMPORT_ERROR` | Failed to import variables | Use Figma Plugin API |
| `INVALID_COLOR_FORMAT` | Invalid color format | Use supported format: hex, rgba, hsla |
| `INVALID_TOKEN_FORMAT` | Invalid token format | Check DTCG format |
| `ALIAS_RESOLUTION_ERROR` | Failed to resolve alias | Check referenced token exists |

### File/IO Errors

| Code | Message | Recovery |
|------|---------|----------|
| `FILE_NOT_FOUND` | File not found | Check file path |
| `FILE_READ_ERROR` | Failed to read file | Check permissions |
| `FILE_WRITE_ERROR` | Failed to write file | Check permissions, disk space |
| `JSON_PARSE_ERROR` | Failed to parse JSON | Validate JSON syntax |

---

## Recovery Procedures

### Figma Authentication Errors

**Symptom:** `FIGMA_AUTH_ERROR` with 401 or 403 status

**Recovery Steps:**
1. Verify `FIGMA_API_KEY` environment variable is set
2. Check the token hasn't expired in Figma settings
3. Ensure the token has access to the file (file permissions)
4. For 403 errors, verify you're a collaborator on the file

```bash
# Verify API key is set
echo $FIGMA_API_KEY

# Test with direct API call
curl -H "X-Figma-Token: $FIGMA_API_KEY" \
  https://api.figma.com/v1/files/YOUR_FILE_KEY
```

### Rate Limiting

**Symptom:** `FIGMA_RATE_LIMIT` with 429 status

**Recovery Steps:**
1. Wait for rate limit window to reset (typically 1 minute)
2. DSR automatically retries with exponential backoff
3. For heavy usage, consider batching requests

### Variable Export Failures

**Symptom:** `VARIABLE_EXPORT_ERROR`

**Recovery Steps:**
1. Verify file key is correct
2. Check file exists and is accessible
3. Ensure file has variables (check in Figma)
4. Try with simpler config (fewer options)
5. Check Figma API status: https://status.figma.com

### Color Format Errors

**Symptom:** `INVALID_COLOR_FORMAT`

**Recovery Steps:**
1. Use supported color formats:
   - Hex: `#RRGGBB`, `#RRGGBBAA`, `#RGB`, `#RGBA`
   - RGB: `rgb(255, 0, 0)`, `rgba(255, 0, 0, 0.5)`
   - HSL: `hsl(120, 100%, 50%)`, `hsla(120, 100%, 50%, 0.5)`
   - Objects: `{r: 255, g: 0, b: 0, a: 1}`
2. Check for typos in color values
3. Validate alpha values are in range [0, 1]

### File I/O Errors

**Symptom:** `FILE_READ_ERROR` or `FILE_WRITE_ERROR`

**Recovery Steps:**
1. Verify file path is correct (absolute or relative)
2. Check file/directory permissions
3. Ensure parent directory exists for writes
4. Check disk space for writes
5. Validate JSON syntax for parse errors

```bash
# Check file exists
ls -la path/to/file.json

# Check permissions
ls -ld $(dirname path/to/file.json)

# Validate JSON
node -e "JSON.parse(require('fs').readFileSync('file.json'))"
```

---

## Retry Behavior

### Automatic Retry

DSR automatically retries these error codes:
- `FIGMA_API_ERROR` — Server errors (5xx)
- `FIGMA_RATE_LIMIT` — Rate limiting (429)
- `FIGMA_TIMEOUT` — Timeouts
- `INTERNAL_ERROR` — Transient internal errors

**Retry Configuration:**
- Max retries: 3
- Base delay: 1 second
- Exponential backoff: `delay * 2^attempt`
- Max delay: 30 seconds
- Jitter: Random 0-1s added to prevent thundering herd

### Manual Retry

For non-retryable errors, fix the underlying issue and retry:

```bash
# Example: Fix auth and retry
export FIGMA_API_KEY=your_token_here
dsr export-variables --file ABC123 --out tokens.json
```

---

## Debugging Tips

### Enable Debug Logging

Set log level to debug for verbose output:

```bash
dsr export-variables --file ABC123 --log debug
```

### Check Error Context

Error context provides debugging information:

```json
{
  "error": {
    "code": "FIGMA_NOT_FOUND",
    "message": "Figma file not found: ABC123",
    "context": {
      "fileKey": "ABC123",
      "status": 404,
      "statusText": "Not Found"
    }
  }
}
```

### Common Issues

#### "Cannot find module"
```
Error: Cannot find module '../errors.js'
```
**Fix:** Ensure you're running from project root or use `npm link`

#### "FIGMA_API_KEY not set"
```
Error: Missing FIGMA_API_KEY environment variable
```
**Fix:**
```bash
export FIGMA_API_KEY=your_token_here
# Or in .env file
```

#### "Invalid color format"
```
Error: Invalid hex color format: ffc0cb
```
**Fix:** Add `#` prefix: `#ffc0cb`

---

## Error Handling in Code

### Using withRetry

Wrap async functions with automatic retry:

```javascript
import { withRetry } from './errors.js';

const fetchWithRetry = withRetry(fetchData, {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 30000
});
```

### Using withErrorHandling

Add context to errors:

```javascript
import { withErrorHandling } from './errors.js';

const safeOperation = withErrorHandling(
  riskyOperation,
  'OPERATION_FAILED',
  'Context: processing user data'
);
```

### Creating Errors

```javascript
import { ErrorCodes, makeError } from './errors.js';

throw makeError(
  ErrorCodes.FIGMA_API_ERROR,
  'Custom message',
  { fileKey: 'ABC123' }
);
```

---

## Support

For persistent errors:
1. Check [Figma API Status](https://status.figma.com)
2. Review [DSR GitHub Issues](https://github.com/Ultraivanov/deus-in-machina/issues)
3. Include error payload and context in bug reports

---

_Last updated: 2026-04-21_
