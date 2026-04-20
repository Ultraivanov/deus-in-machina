/**
 * Figma Variables Exporter
 * Converts Figma variables to DTCG-compliant JSON format
 * Supports: colors, numbers, strings, booleans, aliases, multi-mode
 */

/**
 * @typedef {Object} ExportConfig
 * @property {string} colorMode - "hex" | "rgba-css" | "rgba-object" | "hsla-css" | "hsla-object"
 * @property {boolean} useDTCGKeys - Use $value, $type, $description (true) or value, type, description (false)
 * @property {boolean} includeFigmaMetaData - Include figma metadata in $extensions
 * @property {boolean} includeScopes - Include variable scopes
 * @property {boolean} omitCollectionNames - Flatten structure without collection names
 * @property {boolean} splitByCollection - Return separate files per collection
 */

/**
 * @typedef {Object} DTCGToken
 * @property {string} $type - Token type
 * @property {any} $value - Token value
 * @property {string} [$description] - Optional description
 * @property {Object} [$extensions] - Extensions with mode values and metadata
 */

/**
 * Get key names based on DTCG format preference
 * @param {boolean} useDTCGKeys
 * @returns {{type: string, value: string, description: string}}
 */
function getTokenKeys(useDTCGKeys) {
  return {
    type: useDTCGKeys ? '$type' : 'type',
    value: useDTCGKeys ? '$value' : 'value',
    description: useDTCGKeys ? '$description' : 'description',
  };
}

/**
 * Normalize Figma color to various formats
 * @param {{r: number, g: number, b: number, a?: number}} color - Figma RGBA (0-1)
 * @param {string} colorMode - Output format
 * @returns {string|Object} Normalized color
 */
export function normalizeColor(color, colorMode = 'hex') {
  const { r, g, b, a = 1 } = color;

  switch (colorMode) {
    case 'hex': {
      const toHex = (value) => {
        const hex = Math.round(value * 255).toString(16).padStart(2, '0');
        return hex;
      };
      const hex = `${toHex(r)}${toHex(g)}${toHex(b)}`;
      return a < 1 ? `#${hex}${toHex(a)}` : `#${hex}`;
    }

    case 'rgba-css': {
      const rgba = [r, g, b].map((n) => Math.round(n * 255));
      return a < 1 ? `rgba(${rgba.join(', ')}, ${a})` : `rgb(${rgba.join(', ')})`;
    }

    case 'rgba-object':
      return {
        r: Math.round(r * 255),
        g: Math.round(g * 255),
        b: Math.round(b * 255),
        a,
      };

    case 'hsla-css':
    case 'hsla-object': {
      // Convert RGB to HSL
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const l = (max + min) / 2;
      let h, s;

      if (max === min) {
        h = s = 0;
      } else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
          case r: h = (g - b) / d + (g < b ? 6 : 0); break;
          case g: h = (b - r) / d + 2; break;
          case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
      }

      const hDeg = Math.round(h * 360);
      const sPct = Math.round(s * 100);
      const lPct = Math.round(l * 100);

      if (colorMode === 'hsla-object') {
        return { h: hDeg, s: sPct, l: lPct, a };
      }
      return a < 1
        ? `hsla(${hDeg}, ${sPct}%, ${lPct}%, ${a})`
        : `hsl(${hDeg}, ${sPct}%, ${lPct}%)`;
    }

    default:
      throw new Error(`Unsupported color mode: ${colorMode}`);
  }
}

/**
 * Parse Figma variable value
 * @param {any} value - Figma variable value
 * @param {string} resolvedType - Variable type (COLOR, FLOAT, STRING, BOOLEAN)
 * @param {ExportConfig} config
 * @param {Map<string, Variable>} [variableMap] - For resolving aliases
 * @returns {any} Normalized value
 */
export function normalizeValue(value, resolvedType, config, variableMap = null) {
  // Handle aliases (VARIABLE_ALIAS)
  if (value && typeof value === 'object' && value.type === 'VARIABLE_ALIAS') {
    if (!variableMap) {
      throw new Error('Variable map required for alias resolution');
    }
    const referencedVar = variableMap.get(value.id);
    if (!referencedVar) {
      throw new Error(`Referenced variable not found: ${value.id}`);
    }
    // Return alias in DTCG format: {path.to.token}
    const aliasPath = referencedVar.name.replace(/\//g, '.');
    return `{${aliasPath}}`;
  }

  switch (resolvedType) {
    case 'COLOR':
      return normalizeColor(value, config.colorMode);

    case 'FLOAT':
    case 'NUMBER':
      return typeof value === 'number' ? value : parseFloat(value);

    case 'STRING':
      return String(value);

    case 'BOOLEAN':
      return Boolean(value);

    default:
      return value;
  }
}

/**
 * Normalize Figma type to DTCG type
 * @param {string} resolvedType - Figma type
 * @returns {string} DTCG type
 */
export function normalizeType(resolvedType) {
  const typeMap = {
    'COLOR': 'color',
    'FLOAT': 'number',
    'NUMBER': 'number',
    'STRING': 'string',
    'BOOLEAN': 'boolean',
  };
  return typeMap[resolvedType] || resolvedType.toLowerCase();
}

/**
 * Group flat variable names into hierarchical structure
 * @param {Object} flatVariables - Flat object with "group/subgroup/name" keys
 * @returns {Object} Nested object structure
 */
export function groupVariablesByPath(flatVariables) {
  const result = {};

  for (const [fullName, token] of Object.entries(flatVariables)) {
    const parts = fullName.split('/');
    let current = result;

    // Navigate/create nested structure
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (!current[part]) {
        current[part] = {};
      }
      current = current[part];
    }

    // Set token at final level
    const tokenName = parts[parts.length - 1];
    current[tokenName] = token;
  }

  return result;
}

/**
 * Export Figma variables to DTCG JSON format
 * @param {Variable[]} variables - Figma variables
 * @param {VariableCollection[]} collections - Variable collections
 * @param {ExportConfig} config - Export configuration
 * @returns {Object|Object[]} DTCG tokens (single object or split by collection)
 */
export async function exportVariablesToDTCG(variables, collections, config = {}) {
  const {
    colorMode = 'hex',
    useDTCGKeys = true,
    includeFigmaMetaData = false,
    includeScopes = false,
    omitCollectionNames = false,
    splitByCollection = false,
  } = config;

  const keys = getTokenKeys(useDTCGKeys);

  // Build variable map for alias resolution
  const variableMap = new Map();
  for (const variable of variables) {
    variableMap.set(variable.id, variable);
  }

  // Initialize collections structure
  let collectionsData = {};
  for (const collection of collections) {
    collectionsData[collection.name] = {
      variables: {},
      defaultModeId: collection.defaultModeId,
      modes: collection.modes,
    };
  }

  // Process each variable
  for (const variable of variables) {
    const collectionId = variable.variableCollectionId;
    const collection = collections.find((c) => c.id === collectionId);
    if (!collection) {
      console.warn(`Collection not found for variable: ${variable.name}`);
      continue;
    }

    const collectionName = collection.name;
    const defaultModeId = collection.defaultModeId;

    // Get values for each mode
    const modes = variable.valuesByMode;
    const modeValues = {};

    for (const [modeId, modeValue] of Object.entries(modes)) {
      const modeName = collection.modes.find((m) => m.modeId === modeId)?.name;
      if (modeName) {
        modeValues[modeName] = normalizeValue(modeValue, variable.resolvedType, config, variableMap);
      }
    }

    // Default value from default mode
    const defaultValue = modeValues[collection.modes.find((m) => m.modeId === defaultModeId)?.name] ||
      Object.values(modeValues)[0];

    // Build token object
    const token = {
      [keys.type]: normalizeType(variable.resolvedType),
      [keys.value]: defaultValue,
    };

    // Add description if present
    if (variable.description) {
      token[keys.description] = variable.description;
    }

    // Add scopes if requested
    if (includeScopes && variable.scopes) {
      token.scopes = variable.scopes;
    }

    // Add extensions with mode values and metadata
    const filteredModes = Object.keys(modeValues).length > 1 ? modeValues : {};

    token.$extensions = {
      mode: filteredModes,
      ...(includeFigmaMetaData && {
        figma: {
          variableId: variable.id,
          collectionId: collection.id,
          codeSyntax: variable.codeSyntax,
        },
      }),
    };

    // Store in collection
    if (omitCollectionNames) {
      collectionsData[collectionName].variables[variable.name] = token;
    } else {
      collectionsData[collectionName].variables[variable.name] = token;
    }
  }

  // Build final output
  if (splitByCollection) {
    const result = {};
    for (const [collectionName, data] of Object.entries(collectionsData)) {
      const grouped = groupVariablesByPath(data.variables);
      result[collectionName] = grouped;
    }
    return result;
  }

  // Merge all collections or flatten
  let mergedVariables = {};
  for (const [collectionName, data] of Object.entries(collectionsData)) {
    if (omitCollectionNames) {
      // Flatten without collection wrapper
      Object.assign(mergedVariables, data.variables);
    } else {
      mergedVariables[collectionName] = data.variables;
    }
  }

  // Group by path if not omitting collection names
  if (omitCollectionNames) {
    return groupVariablesByPath(mergedVariables);
  }

  // Group within each collection
  const result = {};
  for (const [collectionName, variables] of Object.entries(mergedVariables)) {
    result[collectionName] = groupVariablesByPath(variables);
  }

  return result;
}

/**
 * Export from Figma file via REST API
 * @param {string} fileKey - Figma file key
 * @param {string} apiKey - Figma API key
 * @param {ExportConfig} config - Export configuration
 * @returns {Promise<Object>} DTCG tokens
 */
export async function exportFromFigmaAPI(fileKey, apiKey, config = {}) {
  // Fetch file data from Figma API
  const response = await fetch(`https://api.figma.com/v1/files/${fileKey}/variables`, {
    headers: {
      'X-Figma-Token': apiKey,
    },
  });

  if (!response.ok) {
    throw new Error(`Figma API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();

  // Transform to DTCG format
  return exportVariablesToDTCG(
    data.meta?.variables || [],
    data.meta?.variableCollections || [],
    config
  );
}

export default {
  exportVariablesToDTCG,
  exportFromFigmaAPI,
  normalizeColor,
  normalizeValue,
  normalizeType,
  groupVariablesByPath,
};
