function emptySummary() {
  return { errors: 0, warnings: 0, infos: 0 };
}

export function validateUI({ code = "", rules = {} } = {}) {
  const source = String(code);
  const errors = [];
  const warnings = [];
  const infos = [];

  const hexPattern = /#(?:[0-9a-fA-F]{3}){1,2}\b/;
  if (hexPattern.test(source)) {
    errors.push({
      id: "dsr.token.no-raw-values",
      type: "token_violation",
      severity: "ERROR",
      message: "Raw color used instead of token"
    });
  }

  const spacingPattern = /(margin|padding)\s*:\s*([0-9]+)px/gi;
  let spacingMatch;
  while ((spacingMatch = spacingPattern.exec(source)) !== null) {
    const value = Number(spacingMatch[2]);
    if (value % 8 !== 0) {
      errors.push({
        id: "dsr.spacing.grid-8pt",
        type: "spacing_violation",
        severity: "ERROR",
        message: "Expected 8pt grid"
      });
      break;
    }
  }

  const hasHero = /\bhero\b/i.test(source);
  const hasCta = /\bcta\b/i.test(source);
  if (hasHero && !hasCta) {
    warnings.push({
      id: "dsr.pattern.hero-missing-cta",
      type: "pattern_violation",
      severity: "WARNING",
      message: "CTA missing in detected Hero"
    });
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
      ruleCount: rules && typeof rules === "object" ? Object.keys(rules).length : 0
    }
  };
}
