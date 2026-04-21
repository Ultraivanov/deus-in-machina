/**
 * Figma Variables Importer
 * Creates/updates Figma variables from DTCG-compliant JSON
 * Supports: colors, numbers, strings, booleans, aliases, multi-mode
 */

import { ErrorCodes, makeError, logError } from '../errors.js';

/**
 * @typedef {Object} ImportConfig
 * @property {string} mode - "create" | "update" | "sync"
 * @property {boolean} dryRun - Preview changes without applying
 * @property {boolean} skipAliases - Skip alias references (resolve later)
 */

/**
 * @typedef {Object} ImportResult
 * @property {boolean} success
 * @property {string} message
 * @property {number} collectionsCreated
 * @property {number} variablesCreated
 * @property {number} variablesUpdated
 * @property {string[]} errors
 */

/**
 * Parse DTCG or standard token format
 * @param {Object} token
 * @returns {{value: any, type: string, description: string}|null}
 */
export function parseTokenValue(token) {
  // Validate input
  if (!token || typeof token !== 'object') {
    throw makeError(
      ErrorCodes.INVALID_TOKEN_FORMAT,
      'Invalid token: expected object',
      { received: typeof token }
    );
  }

  // DTCG format ($value, $type, $description)
  if (token.$value !== undefined) {
    return {
      value: token.$value,
      type: token.$type,
      description: token.$description || '',
      extensions: token.$extensions,
    };
  }

  // Standard format (value, type, description)
  if (token.value !== undefined) {
    return {
      value: token.value,
      type: token.type,
      description: token.description || '',
      extensions: token.extensions,
    };
  }

  return null;
}

/**
 * Check if a string is an alias reference
 * @param {any} value
 * @returns {boolean}
 */
export function isAlias(value) {
  return typeof value === 'string' && 
    value.startsWith('{') && 
    value.endsWith('}') && 
    value.length > 2;
}

/**
 * Extract alias path from {path.to.token}
 * @param {string} alias
 * @returns {string}
 */
export function extractAliasPath(alias) {
  return alias.slice(1, -1).replace(/\./g, '/');
}

/**
 * Parse color from various formats
 * @param {string|Object} color
 * @returns {{r: number, g: number, b: number, a: number}|null}
 */
export function parseColor(color) {
  if (typeof color === 'object') {
    // rgba-object or hsla-object format
    if ('r' in color && 'g' in color && 'b' in color) {
      return {
        r: color.r / 255,
        g: color.g / 255,
        b: color.b / 255,
        a: color.a !== undefined ? color.a : 1,
      };
    }
    if ('h' in color && 's' in color && 'l' in color) {
      // HSL to RGB conversion
      const { h, s, l, a = 1 } = color;
      const sPct = s / 100;
      const lPct = l / 100;

      const hue2rgb = (p, q, t) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
      };

      if (sPct === 0) {
        return { r: lPct, g: lPct, b: lPct, a };
      }

      const q = lPct < 0.5 ? lPct * (1 + sPct) : lPct + sPct - lPct * sPct;
      const p = 2 * lPct - q;
      const hNorm = h / 360;

      return {
        r: hue2rgb(p, q, hNorm + 1 / 3),
        g: hue2rgb(p, q, hNorm),
        b: hue2rgb(p, q, hNorm - 1 / 3),
        a,
      };
    }
    return null;
  }

  if (typeof color === 'string') {
    color = color.trim();

    // Hex format
    const hexToRgb = (hex) => {
      // Remove # if present
      hex = hex.replace(/^#/, '');

      let r, g, b, a = 1;

      // Expand 3-char to 6-char (RGB -> RRGGBB)
      if (hex.length === 3) {
        hex = hex.split('').map(c => c + c).join('');
      }
      // Expand 4-char to 8-char (RGBA -> RRGGBBAA)
      else if (hex.length === 4) {
        hex = hex.split('').map(c => c + c).join('');
      }

      if (hex.length === 6) {
        r = parseInt(hex.substring(0, 2), 16) / 255;
        g = parseInt(hex.substring(2, 4), 16) / 255;
        b = parseInt(hex.substring(4, 6), 16) / 255;
      } else if (hex.length === 8) {
        r = parseInt(hex.substring(0, 2), 16) / 255;
        g = parseInt(hex.substring(2, 4), 16) / 255;
        b = parseInt(hex.substring(4, 6), 16) / 255;
        a = Math.round((parseInt(hex.substring(6, 8), 16) / 255) * 10000) / 10000;
      } else {
        throw makeError(
          ErrorCodes.INVALID_COLOR_FORMAT,
          `Invalid hex color format: ${hex}`,
          { expectedFormats: ['#RRGGBB', '#RRGGBBAA', '#RGB', '#RGBA'] }
        );
      }

      return { r, g, b, a };
    };

    const hexRegex = /^#([A-Fa-f0-9]{3,8})$/;
    if (hexRegex.test(color)) {
      return hexToRgb(color);
    }

    // RGB format
    const rgbRegex = /^rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/;
    const rgbaRegex = /^rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([\d.]+)\s*\)$/;

    if (rgbaRegex.test(color)) {
      const [, r, g, b, a] = color.match(rgbaRegex);
      return {
        r: parseInt(r) / 255,
        g: parseInt(g) / 255,
        b: parseInt(b) / 255,
        a: parseFloat(a),
      };
    }

    if (rgbRegex.test(color)) {
      const [, r, g, b] = color.match(rgbRegex);
      return {
        r: parseInt(r) / 255,
        g: parseInt(g) / 255,
        b: parseInt(b) / 255,
        a: 1,
      };
    }

    // HSL format
    const hslRegex = /^hsl\(\s*(\d+)\s*,\s*(\d+)%\s*,\s*(\d+)%\s*\)$/;
    const hslaRegex = /^hsla\(\s*(\d+)\s*,\s*(\d+)%\s*,\s*(\d+)%\s*,\s*([\d.]+)\s*\)$/;

    if (hslaRegex.test(color)) {
      const [, h, s, l, a] = color.match(hslaRegex);
      return parseColor({
        h: parseInt(h),
        s: parseInt(s),
        l: parseInt(l),
        a: parseFloat(a),
      });
    }

    if (hslRegex.test(color)) {
      const [, h, s, l] = color.match(hslRegex);
      return parseColor({
        h: parseInt(h),
        s: parseInt(s),
        l: parseInt(l),
      });
    }
  }

  return null;
}

/**
 * Convert token value to Figma variable value
 * @param {any} value
 * @param {string} type
 * @param {Map<string, Variable>} variableMap - For alias resolution
 * @returns {any} Figma-compatible value
 */
export function convertToFigmaValue(value, type, variableMap = null) {
  // Handle aliases
  if (isAlias(value)) {
    if (!variableMap) {
      // Defer alias resolution if no variable map provided
      return { __alias: extractAliasPath(value), __deferred: true };
    }
    const aliasPath = extractAliasPath(value);
    const referencedVar = variableMap.get(aliasPath);
    if (referencedVar) {
      return {
        type: 'VARIABLE_ALIAS',
        id: referencedVar.id,
      };
    }
    // Defer alias resolution - return placeholder
    return { __alias: aliasPath, __deferred: true };
  }

  switch (type) {
    case 'color': {
      const parsed = parseColor(value);
      if (!parsed) {
        throw makeError(
          ErrorCodes.INVALID_COLOR_FORMAT,
          `Invalid hex color format: ${value}`,
          { expectedFormats: ['#RRGGBB', '#RRGGBBAA'] }
        );
      }
      return parsed;
    }

    case 'number':
      return typeof value === 'number' ? value : parseFloat(value);

    case 'string':
      return String(value);

    case 'boolean':
      return Boolean(value);

    default:
      return value;
  }
}

/**
 * Flatten nested token structure to flat "path/to/name" keys
 * @param {Object} tokens - Nested token object
 * @param {string} [prefix] - Current path prefix
 * @returns {Array<{path: string, name: string, token: Object}>}
 */
export function flattenTokens(tokens, prefix = '') {
  const results = [];

  for (const [key, value] of Object.entries(tokens)) {
    // Skip meta fields
    if (key.startsWith('$')) continue;

    const currentPath = prefix ? `${prefix}/${key}` : key;

    // Check if this is a token (has value/type)
    const parsed = parseTokenValue(value);
    if (parsed) {
      results.push({
        path: currentPath,
        name: currentPath,
        token: value,
        parsed,
      });
    } else if (typeof value === 'object' && value !== null) {
      // Recurse into nested structure
      results.push(...flattenTokens(value, currentPath));
    }
  }

  return results;
}

/**
 * Import DTCG tokens to Figma variables (Plugin API version)
 * @param {Object} tokens - DTCG tokens
 * @param {string} collectionName - Collection name to create/update
 * @param {ImportConfig} config - Import configuration
 * @returns {Promise<ImportResult>}
 */
export async function importTokensToFigma(tokens, collectionName, config = {}) {
  const {
    mode = 'create',
    dryRun = false,
  } = config;

  const result = {
    success: true,
    message: '',
    collectionsCreated: 0,
    variablesCreated: 0,
    variablesUpdated: 0,
    errors: [],
  };

  // Check if we're in Figma plugin context
  if (typeof figma === 'undefined') {
    throw new Error('Figma API not available. Use importTokensToFigmaAPI for REST API.');
  }

  try {
    // Flatten tokens
    const flatTokens = flattenTokens(tokens);

    // Check for existing collection
    const existingCollections = await figma.variables.getLocalVariableCollectionsAsync();
    let collection = existingCollections.find((c) => c.name === collectionName);

    if (!collection) {
      if (dryRun) {
        result.message = `Would create collection: ${collectionName}`;
        result.collectionsCreated = 1;
      } else {
        collection = figma.variables.createVariableCollection(collectionName);
        result.collectionsCreated = 1;
      }
    }

    const modeId = collection?.modes[0]?.modeId;
    if (!modeId && !dryRun) {
      logError(
        makeError(
          ErrorCodes.VARIABLE_EXPORT_ERROR,
          `ModeId ${modeId} not found in collection ${collection.id}`
        ),
        { modeId, collectionId: collection.id }
      );
      return [];
    }

    // Build variable map for alias resolution
    const variableMap = new Map();
    const existingVariables = await figma.variables.getLocalVariablesAsync();
    for (const variable of existingVariables) {
      variableMap.set(variable.name, variable);
    }

    // Process tokens (first pass - create all variables)
    const deferredAliases = [];

    for (const { path, parsed } of flatTokens) {
      try {
        const { value, type, description, extensions } = parsed;

        // Check for existing variable
        let variable = variableMap.get(path);

        // Check if value is alias
        let figmaValue;
        let isDeferred = false;

        if (isAlias(value)) {
          const aliasPath = extractAliasPath(value);
          const referencedVar = variableMap.get(aliasPath);

          if (referencedVar) {
            figmaValue = {
              type: 'VARIABLE_ALIAS',
              id: referencedVar.id,
            };
          } else {
            // Defer this alias
            deferredAliases.push({ path, aliasPath, type });
            isDeferred = true;
          }
        } else {
          figmaValue = convertToFigmaValue(value, type);
        }

        if (isDeferred) continue;

        if (dryRun) {
          if (variable) {
            result.variablesUpdated++;
          } else {
            result.variablesCreated++;
            // Mock entry for alias resolution
            variableMap.set(path, { id: `mock-${path}`, name: path });
          }
          continue;
        }

        // Create or update variable
        if (!variable) {
          const figmaType = type === 'number' ? 'FLOAT' : type.toUpperCase();
          variable = figma.variables.createVariable(path, collection.id, figmaType);
          variableMap.set(path, variable);
          result.variablesCreated++;
        } else {
          result.variablesUpdated++;
        }

        // Set value for default mode
        if (modeId) {
          variable.setValueForMode(modeId, figmaValue);
        }

        // Set description
        if (description) {
          variable.description = description;
        }

        // Handle multi-mode values from extensions
        if (extensions?.mode) {
          for (const [modeName, modeValue] of Object.entries(extensions.mode)) {
            const targetModeId = collection.modes.find((m) => m.name === modeName)?.modeId;
            if (targetModeId && targetModeId !== modeId) {
              const modeFigmaValue = convertToFigmaValue(modeValue, type, variableMap);
              variable.setValueForMode(targetModeId, modeFigmaValue);
            }
          }
        }
      } catch (error) {
        result.errors.push(`Error processing ${path}: ${error.message}`);
      }
    }

    // Second pass - resolve deferred aliases
    for (const { path, aliasPath, type } of deferredAliases) {
      try {
        const referencedVar = variableMap.get(aliasPath);
        if (!referencedVar) {
          result.errors.push(`Could not resolve alias ${aliasPath} for ${path}`);
          continue;
        }

        if (!dryRun) {
          let variable = variableMap.get(path);
          if (!variable) {
            const figmaType = type === 'number' ? 'FLOAT' : type.toUpperCase();
            variable = figma.variables.createVariable(path, collection.id, figmaType);
            variableMap.set(path, variable);
            result.variablesCreated++;
          }

          variable.setValueForMode(modeId, {
            type: 'VARIABLE_ALIAS',
            id: referencedVar.id,
          });
        }
      } catch (error) {
        result.errors.push(`Error resolving alias for ${path}: ${error.message}`);
      }
    }

    result.success = result.errors.length === 0;
    result.message = `Import complete: ${result.collectionsCreated} collections, ${result.variablesCreated} created, ${result.variablesUpdated} updated, ${result.errors.length} errors`;

  } catch (error) {
    result.success = false;
    result.message = `Import failed: ${error.message}`;
    result.errors.push(error.message);
  }

  return result;
}

/**
 * Import DTCG tokens via Figma REST API
 * @param {string} fileKey - Figma file key
 * @param {string} apiKey - Figma API key
 * @param {Object} tokens - DTCG tokens
 * @param {string} collectionName - Collection name
 * @param {ImportConfig} config - Import configuration
 * @returns {Promise<ImportResult>}
 */
export async function importTokensToFigmaAPI(fileKey, apiKey, tokens, collectionName, config = {}) {
  // REST API has limited variable support - mainly for reading
  // Writing variables requires Plugin API or newer REST endpoints
  throw makeError(
    ErrorCodes.NOT_IMPLEMENTED,
    'Figma REST API does not support creating variables. Use the Figma Plugin API or import manually via plugin.',
    { suggestion: 'Use importTokensToFigma() in a Figma plugin context' }
  );
}

export default {
  importTokensToFigma,
  importTokensToFigmaAPI,
  parseTokenValue,
  isAlias,
  extractAliasPath,
  parseColor,
  convertToFigmaValue,
  flattenTokens,
};
