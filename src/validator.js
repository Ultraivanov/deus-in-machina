import { loadRuleset } from './ruleset/index.js';

function emptySummary() {
  return { errors: 0, warnings: 0, infos: 0, ignored: 0 };
}

/**
 * Check if severity is 'ignore' (disabled)
 * @param {string} severity
 * @returns {boolean}
 */
function isIgnored(severity) {
  return severity === 'ignore' || severity === 'disabled';
}

/**
 * Add issue to appropriate list based on severity
 * @param {Array} errors
 * @param {Array} warnings
 * @param {Array} infos
 * @param {Object} issue
 * @param {string} severity
 * @param {string} [category] - Rule category
 */
function pushBySeverity(errors, warnings, infos, issue, severity, category) {
  // Skip if ignored
  if (isIgnored(severity)) {
    return;
  }

  const issueWithMeta = {
    ...issue,
    severity: severity.toUpperCase(),
    ...(category && { category })
  };

  if (severity === 'error') {
    errors.push(issueWithMeta);
  } else if (severity === 'warn') {
    warnings.push(issueWithMeta);
  } else {
    infos.push(issueWithMeta);
  }
}

export async function validateUI({ code = "", rules = {}, rulesetName = 'default' } = {}) {
  const source = String(code);
  const errors = [];
  const warnings = [];
  const infos = [];

  const ruleset = await loadRuleset(rulesetName, rules.ruleset);

  // Token rules (skip if ignored)
  if (!isIgnored(ruleset.tokens.severity)) {
    if (ruleset.tokens.requireSemantic && !ruleset.tokens.allowRawValues) {
      const hexPattern = /#(?:[0-9a-fA-F]{3}){1,2}\b/;
      if (hexPattern.test(source)) {
        pushBySeverity(errors, warnings, infos, {
          id: "dsr.token.no-raw-values",
          type: "token_violation",
          message: "Raw color used instead of token"
        }, ruleset.tokens.severity, 'tokens');
      }
    }
  }

  // Spacing rules (skip if ignored)
  if (!isIgnored(ruleset.spacing.severity) && ruleset.spacing.enforceGrid) {
    const spacingPattern = /(margin|padding)\s*:\s*([0-9]+)px/gi;
    let spacingMatch;
    while ((spacingMatch = spacingPattern.exec(source)) !== null) {
      const value = Number(spacingMatch[2]);
      if (value % ruleset.spacing.gridSize !== 0) {
        pushBySeverity(errors, warnings, infos, {
          id: "dsr.spacing.grid-violation",
          type: "spacing_violation",
          message: `Expected ${ruleset.spacing.gridSize}pt grid`
        }, ruleset.spacing.severity, 'spacing');
        break;
      }
    }
  }

  // Pattern rules (skip if ignored)
  if (!isIgnored(ruleset.patterns.severity)) {
    const hasHero = /\bhero\b/i.test(source);
    const hasCta = /\bcta\b/i.test(source);
    if (hasHero && !hasCta) {
      pushBySeverity(errors, warnings, infos, {
        id: "dsr.pattern.hero-missing-cta",
        type: "pattern_violation",
        message: "CTA missing in detected Hero"
      }, ruleset.patterns.severity, 'patterns');
    }
  }

  // Layout rules (skip if ignored)
  if (!isIgnored(ruleset.layout.severity)) {
    // Layout depth check
    const depthPattern = /\{[^}]*\{/g;
    const maxDepth = ruleset.layout.maxDepth || 10;
    let depth = 0;
    let match;
    while ((match = depthPattern.exec(source)) !== null) {
      depth++;
    }
    if (depth > maxDepth) {
      pushBySeverity(errors, warnings, infos, {
        id: "dsr.layout.depth-exceeded",
        type: "layout_violation",
        message: `Nesting depth ${depth} exceeds limit of ${maxDepth}`
      }, ruleset.layout.severity, 'layout');
    }
  }

  // Group issues by category
  const byCategory = {};
  [...errors, ...warnings, ...infos].forEach(issue => {
    const cat = issue.category || 'uncategorized';
    if (!byCategory[cat]) byCategory[cat] = [];
    byCategory[cat].push(issue);
  });

  const summary = {
    errors: errors.length,
    warnings: warnings.length,
    infos: infos.length
  };

  return {
    valid: summary.errors === 0,
    summary,
    errors,
    warnings,
    infos,
    byCategory,
    meta: {
      codeLength: source.length,
      ruleCount: rules && typeof rules === "object" ? Object.keys(rules).length : 0,
      ruleset: ruleset.name,
      severity: {
        tokens: ruleset.tokens.severity,
        spacing: ruleset.spacing.severity,
        patterns: ruleset.patterns.severity,
        layout: ruleset.layout.severity
      }
    }
  };
}
