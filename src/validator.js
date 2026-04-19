import { loadRuleset } from './ruleset/index.js';

function emptySummary() {
  return { errors: 0, warnings: 0, infos: 0 };
}

function pushBySeverity(errors, warnings, infos, issue, severity) {
  const issueWithSeverity = { ...issue, severity: severity.toUpperCase() };
  if (severity === 'error') {
    errors.push(issueWithSeverity);
  } else if (severity === 'warn') {
    warnings.push(issueWithSeverity);
  } else {
    infos.push(issueWithSeverity);
  }
}

export async function validateUI({ code = "", rules = {}, rulesetName = 'default' } = {}) {
  const source = String(code);
  const errors = [];
  const warnings = [];
  const infos = [];

  const ruleset = await loadRuleset(rulesetName, rules.ruleset);

  if (ruleset.tokens.requireSemantic && !ruleset.tokens.allowRawValues) {
    const hexPattern = /#(?:[0-9a-fA-F]{3}){1,2}\b/;
    if (hexPattern.test(source)) {
      pushBySeverity(errors, warnings, infos, {
        id: "dsr.token.no-raw-values",
        type: "token_violation",
        message: "Raw color used instead of token"
      }, ruleset.tokens.severity);
    }
  }

  if (ruleset.spacing.enforceGrid) {
    const spacingPattern = /(margin|padding)\s*:\s*([0-9]+)px/gi;
    let spacingMatch;
    while ((spacingMatch = spacingPattern.exec(source)) !== null) {
      const value = Number(spacingMatch[2]);
      if (value % ruleset.spacing.gridSize !== 0) {
        pushBySeverity(errors, warnings, infos, {
          id: "dsr.spacing.grid-violation",
          type: "spacing_violation",
          message: `Expected ${ruleset.spacing.gridSize}pt grid`
        }, ruleset.spacing.severity);
        break;
      }
    }
  }

  const hasHero = /\bhero\b/i.test(source);
  const hasCta = /\bcta\b/i.test(source);
  if (hasHero && !hasCta) {
    pushBySeverity(errors, warnings, infos, {
      id: "dsr.pattern.hero-missing-cta",
      type: "pattern_violation",
      message: "CTA missing in detected Hero"
    }, ruleset.patterns.severity);
  }

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
    meta: {
      codeLength: source.length,
      ruleCount: rules && typeof rules === "object" ? Object.keys(rules).length : 0,
      ruleset: ruleset.name
    }
  };
}
