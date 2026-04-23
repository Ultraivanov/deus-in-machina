/**
 * DSR Rule Pack Presets
 * Pre-configured rulesets for common use cases
 */

import { normalizeRuleset } from './defaults.js';

/** @typedef {import('./contract.js').RulesetConfig} RulesetConfig */

/**
 * Strict ruleset - Maximum enforcement for design system compliance
 * @type {RulesetConfig}
 */
export const STRICT_RULESET = normalizeRuleset({
  name: 'strict',
  description: 'Maximum enforcement for strict design system compliance',
  tokens: {
    requireSemantic: true,
    allowRawValues: false,
    severity: 'error'
  },
  spacing: {
    enforceGrid: true,
    gridSize: 8,
    severity: 'error'
  },
  patterns: {
    minConfidence: 0.8,
    severity: 'error'
  },
  layout: {
    maxDepth: 5,
    requiredTokens: ['color.background', 'color.text', 'spacing.base'],
    severity: 'error'
  }
});

/**
 * Relaxed ruleset - Balanced for rapid development
 * @type {RulesetConfig}
 */
export const RELAXED_RULESET = normalizeRuleset({
  name: 'relaxed',
  description: 'Balanced rules for rapid development with guidelines',
  tokens: {
    requireSemantic: false, // Don't require semantic tokens
    allowRawValues: true,
    severity: 'warn'
  },
  spacing: {
    enforceGrid: false, // Don't enforce grid strictly
    gridSize: 8,
    severity: 'warn'
  },
  patterns: {
    minConfidence: 0.6,
    severity: 'warn'
  },
  layout: {
    maxDepth: 15,
    requiredTokens: [],
    severity: 'warn'
  }
});

/**
 * Minimal ruleset - Only critical issues
 * @type {RulesetConfig}
 */
export const MINIMAL_RULESET = normalizeRuleset({
  name: 'minimal',
  description: 'Only critical rules for basic compliance',
  tokens: {
    requireSemantic: false, // Ignore token rules
    allowRawValues: true,
    severity: 'ignore'
  },
  spacing: {
    enforceGrid: false,
    gridSize: 8,
    severity: 'ignore'
  },
  patterns: {
    minConfidence: 0.9,
    severity: 'warn' // Only high-confidence patterns
  },
  layout: {
    maxDepth: 20,
    requiredTokens: [],
    severity: 'ignore'
  }
});

/**
 * Accessibility-focused ruleset
 * @type {RulesetConfig}
 */
export const A11Y_RULESET = normalizeRuleset({
  name: 'a11y',
  description: 'Accessibility-first validation',
  tokens: {
    requireSemantic: true,
    allowRawValues: false,
    severity: 'warn'
  },
  spacing: {
    enforceGrid: true,
    gridSize: 8,
    severity: 'warn'
  },
  patterns: {
    minConfidence: 0.7,
    severity: 'info'
  },
  layout: {
    maxDepth: 10,
    requiredTokens: [],
    severity: 'info'
  }
});

/**
 * Performance-focused ruleset
 * @type {RulesetConfig}
 */
export const PERF_RULESET = normalizeRuleset({
  name: 'performance',
  description: 'Performance optimization validation',
  tokens: {
    requireSemantic: true,
    allowRawValues: true,
    severity: 'info'
  },
  spacing: {
    enforceGrid: false,
    gridSize: 4,
    severity: 'info'
  },
  patterns: {
    minConfidence: 0.7,
    severity: 'warn' // Complex patterns may impact perf
  },
  layout: {
    maxDepth: 8, // Limit nesting for performance
    requiredTokens: [],
    severity: 'error'
  }
});

/**
 * All available presets
 * @type {Record<string, RulesetConfig>}
 */
export const PRESETS = {
  strict: STRICT_RULESET,
  relaxed: RELAXED_RULESET,
  minimal: MINIMAL_RULESET,
  a11y: A11Y_RULESET,
  performance: PERF_RULESET
};

/**
 * Get preset by name
 * @param {string} name
 * @returns {RulesetConfig | undefined}
 */
export function getPreset(name) {
  return PRESETS[name];
}

/**
 * List all available preset names
 * @returns {string[]}
 */
export function listPresets() {
  return Object.keys(PRESETS);
}

/**
 * Check if preset exists
 * @param {string} name
 * @returns {boolean}
 */
export function hasPreset(name) {
  return name in PRESETS;
}

/**
 * Get preset info without full config
 * @param {string} name
 * @returns {{name: string, description: string} | undefined}
 */
export function getPresetInfo(name) {
  const preset = PRESETS[name];
  if (!preset) return undefined;
  return {
    name: preset.name,
    description: preset.description
  };
}

/**
 * Create a custom ruleset based on a preset
 * @param {string} basePreset - Base preset name
 * @param {Partial<import('./contract.js').PartialRulesetConfig>} overrides - Overrides
 * @returns {RulesetConfig}
 */
export function extendPreset(basePreset, overrides = {}) {
  const base = getPreset(basePreset);
  if (!base) {
    throw new Error(`Unknown preset: ${basePreset}`);
  }

  return normalizeRuleset({
    name: overrides.name || `${base.name}-custom`,
    description: overrides.description || `Extended from ${base.name}`,
    tokens: { ...base.tokens, ...overrides.tokens },
    spacing: { ...base.spacing, ...overrides.spacing },
    patterns: { ...base.patterns, ...overrides.patterns },
    layout: { ...base.layout, ...overrides.layout }
  });
}

/**
 * Get severity summary for a preset
 * @param {RulesetConfig} ruleset
 * @returns {Record<import('./contract.js').Severity, number>}
 */
export function getSeveritySummary(ruleset) {
  const severities = {
    error: 0,
    warn: 0,
    info: 0,
    ignore: 0
  };

  severities[ruleset.tokens.severity]++;
  severities[ruleset.spacing.severity]++;
  severities[ruleset.patterns.severity]++;
  severities[ruleset.layout.severity]++;

  return severities;
}

export default {
  STRICT_RULESET,
  RELAXED_RULESET,
  MINIMAL_RULESET,
  A11Y_RULESET,
  PERF_RULESET,
  PRESETS,
  getPreset,
  listPresets,
  hasPreset,
  getPresetInfo,
  extendPreset,
  getSeveritySummary
};
