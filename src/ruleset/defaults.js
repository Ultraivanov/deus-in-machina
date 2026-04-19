/** @typedef {import('./contract.js').RulesetConfig} RulesetConfig */
/** @typedef {import('./contract.js').PartialRulesetConfig} PartialRulesetConfig */

/** @type {import('./contract.js').TokenRules} */
const DEFAULT_TOKEN_RULES = {
  requireSemantic: true,
  allowRawValues: false,
  severity: 'error'
};

/** @type {import('./contract.js').SpacingRules} */
const DEFAULT_SPACING_RULES = {
  enforceGrid: true,
  gridSize: 8,
  severity: 'warn'
};

/** @type {import('./contract.js').PatternRules} */
const DEFAULT_PATTERN_RULES = {
  minConfidence: 0.7,
  severity: 'warn'
};

/** @type {import('./contract.js').LayoutRules} */
const DEFAULT_LAYOUT_RULES = {
  maxDepth: 10,
  requiredTokens: [],
  severity: 'info'
};

/** @type {RulesetConfig} */
const DEFAULT_RULESET = {
  name: 'default',
  description: 'Default balanced ruleset',
  tokens: DEFAULT_TOKEN_RULES,
  spacing: DEFAULT_SPACING_RULES,
  patterns: DEFAULT_PATTERN_RULES,
  layout: DEFAULT_LAYOUT_RULES
};

/** @param {Partial<import('./contract.js').TokenRules>} [partial] */
function mergeTokenRules(partial) {
  return {
    ...DEFAULT_TOKEN_RULES,
    ...partial
  };
}

/** @param {Partial<import('./contract.js').SpacingRules>} [partial] */
function mergeSpacingRules(partial) {
  return {
    ...DEFAULT_SPACING_RULES,
    ...partial
  };
}

/** @param {Partial<import('./contract.js').PatternRules>} [partial] */
function mergePatternRules(partial) {
  return {
    ...DEFAULT_PATTERN_RULES,
    ...partial
  };
}

/** @param {Partial<import('./contract.js').LayoutRules>} [partial] */
function mergeLayoutRules(partial) {
  return {
    ...DEFAULT_LAYOUT_RULES,
    ...partial
  };
}

/** @param {PartialRulesetConfig} [partial] */
export function normalizeRuleset(partial = {}) {
  return {
    name: partial.name || DEFAULT_RULESET.name,
    description: partial.description || DEFAULT_RULESET.description,
    tokens: mergeTokenRules(partial.tokens),
    spacing: mergeSpacingRules(partial.spacing),
    patterns: mergePatternRules(partial.patterns),
    layout: mergeLayoutRules(partial.layout)
  };
}

export { DEFAULT_RULESET };
