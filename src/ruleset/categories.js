/**
 * DSR Rule Categories
 * Organizes rules by functional category for selective enforcement
 */

/**
 * @typedef {'tokens' | 'spacing' | 'patterns' | 'layout' | 'accessibility' | 'performance'} RuleCategory
 */

/**
 * @typedef {Object} RuleCategoryInfo
 * @property {string} name - Category display name
 * @property {string} description - Category description
 * @property {string[]} ruleTypes - Types of rules in this category
 */

/** @type {Record<RuleCategory, RuleCategoryInfo>} */
export const RULE_CATEGORIES = {
  tokens: {
    name: 'Design Tokens',
    description: 'Rules for design token usage and semantic naming',
    ruleTypes: ['token_semantic', 'token_naming', 'token_scope']
  },
  spacing: {
    name: 'Spacing',
    description: 'Rules for spacing, grids, and alignment',
    ruleTypes: ['spacing_grid', 'spacing_scale', 'spacing_consistency']
  },
  patterns: {
    name: 'UI Patterns',
    description: 'Rules for UI pattern detection and validation',
    ruleTypes: ['pattern_detection', 'pattern_completeness', 'pattern_consistency']
  },
  layout: {
    name: 'Layout',
    description: 'Rules for layout structure and hierarchy',
    ruleTypes: ['layout_depth', 'layout_structure', 'layout_constraints']
  },
  accessibility: {
    name: 'Accessibility',
    description: 'Rules for a11y compliance',
    ruleTypes: ['a11y_contrast', 'a11y_labels', 'a11y_focus']
  },
  performance: {
    name: 'Performance',
    description: 'Rules for performance optimization',
    ruleTypes: ['perf_image_size', 'perf_complexity', 'perf_nesting']
  }
};

/**
 * Get category info by key
 * @param {RuleCategory} category
 * @returns {RuleCategoryInfo | undefined}
 */
export function getCategoryInfo(category) {
  return RULE_CATEGORIES[category];
}

/**
 * List all available categories
 * @returns {RuleCategory[]}
 */
export function listCategories() {
  return Object.keys(RULE_CATEGORIES);
}

/**
 * Check if category exists
 * @param {string} category
 * @returns {boolean}
 */
export function isValidCategory(category) {
  return category in RULE_CATEGORIES;
}

/**
 * Map rule type to category
 * @param {string} ruleType
 * @returns {RuleCategory | null}
 */
export function getCategoryForRuleType(ruleType) {
  for (const [category, info] of Object.entries(RULE_CATEGORIES)) {
    if (info.ruleTypes.includes(ruleType)) {
      return /** @type {RuleCategory} */ (category);
    }
  }
  return null;
}

/**
 * Rule definition with category
 * @typedef {Object} CategorizedRule
 * @property {string} id - Rule ID
 * @property {string} name - Rule display name
 * @property {string} description - Rule description
 * @property {RuleCategory} category - Rule category
 * @property {string} type - Rule type within category
 * @property {Severity} severity - Default severity
 * @property {boolean} enabled - Whether rule is enabled by default
 */

/**
 * @typedef {'error' | 'warn' | 'info' | 'ignore'} Severity
 */

/**
 * Core rule definitions by category
 * @type {Record<string, CategorizedRule>}
 */
export const CORE_RULES = {
  // Token rules
  'token.semantic-required': {
    id: 'token.semantic-required',
    name: 'Require Semantic Tokens',
    description: 'Enforce use of semantic tokens over raw values',
    category: 'tokens',
    type: 'token_semantic',
    severity: 'error',
    enabled: true
  },
  'token.raw-values-allowed': {
    id: 'token.raw-values-allowed',
    name: 'Allow Raw Values',
    description: 'Optionally allow raw values in specific contexts',
    category: 'tokens',
    type: 'token_scope',
    severity: 'warn',
    enabled: true
  },

  // Spacing rules
  'spacing.grid-enforced': {
    id: 'spacing.grid-enforced',
    name: 'Enforce Grid System',
    description: 'Require spacing to follow defined grid',
    category: 'spacing',
    type: 'spacing_grid',
    severity: 'warn',
    enabled: true
  },
  'spacing.grid-size': {
    id: 'spacing.grid-size',
    name: 'Grid Size',
    description: 'Define the base grid size (e.g., 8pt)',
    category: 'spacing',
    type: 'spacing_grid',
    severity: 'warn',
    enabled: true
  },

  // Pattern rules
  'pattern.min-confidence': {
    id: 'pattern.min-confidence',
    name: 'Pattern Confidence Threshold',
    description: 'Minimum confidence for pattern detection',
    category: 'patterns',
    type: 'pattern_detection',
    severity: 'warn',
    enabled: true
  },
  'pattern.completeness': {
    id: 'pattern.completeness',
    name: 'Pattern Completeness',
    description: 'Validate detected patterns have required elements',
    category: 'patterns',
    type: 'pattern_completeness',
    severity: 'warn',
    enabled: true
  },

  // Layout rules
  'layout.max-depth': {
    id: 'layout.max-depth',
    name: 'Max Nesting Depth',
    description: 'Maximum allowed nesting depth',
    category: 'layout',
    type: 'layout_depth',
    severity: 'info',
    enabled: true
  },
  'layout.required-tokens': {
    id: 'layout.required-tokens',
    name: 'Required Tokens',
    description: 'Tokens that must be defined for layout',
    category: 'layout',
    type: 'layout_structure',
    severity: 'warn',
    enabled: true
  },

  // Accessibility rules
  'a11y.contrast': {
    id: 'a11y.contrast',
    name: 'Color Contrast',
    description: 'WCAG contrast ratio compliance',
    category: 'accessibility',
    type: 'a11y_contrast',
    severity: 'error',
    enabled: false // Disabled by default
  },
  'a11y.labels': {
    id: 'a11y.labels',
    name: 'Accessible Labels',
    description: 'Interactive elements must have accessible labels',
    category: 'accessibility',
    type: 'a11y_labels',
    severity: 'error',
    enabled: false
  },

  // Performance rules
  'perf.image-size': {
    id: 'perf.image-size',
    name: 'Image Size Limits',
    description: 'Maximum image dimensions and file size',
    category: 'performance',
    type: 'perf_image_size',
    severity: 'warn',
    enabled: false
  },
  'perf.complexity': {
    id: 'perf.complexity',
    name: 'Component Complexity',
    description: 'Limit component complexity score',
    category: 'performance',
    type: 'perf_complexity',
    severity: 'info',
    enabled: false
  }
};

/**
 * Get all rules in a category
 * @param {RuleCategory} category
 * @returns {CategorizedRule[]}
 */
export function getRulesByCategory(category) {
  return Object.values(CORE_RULES).filter(rule => rule.category === category);
}

/**
 * Get all enabled rules
 * @returns {CategorizedRule[]}
 */
export function getEnabledRules() {
  return Object.values(CORE_RULES).filter(rule => rule.enabled);
}

/**
 * Get rule by ID
 * @param {string} ruleId
 * @returns {CategorizedRule | undefined}
 */
export function getRule(ruleId) {
  return CORE_RULES[ruleId];
}

/**
 * List all rule IDs
 * @returns {string[]}
 */
export function listRuleIds() {
  return Object.keys(CORE_RULES);
}

export default {
  RULE_CATEGORIES,
  CORE_RULES,
  getCategoryInfo,
  listCategories,
  isValidCategory,
  getCategoryForRuleType,
  getRulesByCategory,
  getEnabledRules,
  getRule,
  listRuleIds
};
