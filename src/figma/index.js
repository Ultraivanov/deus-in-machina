/**
 * Figma Variables Sync Module
 * Bidirectional export/import between Figma and DTCG JSON
 */

export {
  exportVariablesToDTCG,
  exportFromFigmaAPI,
  normalizeColor,
  normalizeValue,
  normalizeType,
  groupVariablesByPath,
} from './exporter.js';

export {
  importTokensToFigma,
  importTokensToFigmaAPI,
  parseTokenValue,
  isAlias,
  extractAliasPath,
  parseColor,
  convertToFigmaValue,
  flattenTokens,
} from './importer.js';

// Re-export for convenience
export { default as exporter } from './exporter.js';
export { default as importer } from './importer.js';
