/**
 * @typedef {'error' | 'warn' | 'info'} Severity
 */

/**
 * @typedef {Object} TokenRules
 * @property {boolean} requireSemantic
 * @property {boolean} allowRawValues
 * @property {Severity} severity
 */

/**
 * @typedef {Object} SpacingRules
 * @property {boolean} enforceGrid
 * @property {number} gridSize
 * @property {Severity} severity
 */

/**
 * @typedef {Object} PatternRules
 * @property {number} minConfidence
 * @property {Severity} severity
 */

/**
 * @typedef {Object} LayoutRules
 * @property {number} maxDepth
 * @property {string[]} requiredTokens
 * @property {Severity} severity
 */

/**
 * @typedef {Object} RulesetConfig
 * @property {string} name
 * @property {string} description
 * @property {TokenRules} tokens
 * @property {SpacingRules} spacing
 * @property {PatternRules} patterns
 * @property {LayoutRules} layout
 */

/**
 * @typedef {Object} PartialRulesetConfig
 * @property {string} [name]
 * @property {string} [description]
 * @property {Partial<TokenRules>} [tokens]
 * @property {Partial<SpacingRules>} [spacing]
 * @property {Partial<PatternRules>} [patterns]
 * @property {Partial<LayoutRules>} [layout]
 */

/** @type {string} */
export const DEFAULT_RULESET_NAME = 'default';
